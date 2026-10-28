/* Money, goods and the wholesale shop's rules — plain addition and subtraction only:
   a sale earns the item's sell price, every unit put into a machine costs its buy price.
   Goods come in tiers (★) that unlock with lifetime takings. Each week two goods per machine are in fashion
   (热销: they sell for half as much again, so a cheaper item in fashion can beat a pricier one), and every cat
   that has moved in adds a fifth to the kind of goods it likes.
   A machine's lineup is picked automatically by default (自动配货: always the best profit, trends and cats counted,
   new goods taken up as they unlock). Picking anything by hand switches that machine to a fixed lineup.
   Changing the lineup costs nothing: new units queue behind the old ones, which sell first.
   If a machine is empty and you cannot pay for even one unit, the wholesaler fills it for free with goods one tier
   below the best you have bought (保底). */
const ECON = (() => {
  // sold / stocked: the album — every product ever sold (count, first time) and ever put into a machine
  // grade: each machine's planned step per slot; ware: units in its warehouse; lots: what stands on the street; owned: bought
  const S = { bank: 0, life: 0, best: {}, plans: {}, auto: {}, hot: {}, free: {}, cap: {}, sold: {}, stocked: {}, grade: {}, ware: {}, lots: [], more: [], owned: {}, extra: {},
    wareOpen: false, wareGift: false, spec: {}, flyer: null, seed: 1, born: 0 };
  const subs = [];
  const changed = () => subs.forEach(f => f(S));

  /* ---------- catalogues ---------- */
  // drink: can / bottle; c = body colour, cap = cap colour (CSS vars); hot = sold warm (red tag)
  const D = (id, tier, name, buy, sell, kind, c, cap, tags, hot = false) => ({ id, tier, name, buy, sell, kind, c, cap, tags, hot });
  // spiral: g = glyph, row = which shelf it fits
  const P = (id, tier, row, name, buy, sell, g, c, tags) => ({ id, tier, row, name, buy, sell, g, c, tags });
  // cup: a drink on the menu; buy = ingredients for one cup; pw = canisters it draws from (珈琲 ココア 抹茶 ミルク)
  const C = (id, tier, name, buy, sell, o, tags) => ({ id, tier, name, buy, sell, ...o, tags });
  // ramen: every bowl is served hot (a hot-lover cat likes them all)
  const N = (id, tier, name, buy, sell, soup, noodle, top, more = []) => ({ id, tier, name, buy, sell, soup, noodle, top, hot: true, tags: ['hot', 'food', ...more] });
  // juice: squeezed in the machine, four fruits a cup (fruit colour for the hopper, juice colour for the cup)
  const J = (id, tier, name, buy, sell, fruit, juice, tags = []) => ({ id, tier, name, buy, sell, fruit, juice, tags });
  // auto: the retro auto-restaurant; row = which kitchen makes it (0 toast, 1 burger, 2 curry), fill = filling / box art / roux
  // look: d = topping colour (pepperoni, mayo, cutlet), o = 1 for melting drips (toast) or the topping shown (curry)
  const A = (id, tier, row, name, buy, sell, fill, look = {}, tags = []) => ({ id, tier, row, name, buy, sell, fill, d: look.d, o: look.o || 0, hot: true, tags: ['hot', 'food', ...tags] });
  // digital: boxed gadgets; g = what is in the box (drawn when it opens in the window), fill = its colour
  const Dg = (id, tier, name, buy, sell, g, fill, tags = ['goods']) => ({ id, tier, name, buy, sell, g, fill, tags });
  // frozen: pack = how it sits on the spiral (cup, box, tall, big, jar), g = what it is once the frost clears; req = a part it needs
  const Fz = (id, tier, row, name, buy, sell, pack, g, fill, d, more = {}) => ({ id, tier, row, name, buy, sell, pack, g, fill, d, req: more.req, tags: ['food', ...(more.tags || [])] });
  // locker: one bag per cell; row = which cells take it (0 ambient, 1 cold, 2 big); g = its look
  const Lk = (id, tier, row, name, buy, sell, g, c, tags = ['food']) => ({ id, tier, row, name, buy, sell, g, c, tags });
  // teishoku: a set meal; g = its main dish (drawn on the tray), c = its colour; fried ones need the fryer
  const Ts = (id, tier, name, buy, sell, g, c, more = {}) => ({ id, tier, name, buy, sell, g, c, req: more.req, hot: true, tags: ['hot', 'food', ...(more.tags || [])] });
  // sushi: a plate going round; g = what is on the rice (drawn on the plate), c = its colour; the seared ones need the torch
  const Su = (id, tier, name, buy, sell, g, c, more = {}) => ({ id, tier, name, buy, sell, g, c, req: more.req, tags: ['food', ...(more.tags || [])] });
  // oden: a cup of two pieces from one compartment; g = which piece, c = its colour; the miso ones need the miso pot
  // kissa: one drink of a 純喫茶: its vessel (a cup and saucer, or a glass), the coffee's (or soda's) colour, what goes on
  // top, the cup's pattern; the cream sodas need the soda fountain
  const Ks = (id, tier, name, buy, sell, ves, drink, more = {}) => ({ id, tier, name, jp: more.jp, buy, sell, g: id, ves, drink, fin: more.fin || [], pat: more.pat || 0, soda: !!more.soda, c: drink, req: more.soda ? 'soda' : undefined, hot: ves === 'cup', tags: ['coffee', ...(more.tags || [])] });
  // gacha: a series of capsule toys (the capsule's colour, the figure in it); the jumbo ones need the jumbo wheels
  const Gc = (id, tier, name, buy, sell, cap, fig, more = {}) => ({ id, tier, name, jp: more.jp, buy, sell, g: id, cap, fig, big: !!more.big, c: cap, req: more.big ? 'jumbo' : undefined, tags: ['toy', ...(more.tags || [])] });
  // kakigori: shaved ice under one syrup; top: what the syrup head adds with it (azuki, kinako, a bear's face, gold leaf);
  // the milk ones need the milk pump; jp: a shorter tile name
  const Kg = (id, tier, name, buy, sell, syrup, more = {}) => ({ id, tier, name, jp: more.jp, buy, sell, g: id, syrup, top: more.top || null, milk: !!more.milk, c: syrup, req: more.milk ? 'milk' : undefined, tags: ['cold', 'sweet', ...(more.tags || [])] });
  // taiyaki: a fish of one dough with one filling; the croissant ones need the croissant roll; jp: a shorter tile name
  const Tk = (id, tier, name, buy, sell, dough, fill, more = {}) => ({ id, tier, name, jp: more.jp, buy, sell, g: id, dough, fill, c: dough === 'plain' || dough === 'cro' ? fill : ({ matcha: '#7a9a3a', black: '#3a3030', pink: '#e08a96', gold: '#d8a020' })[dough], req: more.req, hot: true, tags: ['hot', 'food', 'sweet', ...(more.tags || [])] });
  const Od = (id, tier, name, buy, sell, g, c, more = {}) => ({ id, tier, name, buy, sell, g, c, req: more.req, hot: true, tags: ['hot', 'food', ...(more.tags || [])] });
  const GOODS = {
    drink: [
      D('water', 1, 'ミズイロ天然水', 60, 110, 'bottle', 'ice', 'blue', ['water']),
      D('melon', 1, 'メロンソーダ', 75, 140, 'can', 'lime', 'ice', ['can', 'soda']),
      D('peach', 1, 'ピーチティー', 80, 150, 'bottle', 'rose', 'ice', ['tea']),
      D('coffee', 1, 'ホットコーヒー', 70, 130, 'can', 'brown', 'ice', ['can', 'hot'], true),
      D('corn', 1, 'コーンスープ', 70, 130, 'can', 'yellow', 'ice', ['can', 'hot'], true),
      D('matcha', 2, '冷やし抹茶', 140, 240, 'bottle', 'lime', 'ice', ['tea']),
      D('ramune', 2, 'ラムネ', 130, 220, 'bottle', 'cyan', 'blue', ['soda']),
      D('shake', 2, 'ミルクセーキ', 140, 230, 'can', 'ice', 'ice', ['can', 'sweet']),
      D('hojicha', 2, 'ほうじ茶ラテ', 150, 250, 'can', 'amber', 'ice', ['can', 'hot'], true),
      { ...D('oden', 2, 'おでん缶', 160, 290, 'can', 'yellow', 'ice', ['can', 'hot', 'food'], true), req: 'heatpump' },
      D('nightsoda', 3, '夜空サイダー', 600, 1000, 'bottle', 'violet', 'cyan', ['soda']),
      D('peachland', 3, '桃源郷ジュース', 700, 1200, 'bottle', 'rose', 'yellow', ['sweet']),
      D('cocoa', 3, '黒豆ココア', 650, 1100, 'can', 'brown', 'ice', ['can', 'hot', 'sweet'], true),
      D('goldcorn', 4, '金のコーンスープ', 6000, 10000, 'can', 'yellow', 'ice', ['can', 'hot', 'rare'], true),
      D('fuji', 4, '富士の雪どけ水', 5500, 9500, 'bottle', 'ice', 'blue', ['water', 'rare']),
      D('meteor', 5, '流れ星エナジー', 60000, 100000, 'can', 'cyan', 'ice', ['can', 'rare']),
      D('moon', 5, '月面の水', 70000, 120000, 'bottle', 'violet', 'ice', ['water', 'rare']),
      // (v0.39) ご当地ドリンク, bought in the catalog: one per ★, earning like the best of its ★ (a hair above, so
      // auto-assort puts them out); hidden everywhere until bought (listed), never part of a free series
      ...[D('sanpin', 1, '沖縄さんぴん茶', 82, 153, 'bottle', 'amber', 'ice', ['tea']), D('guarana', 2, '北海道ガラナ', 153, 255, 'can', 'brown', 'ice', ['can', 'soda']),
        D('hakuto', 3, '岡山白桃ネクター', 714, 1224, 'can', 'rose', 'ice', ['can', 'sweet']), D('ringo', 4, '信州りんごサイダー', 6120, 10200, 'bottle', 'lime', 'rose', ['soda', 'rare']),
        D('gyokuro', 5, '宇治玉露', 71400, 122400, 'bottle', 'lime', 'ice', ['tea', 'rare'])].map(g => ({ ...g, paid: 'goods-gotochi' })),
    ],
    spiral: [
      P('consomme', 1, 0, 'コンソメ', 90, 160, 'chips', 'yellow', ['snack']), P('chili', 1, 0, 'チリ', 90, 160, 'chips', 'red', ['snack']),
      P('nori', 1, 0, 'のり塩', 90, 160, 'chips', 'lime', ['snack']), P('ume', 1, 0, 'うめ', 90, 160, 'chips', 'violet', ['snack']),
      P('truffle', 2, 0, 'トリュフ塩', 170, 290, 'chips', 'amber', ['snack']), P('wasabi', 2, 0, 'わさび', 160, 280, 'chips', 'cyan', ['snack']),
      P('goldchips', 3, 0, '金箔ポテト', 800, 1400, 'chips', 'yellow', ['snack', 'rare']),
      P('milkchoco', 1, 1, 'ミルクチョコ', 70, 130, 'choco', 'brown', ['sweet']), P('strawcandy', 1, 1, 'いちごキャンディ', 60, 110, 'candy', 'rose', ['sweet']),
      P('mintchoco', 1, 1, 'ミントチョコ', 70, 130, 'choco', 'cyan', ['sweet']), P('lemoncandy', 1, 1, 'レモンキャンディ', 60, 110, 'candy', 'yellow', ['sweet']),
      P('namachoco', 2, 1, '生チョコ', 160, 280, 'choco', 'rose', ['sweet']), P('konpeito', 2, 1, '金平糖', 150, 260, 'candy', 'violet', ['sweet']),
      P('rubychoco', 3, 1, 'ルビーチョコ', 700, 1250, 'choco', 'red', ['sweet', 'rare']),
      P('shoyu', 1, 2, 'しょうゆ麺', 120, 210, 'cup', 'red', ['food']), P('curry', 1, 2, 'カレー麺', 120, 210, 'cup', 'amber', ['food']),
      P('salmon', 1, 2, 'しゃけ', 85, 150, 'onigiri', 'rose', ['food']), P('umeboshi', 1, 2, 'うめぼし', 85, 150, 'onigiri', 'red', ['food']),
      P('tonkotsu', 2, 2, 'とんこつ麺', 200, 350, 'cup', 'ice', ['food']), P('ikura', 2, 2, 'いくら', 190, 330, 'onigiri', 'amber', ['food']),
      P('lobster', 3, 2, '伊勢海老麺', 900, 1600, 'cup', 'red', ['food', 'rare']),
      P('duck', 1, 3, 'アヒル', 170, 300, 'duck', 'yellow', ['goods']), P('umbrella', 1, 3, '折りたたみ傘', 280, 500, 'umbrella', 'rose', ['goods']),
      P('battery', 1, 3, '電池', 140, 240, 'battery', 'amber', ['goods']), P('cassette', 1, 3, 'カセット', 210, 380, 'cassette', 'lime', ['goods']),
      P('vhs2', 2, 3, 'ビデオ', 270, 480, 'vhs', 'cyan', ['goods']), P('blueduck', 2, 3, 'ソーダアヒル', 260, 460, 'duck', 'cyan', ['goods']),
      P('goldduck', 3, 3, '金のアヒル', 1500, 2600, 'duck', 'amber', ['goods', 'rare']),
      P('water2', 1, 4, '天然水', 60, 110, 'bottle-up', 'ice', ['water']), P('peachbtl', 1, 4, 'ピーチ', 85, 150, 'bottle-up', 'rose', ['sweet']),
      P('maneki', 1, 4, '招き猫', 560, 980, 'maneki', 'ice', ['goods', 'rare']), P('vhs', 1, 4, 'ビデオ', 270, 480, 'vhs', 'violet', ['goods']),
      P('ramunebtl', 2, 4, 'ラムネ', 130, 220, 'bottle-up', 'cyan', ['soda']), P('goldneko', 3, 4, '金の招き猫', 3000, 5200, 'maneki', 'yellow', ['goods', 'rare']),
      // the twin spiral's wide lane (row 5): boxed things two coils push together
      { ...P('cookietin', 1, 5, 'クッキー缶', 420, 760, 'cookietin', 'blue', ['sweet']), req: 'twin' }, { ...P('omiyage', 2, 5, 'おみやげ箱', 650, 1150, 'omiyage', 'red', ['sweet']), req: 'twin' },
      { ...P('plush', 3, 5, 'ねこのぬいぐるみ', 2000, 3600, 'plush', 'amber', ['goods']), req: 'twin' }, { ...P('melonbox', 3, 5, 'マスクメロン', 4200, 7400, 'melonbox', 'lime', ['rare']), req: 'twin' },
    ],
    cup: [
      C('blend', 1, 'ブレンド', 40, 120, { hot: true, pw: [0], liq: '#3e2414' }, ['hot']),
      C('latte', 1, 'カフェラテ', 55, 150, { hot: true, pw: [0, 3], liq: '#b48558' }, ['hot', 'sweet']),
      C('cocoa', 1, 'ココア', 50, 140, { hot: true, pw: [1, 3], liq: '#74472a' }, ['hot', 'sweet']),
      C('matcha', 1, '抹茶ラテ', 65, 170, { ice: true, pw: [2, 3], liq: '#93c46e' }, ['sweet']),
      C('icecoffee', 1, 'アイスコーヒー', 45, 130, { ice: true, pw: [0], liq: '#2e1b0f' }, []),
      C('lemontea', 1, 'レモンティー', 40, 130, { ice: true, pw: [], liq: '#e6c056' }, ['tea']),
      C('caramel', 2, 'キャラメルラテ', 110, 260, { hot: true, pw: [0, 3], liq: '#c08a4e' }, ['hot', 'sweet']),
      C('kokuto', 2, '黒糖ミルク', 100, 240, { ice: true, pw: [3], liq: '#d8b98a' }, ['sweet']),
      C('hojicha', 2, 'ほうじ茶ラテ', 105, 250, { hot: true, pw: [2, 3], liq: '#a0703f' }, ['hot', 'sweet']),
      C('nightblend', 3, '夜空ブレンド', 450, 1100, { hot: true, pw: [0], liq: '#2a1a3a' }, ['hot', 'rare']),
      // the mill's fresh-ground menu (2026-10-18)
      { ...C('mblend', 2, '挽きたてブレンド', 120, 290, { hot: true, mill: true, jp: '挽きたて', pw: [], liq: '#3a2010' }, ['hot']), req: 'mill' },
      { ...C('mlatte', 2, '挽きたてラテ', 135, 310, { hot: true, mill: true, jp: 'ミルラテ', pw: [3], liq: '#a87a4e' }, ['hot', 'sweet']), req: 'mill' },
      { ...C('mocha', 3, 'カフェモカ', 500, 1200, { hot: true, mill: true, pw: [1, 3], liq: '#5a3420' }, ['hot', 'sweet']), req: 'mill' },
      C('goldmatcha', 3, '金の抹茶', 500, 1200, { ice: true, pw: [2, 3], liq: '#c6d65a' }, ['sweet', 'rare']),
    ],
    // ramen: a bowl of noodles, finished in the machine (soup, noodle and topping colours for the bowl)
    ramen: [
      N('kake', 1, 'かけうどん', 90, 260, '#c98a4b', '#fbf3dc', '#7fc96b'), N('tanuki', 1, 'たぬきそば', 100, 280, '#8a5a32', '#8c6d55', '#f2c46a'),
      N('shoyu', 1, '醤油ラーメン', 110, 300, '#7a4a2a', '#f3d27a', '#ff8fa8'), N('kitsune', 1, 'きつねうどん', 105, 290, '#c98a4b', '#fbf3dc', '#d9963b'),
      N('tenpura', 2, '天ぷらうどん', 180, 430, '#c98a4b', '#fbf3dc', '#ffcc66'), N('miso', 2, '味噌ラーメン', 190, 450, '#c7954f', '#f3d27a', '#f5e6a8'),
      N('tsukimi', 2, '月見そば', 170, 410, '#8a5a32', '#8c6d55', '#ffd23f'),
      N('kamo', 3, '鴨南蛮そば', 700, 1500, '#7a4a2a', '#8c6d55', '#b04a3a'), N('tonkotsu', 3, '豚骨ラーメン', 650, 1400, '#efe4cf', '#f7f0d8', '#c0784a'),
      N('nabeyaki', 4, '鍋焼きうどん', 6000, 12000, '#b06a3a', '#fbf3dc', '#ff7a6b', ['rare']), N('iseebi', 5, '伊勢海老ラーメン', 60000, 120000, '#e0704a', '#f3d27a', '#ff4f3a', ['rare']),
    ],
    // juice: one fruit per hopper compartment; buy = four fruits (one cup)
    juice: [
      J('mikan', 1, '温州みかん', 120, 300, '#ff9a2e', '#ffb347'), J('orange', 1, 'オレンジ', 130, 320, '#ff8a1e', '#ffa62b'),
      J('lemon', 1, 'はちみつレモン', 140, 330, '#ffe14a', '#fff07a', ['sweet']), J('apple', 1, 'りんご', 150, 350, '#e8453a', '#f6d27a', ['sweet']),
      J('grapefruit', 2, 'グレープフルーツ', 220, 520, '#ffb08a', '#ff9a8a'), J('iyokan', 2, '伊予柑', 230, 540, '#ff7a1e', '#ffb347'),
      J('yuzu', 2, 'ゆずはちみつ', 240, 560, '#ffd23f', '#ffe98a', ['sweet']),
      J('dekopon', 3, 'デコポン', 700, 1500, '#ff8c1a', '#ffa83a'), J('kanpei', 3, '甘平', 750, 1600, '#ffa02a', '#ffc04a', ['sweet']),
      J('madonna', 4, '紅まどんな', 6000, 12000, '#ff5a1a', '#ff8a3a', ['rare']), J('ougon', 5, '特しぼり黄金柑', 60000, 120000, '#ffd000', '#ffe45a', ['rare']),
    ],
    // frozen: each shelf takes one size of pack (row 0 cups, 1 flat boxes, 2 tall boxes, 3 big)
    frozen: [
      Fz('vanilla', 1, 0, 'バニラアイス', 100, 260, 'cup', 'cup', '#fff4d6', '#3f7fff', { tags: ['sweet'] }), Fz('matcha', 1, 0, '抹茶アイス', 110, 280, 'cup', 'cup', '#9bd06a', '#2f8a3a', { tags: ['sweet'] }),
      Fz('choco', 1, 0, 'チョコアイス', 110, 280, 'cup', 'cup', '#7a4a2a', '#a8261a', { tags: ['sweet'] }), Fz('strawberry', 2, 0, 'いちごアイス', 190, 450, 'cup', 'cup', '#ff8fb0', '#e8453a', { tags: ['sweet'] }),
      Fz('gyoza', 1, 1, '餃子', 160, 420, 'box', 'gyoza', '#f2d29a', '#e8453a'), Fz('yakitori', 2, 1, '焼き鳥', 230, 520, 'box', 'yakitori', '#a8642a', '#2a2f3a'), Fz('karaage', 2, 1, 'からあげ', 220, 500, 'box', 'karaage', '#d89040', '#ffb020'),
      Fz('chahan', 1, 2, 'チャーハン', 180, 480, 'tall', 'chahan', '#f2c46a', '#ff8a1e'), Fz('ramenkit', 2, 2, '冷凍ラーメン', 330, 780, 'tall', 'ramen', '#c98a4b', '#c8452f'), Fz('tsukemen', 3, 2, 'つけ麺', 700, 1500, 'tall', 'tsukemen', '#8a5a32', '#141018'),
      Fz('pizza', 1, 3, '冷凍ピザ', 260, 680, 'big', 'pizza', '#e8453a', '#2f8a3a'), Fz('cake', 3, 3, 'びんケーキ', 650, 1400, 'jar', 'jar', '#ff8fb0', '#ffd23f', { req: 'elev', tags: ['sweet'] }),
      Fz('sashimi', 4, 3, '刺身セット', 6000, 12000, 'big', 'sashimi', '#ff8a5a', '#2a6ad9', { req: 'elev', tags: ['rare'] }), Fz('crab', 5, 3, 'ズワイガニ', 60000, 120000, 'big', 'crab', '#e8453a', '#2a6ad9', { tags: ['rare'] }),
    ],
    // locker: produce at ¥100 in the old cells; eggs and fruit need the cold cells, watermelon and rice the big ones
    locker: [
      Lk('tomato', 1, 0, 'トマト', 40, 100, 'tomato', '#e8453a'), Lk('cucumber', 1, 0, 'きゅうり', 35, 100, 'cucumber', '#3a9a3a'), Lk('eggplant', 1, 0, 'なす', 40, 100, 'eggplant', '#6a3a8a'),
      Lk('potato', 1, 0, 'じゃがいも', 35, 100, 'potato', '#c8964a'), Lk('onion', 1, 0, 'たまねぎ', 35, 100, 'onion', '#e0a040'),
      Lk('carrot', 2, 0, 'にんじん', 80, 200, 'carrot', '#f08a2a'), Lk('corn', 2, 0, 'とうもろこし', 90, 220, 'corn', '#f2c43a'), Lk('daikon', 2, 0, '大根', 70, 180, 'daikon', '#e6e2d6'),
      Lk('shiitake', 3, 0, '原木しいたけ', 280, 650, 'shiitake', '#7a4a2a'),
      Lk('egg', 1, 1, 'たまご 10個', 90, 220, 'egg', '#f6ecd6'), Lk('strawberry', 2, 1, 'いちご', 200, 450, 'strawberry', '#e8263a', ['food', 'sweet']), Lk('redegg', 3, 1, '赤たまご', 300, 700, 'redegg', '#d8945a'),
      Lk('blueberry', 3, 1, 'ブルーベリー', 320, 720, 'blueberry', '#3a4a9a', ['food', 'sweet']),
      Lk('hakusai', 1, 2, '白菜', 120, 300, 'hakusai', '#9ad06a'), Lk('watermelon', 2, 2, 'スイカ', 350, 800, 'watermelon', '#3a9a3a', ['food', 'sweet']), Lk('rice', 3, 2, '新米 5kg', 900, 2000, 'rice', '#e8453a'),
      Lk('melon', 4, 2, 'マスクメロン', 6000, 12000, 'melon', '#c8e09a', ['food', 'sweet', 'rare']), Lk('matsutake', 5, 2, '松茸かご', 60000, 120000, 'matsutake', '#7a4a22', ['food', 'rare']),
    ],
    // teishoku: six set meals on the ticket machine
    teishoku: [
      Ts('natto', 1, '納豆定食', 140, 380, 'natto', '#a8742a'), Ts('hiyayakko', 1, '冷奴定食', 160, 420, 'hiyayakko', '#f6f2e6'), Ts('tamagoyaki', 1, '卵焼き定食', 165, 430, 'tamagoyaki', '#ffd23f'),
      Ts('shogayaki', 1, '生姜焼き定食', 210, 520, 'shogayaki', '#a8642a'), Ts('sabamiso', 1, 'さば味噌定食', 220, 540, 'sabamiso', '#8a6a4a'), Ts('nikujaga', 1, '肉じゃが定食', 200, 500, 'nikujaga', '#d8964a'),
      Ts('hamburg', 2, 'ハンバーグ定食', 300, 700, 'hamburg', '#5a3218'), Ts('yakizakana', 2, '焼き鮭定食', 280, 650, 'yakizakana', '#f08a6a'),
      Ts('karaage', 1, '唐揚げ定食', 200, 500, 'karaage', '#d8902a', { req: 'fryer' }), Ts('ebifry', 2, 'エビフライ定食', 300, 700, 'ebifry', '#e8a23a', { req: 'fryer' }),
      Ts('tonkatsu', 2, 'とんかつ定食', 320, 720, 'tonkatsu', '#c8862a', { req: 'fryer' }), Ts('tempura', 3, '天ぷら定食', 780, 1650, 'tempura', '#f2c45a', { req: 'fryer' }),
      Ts('sukiyaki', 3, 'すき焼き定食', 750, 1600, 'sukiyaki', '#6a3a1a'), Ts('wagyu', 4, '黒毛和牛ステーキ定食', 6000, 12000, 'wagyu', '#c8645a', { tags: ['rare'] }),
      Ts('unagi', 5, '特上うな重', 60000, 120000, 'unagi', '#7a3a12', { tags: ['rare'] }),
    ],
    // kissa: four slots of beans (or syrup)
    kissa: [
      Ks('blend', 1, 'ブレンド', 85, 230, 'cup', '#4a2814', { pat: 0 }), Ks('american', 1, 'アメリカン', 85, 230, 'cup', '#7a4a24', { pat: 1 }),
      Ks('iced', 1, 'アイスコーヒー', 90, 240, 'glass', '#3a1e0e', { jp: 'アイス' }), Ks('aulait', 1, 'カフェオレ', 90, 240, 'cup', '#b8875a', { fin: ['milk'], pat: 2 }),
      Ks('wiener', 2, 'ウインナーコーヒー', 240, 560, 'cup', '#4a2814', { fin: ['cream'], pat: 4, jp: 'ウインナー' }), Ks('mocha', 2, 'モカ', 230, 540, 'cup', '#5a3018', { pat: 3 }),
      Ks('float', 2, 'コーヒーフロート', 250, 580, 'glass', '#3a1e0e', { fin: ['ice'], jp: 'フロート' }),
      Ks('melonsoda', 2, 'クリームソーダ', 260, 600, 'glass', '#5ac83a', { fin: ['ice', 'cherry'], soda: true }),
      Ks('kilimanjaro', 3, 'キリマンジャロ', 700, 1500, 'cup', '#3a1e0e', { pat: 5, jp: 'キリマン' }), Ks('guatemala', 3, 'グアテマラ', 700, 1500, 'cup', '#4a2814', { pat: 6 }),
      Ks('icedaulait', 3, 'アイスオレ', 720, 1550, 'glass', '#b8875a', { fin: ['milk'] }),
      Ks('bluesoda', 3, 'ブルーソーダ', 740, 1580, 'glass', '#3a8aff', { fin: ['ice', 'cherry'], soda: true }),
      Ks('bluemountain', 4, 'ブルーマウンテン', 6000, 12000, 'cup', '#4a2814', { pat: 7, jp: 'ブルマン', tags: ['rare'] }),
      Ks('royale', 4, 'カフェ・ロワイヤル', 6100, 12200, 'cup', '#3a1e0e', { fin: ['flame'], pat: 1, jp: 'ロワイヤル', tags: ['rare'] }),
      Ks('ichigosoda', 4, 'いちごソーダ', 6200, 12400, 'glass', '#ff6a8a', { fin: ['ice', 'cherry'], soda: true, tags: ['rare'] }),
      Ks('kopiluwak', 5, 'コピ・ルアク', 60000, 120000, 'cup', '#2a140a', { pat: 8, tags: ['rare'] }),
    ],
    // gacha: four capsule globes
    gacha: [
      Gc('neko', 1, 'ねこ', 80, 200, '#ff8fb8', 'neko'), Gc('sushi', 1, 'おすし', 80, 200, '#e8453a', 'sushi'), Gc('jihanki', 1, 'じはんき', 80, 200, '#3a8aff', 'jihanki'), Gc('dobutsu', 1, 'どうぶつ', 80, 200, '#5ac83a', 'bear'),
      Gc('kyoryu', 2, 'きょうりゅう', 230, 540, '#ff9a2a', 'dino'), Gc('obake', 2, 'おばけ', 230, 540, '#a07ae0', 'ghost'), Gc('minifood', 2, 'ミニフード', 240, 560, '#ffd23f', 'food'),
      Gc('jsushi', 2, 'ジャンボおすし', 270, 620, '#e8453a', 'sushi', { big: true }),
      Gc('kingyo', 3, 'きんぎょ', 700, 1500, '#ff6a3a', 'kingyo'), Gc('daruma', 3, 'だるま', 700, 1500, '#c8283a', 'daruma'), Gc('penguin', 3, 'ペンギン', 720, 1550, '#2a3a6a', 'penguin'),
      Gc('jneko', 3, 'ジャンボねこ', 760, 1620, '#ff8fb8', 'neko', { big: true }),
      Gc('uchu', 4, 'うちゅう', 6000, 12000, '#3a2a8a', 'rocket', { tags: ['rare'] }), Gc('hoseki', 4, 'ほうせき', 6100, 12200, '#2ad8c8', 'gem', { tags: ['rare'] }),
      Gc('jkyoryu', 4, 'ジャンボきょうりゅう', 6200, 12400, '#ff9a2a', 'dino', { big: true, jp: 'ジャンボ恐竜', tags: ['rare'] }),
      Gc('maneki', 5, 'きんのまねきねこ', 60000, 120000, '#ffd23f', 'maneki', { jp: 'きんまねき', tags: ['rare'] }),
    ],
    // kakigori: four syrup bottles on the syrup head
    kakigori: [
      Kg('ichigo', 1, 'いちご', 85, 230, '#e83a4a'), Kg('melon', 1, 'メロン', 85, 230, '#5ac83a'), Kg('lemon', 1, 'レモン', 85, 230, '#ffe04a'), Kg('bluehawaii', 1, 'ブルーハワイ', 90, 240, '#3a8aff'),
      Kg('mizore', 2, 'みぞれ', 230, 540, '#dfeaf6'), Kg('mango', 2, 'マンゴー', 250, 580, '#ffa82a'), Kg('budou', 2, 'ぶどう', 240, 560, '#8a3aa8'),
      Kg('ichigomilk', 2, 'いちごミルク', 270, 620, '#ff8aa8', { milk: true }),
      Kg('ujimatcha', 3, '宇治抹茶', 700, 1500, '#5a8a2a'), Kg('ujikintoki', 3, '宇治金時', 740, 1580, '#5a8a2a', { top: 'azuki' }), Kg('kuromitsu', 3, '黒蜜きなこ', 720, 1550, '#3a1a0a', { top: 'kinako' }),
      Kg('milkkintoki', 3, 'ミルク金時', 760, 1620, '#f6efe0', { milk: true, top: 'azuki' }),
      Kg('tennen', 4, '天然氷いちご', 6000, 12000, '#c8102a', { jp: '天然氷', tags: ['rare'] }), Kg('houjicha', 4, 'ほうじ茶', 6100, 12200, '#8a5a2a', { tags: ['rare'] }),
      Kg('shirokuma', 4, '白熊', 6200, 12400, '#f6efe0', { milk: true, top: 'bear', tags: ['rare'] }),
      Kg('kinpaku', 5, '金箔宇治金時', 60000, 120000, '#5a8a2a', { top: 'gold', jp: '金箔金時', tags: ['rare'] }),
    ],
    // bakery (the app's own machine, 2026-10-23): four hoppers on the rack; dough × shape × how it is filled. req: the
    // upgrade that makes it (fryer, pie roller, sandwich table)
    // (sold in the shop, m-bakery: the goods are there for everyone; the album and the street count them once it is bought)
    bakery: [
      // (the menu tile's short name where the full one is long)
      ...(JP => [
      ...[['anpan', 1, 'あんパン', 90, 240, 'white', 'round', 'inject', '#5a2a22'], ['cream', 1, 'クリームパン', 95, 250, 'white', 'round', 'inject', '#f6d860'],
        ['yakisoba', 1, '焼きそばパン', 105, 280, 'white', 'roll', 'split', '#a8642a'], ['shio', 1, '塩パン', 85, 220, 'white', 'roll', 'salt', '#fff8e0'],
        ['jam', 1, 'ジャムパン', 90, 240, 'white', 'round', 'inject', '#d8303a'],
        ['melon', 2, 'メロンパン', 240, 560, 'melon', 'round', 'none', '#e2b04a'], ['wiener', 2, 'ウインナーロール', 250, 580, 'white', 'roll', 'split', '#c8503a'],
        ['cornet', 2, 'チョココロネ', 250, 590, 'white', 'cornet', 'inject', '#5a3018'], ['mentai', 2, '明太フランス', 260, 600, 'white', 'roll', 'split', '#ff8a7a'],
        ['curry', 2, 'カレーパン', 260, 610, 'fried', 'round', 'inject', '#b8702a', 'fryer'], ['agepan', 2, 'あげパン', 240, 570, 'fried', 'roll', 'glaze', '#d8b080', 'fryer'],
        ['tamago', 2, 'たまごサンド', 270, 620, 'loaf', 'loaf', 'sando', '#f6e070', 'sando'],
        ['croissant', 3, 'クロワッサン', 700, 1500, 'cro', 'crescent', 'none', '#c06e22', 'lam'], ['painchoco', 3, 'パン・オ・ショコラ', 720, 1550, 'cro', 'roll', 'inject', '#5a3018', 'lam'],
        ['katsu', 3, 'カツサンド', 740, 1600, 'loaf', 'loaf', 'sando', '#a8642a', 'sando'], ['fruit', 3, 'フルーツサンド', 760, 1620, 'loaf', 'loaf', 'sando', '#ff8aa0', 'sando'],
        ['shokupan', 4, '高級食パン', 6000, 12000, 'loaf', 'loaf', 'none', '#f0c880', null, ['rare']], ['amaou', 4, '完熟いちごサンド', 6200, 12400, 'loaf', 'loaf', 'sando', '#e8203a', 'sando', ['rare']],
        ['goldmelon', 5, '金のメロンパン', 60000, 120000, 'melon', 'round', 'none', '#ffd23f', null, ['rare']]]
        .map(([id, tier, name, buy, sell, dough, shape, how, fill, req, tags]) => ({ id, tier, name, jp: JP[id], buy, sell, g: id, dough, shape, how, fill, c: fill, req: req || undefined, tags: ['food', 'bread', ...(tags || [])] })),
      ])({ wiener: 'ウインナー', painchoco: 'ショコラ', fruit: 'フルーツ', amaou: 'いちごサンド', goldmelon: '金のメロン', mentai: '明太フランス' }),
    ],
    // teppan (the app's own machine, 2026-10-24): takoyaki off the griddle (kind tako: the sauce bottle, mayonnaise or
    // not, the topping); on the deck the upgrades' goods (req): okonomiyaki (flat), yakisoba (soba), ikayaki (ika)
    // (sold in the shop, m-teppan, like the bakery)
    teppan: [
      ...(JP => [
      // id, tier, name, buy, sell, kind, sauce, mayo, top, req, more
      ...[['sauce', 1, 'ソースたこ焼き', 100, 300, 'tako', '#4a2210', 1, 'nori', null, { sw: 1.1 }], ['negipon', 1, 'ねぎポン', 105, 320, 'tako', '#c89a3a', 0, 'negi', null, { sw: .8 }],
        ['terimayo', 1, 'てりマヨ', 105, 320, 'tako', '#a8501c', 1, 'nori', null, { sw: .9 }], ['mentai', 1, '明太マヨ', 110, 340, 'tako', '#ffa898', 0, 'nori', null, { sw: .9 }],
        ['negishio', 1, 'ねぎ塩', 100, 310, 'tako', '#efe6cf', 0, 'negi', null, { sw: .8 }],
        ['cheese', 2, 'チーズたこ焼き', 250, 600, 'tako', '#f2c84a', 1, 'nori', null, { sw: 1.3 }],
        ['butatama', 2, '豚玉', 260, 620, 'okono', '#4a2210', 1, null, 'flat', { nori: 1, katsu: 1 }], ['negiyaki', 2, 'ねぎ焼き', 255, 610, 'okono', '#b8823a', 0, 'negi', 'flat'],
        ['sosoba', 2, 'ソース焼きそば', 250, 600, 'soba', '#7a3a12', 0, null, 'soba', { nori: 1, beni: 1 }], ['shiosoba', 2, '塩焼きそば', 250, 600, 'soba', '#e2c88a', 0, null, 'soba', { nori: 1, beni: 1 }],
        ['ikayaki', 2, 'いか焼き', 260, 620, 'ika', '#5a2a10', 0, null, 'ika'],
        ['mix', 3, 'ミックス玉', 720, 1550, 'okono', '#4a2210', 1, 'mix', 'flat', { nori: 1, katsu: 1 }], ['tonpei', 3, 'とん平焼き', 700, 1500, 'okono', '#4a2210', 1, 'tonpei', 'flat', { nori: 1 }],
        ['omusoba', 3, 'オムそば', 720, 1550, 'soba', '#7a3a12', 1, 'omu', 'soba', { nori: 1, beni: 1 }], ['dera', 3, 'デラ焼き', 740, 1600, 'ika', '#5a2a10', 0, null, 'ika', { egg: 1 }],
        ['ootako', 4, '大だこ焼き', 6000, 12000, 'tako', '#4a2210', 1, 'nori', null, { sw: 1.2, tags: ['rare'] }], ['kaisen', 4, '海鮮ミックス', 6200, 12400, 'okono', '#4a2210', 1, 'kaisen', 'flat', { nori: 1, katsu: 1, tags: ['rare'] }],
        ['gold', 5, '金のたこ焼き', 60000, 120000, 'tako', '#c8902a', 1, 'gold', null, { sw: 1.1, tags: ['rare'] }]]
        .map(([id, tier, name, buy, sell, kind, sauce, mayo, top, req, more = {}]) => ({ id, tier, name, jp: JP[id], buy, sell, g: id, kind, sauce, sw: more.sw, mayo, top: top || undefined,
          nori: more.nori, katsu: more.katsu, beni: more.beni, egg: more.egg, c: sauce, req: req || undefined, tags: ['food', 'konamon', ...(more.tags || [])] })),
      ])({ sauce: 'ソース', cheese: 'チーズ', sosoba: '焼きそば', ootako: '大だこ', gold: '金のたこ' }),
    ],
    // taiyaki: four hoppers on the rack
    taiyaki: [
      Tk('tsubu', 1, 'つぶあん', 90, 240, 'plain', '#6a2a2a'), Tk('koshi', 1, 'こしあん', 90, 240, 'plain', '#4a1a1a'), Tk('custard', 1, 'カスタード', 100, 260, 'plain', '#f6d860'), Tk('choco', 1, 'チョコ', 100, 260, 'plain', '#5a3018'),
      Tk('matcha', 2, '抹茶あん', 250, 580, 'matcha', '#6a9a3a'), Tk('imo', 2, 'さつまいも', 240, 560, 'plain', '#f0b040'), Tk('cheese', 2, 'クリームチーズ', 260, 600, 'plain', '#fbf4e0'),
      Tk('crotsubu', 2, 'クロワッサンつぶあん', 270, 620, 'cro', '#6a2a2a', { req: 'cro', jp: 'クロつぶあん' }),
      Tk('kuri', 3, '栗あん', 700, 1500, 'plain', '#c88a3a'), Tk('zunda', 3, 'ずんだ', 680, 1450, 'plain', '#9ac84a'), Tk('hamcheese', 3, 'ハムチーズ', 720, 1550, 'plain', '#f6c8b0'),
      Tk('crocustard', 3, 'クロワッサンカスタード', 740, 1580, 'cro', '#f6d860', { req: 'cro', jp: 'クロカスタード' }),
      Tk('kurogoma', 4, '黒ごま', 6000, 12000, 'black', '#2a2420', { tags: ['rare'] }), Tk('ichigo', 4, 'いちご', 6200, 12400, 'pink', '#ff8aa0', { tags: ['rare'] }),
      Tk('crochoco', 4, 'クロワッサンチョコ', 6100, 12200, 'cro', '#5a3018', { req: 'cro', jp: 'クロチョコ', tags: ['rare'] }),
      Tk('kinpaku', 5, '金箔たい焼き', 60000, 120000, 'gold', '#6a2a2a', { jp: '金箔', tags: ['rare'] }),
    ],
    // oden: six compartments in the pot
    oden: [
      Od('daikon', 1, '大根', 80, 220, 'daikon', '#f6e6b0'), Od('tamago', 1, '玉子', 85, 230, 'tamago', '#c8955a'), Od('konnyaku', 1, 'こんにゃく', 75, 210, 'konnyaku', '#8a8478'),
      Od('chikuwa', 1, 'ちくわ', 90, 240, 'chikuwa', '#e8c890'), Od('hanpen', 1, 'はんぺん', 85, 230, 'hanpen', '#fbfaf4'), Od('konbu', 1, '昆布', 80, 220, 'konbu', '#2a4a32'),
      Od('ganmo', 2, 'がんも', 250, 580, 'ganmo', '#c8862a'), Od('atsuage', 2, '厚揚げ', 240, 560, 'atsuage', '#d8a04a'), Od('shirataki', 2, 'しらたき', 230, 540, 'shirataki', '#e8e4d8'),
      Od('mkonnyaku', 2, '味噌こんにゃく', 260, 600, 'mkonnyaku', '#7a3a12', { req: 'miso' }),
      Od('mochikin', 3, '餅巾着', 700, 1500, 'mochikin', '#d89a4a'), Od('cabbage', 3, 'ロールキャベツ', 740, 1580, 'cabbage', '#9ac85a'), Od('tsumire', 3, 'つみれ', 680, 1450, 'tsumire', '#8a7a6a'),
      Od('mdaikon', 3, '味噌大根', 720, 1550, 'mdaikon', '#7a3a12', { req: 'miso' }),
      Od('gyusuji', 4, '牛すじ', 6000, 12000, 'gyusuji', '#a8643a', { tags: ['rare'] }), Od('tako', 4, 'タコ', 6200, 12400, 'tako', '#c84a4a', { tags: ['rare'] }),
      Od('mtamago', 4, '味噌玉子', 6100, 12200, 'mtamago', '#7a3a12', { req: 'miso', tags: ['rare'] }),
      Od('kanizume', 5, 'かに爪', 60000, 120000, 'kanizume', '#e8562a', { tags: ['rare'] }),
    ],
    // sushi: five cassettes on the turret
    sushi: [
      Su('tamago', 1, 'たまご', 90, 240, 'tamago', '#ffd23f'), Su('kappa', 1, 'かっぱ巻き', 80, 230, 'kappa', '#4aaa4a'), Su('inari', 1, 'いなり', 85, 230, 'inari', '#b8742a'),
      Su('ika', 1, 'いか', 110, 280, 'ika', '#e8e4d8'), Su('salmon', 1, 'サーモン', 120, 300, 'salmon', '#ff8a4a'),
      Su('maguro', 2, 'まぐろ', 260, 600, 'maguro', '#d8343a'), Su('ebi', 2, 'えび', 240, 560, 'ebi', '#ff9a5a'), Su('hamachi', 2, 'はまち', 270, 620, 'hamachi', '#f6c8b0'),
      Su('asalmon', 2, '炙りサーモン', 280, 660, 'asalmon', '#d8742a', { req: 'burner' }),
      Su('hotate', 3, 'ほたて', 700, 1500, 'hotate', '#f6ecd6'), Su('ikura', 3, 'いくら', 760, 1600, 'ikura', '#ff6a2a'), Su('negitoro', 3, 'ねぎとろ', 680, 1450, 'negitoro', '#ff9aa8'),
      Su('aengawa', 3, '炙りえんがわ', 720, 1550, 'aengawa', '#e8d0b0', { req: 'burner' }),
      Su('chutoro', 4, '中トロ', 6000, 12000, 'chutoro', '#ff8a96', { tags: ['rare'] }), Su('uni', 4, 'うに', 6200, 12400, 'uni', '#ffb02a', { tags: ['rare'] }),
      Su('atoro', 4, '炙りとろ', 6100, 12200, 'atoro', '#ef8a90', { req: 'burner', tags: ['rare'] }),
      Su('goldtoro', 5, '金箔大トロ', 60000, 120000, 'goldtoro', '#ffc0c8', { tags: ['rare'] }),
    ],
    // digital: one product per shelf
    digital: [
      Dg('cable', 1, 'USBケーブル', 80, 200, 'cable', '#3fb8ff'), Dg('charger', 1, '充電器', 110, 260, 'charger', '#9aa6b8'), Dg('sdcard', 1, 'SDカード', 120, 300, 'sd', '#2a6ad9'),
      Dg('junk', 1, 'ジャンク箱', 60, 200, 'junk', '#c8a040'), Dg('keycap', 1, 'キーキャップ', 90, 220, 'keycap', '#ff4f8b'),
      Dg('earbuds', 2, 'イヤホン', 200, 480, 'earbuds', '#3ff4ff'), Dg('mouse', 2, 'マウス', 190, 450, 'mouse', '#7a8494'),
      Dg('battery', 3, 'モバイルバッテリー', 650, 1450, 'battery', '#3fd47a'), Dg('board', 3, 'マイコンボード', 600, 1400, 'board', '#2f8a3a'),
      Dg('handheld', 4, '携帯ゲーム機', 6000, 12000, 'handheld', '#9a8cff', ['goods', 'rare']), Dg('mystery', 5, '謎のガジェット', 60000, 120000, 'mystery', '#ff4f8b', ['goods', 'rare']),
    ],
    // auto: toast from the start; burger and curry once their modules are fitted
    auto: [
      A('ham', 1, 0, 'ハムトースト', 100, 260, '#ff9aa8'), A('cheese', 1, 0, 'チーズトースト', 105, 270, '#ffd23f', { o: 1 }), A('tamago', 1, 0, 'たまごトースト', 110, 280, '#fff4c2', { d: '#ffc93a' }),
      A('pizza', 2, 0, 'ピザトースト', 200, 460, '#e8453a', { d: '#9a1f14', o: 1 }), A('mentai', 3, 0, '明太チーズトースト', 650, 1400, '#ff7a8a', { d: '#fff3c0', o: 1 }),
      A('burger', 1, 1, 'ハンバーガー', 130, 320, '#e8453a'), A('cheeseb', 2, 1, 'チーズバーガー', 210, 480, '#ffcf4a'), A('teriyaki', 2, 1, 'てりやきバーガー', 220, 500, '#8a4a2a', {}, ['sweet']),
      A('goldb', 4, 1, '金のハンバーガー', 6000, 12000, '#ffd000', {}, ['rare']),
      A('curry', 1, 2, 'カレーライス', 140, 350, '#b5651d'), A('katsu', 3, 2, 'カツカレー', 700, 1500, '#8a4a1a', { d: '#d89040', o: 1 }), A('wagyu', 5, 2, '黒毛和牛カレー', 60000, 120000, '#6a3010', { d: '#4a1e0a', o: 1 }, ['rare']),
    ],
  };
  // localisation: the Japanese name stays on the machines (jp); the interface shows I18N's (the same, or a local one)
  Object.entries(GOODS).forEach(([kind, list]) => list.forEach(g => { g.jp = g.name; g.name = I18N.good(kind, g.id, g.jp); }));
  const ROW_NAMES = [T`零食`, T`甜品`, T`吃的`, T`杂货`, T`饮料 · 摆件`];

  /* ---------- the price ladder (2026-10-14; system doc §3.1, tuned in the simulator) ----------
     进货档位: every letter has three steps (上等 · 特上 · 极上), each worth ×10: A 上等 sells at about ¥1A a unit, A 特上 ¥10A,
     A 极上 ¥100A, B 上等 ¥1B … A step opens when lifetime takings reach its price × K (K = 5, then ×1.43 a step).
     A step lifts every product at once, so old goods keep up (a machine shows one product per slot, and a ×10 gap
     between slots would waste its shelves); products still arrive by ★ for variety and a little more profit.
     Prices are per machine size: a full machine at a step is worth the same whatever it sells (a can is cheap, a set
     meal dear), so every machine earns about the same in the 4 hours it takes to sell out. */
  const K0 = 5, KG = 1.43, NSTEP = 22, LOAD0 = 4800;   // LOAD0: a full machine of starting goods (24 units × ¥200)
  const stepMult = k => k ? 5 * Math.pow(10, k - 1) : 1;
  const stepX = k => k > 1 ? 10 : 5;   // (v0.40) what a step multiplies by, for the texts: 普通 → 上等 1 is ×5, then ×10
  const stepLine = k => k ? 1000 * Math.pow(10, k - 1) * K0 * Math.pow(KG, k - 1) : 0;
  const stepOf = (life = S.life) => { let k = 0; while (k + 1 < NSTEP && life >= stepLine(k + 1)) k++; return k; };
  const GRADES = [T`上等`, T`特上`, T`极上`];
  // (2026-10-18, with the money in 万-steps the letter in front meant nothing: 上等 1, 特上 1, 极上 1, 上等 2 …)
  const stepName = k => k ? T`${GRADES[(k - 1) % 3]} ${Math.floor((k - 1) / 3) + 1}` : T`普通`;
  // ★ opens with a later step and is worth a little more; inside a ★ the goods keep their relative prices
  const STAR = [0, 1, 1.12, 1.25, 1.4, 1.6];
  // lifetime takings that unlock each tier (★1 .. ★5)
  const product = (kind, id) => GOODS[kind].find(g => g.id === id);
  // (v0.39) goods from the catalog exist only for whoever bought them
  const listed = g => !g.paid || (typeof PAY !== 'undefined' && PAY.has(g.paid));
  const goodsOf = kind => GOODS[kind].filter(listed);
  const machineOf = kind => MACHINES.find(m => m.goods && m.goods.kind === kind);
  const means = {};
  const meanSell = (kind, t) => { const key = kind + t; if (!(key in means)) { const l = GOODS[kind].filter(g => g.tier === t && !g.paid); means[key] = l.reduce((s, g) => s + g.sell, 0) / l.length; } return means[key]; };
  // what one unit sells for at step k, before fashion and cats (baseCap: the machine's size before any upgrade)
  function unitPrice(kind, g, k) {
    const m = machineOf(kind), cap = (m && (m.baseCap || m.capacity)) || 24;
    return LOAD0 / cap * stepMult(k) * STAR[g.tier] * g.sell / meanSell(kind, g.tier);
  }
  /* ---------- each machine's way of earning (2026-10-18; the user: machines differ — 薄利多销 or 厚利少销 — and a newer
     one must earn more, so replacing pays; a full machine still sells out in 4 hours ± 1). h: hours to sell out a full
     machine; i: what it earns an hour against ミズイロ. The margin follows from the two: at the same i a 3-hour machine
     sells each unit for less than a 5-hour one (a unit's buy price stays as it was; its sell price takes the factor) ---------- */
  const PERSONA = {
    drink: { h: 4, i: 1.0, tag: 'steady' }, spiral: { h: 3, i: 1.07, tag: 'volume' }, cup: { h: 5, i: 1.2, tag: 'margin' }, ramen: { h: 5, i: 1.33, tag: 'margin' },
    juice: { h: 3, i: 1.47, tag: 'fast' }, auto: { h: 4, i: 1.3, tag: 'grow' }, digital: { h: 5, i: 1.8, tag: 'margin' }, frozen: { h: 5, i: 2.0, tag: 'keep' },
    locker: { h: 5, i: 2.2, tag: 'leave' }, teishoku: { h: 4, i: 2.5, tag: 'margin' },
    sushi: { h: 3, i: 2.0, tag: 'volume', special: true }, oden: { h: 5, i: 1.8, tag: 'season', special: true }, taiyaki: { h: 3, i: 2.1, tag: 'steady', special: true },
    kakigori: { h: 4, i: 2.2, tag: 'season', special: true }, gacha: { h: 4, i: 2.3, tag: 'luck', special: true }, kissa: { h: 5, i: 2.6, tag: 'margin', special: true }, bakery: { h: 4, i: 2.4, tag: 'steady', special: true }, teppan: { h: 4, i: 2.4, tag: 'steady', special: true },
  };
  const persona = kind => PERSONA[kind] || PERSONA.drink;
  // what it earns an hour now: the オート grows with its modules, おでん likes winter and night, かき氷 summer; a special
  // keeps the terms it was given when it opened (a little above the best ordinary machine you had then)
  function earnI(kind) {
    const p = persona(kind), m = machineOf(kind); let i = (S.spec[m && m.id] && S.spec[m.id].i) || p.i;
    if (kind === 'auto' && typeof UPG !== 'undefined') i += .3 * (UPG.has('auto', 'burger') ? 1 : 0) + .3 * (UPG.has('auto', 'curry') ? 1 : 0);
    const d = new Date(), mo = d.getMonth(), hr = d.getHours();
    if (kind === 'oden' && (mo >= 10 || mo <= 1 || hr >= 18 || hr < 6)) i *= 1.5;
    if (kind === 'kakigori' && mo >= 5 && mo <= 7) i *= 1.5;
    return i;
  }
  // how a player reads a machine's way of earning: a word, a line, and two rows of dots (shown on the lot card and the album)
  const PTAG = { steady: T`稳`, volume: T`薄利多销`, margin: T`厚利少销`, fast: T`卖得飞快`, grow: T`成长型`, keep: T`放得住`, leave: T`放着就行`, season: T`时令`, luck: T`靠运气` };
  const PLINE = { drink: T`什么时候都卖得动`, spiral: T`二十条货道，回来得勤就赚得多`, cup: T`粉冲的咖啡，一杯成本几乎是零`, ramen: T`一碗一碗煮，慢，但一碗赚得多`,
    juice: T`现榨的卖得飞快，果皮袋满了会停`, auto: T`开局只有吐司，装上汉堡仓、咖喱站才真正赚钱`, digital: T`一个零件卖得贵，放一晚也卖不完`, frozen: T`冷冻的不怕放，睡前摆上它`,
    locker: T`不插电的无人直卖所，放着就行`, teishoku: T`一份定食赚得多，碗不够就要等洗`, sushi: T`转得最快，常回来的人的宝贝`, oden: T`冬天和夜里卖得特别好`,
    taiyaki: T`一条链子一直烤，不太挑时候`, kakigori: T`夏天是街上最能赚的`, gacha: T`金色シークレット一出，一下子翻倍`, kissa: T`一杯虹吸咖啡，慢慢喝`, bakery: T`一个一个现烤，发酵跟不上时要等`, teppan: T`一排一排地烤，铁板跟不上时要等` };
  function personaLine(kind, k = -1) {
    const p = persona(kind), dots = n => '●'.repeat(n) + '○'.repeat(5 - n);
    const speed = (p.h <= 3 ? 4 : p.h >= 5 ? 2 : 3) + (suits(kind, k) ? 1 : 0), margin = Math.max(1, Math.min(5, Math.round((marginF(kind) - .8) * 4) + 1));
    return { tag: PTAG[p.tag] || '', line: PLINE[kind] || '', dots: T`卖得快 ${dots(speed)}　一件赚得多 ${dots(margin)}` };
  }
  // the sell-price factor that gives i at h (goods sell for about twice their buy price)
  const marginF = kind => (.25 * earnI(kind) * persona(kind).h + 1) / 2;
  /* ★ per machine (2026-10-18): a machine's goods open as it sells, counted in full loads of its starting size so a big
     machine and a small one take as long — what you keep on the street decides what opens first */
  const TIER_LOADS = [0, 0, 3, 12, 40, 120];
  function loadsOf(kind) { const m = machineOf(kind); if (!m) return 0; let n = 0; for (const g of GOODS[kind]) n += soldCount(kind, g.id); return n / Math.max(1, m.baseCap || m.capacity); }
  const tierOf = kind => { const L = loadsOf(kind); let t = 1; while (TIER_LOADS[t + 1] !== undefined && L >= TIER_LOADS[t + 1]) t++; return t; };
  // old-economy money (upgrade prices were written for ★ tiers at 5A / 50A / 500A / 5B) -> the same moment on the ladder
  function scaleOld(v) {
    const A = [[0, 0], [5e3, stepLine(2)], [5e4, stepLine(5)], [5e5, stepLine(8)], [5e6, stepLine(11)]];
    if (v <= A[1][0]) return Math.round(v * A[1][1] / A[1][0]);
    let j = 1; while (j < A.length - 2 && v > A[j + 1][0]) j++;
    const [x0, y0] = A[j], [x1, y1] = A[j + 1], f = Math.log(v / x0) / Math.log(x1 / x0);
    return nice(y0 * Math.pow(y1 / y0, f));
  }

  /* ---------- cats: every carry brings one, and each likes one kind of goods ---------- */
  // (cats once made the goods they liked sell for 20% more; dropped with cat v2, 2026-10-15: cats stay random)

  /* ---------- this week's fashion: two goods per machine, one of them from a lower tier when there is one ---------- */
  function season() {
    const d = new Date(), y = d.getFullYear(), week = Math.floor((d - new Date(y, 0, 1)) / 6048e5) + 1;
    return { name: [T`冬`, T`冬`, T`春`, T`春`, T`春`, T`夏`, T`夏`, T`夏`, T`秋`, T`秋`, T`秋`, T`冬`][d.getMonth()], week, seed: y * 100 + week };
  }
  function hotIds(kind) {
    const s = season().seed, mt = tierOf(kind), c = S.hot[kind];
    if (c && c.seed === s && c.mt === mt) return c.ids;
    let x = (s * 31 + kind.length * 977 + mt * 13) % 2147483647;
    const rnd = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
    const open = goodsOf(kind).filter(g => g.tier <= mt), low = open.filter(g => g.tier < mt);
    const a = (low.length ? low : open)[Math.floor(rnd() * (low.length || open.length))];
    const rest = open.filter(g => g !== a), b = rest[Math.floor(rnd() * rest.length)];
    S.hot[kind] = { seed: s, mt, ids: [a.id, b && b.id].filter(Boolean) };
    return S.hot[kind].ids;
  }
  // 3 significant figures, so prices stay tidy
  const nice = v => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 2)); return Math.round(v / p) * p; };
  // what one unit really buys and sells for at step k (fashion and cats already counted in). Without k: the step its
  // slot was last planned at (so goods restored from a save keep the price they were bought at)
  function quote(kind, g, k) {
    if (k === undefined) k = stepFor(kind, g.id);
    const trend = hotIds(kind).includes(g.id), u = unitPrice(kind, g, k);
    const sell = nice(u * marginF(kind) * (trend ? 1.5 : 1)), buy = nice(u * g.buy / g.sell);
    return { buy, sell, gain: sell - buy, trend, cat: null, step: k };
  }
  // a slot's step: set when a restock is planned (按钱包推荐); goods never restocked are starting goods
  const gradeOf = (m, i) => { const g = S.grade[m.id]; return g && g[i] !== undefined ? g[i] : 0; };
  function stepFor(kind, id) {
    const m = machineOf(kind); if (!m) return stepOf();
    const i = S.grade[m.id] ? planOf(m).indexOf(id) : -1;
    return gradeOf(m, Math.max(0, i));
  }

  /* ---------- plans: one product id per slot of a machine ---------- */
  const isAuto = m => S.auto[m.id] !== false;   // automatic unless the player picked something by hand
  // a slot takes goods of its shelf (row) and its temperature (hot goods only in a hot lane, cold ones only in a cold lane);
  // goods that need a part (req) wait until that part is fitted
  function fits(m, slot, g) { const s = m.goods.slots[slot];
    if (s.row !== undefined && g.row !== s.row) return false;
    if (s.temp && s.temp !== 'any' && (s.temp === 'hot') !== !!g.hot) return false;
    return !g.req || (typeof UPG !== 'undefined' && UPG.has(m.id, g.req)); }
  // what can go in one slot (unlocked, the right shelf), most profitable first
  // (ranked at one step: a step lifts every product alike)
  const candidates = (m, slot, top = tierOf(m.goods.kind)) => goodsOf(m.goods.kind).filter(g => g.tier <= top && fits(m, slot, g))
    .sort((a, b) => quote(m.goods.kind, b, 0).gain - quote(m.goods.kind, a, 0).gain);
  // best profit per slot, different goods side by side where possible
  function auto(m, top = tierOf(m.goods.kind)) {
    const used = new Set();
    return m.goods.slots.map((s, i) => { const opts = candidates(m, i, top); const g = opts.find(o => !used.has(o.id)) || opts[0]; used.add(g.id); return g.id; });
  }
  // one place per product in a machine (customers like a choice): a repeated product gives way to the best unused one
  function dedupe(m, plan) {
    const seen = new Set();
    return plan.map((id, i) => { const g = product(m.goods.kind, id); if (!seen.has(id) && g && fits(m, i, g)) { seen.add(id); return id; }
      const alt = candidates(m, i).find(g => !seen.has(g.id) && !plan.includes(g.id)) || candidates(m, i).find(g => !seen.has(g.id));
      const nid = alt ? alt.id : id; seen.add(nid); return nid; });
  }
  const basePlan = m => S.free[m.id] ? auto(m, S.cap[m.id]) : isAuto(m) ? auto(m) : dedupe(m, (S.plans[m.id] || m.goods.defaults).slice());
  // 捎一件: while that machine's door is open for a restock, one slot takes the requested product (one unit goes in)
  const planOf = m => { const p = basePlan(m);
    // 试装 (2026-10-16): goods a part opens show up at once, whatever tier they are, so the test shows what the part is for
    if (trialOn === m.id) GOODS[m.goods.kind].filter(g => g.req && UPG.has(m.id, g.req) && !p.includes(g.id)).forEach(g => {
      for (let i = p.length - 1; i >= 0; i--) { const cur = product(m.goods.kind, p[i]); if (fits(m, i, g) && !(cur && cur.req)) { p[i] = g.id; break; } } });
    if (extraOn === m.id) { const ex = S.extra[m.goods.kind], g = ex && product(m.goods.kind, ex);
      if (g && !p.includes(ex)) for (let i = p.length - 1; i >= 0; i--) if (fits(m, i, g)) { p[i] = ex; break; } }
    return p; };
  /* ---------- 捎一件 (album): a series stuck on a product auto-assort never picks. Tap the missing piece; the next restock
     of its machine brings one along, once, and auto-assort stays on (it still sells for more than it costs) ---------- */
  let extraOn = null;   // the machine whose door is open for that restock
  let trialOn = null;   // the machine in 试运转, if any
  const setTrial = mid => { trialOn = mid; };
  function requestExtra(kind, id) { if (S.extra[kind] === id) delete S.extra[kind]; else S.extra[kind] = id; changed(); return S.extra[kind] === id; }
  const extraFor = kind => S.extra[kind] || null;
  const extraBegin = m => { extraOn = S.extra[m.goods.kind] ? m.id : null; };
  const extraEnd = () => { extraOn = null; };
  // the unit is on its way: the request is done. The slot goes back to the planned goods once it has landed (the dock calls
  // applyDefs then: machines make a unit from their slot's definition as it arrives)
  function takeExtra(m, kind, id) { if (extraOn !== m.id || S.extra[kind] !== id) return false; delete S.extra[kind]; extraOn = null; changed(); return true; }
  // a full restock under a plan: what it costs, what it sells for, the difference
  function totals(m, plan) {
    const kind = m.goods.kind; let buy = 0, sell = 0;
    plan.forEach((id, i) => { const q = quote(kind, product(kind, id), gradeOf(m, i)), cap = m.goods.slots[i].cap; buy += cap * q.buy; sell += cap * q.sell; });
    return { buy, sell, gain: sell - buy };
  }
  // the next tier this machine has not reached: how many more units it has to sell and how many goods it brings
  function nextTier(m) {
    const kind = m.goods.kind, t = tierOf(kind) + 1; if (TIER_LOADS[t] === undefined) return null;
    const n = goodsOf(kind).filter(g => g.tier === t).length;
    return n ? { tier: t, units: Math.max(1, Math.ceil((TIER_LOADS[t] - loadsOf(kind)) * Math.max(1, m.baseCap || m.capacity))), count: n } : null;
  }
  // push a plan's goods (with current prices) into the machine's own definitions: what new units will be
  // what each machine was last given (goods and prices): the front of a machine is redrawn only when this changes
  const defsSig = {};
  function applyDefs(m) {
    const kind = m.goods.kind, list = planOf(m).map((id, i) => { const g = product(kind, id); return { ...g, ...quote(kind, g, gradeOf(m, i)) }; });
    m.goods.apply(list); defsSig[m.id] = list.map(g => `${g.id}@${g.sell}`).join();
  }

  /* ---------- 按钱包推荐 (user, 2026-10-14): one budget for the whole street ----------
     Every gap (shelves and warehouse) first gets the starting step; then slots step up, top step first, as far as the
     money goes. Each restock (one machine, or 全部补货) plans the whole street again, so restocking one by one and all
     at once come out the same, and the first machine never spends what the others need. */
  const WARE_LETTER = 2, KEEP = .5;   // (2026-10-18: was .3 — the user: doing one thing left no money for the next)
  let keepAmt = 0, keepT = -Infinity;   // the warehouse opens with B; KEEP: share of spare money a restock leaves alone
  // (2026-10-18) the warehouse comes at the first door close after a restock (app.js closeDoor → openWare) — the
  // wholesaler leaves a box behind the machine, the first one free — so the first session is not a restock every two minutes
  const wareOn = () => S.wareOpen;
  const openWare = () => { if (S.wareOpen) return false; S.wareOpen = true; S.wareGift = true; changed(); return true; };
  // a part that brings more customers brings the stock to match (user, 2026-10-14): traffic ×1.35 -> 35% more in reserve,
  // moved onto the shelves when they sell out, so the machine still takes about 4 hours to sell out, it just earns more
  const sideStock = m => Math.round(Math.max(0, (m.traffic || 1) - 1) * m.capacity);
  const wareCap = m => (wareOn() ? m.capacity * (typeof PAY !== 'undefined' && PAY.has('license') ? 2 : 1) : 0) + sideStock(m);   // (v0.39 店长证: a second box)
  const ware = m => S.ware[m.id] || 0;
  function gapOf(m, i) {
    const s = m.goods.slots[i], total = m.goods.slots.reduce((a, x) => a + x.cap, 0) || 1;
    // the cup machine counts cups, not drinks: its gap is shared out over the menu
    const shelf = m.goods.kind === 'cup' ? s.cap * Math.max(0, m.capacity - m.count()) / m.capacity : Math.max(0, s.cap - m.goods.units(i));
    return shelf + s.cap * Math.max(0, wareCap(m) - ware(m)) / total;
  }
  function budget(ms) {
    const top = stepOf(), items = [];
    ms.forEach(m => { const plan = planOf(m); m.goods.slots.forEach((s, i) => { const gap = gapOf(m, i); if (gap > 0) items.push({ m, i, g: product(m.goods.kind, plan[i]), gap, k: 0 }); }); });
    const cost = (it, k) => it.gap * quote(it.m.goods.kind, it.g, k).buy;
    // every slot climbs together, one step at a time; where the money runs out, the biggest slots go one step further
    // (the profit is the same either way: a neat 'this time 2 lanes A 特上, the rest A 上等' reads better than a jump).
    // Climbing uses at most half of the money left over (it was 70%): the rest stays in the wallet for machines and upgrades
    // (the simulator's calibration already counts ~15% of takings going there, so F still comes around day 30)
    // the amount kept is fixed for a round of restocking (the machines one after another, within two minutes), or each
    // machine's re-plan would spend most of what the one before had put aside
    // (v0.40, the user: a restock is never made cheaper to keep money back) every slot starts at the step it was last
    // bought at; only climbing past it is held back by KEEP. Short of even that, the money goes as far as it reaches.
    items.forEach(it => { const g = S.grade[it.m.id]; it.k0 = Math.min(top, (g && g[it.i]) || 0); });
    const base = items.reduce((s, it) => s + cost(it, 0), 0), held = items.reduce((s, it) => s + cost(it, it.k0), 0), now = Date.now();
    const keepsUp = S.bank >= held;
    if (keepsUp) items.forEach(it => { it.k = it.k0; });
    if (now - keepT > 120000) keepAmt = keepsUp ? Math.max(0, S.bank - held) * KEEP : 0;
    keepT = now;
    let spare = keepsUp ? S.bank - held - keepAmt : S.bank - base;
    for (let k = 1; k <= top && spare > 0; k++) {
      const up = items.filter(it => it.k < k).map(it => ({ it, d: cost(it, k) - cost(it, it.k) })).sort((a, b) => b.d - a.d), all = up.reduce((s, x) => s + x.d, 0);
      if (all <= spare) { up.forEach(x => { x.it.k = k; }); spare -= all; continue; }
      up.forEach(x => { if (x.d <= spare) { x.it.k = k; spare -= x.d; } });
      break;
    }
    // short: machines where some gaps could not take the top step (one line of text at the door)
    const short = {};
    items.forEach(({ m, i, k }) => { const g = S.grade[m.id] || (S.grade[m.id] = []); g[i] = k;
      const x = short[m.id] || (short[m.id] = { hi: 0, lo: 0, rest: 0 }); if (k === top) x.hi++; else { x.lo++; x.rest = Math.max(x.rest, k); } });
    Object.keys(short).forEach(id => { if (!short[id].lo) delete short[id]; });
    ms.forEach(applyDefs);
    return { top, short, keep: keepAmt, base, left: spare };
  }
  // the step a machine's crate is graded by: its best planned slot
  const crateStep = m => Math.max(0, ...m.goods.slots.map((_, i) => gradeOf(m, i)));
  // the warehouse: one more full load per machine, bought at restock (an average unit at the slots' steps), moved onto
  // the shelves by itself when the machine sells out
  const avgBuy = m => { const kind = m.goods.kind, plan = planOf(m); let c = 0, n = 0;
    m.goods.slots.forEach((s, i) => { c += s.cap * quote(kind, product(kind, plan[i]), gradeOf(m, i)).buy; n += s.cap; }); return c / (n || 1); };
  function fillWare(m) {
    const need = Math.floor(wareCap(m) - ware(m)); if (need <= 0) return 0;
    if (S.wareGift) { S.wareGift = false; S.ware[m.id] = ware(m) + need; changed(); return 0; }   // the first box is a present
    const unit = avgBuy(m), n = Math.min(need, Math.floor(S.bank / unit)); if (n <= 0) return 0;
    S.bank -= n * unit; S.ware[m.id] = ware(m) + n; changed(); return n * unit;
  }
  function takeWare(m, n) { const k = Math.max(0, Math.min(ware(m), n)); S.ware[m.id] = ware(m) - k; return k; }

  /* ---------- lots (机位): two machines to start, five at most ----------
     (2026-10-18, the user: lots set the income and when the idle stretch begins, so they open slowly; machines are the
     draw and open early.) The 3rd lot opens in the first session, the 4th about day 2, the 5th about day 6.
     Machines you own and do not show are put away with their stock and parts; swapping is free, buying costs money. */
  const LOT_AT = [0, 0, 3e4, 1.2e6, 1.5e8];
  const LOT_LETTER = [0, 0, 2, 3, 4];   // (old saves and the street's labels)
  /* ---------- streets (v0.46, docs/nandemo-开新街.md). なんでも通り is the first: its lots are S.lots (econ.lots in the
     save, as before). Streets opened later keep theirs in S.more ([{ id, at, lots }], the save's top-level `streets`).
     One number addresses a lot on any street: street k's lot j is k * 5 + j. A new street opens on assets (the money in
     hand plus what the machines and their parts cost: the app adds it up) with all five lots ---------- */
  const STREETS = [{ id: 'nandemo', name: 'なんでも通り' }, { id: 'ekimae', name: '駅前通り', assets: 2e9 }];
  const allLots = () => S.lots.concat(...S.more.map(s => s.lots));
  const streetN = () => 1 + S.more.length;
  const streetOf = g => Math.floor(g / 5);
  const setLot = (g, id) => { if (g < 5) S.lots[g] = id; else S.more[streetOf(g) - 1].lots[g % 5] = id || null; };
  const lotOpen = g => g < 5 ? S.life >= LOT_AT[g] : g < 5 * streetN();
  function openStreet(k) { if (k !== streetN() || !STREETS[k]) return false; S.more.push({ id: STREETS[k].id, at: Date.now(), lots: [null, null, null, null, null] }); changed(); return true; }
  const streetsSave = () => S.more.map(s => ({ id: s.id, at: s.at, lots: s.lots.slice() }));
  function loadStreets(list) {
    S.more = [];
    for (const s of Array.isArray(list) ? list : []) { const k = STREETS.findIndex(x => x.id === (s && s.id)); if (k !== streetN()) continue;
      S.more.push({ id: s.id, at: +s.at || Date.now(), lots: Array.isArray(s.lots) && s.lots.length === 5 ? s.lots.map(id => id || null) : [null, null, null, null, null] }); }
    // a machine stands on one lot at most (a save edited by hand, or two devices merged)
    const seen = new Set(); allLots().forEach((id, g) => { if (!id) return; if (seen.has(id)) setLot(g, null); seen.add(id); });
  }
  /* 駅前通り's one trait: machines that earn by selling fast (稳, 薄利多销, 卖得飞快) sell out an hour sooner there.
     Prices stay as they are (a load earns the same); only the pace changes, so it rewards coming back often */
  const EKI = ['steady', 'volume', 'fast'];
  const suits = (kind, k) => !!STREETS[k] && STREETS[k].id === 'ekimae' && EKI.includes(persona(kind).tag);
  const streetOfId = id => { const g = allLots().indexOf(id); return g < 0 ? -1 : streetOf(g); };
  const hOf = m => { const p = persona(m.goods.kind); return suits(m.goods.kind, streetOfId(m.id)) ? Math.max(2, p.h - 1) : p.h; };
  // ordinary machines by price (each earns more an hour than the one before); specials get terms when they open
  const BUY_AT = { cup: 2e4, ramen: 8e4, juice: 3e5, auto: 1.5e6, digital: 8e6, frozen: 6e7, locker: 6e8, teishoku: 8e9 };
  const BUY_STEP = { cup: 1, ramen: 3, juice: 4, auto: 6, digital: 7, sushi: 8, frozen: 9, locker: 10, oden: 11, teishoku: 13, taiyaki: 14, kakigori: 15, gacha: 16, kissa: 17 };
  // (2026-10-24) machines sold in the shop (m.paid, a pay.js id): bought with real money, so placing one costs no game
  // money; until bought it is not counted anywhere a free player is scored (the album's totals) and cannot be placed
  const paidM = id => { const m = typeof MACHINES !== 'undefined' && MACHINES.find(x => x.id === id); return m && m.paid ? m : null; };
  const paidLock = id => { const m = paidM(id); return !!m && !(typeof PAY !== 'undefined' && PAY.has(m.paid)); };
  // a refund: the machine leaves its lot and is no longer owned (bought again, it is placed again for free)
  function takeBack(id) { if (!S.owned[id]) return false; const g = allLots().indexOf(id); if (g >= 0) setLot(g, null); delete S.owned[id]; changed(); return true; }
  const priceOf = id => paidM(id) ? 0 : S.spec[id] ? S.spec[id].price : BUY_AT[id] !== undefined ? BUY_AT[id] : BUY_STEP[id] === undefined ? 0 : 2 * LOAD0 * stepMult(BUY_STEP[id]);
  const isSpecial = id => !!(PERSONA[(MACHINES.find(m => m.id === id) || { goods: {} }).goods.kind] || {}).special;
  // a special opens: a little better an hour than the best ordinary machine you own, priced at about a day and a half of
  // what the street takes in now (so being allowed to buy it means something soon)
  function setSpecial(id, dayTakings) {
    if (S.spec[id]) return S.spec[id];
    const best = Math.max(1, ...Object.keys(S.owned).filter(o => S.owned[o] && !isSpecial(o)).map(o => { const m = MACHINES.find(x => x.id === o); return m ? persona(m.goods.kind).i : 1; }));
    S.spec[id] = { i: best * 1.15, price: nice(Math.max(1000, dayTakings * 1.5)) }; changed(); return S.spec[id];
  }
  // 今日の入荷: two or three of the cheapest ordinary machines you do not own, drawn afresh each day and after a purchase
  function offers() {
    const left = Object.keys(BUY_AT).filter(id => !S.owned[id]).sort((a, b) => BUY_AT[a] - BUY_AT[b]).slice(0, 4);
    const d = new Date(Date.now()), day = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    let x = (S.seed * 7919 + day * 104729 + Object.keys(S.owned).length * 31) % 2147483647 || 1;
    const rnd = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
    const n = Math.min(left.length, left.length > 2 ? (rnd() < .5 ? 2 : 3) : left.length);
    const pool = left.slice(); const out = [];
    // the cheapest one is always among them, so nobody waits on luck for the next step
    if (pool.length) out.push(pool.shift());
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return out;
  }
  // put machine id on lot j: from another lot (the two swap), from storage (free), or bought
  function place(g, id) {
    if (!lotOpen(g)) return false;
    if (!S.owned[id]) { if (paidLock(id) || !spend(priceOf(id))) return false; S.owned[id] = true; }
    const L = allLots(), from = L.indexOf(id);
    if (from >= 0) setLot(from, L[g]); setLot(g, id);
    changed(); return true;
  }
  // a lineup picked by hand (free: what is already in the machine sells first)
  function setPlan(m, plan) { S.plans[m.id] = plan.slice(); S.auto[m.id] = false; applyDefs(m); }
  function setAuto(m, on = true) { if (!on) S.plans[m.id] = planOf(m); S.auto[m.id] = on; applyDefs(m); }
  // the cheapest unit in a machine's plan (used to tell when nothing can be bought)
  const cheapest = m => Math.min(...planOf(m).map(id => quote(m.goods.kind, product(m.goods.kind, id), 0).buy));
  // 保底: empty machine, no money for a single unit -> this crate is free, goods one tier below the best bought
  function rescue(m) {
    if (m.count() > 0 || S.bank >= cheapest(m)) return false;
    S.cap[m.id] = Math.max(1, (S.best[m.id] || 1) - 1); S.free[m.id] = true; applyDefs(m); return true;
  }
  // a unit goes into a machine: pay its buy price (or nothing while a rescue crate lasts)
  function pay(m, cost, tier) {
    if (S.free[m.id]) return true;
    if (!spend(cost)) return false;
    if (tier) S.best[m.id] = Math.max(S.best[m.id] || 1, tier);
    return true;
  }
  const endRescue = m => { if (!S.free[m.id]) return; delete S.free[m.id]; delete S.cap[m.id]; applyDefs(m); };

  /* ---------- the album: firsts are celebrated (上新 when first stocked, 初売り when first sold) ---------- */
  const keyOf = (kind, id) => kind + ':' + id;
  function recordSale(kind, id) { if (!id) return false; const r = S.sold[keyOf(kind, id)]; if (r) { r.n++; return false; } S.sold[keyOf(kind, id)] = { n: 1, t: Date.now() }; return true; }
  function recordStock(kind, id) { if (!id || S.stocked[keyOf(kind, id)]) return false; S.stocked[keyOf(kind, id)] = 1; return true; }
  const soldCount = (kind, id) => (S.sold[keyOf(kind, id)] || { n: 0 }).n;
  const everStocked = (kind, id) => !!S.stocked[keyOf(kind, id)];
  function albumCount() { let have = 0, all = 0; for (const kind in GOODS) if (!(machineOf(kind) && paidLock(machineOf(kind).id))) for (const g of goodsOf(kind)) { all++; if (S.sold[keyOf(kind, g.id)]) have++; } return { have, all }; }
  // the goods a tier brings, with the best profit among them and the best before it (for "×2.4 more")
  // (only the machines you own: goods for machines you have not bought are not news yet)
  function tierNews(t, only) {
    const k = stepOf(), mine = Object.keys(GOODS).filter(kind => { const m = machineOf(kind); return m && S.owned[m.id] && (!only || kind === only); }).map(kind => [kind, goodsOf(kind)]);
    const items = mine.flatMap(([kind, list]) => list.filter(g => g.tier === t).map(g => ({ kind, g, q: quote(kind, g, k) })));
    const before = mine.flatMap(([kind, list]) => list.filter(g => g.tier < t).map(g => quote(kind, g, k).gain));
    // how much better: within one machine (unit prices follow machine size, so a set meal and a can do not compare)
    const ratio = Math.max(1, ...mine.map(([kind, list]) => { const nw = list.filter(g => g.tier === t), old = list.filter(g => g.tier < t);
      return nw.length && old.length ? Math.max(...nw.map(g => quote(kind, g, k).gain)) / Math.max(1, ...old.map(g => quote(kind, g, k).gain)) : 0; }));
    return { items, best: Math.max(0, ...items.map(i => i.q.gain)), before: Math.max(1, ...before), ratio };
  }

  /* ---------- money ---------- */
  function earn(p) { S.bank += p; S.life += p; changed(); }
  function spend(p) { if (p > S.bank + 1e-6) return false; S.bank -= p; changed(); return true; }
  const boost = p => { S.bank += p; S.life += p; changed(); };
  // money that is not takings (a coin purse ミケ found): the wallet only, lifetime takings stay as they are
  const give = p => { S.bank += p; changed(); };
  const save = () => ({ bank: S.bank, life: S.life, best: S.best, plans: S.plans, auto: S.auto, sold: S.sold, stocked: S.stocked, grade: S.grade, ware: S.ware, lots: S.lots, owned: S.owned, extra: S.extra,
    wareOpen: S.wareOpen, wareGift: S.wareGift, spec: S.spec, flyer: S.flyer, seed: S.seed, born: S.born, free: S.free, cap: S.cap });   // (v0.41: free/cap = the 保底 crate)
  // a brand-new shop starts with enough for about one crate, so restocking never opens on 钱不够
  const START = 3000;
  function load(d, fallback = 0) {
    S.life = Math.max(0, +(d && d.life) || fallback); S.bank = Math.max(0, d && d.bank !== undefined ? +d.bank : (d || fallback ? S.life : START));
    S.best = (d && d.best) || {}; S.plans = (d && d.plans) || {}; S.auto = (d && d.auto) || {};
    S.sold = (d && d.sold) || {}; S.stocked = (d && d.stocked) || {};
    S.grade = (d && d.grade) || {}; S.ware = (d && d.ware) || {}; S.extra = (d && d.extra) || {}; S.free = (d && d.free) || {}; S.cap = (d && d.cap) || {};
    // a new street: ミズイロ and なんでも on the first two lots, three lots to come
    S.lots = d && Array.isArray(d.lots) && d.lots.length === 5 ? d.lots.slice() : ['drink', 'spiral', null, null, null];
    S.owned = (d && d.owned) || { drink: true, spiral: true };
    S.wareOpen = d && d.wareOpen !== undefined ? !!d.wareOpen : S.life >= Math.pow(1000, WARE_LETTER); S.wareGift = !!(d && d.wareGift);
    S.spec = (d && d.spec) || {}; S.flyer = (d && d.flyer) || null;
    S.seed = (d && d.seed) || Math.floor(Math.random() * 1e9) + 1; S.born = (d && d.born) || Date.now();
    S.more = [];   // (streets after the first come from the save's top level: loadStreets)
  }
  const setFlyer = id => { S.flyer = id; changed(); };
  return { GOODS, ROW_NAMES, product, season, hotIds, quote, isAuto, candidates, planOf, auto, totals, nextTier, setTrial, sigOf: m => defsSig[m.id],
    stepOf, stepLine, stepName, stepMult, gradeOf, budget, crateStep, scaleOld, NSTEP,
    wareOn, wareCap, ware, fillWare, takeWare, lotOpen, place, priceOf, LOT_LETTER, LOT_AT, WARE_LETTER, openWare,
    listed, stepX, persona, personaLine, earnI, marginF, tierOf, loadsOf, TIER_LOADS, offers, setSpecial, isSpecial, setFlyer, get flyer() { return S.flyer; }, get born() { return S.born; }, get spec() { return S.spec; },
    lots: () => allLots(), owns: id => !!S.owned[id], STREETS, streetN, streetOf, streetOfId, openStreet, streetsSave, loadStreets, suits, hOf, streetAt: k => S.more[k - 1] ? S.more[k - 1].at : 0, requestExtra, extraFor, extraBegin, extraEnd, takeExtra, fits, newRound: () => { keepT = -Infinity; },
    applyDefs, setPlan, setAuto, rescue, pay, endRescue, earn, spend, boost, give, save, load, onChange: f => subs.push(f),
    recordSale, recordStock, soldCount, everStocked, albumCount, tierNews, paidLock, takeBack,
    get bank() { return S.bank; }, get life() { return S.life; }, isFree: m => !!S.free[m.id] };
})();
