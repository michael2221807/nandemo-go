/* Fig 10 behaviour. A ticket: the coin, a 食券 out of the front slot, the kitchen printer prints the order and clips it to
   the rail. A tray with a clean set of bowls drops from the magazine onto the belt. Arm A: lid up, a scoop of rice, a
   ladle of miso soup. Arm B: the main dish from its stack in the warming cabinet (through the fryer, once there is one),
   a 小鉢 from the little fridge. Chopsticks and pickles drop in (and a pudding, with the dessert shelf); the tray goes
   down to the serving window and the number board calls it.
   The flaw: the machine owns only so many sets of bowls. Each set comes back through the 返却口 when its customer has
   eaten, and the dishwasher washes the sets one after another; with none clean the machine waits (洗い物中). Kept in real
   time, so it goes on off screen. The dishwasher upgrade brings more sets and faster washing. */
(() => {
  const { P, f } = ISO;
  const { BELT, STOP, MAG, COOKER, POT, FRYER, KOBACHI, DESSERT, ARM, RAIL, WINDOW, SPOT, place, MENU } = OB;
  ['natto', 'hiyayakko', 'tamagoyaki', 'shogayaki', 'sabamiso', 'nikujaga'].forEach((id, k) => { MENU[k].pid = MENU[k].pid || id; MENU[k].tier = MENU[k].tier || 1; MENU[k].buy = MENU[k].buy || 160; });   // the starting menu
  const CAP = 6, WASH = [{ sets: 6, ms: 15000 }, { sets: 10, ms: 6000 }, { sets: 16, ms: 2500 }], EAT = 20000;
  let lv = { wash: 0, fryer: 0, dessert: 0 };
  // stack: the plates in the warming cabinet per menu place, each its own dish (the oldest goes first, so a new lineup
  // queues behind the old); sets: each set of bowls { back, ready } (when it comes back, when it is clean again; 0 = clean
  // now); washFree: when the dishwasher is next free
  const S = { stack: [[], [], [], [], [], []], rice: .85, miso: .85, sets: [], washFree: 0, no: 0 };
  const reserved = [0, 0, 0, 0, 0, 0];
  let I, X, G = null, hinge, saleFn = () => {}, busy = false, ready = null, nextPaint = 0, lastStep = Date.now(), streams = 0;
  const coinState = [14, 7, 20, 4];
  const fitSets = () => { const n = WASH[lv.wash || 0].sets; while (S.sets.length < n) S.sets.push({ back: 0, ready: 0 }); if (S.sets.length > n) S.sets.length = n; };
  fitSets();

  /* ---------- products, stock, dishes ---------- */
  const prod = k => { const m = MENU[k]; return { pid: m.pid, name: m.name, price: m.price, buy: m.buy, tier: m.tier, g: m.g, c: m.c }; };
  const snap = pid => { const g = pid && ECON.product('teishoku', pid); if (!g) return null; const q = ECON.quote('teishoku', g);
    return { pid, name: g.name, price: q.sell, buy: g.buy, tier: g.tier, g: g.g, c: g.c }; };
  const priceOf = p => Math.round(p.price * (lv.dessert ? 1.3 : 1));
  const cleanSets = () => { const now = Date.now(); return S.sets.filter(s => s.ready <= now).length; };
  const count = () => S.stack.reduce((a, l) => a + l.length, 0);
  const fried = g => ['karaage', 'tonkatsu', 'tempura', 'ebifry'].includes(g);
  const canSell = k => S.stack[k].length > 0 && S.rice > .02 && S.miso > .02 && cleanSets() > 0;
  const anyPlace = () => { const ks = [0, 1, 2, 3, 4, 5].filter(k => S.stack[k].length); return ks.length ? UTIL.pick(ks) : -1; };
  // a set goes out with a meal: back when eaten, clean when the dishwasher has got through it
  function useSet() {
    const now = Date.now(), s = S.sets.find(x => x.ready <= now); if (!s) return;
    const w = WASH[lv.wash || 0].ms; s.back = now + EAT; S.washFree = Math.max(S.washFree, s.back) + w; s.ready = S.washFree;
  }
  const consume = k => { const p = S.stack[k].shift(); S.rice = Math.max(0, S.rice - 1 / 40); S.miso = Math.max(0, S.miso - 1 / 40); useSet(); return p; };

  /* ---------- drawing ---------- */
  const at = (x, y, z) => { const [sx, sy] = P(x, y, z); return `translate(${f(sx)} ${f(sy)})`; };
  function renderStack(k) { if (I) I.stacks[k].innerHTML = OBB.stack(S.stack[k].slice(0, CAP), k); }
  const renderStacks = () => { for (let k = 0; k < 6; k++) renderStack(k); };
  function renderPot() {
    if (!I) return; const lvl = Math.max(0, Math.min(1, S.miso));
    I.potTop.innerHTML = `<path d="${GLY.toD(GLY.ringZ(POT[2] - 6 + 5 * lvl, 5.4, 14, 0, Math.PI * 2, POT[0], POT[1]))}" fill="#c8964a" opacity="${lvl > .02 ? 1 : 0}"/>`;
  }
  // the clean sets in the magazine, the used ones waiting by the dishwasher, the spray while it washes
  function renderDishes() {
    if (!I) return; const now = Date.now(), w = WASH[lv.wash || 0].ms;
    const clean = Math.min(5, cleanSets()), waiting = S.sets.filter(s => s.back <= now && s.ready > now).length, washing = S.sets.some(s => s.ready > now && s.ready - w <= now && s.back <= now);
    I.magG.innerHTML = Array.from({ length: clean }, (_, i) => ISO.rounded(MAG.x - 11, MAG.y - 7, BELT.z + 9 + i * 2.6, 22, 14, 1, 2.4, 'ob-tray')).join('');
    I.dirtyG.innerHTML = Array.from({ length: Math.min(8, waiting) }, (_, i) => ISO.rounded(52, 32, 10 + i * 2.2, 24, 18, 1, 2.4, 'ob-tray dirty')).join('');
    I.spray.innerHTML = washing ? `<g transform="${ISO.FRONT(10, 60.1, 34)}">${[0, 1, 2, 3].map(i => `<path class="ob-water" d="M${4 + i * 5} 1q1 6 -1 12"/>`).join('')}</g>` : '';
    I.spray.parentNode.querySelector('.ob-washled') && I.spray.parentNode.querySelector('.ob-washled').classList.toggle('on', washing);
  }
  function paintDoor() {
    const now = Date.now(), clean = cleanSets(), n = S.sets.length, none = clean === 0;
    X.tiles.forEach(t => { const k = +t.dataset.k; t.querySelector('.soldout').classList.toggle('on', !S.stack[k].length || S.rice <= .02 || S.miso <= .02); });
    X.sets.textContent = `${clean}/${n}`; X.sets.classList.toggle('out', none);
    X.washing.classList.toggle('on', none);
    if (!busy) { if (none) { const next = Math.min(...S.sets.map(s => s.ready)), sec = Math.max(1, Math.ceil((next - now) / 1000)); X.lcd.textContent = `食器を洗っています · あと${sec}秒`; }
      else if (!ready) X.lcd.textContent = 'いらっしゃいませ'; }
  }
  // the arms: where each tool is, what it holds
  const REST = { A: [14, 74, 118], B: [46, 74, 118] };
  const arms = { A: { x: 14, y: 74, z: 118, tool: 'scoop', hold: null }, B: { x: 46, y: 74, z: 118, tool: 'grip', hold: null } };
  const drawArms = () => { if (I) I.arms.innerHTML = OBB.arm(...ARM.A, arms.A.x, arms.A.y, arms.A.z, 1, arms.A.tool, arms.A.hold) + OBB.arm(...ARM.B, arms.B.x, arms.B.y, arms.B.z, -1, arms.B.tool, arms.B.hold); };
  function moveArm(a, x, y, z, ms = 240) {
    const A = arms[a], fx = A.x, fy = A.y, fz = A.z;
    return UTIL.tween(ms, e => { A.x = fx + (x - fx) * e; A.y = fy + (y - fy) * e; A.z = fz + (z - fz) * e; drawArms(); }, UTIL.ease.inOut);
  }
  // the tray on the belt and its ticket on the rail
  let cur = null;   // { p, s: parts so far, x, z }
  const drawTray = () => { if (!I) return; I.trays.innerHTML = cur ? OBB.tray(cur.p, cur.s, cur.x, BELT.y, cur.z) : ''; drawTicket(); };
  function drawTicket() {
    if (!I) return; if (!cur || cur.tx == null) { I.tickets.innerHTML = ''; return; }
    const h = cur.th == null ? 9 : cur.th;
    I.tickets.innerHTML = `<g transform="${ISO.FRONT(cur.tx - 3.4, RAIL.y + 1.2, RAIL.z + 1)}"><rect x="2.4" y="-1.6" width="2" height="2.4" fill="#8a93a4"/><rect width="6.8" height="${f(h)}" fill="#fffdf6" stroke="rgba(0,0,0,.35)" stroke-width=".4" vector-effect="non-scaling-stroke"/>${h > 7 ? `<text x="3.4" y="4" font-size="2.6" text-anchor="middle" fill="#141018" font-family="var(--num)">${cur.no}</text><path d="M1 5.8h4.8M1 7.2h3.6" stroke="#8a93a4" stroke-width=".4"/>` : ''}</g>`;
  }
  async function belt(to, ms) {
    const from = cur.x, d0 = +(I.stripes.dataset.o || 0); SND.belt && SND.belt(true);
    await UTIL.tween(ms, e => { cur.x = from + (to - from) * e; cur.tx = cur.x; drawTray(); I.stripes.style.strokeDashoffset = f(d0 - (to - from) * e * 1.6); }, UTIL.ease.inOut);
    I.stripes.dataset.o = d0 - (to - from) * 1.6; SND.belt && SND.belt(false);
  }
  const tile = k => X.tiles.find(t => +t.dataset.k === k);
  function windowTray(r) {
    const [sx, sy] = P(...WINDOW);
    X.windowG.innerHTML = `<g transform="translate(${f(sx)} ${f(sy)}) scale(1.15) translate(${f(-sx)} ${f(-sy)})">${OBB.tray(r.p, r.s, ...WINDOW)}</g>` + [[-6, .1], [-1, .5], [4, .3]].map(([dx, d]) => `<path class="steam" style="animation-delay:${d}s" d="M${f(sx + dx)} ${f(sy - 10)}q-1.6-3 0-6t0-6" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`).join('');
  }

  /* ---------- the run ---------- */
  const spot = (k, dz = 0) => { const [u, v] = SPOT[k]; return [cur.x + u, BELT.y + v, BELT.z + 7 + dz]; };
  async function vend(k, who) {
    if (busy || hinge.open || hinge.moving) return false;
    const kk = k == null ? anyPlace() : k;
    if (cleanSets() === 0) { [0, 1, 2, 3].forEach(i => setTimeout(() => X.washing.classList.toggle('on'), i * 110)); setTimeout(paintDoor, 480); if (who === 'player') SND.buzz(); return false; }
    if (kk < 0 || !canSell(kk)) { const t = k != null && tile(k); if (t) { const s = t.querySelector('.soldout'); [0, 1, 2, 3].forEach(n => setTimeout(() => s.classList.toggle('on'), n * 110)); } if (who === 'player') SND.buzz(); return false; }
    busy = true;
    const p = S.stack[kk][0], price = priceOf(p), t = tile(kk), no = (S.no = S.no % 99 + 1);
    if (t) { t.querySelector('.led').classList.add('on'); CORE.glow(t.querySelector('.ob-tglow'), 1600, .4); if (who === 'player') CORE.press(t); }
    if (who === 'player') SND.click();
    CORE.glow(X.slotGlow, 1000);
    X.lcd.textContent = `調理中 · ${no}番`;
    await I.cm.coinIn(price, OB.SLOTW);
    // a ticket out of the front, the order printed in the kitchen and clipped to the rail
    X.ticketOut.style.display = ''; setTimeout(() => { if (X) X.ticketOut.style.display = 'none'; }, 1800);
    consume(kk); renderStack(kk); renderDishes(); renderPot();
    cur = { p, s: {}, x: STOP.start, z: BELT.z + 22, tx: 7, th: 0, no };
    SND.beep();
    await UTIL.tween(300, e => { cur.th = 9 * e; drawTicket(); }, t2 => t2);
    // the tray drops out of the magazine onto the belt
    await UTIL.tween(200, e => { cur.z = BELT.z + 22 * (1 - e * e); drawTray(); }, t2 => t2); cur.z = BELT.z; SND.tok();
    await belt(STOP.rice, 320);
    // arm A: rice, then miso soup
    await moveArm('A', COOKER[0], COOKER[1], COOKER[2] + 8, 260);
    UTIL.tween(160, e => I.cookLid.setAttribute('transform', `translate(0 ${f(-6 * e)})`), UTIL.ease.out); CORE.sparkle(COOKER[0], COOKER[1], COOKER[2] + 6, 4, '#fff');
    await moveArm('A', COOKER[0], COOKER[1], COOKER[2] - 2, 160); arms.A.hold = (x, y, z) => { const [a, b] = P(x, y, z + 2.6); return `<ellipse cx="${f(a)}" cy="${f(b)}" rx="1.8" ry="1" fill="#fffdf6"/>`; };
    await moveArm('A', COOKER[0], COOKER[1], COOKER[2] + 8, 160);
    UTIL.tween(160, e => I.cookLid.setAttribute('transform', `translate(0 ${f(-6 * (1 - e))})`), UTIL.ease.in);
    await moveArm('A', ...spot('rice', 2), 300); arms.A.hold = null; cur.s.rice = true; drawTray(); drawArms(); SND.tok();
    arms.A.tool = 'ladle';
    await moveArm('A', POT[0], POT[1], POT[2] + 6, 260); await moveArm('A', POT[0], POT[1], POT[2] - 4, 160);
    arms.A.hold = (x, y, z) => { const [a, b] = P(x, y, z + 3.4); return `<ellipse cx="${f(a)}" cy="${f(b)}" rx="1.4" ry=".7" fill="#c8964a"/>`; };
    await moveArm('A', POT[0], POT[1], POT[2] + 6, 160);
    await moveArm('A', ...spot('miso', 2), 280); arms.A.hold = null; cur.s.miso = true; drawTray(); SND.pour(.4);
    moveArm('A', ...REST.A, 300).then(() => { arms.A.tool = 'scoop'; drawArms(); });
    await belt(STOP.main, 420);
    // arm B: the main dish (fried to order with the fryer), then a 小鉢
    const [cx, cy, cz] = place(kk);
    await moveArm('B', cx, 66, cz + 6, 260); await moveArm('B', cx, cy, cz + 3, 160);
    arms.B.hold = (x, y, z) => OBB.MAIN[p.g] ? OBB.MAIN[p.g](x, y, z - 1) : ''; drawArms();
    await moveArm('B', cx, 66, cz + 6, 160);
    if (fried(p.g) && I.basket) {
      await moveArm('B', FRYER[0], FRYER[1], FRYER[2] + 8, 300); arms.B.hold = null; drawArms();
      SND.pour(1); I.bubbles.innerHTML = [0, 1, 2, 3, 4, 5].map(i => { const [a, b] = P(FRYER[0] - 4 + (i % 3) * 4, FRYER[1] - 2 + Math.floor(i / 3) * 4, FRYER[2] + .5); return `<circle class="ob-bubble" style="animation-delay:${i * .12}s" cx="${f(a)}" cy="${f(b)}" r="1.3"/>`; }).join('') + `<path class="steam" d="M${f(P(...FRYER)[0])} ${f(P(...FRYER)[1] - 4)}q-1.6-3 0-6t0-6" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`;
      await UTIL.wait(1100); I.bubbles.innerHTML = '';
      arms.B.hold = (x, y, z) => OBB.MAIN[p.g](x, y, z - 1); drawArms();
    }
    await moveArm('B', ...spot('main', 3), 300); arms.B.hold = null; cur.s.main = true; drawTray(); drawArms(); SND.tok();
    await moveArm('B', KOBACHI[0], KOBACHI[1], KOBACHI[2] + 8, 260); await moveArm('B', KOBACHI[0], KOBACHI[1], KOBACHI[2] + 3, 140);
    arms.B.hold = (x, y, z) => { const [a, b] = P(x, y, z); return `<circle cx="${f(a)}" cy="${f(b)}" r="2" fill="#2a4a6a"/><circle cx="${f(a)}" cy="${f(b - .8)}" r="1.4" fill="#3a8a2a"/>`; };
    await moveArm('B', KOBACHI[0], KOBACHI[1], KOBACHI[2] + 8, 140);
    await moveArm('B', ...spot('kobachi', 2), 260); arms.B.hold = null; cur.s.kobachi = true; drawTray(); SND.tok();
    moveArm('B', ...REST.B, 300);
    // chopsticks and pickles (and the pudding)
    await belt(STOP.finish, 380);
    cur.s.hashi = true; cur.s.pickles = true; drawTray(); SND.tok();
    if (lv.dessert) {
      const el = UTIL.g(I.movers, `<circle r="2" fill="#ffd27a" stroke="#8a4a1a" stroke-width=".8"/>`, {}), a0 = [DESSERT[0], DESSERT[1], DESSERT[2] + 3], a1 = spot('dessert', -3);
      await UTIL.tween(300, e => el.setAttribute('transform', at(a0[0] + (a1[0] - a0[0]) * e, a0[1] + (a1[1] - a0[1]) * e, a0[2] + (a1[2] - a0[2]) * e + Math.sin(e * Math.PI) * 6)), t2 => t2);
      el.remove(); cur.s.dessert = true; drawTray(); SND.tok();
    }
    await UTIL.wait(160);
    // off the end of the belt, down to the serving window
    await belt(STOP.end, 300);
    await UTIL.tween(360, e => { cur.z = BELT.z - 48 * e; drawTray(); }, UTIL.ease.in);
    const done = { p, s: { ...cur.s }, no, who };
    cur = null; drawTray();
    if (t) t.querySelector('.led').classList.remove('on');
    await UTIL.tween(220, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * e)})`), UTIL.ease.out);
    ready = done; windowTray(done); X.ready.classList.add('on'); X.lcd.textContent = `${no}番 · お待たせしました`; SND.ding(); UTIL.haptic(14);
    saleFn({ name: p.name, price, pid: p.pid, tier: p.tier || 1 }, who);
    if (who === 'customer') setTimeout(() => take(false), 900); else setTimeout(() => { if (ready === done) take(true); }, 7000);
    paintDoor();
    return true;
  }
  async function take(byPlayer) {
    const r = ready; if (!r) return; ready = null;
    const el = X.windowG;
    CORE.sparkle(WINDOW[0], WINDOW[1] + 4, WINDOW[2] + 8, 8, '#ff8a4a');
    if (byPlayer) { SND.pop(); FX.pop(WINDOW[0], WINDOW[1] + 8, WINDOW[2] + 22, r.p.name, '#ff8a4a'); } else SND.lift();
    const fw = ISO.fwd;
    await UTIL.tween(680, e => { el.setAttribute('transform', `translate(${f(26 * fw * e)} ${f(-50 * e + 20 * e * e)})`); el.setAttribute('opacity', f(1 - e)); }, UTIL.ease.out);
    el.innerHTML = ''; el.removeAttribute('transform'); el.setAttribute('opacity', 1);
    X.ready.classList.remove('on');
    await UTIL.tween(200, e => X.flap.setAttribute('transform', `translate(0 ${f(7 * (1 - e))})`), UTIL.ease.in);
    busy = false; paintDoor();
  }
  // a set comes back: the 返却口 flap, ごちそうさま
  function returned() {
    if (!X || G.exterior.style.display === 'none') return;
    UTIL.tween(380, e => X.retFlap.setAttribute('transform', `translate(0 ${f(5 * Math.sin(e * Math.PI))})`), t2 => t2);
    FX.pop(16, OB.D + 4, 44, 'ごちそうさま', 'var(--ink-hi)', 10); SND.tok();
  }

  /* ---------- restock: pans of each dish into the warming cabinet, rice into the cooker, miso into the pot ---------- */
  const { box, slits, TOP } = ISO;
  const crateBack = () => `<g transform="${TOP(0, 0, 0)}"><rect class="cr top" width="112" height="74" rx="2"/>${slits(8, 104, 8, 2, 72, true, 'crrib')}</g>` + box(0, 0, 0, 112, 2.5, 8, 0, 'cr') + box(0, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const crateFront = () => box(0, 71.5, 0, 112, 2.5, 8, 0, 'cr') + box(109.5, 2.5, 0, 2.5, 69, 8, 0, 'cr');
  const supply = {
    title: T`仕込み`, unit: T`份`, gap: 60, flyRot: 0, anyTarget: false,
    view: [[0, 0, 0], [112, 0, 0], [0, 74, 0], [112, 74, 0], [0, 0, 24], [112, 0, 24]],
    slots: () => [...MENU.flatMap((m, k) => Array.from({ length: CAP }, (_, j) => ({ glyph: 'g-ob-pan', vars: `--c:${m.c}`, pos: [9 + j * 13, 8 + k * 11.2, 2], target: 'p' + k }))),
      { glyph: 'g-ob-rice', vars: '', pos: [98, 24, 2], target: 'rice' }, { glyph: 'g-ob-miso', vars: '', pos: [98, 54, 2], target: 'miso' }],
    back: crateBack, front: crateFront,
    entry: t => t === 'rice' ? [COOKER[0], COOKER[1], COOKER[2] + 14] : t === 'miso' ? [POT[0], POT[1], POT[2] + 14] : (() => { const [x, y, z] = place(+t.slice(1)); return [x, y + 6, z + 10]; })(),
    accept: t => t === 'rice' ? S.rice < .97 : t === 'miso' ? S.miso < .97 : S.stack[+t.slice(1)].length + reserved[+t.slice(1)] < CAP,
    cost: t => t === 'rice' || t === 'miso' ? 0 : MENU[+t.slice(1)].buy || 0,
    tier: t => t === 'rice' || t === 'miso' ? 1 : MENU[+t.slice(1)].tier || 1,
    isNew: t => t !== 'rice' && t !== 'miso' && !ECON.everStocked('teishoku', MENU[+t.slice(1)].pid),
    // called once a pan is paid for: its place is held so pans still in the air cannot overfill a stack
    stocks: t => { if (t === 'rice' || t === 'miso') return []; const k = +t.slice(1); reserved[k]++; return [['teishoku', MENU[k].pid]]; },
    arrive: (t, slot, el, [tx, ty, s]) => {
      if (t === 'rice' || t === 'miso') {
        const from = S[t]; SND.pour(1);
        UTIL.tween(900, e => { S[t] = from + (1 - from) * e; renderPot(); }).then(() => { SND.chime(); paintDoor(); });
        UTIL.tween(820, e => { el.setAttribute('transform', `translate(${f(tx)} ${f(ty - 10 * Math.sin(e * Math.PI))}) rotate(${f(118 * Math.min(1, e * 1.6))}) scale(${f(s)})`); el.setAttribute('opacity', f(e < .7 ? 1 : 1 - (e - .7) / .3)); }, UTIL.ease.inOut).then(() => el.remove());
        return true;
      }
      const k = +t.slice(1); reserved[k] = Math.max(0, reserved[k] - 1);
      if (S.stack[k].length < CAP) { S.stack[k].push(prod(k)); renderStack(k); SND.tok(); paintDoor(); }
      return false;
    },
    dropTarget: (n, slot) => (n.closest && n.closest('.mroot') ? slot.target : null),
    order: (a, b) => ((a.target === 'rice' || a.target === 'miso') - (b.target === 'rice' || b.target === 'miso')),
  };

  /* ---------- build, redraw, the rest of the machine's interface ---------- */
  function build(g, onSale) { G = g; saleFn = onSale; if (!count()) S.stack.forEach((l, k) => { for (let j = 0; j < 3; j++) l.push(prod(k)); }); render(); }
  function shell() {
    X = OBB.exterior(G.exterior, MENU, lv); CORE.cat(G.exterior, false, [0, 0, 6]);
    hinge = CORE.hinge({ door: X.door, out: X.doorOut, in: X.doorIn, shutOnly: [X.windowG] }, OB.D, OB.H);
    if (ready) { windowTray(ready); X.flap.setAttribute('transform', 'translate(0 7)'); X.ready.classList.add('on'); }
    paintDoor();
  }
  // (re)draw from the current state: first build and every camera turn (the kitchen shows through the door: always drawn)
  function render() {
    [G.interior, G.exterior, G.ghost].forEach(n => { n.innerHTML = ''; });
    if (busy && !ready) { busy = false; cur = null; Object.assign(arms.A, { x: REST.A[0], y: REST.A[1], z: REST.A[2], tool: 'scoop', hold: null }); Object.assign(arms.B, { x: REST.B[0], y: REST.B[1], z: REST.B[2], tool: 'grip', hold: null }); }
    fitSets();
    I = OBB.interior(G.interior, coinState, lv); OBB.ghost(G.ghost); CORE.cat(G.ghost, true, [0, 0, 6]);
    renderStacks(); renderPot(); renderDishes(); drawArms(); drawTray(); shell();
  }
  function step(now) {
    if (now < nextPaint) return; nextPaint = now + 500;
    const t = Date.now();
    if (S.sets.some(s => s.back > lastStep && s.back <= t)) returned();
    lastStep = t; paintDoor(); renderDishes();
  }
  function tap(hit) {
    const t = hit.dataset.hit;
    if (hinge.open || hinge.moving) return false;
    if (t === 'menu') { vend(+hit.dataset.k, 'player'); return true; }
    if (t === 'window') { if (ready) take(true); else SND.clank(); return true; }
    if (t === 'tubes') { I.cm.collect([107, 70, 152]); return true; }
    if (t === 'coinslot') { I.cm.coinIn(100, OB.SLOTW); return true; }
    if (t === 'ticket') { SND.tok(); FX.pop(105, OB.D, 178, T`食券`, 'var(--ink-hi)'); return true; }
    if (t === 'lever') { SND.cascade(); return true; }
    return false;
  }
  function customerBuy() { if (busy || hinge.open || hinge.moving || cleanSets() === 0 || anyPlace() < 0) return null; vend(null, 'customer'); return T`定食`; }
  function idleSell() {
    const k = anyPlace(); if (k < 0 || !canSell(k)) return 0;
    const p = consume(k); S.no = S.no % 99 + 1;
    if (I) { renderStack(k); renderDishes(); renderPot(); }
    if (X) paintDoor();
    return { price: priceOf(p), pid: p.pid, name: p.name, tier: p.tier || 1 };
  }
  MACHINES.push({
    // not opaque: the kitchen shows through the door's window, so the insides are always drawn
    id: 'teishoku', fig: 10, name: T`定食`, brand: 'おぼん', size: [120, 84, 240], catOffset: [0, 0, 6], tint: '#ff8a4a',
    render: () => render(),
    hint: { shut: T`点食券機的按钮点一份定食 · 点机器招呼客人 · 左右拖动转视角 · 点门锁开门备料`, xray: T`看两只机械臂盛饭、舀汤、拿主菜，托盘在传送带上一样样装好 · 下面是洗碗机`, open: T`一盘盘主菜放进保温柜 · 米倒进电饭锅 · 味噌倒进汤锅 · 点门或门锁关门` },
    build, step, tap, customerBuy,
    door: open => hinge.swing(open, async () => { while (busy) await UTIL.wait(120); }),
    get doorOpen() { return hinge.open; }, get doorMoving() { return hinge.moving; }, doorBounds: () => hinge.bounds(),
    openTap: () => false, supply, count, get capacity() { return CAP * 6; },
    isBusy: () => busy, prepare: () => { if (ready) take(true); },
    save: () => ({ stack: S.stack.map(l => l.map(p => p.pid)), rice: S.rice, miso: S.miso, sets: S.sets.map(s => ({ ...s })), washFree: S.washFree, no: S.no, coins: coinState.slice() }),
    load: d => { if (!d) return;
      if (Array.isArray(d.stack)) S.stack = [0, 1, 2, 3, 4, 5].map(k => (d.stack[k] || []).slice(0, CAP).map(snap).filter(Boolean));
      ['rice', 'miso', 'washFree', 'no'].forEach(k => { if (typeof d[k] === 'number') S[k] = d[k]; });
      if (Array.isArray(d.sets)) S.sets = d.sets.map(s => ({ back: +s.back || 0, ready: +s.ready || 0 })); fitSets();
      if (Array.isArray(d.coins)) d.coins.forEach((n, i) => { if (i < 4) coinState[i] = Math.max(0, Math.min(42, n | 0)); });
      render(); },
    idleSell, vendKey: k => vend(k % 6, 'player'),
    // X-ray tags: per menu place, over its stack in the warming cabinet
    labels: () => MENU.map((m, k) => { const [x, y, z] = place(k), p = S.stack[k][0] || m; return { name: p.name, n: S.stack[k].length, c: p.c, pt: [x, y, z + Math.min(CAP, S.stack[k].length) * 1.4 + 2] }; }),
    labelStyle: 'mini',
    // goods: six 定食 on the ticket machine; the fried ones need the fryer
    goods: {
      kind: 'teishoku', defaults: ['natto', 'hiyayakko', 'tamagoyaki', 'shogayaki', 'sabamiso', 'nikujaga'],
      get slots() { return MENU.map(() => ({ cap: CAP })); },
      units: k => S.stack[k].length,
      apply: list => list.forEach((g, k) => Object.assign(MENU[k], { pid: g.id, name: g.name, jp: g.jp, price: g.sell, buy: g.buy, tier: g.tier, g: g.g, c: g.c })),
    },
    // upgrades (改造): the dishwasher (the cure), the fryer (fried 定食), the dessert shelf (a pudding on every tray, ×1.3)
    upgrades: [
      { id: 'wash', name: T`食洗機`, cost: [20000, 200000], effect: [T`食器 6 → 10 套 · 洗一套 15 → 6 秒`, T`食器 10 → 16 套 · 洗一套 2.5 秒`], kind: T`省心`, pin: [24, 46, 46],
        fact: T`这台机器是虚构的：现实里没有全自动的定食机。最接近的是食券機（グローリー、NECマグナス 等，最多 64～100 个按钮），买下的瞬间厨房的打印机就出单，做好后叫号。` },
      { id: 'fryer', name: T`揚げ場`, cost: [60000], effect: [T`加一口油锅 · 能卖现炸的唐揚げ、とんかつ、天ぷら、エビフライ`], kind: T`新货`, pin: [54, 62, 76],
        fact: T`茨城的あらいやオートコーナー 从 1972 年起，店主在隔壁厨房现做烤肉便当，放进机内 60℃ 保温，按键后掉进取货口；工作日约卖 100 个，假日 200 个，卖完为止。` },
      { id: 'dessert', name: T`デザート棚`, cost: [40000], effect: [T`每份定食附一个布丁 · 单价 ×1.3`], kind: T`加价`, pin: [53, 62, 116],
        fact: T`サンデン MMV、マースウインテック MV-20 这类带式货架自贩机，用皮带把商品送到前端、再由升降台放进取货口，全程正放不翻，能卖便当、盖饭和蛋糕。` },
    ],
    applyParts: l => { lv = { wash: l.wash || 0, fryer: l.fryer || 0, dessert: l.dessert || 0 }; fitSets(); },
  });
  // the warehouse (仓库) refills the machine when it sells out: up to n units of the planned goods, straight onto the shelves
  const me = MACHINES[MACHINES.length - 1];
  me.refill = n => { const d = me.save(); let added = 0;
    d.stack = d.stack.map((l, k) => { const add = Math.max(0, Math.min(CAP - l.length, n - added)); added += add; return l.concat(Array(add).fill(MENU[k].pid)); });
    d.rice = 1; d.miso = 1; me.load(d); return added || 1; };
  // plates left but no rice or miso: as good as sold out
  me.stuck = () => S.rice <= .02 || S.miso <= .02;
})();
