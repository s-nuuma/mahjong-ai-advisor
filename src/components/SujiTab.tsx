"use client";

import React from 'react';

// 牌コンポーネント（ライトテーマ）
const Tile = ({
  value,
  isDiscarded = false,
  isSafe = false,
  size = "md"
}: {
  value: number | string;
  isDiscarded?: boolean;
  isSafe?: boolean;
  size?: "sm" | "md";
}) => {
  const sizeClasses = size === "sm" ? "w-8 h-12 text-base" : "w-10 h-14 text-lg";
  return (
    <div className={`
      ${sizeClasses} rounded-md border-2 flex flex-col items-center justify-center
      font-bold shadow-sm transition-all select-none
      ${isDiscarded ? 'bg-gray-200 border-gray-400 opacity-60' : isSafe ? 'bg-white border-green-500 ring-2 ring-green-300' : 'bg-white border-gray-400'}
    `}>
      <span className={isDiscarded ? 'text-gray-400' : isSafe ? 'text-green-700' : 'text-gray-800'}>
        {value}
      </span>
      <div className={`w-5 h-1 mt-1 rounded-full ${isSafe ? 'bg-green-400' : 'bg-gray-200'}`}></div>
    </div>
  );
};

// スジのライン定義
const SUJI_LINES = [
  {
    label: "1-4-7 ライン",
    center: 4,
    outer: [1, 7],
    description: "「4」が捨ててあれば「1」と「7」がスジ（両面待ちを否定）",
    centerDesc: "「1」と「7」が両方通れば「4」が中スジ（信頼度★★★）"
  },
  {
    label: "2-5-8 ライン",
    center: 5,
    outer: [2, 8],
    description: "「5」が捨ててあれば「2」と「8」がスジ（両面待ちを否定）",
    centerDesc: "「2」と「8」が両方通れば「5」が中スジ（信頼度★★★）"
  },
  {
    label: "3-6-9 ライン",
    center: 6,
    outer: [3, 9],
    description: "「6」が捨ててあれば「3」と「9」がスジ（両面待ちを否定）",
    centerDesc: "「3」と「9」が両方通れば「6」が中スジ（信頼度★★★）"
  },
];

// 壁のパターン定義
const WALL_PATTERNS = [
  {
    seen: 2,
    safe: [1],
    reason: "「2」が4枚見えれば 1-2-3 が作れない → 「1」安全"
  },
  {
    seen: 3,
    safe: [1, 2],
    reason: "「3」が4枚見えれば 1-2-3 と 2-3-4 が作れない → 「1」「2」安全"
  },
  {
    seen: 4,
    safe: [2, 3],
    reason: "「4」が4枚見えれば 2-3-4, 3-4-5, 4-5-6 が制限 → 「2」「3」安全"
  },
  {
    seen: 5,
    safe: [3, 7],
    reason: "「5」が4枚見えれば 3-4-5 と 5-6-7 が不可 → 「3」「7」安全"
  },
  {
    seen: 6,
    safe: [7, 8],
    reason: "「6」が4枚見えれば 4-5-6 と 6-7-8 が不可 → 「7」「8」安全"
  },
  {
    seen: 7,
    safe: [8, 9],
    reason: "「7」が4枚見えれば 5-6-7, 6-7-8, 7-8-9 が制限 → 「8」「9」安全"
  },
  {
    seen: 8,
    safe: [9],
    reason: "「8」が4枚見えれば 7-8-9 が作れない → 「9」安全"
  },
];

