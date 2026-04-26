import React from 'react';

const YAKU_LIST = [
  { han: '1翻', yakus: [
    { name: '立直（リーチ）', example: '面前でテンパイし、1000点を支払って宣言する', digitalAdvice: '打点上昇と他家への抑止力を兼ね備える現代麻雀最強の役。迷ったら先制リーチが鉄則。' },
    { name: '役牌（ヤクハイ）', example: '三元牌（白・發・中）や自風・場風を3枚集める', digitalAdvice: '1鳴きで速度を飛躍させるが、孤立牌としてはブロック形成力が低いため、5ブロック揃っていれば早めに切る。' },
    { name: '断幺九（タンヤオ）', example: '2〜8の数牌のみで手を作る: 234 456 66 789 234', digitalAdvice: '鳴いても速度を維持できる最強の副露役。喰いタンは現代麻雀の基本戦術。' },
    { name: '平和（ピンフ）', example: '順子4組＋役牌以外の雀頭で、待ちが両面待ち', digitalAdvice: '両面待ちを前提とするため、リーチとの相性が抜群。牌効率の究極形。' },
    { name: '門前清自摸和（ツモ）', example: '面前でツモ和了する', digitalAdvice: '他家の放銃率に依存せず、自身の和了率のみで完結する強力な手段。' },
    { name: '一発（イッパツ）', example: 'リーチ後、1巡以内に和了する', digitalAdvice: 'リーチの期待値を押し上げる最大の要因。これがあるからリーチは強い。' },
    { name: '海底撈月（ハイテイ）', example: '局の最後のツモ牌で和了する', digitalAdvice: '狙って出すものではないが、リーチのツモ回数を増やす恩恵の一つ。' },
    { name: '河底撈魚（ホウテイ）', example: '局の最後の捨て牌でロン和了する', digitalAdvice: 'テンパイしていれば得られるボーナス。最終盤は安全牌優先。' },
    { name: '嶺上開花（リンシャン）', example: 'カンしたときの補充牌で和了する', digitalAdvice: 'カンのリスク（他家の打点上昇）に見合う場面でのみ狙う。' },
    { name: '槍槓（チャンカン）', example: '他家が加槓した牌でロン和了する', digitalAdvice: '出現率は極めて低い。' },
    { name: '一盃口（イーペーコー）', example: '同じ順子を2組作る: 223344', digitalAdvice: '無理に狙うと両面ターツを壊す恐れがあるため、自然に完成する時のみ。' }
  ]},
  { han: '2翻', yakus: [
    { name: '三色同順（サンショク）', example: '萬子・筒子・索子で同じ数字の順子を作る: m123 p123 s123 (鳴き1翻)', digitalAdvice: '無理に狙うと牌効率を落とす罠になりがち。自然にできる時のみ狙うのがデジタル。' },
    { name: '一気通貫（イッツー）', example: '同種で123・456・789を作る: m123456789 (鳴き1翻)', digitalAdvice: 'カンチャン・ペンチャン待ちが残りやすく、速度を落とす原因になりやすい。' },
    { name: '対々和（トイトイ）', example: '刻子を4組作る: 111 333 555 777 99', digitalAdvice: 'ポンで速度を上げられるが、守備力が極端に低下するため押し引きの判断がシビア。' },
    { name: '三暗刻（サンアンコ）', example: '暗刻（鳴かずに作った刻子）を3組作る', digitalAdvice: 'ツモり四暗刻の副産物になることが多い。狙うと速度が落ちる。' },
    { name: '七対子（チートイツ）', example: '対子を7組作る: 11 33 55 77 99 東東 南南', digitalAdvice: '5ブロック理論の例外。他家のリーチに対する安全牌を抱えやすいため守備力が高い。' },
    { name: '混全帯幺九（チャンタ）', example: '全ての面子と雀頭に1・9・字牌を含める (鳴き1翻)', digitalAdvice: '速度が遅く、現代麻雀では実用性が低い。鳴いて1000点にするのは愚策の筆頭。' },
    { name: '三色同刻（サンショクドウコウ）', example: '萬子・筒子・索子で同じ数字の刻子を作る: m555 p555 s555', digitalAdvice: '出現頻度が低く、意図して狙う場面はほとんどない。' },
    { name: '三槓子（サンカンツ）', example: 'カンを3回行う', digitalAdvice: '出現率が低く、他家の打点を上げるリスクが高すぎる。' },
    { name: 'ダブル立直（ダブリー）', example: '最初の自分のツモでリーチをかける', digitalAdvice: '文句なしの最強手。圧倒的な優位性がある。' }
  ]},
  { han: '3翻', yakus: [
    { name: '混一色（ホンイツ）', example: '1種類の数牌と字牌のみで作る (鳴き2翻)', digitalAdvice: '鳴いても高打点になる強力な役だが、捨て牌で警戒されやすい。字牌から切るなど工夫が必要。' },
    { name: '純全帯幺九（ジュンチャン）', example: '全ての面子と雀頭に1・9牌を含める（字牌なし） (鳴き2翻)', digitalAdvice: 'チャンタより打点は高いが、ペンチャン・カンチャン残りで速度が遅すぎる。' },
    { name: '二盃口（リャンペーコー）', example: '一盃口を2組作る（面前のみ）', digitalAdvice: '七対子の上位互換。狙うというよりは、平和の延長線上で偶然できるもの。' }
  ]},
  { han: '6翻', yakus: [
    { name: '清一色（チンイツ）', example: '1種類の数牌のみで作る: m1112345678999 (鳴き5翻)', digitalAdvice: '鳴いても満貫以上が確定する最強の役だが、待ちが複雑化しやすく、放銃リスクも上がるハイリスク・ハイリターン。' }
  ]},
  { han: '役満', yakus: [
    { name: '国士無双（コクシムソウ）', example: '1・9・字牌の全13種類を1枚ずつ＋どれか1つを対子にする', digitalAdvice: '配牌で9種以上ある時のみ狙う。他家からは変則手とバレやすい。' },
    { name: '四暗刻（スーアンコ）', example: '暗刻を4組作る', digitalAdvice: '面前で進めるため守備力が高く、リーチとの相性も良い役満。' },
    { name: '大三元（ダイサンゲン）', example: '白・發・中の刻子を全て作る', digitalAdvice: '鳴いて作れる役満のため、2副露した時点で強烈なプレッシャーを与えられる。' },
    { name: '字一色（ツーイーソー）', example: '字牌のみで作る', digitalAdvice: '配牌でトイツ以上の字牌が多数ある時のみ狙う。' },
    { name: '小四喜（ショウスーシー）', example: '東南西北のうち3つを刻子、1つを雀頭にする', digitalAdvice: '風牌のトイツが多い時にホンイツ・トイトイの延長で狙う。' },
    { name: '大四喜（ダイスーシー）', example: '東南西北の全てを刻子にする', digitalAdvice: '極めて難易度が高い。' },
    { name: '緑一色（リューイーソー）', example: '索子の2,3,4,6,8と發のみで作る', digitalAdvice: '配牌で索子が多いホンイツの最終形の一つ。' },
    { name: '清老頭（チンロウトウ）', example: '数牌の1・9のみで作る', digitalAdvice: '1・9牌は鳴きやすいため、鳴いて進めるのが基本。' },
    { name: '四槓子（スーカンツ）', example: 'カンを4回行う', digitalAdvice: '最も出現しにくい役満。' },
    { name: '九蓮宝燈（チューレンポウトウ）', example: '同種で1112345678999＋任意の1枚を作る（面前のみ）', digitalAdvice: '清一色の極致。' },
    { name: '天和（テンホウ）', example: '親の配牌時点で和了している', digitalAdvice: '完全な運。' },
    { name: '地和（チーホウ）', example: '子の第1ツモで和了する', digitalAdvice: '完全な運。' }
  ]}
];

