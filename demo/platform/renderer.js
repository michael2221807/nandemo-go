/* turn.html?m=<machine> (2026-10-20): the page a second, hidden web view loads to draw the turning pictures for the
   game (ios TurnRenderer; the game shows them while a machine turns, platform/turn.js). It is the same game with only
   that machine, on the save the shell hands it (read-only STORE): it goes into the machine, stops the world (no
   sales, no animation: every picture shows the machine as it stood), and draws any angle on request. */
(() => {
  if (!window.GAME || !window.__ND) return;
  const id = new URLSearchParams(location.search).get('m');
  // the machine's look (涂装, platform/skin.js): 霓虹 when the game shows it so (the save's `neon`, the machines in 霓虹)
  const neon = st => document.querySelectorAll(`.mroot[data-m="${id}"]`).forEach(g => g.classList.toggle('nd-neon', !!(st && Array.isArray(st.neon) && st.neon.includes(id))));
  try { neon(JSON.parse(STORE.get('nandemo-v6') || 'null')); } catch (e) { /* the main look */ }
  const post = (type, data) => { try { webkit.messageHandlers.nandemo.postMessage({ type, data }); } catch (e) {} };
  const frames = n => new Promise(r => { const step = () => n-- > 0 ? requestAnimationFrame(step) : r(); step(); });
  // where the machine is on the page (CSS px): its groups in the three layers, together
  const rect = () => { const rs = ['#world', '#world-ext', '#world-ghost', '#world-top'].map(s => document.querySelector(`${s} .mroot[data-m="${id}"]`)).filter(Boolean).map(g => g.getBoundingClientRect()).filter(r => r.width);
    if (!rs.length) return null; const d = devicePixelRatio || 1, lo = v => Math.floor(v * d - .01) / d, hi = v => Math.ceil(v * d + .01) / d;   // (on whole device pixels: the picture lands on the same pixels)
    const x0 = lo(Math.min(...rs.map(r => r.left)) - 2), y0 = lo(Math.min(...rs.map(r => r.top)) - 2);
    return { x: x0, y: y0, w: hi(Math.max(...rs.map(r => r.right)) + 2) - x0, h: hi(Math.max(...rs.map(r => r.bottom)) + 2) - y0 }; };
  // the same box in the stage's own units (its viewBox): what a picture baked into the app keeps, so that on a screen of
  // any size it lands where the game would draw it (platform/turn.js maps it through the home camera at its angle)
  const world = r => { const st = document.getElementById('stage'), m = st && st.getScreenCTM(); if (!r || !m || !m.a) return null;
    return { x: (r.x - m.e) / m.a, y: (r.y - m.f) / m.d, w: r.w / m.a, h: r.h / m.d }; };
  // (baking, ios TurnBake: the cats stay out of the pictures, they move about; the machine as it stands is the rest)
  if (window.__ndFlags && __ndFlags.bake) document.querySelector('.device').classList.add('nd-bake');
  let base = null;   // { cam, yaw } when the game's camera is zoomed in (each angle orbits from there, as a drag does)
  window.__ndRender = {
    // the game's camera at its yaw. At home every angle frames itself; zoomed in, each angle starts from this camera.
    // xr: the X-ray's set (2026-10-23), scanned all the way (the insides through the wireframe, the shell hidden)
    async camera(c, y, xr) {
      if (__ND.setXr) __ND.setXr(xr ? 1 : 0);
      // (not zoomed: back to the home view first, the page may still hold the camera of a zoomed set drawn before)
      if (!(c && c.zoomed) && __ND.cam && __ND.home && __ND.cam.w < __ND.home.w * .99) __ND.setCam({ ...__ND.home, w: __ND.home.w * 2, h: __ND.home.h * 2 });
      __ND.shot(y); if (c && c.zoomed) __ND.setCam(c); await frames(1);
      base = c && c.zoomed ? { cam: c, yaw: y } : null;
      return rect();
    },
    // draw the machine at yaw y and say where it is (the shell's snapshot waits for that frame itself)
    place(y) {
      if (base) { __ND.shot(base.yaw); __ND.setCam(base.cam); }
      __ND.shot(y);
      const r = rect();
      return { yaw: __ND.yaw, ...(r || { x: 0, y: 0, w: 0, h: 0 }), world: world(r) };
    },
    // the game's newer save (a sale, a restock): this machine's contents and the look, without loading again
    async sync(json) {
      const st = JSON.parse(json), m = MACHINES[0];
      if (st.art) document.querySelector('.device').dataset.art = st.art;
      neon(st);
      if (m && st.m && st.m[m.id]) m.load(st.m[m.id]);
      await frames(1); return true;
    },
    // (checks) where the machine is now, the angle
    at() { return { yaw: __ND.yaw, rect: rect() }; },
  };
  (async () => {
    for (let k = 0; k < 100 && __ND.view !== 'machine'; k++) {
      ['st-receipt', 'st-carry-card'].forEach(i => { const e = document.getElementById(i); if (e && !e.hidden) e.click(); });
      const i = MACHINES.findIndex(m => m.id === id), g = document.querySelector(`#street-svg .st-m[data-i="${i}"]`);
      if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 900));   // (the way in)
    GAME.pause();   // no sales, no animation: the pictures show the machine as it stands (the shell has no audio here)
    await frames(2);
    post('rendererReady', { machine: id, ok: __ND.view === 'machine', yaw: __ND.yaw, rect: rect() });
  })();
})();
