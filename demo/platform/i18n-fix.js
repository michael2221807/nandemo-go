/* Interface text the prototype leaves untranslated (user 2026-10-21: 换街按钮、商店页面、机器和改造的介绍).
   Loaded right after the dictionaries (js/i18n-ja.js) and before the machines' scripts, which build their texts with
   T`…` as they load. Found by tools/check_i18n.mjs (every screen and popup, three languages, both names modes).
   - 改造 parts the Chinese source names in Japanese (高速ホイッパー…): they are interface, as English already has them
     (Turbo whipper), so Chinese gets them in both names modes
   - 全部翻译 (full) only: the goods, cat food, paid items and the second street named in Japanese inside sentences, in
     the local names i18n-names.js gives the goods (名字原汁原味 keeps them Japanese, as designed)
   - full mode's name swap turned the クロ (the cat, 小黑) inside クロワッサン into 小黑ワッサン
   - the game's own names (なんでも自販機, なんでも通り, なんでもカタログ), which the prototype keeps Japanese in every mode
     (I18N.KEEP), get local names in 全部翻译 (user 2026-10-21): 南丁猫 (nan-ding-mao, the cat at the end) and Nandemo.
     Japanese and 名字原汁原味 keep them, and so do the street's painted signs. (The machine brand なんでも stays 什么都有 / Anything)
   The album's and the upgrades' facts no longer name real companies, shops or models by their own names (user 2026-10-24, the App Store):
   the last block below gives them our own parody names (7-Eleven → 5-Eleven) in all three languages; the facts stay. */
