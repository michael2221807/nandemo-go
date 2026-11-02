/* The game's side of the native shell. Loaded after js/app.js, so the game has booted when this runs.
   In the iOS app it talks to Swift through window.webkit.messageHandlers.nandemo; in a plain browser (the benchmark in
   Chrome or Safari) none of this applies. Interfaces the design side keeps stable for us (handoff doc, section 9):
   STORE (defined by the shell before store.js), GAME.pause/resume/plan/turnTo, PAY.has/on/init/revoke, SND.pause/resume,
   UTIL.haptic, the four save keys. */
(() => {
  // (debug experiments: ?flags=a,b in the page's address adds to the shell's -pageFlags, for runs started by a query)
  { const f = /[?&]flags=([^&]*)/.exec(location.search); if (f) { window.__ndFlags = window.__ndFlags || {}; decodeURIComponent(f[1]).split(',').forEach(k => { if (k) __ndFlags[k] = true; }); } }
  const h = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nandemo;
  const post = (type, data) => { if (!h) return; try { h.postMessage({ type, data }); } catch (e) { /* not serialisable */ } };
  window.NATIVE = { on: !!h, post };
  // the names mode on <html> (全部翻译 or the Japanese names: a change reloads the page), for platform.css
  try { if (typeof I18N !== 'undefined') document.documentElement.dataset.names = I18N.full ? 'local' : 'jp'; } catch (e) { /* none */ }

  // boot ran synchronously in app.js; two frames later its first frame is on screen and the game takes touches
  // (the launch picture also waits for the street's backdrop pictures (bgEarly, on by default; bgCover, a phone test),
  // platform/opt.js, 3 s at most; those frames come while the scripts after this one still load, opt.js among them)
  const ready = () => { window.__platformReady = Math.round(performance.now()); post('ready', { t: window.__platformReady }); };
  const bgCover = () => (window.__ndOpt && __ndOpt.waitBg && __ndOpt.whenBg ? __ndOpt.whenBg(3000) : Promise.resolve()).then(ready);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const fl = window.__ndFlags || {};
    if (fl.renderer || (fl.noBgEarly && !fl.bgCover)) ready();
    else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bgCover, { once: true }); else bgCover();
  }));

  // a finger on a 改造 pin: the game opens the card on pointerup (app.js tap()), and the click the browser sends once
  // the finger lifts then lands on the card that just opened under it (its backdrop closes it, or a button on it is
  // pressed). A mouse's click goes to the pin. The tap that opens the card does nothing inside it (also in a browser)
  // the machines' four blurs (#glow #soft #bloom #bloom-s, index.html:1250) get a filter region just big enough for
  // what uses them, here and in the turning pictures' page (turn.html has this script, not opt.js). WebKit renders a
  // filter's whole region into a bitmap of at most 4096 px a side: the design's 9000-unit regions came out at 0.45 px a
  // unit on a close-up drawn at ~7, so the 2 px tube light (.tubelight, #soft) was a wide frosted band, and every
  // filtered element held a 4096² buffer. Each region covers every element that uses the filter, in that element's own
  // user space, on the street and on every machine at every yaw and zoom (measured in Chromium: getBBox plus the
  // stroke), with ≥ 6σ of blur to spare on each side, so Chromium draws the same pixels. filterUnits stays
  // userSpaceOnUse: an objectBoundingBox region is empty on a level line, which would then not be drawn at all.
  //   glow (σ 2): the X-ray scan line (#scan .sl) across the cabinet's projected box, at any yaw and sweep
  //   soft (σ 1.1): the side lamps (sidePlane, 0..84 × 5..235), the signs, the tube / shelf / lift lights (projected)
  //   bloom (σ 12): the drink machine's lane glows (FRONT, 88 × 114), the backdrop's lamp (env.js, 132 wide)
  //   bloom-s (σ 4.5): halos, tray and outlet glows (FRONT, up to 85 × 226), the cup machine's lamp ellipse (±14 × ±11)
  // `?opt=-filterRegions` keeps the design's regions; __ndFilterRegions(false / true) switches at run time
  const REGIONS = { glow: [-150, -320, 350, 470], soft: [-140, -250, 320, 530], bloom: [-75, -75, 295, 265], 'bloom-s': [-45, -45, 220, 305] };
  const DESIGN = {};
  window.__ndFilterRegions = on => {
    for (const id in REGIONS) {
      const f = document.getElementById(id); if (!f || f.tagName.toLowerCase() !== 'filter') continue;
      if (!DESIGN[id]) DESIGN[id] = ['x', 'y', 'width', 'height'].map(k => f.getAttribute(k));
      const v = on ? REGIONS[id] : DESIGN[id];
      ['x', 'y', 'width', 'height'].forEach((k, n) => f.setAttribute(k, v[n]));
    }
    return on;
  };
  if (!/[?&]opt=[^&]*-filterRegions/.test(location.search)) __ndFilterRegions(true);   // (the defs are in index.html, never redrawn)

  const upg = document.getElementById('upg'); let tapOpens = false;
  addEventListener('pointerdown', e => { tapOpens = e.pointerType !== 'mouse' && upg.hidden; }, true);
  addEventListener('click', e => { if (tapOpens && upg.contains(e.target)) { e.stopImmediatePropagation(); e.preventDefault(); } tapOpens = false; }, true);
  if (!h) return;

  // haptics: WKWebView has no navigator.vibrate; the shell plays them (the settings switch still applies)
  UTIL.haptic = ms => { if (!UTIL.noHaptic) post('haptic', ms); };

  // sound: an ambient session (follows the silent switch, mixes with the player's music). A call, Siri or another
  // app can leave the audio context interrupted; the next touch wakes it again (the prototype only unlocks once)
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* older WebKit */ }
  let touched = false;
  addEventListener('pointerup', () => {
    if (!touched) { touched = true; return; }   // (the game's own first touch creates the context)
    const ctx = SND.unlock();
    if (ctx && ctx.state !== 'running' && SND.enabled && !GAME.paused) ctx.resume();
  }, true);

  // the settings page's placeholders (settings.js:33, :35, :75): the app's version in the footer, the "cloud save ·
  // synced" row only when iCloud is on, and 致谢 / 隐私 / 联系我们 as real pages (native sheets)
  const setBody = document.getElementById('set-body');
  // (2026-10-24, before the App Store: the app's own name in the player's language and its own version — the game's
  // v0.x read as a beta, review 2.2; zh-Hant adds its own name)
  const APPNAME = { zh: '南丁猫自贩机', 'zh-Hant': '南丁貓自販機', en: 'Nandemo Go', ja: 'なんでも自販機' };
  const version = window.__ndAppVersion || '';
  new MutationObserver(() => {
    const foot = setBody.querySelector('.set-foot'), t = foot && foot.firstChild;
    if (t && t.nodeType === 3 && /なんでも自販機 v0\.\d+/.test(t.textContent))
      t.textContent = t.textContent.replace(/なんでも自販機 v0\.\d+(\.\d+)?/, `${APPNAME[I18N.code] || 'なんでも自販機'}${version ? ' ' + version : ''}`);
    // the cloud-save row says 已同步: true only when iCloud is on (the shell syncs the game save there, M6)
    const restore = setBody.querySelector('[data-act="restore"]'), cloud = restore && restore.parentElement.querySelector('div.set-row');
    if (cloud && !window.__ndCloud && cloud.style.display !== 'none') cloud.style.display = 'none';
  }).observe(setBody, { childList: true });
  document.getElementById('settings').addEventListener('click', e => {
    const b = e.target.closest('[data-act="about"]'); if (!b) return;
    const k = [...b.parentElement.querySelectorAll('[data-act="about"]')].indexOf(b);
    if (k < 0 || k > 2) return;
    e.stopImmediatePropagation(); post('about', { page: ['credits', 'privacy', 'contact'][k], lang: I18N.code });
  }, true);

  // the shell calls these on the app's background / foreground (GAME is idempotent, the page's visibilitychange
  // calls them too)
  window.__ndPause = () => { GAME.pause(); if (STORE.flush) STORE.flush(); return true; };
  window.__ndResume = () => { GAME.resume(Date.now()); return true; };
})();

