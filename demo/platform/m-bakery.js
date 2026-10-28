/* 焼きたてパン「こむぎ堂」behaviour (geometry in m-bakery-build.js). An order: the coin; the front piece of dough in the
   proofing cabinet, once it has risen, is pushed onto the belt, rides through the tunnel oven and comes out golden; at
   the filling station a blade splits a roll along its length or the depositor's nozzle pushes into a bun, and the chosen
   hopper deposits (a salt roll gets its salt and butter); at the belt's end it tips down the chute into a film bag held
   open by two suction cups, and the bag goes down the slide to the take-out window. Behind it the pusher in the dough
   fridge sets a new piece at the back of the queue.
   The flaw: each piece needs PROOF of real time in the cabinet before it can bake; sold faster than that, the line waits
   with 発酵中 lit. Nothing moves while nothing happens (perf rule 3), apart from the queue rising, redrawn twice a second
   while the machine is in view. */
(() => {
  // its words in the other languages (the machine itself is painted in Japanese, as all of them are)
  I18N.add('en', {
    '现烤面包': 'Fresh Bakery', '面包料': 'Bakery supplies',
    'フライヤー': 'Fryer', 'パイローラー': 'Pie Roller', 'サンドイッチ台': 'Sandwich Table',
    '在传送带前加一口油锅 · 能卖咖喱面包、炸面包': 'An oil vat in front of the belt · sells curry buns and fried sugar rolls',
    '在发酵柜顶上加一台开酥机 · 能卖可颂、巧克力可颂': 'A pastry sheeter on the proofing cabinet · sells croissants and pains au chocolat',
    '加一张三明治台 · 能卖鸡蛋、炸猪排、水果、草莓三明治': 'A sandwich table · sells egg, pork cutlet, fruit and strawberry sandwiches',
    '咖喱面包在日本一般是裹上面包糠油炸的，炸过的外皮又脆又香。': 'In Japan a curry bun is usually crumbed and deep-fried, so the crust comes out crisp and fragrant.',
    '可颂的层次来自开酥：一大块黄油包进面团，反复擀薄、折叠，最后有几十层。': 'A croissant\'s layers come from laminating: a slab of butter is wrapped in dough, rolled thin and folded again and again, until there are dozens of layers.',
    '日本便利店的鸡蛋三明治用的是捣碎的水煮蛋拌蛋黄酱，面包去掉边，切成三角形。': 'A Japanese convenience-store egg sandwich is mashed boiled egg in mayonnaise, the crusts cut off, cut into triangles.',
    '在商店里可以买': 'Sold in the shop', '「こむぎ堂」的面包机送到了': 'The Komugi-do bakery machine has arrived', '机位里可以摆上它了': 'You can place it on a spot now',
    '点菜单选一种面包 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料': 'Tap the menu to pick a bread · tap the machine to call customers · drag sideways to turn · tap the lock to open and restock',
    '看传送带：右边玻璃柜里面团在发酵，推进烤炉出来变金黄，再切开夹馅，最后装袋': 'Follow the belt: dough proves in the glass cabinet on the right, goes into the oven and comes out golden, is split and filled, then bagged',
    '馅料放进滑轨上的料斗 · 面团桶放进后面的冷藏柜': 'Fillings go in the hoppers on the rail · dough tubs go in the fridge at the back',
  });
  I18N.add('ja', {
    '现烤面包': '焼きたてパン', '面包料': 'パンの材料', 'フライヤー': 'フライヤー', 'パイローラー': 'パイローラー', 'サンドイッチ台': 'サンドイッチ台',
    '在传送带前加一口油锅 · 能卖咖喱面包、炸面包': 'ベルトの前にフライヤー · カレーパンとあげパンが売れる',
    '在发酵柜顶上加一台开酥机 · 能卖可颂、巧克力可颂': '発酵庫の上にパイローラー · クロワッサンとパン・オ・ショコラが売れる',
    '加一张三明治台 · 能卖鸡蛋、炸猪排、水果、草莓三明治': 'サンドイッチ台を置く · たまご、カツ、フルーツ、いちごのサンドが売れる',
    '咖喱面包在日本一般是裹上面包糠油炸的，炸过的外皮又脆又香。': 'カレーパンはパン粉をつけて揚げるのが定番。揚げた皮はサクッと香ばしい。',
    '可颂的层次来自开酥：一大块黄油包进面团，反复擀薄、折叠，最后有几十层。': 'クロワッサンの層は折り込みから。バターを生地で包み、のばしてたたむのを繰り返して何十層にもなる。',
    '日本便利店的鸡蛋三明治用的是捣碎的水煮蛋拌蛋黄酱，面包去掉边，切成三角形。': 'コンビニのたまごサンドは、つぶしたゆで卵をマヨネーズであえ、耳を落として三角に切る。',
    '在商店里可以买': 'ショップで買える', '「こむぎ堂」的面包机送到了': '「こむぎ堂」のパン自販機が届いた', '机位里可以摆上它了': '空いている場所に置ける',
    '点菜单选一种面包 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料': 'メニューでパンを選ぶ · 機械をタップで客を呼ぶ · 左右ドラッグで回転 · 鍵をタップして開けて補充',
    '看传送带：右边玻璃柜里面团在发酵，推进烤炉出来变金黄，再切开夹馅，最后装袋': 'ベルトを見て：右のガラス庫で生地が発酵し、オーブンで焼けて、切って具をはさみ、袋に入る',
    '馅料放进滑轨上的料斗 · 面团桶放进后面的冷藏柜': '具はレールのホッパーへ · 生地の桶は奥の冷蔵庫へ',
  });
  // (the parts are interface: Chinese names them in both names modes, as i18n-fix.js does the prototype's; the goods'
  // names are in i18n-fix.js, since econ.js names the goods when it loads)
  I18N.add('zh', { 'フライヤー': '油炸锅', 'パイローラー': '开酥机', 'サンドイッチ台': '三明治台' });
  const { P, f } = ISO;
  const { BELT, BY, Q, OVEN, FILL, CHUTE, WINDOW, MENU, FRY, SAN, LAM } = PB;
  const RACK = PBB.RACK, BAG = PBB.BAG;
  ['anpan', 'cream', 'yakisoba', 'shio'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 95; });   // the starting stock's goods
  const CAP = 10, SLOTS = 4, LADLE = 1 / 40, HZ = 30, PROOF = 16000;
  let lv = { fryer: 0, lam: 0, sando: 0 };
  // hop: each hopper's fillings (oldest first); dough: the fridge's tubs; proof: when each piece in the cabinet went in
  // (front first; null when the cabinet has an empty place)
  const S = { hop: [[], [], [], []], dough: .85, proof: [0, 0, 0, 0], no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0;
  let rackOff = 0, beltOff = 0, nextPaint = 0, shift = 0;
  const coinState = [12, 7, 18, 5];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, dough: m.dough, shape: m.shape, how: m.how, fill: m.fill }; };
  const snap = pid => { const g = pid && ECON.product('bakery', pid); if (!g) return null; const q = ECON.quote('bakery', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, dough: g.dough, shape: g.shape, how: g.how, fill: g.fill }; };
  const count = () => S.hop.reduce((a, l) => a + l.length, 0);
  const canMake = k => S.hop[k].length > 0 && S.dough > .02;
  const anyHop = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };
  const risen = (t, now = Date.now()) => t != null && now - t >= PROOF;
  const rise = (t, now = Date.now()) => t == null ? 0 : Math.max(0, Math.min(1, (now - t) / PROOF));

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  // the queue in the cabinet: raw dough, swelling as it proves (shift: 0..1 while it moves up one place)
  function paintQueue() {
    if (!I) return; const now = Date.now();
    I.proofG.innerHTML = S.proof.map((t, i) => t == null ? '' : PBB.bread(Q[i] + (Q[Math.max(0, i - 1)] - Q[i]) * (i ? shift : 0), BY, BELT.z, { shape: 'round', dough: 'white', bake: 0, k: .62 + .32 * rise(t, now) })).join('');
  }
  // (lvOf: one hopper's level drawn as it runs down while depositing)
  const paintRack = (lvOf = null) => { if (I) I.rackG.innerHTML = PBB.rack(rackOff, MENU.map((m, k) => (S.hop[k][0] || m).fill), MENU.map((m, k) => lvOf && lvOf[0] === k ? lvOf[1] : S.hop[k].length / CAP)); };
  let headX = FILL;
  const paintHead = o => { if (I) I.nozzleG.innerHTML = PBB.head({ x: headX, ...o }); };
  const paintBelt = () => { if (I) I.beltG.innerHTML = PBB.belt(beltOff); };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    X.gauge.setAttribute('width', f(13.2 * Math.max(0, Math.min(1, S.dough)))); X.gauge.setAttribute('fill', S.dough < .25 ? '#ff6a3a' : '#f2e2c0');
    X.proofLamp.classList.toggle('on', !risen(S.proof[0]));
    if (!busy && !ready) X.lcd.textContent = S.dough <= .02 ? '生地切れ' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowBread(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.35) translate(${f(-sx)} ${f(-sy)})">${PBB.bagged(WINDOW[0], WINDOW[1], WINDOW[2] - 4, r.o, .6)}</g>`;
  }
  const paintBag = open => { if (!I) return; I.bagG.innerHTML = PBB.bagBack(open); I.bagFrontG.innerHTML = PBB.bagFront(open); };
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  // the piece on the belt: drawn at x, baked by how far through the oven it has come
  // (from: where it came onto the belt inside the oven, the pie roller's slot; else the oven's right mouth)
  const bakeAt = (x, from = OVEN.x1 - 2) => Math.max(0, Math.min(1, (from - x) / (from - OVEN.x0 - 4)));
  // (it rises in the heat as it browns: the dough ball's size going in, the full size coming out)
  // (fried dough only colours a little in the oven, cap; the fryer browns it)
  const piece = (x, y, z, o, b) => PBB.bread(x, y, z, { ...o, bake: b, k: (o.k || 1) * (.72 + .28 * b) });
  const baked = (x, o) => Math.min(o.cap ?? 1, Math.max(o.bake || 0, bakeAt(x, o.from)));
  const paintPiece = (x, o) => { if (I) I.breadG.innerHTML = piece(x, BY, BELT.z, o, baked(x, o)); };
  // the belt carries the piece from x0 to x1 (the slats move with it; 30 redraws a second)
  async function carry(o, x0, x1, ms) {
    const g0 = gen, b0 = beltOff; let last = 0;
    SND.belt && SND.belt(true);
    await UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      const x = x0 + (x1 - x0) * e; beltOff = b0 + (x - x0); paintBelt(); paintPiece(x, o); o.bake = baked(x, o); }, UTIL.ease.inOut);
    SND.belt && SND.belt(false);
    return g0 === gen;
  }
  async function slideRack(k) {
    const from = rackOff, d = k - from, g0 = gen; if (Math.abs(d) < .01) return;
    await UTIL.tween(200 + 140 * Math.abs(d), e => { if (g0 !== gen) return; rackOff = from + d * e; paintRack(); }, UTIL.ease.inOut); if (g0 === gen) rackOff = k;
  }
  const top = o => BELT.z + ({ round: 4.4, roll: 3.8, cornet: 3.6, loaf: 6.4, crescent: 3.4 }[o.shape] || 4.4) * (o.k || 1);
  // the depositor: hopper k slides over to dock on the dosing block (its lamp lights), the head runs over the piece and
  // its rod drives the nozzle down. A roll: along the slit from its right end, laying the filling as it goes. A bun:
  // into its top, the bun swelling a little as the filling goes in. Salt, sugar: held over it, sprinkled. Then up,
  // a last drop on the tip drawn back, and the head waits over the station.
  async function deposit(k, o, t, live) {
    const c = o.fill, [rx0] = PBB.SIZE[o.shape] || PBB.SIZE.round, rx = rx0 * (o.k || 1), lv0 = (S.hop[k].length + 1) / CAP, lv1 = S.hop[k].length / CAP;
    const dock = on => { const d = G && G.interior && G.interior.querySelector('.pb-dock'); if (d) d.setAttribute('fill', on ? '#5aff7a' : '#3a5a3a'); };
    paintRack([k, lv0]);
    await slideRack(k); if (!live()) return false;
    paintRack([k, lv0]); dock(true); SND.tok();
    const head = (x, o2) => { headX = x; paintHead({ c, ...o2 }); };
    const move = async (x1, ms = 240) => { const x0 = headX; await UTIL.tween(ms, e => { if (live()) head(x0 + (x1 - x0) * e, {}); }, UTIL.ease.inOut); return live(); };
    const down = async (ext, ms, back) => { await UTIL.tween(ms, e => { if (live()) head(headX, { ext: ext * (back ? 1 - e : e) }); }, back ? UTIL.ease.out : UTIL.ease.in); return live(); };
    if (o.how === 'split' || o.how === 'sando') {
      const xs = FILL + rx * .68, xe = FILL - rx * .68, ext = PBB.TIP - (t + .8);
      if (!await move(xs) || !await down(ext, 200)) return false;
      SND.pour && SND.pour(.3);
      await UTIL.tween(700, e => { if (!live()) return; o.filled = e; paintPiece(FILL, o); head(xs + (xe - xs) * e, { ext, flow: t + .2 }); paintRack([k, lv0 + (lv1 - lv0) * e]); }, UTIL.ease.inOut); if (!live()) return false;
    } else if (o.how === 'inject') {
      // into the top of the bun, about halfway down
      const ext = PBB.TIP - (BELT.z + (t - BELT.z) * .55);
      if (!await move(FILL) || !await down(ext, 240)) return false;
      SND.pour && SND.pour(.3);
      const k0 = o.k || 1;
      await UTIL.tween(520, e => { if (!live()) return; o.k = k0 * (1 + .05 * Math.sin(Math.min(1, e * 1.4) * Math.PI / 2)); paintPiece(FILL, o); head(headX, { ext: ext + .4 * Math.sin(e * Math.PI) }); paintRack([k, lv0 + (lv1 - lv0) * e]); }, UTIL.ease.inOut); if (!live()) return false;
      o.k = k0 * 1.03; o.filled = true; paintPiece(FILL, o);
    } else {
      // salt, sugar: held just over it, a shake down onto the top
      const ext = PBB.TIP - (t + 4);
      if (!await move(FILL) || !await down(ext, 200)) return false;
      await UTIL.tween(560, e => { if (!live()) return; head(headX, { ext, dust: e, dustC: c, dustZ: t }); if (e > .45 && !o.filled) { o.filled = true; paintPiece(FILL, o); } paintRack([k, lv0 + (lv1 - lv0) * e]); }, e => e); if (!live()) return false;
      o.filled = true; paintPiece(FILL, o);
    }
    o.filled = true; SND.tok(); paintRack();
    // up, with the last drop on the tip; it is drawn back in
    const top = o.how === 'split' || o.how === 'sando' ? PBB.TIP - (t + .8) : o.how === 'inject' ? PBB.TIP - (BELT.z + (t - BELT.z) * .55) : PBB.TIP - (t + 4);
    await UTIL.tween(220, e => { if (live()) head(headX, { ext: top * (1 - e), drip: o.how === 'salt' || o.how === 'glaze' ? 0 : Math.sin(Math.min(1, e * 1.3) * Math.PI) }); }, UTIL.ease.out); if (!live()) return false;
    dock(false); move(FILL, 300);
    return true;
  }
  /* ---------- the upgrades' stations ---------- */
  const SIZEY = o => (PBB.SIZE[o.shape] || PBB.SIZE.round)[1] * (o.k || 1);
  const paintSweep = (fe, se) => { if (I && I.sweepG) I.sweepG.innerHTML = (lv.fryer ? PBB.sweeper(FRY.x, fe) : '') + (lv.sando ? PBB.sweeper(FILL, se) : ''); };
  // the pie roller: a block of laminated dough out of the chilled stocker, through the rollers to the left, back
  // through them (closer) to the right, rolled up from its left end into a croissant (or a pain au chocolat's roll),
  // and dropped through the slot into the oven
  async function roll(o, live) {
    if (!I.lamG) return true;
    const { rx, slot, z } = LAM, s0 = LAM.st[0], d0 = 3.4, th0 = 2.6, th1 = 1, l1 = d0 * th0 / th1, ym = (LAM.ya + LAM.yb) / 2;
    let st = { parts: [], ph: 0, gap: th1 };
    const draw = () => { if (live()) I.lamG.innerHTML = PBB.sheeter(st); };
    SND.click();
    // out of the stocker up to the rollers
    await UTIL.tween(380, e => { const a = s0 + .4 - (s0 + .4 - rx) * e; st.parts = [[a, a + d0, th0]]; draw(); }, UTIL.ease.inOut); if (!live()) return false;
    // through them to the left: thin and long
    SND.belt && SND.belt(true);
    await UTIL.tween(760, e => { st.ph = e * 4; st.parts = [[rx - l1 * e, rx, th1], [rx, rx + d0 * (1 - e), th0]]; draw(); }, e => e); if (!live()) return false;
    SND.belt && SND.belt(false);
    st.ph = null;
    // rolled up from the end at the rollers, the roll growing as it goes left; to the table's end and down the chute
    // into the slot in the oven's roof
    await UTIL.tween(560, e => { const b = rx - l1 * e; st.parts = [[rx - l1, b, th1]]; st.cro = { x: Math.max(b - 1, rx - l1 + 1.4), k: .3 + .5 * e, o }; draw(); }, UTIL.ease.inOut); if (!live()) return false;
    const xe = LAM.x0 + 2.4, x1 = st.cro.x;
    await UTIL.tween(220, e => { st.parts = []; st.cro.x = x1 + (xe - x1) * e; draw(); }, UTIL.ease.inOut); if (!live()) return false;
    st.cro = null; draw();
    const cro = { ...o, bake: 0, k: .8 };
    await UTIL.tween(300, e => { if (live()) I.chuteG.innerHTML = PBB.chute(PBB.bread(xe + (slot - xe) * e, ym, z - .1 - (z - BELT.z - OVEN.h - .2) * e, cro)); }, UTIL.ease.in); if (!live()) return false;
    I.chuteG.innerHTML = PBB.chute();
    o.from = LAM.from;
    await UTIL.tween(180, e => { if (live()) I.breadG.innerHTML = piece(slot, BY, BELT.z + 12 * (1 - e * e), o, 0); }); if (!live()) return false;
    SND.tok(); paintPiece(slot, o);
    return true;
  }
  // the fryer: the paddle sweeps the piece off the belt into the basket in the oil; it fries (browning, puffing up),
  // the basket lifts it level with the belt and it slides back; the basket goes down again
  async function fry(o, live) {
    if (!I.fryG) return true;
    const lamp = on => { const l = G && G.interior && G.interior.querySelector('.pb-frylamp'); if (l) l.setAttribute('fill', on ? '#ff6a2a' : '#5a2a1a'); };
    const zIn = lift => FRY.oil - 2.6 + (BELT.z + .4 - (FRY.oil - 2.6)) * lift + .3, yIn = (FRY.y0 + FRY.y1) / 2;
    const inBasket = (lift, boil = -1, z = zIn(lift)) => { I.fryG.innerHTML = PBB.basket(lift, piece(FRY.x, yIn, z, o, o.bake), boil); };
    lamp(true); SND.click();
    let y1 = BY;
    await UTIL.tween(420, e => { if (!live()) return; paintSweep(e, 0); y1 = Math.max(BY, PBB.sweepY(e) + 2.2 + SIZEY(o) * (.72 + .28 * o.bake)); I.breadG.innerHTML = piece(FRY.x, y1, BELT.z, o, o.bake); }, UTIL.ease.inOut); if (!live()) return false;
    I.breadG.innerHTML = '';
    UTIL.tween(320, e => { if (live()) paintSweep(1 - e, 0); }, UTIL.ease.inOut);
    await UTIL.tween(200, e => { if (!live()) return; I.fryG.innerHTML = PBB.basket(0, piece(FRY.x, y1 + (yIn - y1) * e, BELT.z + (zIn(0) - BELT.z) * e, o, o.bake)); }, UTIL.ease.in); if (!live()) return false;
    SND.pour && SND.pour(.5);
    const b0 = o.bake;
    await UTIL.tween(1500, e => { if (!live()) return; o.bake = b0 + (1 - b0) * e; inBasket(0, e * 4); }, e => e); if (!live()) return false;
    o.bake = 1; o.cap = 1;
    await UTIL.tween(320, e => { if (live()) inBasket(e); }, UTIL.ease.inOut); if (!live()) return false;
    I.fryG.innerHTML = PBB.basket(1);
    await UTIL.tween(240, e => { if (live()) I.breadG.innerHTML = piece(FRY.x, yIn + (BY - yIn) * e, BELT.z + .7 * (1 - e), o, 1); }, UTIL.ease.inOut); if (!live()) return false;
    SND.tok(); lamp(false);
    UTIL.tween(320, e => { if (live()) I.fryG.innerHTML = PBB.basket(1 - e); }, UTIL.ease.inOut);
    return true;
  }
  // the sandwich table: the paddle sweeps the filled loaf forward onto the table, the knife comes down (the crusts
  // fall away, two triangles left), the hatch opens over the bag and they drop in
  async function sandwich(o, live) {
    if (!I.tableG) return true;
    const z = SAN.z, y2 = (SAN.y0 + SAN.y1) / 2;
    let open = 0, d = 0, at = null, crumbs = -1;
    const draw = () => { if (!live()) return;
      I.tableG.innerHTML = PBB.table(open) + (at ? PBB.bread(at[0], at[1], at[2], at[3]) : '')
        + (crumbs >= 0 ? [-1, 1].map(sx => { const [a, b] = ISO.P(SAN.x + sx * 6.6, y2, z + 3 - 9 * crumbs); return `<rect x="${ISO.f(a - .5)}" y="${ISO.f(b - 2)}" width="1" height="4" rx=".4" fill="#b8702a" opacity="${ISO.f(1 - crumbs)}"/>`; }).join('') : '') + PBB.knife(d); };
    SND.click();
    let y1 = BY;
    const oS = { ...o, bake: 1 };
    await UTIL.tween(460, e => { if (!live()) return; paintSweep(0, e); y1 = Math.max(BY, PBB.sweepY(e) + 2.2 + SIZEY(o));
      const x = FILL + (SAN.x - FILL) * Math.max(0, Math.min(1, (y1 - BY) / (y2 - BY)));
      if (y1 < BELT.y1) I.breadG.innerHTML = PBB.bread(x, y1, BELT.z, oS); else { I.breadG.innerHTML = ''; at = [x, y1, z + (BELT.z - z) * (1 - e), oS]; draw(); } }, UTIL.ease.inOut); if (!live()) return false;
    I.breadG.innerHTML = '';
    UTIL.tween(320, e => { if (live()) paintSweep(0, 1 - e); }, UTIL.ease.inOut);
    await UTIL.tween(160, e => { at = [SAN.x + (at[0] - SAN.x) * (1 - e), y1 + (y2 - y1) * e, z, oS]; draw(); }, UTIL.ease.out); if (!live()) return false;
    // the knife: down through it (crustless, cut in two), up again
    await UTIL.tween(220, e => { d = e; draw(); }, UTIL.ease.in); if (!live()) return false;
    SND.click(); Object.assign(o, { shape: 'sando', cut: false }); at = [SAN.x, y2, z, { ...o, k: .9 }];
    UTIL.tween(360, e => { crumbs = e; draw(); }).then(() => { crumbs = -1; draw(); });
    await UTIL.tween(260, e => { d = 1 - e; draw(); }, UTIL.ease.out); if (!live()) return false;
    // the hatch and the bag open; the sandwich drops through into the bag's mouth
    const opening = UTIL.tween(300, e => { if (live()) paintBag(e); }, UTIL.ease.out);
    open = 1; at = null; draw();
    await along(PBB.bread(0, 0, 0, { ...o, k: .9 }), [[SAN.x, y2, z], [BAG.x, BAG.y + 1, BAG.z + BAG.h + 6]], 360); if (!live()) return false;
    await opening; open = 0; draw();
    return true;
  }
  // make one of hopper k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen, p = S.hop[k][0] || prod(k);   // the piece in the hopper (the menu may have changed since it went in)
    // the upgrades' routes: croissant dough comes off the pie roller (not from the cabinet), fried dough goes through
    // the fryer, a sandwich is cut on the table
    const lam = lv.lam && p.dough === 'cro', fried = lv.fryer && p.dough === 'fried', sand = lv.sando && p.how === 'sando';
    // the front piece has to have risen
    while (!lam && !risen(S.proof[0])) { if (!live()) return null; if (X) { X.proofLamp.classList.add('on'); X.lcd.textContent = `発酵中 · あと${Math.ceil((PROOF - (Date.now() - (S.proof[0] ?? Date.now()))) / 1000)}秒`; } paintQueue(); await UTIL.wait(250); }
    if (!live()) return null;
    if (X) X.lcd.textContent = `${S.no}番 · 焼いています`;
    S.hop[k].shift(); paintRack(); S.dough = Math.max(0, S.dough - LADLE);
    const o = { shape: p.shape, dough: p.dough, how: p.how, fill: p.fill, g: p.g, bake: 0, cut: false, filled: false, k: 1.3 };   // (risen and baked: bigger than the dough ball)
    if (fried) o.cap = .3;
    const ms = d => 2800 * d / (Q[0] - 6 - FILL);   // (the belt's pace)
    if (lam) { if (X) X.lcd.textContent = `${S.no}番 · 生地をのばしています`; if (!await roll(o, live)) return null; }
    else {
    // the pusher sets it on the belt at the oven's mouth; the queue moves up and a new piece comes in at the back
    const front = S.proof[0]; S.proof = [...S.proof.slice(1), null];
    paintQueue();
    await UTIL.tween(320, e => { if (!live()) return; I.pusherG.innerHTML = PBB.pusher(e); paintPiece(Q[0] - 6 * e, { ...o, shape: e < .5 ? 'round' : o.shape }); }, UTIL.ease.inOut); if (!live()) return null;
    UTIL.tween(420, e => { if (!live()) return; shift = e; paintQueue(); if (I) I.pusherG.innerHTML = PBB.pusher(1 - e); }, UTIL.ease.inOut).then(() => { if (!live()) return; shift = 0;
      // the fridge's pusher: a new piece at the back (when there is dough)
      S.proof = S.proof.slice(0, 3).concat(S.dough > .02 ? [Date.now()] : [null]); paintQueue(); paintDoor(); SND.tok(); });
    void front;
    }
    // through the oven (and the fryer) on to the filling station
    if (X) { X.bakeLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 焼いています`; }
    const x0 = lam ? LAM.slot : Q[0] - 6, xf = fried ? FRY.x : FILL;
    if (!await carry(o, x0, xf, ms(x0 - xf))) return null;
    if (X) X.bakeLamp.classList.remove('on');
    if (fried) { if (X) X.lcd.textContent = `${S.no}番 · 揚げています`; if (!await fry(o, live) || !await carry(o, FRY.x, FILL, ms(FRY.x - FILL))) return null; }
    o.bake = 1; paintPiece(FILL, o);
    const t = top(o);
    if (o.how === 'split' || o.how === 'sando') {
      SND.click();
      await UTIL.tween(160, e => { if (live()) I.bladeG.innerHTML = PBB.blade(0, e, t); }, UTIL.ease.in); if (!live()) return null;
      await UTIL.tween(380, e => { if (live()) I.bladeG.innerHTML = PBB.blade(e, 1, t); if (e > .5) { o.cut = true; paintPiece(FILL, o); } }, UTIL.ease.inOut); if (!live()) return null;
      UTIL.tween(300, e => { if (live()) I.bladeG.innerHTML = PBB.blade(1 - e, 1 - e, t); }, UTIL.ease.inOut);
    }
    // (melon, croissant, the loaf: nothing goes in; they pass the station as they are)
    if (o.how !== 'none' && !await deposit(k, o, t, live)) return null;
    if (sand) { if (!await sandwich(o, live)) return null; }
    else {
      // to the belt's end and down the chute into a bag
      if (!await carry(o, FILL, CHUTE + 2, 520)) return null;
      I.breadG.innerHTML = '';
      const opening = UTIL.tween(300, e => { if (live()) paintBag(e); }, UTIL.ease.out);
      await along(PBB.bread(0, 0, 0, { ...o, k: .9 }), [[CHUTE + 2, BY, BELT.z], [CHUTE + 4, BELT.y0 + 4, BELT.z - 2], [BAG.x, BAG.y + 1, BAG.z + BAG.h + 6]], 460); if (!live()) return null;
      await opening;
    }
    await along(PBB.bread(0, 0, 0, { ...o, k: .9 }), [[BAG.x, BAG.y - 2, BAG.z + BAG.h + 6], [BAG.x, BAG.y - 2, BAG.z + 1]], 220); if (!live()) return null;
    paintBag(0); SND.tok();
    await along(PBB.bagged(0, 0, 0, o, .9), [[BAG.x, BAG.y + .1, BAG.z], [BAG.x + 8, 81, BAG.z - 12], [WINDOW[0], WINDOW[1] + 1, 30]], 480); if (!live()) return null;
    making = false; paintDoor();
    return { p, o };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyHop() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.pb-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn((S.hop[kk][0] || MENU[kk]).price, PB.SLOTW);
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p: r.p, o: r.o, no, who }; ready = done; windowBread(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · 焼きあがりました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price: r.p.price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#c97c2c');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#c97c2c'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: fillings into the rack's hoppers, a tub of dough into the fridge ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const hopTop = k => [FILL + (k - rackOff) * RACK.gap, RACK.y, RACK.z + 14.5];
  const supply = {
    title: T`面包料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-pb-pack', vars: `--c:${m.fill}`, pos: [8 + j * 9.4, 10 + k * 15, 2], target: 'f' + k }))),
      { glyph: 'g-pb-dough', vars: '', pos: [104, 40, 2], target: 'dough' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'dough' ? [PB.PROOF.x0 + 14, 30, BELT.z + 44] : hopTop(+t.slice(1)),
    accept: t => t === 'dough' ? S.dough < .97 : S.hop[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'dough' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'dough' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t[0] === 'f' && !ECON.everStocked('bakery', MENU[+t.slice(1)].pid),
    stocks: t => { if (t[0] !== 'f') return []; const k = +t.slice(1); reserved[k]++; return [['bakery', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'dough') {
        const from = S.dough; SND.pour(1); UTIL.tween(900, e => { S.dough = from + (1 - from) * e; }).then(() => { S.dough = 1; fillQueue(); SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(30 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut);
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.hop[k].length < CAP) { S.hop[k].push(prod(k)); paintRack(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target[0] !== 'f') - (b.target[0] !== 'f')),
  };
  // empty places in the cabinet take a piece when there is dough (it starts rising now)
  function fillQueue() { const now = Date.now(); S.proof = S.proof.map(t => t == null && S.dough > .02 ? now : t); paintQueue(); }

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.hop.forEach((l, k) => { for (let j = 0; j < 5; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = PBB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, PB.D, PB.H);
    if (ready) { windowBread(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    shift = 0;
    I = PBB.interior(G.interior, coinState, lv); I.defs.innerHTML = PBB.defs(); PBB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    paintQueue(); paintRack(); shell();
  }
  // the queue rises on its own while in view: redrawn twice a second while any piece is still rising
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 500; if (!making && S.proof.some(t => t != null && !risen(t))) paintQueue(); paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, PB.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyHop() < 0) return null; vend(null, 'customer'); return T`面包`; }
  // off screen: one baked to order (the cabinet keeps up at the street's pace)
  function idleSell() {
    const k = anyHop(); if (k < 0) return 0;
    const p = S.hop[k].shift(); S.dough = Math.max(0, S.dough - LADLE); S.no = S.no % 99 + 1;
    if (I && !making) paintRack(); if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    id: 'bakery', fig: 17, name: T`现烤面包`, brand: 'こむぎ堂', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#c97c2c',
    render: () => render(),
    hint: { shut: T`点菜单选一种面包 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`,
      xray: T`看传送带：右边玻璃柜里面团在发酵，推进烤炉出来变金黄，再切开夹馅，最后装袋`,
      open: T`馅料放进滑轨上的料斗 · 面团桶放进后面的冷藏柜` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ hop: S.hop.map(l => l.map(p => p.pid)), dough: S.dough, proof: S.proof.slice(), no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.hop)) S.hop = [0, 1, 2, 3].map(k => (d.hop[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.dough === 'number') S.dough = Math.max(0, Math.min(1, d.dough));
      if (Array.isArray(d.proof)) S.proof = [0, 1, 2, 3].map(i => typeof d.proof[i] === 'number' ? d.proof[i] : null);
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    labels: () => MENU.map((m, k) => { const p = S.hop[k][0] || m; return { name: p.name, n: S.hop[k].length, c: p.fill, pt: hopTop(k) }; }),
    labelStyle: 'mini',
    goods: {
      kind: 'bakery', defaults: ['anpan', 'cream', 'yakisoba', 'shio'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.hop[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, dough: g.dough, shape: g.shape, how: g.how, fill: g.fill })),
    },
    paid: 'm-bakery',   // sold in the shop (pay.js): open once bought with real money, no game money to place it, no test run
    unlock: { open: () => typeof PAY !== 'undefined' && PAY.has('m-bakery'), hint: () => T`在商店里可以买`,
      card: () => [T`「こむぎ堂」的面包机送到了`, T`机位里可以摆上它了`] },
    upgrades: [
      { id: 'fryer', name: T`フライヤー`, cost: [20000], effect: [T`在传送带前加一口油锅 · 能卖咖喱面包、炸面包`], kind: T`新货`, pin: [FRY.x, FRY.y1, FRY.z - 6],
        fact: T`咖喱面包在日本一般是裹上面包糠油炸的，炸过的外皮又脆又香。` },
      { id: 'lam', name: T`パイローラー`, cost: [60000], effect: [T`在发酵柜顶上加一台开酥机 · 能卖可颂、巧克力可颂`], kind: T`新货`, pin: [LAM.rx, LAM.y1, LAM.z + 3],
        fact: T`可颂的层次来自开酥：一大块黄油包进面团，反复擀薄、折叠，最后有几十层。` },
      { id: 'sando', name: T`サンドイッチ台`, cost: [100000], effect: [T`加一张三明治台 · 能卖鸡蛋、炸猪排、水果、草莓三明治`], kind: T`新货`, pin: [SAN.x + 6, SAN.y1, SAN.z - 2],
        fact: T`日本便利店的鸡蛋三明治用的是捣碎的水煮蛋拌蛋黄酱，面包去掉边，切成三角形。` },
    ],
    applyParts: l => { lv = { fryer: l.fryer || 0, lam: l.lam || 0, sando: l.sando || 0 }; },
  });
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.hop = d.hop.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.dough = 1; me.load(d); return added || 1; };
  me.stuck = () => S.dough <= .02 && [0, 1, 2, 3].every(k => !canMake(k));
  // a new save: the cabinet starts full and risen
  S.proof = S.proof.map(() => Date.now() - PROOF);
})();