(() => {
  I18N.add('zh', {
    '落下センサー': '落货感应器', '高速ホイッパー': '高速搅拌器', '转碗湯切り': '转碗沥水', 'マルチエレベーター': '多列升降台',
    '揚げ場': '油炸台', 'デザート棚': '甜点架', '特急レーン': '特快轨道', '炙りバーナー': '炙烤喷枪', '二番かご': '第二个煮篮',
    '味噌だれ': '味噌酱', '回転ブラシ': '旋转油刷', '強火バーナー': '猛火喷枪', 'クロワッサン生地': '可颂面团',
    '自動ブロック補給': '冰块自动补给', '練乳ポンプ': '炼乳泵', 'つまり防止の撹拌棒': '防卡搅拌棒', '急勾配レール': '陡坡滑轨',
    'ジャンボホイール': '大号转盘', 'ネル自動洗浄': '法兰绒滤布自动清洗', 'ハロゲン×2': '卤素灯 ×2', 'ソーダファウンテン': '汽水机',
    '金色シークレット一出，一下子翻倍': '金色隐藏款一出，一下子翻倍',
  });
  if (I18N.lang === 'zh' && I18N.full) I18N.add('zh', {
    '第 3 道可冷可热 · 新货 おでん缶': '第 3 道可冷可热 · 新货 关东煮罐',
    '加一个豆仓和磨盘 · 能卖现磨咖啡：挽きたてブレンド、挽きたてラテ、カフェモカ': '加一个豆仓和磨盘 · 能卖现磨咖啡：现磨特调、现磨拿铁、摩卡',
    '加一口油锅 · 能卖现炸的唐揚げ、とんかつ、天ぷら、エビフライ': '加一口油锅 · 能卖现炸的炸鸡、炸猪排、天妇罗、炸虾',
    '加一个味噌锅和出酱嘴 · 能卖味噌大根、味噌こんにゃく、味噌玉子': '加一个味噌锅和出酱嘴 · 能卖味噌萝卜、味噌魔芋、味噌卤蛋',
    '换上大号转盘 · 能卖大扭蛋（ジャンボおすし、ジャンボねこ、ジャンボきょうりゅう）': '换上大号转盘 · 能卖大扭蛋（大号寿司、大号猫咪、大号恐龙）',
    // 商店 (the paid items)
    '金のまぐろ缶：猫吃饱的时间 ×1.5': '金色金枪鱼罐头：猫吃饱的时间 ×1.5',
    'はなや · 花的自贩机': '花店 · 花的自贩机', 'ポップ · 爆米花自贩机': '波普 · 爆米花自贩机', 'おみくじ · 签的自贩机': '御神签 · 签的自贩机',
    'ご当地ドリンク': '各地特色饮料', 'ご当地ドリンク 到货了': '各地特色饮料 到货了', '秋祭りセット': '秋祭套装',
  });
  I18N.names({
    zh: { '駅前通り': '站前街', 'クロワッサン': '可颂', 'なんでも自販機': '南丁猫自贩机', 'なんでも通り': '南丁猫街', 'なんでもカタログ': '南丁猫目录' },
    en: { '駅前通り': 'Station Street', 'なんでも自販機': 'Nandemo Vending', 'なんでも通り': 'Nandemo Street', 'なんでもカタログ': 'Nandemo Catalog' },
  }, {});
  // the English dictionary already had its own spelling for the game's name (Nandemo Jihanki)
  if (I18N.full) I18N.add('en', { 'なんでも自販機': 'Nandemo Vending', 'なんでも自販機 可交互原型': 'Nandemo Vending — interactive prototype' });
  // マルチエレベーター is the one part name written without T (m-frozen.js): named once the machines are built
  addEventListener('DOMContentLoaded', () => { const m = typeof MACHINES !== 'undefined' && MACHINES.find(x => x.id === 'frozen'), p = m && (m.upgrades || []).find(x => x.id === 'elev');
    if (p && p.name === 'マルチエレベーター') p.name = T('マルチエレベーター'); });
  // the wholesale shop's slot label for VoiceOver (shop.js builds it in Chinese: build_www.py wraps it in T)
  // the catalog's card for the app's own bakery machine (pay.js, as build_www.py writes it; always shown, 制作中)
  I18N.names({ zh: { 'こむぎ堂': '小麦堂' }, en: { 'こむぎ堂': 'Komugi-do' } }, {});
  // the bakery's goods by what they are (registered before econ.js, which names the goods when it loads)
  I18N.names({}, {
    zh: { 'bakery:anpan': '红豆面包', 'bakery:cream': '奶油面包', 'bakery:yakisoba': '炒面面包', 'bakery:shio': '盐面包', 'bakery:jam': '果酱面包', 'bakery:melon': '菠萝包',
      'bakery:wiener': '香肠面包', 'bakery:cornet': '巧克力螺', 'bakery:mentai': '明太子法棍', 'bakery:curry': '咖喱面包', 'bakery:agepan': '炸面包', 'bakery:tamago': '鸡蛋三明治',
      'bakery:croissant': '可颂', 'bakery:painchoco': '巧克力可颂', 'bakery:katsu': '炸猪排三明治', 'bakery:fruit': '水果三明治', 'bakery:shokupan': '高级吐司',
      'bakery:amaou': '熟草莓三明治', 'bakery:goldmelon': '金色菠萝包' },
    en: { 'bakery:anpan': 'Red Bean Bun', 'bakery:cream': 'Custard Bun', 'bakery:yakisoba': 'Yakisoba Roll', 'bakery:shio': 'Salt Butter Roll', 'bakery:jam': 'Jam Bun', 'bakery:melon': 'Melon Bun',
      'bakery:wiener': 'Sausage Roll', 'bakery:cornet': 'Chocolate Cornet', 'bakery:mentai': 'Mentaiko Baguette', 'bakery:curry': 'Curry Bun', 'bakery:agepan': 'Fried Sugar Roll', 'bakery:tamago': 'Egg Sandwich',
      'bakery:croissant': 'Croissant', 'bakery:painchoco': 'Pain au Chocolat', 'bakery:katsu': 'Pork Cutlet Sandwich', 'bakery:fruit': 'Fruit Sandwich', 'bakery:shokupan': 'Premium Milk Loaf',
      'bakery:amaou': 'Ripe Strawberry Sandwich', 'bakery:goldmelon': 'Golden Melon Bun' } });
  I18N.add('en', { 'こむぎ堂 · 现烤面包自贩机': 'Komugi-do · fresh bread machine', '面团在玻璃柜里发酵，一个个烤出来，切开夹馅，装袋递出': 'Dough proves in a glass cabinet, bakes one at a time, gets split and filled, and comes out bagged',
    '19 种面包，3 个改造：油炸锅、开酥机、三明治台': '19 breads, 3 upgrades: a fryer, a pastry sheeter, a sandwich table',
    // (the bakery's lines in the prototype's tables, built with T before its own script loads: econ.js, album.js, shop.js)
    '面包': 'Bread', '第{0}号料斗': 'Hopper {0}', '一个一个现烤，发酵跟不上时要等': 'Baked one at a time; waits when the proving can\'t keep up' });
  I18N.add('ja', { 'こむぎ堂 · 现烤面包自贩机': 'こむぎ堂 · 焼きたてパンの自販機', '面团在玻璃柜里发酵，一个个烤出来，切开夹馅，装袋递出': 'ガラスの発酵庫で生地がふくらみ、ひとつずつ焼いて、切って具をはさみ、袋に入れて出てくる',
    '19 种面包，3 个改造：油炸锅、开酥机、三明治台': 'パン 19 種、改造 3 つ：フライヤー、パイローラー、サンドイッチ台',
    '面包': 'パン', '第{0}号料斗': '{0} 番ホッパー', '一个一个现烤，发酵跟不上时要等': 'ひとつずつ焼く。発酵が追いつかないと待つ' });
  // the app's own takoyaki machine (a sample under review): its brand, its goods, its lines in the prototype's tables
  I18N.names({ zh: { 'てっぱん丸': '铁板丸' }, en: { 'てっぱん丸': 'Teppan-maru' } }, {
    zh: { 'teppan:sauce': '酱汁章鱼烧', 'teppan:negipon': '葱花柚子醋章鱼烧', 'teppan:terimayo': '照烧蛋黄酱章鱼烧', 'teppan:mentai': '明太子蛋黄酱章鱼烧', 'teppan:negishio': '葱盐章鱼烧',
      'teppan:cheese': '芝士章鱼烧', 'teppan:ootako': '大块章鱼烧', 'teppan:gold': '金色章鱼烧', 'teppan:butatama': '猪肉大阪烧', 'teppan:negiyaki': '葱烧', 'teppan:mix': '什锦大阪烧',
      'teppan:tonpei': '猪肉蛋卷', 'teppan:kaisen': '海鲜大阪烧', 'teppan:sosoba': '酱汁炒面', 'teppan:shiosoba': '盐味炒面', 'teppan:omusoba': '蛋包炒面', 'teppan:ikayaki': '鱿鱼烧',
      'teppan:dera': '加蛋鱿鱼烧' },
    en: { 'teppan:sauce': 'Takoyaki with Sauce', 'teppan:negipon': 'Scallion Ponzu Takoyaki', 'teppan:terimayo': 'Teriyaki Mayo Takoyaki', 'teppan:mentai': 'Mentaiko Mayo Takoyaki',
      'teppan:negishio': 'Scallion Salt Takoyaki', 'teppan:cheese': 'Cheese Takoyaki', 'teppan:ootako': 'Big Octopus Takoyaki', 'teppan:gold': 'Golden Takoyaki',
      'teppan:butatama': 'Pork Okonomiyaki', 'teppan:negiyaki': 'Negiyaki', 'teppan:mix': 'Mixed Okonomiyaki', 'teppan:tonpei': 'Tonpeiyaki', 'teppan:kaisen': 'Seafood Okonomiyaki',
      'teppan:sosoba': 'Yakisoba', 'teppan:shiosoba': 'Salt Yakisoba', 'teppan:omusoba': 'Omusoba', 'teppan:ikayaki': 'Ikayaki', 'teppan:dera': 'Ikayaki with Egg' } });
  I18N.add('en', { '铁板粉物': 'Griddle Snacks', 'てっぱん丸 · 铁板粉物自贩机': 'Teppan-maru · griddle snack machine',
    '章鱼烧在铁板上一颗颗翻面，大阪烧翻面、炒面翻炒、鱿鱼烧压板压熟，装盒递出': 'Takoyaki turned ball by ball on the griddle; okonomiyaki flipped, yakisoba tossed, ikayaki pressed; all packed and handed out',
    '18 种粉物，3 个改造：大阪烧铁板、炒面台、鱿鱼烧压板': '18 snacks, 3 upgrades: an okonomiyaki griddle, a yakisoba station, an ikayaki press',
    '章鱼烧': 'Takoyaki', '第{0}瓶酱': 'Bottle {0}', '一排一排地烤，铁板跟不上时要等': 'Cooked a row at a time; waits when the griddle can\'t keep up' });
  I18N.add('ja', { '铁板粉物': '鉄板粉もん', 'てっぱん丸 · 铁板粉物自贩机': 'てっぱん丸 · 鉄板粉もんの自販機',
    '章鱼烧在铁板上一颗颗翻面，大阪烧翻面、炒面翻炒、鱿鱼烧压板压熟，装盒递出': '鉄板でたこ焼きをひとつずつ返し、お好み焼きを返し、焼きそばを炒め、いか焼きをプレスして、パックで渡す',
    '18 种粉物，3 个改造：大阪烧铁板、炒面台、鱿鱼烧压板': '粉もん 18 種、改造 3 つ：お好み焼き鉄板、焼きそば台、いか焼きプレス',
    '章鱼烧': 'たこ焼き', '第{0}瓶酱': '{0} 番ボトル', '一排一排地烤，铁板跟不上时要等': '一列ずつ焼く。鉄板が追いつかないと待つ' });
  // machines sold in the shop (2026-10-24): the album says where to get them, and that they have no test run
  I18N.add('en', { '在商店里买': 'Sold in the shop', '在商店里看看': 'See it in the shop',
    '免费的机器都能试运转：货是满的，能点、能透视、能转，不计收入；改造可以免费试装，结束后拆掉。商店里的机器不试运转，买下就是你的。': 'Every free machine can be tried: shelves full, tap it, X-ray it, turn it, nothing earned; parts can be test-fitted free and come off afterwards. Machines from the shop have no test run: buy one and it is yours.' });
  I18N.add('ja', { '在商店里买': 'ショップで買える', '在商店里看看': 'ショップで見る',
    '免费的机器都能试运转：货是满的，能点、能透视、能转，不计收入；改造可以免费试装，结束后拆掉。商店里的机器不试运转，买下就是你的。': '無料の機械はどれも試運転できます：品物は満タン、タップ・透視・回転ができ、売上にはなりません。改造は無料で試せて、終わればはずれます。ショップの機械は試運転なし、買えばあなたのものです。' });
  // the catalog's ticket (店长证) and the 营业日印章 card (pay.js, through build_www.py)
  I18N.add('en', { '附送一张券：猫、外观、货品里自选一件': 'Comes with a ticket: pick any one cat, look or goods item',
    '可以免费换': 'Yours for free', '店长证的券 ×1：有这个标记的猫、外观、货品，任选一件': 'Licence ticket ×1: any one cat, look or goods item with this mark',
    '常客卡盖满了：有这个标记的货品、外观、装扮，任选一件': 'Stamp card full: any one goods, look or decor item with this mark', '券和印章分开用，各换一件': 'The ticket and the stamps are used separately, one item each',
    '盖满了 · 有印章标记的东西任选一件': 'Full · swap it for any one item with the stamp mark',
    '可选': 'Pick', '可换': 'Swap', '用店长证的券换': 'Use the licence ticket', '用 {0} 个印章换': 'Swap {0} stamps for it',
    '营业日印章': 'Shop-day stamps', '常客卡 {0}/{1}': 'Stamp card {0}/{1}',
    '盖满了 · 能换的都换完了，以后上新再来': 'Card full · nothing left to swap for now; come back when something new arrives',
    '每天补一次货，盖一个章 · 盖满 {0} 个换一件货品、外观或装扮': 'One stamp for each day you restock · {0} stamps swap for a goods, look or decor item',
    '常客卡盖满了 · 去商店换一件': 'Stamp card full · swap it in the shop', '常客卡盖了今天的章 · {0}/10': 'Today’s stamp is on your card · {0}/10' });
  I18N.add('ja', { '附送一张券：猫、外观、货品里自选一件': 'おまけの券つき：ねこ・外観・商品から好きなものをひとつ',
    '可以免费换': '無料でもらえる', '店长证的券 ×1：有这个标记的猫、外观、货品，任选一件': '店長証の券 ×1：このマークのついたねこ・外観・商品からひとつ',
    '常客卡盖满了：有这个标记的货品、外观、装扮，任选一件': 'スタンプカードがたまった：このマークのついた商品・外観・装いからひとつ', '券和印章分开用，各换一件': '券とスタンプは別々に使えて、それぞれひとつずつ',
    '盖满了 · 有印章标记的东西任选一件': 'たまりました · スタンプのマークがついたものからひとつ',
    '可选': '選べる', '可换': '交換', '用店长证的券换': '店長証の券で交換', '用 {0} 个印章换': 'スタンプ {0} 個で交換',
    '营业日印章': '営業日スタンプ', '常客卡 {0}/{1}': 'スタンプカード {0}/{1}',
    '盖满了 · 能换的都换完了，以后上新再来': 'たまりました · 交換できるものは今はありません。新しいものが入ったらまたどうぞ',
    '每天补一次货，盖一个章 · 盖满 {0} 个换一件货品、外观或装扮': '補充した日ごとにスタンプひとつ · {0} 個で商品・外観・装いとひとつ交換',
    '常客卡盖满了 · 去商店换一件': 'スタンプカードがたまった · ショップで交換', '常客卡盖了今天的章 · {0}/10': '今日のスタンプを押した · {0}/10' });
  I18N.add('en', { 'マルチエレベーター': 'Multi-elevator', '{0}：{1}，点一下换': '{0}: {1}, tap to change', '买下': 'Buy' });
  I18N.add('ja', { '{0}：{1}，点一下换': '{0}：{1}、タップで変更', '买下': '買う' });
  // the facts that named real companies, shops and models: our own parody names instead (user 2026-10-24, before the App
  // Store: 「保留史实，名字改成我们的魔改版」, 7-Eleven → 5-Eleven). Keyed by the prototype's Chinese, so the machines' own
  // scripts and their baked turning pictures stay as they are
  I18N.add('zh', {
    "1902 年东京银座的资生堂药局装了日本第一台汽水机（ソーダファウンテン）；后来绿色的哈密瓜苏打配香草冰淇淋，成了纯喫茶的招牌。": "1902 年东京银座的资升堂药局装了日本第一台汽水机（ソーダファウンテン）；后来绿色的哈密瓜苏打配香草冰淇淋，成了纯喫茶的招牌。",
    "1958 年大阪的「元禄寿司」，白石义明看着啤酒厂的传送带，开出了第一家回转寿司。": "1958 年大阪的「元乐寿司」，店主看着啤酒厂的传送带，开出了第一家回转寿司。",
    "1972 年川鉄推出面类自动调理贩卖机，到 1980 年约有 9000 台。": "1972 年川钢推出面类自动调理贩卖机，到 1980 年约有 9000 台。",
    "1979 年 7-Eleven 开始在便利店卖关东煮，从此冬天的收银台旁边总有一口格子锅。": "1979 年 5-Eleven 开始在便利店卖关东煮，从此冬天的收银台旁边总有一口格子锅。",
    "1981 年起，铃茂的寿司机器人一小时能捏约 1200 个饭团。": "1981 年起，铃森的寿司机器人一小时能捏约 1200 个饭团。",
    "Feed ME 的鲜榨机把榨过的果皮直接掉进机器下面的塑料袋；补货员每次来，除了倒橙子，还要换下装满的果皮袋。": "Feed YOU 的鲜榨机把榨过的果皮直接掉进机器下面的塑料袋；补货员每次来，除了倒橙子，还要换下装满的果皮袋。",
    "IJOOZ 一台能装约 360～400 个整橙，Feed ME 最多约 500 个。满满的橙子堆在玻璃后面，本身就是招牌。": "IJUUS 一台能装约 360～400 个整橙，Feed YOU 最多约 500 个。满满的橙子堆在玻璃后面，本身就是招牌。",
    "IJOOZ 这类鲜榨机，在日本约有 1300～1750 台。": "IJUUS 这类鲜榨机，在日本约有 1300～1750 台。",
    "JR 东日本的 acure 次世代自贩机用 47 英寸触屏代替样品和按钮，按季节、时段、气温推荐饮料，售罄的商品可以远程换掉。": "JQ 东日本的 ecure 次世代自贩机用 47 英寸触屏代替样品和按钮，按季节、时段、气温推荐饮料，售罄的商品可以远程换掉。",
    "JR 东日本的 acure 用 47 英寸触屏代替样品和按钮。": "JQ 东日本的 ecure 用 47 英寸触屏代替样品和按钮。",
    "MCL-RMS8 的格口分四档高度，每一格都能单独设成冷藏（1～15℃）或常温（15～25℃）。": "MLC-RSM9 的格口分四档高度，每一格都能单独设成冷藏（1～15℃）或常温（15～25℃）。",
    "くら寿司 从 2011 年起给转着的每一盘都罩上抗菌罩「鮮度くん」，盘子带芯片，转了约 350 米还没人拿就自动撤下。": "くろ寿司 从 2011 年起给转着的每一盘都罩上抗菌罩「鮮度ちゃん」，盘子带芯片，转了约 350 米还没人拿就自动撤下。",
    "ど冷えもん 会定期除霜：加热器把霜化掉、把水排走，再重新预冷；库温超出范围一段时间，或者商品过了保质期，也会自动停售。": "ど冷やもん 会定期除霜：加热器把霜化掉、把水排走，再重新预冷；库温超出范围一段时间，或者商品过了保质期，也会自动停售。",
    "ど冷えもん 的 MULTI 机型用「マルチエレベーター」两列同步升降，把商品送到取货口；还能分出冷藏 5℃、18℃ 和常温的格子。": "ど冷やもん 的 MULTI 机型用「マルチエレベーター」两列同步升降，把商品送到取货口；还能分出冷藏 5℃、18℃ 和常温的格子。",
    "ど冷えもん 的组合货架有四种模块：ツイン、ハーフ、シングル、クォーター（一层放 4 个杯装）。按商品大小换螺距，大件就拆掉隔板，让两根螺旋一起转。": "ど冷やもん 的组合货架有四种模块：ツイン、ハーフ、シングル、クォーター（一层放 4 个杯装）。按商品大小换螺距，大件就拆掉隔板，让两根螺旋一起转。",
    "サンデン 2024 年的储物柜 MCL-RMS8：自保持型电子锁（开锁后保持开锁）、自动闭门器、蓝色 LED，还留着应急的机械锁芯。老式的「朝市くん」不用电，投 100 日元开门，不找零。": "サンデイ 2024 年的储物柜 MLC-RSM9：自保持型电子锁（开锁后保持开锁）、自动闭门器、蓝色 LED，还留着应急的机械锁芯。老式的「朝市ちゃん」不用电，投 100 日元开门，不找零。",
    "サンデン MMV、マースウインテック MV-20 这类带式货架自贩机，用皮带把商品送到前端、再由升降台放进取货口，全程正放不翻，能卖便当、盖饭和蛋糕。": "サンデイ MMW、マルスウィンテック MV-22 这类带式货架自贩机，用皮带把商品送到前端、再由升降台放进取货口，全程正放不翻，能卖便当、盖饭和蛋糕。",
    "サンデン的「ど冷えもん」2021 年发售，几年就超过 5000 台。": "サンデイ的「ど冷やもん」2021 年发售，几年就超过 5000 台。",
    "パルサー 的 F-40LVM 有 40 格，一格放两盒鸡蛋；神户的神出たまごセンター 有 8 台鸡蛋机，库内 20℃，一天换三次蛋。": "パルサン 的 F-40LVN 有 40 格，一格放两盒鸡蛋；神户的神入たまごセンター 有 8 台鸡蛋机，库内 20℃，一天换三次蛋。",
    "富士電機的面机把碗高速转起来甩掉热水；川鉄的是把碗倾斜倒掉，配料不容易飞出去。": "富士山电机的面机把碗高速转起来甩掉热水；川钢的是把碗倾斜倒掉，配料不容易飞出去。",
    "川鉄的咖喱机用蒸汽给盘装米饭保温，机内的刀片划开料理包，把咖喱浇到饭上再出货；管理员要定期磨刀。": "川钢的咖喱机用蒸汽给盘装米饭保温，机内的刀片划开料理包，把咖喱浇到饭上再出货；管理员要定期磨刀。",
    "机器人拣货正在进自贩机和小店：auミニッツストア 由机器人包办补货、拣货、装袋；そばロボット 用两条机械臂，每小时能做约 150 份。": "机器人拣货正在进自贩机和小店：uaミニッツストア 由机器人包办补货、拣货、装袋；そばロボ太 用两条机械臂，每小时能做约 150 份。",
    "茨城的あらいやオートコーナー 从 1972 年起，店主在隔壁厨房现做烤肉便当，放进机内 60℃ 保温，按键后掉进取货口；工作日约卖 100 个，假日 200 个，卖完为止。": "茨城的あらいかオートコーナー 从 1972 年起，店主在隔壁厨房现做烤肉便当，放进机内 60℃ 保温，按键后掉进取货口；工作日约卖 100 个，假日 200 个，卖完为止。",
    "这台机器是虚构的：现实里没有全自动的定食机。最接近的是食券機（グローリー、NECマグナス 等，最多 64～100 个按钮），买下的瞬间厨房的打印机就出单，做好后叫号。": "这台机器是虚构的：现实里没有全自动的定食机。最接近的是食券機（グローリア、NEDマグナム 等，最多 64～100 个按钮），买下的瞬间厨房的打印机就出单，做好后叫号。",
    "鲷鱼烧一般认为是 1909 年东京麻布的「浪花家」做出来的：把当时卖得很好的今川烧换成鲷鱼的形状，因为鲷鱼是喜庆的鱼。": "鲷鱼烧一般认为是 1909 年东京麻布的「浪花堂」做出来的：把当时卖得很好的今川烧换成鲷鱼的形状，因为鲷鱼是喜庆的鱼。"
  });
  I18N.add('ja', {
    "1902 年东京银座的资生堂药局装了日本第一台汽水机（ソーダファウンテン）；后来绿色的哈密瓜苏打配香草冰淇淋，成了纯喫茶的招牌。": "1902 年、銀座の資升堂薬局に日本初のソーダファウンテンが置かれた。のちに緑のメロンソーダにバニラアイスが、純喫茶の定番になった。",
    "1958 年大阪的「元禄寿司」，白石义明看着啤酒厂的传送带，开出了第一家回转寿司。": "1958 年、大阪の「元楽寿司」。店主がビール工場のベルトコンベアを見て、最初の回転寿司を開いた。",
    "1972 年川鉄推出面类自动调理贩卖机，到 1980 年约有 9000 台。": "1972 年に川鋼が麺類自動調理販売機を発売、1980 年には約 9000 台。",
    "1979 年 7-Eleven 开始在便利店卖关东煮，从此冬天的收银台旁边总有一口格子锅。": "1979 年、ファイブ-イレブンがコンビニでおでんを売り始めた。それ以来、冬のレジ横にはいつも仕切りのある鍋がある。",
    "1981 年起，铃茂的寿司机器人一小时能捏约 1200 个饭团。": "1981 年から、鈴森のすしロボットは 1 時間に約 1200 個のシャリ玉を握れる。",
    "Feed ME 的鲜榨机把榨过的果皮直接掉进机器下面的塑料袋；补货员每次来，除了倒橙子，还要换下装满的果皮袋。": "Feed YOU の生しぼり機は、しぼった皮を機械の下のビニール袋に直接落とす。補充係は毎回オレンジを入れるだけでなく、満杯の皮袋も取り替える。",
    "IJOOZ 一台能装约 360～400 个整橙，Feed ME 最多约 500 个。满满的橙子堆在玻璃后面，本身就是招牌。": "IJUUS は丸ごとのオレンジを約 360～400 個、Feed YOU は最大約 500 個入る。ガラスの向こうに積まれたオレンジそのものが看板になる。",
    "IJOOZ 这类鲜榨机，在日本约有 1300～1750 台。": "IJUUS のような生しぼり機は、日本に約 1300～1750 台。",
    "JR 东日本的 acure 次世代自贩机用 47 英寸触屏代替样品和按钮，按季节、时段、气温推荐饮料，售罄的商品可以远程换掉。": "JQ 東日本の ecure 次世代自販機は、見本とボタンの代わりに 47 インチのタッチパネル。季節・時間帯・気温で飲み物をおすすめし、売り切れ商品は遠隔で差し替えられる。",
    "JR 东日本的 acure 用 47 英寸触屏代替样品和按钮。": "JQ 東日本の ecure は、見本とボタンの代わりに 47 インチのタッチパネル。",
    "MCL-RMS8 的格口分四档高度，每一格都能单独设成冷藏（1～15℃）或常温（15～25℃）。": "MLC-RSM9 のマスは四段階の高さで、一マスずつ冷蔵（1～15℃）か常温（15～25℃）に設定できる。",
    "くら寿司 从 2011 年起给转着的每一盘都罩上抗菌罩「鮮度くん」，盘子带芯片，转了约 350 米还没人拿就自动撤下。": "くろ寿司は 2011 年から回る皿すべてに抗菌カバー「鮮度ちゃん」をかぶせている。皿にはチップがあり、約 350 m 回って取られなければ自動で下げる。",
    "ど冷えもん 会定期除霜：加热器把霜化掉、把水排走，再重新预冷；库温超出范围一段时间，或者商品过了保质期，也会自动停售。": "ど冷やもん は定期的に霜取りをする：ヒーターで霜を溶かして水を排出し、また予冷する。庫内温度がしばらく範囲を外れたり、商品が期限を過ぎたりすると、自動で販売を止める。",
    "ど冷えもん 的 MULTI 机型用「マルチエレベーター」两列同步升降，把商品送到取货口；还能分出冷藏 5℃、18℃ 和常温的格子。": "ど冷やもん の MULTI 機種は「マルチエレベーター」で二列を同期して昇降させ、取り出し口まで運ぶ。冷蔵 5℃、18℃、常温の区画にも分けられる。",
    "ど冷えもん 的组合货架有四种模块：ツイン、ハーフ、シングル、クォーター（一层放 4 个杯装）。按商品大小换螺距，大件就拆掉隔板，让两根螺旋一起转。": "ど冷やもん の組み合わせ棚は四種類：ツイン、ハーフ、シングル、クォーター（一段にカップ 4 個）。商品の大きさでスパイラルのピッチを変え、大きいものは仕切りを外して二本のスパイラルを一緒に回す。",
    "サンデン 2024 年的储物柜 MCL-RMS8：自保持型电子锁（开锁后保持开锁）、自动闭门器、蓝色 LED，还留着应急的机械锁芯。老式的「朝市くん」不用电，投 100 日元开门，不找零。": "サンデイ 2024 年のロッカー MLC-RSM9：自己保持型電子ロック（解錠後は解錠のまま）、自動ドアクローザー、青い LED、非常用の機械式シリンダーも残る。昔ながらの「朝市ちゃん」は電気不要で、100 円を入れると扉が開き、おつりは出ない。",
    "サンデン MMV、マースウインテック MV-20 这类带式货架自贩机，用皮带把商品送到前端、再由升降台放进取货口，全程正放不翻，能卖便当、盖饭和蛋糕。": "サンデイ MMW、マルスウィンテック MV-22 のようなベルト棚の自販機は、ベルトで商品を前へ送り、リフトで取り出し口に置く。ずっと正立のままなので、弁当や丼、ケーキも売れる。",
    "サンデン的「ど冷えもん」2021 年发售，几年就超过 5000 台。": "サンデイの「ど冷やもん」は 2021 年発売、数年で 5000 台を超えた。",
    "パルサー 的 F-40LVM 有 40 格，一格放两盒鸡蛋；神户的神出たまごセンター 有 8 台鸡蛋机，库内 20℃，一天换三次蛋。": "パルサン の F-40LVN は 40 マスで、一マスにたまご二パック。神戸の神入たまごセンター には 8 台のたまご自販機があり、庫内 20℃、一日三回たまごを入れ替える。",
    "富士電機的面机把碗高速转起来甩掉热水；川鉄的是把碗倾斜倒掉，配料不容易飞出去。": "富士山電機の麺自販機はどんぶりを高速で回してお湯を飛ばす。川鋼のはどんぶりを傾けて捨てるので、具が飛びにくい。",
    "川鉄的咖喱机用蒸汽给盘装米饭保温，机内的刀片划开料理包，把咖喱浇到饭上再出货；管理员要定期磨刀。": "川鋼のカレー自販機は蒸気で皿のご飯を保温し、機内の刃がレトルトを切ってご飯にかけてから出す。管理者は定期的に刃を研がなければならない。",
    "机器人拣货正在进自贩机和小店：auミニッツストア 由机器人包办补货、拣货、装袋；そばロボット 用两条机械臂，每小时能做约 150 份。": "ロボットのピッキングは自販機や小さな店に広がっている：uaミニッツストア ではロボットが補充・ピッキング・袋詰めまで担い、そばロボ太 は二本のアームで一時間に約 150 食を作る。",
    "茨城的あらいやオートコーナー 从 1972 年起，店主在隔壁厨房现做烤肉便当，放进机内 60℃ 保温，按键后掉进取货口；工作日约卖 100 个，假日 200 个，卖完为止。": "茨城の あらいかオートコーナー では 1972 年から、店主が隣の厨房で焼肉弁当を作り、機内で 60℃ に保温、ボタンを押すと取り出し口に落ちてくる。平日約 100 個、休日 200 個、売り切れ次第終了。",
    "这台机器是虚构的：现实里没有全自动的定食机。最接近的是食券機（グローリー、NECマグナス 等，最多 64～100 个按钮），买下的瞬间厨房的打印机就出单，做好后叫号。": "この機械は架空です：全自動の定食機は現実にはない。いちばん近いのは食券機（グローリア、NEDマグナム など、ボタンは最大 64～100 個）で、買った瞬間に厨房のプリンターが注文を出し、できあがると番号で呼ばれる。",
    "鲷鱼烧一般认为是 1909 年东京麻布的「浪花家」做出来的：把当时卖得很好的今川烧换成鲷鱼的形状，因为鲷鱼是喜庆的鱼。": "たい焼きは 1909 年、東京・麻布の「浪花堂」が始めたとされる。よく売れていた今川焼きを、縁起のいい鯛の形にした。"
  });
  I18N.add('en', {
    "1902 年东京银座的资生堂药局装了日本第一台汽水机（ソーダファウンテン）；后来绿色的哈密瓜苏打配香草冰淇淋，成了纯喫茶的招牌。": "In 1902 the Shishodo pharmacy in Ginza installed Japan’s first soda fountain; later, green melon soda with vanilla ice cream became the jun-kissa classic.",
    "1958 年大阪的「元禄寿司」，白石义明看着啤酒厂的传送带，开出了第一家回转寿司。": "In 1958 in Osaka, a sushi chef watched a beer-bottling conveyor and opened the first conveyor-belt sushi shop, 「元楽寿司」.",
    "1972 年川鉄推出面类自动调理贩卖机，到 1980 年约有 9000 台。": "In 1972 Kawako launched its noodle-cooking vending machine; by 1980 there were about 9,000.",
    "1979 年 7-Eleven 开始在便利店卖关东煮，从此冬天的收银台旁边总有一口格子锅。": "In 1979 5-Eleven began selling oden in its stores; ever since, a divided pot has sat by the winter checkout.",
    "1981 年起，铃茂的寿司机器人一小时能捏约 1200 个饭团。": "From 1981, Suzumori’s sushi robots could shape about 1,200 rice balls an hour.",
    "Feed ME 的鲜榨机把榨过的果皮直接掉进机器下面的塑料袋；补货员每次来，除了倒橙子，还要换下装满的果皮袋。": "Feed YOU's fresh-squeeze machine drops the spent peel straight into a plastic bag underneath; on every visit the restocker tips in oranges and swaps the full peel bag.",
    "IJOOZ 一台能装约 360～400 个整橙，Feed ME 最多约 500 个。满满的橙子堆在玻璃后面，本身就是招牌。": "An IJUUS holds about 360–400 whole oranges, a Feed YOU up to about 500. A wall of oranges behind the glass is an advert in itself.",
    "IJOOZ 这类鲜榨机，在日本约有 1300～1750 台。": "There are about 1,300–1,750 fresh-squeeze machines like IJUUS in Japan.",
    "JR 东日本的 acure 次世代自贩机用 47 英寸触屏代替样品和按钮，按季节、时段、气温推荐饮料，售罄的商品可以远程换掉。": "JQ East's next-generation ecure machines swap the dummies and buttons for a 47-inch touchscreen, suggest drinks by season, time of day and temperature, and can replace sold-out items remotely.",
    "JR 东日本的 acure 用 47 英寸触屏代替样品和按钮。": "JQ East’s ecure machines swap the dummies and buttons for a 47-inch touchscreen.",
    "MCL-RMS8 的格口分四档高度，每一格都能单独设成冷藏（1～15℃）或常温（15～25℃）。": "MLC-RSM9 cells come in four heights, and each can be set to chilled (1–15℃) or room temperature (15–25℃) on its own.",
    "くら寿司 从 2011 年起给转着的每一盘都罩上抗菌罩「鮮度くん」，盘子带芯片，转了约 350 米还没人拿就自动撤下。": "Since 2011 Kuro Sushi has put an antibacterial dome, 「鮮度ちゃん」, over every plate going round; each plate carries a chip and is pulled after about 350 metres untaken.",
    "ど冷えもん 会定期除霜：加热器把霜化掉、把水排走，再重新预冷；库温超出范围一段时间，或者商品过了保质期，也会自动停售。": "ど冷やもん defrosts on a schedule: heaters melt the frost, the water drains, then it pre-cools again. If the inside stays out of range for a while, or goods pass their date, it stops selling by itself.",
    "ど冷えもん 的 MULTI 机型用「マルチエレベーター」两列同步升降，把商品送到取货口；还能分出冷藏 5℃、18℃ 和常温的格子。": "ど冷やもん's MULTI model uses a 「マルチエレベーター」 — two columns rising in sync — to bring goods to the flap, and can split the cabinet into 5℃ chilled, 18℃ and room-temperature sections.",
    "ど冷えもん 的组合货架有四种模块：ツイン、ハーフ、シングル、クォーター（一层放 4 个杯装）。按商品大小换螺距，大件就拆掉隔板，让两根螺旋一起转。": "ど冷やもん's modular racks come in four kinds: ツイン, ハーフ, シングル and クォーター (four cups per tier). The spiral pitch changes with the goods' size; for big items the divider comes out and two spirals turn together.",
    "サンデン 2024 年的储物柜 MCL-RMS8：自保持型电子锁（开锁后保持开锁）、自动闭门器、蓝色 LED，还留着应急的机械锁芯。老式的「朝市くん」不用电，投 100 日元开门，不找零。": "Sunday's 2024 locker MLC-RSM9: self-holding electronic locks (they stay unlocked once opened), automatic door closers, blue LEDs, and a mechanical cylinder kept for emergencies. The old 「朝市ちゃん」 needs no power: drop in a 100-yen coin and the door opens, no change given.",
    "サンデン MMV、マースウインテック MV-20 这类带式货架自贩机，用皮带把商品送到前端、再由升降台放进取货口，全程正放不翻，能卖便当、盖饭和蛋糕。": "Belt-shelf machines such as Sunday's MMW and Marus Wintec's MV-22 carry goods forward on belts and let a lift set them in the flap, upright the whole way, so they can sell bento, rice bowls and cakes.",
    "サンデン的「ど冷えもん」2021 年发售，几年就超过 5000 台。": "Sunday’s 「ど冷やもん」 went on sale in 2021 and passed 5,000 machines within a few years.",
    "パルサー 的 F-40LVM 有 40 格，一格放两盒鸡蛋；神户的神出たまごセンター 有 8 台鸡蛋机，库内 20℃，一天换三次蛋。": "Pulsan's F-40LVN has 40 cells, two egg cartons each; 神入たまごセンター in Kobe runs 8 egg machines at 20℃ inside and swaps the eggs three times a day.",
    "富士電機的面机把碗高速转起来甩掉热水；川鉄的是把碗倾斜倒掉，配料不容易飞出去。": "Fujiyama Electric's noodle machine spins the bowl fast to fling off the water; Kawako's tips the bowl to pour it out, so the toppings don't fly.",
    "川鉄的咖喱机用蒸汽给盘装米饭保温，机内的刀片划开料理包，把咖喱浇到饭上再出货；管理员要定期磨刀。": "Kawako's curry machine keeps plated rice warm with steam; a blade inside slits the pouch and pours the curry over the rice before it vends. The keeper has to sharpen the blade regularly.",
    "机器人拣货正在进自贩机和小店：auミニッツストア 由机器人包办补货、拣货、装袋；そばロボット 用两条机械臂，每小时能做约 150 份。": "Robot picking is coming to vending machines and small shops: at uaミニッツストア robots restock, pick and bag; そばロボ太 uses two arms to make about 150 servings an hour.",
    "茨城的あらいやオートコーナー 从 1972 年起，店主在隔壁厨房现做烤肉便当，放进机内 60℃ 保温，按键后掉进取货口；工作日约卖 100 个，假日 200 个，卖完为止。": "Since 1972 at あらいかオートコーナー in Ibaraki, the owner has cooked yakiniku bento in the kitchen next door and kept them at 60℃ inside the machine; one drops into the flap at a press. About 100 sell on weekdays, 200 on holidays, until they're gone.",
    "这台机器是虚构的：现实里没有全自动的定食机。最接近的是食券機（グローリー、NECマグナス 等，最多 64～100 个按钮），买下的瞬间厨房的打印机就出单，做好后叫号。": "This machine is made up: no fully automatic set-meal machine exists. The closest is the meal-ticket machine (Gloria, NED Magnum and others, up to 64–100 buttons): the moment you buy, the kitchen printer prints the order, and your number is called when it's ready.",
    "鲷鱼烧一般认为是 1909 年东京麻布的「浪花家」做出来的：把当时卖得很好的今川烧换成鲷鱼的形状，因为鲷鱼是喜庆的鱼。": "Taiyaki is usually credited to 「Naniwado」 in Azabu, Tokyo, in 1909: the popular imagawayaki remade in the shape of a sea bream, a fish for good fortune."
  });
})();
