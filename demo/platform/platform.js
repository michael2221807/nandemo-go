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
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__platformReady = Math.round(performance.now());
    post('ready', { t: window.__platformReady });
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
