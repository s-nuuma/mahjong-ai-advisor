import React from 'react';

export function AdviceTab() {
  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">現代麻雀 デジタル理論</h2>
        <p className="text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
          長らく「流れ」や「ツキ」といった抽象的な概念が主流だった時代は終わり、現代麻雀は<span className="text-blue-400 font-bold">確率論と統計学に基づく「デジタル理論」</span>が主流です。運の要素を排除し、期待値を最大化するための基本体系を6つのカテゴリで解説します。
        </p>
      </div>

      <div className="space-y-8">
        
        {/* 1. 牌効率と5ブロック理論 */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-blue-900/50">1</div>
            <h3 className="text-2xl font-bold text-blue-300">牌効率と5ブロック理論による速度最大化</h3>
          </div>
          <div className="mb-6">
            <p className="text-gray-200 mb-4 leading-relaxed">
              麻雀は「他家より早くアガる」ことが最優先事項です。手牌をあらかじめ「4面子＋1雀頭」の5つのパーツ（ブロック）として想定する「5ブロック理論」が現代の基本です。
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-900 text-gray-400">
                    <th className="p-3 border border-gray-700">手牌の構成要素</th>
                    <th className="p-3 border border-gray-700">状態</th>
                    <th className="p-3 border border-gray-700">役割</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  <tr>
                    <td className="p-3 border border-gray-700 font-bold">面子（メンツ）</td>
                    <td className="p-3 border border-gray-700">3枚の完成形</td>
                    <td className="p-3 border border-gray-700 text-blue-300">1ブロック確定</td>
                  </tr>
                  <tr className="bg-gray-800/50">
                    <td className="p-3 border border-gray-700 font-bold">ターツ</td>
                    <td className="p-3 border border-gray-700">あと1枚で面子になる形</td>
                    <td className="p-3 border border-gray-700 text-blue-300">1ブロック候補</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-700 font-bold">対子（トイツ）</td>
                    <td className="p-3 border border-gray-700">同じ牌2枚</td>
                    <td className="p-3 border border-gray-700 text-blue-300">雀頭候補、または刻子の種</td>
                  </tr>
                  <tr className="bg-gray-800/50">
                    <td className="p-3 border border-gray-700 font-bold">孤立牌</td>
                    <td className="p-3 border border-gray-700">どのグループにも属さない牌</td>
                    <td className="p-3 border border-gray-700 text-gray-400">ブロック形成の材料（または不要牌）</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
              <h4 className="text-blue-400 font-bold mb-3">孤立牌の処理優先順位</h4>
              <p className="text-xs text-gray-400 mb-2">5ブロックが足りている場合、以下の順で「不純物」として処分します。</p>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex justify-between items-center"><span className="font-bold text-gray-400">1. 客風の字牌</span> <span className="text-xs">安全度も低く最優先</span></li>
                <li className="flex justify-between items-center"><span className="font-bold text-gray-400">2. 役牌</span> <span className="text-xs">ブロック十分なら早めに手放す</span></li>
                <li className="flex justify-between items-center"><span className="font-bold text-gray-400">3. 1・9の老頭牌</span> <span className="text-xs">両面変化が絶望的</span></li>
                <li className="flex justify-between items-center"><span className="font-bold text-gray-400">4. 2・8の牌</span> <span className="text-xs">3,7を引けば両面になる</span></li>
                <li className="flex justify-between items-center"><span className="font-bold text-blue-400">5. 3〜7の中張牌</span> <span className="text-xs">最強の孤立牌</span></li>
              </ol>
            </div>
            <div>
              <h4 className="text-blue-300 font-bold mb-3">ターツの優劣（受け入れ枚数）</h4>
              <table className="w-full text-left border-collapse text-sm mb-4">
                <thead>
                  <tr className="bg-gray-900 text-gray-400">
                    <th className="p-2 border border-gray-700">形</th>
                    <th className="p-2 border border-gray-700">有効牌</th>
                    <th className="p-2 border border-gray-700">特徴</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  <tr>
                    <td className="p-2 border border-gray-700">両面 (34)</td>
                    <td className="p-2 border border-gray-700 font-bold text-blue-400">最大8枚</td>
                    <td className="p-2 border border-gray-700">最も効率が良い。全力で残す。</td>
                  </tr>
                  <tr className="bg-gray-800/50">
                    <td className="p-2 border border-gray-700">嵌張 (35)</td>
                    <td className="p-2 border border-gray-700 text-gray-400">最大4枚</td>
                    <td className="p-2 border border-gray-700">中張牌なら両面変化あり。</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-700">辺張 (12)</td>
                    <td className="p-2 border border-gray-700 text-gray-400">最大4枚</td>
                    <td className="p-2 border border-gray-700">両面変化も絶望的。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-6 bg-blue-900/20 rounded-xl p-4 border border-blue-800/50">
            <h4 className="text-blue-400 font-bold mb-1 text-sm">⚠ 初心者の悪癖</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              「いつか重なるかも」と役牌や字牌を中盤まで抱え込むことや、三色同順などの目先の「役」に囚われて有効牌である両面ターツを外してしまう行為は、現代麻雀では明確な敗退行為と見なされます。また、<strong className="text-yellow-400">ドラが1枚もない手牌で無理に高い手を作ろうとすること</strong>も、他家への放銃リスクを高めるだけであり期待収支はマイナスです。まずは「最速でテンパイを組む」という基礎を徹底し、役は結果としてついてくるもの、あるいはリーチによって付与するものと割り切ることが重要です。
            </p>
          </div>
        </section>

        {/* 2. リーチ判断 */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-red-900/50">2</div>
            <h3 className="text-2xl font-bold text-red-300">リーチ判断の統計的優位性</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-200 mb-4 leading-relaxed">
                「リーチ」は現代麻雀における最強の役です。一発・ツモ・裏ドラを含めた平均期待値の上昇と、他家への抑制（圧力）効果があります。
              </p>
              <h4 className="text-red-300 font-bold mb-3">リーチによる期待値の上昇</h4>
              <table className="w-full text-left border-collapse text-sm mb-4">
                <thead>
                  <tr className="bg-gray-900 text-gray-400">
                    <th className="p-2 border border-gray-700">ダマテン時</th>
                    <th className="p-2 border border-gray-700">リーチ後期待値</th>
                    <th className="p-2 border border-gray-700">上昇幅</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  <tr>
                    <td className="p-2 border border-gray-700">1000点</td>
                    <td className="p-2 border border-gray-700 font-bold text-red-400">約3700点</td>
                    <td className="p-2 border border-gray-700 text-green-400">+2700点</td>
                  </tr>
                  <tr className="bg-gray-800/50">
                    <td className="p-2 border border-gray-700">2000点</td>
                    <td className="p-2 border border-gray-700 font-bold text-red-400">約6300点</td>
                    <td className="p-2 border border-gray-700 text-green-400">+4300点</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-700">3900点</td>
                    <td className="p-2 border border-gray-700 font-bold text-red-400">約9100点</td>
                    <td className="p-2 border border-gray-700 text-green-400">+5200点</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 h-full">
                <h4 className="text-gray-400 font-bold mb-3">例外としてダマテンを検討する基準</h4>
                <ul className="list-disc pl-4 text-sm text-gray-300 space-y-3">
                  <li><strong>高打点が確定している:</strong> 跳満（12000点）以上ある場合、他家に警戒されるデメリットが上回る。</li>
                  <li><strong>待ちが極端に弱く低打点:</strong> のみ手愚形（1300点）等で手変わりを待つ場合。</li>
                  <li><strong>点数状況の判断:</strong> 2着以下との差が大きく、局を終わらせること自体の価値が高い場合。</li>
                  <li><strong>ドラがヤオチュウ牌:</strong> リーチを切ると完全に出なくなるが、ダマなら拾える可能性が高い場合。</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-6 bg-red-900/20 rounded-xl p-4 border border-red-800/50">
            <h4 className="text-red-400 font-bold mb-1 text-sm">⚠ 初心者の悪癖</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              「出にくい待ちだからダマ」「1000点払うのがもったいない」というのは初心者が最も陥りやすい罠です。出にくい待ちだからこそ、リーチの圧力で相手を降ろし、ツモアガリの抽選を増やすのがデジタルな思考です。
            </p>
          </div>
        </section>

        {/* 3. 押し引きの基準 */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-yellow-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-yellow-900/50">3</div>
            <h3 className="text-2xl font-bold text-yellow-300">押し引き（期待値判断）の基礎理論</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-200 mb-4 leading-relaxed">
                他家からリーチが入った際、自分がどのような状態なら勝負すべきか。この判断は、自身の「和了確率」と「放銃時の損失」を天秤にかけるプロセスです。
              </p>
              <h4 className="text-yellow-300 font-bold mb-3">11巡目・他家リーチへの追っかけ判断</h4>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-900 text-gray-400">
                    <th className="p-2 border border-gray-700">自分の状態</th>
                    <th className="p-2 border border-gray-700 text-green-400">和了率</th>
                    <th className="p-2 border border-gray-700 text-red-400">放銃率</th>
                    <th className="p-2 border border-gray-700">結論</th>
                  </tr>
                </thead>
                <tbody className="text-gray-200">
                  <tr>
                    <td className="p-2 border border-gray-700">両面テンパイ</td>
                    <td className="p-2 border border-gray-700 font-bold">約40%</td>
                    <td className="p-2 border border-gray-700">約24%</td>
                    <td className="p-2 border border-gray-700 font-bold text-yellow-400">鉄押し</td>
                  </tr>
                  <tr className="bg-gray-800/50">
                    <td className="p-2 border border-gray-700">愚形テンパイ</td>
                    <td className="p-2 border border-gray-700 font-bold">約31%</td>
                    <td className="p-2 border border-gray-700">約19%</td>
                    <td className="p-2 border border-gray-700">状況により押し</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-gray-700">一向聴（未完成）</td>
                    <td className="p-2 border border-gray-700 text-gray-500">低</td>
                    <td className="p-2 border border-gray-700 font-bold text-red-400">高</td>
                    <td className="p-2 border border-gray-700 font-bold text-gray-400">ほぼベタオリ</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col justify-center bg-yellow-900/20 rounded-xl p-6 border border-yellow-800/50">
              <h4 className="text-yellow-400 font-bold mb-3 text-center">⚠ 初心者の悪癖</h4>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                「自分の手がもったいない」という感情で、<strong>ノーテンから無筋（危険牌）を押し続ける行為</strong>は、統計的に見て極めて無謀であり、現代麻雀最大の悪手とされます。
              </p>
              <p className="text-white font-bold text-center">押し引きの基準は常に「自分の打点と待ちの強さ」という客観的なデータに基づくべきです。</p>
            </div>
          </div>
        </section>

        {/* 4. 守備のイロハ */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-green-900/50">4</div>
            <h3 className="text-2xl font-bold text-green-300">守備のイロハ（放銃を避ける論理的技術）</h3>
          </div>
          <p className="text-gray-200 mb-6 leading-relaxed">
            自分がアガれる確率は統計的に約21〜25%に過ぎません。残りの75%は「他人のアガリ番」であり、いかに失点を最小限に抑えるかが長期的な成績を決定づけます。
          </p>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 mb-6">
            <h4 className="text-green-400 font-bold mb-3">現物（げんぶつ）とは</h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              現物とは、<strong>リーチ者が既に捨てている牌</strong>、またはリーチ後に他家が捨てて通過した牌（合わせ打ち）を指します。
              麻雀の「フリテン」ルールにより、現物でロンされる確率は<span className="text-green-400 font-bold">理論上 0%</span> です。
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              ⚑ 重要: リーチ宣言牌以降に<em>他家</em>が捨てて通った牌も、リーチ者に対しては現物扱いになります（合わせ打ち）。
              つまり、自分が切っていない牌でも、他家が通した後なら安全に切れる場合があります。
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 h-full">
                <h4 className="text-green-400 font-bold mb-3">安全牌の切り順（ベタオリの徹底）</h4>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-3"><span className="bg-green-800 text-green-200 px-2 py-0.5 rounded text-xs">1</span> <span className="font-bold">現物（リーチ者の捨て牌等）</span> <span className="text-xs text-green-400 ml-auto">放銃率 0%</span></li>
                  <li className="flex items-center gap-3"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">2</span> <span className="font-bold">4枚見えの字牌</span> <span className="text-xs text-gray-400 ml-auto">単騎待ち以外に当たらない</span></li>
                  <li className="flex items-center gap-3"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">3</span> <span className="font-bold">2〜3枚見え字牌</span> <span className="text-xs text-gray-400 ml-auto">極めて安全</span></li>
                  <li className="flex items-center gap-3"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">4</span> <span className="font-bold">スジの1・9牌</span> <span className="text-xs text-gray-400 ml-auto">両面待ちが否定されている</span></li>
                  <li className="flex items-center gap-3"><span className="bg-gray-700 px-2 py-0.5 rounded text-xs">5</span> <span className="font-bold">壁(ノーチャンス)の牌</span> <span className="text-xs text-gray-400 ml-auto">論理的に両面を否定</span></li>
                </ol>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700 flex-1">
                <h4 className="text-gray-400 font-bold mb-3">スジと壁の論理的仕組み</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-blue-300 font-bold text-sm">■ スジ (Suji)</span>
                    <p className="text-gray-300 text-xs mt-1 leading-relaxed">両面待ちは「1-4」「4-7」「2-5」「5-8」「3-6」「6-9」の6パターン。「4」が捨て牌にあれば「1-4」「4-7」の両面待ちは否定されます。</p>
                    <div className="mt-2 pl-2 border-l-2 border-gray-700 space-y-1">
                      <p className="text-xs text-gray-400"><span className="text-yellow-400 font-bold">中スジ:</span> 4と6が両方通っている時の「5」は、2方向の両面待ちが否定されるため信頼度が高い。</p>
                      <p className="text-xs text-gray-400"><span className="text-yellow-400 font-bold">表スジ:</span> 「4」が通っている時の「1」「7」。比較的安全だが単騎・カンチャンには当たる。</p>
                      <p className="text-xs text-red-400">⚠ スジはあくまで両面待ちの否定のみ。カンチャン・単騎待ちには当たるため過信は禁物。</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-300 font-bold text-sm">■ 壁 / ノーチャンス (Kabe)</span>
                    <p className="text-gray-300 text-xs mt-1 leading-relaxed">場に特定の数字が<strong>4枚すべて</strong>見えている状態。例：「8」が4枚見えていれば「7-8」の塔子は作れないため、「9」の安全度が飛躍的に高まります。</p>
                    <div className="mt-2 pl-2 border-l-2 border-gray-700">
                      <p className="text-xs text-gray-400"><span className="text-yellow-400 font-bold">ワンチャンス:</span> 同じ牌が<strong>3枚</strong>見えている状態。残り1枚しか面子に使えないため、ノーチャンスよりは信頼度が落ちるが、無筋よりは安全。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-green-900/20 rounded-xl p-4 border border-green-800/50">
            <h4 className="text-green-400 font-bold mb-1 text-sm">⚠ 初心者の悪癖</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              「中抜き（メンツを崩して降りること）」を恐れるあまり、中途半端に自分の手を進めようとして無筋の中張牌を放銃してしまうこと。通っていない牌を1枚切る行為は放銃リスクを10〜15%背負うことになります。オリると決めたら1ミリの未練も残さないことが絶対条件です。
            </p>
          </div>
        </section>

        {/* 5. 副露の基本 */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-900/50">5</div>
            <h3 className="text-2xl font-bold text-purple-300">副露（鳴き）の基本：速度とリスクの天秤</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-gray-200 mb-4 leading-relaxed">
                副露（ポン、チー）は手の進行速度を飛躍的に高める武器ですが、同時に「守備力の低下」と「打点の下落」という深刻な副作用を伴います。
              </p>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 mb-4">
                <h4 className="text-green-400 font-bold mb-2 text-sm">⭕ 鳴くべき手の典型例</h4>
                <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                  <li><strong>役牌が対子（暗刻）:</strong> 1鳴きで役が確定し速度が最大化される。</li>
                  <li><strong>タンヤオ・ドラ3:</strong> 鳴いても満貫が確保されており、速度を優先するべき。</li>
                  <li><strong>親番での連荘狙い:</strong> 1500点でも連荘する価値が極めて高い。</li>
                </ul>
              </div>
            </div>
            <div>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 h-full">
                <h4 className="text-red-400 font-bold mb-2 text-sm">❌ 鳴くべきではない手</h4>
                <ul className="list-disc pl-5 text-sm text-gray-300 space-y-3">
                  <li>
                    <strong>役がない状態での遠い仕掛け:</strong>
                    <p className="text-xs text-gray-400 mt-1">最終的に役がつかず、「形式テンパイ」すら取れないリスクがある。</p>
                  </li>
                  <li>
                    <strong>安い・遠い・守れない:</strong>
                    <p className="text-xs text-gray-400 mt-1">1000点のために手牌をさらし、他家のリーチに対して無防備になるのは最も効率が悪い行為。</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-purple-900/20 rounded-xl p-5 border border-purple-800/50">
            <h4 className="text-purple-400 font-bold mb-2 text-sm">⚠ 初心者の悪癖</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              「鳴けるから鳴く」という条件反射。役が確定していない状態で中張牌をチーし、後で行き詰まるケースが頻発します。鳴きを入れる際は、常に<strong>「この手を鳴いた後にリーチが来たら何を切って逃げるか」</strong>という退路を1枚以上確保しておくことが求められます。
            </p>
          </div>
        </section>

        {/* 6. 上達のロードマップ */}
        <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-700 pb-4">
            <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-900/50">6</div>
            <h3 className="text-2xl font-bold text-indigo-300">上達の指標「10%デルタ」と学習法</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
            <div className="flex-1">
              <p className="text-gray-200 mb-4 leading-relaxed">
                麻雀は不確定要素が多いため、結果（着順）だけで実力を判断すると誤った方向に進みます。中級者を目指すための客観的指標が「10%デルタ」です。
              </p>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                <h4 className="text-indigo-400 font-bold mb-3 text-sm">改善のステップ</h4>
                <ol className="list-decimal pl-5 text-sm text-gray-300 space-y-3">
                  <li>まずは守備を徹底し、放銃率を <strong className="text-red-400">12%以下</strong> に抑える。</li>
                  <li>その上で牌効率を磨き、和了率を <strong className="text-green-400">22%以上</strong> に引き上げる。</li>
                  <li>この順序が最も効率的に雀力を向上させるルートです。</li>
                </ol>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-8 border border-indigo-500/50 text-center flex-1 shadow-inner w-full">
              <h4 className="text-gray-400 font-bold mb-4">目標とする究極の方程式</h4>
              <div className="text-3xl lg:text-4xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-indigo-400 py-2">
                和了率 <span className="text-white">-</span> 放銃率 <span className="text-white">≧</span> 10%
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-indigo-300 font-bold mb-3">デジタルツールの活用</h4>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-2">
                <li><strong>AI解析ツール（NAGA, Mortal等）:</strong> 自分の牌譜をAIに読み込ませ、「AIなら何を切るか」と比較して悪癖を視覚的に特定する。</li>
                <li><strong>何切る問題の反復:</strong> 時間制限のある実戦で、複雑な形から瞬時に最適解を見抜く「形感（なりかん）」を養う。</li>
              </ul>
            </div>
            <div className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-800/50">
              <h4 className="text-indigo-400 font-bold mb-1 text-sm">⚠ 初心者の悪癖</h4>
              <p className="text-gray-300 text-xs leading-relaxed">
                「勝った試合の牌譜だけを見直す」のは自己満足であり上達を妨げます。見直すべきは放銃した局やアガリ逃しをした局です。また結果論（アガれたから正解）ではなく、過程論（その瞬間の期待値が最大だったか）を重視しなければなりません。
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
