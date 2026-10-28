/* たこ焼き「てっぱん丸」behaviour (geometry in m-teppan-build.js). An order: the coin; a paper boat drops off the stack
   onto the belt and rides to the griddle; the carriage brings its picks over the front-most ready row, lowers them,
   turns the six balls once more and lifts them out over the boat, where they drop in; on its way back it pours that
   row again (batter, then octopus). The boat rides on: the sauce carousel turns the chosen bottle to the front and
   squeezes a zigzag, the mayonnaise nozzle another, the laver or the green onion, the bonito flakes (they move in the
   heat), the clear lid; down the slide to the take-out window.
   The flaw: a row needs COOK of real time on the griddle; three rows, sold faster than that, and the line waits with
   焼き中 lit. Nothing moves while nothing happens (perf rule 3), apart from the rows cooking, redrawn twice a second
   while the machine is in view. */
(() => {
  I18N.add('en', {
    'お好み焼き鉄板': 'Okonomiyaki griddle', '焼きそば台': 'Yakisoba griddle', 'いか焼きプレス': 'Ikayaki press',
    '在机柜上层加一块平铁板 · 能卖猪肉大阪烧、葱烧、什锦大阪烧、猪肉蛋卷、海鲜大阪烧': 'A flat griddle on the upper deck · sells pork, negiyaki, mixed, tonpeiyaki and seafood okonomiyaki',
    '上层加一台炒面铁板 · 能卖酱汁炒面、盐味炒面、蛋包炒面': 'A yakisoba griddle on the upper deck · sells yakisoba, salt yakisoba and omusoba',
    '上层加一台烤鱿鱼压板 · 能卖鱿鱼烧、加蛋鱿鱼烧': 'An ikayaki press on the upper deck · sells ikayaki and ikayaki with egg',
    '大阪烧的面糊里拌了大量卷心菜丝，翻面时用两把铁铲一起铲起来，一口气翻过去。': 'Okonomiyaki batter is mostly shredded cabbage; to turn it, two spatulas go under together and flip it in one go.',
    '日本的酱汁炒面最后常撒青海苔，配红姜丝；把炒面包进薄蛋皮里就是「オムそば」。': 'Japanese yakisoba usually ends with green laver and red pickled ginger; wrapped in a thin omelette it becomes omusoba.',
    '大阪的「いか焼き」不是整只烤鱿鱼：鱿鱼块拌进面糊，用上下两块铁板一压，几十秒就熟，对折着吃；打个鸡蛋进去的叫「デラ焼き」。': 'Osaka ikayaki is not a grilled whole squid: squid pieces in batter, pressed between two hot plates for under a minute and folded in half; with an egg it is called dera-yaki.',
    '章鱼烧料': 'Takoyaki supplies',
    '点菜单选一种口味 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料': 'Tap the menu to pick a flavour · tap the machine to call customers · drag sideways to turn · tap the lock to open and restock',
    '看铁板：每排六个，倒面糊、放章鱼、钢签翻面，烤到金黄后整排夹进舟皿，再淋酱、撒柴鱼、盖盖子': 'Watch the griddle: six to a row, batter, octopus, turned with the picks; golden, the whole row goes into a boat, then sauce, bonito flakes and a lid',
    '酱瓶插进转盘 · 面糊桶倒进后面的罐子': 'Sauce bottles go in the carousel · the batter tub goes in the tank at the back',
    '在商店里可以买': 'Sold in the shop', '「てっぱん丸」的铁板机送到了': 'The Teppan-maru griddle machine has arrived', '机位里可以摆上它了': 'You can place it on a spot now',
  });
  I18N.add('ja', {
    'お好み焼き鉄板': 'お好み焼き鉄板', '焼きそば台': '焼きそば台', 'いか焼きプレス': 'いか焼きプレス',
    '在机柜上层加一块平铁板 · 能卖猪肉大阪烧、葱烧、什锦大阪烧、猪肉蛋卷、海鲜大阪烧': '上の段に平らな鉄板 · 豚玉、ねぎ焼き、ミックス玉、とん平焼き、海鮮ミックスが売れる',
    '上层加一台炒面铁板 · 能卖酱汁炒面、盐味炒面、蛋包炒面': '上の段に焼きそばの鉄板 · ソース焼きそば、塩焼きそば、オムそばが売れる',
    '上层加一台烤鱿鱼压板 · 能卖鱿鱼烧、加蛋鱿鱼烧': '上の段にいか焼きプレス · いか焼き、デラ焼きが売れる',
    '大阪烧的面糊里拌了大量卷心菜丝，翻面时用两把铁铲一起铲起来，一口气翻过去。': 'お好み焼きの生地はキャベツがたっぷり。返すときはヘラ二本を同時に差し込んで、一気にひっくり返す。',
    '日本的酱汁炒面最后常撒青海苔，配红姜丝；把炒面包进薄蛋皮里就是「オムそば」。': 'ソース焼きそばの仕上げは青のりと紅しょうが。薄焼き卵で包めば「オムそば」。',
    '大阪的「いか焼き」不是整只烤鱿鱼：鱿鱼块拌进面糊，用上下两块铁板一压，几十秒就熟，对折着吃；打个鸡蛋进去的叫「デラ焼き」。': '大阪の「いか焼き」は姿焼きではない。いかの切り身を生地に混ぜ、上下の鉄板でプレスして数十秒、二つ折りで食べる。卵入りは「デラ焼き」。',
    '章鱼烧料': 'たこ焼きの材料',
    '点菜单选一种口味 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料': 'メニューで味を選ぶ · 機械をタップで客を呼ぶ · 左右ドラッグで回転 · 鍵をタップして開けて補充',
    '看铁板：每排六个，倒面糊、放章鱼、钢签翻面，烤到金黄后整排夹进舟皿，再淋酱、撒柴鱼、盖盖子': '鉄板を見て：一列六こ、生地、たこ、ピックで返して、きつね色になったら一列ごと舟へ。ソース、かつお、ふた',
    '酱瓶插进转盘 · 面糊桶倒进后面的罐子': 'ソースはターンテーブルへ · 生地の桶は奥のタンクへ',
    '在商店里可以买': 'ショップで買える', '「てっぱん丸」的铁板机送到了': '「てっぱん丸」の鉄板自販機が届いた', '机位里可以摆上它了': '空いている場所に置ける',
  });
  I18N.add('zh', { 'お好み焼き鉄板': '大阪烧铁板', '焼きそば台': '炒面台', 'いか焼きプレス': '鱿鱼烧压板' });
  const { P, f } = ISO;
  const { PL, CX, CY, LINE, LY, STACK, RECV, SAUCE, MAYO, NORI, NEGI, KATSU, LID, BK, CAR, CAR4, WINDOW, MENU, DB, DBY } = TP;
  ['sauce', 'negipon', 'terimayo', 'mentai'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 100; });   // the starting stock's goods
  const CAP = 10, SLOTS = 4, LADLE = 1 / 30, HZ = 30, COOK = 15000;
  // hop: each bottle's servings (oldest first); batter: the tank; rows: when each row was poured (null: empty)
  const S = { hop: [[], [], [], []], batter: .85, rows: [0, 0, 0], no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0;
  let beltOff = 0, nextPaint = 0, carY = CAR.rest, rot = 0, carBusy = Promise.resolve();
  // what the order is doing to the griddle: the row lifted out (its dimples empty), a row's turn, the row not fed yet
  let lifted = -1, spin = null, unfed = -1;
  const coinState = [12, 7, 18, 5];
  let lv = { flat: 0, soba: 0, ika: 0 };   // the upgrades: the okonomiyaki griddle, the yakisoba griddle, the ikayaki press

  /* ---------- products, stock ---------- */
  // (what the line needs of a product: kind — tako, or the deck's okono / soba / ika — the sauce, mayonnaise, the topping…)
  const LOOK = ['g', 'kind', 'sauce', 'sw', 'mayo', 'top', 'katsu', 'nori', 'beni', 'egg'];
  const look = g => Object.fromEntries(LOOK.map(key => [key, g[key]]));
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, ...look(m) }; };
  const snap = pid => { const g = pid && ECON.product('teppan', pid); if (!g) return null; const q = ECON.quote('teppan', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, ...look(g) }; };
  const onDeck = p => p && (p.kind === 'okono' || p.kind === 'soba' || p.kind === 'ika');
  const count = () => S.hop.reduce((a, l) => a + l.length, 0);
  const canMake = k => S.hop[k].length > 0 && (onDeck(S.hop[k][0]) ? S.batter > .02 : S.batter > .02 || S.rows.some(t => t != null));
  const anyHop = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };
  const cook = (t, now = Date.now()) => t == null ? null : Math.max(0, Math.min(1, (now - t) / COOK));
  // the front-most row that is done (−1: none yet)
  const doneRow = (now = Date.now()) => { for (let j = PL.ny - 1; j >= 0; j--) if (S.rows[j] != null && cook(S.rows[j], now) >= 1) return j; return -1; };
  const nextDone = (now = Date.now()) => Math.min(...S.rows.filter(t => t != null).map(t => COOK - (now - t)), Infinity);

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  // the griddle: each row by how far it has cooked (turned a quarter at a time as it sets)
  function paintPlate() {
    if (!I) return; const now = Date.now();
    const rows = S.rows.map((t, j) => j === lifted ? null : cook(t, now));
    const turns = rows.map((c, j) => spin && spin.j === j ? spin.a : c == null || c < .3 ? 0 : Math.floor((c - .3) / .14) * 1.1);
    I.plateG.innerHTML = TPB.griddle(rows, turns, unfed);
  }
  const paintCar = (d = 0, o = {}) => { if (!I) return; I.carG.innerHTML = TPB.carriage(carY, d, o); I.hoseG.innerHTML = TPB.hoses(carY); };
  const paintCarousel = (sq = 0, stream = null) => { if (I) I.carouselG.innerHTML = TPB.carousel(rot, MENU.map((m, k) => (S.hop[k][0] || m).sauce || '#f4f0e0'), MENU.map((m, k) => S.hop[k].length / CAP), sq, stream); };
  const paintBelt = () => { if (I) I.beltG.innerHTML = TPB.belt(beltOff); };
  const paintBoat = (x, o, z = LINE.z) => { if (I) I.boatG.innerHTML = TPB.boat(x, LY, z, { ...o, ph: performance.now() / 1000 }, BK); };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    X.gauge.setAttribute('width', f(13.2 * Math.max(0, Math.min(1, S.batter)))); X.gauge.setAttribute('fill', S.batter < .25 ? '#ff6a3a' : '#f6e6b4');
    X.cookLamp.classList.toggle('on', doneRow() < 0);
    if (!busy && !ready) X.lcd.textContent = S.batter <= .02 && doneRow() < 0 ? '生地切れ' : 'いらっしゃい';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowBoat(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.5) translate(${f(-sx)} ${f(-sy)})">${r.o.f ? TPB.pack(WINDOW[0], WINDOW[1] - 2, WINDOW[2] - 4, { ...r.o, lid: 1 }, .8) : TPB.boat(WINDOW[0], WINDOW[1] - 2, WINDOW[2] - 4, { ...r.o, lid: 1 }, .9)}</g>`;
  }
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  // the belt carries the boat from x0 to x1 (the slats move with it; 30 redraws a second)
  async function carry(o, x0, x1, ms) {
    const g0 = gen, b0 = beltOff; let last = 0;
    SND.belt && SND.belt(true);
    await UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      const x = x0 + (x1 - x0) * e; beltOff = b0 + (x - x0); paintBelt(); paintBoat(x, o); }, UTIL.ease.inOut);
    SND.belt && SND.belt(false);
    return g0 === gen;
  }
  // the carriage to y (its picks' line)
  async function carTo(y, live, ms) {
    const y0 = carY; if (Math.abs(y - y0) < .01) return live();
    await UTIL.tween(ms ?? 160 + 9 * Math.abs(y - y0), e => { if (!live()) return; carY = y0 + (y - y0) * e; paintCar(0, { run: true }); }, UTIL.ease.inOut);
    return live();
  }
  // the carriage pours row j again on its way back: the nozzles over it, the batter; the feeder, the octopus; to rest
  async function refill(j, live) {
    if (S.batter <= .02) { S.rows[j] = null; paintPlate(); await carTo(CAR.rest, live); paintCar(); return; }
    if (!await carTo(CY(j) + CAR.NOZ, live)) return;
    SND.pour && SND.pour(.3);
    S.batter = Math.max(0, S.batter - LADLE); paintDoor();
    unfed = j; S.rows[j] = Date.now();
    await UTIL.tween(520, e => { if (!live()) return; paintCar(0, { pour: e, run: true }); S.rows[j] = Date.now() - 1; paintPlate(); });
    if (!live()) return;
    S.rows[j] = Date.now();
    if (!await carTo(CY(j) + CAR.FEED, live)) return;
    await UTIL.tween(320, e => { if (live()) paintCar(0, { feed: e, run: true }); }, UTIL.ease.in);
    unfed = -1; paintPlate(); SND.tok();
    await carTo(CAR.rest, live); paintCar();
  }
  /* ---------- the deck: okonomiyaki, yakisoba, ikayaki, each on its own station; a pack along the deck's belt, the
     lift down, the chute to the window ---------- */
  const SD = { okono: {}, soba: {}, ika: {} };   // each station's moving parts (TPB.station)
  let dOff = 0;
  const paintSt = kind => { if (I && I.deck[kind]) I.deck[kind].innerHTML = TPB.station(kind, SD[kind]); };
  const paintPack = (x, pk, z = DB.z) => { if (I && I.deck.packG) I.deck.packG.innerHTML = TPB.pack(x, DBY, z, { ...pk, ph: performance.now() / 1000 }, BK); };
  const paintLift = (z, pk) => { if (I && I.deck.liftG) I.deck.liftG.innerHTML = TPB.liftCar(z, pk ? { ...pk, ph: performance.now() / 1000 } : null); };
  async function carryD(pk, x0, x1, ms, live, lid) {
    const d0 = dOff; let last = 0;
    SND.belt && SND.belt(true);
    await UTIL.tween(ms, e => { if (!live()) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      const x = x0 + (x1 - x0) * e; dOff = d0 + (x - x0); I.deck.beltG.innerHTML = TPB.deckBelt(dOff); if (lid) pk.lid = lid(x); paintPack(x, pk); }, UTIL.ease.inOut);
    SND.belt && SND.belt(false);
    return live();
  }
  async function makeDeck(k, p, live) {
    const kind = p.kind, st = TP.STN[kind], cx = st.cx, sd = SD[kind], tools = st.tools;
    const paint = () => { if (live()) paintSt(kind); };
    S.hop[k].shift(); paintCarousel(); S.batter = Math.max(0, S.batter - LADLE); paintDoor();
    if (X) { X.cookLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 焼いています`; }
    const fd = { kind, c: 0, sz: .2, sauce: p.sauce, mayo: p.mayo, top: p.top, s: 0, m: 0, t: ['mix', 'negi', 'kaisen', 'tonpei'].includes(p.top) ? 1 : 0, nori: 0, katsu: 0, beni: 0, sq: 0, egg: p.egg, e: 0 };
    const pk = { kind, lid: 0, f: null };
    // the pack off the magazine onto the belt and along to the station, while the food cooks
    const toSt = (async () => { await UTIL.tween(220, e => { if (live()) paintPack(TP.MAG, pk, DB.z + 2.6 * (1 - e)); }, UTIL.ease.in); if (!live()) return false; SND.tok(); return carryD(pk, TP.MAG, cx, 900, live); })();
    const turn = async i => { const r0 = sd.rot || 0, d = ((i - r0) % 4 + 6) % 4 - 2, r1 = r0 + (d === -2 ? 2 : d); if (Math.abs(r1 - r0) < .01) return live();
      await UTIL.tween(200 + 110 * Math.abs(r1 - r0), e => { if (live()) { sd.rot = r0 + (r1 - r0) * e; paint(); } }, UTIL.ease.inOut); sd.rot = ((i % 4) + 4) % 4; return live(); };
    const work = async (tool, ms, fn, ease = e => e) => { const i = tools.indexOf(tool); if (!await turn(i)) return false; SND.click();
      await UTIL.tween(ms, e => { if (!live()) return; sd.act = { tool, e }; if (fn) fn(e); paint(); }, ease); sd.act = null; paint(); return live(); };
    const cookTo = (c1, ms) => { const c0 = fd.c; return UTIL.tween(ms, e => { if (live()) { fd.c = c0 + (c1 - c0) * e; paint(); } }, e => e).then(live); };
    const spat = async (h, ms, hz = 0, carry = false) => { const h0 = sd.hx || 0, z0 = sd.hz || 0;
      await UTIL.tween(ms, e => { if (!live()) return; sd.hx = h0 + (h - h0) * e; sd.hz = z0 + (hz - z0) * e; if (carry) fd.tz = sd.hz; paint(); }, UTIL.ease.inOut); return live(); };
    Object.assign(sd, { food: fd, fx: cx, fy: TP.SCY, fz: TP.SZ, py: 0, hx: 0, hz: 0, act: null, th: 1, steam: 0 });
    if (kind === 'okono') {
      // the batter (cabbage in it) out of the hopper, a round spreading on the iron; half cooked, the spatulas slide
      // under it, lift it and turn it over; cooked through, sauce brushed on, mayonnaise across, laver and bonito
      if (!await work('hopper', 700, e => { fd.sz = .2 + .8 * e; })) return null;
      if (!await cookTo(.5, 900)) return null;
      if (!await spat(1, 280) || !await spat(1, 200, 2.6, true)) return null;
      SND.tok();
      await UTIL.tween(460, e => { if (live()) { fd.flip = e; paint(); } }, UTIL.ease.inOut); if (!live()) return null;
      fd.flip = 1;
      if (!await spat(1, 200, 0, true) || !await spat(0, 260)) return null;
      if (!await cookTo(1, 800)) return null;
      if (X) { X.cookLamp.classList.remove('on'); X.waitLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 仕上げています`; }
      if (!await work('brush', 560, e => { fd.s = e; })) return null;
      if (fd.mayo && !await work('mayo', 560, e => { fd.m = e; sd.act.dx = -3.6 + 7.2 * e; sd.act.dy = Math.sin(e * Math.PI * 10) * 2.6; })) return null;
      if (!await work('shaker', 520, e => { fd.nori = p.nori ? e : 0; fd.katsu = p.katsu ? e : 0; fd.ph = performance.now() / 1000; })) return null;
    } else if (kind === 'soba') {
      // the noodles (with the cabbage and pork) out of their box; tossed with the spatulas while the sauce goes on;
      // for omusoba a thin omelette poured over; laver and pickled ginger
      if (!await work('noodle', 560, e => { fd.sz = .3 + .7 * e; })) return null;
      if (!await spat(1, 240)) return null;
      const s0 = (async () => { await turn(tools.indexOf('sauce')); })(); await s0; if (!live()) return null;
      SND.pour && SND.pour(.3);
      await UTIL.tween(1300, e => { if (!live()) return; sd.hz = Math.abs(Math.sin(e * Math.PI * 4)) * 2.2; fd.tz = sd.hz * .8; fd.c = Math.min(1, e * 1.3); sd.act = e < .8 ? { tool: 'sauce', e, dx: Math.sin(e * 20) * 2 } : null; paint(); }, e => e); if (!live()) return null;
      sd.act = null; fd.tz = 0; fd.c = 1;
      if (!await spat(0, 240)) return null;
      if (X) { X.cookLamp.classList.remove('on'); X.waitLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 仕上げています`; }
      if (fd.top === 'omu' && !await work('egg', 620, e => { fd.t = e; })) return null;
      if (!await work('shaker', 520, e => { fd.nori = p.nori ? e : 0; fd.beni = p.beni ? e : 0; })) return null;
    } else {
      // ikayaki: batter, the squid (an egg for デラ焼き), the press shut on it (steam), opened; sauce brushed on
      if (!await work('batter', 560, e => { fd.sz = .2 + .8 * e; })) return null;
      if (!await work('squid', 440, e => { fd.sq = e; })) return null;
      if (fd.egg && !await work('egg', 420, e => { fd.e = e; })) return null;
      await UTIL.tween(320, e => { if (live()) { sd.th = 1 - e; paint(); } }, UTIL.ease.in); if (!live()) return null;
      SND.clank ? SND.clank() : SND.tok(); SND.pour && SND.pour(.4);
      await UTIL.tween(1300, e => { if (live()) { sd.steam = e * 3; fd.c = e; paint(); } }, e => e); if (!live()) return null;
      sd.steam = 0;
      await UTIL.tween(320, e => { if (live()) { sd.th = e; paint(); } }, UTIL.ease.out); if (!live()) return null;
      if (X) { X.cookLamp.classList.remove('on'); X.waitLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 仕上げています`; }
      if (!await work('brush', 480, e => { fd.s = e; })) return null;
    }
    fd.sz = 1;
    // the pusher: the food off the plate's front edge, down the apron into the pack (the ikayaki folds over as it goes)
    if (!await toSt) return null;
    await UTIL.tween(560, e => { if (!live()) return; sd.py = e; sd.fy = TP.SCY + (DBY - TP.SCY) * Math.max(0, (e - .15) / .85); sd.fz = TP.SZ - (TP.SZ - DB.z - .6) * Math.max(0, (e - .6) / .4);
      if (kind === 'ika' && e > .5) fd.fold = 1; paint(); }, UTIL.ease.inOut); if (!live()) return null;
    SND.tok(); pk.f = { ...fd, tz: 0 }; sd.food = null; paintPack(cx, pk); paint();
    UTIL.tween(360, e => { if (live()) { sd.py = 1 - e; paint(); } }, UTIL.ease.inOut).then(() => { sd.rot = Math.round(sd.rot || 0) % 4; paint(); });
    // along the belt under the closer (the lid folds shut) onto the lift; down; along the chute to the window
    const C = TPB.DCLOSE, lc = (TP.LIFT.x0 + TP.LIFT.x1) / 2, shut = x => Math.max(0, Math.min(1, (x - C.x1 + .4) / (C.x0 - C.x1)));
    if (!await carryD(pk, cx, lc, 300 + 14 * (lc - cx), live, shut)) return null;
    if (X) X.waitLamp.classList.remove('on');
    SND.click(); pk.lid = 1; I.deck.packG.innerHTML = '';
    await UTIL.tween(900, e => { if (live()) paintLift(DB.z + (TP.LIFT.zb - DB.z) * e, pk); }, UTIL.ease.inOut); if (!live()) return null;
    paintLift(TP.LIFT.zb);
    UTIL.tween(700, e => { if (live()) paintLift(TP.LIFT.zb + (DB.z - TP.LIFT.zb) * e); }, UTIL.ease.inOut);
    await along(TPB.pack(0, 0, 0, pk, BK), [[lc, DBY, TP.LIFT.zb], [lc, DB.y1 + 1, TP.LIFT.zb - 1.4], [WINDOW[0] + 9, LINE.y1 + 2, 42], [WINDOW[0], WINDOW[1] + 1, 30]], 760); if (!live()) return null;
    making = false; paintDoor();
    return { p, o: pk };
  }
  // make one of bottle k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen, p = S.hop[k][0] || prod(k);   // the serving in the bottle (the menu may have changed since it went in)
    if (onDeck(p)) return makeDeck(k, p, live);
    await carBusy; if (!live()) return null;
    // a row has to be done
    let j;
    while ((j = doneRow()) < 0) { if (!live()) return null; if (X) { X.cookLamp.classList.add('on'); X.lcd.textContent = `焼いています · あと${Math.max(1, Math.ceil(nextDone() / 1000))}秒`; } paintPlate(); await UTIL.wait(250); }
    if (!live()) return null;
    if (X) { X.cookLamp.classList.remove('on'); X.lcd.textContent = `${S.no}番 · 鉄板から`; }
    S.hop[k].shift(); paintCarousel();
    const o = { n: 0, g: p.g, sauce: p.sauce, sw: p.sw, mayo: p.mayo, top: p.top, katsu: 0, s: 0, m: 0, t: 0, lid: 0 };
    const z0 = LINE.z + 3.2;
    // a boat off the bottom of the stack onto the belt, to the griddle
    await UTIL.tween(200, e => { if (live()) paintBoat(STACK, { n: 0, lid: 0 }, z0 - (z0 - LINE.z) * e); }, UTIL.ease.in); if (!live()) return null;
    SND.tok();
    const toRecv = carry(o, STACK, RECV, 620);
    // the carriage: the picks over the row, down into it, the balls turned once more, lifted out over the boat
    if (!await carTo(CY(j), live)) return null;
    SND.click();
    await UTIL.tween(200, e => { if (live()) paintCar(e, { run: true }); }, UTIL.ease.in); if (!live()) return null;
    await UTIL.tween(380, e => { if (!live()) return; spin = { j, a: e * Math.PI * 2 }; paintPlate(); }, UTIL.ease.inOut); if (!live()) return null;
    spin = null; lifted = j; paintPlate();
    S.rows[j] = null;
    await UTIL.tween(240, e => { if (live()) paintCar(1 - e, { balls: true, run: true }); }, UTIL.ease.out); if (!live()) return null;
    if (!await toRecv) return null;
    await UTIL.tween(200 + 9 * Math.abs(LY - carY), e => { if (!live()) return; carY = CY(j) + (LY - CY(j)) * e; paintCar(0, { balls: true, run: true }); }, UTIL.ease.inOut); if (!live()) return null;
    await UTIL.tween(160, e => { if (live()) paintCar(.62 * e, { balls: true, run: true }); }, UTIL.ease.in); if (!live()) return null;
    // the balls come off the picks into the boat
    paintCar(.62, { run: true }); o.n = 6; paintBoat(RECV, o); SND.tok();
    lifted = -1; paintPlate();
    await UTIL.tween(140, e => { if (live()) paintCar(.62 * (1 - e), { run: true }); }, UTIL.ease.out); if (!live()) return null;
    // the row poured again while the boat goes on (the next order waits for the carriage)
    carBusy = refill(j, live);
    // the sauce: the carousel turns the bottle to the front, squeezes a zigzag over the boat
    if (X) { X.waitLamp.classList.add('on'); X.lcd.textContent = `${S.no}番 · 仕上げています`; }
    const turning = (async () => { const r0 = rot, d = ((k - r0) % 4 + 6) % 4 - 2, r1 = r0 + (d === -2 ? 2 : d); if (Math.abs(r1 - r0) < .01) return;
      await UTIL.tween(240 + 120 * Math.abs(r1 - r0), e => { if (live()) { rot = r0 + (r1 - r0) * e; paintCarousel(); } }, UTIL.ease.inOut); rot = ((k % 4) + 4) % 4; paintCarousel(); })();
    if (!await carry(o, RECV, SAUCE, 700)) return null;
    await turning; if (!live()) return null;
    if (o.sauce) {
      SND.pour && SND.pour(.3);
      await UTIL.tween(760, e => { if (!live()) return; o.s = e; paintBoat(SAUCE, o); const dy = Math.sin(e * Math.PI * 10) * 2.2; paintCarousel(e < .1 ? e * 10 : 1, { c: o.sauce, z: LINE.z + 4, dy: dy * .3, x: SAUCE - 5 + 10 * e }); }, e => e); if (!live()) return null;
      UTIL.tween(200, e => { if (live()) paintCarousel(1 - e); }, UTIL.ease.out);
    }
    // the mayonnaise
    if (!await carry(o, SAUCE, MAYO, 320)) return null;
    if (o.mayo) {
      await UTIL.tween(560, e => { if (!live()) return; o.m = e; paintBoat(MAYO, o); I.toppersG.innerHTML = TPB.toppers({ mz: LINE.z + 4.4, mx: -5 + 10 * e, my: Math.sin(e * Math.PI * 14) * .6 }); }, e => e); if (!live()) return null;
      I.toppersG.innerHTML = TPB.toppers();
    }
    // the laver or the green onion
    const nx = o.top === 'negi' ? NEGI : NORI;
    if (!await carry(o, MAYO, nx, 280)) return null;
    await UTIL.tween(520, e => { if (!live()) return; o.t = e; paintBoat(nx, o); I.toppersG.innerHTML = TPB.toppers({ [o.top === 'negi' ? 'negi' : 'nori']: e, z: LINE.z + 4 }); }, e => e); if (!live()) return null;
    I.toppersG.innerHTML = TPB.toppers();
    // the bonito flakes (they keep moving in the heat from now on)
    if (!await carry(o, nx, KATSU, 260)) return null;
    await UTIL.tween(520, e => { if (!live()) return; o.katsu = e; paintBoat(KATSU, o); I.toppersG.innerHTML = TPB.toppers({ katsu: e, z: LINE.z + 4 }); }, e => e); if (!live()) return null;
    I.toppersG.innerHTML = TPB.toppers(); o.katsu = 1;
    await UTIL.tween(360, () => { if (live()) paintBoat(KATSU, o); }); if (!live()) return null;
    // the lid: folded shut by the guide bar as the boat goes on to the belt's end
    if (X) X.waitLamp.classList.remove('on');
    const shut = x => Math.max(0, Math.min(1, (KATSU - .4 - x) / (KATSU - .4 - LID)));
    { const g1 = gen, b0 = beltOff;
      await UTIL.tween(520, e => { if (g1 !== gen) return; const x = KATSU + (LID - KATSU) * e; beltOff = b0 + (x - KATSU); paintBelt(); o.lid = shut(x); paintBoat(x, o); }, UTIL.ease.inOut); if (!live()) return null; }
    SND.click(); o.lid = 1;
    // to the belt's end, down the slide to the take-out window
    if (!await carry(o, LID, LINE.x1 - 3, 220)) return null;
    I.boatG.innerHTML = '';
    await along(TPB.boat(0, 0, 0, o, BK), [[LINE.x1 - 3, LY, LINE.z], [LINE.x1 - 2, LINE.y1 + 2, LINE.z - 8], [WINDOW[0] + 2, LINE.y1 + 2, 42], [WINDOW[0], WINDOW[1] + 1, 30]], 620); if (!live()) return null;
    making = false; paintDoor();
    return { p, o };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyHop() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.tp-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn((S.hop[kk][0] || MENU[kk]).price, TP.SLOTW);
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p: r.p, o: r.o, no, who }; ready = done; windowBoat(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · 焼きあがり`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price: r.p.price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#d8903a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#d8352a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: sauce bottles into the carousel, a tub of batter into the tank ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const bottleTop = k => { const a = (k - rot) * Math.PI / 2 + Math.PI / 2; return [CAR4.x + CAR4.r * Math.cos(a), CAR4.y + CAR4.r * Math.sin(a), CAR4.z + 10]; };
  const supply = {
    title: T`章鱼烧料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-tp-bottle', vars: `--c:${m.sauce || '#f4f0e0'}`, pos: [8 + j * 9.4, 10 + k * 15, 2], target: 'f' + k }))),
      { glyph: 'g-tp-batter', vars: '', pos: [104, 40, 2], target: 'batter' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'batter' ? [22, 30, 176] : bottleTop(+t.slice(1)),
    accept: t => t === 'batter' ? S.batter < .97 : S.hop[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'batter' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'batter' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t[0] === 'f' && !ECON.everStocked('teppan', MENU[+t.slice(1)].pid),
    stocks: t => { if (t[0] !== 'f') return []; const k = +t.slice(1); reserved[k]++; return [['teppan', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'batter') {
        const from = S.batter; SND.pour(1); UTIL.tween(900, e => { S.batter = from + (1 - from) * e; }).then(() => { S.batter = 1; fillRows(); SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(30 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut);
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.hop[k].length < CAP) { S.hop[k].push(prod(k)); paintCarousel(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target[0] !== 'f') - (b.target[0] !== 'f')),
  };
  // empty rows are poured when there is batter (they start cooking now)
  function fillRows() { const now = Date.now(); S.rows = S.rows.map(t => t == null && S.batter > .02 ? (S.batter -= LADLE, now) : t); paintPlate(); }

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.hop.forEach((l, k) => { for (let j = 0; j < 5; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = TPB.exterior(G.exterior, MENU); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, TP.D, TP.H);
    if (ready) { windowBoat(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    lifted = -1; spin = null; unfed = -1; carY = CAR.rest; carBusy = Promise.resolve();
    Object.keys(SD).forEach(kind => { SD[kind] = {}; });
    rot = Math.round(rot) % 4;
    I = TPB.interior(G.interior, coinState, lv); I.defs.innerHTML = TPB.defs(); TPB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    I.bodyG.innerHTML = TPB.griddleBody(true);
    paintPlate(); paintCar(); paintCarousel(); shell();
  }
  // the rows cook on their own while in view: redrawn twice a second while any row is still cooking
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 500; if (!making && S.rows.some(t => t != null && cook(t) < 1)) paintPlate(); paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, TP.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyHop() < 0) return null; vend(null, 'customer'); return T`章鱼烧`; }
  // off screen: one boat to order (the griddle keeps up at the street's pace)
  function idleSell() {
    const k = anyHop(); if (k < 0) return 0;
    const p = S.hop[k].shift(); S.batter = Math.max(0, S.batter - LADLE); S.no = S.no % 99 + 1;
    if (I && !making) paintCarousel(); if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    id: 'teppan', fig: 18, name: T`铁板粉物`, brand: 'てっぱん丸', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#d8352a',
    render: () => render(),
    hint: { shut: T`点菜单选一种口味 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`,
      xray: T`看铁板：每排六个，倒面糊、放章鱼、钢签翻面，烤到金黄后整排夹进舟皿，再淋酱、撒柴鱼、盖盖子`,
      open: T`酱瓶插进转盘 · 面糊桶倒进后面的罐子` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ hop: S.hop.map(l => l.map(p => p.pid)), batter: S.batter, rows: S.rows.slice(), no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.hop)) S.hop = [0, 1, 2, 3].map(k => (d.hop[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.batter === 'number') S.batter = Math.max(0, Math.min(1, d.batter));
      if (Array.isArray(d.rows)) S.rows = [0, 1, 2].map(i => typeof d.rows[i] === 'number' ? d.rows[i] : null);
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    labels: () => MENU.map((m, k) => { const p = S.hop[k][0] || m; return { name: p.name, n: S.hop[k].length, c: p.sauce || '#f4f0e0', pt: bottleTop(k) }; }),
    labelStyle: 'mini',
    goods: {
      kind: 'teppan', defaults: ['sauce', 'negipon', 'terimayo', 'mentai'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.hop[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, ...look(g) })),
    },
    paid: 'm-teppan',   // sold in the shop (pay.js): open once bought with real money, no game money to place it, no test run
    unlock: { open: () => typeof PAY !== 'undefined' && PAY.has('m-teppan'), hint: () => T`在商店里可以买`,
      card: () => [T`「てっぱん丸」的铁板机送到了`, T`机位里可以摆上它了`] },
    upgrades: [
      { id: 'flat', name: T`お好み焼き鉄板`, cost: [20000], effect: [T`在机柜上层加一块平铁板 · 能卖猪肉大阪烧、葱烧、什锦大阪烧、猪肉蛋卷、海鲜大阪烧`], kind: T`新货`, pin: [TP.STN.okono.cx, TP.DECK.y1, TP.SZ - 2],
        fact: T`大阪烧的面糊里拌了大量卷心菜丝，翻面时用两把铁铲一起铲起来，一口气翻过去。` },
      { id: 'soba', name: T`焼きそば台`, cost: [60000], effect: [T`上层加一台炒面铁板 · 能卖酱汁炒面、盐味炒面、蛋包炒面`], kind: T`新货`, pin: [TP.STN.soba.cx, TP.SY1, TP.SZ + 12],
        fact: T`日本的酱汁炒面最后常撒青海苔，配红姜丝；把炒面包进薄蛋皮里就是「オムそば」。` },
      { id: 'ika', name: T`いか焼きプレス`, cost: [100000], effect: [T`上层加一台烤鱿鱼压板 · 能卖鱿鱼烧、加蛋鱿鱼烧`], kind: T`新货`, pin: [TP.STN.ika.cx, TP.SY0, TP.SZ + 26],
        fact: T`大阪的「いか焼き」不是整只烤鱿鱼：鱿鱼块拌进面糊，用上下两块铁板一压，几十秒就熟，对折着吃；打个鸡蛋进去的叫「デラ焼き」。` },
    ],
    applyParts: l => { lv = { flat: l.flat || 0, soba: l.soba || 0, ika: l.ika || 0 }; },
  });
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.hop = d.hop.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.batter = 1; me.load(d); return added || 1; };
  me.stuck = () => S.batter <= .02 && doneRow() < 0 && S.rows.every(t => t == null);
  // a new save: all three rows done
  S.rows = S.rows.map(() => Date.now() - COOK);
})();
