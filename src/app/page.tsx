"use client";

import { useState, useEffect, useRef } from "react";
import { getMahjongAdvice } from "./actions";
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

  useEffect(() => {
    // Initialize engine on mount
    const engine = new MahjongEngine(() => {
      // This callback is called by the engine whenever state updates
      setGameState(engine.getGameState());
    });
    engineRef.current = engine;
    engine.start();

    // Cleanup not strictly necessary for this simple wrapper, 
    // but in a real app we'd want to stop the game loop
    return () => {
      if (engineRef.current && engineRef.current.game) {
         // Stop the majiang-core game loop if needed
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = (tile: string) => {
    if (engineRef.current && engineRef.current.humanPlayer) {
      engineRef.current.humanPlayer.userDiscard(tile);
      setAdvice(null);
    }
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
      {/* Left: Game Board */}
      <div className="flex-1 flex flex-col items-center justify-between p-8 relative">
        <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg">
          <div className="text-xl font-bold">{gameState.kyoku} - {gameState.honba}本場 - {gameState.turn}巡目</div>
        </div>

        {/* Toimen */}
        <div className="w-full flex justify-center mt-12">
          <div className="bg-green-800 p-2 rounded flex flex-wrap max-w-lg gap-1 min-h-[4rem]">
            {gameState.kawa.toimen.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Center Field */}
        <div className="grid grid-cols-3 grid-rows-3 gap-8 items-center w-full max-w-md my-auto relative">
          <div className="col-start-1 row-start-2 bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform -rotate-90 origin-center">
             {gameState.kawa.kamicha.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md transform rotate-90">
                {tileToText(t)}
              </div>
            ))}
          </div>
          <div className="col-start-2 row-start-2 text-center">
            <h2 className="text-2xl font-bold opacity-50">Mahjong AI</h2>
          </div>
          <div className="col-start-3 row-start-2 bg-green-800 p-2 rounded flex flex-wrap gap-1 min-w-[4rem] min-h-[4rem] transform rotate-90 origin-center">
            {gameState.kawa.shimocha.map((t, i) => (
              <div key={i} className="w-8 h-12 bg-gray-200 text-black flex items-center justify-center rounded-sm font-bold shadow-md transform -rotate-90">
                {tileToText(t)}
              </div>
            ))}
          </div>
        </div>

        {/* Player Kawa */}
        <div className="w-full flex justify-center mb-8">
           <div className="bg-green-800 p-2 rounded flex flex-wrap max-w-lg gap-1 min-h-[4rem]">
            {gameState.kawa.player.map((t, i) => (
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
              {gameState.tehai.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleDiscard(t)}
                  disabled={!gameState.tsumo}
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md font-bold shadow-lg transition-transform hover:-translate-y-2
                    ${advice?.recommendedDiscard === t ? 'bg-blue-300 border-2 border-blue-500 animate-pulse' : 'bg-gray-100'}
                    ${!gameState.tsumo ? 'opacity-90 cursor-not-allowed hover:translate-y-0' : ''}
                  `}
                >
                  {tileToText(t)}
                </button>
              ))}
            </div>
            {gameState.tsumo && (
              <div className="ml-4 pl-4 border-l-2 border-white/20">
                <button
                  onClick={() => handleDiscard(gameState.tsumo!)}
                  className={`w-12 h-16 text-black flex items-center justify-center rounded-md font-bold shadow-lg transition-transform hover:-translate-y-2
                    ${advice?.recommendedDiscard === gameState.tsumo ? 'bg-blue-300 border-2 border-blue-500 animate-pulse' : 'bg-gray-100'}
                  `}
                >
                  {tileToText(gameState.tsumo)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: AI Advisor Sidebar */}
      <div className="w-96 bg-gray-900 border-l border-gray-700 flex flex-col shadow-2xl">
        <div className="p-6 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-blue-400">Gemini 3 育成コーチ</h2>
          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" title="AI Online"></div>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {!advice ? (
             <div className="bg-gray-800 p-5 rounded-xl text-gray-300 border border-gray-700">
               <p className="mb-4">現在の局面を分析しますか？</p>
               <button 
                  onClick={requestAdvice}
                  disabled={isLoading || !gameState.tsumo}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? '分析中...' : 'アドバイスを求める'}
               </button>
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
                <p className="text-gray-100 leading-relaxed text-sm">
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
                  <p className="text-red-100 leading-relaxed text-sm">
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
