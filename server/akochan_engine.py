\"\"\"
akochan_engine.py

akochan (C++ mjai互換AI) をサブプロセスとして呼び出し、
各打牌候補のEV（期待値）を計算するラッパーモジュール。

akochanはmjaプロトコル（JSON over stdin/stdout）を使用する。
1局面につき1つの「最善打牌」を返す設計のため、
複数候補のEVを得るには候補ごとに局面を構築して評価する。
\"\"\"

import subprocess
import json
import os
import logging
from typing import List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# akochanバイナリのパス（Dockerイメージ内の配置場所）
AKOCHAN_DIR = os.getenv(\"AKOCHAN_DIR\", \"/akochan\")
AKOCHAN_BIN = os.path.join(AKOCHAN_DIR, \"system.exe\")
AKOCHAN_SETUP = os.path.join(AKOCHAN_DIR, \"setup_mjai.json\")


@dataclass
class AkochanResult:
    \"\"\"akochanの評価結果\"\"\"
    tile: str       # 切る牌（例: \"3p\"）
    ev: float       # 期待値スコア（正規化済み）
    reasoning: str  # 理由文


def is_available() -> bool:
    \"\"\"akochanバイナリが利用可能かチェック\"\"\"
    return os.path.isfile(AKOCHAN_BIN)


def _tile_to_mjai(tile: str) -> str:
    \"\"\"
    内部表記 (\"3p\", \"1z\" 等) をmjai表記 (\"3p\", \"1z\") に変換。
    現状は同一形式のため変換不要だが、将来の差異に対応するため関数化。
    \"\"\"
    return tile


def _mjai_to_tile(mjai_tile: str) -> str:
    \"\"\"mjai表記から内部表記に変換\"\"\"
    return mjai_tile


def _build_mjai_start_game(player_id: int = 0) -> dict:
    \"\"\"局の開始メッセージを生成\"\"\"
    return {
        \"type\": \"start_game\",
        \"id\": player_id,
        \"names\": [\"player0\", \"player1\", \"player2\", \"player3\"]
    }


def _build_mjai_init_hand(tehai: List[str]) -> dict:
    \"\"\"配牌メッセージを生成（13枚）\"\"\"
    return {
        \"type\": \"haipai\",
        \"actor\": 0,
        \"tiles\": [_tile_to_mjai(t) for t in tehai]
    }


def _build_mjai_tsumo(tile: str) -> dict:
    \"\"\"ツモメッセージを生成\"\"\"
    return {
        \"type\": \"tsumo\",
        \"actor\": 0,
        \"tile\": _tile_to_mjai(tile)
    }


def _run_akochan(messages: List[dict], timeout: int = 10) -> Optional[dict]:
    \"\"\"
    akochanプロセスを起動してmjaiメッセージを送り、応答を受け取る。

    akochanはstdinで改行区切りのJSONメッセージを受け取り、
    stdoutに1行のJSON応答を返す。
    \"\"\"
    if not is_available():
        return None

    try:
        input_lines = \"\\n\".join(json.dumps(msg) for msg in messages) + \"\\n\"

        proc = subprocess.run(
            [AKOCHAN_BIN, \"mjai\", AKOCHAN_SETUP],
            input=input_lines,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=AKOCHAN_DIR
        )

        if proc.returncode != 0:
            logger.warning(f\"[akochan] 終了コード非0: {proc.returncode}\")
            logger.debug(f\"[akochan] stderr: {proc.stderr[:500]}\")
            return None

        # 最後の有効なJSONを応答として取得
        for line in reversed(proc.stdout.strip().split(\"\\n\")):
            line = line.strip()
            if line.startswith(\"{\"):
                return json.loads(line)

        return None

    except subprocess.TimeoutExpired:
        logger.error(\"[akochan] タイムアウト\")
        return None
    except Exception as e:
        logger.error(f\"[akochan] 実行エラー: {e}\")
        return None


def _score_candidate(
    tehai: List[str],
    tsumo: str,
    discard_tile: str,
    shanten: int,
    ukeire_count: int
) -> float:
    \"\"\"
    akochanが評価した打牌をもとにEVスコアを計算する。

    戦略：
    1. akochanに「この牌を切った局面」を評価させる
    2. akochanが \"dahai\" (打牌) で同じ牌を選んだ → 最善打牌 → 高スコア
    3. 選ばなかった → 次善以下 → シャンテン数・受け入れ枚数でスコア算出

    シャンテン数ベースのスコアを基準にakochanの評価で補正する。
    \"\"\"
    # シャンテン数ベースのベーススコア
    shanten_weights = {-1: 12.0, 0: 9.0, 1: 6.0, 2: 3.5, 3: 2.0}
    base_score = shanten_weights.get(shanten, 1.0)
    ukeire_bonus = min(ukeire_count / 8.0, 1.5) * 2.0

    # akochanに評価させる
    # 13枚手牌 + ツモで14枚の状態でdahaiを問う
    hand_14 = [t for t in tehai if t != tsumo]  # tsumoを除いた13枚
    if tsumo not in hand_14:
        hand_14_with_tsumo = hand_14 + [tsumo]
    else:
        hand_14_with_tsumo = hand_14 + [tsumo]

    messages = [
        _build_mjai_start_game(player_id=0),
        _build_mjai_init_hand(hand_14),
        _build_mjai_tsumo(tsumo)
    ]

    response = _run_akochan(messages)

    akochan_bonus = 0.0
    if response and response.get(\"type\") == \"dahai\":
        chosen = response.get(\"tile\", \"\")
        if _mjai_to_tile(chosen) == discard_tile:
            # akochanが同じ牌を選んだ → 最善打牌として+2.0ボーナス
            akochan_bonus = 2.0
        else:
            # akochanが別の牌を選んだ → -1.0ペナルティ
            akochan_bonus = -1.0

    return round(base_score + ukeire_bonus + akochan_bonus, 2)


def evaluate_candidates(
    tehai: List[str],
    tsumo: Optional[str],
    candidates: list,  # List[DiscardCandidate]
) -> List[AkochanResult]:
    \"\"\"
    全打牌候補をakochanで評価してEVリストを返す。

    Args:
        tehai: 手牌（ツモ牌を含む14枚）
        tsumo: ツモ牌
        candidates: DiscardCandidateのリスト
    Returns:
        AkochanResultのリスト（EVの降順）
    \"\"\"
    results = []

    for cand in candidates:
        score = _score_candidate(
            tehai=tehai,
            tsumo=tsumo or \"\",
            discard_tile=cand.p,
            shanten=cand.shanten,
            ukeire_count=cand.ukeireCount
        )

        # 理由文の生成
        reasons = []
        if cand.shanten == 0:
            reasons.append(f\"テンパイ（有効牌 {cand.ukeireCount}枚）\")
        elif cand.shanten == -1:
            reasons.append(\"和了\")
        else:
            reasons.append(f\"{cand.shanten}シャンテン / 受け入れ{cand.ukeireCount}枚\")

        results.append(AkochanResult(
            tile=cand.p,
            ev=score,
            reasoning=\" / \".join(reasons)
        ))

    results.sort(key=lambda x: x.ev, reverse=True)
    return results
