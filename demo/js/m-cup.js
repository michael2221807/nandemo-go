/* Fig 3 behaviour: cup drops -> turntable -> ice / powders (augers) / hot water / mixer -> pour -> turntable -> window opens.
   Restock: pour powder pouches into canisters, slide a cup sleeve into the tube, top up water and ice. */
(() => {
  const { P, f, TOP } = ISO;
  const { TT, holder, BL, BR, FR, CANS, CAN_X, DRINKS, BOWL, NOZZLE_Z, TUBE } = CU;
  const HB = [FR, BL, BR];
  ['blend', 'latte', 'cocoa', 'matcha', 'icecoffee', 'lemontea'].forEach((id, k) => { DRINKS[k].pid = DRINKS[k].pid || id; DRINKS[k].tier = DRINKS[k].tier || 1; });   // the starting menu
  let I, X, root, saleFn = () => {}, hinge, busy = false, theta = 0, readyCup = null;
  let lv = { turret: 0, turbo: 0, mill: 0 };   // fitted parts (改造, 2026-10-18)
  const sp = () => lv.turbo ? .58 : 1;          // the turbo whipper: dosing, water, mixing and pouring at 0.58 of the time
  const S = { cans: [.85, .6, .7, .9], cups: 22, water: .8, ice: .7, su: 2, mi: 3 };
  const onHolder = [null, null, null];
  const hAngle = i => HB[i] + theta;
  const holderAt = a => { let best = 0, bd = 9; for (let i = 0; i < 3; i++) { const d = Math.abs(Math.atan2(Math.sin(hAngle(i) - a), Math.cos(hAngle(i) - a))); if (d < bd) { bd = d; best = i; } } return best; };

  /* drawing helpers */
  function renderHolders() {
    for (let i = 0; i < 3; i++) {
      const [x, y, z] = holder(hAngle(i)), el = I.holders[i];
      el.setAttribute('transform', TOP(x, y, z + .05)); el.setAttribute('rx', 6.4); el.setAttribute('ry', 6.4);
      const c = onHolder[i]; if (c) placeCup(c, x, y, z);
    }
  }
  function makeCup() { const c = { g: UTIL.g(I.cupsG, ''), level: 0, liq: '#000', ice: false }; c.render = () => { c.g.innerHTML = CUB.cupSVG(c.level, c.liq, c.ice) + (c.steam ? steamSVG() : ''); }; c.render(); return c; }
  function placeCup(c, x, y, z) { const [sx, sy] = P(x, y, z); c.g.setAttribute('transform', `translate(${f(sx)} ${f(sy)})`); c.pos = [x, y, z]; }
  const steamSVG = () => [[-2, 0], [0, .4], [2, .2]].map(([x, d]) => `<path class="steam" style="animation-delay:${d}s" d="M${x} -12q-1.6-3 0-6t0-6" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`).join('');
  function renderStack() {
    if (I.turret) { I.stack.innerHTML = CUB.turretSVG(CUB.turretCounts(S.cups)); return; }
    const n = S.cups, h = n ? 8 + n * 2.2 : 0;
    I.stack.innerHTML = n ? ISO.rounded(TUBE[0] - 6.2, TUBE[1] - 6.2, 118, 12.4, 12.4, h, 6.2, 'cupstack') + Array.from({ length: Math.min(n, 30) }, (_, k) => `<path class="detail" d="${GLY.toD(GLY.ringZ(118 + 8 + k * 2.2, 6.25, 16, GLY.vz()[0], GLY.vz()[1], TUBE[0], TUBE[1]), false)}"/>`).join('') : '';
  }
  // the tube in use has just given its last cup: the turret turns a third round and the next full one comes over the table
  // (redrawn at 30 Hz while it turns: perf rule 17)
  async function swapTurret() {
    const pre = [0, CUB.PER, S.cups > CUB.PER ? CUB.PER : 0]; let last = 0; SND.turn();
    await UTIL.tween(640, e => { const now = performance.now(); if (now - last < 32 && e < 1) return; last = now; I.stack.innerHTML = CUB.turretSVG(pre, -e * Math.PI * 2 / 3); }, UTIL.ease.inOut);
    SND.tok(); renderStack();
  }
  function renderLevels() {
    I.levels.forEach((g, i) => { const h = Math.max(0, Math.min(1, S.cans[i])) * 50; g.innerHTML = `<rect width="7" height="52" fill="#0b0d11" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect y="${f(52 - h)}" width="7" height="${f(h)}" fill="${CANS[i].c}" opacity=".9"/>`; });
    const n = Math.round(S.ice * 12);
    I.iceBin.innerHTML = `<rect width="19" height="16" fill="#0c1218" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/>` + Array.from({ length: n }, (_, k) => `<rect x="${1.4 + (k % 6) * 2.9}" y="${12.6 - Math.floor(k / 6) * 3.2}" width="2.4" height="2.4" rx=".4" fill="rgba(200,235,255,.25)" stroke="var(--cyan)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`).join('');
  }
  function auger(i, phase) { const cx = CAN_X(i) + 5, pts = []; for (let k = 0; k <= 54; k++) { const t = k / 54 * Math.PI * 6, a = t + phase; pts.push(P(cx + 2.1 * Math.sin(a), 26 + 7 * k / 54, 153 + 2.1 * Math.cos(a))); }
    I.augers[i].innerHTML = `<path class="coil front" d="M${pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')}"/>`; }
  function swirl(phase, color) { const pts = []; for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 4 + phase, r = 1 + 7 * k / 60; pts.push(P(r * Math.cos(a), r * Math.sin(a), 0)); }
    I.swirl.setAttribute('d', 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L')); I.swirl.style.stroke = color; }
  const canMake = d => S.cups > 0 && S.water > .05 && d.pw.every(p => S.cans[p] > .05) && (!d.ice || S.ice > .1) && (!d.mill || !!lv.mill);
  function paintTiles() { X.tiles.forEach((t, k) => t.querySelector('.soldout').classList.toggle('on', !canMake(DRINKS[k]))); }
  function paintBars() { X.su.forEach((l, i) => l.classList.toggle('on', i < S.su)); X.mi.forEach((l, i) => l.classList.toggle('on', i < S.mi)); }

  /* the brewing sequence */
  function rotate(by) { const t0 = theta; SND.turn(); return UTIL.tween(720, e => { theta = t0 + by * e; renderHolders(); }, UTIL.ease.inOut); }
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    const d = DRINKS[k];
    if (!canMake(d)) { const s = X.tiles[k].querySelector('.soldout'); [0, 1, 2, 3].forEach(i => setTimeout(() => s.classList.toggle('on'), i * 110)); if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const tile = X.tiles[k], led = tile.querySelector('.led');
    led.classList.add('on'); CORE.glow(tile.querySelector('.cu-tglow'), 1600, .45);
    if (who === 'player') { SND.click(); CORE.press(tile); }
    CORE.glow(X.slotGlow, 1000);
    await I.cm.coinIn(d.price, CU.SLOTW);
    // a cup falls from the tube onto the empty back-left holder
    const hi = holderAt(BL), [hx, hy, hz] = holder(hAngle(hi)), cup = makeCup();
    S.cups--; renderStack(); SND.cupDrop();
    if (I.turret && S.cups > 0 && S.cups % CUB.PER === 0) swapTurret();
    I.gears.forEach((gr, i) => UTIL.tween(300, e => gr.setAttribute('transform', `translate(${i ? 15 : 3} 3) rotate(${(i ? -1 : 1) * 180 * e})`)));
    await UTIL.tween(240, e => placeCup(cup, hx, hy, 116 + (hz - 116) * e), UTIL.ease.in);
    SND.tok(); onHolder[hi] = cup; cup.liq = d.liq;
    await rotate(Math.PI * 2 / 3);
    if (d.ice) { await iceDrop(); cup.ice = true; S.ice = Math.max(0, S.ice - .05); }
    if (d.mill) await grind();
    for (const p of d.pw) { await powder(p); S.cans[p] = Math.max(0, S.cans[p] - .05); }
    renderLevels();
    CORE.replay(I.water); SND.pour(.5); S.water = Math.max(0, S.water - .025); await UTIL.wait(420 * sp());
    await mix(d.liq);
    await pour(cup, d);
    await rotate(Math.PI * 2 / 3);
    led.classList.remove('on');
    X.readyT.classList.add('on'); SND.ding(); UTIL.haptic(14);
    if (d.hot) { cup.steam = true; cup.render(); }
    await slideWindow(true);
    readyCup = { cup, hi, d, who };
    saleFn({ name: d.name, price: d.price, pid: d.pid, tier: d.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 800);
    else setTimeout(() => { if (readyCup && readyCup.cup === cup) take(true); }, 7000);
    paintTiles();
    return true;
  }
  async function take(byPlayer) {
    const rc = readyCup; if (!rc) return; readyCup = null;
    const [x, y, z] = rc.cup.pos;
    CORE.sparkle(x, y + 8, z + 10, 8, rc.d.ice ? 'var(--cyan)' : 'var(--amber)');
    if (byPlayer) { SND.pop(); FX.pop(x, y + 10, z + 22, rc.d.name, 'var(--amber)'); } else SND.lift();
    const [sx, sy] = P(x, y, z), fw = ISO.fwd;
    await UTIL.tween(720, e => { rc.cup.g.setAttribute('transform', `translate(${f(sx + 28 * fw * e)} ${f(sy - 60 * e + 24 * e * e)})`); rc.cup.g.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    rc.cup.g.remove(); onHolder[rc.hi] = null;
    X.readyT.classList.remove('on');
    await slideWindow(false);
    busy = false;
  }
  const slideWindow = open => UTIL.tween(320, e => X.win.setAttribute('transform', `translate(0 ${f(-54 * (open ? e : 1 - e))})`), UTIL.ease.inOut).then(() => SND.click());
  async function iceDrop() {
    const a = [104, 34, 168], b = [BOWL[0] + 2, BOWL[1] + 1, TT.z + 12];
    SND.ice();
    await Promise.all([0, 1, 2].map(k => new Promise(res => setTimeout(() => {
      const cube = UTIL.el('rect', { width: 2.6, height: 2.4, rx: .4, fill: 'rgba(210,240,255,.7)', stroke: 'var(--cyan)', 'stroke-width': .5 }, I.movers);
      UTIL.tween(420, e => { const p = P(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e); cube.setAttribute('x', f(p[0] - 1.3)); cube.setAttribute('y', f(p[1] - 1.2)); }, UTIL.ease.in).then(() => { cube.remove(); res(); });
    }, k * 130))));
  }
  // the mill: the burr turns, the beans in the hopper shiver, grounds run down the chute into the bowl
  async function grind() {
    const M = CUB.MILL, a = [M.x + 2, M.y + 5, M.z + 1], b = [BOWL[0], BOWL[1], BOWL[2] + 4], ms = 760 * sp(); SND.powder();
    let last = 0;
    const spin = UTIL.tween(ms, e => { const now = performance.now(); if (now - last < 32 && e < 1) return; last = now;
      if (I.burr) I.burr.setAttribute('transform', `${I.burr.getAttribute('transform').replace(/ rotate\(.*\)/, '')} rotate(${(e * 720).toFixed(0)})`);
      if (I.beans) I.beans.setAttribute('transform', `translate(${(Math.sin(e * 40) * .3).toFixed(2)} 0)`); }, t => t);
    const dots = Array.from({ length: 14 }, (_, k) => new Promise(res => setTimeout(() => {
      const d = UTIL.el('circle', { r: .7, fill: '#4a2a14' }, I.movers);
      UTIL.tween(420 * sp(), e => { const q = P(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e); d.setAttribute('cx', f(q[0])); d.setAttribute('cy', f(q[1])); }, UTIL.ease.in).then(() => { d.remove(); res(); });
    }, k * 40 * sp())));
    await Promise.all([spin, ...dots]);
    if (I.beans) I.beans.removeAttribute('transform');
  }
  async function powder(p) {
    SND.powder(); const a = [CAN_X(p) + 5, 33, 149], b = [BOWL[0], BOWL[1], BOWL[2] + 4];
    const spin = UTIL.tween(700 * sp(), e => auger(p, e * Math.PI * 6), t => t);
    const dots = Array.from({ length: 12 }, (_, k) => new Promise(res => setTimeout(() => {
      const d = UTIL.el('circle', { r: .7, fill: CANS[p].c }, I.movers);
      UTIL.tween(380 * sp(), e => { const q = P(a[0] + (b[0] - a[0]) * e + Math.sin(k) * .6, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e); d.setAttribute('cx', f(q[0])); d.setAttribute('cy', f(q[1])); }, UTIL.ease.in).then(() => { d.remove(); res(); });
    }, k * 40 * sp())));
    await Promise.all([spin, ...dots]);
  }
  async function mix(color) { SND.mix(.8); I.swirl.style.opacity = 1; await UTIL.tween(800 * sp(), e => swirl(e * Math.PI * 8, color), t => t); I.swirl.style.opacity = 0; }
  async function pour(cup, d) {
    I.stream.style.stroke = d.liq; I.stream.classList.add('on'); SND.pour(.9);
    await UTIL.tween(950 * sp(), e => { cup.level = e; cup.render(); }, t => t);
    I.stream.classList.remove('on');
  }

  /* restocking: pouches, cup sleeves, water jug, ice bag */
  const CUPS0 = 36, CUPS1 = 90;
  const capOf = () => lv.turret ? CUPS1 : CUPS0;
  let cupsIncoming = 0;   // cups from a sleeve still sliding into the tube
  const target = t => t.startsWith('can') ? +t.slice(3) : t;
  const full = t => { const k = target(t); return typeof k === 'number' ? S.cans[k] > .97 : k === 'cups' ? S.cups + cupsIncoming >= capOf() : k === 'water' ? S.water > .97 : S.ice > .97; };
  const entry = t => { const k = target(t); return typeof k === 'number' ? [CAN_X(k) + 5, 18, 216] : k === 'cups' ? [TUBE[0], TUBE[1], 234] : k === 'water' ? [16, 16, 80] : [105, 25, 228]; };
  function refill(t) {
    const k = target(t);
    if (typeof k === 'number') { const from = S.cans[k]; SND.powder(); UTIL.tween(900, e => { S.cans[k] = from + (1 - from) * e; renderLevels(); }).then(() => SND.chime()); }
    else if (k === 'cups') { const add = Math.max(0, capOf() - S.cups - cupsIncoming); cupsIncoming += add;
      for (let i = 0; i < add; i++) setTimeout(() => { cupsIncoming--; S.cups = Math.min(capOf(), S.cups + 1); renderStack(); if (i % 3 === 0) SND.cupDrop(); }, i * 35);
      setTimeout(() => SND.chime(), add * 35 + 100); }
    else if (k === 'water') { const from = S.water; SND.pour(1); UTIL.tween(1000, e => { S.water = from + (1 - from) * e; }).then(() => SND.chime()); }
    else { const from = S.ice; SND.ice(); UTIL.tween(800, e => { S.ice = from + (1 - from) * e; renderLevels(); }).then(() => SND.chime()); }
    setTimeout(paintTiles, 1100);
  }
  const { box, slits } = ISO;
  const supply = {
    title: T`补料`, unit: T`份`, gap: 260, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [86, 0, 0], [0, 44, 0], [86, 44, 0], [0, 0, 30], [86, 0, 30]],
    slots: () => [...CANS.map((cn, i) => ({ glyph: 'g-bag', vars: `--c:${cn.c}`, pos: [11 + i * 21, 10, 1.5], target: 'can' + i })),
      { glyph: 'g-sleeve', vars: '', pos: [11, 32, 1.5], target: 'cups' }, { glyph: 'g-sleeve', vars: '', pos: [32, 32, 1.5], target: 'cups' },
      { glyph: 'g-jug', vars: '', pos: [53, 32, 1.5], target: 'water' }, { glyph: 'g-icebag', vars: '', pos: [74, 32, 1.5], target: 'ice' }],
    back: () => `<g transform="${TOP(0, 0, 0)}"><rect class="cart top" width="86" height="44" rx="2"/>${slits(6, 80, 6, 2, 42, true, 'crrib')}</g>` + box(0, 0, 0, 86, 2, 6, 0, 'cart') + box(0, 2, 0, 2, 40, 6, 0, 'cart'),
    front: () => box(0, 42, 0, 86, 2, 4, 0, 'cart') + box(84, 2, 0, 2, 40, 4, 0, 'cart'),
    entry, accept: t => !full(t),
    // the cups carry the cost: each cup added costs the menu's average ingredients; pouches, water and ice come with them
    cost: t => target(t) === 'cups' ? Math.round(Math.max(0, capOf() - S.cups - cupsIncoming) * DRINKS.reduce((s, d) => s + (d.buy || 0), 0) / DRINKS.length) : 0,
    tier: () => Math.max(...DRINKS.map(d => d.tier || 1)),
    // a new menu goes up with the first cups: 上新 for drinks never served before
    isNew: t => target(t) === 'cups' && DRINKS.some(d => !ECON.everStocked('cup', d.pid)),
    stocks: t => target(t) === 'cups' ? DRINKS.map(d => ['cup', d.pid]) : [],
    arrive: (t, slot, el, [tx, ty, s]) => {      // tip the pouch / jug over its target while the level rises
      refill(t);
      UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(118 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut).then(() => el.remove());
      return true;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: () => 0,
  };

  let G = null;
  const coinState = [16, 8, 22, 5];
  function build(g, onSale) { G = g; root = g.root; saleFn = onSale; render(); }
  // (re)draw from the current state: first build and every camera-yaw change
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    busy = false; readyCup = null; onHolder.fill(null);
    I = CUB.interior(G.interior, coinState, lv); X = CUB.exterior(G.exterior, lv); CORE.cat(G.exterior, false, [0, 0, 6]); CUB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn }, CU.D, CU.H);
    renderHolders(); renderStack(); renderLevels(); CANS.forEach((_, i) => auger(i, 0)); paintTiles(); paintBars();
    I.swirl.style.opacity = 0;
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (readyCup) take(true); else SND.clank(); return true; }
    if (/^(su|mi)[+-]$/.test(t)) { CORE.press(hit); const key = t.slice(0, 2); S[key] = Math.max(0, Math.min(5, S[key] + (t[2] === '+' ? 1 : -1))); paintBars(); SND.tick(S[key] + (key === 'mi' ? 4 : 0)); UTIL.haptic(5); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, CU.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, CU.D, 186, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving) return null; const ks = DRINKS.map((d, k) => canMake(d) ? k : -1).filter(k => k >= 0); if (!ks.length) return null; const k = UTIL.pick(ks); vend(k, 'customer'); return DRINKS[k].name; }
  function idleSell() { const ks = DRINKS.map((d, k) => canMake(d) ? k : -1).filter(k => k >= 0); if (!ks.length) return 0; const d = DRINKS[UTIL.pick(ks)];
    S.cups--; S.water = Math.max(0, S.water - .025); d.pw.forEach(p => { S.cans[p] = Math.max(0, S.cans[p] - .05); }); if (d.ice) S.ice = Math.max(0, S.ice - .05); renderStack(); renderLevels(); paintTiles(); return { price: d.price, pid: d.pid, name: d.name, tier: d.tier || 1 }; }
  MACHINES.push({
    id: 'cup', fig: 3, name: T`杯装式`, brand: 'ヨルカフェ', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff8a24', render: () => render(),
    hint: { shut: T`点机器招呼客人，连点更快 · 左右拖动转视角 · 点门锁开门补料`, xray: T`看转盘、粉料螺杆和热水 · 拖动扫描线`, open: T`点料包倒进料罐 · 杯套塞进杯筒 · 点门或门锁关门` },
    build, step: () => {}, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count: () => S.cups, get capacity() { return capOf(); },
    isBusy: () => busy, prepare: () => { if (readyCup) take(true); },
    save: () => ({ ...S, cans: S.cans.slice(), coins: coinState.slice() }),
    load: d => { if (!d) return; ['cups', 'water', 'ice', 'su', 'mi'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; }); S.cups = Math.max(0, Math.min(capOf(), S.cups | 0)); if (Array.isArray(d.cans)) S.cans = d.cans.slice(0, 4); if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); }); render(); },
    idleSell, vendKey: k => vend(k % DRINKS.length, 'player'),
    // X-ray tags: the drinks are mixed to order, so no counts; each is pinned over the canister it is mostly made from
    labels: () => DRINKS.map(d => { const i = d.pw && d.pw.length ? d.pw[0] : -1;
      return { name: d.name, n: null, c: d.liq, pt: i >= 0 ? [CU.CAN_X(i) + 5, 30, 178] : [CU.BOWL[0], CU.BOWL[1], CU.BOWL[2] + 14] }; }),
    // goods: the six drinks on the menu (ingredients are shared, so switching costs nothing extra)
    goods: {
      kind: 'cup', defaults: ['blend', 'latte', 'cocoa', 'matcha', 'icecoffee', 'lemontea'],
      slots: [0, 1, 2, 3, 4, 5].map(() => ({ cap: 6 })),
      units: () => 0,
      apply: list => list.forEach((g, k) => { DRINKS[k] = { name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, pid: g.id, hot: !!g.hot, ice: !!g.ice, mill: !!g.mill, pw: g.pw, liq: g.liq }; }),
    },
    // upgrades (改造, 2026-10-18): the cup turret (the cure for running out of cups), the turbo whipper (faster), the mill (fresh-ground)
    upgrades: [
      { id: 'turret', name: T`杯子转塔`, cost: [8000], effect: [T`三根杯筒轮流用 · 杯子 36 → 90 个`], kind: T`容量`, pin: [CU.TUBE[0] - 10, CU.TUBE[1] + 6, 214],
        fact: T`真的杯式自贩机里，纸杯装在一圈杯筒里：一根用完，转盘转一格换下一根，一台能装好几百个杯子。` },
      { id: 'turbo', name: T`高速ホイッパー`, cost: [35000], effect: [T`碗下的搅拌电机换大的 · 下粉、搅拌、出杯都快，出杯快约 25%`], kind: T`速度`, pin: [CU.BOWL[0], CU.BOWL[1] + 4, 112],
        fact: T`杯式自贩机把粉和热水打匀的小装置叫「ホイッパー」：碗底一个小叶轮高速旋转，可可和奶粉才不会结块，奶泡也是这样打出来的。` },
      { id: 'mill', name: T`磨豆机`, cost: [50000], effect: [T`加一个豆仓和磨盘 · 能卖现磨咖啡：挽きたてブレンド、挽きたてラテ、カフェモカ`], kind: T`新货`, pin: [CUB.MILL.x, CUB.MILL.y + 4, 206],
        fact: T`日本有不少杯式自贩机写着「豆から挽く」：每一杯都现磨现冲，取杯口的小窗里还会飘出咖啡香。` },
    ],
    applyParts: l => { lv = { turret: l.turret || 0, turbo: l.turbo || 0, mill: l.mill || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(), add = Math.max(0, Math.min(capOf() - d.cups, n));
    d.cups += add; d.cans = d.cans.map(() => 1); d.water = 1; d.ice = 1; me.load(d); return add || 1; };
  // cups left, but nothing on the menu can be made (a canister, the water or the ice ran out): as good as sold out
  me.stuck = () => S.cups > 0 && !DRINKS.some(canMake);
})();
