/* Fig 15 behaviour (geometry in m-gacha-build.js). An order: the coin; the big knob on the door and the chosen globe's star
   wheel turn once round together and one capsule — whichever lay in the pocket — drops out of the spout into the gutter,
   rolls to the funnel and down the five ramps of the switchback run, rings the bell and goes down the chute to the
   take-out window, where its clear half shows the figure. One capsule in twelve is the gold secret: it sells for double.
   The flaw: a globe with four capsules or fewer left may bridge over its wheel after a turn; that series stops until it is
   knocked (tap its tile) or restocked. The agitator stirs the capsules apart.
   Nothing moves while nothing happens (perf rule 3); what moves is redrawn 30 times a second (rule 14). */
(() => {
  const { P, f } = ISO;
  const { GLOBES, BASE, GUTTER, RUN, CAPR, WINDOW, MENU } = GC;
  ['neko', 'sushi', 'jihanki', 'dobutsu'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].buy = MENU[k].buy || 80; });   // the starting stock's goods
  const CAP = 12, SLOTS = 4, SECRET = 1 / 12, BONUS = 2, JAMAT = 4, JAMP = .35, HZ = 30;
  let lv = { agitator: 0, steep: 0, jumbo: 0 };
  // glob: the capsules in each globe ({ p: the product, v: the figure's colour, s: secret }); jam: the bridged globes
  const S = { glob: [[], [], [], []], jam: [false, false, false, false], no: 0 };
  const reserved = [0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, making = false, ready = null, gen = 0, nextPaint = 0;
  let gG = [];
  const wheelA = [0, 0, 0, 0], stirA = [0, 0, 0, 0];
  const coinState = [11, 8, 19, 6];

  /* ---------- products, stock ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, cap: m.cap, fig: m.fig, big: !!m.big }; };
  const snap = pid => { const g = pid && ECON.product('gacha', pid); if (!g) return null; const q = ECON.quote('gacha', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, cap: g.cap, fig: g.fig, big: !!g.big }; };
  const fresh = p => ({ p, v: Math.floor(Math.random() * 6), s: Math.random() < SECRET });
  const count = () => S.glob.reduce((a, l) => a + l.length, 0);
  const canMake = k => S.glob[k].length > 0 && !S.jam[k];
  const anyGlobe = () => { const ks = [0, 1, 2, 3].filter(canMake); return ks.length ? UTIL.pick(ks) : -1; };
  // after a turn: a low globe may bridge (not with the agitator)
  const mayJam = k => { if (!lv.agitator && S.glob[k].length > 0 && S.glob[k].length <= JAMAT && Math.random() < JAMP) S.jam[k] = true; };

  /* ---------- drawing ---------- */
  const look = c => ({ cap: c.p.cap, fig: c.p.fig, v: c.v, s: c.s, big: c.p.big });
  const paintGlobe = k => { if (!I || !gG[k]) return; gG[k].innerHTML = GCB.globe(k, S.glob[k].map(look), { agitator: lv.agitator, jumbo: lv.jumbo, lid: (S.glob[k][0] ? S.glob[k][0].p : MENU[k]).cap, wheel: wheelA[k], stir: stirA[k] }); };
  function paintDoor() {
    if (!X) return;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !S.glob[k].length); t.querySelector('.gc-jam').classList.toggle('on', S.jam[k] && S.glob[k].length > 0); });
    if (!busy && !ready) X.lcd.textContent = S.jam.some((j, k) => j && S.glob[k].length) ? 'つまり · トントンしてね' : 'いらっしゃいませ';
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  // the take-out window: the capsule, big, its figure showing through the clear half
  function windowCap(r) {
    const [sx, sy] = P(WINDOW[0], WINDOW[1], WINDOW[2] - .5);
    X.windowG.innerHTML = GCB.capsule(sx, sy, r.big ? 7.4 : 6.2, r.o, -12) + (r.o.s ? `<circle cx="${f(sx)}" cy="${f(sy)}" r="9" fill="none" stroke="#ffd23f" stroke-width="1.2" opacity=".8" vector-effect="non-scaling-stroke"/>` : '');
  }
  // a capsule rolling along a polyline of world points (its centre), turning as it rolls; redrawn at 30 Hz
  function roll(o, big, pts, ms, ease = t => t) {
    const r = big ? CAPR.big : CAPR.n, el = UTIL.g(I.movers, GCB.capsule(0, 0, r * GCB.sr(), o, 0), {}), node = el.firstChild;
    const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1], q[2] - pts[i][2])), tot = seg.reduce((a, b) => a + b, 0);
    let last = 0, done = 0, rot = 0, px = null;
    return UTIL.tween(ms, e => { const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      let d = e * tot, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const u = seg[i] ? d / seg[i] : 0, a = pts[i], b = pts[i + 1], [sx, sy] = P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
      rot += (e * tot - done) / r * 57.3 * (px === null || sx >= px ? 1 : -1); done = e * tot; px = sx;
      node.setAttribute('transform', `translate(${f(sx)} ${f(sy)}) rotate(${f(rot)})`); }, ease).then(() => el.remove());
  }

  /* ---------- the line ---------- */
  // the knob on the door and globe k's wheel turn once round together (the agitator stirs meanwhile)
  async function turn(k, ms) {
    const g0 = gen, [kx, ky] = GCB.KNOB, w0 = wheelA[k], s0 = stirA[k]; let last = 0;
    SND.crank && SND.crank();
    await UTIL.tween(ms, e => { if (g0 !== gen) return; const now = performance.now(); if (now - last < 1000 / HZ - 2 && e < 1) return; last = now;
      if (X) X.knob.setAttribute('transform', `rotate(${f(360 * e)} ${kx} ${ky})`);
      wheelA[k] = w0 + Math.PI * 2 * e; if (lv.agitator) stirA[k] = s0 + Math.PI * 3 * e; paintGlobe(k); }, UTIL.ease.inOut);
    return g0 === gen;
  }
  const gutterZ = x => GUTTER.z1 + (GUTTER.z0 - GUTTER.z1) * (x - GUTTER.x1) / (GUTTER.x0 - GUTTER.x1);
  // one capsule out of globe k: turn, drop into the gutter, roll to the funnel, down the run, the bell, the chute
  async function make(k) {
    making = true;
    const g0 = gen, live = () => g0 === gen;
    const i = Math.floor(Math.random() * S.glob[k].length), Gk = GLOBES[k];
    if (!await turn(k, 650)) return null;
    const c = S.glob[k].splice(i, 1)[0]; paintGlobe(k); paintDoor(); SND.click();
    const o = { cap: c.p.cap, fig: c.p.fig, v: c.v, s: c.s }, big = c.p.big, r = big ? CAPR.big : CAPR.n;
    await roll(o, big, [[Gk.x, Gk.y + BASE.r + .6, BASE.z0 + 1], [Gk.x, GUTTER.y, gutterZ(Gk.x) + r], [GUTTER.x1 + r, GUTTER.y, GUTTER.z1 + r], [RUN.funnel[0], RUN.y, RUN.funnel[2] + 5]], 360 + 6 * (Gk.x - GUTTER.x1), UTIL.ease.in); if (!live()) return null;
    SND.korokoro && SND.korokoro();
    await roll(o, big, GCB.route(lv.steep, big), lv.steep ? 1150 : 2300); if (!live()) return null;
    SND.tick && SND.tick(9);
    await roll(o, big, [[RUN.exit[0], RUN.y, RUN.exit[2] - 8], [RUN.exit[0], RUN.y + 4, 80], [WINDOW[0], 80, 32]], 460, UTIL.ease.in); if (!live()) return null;
    mayJam(k);
    making = false; paintDoor();
    return { p: c.p, o, big };
  }
  // a bridged globe: tap its tile and the machine knocks on it (トントン) — the capsules settle and it runs again
  async function knock(k) {
    if (busy || making) return; busy = true;
    const t = tile(k); if (t) CORE.press(t); SND.clank(); UTIL.haptic([10, 30, 10]);
    FX.pop(16.4 + k * 21.8, GC.D, 206, 'トントン', '#ff5fa2', 12);
    await UTIL.tween(420, e => { if (gG[k]) gG[k].setAttribute('transform', `translate(${f(Math.sin(e * 28) * 1.2 * (1 - e))} 0)`); }, t => t);
    if (gG[k]) gG[k].removeAttribute('transform');
    S.jam[k] = false; busy = false; paintDoor();
  }
  async function vend(k, who) {
    if (busy || making || hinge.open || hinge.moving) return false;
    if (k != null && S.jam[k] && S.glob[k].length) { if (who === 'player') { knock(k); return true; } return false; }
    const kk = k == null ? anyGlobe() : k;
    if (kk < 0 || !canMake(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.gc-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000); X.lcd.textContent = `ご注文 · ${no}番`;
    await I.cm.coinIn(MENU[kk].price, GC.SLOTW);
    X.lcd.textContent = `${no}番 · ガチャ…`;
    const r = await make(kk);
    if (t) t.querySelector('.led').classList.remove('on');
    if (!r) return false;
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    const price = r.o.s ? r.p.price * BONUS : r.p.price;
    const done = { p: r.p, o: r.o, big: r.big, no, who }; ready = done; windowCap(done); X.ready.classList.add('on');
    if (r.o.s) { X.secretLamp.classList.add('on'); X.lcd.textContent = `${no}番 · シークレット!`; SND.chime(); CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 6, 14, '#ffd23f'); }
    else { X.lcd.textContent = `${no}番 · でてきたよ`; SND.ding(); }
    UTIL.haptic(14);
    saleFn({ name: r.p.name, price, pid: r.p.pid, tier: r.p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor(); return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#ff8fb8');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#ff5fa2'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on'); X.secretLamp.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }

  /* ---------- restock: capsules into the four globes (fresh capsules also break a bridge) ---------- */
  const { box, slits, TOP: TOPP } = ISO;
  const crateBack = () => `<g transform="${TOPP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const globeTop = k => { const Gk = GLOBES[k]; return [Gk.x, Gk.y, Gk.z + Gk.r + 4]; };
  const supply = {
    title: T`扭蛋`, unit: T`个`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-gc-cap', vars: `--c:${m.cap}`, pos: [8 + j * 8.6, 13 + k * 15.4, 2], target: k }))),
    back: crateBack, front: crateFront,
    entry: k => globeTop(k),
    accept: k => S.glob[k].length + reserved[k] < CAP,
    cost: k => MENU[k].buy || 0, tier: k => MENU[k].tier || 1,
    isNew: k => !ECON.everStocked('gacha', MENU[k].pid),
    stocks: k => { reserved[k]++; return [['gacha', MENU[k].pid]]; },
    arrive: k => { reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.glob[k].length < CAP) { S.glob[k].push(fresh(prod(k))); S.jam[k] = false; paintGlobe(k); SND.tok(); paintDoor(); }
      return false; },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.glob.forEach((l, k) => { for (let j = 0; j < 6; j++) l.push(fresh(prod(k))); }); render(); }
  function shell() {
    X = GCB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, GC.D, GC.H);
    if (ready) { windowCap(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); if (ready.o.s) X.secretLamp.classList.add('on'); }
    if (X.steepLamp) X.steepLamp.classList.add('on');
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the run shows through the door)
  function render() {
    gen++;
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if ((busy || making) && !ready) { busy = false; making = false; }
    I = GCB.interior(G.interior, coinState, lv); gG = GLOBES.map(() => UTIL.g(I.globesG, '', {}));
    GLOBES.forEach((_, k) => paintGlobe(k));
    GCB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    shell();
  }
  // nothing moves on its own
  function step(now) { if (!I) return; if (now > nextPaint) { nextPaint = now + 700; paintDoor(); } }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, GC.SLOTW); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || making || hinge.open || hinge.moving || anyGlobe() < 0) return null; vend(null, 'customer'); return T`扭蛋`; }
  // off screen: one capsule from a globe that is not bridged (a secret sells for double; a low globe may bridge)
  function idleSell() {
    const k = anyGlobe(); if (k < 0) return 0;
    const c = S.glob[k].splice(Math.floor(Math.random() * S.glob[k].length), 1)[0]; mayJam(k); S.no = S.no % 99 + 1;
    if (I && !making) paintGlobe(k); if (X) paintDoor();
    return { price: c.s ? c.p.price * BONUS : c.p.price, pid: c.p.pid, name: c.p.name, tier: c.p.tier || 1 };
  }
  // a capsule saved as "pid.v" (+ "*" for a secret)
  const enc = c => `${c.p.pid}.${c.v}${c.s ? '*' : ''}`;
  const dec = s => { const m = /^(.+)\.(\d)(\*?)$/.exec(s || ''); const p = m && snap(m[1]); return p ? { p, v: +m[2], s: !!m[3] } : null; };
  MACHINES.push({
    // not opaque: the run shows through the door's window, so the insides are always drawn
    id: 'gacha', fig: 15, name: T`扭蛋`, brand: 'ころころ', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff5fa2',
    render: () => render(),
    hint: { shut: T`点菜单选一种扭蛋 · 卡住时点那一格敲一敲 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看四个扭蛋球：转盘转一圈落下一颗，扭蛋沿锯齿滑道一层层滚到取货口`, open: T`扭蛋补进四个扭蛋球 · 卡住的球补了货就通了 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy || making) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * SLOTS; },
    isBusy: () => busy || making, prepare: () => { if (ready) take(true); },
    save: () => ({ glob: S.glob.map(l => l.map(enc)), jam: S.jam.slice(), no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.glob)) S.glob = [0, 1, 2, 3].map(k => (d.glob[k] || []).slice(0, CAP).map(x => typeof x === 'string' && x.includes('.') ? dec(x) : (() => { const p = snap(x); return p && fresh(p); })()).filter(Boolean));
      if (Array.isArray(d.jam)) S.jam = [0, 1, 2, 3].map(k => !!d.jam[k]);
      if (typeof d.no === 'number') S.no = d.no;
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % SLOTS, 'player'),
    // X-ray tags: per globe, over its lid
    labels: () => MENU.map((m, k) => { const p = (S.glob[k][0] || {}).p || m; return { name: p.name, n: S.glob[k].length, c: p.cap, pt: globeTop(k) }; }),
    labelStyle: 'mini',
    // goods: one series per globe; the jumbo ones need the jumbo wheels
    goods: {
      kind: 'gacha', defaults: ['neko', 'sushi', 'jihanki', 'dobutsu'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.glob[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, cap: g.cap, fig: g.fig, big: !!g.big })),
    },
    // the special unlock: the 「杂货全集」 album series complete (socks, rain boots, key rings: all things that fit in a capsule)
    unlock: { open: () => { const s = COLLECT.SERIES.find(x => x.id === 'goods'); return !!s && COLLECT.progress(s).done; }, hint: () => T`集齐图鉴里的「杂货全集」`,
      card: () => [T`杂货全集集齐了：袜子、雨靴、钥匙圈……全是装得进扭蛋的东西`, T`街角来了一座扭蛋塔「ころころ」：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] },
    // upgrades (改造): the agitator (the cure), the steep rails (faster), the jumbo wheels (new goods)
    upgrades: [
      { id: 'agitator', name: T`つまり防止の撹拌棒`, cost: [12000], effect: [T`每个扭蛋球里装一根搅拌棒 · 快空时也不会卡住`], kind: T`省心`, pin: [GLOBES[1].x, GLOBES[1].y, GLOBES[1].z + 14],
        fact: T`料斗快空的时候，最后几颗容易互相顶住，在出口上方搭成一座拱桥，下面就空了，叫「架桥」；搅拌棒就是用来把它搅散的。` },
      { id: 'steep', name: T`急勾配レール`, cost: [50000], effect: [T`千斤顶把洞洞板顶斜 · 滑道更陡，扭蛋滚下来的时间少一半`], kind: T`速度`, pin: [19, 68, 96],
        fact: T`伽利略让铜球从斜面上滚下来研究加速度：坡越陡，同样的距离滚得越快。` },
      { id: 'jumbo', name: T`ジャンボホイール`, cost: [80000], effect: [T`换上大号转盘 · 能卖大扭蛋（ジャンボおすし、ジャンボねこ、ジャンボきょうりゅう）`], kind: T`新货`, pin: [GLOBES[3].x, GLOBES[3].y + 8, BASE.z0 - 6],
        fact: T`早年的扭蛋直径只有 3 厘米左右，现在常见的是 5 厘米；再大的 6.5、7.5 厘米扭蛋叫「ジャンボ」，价钱也高一截。` },
    ],
    applyParts: l => { lv = { agitator: l.agitator || 0, steep: l.steep || 0, jumbo: l.jumbo || 0 }; },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n capsules of the planned series (fresh ones break
  // any bridge)
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { let added = 0;
    S.glob.forEach((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); for (let j = 0; j < add; j++) l.push(fresh(prod(k))); added += add; if (add) S.jam[k] = false; });
    if (added) { const d = me.save(); me.load(d); } return added || 1; };
  // capsules left but every globe with any is bridged: as good as sold out
  me.stuck = () => count() > 0 && [0, 1, 2, 3].every(k => !S.glob[k].length || S.jam[k]);
})();
