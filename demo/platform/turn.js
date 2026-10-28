/* Turning a machine with pictures (iOS app; the user's choice 2026-10-20, "后台预画"). The game hands every turn to the
   shell through GAME.onTurn (v0.43): while the machine turns nothing is rebuilt and the shell shows the angle.

   The pictures come from a second, hidden web view (ios TurnRenderer, turn.html + platform/renderer.js): the same game
   with only this machine, on this save, drawing it at every angle of a 2° grid (and at the current angle exactly), each
   snapshotted with its transparency. Here they are kept as PNG, decoded near the angle shown (below), and drawn into a canvas that lies in the stage, over
   the machine's layers and under the rain, the vignette and the bars: during a turn the live machine is taken out of
   the layout and the canvas shows the picture nearest the finger's angle (2° apart); when the turn settles the game
   draws the final angle for real and the machine comes back under the canvas, a part a frame, before it goes.

   A set of pictures belongs to a look (machine, art style, parts, sticker, figure, cats, camera). Sales are saved up
   (the user's choice, 2026-10-20: "攒着再画"): a set is redrawn only once the stock differs from it in a way one can
   see — a slot sold out, or a slot 2 or more down — after 30 s without a sale and at most every 3 minutes per
   machine; a restock or new goods redraw it at once. The old pictures serve meanwhile. Without a complete set for the current look — or with the X-ray
   on — a turn is drawn by the game itself, as the prototype does. Devices with too little memory never get here.

   With the pictures kept and drawn ahead (turnAhead, the default) a machine turns in pictures from the first touch:
   the set of its look on disk from a moment ago, or the one baked into the app, stands in while its own is drawn,
   each of its own pictures taking the place of the stand-in at that angle (the owner, 2026-10-23, after trying an
   exact-only build that held the turn until they were drawn: the wait spoilt the game). A cat in a ring at the bottom
   left shows how much of its own set is there; it never stops a turn. A turn in pictures ends on the angle it
   shows (TURN.settle, build_www turn_settle). */
