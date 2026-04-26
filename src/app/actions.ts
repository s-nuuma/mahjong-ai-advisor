"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * 内部記号（"z1", "p7"等）を日本語名称に変換するヘルパー
 */
function tileToJapanese(tile: string): string {
  if (!tile) return "";
  const suit = tile[0];
  const num = parseInt(tile[1]);
  if (isNaN(num)) return tile;

  const suitName: Record<string, string> = {
    m: "萬子",
    p: "筒子",
    s: "索子",
  };

  if (suit === "z") {
    const honorName: Record<number, string> = {
      1: "東", 2: "南", 3: "西", 4: "北",
      5: "白", 6: "發", 7: "中"
    };
    return honorName[num] || tile;
  }

  const numMap = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const displayNum = num === 0 ? "赤五" : numMap[num];
  return `${displayNum}${suitName[suit] || suit}`;
}

const engineLabel: Record<string, string> = {
  'akochan': 'akochan (準最強AI)',
  'mortal': 'Mortal (最強位AI)',
  'tile-efficiency': '牌効率エンジン'
};

/**
 * 解析サーバー（Dockerコンテナ）から解析データを取得
 */
async function fetchExternalAnalysis(gameState: any): Promise<{ evData: any[]; engine: string }> {
  const apiUrl = process.env.MORTAL_API_URL;

  // --- リアルAPI呼び出し ---
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tehai: gameState.tehai,
          tsumo: gameState.tsumo,
          candidates: gameState.candidates,
          dora: gameState.dora,
          kyoku: gameState.kyoku,
          honba: gameState.honba,
          turn: gameState.turn,
          score: gameState.defen
        }),
      });

      if (!res.ok) throw new Error("Backend analysis failed");
      const data = await res.json();
      return {
        evData: (data.evData || []).map((e: any) => ({ tile: e.tile, ev: e.ev, reasoning: e.reasoning })),
        engine: data.engine ?? "external",
      };
    } catch (err) {
      console.error("External analysis error:", err);
    }
  }

  // --- フォールバック ---
  return {
    evData: (gameState.candidates || []).map((c: any) => ({
      tile: c.p,
      ev: 0, 
      reasoning: `有効牌: ${c.ukeireCount}枚`
    })),
    engine: "tile-efficiency"
  };
}

export async function getMahjongAdvice(gameState: any) {
  const { evData: externalAnalysis, engine: engineCode } = await fetchExternalAnalysis(gameState);
  const engineName = engineCode;

  if (!externalAnalysis || externalAnalysis.length === 0) {
    return {
      recommendedDiscard: "",
      reason: "有効な打牌候補が見つかりませんでした。",
      targetYaku: [],
      evData: [],
      engineName
    };
  }

  const prompt = `あなたは世界最高峰の麻雀コーチ「Gemini 3」です。
提供される解析データに基づいて、現在の局面における最善手とその理由を解説してください。

【局面情報】
- 局: ${gameState.kyoku} ${gameState.honba}本場 / 自風: ${gameState.menfeng}
- 巡目: ${gameState.turn}巡目 / ドラ: ${gameState.dora.map(tileToJapanese).join(', ')}
- 手牌: ${gameState.tehai.map(tileToJapanese).join(', ')} ${gameState.tsumo ? '(ツモ: ' + tileToJapanese(gameState.tsumo) + ')' : ''}

【解析データ】
${externalAnalysis.slice(0, 5).map((e: any) => `  - 打 ${tileToJapanese(e.tile)} (${e.tile}): EV=${e.ev} / ${e.reasoning || ''}`).join('\n')}

以下のJSON形式のみで回答してください。余計な説明文（"はい、解析します"等）やMarkdownの囲いは一切不要です。
{
  "recommendedDiscard": "${externalAnalysis[0]?.tile}",
  "reason": "具体的な打牌理由を解説してください（150文字程度）。",
  "targetYaku": ["狙える役"],
  "dangerousTiles": ["現状の危険牌（元の記号）"],
  "dangerAlert": "守備のアドバイス（ない場合はnull）",
  "evData": ${JSON.stringify(externalAnalysis.slice(0, 3))}
}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ]
    });

    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    
    // 強力なクレンジング
    let cleanText = resultText.trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    const parsed = JSON.parse(cleanText);
    return { ...parsed, engineName };
  } catch (error: any) {
    console.error("Gemini Error Details:", error);
    return {
      recommendedDiscard: externalAnalysis[0]?.tile || "",
      reason: `Gemini解析中にエラーが発生しました (${error?.message || "不明なエラー"})。APIキー、ネットワーク、またはリージョンの制限を確認してください。`,
      targetYaku: [],
      evData: externalAnalysis.slice(0, 3),
      engineName
    };
  }
}

export async function getGameReview(logs: any[], finalState: any) {
  const prompt = `あなたはプロ麻雀解説者です。ログを分析し、JSONで評価してください。
{
  "matchRate": "0-100の数値",
  "reviewText": "総括のアドバイス（日本語）"
}
ログ: ${JSON.stringify(logs)}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    let cleanText = result.response.text().trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    return JSON.parse(cleanText);
  } catch (err) {
    return { matchRate: 0, reviewText: "レビューの生成に失敗しました。" };
  }
}
