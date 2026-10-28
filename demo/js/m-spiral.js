/* Fig 2 behaviour: keypad -> lift rises -> coil turns once -> front item tips into the lift -> lift descends -> outlet.
   Restock: items from a cardboard box drop into the rearmost empty pitch of their coil. */
(() => {
  const { ROWS, ZR, SLOT, NSLOT, coilIdx, ze, ZE_OUT } = SP;
  let I, X, root, saleFn = () => {}, hinge, busy = false, liftZ = ZE_OUT, liftMoving = false, pulleyA = 0, fanA = 0, fanFast = 0, outItems = [];
  const coils = [];
  const { TW, CW } = SP;
  let lv = { eye: 0, lift: 0, twin: 0 };   // fitted parts (改造)
  const hangs = {};   // coil -> { def, el }: an item caught on the coil's end (paid for, waiting to drop)
  const capOf = t => lv.twin && t === TW.t2 ? 0 : NSLOT;
  const glyphOf = def => def[2] === 'bottle-up' ? 'g-bottle-up' : 'g-' + def[2];
  // the starting stock's goods
  ['consomme', 'chili', 'nori', 'ume', 'milkchoco', 'strawcandy', 'mintchoco', 'lemoncandy', 'shoyu', 'curry', 'salmon', 'umeboshi', 'duck', 'umbrella', 'battery', 'cassette', 'water2', 'peachbtl', 'maneki', 'vhs']
    .forEach((id, t) => { const def = ROWS[Math.floor(t / 4)][t % 4]; def.pid = def.pid || id; def.tier = def.tier || 1; });
  const vars = def => `--c:var(--${def[3]});--cap:var(--${def[3] === 'ice' ? 'blue' : 'ice'})`;

  function renderCoil(co) { const h = SP.helix(co.ax, co.zc, co.phase, co.hand); co.back.setAttribute('d', h.back); co.front.setAttribute('d', h.front); }
  const place = (co, it) => CORE.setXY(it.el, co.cx, SLOT(it.j), ZR[co.r]);
  function sortItems(co) { co.items.slice().sort((a, b) => b.j - a.j).forEach(it => co.itemsG.appendChild(it.el)); }
  // every item carries its own goods (def): a coil can hold old goods in front and newly planned goods behind them
  function addItem(co, j, def = co.def) { const it = { j, def, el: UTIL.el('use', { href: '#' + glyphOf(def), style: vars(def) }, co.itemsG) }; co.items.push(it); place(co, it); return it; }
  // a saved item: its goods at today's prices
  const defOf = pid => { const g = pid && ECON.product('spiral', pid); if (!g) return null; const q = ECON.quote('spiral', g); return Object.assign([g.name, q.sell, g.g, g.c], { buy: g.buy, tier: g.tier, pid }); };
  // redraws during a move at most 30 times a second (perf rule 17: the coils and the lift repaint the whole glass front)
  const hz30 = fn => { let last = 0; return e => { const now = performance.now(); if (e < 1 && now - last < 32) return; last = now; fn(e); }; };
  // the lift (and, with the counterweight fitted, the weight going the other way and both cable runs); carry: [{ el, x }]
  function setLift(z, carry) {
    liftZ = z; I.lift.setAttribute('transform', `translate(0 ${-z})`); (carry || []).forEach(c => CORE.setXY(c.el, c.x, 79, z + 2.2));
    if (I.cw) { I.cw.setAttribute('transform', `translate(0 ${((z - ZE_OUT) * .9).toFixed(1)})`); I.cablesAt(z).forEach((d, i) => I.cables[i].setAttribute('d', d)); }
  }
  async function moveLift(z, carry) {
    const from = liftZ, ms = (260 + Math.abs(z - from) * 4.2) * (lv.lift ? .5 : 1);   // the counterweight: twice as fast
    liftMoving = true; SND.belt(true);
    await UTIL.tween(ms, hz30(e => setLift(from + (z - from) * e, carry)), UTIL.ease.inOut);
    liftMoving = false; SND.belt(false); SND.tok();
  }
  async function key(k) { const g = X.keys[k]; if (!g) return; CORE.press(g); const led = g.querySelector('.led'); led.classList.add('on'); SND.tick(k.charCodeAt(0) % 9); UTIL.haptic(5); await UTIL.wait(170); setTimeout(() => led.classList.remove('on'), 700); }
  function soldOut(co, who) {
    ['ABCDE'[co.r], String(co.c + 1)].forEach(k => { const led = X.keys[k].querySelector('.led'); [0, 1, 2, 3].forEach(i => setTimeout(() => led.classList.toggle('on'), i * 110)); });
    if (who === 'player') { SND.buzz(); FX.pop(co.cx, 60, ZR[co.r] + 24, T`卖完了`, 'var(--red)', 12); }
  }
  // one sale in ten the item catches on the coil's last turn and hangs there, tipped over the edge (never on the twin lane,
  // two coils push a box straight). Without the sensor it stays until you knock on it, or the next sale from that coil
  // pushes it off together with its own; the sensor sees the beam stay dark and turns the coil a quarter more
  const SNAG = .1;
  const hangPose = (el, co) => { CORE.setXY(el, co.cx, SLOT(0) + 7.4, ZR[co.r]); el.setAttribute('transform', `rotate(-24 ${el.getAttribute('x')} ${el.getAttribute('y')})`); };
  function drawHang(t) { const co = coils[t], h = hangs[t]; h.el = UTIL.el('use', { href: '#' + glyphOf(h.def), style: vars(h.def) }, I.movers); hangPose(h.el, co); }
  function beamBlink() { if (!I.beam) return; I.beam.classList.add('hit'); setTimeout(() => I.beam && I.beam.classList.remove('hit'), 320); }
  // the coil turns by k of a full turn (and the twin lane's mate with it); the front item rides out to the edge
  function turn(co, front, k, snag) {
    const mate = lv.twin && co === coils[TW.t] ? coils[TW.t2] : null, p0 = co.phase, m0 = mate ? mate.phase : 0;
    SND.belt(true);
    return UTIL.tween(760 * k, hz30(e => {
      co.phase = p0 - e * Math.PI * 2 * k; renderCoil(co); if (mate) { mate.phase = m0 - e * Math.PI * 2 * k; renderCoil(mate); }
      co.items.forEach(it => CORE.setXY(it.el, co.cx, SLOT(it.j - e), ZR[co.r]));
      CORE.setXY(front.el, co.cx, SLOT(0) + (snag ? 7.4 : 9.5) * e, ZR[co.r]);
      if (snag) front.el.setAttribute('transform', `rotate(${(-24 * Math.max(0, e * 2 - 1)).toFixed(1)} ${front.el.getAttribute('x')} ${front.el.getAttribute('y')})`);
    }), UTIL.ease.inOut).then(() => { SND.belt(false); co.phase %= Math.PI * 2; if (mate) mate.phase %= Math.PI * 2; });
  }
  async function vend(t, who) {
    if (lv.twin && t === TW.t2) t = TW.t;
    const co = coils[t];
    if (busy || hinge.open || hinge.moving) return false;
    if (!co.items.length) { soldOut(co, who); return false; }
    busy = true;
    co.items.sort((a, b) => a.j - b.j);
    const def = co.items[0].def, price = def[1], L = 'ABCDE'[co.r], N = String(co.c + 1);   // the front item sets the price
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    await I.cm.coinIn(price, SP.SLOTW);
    await key(L); await key(N);
    X.scr.textContent = `${L}${N} ${UTIL.money(price)}`;
    CORE.replay(I.pulses[co.r]);
    await moveLift(ze(co.r));
    // the coil turns one full turn; every item moves one pitch forward and the front one falls
    co.items.sort((a, b) => a.j - b.j);
    const front = co.items.shift(), hung = hangs[t], snag = !(lv.twin && t === TW.t) && !hung && Math.random() < SNAG;
    delete hangs[t];
    await turn(co, front, 1, snag);
    I.movers.appendChild(front.el);
    co.items.forEach(it => { it.j -= 1; place(co, it); });
    if (co.items.length) SND.settle(Math.min(6, co.items.length));
    const sale = { name: def[0], price, pid: def.pid, tier: def.tier || 1 };
    if (snag && !lv.eye) {
      // it hangs: the lift waits a moment and goes back down empty (the sale is paid all the same)
      hangs[t] = { def, el: front.el }; SND.clank(); X.scr.textContent = 'つまり…';
      if (who === 'player') FX.pop(co.cx, 70, ZR[co.r] + 26, T`挂住了 · 点一下弹簧`, 'var(--amber)', 12);
      saleFn(sale, who);
      await UTIL.wait(650); await moveLift(ZE_OUT);
      setTimeout(() => { if (!busy) X.scr.textContent = 'SELECT'; }, 1600);
      busy = false; return true;
    }
    if (snag) {   // the sensor: nothing crossed the beam, so the coil turns a quarter more and the item tips off
      X.scr.textContent = 'SENSOR'; SND.tick(7); await UTIL.wait(240);
      const p0 = co.phase; await UTIL.tween(300, hz30(e => { co.phase = p0 - e * Math.PI / 2; renderCoil(co); }), UTIL.ease.inOut);
    }
    // the fall: a hung item pushed off goes down with it
    const fall = hung ? [{ el: hung.el, def: hung.def, dx: -4.5 }, { el: front.el, def, dx: 4.5 }] : [{ el: front.el, def, dx: 0 }];
    const z0 = ZR[co.r], z1 = ze(co.r) + 2.2;
    await UTIL.tween(280, e => fall.forEach(it => { CORE.setXY(it.el, co.cx + it.dx * e, 76.5 + 2.5 * e, z0 + (z1 - z0) * e); const [x, y] = [+it.el.getAttribute('x'), +it.el.getAttribute('y')]; it.el.setAttribute('transform', `rotate(${(-38 * e).toFixed(1)} ${x} ${y})`); }), UTIL.ease.in);
    SND.tok(); fall.forEach(it => it.el.removeAttribute('transform')); beamBlink();
    await moveLift(ZE_OUT, fall.map(it => ({ el: it.el, x: co.cx + it.dx })));
    await Promise.all(fall.map((it, i) => CORE.moveEl(it.el, [co.cx + it.dx, 79, ZE_OUT + 2.2], [47 - (fall.length - 1 - i) * 10, 80.5, 12.4], 280, UTIL.ease.out)));
    SND.poton(); UTIL.haptic(18); CORE.glow(X.outGlow, 900, .55); flap();
    X.scr.textContent = 'ありがとう'; setTimeout(() => { if (!busy) X.scr.textContent = 'SELECT'; }, 2400);
    if (hung) { deliver(hung.el, hung.def, who); FX.pop(47, 86, 44, T`两个一起掉下来了`, 'var(--amber)', 12); }
    deliver(front.el, def, who);
    saleFn(sale, who);
    busy = false;
    return true;
  }
  // knocking on the glass in front of a hung item shakes it loose (it was paid for when it caught)
  async function knock(t) {
    const h = hangs[t], co = coils[t]; if (!h || busy || hinge.open || hinge.moving) return;
    busy = true; delete hangs[t];
    SND.clank(); UTIL.haptic([10, 30, 10]);
    const x0 = +h.el.getAttribute('x'), y0 = +h.el.getAttribute('y');
    await UTIL.tween(240, e => h.el.setAttribute('transform', `rotate(${(-24 - 9 * Math.sin(e * Math.PI * 3)).toFixed(1)} ${x0} ${y0})`), t => t);
    const z0 = ZR[co.r], zb = liftZ + 2.2;
    await UTIL.tween(260 + z0 * 1.6, e => { CORE.setXY(h.el, co.cx, SLOT(0) + 7.4 + 4 * e, z0 + (zb - z0) * e * e); const [x, y] = [+h.el.getAttribute('x'), +h.el.getAttribute('y')]; h.el.setAttribute('transform', `rotate(${(-24 - 40 * e).toFixed(1)} ${x} ${y})`); }, UTIL.ease.in);
    SND.tok(); h.el.removeAttribute('transform'); beamBlink();
    await CORE.moveEl(h.el, [co.cx, 79, zb], [47, 80.5, 12.4], 280, UTIL.ease.out);
    SND.poton(); CORE.glow(X.outGlow, 900, .55); flap(); FX.pop(47, 86, 40, T`掉下来了`, 'var(--amber)', 12);
    deliver(h.el, h.def, 'player');
    busy = false;
  }
  function flap() { UTIL.tween(500, e => X.flap.setAttribute('fill', `rgba(140,150,165,${(0.16 + 0.22 * Math.sin(Math.PI * e)).toFixed(3)})`), t => t); }
  function deliver(el, def, who) {
    const it = { el, def, who }; outItems.push(it);
    if (outItems.length > 3) take(outItems[0], true);
    outItems.forEach((o, i) => CORE.setXY(o.el, 47 - (outItems.length - 1 - i) * 14, 80.5, 12.4));
    if (who === 'customer') setTimeout(() => { if (!outItems.includes(it)) return; outItems = outItems.filter(o => o !== it); CORE.sparkle(47, 82, 22, 8, `var(--${def[3]})`); CORE.liftAway([el]); }, 700);
    else setTimeout(() => take(it, true), 7000);
  }
  function take(it, quiet) {
    if (!outItems.includes(it)) return; outItems = outItems.filter(o => o !== it);
    if (!quiet) { SND.pop(); UTIL.haptic(8); FX.pop(47, 86, 40, it.def[0], `var(--${it.def[3]})`); }
    UTIL.tween(320, e => it.el.setAttribute('opacity', 1 - e)).then(() => it.el.remove());
  }
  function receive(t) {
    const co = coils[t]; if (co.items.length >= NSLOT) return false;
    const j = co.items.length, it = addItem(co, j), z = ZR[co.r];
    sortItems(co);
    UTIL.tween(300, e => CORE.setXY(it.el, co.cx, SLOT(j), z + 22 * (1 - e)), UTIL.ease.bounce);
    setTimeout(() => { SND.load(j + co.c); UTIL.haptic(4); if (co.items.length >= NSLOT) { SND.chime(); FX.pop(co.cx, SLOT(0), z + 30, T`満`, `var(--${co.def[3]})`, 12); } }, 120);
    return true;
  }
  const entry = t => { const co = coils[t], j = Math.min(NSLOT - 1, co.items.length); return [co.cx, SLOT(j), ZR[co.r] + 26]; };

  /* the cardboard box in the dock */
  const { box, TOP, FRONT, SIDE, slits } = ISO;
  const flying = [];   // items in the air, per coil
  const supply = {
    title: T`纸箱`, unit: T`件`, gap: 70, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [122, 0, 0], [0, 68, 0], [122, 68, 0], [0, 0, 30], [122, 0, 30]],
    slots: () => { const out = []; for (let r = 0; r < 5; r++) for (let j = 0; j < 8; j++) { const c = j % 4, tw = lv.twin && r === 4; if (tw && c === 3) continue;
      const def = ROWS[r][c]; out.push({ glyph: glyphOf(def), vars: vars(def), pos: [8 + j * 15 + (tw && c === 2 ? 7.5 : 0), 7 + r * 13, 1.5], target: coilIdx(r, c) }); } return out; },
    back: () => `<g transform="${TOP(0, 0, 0)}"><rect class="cbx top" width="122" height="68" rx="1.5"/></g>` + box(0, 0, 0, 122, 2, 15, 0, 'cbx') + box(0, 2, 0, 2, 64, 15, 0, 'cbx'),
    front: () => box(0, 66, 0, 122, 2, 9, 0, 'cbx') + box(120, 2, 0, 2, 64, 9, 0, 'cbx') + `<g transform="${FRONT(0, 68, 9)}"><rect x="52" y="0" width="18" height="9" fill="rgba(214,170,110,.25)"/><text x="61" y="6" font-size="3.4" text-anchor="middle" fill="#d6aa6e" class="sign">なんでも</text></g>`,
    // (items still in the air are reserved in their coil, or a fast pour sends and pays for more than it holds)
    entry, accept: t => coils[t].items.length + (flying[t] || 0) < capOf(t), arrive: t => { flying[t] = Math.max(0, (flying[t] || 0) - 1); receive(t); return false; },
    cost: t => { const [r, c] = SP.coilRC(t); return ROWS[r][c].buy || 0; }, tier: t => { const [r, c] = SP.coilRC(t); return ROWS[r][c].tier || 1; },
    isNew: t => { const [r, c] = SP.coilRC(t); return !ECON.everStocked('spiral', ROWS[r][c].pid); },
    stocks: t => { const [r, c] = SP.coilRC(t); flying[t] = (flying[t] || 0) + 1; return [['spiral', ROWS[r][c].pid]]; },
    dropTarget: n => { const c = n.closest && n.closest('[data-hit="coil"]'); return c ? +c.dataset.t : null; },
    order: (a, b) => a.target - b.target || a.pos[0] - b.pos[0],
  };

  let G = null;
  const coinState = [16, 8, 22, 5];
  function build(g, onSale) { G = g; root = g.root; saleFn = onSale; render([6, 7, 5, 7, 4, 6, 7, 3, 7, 5, 6, 4, 6, 7, 2, 5, 7, 5, 6, 3]); }
  // (re)draw from the current state: first build and every camera-yaw change.
  // counts per coil: a number (that many of the coil's goods) or a list front-to-back of goods / saved ids
  function render(counts) {
    counts = counts || coils.map(co => co.items.slice().sort((a, b) => a.j - b.j).map(it => it.def));
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    busy = false; outItems = []; liftMoving = false;
    if (lv.twin && counts[TW.t2] && (Array.isArray(counts[TW.t2]) ? counts[TW.t2].length : counts[TW.t2] > 0)) {
      counts = counts.map(u => Array.isArray(u) ? u.slice() : Array.from({ length: Math.max(0, u | 0) }, () => null));
      counts.forEach((l, t) => { const [r, c] = SP.coilRC(t); counts[t] = l.map(u => u || ROWS[r][c]); });
      const spill = counts[TW.t2]; counts[TW.t2] = [];
      [TW.t, 16, 17].forEach(k => { while (spill.length && counts[k].length < NSLOT) counts[k].push(spill.shift()); });
    }
    I = SPB.interior(G.interior, coinState, lv); X = SPB.exterior(G.exterior, lv); CORE.cat(G.exterior, false, [0, 0, 6]); SPB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
      const t = coilIdx(r, c), base = I.rows[r][c], prev = coils[t], tw = lv.twin && r === 4 && c >= 2;
      const co = { r, c, def: ROWS[r][c], items: [], phase: prev ? prev.phase : (r * 4 + c) * .9, ax: base.cx, cx: tw ? TW.cx : base.cx, hand: tw && c === 3 ? -1 : 1, zc: base.zc, back: base.back, front: base.front, itemsG: base.items };
      coils[t] = co;
      const list = Array.isArray(counts[t]) ? counts[t] : Array.from({ length: Math.max(0, counts[t] | 0) }, () => null);
      list.slice(0, NSLOT).forEach((u, j) => addItem(co, j, (typeof u === 'string' ? defOf(u) : u) || co.def));
      sortItems(co); renderCoil(co);
    }
    setLift(liftZ);
    Object.keys(hangs).forEach(t => drawHang(+t));
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn }, SP.D, SP.H);
  }
  // the compressor fan runs while the machine works and, like a fridge's, in short spells now and then; redrawn at 30 Hz
  // (perf rules 3, 14: spinning on every frame repainted the whole machine, ~500 ms/s of main thread at idle)
  let fanOn = false, fanNext = 0, fanDrawn = 0;
  function step(now, dt) {
    if (now > fanNext) { fanOn = !fanOn; fanNext = now + (fanOn ? 5000 : UTIL.rand(12000, 18000)); }
    if (busy || liftMoving || fanOn || now < fanFast) { fanA += dt * (now < fanFast ? 1300 : 380);
      if (now - fanDrawn > 32) { fanDrawn = now; I.fan.setAttribute('transform', `translate(13 15) rotate(${(fanA % 360).toFixed(1)})`); } }
    if (liftMoving) { pulleyA += dt * 600; I.pulleys.forEach(p => p.setAttribute('transform', `rotate(${(pulleyA % 360).toFixed(1)})`)); }
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    switch (t) {
      case 'coil': { const t = +hit.dataset.t; if (hangs[t]) knock(t); else vend(t, 'player'); return true; }
      case 'outlet': { const it = outItems.filter(o => o.who === 'player').pop() || outItems[outItems.length - 1]; if (it) take(it); else SND.clank(); return true; }
      case 'tubes': I.cm.collect([107, 70, 152]); return true;
      case 'coinslot': I.cm.coinIn(100, SP.SLOTW); return true;
      case 'ic': SND.beep(); FX.pop(105, SP.D, 112, T`哔`, 'var(--cyan)'); return true;
      case 'lever': SND.cascade(); return true;
      case 'cup': SND.coin(); return true;
    }
    return false;
  }
  const count = () => coils.reduce((s, co) => s + co.items.length, 0);
  function customerBuy() { if (busy || hinge.open || hinge.moving) return null; const ts = coils.map((co, t) => co.items.length ? t : -1).filter(t => t >= 0); if (!ts.length) return null; const t = UTIL.pick(ts); vend(t, 'customer'); return coils[t].def[0]; }
  function idleSell() { const ts = coils.map((co, t) => co.items.length ? t : -1).filter(t => t >= 0); if (!ts.length) return 0; const co = coils[UTIL.pick(ts)];
    co.items.sort((a, b) => a.j - b.j); const it0 = co.items.shift(); it0.el.remove(); co.items.forEach(it => { it.j -= 1; place(co, it); });
    return { price: it0.def[1], pid: it0.def.pid, name: it0.def[0], tier: it0.def.tier || 1 }; }
  function save() { return { n: coils.map(co => co.items.slice().sort((a, b) => a.j - b.j).map(it => it.def.pid || null)), coins: coinState.slice() }; }
  function load(d) {
    if (!d || !Array.isArray(d.n)) return;
    Object.keys(hangs).forEach(t => delete hangs[t]);   // (a hung item was sold already; a reload drops it in the outlet's past)
    if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
    render(d.n);
  }
  MACHINES.push({
    // X-ray tags: twenty coils, so names only (short), over each coil's front item
    labelStyle: 'mini',
    labels: () => coils.filter((co, t) => capOf(t) > 0).map(co => { const d = co.items.length ? co.items[0].def : co.def; return { name: d[0], n: co.items.length, c: `var(--${d[3]})`, pt: [co.cx, 70, SP.ZR[co.r] + 17] }; }),
    id: 'spiral', fig: 2, name: T`弹簧式`, brand: 'なんでも', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff4f8b', render: () => render(),
    hint: { shut: T`点机器招呼客人，连点更快 · 东西挂在弹簧上就点一下那根弹簧 · 左右拖动转视角 · 点门锁开门码货`, xray: T`看弹簧电机和升降台 · 点硬币管回收 · 拖动扫描线`, open: T`点一下放进对应的弹簧 · 划过一排连放 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: hit => { if (hit.dataset.hit === 'coil') { DOCK.sendTo(+hit.dataset.t); return true; } return false; },
    supply, count, get capacity() { return (lv.twin ? 19 : 20) * NSLOT; }, save, load, idleSell, isBusy: () => busy,
    vendKey: k => vend(coilIdx(k % 5, Math.floor(k / 5) % 4), 'player'),
    // goods: one item per coil, each shelf takes its own kind (snacks, sweets, food, goods, drinks)
    goods: {
      kind: 'spiral',
      defaults: ['consomme', 'chili', 'nori', 'ume', 'milkchoco', 'strawcandy', 'mintchoco', 'lemoncandy', 'shoyu', 'curry', 'salmon', 'umeboshi', 'duck', 'umbrella', 'battery', 'cassette', 'water2', 'peachbtl', 'maneki', 'vhs'],
      // (the twin lane is a sixth kind of shelf, boxes only; E4 is part of it then and holds nothing of its own)
      get slots() { return Array.from({ length: 20 }, (_, t) => ({ cap: capOf(t), row: lv.twin && t === TW.t ? 5 : Math.floor(t / 4) })); },
      units: t => (coils[t] ? coils[t].items.length : 0),
      apply: list => list.forEach((g, t) => { const [r, c] = SP.coilRC(t), def = [g.name, g.sell, g.g, g.c]; Object.assign(def, { buy: g.buy, tier: g.tier, pid: g.id }); ROWS[r][c] = def; }),
    },
    // upgrades (改造, 2026-10-18): the drop sensor (the cure for hung items), the counterweight (faster), the twin spiral (boxes)
    upgrades: [
      { id: 'eye', name: T`落下センサー`, cost: [9000], effect: [T`升降台上加一道红外光束 · 东西没掉下来就再转一下，再也不会挂在弹簧上`], kind: T`省心`, pin: [86, 80, SP.ZE_OUT + 10],
        fact: T`欧美的零食机很多装了一道红外光幕：东西掉下去要穿过光束，没挡到光就再转一次，还不行就退钱。挂在弹簧上下不来的零食，是自贩机最有名的倒霉事。` },
      { id: 'lift', name: T`配重升降台`, cost: [30000], effect: [T`加一块配重和一台大马达 · 升降台快一倍`], kind: T`速度`, pin: [3, 80, 196],
        fact: T`电梯也是这样：轿厢的另一头挂着差不多重的配重，马达只要拉动两边的差，所以能跑得又快又省电。` },
      { id: 'twin', name: T`双螺旋货道`, cost: [45000], effect: [T`最下层右边两道合成一道宽货道 · 能卖整盒的伴手礼和大件`], kind: T`新货`, pin: [SP.TW.cx, 72, SP.ZR[4] + 18],
        fact: T`真实的弹簧机遇到宽的商品，就用两根旋向相反的弹簧一起推：一根左旋一根右旋，对着转，盒子才不会被推歪。` },
    ],
    applyParts: l => { lv = { eye: l.eye || 0, lift: l.lift || 0, twin: l.twin || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = save(); let added = 0;
    d.n = d.n.map((l, t) => { const [r, c] = SP.coilRC(t), add = Math.max(0, Math.min(capOf(t) - l.length, n - added)); added += add; return l.concat(Array(add).fill(ROWS[r][c].pid)); });
    if (added) load(d); return added; };
})();