(() => {
  if (!window.NATIVE || !NATIVE.on || !window.GAME || !GAME.onTurn || !window.__ND || !window.__ndTurnPictures) return;
  // SCALE: the pictures' pixels per point. At the screen's own 3 a set of 79 took ~380 MB of decoded bitmaps and the
  // system ended the game's web process on an iPhone 13 Pro (2026-10-20); at 2 it is ~170 MB, drawn up to the screen
  const GRID = 2, SOFT = 7, SCALE = 2, [LIM_L, LIM_R] = GAME.yawRange;
  const GRID_YAWS = []; for (let y = Math.floor((LIM_L - SOFT) / GRID) * GRID; y <= Math.ceil((LIM_R + SOFT) / GRID) * GRID; y += GRID) GRID_YAWS.push(y);
  const T = window.TURN = { active: false, mode: null };
  const device = document.querySelector('.device'), cam = document.getElementById('cam'), stage = document.getElementById('stage');
  const resetBtn = document.getElementById('reset');
  let off = false;

  /* ---------- the look a set of pictures belongs to, and what only redraws it ---------- */
  const M = () => MACHINES[__ND.cur];
  const zoomed = () => !!(__ND.cam && __ND.home && __ND.cam.w < __ND.home.w * .99);
  // (m: any machine, for the ones drawn ahead from the street; cats false: the family, the look without the cats, whose
  // latest set on disk serves while a new look is drawn; as: { xr, neon } for a look other than the one shown, drawn ahead)
  const xrFull = () => __ND.xr >= .998;
  // the set baked into the app for this look (ios TurnBake; tools/bake_turn.py): no upgrades or all of them (the nearer,
  // half or more fitted counting as all), 霓虹 or not, the X-ray or not
  function baked(as = {}, m = M()) {
    const parts = UPG.parts(m), fitted = parts.filter(p => UPG.level(m.id, p.id) > 0).length;
    const all = UPG.allIn(m) || (parts.length > 0 && fitted * 2 >= parts.length);
    const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = as.neon ?? !!(g && g.classList.contains('nd-neon')), xr = as.xr ?? (m === M() && xrFull());
    return `${m.id}-${all ? 'all' : 'none'}-${neon && all ? 'neon' : 'comic'}-${xr ? 'xr' : 'plain'}`;
  }
  function lookKey(z = zoomed(), m = M(), cats = true, as = {}) {
    const c = __ND.cam || {};
    // (the look: the page's, and the machine's own 涂装, platform/skin.js; the X-ray scanned all the way, 2026-10-23)
    const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = as.neon ?? !!(g && g.classList.contains('nd-neon')), xr = as.xr ?? (m === M() && xrFull());
    return JSON.stringify([m.id, device.dataset.art, neon, UPG.levels(m), COLLECT.stickerOn(m.id), COLLECT.figureOn(m.id), cats ? JSON.stringify(NEKO.here(m.id)) : '', xr ? 'xr' : '',
      z ? [Math.round(c.x * 10), Math.round(c.y * 10), Math.round(c.w * 10)] : 'home', innerWidth, innerHeight]);
    // (no clock in the key: it held a 25-minute bucket, which asked for a whole new set every 25 minutes even when
    // nothing at this machine had changed — the cats that move on the street's 25-minute slots are NEKO.here above)
  }
  // what a sale or a restock changes: each slot's stock (the machines' X-ray labels count it, belt plates included)
  // and the goods with their prices; not what moves by itself (a plate going round)
  // (only when every label has a number: the cup machine's are null, its stock is in count() alone)
  const slotsNow = (m = M()) => { try { const n = m.labels().map(l => l.n); if (n.length && n.every(Number.isFinite)) return n.map(x => x | 0); } catch (e) { /* none */ } return [m.count()]; };
  const sigNow = (m = M()) => { try { return JSON.stringify(ECON.sigOf(m)); } catch (e) { return ''; } };
  // (the stock as a set is asked with: its ver)
  const verNow = (m = M()) => JSON.stringify({ slots: slotsNow(m), sig: sigNow(m), total: m.count() });
  // EAGER: every sale redraws at once, as before: 性能模式 in the settings (the user's choice, 2026-10-20; the row is
  // added below), or TURN.eager for checks
  const EAGER = () => !!T.eager || !!(typeof SETTINGS !== 'undefined' && SETTINGS.prefs && SETTINGS.prefs.perf);   // (SETTINGS: a top-level const, not on window)
  const QUIET = 30e3, EVERY = 180e3;

  /* ---------- asking for pictures ---------- */
  // drawn: the stock and goods the current set was asked with; lastSale: when a slot last changed; lastDraw: per machine
  let asked = '', drawn = null, seen = '', lastSale = 0, lastTouch = 0, awaySince = 0;
  const lastDraw = new Map(), idle = new Map();   // (idle: per machine, its stock when last seen not busy)
  // fingers on the screen: no pictures are asked for while one is down (a pinch: each zoom level on the way asked for a
  // whole set of 79). A first finger clears any the page lost; one that seems held for 10 s without moving no longer
  // counts. (Not #cam's transform: the game leaves it on after a flight lands, until the camera is next applied)
  const fingers = new Set();
  addEventListener('pointerdown', e => { lastTouch = performance.now(); if (e.isPrimary) fingers.clear(); fingers.add(e.pointerId); }, true);
  addEventListener('pointermove', () => { lastTouch = performance.now(); }, { capture: true, passive: true });
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => { lastTouch = performance.now(); fingers.delete(e.pointerId); }, true);
  const touching = () => fingers.size > 0 && performance.now() - lastTouch < 10e3;
  const restocking = () => { const a = document.getElementById('allrun'); return !!a && !a.hidden; };
  let shownM = null;
  const tick = () => {
    // (the safety net: no turn, nothing coming back, yet a picture up or a part of a machine left out — or the machine in
    // view is another one: the live machine back and the picture gone)
    const mNow = __ND.view === 'machine' ? __ND.cur : -1;
    if (T.stuck() || (!T.active && mNow !== shownM && (hidden.length || (canvas && canvas.style.opacity === '1')))) dropPictures();
    shownM = mNow;
    // (during a turn the game draws itself, its set is asked for all the same: on the phone a player who kept turning
    // right after going in had none for 9 s)
    if (off || (T.active && T.mode !== 'live')) return;
    // on the street for half a minute: the pictures go from the page (they come back from disk on the next machine)
    if (__ND.view !== 'machine') { if (!awaySince) awaySince = performance.now(); else if ((sets.size || asked) && performance.now() - awaySince > 30000) release(); ahead(); return; }
    awaySince = 0;
    { const id = M().id, k = opened.indexOf(id); if (k !== 0) { if (k > 0) opened.splice(k, 1); opened.unshift(id); } }
    if (!T.active && asked) { const [, k] = setFor(asked); if (k) keep(k, __ND.yaw); }   // (the camera can move without a turn: 复位视角)
    // (the X-ray scanned all the way has a set of its own, turnAhead: 2026-10-23; while it sweeps, none)
    // (a machine busy with a sale or with work of its own may be drawn meanwhile, turnAhead: the sushi machine making
    // plates one after another was busy for 5 s on opening, and its pictures were only asked for after)
    const busy = !!(M().isBusy && M().isBusy());
    if (__ND.mode !== 'shut' || (__ND.xr > .002 && !(window.__ndTurnAhead && xrFull())) || restocking() || GAME.paused || document.hidden || !(GAME.canTurn || (busy && window.__ndTurnAhead))) return;
    const now = performance.now(), look = lookKey();
    // (nothing asked for while a finger is down — a pinch asked for a set at every zoom on the way — unless at the home
    // view this look has no pictures at all yet: then at once, the finger may be turning it now)
    const none = !(sets.get(look) && sets.get(look).pics.size);
    if ((now - lastTouch < 400 || touching()) && (zoomed() || !none)) return;
    // (the total too: the ramen machine's labels count only the bowls of its current menu, not the old menu's left)
    // (busy, turnAhead: the stock as it stood between its sales — the sushi machine takes a slice out as it makes a plate
    // and counts it again once the plate is on the belt: a set asked for midway was of no use once it was done)
    const id = M().id; let slots = slotsNow(), sig = sigNow(), total = M().count();
    if (!busy) idle.set(id, { slots, sig, total }); else if (window.__ndTurnAhead && idle.has(id)) ({ slots, sig, total } = idle.get(id));
    if (JSON.stringify(slots) !== seen) { seen = JSON.stringify(slots); lastSale = now; }
    let reload = look !== asked || !drawn;
    // a look changed: only its set and the home view's stay (zoomed in and back out, the home set is there at once);
    // turnAhead, the machine's last few looks too (霓虹 or the X-ray switched off again: its set at once, the phone
    // turned the drink machine in the game's own drawing at 300 ms a step while the plain set came back from disk)
    if (look !== asked) {
      const home = lookKey(false), id = JSON.stringify(M().id), mine = [...sets].filter(([k]) => k.startsWith('[' + id + ',')).sort((a, b) => (b[1].used || 0) - (a[1].used || 0));
      const stay = new Set([look, home, ...(window.__ndTurnAhead ? mine.slice(0, 4).map(([k]) => k) : [])]);
      for (const [k, s] of sets) if (!stay.has(k) && !(s.coming && now - s.used < 10e3) && !(s.light && now - s.used < 60e3)) { closeSet(s); sets.delete(k); }
    }
    { const s = sets.get(look); if (s) { s.used = now; s.coming = false; } }
    // a set already there for this look (back at the home view): no new set, only what the stock asks for below
    const have = sets.get(look);
    if (reload && have && (have.complete || have.pre) && have.drawn && !have.light) { asked = look; drawn = have.drawn; reload = false; }
    if (!reload) {
      const was = drawn.slots, same = slots.length === was.length && slots.every((n, k) => n === was[k]);
      if (sig === drawn.sig && same && total === drawn.total) return;
      const restock = sig !== drawn.sig || slots.length !== was.length || slots.some((n, k) => n > was[k]) || total > drawn.total;
      const visible = slots.some((n, k) => (was[k] > 0 && n === 0) || was[k] - n >= 2);
      if (!EAGER() && !restock && !(visible && now - lastSale >= QUIET && now - (lastDraw.get(id) ?? -Infinity) >= EVERY)) return;
    }
    asked = look; drawn = { slots, sig, total }; lastDraw.set(id, now);
    let s = sets.get(look); if (!s) sets.set(look, s = { pics: new Map(), complete: false }); s.drawn = drawn; s.ver = JSON.stringify(drawn); s.light = false;
    const c = __ND.cam, y = __ND.yaw;
    const yaws = order(y);
    NATIVE.post('turnPrepare', { key: look, machine: M().id, state: JSON.stringify(__ND.state()), lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload,
      cam: zoomed() ? { x: c.x, y: c.y, w: c.w, h: c.h, zoomed: true } : {}, yaw: y, yaws, scale: SCALE, ver: JSON.stringify(drawn), family: lookKey(zoomed(), M(), false), grid: GRID_YAWS.length, xr: xrFull(), baked: zoomed() ? undefined : baked() });
  };
  setInterval(() => { tick(); loading(); readyAhead(); }, 250);
  // (a look changed by a tap: asked for at once, so a turn right after has its set from disk — the 涂装 chip, once the
  // chip has switched it; the X-ray as it is switched on, before its scan reaches the bottom: on the phone a turn 3.5 s
  // after the tap found the set still on its way, asked for only once the scan was done)
  function prefetch(as, m = M()) {
    if (!window.__ndTurnAhead || off || T.active || __ND.view !== 'machine' || (m === M() && zoomed())) return;
    const look = lookKey(false, m, true, as), was = sets.get(look); if (was && !was.light) return;
    const s = was || { pics: new Map(), complete: false }; Object.assign(s, { pre: true, light: false, coming: m !== M(), used: performance.now(), drawn: { slots: slotsNow(m), sig: sigNow(m), total: m.count() } }); s.ver = JSON.stringify(s.drawn); sets.set(look, s);
    const y = __ND.yaw;
    NATIVE.post('turnPrepare', { key: look, machine: m.id, state: JSON.stringify(__ND.state()), lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload: true, cam: {}, yaw: y,
      yaws: order(y), scale: SCALE, ver: JSON.stringify(s.drawn), family: lookKey(false, m, false, as),
      grid: GRID_YAWS.length, xr: !!as.xr, baked: baked(as, m) });
  }
  /* the looks a player may show next, readied (turnAhead, 2026-10-23: on the phone the first drag right after opening a
     machine, switching 霓虹 or ‹ › found nothing decoded, and the game drew the turn at 250–400 ms a step): each street
     machine as it is, and the machine in view's other 涂装 and the X-ray — the few pictures nearest the angle it would
     come up at, from its own set on disk or a stand-in, nothing drawn for them (serveOnly), the nearest one decoded.
     Again once the angle has moved; not while a finger is down or a turn is on */
  let readiedAt = 0, readiedYaw = NaN;
  function readyAhead() {
    if (!window.__ndTurnAhead || off || T.active || touching() || GAME.paused || document.hidden || restocking()) return;
    const now = performance.now(); if (now - readiedAt < 1500) return;
    if (__ND.view === 'machine' && (__ND.mode !== 'shut' || zoomed())) return;
    readiedAt = now;
    if (Math.abs(__ND.yaw - readiedYaw) > .5) { readiedYaw = __ND.yaw; for (const [k, s] of sets) if (s.light && s.yaw !== undefined && Math.abs(s.yaw - __ND.yaw) > .5) { closeSet(s); sets.delete(k); } }
    const here = [...document.querySelectorAll('#street-svg .st-m')].map(g => MACHINES[+g.dataset.i]).filter(Boolean);
    const want = here.map(m => [m, {}]);
    if (__ND.view === 'machine') {
      const m = M(), g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = !!(g && g.classList.contains('nd-neon'));
      want.unshift([m, { xr: !(__ND.xr >= .998) }]); if (window.SKIN && SKIN.canWear && SKIN.canWear(m)) want.unshift([m, { neon: !neon }]);
    }
    for (const [m, as] of want) {
      const look = lookKey(false, m, true, as); if (sets.has(look)) continue;
      const drawnM = { slots: slotsNow(m), sig: sigNow(m), total: m.count() }, s = { pics: new Map(), complete: false, pre: true, light: true, used: now, yaw: __ND.yaw, drawn: drawnM, ver: JSON.stringify(drawnM) };
      sets.set(look, s);
      NATIVE.post('turnPrepare', { key: look, machine: m.id, state: '', lang: '', pay: '', reload: false, cam: {}, yaw: __ND.yaw, yaws: [], scale: SCALE, ver: s.ver,
        family: lookKey(false, m, false, as), grid: GRID_YAWS.length, xr: !!as.xr, baked: baked(as, m), serveOnly: true, near: 5 });
    }
  }
  // (the game, as ‹ › starts sliding to machine i, build_www turn_settle: its set asked for then, at its home view, not
  // once the slide is over — on the phone a drag 0.7 s after the tap found nothing yet and the game drew the turn)
  T.coming = i => { const m = MACHINES[i]; if (m) prefetch({ xr: false }, m); };
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#nd-skin, #xray'); if (!t) return;
    if (t.id === 'xray') { if (__ND.xr < .5) prefetch({ xr: true }); setTimeout(tick, 1350); }
    else setTimeout(() => { prefetch({}); tick(); }, 0); }, true);

  /* ---------- drawn ahead, from the street (2026-10-23, the owner: players judge the game by its first turn) ----------
     While the player looks at the street, the sets of its machines are asked for in the background, the one opened last
     first: the shell draws each only when nothing else is asked for, and keeps it on disk with the stock it shows, so
     the machine opened next turns with pictures from the first touch. Asked again only when a machine's look or stock
     has changed since; not while a finger is down, during 全部补货, the cats' meal or with the game paused. Each machine
     its most turned-to angles first (within NEAR of the front), then all of them, the rest of its angles after. Then the
     same for the X-ray scanned all the way, and for the other 涂装 of each machine that may wear 霓虹 (the owner, 2026-10-23:
     turning under the X-ray, or right after switching the look, as smooth as any) */
  const aheadSent = new Map(), opened = [], NEAR = 30, AGAIN = 10 * 60e3;
  function ahead() {
    if (!window.__ndTurnAhead) return;   // (the way before: nothing drawn ahead; ios TurnRenderer.ahead)
    if (off || GAME.paused || document.hidden || restocking() || touching() || performance.now() - lastTouch < 1500) return;
    if (typeof STREET !== 'undefined' && STREET.dining) return;
    const here = [...document.querySelectorAll('#street-svg .st-m')].map(g => MACHINES[+g.dataset.i]).filter(Boolean);
    // (the machine opened last this session first; before any, the one the save was last on)
    const order = opened.length ? opened : [M().id];
    here.sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
    let state = null; const rounds = [[], [], []];
    for (const m of here) {
      const g = document.querySelector(`.mroot[data-m="${m.id}"]`), neon = !!(g && g.classList.contains('nd-neon'));
      const looks = [{ xr: false, neon }, { xr: true, neon }];
      if (window.SKIN && SKIN.canWear && SKIN.canWear(m)) looks.push({ xr: false, neon: !neon });
      looks.forEach((as, r) => {
        const key = lookKey(false, m, true, as), drawnM = { slots: slotsNow(m), sig: sigNow(m), total: m.count() }, ver = JSON.stringify(drawnM), tag = m.id + ':' + r;
        if (!r) idle.set(m.id, drawnM);   // (on the street a machine is never busy)
        // (a sale changes the stock, not the look: a look is asked again only after AGAIN. On the phone each sale on the
        // street had a set drawn anew, and the drawing hardly stopped: the phone went from cool to hot in 80 s. Opened,
        // a machine gets the latest set of its look at once and its own stock drawn over it there)
        const was = aheadSent.get(tag), now = performance.now();
        if (was && was.key === key && now - was.at < AGAIN) return;
        aheadSent.set(tag, { key, at: now });
        state = state || JSON.stringify(__ND.state());
        let st = state;
        if (as.neon !== neon) { const o = JSON.parse(state), n = new Set(o.neon || []); as.neon ? n.add(m.id) : n.delete(m.id); o.neon = [...n]; st = JSON.stringify(o); }   // (renderer.js reads 霓虹 from the save)
        rounds[r].push({ key, machine: m.id, state: st, lang: STORE.get('nandemo-lang') || '', pay: STORE.get('nandemo-purchases') || '', reload: true, cam: {}, yaw: 0, scale: SCALE, ver, family: lookKey(false, m, false, as),
          background: true, grid: GRID_YAWS.length, xr: as.xr });
      });
    }
    const all = GRID_YAWS.slice().sort((a, b) => Math.abs(a) - Math.abs(b));
    for (const asks of rounds) {
      asks.forEach(a => NATIVE.post('turnPrepare', { ...a, yaws: all.filter(y => Math.abs(y) <= NEAR) }));
      asks.forEach(a => NATIVE.post('turnPrepare', { ...a, yaws: all }));
    }
  }
  // a set drawn so far (nearest angles first) is enough for a turn that starts where its pictures cover ±COVER, one
  // every 4° at least (an angle missing between two that are there: the nearest shows)
  const COVER = 12;
  const covered = (s, y) => !!s && GRID_YAWS.filter(g => Math.abs(g - y) <= COVER).every(g => s.pics.has(g) || (s.pics.has(g - GRID) && s.pics.has(g + GRID)));
  // the order a set is drawn in, for the machine in view: the angle the camera stands at, then one every 4° within
  // COARSE of it (a turn has its pictures after ~7 of them, about a second on the phone), then the rest nearest first
  const COARSE = 24;
  function order(y) {
    const near = (a, b) => Math.abs(a - y) - Math.abs(b - y);
    const coarse = GRID_YAWS.filter(g => Math.abs(g - y) <= COARSE && Math.round(g / GRID) % 2 === 0).sort(near);
    return [y, ...coarse, ...GRID_YAWS.filter(g => !coarse.includes(g)).sort(near)];
  }

  /* ---------- the pictures ----------
     Kept as they come (PNG, compressed), and decoded only near the angle shown: WIDE pictures each side (2° apart),
     more of them ahead of the finger while it turns; the rest closed. A whole set decoded was ~640 MB of the game page's
     memory on an iPhone 13 Pro (78 bitmaps; 177 MB in the simulator). Drawing takes the nearest picture that is
     decoded, so a finger faster than the decoding shows the nearest one ready, never a blank. */
  const WIDE = 12, AHEAD = 8;
  const sets = new Map();   // look → { pics: Map(yaw → { blob, bmp, job, x, y, w, h }), complete }
  const drop = p => { p.dropped = true; if (p.bmp) { p.bmp.close(); p.bmp = null; } };
  const closeSet = s => { for (const p of s.pics.values()) drop(p); s.pics.clear(); };
  // the decoding is done by a worker, off the main thread (decoded there, a turn's frames waited on it: p95 445 ms
  // in the simulator), the bitmap handed back transferred, not copied. A worker that cannot decode: the main thread
  let worker = null, jobs = 0; const waiting = new Map();
  try {
    worker = new Worker(URL.createObjectURL(new Blob([`onmessage = e => { const { id, blob } = e.data;
      try { createImageBitmap(blob).then(b => postMessage({ id, bmp: b }, [b]), x => postMessage({ id, err: String(x) })); }
      catch (x) { postMessage({ id, err: String(x) }); } };`], { type: 'text/javascript' })));
    // (a reply that comes after its job gave up: its bitmap is closed, nothing else holds it)
    worker.onmessage = e => { const f = waiting.get(e.data.id); waiting.delete(e.data.id); if (f) f(e.data); else if (e.data.bmp) e.data.bmp.close(); };
    worker.onerror = worker.onmessageerror = () => { worker = null; for (const f of waiting.values()) f({ err: 'worker' }); waiting.clear(); };
  } catch (e) { worker = null; }
  T.decoder = () => worker ? 'worker' : 'main';   // (checks)
  // any failure (an error, no answer within 3 s, a blob it cannot be sent): this one and all later ones on the main thread
  const bitmapOf = blob => !worker ? createImageBitmap(blob) : new Promise(res => {
    const id = ++jobs;
    const timer = setTimeout(() => { const f = waiting.get(id); waiting.delete(id); if (f) f({ err: 'timeout' }); }, 3000);
    waiting.set(id, r => { clearTimeout(timer); if (r.bmp) res(r.bmp); else { worker = null; T.decodeErr = r.err; res(createImageBitmap(blob)); } });
    try { worker.postMessage({ id, blob }); } catch (x) { waiting.get(id)({ err: String(x) }); waiting.delete(id); }
  });
  // two at a time, the nearest to the angle first (a quick sweep asks for more than can be decoded: the ones it has
  // left behind are dropped from the queue, not decoded and closed)
  let queue = [], flying = 0;
  const pump = () => {
    while (flying < 2 && queue.length) {
      const p = queue.shift(); if (!p.want || p.bmp || p.job || p.dropped) continue;
      flying++;
      const done = b => { p.job = null; flying--; if (b) { if (p.dropped || !p.want) b.close(); else p.bmp = b; } pump(); };
      p.job = bitmapOf(p.blob).then(done, () => done(null));
    }
  };
  // the pictures to have decoded around angle y: WIDE each side, and AHEAD more in the direction it is going. Only for
  // the set of the look shown (the queue is that set's)
  function keep(s, y, dir = 0) {
    if (!s || !s.pics.size) return;
    const keys = [...s.pics.keys()].sort((a, b) => a - b);
    let i = 0; for (let k = 0; k < keys.length; k++) if (Math.abs(keys[k] - y) < Math.abs(keys[i] - y)) i = k;
    if (i === s.keptAt && dir === s.keptDir) return;
    s.keptAt = i; s.keptDir = dir;
    // (the other set kept, the home view's while zoomed in: none of it decoded meanwhile)
    for (const o of sets.values()) if (o !== s && !o.light && !Number.isNaN(o.keptAt)) { o.keptAt = NaN; for (const p of o.pics.values()) { p.want = false; if (p.bmp) { p.bmp.close(); p.bmp = null; } } }
    const lo = i - WIDE - (dir < 0 ? AHEAD : 0), hi = i + WIDE + (dir > 0 ? AHEAD : 0);
    keys.forEach((k, n) => {
      const p = s.pics.get(k); p.want = n >= lo && n <= hi;
      if (!p.want && p.bmp) { p.bmp.close(); p.bmp = null; }
    });
    queue = keys.map((k, n) => [Math.abs(n - i), s.pics.get(k)]).filter(([, p]) => p.want && !p.bmp && !p.job).sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    pump();
  }
  T.decoded = () => { const s = sets.get(T.look || asked); return s ? [...s.pics.values()].filter(p => p.bmp).length : 0; };   // (checks)
  T.picture = async info => {
    if (off) return;
    const s = sets.get(info.key); if (!s) return;   // (asked for, then dropped: the renderer finishes the old job)
    // (one picture an angle, the best there is: this look with this stock, then this look with another, then a stand-in
    // of the look without the cats or baked into the app; one handed over again is kept as it is)
    const was = s.pics.get(info.yaw);
    if (was && ((was.path === info.path && was.ver === info.ver) || rank(s, was) > rank(s, info))) return;
    try {
      const blob = await (await fetch(info.path)).blob();
      if (off || sets.get(info.key) !== s) return;   // (released meanwhile)
      const old = s.pics.get(info.yaw); if (old) drop(old);
      s.pics.set(info.yaw, { blob, bmp: null, job: null, x: info.x, y: info.y, w: info.w, h: info.h, world: info.world || null, ver: info.ver, stand: !!info.stand, path: info.path });   // (world: baked into the app, below)
      // decoded now only for the look shown: during a turn around the finger (the game's own angle stays where the
      // turn began until it ends), else around the camera; a set being drawn for another look waits until it is shown
      s.keptAt = NaN;
      if (s.wanted && s.pics.size >= s.wanted) { s.complete = true; ensureCanvas(); }   // (first: setFor() picks complete sets)
      if (!T.active) { if (info.key === setFor(asked)[0]) keep(s, __ND.yaw); }
      else if (T.mode === 'pictures' && info.key === T.set) keep(s, lastYaw, lastDir);
      if (s.light) { const p = s.pics.get(info.yaw), y = s.yaw ?? __ND.yaw, near = [...s.pics.keys()].every(k => Math.abs(info.yaw - y) <= Math.abs(k - y));
        if (near && !p.bmp && !p.job) { p.want = true; p.job = bitmapOf(p.blob).then(b => { p.job = null; if (p.dropped || !p.want) b.close(); else p.bmp = b; }, () => { p.job = null; }); } }
      loading();
    } catch (e) { /* (a picture missed: the turn falls back to the game's own drawing when the set is not complete) */ }
  };
  // native: every picture of the set is out (their fetching may still be under way: complete once all are in)
  T.complete = key => { const s = sets.get(key); if (!s) return; s.wanted = GRID_YAWS.length; if (s.pics.size >= s.wanted) { s.complete = true; ensureCanvas(); } };
  const rank = (s, p) => p.stand ? 0 : p.ver === s.ver ? 2 : 1;
  // the share of the set drawn on this phone (any stock, the cats as they were too): the progress the cat at the bottom
  // left shows. Only the pictures baked into the app count as not yet (the owner, 2026-10-23: the cat came back each
  // time the view was zoomed or a cat moved, while the machine turned in pictures of its own look all the same)
  const own = s => { let n = 0; for (const p of s.pics.values()) if (!p.world) n++; return Math.min(1, n / GRID_YAWS.length); };
  function release() {
    for (const s of sets.values()) closeSet(s);
    sets.clear(); asked = ''; drawn = null;
    NATIVE.post('turnRelease', {});
  }
  T.at = () => at;   // (checks)
  T.state = info => { T.drawing = info.drawing ? info : null; T.thermal = info.thermal; };   // (checks: native, the second page drawing or not, and the phone's heat)
  T.ready = () => { const [, s] = setFor(lookKey()); return !!(s && s.complete); };   // (checks: a turn now would have its pictures)
  T.off = () => { off = true; release(); };   // (native: memory warning, or the second page ended)

  /* ---------- the canvas in the stage ---------- */
  // made once a set is complete and kept, transparent, as its own layer: showing it is only its opacity
  let canvas = null, ctx = null;
  function ensureCanvas() {
    const r = cam.getBoundingClientRect(), dpr = devicePixelRatio || 1, W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.id = 'nd-turn';
      canvas.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;opacity:0;will-change:opacity';
      cam.appendChild(canvas); ctx = canvas.getContext('2d');
    }
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    origin = { left: r.left, top: r.top, W: r.width, dpr };
  }
  let at = null, origin = null;
  // the set a turn would show now: the look's own once complete; zoomed in before that, the home view's, drawn at the
  // zoom (softer, until the zoomed set is drawn: right after a zoom the game drew the turn itself, about a frame a second)
  function setFor(look) {
    const s = sets.get(look); if ((s && s.complete) || !zoomed()) return [look, s];
    const hk = lookKey(false), hs = sets.get(hk); return hs && hs.complete ? [hk, hs] : [look, s];
  }
  // a home picture taken at angle Y (framed by the home camera at Y) onto the zoomed camera at Y, which orbits the point
  // at the centre of the view as the game's own turn does (__ND.camsAt: setYaw's two cameras at Y, nothing drawn):
  // screen = o + (world − camera) · k, with o and k from the stage's transform now (the same aspect: the content starts
  // at the same place on the screen for both cameras). Mapped through the start angle's cameras alone, a picture drifted
  // as the turn went on and jumped where the game drew the end (Chromium, 1.7×, 24°: 14 px across, 8 px down)
  function zoomMap() {
    const m = stage.getScreenCTM && stage.getScreenCTM(), c = __ND.cam, h = __ND.home; if (!m || !c || !h || !(c.w > 0) || !__ND.camsAt) return null;
    // (the cameras the turn starts from, kept: a drag landing in the two frames after 'end' finds the game's moved on)
    const f = h.w / c.w, ox = m.e + m.a * c.x, oy = m.f + m.d * c.y, from = { cam: { ...c }, yaw: __ND.yaw }, byYaw = new Map();
    const shift = Y => { let d = byYaw.get(Y); if (!d) { const { home: hY, cam: cY } = __ND.camsAt(Y, from); d = [(hY.x - cY.x) * m.a, (hY.y - cY.y) * m.d]; byYaw.set(Y, d); } return d; };
    return { f, x: (v, Y) => ox + shift(Y)[0] + (v - ox) * f, y: (v, Y) => oy + shift(Y)[1] + (v - oy) * f };
  }
  // the camera the game would have at angle Y in this turn (__ND.camsAt from where it began: at home each angle frames
  // itself, zoomed in it orbits the point in the middle), for the pictures baked into the app; per turn, per angle
  let cams = new Map(), camsFrom = null;
  function camAt(Y) {
    if (!camsFrom) camsFrom = { cam: { ...__ND.cam }, yaw: __ND.yaw };
    let c = cams.get(Y); if (!c) { const r = __ND.camsAt(Y, camsFrom); c = zoomed() ? r.cam : r.home; cams.set(Y, c); }
    return c;
  }
  function draw(y) {
    const s = sets.get(T.set || T.look); if (!s || !canvas) return;
    // the nearest decoded picture (a cross-fade of two pictures 2° apart shows a double outline while the finger
    // rests), at its own size where it was taken at the screen's density (pixel for pixel, no resampling). None
    // decoded: the canvas keeps what it shows
    let k = null; for (const [yaw, q] of s.pics) if (q.bmp && (k === null || Math.abs(yaw - y) < Math.abs(k - y))) k = yaw;
    if (k === null) return;
    const t0 = performance.now();
    const { left, top, dpr } = origin;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const p = s.pics.get(k), z = T.map;
    let pw, ph, x, yy;
    if (p.world) {   // (baked into the app: its box in the stage's units, onto the camera the game has at that angle here)
      const c = camAt(k), sc = origin.W / c.w; pw = p.world.w * sc; ph = p.world.h * sc;
      x = Math.round((p.world.x - c.x) * sc * dpr); yy = Math.round((p.world.y - c.y) * sc * dpr);
    } else {
      pw = z ? p.w * z.f : p.w; ph = z ? p.h * z.f : p.h;
      x = Math.round(((z ? z.x(p.x, k) : p.x) - left) * dpr); yy = Math.round(((z ? z.y(p.y, k) : p.y) - top) * dpr);
    }
    if (Math.abs(pw * dpr / p.bmp.width - 1) < .01) ctx.drawImage(p.bmp, x, yy);
    else { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(p.bmp, x, yy, Math.round(pw * dpr), Math.round(ph * dpr)); }
    T.shown = k; T.shownStand = !!p.stand; T.drawMs = performance.now() - t0;   // (checks: the angle on screen, a stand-in or not, and what drawing it took)
  }
  let raf = 0;
  const want = y => { at = y; if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (T.mode === 'pictures') draw(at); else if (T.mode === 'live' && Math.abs(at - __ND.yaw) >= 1) __ND.shot(at); }); };
  // during a turn the live machine is out of the layout (.nd-off, display: none: nothing of it is laid out or
  // painted, not even the game's redraw at the final angle). Coming back, one group a frame — the front, the shell,
  // the backdrop and floor, the insides — under the canvas, which goes after the last: the redraw's layout and painting
  // are spread over several short frames instead of one long one
  // (every part of the machine in each layer, the front first, the insides last)
  const groupsOf = () => ['#world-top', '#world-ext', '#world-ghost', '#world'].flatMap(l => {
    const r = document.querySelector(`${l} .mroot[data-m="${M().id}"]`); return r ? [...r.children] : []; });
  let hidden = [], restoring = 0;
  function showPictures(y) {
    cancelAnimationFrame(restoring); restoring = 0;
    // (groups still out from the turn before, whose return this turn cut short — another machine's, after ‹ › — back at
    // once: dropped from the list, they stayed out for good, the old picture over them; the owner 2026-10-23, a ghost)
    const now = groupsOf(); hidden.forEach(g => { if (!now.includes(g)) g.classList.remove('nd-off'); });
    ensureCanvas(); at = y; draw(y); canvas.style.opacity = '1';
    if (window.__ndFlags && __ndFlags.turnKeepLive) { hidden = []; return; }   // (experiment: the live machine stays, under the canvas)
    hidden = now; hidden.forEach(g => g.classList.add('nd-off'));   // (a class: the game's own display settings stay as they are)
  }
  function hidePictures() {
    const next = () => { const g = hidden.shift(); if (g) { g.classList.remove('nd-off'); restoring = requestAnimationFrame(next); return; }
      restoring = 0; if (T.mode !== 'pictures' && canvas) canvas.style.opacity = '0'; };   // (a live turn begun meanwhile: no picture over it)
    next();
  }
  // the live machine back at once and the picture gone: another machine, another view, or a turn the game draws itself
  function dropPictures() {
    cancelAnimationFrame(restoring); restoring = 0;
    hidden.forEach(g => g.classList.remove('nd-off')); hidden = [];
    document.querySelectorAll('.mroot .nd-off').forEach(g => g.classList.remove('nd-off'));
    if (canvas) canvas.style.opacity = '0';
  }
  T.stuck = () => !T.active && !restoring && (hidden.length > 0 || !!(canvas && canvas.style.opacity === '1'));   // (checks)

  // the angle a turn in pictures ends on: the one it shows (the game draws the machine there when the finger lifts)
  T.settle = y => { if (!T.active || T.mode !== 'pictures') return y;
    const s = sets.get(T.set || T.look); let k = null; if (s) for (const [yaw, q] of s.pics) if (q.bmp && (k === null || Math.abs(yaw - y) < Math.abs(k - y))) k = yaw;
    return k === null ? y : k; };

  /* ---------- the cat at the bottom left (turnAhead; the owner, 2026-10-23) ----------
     While the machine in view has less than all of its own pictures (a stand-in turns it meanwhile), a small cat in a
     ring at the bottom left, above the line of numbers: the ring fills as each of them comes in, a dot goes round it.
     Up half a second after the look comes up (a set from disk: nothing shows); it never stops a turn */
  const CAT = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle class="trk" cx="24" cy="24" r="19"/>'
    + '<circle class="arc" cx="24" cy="24" r="19" pathLength="100" stroke-dasharray="0 100"/>'
    + '<g class="orb"><circle cx="24" cy="5" r="2.6"/></g>'
    + '<g class="ears"><path class="ear l" d="M14.4 22.5 15.4 12.4 21.6 18z"/><path class="ear r" d="M33.6 22.5 32.6 12.4 26.4 18z"/>'
    + '<path class="pink" d="M16.3 19.4 16.8 15 19.6 17.6z M31.7 19.4 31.2 15 28.4 17.6z"/></g>'
    + '<ellipse class="head" cx="24" cy="26" rx="10.6" ry="8.9"/><path class="patch" d="M15.2 21.6c1.6-2.6 4.6-4.2 7.6-4.4-.6 2.8-2.6 5-5.6 5.8-.8.2-1.4-.4-2-1.4z"/>'
    + '<g class="eyes"><ellipse cx="20" cy="25.4" rx="1.35" ry="1.7"/><ellipse cx="28" cy="25.4" rx="1.35" ry="1.7"/></g>'
    + '<circle class="cheek" cx="18.2" cy="28.6" r="1.5"/><circle class="cheek" cx="29.8" cy="28.6" r="1.5"/>'
    + '<path class="nose" d="M23 28.1h2l-1 1.1z"/><path class="line" d="M21.8 29.7c.5.8 1.6.8 2.2 0 .6.8 1.7.8 2.2 0 M12.6 26.8l4.2.6 M12.8 29.4l4-.3 M35.4 26.8l-4.2.6 M35.2 29.4l-4-.3"/></svg>';
  let ring = null, ringOn = false, lookSince = 0, lookWas = '';
  function showLoad(on, share = 0) {
    if (!ring) { if (!on) return; ring = document.createElement('div'); ring.id = 'nd-turnload'; ring.innerHTML = CAT; device.appendChild(ring); }
    // (above the line of numbers under the machine, whatever the screen: the bottom bar's top, from the device's)
    if (on && !ringOn) { const bar = document.querySelector('.bottombar'), d = device.getBoundingClientRect(), b = bar && bar.getBoundingClientRect(); if (b && b.height) ring.style.top = `${Math.round(b.top - d.top - 60)}px`; }
    ring.querySelector('.arc').setAttribute('stroke-dasharray', `${Math.max(3, Math.min(100, share * 100)).toFixed(1)} 100`);
    if (on !== ringOn) { ringOn = on; ring.classList.toggle('on', on); }
  }
  function loading() {
    if (!window.__ndTurnAhead || off || __ND.view !== 'machine' || document.hidden || __ND.mode !== 'shut') { lookWas = ''; return showLoad(false, 1); }
    const look = lookKey(false), s = sets.get(look), share = s ? own(s) : 0;   // (the home view's: a zoomed set is drawn too, but turns in the home one meanwhile)
    if (look !== lookWas) { lookWas = look; lookSince = performance.now(); }
    T.progress = share;   // (checks)
    showLoad(share < 1 && performance.now() - lookSince > 500, share);
  }

  /* ---------- during a turn ---------- */
  // the set a turn at angle y would show now, and whether it can (pictures only when the one at this angle is decoded:
  // else the canvas would open on a neighbour; zoomed in, the home view's when the zoomed set, just complete, has none
  // decoded yet)
  function pick(y) {
    const ready = s => s && [...s.pics.entries()].some(([yaw, p]) => p.bmp && Math.abs(yaw - y) <= GRID);
    let [key, s] = setFor(T.look);
    if (key === T.look && zoomed() && !ready(s)) { const hk = lookKey(false), hs = sets.get(hk); if (hs && hs.complete && ready(hs)) { key = hk; s = hs; } }
    let map = key === T.look ? null : zoomMap();
    if (key !== T.look && !map) { key = T.look; s = sets.get(T.look); }
    // (turnAhead, at the home view: the picture at this angle decoded is enough — the rest come and are decoded around
    // the finger as it turns; until they do, the nearest one shows. On the phone a turn waiting for ±12° of them was
    // drawn by the game, 250–400 ms a step)
    const ok = !off && !!s && (s.complete || (window.__ndTurnAhead && !zoomed())) && ready(s) && (__ND.xr <= .002 || (window.__ndTurnAhead && xrFull()));
    return { key, s, map, ok };
  }
  let lastYaw = 0, lastDir = 0, tried = 0;   // (the last direction that moved: a finger that rests or moves up and down keeps it)
  GAME.onTurn(ev => {
    if (ev.type === 'start') {
      T.active = true; T.look = lookKey(); cams = new Map(); camsFrom = null;
      const p = pick(ev.yaw), s = p.s;
      T.set = p.key; T.map = p.map; T.mode = p.ok ? 'pictures' : 'live';
      lastYaw = ev.yaw; lastDir = 0; tried = performance.now(); keep(s, ev.yaw);
      // (under the X-ray: the name tags and the scan line out while it turns, platform.css)
      if (T.mode === 'pictures') { if (__ND.xr > .002) device.classList.add('nd-xturn'); showPictures(ev.yaw); }
      else {
        dropPictures();   // (no picture over a turn the game draws: the one of a turn before could stay, platform 2026-10-23)
        // (the game draws the turn itself, lighter, platform.css; not under the X-ray, which is there to show the
        // insides: they went blank while it turned, the owner 2026-10-23)
        if (window.__ndTurnAhead && __ND.xr <= .002) device.classList.add('nd-lod');
      }
      (T.lastModes = T.lastModes || []).push(T.map && T.mode === 'pictures' ? 'zoomed' : T.mode); if (T.lastModes.length > 20) T.lastModes.shift();
    } else if (ev.type === 'move') {
      want(ev.yaw);
      if (T.mode === 'pictures') { lastDir = Math.sign(ev.yaw - lastYaw) || lastDir; keep(sets.get(T.set), ev.yaw, lastDir); lastYaw = ev.yaw; }
      // (turnAhead: a turn the game began drawing itself goes on in pictures as soon as they are there around the finger
      // — on the phone a drag 0.7 s after a machine came up was drawn by the game to its end, 250–360 ms a step, warm.
      // At the home view only: zoomed in, the game's camera has moved with the turn)
      else if (T.mode === 'live' && window.__ndTurnAhead && !zoomed() && performance.now() - tried > 100) {
        tried = performance.now(); const p = pick(ev.yaw); keep(p.s, ev.yaw);
        if (p.ok && !p.map) {
          T.set = p.key; T.mode = 'pictures'; device.classList.remove('nd-lod'); if (__ND.xr > .002) device.classList.add('nd-xturn');
          lastYaw = ev.yaw; lastDir = 0; cancelAnimationFrame(raf); raf = 0; showPictures(ev.yaw); T.lastModes[T.lastModes.length - 1] = 'live>pictures';
        }
      }
      // (what the game's own camera step would also do: the reset button shows once the machine is turned)
      if (T.mode === 'pictures' && resetBtn) resetBtn.hidden = !zoomed() && Math.abs(ev.yaw) < .5;
    } else if (ev.type === 'end') {
      // the game now draws the final angle itself (under the canvas); the canvas shows the same angle meanwhile
      if (T.mode === 'pictures') { cancelAnimationFrame(raf); raf = 0; draw(ev.yaw); }
    } else if (ev.type === 'done') {
      if (T.mode === 'pictures') hidePictures();
      device.classList.remove('nd-lod', 'nd-xturn');
      keep(sets.get(T.set), __ND.yaw);
      T.active = false; T.mode = null; T.map = null;
    }
  });
})();

