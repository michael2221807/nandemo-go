/* F2 candidates (roadmap "不过线时退回哪里"): targeted fixes for the scenes WebKit finds heaviest, switchable at run
   time so one benchmark run on a phone measures the prototype as it is and with each fix (platform/bench.js turns
   them on scene by scene). Off by default until the device numbers and the design side say otherwise; `?opt=a,b`
   turns them on for a whole session.
   - xray30: the X-ray scan is redrawn at most 30 times a second (build patch in app.js xray(); the design's own
     30 Hz rule for SVG motion).
   - bgBitmap: the street's backdrop (the two wobbly layers street.js draws for each street) is drawn once by the same
     WebKit renderer into a bitmap at the screen's scale, with the game's fonts, and shown in their place. ON by default
     since 2026-10-19: coming back to the street from a machine (the end of 全部补货, the street button) re-filters the
     backdrop, which on an iPhone 13 Pro froze the last machine for ~0.9 s and then showed an empty street for ~0.8 s
     (Chromium on a desktop: 0.35 s); with the bitmap it is ~0.5 s and looks the same. `?opt=-bgBitmap` turns it off. */
(() => {
  const q = new URLSearchParams(location.search);
  const O = window.__ndOpt = { xray30: false, bgBitmap: false };
  const want = (q.get('opt') || '').split(',');
  want.forEach(k => { if (k in O && k !== 'bgBitmap') O[k] = true; });

  /* ---------- bgBitmap ---------- */
  const bg = document.getElementById('street-bg');
  // the @font-face rules the backdrop's lettering needs (js/fonts.js inlines them), for the standalone SVG
  // (繁體中文, 2026-11-02: the translated signs are set in ND Hant Sans 700, a file of its own (platform/hant.css), which an
  // SVG drawn as a picture cannot fetch: carried along as a data: URL, read once)
  let hantSans = null;
  const hantFace = () => hantSans || (hantSans = fetch('platform/fonts/hant-sans-700.woff2').then(r => r.ok ? r.blob() : Promise.reject(r.status))
    .then(b => new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }))
    .then(u => `@font-face{font-family:"ND Hant Sans";font-weight:700;src:url(${u.replace(/^data:[^;,]*/, 'data:font/woff2')}) format("woff2")}`, () => ''));
  const fontCSS = async () => {
    let css = '';
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of rules) if (r.type === CSSRule.FONT_FACE_RULE && /ND (Dela|ZenMaru|QingKe|Sans)/.test(r.style.getPropertyValue('font-family'))) css += r.cssText;
    }
    if (typeof I18N !== 'undefined' && I18N.hant && I18N.full) css += await hantFace();   // (I18N is a const: not on window)
    return css;
  };
  const SCALE = Math.min(3, Math.max(2, window.devicePixelRatio || 2));   // (the screen's own scale: as sharp as the vector)
  const TEXT_PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'fill', 'fill-opacity', 'stroke', 'stroke-width',
    'stroke-linejoin', 'paint-order', 'opacity', 'text-anchor', 'dominant-baseline', 'text-rendering'];
  // (?diag=1: each picture's steps timed, BGBITMAP in the diag log, and marked for its JANK lines: platform/diag.js; the
  // owner, 2026-11-01: the street stops a moment after the app starts)
  const D = /[?&]diag=1/.test(location.search) && window.NATIVE, mark = s => { if (D) (window.__ndMarks = window.__ndMarks || []).push([performance.now(), s]); };
  // (page flag bgWorker, a phone test, 2026-11-01: the PNG encoded by a worker's OffscreenCanvas, off the page's thread, as
  // turn.js's t3dPng does for the 3D's pictures; toBlob encoded it on the page's thread: Chromium at 4× slower 1.1–2.1 s
  // for each of the two pictures, the street stopped meanwhile. Any failure: toBlob, as before)
  const viaWorker = !!(window.__ndFlags && __ndFlags.bgWorker && window.OffscreenCanvas && window.createImageBitmap && window.Worker);
  let encoder = null;
  const pngOf = async c => {
    if (viaWorker) try {
      if (!encoder) encoder = new Worker(URL.createObjectURL(new Blob([`onmessage = async e => { const { bm } = e.data; try {
        const c = new OffscreenCanvas(bm.width, bm.height); c.getContext('2d').drawImage(bm, 0, 0); bm.close();
        postMessage({ blob: await c.convertToBlob({ type: 'image/png' }) }); } catch (x) { postMessage({ err: String(x) }); } };`], { type: 'text/javascript' })));
      const bm = await createImageBitmap(c);
      const r = await new Promise(res => { const t = setTimeout(() => res({ err: 'timeout' }), 10000);
        encoder.onmessage = e => { clearTimeout(t); res(e.data); }; encoder.onerror = () => { clearTimeout(t); res({ err: 'worker' }); };
        encoder.postMessage({ bm }, [bm]); });
      if (r.blob) return { blob: r.blob, how: 'worker' };
      encoder = null; if (D) NATIVE.post('diag', `BGBITMAP worker failed: ${r.err}`);
    } catch (e) { encoder = null; if (D) NATIVE.post('diag', `BGBITMAP worker failed: ${e}`); }
    return { blob: await new Promise(r => c.toBlob(r, 'image/png')), how: 'page' };
  };
  // (each picture kept for the launches after, in the page's own IndexedDB (app://local, where the save's localStorage is
  // too), keyed by what it shows: the SVG drawn (the street, its layout, the language, the lettering's style), the scale
  // and the fonts. One kept: no picture made at the start, where WebKit drew the street's filters ~0.9 s on the page's
  // thread right after the launch picture went (bgWorker did not help: the drawing, not the PNG). A failure or 2 s with
  // no answer: made as before. The 6 newest kept (two pictures a street). The phone (ab0407b, page flag bgCache then,
  // 4 launches): IndexedDB there, the 2nd–4th from it, the longest frame after the launch picture 146–167 ms (was
  // 0.94 s + 0.5 s), the launch picture no longer up. On by default since 2026-11-01; the page flag noBgCache turns it
  // off, and bgCacheReset (a phone test) empties it as the page starts, for a launch as the first one)
  const caching = !(window.__ndFlags && __ndFlags.noBgCache) && !!window.indexedDB;
  const hashOf = str => { let a = 0x811c9dc5, b = 0x9747b28c; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); a = Math.imul(a ^ c, 0x01000193); b = Math.imul(b ^ c, 0x5bd1e995); }
    return (a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0'); };
  let dbP = null, emptied = caching && window.__ndFlags && __ndFlags.bgCacheReset ? new Promise(res => { try { const r = indexedDB.deleteDatabase('nd-street');
    r.onsuccess = r.onerror = r.onblocked = () => { if (D) NATIVE.post('diag', 'BGBITMAP cache emptied (bgCacheReset)'); res(); }; } catch (e) { res(); } }) : Promise.resolve();
  const db = () => dbP || (dbP = emptied.then(() => new Promise((res, rej) => { const r = indexedDB.open('nd-street', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('bg'); r.result.createObjectStore('at'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); })));
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('no answer in ' + ms + ' ms')), ms))]);
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => { const t = d.transaction(['bg', 'at'], mode), q = fn(t.objectStore('bg'), t.objectStore('at'));
    t.oncomplete = () => res(q && q.result); t.onerror = t.onabort = () => rej(t.error); }));
  const cacheGet = key => within(tx('readonly', bgS => bgS.get(key)), 2000).catch(e => { dbP = null; if (D) NATIVE.post('diag', `BGBITMAP cache read failed: ${e && e.message || e}`); return null; });
  const cachePut = (key, png) => within(tx('readwrite', (bgS, atS) => { bgS.put(png, key); atS.put(Date.now(), key);
    const ks = atS.getAllKeys(), vs = atS.getAll(); vs.onsuccess = () => { ks.result.map((k, i) => [k, vs.result[i]]).sort((a, b) => b[1] - a[1]).slice(6).forEach(([k]) => { bgS.delete(k); atS.delete(k); }); }; }), 5000)
    .then(() => true, e => { if (D) NATIVE.post('diag', `BGBITMAP cache write failed: ${e && e.message || e}`); return false; });
  async function bitmapOf(g, defs, fonts, onlyCached) {
    const t0 = performance.now(); mark('backdrop picture: built');
    const b = g.getBBox(), pad = 0.05, x = b.x - b.width * pad, y = b.y - b.height * pad, w = b.width * (1 + 2 * pad), h = b.height * (1 + 2 * pad);
    // the lettering is styled by the page's stylesheet (classes, CSS variables): carry its computed text style along
    const clone = g.cloneNode(true), src = g.querySelectorAll('text, tspan'), dst = clone.querySelectorAll('text, tspan');
    src.forEach((t, k) => { const cs = getComputedStyle(t);
      dst[k].setAttribute('style', TEXT_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';') + ';' + (dst[k].getAttribute('style') || '')); });
    const head = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${x} ${y} ${w} ${h}" width="${Math.ceil(w * SCALE)}" height="${Math.ceil(h * SCALE)}">`,
      body = `${defs.outerHTML}${new XMLSerializer().serializeToString(clone)}</svg>`, svg = `${head}<style>${fonts}</style>${body}`;
    let key = null;
    if (caching) {
      let f = ''; for (let i = 0; i < fonts.length; i += 997) f += fonts[i];
      key = `${hashOf(head + body)} ${fonts.length} ${hashOf(f)}`;
      const tk = performance.now(), png = await cacheGet(key);
      if (png) { const href = URL.createObjectURL(new Blob([png], { type: 'image/png' })), td = performance.now();
        const keep = new Image(); keep.src = href; try { await keep.decode(); } catch (e) { /* decoded as it is drawn */ }
        if (D) NATIVE.post('diag', `BGBITMAP ${Math.ceil(w * SCALE)}x${Math.ceil(h * SCALE)} px from the cache: built ${Math.round(tk - t0)} read ${Math.round(td - tk)} decoded ${Math.round(performance.now() - td)} ms (${Math.round(png.byteLength / 1024)} KB)`);
        mark('backdrop picture: from the cache');
        return { href, x, y, w, h, keep }; }
    }
    if (onlyCached) return null;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const t1 = performance.now(); mark('backdrop picture: decode');
      const img = new Image(); img.src = url; await img.decode();
      const t2 = performance.now(); mark('backdrop picture: drawn');
      const c = document.createElement('canvas'); c.width = Math.ceil(w * SCALE); c.height = Math.ceil(h * SCALE);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const t3 = performance.now(); mark('backdrop picture: PNG');
      const { blob, how } = await pngOf(c);
      const t4 = performance.now(); mark('backdrop picture: done');
      if (D) NATIVE.post('diag', `BGBITMAP ${c.width}x${c.height} px, ${Math.round(svg.length / 1024)} KB of SVG: built ${Math.round(t1 - t0)} decoded ${Math.round(t2 - t1)} drawn ${Math.round(t3 - t2)} PNG ${Math.round(t4 - t3)} ms (${Math.round(blob.size / 1024)} KB, on the ${how === 'worker' ? "worker's" : "page's"} thread)`);
      if (key) blob.arrayBuffer().then(png => { const tp = performance.now(); return cachePut(key, png).then(ok => { if (D && ok) NATIVE.post('diag', `BGBITMAP kept for the next launch (${Math.round(png.byteLength / 1024)} KB, ${Math.round(performance.now() - tp)} ms)`); }); }).catch(() => {});
      return { href: URL.createObjectURL(blob), x, y, w, h };
    } finally { URL.revokeObjectURL(url); }
  }
  let bitmaps = null;
  // (page flag bgCover, a phone test, 2026-11-01: the pictures made while the launch picture is still up, the page's
  // 'ready' waiting for them, 3 s at most, platform/platform.js; they were made ~1 s after the street showed, which
  // stopped it a moment)
  const cover = !!(window.__ndFlags && __ndFlags.bgCover);
  // (page flag bgEarly, a phone test, 2026-11-01: with the pictures kept (bgCache), the 2nd launch on still stopped once,
  // 146–167 ms 1.2–1.3 s after the launch picture went, as the kept pictures took the drawn layers' place (they were
  // looked up 0.8 s after the fonts were ready). Here they are looked up as soon as this script runs (the key needs the
  // fonts' rules, not the fonts loaded) and shown while the launch picture is still up, the page's 'ready' waiting for
  // them two frames on (platform/platform.js); none kept (the first launch, another street, another language): made then
  // too, the fonts ready first, the launch picture up meanwhile, 3 s at most, as bgCover)
  // (the phone, e8aec2e, 3 launches with bgEarly: the longest frame after the launch picture 0/0/53 ms (without: 995–1375
  // ms), 'ready' 3.14–3.39 s from the process' start (with the kept pictures looked up late: 3.49–3.64 s), the welcome
  // card's animation whole; none kept (bgCacheReset): the launch picture up 1.6–2.1 s longer, once. On by default since
  // 2026-11-01; the page flag noBgEarly turns it off)
  const early = caching && !(window.__ndFlags && (__ndFlags.noBgEarly || __ndFlags.renderer));
  // (and with it the two drawn layers held, neither filtered nor drawn, from the first frame (tools/build_www.py, an
  // inline script before the street): the phone's frame of 0.86–1.09 s as the launch picture went, every launch, was
  // WebKit filtering them the first time. Let go once the kept pictures are in their place, or at once when none are)
  const hold = document.getElementById('nd-bg-hold');
  const release = why => { if (hold && hold.isConnected) { hold.remove(); mark('backdrop: drawn layers let go (' + why + ')'); } };
  const twoFrames = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  let bgDone; const bgDoneP = new Promise(r => { bgDone = r; });
  O.whenBg = cap => Promise.race([bgDoneP, new Promise(r => setTimeout(r, cap))]);
  O.waitBg = cover || early;   // (platform.js: the launch picture waits for the pictures)
  // (onlyCached: the kept pictures or none, nothing made: false when a layer has none kept. One call at a time: the
  // early look-up and a redrawn street's could overlap)
  let busy = Promise.resolve();
  O.setBgBitmap = (on, onlyCached) => (busy = busy.catch(() => {}).then(() => setBg(on, onlyCached)));
  const setBg = async (on, onlyCached) => {
    if (bitmaps && bitmaps.some(im => !im.isConnected)) bitmaps = null;
    const layers = [...bg.children].filter(n => n.getAttribute && n.getAttribute('filter') === 'url(#doodle)');
    if (on && !bitmaps) {
      const defs = bg.querySelector('defs'), fonts = await fontCSS(), t0 = performance.now();
      let got = null;
      if (onlyCached) { got = [];
        for (const g of layers) { const m = await bitmapOf(g, defs, fonts, true); if (!m) { got.forEach(x => URL.revokeObjectURL(x.href)); return false; } got.push(m); } }
      bitmaps = [];
      for (const g of layers) {
        const m = got ? got.shift() : await bitmapOf(g, defs, fonts);
        const im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        im.setAttribute('href', m.href); im.setAttribute('x', m.x); im.setAttribute('y', m.y); im.setAttribute('width', m.w); im.setAttribute('height', m.h);
        im.setAttribute('preserveAspectRatio', 'none'); im.classList.add('nd-bg-bitmap'); if (m.keep) im._ndKeep = m.keep;
        g.after(im); bitmaps.push(im);
      }
      O.bgBitmapMs = Math.round(performance.now() - t0);
    }
    if (bitmaps) { layers.forEach(g => { g.style.display = on ? 'none' : ''; }); bitmaps.forEach(im => { im.style.display = on ? '' : 'none'; }); }
    if (on && bitmaps) mark('backdrop picture: shown');
    O.bgBitmap = on;
    // (the pictures on screen two frames on: the launch picture can go)
    if (on && bitmaps) twoFrames().then(bgDone);
    return true;
  };
  // on unless ?opt=-bgBitmap: once the street has drawn its backdrop with the game's fonts, and again whenever it draws
  // it anew (another street, a new layout: street.js replaces #street-bg's content, taking the old bitmaps with it)
  // (and off with the page flag noBgBitmap, -pageFlags: a phone test of what it costs as the app starts, 2026-11-01)
  if (!want.includes('-bgBitmap') && !(window.__ndFlags && __ndFlags.noBgBitmap)) {
    let timer = 0;
    const again = () => { clearTimeout(timer); timer = setTimeout(async () => {
      if (bitmaps && bitmaps.some(im => !im.isConnected)) bitmaps = null;   // (drawn anew: the old pictures went with it)
      if (!bitmaps && bg.querySelector('g[filter="url(#doodle)"]')) await O.setBgBitmap(true);
    }, 300); };
    new MutationObserver(list => { if (list.some(m => [...m.addedNodes, ...m.removedNodes].some(n => !(n.classList && n.classList.contains('nd-bg-bitmap'))))) again(); })
      .observe(bg, { childList: true });
    const fontsReady = () => document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const make = () => { if (!bitmaps && bg.querySelector('g[filter="url(#doodle)"]')) O.setBgBitmap(true).catch(() => bgDone()); else bgDone(); };
    if (early && bg.querySelector('g[filter="url(#doodle)"]')) {
      const t0 = performance.now();
      O.setBgBitmap(true, true).then(hit => { if (D) NATIVE.post('diag', `BGBITMAP early: ${hit ? 'kept pictures shown' : 'none kept, made now'} ${Math.round(performance.now() - t0)} ms after this script, ${Math.round(performance.now())} ms after the page started${hold ? ', the drawn layers held till now' : ''}`);
        release(hit ? 'kept pictures shown' : 'none kept'); if (!hit) fontsReady().then(make); }).catch(() => { release('failed'); fontsReady().then(make); });
    } else { release('not early'); fontsReady().then(() => { if (!cover) { setTimeout(again, 500); return; } make(); }); }
  } else { release('no pictures'); bgDone(); }

})();