/* 试运转 / 试装 (2026-10-20, 方案B): the chip and its two buttons (全部装上 or 拆下, 买下) sit as one row at the top of
   the bottom bar, above 今夜. With the page filling the screen the top UI came down out of the notch and, under the
   machine's name, they covered the machine's roof. The same three elements, moved into the bar (the game keeps its
   references to them, their listeners and its own show / hide rules); platform.css lays the row out, only in trial mode */
(() => {
  const bar = document.querySelector('.bottombar'), els = ['trialchip', 'trialparts', 'trialbuy'].map(i => document.getElementById(i));
  if (!bar || els.some(e => !e)) return;
  const row = document.createElement('div');
  row.className = 'nd-trialrow';
  row.append(...els);
  bar.prepend(row);
  // one line, never wrapped or cut: when the three are wider than the row (English with a long price, a narrow phone),
  // the row is scaled down to fit. Measured whenever a button's text or the row's width changes (layout sizes, which
  // the scale does not touch)
  const fit = () => {
    const shown = els.filter(e => e.offsetWidth), gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const need = shown.reduce((w, e) => w + e.offsetWidth, 0) + gap * (shown.length - 1) + 2;   // (+2: the buttons' ink shadow)
    const s = shown.length && row.clientWidth && need > row.clientWidth ? row.clientWidth / need : 1;
    row.style.scale = s < 1 ? s.toFixed(4) : '';
  };
  const ro = new ResizeObserver(fit); ro.observe(row); els.forEach(e => ro.observe(e));
})();

