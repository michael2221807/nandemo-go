/* Fig 7 behaviour: coin -> the gantry's arm runs along the rail to the item's cell, reaches in, grips the box, backs out,
   carries it to the lift in the middle and lets go -> the lift goes down -> the drawer -> the box opens in the window
   (each gadget looks like itself; a junk box is a bag of random parts, different every time).
   The flaw: the touchscreen's old PC freezes every so many sales (25 at first): the screen shows 再起動中 and a bar for
   20 s (real time, off screen too), then the gantry homes once before it sells again. The new controller board cures it.
   With the second arm each arm keeps to its half of the shelves, so the nearer one fetches. */
(() => {
  const { P, f } = ISO;
  const { GRID, cell, RAIL, REACH_Y, SAFE_Z, LIFT, WINDOW, MENU } = PK;
  ['cable', 'charger', 'sdcard', 'junk', 'keycap'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 80; });   // the starting menu
  const LIMIT = [25, 80, Infinity], REBOOT_MS = 20000, COLS = 5;
  let lv = { ctrl: 0, arm2: 0, charger: 0 };
  // cells[row][col]: one boxed product (or null); each row is one menu item. uptime: sales since the last boot
  const S = { cells: Array.from({ length: 5 }, () => Array(COLS).fill(null)), uptime: 0, bootUntil: 0, sold: 0 };
  const reserved = [0, 0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null, nextPaint = 0, wasBooting = false;
  const coinState = [14, 7, 20, 4];
  // the arms: where each gripper is (x along the rail, hy reach, hz height) and what it holds; ret = its trip home
  const arms = [{ x: 34, hy: REACH_Y, hz: SAFE_Z, box: null, ret: null }, { x: PK.PARK[1], hy: REACH_Y, hz: SAFE_Z, box: null, ret: null }];
  const armsOn = () => lv.arm2 ? arms : [arms[0]];
  const parkX = i => lv.arm2 ? [16, 52][i] : 34;

  /* ---------- products and stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, fill: m.fill, g: m.g }; };
  const snap = pid => { const g = pid && ECON.product('digital', pid); if (!g) return null; const q = ECON.quote('digital', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, fill: g.fill, g: g.g }; };
  const countRow = k => S.cells[k].filter(Boolean).length;
  const count = () => S.cells.reduce((s, r) => s + r.filter(Boolean).length, 0);
  const anyRow = () => { const ks = [0, 1, 2, 3, 4].filter(countRow); return ks.length ? UTIL.pick(ks) : -1; };
  const booting = () => Date.now() < S.bootUntil;
  const canSell = () => !booting() && count() > 0;
  // a sale counts toward the next freeze; on the limit the screen locks up and the PC reboots
  function tick() {
    S.uptime++; S.sold++;
    if (S.uptime < LIMIT[lv.ctrl || 0]) return;
    S.uptime = 0; S.bootUntil = Date.now() + REBOOT_MS; wasBooting = true;
    if (X) { X.boot.style.display = ''; X.bootText.textContent = 'フリーズ…'; X.bootText.classList.add('err'); SND.buzz();
      setTimeout(() => { if (X) { X.bootText.textContent = 'PICO-OS 再起動中…'; X.bootText.classList.remove('err'); } paintDoor(); }, 800); }
  }

  /* ---------- drawing ---------- */
  const tileOf = k => X.tiles.find(t => +t.dataset.k === k);
  function renderRow(k) { if (!I) return; I.rows[k].innerHTML = S.cells[k].map((p, c) => p ? PKB.use('g-gbox', p, ...cell(k, c)) : '').join(''); }
  const renderRows = () => { for (let k = 0; k < 5; k++) renderRow(k); };
  const drawGantry = () => { if (I) I.gantry.innerHTML = PKB.gantry(armsOn()); };
  function paintDoor() {
    const b = booting();
    X.tiles.forEach(t => t.querySelector('.soldout').classList.toggle('on', !countRow(+t.dataset.k)));
    X.reboot.classList.toggle('on', b);
    if (b) { const left = Math.max(0, S.bootUntil - Date.now()); X.boot.style.display = ''; X.bootBar.setAttribute('width', f(60 * (1 - left / REBOOT_MS))); X.bootLeft.textContent = `あと ${Math.ceil(left / 1000)} 秒`; }
    else if (!X.bootText.classList.contains('err')) X.boot.style.display = 'none';
    if (I && I.hdd) I.hdd.classList.toggle('blink', b);
  }
  // in the window: the closed box, then opened; gadgets are small, so they are shown larger
  const BIG = 1.6;
  const sc = (sx, sy, s) => `translate(${f(sx)} ${f(sy)}) scale(${f(s)}) translate(${f(-sx)} ${f(-sy)})`;
  const opened = r => r.p.g === 'junk' ? PKB.bagOf(r.seed, ...WINDOW) : PKB.use('g-pko-' + r.p.g, r.p, ...WINDOW);
  const openScale = r => r.p.g === 'junk' ? 1 : BIG;   // the junk bag is already big enough to fill the window
  function windowItem(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g class="pk-pack" transform="${sc(sx, sy, r.open ? openScale(r) : 1.2)}">${r.open ? opened(r) : PKB.use('g-gbox', r.p, ...WINDOW)}</g>`;
  }
  function unbox(r) {
    if (ready !== r || r.open) return;
    r.open = true;
    const [sx, sy] = P(...WINDOW), g = X.windowG, old = g.querySelector('.pk-pack');
    const neu = UTIL.g(g, opened(r), { class: 'pk-pack', opacity: 0 });
    SND.capOpen(); UTIL.haptic(8); CORE.sparkle(WINDOW[0], WINDOW[1], WINDOW[2] + 8, 7, r.p.g === 'mystery' ? r.p.fill : '#3ff4ff');
    UTIL.tween(320, e => { const b = 1 + 1.7 * Math.pow(e - 1, 3) + .7 * Math.pow(e - 1, 2);
      if (old) { old.setAttribute('transform', sc(sx, sy, 1.2 + .2 * e)); old.setAttribute('opacity', f(1 - e)); }
      neu.setAttribute('transform', sc(sx, sy, (.6 + .4 * b) * openScale(r))); neu.setAttribute('opacity', f(Math.min(1, e * 2))); }, t => t)
      .then(() => { if (ready === r) windowItem(r); });
  }

  /* ---------- the run ---------- */
  const at = (x, y, z) => { const [sx, sy] = P(x, y, z); return `translate(${f(sx)} ${f(sy)})`; };
  const lerp = (a, b, e) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e];
  const moveG = (el, a, b, ms, ease = UTIL.ease.inOut) => UTIL.tween(ms, e => el.setAttribute('transform', at(...lerp(a, b, e))), ease);
  const slide = (el, dz, ms, back = false) => { const [, sy] = P(0, 0, dz); return UTIL.tween(ms, e => el.setAttribute('transform', `translate(0 ${f(sy * (back ? 1 - e : e))})`), UTIL.ease.inOut); };
  // an arm moves its gripper (rail x, reach, height together); the time follows the distance
  function moveArm(a, to, k = 1) {
    const from = { x: a.x, hy: a.hy, hz: a.hz }, dist = Math.abs(to.x - from.x) + Math.abs(to.hy - from.hy) + Math.abs(to.hz - from.hz);
    SND.solenoid();
    return UTIL.tween((180 + dist * 9.5) * k * (lv.arm2 ? .85 : 1), e => { a.x = from.x + (to.x - from.x) * e; a.hy = from.hy + (to.hy - from.hy) * e; a.hz = from.hz + (to.hz - from.hz) * e; drawGantry(); }, UTIL.ease.inOut);
  }
  const home = (a, i) => (a.ret = moveArm(a, { x: parkX(i), hy: REACH_Y, hz: SAFE_Z }).then(() => { a.ret = null; }));
  // the arm and cell for a row: the nearest filled cell to whichever arm is closest
  function choose(k) {
    let best = null;
    armsOn().forEach((a, i) => S.cells[k].forEach((p, c) => { if (!p) return; const d = Math.abs(parkX(i) - cell(k, c)[0]); if (!best || d < best.d) best = { a, i, c, d }; }));
    return best;
  }
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    if (booting()) { [0, 1, 2, 3].forEach(i => setTimeout(() => X.reboot.classList.toggle('on'), i * 110)); setTimeout(paintDoor, 480); if (who === 'player') SND.buzz(); return false; }
    const kk = k == null ? anyRow() : k;
    if (kk < 0 || !countRow(kk)) { const t = k != null && tileOf(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const { a, i, c } = choose(kk), p = S.cells[kk][c], tile = tileOf(kk);
    if (tile) { tile.querySelector('.led').classList.add('on'); CORE.glow(tile.querySelector('.pk-tglow'), 1600, .5); }
    if (who === 'player') SND.beep();
    CORE.glow(X.slotGlow, 1000);
    await I.cm.coinIn(p.price, PK.SLOTW);
    if (a.ret) await a.ret;
    I.hdd.classList.add('on');
    // to the cell, reach in, grip, back out
    const [cx, , cz] = cell(kk, c);
    await moveArm(a, { x: cx, hy: REACH_Y, hz: cz + 7 });
    await moveArm(a, { x: cx, hy: GRID.y, hz: cz + 7 }, 1.2);
    S.cells[kk][c] = null; a.box = p; renderRow(kk); drawGantry(); SND.click(); UTIL.haptic(5);
    await moveArm(a, { x: cx, hy: REACH_Y, hz: cz + 8 }, 1.2);
    // over to the lift, let go
    await moveArm(a, { x: LIFT.x, hy: LIFT.y, hz: LIFT.top + 7 });
    a.box = null; drawGantry(); SND.tok();
    home(a, i);
    I.hdd.classList.remove('on');
    const el = UTIL.g(I.movers, `<use href="#g-gbox" style="${PKB.vars(p)}"/>`, {}), top = [LIFT.x, LIFT.y, LIFT.top], bot = [LIFT.x, LIFT.y, LIFT.bottom];
    el.setAttribute('transform', at(...top));
    await Promise.all([slide(I.lift, LIFT.bottom - LIFT.top, 420), moveG(el, top, bot, 420)]);
    await moveG(el, bot, [WINDOW[0], WINDOW[1] - 2, WINDOW[2] - 2], 240, UTIL.ease.out);
    el.remove();
    slide(I.lift, LIFT.bottom - LIFT.top, 480, true).then(() => I.lift.removeAttribute('transform'));
    if (tile) tile.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * e)})`), UTIL.ease.out);
    const r = ready = { p, who, k: kk, open: false, seed: S.sold + 1 };
    windowItem(r); X.ready.classList.add('on'); SND.ding(); UTIL.haptic(14);
    setTimeout(() => unbox(r), 420 / UTIL.speed);
    saleFn({ name: p.name, price: p.price, pid: p.pid, tier: p.tier || 1 }, who);
    tick();
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready && ready.p === p) take(true); }, 7000);
    paintDoor();
    return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#3ff4ff');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 20, r.p.name, '#3ff4ff'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-56 * e + 22 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(-8.6 * (1 - e))})`), UTIL.ease.in);
    busy = false;
  }
  // after a reboot the gantry finds its origin once (all the way to the left and up) before it sells again
  async function homing() {
    if (!I || busy) return;
    busy = true; SND.beep();
    await Promise.all(armsOn().map(a => moveArm(a, { x: RAIL.x0 + 4, hy: REACH_Y, hz: RAIL.z - 8 }, .7)));
    await Promise.all(armsOn().map((a, i) => moveArm(a, { x: parkX(i), hy: REACH_Y, hz: SAFE_Z }, .7)));
    busy = false;
  }

  /* ---------- restock: a box into a cell, one by one ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="96" height="62" rx="2"/>${slits(8, 88, 8, 2, 60, true, 'crrib')}</g>` + box(0, 0, 0, 96, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const crateFront = () => box(0, 59.5, 0, 96, 2.5, 8, 0, 'cr') + box(93.5, 2.5, 0, 2.5, 57, 8, 0, 'cr');
  const freeCell = k => S.cells[k].indexOf(null);
  const supply = {
    title: T`小盒子`, unit: T`盒`, gap: 70, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [96, 0, 0], [0, 62, 0], [96, 62, 0], [0, 0, 24], [96, 0, 24]],
    slots: () => MENU.flatMap((m, k) => Array.from({ length: COLS }, (_, j) => ({ glyph: 'g-gbox', vars: PKB.vars(m), pos: [12 + j * 18, 8 + k * 11.4, 2], target: 'r' + k }))),
    back: crateBack, front: crateFront,
    entry: t => { const k = +t.slice(1), c = Math.max(0, freeCell(k)), [x, y, z] = cell(k, c); return [x, y + 4, z + 12]; },
    accept: t => { const k = +t.slice(1); return countRow(k) + reserved[k] < COLS; },
    cost: t => MENU[+t.slice(1)].buy || 0,
    tier: t => MENU[+t.slice(1)].tier || 1,
    isNew: t => !ECON.everStocked('digital', MENU[+t.slice(1)].pid),
    // called once a box is paid for: its cell is held so boxes still in the air cannot overfill a shelf
    stocks: t => { const k = +t.slice(1); reserved[k]++; return [['digital', MENU[k].pid]]; },
    arrive: t => {
      const k = +t.slice(1), c = freeCell(k); reserved[k] = Math.max(0, reserved[k] - 1);
      if (c >= 0) { S.cells[k][c] = prod(k); renderRow(k); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) for (let k = 0; k < 5; k++) for (let c = 0; c < 3; c++) S.cells[k][c] = prod(k); render(); }
  function shell() {
    X = PKB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, PK.D, PK.H);
    if (ready) { windowItem(ready); X.flap.setAttribute('transform', 'translate(0 -8.6)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the grid shows through the door: always drawn)
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) { busy = false; armsOn().forEach((a, i) => { a.box = null; a.ret = null; a.x = parkX(i); a.hy = REACH_Y; a.hz = SAFE_Z; }); }   // a run cut short by a redraw: already counted as sold
    I = PKB.interior(G.interior, coinState, lv); PKB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderRows(); drawGantry(); shell(); wasBooting = booting();
  }
  function step(now) {
    if (now < nextPaint) return; nextPaint = now + 400;
    const b = booting(); paintDoor();
    if (wasBooting && !b) homing();
    wasBooting = b;
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 124]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, PK.SLOTW); return true; }
    if (t === 'ic') { SND.beep(); FX.pop(105, PK.D, 136, T`哔`, 'var(--cyan)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    if (t === 'cup') { SND.coin(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || !canSell()) return null; vend(null, 'customer'); return T`小玩意`; }
  function idleSell() {
    if (!canSell()) return 0;
    const k = anyRow(), c = S.cells[k].findIndex(Boolean), p = S.cells[k][c];
    S.cells[k][c] = null; tick();
    if (I) renderRow(k);
    if (X) paintDoor();
    return { price: p.price, pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the shelves and the gantry show through the door's window, so the insides are always drawn
    id: 'digital', fig: 7, name: T`数码小物`, brand: 'ピコ堂', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#3ff4ff',
    render: () => render(),
    hint: { shut: T`点触屏上的商品或点机器招呼客人 · 左右拖动转视角 · 点门锁开门补货`, xray: T`看龙门架的机械臂取盒子、托链跟着弯、升降台送到取货口 · 死机时看电脑灯闪`, open: T`一盒一盒放进格子 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return 25; },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    // customers: the side charging station brings more people by (the app scales this machine's customer rate)
    get traffic() { return lv.charger ? 1.35 : 1; },
    save: () => ({ cells: S.cells.map(r => r.map(p => p ? p.pid : null)), uptime: S.uptime, bootUntil: S.bootUntil, sold: S.sold, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.cells)) S.cells = [0, 1, 2, 3, 4].map(k => Array.from({ length: COLS }, (_, c) => snap((d.cells[k] || [])[c])));
      ['uptime', 'bootUntil', 'sold'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; });
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % 5, 'player'),
    // X-ray tags: per shelf, over its first box
    labels: () => [0, 1, 2, 3, 4].map(k => { const c = S.cells[k].findIndex(Boolean), p = c >= 0 ? S.cells[k][c] : prod(k), [x, y, z] = cell(k, Math.max(0, c));
      return { name: p.name, n: countRow(k), c: p.fill, pt: [x, y + 2, z + 9] }; }),
    // goods: one product per shelf, five boxes a shelf
    goods: {
      kind: 'digital', defaults: ['cable', 'charger', 'sdcard', 'junk', 'keycap'],
      get slots() { return MENU.map(() => ({ cap: COLS })); },
      units: k => countRow(k),
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, fill: g.fill, g: g.g })),
    },
    // upgrades (改造): a controller that stops freezing, a second arm, a charging station on the side
    upgrades: [
      { id: 'ctrl', name: T`新控制板`, cost: [30000, 300000], effect: [T`卖 25 → 80 件才死机一次`, T`再也不死机`], kind: T`省心`, pin: [23, 44, 30],
        fact: T`JR 东日本的 acure 次世代自贩机用 47 英寸触屏代替样品和按钮，按季节、时段、气温推荐饮料，售罄的商品可以远程换掉。` },
      { id: 'arm2', name: T`第二机械臂`, cost: [80000], effect: [T`两条臂分左右取货 · 出货快约 30%`], kind: T`速度`, pin: [64, 75, 216],
        fact: T`机器人拣货正在进自贩机和小店：auミニッツストア 由机器人包办补货、拣货、装袋；そばロボット 用两条机械臂，每小时能做约 150 份。` },
      { id: 'charger', name: T`侧面充电站`, cost: [50000], effect: [T`路人停下来充电 · 客人多约 35% · 侧柜多备 9 盒，卖空的时间不变`], kind: T`客流`, pin: [112, 44, 118],
        fact: T`羽田机场 2014 年的配件自贩机卖充电宝、耳机、SD 卡等 55 种商品，触屏日英双语，机身侧面就带着充电站。` },
    ],
    applyParts: l => { lv = { ctrl: l.ctrl || 0, arm2: l.arm2 || 0, charger: l.charger || 0 };
      armsOn().forEach((a, i) => Object.assign(a, { x: parkX(i), hy: REACH_Y, hz: SAFE_Z, box: null, ret: null })); },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.cells = d.cells.map((row, k) => row.map(pid => { if (pid || added >= n) return pid; added++; return MENU[k].pid; }));
    if (added) me.load(d); return added; };
})();
