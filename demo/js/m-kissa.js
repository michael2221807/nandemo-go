/* Fig 16 behaviour (geometry in m-kissa-build.js). An order: the coin; the cup (and saucer) or the glass drops from the rack
   onto the belt; a glass stops under the ice chute; under the siphon the halogen ring lights, the water climbs into the
   bowl, the grinder drops the grounds, the paddle stirs, the lamp goes out and the coffee comes back down through the
   cloth filter, then the tap pours it into the cup below; the finishing head adds milk, whipped cream, a scoop of ice
   cream or a cherry; at the end of the belt the cup goes down to the take-out window. A cream soda (upgrade) passes
   the siphon by and gets its soda at the finishing head.
   The flaw: the cloth filter clogs — after 20 brews the coffee drains slowly, after 30 not at all, until a fresh filter
   goes in at a restock (the rinser washes it after every brew).
   Nothing moves while nothing happens (perf rule 3); what moves is redrawn 30 times a second (rule 14). */
(() => {
  const { P, f } = ISO;
  const { BELT, STN, SIPHON, VESSEL, WINDOW, MENU } = KS;
  ['blend', 'american', 'iced', 'aulait'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 85; });   // the starting stock's goods
  const CAP = 10, SLOTS = 4, SLOW = 20, CLOG = 30, HZ = 30;
  let lv = { rinse: 0, halogen: 0, soda: 0 };
  // beans: each slot's servings (oldest first); filter: brews since the cloth filter was fresh
  const S = { beans: [[], [], [], []], filter: 0, no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0, nextPaint = 0;
  // the siphon as drawn; the vessel on the belt (where it stands, what is in it)
  const SI = { water: 1, bowl: 0, coffee: false, grounds: false, lamp: 0, lamp2: 0, stir: null, tap: false, rinse: false, t: 0 };
  let V = null, vx = STN.rack;
  const coinState = [11, 8, 19, 6];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, ves: m.ves, drink: m.drink, fin: m.fin, pat: m.pat, soda: !!m.soda }; };
  const snap = pid => { const g = pid && ECON.product('kissa', pid); if (!g) return null; const q = ECON.quote('kissa', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, ves: g.ves, drink: g.drink, fin: g.fin, pat: g.pat, soda: !!g.soda }; };
  const fins = p => (Array.isArray(p.fin) ? p.fin : p.fin ? [p.fin] : []);
  const count = () => S.beans.reduce((a, l) => a + l.length, 0);
  const clogged = () => !lv.rinse && S.filter >= CLOG;
  const canMake = k => { const l = S.beans[k]; if (!l.length) return false; const p = l[0]; return p.soda ? !!lv.soda : !clogged(); };
  const anyMake = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  const paintSiphon = () => { if (I) I.siphonG.innerHTML = KSB.siphon(Object.assign({}, SI, { lamp2: lv.halogen ? SI.lamp2 : undefined, rinse: lv.rinse && SI.rinse })); };
  const paintCup = () => { if (!I) return; I.cupG.innerHTML = V ? KSB.vessel(0, BELT.y, BELT.z + (Math.abs(vx - STN.brew) < .5 ? .6 : 0), V) : ''; I.cupG.setAttribute('transform', move(vx, 0, 0)); };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    const wear = lv.rinse ? 0 : Math.min(1, S.filter / CLOG);
    X.gauge.setAttribute('width', f(13.2 * (1 - wear))); X.gauge.setAttribute('fill', wear >= SLOW / CLOG ? '#ff6a3a' : '#f4e6c8');
    X.filterLamp.classList.toggle('on', !lv.rinse && S.filter >= SLOW);
    if (!busy && !ready) X.lcd.textContent = clogged() ? 'フィルター交換' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowCup(r) {
    const z = WINDOW[2] - 6, [sx, sy] = P(WINDOW[0], WINDOW[1], z);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.1) translate(${f(-sx)} ${f(-sy)})">${KSB.vessel(WINDOW[0], WINDOW[1], z, r.v)}</g>`;
  }
  // a mover along world points (ice, a scoop, a cherry falling; the cup down the chute), redrawn at 30 Hz
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    let last = 0;
    return UTIL.tween(ms, e => { const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }
  // a tween redrawn at 30 Hz
  // (the siphon's liquid moves slowly: 20 redraws a second are enough, and each one repaints the machine)
  const slow = (ms, fn, ease = UTIL.ease.inOut, hz = 20) => { const g0 = gen; let last = 0;
    return UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / hz - 2 && e < 1) return; last = now; fn(e); }, ease).then(() => g0 === gen); };
  async function pour(x, z0, c, w, ms, onFill) { if (!I) return; I.streamG.innerHTML = KSB.stream(x, BELT.y, z0, BELT.z + (V && V.ves === 'glass' ? VESSEL.glass.h * .7 : VESSEL.cup.h), c, w);
    const ok = await slow(ms, e => onFill && onFill(e), t => t); if (I) I.streamG.innerHTML = ''; return ok; }

  /* ---------- the line ---------- */
  async function belt(x) { const from = vx, d = x - from, g0 = gen; if (Math.abs(d) < .01) return true; let last = 0;
    await UTIL.tween(160 + Math.abs(d) * 9, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; vx = from + d * e; if (I) I.cupG.setAttribute('transform', move(vx, 0, 0)); }, UTIL.ease.inOut);
    if (g0 !== gen) return false; vx = x; return true; }
  // the siphon brews one cup: light, the water climbs, the grounds, the stir, dark, the coffee comes down; then the tap
  async function brew() {
    const fast = lv.halogen, dirty = !lv.rinse && S.filter >= SLOW;
    if (X) X.brewLamp.classList.add('on'); SND.whir && SND.whir(true);
    if (!await slow(220, e => { SI.lamp = e; if (fast) SI.lamp2 = e; paintSiphon(); })) return false;
    if (!await slow(fast ? 560 : 1100, e => { SI.t += .3; SI.water = 1 - .9 * e; SI.bowl = e; paintSiphon(); }, t => t)) return false;
    // the grinder drops the grounds into the bowl
    SND.crank && SND.crank();
    if (!await pour(SIPHON.x, SIPHON.bowl[1] + 2.4, '#5a3418', 1.4, 300)) return false;
    SI.grounds = true; paintSiphon();
    if (!await slow(fast ? 380 : 700, e => { SI.t += .3; SI.stir = e * Math.PI * 4; paintSiphon(); }, t => t)) return false;
    SI.stir = null; SND.whir && SND.whir(false);
    if (!await slow(160, e => { SI.lamp = 1 - e; if (fast) SI.lamp2 = 1 - e; paintSiphon(); })) return false;
    // dark: the flask cools and pulls the coffee back through the filter (slowly when it is clogging)
    SI.coffee = true;
    if (!await slow(dirty ? 2000 : 1100, e => { SI.bowl = 1 - e; SI.water = .1 + .8 * e; paintSiphon(); }, t => t)) return false;
    SI.grounds = true; SI.bowl = 0; paintSiphon();
    // the tap under the flask opens: the coffee runs into the cup
    SI.tap = true; paintSiphon(); SND.pour && SND.pour(.4);
    if (!await pour(SIPHON.x, SIPHON.tap[0], '#3a1e0e', 1.1, 600, e => { SI.water = .9 * (1 - e); V.fill = e; paintSiphon(); paintCup(); })) return false;
    SI.tap = false; SI.coffee = false; SI.grounds = false; SI.water = 0; paintSiphon();
    if (X) X.brewLamp.classList.remove('on');
    // the rinser washes the filter; or it gets a brew dirtier
    if (lv.rinse) { SI.rinse = true; paintSiphon(); await UTIL.wait(260); SI.rinse = false; } else S.filter++;
    // the flask fills again from the tank (on its own, while the cup goes on)
    slow(500, e => { SI.water = e; paintSiphon(); });
    paintDoor(); return true;
  }
  // make one drink of slot k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen, p = S.beans[k].shift(), f0 = fins(p), cold = p.ves === 'glass';
    paintDoor();
    // the vessel drops from the rack onto the belt
    V = { ves: p.ves, drink: p.drink, fill: 0, fin: [], pat: p.pat, ice: false, straw: false }; vx = STN.rack;
    I.cupG.setAttribute('transform', move(vx, 0, 0));
    await along(KSB.vessel(0, 0, 0, Object.assign({}, V)), [[STN.rack, BELT.y - 4, BELT.z + 12], [STN.rack, BELT.y, BELT.z]], 260); if (!live()) return null;
    paintCup(); SND.tok();
    // a glass gets its ice
    if (cold) { if (!await belt(STN.ice)) return null;
      await along([0, 1, 2].map(i => { const [a, b] = P(i - 1, 0, i * 1.6); return `<rect x="${f(a - 1)}" y="${f(b - 1)}" width="2" height="2" rx=".4" fill="rgba(255,255,255,.85)" stroke="rgba(150,190,225,.8)" stroke-width=".3"/>`; }).join(''), [[STN.ice, BELT.y, BELT.z + 13], [STN.ice, BELT.y, BELT.z + 5]], 240); if (!live()) return null;
      V.ice = true; paintCup(); SND.click(); }
    if (!await belt(STN.brew)) return null;
    if (!p.soda) { if (!await brew()) return null; } else await UTIL.wait(200);
    if (!live()) return null;
    // the finishing head: soda, milk, whipped cream, a scoop of ice cream, a cherry
    if (!await belt(STN.finish)) return null;
    const top = () => BELT.z + (V.ves === 'glass' ? VESSEL.glass.h : VESSEL.cup.h);
    if (p.soda) { SND.pour && SND.pour(.3); if (!await pour(STN.finish + 2.4, BELT.z + 17, p.drink, 1.4, 500, e => { V.fill = e; paintCup(); })) return null; }
    for (const t of f0) {
      if (t === 'milk') { if (!await pour(STN.finish - 2.4, BELT.z + 17, '#f4ecd8', 1, 320, e => { if (V.ves === 'glass') V.fill = Math.max(V.fill, .7 + .3 * e); })) return null; }
      else if (t === 'cream') { if (!await pour(STN.finish, BELT.z + 17, '#fffdf4', 1.6, 300)) return null; }
      else if (t === 'flame') { SND.click(); await UTIL.wait(260); if (!live()) return null; }
      else if (t === 'ice' || t === 'cherry') {
        const html = t === 'ice' ? (() => { const [a, b] = P(0, 0, 0); return `<circle cx="${f(a)}" cy="${f(b)}" r="2.6" fill="#fff8e8" stroke="rgba(0,0,0,.4)" stroke-width=".4"/>`; })()
          : (() => { const [a, b] = P(0, 0, 0); return `<circle cx="${f(a)}" cy="${f(b)}" r="1.1" fill="#d8102a"/>`; })();
        await along(html, [[STN.finish + (t === 'ice' ? 2.4 : -4), BELT.y, BELT.z + 17], [STN.finish, BELT.y, top() + 2]], 260); if (!live()) return null; }
      V.fin.push(t); if (t === 'cherry' || p.soda) V.straw = true; paintCup(); SND.tok();
    }
    if (cold && !p.soda && !f0.includes('ice')) V.straw = true;
    paintCup();
    // the end of the belt: down the chute to the take-out window
    if (!await belt(STN.exit)) return null;
    const v = Object.assign({}, V); V = null; paintCup();
    await along(KSB.vessel(0, 0, 0, v), [[STN.exit, BELT.y, BELT.z], [STN.exit, 82, 40], [WINDOW[0], WINDOW[1] + 1, 30]], 520); if (!live()) return null;
    vx = STN.rack; making = false; paintDoor();
    return { p, v };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyMake() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.ks-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, KS.SLOTW);
    X.lcd.textContent = `${no}番 · ただいま抽出中`;
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p: r.p, v: r.v, no, who }; ready = done; windowCup(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price: r.p.price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#f4e6c8');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#b8283a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: beans (or syrup) per slot, a fresh cloth filter ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const supply = {
    title: T`喫茶料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-ks-beans', vars: `--c:${m.drink}`, pos: [7 + j * 9, 13 + k * 15.4, 2], target: 's' + k }))),
      { glyph: 'g-ks-filter', vars: '', pos: [104, 40, 2], target: 'filter' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'filter' ? [SIPHON.x, SIPHON.y, SIPHON.bowl[1] + 6] : [STN.finish, BELT.y, BELT.z + 30],
    accept: t => t === 'filter' ? S.filter > 0 && !lv.rinse : S.beans[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'filter' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'filter' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t[0] === 's' && !ECON.everStocked('kissa', MENU[+t.slice(1)].pid),
    stocks: t => { if (t[0] !== 's') return []; const k = +t.slice(1); reserved[k]++; return [['kissa', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'filter') { S.filter = 0; SND.chime(); CORE.sparkle(SIPHON.x, SIPHON.y, SIPHON.bowl[0] + 4, 10, '#f4ecd8'); paintDoor();
        UTIL.tween(760, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty + 8 * e)}) scale(${f(s)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.in); return true; }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.beans[k].length < CAP) { S.beans[k].push(prod(k)); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target === 'filter') - (b.target === 'filter')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.beans.forEach((l, k) => { for (let j = 0; j < 5; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = KSB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, KS.D, KS.H);
    if (ready) { windowCup(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    if (X.haloLamp) X.haloLamp.classList.add('on');
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the siphon shows through the door)
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    Object.assign(SI, { water: 1, bowl: 0, coffee: false, grounds: false, lamp: 0, lamp2: 0, stir: null, tap: false, rinse: false }); V = null; vx = STN.rack;
    I = KSB.interior(G.interior, coinState, lv); KSB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    paintSiphon(); paintCup(); shell();
  }
  // nothing moves on its own
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 700; paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, KS.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyMake() < 0) return null; vend(null, 'customer'); return T`喫茶`; }
  // off screen: one drink from a slot that can make it (each coffee wears the filter a brew)
  function idleSell() {
    const k = anyMake(); if (k < 0) return 0;
    const p = S.beans[k].shift(); if (!p.soda && !lv.rinse) S.filter++; S.no = S.no % 99 + 1;
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the siphon shows through the door's window, so the insides are always drawn
    id: 'kissa', fig: 16, name: T`纯喫茶`, brand: 'しずく', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#b8283a',
    render: () => render(),
    hint: { shut: T`点菜单选一杯 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看虹吸壶：灯一亮水就升进上壶，落粉、搅拌，灯一灭咖啡又被吸回下壶，阀门一开流进杯子`, open: T`豆子补进四格 · 布滤网堵了就换一块新的 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ beans: S.beans.map(l => l.map(p => p.pid)), filter: S.filter, no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.beans)) S.beans = [0, 1, 2, 3].map(k => (d.beans[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.filter === 'number') S.filter = Math.max(0, Math.min(CLOG, d.filter | 0));
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    // X-ray tags: per slot, over the finishing head (one row, staggered)
    labels: () => MENU.map((m, k) => { const p = S.beans[k][0] || m; return { name: p.name, n: S.beans[k].length, c: p.drink, pt: [STN.finish - 9 + k * 6, BELT.y - 8, BELT.z + 36 + (k % 2) * 6] }; }),
    labelStyle: 'mini',
    // goods: four slots; the cream sodas need the soda fountain
    goods: {
      kind: 'kissa', defaults: ['blend', 'american', 'iced', 'aulait'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.beans[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, ves: g.ves, drink: g.drink, fin: g.fin, pat: g.pat, soda: !!g.soda })),
    },
    // the special unlock: ヨルカフェ has sold 500 cups (its regulars want a proper coffee shop)
    unlock: { open: () => ECON.GOODS.cup.reduce((a, g) => a + ECON.soldCount('cup', g.id), 0) >= 500, hint: () => T`ヨルカフェ卖出 500 杯`,
      card: () => [T`ヨルカフェ卖到第 500 杯，熟客说想坐下来慢慢喝一杯`, T`于是隔壁开了一间纯喫茶「しずく」：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the filter rinser (the cure), the second halogen ring (faster), the soda fountain (new goods)
    upgrades: [
      { id: 'rinse', name: T`ネル自動洗浄`, cost: [12000], effect: [T`上壶上方装一个喷头 · 每煮一杯就冲洗布滤网，再也不堵`], kind: T`省心`, pin: [SIPHON.x - 4.8, SIPHON.y - 4.8, 150],
        fact: T`虹吸壶的布滤网（ネル）用完要洗干净，泡在水里放冰箱，干了就会有怪味——这是纯喫茶老板每天收店前的功课。` },
      { id: 'halogen', name: T`ハロゲン×2`, cost: [50000], effect: [T`再加一圈卤素灯 · 水升得更快，搅拌也更快`], kind: T`速度`, pin: [SIPHON.x + 9, SIPHON.y + 9, SIPHON.ring - 8],
        fact: T`以前的虹吸壶用酒精灯加热，现在很多店改用卤素灯：火力稳定，橙色的光照着玻璃壶也很好看。` },
      { id: 'soda', name: T`ソーダファウンテン`, cost: [80000], effect: [T`加三瓶糖浆、一台二氧化碳机和一罐樱桃 · 能卖奶油苏打（哈密瓜、蓝色、草莓）`], kind: T`新货`, pin: [KSB.SODA.x, KSB.SODA.y, 126],
        fact: T`1902 年东京银座的资生堂药局装了日本第一台汽水机（ソーダファウンテン）；后来绿色的哈密瓜苏打配香草冰淇淋，成了纯喫茶的招牌。` },
    ],
    applyParts: l => { lv = { rinse: l.rinse || 0, halogen: l.halogen || 0, soda: l.soda || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n servings of the planned goods (not the filter)
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.beans = d.beans.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    me.load(d); return added || 1; };
  // beans left but the filter clogged (and no soda to sell): as good as sold out
  me.stuck = () => count() > 0 && [0, 1, 2, 3].every(k => !S.beans[k].length || !canMake(k));
})();
