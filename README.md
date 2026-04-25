# 麻雀AIアドバイザー

現代麻雀の「デジタル理論」に基づき、リアルタイムで打牌をサポートするAIコーチングアプリです。  
牌効率解析エンジン + Gemini AIが最適な一打とその理由を日本語で解説します。

## システム構成

```
[Next.js :3000]  ──→  [FastAPI 解析サーバー :8000]
       │                        │
       │              akochan (準最強AI) または 牌効率解析エンジン
       │              （将来: Mortalモデルに差し替え可能）
       │
       └──→  [Gemini API]  解析データを自然言語に翻訳
```

---

## 起動手順

### 1. 解析サーバーを起動する（毎回必要）

```bash
cd ~/projects/mahjong-ai-advisor
sudo docker-compose up -d
```

起動確認：
```bash
curl http://localhost:8000/health
# → {"status":"ok","akochan":true,"engine":"akochan"} が返ればOK
```

> **💡 ポイント:** PCを再起動した場合も `sudo docker-compose up -d` を再実行してください。

### 2. フロントエンドを起動する

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 停止手順

```bash
# 解析サーバーを停止
sudo docker-compose down

# フロントエンドは Ctrl+C
```

---

## 環境変数 (.env)

| 変数名 | 説明 |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio で取得したAPIキー |
| `MORTAL_API_URL` | 解析サーバーのURL（`http://localhost:8000`）。コメントアウトするとモックにフォールバック |

`.env.example` をコピーして作成してください：
```bash
cp .env.example .env
```

---

## 機能一覧

| タブ | 内容 |
|---|---|
| **対局** | AIアドバイス付きの麻雀対局。打牌ごとに牌効率EV・Gemini解説を表示 |
| **役一覧** | 翻数別の役一覧とデジタル理論的な解説 |
| **アドバイス** | 現代麻雀のデジタル理論を6カテゴリで解説 |
| **スジ・壁** | スジ・ノーチャンス・ワンチャンスを視覚的に学習 |

---

## 解析エンジンの状態

| `engine` の値 | 意味 |
|---|---|
| `akochan` | akochan AI (C++) による最高精度の解析（現在優先使用） |
| `tile-efficiency` | mahjong ライブラリによる本格的な牌効率計算 |
| `mock` | サーバー未起動時のヒューリスティックフォールバック |
| `mortal` | Mortalモデル統合後（将来対応） |

---

## Mortal統合（将来対応）

モデルファイルが揃ったら以下の手順で差し替えできます。  
詳細は [`server/README.md`](server/README.md) を参照してください。

---

## 技術スタック

- **Frontend:** Next.js 16 (App Router) / Tailwind CSS
- **麻雀エンジン:** `@kobalab/majiang-core`
- **解析サーバー:** Python FastAPI + mahjong ライブラリ
- **AI:** Google Gemini 2.5 Flash
