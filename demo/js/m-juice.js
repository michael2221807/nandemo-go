/* Fig 5 behaviour: coin -> a cup drops onto the stand -> four fruits, one by one (two at a time with the upgrade): the star
   wheel lets one out, it rolls along the trough, drops onto the cutter, the halves are squeezed and the juice runs into the
   cup -> the cup slides under the sealer -> out to the window. The LCD bar on the door fills over the run.
   The machine's little flaw: the peel bag. Every cup drops four fruits' peel into it; once it is full the machine stops
   (圧縮中) and slowly presses the peel down, in real time, until there is room for five cups again (about two minutes).
   A fresh bag with the next restock ends it at once; the bigger peel bin makes it come later.
   Restock: net bags of fruit poured into the hopper (each bag = three cups' worth), and an empty peel bag. */
(() => {
  const { P, f } = ISO;
  const { HOP, GATE, TROUGH_Z, DROP, CUT, PRESS_Z, CUP, SEAL, CUPTUBE, WINDOW, PEEL, MENU } = JU;
  ['mikan', 'orange', 'lemon', 'apple'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 120; });   // the starting menu
  const PEEL_CAP = [20, 40, 80];   // cups' worth of peel a bag holds, by bin level
  const COMPACT_MS = 24000, ROOM = 5;   // compacting frees one cup's worth every 24 s; sales resume with room for five
  let lv = { bin: 0, press: 0, hopper: 0 };
  const comps = () => 3 + (lv.hopper > 0 ? 1 : 0), capacity = () => comps() * HOP.cups, peelCap = () => PEEL_CAP[lv.bin || 0];
  // bins: per compartment, one product per cup's worth of fruit (oldest first: it sits at the bottom and leaves first); peel in cups
  const S = { bins: [[], [], [], []], peel: 0, compacting: false, stamp: Date.now() };
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null, nextPaint = 0, hold = null, cupLv = 0, streams = 0;
  const reserved = [[], [], [], []];   // fruit paid for and still in the air, per compartment (cups per bag)
  const coinState = [14, 7, 20, 4];

  /* ---------- products and stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, fruit: m.fruit, juice: m.juice }; };
  const snap = pid => { const g = pid && ECON.product('juice', pid); if (!g) return null; const q = ECON.quote('juice', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, fruit: g.fruit, juice: g.juice }; };
  const count = () => S.bins.slice(0, comps()).reduce((s, b) => s + b.length, 0);
  const room = k => HOP.cups - S.bins[k].length - reserved[k].reduce((s, n) => s + n, 0);
  // the peel bag: full -> the machine stops and compacts it (kept in real time, so it goes on off screen) until five cups fit again
  function peelNow() {
    const now = Date.now();
    if (S.compacting) { S.peel = Math.max(0, S.peel - (now - S.stamp) / COMPACT_MS); if (S.peel <= peelCap() - ROOM) S.compacting = false; }
    S.stamp = now; return S.peel;
  }
  const addPeel = n => { peelNow(); S.peel = Math.min(peelCap(), S.peel + n); if (S.peel >= peelCap() - 1e-6) S.compacting = true; };
  const peelFull = () => { peelNow(); return S.compacting; };
  const compactLeft = () => Math.max(0, (S.peel - (peelCap() - ROOM)) * COMPACT_MS);
  const canSell = () => !peelFull() && count() > 0;
  const anyBin = () => { const ks = []; for (let k = 0; k < comps(); k++) if (S.bins[k].length) ks.push(k); return ks.length ? UTIL.pick(ks) : -1; };

  /* ---------- drawing ---------- */
  // a compartment's pile: four fruits per cup, bottom layer first; the cup being squeezed keeps its fruits at the bottom until they leave
  function renderPile(k) {
    if (!I || !I.compG[k]) return;
    const list = [];
    if (hold && hold.k === k) for (let n = 0; n < hold.left; n++) list.push(hold.p);
    S.bins[k].forEach(p => { for (let n = 0; n < 4; n++) list.push(p); });
    const items = list.map((p, i) => { const [x, y, z] = JU.fruitAt(k, i); return { p, x, y, z, d: ISO.dir(x, y, z) }; }).sort((a, b) => a.d - b.d);
    I.compG[k].innerHTML = items.map(it => JUB.fruitUse(it.p, it.x, it.y, it.z)).join('');
  }
  const renderPiles = () => { for (let k = 0; k < comps(); k++) renderPile(k); };
  // fruit tumbling in on top of a pile (appended, not redrawn: the earlier bags keep falling undisturbed)
  function pourIn(k, from, n) {
    const items = [];
    for (let i = from; i < from + n; i++) { const [x, y, z] = JU.fruitAt(k, i); items.push({ p: S.bins[k][Math.floor(i / 4)], x, y, z, d: ISO.dir(x, y, z), i }); }
    items.sort((a, b) => a.d - b.d);
    I.compG[k].insertAdjacentHTML('beforeend', items.map(it => JUB.fruitUse(it.p, it.x, it.y, it.z, `class="ju-fall" style="--c:${it.p.fruit};animation-delay:${((it.i - from) * 28)}ms"`)).join(''));
  }
  // peel in the bin: a heap rising toward the rim, a few halves on top
  function renderPeel() {
    if (!I) return;
    const lvl = Math.min(1, S.peel / peelCap()), pw = I.pw, h = Math.max(0, (PEEL.h - 6) * lvl);
    if (h < .5) { I.peelG.innerHTML = ''; return; }
    const top = PEEL.z + 1 + h, spots = [[.25, .3], [.6, .25], [.4, .6], [.75, .65], [.2, .78], [.55, .85]], cx = PEEL.x + pw / 2, cy = PEEL.y + PEEL.d / 2;
    I.peelG.innerHTML = ISO.box(PEEL.x + 2, PEEL.y + 2, PEEL.z + 1, pw - 4, PEEL.d - 4, h, 0, 'ju-peelfill')
      // compacting: a plate presses down on the heap; otherwise a few spent halves lie on top
      + (S.compacting ? ISO.box(PEEL.x + 2, PEEL.y + 2, top, pw - 4, PEEL.d - 4, 1.6, 0, 'ju-plate') + `<path class="hair" d="${ISO.path([[cx, cy, top + 1.6], [cx, cy, PEEL.z + PEEL.h + 10]])}" style="stroke-width:2.4"/>`
        : spots.slice(0, Math.ceil(lvl * 6)).map(([u, v]) => { const [sx, sy] = P(PEEL.x + 2 + u * (pw - 4), PEEL.y + 2 + v * (PEEL.d - 4), top + 1); return `<use href="#g-half" x="${f(sx)}" y="${f(sy)}" style="--c:#e8892a" transform="rotate(180 ${f(sx)} ${f(sy)})"/>`; }).join(''));
  }
  const idleText = () => { if (!peelFull()) return 'しぼりたて · いつでも'; const ms = compactLeft();
    return `圧縮中 · あと${ms >= 60000 ? Math.ceil(ms / 60000) + '分' : Math.max(1, Math.ceil(ms / 1000)) + '秒'}`; };
  function paintDoor() {
    X.tiles.forEach((t, k) => t.querySelector('.soldout').classList.toggle('on', !S.bins[k].length || peelFull()));
    X.clean.classList.toggle('on', peelFull());
    if (!busy) { X.lcd.textContent = idleText(); X.bar.setAttribute('width', 0); }
  }
  const at = (x, y, z) => { const [sx, sy] = P(x, y, z); return `translate(${f(sx)} ${f(sy)})`; };
  const drawCup = (pt, juice, sealed) => { I.station.innerHTML = `<g transform="${at(...pt)}">${JUB.cupSVG(cupLv, juice, sealed)}</g>`; };
  function windowCup(p) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)})">${JUB.cupSVG(1, p.juice, true)}</g>` + [[-3, -4], [3.2, -7], [-1.6, -9]].map(([dx, dy]) => `<circle cx="${f(sx + dx)}" cy="${f(sy + dy)}" r=".55" fill="#fff" opacity=".7"/>`).join('');
  }

  /* ---------- the run ---------- */
  const lerp = (a, b, e) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  const moveG = (el, a, b, ms, ease = UTIL.ease.inOut, extra = '') => UTIL.tween(ms, e => el.setAttribute('transform', at(...lerp(a, b, e)) + extra), ease);
  function spinWheel(k) {
    const w = I.wheels[k] && I.wheels[k].firstChild; if (!w) return;
    UTIL.tween(160, e => w.setAttribute('transform', `rotate(${f(60 * e)})`), UTIL.ease.out).then(() => w.removeAttribute('transform'));
  }
  // one fruit: out of the hopper, along the trough, onto the cutter, halved, squeezed (press pair j), halves down the peel chute
  async function squeeze(k, p, j) {
    const dy = I.presses.length > 1 && j ? -10 : 0, pair = I.presses.find(q => q[2] === dy) || I.presses[0];
    if (j) await UTIL.wait(120);
    hold.left--; renderPile(k); spinWheel(k); SND.tok();
    const el = UTIL.g(I.movers, `<use href="#g-fruit" style="${JUB.vars(p)}"/>`, {});
    const g0 = GATE(k), d0 = [DROP[0], DROP[1], TROUGH_Z + 1.5];
    await moveG(el, g0, [g0[0], g0[1], TROUGH_Z + 1.5], 90, UTIL.ease.in);
    await moveG(el, [g0[0], g0[1], TROUGH_Z + 1.5], d0, 110 + Math.abs(g0[0] - DROP[0]) * 2.4, t => t);
    await moveG(el, d0, [CUT[0], CUT[1] + dy, CUT[2]], 150, UTIL.ease.in);
    // the blade: the fruit falls in two
    el.remove(); I.blade.classList.add('on'); setTimeout(() => I.blade.classList.remove('on'), 140); SND.click();
    const halves = [-1, 1].map(s => UTIL.g(I.movers, `<use href="#g-half" style="${JUB.vars(p)}" transform="rotate(${s * -90})"/>`, { transform: at(CUT[0] + s * 2.6, CUT[1] + dy, PRESS_Z + 1) }));
    // the press closes, the juice runs, the press opens
    const [dx, dyS] = P(4.4, 0, 0), [L, R] = pair;
    streams++; I.juiceStream.style.stroke = p.juice; I.juiceStream.classList.add('on'); SND.pour(.5);
    let last = 0;
    await UTIL.tween(210, e => { L.setAttribute('transform', `translate(${f(dx * e)} ${f(dyS * e)})`); R.setAttribute('transform', `translate(${f(-dx * e)} ${f(-dyS * e)})`);
      halves.forEach((h, i) => h.firstChild.setAttribute('transform', `rotate(${(i ? 1 : -1) * -90}) scale(${f(1 - .45 * e)} 1)`));
      cupLv = Math.min(1, cupLv + (e - last) * .25); last = e; drawCup(CUP, p.juice, false); }, UTIL.ease.in);
    UTIL.haptic(4);
    await UTIL.tween(150, e => { L.setAttribute('transform', `translate(${f(dx * (1 - e))} ${f(dyS * (1 - e))})`); R.setAttribute('transform', `translate(${f(-dx * (1 - e))} ${f(-dyS * (1 - e))})`); }, UTIL.ease.out);
    L.removeAttribute('transform'); R.removeAttribute('transform');
    if (--streams <= 0) { streams = 0; I.juiceStream.classList.remove('on'); }
    // the spent halves slide down the chute into the peel bag (not waited for: the next fruit is already on its way)
    const bin = [PEEL.x + I.pw / 2, PEEL.y + 26, PEEL.z + PEEL.h + 2];
    halves.forEach((h, i) => moveG(h, [CUT[0] + (i ? 2.6 : -2.6), CUT[1] + dy, PRESS_Z + 1], bin, 280 + i * 40, UTIL.ease.in).then(() => h.remove()));
    addPeel(.25); setTimeout(renderPeel, 300);
  }
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    if (peelFull()) { [0, 1, 2, 3].forEach(i => setTimeout(() => X.clean.classList.toggle('on'), i * 110)); setTimeout(paintDoor, 480); if (who === 'player') SND.buzz(); return false; }
    const kk = k == null ? anyBin() : k;
    if (kk < 0 || !S.bins[kk].length) { if (k != null) { const s = X.tiles[k] && X.tiles[k].querySelector('.soldout'); if (s) [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const p = S.bins[kk].shift(); hold = { k: kk, p, left: 4 }; cupLv = 0;
    const tile = X.tiles[kk];
    if (tile) { tile.querySelector('.led').classList.add('on'); CORE.glow(tile.querySelector('.ju-tglow'), 1600, .4); if (who === 'player') CORE.press(tile); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    // the LCD: しぼり中 and a bar filling over the run
    const two = I.presses.length > 1, est = two ? 3700 : 5100;
    X.lcd.textContent = 'しぼり中…'; UTIL.tween(est, e => X.bar.setAttribute('width', f(27 * e)), t => t);
    await I.cm.coinIn(p.price, JU.SLOTW);
    // an empty cup drops from the tube onto the stand
    const c0 = [CUPTUBE[0], CUPTUBE[1], CUPTUBE[2] + 1];
    await UTIL.tween(240, e => drawCup(lerp(c0, CUP, e), p.juice, false), UTIL.ease.inOut); SND.tok();
    // four fruits: one at a time, or two at a time with the second press
    for (let n = 0; n < 4; n += two ? 2 : 1) await Promise.all((two ? [0, 1] : [0]).map(j => squeeze(kk, p, j)));
    hold = null;
    // under the sealer, the film goes on
    await UTIL.tween(200, e => drawCup(lerp(CUP, SEAL, e), p.juice, false), UTIL.ease.inOut);
    const [, sz] = P(0, 0, -5);
    await UTIL.tween(110, e => I.sealer.setAttribute('transform', `translate(0 ${f(sz * e)})`), UTIL.ease.in); SND.tok();
    drawCup(SEAL, p.juice, true);
    await UTIL.tween(130, e => I.sealer.setAttribute('transform', `translate(0 ${f(sz * (1 - e))})`), UTIL.ease.out); I.sealer.removeAttribute('transform');
    // down to the window
    await UTIL.tween(260, e => drawCup(lerp(SEAL, [WINDOW[0], WINDOW[1] - 4, WINDOW[2] + 6], e), p.juice, true), UTIL.ease.in);
    I.station.innerHTML = '';
    if (tile) tile.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * e)})`), UTIL.ease.out);
    windowCup(p); X.ready.classList.add('on'); X.bar.setAttribute('width', 27); X.lcd.textContent = 'できあがり！'; SND.ding(); UTIL.haptic(14);
    ready = { p, who };
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 800); else setTimeout(() => { if (ready && ready.p === p) take(true); }, 7000);
    paintDoor();
    return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#ffb347');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 20, r.p.name, '#ffb347'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-56 * e + 22 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: net bags of fruit into the hopper, a fresh peel bag ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="96" height="62" rx="2"/>${slits(8, 88, 8, 2, 60, true, 'crrib')}</g>` + box(0, 0, 0, 96, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const crateFront = () => box(0, 59.5, 0, 96, 2.5, 8, 0, 'cr') + box(93.5, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const bagCups = k => Math.max(0, Math.min(3, room(k)));
  const supply = {
    title: T`网袋`, unit: T`袋`, gap: 110, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [96, 0, 0], [0, 62, 0], [96, 62, 0], [0, 0, 24], [96, 0, 24]],
    slots: () => [...Array.from({ length: comps() }, (_, k) => Array.from({ length: 4 }, (_, j) => ({ glyph: 'g-netbag', vars: JUB.vars(MENU[k]), pos: [12 + j * 15, 11 + k * 13, 2], target: 'k' + k }))).flat(),
      { glyph: 'g-peelbag', vars: '', pos: [86, 32, 2], target: 'peel' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'peel' ? [PEEL.x + (I ? I.pw : 30) / 2, PEEL.y + 26, PEEL.z + PEEL.h + 10] : [HOP.x0 + (+t.slice(1)) * HOP.w + 8, HOP.y0 + 14, 214],
    accept: t => t === 'peel' ? peelNow() > .01 : bagCups(+t.slice(1)) > 0,
    cost: t => t === 'peel' ? 0 : (MENU[+t.slice(1)].buy || 0) * bagCups(+t.slice(1)),
    tier: t => t === 'peel' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t !== 'peel' && !ECON.everStocked('juice', MENU[+t.slice(1)].pid),
    // called once a bag is paid for: its fruit is set aside in the hopper so the next bag in the air cannot overfill it
    stocks: t => { if (t === 'peel') return []; const k = +t.slice(1); reserved[k].push(bagCups(k)); return [['juice', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'peel') { S.peel = 0; S.compacting = false; renderPeel(); paintDoor(); SND.tok(); return false; }
      const k = +t.slice(1), n = reserved[k].shift() || 0, from = S.bins[k].length * 4;
      for (let i = 0; i < n && S.bins[k].length < HOP.cups; i++) S.bins[k].push(prod(k));
      pourIn(k, from, S.bins[k].length * 4 - from); SND.korokoro(); paintDoor();
      // the bag tips over the hopper and empties
      UTIL.tween(520, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 8 * Math.sin(e * Math.PI))}) rotate(${f(150 * Math.min(1, e * 1.8))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .6 ? 1 : 1 - (e - .6) / .4)); }, UTIL.ease.inOut).then(() => el.remove());
      return true;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => (b.target === 'peel') - (a.target === 'peel'),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!S.bins.some(b => b.length)) for (let k = 0; k < comps(); k++) for (let j = 0; j < 6; j++) S.bins[k].push(prod(k)); render(); }
  function shell() {
    X = JUB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, JU.D, JU.H);
    if (ready) { windowCup(ready.p); X.flap.setAttribute('transform', 'translate(0 -8.6)'); X.ready.classList.add('on'); X.lcd.textContent = 'できあがり！'; X.bar.setAttribute('width', 27); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the hopper shows through the door: always drawn)
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) { busy = false; hold = null; streams = 0; }   // a run cut short by a redraw: the cup was already counted as sold
    I = JUB.interior(G.interior, coinState, lv); JUB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderPiles(); renderPeel(); shell();
  }
  function step(now) { if (now > nextPaint) { nextPaint = now + 500; const was = S.compacting; paintDoor(); if (was) renderPeel(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, JU.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, JU.D, 136, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || !canSell()) return null; vend(null, 'customer'); return T`果汁`; }
  function idleSell() {
    if (!canSell()) return 0;
    const k = anyBin(), p = S.bins[k].shift();
    addPeel(1);
    if (I) { renderPile(k); renderPeel(); }   // cheap, and the hopper is always in view
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the hopper and the press show through the door's big window, so the insides are always drawn
    id: 'juice', fig: 5, name: T`鲜榨果汁`, brand: 'しぼりたて', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff9a2e',
    render: () => render(),
    hint: { shut: T`点菜单或点机器招呼客人 · 左右拖动转视角 · 点门锁开门补货`, xray: T`看水果滚下来、切开、压榨，果皮掉进果皮袋 · 拖动扫描线`, open: T`网袋倒进料斗 · 换上空的果皮袋 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return capacity(); },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    save: () => ({ bins: S.bins.map(b => b.map(p => p.pid)), peel: S.peel, compacting: S.compacting, stamp: S.stamp, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.bins)) S.bins = [0, 1, 2, 3].map(k => (d.bins[k] || []).slice(0, HOP.cups).map(snap).filter(Boolean));
      if (typeof d.peel === 'number') S.peel = Math.max(0, d.peel);
      S.compacting = !!d.compacting; if (typeof d.stamp === 'number') S.stamp = d.stamp;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % comps(), 'player'),
    // X-ray tags: per compartment, the fruit that goes next (the bottom of the pile), pinned over the top of the pile
    labels: () => Array.from({ length: comps() }, (_, k) => { const p = S.bins[k][0] || prod(k), [x, y, z] = JU.fruitAt(k, Math.max(0, S.bins[k].length * 4 - 1));
      return { name: p.name, n: S.bins[k].length, c: p.fruit, pt: [x, y, z + 5] }; }),
    // goods: one fruit per compartment (three, four with the upgrade); fruit already in the hopper sells first
    goods: {
      kind: 'juice', get defaults() { return ['mikan', 'orange', 'lemon', 'apple'].slice(0, comps()); },
      get slots() { return Array.from({ length: comps() }, () => ({ cap: HOP.cups })); },
      units: k => S.bins[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, fruit: g.fruit, juice: g.juice })),
    },
    // upgrades (改造): a bigger peel bin (the bag fills later), a second press, a fourth compartment
    upgrades: [
      { id: 'bin', name: T`大果皮箱`, cost: [15000, 150000], effect: [T`果皮袋 20 → 40 杯才会满`, T`40 → 80 杯 · 满满一料斗也装得下`], kind: T`省心`, pin: [23, 64, 30],
        fact: T`Feed ME 的鲜榨机把榨过的果皮直接掉进机器下面的塑料袋；补货员每次来，除了倒橙子，还要换下装满的果皮袋。` },
      { id: 'press', name: T`双压榨头`, cost: [50000], effect: [T`一次榨两个水果 · 出杯快约 30%`], kind: T`速度`, pin: [16, 72, 123],
        fact: T`真实的鲜榨机：橙子滚出来、对半切开、两半一起压榨，果汁过筛流进杯子。一杯用 4 个橙子，大约 40 秒。` },
      { id: 'hopper', name: T`第四格料斗`, cost: [30000], effect: [T`多一种水果 · 容量 36 → 48 杯`], kind: T`容量`, pin: [60, 66, 196],
        fact: T`IJOOZ 一台能装约 360～400 个整橙，Feed ME 最多约 500 个。满满的橙子堆在玻璃后面，本身就是招牌。` },
    ],
    applyParts: l => { lv = { bin: l.bin || 0, press: l.press || 0, hopper: l.hopper || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    for (let k = 0; k < comps(); k++) { const add = Math.max(0, Math.min(HOP.cups - d.bins[k].length, n - added)); added += add; d.bins[k] = d.bins[k].concat(Array(add).fill(MENU[k].pid)); }
    if (added) { d.peel = 0; d.compacting = false; me.load(d); } return added; };
})();
