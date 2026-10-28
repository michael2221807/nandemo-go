/* Fig 9 behaviour. Tap a little door (or a customer comes): old cells take ¥100 coins in the door's slot (one per ¥100),
   the knob turns, the door springs ajar, swings open, the goods are lifted out, and the door is pushed shut (バタン).
   With the electronic locks: pay at the panel, カチッ, the door's LED turns blue, the door opens, and the closer draws it
   back (スーッ, カチ). The flaw: the old cells take only ¥100 coins and give no change, so some passers-by have none and
   walk away (100円玉がない…); about three in ten. Restock: every little door opens, the bags fly into their cells. */
(() => {
  const { P, f } = ISO;
  const { ROWS, cellsOf, zTop, zBot, spot, MENU } = LK;
  ['tomato', 'cucumber', 'eggplant', 'potato', 'onion'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 40; });   // the starting menu
  const OPEN = 1.72, MISS = .3;
  let lv = { lock: 0, cool: 0, big: 0 };
  // cells[r][i]: the bag in each cell (or null); coins[r][i]: the coins in each old cell's cup
  const S = { cells: [], coins: [] };
  const reserved = [0, 0, 0, 0, 0];
  let I, X, G = null, saleFn = () => {}, busy = false, open = false, moving = false;
  const fit = () => { for (let r = 0; r < ROWS; r++) { const n = cellsOf(r, lv.big).length; S.cells[r] = (S.cells[r] || []).slice(0, n); S.coins[r] = (S.coins[r] || []).slice(0, n); while (S.cells[r].length < n) S.cells[r].push(null); while (S.coins[r].length < n) S.coins[r].push(0); } };
  fit();

  /* ---------- products and stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, c: m.c }; };
  const snap = pid => { const g = pid && ECON.product('locker', pid); if (!g) return null; const q = ECON.quote('locker', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, c: g.c }; };
  const countRow = r => S.cells[r].filter(Boolean).length;
  const count = () => S.cells.reduce((s, row) => s + row.filter(Boolean).length, 0);
  const capacity = () => S.cells.reduce((s, row) => s + row.length, 0);
  const filled = () => { const out = []; S.cells.forEach((row, r) => row.forEach((p, i) => { if (p) out.push([r, i]); })); return out; };
  const doorOf = (r, i) => X.doors.find(d => d.r === r && d.i === i);

  /* ---------- drawing ---------- */
  function renderCell(r, i) {
    const c = I && I.cells[r] && I.cells[r][i]; if (!c) return;
    const p = S.cells[r][i], [x, y, z] = spot(r, c);
    c.goods.innerHTML = p ? LKB.use(p, x, y, z) : '';
    if (c.coins) { const n = Math.min(8, S.coins[r][i]); c.coins.innerHTML = Array.from({ length: n }, (_, j) => ISO.rounded(c.x0 + c.w - 3.9, LK.D - 8.6, zBot(r) + .4 + j * .42, 3.2, 3.2, .4, 1.6, 'coin c100')).join(''); }
    // the door's tag shows the price of what is behind it (old stock keeps its old price; an empty cell, the next goods')
    const d = X && doorOf(r, i), t = d && d.el.querySelector('.lk-price'); if (t) { const txt = `${(p || MENU[r]).price}円`; t.textContent = txt; t.setAttribute('font-size', txt.length > 5 ? 2.5 : 3.4); }
  }
  const renderCells = () => S.cells.forEach((row, r) => row.forEach((_, i) => renderCell(r, i)));

  /* ---------- the doors ---------- */
  const swingTo = (d, a, ms, ease = UTIL.ease.inOut) => { const from = d.a; return UTIL.tween(ms, e => LKB.setDoor(d, from + (a - from) * e), ease); };
  // all the little doors open (or close) one after another, like a row of keys being turned
  async function swing(toOpen, before) {
    if (toOpen === open || moving) return false;
    moving = true; if (before) await before();
    open = toOpen; SND[toOpen ? 'doorOpen' : 'doorClose']();
    const ds = X.doors.slice().sort((a, b) => a.r - b.r || a.x0 - b.x0);
    await Promise.all(ds.map((d, n) => UTIL.wait(n * 45).then(() => { SND.tok(); if (d.led) d.led.classList.toggle('on', toOpen); return swingTo(d, toOpen ? OPEN : 0, toOpen ? 380 : 300, toOpen ? UTIL.ease.out : UTIL.ease.in); })));
    if (!toOpen) { UTIL.haptic(18); }
    moving = false; return true;
  }

  /* ---------- a sale ---------- */
  async function coinsIn(d, n) {
    const fx = CORE.fx, [tx, ty] = P(d.x0 + 7.4, LK.D, zTop(d.r) - 27.6);
    for (let k = 0; k < n; k++) {
      const coin = UTIL.el('use', { href: '#g-coin' }, fx), sx = tx + 150 * ISO.fwd, sy = ty + 190;
      await UTIL.tween(380, e => { coin.setAttribute('x', f(sx + (tx - sx) * e)); coin.setAttribute('y', f(sy + (ty - sy) * e - Math.sin(e * Math.PI) * 60)); coin.setAttribute('opacity', e > .9 ? (1 - e) * 10 : 1); }, UTIL.ease.out);
      coin.remove(); SND.coin(); UTIL.haptic(5);
    }
  }
  async function vend(r, i, who) {
    if (busy || open || moving) return false;
    const p = S.cells[r] && S.cells[r][i];
    if (!p) { if (who === 'player') { SND.clank(); const c = I.cells[r][i]; FX.pop(c.x0 + c.w / 2, LK.D, zTop(r) - 8, T`空`, 'var(--ink-hi)', 11); } return false; }
    busy = true;
    const d = doorOf(r, i), c = I.cells[r][i];
    if (lv.lock) {   // pay at the panel, the lock lets go
      SND.beep(); await UTIL.wait(260); SND.solenoid(); d.led.classList.add('on'); UTIL.haptic(6);
      await swingTo(d, .32, 160, UTIL.ease.out);
    } else {         // ¥100 coins in the door's own slot, the knob turned
      await coinsIn(d, Math.max(1, Math.min(5, Math.round(p.price / 100))));   // a few coins drop in, whatever the price
      SND.crank(); await UTIL.tween(240, e => d.knob.setAttribute('transform', `translate(${d.w - 6} 28) rotate(${f(90 * e)})`), UTIL.ease.inOut);
      await swingTo(d, .22, 140, UTIL.ease.out); SND.tok();
    }
    await UTIL.wait(200);
    await swingTo(d, OPEN, 380, UTIL.ease.out);
    // the goods come out of the cell
    S.cells[r][i] = null; if (!lv.lock) S.coins[r][i] = Math.min(8, S.coins[r][i] + Math.max(1, Math.round(p.price / 100)));
    renderCell(r, i);
    const [x, y, z] = spot(r, c), el = UTIL.g(I.movers, LKB.use(p, 0, 0, 0), {});
    CORE.sparkle(x, y + 16, z + 6, 7, p.c);
    if (who === 'player') { SND.pop(); FX.pop(x, LK.D + 6, z + 18, p.name, p.c); } else SND.lift();
    await UTIL.tween(620, e => { const [sx, sy] = P(x, y + 30 * e, z + 22 * e - 14 * e * e); el.setAttribute('transform', `translate(${f(sx)} ${f(sy)})`); el.setAttribute('opacity', f(1 - e * e)); }, UTIL.ease.out);
    el.remove();
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    // shut: pushed by hand (old), drawn back by the closer (electronic)
    if (lv.lock) { await swingTo(d, 0, 760, UTIL.ease.inOut); SND.tok(); d.led.classList.remove('on'); }
    else { await swingTo(d, 0, 240, UTIL.ease.in); SND.clank(); UTIL.haptic(10); d.knob.setAttribute('transform', `translate(${d.w - 6} 28)`); }
    busy = false;
    return true;
  }
  // the flaw: a passer-by with no ¥100 coin
  function noCoin() {
    const fl = filled(); if (!fl.length) return;
    const [r, i] = UTIL.pick(fl), d = doorOf(r, i);
    if (d) { FX.pop(d.x0 + d.w / 2, LK.D, zTop(r) - 26, T`100円玉がない…`, 'var(--ink-hi)', 10); SND.tok(); }
  }

  /* ---------- restock: the bags into their cells ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="104" height="70" rx="2"/>${slits(8, 96, 8, 2, 68, true, 'crrib')}</g>` + box(0, 0, 0, 104, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 65, 8, 0, 'cr');
  const crateFront = () => box(0, 67.5, 0, 104, 2.5, 8, 0, 'cr') + box(101.5, 2.5, 0, 2.5, 65, 8, 0, 'cr');
  const freeCell = r => S.cells[r].indexOf(null);
  const supply = {
    title: T`野菜`, unit: T`袋`, gap: 70, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [104, 0, 0], [0, 70, 0], [104, 70, 0], [0, 0, 22], [104, 0, 22]],
    slots: () => MENU.flatMap((m, r) => { const n = cellsOf(r, lv.big).length, dx = 96 / n;
      return Array.from({ length: n }, (_, j) => ({ glyph: 'g-lk-' + m.g, vars: '', pos: [4 + dx / 2 + j * dx, 8 + r * 13.4, 2], target: 'r' + r })); }),
    back: crateBack, front: crateFront,
    entry: t => { const r = +t.slice(1), i = Math.max(0, freeCell(r)), c = cellsOf(r, lv.big)[i]; return [c.x0 + c.w / 2, 74, zBot(r) + 10]; },
    accept: t => { const r = +t.slice(1); return countRow(r) + reserved[r] < S.cells[r].length; },
    cost: t => MENU[+t.slice(1)].buy || 0,
    tier: t => MENU[+t.slice(1)].tier || 1,
    isNew: t => !ECON.everStocked('locker', MENU[+t.slice(1)].pid),
    // called once a bag is paid for: its cell is held so bags still in the air cannot overfill a row
    stocks: t => { const r = +t.slice(1); reserved[r]++; return [['locker', MENU[r].pid]]; },
    arrive: t => { const r = +t.slice(1), i = freeCell(r); reserved[r] = Math.max(0, reserved[r] - 1); if (i >= 0) { S.cells[r][i] = prod(r); renderCell(r, i); SND.tok(); } return false; },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; fit(); if (!count()) S.cells.forEach((row, r) => row.forEach((_, i) => { if (i < 3) row[i] = prod(r); })); render(); }
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy) busy = false;   // a run cut short by a redraw: already counted as sold
    fit();
    I = LKB.interior(G.interior, lv); LKB.ghost(G.ghost, lv); CORE.cat(G.ghost, true, [0, 0, 6]);
    X = LKB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    X.doors.forEach(d => LKB.setDoor(d, open ? OPEN : 0));
    renderCells();
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (open || moving) return false;
    if (t === 'cell') { vend(+hit.dataset.r, +hit.dataset.i, 'player'); return true; }
    if (t === 'coins') { const yen = S.coins.flat().reduce((a, b) => a + b, 0) * 100;
      if (!yen) { SND.clank(); return true; } S.coins = S.coins.map(row => row.map(() => 0)); renderCells(); SND.cascade(); FX.pop(91, 52, 60, T`回収 ${UTIL.money(yen)}`, 'var(--yellow)', 14); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(95, LK.D, 24, '番号を押して', 'var(--cyan)'); return true; }
    return false;
  }
  function customerBuy() {
    if (busy || open || moving) return null;
    const fl = filled(); if (!fl.length) return null;
    if (!lv.lock && Math.random() < MISS) { noCoin(); return null; }
    const [r, i] = UTIL.pick(fl); vend(r, i, 'customer'); return T`野菜`;
  }
  function idleSell() {
    const fl = filled(); if (!fl.length) return 0;
    if (!lv.lock && Math.random() < MISS) return 0;   // no ¥100 coin: they walk on
    const [r, i] = UTIL.pick(fl), p = S.cells[r][i];
    S.cells[r][i] = null; if (!lv.lock) S.coins[r][i] = Math.min(8, S.coins[r][i] + Math.max(1, Math.round(p.price / 100)));
    if (I) renderCell(r, i);
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: every little door has a window, so the cells are always drawn
    id: 'locker', fig: 9, name: T`无人直卖所`, brand: 'たまご小屋', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#f2b84a',
    render: () => render(),
    hint: { shut: T`点一扇小门买那一格 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门补货`, xray: T`看每格的锁扣、投币滑道和硬币杯 · 点硬币杯收钱`, open: T`一袋袋放进格子 · 点空格子放进那一层 · 点门锁关门` },
    build, step: () => {}, tap, customerBuy,
    door: o => swing(o, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return open; }, get doorMoving() { return moving; }, doorBounds: () => [[0, LK.D + 27, 0], [120, LK.D + 27, 240]],
    openTap: hit => { if (hit.dataset.hit === 'cell') { DOCK.sendTo('r' + hit.dataset.r); return true; } return false; },
    supply, count, get capacity() { return capacity(); },
    isBusy: () => busy, prepare: () => {},
    // customers: three in ten have no ¥100 coin for the old cells (the electronic locks take anything)
    get traffic() { return 1; },
    save: () => ({ cells: S.cells.map(row => row.map(p => p ? p.pid : null)), coins: S.coins.map(row => row.slice()) }),
    load: d => { if (!d) return; fit();
      if (Array.isArray(d.cells)) S.cells = S.cells.map((row, r) => row.map((_, i) => snap(((d.cells[r] || [])[i]) || null)));
      if (Array.isArray(d.coins)) S.coins = S.coins.map((row, r) => row.map((_, i) => Math.max(0, Math.min(8, ((d.coins[r] || [])[i]) | 0))));
      render(); },
    idleSell, vendKey: k => { const r = k % ROWS, i = S.cells[r].findIndex(Boolean); return i >= 0 ? vend(r, i, 'player') : false; },
    // X-ray tags: per row, over its first bag
    labels: () => S.cells.map((row, r) => { const i = Math.max(0, row.findIndex(Boolean)), p = row[i] || prod(r), c = cellsOf(r, lv.big)[i], [x, y, z] = spot(r, c);
      return { name: p.name, n: countRow(r), c: p.c, pt: [x, y, z + (r === 0 && lv.big ? 18 : 10)] }; }),
    // goods: one kind per row; the bottom two rows only take chilled goods once they are cold, the top row only big things once it is big
    goods: {
      kind: 'locker', get defaults() { return ['tomato', 'cucumber', 'eggplant', 'potato', 'onion']; },
      get slots() { return [0, 1, 2, 3, 4].map(r => ({ cap: cellsOf(r, lv.big).length, row: r === 0 && lv.big ? 2 : r >= 3 && lv.cool ? 1 : 0 })); },
      units: r => countRow(r),
      apply: list => list.forEach((g, r) => Object.assign(MENU[r], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, c: g.c })),
    },
    // upgrades (改造): electronic locks (the cure), cold cells (eggs, strawberries), wide cells (watermelon, rice)
    upgrades: [
      { id: 'lock', name: T`电子锁格`, cost: [8000], effect: [T`什么硬币都收 · 能刷 IC · 客人不再走掉`], kind: T`省心`, pin: [91, 52, 52],
        fact: T`サンデン 2024 年的储物柜 MCL-RMS8：自保持型电子锁（开锁后保持开锁）、自动闭门器、蓝色 LED，还留着应急的机械锁芯。老式的「朝市くん」不用电，投 100 日元开门，不找零。` },
      { id: 'cool', name: T`冷藏格`, cost: [20000], effect: [T`下面两层改成 5℃ 冷藏 · 能卖鸡蛋和草莓`], kind: T`新货`, pin: [55, 30, 62],
        fact: T`パルサー 的 F-40LVM 有 40 格，一格放两盒鸡蛋；神户的神出たまごセンター 有 8 台鸡蛋机，库内 20℃，一天换三次蛋。` },
      { id: 'big', name: T`大格口`, cost: [40000], effect: [T`顶层四格合成两个大格 · 能卖西瓜和一袋米`], kind: T`新货`, pin: [60, 60, 218],
        fact: T`MCL-RMS8 的格口分四档高度，每一格都能单独设成冷藏（1～15℃）或常温（15～25℃）。` },
    ],
    applyParts: l => { lv = { lock: l.lock || 0, cool: l.cool || 0, big: l.big || 0 }; fit(); },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.cells = d.cells.map((row, r) => row.map(pid => { if (pid || added >= n) return pid; added++; return MENU[r].pid; }));
    if (added) me.load(d); return added; };
})();
