\"use server\";

import { GoogleGenerativeAI } from \"@google/generative-ai\";

// Ensure the API key is set in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || \"\");

// 外部エンジン（Mortal等）のFastAPIサーバーを呼び出す関数
// 環境変数 MORTAL_API_URL が設定されていればリアルAPIを使用し、
// 未設定またはサーバー未起動の場合はモックにフォールバックします。
async function fetchExternalAnalysis(gameState: any): Promise<{ evData: any[]; engine: string }> {
  const apiUrl = process.env.MORTAL_API_URL;

  // --- リアルAPI呼び出し ---
  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/analyze`, {
        method: \"POST\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify(gameState),
        signal: AbortSignal.timeout(5000), // 5秒タイムアウト
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();
      // FastAPI側のレスポンス: { engine: \"tile-efficiency\", evData: [...] }
      return {
        evData: (data.evData || []).map((e: any) => ({ tile: e.tile, ev: e.ev, reasoning: e.reasoning })),
        engine: data.engine ?? \"external\",
      };
    } catch (err) {
      console.warn(\"[fetchExternalAnalysis] API call failed, falling back to mock:\", err);
    }
  }

  // --- モック（フォールバック） ---
  const evData = (gameState.candidates || []).map((c: any) => {
    const base = 8 - c.shanten;
    const ukeireBonus = c.ukeireCount * 0.1;
    let ev = base * 1.5 + ukeireBonus;
    ev += Math.random() * 0.5 - 0.25;
    return {
      tile: c.p,
      ev: Math.max(0, parseFloat(ev.toFixed(2))),
      reasoning: `${c.shanten}シャンテン / 受け入れ${c.ukeireCount}枚 (モック値)`,
    };
  });
  evData.sort((a: any, b: any) => b.ev - a.ev);
  return { evData, engine: \"mock\" };
}

// 内部表記を日本語名に変換するヘルパー
function tileToJapanese(tile: string): string {
  if (!tile) return \"\";
  const suit = tile[0];
  const num = tile[1];
  const suitMap: any = { m: \"萬\", p: \"筒\", s: \"索\" };
  const honorMap: any = { \"1\": \"東\", \"2\": \"南\", \"3\": \"西\", \"4\": \"北\", \"5\": \"白\", \"6\": \"發\", \"7\": \"中\" };

  if (suit === \"z\") return honorMap[num] || tile;
  if (suitMap[suit]) return num + suitMap[suit];
  return tile;
}

export async function getMahjongAdvice(gameState: any) {
  // 外部エンジンによる期待値(EV)解析を取得（本物のAPIまたはモック）
  const { evData: externalAnalysis, engine: engineName } = await fetchExternalAnalysis(gameState);

  const engineLabel =
    engineName === \"mortal\" ? \"Mortal（最強位AI）\" :
    engineName === \"akochan\" ? \"akochan（準最強AI）\" :
    engineName === \"tile-efficiency\" ? \"牌効率解析エンジン\" :
    \"モック解析（サーバー未接続）\";

  // 牌情報を日本語に変換
  const tehaiJpn = (gameState.tehai || []).map(tileToJapanese).join(\", \");
  const tsumoJpn = tileToJapanese(gameState.tsumo);
  const doraJpn = (gameState.dora || []).map(tileToJapanese).join(\", \");
  const kawaJpn = {
    player: (gameState.kawa.player || []).map(tileToJapanese).join(\", \"),
    toimen: (gameState.kawa.toimen || []).map(tileToJapanese).join(\", \"),
    kamicha: (gameState.kawa.kamicha || []).map(tileToJapanese).join(\", \"),
    shimocha: (gameState.kawa.shimocha || []).map(tileToJapanese).join(\", \"),
  };

  const prompt = `
あなたは麻雀のトッププロであり、AIの解析結果を人間にわかりやすく翻訳する優秀なコーチです。
現在、「${engineLabel}」が盤面を解析し、各打牌の期待値（EV）を算出しました。
この期待値データを元に、「なぜその牌を切るべきと評価されたのか」「どのような狙いがあるのか」を論理的に解説してください。

【重要：絶対に守るべきルール】
1. 解析データ（EV値）を絶対的な基準としてください。あなたが独自の判断で推奨を変えてはいけません。
2. 牌の役割を間違えないでください（例：北を東と呼ぶ、ドラ表示牌をドラと呼ぶなどは厳禁）。
3. 役牌や風牌が自分にとって有効か（自風・場風）を正確に判定してください。

【現在の状況】
- 局: ${gameState.kyoku} ${gameState.honba}本場
- 場風: ${gameState.zhuangfeng} / 自風: ${gameState.menfeng}
- 点数状況: 自分 ${gameState.defen[0]}点 / 他家 25000点付近
- ドラ: ${doraJpn || 'なし'}
- 巡目: ${gameState.turn}巡目
- 手牌: ${tehaiJpn}
- ツモ牌: ${tsumoJpn || 'なし'}
- 捨て牌状況:
    自分: ${kawaJpn.player}
    他家全体: ${[kawaJpn.toimen, kawaJpn.kamicha, kawaJpn.shimocha].filter(s => s).join(' / ')}

【${engineLabel}による解析データ (期待値上位)】
${externalAnalysis.slice(0, 5).map((e: any) => \`  - 打 \${tileToJapanese(e.tile)} (\${e.tile}): EV=\${e.ev} / \${e.reasoning || ''}\`).join('\\n')}

※ 「打 \${tileToJapanese(externalAnalysis[0]?.tile)}\" が推奨されています。
この選択が「受け入れ枚数」「打点（ドラや役）」「安全度」の観点でどのように優れているか、日本語で解説してください。
特に、期待値が微差の場合はその理由（良形維持など）を推測して解説してください。

【出力フォーマット】
必ず以下のJSON形式のみで出力してください。
{
  \"recommendedDiscard\": \"推奨される牌の名称（例: 9索）\",
  \"reason\": \"解説文（200-400文字程度）\",
  \"targetYaku\": [\"狙うべき役のリスト\"],
  \"dangerousTiles\": [\"現状の危険牌（ある場合）\"],
  \"dangerAlert\": \"守備に関する注意点（ない場合はnull）\",
  \"evData\": \${JSON.stringify(externalAnalysis.slice(0, 3))}
}\`;

  try {
    const model = genAI.getGenerativeModel({
      model: \"gemini-2.0-flash\", // モデル名を実在するものに更新
      generationConfig: {
        responseMimeType: \"application/json\",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    if (!resultText) {
      throw new Error(\"No response from Gemini\");
    }

    const parsed = JSON.parse(resultText);
    // 使用エンジン名をレスポンスに付加（UI表示用）
    return { ...parsed, engineName };
  } catch (error) {
    console.error(\"Error calling Gemini API:\", error);
    return {
      recommendedDiscard: gameState.tsumo || gameState.tehai[0],
      reason: \"AIの解析に失敗しました。自力で最適な一打を考えてみましょう。\",
      targetYaku: [],
      dangerousTiles: [],
      dangerAlert: null,
      evData: [],
      engineName: \"error\",
    };
  }
}

export async function getGameReview(logs: any[], gameState: any) {
  const prompt = \`
あなたは麻雀のトッププロであり、熱血コーチです。
たった今終了した局の全ターンの打牌ログを分析し、ユーザーの選択の良かった点、悪かった点、そして「最も勝負を分けたポイント」を解説してください。

【局の情報】
- 局: \${gameState.kyoku} \${gameState.honba}本場

【打牌ログ (ターン別)】
\${logs.map((log, i) => \`巡目 \${i+1}: ユーザー打 [\${log.userDiscard}], AI推奨 [\${log.aiDiscard}] \${log.userDiscard === log.aiDiscard ? '(一致)' : '(不一致)'}\`).join('\\n')}

【出力フォーマット】
以下のJSON形式のみで出力してください。
{
  \"matchRate\": \"一致率（パーセント、数値のみ。例: 85）\",
  \"reviewText\": \"局全体を通した解説文。一致しなかったターンの中で、どこが最も期待値を損ねていたか（あるいは独自の意図があったか）を具体的に長文で解説してください。マークダウンを使用して強調なども行って構いません。\"
}\`;

  try {
    const model = genAI.getGenerativeModel({
      model: \"gemini-2.0-flash\",
      generationConfig: {
        responseMimeType: \"application/json\",
      }
    });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const resultText = response.text();
    if (!resultText) {
      throw new Error(\"No response from Gemini\");
    }
    return JSON.parse(resultText);
  } catch (error) {
    console.error(\"Error calling Gemini Review API:\", error);
    return {
      matchRate: 0,
      reviewText: \"レビューの生成に失敗しました。ログを確認してみましょう。\"
    };
  }
}