/* the street switch 「なんでも通り ⇄」 under the wallet card, beside 今日 (2026-10-20, the owner's 第二版; platform.css):
   out of the top bar, whose row now holds only the clock, into the street with the card. The same element, so the game
   keeps its reference, its listener and its show / hide rule */
(() => {
  const chip = document.getElementById('st-street'), street = document.getElementById('street');
  if (chip && street) street.appendChild(chip);
  // 今日 into the wallet card as its last line (2026-10-21, the owner's pick of 第一版; platform.css). Same element: the
  // game still writes it by id
  const today = document.getElementById('st-today'), wallet = document.getElementById('st-wallet');
  if (today && wallet) wallet.appendChild(today);
  // 商店 and 设置 in the ears: a label wider than the Chinese one (72 pt, which keeps 10 pt from the widest notch) goes,
  // the icon stays (aria-label still names the button). The label is wrapped so CSS can hide it; checked again once the
  // fonts are in (their width changes)
  const ears = ['gear', 'st-paybtn'].map(i => document.getElementById(i)).filter(Boolean);
  ears.forEach(b => [...b.childNodes].forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement('span'); s.className = 'nd-ear-label'; n.replaceWith(s); s.append(n); } }));
  // (not while the button is out of the layout: 商店 lives in the street, display:none on the machine screen; measured
  // again when it comes back, as its size changes then)
  const fit = b => { if (!b.getClientRects().length) return; b.classList.remove('nd-icononly'); if (b.offsetWidth > 74) b.classList.add('nd-icononly'); };
  ears.forEach(fit); if (document.fonts) document.fonts.ready.then(() => ears.forEach(fit));
  if (window.ResizeObserver) { const ro = new ResizeObserver(es => es.forEach(e => fit(e.target))); ears.forEach(b => ro.observe(b)); }

  // the new player's hint, wrapped onto two lines beside the street switch: as narrow as it can be on the same number of
  // lines, so the lines come out even (text-wrap: balance does this from iOS 17.5; this is for 17.0–17.4). Each time its
  // text changes or it shows
  const guide = document.getElementById('st-guide');
  if (guide) {
    const even = () => {   // (its own style changes are not watched: no loop)
      // (hidden, nothing to measure: app.js guideTick sets hidden again at every ui(), each a mutation, and the page was
      // laid out there and then each time, whatever else waited to be restyled — the machine's groups switching 涂装 —
      // 15 ms a time at Chromium's 4× slowdown, 2026-11-01. Measured as it shows: hidden goes, the observer calls again)
      if (guide.hidden) return;
      guide.style.width = '';
      const w = guide.offsetWidth, h = guide.offsetHeight;
      if (w && h > 44) {   // (one line is 38 pt tall)
        let lo = w / 2, hi = w;
        for (let k = 0; k < 9; k++) { const m = (lo + hi) / 2; guide.style.width = m + 'px'; if (guide.offsetHeight > h) lo = m; else hi = m; }
        guide.style.width = Math.ceil(hi) + 'px';
      }
    };
    new MutationObserver(even).observe(guide, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    even(); if (document.fonts) document.fonts.ready.then(even);
  }
})();

/* A machine's bob as it is tapped on the street, played off the page's thread (the owner, 2026-11-01: "点击机器时2D的点击动画
   （缩小放大）有时也会一卡一卡的"). street.js open() bobs the machine (0.4 s) and opens it 0.16 s in: the machine's page laid out
   and the 3D's work for it then held the page's thread a good part of a second, the bob stopped midway; and the bob moved
   the drawing under its hand-drawn filter, which iOS redoes every frame. Here the drawing is copied into an svg of its own
   before the street's layer, which the system animates in a layer of its own whatever the page's thread does; the drawing
   itself hidden till the bob is over. The copy is the same drawing at the same place in the same units: the filter's
   noise, set in those units, the same. The phone (0ad499c, 3 machines × 2): the bob whole, not a frame stopped, the
   machine opened 0.70–0.85 s after the tap (as it was: stopped after 0.10–0.23 s; tapWait, the bob first: 0.97–1.20 s).
   On by default since 2026-11-01; the page flag noTapLift turns it off.
   (a cat asleep on the roof: the phone drew the copy over it, the roof rising through the cat as the bob stretched,
   where Chromium keeps the street's layer over the copy. The street's cats over the bob's reach are copied too, still,
   into an svg after the bob's copy, over it whichever way the layers go; the cats themselves hidden meanwhile) */
