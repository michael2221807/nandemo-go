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
  const fontCSS = () => {
    let css = '';
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const r of rules) if (r.type === CSSRule.FONT_FACE_RULE && /ND (Dela|ZenMaru|QingKe|Sans)/.test(r.style.getPropertyValue('font-family'))) css += r.cssText;
    }
    return css;
  };
  const SCALE = Math.min(3, Math.max(2, window.devicePixelRatio || 2));   // (the screen's own scale: as sharp as the vector)
  const TEXT_PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'fill', 'fill-opacity', 'stroke', 'stroke-width',
    'stroke-linejoin', 'paint-order', 'opacity', 'text-anchor', 'dominant-baseline', 'text-rendering'];
  async function bitmapOf(g, defs, fonts) {
    const b = g.getBBox(), pad = 0.05, x = b.x - b.width * pad, y = b.y - b.height * pad, w = b.width * (1 + 2 * pad), h = b.height * (1 + 2 * pad);
    // the lettering is styled by the page's stylesheet (classes, CSS variables): carry its computed text style along
    const clone = g.cloneNode(true), src = g.querySelectorAll('text, tspan'), dst = clone.querySelectorAll('text, tspan');
    src.forEach((t, k) => { const cs = getComputedStyle(t);
      dst[k].setAttribute('style', TEXT_PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';') + ';' + (dst[k].getAttribute('style') || '')); });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${x} ${y} ${w} ${h}" width="${Math.ceil(w * SCALE)}" height="${Math.ceil(h * SCALE)}">`
      + `<style>${fonts}</style>${defs.outerHTML}${new XMLSerializer().serializeToString(clone)}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement('canvas'); c.width = Math.ceil(w * SCALE); c.height = Math.ceil(h * SCALE);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      return { href: URL.createObjectURL(blob), x, y, w, h };
    } finally { URL.revokeObjectURL(url); }
  }
  let bitmaps = null;
  O.setBgBitmap = async on => {
    const layers = [...bg.children].filter(n => n.getAttribute && n.getAttribute('filter') === 'url(#doodle)');
    if (on && !bitmaps) {
      const defs = bg.querySelector('defs'), fonts = fontCSS(), t0 = performance.now();
      bitmaps = [];
      for (const g of layers) {
        const m = await bitmapOf(g, defs, fonts);
        const im = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        im.setAttribute('href', m.href); im.setAttribute('x', m.x); im.setAttribute('y', m.y); im.setAttribute('width', m.w); im.setAttribute('height', m.h);
        im.setAttribute('preserveAspectRatio', 'none'); im.classList.add('nd-bg-bitmap');
        g.after(im); bitmaps.push(im);
      }
      O.bgBitmapMs = Math.round(performance.now() - t0);
    }
    if (bitmaps) { layers.forEach(g => { g.style.display = on ? 'none' : ''; }); bitmaps.forEach(im => { im.style.display = on ? '' : 'none'; }); }
    O.bgBitmap = on;
  };
  // on unless ?opt=-bgBitmap: once the street has drawn its backdrop with the game's fonts, and again whenever it draws
  // it anew (another street, a new layout: street.js replaces #street-bg's content, taking the old bitmaps with it)
  if (!want.includes('-bgBitmap')) {
    let timer = 0;
    const again = () => { clearTimeout(timer); timer = setTimeout(async () => {
      if (bitmaps && bitmaps.some(im => !im.isConnected)) bitmaps = null;   // (drawn anew: the old pictures went with it)
      if (!bitmaps && bg.querySelector('g[filter="url(#doodle)"]')) await O.setBgBitmap(true);
    }, 300); };
    new MutationObserver(list => { if (list.some(m => [...m.addedNodes, ...m.removedNodes].some(n => !(n.classList && n.classList.contains('nd-bg-bitmap'))))) again(); })
      .observe(bg, { childList: true });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(again, 500));
  }

})();
