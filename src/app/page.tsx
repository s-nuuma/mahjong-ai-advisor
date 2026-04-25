"use client";

import { useState, useEffect, useRef } from "react";
import { getMahjongAdvice, getGameReview } from "./actions";
import { MahjongEngine, GameState } from "@/lib/mahjong-engine";

const tileToText = (tile: string) => {
  // majiang-core format: m1, p5, s9, z1
  const suitMap: Record<string, string> = { m: "萬", p: "筒", s: "索" };
  const zMap: Record<string, string> = { "1": "東", "2": "南", "3": "西", "4": "北", "5": "白", "6": "発", "7": "中" };
  
  if (!tile || tile.length < 2) return tile;
  
  const suit = tile[0];
  const num = tile[1];
  
  if (suitMap[suit]) {
    // 0 is aka-dora (red 5)
    return (num === "0" ? "5" : num) + suitMap[suit];
  }
  if (suit === "z" && zMap[num]) {
    return zMap[num];
  }
  
  return tile;
};

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [advice, setAdvice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const engineRef = useRef<MahjongEngine | null>(null);

  // Correction Mode States
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pendingDiscard, setPendingDiscard] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review Mode States
  const turnLogsRef = useRef<any[]>([]);
  const [gameReview, setGameReview] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    // Initialize engine on mount
    const engine = new MahjongEngine(() => {
      // This callback is called by the engine whenever state updates
      setGameState(engine.getGameState());
    }, async () => {
      // onGameEnd callback
      setIsReviewing(true);
      const finalState = engine.getGameState();
      const review = await getGameReview(turnLogsRef.current, finalState);
      setGameReview(review);
      try {
         const history = JSON.parse(localStorage.getItem('mahjong_history') || '[]');
         history.push({ 
           date: new Date().toISOString(), 
           kyoku: finalState.kyoku, 
           matchRate: review.matchRate, 
           logs: turnLogsRef.current 
         });
         localStorage.setItem('mahjong_history', JSON.stringify(history));
      } catch(e) {
         console.error("Failed to save history", e);
      }
      setIsReviewing(false);
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      if (engineRef.current && engineRef.current.game) {
         if (typeof engineRef.current.game.stop === 'function') {
           engineRef.current.game.stop();
         }
      }
    };
  }, []);

  const requestAdvice = async () => {
    if (!gameState) return;
    setIsLoading(true);
    try {
      const result = await getMahjongAdvice(gameState);
      setAdvice(result);
      return result;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const executeDiscard = (tile: string, aiRecommendedTile?: string) => {
    if (engineRef.current && engineRef.current.humanPlayer) {
      if (aiRecommendedTile) {
        turnLogsRef.current.push({
          userDiscard: tileToText(tile),
          aiDiscard: tileToText(aiRecommendedTile)
        });
      }
      engineRef.current.humanPlayer.userDiscard(tile);
      setAdvice(null);
      setPendingDiscard(null);
      setShowCorrectionModal(false);
    }
  };

  const handleDiscard = async (tile: string) => {
    if (!isCorrectionMode) {
      const capturedState = gameState;
      executeDiscard(tile);
      
      // Asynchronously fetch AI advice to keep logs even in normal mode
      if (capturedState) {
        getMahjongAdvice(capturedState).then(res => {
          turnLogsRef.current.push({
             userDiscard: tileToText(tile),
             aiDiscard: tileToText(res.recommendedDiscard)
          });
        });
      }
      return;
    }

    // Correction Mode: Evaluate before discarding
    setIsEvaluating(true);
    setPendingDiscard(tile);
    const result = await requestAdvice();
    setIsEvaluating(false);

    if (result && result.recommendedDiscard !== tile) {
      setShowCorrectionModal(true);
    } else {
      // Perfect match or error
      setToastMessage("ナイスな一打です！");
      setTimeout(() => setToastMessage(null), 2000);
      executeDiscard(tile, result?.recommendedDiscard);
    }
  };

  const handleNakiAction = (actionType: string, m?: string) => {
    if (engineRef.current && engineRef.current.humanPlayer) {
      engineRef.current.humanPlayer.userAction(actionType, m);
    }
  };

  const getUkeireTooltip = (tile: string) => {
    if (!gameState || !gameState.candidates) return "";
    const cleanTile = tile.replace(/[\*\-\+\=\_]/g, '');
    const cand = gameState.candidates.find(c => c.p === cleanTile);
    if (!cand) return "";
    
    return `打 ${tileToText(tile)}: ${cand.shanten === 0 ? 'テンパイ' : cand.shanten + 'シャンテン'}\n有効牌 ${cand.ukeireCount}枚 (${cand.ukeire.map(tileToText).join(', ')})`;
  };

  if (!gameState) {
    return (
      <div className="flex h-screen bg-green-900 text-white font-sans items-center justify-center">
        <div className="text-2xl animate-pulse">牌山を積んでいます...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-green-900 text-white font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg font-bold animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      {/* Game Review Modal */}
      {(isReviewing || gameReview) && (
        <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl max-w-2xl w-full shadow-2xl my-auto">
            <h2 className="text-3xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-4">
              局後レビュー
            </h2>
            
            {isReviewing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-300 font-bold animate-pulse">Geminiが対局ログを分析し、総括を作成しています...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-900 p-6 rounded-xl flex items-center justify-between border border-gray-700">
                  <span className="text-xl text-gray-300 font-bold">AIとの打牌一致率</span>
                  <div className="text-4xl font-bold text-green-400">{gameReview.matchRate}%</div>
                </div>
                
                <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-blue-300 font-bold mb-4 text-lg">💡 Geminiコーチからの総括</h3>
                  <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {gameReview.reviewText}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setGameReview(null);
                    turnLogsRef.current = [];
                    // Reset game or allow user to start a new one
                    window.location.reload(); 
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors text-lg"
                >
                  次の局へ（再スタート）
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showCorrectionModal && advice && (
        <div className="absolute inset-0 bg-black/70 z-40 flex items-center justify-center">
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span className="text-3xl">✋</span> ちょっと待って！
            </h2>
            <div className="mb-6 space-y-4">
              <p className="text-gray-200">
                あなたの選択: <span className="font-bold text-xl ml-2">打 {tileToText(pendingDiscard!)}</span>
              </p>
              <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-blue-300 text-sm font-semibold mb-1">AIの推奨打牌</p>
                <p className="text-2xl font-bold text-white">打 {tileToText(advice.recommendedDiscard)}</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-xl">
                <p className="text-gray-400 text-sm font-semibold mb-1">AIの評価理由</p>
                <p className="text-gray-200 text-sm leading-relaxed">{advice.reason}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => executeDiscard(pendingDiscard!, advice.recommendedDiscard)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                自分の意志を貫く
              </button>
              <button
                onClick={() => {
                  setShowCorrectionModal(false);
                  setPendingDiscard(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
              >
                考え直す
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Left: Game Board */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 relative overflow-hidden">
        <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg flex flex-col gap-2">
          <div className="text-xl font-bold text-white">{gameState.kyoku} - {gameState.honba}本場 - {gameState.turn}巡目</div>
          <div className="flex gap-4 text-sm font-semibold text-gray-300">
            <div>残り: <span className="text-white">{gameState.shan}</span> 枚</div>
            <div className="flex items-center gap-1">
              ドラ: 
              <div className="flex gap-1 ml-1">
                {gameState.dora?.map((d, i) => (
                  <span key={i} className="bg-yellow-600 text-black px-1 rounded font-bold">{tileToText(d)}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-sm font-semibold text-blue-300">
            {gameState.currentShanten === 0 ? 'テンパイ' : gameState.currentShanten === -1 ? 'アガリ' : `${gameState.currentShanten}シャンテン`}
          </div>
        </div>

        {/* Naki (Pending Actions) Dialog */}
        {gameState.pendingAction && gameState.pendingAction.length > 0 && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-gray-800/90 border border-gray-600 p-4 rounded-xl shadow-2xl flex gap-4 z-30 animate-in slide-in-from-bottom-4">
            {gameState.pendingAction.map((action: any, i: number) => (
              <button
                key={i}
                onClick={() => handleNakiAction(action.type, action.m)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-lg capitalize transition-colors"
              >
                {action.type === 'hule' ? 'ロン / ツモ' : action.type} {action.m && <span className="text-sm ml-2 opacity-80">{action.m}</span>}
              </button>
            ))}
            <button
              onClick={() => handleNakiAction('skip')}
              className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors"
            >
              スルー
            </button>
          </div>
        )}

        {/* Toimen */}
        <div className="w-full flex justify-center mt-12">
          <div className="bg-green-800 p-2 rounded flex flex-wrap max-w-lg gap-1 min-h-[4rem]">
            {gameState.kawa.toimen?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Center Field */}
        <div className="grid grid-cols-3 grid-rows-3 gap-8 items-center w-full max-w-md my-auto relative">
          <div className="col-start-1 row-start-2 bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform -rotate-90 origin-center">
             {gameState.kawa.kamicha?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md transform rotate-90">
                {tileToText(t)}
              </div>
            ))}
          </div>
          <div className="col-start-2 row-start-2 flex flex-col items-center justify-center bg-green-900/80 p-4 rounded-full border-4 border-green-700 shadow-inner w-48 h-48">
            <div className="text-gray-300 text-sm font-bold mb-1">対面: {gameState.defen[2]}</div>
            <div className="flex w-full justify-between px-2 my-2 text-sm font-bold">
              <span className="text-gray-300">上家: {gameState.defen[3]}</span>
              <span className="text-gray-300">下家: {gameState.defen[1]}</span>
            </div>
            <div className="text-white text-lg font-bold mt-1">あなた: {gameState.defen[0]}</div>
          </div>
          <div className="col-start-3 row-start-2 bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform rotate-90 origin-center">
            {gameState.kawa.shimocha?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md transform -rotate-90">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Player Kawa */}
        <div className="w-full flex justify-center mb-8">
           <div className="bg-green-800 p-2 rounded flex flex-wrap max-w-lg gap-1 min-h-[4rem]">
            {gameState.kawa.player?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Player Hand */}
        <div className="w-full flex justify-center pb-4">
          <div className="flex gap-2 items-end">
            <div className="flex gap-1 bg-green-800/50 p-2 rounded-lg">
              {gameState.tehai?.map((t, i) => (
                <button
                  key={i}
                  title={getUkeireTooltip(t)}
                  onClick={() => handleDiscard(t)}
                  disabled={!gameState.tsumo || isEvaluating}
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md font-bold shadow-lg transition-transform hover:-translate-y-2 relative group
                    ${advice?.recommendedDiscard === t ? 'bg-blue-300 border-2 border-blue-500 animate-pulse' : 'bg-gray-100'}
                    ${(!gameState.tsumo || isEvaluating) ? 'opacity-90 cursor-not-allowed hover:translate-y-0' : ''}
                    ${pendingDiscard === t && isEvaluating ? 'bg-yellow-200 ring-4 ring-yellow-400' : ''}
                  `}
                >
                  {tileToText(t)}
                  {isCorrectionMode && gameState.tsumo && !isEvaluating && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </button>
              ))}
            </div>
            {gameState.tsumo && (
              <div className="ml-4 pl-4 border-l-2 border-white/20">
                <button
                  title={getUkeireTooltip(gameState.tsumo)}
                  onClick={() => handleDiscard(gameState.tsumo!)}
                  disabled={isEvaluating}
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md font-bold shadow-lg transition-transform hover:-translate-y-2 relative group
                    ${advice?.recommendedDiscard === gameState.tsumo ? 'bg-blue-300 border-2 border-blue-500 animate-pulse' : 'bg-gray-100'}
                    ${isEvaluating ? 'opacity-90 cursor-not-allowed hover:translate-y-0' : ''}
                    ${pendingDiscard === gameState.tsumo && isEvaluating ? 'bg-yellow-200 ring-4 ring-yellow-400' : ''}
                  `}
                >
                  {tileToText(gameState.tsumo)}
                  {isCorrectionMode && !isEvaluating && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: AI Advisor Sidebar */}
      <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl z-10 relative">
        <div className="p-6 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-blue-400">Gemini 3 育成コーチ</h2>
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" title="AI Online"></div>
          </div>
          
          {/* Mode Toggle */}
          <div className="bg-gray-900 p-3 rounded-lg flex items-center justify-between border border-gray-700">
            <span className="text-sm font-semibold text-gray-300">添削モード（中級者向け）</span>
            <button
              onClick={() => setIsCorrectionMode(!isCorrectionMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isCorrectionMode ? 'bg-blue-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isCorrectionMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 relative">
          {/* Loading Overlay for Sidebar */}
          {isEvaluating && (
            <div className="absolute inset-0 bg-gray-900/80 z-10 flex items-center justify-center backdrop-blur-sm">
               <div className="flex flex-col items-center gap-3">
                 <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-blue-400 font-bold animate-pulse">AIが打牌を評価中...</span>
               </div>
            </div>
          )}

          {!advice ? (
             <div className="bg-gray-800 p-5 rounded-xl text-gray-300 border border-gray-700">
               {isCorrectionMode ? (
                 <p className="text-sm">
                   <span className="text-blue-400 font-bold">添削モードON:</span><br/>
                   盤面の牌をクリックして打牌してください。AIがあなたの選択をリアルタイムに評価し、推奨と異なる場合のみ解説を行います。
                 </p>
               ) : (
                 <>
                   <p className="mb-4 text-sm">現在の局面を分析しますか？</p>
                   <button 
                      onClick={requestAdvice}
                      disabled={isLoading || !gameState.tsumo}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isLoading ? '分析中...' : 'アドバイスを求める'}
                   </button>
                 </>
               )}
             </div>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-blue-900/30 border border-blue-500/30 p-5 rounded-xl">
                <h3 className="text-blue-300 text-sm font-semibold uppercase tracking-wider mb-2">推奨打牌</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  打 {tileToText(advice.recommendedDiscard)}
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">理由</h3>
                <p className="text-gray-100 leading-relaxed text-sm whitespace-pre-wrap">
                  {advice.reason}
                </p>
              </div>

              {advice.targetYaku && advice.targetYaku.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">狙うべき役</h3>
                  <div className="flex gap-2 flex-wrap">
                    {advice.targetYaku.map((yaku: string) => (
                      <span key={yaku} className="bg-indigo-900/50 text-indigo-200 border border-indigo-700 px-3 py-1 rounded-full text-sm">
                        {yaku}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {advice.dangerAlert && (
                <div className="bg-red-900/30 border border-red-500/30 p-5 rounded-xl">
                  <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">⚠ 注意点</h3>
                  <p className="text-red-100 leading-relaxed text-sm whitespace-pre-wrap">
                    {advice.dangerAlert}
                  </p>
                </div>
              )}

              <button 
                onClick={() => setAdvice(null)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                自力で考える
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
