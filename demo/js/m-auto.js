/* Fig 6 behaviour. Three kitchens in one cabinet, one order at a time, all ending in the same window:
   - toast: the bottom sandwich of a magazine slides onto the hot plate, the press comes down (トースト中, the coil glows),
     goes up, the sandwich tips off into the glass chute: ゴトッ.
   - burger (upgrade): the hatch opens, the pusher shoves the bottom box into the oven, it turns under the light, チン,
     onto the lift, down to the window.
   - curry (upgrade): a rice tray leaves the steam box for the station, a pouch drops onto the blade, it is slit and
     poured over the rice.
   The door's nixie counts down the run (25 toast / 60 burger / 30 curry). A newly fitted module comes with two of its
   goods to try. Restock: foil sandwiches into the magazines, boxes into the column, tray-and-pouch sets into the steam box. */
(() => {
  const { P, f } = ISO;
  const { MAG, PLATE, PRESS_UP, CHUTE, COL, TURN, LIFT, TRAY, STATION, RACK, BLADE, WINDOW, CAPS, MENU } = AR;
  ['ham', 'cheese', 'burger', 'curry'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 120; });   // the starting menu
  let lv = { press: 0, burger: 0, curry: 0 };
  // the menu places that exist: two toast places, then the burger and the curry place once their modules are fitted
  const act = () => [0, 1, ...(lv.burger ? [2] : []), ...(lv.curry ? [3] : [])];
  const capacity = () => act().reduce((s, k) => s + CAPS[k], 0);
  // q: per menu place, its goods in order (the oldest leaves first: the bottom of a stack); seeded: modules already given their two to try
  const S = { q: [[], [], [], []], seeded: {} };
  const reserved = [0, 0, 0, 0];   // paid for and still in the air
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null;
  const coinState = [14, 7, 20, 4];

  /* ---------- products and stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, fill: m.fill, d: m.d, o: m.o }; };
  const snap = pid => { const g = pid && ECON.product('auto', pid); if (!g) return null; const q = ECON.quote('auto', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, fill: g.fill, d: g.d, o: g.o }; };
  const count = () => act().reduce((s, k) => s + S.q[k].length, 0);
  const anyStock = () => { const ks = act().filter(k => S.q[k].length); return ks.length ? UTIL.pick(ks) : -1; };
  const tileOf = k => X.tiles.find(t => +t.dataset.k === k);

  /* ---------- drawing ---------- */
  function renderMag(k) { if (!I) return; I.mags[k].innerHTML = S.q[k].slice(0, CAPS[k]).map((p, i) => ARB.use('g-foil', p, MAG.x[k], MAG.y, MAG.z0 + i * MAG.step)).join(''); }
  function renderCol() { if (!I || !I.oven) return; I.oven.colG.innerHTML = S.q[2].slice(0, CAPS[2]).map((p, i) => ARB.use('g-bbox', p, COL.x, COL.y, COL.z0 + i * COL.step)).join(''); }
  function renderTrays() {
    if (!I || !I.curry) return;
    const list = S.q[3].slice(0, CAPS[3]);
    I.curry.trayG.innerHTML = list.map((p, i) => ARB.use('g-tray', p, TRAY.x, TRAY.y, TRAY.z0 + i * TRAY.step)).join('');
    I.curry.pouchG.innerHTML = list.map((p, i) => ARB.use('g-pouch', p, RACK.x0 + i * RACK.dx, RACK.y, RACK.z)).join('');
  }
  const renderAll = () => { renderMag(0); renderMag(1); renderCol(); renderTrays(); };
  function paintDoor() { X.tiles.forEach(t => t.querySelector('.soldout').classList.toggle('on', !S.q[+t.dataset.k].length)); }
  const setNixie = n => { const s = String(Math.max(0, Math.min(99, n))).padStart(2, '0'); X.nixie.forEach((el, i) => { el.textContent = s[i]; el.classList.add('on'); }); };
  const nixieOff = () => X.nixie.forEach(el => el.classList.remove('on'));
  // in the window: the packet as it drops in, then opened so you see what you got (the curry is served open already)
  const DONE = ['g-foil-hot', 'g-foil-hot', 'g-bbox', 'g-tray-c'], OPEN = ['g-toast-open', 'g-toast-open', 'g-bbox-open', 'g-tray-c'];
  const steamUp = (sx, sy, h) => [[-2.6, 0], [0, .5], [2.6, .25]].map(([dx, d]) => `<path class="steam" style="animation-delay:${d}s" d="M${f(sx + dx)} ${f(sy - h)}q-1.6-3 0-6t0-6" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`).join('');
  const BIG = 1.2;   // opened goods are shown a little larger, so the filling reads at a glance
  const sc = (sx, sy, s) => `translate(${f(sx)} ${f(sy)}) scale(${f(s)}) translate(${f(-sx)} ${f(-sy)})`;
  function windowItem(r) {
    const [sx, sy] = P(...WINDOW), id = r.open ? OPEN[r.k] : DONE[r.k];
    X.windowG.innerHTML = `<g class="au-pack"${r.open ? ` transform="${sc(sx, sy, BIG)}"` : ''}>${ARB.use(id, r.p, ...WINDOW)}</g>` + steamUp(sx, sy, r.open && r.k < 2 ? 6 : r.open ? 13 : 7);
  }
  // the packet opens: it puffs up and fades as the opened goods pop out, with a rustle, a glint and the steam
  function unwrap(r) {
    if (ready !== r || r.open || r.k === 3) return;
    r.open = true;
    const [sx, sy] = P(...WINDOW), g = X.windowG, old = g.querySelector('.au-pack');
    const neu = UTIL.g(g, ARB.use(OPEN[r.k], r.p, ...WINDOW), { class: 'au-pack', opacity: 0 });
    SND.capOpen(); UTIL.haptic(8); CORE.sparkle(WINDOW[0], WINDOW[1], WINDOW[2] + 6, 6, '#fff6d6');
    UTIL.tween(320, e => { const b = 1 + 1.7 * Math.pow(e - 1, 3) + .7 * Math.pow(e - 1, 2);
      if (old) { old.setAttribute('transform', sc(sx, sy, 1 + .18 * e)); old.setAttribute('opacity', f(1 - e)); }
      neu.setAttribute('transform', sc(sx, sy, (.6 + .4 * b) * BIG)); neu.setAttribute('opacity', f(Math.min(1, e * 2))); }, t => t)
      .then(() => { if (ready !== r) return; windowItem(r); });
  }

  /* ---------- the runs ---------- */
  const at = (x, y, z) => { const [sx, sy] = P(x, y, z); return `translate(${f(sx)} ${f(sy)})`; };
  const lerp = (a, b, e) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  const moveG = (el, a, b, ms, ease = UTIL.ease.inOut) => UTIL.tween(ms, e => el.setAttribute('transform', at(...lerp(a, b, e))), ease);
  const slide = (el, dx, dy, dz, ms, back = false) => { const [sx, sy] = P(dx, dy, dz); return UTIL.tween(ms, e => { const t = back ? 1 - e : e; el.setAttribute('transform', `translate(${f(sx * t)} ${f(sy * t)})`); }, UTIL.ease.inOut); };
  const item = (glyph, p, parent) => UTIL.g(parent || I.movers, `<use href="#${glyph}" style="${ARB.vars(p)}"/>`, {});
  const OUT = [WINDOW[0], WINDOW[1] - 3, 27];
  async function runToast(k, p) {
    renderMag(k);
    const el = item('g-foil', p), a = [MAG.x[k], MAG.y, MAG.z0], b = [PLATE.x, PLATE.y, PLATE.z];
    SND.tok();
    await moveG(el, a, [MAG.x[k], MAG.y + 13, MAG.z0 - 2], 200, UTIL.ease.in);
    await moveG(el, [MAG.x[k], MAG.y + 13, MAG.z0 - 2], b, 220, UTIL.ease.out);
    I.onPlate.appendChild(el); SND.tok();
    // the press comes down, the plate heats (from above too with the upgrade), the foil darkens
    await slide(I.press, 0, 0, -PRESS_UP, 220); SND.clank(); UTIL.haptic(8);
    I.coil.classList.add('on'); if (I.coil2) I.coil2.classList.add('on'); I.pilot.classList.add('on');
    const cook = lv.press ? 1000 : 2000;
    UTIL.tween(cook + 500, e => I.fan.setAttribute('transform', `rotate(${f(e * 900)})`), t => t);
    setTimeout(() => { const u = el.firstChild; if (u) u.setAttribute('href', '#g-foil-hot'); }, cook / 2 / UTIL.speed);
    await UTIL.wait(cook);
    I.coil.classList.remove('on'); if (I.coil2) I.coil2.classList.remove('on'); I.pilot.classList.remove('on');
    await slide(I.press, 0, 0, -PRESS_UP, 200, true); I.press.removeAttribute('transform');
    // off the left edge of the plate, down the chute: ゴトッ, along the floor to the window
    I.movers.appendChild(el);
    await moveG(el, b, [CHUTE.x, CHUTE.y, PLATE.z - 4], 190, UTIL.ease.in);
    await moveG(el, [CHUTE.x, CHUTE.y, PLATE.z - 4], [CHUTE.x, CHUTE.y, 26], 400, UTIL.ease.in);
    SND.gakon(); UTIL.haptic(12); FX.pop(CHUTE.x + 8, CHUTE.y, 42, 'ゴトッ', 'var(--ink-hi)', 11);
    await moveG(el, [CHUTE.x, CHUTE.y, 26], OUT, 280, UTIL.ease.out);
    el.remove();
  }
  async function runBurger(p) {
    const O = I.oven; renderCol();
    const el = item('g-bbox', p, O.inOven), a = [COL.x, COL.y, COL.z0];
    el.setAttribute('transform', at(...a));
    await slide(O.hatch, 0, 0, 12, 180); SND.tok();
    await Promise.all([slide(O.pusher, 10, 0, 0, 420), moveG(el, a, TURN, 420)]);
    slide(O.pusher, 10, 0, 0, 260, true);
    await slide(O.hatch, 0, 0, 12, 160, true); O.hatch.removeAttribute('transform'); SND.click();
    // under the light, on the turntable
    O.light.classList.add('on'); SND.rumble();
    await UTIL.tween(2300, e => O.spokes.setAttribute('transform', `rotate(${f(e * 540)})`), t => t);
    O.light.classList.remove('on'); SND.ding(); FX.pop(TURN[0], TURN[1], TURN[2] + 30, 'チン!', 'var(--ink-hi)', 11);
    // onto the lift and down to the window
    I.movers.appendChild(el);
    const top = [LIFT.x, LIFT.y, LIFT.top + 1], bot = [LIFT.x, LIFT.y, LIFT.bottom + 1];
    await moveG(el, TURN, top, 260);
    await Promise.all([slide(O.lift, 0, 0, LIFT.bottom - LIFT.top, 420), moveG(el, top, bot, 420)]);
    await moveG(el, bot, OUT, 160, UTIL.ease.out);
    el.remove();
    slide(O.lift, 0, 0, LIFT.bottom - LIFT.top, 520, true).then(() => O.lift.removeAttribute('transform'));
  }
  async function runCurry(p) {
    const C = I.curry; renderTrays();
    const tray = item('g-tray', p), a = [TRAY.x, TRAY.y, TRAY.z0];
    await Promise.all([slide(C.pusher, 8, 0, 0, 200), moveG(tray, a, [TRAY.x + 16, TRAY.y, TRAY.z0], 200)]);
    slide(C.pusher, 8, 0, 0, 200, true);
    await moveG(tray, [TRAY.x + 16, TRAY.y, TRAY.z0], STATION, 240); SND.tok();
    // a pouch drops onto the blade; the blade swings through it; the curry pours over the rice
    const pouch = item('g-pouch', p), from = [RACK.x0 + 3 * RACK.dx, RACK.y, RACK.z];
    await moveG(pouch, from, [BLADE[0], BLADE[1], BLADE[2] - 2], 220, UTIL.ease.in);
    const [px, py] = C.pivot;
    await UTIL.tween(150, e => C.blade.setAttribute('transform', `rotate(${f(-42 * Math.sin(e * Math.PI) * ISO.fwd)} ${f(px)} ${f(py)})`), t => t);
    C.blade.removeAttribute('transform'); SND.click(); UTIL.haptic(6);
    C.stream.style.stroke = p.fill; C.stream.classList.add('on'); SND.pour(.7);
    await UTIL.tween(620, e => { pouch.setAttribute('opacity', f(1 - e * .8)); if (e > .3 && tray.firstChild.getAttribute('href') !== '#g-tray-c') tray.firstChild.setAttribute('href', '#g-tray-c'); }, t => t);
    C.stream.classList.remove('on');
    // the empty pouch drops into its bin
    moveG(pouch, [BLADE[0], BLADE[1], BLADE[2] - 2], [56, 29, 26], 260, UTIL.ease.in).then(() => pouch.remove());
    await moveG(tray, STATION, OUT, 340, UTIL.ease.in);
    tray.remove();
  }
  const COUNT = [25, 25, 60, 30];
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyStock() : k;
    if (kk < 0 || !act().includes(kk) || !S.q[kk].length) {
      const t = k != null && tileOf(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); }
      if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const p = S.q[kk].shift(), tile = tileOf(kk), lamp = X.lamps[kk];
    if (tile) { tile.querySelector('.led').classList.add('on'); CORE.glow(tile.querySelector('.au-tglow'), 1600, .4); if (who === 'player') CORE.press(tile); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    // the nixie counts the run down
    const total = kk < 2 ? (lv.press ? 3500 : 4500) : kk === 2 ? 5000 : 3300, from = COUNT[kk];
    setNixie(from); const countdown = UTIL.tween(total, e => setNixie(Math.ceil(from * (1 - e))), t => t);
    await I.cm.coinIn(p.price, AR.SLOTW);
    if (lamp) lamp.classList.add('on');
    if (kk < 2) await runToast(kk, p); else if (kk === 2) await runBurger(p); else await runCurry(p);
    if (lamp) lamp.classList.remove('on');
    await countdown;
    if (tile) tile.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * e)})`), UTIL.ease.out);
    const r = ready = { p, who, k: kk, open: false };
    windowItem(r); X.ready.classList.add('on'); SND.ding(); UTIL.haptic(14); setNixie(0);
    setTimeout(() => unwrap(r), 420 / UTIL.speed);
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 800); else setTimeout(() => { if (ready && ready.p === p) take(true); }, 7000);
    paintDoor();
    return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#ffb03a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 20, r.p.name, '#ffb03a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-56 * e + 22 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on'); nixieOff();
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * (1 - e))})`), UTIL.ease.in);
    busy = false;
  }

  /* ---------- restock: foil sandwiches, burger boxes, tray-and-pouch sets ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const GLYPH = ['g-foil', 'g-foil', 'g-bbox', 'g-curryset'];
  const supply = {
    title: T`补货`, unit: T`件`, gap: 80, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => act().flatMap((k, r) => Array.from({ length: CAPS[k] }, (_, j) => ({ glyph: GLYPH[k], vars: `--c:${MENU[k].fill}`, pos: k === 3 ? [11 + j * 12.6, 12 + r * 17.4, 2] : [13 + j * 17, 12 + r * 17.4, 2], target: 'k' + k }))),
    back: crateBack, front: crateFront,
    entry: t => { const k = +t.slice(1); return k < 2 ? [MAG.x[k], MAG.y, 210] : k === 2 ? [COL.x, COL.y, 160] : [TRAY.x, TRAY.y, 96]; },
    accept: t => { const k = +t.slice(1); return S.q[k].length + reserved[k] < CAPS[k]; },
    cost: t => MENU[+t.slice(1)].buy || 0,
    tier: t => MENU[+t.slice(1)].tier || 1,
    isNew: t => !ECON.everStocked('auto', MENU[+t.slice(1)].pid),
    // called once a unit is paid for: its place is held so units still in the air cannot overfill a stack
    stocks: t => { const k = +t.slice(1); reserved[k]++; return [['auto', MENU[k].pid]]; },
    arrive: t => {
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.q[k].length < CAPS[k]) { S.q[k].push(prod(k)); if (k < 2) renderMag(k); else if (k === 2) renderCol(); else renderTrays(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) for (let j = 0; j < 3; j++) { S.q[0].push(prod(0)); S.q[1].push(prod(1)); } render(); }
  function shell() {
    X = ARB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, AR.D, AR.H);
    if (ready) { windowItem(ready); X.flap.setAttribute('transform', 'translate(0 -8.6)'); X.ready.classList.add('on'); setNixie(0); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) busy = false;   // a run cut short by a redraw: the item was already counted as sold
    // a newly fitted module comes with two of its goods to try
    [[2, 'burger'], [3, 'curry']].forEach(([k, id]) => { if (lv[id] && !S.seeded[id]) { S.seeded[id] = 1; for (let j = 0; j < 2 && S.q[k].length < CAPS[k]; j++) S.q[k].push(prod(k)); } });
    I = ARB.interior(G.interior, coinState, lv); ARB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderAll(); shell();
  }
  // the shell only, while the camera turns and the insides are not drawn (they are redrawn when they come into view)
  function renderShell() { G.exterior.innerHTML = ''; shell(); }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, AR.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, AR.D, 136, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || !count()) return null; vend(null, 'customer'); return T`热食`; }
  function idleSell() {
    const k = anyStock(); if (k < 0) return 0;
    const p = S.q[k].shift();
    if (I) renderAll();   // cheap, and the insides must be right when they come into view
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // opaque: a solid door; the insides are drawn only when you can see them
    id: 'auto', fig: 6, name: T`复古快餐`, brand: 'オートレストラン', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ffb03a', opaque: true,
    render: () => render(), renderShell: () => renderShell(),
    hint: { shut: T`点菜单或点机器招呼客人 · 左右拖动转视角 · 点门锁开门补货`, xray: T`看吐司压烤、汉堡进微波炉、咖喱浇饭 · 空着的机位可以改造`, open: T`铝箔三明治码进弹匣 · 汉堡盒进冷冻柱 · 饭盘和料理包进蒸汽箱 · 点门或门锁关门` },
    build, step: () => {}, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return capacity(); },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    save: () => ({ q: S.q.map(l => l.map(p => p.pid)), seeded: S.seeded, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.q)) S.q = [0, 1, 2, 3].map(k => (d.q[k] || []).slice(0, CAPS[k]).map(snap).filter(Boolean));
      if (d.seeded) S.seeded = { ...d.seeded };
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => { const a = act(); return vend(a[k % a.length], 'player'); },
    // X-ray tags: per kitchen place, over the top of its stack
    labels: () => act().map(k => { const p = S.q[k][0] || prod(k), n = S.q[k].length;
      const pt = k < 2 ? [MAG.x[k], MAG.y, MAG.z0 + n * MAG.step + 5] : k === 2 ? [COL.x, COL.y, COL.z0 + n * COL.step + 8] : [TRAY.x, TRAY.y, TRAY.z0 + n * TRAY.step + 5];
      return { name: p.name, n, c: p.fill, pt }; }),
    // goods: two toast places, plus the burger and curry places once fitted (each takes only its own kind: row)
    goods: {
      kind: 'auto', get defaults() { const a = act(); return ['ham', 'cheese', 'burger', 'curry'].filter((_, k) => a.includes(k)); },
      get slots() { return act().map(k => ({ cap: CAPS[k], row: MENU[k].row })); },
      units: i => S.q[act()[i]].length,
      apply: list => { const a = act(); list.forEach((g, i) => Object.assign(MENU[a[i]], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, fill: g.fill, d: g.d, o: g.o })); },
    },
    // upgrades (改造): two whole new kitchens, and a press that heats from above too
    upgrades: [
      { id: 'burger', name: T`微波汉堡仓`, cost: [60000], effect: [T`新模块 · 菜单多一格：汉堡`], kind: T`新模块`, pin: [51, 50, 126],
        fact: T`1971 年登场的汉堡自贩机：纸盒装的汉堡连盒进机内的微波炉加热约 1 分钟，辉光管倒数，盒子从取餐口后面升上来，烫得拿不住。现在还有约 29 台。` },
      { id: 'curry', name: T`咖喱站`, cost: [200000], effect: [T`新模块 · 菜单多一格：咖喱`], kind: T`新模块`, pin: [38, 46, 70],
        fact: T`川鉄的咖喱机用蒸汽给盘装米饭保温，机内的刀片划开料理包，把咖喱浇到饭上再出货；管理员要定期磨刀。` },
      { id: 'press', name: T`双面加热板`, cost: [25000], effect: [T`上下两面一起烤 · 吐司快一倍`], kind: T`速度`, pin: [63, 68, 170],
        fact: T`1975 年的吐司自贩机：店里做好的三明治用铝箔包好装机，按键后滑到电热板上被压着烤，红灯「トースト中」亮起，25～60 秒后「ゴトッ」掉出来。现在全国只剩约 16 台。` },
    ],
    applyParts: l => { lv = { press: l.press || 0, burger: l.burger || 0, curry: l.curry || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    act().forEach(k => { const add = Math.max(0, Math.min(CAPS[k] - d.q[k].length, n - added)); added += add; d.q[k] = d.q[k].concat(Array(add).fill(MENU[k].pid)); });
    if (added) me.load(d); return added; };
})();
