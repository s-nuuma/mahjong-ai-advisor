"use server";

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// API v1 を明示的に指定してみる
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
          shan: gameState.shan,
          defen: gameState.defen,
          menfeng: gameState.menfeng,
          zhuangfeng: gameState.zhuangfeng,
          kawa: gameState.kawa,
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
提供される解析データを「麻雀中級へのデジタル理論ガイド」に基づいて、以下の5項目で論理的に解説してください。

【コーチングの鉄則】
1. 構造化：解説文（reason）は必ず以下の5セクション構成とし、各セクションの頭に【結論】【根拠】【方針】【比較】【注意】というラベルを付けてください。
2. 強調：重要なキーワード（5ブロック、期待値、安牌、役牌、廃棄順序など）は **...** で囲んでください。
3. トーン：客観的かつフラットなトーンを維持し、事実と根拠に基づいて説明してください。
4. 数値の活用：${engineLabel[engineCode] || engineCode}のデータ（EV、有効牌数など）を論理の裏付けとして必ず使用してください。

【現在の局面情報】
- 局: ${gameState.kyoku} ${gameState.honba}本場 / 自風: ${gameState.menfeng}
- 巡目: ${gameState.turn}巡目 / ドラ: ${gameState.dora.map(tileToJapanese).join(', ')}
- 手牌: ${gameState.tehai.map(tileToJapanese).join(', ')} ${gameState.tsumo ? '(ツモ: ' + tileToJapanese(gameState.tsumo) + ')' : ''}

【解析データ（期待値）】
${externalAnalysis.slice(0, 5).map((e: any) => `  - 打 ${tileToJapanese(e.tile)} (${e.tile}): EV=${e.ev} / ${e.reasoning || ''}`).join('\n')}

【解説の5項目構成（必ず全項目を出力）】
1. 【結論】：何を切り、どの理論（**5ブロック理論**、**スリム化**等）を適用したか。
2. 【根拠】：**期待値（EV）**と**有効牌（受け入れ枚数）**の数値的な裏付け。
3. 【方針】：この局で最終的に目指すべき**役**と**想定打点**（リーチ・タンヤオ・平和など）。
4. 【比較】：期待値が微差の他牌と比較して、なぜ今回の牌が優れているか。
5. 【注意】：現状の**放銃リスク**や、次に引いた際に展開が苦しくなる牌への備え。

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。余計な説明文やMarkdownコードブロックは不要です。
{
  "recommendedDiscard": "${externalAnalysis[0]?.tile}",
  "reason": "【結論】：...\\n【根拠】：...\\n【方針】：...\\n【比較】：...\\n【注意】：...",
  "targetYaku": ["狙うべき役のリスト"],
  "dangerousTiles": ["現状の危険牌（元の記号で出力）"],
  "dangerAlert": "守備に関する注意点の要約（ない場合はnull）",
  "evData": ${JSON.stringify(externalAnalysis.slice(0, 3))}
}
※ 重要：evData内の「tile」フィールドの値は、絶対に日本語に変換せず、元の記号のまま保持してください。`;

  // 試行するモデルのリスト（Google AI Studio確認済みモデル）
  const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash"];
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json", // JSON出力を強制
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const result = await model.generateContent(prompt);
      const resultText = result.response.text();
      
      let cleanText = resultText.trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanText = jsonMatch[0];
      
      const parsed = JSON.parse(cleanText);
      return { ...parsed, engineName };
    } catch (error: any) {
      console.error(`Gemini Error with ${modelName}:`, error.message);
      continue;
    }
  }

  return {
    recommendedDiscard: externalAnalysis[0]?.tile || "",
    reason: "Gemini解析中にエラーが発生しました。APIキーの権限またはリージョン設定を確認してください。",
    targetYaku: [],
    evData: externalAnalysis.slice(0, 3),
    engineName
  };
}


export async function getGameReview(logs: any[], finalState: any) {
  const prompt = `あなたはプロ麻雀解説者です。ログを分析し、JSONで評価してください。
ログ: ${JSON.stringify(logs)}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    let cleanText = result.response.text().trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleanText = jsonMatch[0];
    return JSON.parse(cleanText);
  } catch (err) {
    return { matchRate: 0, reviewText: "レビューの生成に失敗しました。" };
  }
}
