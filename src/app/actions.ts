"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is set in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 外部エンジン（Mortal等）のAPIを呼び出すためのモック関数
// 本稼働時はここを実際のMortalサーバーへのfetch処理に差し替えます
async function fetchExternalAnalysis(gameState: any) {
  // TODO: Replace with actual Mortal API call
  // const res = await fetch("http://localhost:8000/analyze", { method: "POST", body: JSON.stringify(gameState) });
  // return await res.json();

  // ダミーの期待値(EV)計算
  // シャンテン数が少なく、有効牌が多いほど高いEVになるようシミュレート
  const evData = (gameState.candidates || []).map((c: any) => {
    const base = 8 - c.shanten;
    const ukeireBonus = c.ukeireCount * 0.1;
    let ev = (base * 1.5) + ukeireBonus;
    // 複雑なAIの揺らぎを模倣
    ev += (Math.random() * 0.5 - 0.25);
    return {
      tile: c.p,
      ev: Math.max(0, parseFloat(ev.toFixed(2)))
    };
  });

  evData.sort((a: any, b: any) => b.ev - a.ev);
  return evData;
}

export async function getMahjongAdvice(gameState: any) {
  // 外部エンジンによる期待値(EV)解析を取得
  const externalAnalysis = await fetchExternalAnalysis(gameState);
  
  const prompt = `
あなたは麻雀のトッププロであり、AIの解析結果を人間にわかりやすく翻訳する優秀なコーチです。
現在、外部の麻雀AIエンジン（Mortal等）が盤面を解析し、各打牌の期待値（EV）を算出しました。
この期待値データを元に、「なぜその牌を切るべきと評価されたのか」「どのような狙いがあるのか」を論理的に解説してください。

【現在の状況】
- 局: ${gameState.kyoku} ${gameState.honba}本場
- 場風: ${gameState.zhuangfeng} / 自風: ${gameState.menfeng}
- 点数状況: 自分 ${gameState.defen[0]}点 / 下家 ${gameState.defen[1]}点 / 対面 ${gameState.defen[2]}点 / 上家 ${gameState.defen[3]}点
- ドラ: ${gameState.dora.join(', ') || 'なし'}
- 巡目: ${gameState.turn}巡目
- 手牌: ${gameState.tehai.join(', ')}
- ツモ牌: ${gameState.tsumo || 'なし'}
- 自分の捨て牌: ${gameState.kawa.player.join(', ')}
- 対面の捨て牌: ${gameState.kawa.toimen.join(', ')}
- 上家の捨て牌: ${gameState.kawa.kamicha.join(', ')}
- 下家の捨て牌: ${gameState.kawa.shimocha.join(', ')}

【外部AIエンジンによる解析データ (期待値上位)】
${externalAnalysis.slice(0, 5).map((e: any) => `  - 打 ${e.tile}: 期待値(EV) ${e.ev}`).join('\n')}

※ あなたは上記の「外部AIの期待値が最も高い牌」を推奨打牌として採用し、その理由（受け入れ枚数、打点、安全度のバランスなど）を初心者にも分かりやすく言語化してください。

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。Markdownのコードブロックは不要です。
{
  "recommendedDiscard": "期待値が最も高い牌（例: 9s）",
  "reason": "なぜ外部AIはその牌を最も高く評価したのか、その論理的な理由の解説",
  "targetYaku": ["狙うべき役のリスト"],
  "dangerousTiles": ["危険な牌のリスト（例: ['1m', '9p']）。ない場合は空配列"],
  "dangerAlert": "注意点や守備に関するアドバイス。危険がない場合はnull",
  "evData": ${JSON.stringify(externalAnalysis.slice(0, 3))} // 上位3件のEVデータをそのまま含めてください
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    if (!resultText) {
      throw new Error("No response from Gemini");
    }
    
    // Parse the JSON response
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return {
      recommendedDiscard: gameState.tsumo || gameState.tehai[0],
      reason: "AIの解析に失敗しました。自力で最適な一打を考えてみましょう。",
      targetYaku: [],
      dangerousTiles: [],
      dangerAlert: null,
      evData: []
    };
  }
}

export async function getGameReview(logs: any[], gameState: any) {
  const prompt = `
あなたは麻雀のトッププロであり、熱血コーチです。
たった今終了した局の全ターンの打牌ログを分析し、ユーザーの選択の良かった点、悪かった点、そして「最も勝負を分けたポイント」を解説してください。

【局の情報】
- 局: ${gameState.kyoku} ${gameState.honba}本場

【打牌ログ (ターン別)】
${logs.map((log, i) => `巡目 ${i+1}: ユーザー打 [${log.userDiscard}], AI推奨 [${log.aiDiscard}] ${log.userDiscard === log.aiDiscard ? '(一致)' : '(不一致)'}`).join('\n')}

【出力フォーマット】
以下のJSON形式のみで出力してください。
{
  "matchRate": "一致率（パーセント、数値のみ。例: 85）",
  "reviewText": "局全体を通した解説文。一致しなかったターンの中で、どこが最も期待値を損ねていたか（あるいは独自の意図があったか）を具体的に長文で解説してください。マークダウンを使用して強調なども行って構いません。"
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    if (!resultText) {
      throw new Error("No response from Gemini");
    }
    return JSON.parse(resultText);
  } catch (error) {
    console.error("Error calling Gemini Review API:", error);
    return {
      matchRate: 0,
      reviewText: "レビューの生成に失敗しました。ログを確認してみましょう。"
    };
  }
}