(() => {
  if ((window.__ndFlags && __ndFlags.noTapLift) || typeof UTIL === 'undefined' || !UTIL.restart) return;
  const street = document.getElementById('street-svg'), host = document.getElementById('street'), NS = 'http://www.w3.org/2000/svg';
  if (!street || !host) return;
  document.head.insertAdjacentHTML('beforeend', '<style>.nd-lift{position:absolute;pointer-events:none;overflow:visible;transform-origin:50% 100%;will-change:transform}'
    + '.nd-lift.go{animation:boing .4s ease-out}.nd-lift-over{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}</style>');
  const r0 = UTIL.restart, still = matchMedia('(prefers-reduced-motion: reduce)');
  // (the street's fonts for lettering, given only inside #street-svg (.st-sign, .st-num …): carried onto a copy's text)
  const fontsOf = (from, to) => { const src = from.querySelectorAll('text, tspan'), dst = to.querySelectorAll('text, tspan');
    src.forEach((t, k) => { const cs = getComputedStyle(t);
      dst[k].setAttribute('style', ['font-family', 'font-weight', 'font-style', 'font-size', 'letter-spacing'].map(q => `${q}:${cs.getPropertyValue(q)}`).join(';') + ';' + (dst[k].getAttribute('style') || '')); }); };
  let finish = null;
  UTIL.restart = (el, cls) => {
    const bob = cls === 'boing' && !still.matches && el && el.classList && el.classList.contains('st-m') && street.contains(el) && el.querySelector('.st-bob');
    const m = bob && bob.getScreenCTM(), b = bob && bob.getBBox();
    if (!bob || !m || !b.width) return r0(el, cls);
    if (finish) finish();   // (another machine's bob still on: over at once, its drawing back)
    const hb = host.getBoundingClientRect(), s = document.createElementNS(NS, 'svg');
    s.setAttribute('class', 'nd-lift'); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`); s.setAttribute('preserveAspectRatio', 'none');
    Object.assign(s.style, { left: `${m.a * b.x + m.e - hb.left}px`, top: `${m.d * b.y + m.f - hb.top}px`, width: `${m.a * b.width}px`, height: `${m.d * b.height}px` });
    // (its machine's classes, less the bob's: the street's styles for its parts (.st-m .tk-…) hold in the copy too)
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', (el.getAttribute('class') || '').replace(/\bboing\b/g, '').trim());
    const copy = bob.cloneNode(true); g.appendChild(copy); s.appendChild(g); fontsOf(bob, copy);
    // the cats (and a cats' meal) where the bob reaches (it grows 4 % across, 3 % up from its foot): copied as they are
    const r = bob.getBoundingClientRect(), reach = { l: r.left - r.width * .04, r: r.right + r.width * .04, t: r.top - r.height * .06, b: r.bottom };
    const cats = [], over = document.createElementNS(NS, 'svg'); over.setAttribute('class', 'nd-lift-over'); over.setAttribute('aria-hidden', 'true');
    Object.assign(over.style, { width: `${hb.width}px`, height: `${hb.height}px` });
    for (const id of ['st-cats', 'st-meal']) { const layer = document.getElementById(id); if (!layer) continue;
      for (const c of layer.children) { const q = c.getBoundingClientRect(); if (!q.width || q.right < reach.l || q.left > reach.r || q.bottom < reach.t || q.top > reach.b) continue;
        const pm = c.parentNode.getScreenCTM(); if (!pm) continue;
        const w = document.createElementNS(NS, 'g'); w.setAttribute('transform', `matrix(${pm.a} ${pm.b} ${pm.c} ${pm.d} ${pm.e - hb.left} ${pm.f - hb.top})`);
        if (layer.getAttribute('class')) w.setAttribute('class', layer.getAttribute('class'));
        const cc = c.cloneNode(true); w.appendChild(cc); fontsOf(c, cc); over.appendChild(w); cats.push(c); } }
    document.querySelectorAll('.nd-lift, .nd-lift-over').forEach(x => x.remove());
    // (the cats themselves hidden meanwhile, as the drawing is: drawn twice, their outlines came out a little bolder)
    street.before(s); if (over.childNodes.length) street.before(over); bob.style.visibility = 'hidden'; cats.forEach(c => { c.style.visibility = 'hidden'; });
    let ended = false; const done = () => { if (ended) return; ended = true; s.remove(); over.remove(); bob.style.visibility = ''; cats.forEach(c => { c.style.visibility = ''; }); if (finish === done) finish = null; };
    finish = done;
    // (two frames on, as UTIL.restart starts a CSS animation)
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('go')));
    s.addEventListener('animationend', done); setTimeout(done, 1500);
  };
})();