export function SujiTab() {
  return (
    <div className="max-w-4xl mx-auto w-full pb-12 space-y-10">

      {/* ヘッダー */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-3">スジ・壁 完全攻略</h2>
        <p className="text-gray-300 text-base max-w-2xl mx-auto leading-relaxed">
          「現物がない」場面でも論理的に安全牌を見つけるための守備技術。
          スジと壁を組み合わせることで、ベタオリの精度が飛躍的に向上します。
        </p>
      </div>

      {/* ======= スジ セクション ======= */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-blue-300">1. スジ (Suji) の全3ライン</h2>
        </div>

        <p className="text-gray-300 text-sm mb-5 leading-relaxed">
          麻雀の両面待ちは <span className="text-blue-300 font-bold">「1-4」「4-7」「2-5」「5-8」「3-6」「6-9」</span> の6パターンのみ。
          捨て牌にある数字から「安全なスジ」を導き出します。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {SUJI_LINES.map((line) => (
            <div key={line.label} className="bg-gray-800 border border-blue-800/50 rounded-xl p-5 shadow-lg">
              <h3 className="font-bold text-blue-400 mb-4 pb-2 border-b border-gray-700">{line.label}</h3>
              <div className="space-y-5">
                {/* 表スジ（中央が捨ててある） */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-bold">▶ 表スジ（外側が安全）</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tile value={line.center} isDiscarded size="sm" />
                    <span className="text-gray-400 text-lg">➔</span>
                    {line.outer.map(n => <Tile key={n} value={n} isSafe size="sm" />)}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{line.description}</p>
                </div>
                {/* 中スジ（両外が捨ててある） */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-bold">▶ 中スジ（最高信頼度）</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {line.outer.map(n => <Tile key={n} value={n} isDiscarded size="sm" />)}
                    <span className="text-gray-400 text-lg">➔</span>
                    <Tile value={line.center} isSafe size="sm" />
                  </div>
                  <p className="text-xs text-green-400 mt-2 leading-relaxed font-semibold">{line.centerDesc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 信頼度テーブル */}
        <div className="bg-gray-800 border border-blue-800/40 rounded-xl p-5">
          <h4 className="font-bold text-blue-300 mb-4">スジの種類と信頼度</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">中スジ</span>
                <span className="text-yellow-400">★★★</span>
              </div>
              <p className="text-xs text-gray-400">4と6が両方通っている時の「5」など。2方向の両面待ちを完全否定するため最も信頼度が高い。</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">表スジ</span>
                <span className="text-yellow-400">★★☆</span>
              </div>
              <p className="text-xs text-gray-400">「4」が通っている時の「1」「7」など。片方の両面待ちは否定されるが、もう片方は残る可能性がある。</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">片スジ（宣言牌のスジ）</span>
                <span className="text-yellow-400">★☆☆</span>
              </div>
              <p className="text-xs text-gray-400">リーチ宣言牌付近はあえてスジで待つ「引っかけリーチ」が多いため、過信は危険。</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white">生牌スジ</span>
                <span className="text-red-400">⚠ 注意</span>
              </div>
              <p className="text-xs text-gray-400">スジは<strong>両面待ちの否定のみ</strong>。カンチャン・単騎待ちには普通に当たるため絶対安全ではない。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ======= 壁 セクション ======= */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-8 bg-red-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-red-300">2. 壁（ノーチャンス）のパターン</h2>
        </div>

        <p className="text-gray-300 text-sm mb-5 leading-relaxed">
          特定の牌が<span className="text-red-300 font-bold">4枚すべて</span>見えている場合、その牌を含む順子が物理的に作れないため、特定の牌が<span className="text-green-400 font-bold">両面待ちに対して100%安全</span>になります。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {WALL_PATTERNS.map((pattern) => (
            <div key={pattern.seen} className="bg-gray-800 border border-red-800/40 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-500 font-bold mb-1">4枚見え</span>
                  <Tile value={pattern.seen} isDiscarded size="sm" />
                </div>
                <span className="text-gray-400 text-xl">➔</span>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-green-400 font-bold mb-1">安全!</span>
                  <div className="flex gap-1">
                    {pattern.safe.map(n => <Tile key={n} value={n} isSafe size="sm" />)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-700 pt-2">{pattern.reason}</p>
            </div>
          ))}
        </div>

        {/* ワンチャンス */}
        <div className="bg-gray-800 border border-yellow-700/50 rounded-xl p-5">
          <h4 className="font-bold text-yellow-300 mb-2">ワンチャンス（3枚見え）</h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            同じ牌が<strong>3枚</strong>見えている状態。残り1枚しか順子に使えないため、ノーチャンスよりは信頼度が落ちますが、無筋よりは安全です。
            安全牌の切り順では <strong className="text-yellow-400">「ノーチャンス ≫ ワンチャンス ≫ スジ ≫ 無筋」</strong> と覚えてください。
          </p>
        </div>
      </section>

      {/* ======= クイックリファレンス ======= */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-1.5 h-8 bg-yellow-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-yellow-300">3. クイック・リファレンス表</h2>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 text-gray-400 border-b border-gray-700">
                  <th className="py-3 px-4 text-left font-bold">切りたい牌</th>
                  <th className="py-3 px-4 text-left text-blue-400 font-bold">スジになる捨て牌</th>
                  <th className="py-3 px-4 text-left text-red-400 font-bold">壁になる4枚見え</th>
                </tr>
              </thead>
              <tbody className="text-gray-200 divide-y divide-gray-800">
                {[
                  { tile: 1, suji: "4", kabe: "2 または 3" },
                  { tile: 2, suji: "5", kabe: "3 または 4" },
                  { tile: 3, suji: "6", kabe: "4 または 5" },
                  { tile: 4, suji: "1 と 7", kabe: "2+3 または 5+6" },
                  { tile: 5, suji: "2 と 8", kabe: "3+4 または 6+7" },
                  { tile: 6, suji: "3 と 9", kabe: "4+5 または 7+8" },
                  { tile: 7, suji: "4", kabe: "5 または 6" },
                  { tile: 8, suji: "5", kabe: "6 または 7" },
                  { tile: 9, suji: "6", kabe: "7 または 8" },
                ].map((row, i) => (
                  <tr key={row.tile} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/40'}>
                    <td className="py-2.5 px-4 font-bold text-white text-base">{row.tile}</td>
                    <td className="py-2.5 px-4 text-blue-300">{row.suji}</td>
                    <td className="py-2.5 px-4 text-yellow-300">{row.kabe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
            <p className="text-xs text-gray-400 italic">
              ※ スジは「両面待ちを否定するだけ」です。カンチャン・単騎待ちへの放銃は防げません。
              壁の列は「その数字が4枚見えている場合に安全になる牌」を示します。
            </p>
          </div>
        </div>
      </section>

      {/* ======= まとめ ======= */}
      <section className="bg-gradient-to-r from-blue-900/30 to-red-900/30 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">守備の安全牌チェック順序（まとめ）</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {[
            { label: "①現物", color: "bg-green-700 text-green-100" },
            { label: "②4枚見え字牌", color: "bg-gray-700 text-gray-200" },
            { label: "③2〜3枚見え字牌", color: "bg-gray-700 text-gray-200" },
            { label: "④壁（ノーチャンス）", color: "bg-red-900 text-red-200" },
            { label: "⑤ワンチャンス", color: "bg-yellow-900 text-yellow-200" },
            { label: "⑥スジ", color: "bg-blue-900 text-blue-200" },
            { label: "⑦無筋（危険）", color: "bg-gray-900 text-gray-400 line-through" },
          ].map((item) => (
            <div key={item.label} className={`px-3 py-1.5 rounded-full ${item.color}`}>
              {item.label}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
