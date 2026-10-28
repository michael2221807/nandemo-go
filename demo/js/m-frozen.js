/* Fig 8 behaviour: coin -> the shelf's spiral turns once (both spirals for the twin shelf): every pack in the lane moves
   up one pitch and the front one goes over the edge -> it drops to the bin (ゴトン; or, with the multi-elevator, the
   platform rises to the shelf, takes it and goes down) -> the window: it arrives frosted, in a puff of cold air, and the
   frost clears to show what it is.
   The flaw: frost. Every sale and every door opening thickens it on the evaporator (and along the shelves); when it is
   full the machine defrosts (heater on, meltwater dripping into the pan, 霜取り中, the temperature rising to −5℃ and
   back) for 30 s, in real time. Hot-gas defrost shortens that; frost-free air makes frost grow three times slower. */
(() => {
  const { P, f } = ISO;
  const { MOD, SHELVES, FRONT_Y, lanes, capOf, itemAt, LIFT, WINDOW, MENU } = FZ;
  ['vanilla', 'gyoza', 'chahan', 'pizza', 'matcha'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 100; });   // the starting menu
  const ROW = [0, 1, 2, 3, 0];
  const FROST_N = [20, 20, 60], DEFROST_MS = [30000, 10000, 10000];
  let lv = { defrost: 0, elev: 0, shelf: 0 };
  const ks = () => [0, 1, 2, 3, ...(lv.shelf ? [4] : [])];
  // q[k][lane]: the packs on a spiral, front first; frost 0..1; defrostUntil / defrostMs: the defrost under way
  const S = { q: SHELVES.map((s, k) => lanes(k).map(() => [])), frost: 0, defrostUntil: 0, defrostMs: 30000 };
  const reserved = [0, 0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null, nextPaint = 0, wasDefrost = false;
  const coinState = [14, 7, 20, 4];

  /* ---------- products, stock, frost ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, fill: m.fill, d: m.d, pack: m.pack, g: m.g }; };
  const snap = pid => { const g = pid && ECON.product('frozen', pid); if (!g) return null; const q = ECON.quote('frozen', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, fill: g.fill, d: g.d, pack: g.pack, g: g.g }; };
  const countShelf = k => S.q[k].reduce((s, l) => s + l.length, 0);
  const count = () => ks().reduce((s, k) => s + countShelf(k), 0);
  const capacity = () => ks().reduce((s, k) => s + capOf(k), 0);
  const anyShelf = () => { const a = ks().filter(countShelf); return a.length ? UTIL.pick(a) : -1; };
  const defrosting = () => Date.now() < S.defrostUntil;
  // the frost shown: melting away during a defrost, gone once it is over
  function frostNow() {
    if (defrosting()) return Math.max(0, (S.defrostUntil - Date.now()) / S.defrostMs);
    if (S.defrostUntil && S.frost >= 1) S.frost = 0;
    return S.frost;
  }
  function addFrost(x) {
    frostNow(); if (defrosting()) return;
    S.frost = Math.min(1, S.frost + x);
    if (S.frost >= 1) { S.defrostMs = DEFROST_MS[lv.defrost || 0]; S.defrostUntil = Date.now() + S.defrostMs; SND.switchOn(); }
  }
  const canSell = () => !defrosting() && count() > 0;

  /* ---------- drawing ---------- */
  const rowOf = k => X.rows.find(r => +r.dataset.k === k);
  // a shelf's packs; while its spiral turns, lane `turning` is drawn moved forward by `shift`
  function renderShelf(k, turning = -1, shift = 0) {
    const sh = I && I.shelves[k]; if (!sh) return;
    const items = [];
    S.q[k].forEach((lane, li) => lane.forEach((p, j) => { const [x, y, z] = itemAt(k, li, j), yy = y + (li === turning ? shift : 0); items.push({ p, x, y: yy, z, key: ISO.key(x, yy) }); }));
    items.sort((a, b) => a.key - b.key);
    sh.items.innerHTML = items.map(it => FZB.use(FZB.packOf(it.p), it.p, it.x, it.y, it.z)).join('');
  }
  const renderCoil = (c, M) => { const h = FZB.helix(c.x, c.zc, M.r, M.pitch, c.phase); c.back.setAttribute('d', h.back); c.front.setAttribute('d', h.front); };
  function renderShelves() { ks().forEach(k => { const sh = I.shelves[k]; if (!sh) return; sh.coils.forEach(c => renderCoil(c, sh.M)); renderShelf(k); }); }
  const renderFrost = () => { if (I) I.frost.innerHTML = FZB.frostSVG(frostNow(), ks()); };
  function paintDoor() {
    const d = defrosting(), fr = frostNow();
    X.rows.forEach(r => r.querySelector('.soldout').classList.toggle('on', !countShelf(+r.dataset.k) || d));
    X.defrost.classList.toggle('on', d);
    const e = d ? 1 - (S.defrostUntil - Date.now()) / S.defrostMs : 0, t = Math.round(-25 + 20 * Math.sin(Math.PI * Math.min(1, e)));
    X.temp.textContent = `${t < 0 ? '−' : ''}${Math.abs(t)}℃`;
    X.fr.forEach((el, i) => el.classList.toggle('on', fr > i / 5 + .01));
    if (I) I.heater.classList.toggle('on', d);
  }
  // in the window: the pack arrives frosted in a cold cloud; the frost clears to show the goods themselves
  const SCALE = { cup: 1.25, gyoza: 1.3, yakitori: 1.3, karaage: 1.4, chahan: 1.3, ramen: 1.3, tsukemen: 1.2, pizza: 1, jar: 1.15, sashimi: 1.2, crab: 1 };
  const sc = (sx, sy, s) => `translate(${f(sx)} ${f(sy)}) scale(${f(s)}) translate(${f(-sx)} ${f(-sy)})`;
  function windowItem(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = r.open ? `<g class="fz-pack" transform="${sc(sx, sy, SCALE[r.p.g] || 1.2)}">${FZB.show(r.p, ...WINDOW)}</g>`
      : `<g class="fz-pack" transform="${sc(sx, sy, 1.2)}">${FZB.use(FZB.packOf(r.p), r.p, ...WINDOW)}<ellipse cx="${f(sx)}" cy="${f(sy - 5)}" rx="9" ry="7" fill="#eaf6ff" opacity=".62"/></g>` + FZB.fog(...WINDOW);
  }
  function reveal(r) {
    if (ready !== r || r.open) return;
    r.open = true;
    const [sx, sy] = P(...WINDOW), g = X.windowG, old = g.querySelector('.fz-pack'), s1 = SCALE[r.p.g] || 1.2;
    const neu = UTIL.g(g, FZB.show(r.p, ...WINDOW), { class: 'fz-pack', opacity: 0 });
    SND.capOpen(); UTIL.haptic(8); CORE.sparkle(WINDOW[0], WINDOW[1], WINDOW[2] + 8, 7, '#eaf6ff');
    UTIL.tween(360, e => { const b = 1 + 1.7 * Math.pow(e - 1, 3) + .7 * Math.pow(e - 1, 2);
      if (old) { old.setAttribute('transform', sc(sx, sy, 1.2 + .2 * e)); old.setAttribute('opacity', f(1 - e)); }
      neu.setAttribute('transform', sc(sx, sy, (.6 + .4 * b) * s1)); neu.setAttribute('opacity', f(Math.min(1, e * 2))); }, t => t)
      .then(() => { if (ready === r) windowItem(r); });
  }

  /* ---------- the run ---------- */
  const at = (x, y, z) => { const [sx, sy] = P(x, y, z); return `translate(${f(sx)} ${f(sy)})`; };
  const lerp = (a, b, e) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  const moveG = (el, a, b, ms, ease = UTIL.ease.inOut) => UTIL.tween(ms, e => el.setAttribute('transform', at(...lerp(a, b, e))), ease);
  let liftZ = LIFT.bottom;
  const liftTo = (z, ms) => { const from = liftZ; return UTIL.tween(ms, e => { liftZ = from + (z - from) * e; const [, sy] = P(0, 0, liftZ - LIFT.bottom); I.lift.setAttribute('transform', `translate(0 ${f(sy)})`); }, UTIL.ease.inOut); };
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    if (defrosting()) { [0, 1, 2, 3].forEach(i => setTimeout(() => X.defrost.classList.toggle('on'), i * 110)); setTimeout(paintDoor, 480); if (who === 'player') SND.buzz(); return false; }
    const kk = k == null ? anyShelf() : k;
    if (kk < 0 || !ks().includes(kk) || !countShelf(kk)) { const r = k != null && rowOf(k); if (r) { const s = r.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    // the fullest lane gives (they wear evenly); the twin shelf has one lane between its two spirals
    const lane = S.q[kk].reduce((b, l, i) => l.length > S.q[kk][b].length ? i : b, 0), p = S.q[kk][lane][0], row = rowOf(kk);
    if (row) { row.querySelector('.led').classList.add('on'); CORE.glow(row.querySelector('.fz-glow'), 1600, .35); if (who === 'player') CORE.press(row); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    await I.cm.coinIn(p.price, FZ.SLOTW);
    const sh = I.shelves[kk], M = sh.M, x = lanes(kk)[lane], z = sh.z;
    if (lv.elev) { SND.lift(); await liftTo(z - 1.6, 260 + Math.abs(z - liftZ) * 2.6); }
    // the spiral turns once: the lane moves up a pitch and the front pack goes over the edge
    const turning = M.lane ? sh.coils : [sh.coils[lane]], p0 = turning.map(c => c.phase);
    SND.turn();
    await UTIL.tween(720, e => { turning.forEach((c, i) => { c.phase = p0[i] - e * Math.PI * 2; renderCoil(c, M); }); renderShelf(kk, lane, e * M.pitch); }, UTIL.ease.inOut);
    turning.forEach(c => { c.phase %= Math.PI * 2; });
    S.q[kk][lane].shift(); renderShelf(kk);
    const el = UTIL.g(I.movers, `<use href="#${FZB.packOf(p)}" style="${FZB.vars(p)}"/>`, {}), edge = [x, Math.min(78, FRONT_Y + M.pitch), z], bin = [x, 76, 18];
    el.setAttribute('transform', at(...edge));
    if (lv.elev) {   // onto the platform and down with it, gently
      await Promise.all([liftTo(LIFT.bottom, 300 + (z - LIFT.bottom) * 2.6), moveG(el, edge, [x, 77, LIFT.bottom + 1.6], 300 + (z - LIFT.bottom) * 2.6)]);
      SND.tok();
    } else {          // it drops: ゴトン
      await UTIL.tween(260 + (z - 18) * 1.6, e => el.setAttribute('transform', at(x, edge[1] + (bin[1] - edge[1]) * e, z + (bin[2] - z) * e * e) + ` rotate(${f(e * 24)})`), t => t);
      SND.gakon(); UTIL.haptic(12); FX.pop(x, 78, 34, 'ゴトン', 'var(--ink-hi)', 11);
    }
    await moveG(el, [x, 77, lv.elev ? LIFT.bottom + 1.6 : 18], [WINDOW[0], WINDOW[1] + 2, WINDOW[2] - 4], 240, UTIL.ease.out);
    el.remove();
    if (row) row.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * e)})`), UTIL.ease.out);
    const r = ready = { p, who, k: kk, open: false };
    windowItem(r); X.ready.classList.add('on'); SND.ding(); UTIL.haptic(14);
    setTimeout(() => reveal(r), 520 / UTIL.speed);
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    addFrost(1 / FROST_N[lv.defrost || 0]); renderFrost();
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready && ready.p === p) take(true); }, 7000);
    paintDoor();
    return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#9ae8ff');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 20, r.p.name, '#9ae8ff'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-56 * e + 22 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * (1 - e))})`), UTIL.ease.in);
    busy = false;
  }
  // meltwater: a drop from the evaporator into the pan, only while defrosting and only when the insides are drawn
  function drip() {
    if (!I || G.interior.style.display === 'none') return;
    const c = UTIL.el('circle', { r: .9, fill: 'rgba(170,220,255,.85)' }, I.drips), x = 12 + Math.random() * 70;
    UTIL.tween(520, e => { const q = P(x, 12, 52 - 46 * e * e); c.setAttribute('cx', f(q[0])); c.setAttribute('cy', f(q[1])); }, t => t).then(() => c.remove());
  }

  /* ---------- restock: packs onto the spirals from the front ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="112" height="86" rx="2"/>${slits(8, 104, 8, 2, 84, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 81, 8, 0, 'cr');
  const crateFront = () => box(0, 83.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 81, 8, 0, 'cr');
  const CRATE = { quarter: [12, 9], single: [8, 13], half: [6, 16], twin: [3, 32] };   // per shelf in one crate: how many, spacing
  const supply = {
    title: T`冷冻货`, unit: T`件`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 86, 0], [112, 86, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => ks().flatMap((k, r) => { const [n, dx] = CRATE[SHELVES[k].mod], m = MENU[k], p = { ...m };
      return Array.from({ length: n }, (_, j) => ({ glyph: FZB.packOf(p), vars: FZB.vars(p), pos: [8 + dx / 2 + j * dx, 10 + r * 16.5, 2], target: 's' + k })); }),
    back: crateBack, front: crateFront,
    entry: t => { const k = +t.slice(1); return [47, FRONT_Y - 6, SHELVES[k].z + 16]; },
    accept: t => { const k = +t.slice(1); return countShelf(k) + reserved[k] < capOf(k); },
    cost: t => MENU[+t.slice(1)].buy || 0,
    tier: t => MENU[+t.slice(1)].tier || 1,
    isNew: t => !ECON.everStocked('frozen', MENU[+t.slice(1)].pid),
    // called once a pack is paid for: its place is held so packs still in the air cannot overfill a shelf
    stocks: t => { const k = +t.slice(1); reserved[k]++; return [['frozen', MENU[k].pid]]; },
    arrive: t => {
      const k = +t.slice(1), n = MOD[SHELVES[k].mod].n; reserved[k] = Math.max(0, reserved[k] - 1);
      const lane = S.q[k].reduce((b, l, i) => l.length < S.q[k][b].length ? i : b, 0);
      if (S.q[k][lane].length < n) { S.q[k][lane].push(prod(k)); renderShelf(k); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) [0, 1, 2, 3].forEach(k => S.q[k].forEach((lane, li) => { for (let j = 0; j < Math.ceil(MOD[SHELVES[k].mod].n / 2); j++) lane.push(prod(k)); })); render(); }
  function shell() {
    X = FZB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, FZ.D, FZ.H);
    if (ready) { windowItem(ready); X.flap.setAttribute('transform', 'translate(0 -8.6)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) busy = false;   // a run cut short by a redraw: already counted as sold
    liftZ = LIFT.bottom;
    I = FZB.interior(G.interior, coinState, lv); FZB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderShelves(); renderFrost(); shell();
  }
  function renderShell() { G.exterior.innerHTML = ''; shell(); }
  function step(now) {
    if (now < nextPaint) return; nextPaint = now + 400;
    // the frost only changes on a sale (drawn then) and while it melts: redraw it during a defrost and once as it ends
    const d = defrosting(); paintDoor();
    if (d || wasDefrost) renderFrost();
    if (d) drip();
    wasDefrost = d;
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, FZ.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, FZ.D, 136, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || !canSell()) return null; vend(null, 'customer'); return T`冷冻`; }
  function idleSell() {
    if (!canSell()) return 0;
    const k = anyShelf(), lane = S.q[k].findIndex(l => l.length), p = S.q[k][lane].shift();
    addFrost(1 / FROST_N[lv.defrost || 0]);
    if (I) { renderShelf(k); renderFrost(); }
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // opaque: an insulated door; the insides are drawn only when you can see them
    id: 'frozen', fig: 8, name: T`冷冻食品`, brand: 'ゆきんこ', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#9ae8ff', opaque: true,
    render: () => render(), renderShell: () => renderShell(),
    hint: { shut: T`点门上的商品或点机器招呼客人 · 左右拖动转视角 · 点门锁开门补货`, xray: T`看螺旋把商品推下货架、蒸发器上的霜越结越厚、除霜时化成水 · 拖动扫描线`, open: T`冷冻货一件件码上螺旋 · 开门会进湿气，霜长得快一点 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => { if (open) addFrost(.06); return hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }); },
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return capacity(); },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    save: () => ({ q: S.q.map(sh => sh.map(l => l.map(p => p.pid))), frost: S.frost, defrostUntil: S.defrostUntil, defrostMs: S.defrostMs, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.q)) S.q = SHELVES.map((s, k) => lanes(k).map((_, li) => ((d.q[k] || [])[li] || []).slice(0, MOD[s.mod].n).map(snap).filter(Boolean)));
      ['frost', 'defrostUntil', 'defrostMs'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; });
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => { const a = ks(); return vend(a[k % a.length], 'player'); },
    // X-ray tags: per shelf, over the front pack of its first lane (the dot is the pack's colour, as it sits on the shelf)
    labels: () => ks().map(k => { const li = Math.max(0, S.q[k].findIndex(l => l.length)), p = S.q[k][li][0] || prod(k), [x, y, z] = itemAt(k, li, 0);
      return { name: p.name, n: countShelf(k), c: p.d || p.fill, pt: [x, y, z + (MOD[SHELVES[k].mod].r * 2 + 3)] }; }),
    // goods: one product per shelf, each shelf takes only its size of pack (row)
    goods: {
      kind: 'frozen', get defaults() { return ['vanilla', 'gyoza', 'chahan', 'pizza', 'matcha'].slice(0, ks().length); },
      get slots() { return ks().map(k => ({ cap: capOf(k), row: ROW[k] })); },
      units: i => countShelf(ks()[i]),
      apply: list => { const a = ks(); list.forEach((g, i) => Object.assign(MENU[a[i]], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, fill: g.fill, d: g.d, pack: g.pack, g: g.g })); },
    },
    // upgrades (改造): faster or rarer defrosts, an elevator for the fragile goods, one more shelf
    upgrades: [
      { id: 'defrost', name: T`自动除霜`, cost: [20000, 200000], effect: [T`热气除霜 · 除霜 30 → 10 秒`, T`无霜送风 · 结霜慢三倍`], kind: T`省心`, pin: [46, 14, 64],
        fact: T`ど冷えもん 会定期除霜：加热器把霜化掉、把水排走，再重新预冷；库温超出范围一段时间，或者商品过了保质期，也会自动停售。` },
      { id: 'elev', name: 'マルチエレベーター', cost: [70000], effect: [T`升降台接住商品，不用摔 · 能卖瓶装蛋糕和刺身`], kind: T`新货`, pin: [89, 80, 110],
        fact: T`ど冷えもん 的 MULTI 机型用「マルチエレベーター」两列同步升降，把商品送到取货口；还能分出冷藏 5℃、18℃ 和常温的格子。` },
      { id: 'shelf', name: T`加一层货架`, cost: [40000], effect: [T`顶上多一层冰淇淋 · 菜单多一格 · 容量 45 → 69`], kind: T`容量`, pin: [47, 44, 218],
        fact: T`ど冷えもん 的组合货架有四种模块：ツイン、ハーフ、シングル、クォーター（一层放 4 个杯装）。按商品大小换螺距，大件就拆掉隔板，让两根螺旋一起转。` },
    ],
    applyParts: l => { lv = { defrost: l.defrost || 0, elev: l.elev || 0, shelf: l.shelf || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    ks().forEach(k => { const cap = MOD[SHELVES[k].mod].n; d.q[k] = (d.q[k] || []).map(l => { const add = Math.max(0, Math.min(cap - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); }); });
    if (added) me.load(d); return added; };
})();
