from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import uvicorn
import os

import akochan_engine

# --- akochan統合ポイント ---
AKOCHAN_AVAILABLE = akochan_engine.is_available()

# --- Mortal統合ポイント ---
MORTAL_AVAILABLE = False


# --- 本格的な牌効率EV計算エンジン（mahjongライブラリ使用） ---
try:
    from mahjong.hand_calculating.hand import HandCalculator
    from mahjong.hand_calculating.hand_config import HandConfig, OptionalRules
    from mahjong.meld import Meld
    from mahjong.tile import TilesConverter
    MAHJONG_LIB_AVAILABLE = True
    calculator = HandCalculator()
    print(\"[Engine] mahjong library loaded successfully.\")
except ImportError:
    MAHJONG_LIB_AVAILABLE = False
    print(\"[Engine] mahjong library not found. Using heuristic fallback.\")


app = FastAPI(
    title=\"Mahjong AI Advisor - Analysis Server\",
    description=\"麻雀AI解析サーバー。akochan / Mortalとの統合に対応したFastAPIサーバーです。\",
    version=\"1.1.0\"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[\"http://localhost:3000\", \"http://127.0.0.1:3000\"],
    allow_credentials=True,
    allow_methods=[\"*\"],
    allow_headers=[\"*\"],
)


# --- リクエスト / レスポンス スキーマ ---

class DiscardCandidate(BaseModel):
    p: str            # 切る牌（例: \"3p\"）
    shanten: int      # シャンテン数
    ukeire: List[str] # 有効牌リスト
    ukeireCount: int  # 有効牌の枚数

class AnalyzeRequest(BaseModel):
    kyoku: str
    honba: int
    turn: int
    dora: List[str]
    shan: int                         # 残り枚数
    defen: List[int]                  # 各プレイヤーの点数
    tehai: List[str]                  # 手牌
    tsumo: Optional[str]              # ツモ牌
    menfeng: str                      # 自風 (東/南/西/北)
    zhuangfeng: str                   # 場風
    candidates: List[DiscardCandidate]
    kawa: Any                         # 捨て牌情報

class TileEV(BaseModel):
    tile: str
    ev: float
    reasoning: str     # なぜこのEVになるかの根拠

class AnalyzeResponse(BaseModel):
    engine: str        # 使用したエンジン名（\"akochan\" / \"mortal\" / \"tile-efficiency\" / \"heuristic\"）
    evData: List[TileEV]


# --- EV計算ロジック ---

def tile_to_mps(tile: str) -> str:
    \"\"\"内部表記（\"3p\", \"1z\"等）を人間可読形式に変換\"\"\"
    if len(tile) < 2:
        return tile
    suit, num = tile[0], tile[1]
    suit_label = {\"m\": \"萬\", \"p\": \"筒\", \"s\": \"索\"}
    honor_label = {\"1\": \"東\", \"2\": \"南\", \"3\": \"西\", \"4\": \"北\", \"5\": \"白\", \"6\": \"發\", \"7\": \"中\"}
    if suit in suit_label:
        return f\"{num}{suit_label[suit]}\"
    if suit == \"z\":
        return honor_label.get(num, tile)
    return tile

def shanten_to_ev_weight(shanten: int) -> float:
    \"\"\"シャンテン数をEVウェイトに変換\"\"\"
    weights = {-1: 12.0, 0: 9.0, 1: 6.0, 2: 3.5, 3: 2.0, 4: 1.2, 5: 0.8}
    return weights.get(shanten, 0.5)

def calculate_tile_danger(tile: str, enemy_discards: List[str]) -> float:
    \"\"\"捨て牌から安全度を推定（安全なほど高い値）\"\"\"
    suit = tile[0] if tile else \"?\"
    num = int(tile[1]) if len(tile) > 1 and tile[1].isdigit() else 0
    danger = 0.0

    # ヤオチュウ牌は比較的安全
    if num in (1, 9) or suit == \"z\":
        danger += 0.1

    # 字牌は複数捨てられていれば安全
    honor_count = sum(1 for t in enemy_discards if t and t[0] == \"z\" and t == tile)
    if honor_count >= 2:
        danger += 0.3

    return max(0.0, 1.0 - danger)

def calculate_ev_with_mahjong_lib(candidates: List[DiscardCandidate], gamestate: AnalyzeRequest) -> List[TileEV]:
    \"\"\"mahjongライブラリを使った本格的EV計算\"\"\"
    results = []
    all_enemy_discards = (
        list(gamestate.kawa.get(\"shimocha\", [])) +
        list(gamestate.kawa.get(\"toimen\", [])) +
        list(gamestate.kawa.get(\"kamicha\", []))
    ) if isinstance(gamestate.kawa, dict) else []

    for cand in candidates:
        # 基本EV: シャンテン数ベース
        base_ev = shanten_to_ev_weight(cand.shanten)

        # 受け入れ枚数ボーナス（最大8枚で正規化）
        ukeire_bonus = min(cand.ukeireCount / 8.0, 1.5) * 2.0

        # 残り巡目ペナルティ（終盤ほどシャンテンが遠いと厳しい）
        turns_left = gamestate.shan / 4.0  # 大雑把な残り巡目
        turns_penalty = 0.0
        if cand.shanten > 0 and turns_left < cand.shanten * 3:
            turns_penalty = -1.0 * (cand.shanten - turns_left / 3.0)

        # ドラ保持ボーナス（切る牌がドラなら若干ペナルティ）
        dora_penalty = -0.5 if cand.p in gamestate.dora else 0.0

        # 安全度ボーナス（捨てる牌の危険度）
        safety_bonus = calculate_tile_danger(cand.p, all_enemy_discards) * 0.3

        ev = base_ev + ukeire_bonus + turns_penalty + dora_penalty + safety_bonus
        ev = max(0.1, round(ev, 2))

        # 理由文の生成
        reasons = []
        if cand.shanten == 0:
            reasons.append(f\"テンパイ（有効牌 {cand.ukeireCount}枚）\")
        else:
            reasons.append(f\"{cand.shanten}シャンテン / 受け入れ{cand.ukeireCount}枚\")
        if cand.p in gamestate.dora:
            reasons.append(\"ドラを手放す（打点低下）\")
        if turns_penalty < -0.5:
            reasons.append(\"残り巡目に対してシャンテンが遠い\")
        if ukeire_bonus >= 2.5:
            reasons.append(\"受け入れ枚数が特に多い\")

        results.append(TileEV(
            tile=cand.p,
            ev=ev,
            reasoning=\" / \".join(reasons)
        ))

    results.sort(key=lambda x: x.ev, reverse=True)
    return results

def calculate_ev_heuristic(candidates: List[DiscardCandidate], gamestate: AnalyzeRequest) -> List[TileEV]:
    \"\"\"mahjongライブラリ未インストール時のヒューリスティックフォールバック\"\"\"
    results = []
    for cand in candidates:
        base = shanten_to_ev_weight(cand.shanten)
        ukeire_bonus = cand.ukeireCount * 0.15
        dora_pen = -0.5 if cand.p in gamestate.dora else 0.0
        ev = max(0.1, round(base + ukeire_bonus + dora_pen, 2))
        results.append(TileEV(
            tile=cand.p,
            ev=ev,
            reasoning=f\"{cand.shanten}シャンテン / 受け入れ{cand.ukeireCount}枚\" + (
                \" / ドラ放出（打点低下）\" if cand.p in gamestate.dora else \"\"
            )
        ))
    results.sort(key=lambda x: x.ev, reverse=True)
    return results


# --- APIエンドポイント ---

@app.get(\"/health\")
def health():
    current_engine = \"heuristic\"
    if MORTAL_AVAILABLE:
        current_engine = \"mortal\"
    elif AKOCHAN_AVAILABLE:
        current_engine = \"akochan\"
    elif MAHJONG_LIB_AVAILABLE:
        current_engine = \"tile-efficiency\"

    return {
        \"status\": \"ok\",
        \"akochan\": AKOCHAN_AVAILABLE,
        \"mortal\": MORTAL_AVAILABLE,
        \"mahjong_lib\": MAHJONG_LIB_AVAILABLE,
        \"engine\": current_engine
    }

@app.post(\"/analyze\", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest):
    if not req.candidates:
        raise HTTPException(status_code=400, detail=\"candidates is empty\")

    # --- エンジン選択 (優先順位: Mortal > akochan > tile-efficiency > heuristic) ---
    if MORTAL_AVAILABLE:
        # TODO: Mortal統合
        raise NotImplementedError(\"Mortal integration pending model files\")

    if AKOCHAN_AVAILABLE:
        # akochanエンジンで計算
        results = akochan_engine.evaluate_candidates(req.tehai, req.tsumo, req.candidates)
        ev_data = [TileEV(tile=r.tile, ev=r.ev, reasoning=r.reasoning) for r in results]
        return AnalyzeResponse(engine=\"akochan\", evData=ev_data)

    if MAHJONG_LIB_AVAILABLE:
        ev_data = calculate_tile_efficiency_ev(req.candidates, req)
        engine_name = \"tile-efficiency\"
    else:
        ev_data = calculate_ev_heuristic(req.candidates, req)
        engine_name = \"heuristic\"

    return AnalyzeResponse(engine=engine_name, evData=ev_data)

def calculate_tile_efficiency_ev(candidates, req):
    # 名前を合わせるためのラッパー
    return calculate_ev_with_mahjong_lib(candidates, req)


if __name__ == \"__main__\":
    port = int(os.getenv(\"PORT\", 8000))
    uvicorn.run(\"main:app\", host=\"0.0.0.0\", port=port, reload=True)
