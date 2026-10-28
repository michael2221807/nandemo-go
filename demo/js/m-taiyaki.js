/* Fig 13 behaviour (geometry in m-taiyaki-build.js). An order: the coin; at the filling station the open mould gets its
   batter (or the croissant sheet), the rack slides the chosen hopper over and deposits the filling, the top layer goes
   on; the chain then steps six moulds' worth round the loop — the guide shuts the lid, the right sprocket turns the mould
   over, the bottom run bakes the other side, the left sprocket brings it up to the eject station, where the lid opens,
   the pins lift the fish and the blade sweeps it down the chute; two suction cups pull a paper sleeve open at its foot, the
   fish drops in, and the bag goes down the slide to the take-out window.
   The flaw: every bake leaves burnt batter in its mould; a mould baked in DIRTY times turns out a scorched fish that
   sells for less, until a scraper goes over the moulds at a restock (the roller brush cleans each one every lap).
   Nothing moves while nothing happens (perf rule 3); while the chain steps, the moulds are redrawn 30 times a second. */
(() => {
  const { P, f } = ISO;
  const { CH, LEN, N, PITCH, MOULD, SX, TOP, WINDOW, MENU, DOUGH } = TY;
  const RACK = TYB.RACK, BAG = TYB.BAG;
  ['tsubu', 'koshi', 'custard', 'choco'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 95; });   // the starting stock's goods
  const CAP = 10, SLOTS = 4, DIRTY = 6, BURNT = .6, LADLE = 1 / 40, HZ = 30;
  let lv = { brush: 0, fire: 0, cro: 0 };
  // hop: each hopper's fillings (oldest first); batter: the tank; moulds: what each holds and how much burnt batter is in
  // it; step: how many pitches the chain has moved (mould i stands at station (i + step) mod N)
  const S = { hop: [[], [], [], []], batter: .85, moulds: Array.from({ length: N }, () => ({ st: 'empty', soot: 0, phi: 0 })), step: 0, no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0;
  let phase = 0, rackOff = 0, brushTurn = 0, nextPaint = 0;
  const coinState = [11, 8, 19, 6];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, dough: m.dough, fill: m.fill }; };
  const snap = pid => { const g = pid && ECON.product('taiyaki', pid); if (!g) return null; const q = ECON.quote('taiyaki', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, dough: g.dough, fill: g.fill }; };
  const count = () => S.hop.reduce((a, l) => a + l.length, 0);
  const needsBatter = k => (S.hop[k][0] || MENU[k]).dough !== 'cro';
  const canMake = k => S.hop[k].length > 0 && (!needsBatter(k) || S.batter > .02);
  const anyHop = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };
  const at = j => S.moulds[((j - S.step) % N + N) % N];   // the mould at station j (0 eject, 1 filling, 2 closing …)
  const dirty = m => !lv.brush && m.soot >= DIRTY;

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  // each mould: a group of eight paths made once per redraw; moving, only their d and fill change
  let els = [];
  function makeEls() {
    els = S.moulds.map(() => { const g = UTIL.g(I.mouldsG, '', {}), lid = UTIL.g(g, '', {}), bot = UTIL.g(g, '', {}), p = (par, a = {}) => UTIL.el('path', a, par);
      return { g, lid, bot, lHull: p(lid, { class: 'ty-iron' }), lFace: p(lid), lFish: p(lid), bHull: p(bot, { class: 'ty-iron' }), bFace: p(bot), cont: p(bot), spots: p(bot), eye: UTIL.el('circle', { r: .55, fill: '#2a1408' }, bot) }; });
  }
  const sOf = i => i * PITCH + phase;
  let order = '';
  function paintMoulds() {
    if (!I || !els.length) return;
    const depth = [];
    S.moulds.forEach((m, i) => {
      const e = els[i], r = TYB.mouldPaths(sOf(i), m.phi, { st: m.st, dough: m.dough, fill: m.fill, dirty: m.soot >= DIRTY && !lv.brush, burnt: m.burnt, lift: m.lift });
      e.bHull.setAttribute('d', r.bHull); e.bFace.setAttribute('d', r.bFace); e.bFace.setAttribute('fill', r.bFill);
      e.cont.setAttribute('d', r.cont); e.cont.setAttribute('fill', r.contFill); e.cont.setAttribute('stroke', r.contStroke);
      e.spots.setAttribute('d', r.spots); e.spots.setAttribute('fill', r.spotFill);
      if (r.eye) { e.eye.setAttribute('cx', f(r.eye[0])); e.eye.setAttribute('cy', f(r.eye[1])); e.eye.style.display = ''; } else e.eye.style.display = 'none';
      e.lHull.setAttribute('d', r.lHull); e.lFace.setAttribute('d', r.lFace); e.lFace.setAttribute('fill', r.lFill);
      e.lFish.setAttribute('d', r.lFish); e.lFish.setAttribute('fill', r.lFishFill); e.lFish.setAttribute('stroke', r.lFishStroke);
      // the lid behind the bottom half (open at the back, or under it upside down) goes first
      if (r.lidBehind !== (e.g.firstChild === e.lid)) { if (r.lidBehind) e.g.insertBefore(e.lid, e.bot); else e.g.appendChild(e.lid); }
      depth.push([r.depth, i]);
    });
    // the moulds far from the camera first (the order only changes round the sprockets)
    depth.sort((a, b) => a[0] - b[0]); const o = depth.map(d => d[1]).join();
    if (o !== order) { order = o; depth.forEach(([, i]) => I.mouldsG.appendChild(els[i].g)); }
  }
  const paintRack = () => { if (I) I.rackG.innerHTML = TYB.rack(rackOff, MENU.map((m, k) => (S.hop[k][0] || m).fill)); };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    X.gauge.setAttribute('width', f(13.2 * Math.max(0, Math.min(1, S.batter)))); X.gauge.setAttribute('fill', S.batter < .25 ? '#ff6a3a' : '#f2dc98');
    X.scorchLamp.classList.toggle('on', dirty(at(1)));
    if (!busy && !ready) X.lcd.textContent = S.batter <= .02 ? '生地切れ' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  // the take-out window: the fish in its paper bag, head up out of it
  function windowFish(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.35) translate(${f(-sx)} ${f(-sy)})">${TYB.bagged(WINDOW[0], WINDOW[1], WINDOW[2] - 4, r.o, .6)}</g>`;
  }
  const paintBag = open => { if (!I) return; I.bagG.innerHTML = TYB.bagBack(open); I.bagFrontG.innerHTML = TYB.bagFront(open); };
  // a mover along a polyline of world points (the fish down the chute)
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  // the chain steps one pitch: the mould leaving the filling station shuts (the guide), the one leaving the eject
  // station passes under the brush; the moulds are redrawn 30 times a second while they move
  async function index() {
    const g0 = gen, p0 = phase, mv = lv.fire ? 260 : 520, dwell = lv.fire ? 90 : 170, closing = at(1), cleaning = at(0);
    SND.belt && SND.belt(true);
    let last = 0;
    await UTIL.tween(mv, e => { if (g0 !== gen) return; phase = p0 + PITCH * e; closing.phi = MOULD.open * (1 - Math.min(1, e * 1.4));
      const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      if (lv.brush && I) { brushTurn += .5; I.brushG.innerHTML = TYB.brush(brushTurn); }
      paintMoulds(); }, UTIL.ease.inOut);
    if (g0 !== gen) return false;
    phase = p0 + PITCH; S.step = (S.step + 1) % N; phase = S.step * PITCH; closing.phi = 0; SND.belt && SND.belt(false); SND.tok();
    if (lv.brush && cleaning.soot) cleaning.soot = 0;
    paintMoulds(); paintDoor();
    await UTIL.wait(dwell); return g0 === gen;
  }
  async function slideRack(k) {
    const from = rackOff, d = k - from, g0 = gen; if (Math.abs(d) < .01) return;
    await UTIL.tween(200 + 140 * Math.abs(d), e => { if (g0 !== gen) return; rackOff = from + d * e; paintRack(); }, UTIL.ease.inOut); if (g0 === gen) rackOff = k;
  }
  async function pour(x, y, z0, c, w, ms) { if (!I) return; I.streamG.innerHTML = TYB.stream(x, y, z0, c, w); await UTIL.wait(ms); if (I) I.streamG.innerHTML = ''; }
  // a layer into the mould at the filling station: batter from the nozzle, or (croissant) a sheet off the roll
  async function layer(m, cro, st) {
    if (cro) await pour(SX.fill - 6, CH.y, TOP + 16, '#f0d8a0', 3.4, 320);
    else { SND.pour && SND.pour(.4); await pour(SX.fill, CH.y - 3, TOP + 9, '#f2dc98', 1.4, 340); }
    m.st = st; paintMoulds();
  }
  // make one fish of hopper k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen, p = prod(k), m = at(1), cro = p.dough === 'cro';
    Object.assign(m, { st: 'empty', g: p.g, dough: p.dough, fill: p.fill, burnt: false, lift: 0 });
    await layer(m, cro, 'batter'); if (!live()) return null;
    await slideRack(k); if (!live()) return null;
    S.hop[k].shift(); paintRack(); paintDoor();
    await pour(SX.fill, RACK.y, RACK.tube, p.fill, 1.8, 320); if (!live()) return null; m.st = 'fill'; paintMoulds(); SND.tok();
    await layer(m, cro, 'top'); if (!live()) return null;
    if (!cro) S.batter = Math.max(0, S.batter - LADLE);
    // round the loop to the eject station: six pitches (the first shuts the lid; the right sprocket turns it over)
    if (X) X.bakeLamp.classList.add('on');
    m.burnt = dirty(m); m.soot++; m.st = 'baked';
    for (let n = 0; n < N - 1; n++) if (!await index()) return null;
    if (X) X.bakeLamp.classList.remove('on');
    // the eject station: the lid opens, the pins lift the fish, the blade sweeps it onto the chute
    SND.click();
    await UTIL.tween(340, e => { if (!live()) return; m.phi = MOULD.open * e; paintMoulds(); }, UTIL.ease.out); if (!live()) return null;
    await UTIL.tween(220, e => { if (!live()) return; m.lift = 2.6 * e; I.pinsG.innerHTML = TYB.pins(e); paintMoulds(); }, UTIL.ease.out); if (!live()) return null;
    const o = { dough: m.dough, burnt: m.burnt };
    await UTIL.tween(200, e => { if (live()) I.bladeG.innerHTML = TYB.blade(e * .5); }, UTIL.ease.in); if (!live()) return null;
    m.st = 'empty'; m.lift = 0; paintMoulds(); SND.tok();
    UTIL.tween(300, e => { if (live()) { I.bladeG.innerHTML = TYB.blade(.5 + .5 * e); I.pinsG.innerHTML = TYB.pins(1 - e); } }, t => t)
      .then(() => UTIL.tween(300, e => { if (live()) I.bladeG.innerHTML = TYB.blade(1 - e); }, UTIL.ease.inOut));
    // down the chute; at its foot the cups pull the front sleeve open and the fish drops in head up
    const opening = UTIL.tween(300, e => { if (live()) paintBag(e); }, UTIL.ease.out);
    await along(TYB.fishAt(0, 0, 0, o, .9), [[SX.eject, CH.y + 2, TOP + MOULD.t + 3], [SX.eject, CH.y + MOULD.b + 1.4, TOP + 2.6], [SX.eject, BAG.y + 1, BAG.z + BAG.h + 9]], 420); if (!live()) return null;
    await opening;
    await along(TYB.fishUp(0, 0, 0, o, .9), [[SX.eject, BAG.y + 1.4, BAG.z + BAG.h + 12], [SX.eject, BAG.y + 1.4, BAG.z + 9]], 220); if (!live()) return null;
    // the cups let go, the floor flap drops the bag down the slide to the take-out window
    paintBag(0); SND.tok();
    await along(TYB.bagged(0, 0, 0, o, .9), [[SX.eject, BAG.y + .1, BAG.z], [SX.eject, 81, BAG.z - 12], [WINDOW[0], WINDOW[1] + 1, 30]], 480); if (!live()) return null;
    making = false; paintDoor();
    return { p, o };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyHop() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.ty-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, TY.SLOTW);
    X.lcd.textContent = `${no}番 · 焼いています`;
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const price = Math.round(r.p.price * (r.o.burnt ? BURNT : 1));
    const done = { p: r.p, o: r.o, no, who }; ready = done; windowFish(done); X.ready.classList.add('on'); X.lcd.textContent = r.o.burnt ? `${no}番 · 焦げあり 値引き` : `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#d8902a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#d8902a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: fillings into the rack's hoppers, a bag of batter, the scraper over the moulds ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const hopTop = k => [SX.fill + (k - rackOff) * RACK.gap, RACK.y, RACK.z + 14];
  const supply = {
    title: T`鲷鱼烧料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-ty-pack', vars: `--c:${m.fill}`, pos: [8 + j * 9.4, 10 + k * 15, 2], target: 'f' + k }))),
      { glyph: 'g-ty-batter', vars: '', pos: [104, 26, 2], target: 'batter' }, { glyph: 'g-ty-scraper', vars: '', pos: [104, 58, 2], target: 'scrape' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'batter' ? [SX.fill - 8, 44, TOP + 42] : t === 'scrape' ? [SX.eject, CH.y, TOP + 8] : hopTop(+t.slice(1)),
    accept: t => t === 'batter' ? S.batter < .97 : t === 'scrape' ? S.moulds.some(m => m.soot > 0) : S.hop[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'batter' || t === 'scrape' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'batter' || t === 'scrape' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t[0] === 'f' && !ECON.everStocked('taiyaki', MENU[+t.slice(1)].pid),
    stocks: t => { if (t[0] !== 'f') return []; const k = +t.slice(1); reserved[k]++; return [['taiyaki', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'batter' || t === 'scrape') {
        if (t === 'batter') { const from = S.batter; SND.pour(1); UTIL.tween(900, e => { S.batter = from + (1 - from) * e; }).then(() => { S.batter = 1; SND.chime(); paintDoor(); }); }
        else { S.moulds.forEach(m => { m.soot = 0; }); paintMoulds(); paintDoor(); SND.chime(); CORE.sparkle(SX.eject + 10, CH.y, TOP + 6, 12, '#fff6d6'); }
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f((t === 'scrape' ? 40 : 118) * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut);
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.hop[k].length < CAP) { S.hop[k].push(prod(k)); paintRack(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target[0] !== 'f') - (b.target[0] !== 'f')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.hop.forEach((l, k) => { for (let j = 0; j < 5; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = TYB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, TY.D, TY.H);
    if (ready) { windowFish(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    if (X.fireLamp) X.fireLamp.classList.add('on');
    paintDoor();
  }
  // the lids: open at the eject and filling stations, shut everywhere else
  const restPhi = () => S.moulds.forEach((m, i) => { const j = (i + S.step) % N; m.phi = j === 0 || j === 1 ? MOULD.open : 0; });
  // (re)draw from the current state: first build and every camera turn (the eject station shows through the door)
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    S.moulds.forEach(m => { if (m.st !== 'empty') { m.st = 'empty'; m.lift = 0; } });
    phase = S.step * PITCH; restPhi(); order = '';
    I = TYB.interior(G.interior, coinState, lv); TYB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    makeEls(); paintMoulds(); paintRack(); shell();
  }
  // nothing moves on its own
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 700; paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, TY.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyHop() < 0) return null; vend(null, 'customer'); return T`鲷鱼烧`; }
  // off screen: one baked to order from a hopper that has some (the mould at the filling station takes it round)
  function idleSell() {
    const k = anyHop(); if (k < 0) return 0;
    const p = S.hop[k].shift(), m = at(1), burnt = dirty(m);
    m.soot++; if (lv.brush) m.soot = 0;
    if (p.dough !== 'cro') S.batter = Math.max(0, S.batter - LADLE);
    S.step = (S.step + 1) % N; S.no = S.no % 99 + 1;
    if (I && !making) { phase = S.step * PITCH; restPhi(); paintMoulds(); paintRack(); } if (X) paintDoor();
    return { price: Math.round(p.price * (burnt ? BURNT : 1)), pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the eject station shows through the door's window, so the insides are always drawn
    id: 'taiyaki', fig: 13, name: T`鲷鱼烧`, brand: 'しっぽまで', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#d8902a',
    render: () => render(),
    hint: { shut: T`点菜单选一种馅 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看链条上的七把铁模：上面一段打开接面糊和馅，盖上后绕过链轮自动翻面，下面一段烤另一面，转回来开模顶出`, open: T`馅料放进滑轨上的料斗 · 面糊倒进生地桶 · 刮刀刮一遍模具 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ hop: S.hop.map(l => l.map(p => p.pid)), batter: S.batter, soot: S.moulds.map(m => m.soot), step: S.step, no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.hop)) S.hop = [0, 1, 2, 3].map(k => (d.hop[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.batter === 'number') S.batter = Math.max(0, Math.min(1, d.batter));
      if (Array.isArray(d.soot)) d.soot.forEach((n, i) => { if (S.moulds[i]) S.moulds[i].soot = Math.max(0, n | 0); });
      if (typeof d.step === 'number') S.step = ((d.step | 0) % N + N) % N;
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    // X-ray tags: per hopper, over it on the rack
    labels: () => MENU.map((m, k) => { const p = S.hop[k][0] || m; return { name: p.name, n: S.hop[k].length, c: p.fill, pt: hopTop(k) }; }),
    labelStyle: 'mini',
    // goods: four hoppers on the rack; the croissant ones need the croissant roll
    goods: {
      kind: 'taiyaki', defaults: ['tsubu', 'koshi', 'custard', 'choco'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.hop[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, dough: g.dough, fill: g.fill })),
    },
    // the special unlock: a cat that has eaten taiyaki knows the way (the last cat food)
    unlock: { open: () => NEKO.ate('taiyaki'), hint: () => T`喂猫吃一次鲷鱼烧（猫粮里最后一种）`,
      card: () => [T`吃完鲷鱼烧的猫舔着嘴往街角走`, T`跟着它找到了「しっぽまで」鲷鱼烧：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the roller brush (the cure), the second row of burners (faster), the croissant roll (new goods)
    upgrades: [
      { id: 'brush', name: T`回転ブラシ`, cost: [10000], effect: [T`加一个滚刷 · 每一圈都把模具刷干净，不再烤焦`], kind: T`省心`, pin: [SX.brush, CH.y + MOULD.b + 2, TOP + 8],
        fact: T`铸铁的鲷鱼烧模具不用洗洁精洗：收摊后用刷子和布把焦渣刷掉，再抹一层油养着。` },
      { id: 'fire', name: T`強火バーナー`, cost: [50000], effect: [T`再加一排火 · 模具走一圈的时间少一半`], kind: T`速度`, pin: [CH.x1 - 6, CH.y + 8, CH.zm - CH.r - 12],
        fact: T`火越旺，皮越脆、熟得越快；可火太旺会外面焦了里面还是生的，所以鲷鱼烧要两面轮流烤。` },
      { id: 'cro', name: T`クロワッサン生地`, cost: [80000], effect: [T`加一卷可颂面皮和切刀 · 能卖可颂鲷鱼烧（红豆、卡仕达、巧克力）`], kind: T`新货`, pin: [SX.fill - 20, CH.y + 7, TOP + 30],
        fact: T`可颂鲷鱼烧把可颂面团压进鲷鱼烧的模具里烤，外层一片片酥脆，2010 年代在日本流行起来。` },
    ],
    applyParts: l => { lv = { brush: l.brush || 0, fire: l.fire || 0, cro: l.cro || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n fillings of the planned goods, and the batter
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.hop = d.hop.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.batter = 1; me.load(d); return added || 1; };
  // fillings left but no batter: as good as sold out
  me.stuck = () => S.batter <= .02 && [0, 1, 2, 3].every(k => !canMake(k));
})();
