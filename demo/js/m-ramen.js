/* Fig 4 behaviour: coin -> the carousel turns the bowl to the lift -> the lift lowers it to the stand -> hot water ->
   湯切り (the bowl tips; with the upgrade it spins) -> dashi -> out to the window, where it steams. The nixie on the door
   counts 25 -> 0 over the run. The boiler runs cold after a run of bowls and heats up again (準備中): that is the
   machine's little flaw, and the boiler upgrade is its cure. Heat is kept in real time, so it recovers off screen too.
   Restock: bowls (already filled with noodles and toppings) onto the carousel, a jug of dashi into the tank. */
(() => {
  const { P, f } = ISO;
  const { CAR, PICK, LIFT, OUT, WINDOW, MENU } = RA;
  ['kake', 'tanuki', 'shoyu', 'kitsune'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 100; });   // the starting menu
  // boiler by level: bowls per full heat, and how long a full heat-up takes
  const BOILER = [{ bowls: 15, reheat: 40000 }, { bowls: 30, reheat: 30000 }, { bowls: 60, reheat: 20000 }];
  let lv = { boiler: 0, spin: 0, tier: 0 };
  const tiers = () => 2 + (lv.tier > 0 ? 1 : 0), capacity = () => tiers() * CAR.n, perItem = () => Math.floor(capacity() / MENU.length);
  // slots: one product (or null) per carousel place, tier by tier; phi: the carousel's turn
  const S = { slots: [], dashi: .85, heat: 1, stamp: Date.now(), reheating: false, phi: 0 };
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null, nextPaint = 0;
  const coinState = [14, 7, 20, 4];

  /* ---------- products and places ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, soup: m.soup, noodle: m.noodle, top: m.top }; };
  const snap = pid => { const g = pid && ECON.product('ramen', pid); if (!g) return null; const q = ECON.quote('ramen', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, soup: g.soup, noodle: g.noodle, top: g.top }; };
  const fit = () => { const n = capacity(); while (S.slots.length < n) S.slots.push(null); if (S.slots.length > n) S.slots.length = n; };
  const angle = i => { const t = Math.floor(i / CAR.n), j = i % CAR.n; return S.phi + j * 2 * Math.PI / CAR.n + t * Math.PI / CAR.n; };
  const tierZ = i => CAR.z[Math.floor(i / CAR.n)];
  const count = () => S.slots.filter(Boolean).length;
  const countOf = pid => S.slots.filter(p => p && p.pid === pid).length;

  /* ---------- the boiler: heat in [0, 1], recovering in real time; out of heat -> 準備中 until full again ---------- */
  function heatNow() {
    const now = Date.now(), b = BOILER[lv.boiler || 0];
    S.heat = Math.min(1, S.heat + (now - S.stamp) / b.reheat); S.stamp = now;
    if (S.reheating && S.heat >= 1) S.reheating = false;
    return S.heat;
  }
  function useHeat() { heatNow(); S.heat = Math.max(0, S.heat - 1 / BOILER[lv.boiler || 0].bowls); if (S.heat < 1 / BOILER[lv.boiler || 0].bowls) S.reheating = true; }
  const canSell = () => { heatNow(); return !S.reheating && S.dashi > .02 && count() > 0; };

  /* ---------- drawing ---------- */
  function renderBowls() {
    for (let t = 0; t < tiers(); t++) {
      const items = [];
      for (let j = 0; j < CAR.n; j++) { const i = t * CAR.n + j, p = S.slots[i]; if (!p) continue;
        const a = angle(i), x = CAR.x + CAR.r * Math.cos(a), y = CAR.y + CAR.r * Math.sin(a); items.push({ p, x, y, z: CAR.z[t], k: ISO.key(x, y, 0) }); }
      items.sort((a, b) => a.k - b.k);
      I.tiersG[t].innerHTML = items.map(it => RAB.bowlUse(it.p, it.x, it.y, it.z)).join('');
    }
  }
  function renderGauges() {
    const h = Math.max(0, Math.min(1, S.heat));
    I.thermo.innerHTML = `<rect width="3" height="44" rx="1.5" fill="#0b0d11" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x=".6" y="${f(43.4 - h * 42)}" width="1.8" height="${f(h * 42)}" rx=".9" fill="${S.reheating ? '#ff9a3c' : 'var(--red)'}"/>`;
    const d = Math.max(0, Math.min(1, S.dashi)) * 46;
    I.dashiLevel.innerHTML = `<rect width="6" height="48" fill="#0b0d11" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x=".6" y="${f(47.4 - d)}" width="4.8" height="${f(d)}" fill="#b0703a" opacity=".9"/>`;
    I.heater.classList.toggle('ra-boost', S.reheating);
  }
  function paintDoor() {
    X.tiles.forEach((t, k) => t.querySelector('.soldout').classList.toggle('on', !countOf(MENU[k].pid) || S.dashi <= .02));
    X.prep.classList.toggle('on', S.reheating);
  }
  const setNixie = n => { const s = String(Math.max(0, Math.min(99, n))).padStart(2, '0'); X.nixie.forEach((el, i) => { el.textContent = s[i]; el.classList.add('on'); }); };
  const nixieOff = () => X.nixie.forEach(el => el.classList.remove('on'));
  function windowBowl(p) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = RAB.bowlUse(p, ...WINDOW, false) + [[-2.4, 0], [0, .5], [2.4, .25]].map(([dx, d]) => `<path class="steam" style="animation-delay:${d}s" d="M${f(sx + dx)} ${f(sy - 9)}q-1.6-3 0-6t0-6" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`).join('');
  }

  /* ---------- the run ---------- */
  // turn the carousel (shortest way) so place i faces the lift (the front place)
  function turnTo(i) {
    const now = angle(i), d = Math.atan2(Math.sin(PICK - now), Math.cos(PICK - now)), from = S.phi;
    if (Math.abs(d) < .01) return Promise.resolve();
    SND.turn();
    return UTIL.tween(380 + Math.abs(d) * 260, e => { S.phi = from + d * e; renderBowls(); }, UTIL.ease.inOut);
  }
  const lift = (dz, ms) => { const from = +(I.carriage.dataset.dz || 0); return UTIL.tween(ms, e => { const z = from + (dz - from) * e; I.carriage.dataset.dz = z; I.carriage.setAttribute('transform', `translate(0 ${f(-z)})`); }, UTIL.ease.inOut); };
  const placeEl = (el, x, y, z) => { const [sx, sy] = P(x, y, z); el.setAttribute('x', f(sx)); el.setAttribute('y', f(sy)); };
  const moveEl = (el, a, b, ms, ease = UTIL.ease.inOut) => UTIL.tween(ms, e => placeEl(el, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e), ease);
  function pick(k) {   // a menu item's bowl (player) or any bowl (customer); nearest the lift first
    const want = k == null ? null : MENU[k].pid;
    let best = -1, bd = 9;
    S.slots.forEach((p, i) => { if (!p || (want && p.pid !== want)) return; const a = angle(i) - PICK, d = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    if (!canSell()) { if (S.reheating) { [0, 1, 2, 3].forEach(i => setTimeout(() => X.prep.classList.toggle('on'), i * 110)); setTimeout(paintDoor, 480); }
      if (who === 'player') SND.buzz(); return false; }
    const i = pick(k);
    if (i < 0) { if (k != null) { const s = X.tiles[k].querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const p = S.slots[i], tk = MENU.findIndex(m => m.pid === p.pid), tile = X.tiles[tk];
    if (tile) { tile.querySelector('.led').classList.add('on'); CORE.glow(tile.querySelector('.ra-tglow'), 1600, .4); if (who === 'player') CORE.press(tile); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    // the nixie counts the whole run down from 25
    const spin = !!lv.spin, total = 4700 * (spin ? .72 : 1);
    setNixie(25); const countdown = UTIL.tween(total + 900, e => setNixie(Math.ceil(25 * (1 - e))), t => t);
    await I.cm.coinIn(p.price, RA.SLOTW);
    await turnTo(i);
    // the lift comes up to the tier, the bowl slides on, down it goes
    const z0 = tierZ(i), dz = z0 - LIFT.bottom;
    await lift(dz, 300);
    S.slots[i] = null; renderBowls();
    const el = UTIL.el('use', { href: '#g-bowl-dry', style: RAB.vars(p) }, I.movers);
    await moveEl(el, [CAR.x, CAR.y + CAR.r, z0], [LIFT.x, LIFT.y, z0], 200); SND.tok();
    await Promise.all([lift(0, 440), moveEl(el, [LIFT.x, LIFT.y, z0], [LIFT.x, LIFT.y, LIFT.bottom], 440)]);
    el.remove(); SND.tok();
    // on the stand: hot water, the drain, dashi
    const [bx, by] = P(LIFT.x, LIFT.y, LIFT.bottom);
    I.station.innerHTML = `<g class="ra-sb"><use href="#g-bowl-dry" x="${f(bx)}" y="${f(by)}" style="${RAB.vars(p)}"/><path class="ra-liq" transform="translate(${f(bx)} ${f(by)})" d="${GLY.toD(GLY.ringZ(5.32, 5.8))}" fill="rgba(210,235,255,.55)" opacity="0"/></g>`;
    const sb = I.station.firstChild, liq = sb.querySelector('.ra-liq');
    I.waterStream.classList.add('on'); CORE.replay(I.wpulse); SND.pour(.6);
    await UTIL.tween(spin ? 420 : 560, e => liq.setAttribute('opacity', f(e)), t => t);
    I.waterStream.classList.remove('on');
    await drain(sb, bx, by, spin);
    liq.setAttribute('opacity', 0); liq.setAttribute('fill', p.soup);
    I.dashiStream.classList.add('on'); CORE.replay(I.dpulse); SND.pour(.8);
    await UTIL.tween(spin ? 420 : 560, e => liq.setAttribute('opacity', f(e)), t => t);
    I.dashiStream.classList.remove('on');
    // out it goes, to the window
    I.station.innerHTML = '';
    const out = UTIL.el('use', { href: '#g-bowl', style: RAB.vars(p) }, I.movers);
    await moveEl(out, [LIFT.x, LIFT.y, LIFT.bottom], OUT, 320, UTIL.ease.in); out.remove();
    await countdown;
    useHeat(); S.dashi = Math.max(0, S.dashi - 1 / 40); renderGauges();
    if (tile) tile.querySelector('.led').classList.remove('on');
    await UTIL.tween(240, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * e)})`), UTIL.ease.out);
    windowBowl(p); X.ready.classList.add('on'); SND.ding(); UTIL.haptic(14); setNixie(0);
    ready = { p, who };
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 800); else setTimeout(() => { if (ready && ready.p === p) take(true); }, 7000);
    paintDoor();
    return true;
  }
  // 湯切り: the bowl tips over the basin and drips (or, with the upgrade, spins and flings the water off)
  async function drain(sb, bx, by, spin) {
    const drops = n => { for (let d = 0; d < n; d++) setTimeout(() => {
      const c = UTIL.el('circle', { r: .8, fill: 'rgba(210,235,255,.85)' }, I.movers), a = spin ? Math.random() * Math.PI * 2 : 0;
      const x0 = LIFT.x + (spin ? 6 * Math.cos(a) : 6), y0 = LIFT.y + (spin ? 6 * Math.sin(a) : 0), x1 = spin ? x0 + 6 * Math.cos(a) : 50, y1 = spin ? y0 + 6 * Math.sin(a) : 69;
      UTIL.tween(300, e => { const q = P(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e, LIFT.bottom + 5 - (LIFT.bottom - 34) * e * e); c.setAttribute('cx', f(q[0])); c.setAttribute('cy', f(q[1])); }, t => t).then(() => c.remove());
    }, d * 45); };
    if (spin) { SND.mix(.6); drops(10); await UTIL.tween(340, e => sb.setAttribute('transform', `translate(${f(Math.sin(e * Math.PI * 10) * .6)} 0)`), t => t); sb.removeAttribute('transform'); return; }
    SND.korokoro(); drops(6);
    const [rx, ry] = P(LIFT.x + 6, LIFT.y, LIFT.bottom + 5);
    await UTIL.tween(260, e => sb.setAttribute('transform', `rotate(${f(-38 * e * ISO.fwd)} ${f(rx)} ${f(ry)})`), UTIL.ease.out);
    await UTIL.tween(240, e => sb.setAttribute('transform', `rotate(${f(-38 * (1 - e) * ISO.fwd)} ${f(rx)} ${f(ry)})`), UTIL.ease.in);
    sb.removeAttribute('transform');
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const [sx, sy] = P(...WINDOW), el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#ff9a5a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 20, r.p.name, '#ff9a5a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-56 * e + 22 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on'); nixieOff();
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * (1 - e))})`), UTIL.ease.in);
    busy = false;
  }

  /* ---------- restock: bowls onto the carousel, dashi into the tank ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="96" height="62" rx="2"/>${slits(8, 88, 8, 2, 60, true, 'crrib')}</g>` + box(0, 0, 0, 96, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const crateFront = () => box(0, 59.5, 0, 96, 2.5, 8, 0, 'cr') + box(93.5, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const flying = [0, 0, 0, 0], flyAll = () => flying.reduce((a, b) => a + b, 0);   // bowls in the air, per menu item
  const supply = {
    title: T`面碗`, unit: T`碗`, gap: 90, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [96, 0, 0], [0, 62, 0], [96, 62, 0], [0, 0, 24], [96, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: 5 }, (_, j) => ({ glyph: 'g-bowl-dry', vars: RAB.vars(m), pos: [9 + j * 14.4, 9 + k * 13, 2], target: 'b' + k }))),
      { glyph: 'g-dashi', vars: '', pos: [86, 30, 2], target: 'dashi' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'dashi' ? [94, 24, 206] : [CAR.x, CAR.y + CAR.r, CAR.z[tiers() - 1] + 12],
    // bowls still in the air are reserved (a fast pour, ×14 in 全部补货, would otherwise send and pay for too many)
    accept: t => t === 'dashi' ? S.dashi < .97 : count() + flyAll() < capacity() && countOf(MENU[+t.slice(1)].pid) + flying[+t.slice(1)] < perItem(),
    cost: t => t === 'dashi' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'dashi' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t !== 'dashi' && !ECON.everStocked('ramen', MENU[+t.slice(1)].pid),
    stocks: t => { if (t === 'dashi') return []; flying[+t.slice(1)]++; return [['ramen', MENU[+t.slice(1)].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t !== 'dashi') flying[+t.slice(1)] = Math.max(0, flying[+t.slice(1)] - 1);
      if (t === 'dashi') {   // tip the jug over the tank while the level rises
        const from = S.dashi; SND.pour(1);
        UTIL.tween(900, e => { S.dashi = from + (1 - from) * e; renderGauges(); }).then(() => { SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(118 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut).then(() => el.remove());
        return true;
      }
      // a bowl takes the free place nearest the loading point
      const k = +t.slice(1); let best = -1, bd = 9;
      S.slots.forEach((p, i) => { if (p) return; const a = angle(i) - Math.PI / 2, d = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) + Math.floor(i / CAR.n) * .01; if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { S.slots[best] = prod(k); renderBowls(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => (a.target === 'dashi') - (b.target === 'dashi'),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; fit(); if (!S.slots.some(Boolean)) [3, 3, 3, 3].forEach((n, k) => { for (let j = 0; j < n; j++) { const i = S.slots.indexOf(null); if (i >= 0) S.slots[i] = prod(k); } }); render(); }
  function shell() {
    X = RAB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, RA.D, RA.H);
    if (ready) { windowBowl(ready.p); X.flap.setAttribute('transform', 'translate(0 -8.6)'); X.ready.classList.add('on'); setNixie(0); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) busy = false;   // a run cut short by a redraw: the bowl was already counted as sold
    heatNow();
    I = RAB.interior(G.interior, coinState, lv); RAB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderBowls(); renderGauges(); shell();
  }
  // the shell only, while the camera turns and the insides are not drawn (they are redrawn when they come into view)
  function renderShell() { G.exterior.innerHTML = ''; shell(); }
  function step(now) { if (now > nextPaint) { nextPaint = now + 400; heatNow(); if (G.interior.style.display !== 'none') renderGauges(); paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, RA.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, RA.D, 136, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || !canSell()) return null; vend(null, 'customer'); return T`面`; }
  function idleSell() {
    if (!canSell()) return 0;
    const full = S.slots.map((p, i) => p ? i : -1).filter(i => i >= 0), i = UTIL.pick(full), p = S.slots[i];
    S.slots[i] = null; useHeat(); S.dashi = Math.max(0, S.dashi - 1 / 40);
    if (I) { renderBowls(); renderGauges(); }   // cheap (a few dozen nodes), and the insides must be right when they come into view
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // opaque: a solid door; the insides are drawn only when you can see them
    id: 'ramen', fig: 4, name: T`现煮面`, brand: 'ゆげ屋', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff6a3d', opaque: true,
    render: () => render(), renderShell: () => renderShell(),
    hint: { shut: T`点菜单或点机器招呼客人 · 左右拖动转视角 · 点门锁开门补碗`, xray: T`看转盘、升降架、注水、沥水和浇汤 · 拖动扫描线`, open: T`点一下把碗码上转盘 · 出汁壶倒进汤罐 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return capacity(); },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    save: () => ({ slots: S.slots.map(p => p ? p.pid : null), dashi: S.dashi, heat: S.heat, stamp: S.stamp, reheating: S.reheating, coins: coinState.slice() }),
    load: d => { if (!d) return; fit();
      if (Array.isArray(d.slots)) S.slots = d.slots.slice(0, capacity()).map(pid => snap(pid)); fit();
      ['dashi', 'heat', 'stamp'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; }); S.reheating = !!d.reheating;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % MENU.length, 'player'),
    // X-ray tags: per menu item, over its nearest bowl on the carousel
    labels: () => MENU.map(m => { let best = null;
      S.slots.forEach((p, i) => { if (!p || p.pid !== m.pid) return; const a = angle(i), x = CAR.x + CAR.r * Math.cos(a), y = CAR.y + CAR.r * Math.sin(a), k = ISO.key(x, y); if (!best || k > best.k) best = { k, pt: [x, y, tierZ(i) + 9] }; });
      return { name: m.name, n: countOf(m.pid), c: m.soup, pt: best ? best.pt : [CAR.x, CAR.y + CAR.r, CAR.z[0] + 9] }; }),
    // goods: the four bowls on the menu; each bowl on the carousel carries its own product (old bowls sell first)
    goods: {
      kind: 'ramen', defaults: ['kake', 'tanuki', 'shoyu', 'kitsune'],
      get slots() { return MENU.map(() => ({ cap: perItem() })); },
      units: k => countOf(MENU[k].pid),
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, soup: g.soup, noodle: g.noodle, top: g.top })),
    },
    // upgrades (改造): the cure for the boiler, a faster drain, a third tier
    upgrades: [
      { id: 'boiler', name: T`大锅炉`, cost: [20000, 200000], effect: [T`连做 15 → 30 碗才要烧水`, T`连做 30 → 60 碗，几乎不用停`], kind: T`速度`, pin: [96, 40, 44],
        fact: T`真实的昭和面机：秋田那台连做约 15 碗就要停下来烧约 40 分钟水，热水量就是它的瓶颈。` },
      { id: 'spin', name: T`转碗湯切り`, cost: [60000], effect: [T`沥水改成高速转碗 · 出餐快约 30%`], kind: T`速度`, pin: [56, 82, 40],
        fact: T`富士電機的面机把碗高速转起来甩掉热水；川鉄的是把碗倾斜倒掉，配料不容易飞出去。` },
      { id: 'tier', name: T`第三层转盘`, cost: [40000], effect: [T`容量 20 → 30 碗`], kind: T`容量`, pin: [20, 40, 222],
        fact: T`真实的面机把装好面和配料的碗码在机内的螺旋轨道上，一次能放约 20 碗；早上备一次，白天还要补几次。` },
    ],
    applyParts: l => { lv = { boiler: l.boiler || 0, spin: l.spin || 0, tier: l.tier || 0 }; fit(); },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    MENU.forEach(m => { let have = d.slots.filter(p => p === m.pid).length;
      for (let i = 0; i < d.slots.length && have < perItem() && added < n; i++) if (!d.slots[i]) { d.slots[i] = m.pid; have++; added++; } });
    d.dashi = 1; me.load(d); return added || 1; };
  // bowls left but no dashi: as good as sold out
  me.stuck = () => S.dashi <= .02;
})();
