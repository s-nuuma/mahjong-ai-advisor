# ── Stage 1: akochan ビルドステージ ──────────────────────────────────
# akochanはC++製のためソースからビルドする必要がある
FROM debian:bookworm-slim AS akochan-builder

RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    libboost-all-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# akochanのソースを取得
RUN git clone --depth 1 https://github.com/critter-mj/akochan.git .

# ai_src (libai.so) をビルド
WORKDIR /build/ai_src
RUN make -f Makefile_Linux

# 本体 (system.exe) をビルド
WORKDIR /build
RUN make -f Makefile_Linux

# ── Stage 2: FastAPI ランタイムステージ ───────────────────────────────
FROM python:3.11-slim

# akochanの実行に必要なboostライブラリのみインストール
RUN apt-get update && apt-get install -y \
    libboost-system1.81.0 \
    libboost-thread1.81.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ビルド済みakochanバイナリ・設定・パラメータをコピー
COPY --from=akochan-builder /build/system.exe /akochan/system.exe
COPY --from=akochan-builder /build/libai.so   /akochan/libai.so
COPY --from=akochan-builder /build/params/     /akochan/params/
COPY --from=akochan-builder /build/share/      /akochan/share/
COPY --from=akochan-builder /build/setup_mjai.json /akochan/setup_mjai.json

# FastAPI依存関係
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY main.py .
COPY akochan_engine.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
