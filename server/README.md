# Mahjong AI Analyzer - Python FastAPI Server

麻雀の盤面を解析し、各打牌の期待値（EV）を計算する解析サーバーです。

## アーキテクチャ

```
[Next.js App]
     │  POST /analyze (gameState JSON)
     ▼
[FastAPI Server :8000]
     │
     ├─ MORTAL_AVAILABLE=True  → Mortal モデル推論（最高精度・開発中）
     ├─ AKOCHAN_AVAILABLE=True → akochan 解析エンジン（準最強AI・mjai対応）
     ├─ mahjong ライブラリあり   → 牌効率解析エンジン（本格的）
     └─ フォールバック          → ヒューリスティック計算
```

## セットアップ手順

### 方法A: Dockerを使う（推奨）

```bash
# プロジェクトルートで実行
docker compose up -d

# 起動確認
curl http://localhost:8000/health
```

### 方法B: ローカル直接実行

```bash
cd server

# 仮想環境作成（推奨）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt

# サーバー起動
python main.py
```

## Next.js との接続

サーバー起動後、プロジェクトルートの `.env` を編集してください：

```env
# コメントアウトを外す
MORTAL_API_URL=http://localhost:8000
```

Next.js を再起動すると本物のAPIに切り替わります。

## Mortal統合（将来対応）

Mortalのモデルファイルが揃ったら以下の手順で統合できます：

1. モデルファイルを `server/models/` に配置
2. `server/main.py` の `MORTAL_AVAILABLE = False` を `True` に変更
3. `MortalEngine` クラスのコメントアウトを外す
4. `requirements.txt` の `torch` と `mortal` のコメントアウトを外す
5. `pip install -r requirements.txt` を再実行

### Mortal公式リポジトリ
- https://github.com/Equim-chan/Mortal
- 学習済みモデルはリリースページから取得

## APIエンドポイント

### `GET /health`
サーバーの状態と使用中のエンジンを確認します。

```json
{
  \"status\": \"ok\",
  \"akochan\": true,
  \"mortal\": false,
  \"mahjong_lib\": true,
  \"engine\": \"akochan\"
}
```

### `POST /analyze`
盤面を解析し、各打牌のEVを返します。

**レスポンス:**
```json
{
  \"engine\": \"akochan\",
  \"evData\": [
    { \"tile\": \"3p\", \"ev\": 8.5, \"reasoning\": \"テンパイ（有効牌12枚）\" },
    { \"tile\": \"9s\", \"ev\": 6.2, \"reasoning\": \"1シャンテン / 受け入れ8枚\" }
  ]
}
```
