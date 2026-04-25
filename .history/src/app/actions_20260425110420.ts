"use server";

import { GoogleGenAI } from "@google/genai";

// Ensure the API key is set in environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getMahjongAdvice(gameState: any) {
  const prompt = `
あなたは麻雀のトッププロであり、初心者の上達をサポートする優秀なコーチです。
現在のゲーム状況を分析し、最も期待値が高く、かつ状況に適した「次の一打（推奨打牌）」を提案してください。

【現在の状況】
- 局: ${gameState.kyoku} ${gameState.honba}本場
- 巡目: ${gameState.turn}巡目
- 手牌: ${gameState.tehai.join(', ')}
- ツモ牌: ${gameState.tsumo || 'なし'}
- 自分の捨て牌: ${gameState.kawa.player.join(', ')}
- 対面の捨て牌: ${gameState.kawa.toimen.join(', ')}
- 上家の捨て牌: ${gameState.kawa.kamicha.join(', ')}
- 下家の捨て牌: ${gameState.kawa.shimocha.join(', ')}

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。Markdownのコードブロックは不要です。
{
  "recommendedDiscard": "打牌する牌（例: 9s）",
  "reason": "なぜその牌を切るのかの論理的な理由",
  "targetYaku": ["狙うべき役のリスト"],
  "dangerAlert": "注意点や守備に関するアドバイス。危険がない場合はnull"
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

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
      dangerAlert: null
    };
  }
}