/* 性能模式 (the user's choice, 2026-10-20): a row in the settings under 省电模式, the game's own markup and switch, so
   it looks as if it had always been there. On, every sale redraws the turning pictures at once (more battery); off
   (the default), sales are saved up. Kept in the game's settings prefs (nandemo-settings, P.perf: the game's own click
   handler toggles and saves it, as it does every data-k switch). It and 省电模式 exclude each other: turning one on
   turns the other off. Only where the turning pictures exist (devices with too little memory never draw them). */
(() => {
  if (!window.TURN || typeof SETTINGS === 'undefined' || !window.__ndTurnPictures) return;
  const body = document.getElementById('set-body'), panel = document.getElementById('settings');
  if (!body || !panel) return;
  const TXT = {
    zh: ['性能模式', '卖出后马上更新转镜头画面，更耗电'],
    'zh-Hant': ['效能模式', '賣出後馬上更新轉鏡頭畫面，比較耗電'],
    en: ['Performance mode', 'Updates the turning view right after each sale; uses more battery'],
    ja: ['パフォーマンスモード', '売れるたびに回転の表示をすぐ更新します（電池を多く使います）'],
  };
  const add = () => {
    const low = body.querySelector('[data-k="low"]'), row = low && low.closest('.set-row');
    if (!row || body.querySelector('[data-k="perf"]')) return;
    const on = !!SETTINGS.prefs.perf, [label, sub] = TXT[I18N.code] || TXT.zh;
    row.insertAdjacentHTML('afterend', `<div class="set-row"><span>${label}<small>${sub}</small></span>`
      + `<button type="button" class="sh-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" data-k="perf"><i></i></button></div>`);
  };
  new MutationObserver(add).observe(body, { childList: true });
  add();
  // turning one on turns the other off, before the game's own handler flips and saves the one tapped
  panel.addEventListener('click', e => {
    const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return;
    const P = SETTINGS.prefs;
    if (b.dataset.k === 'perf' && !P.perf) P.low = false;
    if (b.dataset.k === 'low' && !P.low) P.perf = false;
  }, true);
})();

