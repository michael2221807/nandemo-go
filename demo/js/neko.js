/* The street's cats (cat v1: ミケ alone, 2026-10-14; cat v2: seven cats, 2026-10-15; docs/nandemo-看板猫.md §2).
   They go where they like. The day is cut into stretches of about 25 minutes and each stretch seats the cats that are
   regulars here — the same answer for the same moment, so time away replays the same day: on top of a machine, lying in
   front of one, sitting on the kerb by one, in the cardboard box at the end of the street (now and then two squeezed
   in), napping in an empty lot, head first in a machine's take-out flap nibbling (only a picture: nothing goes missing),
   or out on their rounds. At most three are on the street at once (four while ハチワレ is full: she draws the others in);
   who gets a seat is down to chance. Nobody assigns a cat anywhere, and goods they like play no part (user, 2026-10-15:
   keep it random, no more mechanisms).
   New cats come visiting when the takings carry to a new letter (or reach its 特上 step): fed once, they stay on as
   regulars. Food is a present (they find their own): after a meal a cat is 満腹 for a few hours and helps the machine it
   keeps company in its own way — never by making it sell out sooner. What a cat has seen you sell (见证) opens new poses,
   then its own little accessory, then a stronger knack. Full and content, cats now and then leave a present (恩返し). */
const NEKO = (() => {
  const SLOT = 25 * 60e3, HOUR = 3600e3;
  // what a cat has seen, in full machines' worth of sales: for ミケ about a day, five days, two weeks
  const TIER = [6, 40, 150];
  // one food per letter (the cat-food ladder); the newer, the longer they stay full. eat: how it is eaten
  const FOODS = [
    { id: 'fish', name: T`小鱼干`, letter: 1, h: 2, eat: 'bite' },
    { id: 'can', name: T`猫罐头`, letter: 2, h: 3, eat: 'bowl' },
    { id: 'stick', name: T`猫条`, letter: 3, h: 4, eat: 'lick' },
    { id: 'sashimi', name: T`刺身拼盘`, letter: 4, h: 5, eat: 'bowl' },
    { id: 'catnip', name: T`猫薄荷`, letter: 5, h: 6, eat: 'roll' },
    { id: 'taiyaki', name: T`鲷鱼烧`, letter: 6, h: 8, eat: 'bite' },
  ];
  /* the cats. arrive: the letter the lifetime takings carry to, or the price step, that brings it visiting.
     wit: its 见证 thresholds against ミケ's — later cats share the street with more cats and are seen less, so theirs are
     shorter (user, 2026-10-15). knack, while full and by a machine (none makes a machine sell out sooner). Each is ONE
     plain multiplier on one thing the player can see (user, 2026-10-16: no sums to do), x: [before, after 见证 tier 3]:
       call  — 客人 ×x: customers it brings buy goods it brings, the takings again with no stock used (ミケ, ちび)
       luck  — 当たり ×x: one sale in five is a 当たり that pays x times (クロ)
       stock — 存货 ×x: it carries in the same goods, so a shelf lasts x times the sales (チャトラ)
       tip   — 每单 ×x: the glass so clean that every sale pays x times (シロ)
       gift  — 礼物 ×x: presents come x times as often (モフ)
       host  — 猫 +1: one more cat fits on the street (ハチワレ)
     The details live in the album's cat page, which opens a cat's knack the first time it works (and the cat leaves its
     sticker as a thank-you).
     gear: its own accessory at 见证 tier 2 (ミケ's 店長 badge goes to the album wardrobe; the others wear theirs).
     stickers: what its presents are, before the coin purses */
  const CATS = [
    { id: 'mike', name: 'ミケ', kind: T`三花`, arrive: null, wit: 1, knack: 'call', x: [1.25, 1.4], gear: { slot: 'neck', id: 'tencho', c: '#e8c08a', name: T`店長名牌` },
      stickers: ['st-paw', 'st-sakura', 'st-catcan', 'st-fish'] },   // its own sticker (st-nk-<id>) comes when its knack first works
    { id: 'kuro', name: 'クロ', kind: T`黑猫`, arrive: { letter: 2 }, wit: .75, knack: 'luck', x: [2, 3], gear: { slot: 'neck', id: 'bell', c: '#ffd23f', name: T`金铃铛项圈` }, stickers: [] },
    { id: 'chibi', name: 'ちび', kind: T`三花小猫`, arrive: { step: 5 }, wit: .75, knack: 'call', x: [1.2, 1.3], gear: { slot: 'head', id: 'candy-clip', c: '#ff5a6a', name: T`红色小发夹` }, stickers: [] },
    { id: 'chatora', name: 'チャトラ', kind: T`橘猫`, arrive: { letter: 3 }, wit: .6, knack: 'stock', x: [1.25, 1.5], gear: { slot: 'neck', id: 'bag', c: '#4fb06a', name: T`外卖小挎包` }, stickers: [] },
    { id: 'mofu', name: 'モフ', kind: T`布偶猫`, arrive: { step: 8 }, wit: .6, knack: 'gift', x: [2, 3], gear: { slot: 'neck', id: 'scarf', c: '#ffffff', name: T`白色蕾丝领巾` }, stickers: [] },
    { id: 'shiro', name: 'シロ', kind: T`白猫`, arrive: { letter: 4 }, wit: .5, knack: 'tip', x: [1.25, 1.4], gear: { slot: 'neck', id: 'scarf-star', c: '#7fc8ff', name: T`星星领巾` }, stickers: [] },
    // (v0.39) a cat from the catalog: adopted, it comes by like any other and keeps its own moods
    { id: 'ao', name: 'アオ', kind: T`蓝灰猫`, arrive: { paid: 'cat-ao' }, wit: .6, knack: 'call', x: [1.2, 1.3], gear: { slot: 'neck', id: 'scarf', c: '#9be36b', name: T`薄荷色领巾` }, stickers: [] },
    { id: 'hachi', name: 'ハチワレ', kind: T`八字脸`, arrive: { letter: 5 }, wit: .4, knack: 'host', x: [1, 1], gear: { slot: 'neck', id: 'bowtie', c: '#ff4f8b', name: T`粉色领结` }, stickers: [] },
  ];
  const byId = Object.fromEntries(CATS.map(c => [c.id, c]));
  // each cat's voice: the meow's pitch and the purr's (polish, 2026-10-15). The kitten squeaks, クロ is low and slow
  const VOICE = { ao: [1.1, .95], mike: [1, 1], kuro: [.8, .85], chibi: [1.45, 1.4], chatora: [.9, .9], mofu: [1.15, 1.1], shiro: [1.25, 1.1], hachi: [1.05, 1] };
  const voice = id => VOICE[id] || VOICE.mike;
  // spots and their poses; the number is the 见证 tier that opens the pose
  const POSES = { top: [['loaf', 0], ['curl', 0], ['stretch', 1]], front: [['lie', 0], ['belly', 1]], kerb: [['sit', 0], ['groom', 1], ['yawn', 1]],
    box: [['box', 0]], lot: [['sprawl', 1]], tray: [['snack', 0]], out: [['out', 0]] };
  const NEAR = ['top', 'front', 'kerb'];   // spots by a machine: a cat there keeps that machine company
  const blank = () => ({ status: 'none', since: 0, fullUntil: 0, fedAt: 0, seen: 0, loads: 0, fed: 0, knew: 0, worked: 0 });
  // status: none (not met) | visit (came by, waiting for a first meal) | regular (lives on the street)
  // shift: the demo button moves everyone on to the next stretch of the day
  const S = { cats: {}, gift: null, nextGift: 0, shift: 0, ate: {} };   // ate: each food some cat has eaten, and when first
  function reset() { CATS.forEach(c => { S.cats[c.id] = blank(); }); S.cats.mike.status = 'regular'; S.gift = null; S.nextGift = 0; S.shift = 0; S.ate = {}; memo.clear(); }
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const st = id => S.cats[id];
  const tierOf = (id = 'mike', loads = st(id).loads) => TIER.filter(t => loads >= t * byId[id].wit).length;
  const isFull = (id = 'mike', t = Date.now()) => t < st(id).fullUntil && t >= st(id).fedAt;
  // (v0.41) a cat from the catalog comes only while it is owned (a refund takes it back)
  const avail = c => !(c.arrive && c.arrive.paid) || (typeof PAY !== 'undefined' && PAY.has(c.arrive.paid));
  const regulars = () => CATS.filter(c => st(c.id).status === 'regular' && avail(c));
  const visitors = () => CATS.filter(c => st(c.id).status === 'visit' && avail(c));
  const known = () => CATS.filter(c => st(c.id).status !== 'none');

  /* ---------- the street's seating for one stretch ---------- */
  const memo = new Map();
  const slotOf = t => Math.floor(t / SLOT) + S.shift;
  /* (v0.46) with two streets each cat first picks a street for the stretch (the more machines on it, the likelier;
     なんでも通り counts one more: the box is there), then a spot on it as before. At most three sit on a street (four on
     the one where ハチ sits, full). A spot carries its street; lot numbers run across the streets (street s: 5s..5s+4) */
  function seatsAt(t = Date.now()) {
    const k = slotOf(t), t0 = (k - S.shift) * SLOT, lots = ECON.lots(), nSt = Math.max(1, Math.ceil(lots.length / 5));
    const key = k + '|' + lots.join() + '|' + CATS.map(c => st(c.id).status[0] + (isFull(c.id, t0) ? 1 : 0) + tierOf(c.id)).join('');
    let out = memo.get(key); if (out) return out;
    if (memo.size > 600) memo.clear();
    const machinesOf = s => lots.map((id, j) => id && Math.floor(j / 5) === s ? j : -1).filter(j => j >= 0);
    const emptyOf = s => lots.map((id, j) => !id && Math.floor(j / 5) === s && ECON.lotOpen(j) ? j : -1).filter(j => j >= 0);
    // who picks first: a different order every stretch
    const order = regulars().map(c => ({ c, r: hash(k * 3.71 + CATS.indexOf(c) * 17.3 + 1) })).sort((a, b) => a.r - b.r).map(o => o.c);
    const weight = [...Array(nSt)].map((_, s) => machinesOf(s).length + (s === 0 ? 1 : 0)), total = weight.reduce((a, b) => a + b, 0);
    const streetFor = ci => { if (nSt < 2) return 0; let x = hash(k * 1.93 + ci * 11.7 + .37) * total; for (let s = 0; s < nSt; s++) if ((x -= weight[s]) < 0) return s; return 0; };
    const pick = {}; order.forEach(c => { pick[c.id] = streetFor(CATS.indexOf(c)); });
    const hachiOn = st('hachi').status === 'regular' && isFull('hachi', t0) && pick.hachi !== undefined ? pick.hachi : -1;
    const capOf = s => 3 + (s === hachiOn ? 1 : 0), taken = new Set(), on = new Array(nSt).fill(0), snack = new Set();
    let inBox = 0;
    out = {};
    for (const c of order) {
      const ci = CATS.indexOf(c), full = isFull(c.id, t0), tier = tierOf(c.id), s = pick[c.id], machines = machinesOf(s), empty = emptyOf(s);
      // full, a cat stays by the machines; hungry, it is more often in the box (only on なんでも通り) or out
      const menu = [['top', 30], ['front', 18], ['kerb', 16], ...(s === 0 ? [['box', full ? 6 : 12]] : []), ['out', full ? 0 : 12], ['tray', 4]];
      if (tier >= 1 && empty.length) menu.push(['lot', 9]);
      const total = menu.reduce((a, o) => a + o[1], 0);
      let spot = null;
      for (let n = 0; n < 6 && !spot; n++) {
        const salt = ci * 31.13 + n * 7.71;
        let x = hash(k + salt) * total, kind = 'top';
        for (const [m, w] of menu) if ((x -= w) < 0) { kind = m; break; }
        if (kind === 'out' || on[s] >= capOf(s)) { spot = { kind: 'out', lot: -1 }; break; }
        if (kind === 'box') { if (!inBox || (inBox === 1 && hash(k + salt + .91) < .4)) spot = { kind, lot: -1 }; continue; }
        if (kind === 'tray') { if (!snack.has(s) && machines.length) spot = { kind, lot: machines[Math.floor(hash(k + salt + .43) * machines.length)] }; continue; }
        const free = (kind === 'lot' ? empty : machines).filter(j => !taken.has(kind + j));
        if (free.length) spot = { kind, lot: free[Math.floor(hash(k + salt + .53) * free.length)] };
      }
      if (!spot) spot = { kind: 'out', lot: -1 };
      if (spot.kind !== 'out') { on[s]++; taken.add(spot.kind + spot.lot); if (spot.kind === 'box') inBox++; if (spot.kind === 'tray') snack.add(s); }
      spot.street = spot.kind === 'out' ? -1 : s;
      const poses = POSES[spot.kind].filter(p => p[1] <= tier).map(p => p[0]);
      spot.pose = poses[Math.floor(hash(k + ci * 13.31 + .77) * poses.length)];
      spot.until = t0 + SLOT; spot.duo = false;
      out[c.id] = spot;
    }
    if (inBox === 2) Object.values(out).forEach(s => { if (s.kind === 'box') s.duo = true; });
    memo.set(key, out);
    return out;
  }
  const gone = { kind: 'gone', lot: -1, pose: '' };
  const spotAt = (id = 'mike', t = Date.now()) => seatsAt(t)[id] || gone;
  // visitors wait near the box most of the time; now and then they wander off and come back later
  const visiting = (id, t = Date.now()) => st(id).status === 'visit' && hash(slotOf(t) + CATS.indexOf(id) * 5.17 + .21) < .78;
  // the machine a cat keeps company at t (on it, in front of it, on the kerb by it), or null
  function companyAt(id = 'mike', t = Date.now()) { const s = spotAt(id, t); return NEAR.includes(s.kind) ? ECON.lots()[s.lot] : null; }
  // up close: the cats at machine id — on top, lying in front, sitting at the kerb, or head first in its take-out flap
  function here(machine, t = Date.now()) {
    const L = seatsAt(t), lots = ECON.lots(), out = [];
    for (const c of regulars()) { const s = L[c.id]; if (s && (NEAR.includes(s.kind) || s.kind === 'tray') && lots[s.lot] === machine) out.push({ id: c.id, at: s.kind }); }
    return out;
  }

  /* ---------- a sale: who saw it, and what the full cats by that machine add ---------- */
  const night = t => { const h = new Date(t).getHours(); return h >= 22 || h < 5; };
  // a cat's multiplier now, and the chance per sale that makes it come true on average
  const multOf = id => { const c = byId[id]; return c.x[tierOf(id) >= 3 ? 1 : 0]; };
  function rateOf(id) {
    const c = byId[id], x = multOf(id);
    return c.knack === 'call' || c.knack === 'tip' ? x - 1 : c.knack === 'luck' ? .2 : c.knack === 'stock' ? 1 - 1 / x : 0;
  }
  // the first time a cat's knack works, the album's cat page opens it (the app takes these and says thank you)
  const found = [];
  function discover(id) { const my = st(id); my.worked++; if (my.knew) return; my.knew = Date.now(); found.push(id); }
  // returns { extra: money on top of the sale, paws: cats that brought a customer, luck, stock, tip, up: [[cat, tier]] }
  function sale(m, price, t = Date.now()) {
    const L = seatsAt(t), lots = ECON.lots(), r = { extra: 0, paws: [], luck: null, stock: null, tip: 0, up: [] };
    for (const c of regulars()) {
      const s = L[c.id]; if (!s || s.kind === 'out') continue;
      const was = tierOf(c.id), my = st(c.id); my.seen++; my.loads += 1 / Math.max(1, m.capacity);
      const now = tierOf(c.id); if (now > was) r.up.push([c.id, now]);
      if (!NEAR.includes(s.kind) || lots[s.lot] !== m.id || !isFull(c.id, t)) continue;
      const p = rateOf(c.id), x = multOf(c.id);
      if (c.knack === 'call' && Math.random() < p) { r.extra += price; r.paws.push(c.id); discover(c.id); }
      else if (c.knack === 'luck' && Math.random() < p) { r.extra += price * (x - 1); r.luck = c.id; r.luckX = x; discover(c.id); }
      else if (c.knack === 'stock' && Math.random() < p) { r.stock = c.id; discover(c.id); }
      else if (c.knack === 'tip') { const v = price * p; r.extra += v; r.tip += v; discover(c.id); }
    }
    return r;
  }

  /* ---------- food: a present that pays for itself ----------
     Priced by the hour of fullness at today's price step, so that what a cat brings in while full comes to about twice
     what it cost (user, 2026-10-14). A newer food is not better value, it just lasts longer. The bowl on the street feeds
     every cat you know for the price of three: only three can be at work at once (user, 2026-10-15: one tap, they all
     gather round one bowl and go back to their places after) */
  const fullLoad = () => 4800 * ECON.stepMult(ECON.stepOf());
  const fullHours = (f, id = 'mike') => f.h * (tierOf(id) >= 3 ? 1.5 : 1) * (typeof PAY !== 'undefined' && PAY.has('license') ? 1.5 : 1);   // (店长证: 金のまぐろ缶)
  // the price follows the food's own hours: a cat at 见证 tier 3 stays full half as long again on the same meal
  const foodPrice = f => .03 * f.h * fullLoad();
  const bowlPrice = f => 3 * foodPrice(f);
  const foodOpen = f => ECON.life >= Math.pow(1000, f.letter);
  const newest = () => FOODS.filter(foodOpen).pop() || null;
  /* what a cat is likely to bring in while full on it: a full machine sells in 4 hours; a full cat is by a machine about
     nine tenths of the time — when it gets a seat. With more cats than seats (three, four with ハチワレ) each is there for
     its share only, so one cat's meal pays back less as the street fills up, and the bowl (everyone, for three) more */
  function presence(extra = 0) { const n = regulars().length + extra, cap = 3 + (st('hachi').status === 'regular' ? .5 : 0); return .9 * Math.min(1, cap / Math.max(1, n * .9)); }
  function foodBack(f, id = 'mike') {
    const c = byId[id], h = fullHours(f, id), share = presence(st(id).status === 'regular' ? 0 : 1);
    if (c.knack === 'host') return 0;
    if (c.knack === 'gift') return .5 * fullLoad() * (1 / 3.5 - 1 / 7) * share * h;   // coin purses, twice as often
    const p = c.knack === 'luck' ? .2 * (multOf(id) - 1) : rateOf(id);
    return p / 4 * share * 1.1 * fullLoad() * h;
  }
  // everyone at the bowl: what they are likely to bring in together while full
  const bowlBack = f => known().reduce((a, c) => a + foodBack(f, c.id) * (st(c.id).status === 'regular' ? 1 : presence(0) / presence(1)), 0);
  function eat(id, f, t) {
    const my = st(id);
    if (!isFull(id, t)) my.fedAt = t;
    my.fullUntil = Math.min(t + 12 * HOUR, Math.max(my.fullUntil, t) + fullHours(f, id) * HOUR); my.fed++; if (!S.ate[f.id]) S.ate[f.id] = t;
    if (my.status === 'visit') { my.status = 'regular'; my.since = t; }
    if (!S.nextGift) S.nextGift = t + UTIL.rand(3, 6) * HOUR;
  }
  function feed(id, foodId, t = Date.now()) {
    const f = FOODS.find(x => x.id === foodId); if (!f || !foodOpen(f) || !byId[id] || st(id).status === 'none' || !ECON.spend(foodPrice(f))) return null;
    eat(id, f, t); return f;
  }
  function feedAll(t = Date.now()) {
    const f = newest(), who = known(); if (!f || !who.length || !ECON.spend(bowlPrice(f))) return null;
    who.forEach(c => eat(c.id, f, t)); return { f, who: who.map(c => c.id) };
  }

  /* ---------- new cats: they come visiting as the takings grow ---------- */
  function arrivals(t = Date.now()) {
    const out = [];
    for (const c of CATS) {
      if (st(c.id).status !== 'none' || !c.arrive) continue;
      // (2026-10-18, not deterministic) once its letter or step is reached a cat is on its way, and turns up somewhere
      // between half an hour and fourteen hours later; cats due about the same time can come in either order
      const paid = c.arrive.paid;
      if (!(paid ? typeof PAY !== 'undefined' && PAY.has(paid) : c.arrive.letter ? ECON.life >= Math.pow(1000, c.arrive.letter) : ECON.stepOf() >= c.arrive.step)) continue;
      const s = st(c.id); if (!s.due) s.due = t + (paid ? (2 + Math.random() * 4) / 60 : .5 + Math.random() * 13.5) * HOUR;   // (adopted: a few minutes)
      if (t >= s.due) { s.status = 'visit'; s.since = t; out.push(c); }
    }
    return out;
  }

  /* ---------- 恩返し: one present at a time on the street, from a full cat by a machine ---------- */
  function giftCheck(t = Date.now()) {
    if (S.gift || !S.nextGift || t < S.nextGift) return null;
    const L = seatsAt(t), cand = regulars().filter(c => isFull(c.id, t) && L[c.id] && NEAR.includes(L[c.id].kind));
    if (!cand.length) return null;
    const c = cand[Math.floor(hash(t % 1e6) * cand.length)], left = c.stickers.filter(id => !COLLECT.owns(id));
    S.gift = { cat: c.id, lot: L[c.id].lot, kind: left.length ? 'sticker' : 'purse', id: left.length ? left[Math.floor(hash(t % 1e5) * left.length)] : null };
    const fast = regulars().find(x => x.knack === 'gift' && isFull(x.id, t) && L[x.id] && L[x.id].kind !== 'out');
    if (fast) discover(fast.id);
    S.nextGift = t + UTIL.rand(5, 9) / (fast ? multOf(fast.id) : 1) * HOUR;
    return S.gift;
  }
  function takeGift() { const g = S.gift; S.gift = null; return g; }

  /* ---------- saving (v0.23 saves held ミケ alone, at the top level) ---------- */
  const save = () => JSON.parse(JSON.stringify(S));
  function load(d) {
    reset(); if (!d) return;
    if (d.cats) { CATS.forEach(c => { if (d.cats[c.id]) Object.assign(S.cats[c.id], d.cats[c.id]); }); S.gift = d.gift || null; S.nextGift = d.nextGift || 0; S.shift = d.shift || 0; S.ate = d.ate || {}; }
    else { Object.assign(S.cats.mike, { fullUntil: d.fullUntil || 0, fedAt: d.fedAt || 0, seen: d.seen || 0, loads: d.loads || 0, fed: d.fed || 0 });
      S.gift = d.gift ? { ...d.gift, cat: 'mike' } : null; S.nextGift = d.nextGift || 0; S.shift = d.shift || 0; }
    S.cats.mike.status = 'regular'; memo.clear();
  }
  reset();
  return { FOODS, TIER, CATS, byId, NEAR, voice, seatsAt, spotAt, visiting, companyAt, here, sale, rateOf, multOf, discover, takeFound: () => found.splice(0), night, feed, feedAll, eat, arrivals, giftCheck, takeGift,
    foodPrice, bowlPrice, foodBack, bowlBack, foodOpen, newest, fullHours, isFull, tierOf, regulars, visitors, known, state: id => st(id),
    save, load, nudge: () => { S.shift++; }, get gift() { return S.gift; }, ate: id => !!S.ate[id] };
})();
