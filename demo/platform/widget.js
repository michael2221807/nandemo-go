/* Widgets (roadmap M5; system doc §11, §15.3). A widget cannot run the game: when the app goes to the background the
   page writes down what the widgets will show for the next 30 hours, from GAME.plan() — one point every 15 minutes
   plus each machine's sell-out moment — with every word already in the player's language, and the pictures it needs
   (the street's mini machines, the cats in their poses) as PNGs. The shell stores them in the App Group for the
   widget extension, which only reads and shows. The layout and words are the prototype's phone demo (js/phone.js
   wSmall / wMed / lockW), so the two read alike.
   The cats wear what the game dresses them in (GAME.plan().gear, v0.43). */
(() => {
  if (!window.NATIVE || !NATIVE.on || !window.GAME || !GAME.plan) return;
  const HOUR = 3600e3, MIN = 60e3, STEP = 15 * MIN, SPAN = 30 * HOUR;
  const sent = new Set();   // pictures already handed to the shell this session (a cat's picture: per pose and gear)

  function timeline(S) {
    const left = m => m.units !== undefined ? m.units : m.count + m.ware;
    const etaOf = m => m.stopAt !== undefined ? m.stopAt : S.t0 + left(m) * m.gap;
    const paceOf = m => left(m) > 0 ? (etaOf(m) - S.t0) / left(m) : m.gap;
    const at = (m, tt) => { const sold = Math.min(left(m), Math.max(0, (tt - S.t0) / paceOf(m))), rest = m.count + m.ware - sold;
      return { sold, shelf: tt >= etaOf(m) ? 0 : sold < m.count ? m.count - sold : rest }; };
    const earned = tt => S.machines.reduce((a, m) => a + at(m, tt).sold * m.price, 0);
    const live = S.machines.filter(m => left(m) > 0), lastOut = live.length ? Math.max(...live.map(etaOf)) : S.t0;
    const hm = tt => { const d = new Date(tt); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const day0 = tt => { const d = new Date(tt); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
    // (a number keeps its unit on its line: "23 時間 59 / 分" broke between them in the small widget's pill)
    const dur = ms => { const m = Math.max(1, Math.round(ms / MIN)), h = Math.floor(m / 60); return (h ? T`${h} 小时 ${m % 60} 分` : T`${m} 分钟`).replace(/(\d) /g, '$1\u00a0'); };
    const ORDER = ['top', 'front', 'kerb', 'tray', 'box', 'lot'];
    const slot = tt => S.cats && S.cats.length ? S.cats.reduce((a, c) => c.at <= tt ? c : a, S.cats[0]) : null;
    // more than one street (v0.46): the medium and lock-screen widgets show the street last looked at (plan.street),
    // with its name from plan.streets; the small widget's time and the cat count every street (as phone.js does)
    const here = S.street ? S.machines.filter(m => !m.street || m.street === S.street) : S.machines;
    const hereIx = here.map(m => S.machines.indexOf(m));
    const stName = ((S.streets || []).find(z => z.id === S.street) || {}).name || 'なんでも通り';
    const hereOut = here.filter(m => left(m) > 0).length ? Math.max(...here.filter(m => left(m) > 0).map(etaOf)) : S.t0;

    const times = new Set();
    for (let t = S.t0; t <= S.t0 + SPAN; t += STEP) times.add(Math.round(t));
    S.machines.forEach(m => { const e = etaOf(m); if (e > S.t0 && e < S.t0 + SPAN) times.add(Math.round(e)); });
    const cats = new Set();
    const points = [...times].sort((a, b) => a - b).map(t => {
      const when = tt => Math.round((day0(tt) - day0(t)) / 864e5) === 1 ? T`明天 ${hm(tt)}` : hm(tt);
      const now = S.machines.map(m => at(m, t)), out = now.every(a => a.shelf <= 0);
      const nowHere = hereIx.map(k => now[k]), soldN = nowHere.filter(a => a.shelf <= 0).length, outHere = soldN === nowHere.length;
      // the cat to show: one on a machine if any, else in front, at the kerb, in the box …
      let cat = null; const sl = slot(t);
      if (sl) for (const [id, v] of Object.entries(sl.seats)) { const r = ORDER.indexOf(v.kind); if (r >= 0 && (!cat || r < cat.r)) cat = { id, v, r }; }
      let catOut = null;
      if (cat) {
        const brand = (cat.v.machine && MACHINES.find(m => m.id === cat.v.machine) || {}).brand || '';   // (seats name their machine)
        const where = { top: T`在 ${brand} 顶上`, front: T`躺在 ${brand} 前面`, kerb: T`坐在 ${brand} 旁边`, tray: T`钻进 ${brand} 的取货口`, box: T`在纸箱里`, lot: T`在空地上打滚` }[cat.v.kind];
        const pose = { box: 'loaf', snack: 'loaf', sprawl: 'belly' }[cat.v.pose] || cat.v.pose || 'sit';
        // the small widget's background (the owner chose them, 2026-10-22): in the box, the box (its front in front of
        // her); out on the street (in front of a machine, rolling in the lot), the bench under the lamp; else the
        // windowsill; one half hour in nine, the shooting star and the UFO
        const slotN = Math.floor(t / 1800e3), egg = (Math.imul(slotN, 2654435761) >>> 0) % 9 === 0;
        const bg = cat.v.kind === 'box' ? 'box' : egg ? 'egg' : cat.v.kind === 'front' || cat.v.kind === 'lot' ? 'bench' : 'window';
        catOut = { name: I18N.name(NEKO.byId[cat.id].name), where, img: `cat-${cat.id}-${pose}`, bg };
        cats.add(`${cat.id}:${pose}`);
      }
      const tot = S.machines.reduce((a, m) => a + m.cap, 0), have = S.machines.reduce((a, m, k) => a + Math.max(0, Math.min(m.cap, now[k].shelf)), 0);
      return {
        at: t,
        status: out ? T`全部卖空了` : T`还能卖 ${dur(lastOut - t)}`,
        cat: catOut, catAway: T`猫们出去溜达了`,
        bank: UTIL.money(S.bank + earned(t)),
        shelves: hereIx.map(k => Math.round(Math.max(0, Math.min(1, now[k].shelf / S.machines[k].cap)) * 100) / 100),
        foot: outHere ? T`全部卖空了 · 点开补货` : soldN ? T`${soldN} 台卖空了 · 其余 ${when(hereOut)} 卖空` : T`${when(hereOut)} 全部卖空`,
        inline: outHere ? T`${stName} · 卖空了` : T`${stName} · ${when(hereOut)} 卖空`,
        rect: outHere ? T`全部卖空了` : T`${when(hereOut)} 全部卖空`,
        fill: tot ? Math.round(have / tot * 100) / 100 : 0,
      };
    });
    return {
      version: 1, t0: S.t0, lang: I18N.lang, street: I18N.name(stName), soldStamp: '売切',
      machines: here.map(m => ({ i: m.i, id: m.id, brand: m.brand, img: `m-${m.id}` })),
      points, needCats: [...cats], gear: S.gear || {},
    };
  }

  // pictures: SVG drawn by the game, rasterised here (a widget cannot draw the game's SVG)
  const XMLNS = s => s.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ');
  // the canvas takes the picture's own proportions (its viewBox, at `scale` pixels a unit): drawn into a fixed 300 × 240,
  // a sitting cat (50 × 56) came out 1.4 times too wide and a lying one (70 × 40) squeezed (the owner, 2026-10-21:
  // Mike's head an oval on the home screen)
  async function png(body, vb, scale) {
    const [, , vw, vh] = vb.split(/[\s,]+/).map(Number), w = Math.round(vw * scale), h = Math.round(vh * scale);
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(XMLNS(`<svg viewBox="${vb}" width="${w}" height="${h}">${body}</svg>`));
    await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/png').split(',')[1];
  }
  const BOXES = { sit: '-25 -54 50 56', groom: '-25 -54 50 56', yawn: '-25 -54 50 56' };
  async function pictures(data) {
    const out = {};
    for (const m of data.machines) {
      if (sent.has(m.img)) continue;
      try { out[m.img] = await png(STREET.art(m.id), '-8 440 116 228', 1.5); sent.add(m.img); } catch (e) { /* skip */ }   // (174 × 342)
    }
    for (const k of data.needCats) {
      const [id, pose] = k.split(':'), name = `cat-${id}-${pose}`, key = name + JSON.stringify((data.gear || {})[id] || {});
      if (sent.has(key)) continue;
      try { const p = NEKOART.pose(id, pose, (data.gear || {})[id] || {}); out[name] = await png(p.s, BOXES[pose] || '-42 -36 70 40', 6); sent.add(key); } catch (e) { /* skip */ }
    }
    return out;
  }

  // the shell, on the way to the background (after GAME.pause): the widgets' data and any pictures not yet sent
  // (quick: the plan without forward-selling the machines that can get stuck, for the refresh while in front, below)
  window.__ndWidget = async quick => {
    try { const data = timeline(GAME.plan(quick)); return { data, images: await pictures(data) }; }
    catch (e) { console.error('widget: ' + e.message); return null; }
  };

  /* while the game is in front too (2026-10-22, the owner: restocked, and both widgets still said sold out). The write
     on the way to the background asks WidgetKit to reload from the background, which the system counts against a daily
     budget and may put off (a day of test runs spends it); asked while the app is in front, a reload is not counted.
     The sales in between are the timeline's own forecast; what breaks it is stock going up (全部补货, a crate through
     the door, a machine placed), so a few seconds after that the widgets get the street anew (at most every 10 s, the
     last change always sent). The street tells of every change in stock (STREET.stock, STREET.refilled). */
  if (typeof STREET === 'undefined' || typeof MACHINES === 'undefined' || typeof ECON === 'undefined') return;
  const stock = () => MACHINES.map(m => m.count() + (ECON.ware(m) || 0));
  let seen = stock(), timer = 0, last = 0;
  async function check() {
    timer = 0;
    const now = stock(), up = now.length !== seen.length || now.some((n, k) => n > seen[k]);
    if (!up) { seen = now; return; }
    const wait = last + 10e3 - Date.now();
    if (wait > 0) { timer = setTimeout(check, wait); return; }
    seen = now; last = Date.now();
    const r = await window.__ndWidget(true);   // (a forecast at the mean pace: the background write corrects a machine that jams)
    if (r) NATIVE.post('widget', r);
  }
  const soon = () => { if (!timer) timer = setTimeout(check, 4000); };
  for (const k of ['stock', 'refilled']) {
    const f = STREET[k];
    if (typeof f === 'function') STREET[k] = function () { const v = f.apply(this, arguments); soon(); return v; };
  }
})();
