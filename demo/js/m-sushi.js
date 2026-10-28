/* Fig 11 behaviour (geometry in m-sushi-build.js). An order: the coin; if a plate of it is going round, the diverter
   takes it off at the exit; if not, one is made — a plate drops from the magazine onto the deck, the drum turns and
   pushes a ball of rice onto it, the turret brings the cassette round and the pusher slides a slice on, (the torch sears
   it), the lift lowers it onto the loop (or, with the express lane, it goes straight down the slide) and it rides round
   to the exit, off, down to the take-out window.
   While nothing is ordered the machine keeps two plates going round, to show what it has and to serve them at once.
   The flaw: a plate that has been going round too long gets a 半額 sticker from the reader arch as it passes and sells
   for half (kept in real time: stale after 90 seconds, 6 minutes with the domes). Nothing is thrown away: the cost is
   only what it fetches. */
(() => {
  const { P, f } = ISO;
  const { LOOP, LEN, posAt, sFront, S_LIFT, DECK, STN, TUR, HOP, EXIT, LABEL, EXPRESS, WINDOW, MENU, TOPC } = SU;
  ['tamago', 'kappa', 'inari', 'ika', 'salmon'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 110; });   // the starting stock's goods
  const CAP = 8, SHOW = 2, LAP = 9000, FRESH = [90e3, 360e3], GAP = 11 / LEN, BELT_HZ = 30;
  const S_EXIT = sFront(EXIT), S_LABEL = sFront(LABEL);
  let lv = { dome: 0, express: 0, burner: 0 };
  // cas: each cassette's slices (oldest first); belt: plates going round { p, k, at: its place on the chain, made, half }
  const S = { cas: [[], [], [], [], []], rice: .85, belt: [], no: 0 };
  const reserved = [0, 0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, cur = null, lift = null;
  let phase = 0, run = 0, lastT = 0, nextPaint = 0, rot = Math.PI / 2, drumA = 0, chainLen = 0;
  // gen: bumped by every redraw; a plate being made when it changes is dropped (its steps check it after each wait)
  let gen = 0;
  const coinState = [14, 7, 20, 4];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g }; };
  const snap = pid => { const g = pid && ECON.product('sushi', pid); if (!g) return null; const q = ECON.quote('sushi', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g }; };
  const seared = g => g === 'asalmon' || g === 'aengawa' || g === 'atoro';
  const stale = b => Date.now() - b.made > FRESH[lv.dome ? 1 : 0];
  const beltOf = k => S.belt.filter(b => b.k === k).length;
  const count = () => S.cas.reduce((a, l) => a + l.length, 0) + S.belt.length;
  const canMake = k => S.cas[k].length > 0 && S.rice > .02;
  const anyCas = () => { const ks = [0, 1, 2, 3, 4].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };
  const takeSlice = k => { const p = S.cas[k].shift(); S.rice = Math.max(0, S.rice - 1 / 40); return p; };
  const sOf = b => ((b.at + phase) % 1 + 1) % 1;
  const near = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 1 - d); };
  const crowded = s => S.belt.some(b => near(sOf(b), s) < GAP);

  /* ---------- drawing ---------- */
  const [O0x, O0y] = [0, 0];
  const shift = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, z); return `translate(${f(a - c)} ${f(b - d)})`; };
  // a thing drawn at the origin, moved to world (x, y, z) — height included (the chute and the shuttle go down)
  const move = (x, y, z) => { const [a, b] = P(x, y, z), [c, d] = P(0, 0, 0); return `translate(${f(a - c)} ${f(b - d)})`; };
  /* one node per plate (perf rule 4, 2026-10-17): the loop never stops, and a plate drawn in full (discs, two pieces, the
     dome) made the browser restyle some 50 nodes every frame. Each look (kind, ★, stage, 半額, dome) is drawn once into
     the machine's <defs>; plates are <use>s of it, moved by their transform. Measured: style work per second 265 → 25 ms */
  let looks = new Map(), lookN = 0;
  function lookOf(p, o = {}) {
    const key = `${p.g}|${p.tier || 1}|${o.stage == null ? 2 : o.stage}|${o.half ? 1 : 0}|${o.dome ? 1 : 0}`;
    let id = looks.get(key);
    if (!id) { id = 'su-pl' + (++lookN); looks.set(key, id); UTIL.g(I.defs, SUB.plate(p, 0, 0, 0, o), { id }); }
    return '#' + id;
  }
  // a <use> of a look at world (x, y, z), made once and then only moved (its look swapped when it changes)
  function useAt(el, parent, p, o, x, y, z) {
    if (!el || el.parentNode !== parent) el = UTIL.el('use', {}, parent);
    const href = lookOf(p, o); if (el.getAttribute('href') !== href) el.setAttribute('href', href);
    el.setAttribute('transform', move(x, y, z)); return el;
  }
  function plateEl(b) { b.el = UTIL.el('use', { class: 'su-bplate', href: lookOf(b.p, { half: b.half, dome: !!lv.dome }) }, I.frontG); place(b); }
  function place(b) {
    if (!b.el) return; const [x, y] = posAt(sOf(b));
    b.el.setAttribute('transform', move(x, y, LOOP.z));
    const g = y < SU.CY ? I.rearG : I.frontG; if (b.el.parentNode !== g) g.appendChild(b.el);
  }
  function drawBelt() { if (!I) return; I.rearG.innerHTML = ''; I.frontG.innerHTML = ''; S.belt.forEach(b => { b.el = null; plateEl(b); }); }
  const renderTurret = () => { if (I) I.turretG.innerHTML = SUB.turret(rot, S.cas.map((l, k) => ({ n: l.length, g: (l[0] || MENU[k]).g }))); };
  const renderRice = () => { if (I) I.riceG.innerHTML = SUB.hopperFill(S.rice); };
  const drawMag = () => { if (I) I.magG.innerHTML = Array.from({ length: 7 }, (_, i) => { const c = SU.PLATE[(i % 5) + 1]; return GLY.toD ? `<path d="${GLY.toD(GLY.ringZ(DECK.z + 2 + i * 2.6, 4.6, 12, 0, Math.PI * 2, STN.mag, DECK.y))}" style="fill:${c[0]};stroke:${c[1]};stroke-width:.8;vector-effect:non-scaling-stroke"/>` : ''; }).join(''); };
  // the plate on the deck and the lift: one <use> each, moved as they go (the lift's platform: one more <use> of its slab)
  let deckEl = null, liftEl = null, slabEl = null;
  const drawDeck = () => { if (!I) return;
    if (!cur) { if (deckEl) deckEl.remove(); deckEl = null; return; }
    deckEl = useAt(deckEl, I.deckG, cur.p, { stage: cur.s.neta ? 2 : cur.s.rice ? 1 : 0, dome: !!cur.s.dome }, cur.x, DECK.y, cur.z); };
  const drawLift = () => { if (!I) return; const z = lift ? lift.z : DECK.z - 1;
    if (!slabEl || slabEl.parentNode !== I.liftG) { I.liftG.innerHTML = ''; UTIL.g(I.defs, ISO.box(STN.lift - 4.4, DECK.y - 4.4, -1.2, 8.8, 8.8, 1.2, 0, 'su-steel'), { id: 'su-slab' + lookN });
      slabEl = UTIL.el('use', { href: '#su-slab' + lookN }, I.liftG); liftEl = null; }
    slabEl.setAttribute('transform', move(0, 0, z));
    if (lift && lift.p) liftEl = useAt(liftEl, I.liftG, lift.p, { dome: !!lv.dome }, STN.lift, DECK.y, z); else if (liftEl) { liftEl.remove(); liftEl = null; } };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !canMake(k) && !beltOf(k)); });
    X.count.textContent = `${S.belt.length}皿`;
    X.halfLamp.classList.toggle('on', S.belt.some(b => b.half || stale(b)));
    if (!busy && !ready) X.lcd.textContent = S.rice <= .02 ? 'シャリ切れ' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowPlate(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.35) translate(${f(-sx)} ${f(-sy)})">${SUB.plate(r.p, ...WINDOW, { half: r.half, dome: !!lv.dome })}</g>`;
  }
  // a mover along a polyline of world points (the chute, the express shuttle): a plate, and whatever carries it
  function along(p, pts, ms, o = {}, carrier = '', ease = UTIL.ease.in) {
    const el = UTIL.g(I.movers, carrier + (p ? SUB.plate(p, 0, 0, 0, o) : ''), {});
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    return UTIL.tween(ms, e => { let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1]; el.setAttribute('transform', move(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u)); }, ease).then(() => el.remove());
  }
  // the express lane: the plate rides the shuttle straight down to the take-out window, the shuttle climbs back up empty;
  // the 特急 signs (on the rail, on the door) light while it runs
  const expLamp = on => { if (I && I.expSign) I.expSign.classList.toggle('on', on); if (X && X.expLamp) X.expLamp.classList.toggle('on', on); };
  async function ride(p) {
    const at = I; at.shuttleG.style.display = 'none'; expLamp(true); SND.lift && SND.lift();
    await along(p, EXPRESS, 560, { dome: !!lv.dome }, SUB.shuttle(0, 0, 0));
    if (I !== at) return;
    along(null, EXPRESS.slice().reverse(), 480, {}, SUB.shuttle(0, 0, 0), UTIL.ease.out).then(() => { if (I === at) { at.shuttleG.style.display = ''; expLamp(false); } });
  }
  // the dome magazine lets the bottom dome fall onto the plate under it
  async function capIt() {
    const el = UTIL.g(I.movers, SUB.dome(STN.lift, DECK.y, DECK.z), {}), k = P(0, 0, 1)[1] - P(0, 0, 0)[1], drop = SUB.DROP.z0 - DECK.z;
    await UTIL.tween(220, e => el.setAttribute('transform', `translate(0 ${f(k * drop * (1 - e * e))})`), t => t);
    el.remove(); if (cur) { cur.s.dome = true; drawDeck(); } SND.tok();
  }

  /* ---------- the line ---------- */
  async function deckTo(x, ms) {
    if (!cur) return; const c = cur, at = I, from = c.x, d0 = +(at.deckStripes.dataset.o || 0); SND.belt && SND.belt(true);
    await UTIL.tween(ms, e => { if (cur !== c || I !== at) return; c.x = from + (x - from) * e; drawDeck(); at.deckStripes.style.strokeDashoffset = f(d0 - (x - from) * e * 1.4); }, UTIL.ease.inOut);
    at.deckStripes.dataset.o = d0 - (x - from) * 1.4; SND.belt && SND.belt(false);
  }
  // the turret turns the shortest way to bring cassette k to the front (the pusher's side)
  async function turnTo(k) {
    const want = Math.PI / 2 - k * Math.PI * 2 / 5, from = rot; let d = ((want - from) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    if (Math.abs(d) < .01) return;
    SND.tok(); await UTIL.tween(200 + 260 * Math.abs(d) / Math.PI, e => { rot = from + d * e; renderTurret(); }, UTIL.ease.inOut); rot = want;
  }
  // make one plate of cassette k: for an order (it is wanted at the exit), or one more to go round
  async function make(k, order) {
    making = true;
    const g0 = gen, live = () => g0 === gen;
    const p = takeSlice(k); renderTurret(); renderRice(); paintDoor();
    const c = cur = { p, x: STN.mag, z: DECK.z + 18, s: {} };
    await UTIL.tween(220, e => { if (!live()) return; c.z = DECK.z + 18 * (1 - e * e); drawDeck(); }, t => t); if (!live()) return null; c.z = DECK.z; SND.tok();
    await deckTo(STN.rice, 300); if (!live()) return null;
    const a0 = drumA; await UTIL.tween(380, e => { if (!live()) return; drumA = a0 + e * Math.PI / 2; I.drumG.innerHTML = SUB.drum(drumA); }, UTIL.ease.inOut); if (!live()) return null;
    c.s.rice = true; drawDeck(); SND.tok();
    await deckTo(STN.neta, 340); if (!live()) return null;
    await turnTo(k); if (!live()) return null;
    await UTIL.tween(160, e => { if (live()) I.pusherG.innerHTML = SUB.pusher(e); }, t => t); if (!live()) return null; c.s.neta = true; drawDeck(); SND.tok();
    UTIL.tween(160, e => { if (I) I.pusherG.innerHTML = SUB.pusher(1 - e); }, t => t);
    // the torch: the flame flickers between two shapes (redrawn only when the shape changes, and only while it burns)
    if (seared(p.g) && lv.burner) { await deckTo(STN.burn, 300); SND.pour && SND.pour(.5); let fk = -1;
      await UTIL.tween(900, e => { const k = Math.floor(e * 14) % 2; if (k !== fk && I && live()) { fk = k; I.flameG.innerHTML = SUB.flame(true, k); } }, t => t);
      if (I) I.flameG.innerHTML = ''; if (!live()) return null; }
    await deckTo(STN.lift, 360); if (!live()) return null;
    if (lv.dome) { await capIt(); await UTIL.wait(80); if (!live()) return null; }
    // an order with the express lane: the shuttle takes it straight down
    if (order && lv.express) { cur = null; drawDeck(); await ride(p); if (!live()) return null; making = false; return { p, express: true }; }
    // onto the lift and down to the loop, into the first gap that comes round
    cur = null; drawDeck(); lift = { p, z: DECK.z };
    await UTIL.tween(460, e => { if (!live() || !lift) return; lift.z = DECK.z - (DECK.z - LOOP.z - 1) * e; drawLift(); }, UTIL.ease.inOut); if (!live()) return null;
    for (let n = 0; n < 60 && crowded(S_LIFT); n++) { await UTIL.wait(80); if (!live()) return null; }
    const b = { p, k, at: S_LIFT - phase, made: Date.now(), half: false, want: !!order };
    S.belt.push(b); if (I) plateEl(b); lift.p = null; drawLift(); paintDoor();
    UTIL.tween(380, e => { if (lift) { lift.z = LOOP.z + 1 + (DECK.z - LOOP.z - 1) * e; drawLift(); } }, UTIL.ease.inOut).then(() => { lift = null; drawLift(); });
    making = false; return b;
  }
  // the reader arch stamps a stale plate as it goes under
  function stampIt(b) {
    b.half = true;
    UTIL.tween(220, e => { if (I) I.stampG.innerHTML = SUB.stamp(Math.sin(e * Math.PI)); }, t => t);
    setTimeout(() => { if (b.el) { const el = b.el; b.el = null; el.remove(); if (I && S.belt.includes(b)) plateEl(b); } SND.click(); paintDoor(); }, 110);
  }
  // a wanted plate at the exit: the paddle swings it off, down the chute
  async function divert(b) {
    S.belt.splice(S.belt.indexOf(b), 1); if (b.el) { b.el.remove(); b.el = null; }
    UTIL.tween(150, e => { if (I) I.paddleG.innerHTML = SUB.paddle(e); }, t => t).then(() => UTIL.tween(240, e => { if (I) I.paddleG.innerHTML = SUB.paddle(1 - e); }, t => t));
    SND.tok(); await along(b.p, [[...posAt(S_EXIT), LOOP.z], [EXIT + 1, 82, LOOP.z - 2], [EXIT + 4, 82, 44]], 520, { half: b.half, dome: !!lv.dome });
    if (b.res) b.res();
  }
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    let kk = k;
    if (kk == null) { const b = S.belt.find(x => !x.want); kk = b ? b.k : anyCas(); }   // a customer takes one going past, or orders one
    const going = kk >= 0 ? S.belt.find(b => b.k === kk && !b.want) : null;
    if (kk < 0 || (!going && !canMake(kk))) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.su-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, SU.SLOTW);
    let b = going, express = null;
    if (b) { b.want = true; X.lcd.textContent = `${no}番 · レーンからどうぞ`; }
    else { while (making) await UTIL.wait(80); X.lcd.textContent = `${no}番 · 握っています`; const r = await make(kk, true); if (!r) return false; if (r.express) express = r; else b = r; }
    if (b) { await new Promise(res => { b.res = res; setTimeout(res, 16000); });   // at the exit (or the view went away)
      if (S.belt.includes(b)) { S.belt.splice(S.belt.indexOf(b), 1); if (b.el) b.el.remove(); } }
    const p = b ? b.p : express.p, half = b ? b.half || stale(b) : false, price = Math.round(p.price * (half ? .5 : 1));
    if (t) t.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const done = { p, half, no, who }; ready = done; windowPlate(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: p.name, price, pid: p.pid, tier: p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#e8453a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#e8453a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }
  // nothing ordered: keep two plates going round
  function keepShow() {
    if (busy || making || !I || hinge.open || hinge.moving || S.belt.length >= SHOW) return;
    const k = anyCas(); if (k >= 0) make(k, false);
  }

  /* ---------- restock: packs of sliced neta into the turret's cassettes, a sack of rice into the hopper ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const casTop = k => { const t = rot + k * Math.PI * 2 / 5; return [TUR.x + TUR.r * Math.cos(t), TUR.y + TUR.r * Math.sin(t), TUR.z + TUR.h + 4]; };
  const supply = {
    title: T`寿司料`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-su-pack', vars: `--c:${TOPC[m.g] || '#ff8a4a'}`, pos: [9 + j * 11.4, 9 + k * 13, 2], target: 'c' + k }))),
      { glyph: 'g-su-rice', vars: '', pos: [103, 38, 2], target: 'rice' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'rice' ? [HOP.x, HOP.y, HOP.z1 + 8] : casTop(+t.slice(1)),
    accept: t => t === 'rice' ? S.rice < .97 : S.cas[+t.slice(1)].length + beltOf(+t.slice(1)) + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'rice' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'rice' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t !== 'rice' && !ECON.everStocked('sushi', MENU[+t.slice(1)].pid),
    stocks: t => { if (t === 'rice') return []; const k = +t.slice(1); reserved[k]++; return [['sushi', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'rice') {
        const from = S.rice; SND.pour(1);
        UTIL.tween(900, e => { S.rice = from + (1 - from) * e; renderRice(); }).then(() => { SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(118 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut).then(() => el.remove());
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.cas[k].length + beltOf(k) < CAP) { S.cas[k].push(prod(k)); renderTurret(); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target === 'rice') - (b.target === 'rice')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.cas.forEach((l, k) => { for (let j = 0; j < 4; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = SUB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, SU.D, SU.H);
    if (ready) { windowPlate(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the line shows through the door: always drawn)
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; cur = null; lift = null; S.belt.forEach(b => { b.want = false; if (b.res) b.res(); }); }
    I = SUB.interior(G.interior, coinState, lv); SUB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    looks = new Map(); deckEl = liftEl = slabEl = null;
    S.belt.forEach(b => { if (!b.half && stale(b)) b.half = true; });
    renderTurret(); renderRice(); drawMag(); I.drumG.innerHTML = SUB.drum(drumA); drawBelt(); drawDeck(); drawLift(); shell();
    chainLen = 0;
  }
  // (v0.44) the belt runs at 15 Hz while you only see it through the peek window (the door shut, no X-ray): on an
  // iPhone 13 Pro it kept 60 fps either way, but was the busiest machine's main thread (546 ms/s)
  let dev = null;
  function step(now) {
    const near = hinge.open || hinge.moving || (dev || (dev = document.querySelector('.device'))).classList.contains('xr-any');
    if (lastT && now - lastT < 1000 / (near ? BELT_HZ : BELT_HZ / 2) - 2) return;
    const dt = lastT ? Math.min(100, now - lastT) : 16; lastT = now;
    if (!I) return;
    const prev = phase; phase = (phase + dt / LAP) % 1; run += dt / LAP;
    if (!chainLen) chainLen = I.chain._len || 1;
    I.chain.style.strokeDashoffset = f(-(run * chainLen) % 7.2);
    for (const b of S.belt.slice()) {
      const s0 = ((b.at + prev) % 1 + 1) % 1, s1 = sOf(b), crossed = x => s0 <= s1 ? s0 < x && s1 >= x : s0 < x || s1 >= x;
      if (!b.half && crossed(S_LABEL) && stale(b)) stampIt(b);
      if (b.want && crossed(S_EXIT)) { divert(b); continue; }
      place(b);
    }
    if (now > nextPaint) { nextPaint = now + 700; paintDoor(); keepShow(); }
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, SU.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || (!S.belt.length && anyCas() < 0)) return null; vend(null, 'customer'); return T`寿司`; }
  // off screen: customers take a plate going past (the oldest first), or one is made to order
  function idleSell() {
    const b = S.belt.filter(x => !x.want).sort((m, n) => m.made - n.made)[0];
    if (b) { S.belt.splice(S.belt.indexOf(b), 1); if (b.el) b.el.remove(); const half = b.half || stale(b); if (X) paintDoor();
      return { price: Math.round(b.p.price * (half ? .5 : 1)), pid: b.p.pid, name: b.p.name, tier: b.p.tier || 1 }; }
    const k = anyCas(); if (k < 0) return 0;
    const p = takeSlice(k); S.no = S.no % 99 + 1; renderTurret(); renderRice(); if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the line shows through the door's big window, so the insides are always drawn
    id: 'sushi', fig: 11, name: T`回转寿司`, brand: 'すし丸', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#e8453a',
    render: () => render(),
    hint: { shut: T`点触屏点一盘寿司 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看饭团转鼓、料盒转塔和推片器做寿司，升降台放上回转带，读卡拱门给转太久的盘子贴「半額」`, open: T`料包放进转塔的料盒 · 米倒进料斗 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * 5; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ cas: S.cas.map(l => l.map(p => p.pid)), rice: S.rice, belt: S.belt.map(b => ({ pid: b.p.pid, k: b.k, s: sOf(b), made: b.made, half: b.half })), no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.cas)) S.cas = [0, 1, 2, 3, 4].map(k => (d.cas[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      if (Array.isArray(d.belt)) S.belt = d.belt.map(x => { const p = snap(x.pid); return p && { p, k: x.k | 0, at: (+x.s || 0) - phase, made: +x.made || Date.now(), half: !!x.half }; }).filter(Boolean).slice(0, 6);
      ['rice', 'no'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; });
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % 5, 'player'),
    // X-ray tags: per cassette, over its tube on the turret
    labels: () => MENU.map((m, k) => { const p = S.cas[k][0] || m; return { name: p.name, n: S.cas[k].length + beltOf(k), c: TOPC[p.g] || '#ff8a4a', pt: casTop(k) }; }),
    labelStyle: 'mini',
    // goods: five cassettes on the turret; the seared ones need the torch
    goods: {
      kind: 'sushi', defaults: ['tamago', 'kappa', 'inari', 'ika', 'salmon'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.cas[k].length + beltOf(k),
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g })),
    },
    // the special unlock (2026-10-16: unlocks vary): クロ brings the flyer once its 见证 reaches tier 2
    unlock: { open: () => NEKO.state('kuro').status === 'regular' && NEKO.tierOf('kuro') >= 2, hint: () => T`クロ 陪你卖得够多（见证第 2 档）时会叼来传单`,
      card: () => [T`クロ 叼来一张传单`, T`「すし丸」回转寿司开张了：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the domes (the cure), the express lane (faster), the torch (seared goods)
    upgrades: [
      { id: 'dome', name: T`防干燥罩`, cost: [10000], effect: [T`每盘罩上透明罩 · 展示盘 1.5 → 6 分钟才贴「半額」`], kind: T`省心`, pin: [30, LOOP.y1 + 2, LOOP.z + 8],
        fact: T`くら寿司 从 2011 年起给转着的每一盘都罩上抗菌罩「鮮度くん」，盘子带芯片，转了约 350 米还没人拿就自动撤下。` },
      { id: 'express', name: T`特急レーン`, cost: [50000], effect: [T`点的单走直达滑道，不绕圈 · 出餐快约一半`], kind: T`速度`, pin: [EXPRESS[1][0], 80, 70],
        fact: T`现在的回转寿司店点单越来越多走「特急レーン」：触屏点的那一盘沿专用轨道直达座位，转着的那圈反而成了展示。` },
      { id: 'burner', name: T`炙りバーナー`, cost: [80000], effect: [T`加一个炙烤工位 · 能卖炙烤三文鱼、炙烤鳍边、炙烤大腹`], kind: T`新货`, pin: [STN.burn + 2, DECK.y + 5, DECK.z + 5],
        fact: T`炙烤用的是喷枪：只把表面烤出焦香、让油脂化开，里面还是生的。现在几乎每家回转寿司店都有一页炙烤菜单。` },
    ],
    applyParts: l => { lv = { dome: l.dome || 0, express: l.express || 0, burner: l.burner || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n slices of the planned goods into the cassettes
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.cas = d.cas.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length - beltOf(k), n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.rice = 1; me.load(d); return added || 1; };
  // slices left but no rice (and nothing going round): as good as sold out
  me.stuck = () => S.rice <= .02 && !S.belt.length;
})();