export function YakuListTab() {
  return (
    <div className="max-w-6xl mx-auto pb-12 w-full">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">役一覧（デジタル理論版）</h2>
        <p className="text-gray-300 text-lg">
          各役の基本的な条件と、現代麻雀における<span className="text-blue-400 font-bold">デジタル理論的な一言アドバイス</span>を併記しています。
        </p>
      </div>
      
      <div className="space-y-12">
        {YAKU_LIST.map((group) => (
          <div key={group.han}>
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-green-300 bg-green-900/80 px-6 py-2 rounded-xl border border-green-600 shadow-md">
                {group.han}
              </h3>
              <div className="h-px bg-green-800/50 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.yakus.map((yaku) => (
                <div key={yaku.name} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:border-green-500 transition-colors flex flex-col h-full relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  <h4 className="text-xl font-bold text-white mb-3 pl-2">{yaku.name}</h4>
                  <div className="mb-4 pl-2">
                    <p className="text-gray-300 text-sm leading-relaxed">{yaku.example}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-700/50 pl-2">
                    <p className="text-blue-300 text-sm leading-relaxed font-semibold bg-blue-900/20 p-3 rounded-lg border border-blue-800/50">
                      <span className="text-blue-400 mr-1">💡</span>
                      {yaku.digitalAdvice}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
