"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure the API key is set in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getMahjongAdvice(gameState: any) {
  const prompt = `
あなたは麻雀のトッププロであり、初心者の上達をサポートする優秀なコーチです。
現在のゲーム状況を分析し、最も期待値が高く、かつ状況に適した「次の一打（推奨打牌）」を提案してください。

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

【エンジンによる事前計算データ】
- 現在のシャンテン数: ${gameState.currentShanten === 0 ? 'テンパイ' : gameState.currentShanten === -1 ? 'アガリ' : gameState.currentShanten + 'シャンテン'}
- 打牌候補（受け入れ枚数順・上位のみ）:
${gameState.candidates && gameState.candidates.slice(0, 5).map((c: any) => 
  `  - 打 ${c.p}: ${c.shanten === 0 ? 'テンパイ' : c.shanten + 'シャンテン'} (有効牌 ${c.ukeireCount}枚: ${c.ukeire.join(', ')})`
).join('\n')}

※ あなたは上記の事前計算結果を踏まえて、必ずしも受け入れ枚数だけでなく、打点・スピード・安全度の総合的な期待値から最も優秀な一打を選んでください。

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。Markdownのコードブロックは不要です。
{
  "recommendedDiscard": "打牌する牌（例: 9s）",
  "reason": "なぜその牌を切るのかの論理的な理由",
  "targetYaku": ["狙うべき役のリスト"],
  "dangerousTiles": ["危険な牌のリスト（例: ['1m', '9p']）。ない場合は空配列"],
  "dangerAlert": "注意点や守備に関するアドバイス。危険がない場合はnull"
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
      dangerAlert: null
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
