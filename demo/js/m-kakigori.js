/* Fig 14 behaviour (geometry in m-kakigori-build.js). An order: the coin; the cup is already waiting on the lift under the
   blade; the presser turns the block over the blade and the snow piles into a dome while the turntable turns and the lift
   sinks; the carriage runs to the syrup head, where the bottle's valve opens (and on to the milk pump for the milk ones);
   at the end of the rail the topping turret turns the right cell over the cup and drops it on (none for the plain ones),
   the lift goes down and the cup slides to the take-out window. The carriage then goes back to the magazine, a cup drops
   onto the turntable, and it waits with it under the blade.
   The flaw: the block shaves down, a twentieth a cup; used up, nothing sells until a block goes on the plate at a restock
   (the loader keeps two spare blocks and pushes the next one in by itself).
   Nothing moves while nothing happens (perf rule 3); while something moves, it is redrawn 30 times a second. */
(() => {
  const { P, f } = ISO;
  const { LANE, STN, BLADE, ICE, CUP, ZP, SYR, MAG, LOADER, TOPS, WINDOW, MENU } = KG;
  const MILK = KGB.MILK;
  ['ichigo', 'melon', 'lemon', 'bluehawaii'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 85; });   // the starting stock's goods
  const CAP = 10, SLOTS = 4, USE = .05, SPARES = 2, HZ = 30, LOW = .3;
  // what the turret puts on for each topping (the gold one gets its azuki first); the toppings come with the syrup's
  // servings (no extra restock)
  const STEPS = { azuki: ['azuki'], kinako: ['kinako'], bear: ['bear'], gold: ['azuki', 'gold'] };
  let lv = { loader: 0, dblade: 0, milk: 0 };
  // bot: each bottle's servings (oldest first); ice: what is left of the block on the plate; spares: blocks in the loader
  const S = { bot: [[], [], [], []], ice: 1, spares: 0, no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0, staging = null, nextPaint = 0;
  // the carriage: where it stands, its lift, its turntable, the cup on it; the block as drawn (its level, its turn), the presser
  const C = { x: STN.shave, zp: ZP.start, turn: 0, cup: { d: 0 } };
  let iceLv = 1, iceA = 0, pl = 1, topA = KG.TOPS.out;
  const coinState = [11, 8, 19, 6];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, syrup: m.syrup, top: m.top, milk: m.milk }; };
  const snap = pid => { const g = pid && ECON.product('kakigori', pid); if (!g) return null; const q = ECON.quote('kakigori', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, syrup: g.syrup, top: g.top, milk: g.milk }; };
  const count = () => S.bot.reduce((a, l) => a + l.length, 0);
  const round = v => Math.max(0, Math.round(v * 1000) / 1000);
  const iceOk = () => S.ice >= USE - 1e-6 || (lv.loader && S.spares > 0);
  const canMake = k => S.bot[k].length > 0 && iceOk();
  const anyBot = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };

  /* ---------- drawing ---------- */
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  const paintIce = () => { if (!I) return; I.iceG.innerHTML = KGB.block(BLADE.x, BLADE.y, ICE.z, iceLv, iceA); I.presserG.innerHTML = KGB.presser(pl, iceA); };
  const rest = () => ({ bot: S.spares > 0, top: S.spares > 1 });
  const paintLoader = (o = rest()) => { if (I && lv.loader) I.loaderG.innerHTML = KGB.loader(o); };
  const paintSyrups = (lit = -1) => { if (I) I.syrupG.innerHTML = KGB.syrups(MENU.map((m, k) => (S.bot[k][0] || m).syrup), lit); };
  const paintTurret = (o = {}) => { if (I) I.turretG.innerHTML = KGB.turret(topA, o); };
  const paintCart = () => { if (!I) return; I.cartG.innerHTML = KGB.carriage(C.zp, C.turn, C.cup); I.cartG.setAttribute('transform', move(C.x, 0, 0)); };
  const domeTop = () => C.zp + CUP.h + CUP.dome * (C.cup ? C.cup.d : 0);
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k)); });
    X.gauge.setAttribute('width', f(13.2 * Math.max(0, Math.min(1, S.ice)))); X.gauge.setAttribute('fill', S.ice < LOW ? '#ff6a3a' : '#9ad8ff');
    X.spares.forEach((el, i) => el.classList.toggle('on', i < S.spares));
    X.outLamp.classList.toggle('on', !iceOk());
    if (!busy && !ready) X.lcd.textContent = iceOk() ? 'いらっしゃいませ' : '氷切れ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  // the take-out window: the cup with its dome, under the window's little noren
  function windowCup(r) {
    const z = WINDOW[2] - 6.6, [sx, sy] = P(WINDOW[0], WINDOW[1], z);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(.8) translate(${f(-sx)} ${f(-sy)})">${KGB.cup(WINDOW[0], WINDOW[1], z, 1, Object.assign({ sy: true }, r.o))}</g>`;
  }
  // a mover along a polyline of world points (a cup dropping out of the magazine, down the slide)
  function along(html, pts, ms, ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, html, {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  // the carriage along the rail (only its transform changes), the lift up or down (redrawn 30 times a second)
  async function travel(x) {
    const g0 = gen, from = C.x, d = x - from; if (Math.abs(d) < .01) return true;
    SND.belt && SND.belt(true);
    await UTIL.tween(160 + Math.abs(d) * 8, e => { if (g0 !== gen) return; C.x = from + d * e; if (I) I.cartG.setAttribute('transform', move(C.x, 0, 0)); }, UTIL.ease.inOut);
    SND.belt && SND.belt(false);
    if (g0 !== gen) return false; C.x = x; return true;
  }
  async function lift(zp, ms = 260) {
    const g0 = gen, from = C.zp; let last = 0;
    await UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; C.zp = from + (zp - from) * e; paintCart(); }, UTIL.ease.inOut);
    if (g0 !== gen) return false; C.zp = zp; paintCart(); return true;
  }
  // back for the next cup: down, to the magazine, a cup drops onto the turntable, back under the blade, up to the start
  async function stage() {
    const g0 = gen, live = () => g0 === gen;
    if (!await lift(ZP.travel, 200) || !await travel(STN.mag)) return;
    await along(KGB.cup(0, 0, 0, 0), [[MAG.x, MAG.y, MAG.z], [MAG.x, MAG.y, ZP.travel]], 170); if (!live()) return;
    C.cup = { d: 0 }; C.turn = 0; paintCart(); SND.tok();
    if (!await travel(STN.shave)) return;
    await lift(ZP.start, 300);
  }
  const restage = () => { const st = staging = stage().then(() => { if (staging === st) staging = null; }); return st; };
  // the loader: the presser goes up, the pusher slides the bottom spare across onto the plate (the stub falls away), the
  // pusher goes back, the top spare comes down in its place
  async function feed() {
    const g0 = gen, live = () => g0 === gen, two = S.spares > 1, lv0 = iceLv;
    await UTIL.tween(240, e => { if (live()) { pl = lv0 + (1 - lv0) * e; paintIce(); } }, UTIL.ease.out); if (!live()) return false;
    iceLv = 0; paintIce(); SND.crank();
    let last = 0;
    await UTIL.tween(640, e => { if (!live()) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; paintLoader({ bot: true, top: two, slide: e, rod: e }); }, UTIL.ease.inOut); if (!live()) return false;
    S.spares--; S.ice = 1; iceLv = 1; pl = 1; paintIce(); SND.tok();
    await UTIL.tween(280, e => { if (live()) paintLoader({ bot: false, top: two, rod: 1 - e }); }, UTIL.ease.inOut); if (!live()) return false;
    if (two) { await UTIL.tween(200, e => { if (live()) paintLoader({ bot: false, top: true, up: 1 - e }); }, UTIL.ease.in); if (!live()) return false; SND.tok(); }
    paintLoader(); paintDoor(); return true;
  }
  // the shaving: the block turns over the blade and goes down a twentieth, the snow falls, the dome grows, the turntable
  // turns and the lift sinks to keep the dome's top under the plate
  async function shave() {
    const g0 = gen, from = S.ice, ms = lv.dblade ? 900 : 1800;
    S.ice = round(S.ice - USE);
    if (X) X.shaveLamp.classList.add('on'); SND.whir(true);
    let last = 0, k = 0;
    await UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; k++;
      iceA += lv.dblade ? .42 : .26; iceLv = from + (S.ice - from) * e; pl = iceLv;
      C.turn += .3; C.zp = ZP.start + (ZP.end - ZP.start) * e; if (C.cup) C.cup.d = e;
      paintIce(); paintCart(); I.snowG.innerHTML = e < 1 ? KGB.snow(k, domeTop()) : ''; }, t => t);
    SND.whir(false); if (X) X.shaveLamp.classList.remove('on');
    if (g0 !== gen) return false;
    iceLv = pl = S.ice; paintIce(); I.snowG.innerHTML = ''; paintDoor(); return true;
  }
  // the topping turret: the shortest turn that brings the cell over the cup, then that cell's way of putting it on — a flap
  // (azuki, gold leaf), a sieve shaken (kinako), a plunger pressing the fruit on in a bear's face
  async function topIt(t) {
    const g0 = gen, live = () => g0 === gen, k = TOPS.cells.indexOf(t), TAU = Math.PI * 2;
    const d = ((TOPS.out - k * Math.PI / 2 - topA) % TAU + TAU * 1.5) % TAU - Math.PI;
    if (Math.abs(d) > .01) { const a0 = topA; let last = 0; SND.crank();
      await UTIL.tween(180 + 150 * Math.abs(d), e => { if (!live()) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; topA = a0 + d * e; paintTurret(); }, UTIL.ease.inOut);
      if (!live()) return false; topA = a0 + d; paintTurret(); }
    const x = STN.exit, y = LANE.y, zt = domeTop() + .3, put = () => { C.cup.tps = [...(C.cup.tps || []), t]; paintCart(); };
    if (t === 'bear') {
      await UTIL.tween(240, e => { if (live()) paintTurret({ k, press: e }); }, UTIL.ease.in); if (!live()) return false;
      put(); SND.tok();
      await UTIL.tween(220, e => { if (live()) paintTurret({ k, press: 1 - e }); }, UTIL.ease.out); if (!live()) return false;
    } else if (t === 'kinako') {
      let last = 0;
      await Promise.all([along(KGB.bits(t), [[x, y, TOPS.z - 1.6], [x, y, zt]], 420, e => e),
        UTIL.tween(420, e => { if (!live()) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now; paintTurret({ k, jig: Math.sin(e * Math.PI * 8) * .5 * (1 - e) }); }, e => e)]);
      if (!live()) return false; put(); paintTurret();
    } else {
      await UTIL.tween(110, e => { if (live()) paintTurret({ k, flap: e }); }, UTIL.ease.out); if (!live()) return false;
      await along(KGB.bits(t), [[x, y, TOPS.z - 1.6], [x, y, zt]], 220); if (!live()) return false;
      put(); SND.tok();
      await UTIL.tween(140, e => { if (live()) paintTurret({ k, flap: 1 - e }); }, UTIL.ease.in); if (!live()) return false;
    }
    return true;
  }
  // a stream from a nozzle onto the dome
  async function pour(x, y, z0, c, w, ms) { if (!I) return; I.streamG.innerHTML = KGB.stream(x, y, z0, domeTop() - .4, c, w); await UTIL.wait(ms); if (I) I.streamG.innerHTML = ''; }
  // make one cup of bottle k
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen, p = prod(k);
    if (staging) { await staging; if (!live()) return null; }
    if (!C.cup || Math.abs(C.x - STN.shave) > .01) { await restage(); if (!live()) return null; }
    if (S.ice < USE - 1e-6) { if (!await feed()) return null; }
    S.bot[k].shift(); paintSyrups(); paintDoor();
    Object.assign(C.cup, { syrup: p.syrup, top: p.top, milk: false, sy: false, tps: [] });
    if (!await shave()) return null;
    // the syrup head: the bottle's valve opens, the syrup (and the topping) goes on
    if (!await travel(STN.syrup)) return null;
    paintSyrups(k); SND.click(); SND.pour && SND.pour(.4);
    await pour(SYR.x, SYR.y, SYR.z, p.syrup, 1.2, 420); if (!live()) return null;
    C.cup.sy = true; paintCart(); paintSyrups(); SND.tok();
    // the last stop: the milk pump (the milk ones), the topping drum (the ones that take a topping), then the lift goes
    // down and the cup slides to the take-out window
    if (!await travel(STN.exit)) return null;
    if (p.milk && lv.milk) {
      I.streamG.innerHTML = KGB.streamTo(MILK.tip, [STN.exit + .6, LANE.y - .4, domeTop() - .3], '#fffdf4', 1.5); SND.pour && SND.pour(.3);
      await UTIL.wait(380); if (!live()) return null; I.streamG.innerHTML = '';
      C.cup.milk = true; paintCart(); SND.tok();
    }
    for (const t of STEPS[p.top] || []) if (!await topIt(t)) return null;
    if (!await lift(ZP.exit, 240)) return null;
    const o = Object.assign({}, C.cup); C.cup = null; paintCart(); SND.tok();
    await along(KGB.cup(0, 0, 0, 1, o), [[STN.exit, LANE.y, ZP.exit], [STN.exit, 80, ZP.exit - 14], [WINDOW[0], WINDOW[1] + 1, 30]], 520); if (!live()) return null;
    making = false; restage(); paintDoor();
    return { p, o };
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyBot() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.kg-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, KG.SLOTW);
    X.lcd.textContent = `${no}番 · 削っています`;
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p: r.p, o: r.o, no, who }; ready = done; windowCup(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: r.p.name, price: r.p.price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#9ad8ff');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#3a8aff'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: syrup into the four bottles, blocks of ice onto the plate (and into the loader) ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const bottleTop = k => { const [x, y] = KGB.bottle(k); return [x, y, 159 + (k % 2) * 6]; };   // (staggered: the X-ray tags of four bottles side by side)
  // a block goes on the plate when what is left there is low; otherwise into the loader while it has room
  const toPlate = () => S.ice < LOW || !lv.loader;
  const supply = {
    title: T`刨冰料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-kg-syrup', vars: `--c:${m.syrup}`, pos: [7 + j * 8.4, 12 + k * 15, 2], target: 's' + k }))),
      ...[0, 1, 2].map(i => ({ glyph: 'g-kg-ice', vars: '', pos: [100, 14 + i * 22, 2], target: 'ice' }))],
    back: crateBack, front: crateFront,
    entry: t => t === 'ice' ? (toPlate() ? [BLADE.x, BLADE.y, ICE.z + 26] : [LOADER.x, LOADER.y, ICE.z + 44]) : bottleTop(+t.slice(1)),
    accept: t => t === 'ice' ? S.ice < LOW || (lv.loader && S.spares < SPARES) : S.bot[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'ice' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'ice' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t[0] === 's' && !ECON.everStocked('kakigori', MENU[+t.slice(1)].pid),
    stocks: t => { if (t[0] !== 's') return []; const k = +t.slice(1); reserved[k]++; return [['kakigori', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'ice') {
        if (toPlate()) { S.ice = 1; iceLv = 1; pl = 1; paintIce(); CORE.sparkle(BLADE.x, BLADE.y, ICE.z + 10, 12, '#e8f8ff'); }
        else { S.spares = Math.min(SPARES, S.spares + 1); paintLoader(); }
        SND.clank(); paintDoor();
        UTIL.tween(760, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty + 8 * e)}) scale(${f(s)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.in);
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.bot[k].length < CAP) { S.bot[k].push(prod(k)); paintSyrups(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target === 'ice') - (b.target === 'ice')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.bot.forEach((l, k) => { for (let j = 0; j < 5; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = KGB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, KG.D, KG.H);
    if (ready) { windowCup(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    if (X.dbladeLamp) X.dbladeLamp.classList.add('on');
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the shaving column shows through the door);
  // the carriage stands under the blade with an empty cup
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    staging = null; Object.assign(C, { x: STN.shave, zp: ZP.start, turn: 0, cup: { d: 0 } }); iceLv = pl = S.ice;
    I = KGB.interior(G.interior, coinState, lv); KGB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    paintIce(); paintLoader(); paintSyrups(); paintCart(); paintTurret(); shell();
  }
  // nothing moves on its own
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 700; paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, KG.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || staging || hinge.open || hinge.moving || anyBot() < 0) return null; vend(null, 'customer'); return T`刨冰`; }
  // off screen: one cup from a bottle that has some (the loader puts a new block on when the old one is gone)
  function idleSell() {
    const k = anyBot(); if (k < 0) return 0;
    if (S.ice < USE - 1e-6) { S.spares--; S.ice = 1; }
    const p = S.bot[k].shift(); S.ice = round(S.ice - USE); S.no = S.no % 99 + 1;
    if (I && !making) { iceLv = pl = S.ice; paintIce(); paintLoader(); paintSyrups(); } if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the shaving column shows through the door's window, so the insides are always drawn
    id: 'kakigori', fig: 14, name: T`刨冰`, brand: 'ふわゆき', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#3a8aff',
    render: () => render(),
    hint: { shut: T`点菜单选一种糖浆 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看刨冰柱：压板按着冰块在刀盘上转，雪落进杯子；杯子坐在升降台上沿导轨走一站一站：取杯、刨冰、浇糖浆、撒配料、出杯`, open: T`糖浆补进四个瓶子 · 冰块放到刀盘上 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making || staging) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making || !!staging, prepare: () => { if (ready) take(true); },
    save: () => ({ bot: S.bot.map(l => l.map(p => p.pid)), ice: S.ice, spares: S.spares, no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.bot)) S.bot = [0, 1, 2, 3].map(k => (d.bot[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (typeof d.ice === 'number') S.ice = Math.max(0, Math.min(1, d.ice));
      if (typeof d.spares === 'number') S.spares = Math.max(0, Math.min(SPARES, d.spares | 0));
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    // X-ray tags: per bottle, over it on the syrup head
    labels: () => MENU.map((m, k) => { const p = S.bot[k][0] || m; return { name: p.name, n: S.bot[k].length, c: p.syrup, pt: bottleTop(k) }; }),
    labelStyle: 'mini',
    // goods: four bottles on the syrup head; the milk ones need the milk pump
    goods: {
      kind: 'kakigori', defaults: ['ichigo', 'melon', 'lemon', 'bluehawaii'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.bot[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, syrup: g.syrup, top: g.top, milk: g.milk })),
    },
    // the special unlock: ゆきんこ's extra shelf squeezes a few blocks of ice out of its freezer
    unlock: { open: () => UPG.has('frozen', 'shelf'), hint: () => T`给ゆきんこ装上「加一层货架」改造`,
      card: () => [T`ゆきんこ多了一层货架，冷冻室里挤出来几块冰`, T`冰块搬到了隔壁：刨冰「ふわゆき」来了，机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the block loader (the cure), the double blade (faster), the milk pump (new goods)
    upgrades: [
      { id: 'loader', name: T`自動ブロック補給`, cost: [12000], effect: [T`旁边加一个冷柜存两块备用冰 · 冰块削完自动推上刀盘`], kind: T`省心`, pin: [LOADER.x, LOADER.y, ICE.z + 22],
        fact: T`冰块从冷冻库拿出来要先放一会儿，让表面稍微回温（叫「戻す」），削出来才松软，不会是一粒粒的冰碴。` },
      { id: 'dblade', name: T`二枚刃`, cost: [50000], effect: [T`刀盘换成两片刀，马达加大 · 刨一杯的时间少一半`], kind: T`速度`, pin: [BLADE.x, BLADE.y, 186],
        fact: T`刨冰的口感看刀：刀调得越薄，冰越像雪；调厚了就是嘎吱嘎吱的冰碴。` },
      { id: 'milk', name: T`練乳ポンプ`, cost: [80000], effect: [T`加一管炼乳泵 · 能卖浇炼乳的刨冰（草莓牛奶、牛奶金时、白熊）`], kind: T`新货`, pin: [MILK.x + 2, MILK.y + 8, MILK.z - 12],
        fact: T`「白熊」是鹿儿岛的刨冰：浇上炼乳，摆好水果和红豆，从上面看像一只白熊的脸。` },
    ],
    applyParts: l => { lv = { loader: l.loader || 0, dblade: l.dblade || 0, milk: l.milk || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n servings of the planned syrups, a new block (and
  // the loader's spares)
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.bot = d.bot.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.ice = 1; if (lv.loader) d.spares = SPARES; me.load(d); return added || 1; };
  // syrup left but no ice: as good as sold out
  me.stuck = () => !iceOk() && count() > 0;
})();
