import { GoogleGenerativeAI } from "@google/generative-ai";

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
  return `\${displayNum}\${suitName[suit] || suit}`;
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
      const res = await fetch(`\${apiUrl}/analyze`, {
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
      // フォールバック（牌効率エンジン等）へ移行
    }
  }

  // --- フォールバック（APIが使えない場合） ---
  return {
    evData: (gameState.candidates || []).map((c: any) => ({
      tile: c.p,
      ev: 0, 
      reasoning: `有効牌: \${c.ukeireCount}枚`
    })),
    engine: "tile-efficiency"
  };
}

export async function getMahjongAdvice(gameState: any) {
  // 1. 外部エンジンによる期待値解析
  const { evData: externalAnalysis, engine: engineCode } = await fetchExternalAnalysis(gameState);
  const engineName = engineCode; // "akochan", "mortal" etc.

  // 2. Geminiによる文脈理解と解説の生成
  const prompt = `あなたは世界最高峰の麻雀コーチ「Gemini 3」です。
以下の解析データに基づき、現在の局面における最善手とその理由を、初心者〜中級者にも分かりやすく解説してください。

【現在の状況】
- 局: \${gameState.kyoku} \${gameState.honba}本場
- 自風: \${gameState.menfeng}
- 巡目: \${gameState.turn}巡目
- ドラ: \${gameState.dora.map(tileToJapanese).join(', ')}
- 手牌: \${gameState.tehai.map(tileToJapanese).join(', ')} \${gameState.tsumo ? '(ツモ: ' + tileToJapanese(gameState.tsumo) + ')' : ''}

【\${engineLabel[engineCode] || engineCode}による解析データ (期待値上位)】
\${externalAnalysis.slice(0, 5).map((e: any) => `  - 打 \${tileToJapanese(e.tile)} (\${e.tile}): EV=\${e.ev} / \${e.reasoning || ''}`).join('\n')}

※ 「打 \${tileToJapanese(externalAnalysis[0]?.tile)}」が推奨されています。
この選択が「受け入れ枚数」「打点（ドラや役）」「安全度」の観点でどのように優れているか、日本語でプロンプトの解説として出力してください。
特に、期待値が微差の場合はその理由（良形維持など）を推測して解説してください。

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。
{
  "recommendedDiscard": "推奨される牌の記号（例: '\${externalAnalysis[0]?.tile}'）",
  "reason": "解説文（200-400文字程度。ここでは '東' や '7筒' といった日本語名を使用してください）",
  "targetYaku": ["狙うべき役のリスト"],
  "dangerousTiles": ["現状の危険牌（ある場合、元の記号で出力）"],
  "dangerAlert": "守備に関する注意点（ない場合はnull）",
  "evData": \${JSON.stringify(externalAnalysis.slice(0, 3))}
}
※ 重要：evData内の「tile」フィールドの値（\${externalAnalysis.slice(0, 3).map(e => e.tile).join(', ')}など）は、絶対に日本語に変換せず、元の記号のまま保持してください。`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    const resultText = result.response.text();
    const parsed = JSON.parse(resultText);

    // 使用エンジン名をレスポンスに付加（UI表示用）
    return { ...parsed, engineName };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      recommendedDiscard: externalAnalysis[0]?.tile || "",
      reason: "解析中にエラーが発生しましたが、現在の期待値トップはこの打牌です。",
      targetYaku: [],
      evData: externalAnalysis.slice(0, 3),
      engineName
    };
  }
}

export async function getGameReview(logs: any[], finalState: any) {
  const prompt = `あなたはプロ麻雀解説者です。
以下の一局の打牌ログを分析し、ユーザーの打牌とAIの推奨打牌の一致率を評価してください。
また、総括として、良かった点や今後の課題をアドバイスしてください。

【対局結果】
- 最終結果: \${finalState.kyoku}
- ログ: \${JSON.stringify(logs)}

以下のJSON形式で回答してください:
{
  "matchRate": "0-100の数値",
  "reviewText": "総括のアドバイス（日本語）"
}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
