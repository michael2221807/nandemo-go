/* Fig 12 behaviour (geometry in m-oden-build.js). An order: the coin; a cup drops from the magazine onto the carriage,
   which runs to the basket while the pot turns the ordered compartment under it; the basket dips, comes up with two pieces
   and tips them down the trough into the cup; the carriage stops under the broth spout (and the miso nozzle, for the miso
   ones), under the mustard tube, and at the hatch at the end of the rail the cup drops down the chute to the take-out window.
   The flaw: the broth simmers away (real time: a full pot in 6 hours) and every cup takes a ladle of it. The red float on
   the hub shows the level, the door lamp says だし少; dry, nothing sells until a jug of dashi goes in. The tank with the
   float valve (自動給湯) keeps it full. Nothing moves while nothing happens (perf rule 3); the pieces are <use>s (rule 13). */
(() => {
  const { P, f } = ISO;
  const { POT, surf, RAIL, CUPZ, CUPH, ANG, B1, B2, STN, WINDOW, MENU, TOPC } = OD;
  ['daikon', 'tamago', 'konnyaku', 'chikuwa', 'hanpen', 'konbu'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 85; });   // the starting stock's goods
  const CAP = 6, N = 6, EVAP = 6 * 3600e3, LADLE = 1 / 60, TURN = 2400;   // TURN: ms for half a turn (a heavy pot of broth)
  let lv = { refill: 0, basket2: 0, miso: 0 };
  // cmp: each compartment's pieces (oldest first); broth: the level at time bt (it simmers away from there)
  const S = { cmp: [[], [], [], [], [], []], broth: 1, bt: Date.now(), no: 0 };
  const reserved = [0, 0, 0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null;
  let rot = 0, shownLvl = -1, nextPaint = 0, nextLvl = 0;
  // gen: bumped by every redraw; a cup being made when it changes is dropped (its steps check it after each wait)
  let gen = 0;
  let cart = { x: STN.mag, cup: null }, b1 = { bz: 108, pcs: [], tip: 0 }, b2 = { bz: 108, pcs: [], tip: 0 };
  const coinState = [12, 9, 18, 5];

  /* ---------- products, stock, broth ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g }; };
  const snap = pid => { const g = pid && ECON.product('oden', pid); if (!g) return null; const q = ECON.quote('oden', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g }; };
  // the miso ones simmer plain; the sauce goes on in the cup
  const RAW = { mdaikon: 'daikon', mkonnyaku: 'konnyaku', mtamago: 'tamago' };
  const raw = g => RAW[g] || g;
  const level = () => lv.refill ? 1 : Math.max(0, S.broth - (Date.now() - S.bt) / EVAP);
  const settle = () => { S.broth = level(); S.bt = Date.now(); };
  const useBroth = n => { settle(); if (!lv.refill) S.broth = Math.max(0, S.broth - n); };
  const dry = () => level() <= .02;
  const count = () => S.cmp.reduce((a, l) => a + l.length, 0);
  const canMake = k => S.cmp[k].length > 0 && !dry();
  const anyCmp = () => { const ks = [0, 1, 2, 3, 4, 5].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  // one node per piece (rule 13): each look drawn once into the machine's <defs>, the pot's pieces are <use>s of it
  let looks = new Map(), lookN = 0, pcsEls = [];
  function lookOf(g) {
    let id = looks.get(g);
    if (!id) { id = 'od-pc' + (++lookN); looks.set(g, id); UTIL.g(I.defs, ODB.piece(g), { id }); }
    return '#' + id;
  }
  // how many pieces a compartment shows (up to three: the stock in pairs)
  const shown = k => Math.min(3, Math.ceil(S.cmp[k].length / 2));
  function placePieces() {
    if (!I) return; const l = shownLvl;
    for (let k = 0; k < N; k++) {
      const n = shown(k), g = raw((S.cmp[k][0] || MENU[k]).g), row = pcsEls[k] || (pcsEls[k] = []);
      for (let j = 0; j < 3; j++) {
        let el = row[j];
        if (j >= n) { if (el) { el.remove(); row[j] = null; } continue; }
        if (!el || el.parentNode !== I.pcsG) el = row[j] = UTIL.el('use', {}, I.pcsG);
        const href = lookOf(g); if (el.getAttribute('href') !== href) el.setAttribute('href', href);
        const [a, b] = ODB.slotPos(k, j, rot, l); el.setAttribute('transform', `translate(${f(a)} ${f(b)})`);
      }
    }
  }
  // the pot at the current level (redrawn only when the level has moved: it sinks slowly)
  function renderPot() {
    if (!I) return; const l = shownLvl = level();
    I.potG.innerHTML = ODB.pot(l, rot); I.frontG.innerHTML = ODB.potFront(l); I.hubG.innerHTML = ODB.hub(l);
    placePieces();
  }
  // while it turns: only the dividers' path and the pieces' transforms change
  function turnFrame() { if (!I) return; const d = I.potG.querySelector('.od-div'); if (d) d.setAttribute('d', ODB.dividers(rot, surf(shownLvl))); placePieces(); }
  const drawBasket = (which, s) => { const g = which === 2 ? I && I.basket2G : I && I.basketG; if (!g) return; const [x, y] = which === 2 ? B2 : B1; g.innerHTML = ODB.basket(x, y, s.bz, surf(shownLvl), s.pcs, s.tip); };
  // the carriage and its cup: drawn at x = 0, moved along the rail by its transform (redrawn only when the cup changes)
  let cartEl = null;
  function drawCart(full) {
    if (!I) return;
    if (full || !cartEl || cartEl.parentNode !== I.cartG) { I.cartG.innerHTML = ''; cartEl = UTIL.g(I.cartG, ODB.carriage() + (cart.cup ? ODB.cup(0, RAIL.y, cart.cup.z == null ? CUPZ : cart.cup.z, cart.cup) : ''), {}); }
    cartEl.setAttribute('transform', move(cart.x, 0, 0));
  }
  function paintDoor() {
    if (!X) return; const l = level();
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    X.gauge.setAttribute('width', f(13.2 * l)); X.gauge.setAttribute('fill', l < .25 ? '#ff6a3a' : '#d8a040');
    X.lowLamp.classList.toggle('on', l < .25);
    if (!busy && !ready) X.lcd.textContent = dry() ? 'だし切れ' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowCup(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.35) translate(${f(-sx)} ${f(-sy)})">${ODB.cup(WINDOW[0], WINDOW[1], WINDOW[2], r.cup)}</g>`;
  }
  // a mover along a polyline of world points (the pieces down the trough, the cup down the chute)
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  async function cartTo(x) {
    const c = cart, from = c.x, d = Math.abs(x - from); if (d < .1) return;
    SND.belt && SND.belt(true);
    await UTIL.tween(180 + d * 9, e => { if (cart !== c) return; c.x = from + (x - from) * e; drawCart(); }, UTIL.ease.inOut);
    c.x = x; SND.belt && SND.belt(false);
  }
  // the pot turns the shortest way to bring compartment k under basket angle a
  const deltaTo = (k, a) => { const want = a - k * Math.PI / 3; return ((want - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI; };
  async function turnTo(k, a) {
    const d = deltaTo(k, a), from = rot, g0 = gen; if (Math.abs(d) < .01) return;
    SND.crank && SND.crank();
    await UTIL.tween(300 + TURN * Math.abs(d) / Math.PI, e => { if (g0 !== gen) return; rot = from + d * e; turnFrame(); }, UTIL.ease.inOut); if (g0 === gen) rot = from + d;
  }
  // the basket at station `which` dips into compartment k and brings up two pieces of g, tips them down its trough
  async function scoop(which, k, g) {
    const g0 = gen, live = () => g0 === gen;
    const s = which === 2 ? b2 : b1, bx = which === 2 ? B2[0] : B1[0], lamp = which === 2 && X && X.b2Lamp, zs = surf(shownLvl);
    if (lamp) lamp.classList.add('on');
    SND.lift && SND.lift();
    await UTIL.tween(380, e => { if (!live()) return; s.bz = 108 - (108 - (zs - 3)) * e; drawBasket(which, s); }, UTIL.ease.in);
    await UTIL.wait(240); if (!live()) return false;
    S.cmp[k].shift(); placePieces(); paintDoor();
    s.pcs = [raw(g), raw(g)];
    if (I) { I.steamG.innerHTML = ODB.steam(); setTimeout(() => { if (I) I.steamG.innerHTML = ''; }, 2000); }
    await UTIL.tween(420, e => { if (!live()) return; s.bz = zs - 3 + (110 - zs + 3) * e; drawBasket(which, s); }, UTIL.ease.out);
    await UTIL.tween(260, e => { if (!live()) return; s.tip = e; drawBasket(which, s); }, UTIL.ease.inOut); if (!live()) return false;
    const pcs = s.pcs; s.pcs = []; drawBasket(which, s); SND.tok();
    const [t0, t1] = ODB.troughPts(bx, which === 2 ? B2[1] : B1[1]);
    await along(`<g transform="translate(0 0)">${ODB.piece(pcs[0])}</g>`, [[t0[0], t0[1], t0[2] + .6], [t1[0], t1[1], t1[2] + .4], [bx, RAIL.y, CUPZ + CUPH - .4]].map(([x, y, z]) => [x, y, z]), 360);
    if (!live() || !cart.cup) return false;
    cart.cup.pcs = pcs; drawCart(true); SND.tok();
    UTIL.tween(240, e => { if (!live()) return; s.tip = 1 - e; s.bz = 110 - 2 * e; drawBasket(which, s); }, UTIL.ease.inOut).then(() => { if (lamp) lamp.classList.remove('on'); });
    return true;
  }
  // a stream from a spout into the cup for ms (broth, miso)
  async function pour(x, z0, c, w, ms) { if (!I) return; I.streamG.innerHTML = ODB.stream(x, z0, c, w); await UTIL.wait(ms); if (I) I.streamG.innerHTML = ''; }
  // make one cup of compartment k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen;
    const p = prod(k), g = p.g, which = lv.basket2 && Math.abs(deltaTo(k, ANG.b2)) < Math.abs(deltaTo(k, ANG.b1)) ? 2 : 1;
    // the cup drops from the magazine onto the carriage
    const cup = cart.cup = { pcs: [], broth: false, miso: false, mus: false, z: CUPZ + 10 }; drawCart(true);
    await UTIL.tween(200, e => { if (!live()) return; cup.z = CUPZ + 10 * (1 - e * e); drawCart(true); }, t => t); if (!live()) return null; cup.z = null; drawCart(true); SND.tok();
    // the carriage runs to the basket while the pot turns the compartment under it
    await Promise.all([cartTo(which === 2 ? STN.b2 : STN.b1), turnTo(k, which === 2 ? ANG.b2 : ANG.b1)]); if (!live()) return null;
    if (!await scoop(which, k, g)) return null;
    // the broth (a ladle of the pot's), the miso sauce for the miso ones, a dab of mustard
    await cartTo(STN.spout); SND.pour && SND.pour(.5); await pour(STN.spout, CUPZ + CUPH + 10, 'rgba(216,160,64,.9)', 1.1, 560); if (!live()) return null;
    cup.broth = true; drawCart(true); useBroth(LADLE); if (Math.abs(level() - shownLvl) > .02) renderPot();
    if (RAW[g] && lv.miso) { await cartTo(STN.miso); await pour(STN.miso, CUPZ + CUPH + 6, '#6a2a0a', 1.8, 520); if (!live()) return null; cup.miso = true; drawCart(true); SND.tok(); }
    await cartTo(STN.mus); await UTIL.wait(120); if (!live()) return null; cup.mus = true; drawCart(true); SND.click();
    // to the hatch: the cup drops down the chute; the carriage goes back for the next one
    await cartTo(STN.exit); if (!live()) return null;
    const done = cup; cart.cup = null; drawCart(true);
    await along(ODB.cup(0, 0, 0, done), [[STN.exit, RAIL.y, CUPZ], [STN.exit, RAIL.y + 1, 60], [WINDOW[0] + 2, WINDOW[1] + 1, 32]], 520); if (!live()) return null;
    cartTo(STN.mag);
    making = false; paintDoor();
    return { p, cup: done };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    let kk = k == null ? anyCmp() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.od-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, OD.SLOTW);
    X.lcd.textContent = `${no}番 · 盛り付け中`;
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p: r.p, cup: r.cup, no, who }; ready = done; windowCup(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price: r.p.price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#e8862a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#e8862a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: trays of pieces into the pot's compartments, a jug of dashi into the pot ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const cmpTop = k => { const a = rot + k * Math.PI / 3; return [POT.x + 9.4 * Math.cos(a), POT.y + 9.4 * Math.sin(a), POT.z1 + 6]; };
  const supply = {
    title: T`关东煮料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-od-pack', vars: `--c:${TOPC[raw(m.g)] || '#e8c890'}`, pos: [9 + j * 13, 7.5 + k * 10.6, 2], target: 'c' + k }))),
      { glyph: 'g-od-jug', vars: '', pos: [100, 38, 2], target: 'dashi' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'dashi' ? [POT.x, POT.y, POT.z1 + 10] : cmpTop(+t.slice(1)),
    accept: t => t === 'dashi' ? level() < .97 : S.cmp[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'dashi' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'dashi' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t !== 'dashi' && !ECON.everStocked('oden', MENU[+t.slice(1)].pid),
    stocks: t => { if (t === 'dashi') return []; const k = +t.slice(1); reserved[k]++; return [['oden', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'dashi') {
        settle(); const from = S.broth; SND.pour(1);
        // the broth comes up in a few steps (a full redraw of the pot each, so not every frame)
        let stepN = -1; UTIL.tween(900, e => { const n = Math.floor(e * 5); if (n !== stepN) { stepN = n; S.broth = from + (1 - from) * Math.min(1, (n + 1) / 5); S.bt = Date.now(); renderPot(); } })
          .then(() => { S.broth = 1; S.bt = Date.now(); renderPot(); SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(118 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut);
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.cmp[k].length < CAP) { S.cmp[k].push(prod(k)); placePieces(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target === 'dashi') - (b.target === 'dashi')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.cmp.forEach((l, k) => { for (let j = 0; j < 4; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = ODB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, OD.D, OD.H);
    if (ready) { windowCup(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the pot shows through the door: always drawn)
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; cart = { x: STN.mag, cup: null }; }
    b1 = { bz: 108, pcs: [], tip: 0 }; b2 = { bz: 108, pcs: [], tip: 0 };
    I = ODB.interior(G.interior, coinState, lv, level()); ODB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    looks = new Map(); pcsEls = []; cartEl = null;
    renderPot(); drawBasket(1, b1); drawBasket(2, b2); drawCart(true); shell();
  }
  // nothing moves on its own: once a second the level is checked (the pot is redrawn when the broth has sunk visibly)
  function step(now) {
    if (!I) return;
    if (now > nextLvl) { nextLvl = now + 1000; if (!making && Math.abs(level() - shownLvl) > .02) renderPot(); }
    if (now > nextPaint) { nextPaint = now + 700; paintDoor(); }
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, OD.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyCmp() < 0) return null; vend(null, 'customer'); return T`关东煮`; }
  // off screen: a cup made to order from a compartment that has some (the broth goes down by a ladle)
  function idleSell() {
    const k = anyCmp(); if (k < 0) return 0;
    const p = S.cmp[k].shift(); S.no = S.no % 99 + 1; useBroth(LADLE); if (I && !making) placePieces(); if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the pot shows through the door's big window, so the insides are always drawn
    id: 'oden', fig: 12, name: T`关东煮`, brand: 'ぐつぐつ', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#e8862a',
    render: () => render(),
    hint: { shut: T`点菜单选一样关东煮 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看分格锅把那一格转到捞篮下面，捞篮升起把料倒进滑槽，杯子沿导轨走过出汤口和芥末管；中间柱子上的红色浮子是汤的水位`, open: T`料盘放进锅的格子 · 高汤倒进锅里 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * N; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ cmp: S.cmp.map(l => l.map(p => p.pid)), broth: level(), bt: Date.now(), no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.cmp)) S.cmp = [0, 1, 2, 3, 4, 5].map(k => (d.cmp[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.broth === 'number') { S.broth = Math.max(0, Math.min(1, d.broth)); S.bt = +d.bt || Date.now(); }
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % N, 'player'),
    // X-ray tags: per compartment, over it on the pot (where it is now)
    labels: () => MENU.map((m, k) => { const p = S.cmp[k][0] || m; return { name: p.name, n: S.cmp[k].length, c: TOPC[raw(p.g)] || '#e8c890', pt: cmpTop(k) }; }),
    labelStyle: 'mini',
    // goods: six compartments in the pot; the miso ones need the miso pot
    goods: {
      kind: 'oden', defaults: ['daikon', 'tamago', 'konnyaku', 'chikuwa', 'hanpen', 'konbu'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.cmp[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g })),
    },
    // the special unlock: people drinking canned oden at ミズイロ want the real thing (100 cans sold)
    unlock: { open: () => ECON.soldCount('drink', 'oden') >= 100, hint: () => T`ミズイロ 卖出 100 罐おでん缶（现在 ${Math.min(100, ECON.soldCount('drink', 'oden'))} 罐）`,
      card: () => [T`喝罐装关东煮的人想吃真的了`, T`「ぐつぐつ」关东煮开张了：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the tank and float valve (the cure), the second basket (faster), the miso pot (new goods)
    upgrades: [
      { id: 'refill', name: T`自動給湯`, cost: [10000], effect: [T`装一个高汤罐和浮球阀 · 汤一少就自动补上，再也不会熬干`], kind: T`省心`, pin: [ODB.TANK.x + ODB.TANK.w / 2, ODB.TANK.y + ODB.TANK.d / 2, ODB.TANK.z + 14],
        fact: T`马桶水箱里的浮球阀就是这个原理：水位一降，浮球跟着降，阀门打开补水；水满了浮球浮起来，把阀门关上。` },
      { id: 'basket2', name: T`二番かご`, cost: [50000], effect: [T`锅的另一边再装一个捞篮 · 锅转的路程少一半`], kind: T`速度`, pin: [B2[0] - 3, RAIL.y + 2, CUPZ + 5],
        fact: T`关东煮店捞料用带孔的漏勺，汤从孔里漏回锅里。锅是转的，多一个捞篮，哪一格都离得近。` },
      { id: 'miso', name: T`味噌だれ`, cost: [80000], effect: [T`加一个味噌锅和出酱嘴 · 能卖味噌大根、味噌こんにゃく、味噌玉子`], kind: T`新货`, pin: [ODB.MISO.x + 3, RAIL.y + 2, CUPZ + 3],
        fact: T`名古屋一带的关东煮要浇上浓浓的八丁味噌，叫「味噌おでん」，有的店干脆用味噌汤来煮。` },
    ],
    applyParts: l => { lv = { refill: l.refill || 0, basket2: l.basket2 || 0, miso: l.miso || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n pieces of the planned goods, and the broth
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.cmp = d.cmp.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.broth = 1; d.bt = Date.now(); me.load(d); return added || 1; };
  // pieces left but the broth dry: as good as sold out
  me.stuck = () => dry();
})();
