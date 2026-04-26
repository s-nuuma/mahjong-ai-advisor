"use client";

import { useState, useEffect, useRef } from "react";
import { getMahjongAdvice, getGameReview } from "./actions";
import { MahjongEngine, GameState } from "@/lib/mahjong-engine";

const tileToText = (tile: string) => {
  if (!tile || tile.length < 2) return tile;
  const suit = tile[0];
  let num = parseInt(tile[1]);
  if (isNaN(num)) return tile;
  
  if (num === 0) num = 5; // Aka-dora

  if (suit === 'm') return String.fromCodePoint(0x1F007 + num - 1);
  if (suit === 's') return String.fromCodePoint(0x1F010 + num - 1);
  if (suit === 'p') return String.fromCodePoint(0x1F019 + num - 1);
  if (suit === 'z') {
    const zMap: Record<number, number> = {
      1: 0x1F000, 2: 0x1F001, 3: 0x1F002, 4: 0x1F003,
      5: 0x1F006, 6: 0x1F005, 7: 0x1F004
    };
    return zMap[num] ? String.fromCodePoint(zMap[num]) : tile;
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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    // Initialize engine on mount
    const engine = new MahjongEngine(() => {
      // This callback is called by the engine whenever state updates
      const state = engine.getGameState();
      console.log("GAME STATE UPDATE:", state);
      setGameState(state);
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
         if (typeof (engineRef.current.game as any).stop === 'function') {
           (engineRef.current.game as any).stop();
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

  const openHistoryModal = () => {
    try {
      const data = JSON.parse(localStorage.getItem('mahjong_history') || '[]');
      setHistoryData(data);
      setShowHistoryModal(true);
    } catch (e) {
      console.error(e);
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

      {/* History Modal */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/90 z-[60] flex items-center justify-center p-8 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl max-w-4xl w-full shadow-2xl relative my-auto">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              ✕ 閉じる
            </button>
            <h2 className="text-3xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-4">
              学習記録（AI一致率の推移）
            </h2>
            
            {historyData.length === 0 ? (
              <p className="text-gray-400 text-center py-12">まだデータがありません。局を終了すると記録されます。</p>
            ) : (
              <div className="space-y-8">
                {/* Growth Graph */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 h-64 flex items-end gap-2 overflow-x-auto pb-4">
                  {historyData.map((d: any, i: number) => {
                    const matchRate = parseFloat(d.matchRate) || 0;
                    const heightPercent = Math.max(5, matchRate);
                    return (
                      <div key={i} className="flex flex-col items-center flex-shrink-0 group relative w-12">
                        <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                          {d.kyoku}<br/>{matchRate}%
                        </div>
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-500 ${matchRate >= 80 ? 'bg-green-500' : matchRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                        <div className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">
                          {new Date(d.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                     <h3 className="text-gray-300 font-bold mb-2 text-sm uppercase">平均一致率</h3>
                     <p className="text-4xl font-bold text-blue-400">
                       {Math.round(historyData.reduce((acc, curr) => acc + (parseFloat(curr.matchRate) || 0), 0) / historyData.length)}%
                     </p>
                  </div>
                  <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700">
                     <h3 className="text-gray-300 font-bold mb-2 text-sm uppercase">完了した局数</h3>
                     <p className="text-4xl font-bold text-green-400">
                       {historyData.length} 局
                     </p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            <div className="flex items-center mt-2">
              <span className="text-sm font-semibold text-gray-300 mr-2">ドラ:</span>
              <div className="flex gap-1">
                {gameState.dora?.map((d, i) => (
                  <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm shadow-md text-3xl">
                    {tileToText(d)}
                  </div>
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
            {gameState.pendingAction.map((action: any, i: number) => {
              const actionLabels: Record<string, string> = {
                chi: 'チー',
                peng: 'ポン',
                gang: 'カン',
                hule: 'ロン / ツモ'
              };
              const label = actionLabels[action.type] || action.type;
              return (
                <button
                  key={i}
                  onClick={() => handleNakiAction(action.type, action.m)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg text-lg capitalize transition-colors"
                >
                  {label} {action.m && <span className="text-sm ml-2 opacity-80">{action.m}</span>}
                </button>
              );
            })}
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
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm shadow-md text-3xl">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Center Field */}
        <div className="flex items-center justify-center gap-8 w-full max-w-3xl my-auto">
          <div className="bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform -rotate-90 origin-center">
             {gameState.kawa.kamicha?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm shadow-md transform rotate-90 text-3xl">
                {tileToText(t)}
              </div>
            ))}
          </div>
          <div className="bg-green-900/80 rounded-full border-4 border-green-700 shadow-inner w-56 h-56 shrink-0 relative z-10 flex items-center justify-center">
            
            {/* 対面 */}
            <div className="absolute top-4 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                {gameState.oyaId === 2 && <span className="bg-red-600 text-white text-[10px] px-1 rounded">親</span>}
                <span className={`text-sm font-bold ${gameState.oyaId === 2 ? 'text-yellow-400' : 'text-gray-300'}`}>対面</span>
              </div>
              <span className="text-gray-200 text-sm font-bold">{gameState.defen[2]}</span>
            </div>

            {/* 上家 */}
            <div className="absolute left-3 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                {gameState.oyaId === 3 && <span className="bg-red-600 text-white text-[10px] px-1 rounded">親</span>}
                <span className={`text-sm font-bold ${gameState.oyaId === 3 ? 'text-yellow-400' : 'text-gray-300'}`}>上家</span>
              </div>
              <span className="text-gray-200 text-sm font-bold">{gameState.defen[3]}</span>
            </div>

            {/* 下家 */}
            <div className="absolute right-3 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                {gameState.oyaId === 1 && <span className="bg-red-600 text-white text-[10px] px-1 rounded">親</span>}
                <span className={`text-sm font-bold ${gameState.oyaId === 1 ? 'text-yellow-400' : 'text-gray-300'}`}>下家</span>
              </div>
              <span className="text-gray-200 text-sm font-bold">{gameState.defen[1]}</span>
            </div>

            {/* あなた */}
            <div className="absolute bottom-4 flex flex-col items-center">
              <div className="flex items-center gap-1 mb-0.5">
                {gameState.oyaId === 0 && <span className="bg-red-600 text-white text-[10px] px-1 rounded">親</span>}
                <span className={`text-sm font-bold ${gameState.oyaId === 0 ? 'text-yellow-400' : 'text-white'}`}>あなた</span>
              </div>
              <span className="text-white text-lg font-bold">{gameState.defen[0]}</span>
            </div>

            {/* Center Info */}
            <div className="flex flex-col items-center text-green-700/50 text-xs font-bold pointer-events-none">
              MAHJONG
            </div>
          </div>
          <div className="bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform rotate-90 origin-center">
            {gameState.kawa.shimocha?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm shadow-md transform -rotate-90 text-3xl">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Player Kawa */}
        <div className="w-full flex justify-center mb-8">
           <div className="bg-green-800 p-2 rounded flex flex-wrap max-w-lg gap-1 min-h-[4rem]">
            {gameState.kawa.player?.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm shadow-md text-3xl">
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
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md shadow-lg transition-transform hover:-translate-y-2 relative group text-5xl leading-none
                    ${advice?.recommendedDiscard === t ? 'bg-blue-300 border-2 border-blue-500 animate-pulse z-10' : 
                      advice?.dangerousTiles?.includes(t) ? 'bg-red-300 border-2 border-red-500 text-red-900 z-10' : 'bg-gray-100'}
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
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md shadow-lg transition-transform hover:-translate-y-2 relative group text-5xl leading-none
                    ${advice?.recommendedDiscard === gameState.tsumo ? 'bg-blue-300 border-2 border-blue-500 animate-pulse z-10' : 
                      advice?.dangerousTiles?.includes(gameState.tsumo) ? 'bg-red-300 border-2 border-red-500 text-red-900 z-10' : 'bg-gray-100'}
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
            <div className="flex items-center gap-3">
              <button 
                onClick={openHistoryModal}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-full font-bold transition-colors"
              >
                📊 記録
              </button>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" title="AI Online"></div>
            </div>
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

              {advice.evData && advice.evData.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
                  <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    📊 外部AI 期待値(EV)
                  </h3>
                  <div className="space-y-3">
                    {advice.evData.map((evItem: any, idx: number) => {
                      const maxEv = Math.max(15, advice.evData[0].ev);
                      const pct = Math.min(100, Math.max(0, (evItem.ev / maxEv) * 100));
                      return (
                        <div key={idx} className="flex items-center gap-3">
                           <div className="w-12 text-center text-xl bg-gray-200 text-black rounded-sm py-1 shadow-sm font-bold">
                             {tileToText(evItem.tile)}
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className={idx === 0 ? "text-blue-400 font-bold" : "text-gray-400"}>EV: {evItem.ev.toFixed(2)}</span>
                                {idx === 0 && <span className="text-blue-400 font-bold">Best</span>}
                              </div>
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-blue-500' : 'bg-gray-500'}`}
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Gemini解説</h3>
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
