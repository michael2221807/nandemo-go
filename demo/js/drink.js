/* Fig 1 behaviour: the full vend sequence (coin -> validator -> tube -> signal -> pedal -> belt -> chute -> tray),
   the rack settling one slot, restocking from the loader, roulette, coin tubes and ambient motion. */
const DRINK = (() => {
  const { P, f } = ISO;
  const { LANES, GAP, at, colX, R } = DK;   // DK.CAP / DK.TOTAL change with the rack upgrade
  const lanes = LANES.map(() => ({ cans: [], busy: false, loading: false }));
  const coins = [18, 9, 26, 6];
  const anims = new Set(), dirty = new Set(), parts = [];
  let I, X, fxLayer, root, trayItems = [], saleFn = () => {}, beltUntil = 0, beltDash = 0, rollA = 0, fanA = 0, fanFast = 0, ledT = 0, busyDigits = false;

  /* ---------- the front door ---------- */
  const OPEN = 62 * Math.PI / 180;
  let doorA = 0, doorOpen = false, doorMoving = false;
  function setDoor(a) {
    doorA = a; X.door.setAttribute('transform', DKB.doorTransform(a));
    const back = a > Math.PI / 2 - ISO.alpha, shut = a < .002;
    X.doorOut.style.display = back ? 'none' : ''; X.doorIn.style.display = back ? '' : 'none';
    X.disp3d.style.display = shut ? '' : 'none'; X.flat.style.display = shut ? 'none' : ''; X.trayOut.style.display = shut ? '' : 'none';
  }
  async function door(open) {
    if (open === doorOpen || doorMoving) return false;
    doorMoving = true;
    while (open && lanes.some(L => L.busy)) await UTIL.wait(120);   // let a sale in progress finish
    doorOpen = open;
    const from = doorA, to = open ? OPEN : 0;
    if (open) { SND.doorOpen(); UTIL.haptic(12); }
    await UTIL.tween(open ? 760 : 560, e => setDoor(from + (to - from) * e), open ? UTIL.ease.out : UTIL.ease.in);
    if (!open) { SND.doorClose(); UTIL.haptic(22); jolt(); }
    doorMoving = false;
    return true;
  }
  /* ---------- loading single cans from the crate ---------- */
  const isFull = k => lanes[k].cans.length >= DK.CAP;
  const entryPoint = k => [colX(k), 14, 236];
  function receive(k) {
    const L = lanes[k];
    if (L.cans.length >= DK.CAP) return false;
    const target = L.cans.length * GAP, c = addCan(k, DK.TOTAL), dur = (DK.TOTAL - target) / .3, slot = L.cans.length - 1;
    animate(c, target, dur, 0, t => t);
    setTimeout(() => {
      SND.load(slot % 10); UTIL.haptic(4);
      if (L.cans.length >= DK.CAP && !L.fullShown) { L.fullShown = true; SND.chime(); FX.pop(colX(k), 40, 248, T`满`, `var(--${LANES[k].c})`, 13); }
    }, dur);
    paintButtons();
    return true;
  }

  // every can carries its own product (p): a lane can hold old goods in front and newly planned goods behind them
  const glyph = p => p.kind === 'bottle' ? 'g-bottle' : 'g-can';
  const vars = p => `--c:var(--${p.c});--cap:var(--${p.cap || 'ice'})`;
  const prod = k => { const L = LANES[k]; return { pid: L.pid, name: L.name, price: L.price, buy: L.buy, tier: L.tier, kind: L.kind, c: L.c, cap: L.cap }; };
  // a saved can: its product at today's prices
  const snap = pid => { const g = pid && ECON.product('drink', pid); if (!g) return null; const q = ECON.quote('drink', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, kind: g.kind, c: g.c, cap: g.cap }; };
  const setXY = (el, x, y, z) => { const [sx, sy] = P(x, y, z); el.setAttribute('x', f(sx)); el.setAttribute('y', f(sy)); };
  function place(c) { const [y, z] = at(c.s); c.y = y; c.z = z; setXY(c.el, colX(c.k), y, z); }
  function addCan(k, s, p = prod(k)) { const c = { k, s, p, el: UTIL.el('use', { href: '#' + glyph(p), style: vars(p), class: 'hit', 'data-hit': 'lane', 'data-k': k }, I.cansAll) }; place(c); lanes[k].cans.push(c); dirty.add(k); return c; }
  const front = L => L.cans.slice().sort((a, b) => a.s - b.s)[0];
  // painter order of the cans; only the ones out of place are moved (re-inserting all 200 every frame was the main cost of a restock)
  function sortAll() {
    const want = lanes.flatMap(L => L.cans).sort((a, b) => ISO.key(colX(a.k), a.y, a.z) - ISO.key(colX(b.k), b.y, b.z)), box = I.cansAll;
    for (let i = 0; i < want.length; i++) { const el = want[i].el; if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null); }
  }
  function animate(c, to, dur, delay = 0, ease = UTIL.ease.inOut) { c.anim = { from: c.s, to, t0: performance.now() + delay, dur, ease }; anims.add(c); }
  function moveCan(el, a, b, ms, ease) { return UTIL.tween(ms, e => setXY(el, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e), ease); }
  const replay = el => UTIL.restart(el);

  /* ---------- coins ---------- */
  function renderTubes() {
    I.tubes.forEach((t, i) => { const h = Math.max(.6, Math.min(40, coins[i] * .95));
      t.g.innerHTML = ISO.rounded(t.x - 2.1, 68.4, 104.5, 4.2, 4.2, h, 2.1, 'coin ' + t.cls) + ISO.rounded(t.x - 2.45, 68.05, 104, 4.9, 4.9, 41, 2.45, 'tubeglass'); });
  }
  async function coinIn(price) {
    const [tx, ty] = P(105, DK.D, 162), coin = UTIL.el('use', { href: '#g-coin' }, fxLayer);
    const sx = tx + 150 * ISO.fwd, sy = ty + 190;
    await UTIL.tween(430, e => { const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e - Math.sin(e * Math.PI) * 70; coin.setAttribute('x', f(x)); coin.setAttribute('y', f(y)); coin.setAttribute('opacity', e > .9 ? (1 - e) * 10 : 1); }, UTIL.ease.out);
    coin.remove(); SND.coin(); UTIL.haptic(6);
    const roll = UTIL.el('use', { href: '#g-coin' }, I.coinG), tr = DK.TRACK;
    SND.coinRoll();
    await UTIL.tween(420, e => { const q = e * (tr.length - 1), i = Math.min(tr.length - 2, Math.floor(q)), t = q - i;
      const u = tr[i][0] + (tr[i + 1][0] - tr[i][0]) * t, v = tr[i][1] + (tr[i + 1][1] - tr[i][1]) * t; setXY(roll, 96 + u, 78.5, 186 - v - 2); }, t => t);
    const ti = price >= 500 ? 3 : 2, tube = DK.TUBES[ti];
    await moveCan(roll, [tube.x, 70.5, 147], [tube.x, 70.5, 106 + Math.min(40, coins[ti] * .95)], 160, UTIL.ease.in);
    roll.remove();
    coins[ti] = Math.min(42, coins[ti] + Math.max(1, Math.floor(price / (ti === 3 ? 500 : 100))));
    if (price % 100) coins[0] = Math.min(42, coins[0] + (price % 100) / 10);
    renderTubes(); SND.click(); replay(I.coinPulse);
  }
  function collectCoins() {
    const keep = [4, 3, 4, 2], from = coins.slice();
    const yen = from.reduce((s, n, i) => s + Math.max(0, n - keep[i]) * DK.TUBES[i].v, 0);
    if (!yen) { SND.clank(); FX.pop(107, 70, 150, T`空的`, 'var(--ink-hi)'); return; }
    SND.cascade(); UTIL.haptic([10, 30, 10, 30, 10]);
    UTIL.tween(800, e => { coins.forEach((_, i) => { coins[i] = Math.round(from[i] + (Math.min(from[i], keep[i]) - from[i]) * e); }); renderTubes(); }, UTIL.ease.inOut)
      .then(() => FX.pop(107, 70, 152, T`回収 ${UTIL.money(yen)}`, 'var(--yellow)', 15));
  }

  /* ---------- the vend sequence ---------- */
  function settle(k) {
    const L = lanes[k]; L.cans.sort((a, b) => a.s - b.s);
    let moved = 0;
    L.cans.forEach((c, i) => { const to = i * GAP; if (Math.abs(c.s - to) > .1) { animate(c, to, 340, i * 24); moved++; } });
    if (moved) SND.settle(Math.min(9, moved));
  }
  function paintButtons() { X.buttons.forEach((b, k) => b.querySelector('.soldout').classList.toggle('on', !lanes[k].cans.length)); }
  async function vend(k, who) {
    const L = lanes[k];
    if (L.busy || L.loading || doorOpen || doorMoving) return false;
    if (!L.cans.length) { soldOut(k, who); return false; }
    L.busy = true; L.fullShown = false;
    const led = X.buttons[k].querySelector('.led'), price = front(L).p.price;   // the can in front sets the price
    if (who === 'player') { SND.click(); CORE.press(X.buttons[k]); }
    glow(X.slotGlow, 1000);
    await coinIn(price);
    // light runs from the coin slot to the button; the sample in the window lights up
    replay(X.dpulses[k]); led.classList.add('on'); setTimeout(() => led.classList.remove('on'), 1100);
    glow(X.shalos[k], 1500, .8);
    replay(I.pulses[k]); I.leds[2].classList.add('on'); setTimeout(() => I.leds[2].classList.remove('on'), 500);
    await UTIL.wait(330);
    L.cans.sort((a, b) => a.s - b.s);
    const c = L.cans.shift(); anims.delete(c);
    I.pedals[k].classList.add('on'); setTimeout(() => I.pedals[k].classList.remove('on'), 420);
    SND.solenoid(); UTIL.haptic(10);
    I.movers.appendChild(c.el); paintButtons();
    setTimeout(() => settle(k), 120);
    await travel(c.el, k);
    SND.gakon(); UTIL.haptic(24); jolt(); flap(); glow(X.trayGlow, 800, .55);
    deliver(c.el, c.p, k, who);
    saleFn(c.p, who);
    if (!busyDigits) roulette(who, k, c.p);
    L.busy = false;
    return true;
  }
  // pedal -> belt -> chute -> tray
  async function travel(el, k) {
    const x0 = colX(k), [y0, z0] = at(0), zb = DK.BELT_Z + R;
    await moveCan(el, [x0, y0, z0], [x0, 70, zb], 180, UTIL.ease.in);
    SND.tok();
    beltUntil = Infinity; SND.belt(true);
    await moveCan(el, [x0, 70, zb], [DK.SHAFT_X, 70, zb], Math.max(160, (DK.SHAFT_X - x0) * 7.5), t => t);
    beltUntil = performance.now() + 120; SND.belt(false);
    await moveCan(el, [DK.SHAFT_X, 70, zb], [DK.SHAFT_X, 72, 60], 230, UTIL.ease.in);
    await moveCan(el, [DK.SHAFT_X, 72, 60], DK.TRAY, 280, UTIL.ease.out);
  }
  const glow = (el, ms, peak = 1) => UTIL.tween(ms, e => el.setAttribute('opacity', f(peak * Math.sin(Math.PI * e))), t => t);
  function flap() { UTIL.tween(420, e => { const s = 1 - .8 * Math.sin(Math.PI * Math.min(1, e * 1.3)); X.flap.setAttribute('transform', `translate(0 184) scale(1 ${f(Math.max(.18, s))}) translate(0 -184)`); }, t => t); }
  function soldOut(k, who) { const b = X.buttons[k].querySelector('.soldout'); [0, 1, 2, 3].forEach(i => setTimeout(() => b.classList.toggle('on'), i * 110)); if (who === 'player') SND.buzz(); }
  function sparkle(x, y, z, n, color) {
    const [sx, sy] = P(x, y, z), k = 1 / (window.CAMSCALE || 1);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * 18, s = (2.4 + Math.random() * 2.4) * k * 1.6, q = s * .26;
      const el = UTIL.el('path', { d: `M0 ${-s}L${q} ${-q}L${s} 0L${q} ${q}L0 ${s}L${-q} ${q}L${-s} 0L${-q} ${-q}Z`, fill: color, class: 'spark' }, fxLayer);
      UTIL.tween(620 + Math.random() * 320, e => { el.setAttribute('transform', `translate(${f(sx + Math.cos(a) * d * e)} ${f(sy + Math.sin(a) * d * e - 8 * e)}) rotate(${f(e * 120)})`); el.setAttribute('opacity', f(1 - e * e)); }, UTIL.ease.out).then(() => el.remove());
    }
  }
  function deliver(inner, p, k, who) {
    const outer = UTIL.el('use', { href: '#' + glyph(p), style: vars(p) }, X.trayOut);
    const item = { inner, outer, k, p, who };
    trayItems.push(item);
    if (trayItems.length > 3) take(trayItems[0], true);
    layoutTray();
    if (who === 'customer') setTimeout(() => takeAway(item), 700);
    else setTimeout(() => take(item, true), 7000);
  }
  function layoutTray() { trayItems.forEach((it, i) => { const off = (trayItems.length - 1 - i) * 16, p = [DK.TRAY[0] - off, DK.TRAY[1], DK.TRAY[2]]; setXY(it.inner, ...p); setXY(it.outer, ...p); }); }
  function take(item, quiet) {
    if (!trayItems.includes(item)) return;
    trayItems = trayItems.filter(i => i !== item);
    if (!quiet) { SND.pop(); UTIL.haptic(8); FX.pop(DK.TRAY[0], DK.TRAY[1] + 7, 60, item.p.name, `var(--${item.p.c})`); }
    UTIL.tween(320, e => { item.inner.setAttribute('opacity', 1 - e); item.outer.setAttribute('opacity', 1 - e); }).then(() => { item.inner.remove(); item.outer.remove(); });
    setTimeout(layoutTray, 330);
  }
  // someone off-screen picks it up: it lifts out of the tray and drifts toward them with a few sparks
  function takeAway(item) {
    if (!trayItems.includes(item)) return;
    trayItems = trayItems.filter(i => i !== item);
    const x0 = +item.outer.getAttribute('x'), y0 = +item.outer.getAttribute('y');
    SND.lift(); sparkle(DK.TRAY[0], DK.TRAY[1] + 4, DK.TRAY[2] + 8, 8, `var(--${item.p.c})`);
    const fw = ISO.fwd;   // drift toward the front of the machine, wherever that is on screen
    UTIL.tween(760, e => { const x = x0 + 30 * fw * e, y = y0 - 62 * e + 26 * e * e;
      [item.inner, item.outer].forEach(el => { el.setAttribute('x', f(x)); el.setAttribute('y', f(y)); el.setAttribute('transform', `rotate(${f(28 * fw * e)} ${f(x)} ${f(y)})`); el.setAttribute('opacity', f(1 - e)); }); }, UTIL.ease.out)
      .then(() => { item.inner.remove(); item.outer.remove(); });
    setTimeout(layoutTray, 60);
  }
  function jolt() { if (!root) return; UTIL.tween(200, e => root.setAttribute('transform', `translate(0 ${f(Math.sin(e * Math.PI * 3) * (1 - e) * 1.2)})`), t => t); }
  // 当たり (user, 2026-10-14): a win doubles this sale's takings; no extra can leaves the machine (goods never run out faster)
  async function roulette(who, k, p) {
    busyDigits = true;
    const win = Math.random() < (who === 'player' ? .14 : .06), near = !win && Math.random() < .35;
    const fin = win ? [7, 7, 7, 7] : near ? [7, 7, 7, 1 + Math.floor(Math.random() * 6)] : [0, 1, 2, 3].map(() => Math.floor(Math.random() * 10));
    if (!win && fin.every(v => v === fin[0])) fin[3] = (fin[3] + 3) % 10;
    X.digits.forEach(d => d.classList.add('on'));
    let stopped = 0; const t0 = performance.now();
    await new Promise(res => { const iv = setInterval(() => {
      X.digits.forEach((d, i) => { if (i >= stopped) d.textContent = Math.floor(Math.random() * 10); });
      if (performance.now() - t0 > 600 + stopped * 260) { X.digits[stopped].textContent = fin[stopped]; stopped++; SND.click(); if (stopped === 4) { clearInterval(iv); res(); } }
    }, 50); });
    if (win) {
      SND.jingle(); UTIL.haptic([20, 40, 20]); FX.pop(105, DK.D, 214, T`中奖！`, 'var(--yellow)', 18); sparkle(105, DK.D, 204, 14, 'var(--yellow)');
      await UTIL.wait(700);
      if (p && p.price) { FX.pop(105, DK.D, 196, T`收入翻倍 +${UTIL.money(p.price)}`, 'var(--yellow)', 13); saleFn({ name: T`中奖 · 收入翻倍`, price: p.price, pid: null, tier: p.tier || 1, bonus: true }, who); }
    }
    setTimeout(() => X.digits.forEach(d => d.classList.remove('on')), win ? 2200 : 1300);
    busyDigits = false;
  }

  /* ---------- restocking from the top loader ---------- */
  async function loadLane(k, base = 0) {
    const L = lanes[k]; if (L.busy || L.loading) return 0;
    const need = DK.CAP - L.cans.length; if (need <= 0) return 0;
    L.loading = true;
    for (let j = 0; j < need; j++) {
      const target = L.cans.length * GAP, c = addCan(k, DK.TOTAL), dur = (DK.TOTAL - target) / .3;
      animate(c, target, dur, 0, t => t);
      const pitch = base + j;
      setTimeout(() => { SND.load(pitch); UTIL.haptic(4); }, dur);
      await UTIL.wait(90);
    }
    paintButtons();
    setTimeout(() => { L.loading = false; }, (DK.TOTAL / .3));
    return need;
  }
  async function loadAll() {
    let total = 0;
    for (let k = 0; k < lanes.length; k++) { const n = DK.CAP - lanes[k].cans.length; if (n > 0 && !lanes[k].busy && !lanes[k].loading) { loadLane(k, k * 2); total += n; await UTIL.wait(160); } }
    if (!total) { FX.pop(60, DK.D, 250, T`满了`, 'var(--blue)'); SND.clank(); return 0; }
    setTimeout(() => { SND.chime(); UTIL.haptic(30); FX.pop(60, DK.D, 250, T`满了`, 'var(--blue)'); }, DK.TOTAL / .3 + 500);
    return total;
  }

  /* ---------- ambient motion ---------- */
  function initParticles() {
    for (let i = 0; i < 16; i++) {
      const hot = i >= 11, el = UTIL.el('circle', { r: hot ? .9 : .75, fill: hot ? 'var(--amber)' : 'var(--ice)' }, I.parts);
      parts.push({ el, hot, x: hot ? UTIL.rand(57, 86) : UTIL.rand(7, 51), y: UTIL.rand(10, 78), z: UTIL.rand(112, 224), v: UTIL.rand(5, 11), ph: Math.random() * 6 });
    }
  }
  function step(now, dt) {
    for (const c of anims) {
      const a = c.anim, t = (now - a.t0) / a.dur;
      if (t < 0) continue;
      c.s = t >= 1 ? a.to : a.from + (a.to - a.from) * a.ease(t);
      place(c); dirty.add(c.k);
      if (t >= 1) { anims.delete(c); c.anim = null; }
    }
    if (dirty.size) { sortAll(); dirty.clear(); }
    // the insides are not drawn (solid door shut, no X-ray): skip their ambient motion
    if (G.interior.style.display === 'none') return;
    if (now < beltUntil) { beltDash -= dt * 26; rollA += dt * 520; I.belt.setAttribute('stroke-dashoffset', f(beltDash)); I.rollers.forEach(r => r.setAttribute('transform', `translate(0 2) rotate(${f(rollA % 360)})`)); }
    fanA += dt * (now < fanFast ? 1300 : 420); I.fan.setAttribute('transform', `translate(15 16) rotate(${f(fanA % 360)})`);
    if (now > ledT) { I.leds[1].classList.toggle('on'); ledT = now + 900; }
    for (const p of parts) {
      p.z += p.v * dt * (p.hot ? 1.3 : 1); if (p.z > 226) { p.z = 112; p.y = UTIL.rand(10, 78); }
      const [sx, sy] = P(p.x + Math.sin(now / 900 + p.ph) * 1.5, p.y, p.z);
      p.el.setAttribute('cx', f(sx)); p.el.setAttribute('cy', f(sy)); p.el.setAttribute('opacity', f(Math.min(1, (p.z - 112) / 20, (226 - p.z) / 20) * (p.hot ? .7 : .55)));
    }
  }

  /* ---------- taps ---------- */
  function tap(hit) {
    const t = hit.dataset.hit, k = +hit.dataset.k;
    if ((doorOpen || doorMoving) && !['tubes', 'fan'].includes(t)) return false;
    switch (t) {
      case 'lane': if (lanes[k].cans.length) vend(k, 'player'); else loadLane(k); return true;
      case 'btn': vend(k, 'player'); return true;
      case 'tray': { const it = trayItems.filter(i => i.who === 'player').pop() || trayItems[trayItems.length - 1]; if (it) take(it); else { SND.clank(); jolt(); } return true; }
      case 'tubes': collectCoins(); return true;
      case 'fan': fanFast = performance.now() + 2500; SND.buzz(); return true;
      case 'coinslot': coinIn(100); return true;
      case 'lever': SND.cascade(); FX.pop(105, DK.D, 128, T`返却`, 'var(--ink-hi)'); return true;
      case 'ic': SND.beep(); FX.pop(105, DK.D, 182, T`哔`, 'var(--cyan)'); return true;
      case 'cup': SND.coin(); return true;
    }
    return false;
  }
  const count = () => lanes.reduce((s, L) => s + L.cans.length, 0);
  function customerBuy() { if (doorOpen || doorMoving) return null; const ks = lanes.map((L, k) => L.cans.length && !L.busy && !L.loading ? k : -1).filter(k => k >= 0); if (!ks.length) return null; const k = UTIL.pick(ks); vend(k, 'customer'); return LANES[k].name; }
  function idleSell() { const ks = lanes.map((L, k) => L.cans.length > 0 ? k : -1).filter(k => k >= 0); if (!ks.length) return 0; const k = UTIL.pick(ks), L = lanes[k];
    L.cans.sort((a, b) => a.s - b.s); const c = L.cans.shift(); c.el.remove(); L.cans.forEach((c2, i) => { c2.s = i * GAP; place(c2); }); dirty.add(k); paintButtons();
    return { price: c.p.price, pid: c.p.pid, name: c.p.name, tier: c.p.tier || 1 }; }

  let G = null;
  function build(g, onSale) { G = g; root = g.root; fxLayer = g.fx; saleFn = onSale; render([22, 9, 26, 14, 4]); }
  // (re)draw everything from the current state: used on first build and whenever the camera yaw changes.
  // counts per lane: a number (that many of the lane's product) or a list front-to-back of products / saved ids
  function render(counts) {
    counts = counts || lanes.map(L => L.cans.slice().sort((a, b) => a.s - b.s).map(c => c.p));
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    anims.clear(); dirty.clear(); parts.length = 0; trayItems = []; doorA = 0; doorOpen = false; doorMoving = false;
    lanes.forEach(L => { L.cans = []; L.busy = false; L.loading = false; });
    I = DKB.interior(G.interior); X = DKB.exterior(G.exterior); CORE.cat(G.exterior, false, [0, 0, 6]); DKB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    I.tubes.forEach(t => { t.g.setAttribute('data-hit', 'tubes'); t.g.classList.add('hit'); });
    I.fan.parentNode.setAttribute('data-hit', 'fan'); I.fan.parentNode.classList.add('hit');
    counts.forEach((n, k) => { const list = Array.isArray(n) ? n : Array.from({ length: Math.max(0, n | 0) }, () => null);
      list.slice(0, DK.CAP).forEach((u, i) => addCan(k, i * GAP, (typeof u === 'string' ? snap(u) : u) || prod(k))); });
    sortAll(); renderTubes(); paintButtons(); initParticles(); setDoor(0);
  }
  // the shell only (exterior and cat): used while the camera turns and the insides are not drawn; they are redrawn
  // in full as soon as they come into view (X-ray, door)
  function renderShell() {
    trayItems.forEach(it => it.inner.remove()); trayItems = [];
    G.exterior.innerHTML = ''; X = DKB.exterior(G.exterior); CORE.cat(G.exterior, false, [0, 0, 6]);
    paintButtons(); setDoor(0);
  }
  function save() { return { lanes: lanes.map(L => L.cans.slice().sort((a, b) => a.s - b.s).map(c => c.p.pid || null)), coins: coins.slice() }; }
  function load(d) {
    if (!d || !Array.isArray(d.lanes)) return;
    if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coins[i] = Math.max(0, Math.min(42, n | 0)); });
    render(d.lanes);
  }
  return { build, render, renderShell, step, tap, vend, loadAll, loadLane, customerBuy, idleSell, count, get capacity() { return DK.CAP * LANES.length; }, save, load, lanes: () => lanes,
    door, receive, isFull, entryPoint, get doorOpen() { return doorOpen; }, get doorMoving() { return doorMoving; }, OPEN };
})();
