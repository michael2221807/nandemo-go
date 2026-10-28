/* v0.7 controller. Two views: the street (home: every machine in miniature, selling on its own) and one machine up
   close (drag sideways to turn the camera from front-left to front-right, also while zoomed in; X-ray scan; door + dock;
   tap the machine to call customers over — tap quickly and the whole mechanism hurries). Money is shown in letter
   units (UTIL.money); lifetime takings drive the carries on the street. Camera, saving. */
(() => {
  const $ = id => document.getElementById(id);
  const svg = $('stage'), world = $('world'), device = document.querySelector('.device');
  const readEl = $('readout'), hintEl = $('hint'), toastEl = $('toast'), sndBtn = $('snd'), wxBtn = $('wx'), artBtn = $('art'), xBtn = $('xray'), doorBtn = $('opendoor'), resetBtn = $('reset'), trialBtn = $('trialparts');
  const bottom = document.querySelector('.bottombar'), dock = $('dock');
  // yaw 0 = the classic iso view (azimuth 45°); -114..24 spans azimuth -69° (front-left) .. 69° (front-right)
  const KEY = 'nandemo-v6', LIM_L = -114, LIM_R = 24, SENS = .3;
  const MBOX = [0, 0, -6, 120, 84, 252];   // the cabinet with base and lid: what zoomed views orbit around and stay on
  let sold = 0, yen = 0, cam = null, home = null, homeOpen = null, camAnim = 0, xr = 0, xrAnim = 0, msg = '', msgUntil = 0, touched = false, mode = 'shut', cur = 0, sliding = false;
  let yaw = 0, targetYaw = 0, rebuildPending = false, turning = false, yawTweens = 0, lastDetent = 0;
  // view: 'street' (home) or 'machine'. Money lives in ECON (bank = in hand, life = everything ever taken).
  // seenTier: the highest goods tier the player has looked at in the shop (a dot on 配货 when a new one opens)
  let view = 'street', introDone = false, seenTier = {}, holdIv = 0, buyCheckT = 0, paused = false, pausedAt = 0, quietTurn = false;
  // (v0.43) GAME.onTurn: a shell showing pre-rendered angles takes the turn over (start / move / end / done)
  let turnHandler = null, turnSess = false, wheelEndT = 0;
  // stepSeen: the price step last announced; allRun: 全部补货 is running; ACT: machines standing on the street
  let stepSeen = 0, allRun = false, allSpeed = 6, ACT = new Set(), lotsSeen = 0, lastWare = 0;
  let curSt = 0;   // (v0.46) the street in view: 0 なんでも通り, 1 駅前通り (see docs/nandemo-开新街.md)
  let allOn = false, opened = {};   // opened: machines with their own unlock that have opened (their card shown)   // 全部补货 unlocked (user, 2026-10-16: with two machines restocking by hand is the game; it opens with the third)
  let trial = null;   // 试运转: { i, snap, back, upg } while a machine is being tried from the album (declared early: save() checks it);
  // 试装 on a machine you own: the same, with { preview: true, part, cost }
  // machines whose goods or prices moved (new tier, new cat, this week's fashion): redrawn the next time they come up
  const stale = new Set();
  // calling customers: queued calls, recent tap times (they set UTIL.speed), next time a call may start a sale
  const rush = { q: 0, taps: [], next: 0 };
  const clampYaw = y => Math.max(LIM_L, Math.min(LIM_R, y));
  // past either end the drag meets a soft stop (at most 7° further), then springs back
  const soft = o => 7 * (1 - Math.exp(-o / 14));
  const rubber = y => y > LIM_R ? LIM_R + soft(y - LIM_R) : y < LIM_L ? LIM_L - soft(LIM_L - y) : y;

  /* ---------- glyph defs (regenerated when the camera turns) + machines, each in its own root ---------- */
  const defs = svg.querySelector('defs');
  defs.insertAdjacentHTML('beforeend', ZZDECO.defs());
  const gdefs = UTIL.el('g', { id: 'glyph-defs' }, defs);
  const glyphDefs = () => { gdefs.innerHTML = GLY.defs() + GLY2.defs() + CUB.defs() + RAB.defs() + JUB.defs() + ARB.defs() + PKB.defs() + FZB.defs() + LKB.defs() + OBB.defs() + SUB.defs() + ODB.defs() + TYB.defs() + KGB.defs() + GCB.defs() + KSB.defs() + PBB.defs() + TPB.defs(); };
  let glyphBucket = 0, glyphLate = 0;
  glyphDefs();
  /* (v0.44) four layers, the camera on each (index.html): the stage (the backdrop and the insides), the shell, the X-ray
     wireframe, and the top (the front, the scan line, the name tags, the effects). A machine has a group in each */
  const LAYERS = [svg, $('stage-ext'), $('stage-ghost'), $('stage-top')], worldTop = $('world-top');
  const fx = UTIL.g(worldTop, '', { id: 'fx' });
  CORE.setFx(fx); FX.init(fx);
  const builtYaw = [], drawnSig = [];   // the yaw and the goods each machine was last drawn with
  // one machine across the layers: what is done to it is done to each of its groups
  const multi = all => ({ all,
    show(on) { all.forEach(r => { r.style.display = on ? '' : 'none'; r.classList.toggle('off', !on); }); },
    classList: { toggle: (c, on) => all.forEach(r => r.classList.toggle(c, on)), contains: c => all[0].classList.contains(c) },
    setAttribute: (k, v) => all.forEach(r => r.setAttribute(k, v)), removeAttribute: k => all.forEach(r => r.removeAttribute(k)),
    querySelector: sel => { for (const r of all) { const n = r.querySelector(sel); if (n) return n; } return null; },
    querySelectorAll: sel => all.flatMap(r => [...r.querySelectorAll(sel)]) });
  const parts = [];   // each machine's groups: back, gi (insides), ge (shell), gg (wireframe), front
  const roots = MACHINES.map((m, i) => {
    const all = [world, $('world-ext'), $('world-ghost'), worldTop].map(w => { const r = UTIL.g(w, '', { class: 'mroot off', 'data-m': m.id, style: 'display:none' }); if (w === worldTop) w.insertBefore(r, fx); return r; });
    const back = UTIL.g(all[0], '', { class: 'env-back' }), gi = UTIL.g(all[0], '', { class: 'g-int' });
    const ge = UTIL.g(all[1], '', { class: 'g-ext' }), gg = UTIL.g(all[2], '', { class: 'g-ghost', 'pointer-events': 'none' });
    const front = UTIL.g(all[3], '', { class: 'env-front' }), root = multi(all);
    parts[i] = { back, gi, ge, gg, front };
    ENV.back(back); m.build({ root, interior: gi, exterior: ge, ghost: gg, fx }, (item, who) => onSale(item, who, m)); ENV.front(front); ZZDECO.apply(m.id, ge); sticker(m.id, ge);
    builtYaw[i] = 0;
    return root;
  });
  // each machine's size before any upgrade (prices are per size), and upgrade prices moved onto the price ladder
  // a part's price follows its machine's price (2026-10-18; the user: parts may cost more than the machine). The numbers
  // written with each part keep their meaning relative to one another: 30000 = the machine's price. The two machines you
  // start with are priced as the first one you buy
  MACHINES.forEach(m => { m.baseCap = m.capacity; (m.upgrades || []).forEach(u => { const c0 = u.cost.slice();
    Object.defineProperty(u, 'cost', { configurable: true, get: () => { const base = ECON.priceOf(m.id) || ECON.priceOf('cup'); return c0.map(c => Math.max(100, Math.round(base * c / 30000 / 100) * 100)); } }); }); });
  const scanG = UTIL.g(worldTop, '', { id: 'scan' }); worldTop.insertBefore(scanG, fx);

  /* ---------- X-ray name tags: with auto-assort the player may not know what a shelf holds. In X-ray every product gets
     a small bubble (a dot in its colour, its name, how many are left); each pops up as the scan line passes it and folds
     away when the line goes back. Machines say what and where through labels() -> [{ name, n, c, pt:[x,y,z] }]
     (n null: no count; labelStyle 'mini': name only, for machines with many lanes). Bubbles keep clear of each other
     and of the upgrade pins (they step up, or sideways, with a leader line back to the goods). ---------- */
  const tagsG = UTIL.g(worldTop, '', { id: 'tags', 'pointer-events': 'none' }); worldTop.insertBefore(tagsG, fx);
  let tagSig = '', tagList = [], nextTags = 0, nextBusy = 0;
  const textW = (s, fs) => [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? fs : fs * .62), 0);
  function tagsLayout() {
    const m = M(), on = view === 'machine' && mode === 'shut' && xr > .002 && m && m.labels;
    if (!on) { if (tagList.length || tagSig) { tagsG.innerHTML = ''; tagList = []; tagSig = ''; } return; }
    const L = m.labels(), mini = m.labelStyle === 'mini', ff = ISO.f;
    const sig = `${cur}|${yaw.toFixed(1)}|` + L.map(l => `${l.name}:${l.n}:${ff(l.pt[0])},${ff(l.pt[1])},${ff(l.pt[2])}`).join(';');
    if (sig === tagSig) return;
    const was = tagList.some(t => t.el.classList.contains('on')); tagSig = sig;
    // the upgrade pins are obstacles too
    const obst = [...roots[cur].querySelectorAll('.upin')].map(p => { const t = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(p.getAttribute('transform') || ''); return t ? { x: +t[1] - 13, y: +t[2] - 24, w: 26, h: 37 } : null; }).filter(Boolean);
    const fs = mini ? 3.4 : 4.2, h = mini ? 6.2 : 8, cut = mini ? 5 : 8, placed = [];
    const items = L.map(l => { const [ax, ay] = ISO.P(...l.pt), name = l.name.length > cut ? l.name.slice(0, cut - 1) + '…' : l.name;
      const cnt = l.n == null ? '' : l.n > 0 ? `×${l.n}` : T`売切`;
      return { ...l, name, cnt, ax, ay, w: 2.6 + (mini ? 0 : 3.8) + textW(name, fs) + (cnt ? 1.8 + textW(cnt, fs * .82) : 0) + 2.6 }; })
      .sort((a, b) => a.ay - b.ay || a.ax - b.ax);
    const clash = r => [...placed, ...obst].some(o => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y);
    let html = '';
    items.forEach((t, i) => {
      // above it; then beside it; then a step further up or below; then further still
      const up = h + 1.6, side = t.w / 2 + 3, cands = [[0, -5], [-side, -1], [side, -1], [0, -5 - up], [0, h + 6], [-side, -1 - up], [side, -1 - up], [0, -5 - 2 * up], [0, h + 6 + up]];
      let r = null;
      for (const [dx, dy] of cands) { const c = { x: t.ax + dx - t.w / 2, y: t.ay + dy - h, w: t.w, h }; if (!clash(c)) { r = c; break; } }
      if (!r) r = { x: t.ax - t.w / 2, y: t.ay - 5 - h, w: t.w, h };
      placed.push({ x: r.x - 1, y: r.y - 1, w: r.w + 2, h: r.h + 2 });
      const bx = Math.max(r.x + 3, Math.min(r.x + r.w - 3, t.ax)), by = t.ay > r.y + h / 2 ? r.y + h - .4 : r.y + .4, near = Math.hypot(bx - t.ax, by - t.ay) < 7;
      const tail = near ? `<path class="tt" d="M${ff(bx - 1.8)} ${ff(by)}L${ff(t.ax)} ${ff(t.ay)}L${ff(bx + 1.8)} ${ff(by)}"/>`
        : `<path class="tl" d="M${ff(bx)} ${ff(by)}L${ff(t.ax)} ${ff(t.ay)}"/><circle class="td" cx="${ff(t.ax)}" cy="${ff(t.ay)}" r="1"/>`;
      const ty = r.y + h / 2 + fs * .36;
      html += `<g class="tagb${t.n === 0 ? ' out' : ''}${i % 2 ? ' tilt' : ''}" data-y="${ff(t.ay)}">${tail}<rect class="ts" x="${ff(r.x + .9)}" y="${ff(r.y + 1.1)}" width="${ff(r.w)}" height="${h}" rx="${h / 2}"/>`
        + `<rect class="tb" x="${ff(r.x)}" y="${ff(r.y)}" width="${ff(r.w)}" height="${h}" rx="${h / 2}"/>`
        + (mini ? '' : `<circle class="tdot" cx="${ff(r.x + 4.4)}" cy="${ff(r.y + h / 2)}" r="1.8" style="fill:${t.c}"/>`)
        + `<text class="tn" x="${ff(r.x + 2.6 + (mini ? 0 : 3.8))}" y="${ff(ty)}" font-size="${fs}">${ISO.esc(t.name)}</text>`
        + (t.cnt ? `<text class="tc" x="${ff(r.x + r.w - 2.6)}" y="${ff(ty)}" font-size="${ff(fs * .82)}" text-anchor="end">${t.cnt}</text>` : '') + `</g>`;
    });
    tagsG.style.setProperty('--tc', m.tint || 'var(--cyan)');
    // a refresh (a sale, a turn) redraws in place; only a fresh X-ray pops them in
    if (was) tagsG.classList.add('still');
    tagsG.innerHTML = html; tagList = [...tagsG.children].map(el => ({ el, y: +el.dataset.y }));
    tagsVis();
    if (was) requestAnimationFrame(() => requestAnimationFrame(() => tagsG.classList.remove('still')));
  }
  // shown where the scan has passed (above the line)
  function tagsVis() { if (!tagList.length) return; const y = sy0 + (sy1 - sy0) * xr; tagList.forEach(t => t.el.classList.toggle('on', xr > .002 && t.y < y - 1)); }
  ENV.init(); DOCK.init();
  const M = () => MACHINES[cur];
  const insideStale = new Set();
  function rebuild(i, turning = false) {
    const m = MACHINES[i], { back, ge, front } = parts[i];
    back.innerHTML = ''; front.innerHTML = '';
    const shell = turning && m.opaque && m.renderShell && i === cur && mode === 'shut' && xr <= .002;
    ENV.back(back);
    if (shell) { m.renderShell(); insideStale.add(i); } else { m.render(); insideStale.delete(i); }
    ENV.front(front); ZZDECO.apply(m.id, ge); sticker(m.id, ge); figure(m.id, ge);
    builtYaw[i] = yaw; drawnSig[i] = ECON.sigOf(m);
    if (i === cur) { CAT.attach(roots[i]); layers(); tagsLayout(); }
  }
  // the lucky cat figurine on this machine's top, front left corner (clear of the cats, who lie back right): up close it
  // is papercraft 3D like the cats (the street's doodle one would clash here)
  function figure(id, ge) {
    if (!COLLECT.figureOn(id)) return;
    UTIL.g(ge, CAT3D.maneki([16, 68, 240]), { class: 'wfig', 'pointer-events': 'none' });
  }
  // a sticker from the album's wardrobe, slapped on the side that faces the camera (both art styles), clear of the printed art
  function sticker(id, ge) {
    const d = COLLECT.decor(COLLECT.stickerOn(id)); if (!d) return;
    const SPOT = { drink: [[24, 120], [70, 100]], spiral: [[22, 160], [64, 152]], cup: [[24, 124], [68, 184]] };
    const [u, v] = (SPOT[id] || [[24, 120], [60, 120]])[ISO.right ? 0 : 1];
    UTIL.g(ge, `<g transform="translate(${u - 13} ${v - 13}) rotate(-8 13 13)">${ALBUM.decorIcon(d, 26)}</g>`, { class: 'wstk', transform: CORE.sidePlane(120, 84, 240), 'pointer-events': 'none' });
  }

  /* ---------- X-ray scan line ---------- */
  let MB, sy0, sy1;
  scanG.innerHTML = `<rect class="band" height="46" fill="url(#scanband)"/><line class="sl"/>
    <g id="scanHandle"><circle r="17" fill="transparent"/><circle r="9" fill="rgba(10,12,17,.92)" stroke="var(--cyan)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
      <path d="M-3.2-1.8l3.2-3.2 3.2 3.2M-3.2 1.8l3.2 3.2 3.2-3.2" fill="none" stroke="var(--cyan)" stroke-width="1.2" vector-effect="non-scaling-stroke"/></g>`;
  const band = scanG.querySelector('.band'), line = scanG.querySelector('.sl'), handle = $('scanHandle');
  function layoutScan() {
    MB = ISO.boxBounds(-2, -2, -6, 124, 88, 282); sy0 = MB.y0 - 4; sy1 = MB.y1 + 4;
    band.setAttribute('x', MB.x0 - 14); band.setAttribute('width', MB.x1 - MB.x0 + 28); line.setAttribute('x1', MB.x0 - 14); line.setAttribute('x2', MB.x1 + 14);
    setScan(xr);
  }
  function setScan(v) {
    xr = Math.max(0, Math.min(1, v)); const y = sy0 + (sy1 - sy0) * xr;
    clipSync(); band.setAttribute('y', y - 46); line.setAttribute('y1', y); line.setAttribute('y2', y);
    handle.setAttribute('transform', `translate(${(MB.x1 + 2).toFixed(1)} ${y.toFixed(1)})`);
    scanG.style.opacity = xr > .002 ? 1 : 0; handle.style.pointerEvents = xr > .002 ? 'all' : 'none';
    xBtn.setAttribute('aria-pressed', xr > .5); SND.hum(.25 + xr * .75); device.classList.toggle('xr', xr > .5); layers();
    if (xr > .002 && !tagList.length) tagsLayout(); else tagsVis();
    CAT.scan(y, xr > .002);
  }
  /* the scan line on the screen (stage pixels) is where the shell's layer is cut (shown below it) and the wireframe's
     (shown above it). Each cut is a box shifted down with its picture shifted back up by as much: two transforms the
     compositor applies, so the machine is not painted again while the line moves (v0.44; the clipPath it replaces
     repainted the whole machine on every frame, 7-8 fps on an iPhone 13 Pro) */
  const xExt = $('xr-ext'), xGhost = $('xr-ghost'), xExtIn = xExt.firstElementChild, xGhostIn = xGhost.firstElementChild;
  /* The cuts are layers of their own only while the line stands between the ends: scanned all the way, the shell is
     simply hidden and the wireframe uncut (xr-full), and the page goes back to one picture, as before (fewer layers to
     put together on every frame while the insides move). (v0.46) It goes back only once the line has rested 1.6 s:
     making the layers and merging them were the long frames at the start and the end of every scan, and an X-ray
     switched on and off again soon (the developers' test: every 1.3 s) now keeps them */
  let clipY = null, mergeT = 0;
  function clipSync() {
    const on = xr > .002 && !!vb, full = on && xr > .998, moving = on && !full;
    device.classList.toggle('xr-full', full); device.classList.toggle('xr-any', on);
    if (moving) { clearTimeout(mergeT); mergeT = 0; device.classList.add('xr-on'); }
    else if (!mergeT && device.classList.contains('xr-on')) mergeT = setTimeout(() => { mergeT = 0; if (!(xr > .002 && xr < .998)) device.classList.remove('xr-on'); }, 1600);
    if (!moving) { if (clipY !== null) { clipY = null; [xExt, xExtIn, xGhost, xGhostIn].forEach(e => { e.style.transform = ''; }); } return; }
    const { W, H } = size(), s = Math.min(W / vb.w, H / vb.h), y = sy0 + (sy1 - sy0) * xr, Y = (H - vb.h * s) / 2 + (y - vb.y) * s;
    if (clipY !== null && Math.abs(Y - clipY) < .05) return;
    clipY = Y; const a = Y + 2000, b = Y - H - 2000, px = v => `translate3d(0,${v.toFixed(2)}px,0)`;
    xExt.style.transform = px(a); xExtIn.style.transform = px(-a); xGhost.style.transform = px(b); xGhostIn.style.transform = px(-b);
  }
  function xray(on, ms) {
    const from = xr, to = on ? 1 : 0, id = ++xrAnim;
    if (Math.abs(to - from) < .01) return Promise.resolve();
    SND.scan(on); if (on) CAT.xray();
    let lastScan = 0;   // (app build: window.__ndOpt.xray30)
    return UTIL.tween(ms || 300 + 900 * Math.abs(to - from), e => { if (id !== xrAnim) return; const t = performance.now();
      if (e < 1 && window.__ndOpt && __ndOpt.xray30 && t - lastScan < 31) return; lastScan = t; setScan(from + (to - from) * e); }, UTIL.ease.inOut).then(ui);
  }

  /* ---------- camera ---------- */
  // the stage size, measured once and again only when it changes: reading clientWidth right after the scene was redrawn
  // forced a full synchronous layout on every turning step (most of a turn's cost)
  let stageSize = null;
  const measure = () => { stageSize = { W: svg.clientWidth || 390, H: svg.clientHeight || 844 }; };
  const size = () => stageSize || (measure(), stageSize);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(svg); else addEventListener('resize', measure);
  const BASE = [[-14, -10, -17], [164, -10, -17], [-14, 102, -17], [164, 102, -17], [0, 0, 276], [120, 0, 246], [154, 82, 46], [120, 84, -8], [-2, 86, 246]];
  const CONTENT = () => ISO.bounds(BASE), CONTENT_OPEN = () => ISO.bounds([...BASE, ...M().doorBounds()]);
  function fit(b, top, bottomPx, pad = 14) { const { W, H } = size(), bw = b.x1 - b.x0, bh = b.y1 - b.y0, s = Math.min((W - pad * 2) / bw, (H - top - bottomPx) / bh), w = W / s, h = H / s;
    return { x: (b.x0 + b.x1) / 2 - w / 2, y: b.y0 - (top + ((H - top - bottomPx) - bh * s) / 2) / s, w, h }; }
  const zoomed = (c, k, cx, cy) => ({ x: cx - (cx - c.x) / k, y: cy - (cy - c.y) / k, w: c.w / k, h: c.h / k });
  const baseView = () => mode === 'open' ? homeOpen : home;
  // a zoomed view stays on the machine: the cabinet (lid, base, cat) and, while it is open, the swung door
  function machineBounds() {
    const [x, y, z, w, d, h] = MBOX, zt = z + h + 14, pts = [];
    for (const px of [x, x + w]) for (const py of [y, y + d]) pts.push([px, py, z], [px, py, zt]);
    return ISO.bounds(mode === 'shut' ? pts : [...pts, ...M().doorBounds()]);
  }
  // keep [p, p + size] inside [lo, hi] (or, when it is bigger, keep [lo, hi] inside it)
  const keep = (p, size, lo, hi) => hi - lo <= size ? Math.max(hi - size, Math.min(lo, p)) : Math.max(lo, Math.min(hi - size, p));
  // screen pixels covered by the bars at the top and bottom of the stage
  const insets = () => mode === 'shut' ? [112, 176] : [104, dockH() + 10];
  function clamp(c) {
    const b = baseView();
    if (c.w < b.w / 4) c = zoomed(c, c.w / (b.w / 4), c.x + c.w / 2, c.y + c.h / 2);
    if (c.w > b.w * 1.001) return { ...b };
    const B = machineBounds(), m = c.w * .04, k = c.h / size().H, [t, bt] = insets(), vh = c.h - (t + bt) * k;
    return { x: keep(c.x, c.w, B.x0 - m, B.x1 + m), y: keep(c.y + t * k, vh, B.y0 - m, B.y1 + m) - t * k, w: c.w, h: c.h };
  }
  // set the camera directly (its real viewBox): pinch, pan, turns, resets. Drops any flight transform
  function apply(c) {
    cam = c; vb = c;
    if (camEl.style.transform) { camEl.style.transition = 'none'; camEl.style.transform = ''; }
    const v = `${c.x.toFixed(2)} ${c.y.toFixed(2)} ${c.w.toFixed(2)} ${c.h.toFixed(2)}`; LAYERS.forEach(l => l.setAttribute('viewBox', v)); camLook(); clipSync();
  }
  const camLook = () => { window.CAMSCALE = size().W / cam.w; resetBtn.hidden = cam.w > baseView().w * .93 && Math.abs(yaw) < .5; };
  /* the camera glides on a CSS transform of #cam (the stage's wrapper), which the compositor animates. A new viewBox lays
     the whole scene out again (every text at its new scale), and so does a transform on the svg itself, frame by frame:
     that is what made opening a door stutter. cam is where the camera is (or is going); vb is the viewBox the svg really
     has, and the transform maps vb's picture onto cam's exactly (same aspect). Opening and closing a door flies there and
     back without the viewBox ever changing; it is brought up to date (one layout) only when something sets the camera
     directly: a drag, a pinch, the wheel, a turn, a resize */
  const camEl = $('cam');
  let vb = null, landsAt = 0;
  // where the stage sits on screen, without the flight's transform
  const stageRect = () => { const r = device.getBoundingClientRect(), { W, H } = size(); return { left: r.left + device.clientLeft, top: r.top + device.clientTop, width: W, height: H }; };
  function flyTo(t, ms = 550) {
    camAnim++;
    if (!vb) { apply(t); return Promise.resolve(); }
    const k = size().W / t.w, s = vb.w / t.w, tx = (vb.x - t.x) * k, ty = (vb.y - t.y) * k, dur = UTIL.reduced ? 0 : ms / UTIL.speed;
    const still = Math.abs(s - 1) < 1e-4 && Math.hypot(tx, ty) < .5;
    cam = still ? vb : t; camLook();
    camEl.style.transition = dur < 40 ? 'none' : `transform ${dur.toFixed(0)}ms cubic-bezier(.65,0,.35,1)`;
    if (UTIL.reduced && !still && camEl.animate) camEl.animate([{ opacity: .2 }, { opacity: 1 }], { duration: 240, easing: 'ease-out' });   // (v0.41)
    camEl.style.transform = still ? '' : `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
    landsAt = performance.now() + (dur < 40 ? 0 : dur);
    return dur < 40 ? Promise.resolve() : new Promise(res => setTimeout(res, dur + 30));
  }
  // the real viewBox catches up with the camera (one full layout). A touch needs it only while the camera is still
  // moving (it stops there); drags, pinches, the wheel and turns set the viewBox themselves anyway
  function commitCam() { if (vb && (vb !== cam || camEl.style.transform)) apply(cam); }
  const flying = () => performance.now() < landsAt && !!camEl.style.transform;
  // the dock's height, measured by the browser after its own layout (asking for it right after showing the dock forced a
  // full synchronous layout of the scene)
  let dockHeight = 276;
  const dockOff = () => dock.classList.contains('off');
  if (window.ResizeObserver) new ResizeObserver(() => { if (!dockOff() && dock.offsetHeight) dockHeight = dock.offsetHeight; }).observe(dock);
  const dockH = () => dockOff() ? 0 : dockHeight;
  const frames = n => new Promise(r => { const step = () => n-- > 0 ? requestAnimationFrame(step) : r(); step(); });
  // home keeps the yaw-0 scale (turning never zooms) and re-centres on the content at the current yaw
  function computeHome() {
    const y0 = yaw; ISO.setYaw(0); const h0 = fit(CONTENT(), 112, 176); ISO.setYaw(y0);
    const fNow = fit(CONTENT(), 112, 176);
    home = { x: fNow.x + (fNow.w - h0.w) / 2, y: fNow.y + (fNow.h - h0.h) / 2, w: h0.w, h: h0.h };
    homeOpen = fit(CONTENT_OPEN(), 104, dockH() + 10);
  }

  /* ---------- turning the camera (drag sideways on the machine) ---------- */
  const canTurn = () => mode === 'shut' && !sliding && !M().doorMoving && !(M().isBusy && M().isBusy());
  function setYaw(y) {
    // zoomed in, the camera orbits the point on the machine at the centre of the view; at home it re-frames the machine
    const atHome = cam.w > home.w * .99, focus = atHome ? null : ISO.unproject(cam.x + cam.w / 2, cam.y + cam.h / 2, MBOX);
    // the can / bottle / cup glyphs are re-projected every 4 degrees, not every degree (a 2-degree error is invisible)
    yaw = y; ISO.setYaw(y); const gb = Math.round(y / 4) * 4; if (gb !== glyphBucket && !turning && !yawTweens) { glyphBucket = gb; glyphDefs(); }
    clearTimeout(glyphLate); glyphLate = setTimeout(() => { const g4 = Math.round(yaw / 4) * 4;
      if (g4 !== glyphBucket && view === 'machine' && Math.abs(ISO.yaw - yaw) < .01) { glyphBucket = g4; glyphDefs(); } }, 150);
    rebuild(cur, true); layoutScan(); computeHome();
    if (atHome) apply(home);
    else { const [nx, ny] = ISO.P(...focus); apply(clamp({ ...cam, x: nx - cam.w / 2, y: ny - cam.h / 2 })); }
    const det = Math.round(y / 8); if (det !== lastDetent) { lastDetent = det; if (!quietTurn) { UTIL.haptic(4); SND.tick(4 + det); } }
  }
  /* with a turn handler (v0.43, asked for by the developers): while the camera turns nothing is rebuilt — every angle
     goes to the shell ('move'), which cross-fades its snapshots; the detent tick and haptic stay here. When the turn
     settles: 'end' with the final angle, one real setYaw, and 'done' once that frame is painted. Drags, the snap back
     into range, the turn back to 0 before a door opens, the reset button, the wheel and the arrow keys all go this way */
  function turnMove(y) {
    if (!turnSess) { turnSess = true; turnHandler({ type: 'start', yaw }); }
    targetYaw = y;
    const det = Math.round(y / 8); if (det !== lastDetent) { lastDetent = det; UTIL.haptic(4); SND.tick(4 + det); }
    turnHandler({ type: 'move', yaw: y });
  }
  function turnEnd(y) {
    if (!turnHandler) { if (Math.abs(yaw - y) > .05) setYaw(y); return Promise.resolve(); }
    if (!turnSess) { turnSess = true; turnHandler({ type: 'start', yaw }); }
    turnHandler({ type: 'end', yaw: y });
    quietTurn = true; try { if (Math.abs(yaw - y) > .001) setYaw(y); } finally { quietTurn = false; }
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => { turnSess = false; if (turnHandler) turnHandler({ type: 'done', yaw: y }); r(); })));
  }
  function queueYaw(y) {
    if (turnHandler) { turnMove(y); return; }
    targetYaw = y;
    if (rebuildPending) return; rebuildPending = true;
    requestAnimationFrame(() => { rebuildPending = false; if (Math.abs(targetYaw - yaw) >= 1) setYaw(targetYaw); });
  }
  const tweenYaw = (to, ms = 380) => { const from = turnSess ? targetYaw : yaw; yawTweens++;
    return UTIL.tween(ms, e => queueYaw(from + (to - from) * e), UTIL.ease.out).then(() => turnHandler ? turnEnd(to).then(() => { yawTweens--; })
      : new Promise(r => setTimeout(() => { if (Math.abs(yaw - to) > .05) setYaw(to); yawTweens--; r(); }, 40))); };

  /* ---------- machine switching ---------- */
  const figNo = $('figNo'), figName = $('figName'), dots = $('dots');
  /* ---------- the street's lots: which machines stand there (the rest are put away and do not sell) ---------- */
  const idxOf = id => MACHINES.findIndex(m => m.id === id);
  const actIdx = () => ECON.lots().filter(Boolean).map(idxOf).filter(i => i >= 0);
  // (v0.46) the street machine i stands on (-1: put away), and the machines on the street in view (the dots, the arrows)
  const stOf = i => ECON.streetOfId(MACHINES[i].id);
  const hereIdx = () => actIdx().filter(i => stOf(i) === curSt);
  const actMachines = () => actIdx().map(i => MACHINES[i]);
  // a full machine sells out in about four hours whatever its size; traffic = a machine's own draw (the charging station)
  const saleGap = m => ECON.hOf(m) * 3600e3 / Math.max(1, m.capacity) / (m.traffic || 1) * UTIL.rand(.6, 1.4);   // (2026-10-18: 4 h ± 1 by machine)
  function renderDots() { dots.innerHTML = hereIdx().map(i => `<i data-i="${i}"${i === cur ? ' class="on"' : ''}></i>`).join(''); }
  function stepMachine(dir) { const a = hereIdx(), p = a.indexOf(cur); if (a.length < 2) return; switchTo(a[(Math.max(0, p) + dir + a.length) % a.length], dir); }
  function showMachine(i) {
    roots.forEach((r, k) => { r.show(k === i); r.removeAttribute('transform'); });
    cur = i; payOwed(); if (builtYaw[i] !== yaw) rebuild(i);
    CAT.attach(roots[i]); nekoHere = JSON.stringify(NEKO.here(M().id)); nekoStale = false;
    figNo.textContent = `Fig ${M().fig} · ${M().name}`; figName.textContent = M().brand;
    [...dots.children].forEach(d => d.classList.toggle('on', +d.dataset.i === i));
    device.style.setProperty('--tint', M().tint || '#2f6bff');
    computeHome(); ui();
  }
  async function switchTo(i, dir) {
    if (sliding || mode !== 'shut' || M().doorMoving || trial) return;
    if (i === cur || !(i >= 0)) return;
    sliding = true; if (window.TURN && TURN.coming) TURN.coming(i); if (xr > 0) await xray(false, 300);
    if (stale.has(i)) freshen(i); else if (builtYaw[i] !== yaw) rebuild(i);
    const from = roots[cur], to = roots[i], d = cam.w * 1.05 * dir;
    to.show(true); SND.lift(); UTIL.haptic(8);
    flyTo(home, 300);
    await UTIL.tween(520, e => { from.setAttribute('transform', `translate(${(-d * e).toFixed(1)} 0)`); to.setAttribute('transform', `translate(${(d * (1 - e)).toFixed(1)} 0)`); }, UTIL.ease.inOut);
    showMachine(i); sliding = false; save();
  }
  $('prevM').addEventListener('click', () => { firstGesture(); stepMachine(-1); });
  $('nextM').addEventListener('click', () => { firstGesture(); stepMachine(1); });
  dots.addEventListener('click', e => { const i = e.target.dataset && e.target.dataset.i; if (i !== undefined) { firstGesture(); switchTo(+i, +i > cur ? 1 : -1); } });

  /* ---------- art style ---------- */
  function setArt(a) { device.dataset.art = a; artBtn.textContent = a === 'zzz' ? T`画风 ZZZ` : T`画风 iso`; artBtn.setAttribute('aria-pressed', a === 'zzz'); }
  artBtn.addEventListener('click', () => { firstGesture(); setArt(device.dataset.art === 'zzz' ? 'iso' : 'zzz'); SND.switchOn(); save(); });

  /* ---------- door + dock ---------- */
  async function openDoor() {
    if (trial) { say(trial.preview ? T`试装时不开门 · 先买下或拆下` : T`试运转时不开门补货 · 买下这台机器就可以`, 2600); SND.buzz(); return; }
    if (mode !== 'shut' || M().doorMoving || sliding) return;
    mode = 'opening'; ui();
    if (xr > 0) await xray(false, 450);
    if (M().prepare) M().prepare();
    if (M().isBusy && M().isBusy()) { say(T`等这一单卖完…`, 2400); while (M().isBusy()) await UTIL.wait(120); }
    // the door swings out to the left: restock from the standard angle so it never hangs in front of the shelves
    if (Math.abs(yaw) > .3) await tweenYaw(0, 360 + Math.abs(yaw) * 4);
    // 保底: an empty machine and not enough money for a single unit -> the wholesaler sends a free crate, one tier down
    if (ECON.rescue(M())) { rebuild(cur); redrawOnClose = true; say(T`批发商送来一框低一阶的货 · 这次免费`, 3200); }
    else {
      // 按钱包推荐: plan the whole street's restock with the money in hand; this machine takes its share (new goods too)
      ECON.extraBegin(M());   // 捎一件: a piece a series is waiting for comes with this restock
      const b = ECON.budget(actMachines()), sp = b.short[M().id];
      stale.delete(cur); redrawOnClose = true; actIdx().forEach(i => { if (i !== cur) builtYaw[i] = NaN; });
      if (sp && !allRun) say(sp.hi ? T`钱不够全上最好的：这次 ${sp.hi} 格 ${ECON.stepName(b.top)}，其余 ${ECON.stepName(sp.rest)}` : T`钱不够：这次先上 ${ECON.stepName(sp.rest)}`, 4200);
    }
    bottom.classList.add('away');
    dock.classList.add('away'); dock.classList.remove('off');
    DOCK.mount(M().supply, M(), allRun); computeHome();
    // an easter egg: now and then a cat that keeps this machine company is sitting in the crate, and hops off at the first unit
    const sitter = NEKO.here(M().id).find(x => x.at !== 'tray');
    if (sitter && !allRun && Math.random() < .3) { DOCK.stowaway(NEKOART.sitting(sitter.id, gearOf(sitter.id)), NEKO.voice(sitter.id)[0]); setTimeout(() => SND.meow(NEKO.voice(sitter.id)[0]), 500); }
    // the insides were just shown (layers) and the crate built: let that layout happen on a frame of its own, then move
    await frames(2);
    dock.classList.remove('away'); flyTo(homeOpen, 700);
    await M().door(true);
    mode = 'open'; ui();
  }
  async function closeDoor() {
    if (mode !== 'open' || M().doorMoving) return;
    mode = 'closing'; restocks++; ui();
    { const n = trial ? 0 : PAY.stamp(); if (n) say(n >= 10 ? T`常客卡盖满了 · 去商店换一件` : T`常客卡盖了今天的章 · ${n}/10`, 2600); } ECON.endRescue(M()); ECON.extraEnd(); ECON.applyDefs(M());
    dock.classList.add('away'); setTimeout(() => { if (mode !== 'open' && mode !== 'opening') dock.classList.add('off'); }, 460);
    bottom.classList.remove('away'); computeHome(); flyTo(home, 650);
    await M().door(false);
    // the first restock brings the warehouse: a box behind the machine, free this once (2026-10-18)
    if (!window.__ndTrial && ECON.openWare()) streetCard(T`批发商顺手留下一箱备用货`, T`放在机器后面：以后卖空了，会先自动补满一次 · 补货时连它一起补`, '#neko-paw');
    // the warehouse is topped up with the same restock (it fills the shelves by itself when they sell out)
    lastWare = ECON.fillWare(M());
    if (lastWare && !allRun) say(T`仓库也备满了 · −${UTIL.money(lastWare)}`, 2600);
    // goods changed while the door was open: redraw the front, but only if what it shows changed (a full redraw is the
    // longest frame of a restock), and only once the door's thud has settled
    // (v0.44) during 全部补货 the camera leaves for the next machine at once: this one is redrawn when it is next seen
    if (redrawOnClose) { redrawOnClose = false; if (ECON.sigOf(M()) !== drawnSig[cur]) { if (allRun) builtYaw[cur] = NaN; else { await UTIL.wait(240); rebuild(cur); } } }
    mode = 'shut';
    ui(); save();
  }

  /* ---------- the two views: the street (home) and one machine up close ---------- */
  function refreshStreet() {
    MACHINES.forEach((m, i) => STREET.stock(i, m.count(), m.capacity, ECON.wareCap(m) ? ECON.ware(m) / ECON.wareCap(m) : -1));
    STREET.wallet(ECON.bank, ECON.life, { n: sold, yen }); STREET.goal(nextGoal());
    restockBtn();
  }
  // the street after its lots changed: machines on their lots, empty lots, lots still to come (the street in view)
  function layoutStreet() {
    const lots = ECON.lots(), k0 = curSt * 5;
    ACT = new Set(actIdx());
    STREET.setStreet(streetInfo());
    STREET.layout(MACHINES.map(m => { const g = lots.indexOf(m.id); return g >= k0 && g < k0 + 5 ? g - k0 : -1; }),
      [0, 1, 2, 3, 4].map(j => ({ state: lots[k0 + j] ? 'machine' : ECON.lotOpen(k0 + j) ? 'open' : 'locked', at: window.__ndTrial && !isFinite(ECON.LOT_AT[j]) ? __ndTrialLot() : UTIL.money(ECON.LOT_AT[j]), trial: window.__ndTrial && !isFinite(ECON.LOT_AT[j]) })));
    if (!ACT.has(cur)) showMachine(actIdx()[0]);
    renderDots(); STREET.setCat(cur);
    MACHINES.forEach((m, i) => { STREET.setSticker(i, COLLECT.decor(COLLECT.stickerOn(m.id))); STREET.setFigure(i, !!COLLECT.figureOn(m.id)); });
    streetGoods(); refreshStreet();
  }
  /* ---------- streets (v0.46, docs/nandemo-开新街.md) ---------- */
  // 资产: the money in hand plus what every machine you own cost (the two you started with cost nothing) and the parts
  // fitted to it. Nothing bought with real money counts, nor anything used up (cat food)
  const partsCost = m => UPG.parts(m).reduce((b, pt) => { let c = 0; for (let k = 0; k < UPG.level(m.id, pt.id); k++) c += pt.cost[k]; return b + c; }, 0);
  const assets = () => ECON.bank + MACHINES.filter(m => ECON.owns(m.id)).reduce((a, m) => a + ECON.priceOf(m.id) + partsCost(m), 0);
  // what the street in view shows in its name tag and on its signpost: the other street, open or still to come
  function streetInfo() {
    const S = ECON.STREETS, n = ECON.streetN(), k = (curSt + 1) % S.length;
    return { k: curSt, id: S[curSt].id, name: S[curSt].name, n, sign: { k, name: S[k].name, open: k < n, at: UTIL.money(S[k].assets || 0) } };
  }
  function goStreet(k) {
    if (k === curSt || k >= ECON.streetN() || allRun || STREET.dining || view !== 'street') return false;
    curSt = k; STREET.swap(() => { layoutStreet(); refreshStreet(); streetGoods(); nekoTick(true); }); save(); return true;
  }
  // the signpost: to the other street, or (still to come) how far the assets have got
  function signTap() {
    const g = streetInfo().sign;
    if (g.open) { goStreet(g.k); return; }
    const need = ECON.STREETS[g.k].assets;
    note(T`${g.name} 还没开张 · 资产 ${UTIL.money(assets())} / ${UTIL.money(need)} · 手里的钱、买过的机器和改造都算`, 4600);
  }
  // a street opens once the assets reach its line; a card says so, and closing it walks over there
  function streetsCheck() {
    if (trial) return;
    const k = ECON.streetN(), S = ECON.STREETS[k];
    if (!S || !S.assets || assets() < S.assets || !ECON.openStreet(k)) return;
    queueCard(() => STREET.card(T`${S.name} 开张了`, T`五个机位都空着 · 收着的机器摆过去免费`, '#neko-paw', () => goStreet(k)));
    layoutStreet(); save();
  }
  // a lot opens with takings (2026-10-18: no longer with a letter): its own card
  function lotsCheck() {
    streetsCheck(); const n = [0, 1, 2, 3, 4].filter(ECON.lotOpen).length; if (n !== lotsSeen) {
    if (n > lotsSeen && lotsSeen > 0) streetCard(T`第 ${n} 个机位开放`, T`空地的卷帘门拉开了 · 点「+」摆一台：收着的机器免费，新机器要买`, '#neko-paw');
    lotsSeen = n; layoutStreet(); } }
  // what a carry brings besides its cat food (lots and the warehouse open on their own now)
  const carryExtra = () => '';
  // prices follow the week's fashion and the cats in residence: redraw the machines when either changes
  function freshen(i) { if (!stale.has(i)) return; stale.delete(i); ECON.applyDefs(MACHINES[i]); rebuild(i); }
  // the two views cross-fade; once the fade is over the hidden one leaves the render tree (display:none), so its
  // animations and repaints stop costing anything (on a phone this is the difference between smooth and not)
  let layerT = 0, viewTok = 0;
  function showView(street) {
    clearTimeout(layerT); const tok = ++viewTok;
    if (window.SKIN && street) SKIN.sync(null);   // (app build: platform/skin.js; into a machine: enterMachine)
    // both layers back in the render tree first, the fade on the frame after (no forced layout to get the transition going)
    device.classList.remove('only-street', 'only-machine'); STREET.idle(street);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (tok !== viewTok) return;   // switched again meanwhile: the latest switch wins
      device.classList.toggle('is-street', street); clearTimeout(layerT);
      layerT = setTimeout(() => device.classList.add(street ? 'only-street' : 'only-machine'), 420);
    }));
  }
  // what the current machine has to draw: its insides only while you can see them (X-ray, door open, or a machine
  // you look into through glass), the X-ray wireframe only during a scan. (v0.46) Hidden with visibility, not display:
  // they stay laid out, so an X-ray or an opening door only paints them (each X-ray used to build and lay out the whole
  // wireframe and, on a solid machine, the insides again: the long frames at every switch the developers counted)
  const vis = (el, on) => { const v = on ? '' : 'hidden'; if (el.style.display) el.style.display = ''; if (el.style.visibility !== v) el.style.visibility = v; };
  function layers() {
    const r = roots[cur]; if (!r) return;
    const { gi, gg } = parts[cur], inside = xr > .002 || mode !== 'shut' || !M().opaque, ghost = xr > .002;
    if (inside && insideStale.has(cur)) { rebuild(cur); return; }   // rebuild calls layers() again with fresh insides
    vis(gi, inside); vis(gg, ghost);
  }
  function enterMachine(i) {
    if (view === 'machine') return;
    view = 'machine'; if (window.SKIN) SKIN.sync(MACHINES[i]); showView(false);   // (app build: platform/skin.js)
    freshen(i);
    if (i !== cur || builtYaw[i] !== yaw) showMachine(i); else { computeHome(); ui(); }
    apply(home); rush.q = 0;
    if (!introDone) { introDone = true; if (!(window.__ndFlags && __ndFlags.renderer)) intro(); }   // (app build: not in turn.html)
    save();
  }
  async function enterStreet() {
    if (view === 'street' || mode === 'opening' || mode === 'closing' || sliding) return;
    if (mode === 'open') { await closeDoor(); }
    if (trial && trial.preview) await endPreview();
    if (xr > 0) xray(false, 300);
    view = 'street'; rush.q = 0; rush.taps.length = 0;
    if (trial) { endTrial(); return; }
    const k = stOf(cur); if (k >= 0 && k !== curSt) { curSt = k; layoutStreet(); nekoTick(true); }   // (v0.46) its own street
    STREET.setCat(cur); refreshStreet(); streetGoods(); STREET.focus(cur);
    showView(true); SND.pop();
    save();
  }
  $('tostreet').addEventListener('click', () => { firstGesture(); enterStreet(); });
  /* ---------- 试运转 (2026-10-16): any machine up close from the album, in its base shape, the shelves full. Tap it, call
     customers, X-ray it, turn it; nothing is earned, recorded or saved, the door and upgrades stay shut. The user: the
     machines are the highlight, and before this nobody could see one before buying it ---------- */
  function startTrial(i) {
    if (view !== 'street' || allRun || trial || !MACHINES[i]) return;
    const m = MACHINES[i]; trial = { i, snap: m.save(), back: cur, upg: UPG.save() };
    ECON.setTrial(m.id); ECON.applyDefs(m); m.refill(m.capacity * 3); builtYaw[i] = NaN;
    device.classList.add('trial'); trialParts(); enterMachine(i);
    say(T`试运转 · 货是满的，随便点，不计收入`, 3600);
  }
  /* 试装 (user, 2026-10-16: "现在测试不了改造功能"): in 试运转 every part is free to fit, one level at a time from its pin,
     or all at once / none with the switch under the chip. Leaving puts every part back the way it was */
  function trialParts() {
    const m = trial && MACHINES[trial.i], has = !!(m && UPG.parts(m).length), buy = $('trialbuy');
    if (trial && trial.preview) { trialBtn.hidden = false; trialBtn.textContent = T`拆下`; buy.hidden = false;
      const ok = ECON.bank >= trial.cost; buy.disabled = !ok; buy.textContent = ok ? T`买下 · ${UTIL.money(trial.cost)}` : T`还差 ${UTIL.money(trial.cost - ECON.bank)}`; return; }
    buy.hidden = true;
    trialBtn.hidden = !has; if (has) trialBtn.textContent = UPG.allIn(m) ? T`全部拆下` : T`全部装上`;
  }
  /* 试装 on a machine you own (2026-10-18; the user: players may try parts for free). One part at a time, from its card:
     it goes in with the usual ceremony; meanwhile this machine earns nothing and what it sells comes back afterwards (the
     machine's state is restored from a snapshot). 拆下 or leaving puts it back the way it was; 买下 pays and keeps it */
  async function startPreview(id) {
    const m = M(), nx = UPG.next(m, id); if (trial || !nx || mode !== 'shut' || sliding) return;
    mode = 'opening'; ui(); while (m.isBusy && m.isBusy()) { if (m.prepare) m.prepare(); await UTIL.wait(120); } mode = 'shut';
    trial = { i: cur, snap: m.save(), back: cur, upg: UPG.save(), preview: true, part: id, cost: nx.cost };
    ECON.setTrial(m.id); device.classList.add('trial', 'preview'); $('trialchip').textContent = T`试装中 · 不计收入`;
    trialParts(); partOpen = id; await installPart();
  }
  async function endPreview() {
    const t = trial; if (!t || !t.preview) return;
    const m = MACHINES[t.i]; mode = 'opening'; ui();
    while (m.isBusy && m.isBusy()) { if (m.prepare) m.prepare(); await UTIL.wait(120); }
    trial = null; UPG.load(t.upg); ECON.setTrial(null);
    if (m.applyParts) m.applyParts(UPG.levels(m)); ECON.applyDefs(m);
    try { m.load(t.snap); } catch (e) { m.render(); }
    device.classList.remove('trial', 'preview'); $('trialchip').textContent = T`试运转中 · 不计收入`; trialBtn.hidden = true; $('trialbuy').hidden = true;
    builtYaw[t.i] = NaN; if (t.i === cur) rebuild(cur);
    mode = 'shut'; ui(); save();
  }
  async function buyPreview() {
    const t = trial; if (!t || !t.preview || mode !== 'shut' || sliding) return;
    const m = MACHINES[t.i], p = UPG.part(m, t.part);
    if (ECON.bank < t.cost) { trialParts(); say(T`钱还不够`, 2000); return; }
    await endPreview(); if (!ECON.spend(t.cost)) { say(T`钱还不够`, 2000); return; }
    const nx = UPG.next(m, t.part); UPG.install(m, t.part); m.applyParts(UPG.levels(m)); ECON.applyDefs(m); rebuild(cur);
    SND.clank(); setTimeout(() => SND.chime(), 220); UTIL.haptic([16, 40, 16]); CORE.sparkle(...p.pin, 16, 'var(--cyan)'); FX.pop(p.pin[0], p.pin[1], p.pin[2] + 14, T`改造完成！`, 'var(--cyan)', 15);
    toast(T`改造完成 · ${p.name} · ${nx ? nx.effect : ''}`, 4200);
    ALBUM.refresh(); refreshStreet(); shopDot(); ui(); save();
  }
  $('trialbuy').addEventListener('click', () => { firstGesture(); buyPreview(); });
  // goods a part brings (or takes away) go straight onto the shelves: the stock of a slot whose goods changed becomes the
  // new goods, no waiting for the old ones to sell. Machines keep their stock as product ids, so one walk over the saved
  // state swaps them, whatever shape each machine saves in
  function trialSwap(m, before) {
    const after = ECON.planOf(m), map = {};
    before.forEach((id, i) => { if (after[i] && after[i] !== id && !after.includes(id)) map[id] = after[i]; });
    if (!Object.keys(map).length) return;
    const walk = v => typeof v === 'string' ? (map[v] || v) : Array.isArray(v) ? v.map(walk)
      : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [map[k] || k, walk(x)])) : v;
    try { m.load(walk(m.save())); } catch (e) { /* the old goods sell first then */ }
  }
  function trialFit(m, change) {
    const before = ECON.planOf(m); change();
    m.applyParts(UPG.levels(m)); ECON.applyDefs(m); trialSwap(m, before); m.refill(m.capacity * 3);
  }
  trialBtn.addEventListener('click', async () => {
    firstGesture(); if (!trial || mode !== 'shut' || sliding) return;
    if (trial.preview) { await endPreview(); SND.pop(); toast(T`试装结束 · 拆下了`, 2400); return; }
    const m = M(), on = !UPG.allIn(m); mode = 'opening'; ui();
    while (m.isBusy && m.isBusy()) await UTIL.wait(120);
    trialFit(m, () => UPG.setAll(m, on)); rebuild(cur);
    mode = 'shut'; trialParts(); ui();
    if (on) { SND.clank(); UTIL.haptic([16, 40, 16]); toast(T`试装 · 全部装上了 · 透视里看得最清楚`, 3200); } else { SND.pop(); toast(T`试装 · 全部拆下了 · 这是原装的样子`, 3000); }
  });
  function endTrial() {
    const t = trial; trial = null;
    UPG.load(t.upg); ECON.setTrial(null); trialBtn.hidden = true;
    STREET.setCat(t.back); refreshStreet(); streetGoods(); STREET.focus(t.back);
    showView(true); SND.pop();
    // once the close-up has faded: the machine as it was, and the album back on the machine page
    setTimeout(() => { const m = MACHINES[t.i]; if (m.applyParts) m.applyParts(UPG.levels(m)); ECON.applyDefs(m);
      try { m.load(t.snap); } catch (e) { m.render(); } builtYaw[t.i] = NaN; device.classList.remove('trial');
      if (ACT.has(t.back)) showMachine(t.back); ALBUM.refresh(); ALBUM.open('mach'); }, 460);
  }
  // every sale lands here: today's count, money in hand and lifetime takings (which carry on the street)
  function earn(p, n = 1) {
    sold += n; yen += p; ECON.earn(p);
    const step = ECON.stepOf();
    if (step !== stepSeen) { if (step > stepSeen) showNews(step, 0); stepSeen = step; MACHINES.forEach((_, i) => stale.add(i)); }
    tierCheck(); lotsCheck();
    if (view === 'street') { STREET.wallet(ECON.bank, ECON.life, { n: sold, yen }); restockBtn(); }
    else if (performance.now() > buyCheckT) { buyCheckT = performance.now() + 1000; waitBadge(); }
    shopDot();
  }
  // prototype only: jump the takings to the next carry to preview its cat food and the cat it brings
  function demoBoost() {
    const t = UTIL.fmt(ECON.life).tier; ECON.boost(Math.pow(1000, t + 1) * 1.02 - ECON.life);
    const step = ECON.stepOf(); if (step > stepSeen) showNews(step, 0);
    stepSeen = step; MACHINES.forEach((_, i) => stale.add(i)); tierCheck(); lotsCheck(); refreshStreet(); nekoTick(true); shopDot(); save();
  }

  /* ---------- the wholesale shop: what each machine sells (automatic unless picked by hand; changing is free) ---------- */
  const shopBtn = $('shopbtn');
  let redrawOnClose = false;
  // a dot on 配货 only for hand-picked machines when better goods have opened up (automatic ones take them by themselves)
  // ★ per machine (2026-10-18): a machine's goods open as it sells; its card when they do, a dot on 配货 if hand-picked
  const tierSeenBy = {};
  function tierCheck() {
    MACHINES.forEach((m, i) => { if (!ECON.owns(m.id)) return; const kind = m.goods.kind, t = ECON.tierOf(kind);
      if (tierSeenBy[kind] === undefined) { tierSeenBy[kind] = t; return; }
      if (t > tierSeenBy[kind]) { const was = tierSeenBy[kind]; tierSeenBy[kind] = t; stale.add(i); for (let k = was + 1; k <= t; k++) showNews(0, k, m); } });
  }
  const shopDot = () => shopBtn.classList.toggle('new', ECON.tierOf(M().goods.kind) > (seenTier[M().id] || 1) && !ECON.isAuto(M()));
  function openShop() {
    if (mode === 'opening' || mode === 'closing' || sliding || SHOP.isOpen) return;
    const m = M(); seenTier[m.id] = ECON.tierOf(m.goods.kind); shopDot();
    SHOP.open(m, { onApply: async res => {
      if (res.auto) ECON.setAuto(m, true); else ECON.setPlan(m, res.plan);
      SND.chime(); UTIL.haptic([8, 30, 8]);
      if (mode === 'open') { DOCK.mount(m.supply, m); redrawOnClose = true; say(T`换好了 · 新货排在旧货后面`, 2600); }
      else { while (m.isBusy && m.isBusy()) await UTIL.wait(120); rebuild(cur); say(res.auto ? T`交给自动配货了` : T`换好了 · 新货排在旧货后面，旧的先卖`, 2800); }
      shopDot(); save();
    } });
  }
  shopBtn.addEventListener('click', () => { firstGesture(); if (trial) { say(trial.preview ? T`试装时不能配货 · 先买下或拆下` : T`试运转时不用配货`, 2000); return; } openShop(); });
  $('dockshop').addEventListener('click', () => { firstGesture(); openShop(); });

  /* ---------- upgrades (改造): pins in the X-ray view; a card with one effect and a price; then a small ceremony ---------- */
  const applyParts = () => MACHINES.forEach(m => { if (m.applyParts) m.applyParts(UPG.levels(m)); });
  let partOpen = null;
  function openPart(id) {
    const m = M(), p = UPG.part(m, id), nx = UPG.next(m, id); if (!p || !nx) return;
    partOpen = id; SND.pop(); UTIL.haptic(6);
    $('upg-m').textContent = m.brand; $('upg-kind').textContent = p.kind; $('upg-name').textContent = p.name;
    $('upg-eff').innerHTML = UTIL.hl(nx.effect); $('upg-fact').textContent = p.fact;
    const go = $('upg-go'), tryB = $('upg-try');
    if (trial && trial.preview) {
      const mine = id === trial.part, ok = mine && ECON.bank >= trial.cost;
      go.disabled = !ok; go.textContent = !mine ? T`一次试一个 · 先拆下现在的` : ok ? T`买下 · ${UTIL.money(trial.cost)}` : T`还差 ${UTIL.money(trial.cost - ECON.bank)}`;
      tryB.hidden = true; $('upg-bank').textContent = T`钱包 ${UTIL.money(ECON.bank)} · 试装中不计收入`;
    } else {
      const ok = trial || ECON.bank >= nx.cost;
      go.disabled = !ok; go.textContent = trial ? T`试装 · 免费` : ok ? T`安装 · ${UTIL.money(nx.cost)}` : T`还差 ${UTIL.money(nx.cost - ECON.bank)}`;
      tryB.hidden = !!trial;
      $('upg-bank').textContent = trial ? T`买下后要 ${UTIL.money(nx.cost)} · 试运转结束就拆掉` : T`钱包 ${UTIL.money(ECON.bank)} · 先试装不花钱，离开就拆掉`;
    }
    $('upg').hidden = false;
  }
  const closePart = () => { $('upg').hidden = true; partOpen = null; };
  $('upg').addEventListener('click', e => { if (e.target === $('upg') || e.target.closest('.upg-x')) { closePart(); SND.pop(); } });
  $('upg-go').addEventListener('click', () => { firstGesture(); if (trial && trial.preview) { closePart(); buyPreview(); } else installPart(); });
  $('upg-try').addEventListener('click', () => { firstGesture(); const id = partOpen; closePart(); startPreview(id); });
  async function installPart() {
    const m = M(), id = partOpen, p = id && UPG.part(m, id), nx = id && UPG.next(m, id);
    if (!nx || mode !== 'shut' || sliding) return;
    if (!trial && !ECON.spend(nx.cost)) { closePart(); say(T`钱还不够`, 2000); return; }
    closePart(); mode = 'opening'; ui();   // nothing else starts during the ceremony
    while (m.isBusy && m.isBusy()) await UTIL.wait(120);
    if (xr < .5) await xray(true, 500);
    // the camera leans in toward the spot
    const [px, py] = ISO.P(...p.pin), back = { ...cam };
    await flyTo(clamp(zoomed(cam, 1.7, px, py)), 520);
    if (trial) trialFit(m, () => UPG.install(m, id)); else { UPG.install(m, id); m.applyParts(UPG.levels(m)); ECON.applyDefs(m); }
    rebuild(cur);
    SND.crank();
    // the new part slides in from outside and clicks into place (the deeper rack's rails light up instead)
    const els = [...roots[cur].querySelectorAll(`[data-part="${id}"]:not(.upin)`)];
    if (els.length) await UTIL.tween(680, e => els.forEach(n => { n.setAttribute('transform', `translate(${(70 * (1 - e)).toFixed(1)} ${(-46 * (1 - e)).toFixed(1)})`); n.setAttribute('opacity', Math.min(1, e * 1.6).toFixed(2)); }), UTIL.ease.out);
    else { roots[cur].querySelectorAll('.lane .rail').forEach(r => r.classList.add('ubuilt')); SND.korokoro(); await UTIL.wait(650); }
    SND.clank(); UTIL.haptic([16, 40, 16]); CORE.sparkle(...p.pin, 16, 'var(--cyan)'); FX.pop(p.pin[0], p.pin[1], p.pin[2] + 14, T`改造完成！`, 'var(--cyan)', 15);
    setTimeout(() => SND.chime(), 220);
    toast(trial ? T`试装 · ${p.name} · ${nx.effect}` : T`改造完成 · ${p.name} · ${nx.effect}`, 4200);
    await UTIL.wait(1300);
    mode = 'shut'; await flyTo(back.w > home.w * .99 ? home : clamp(back), 600);
    if (trial) { trialParts(); ui(); return; }
    ALBUM.refresh(); refreshStreet(); shopDot(); ui(); save();
  }

  /* ---------- readout, hint, toast ---------- */
  function ui() {
    const now = performance.now(), m = M();
    if (window.SKIN) SKIN.sync(view === 'machine' ? m : null);   // (app build: platform/skin.js)
    const fast = UTIL.speed > 1.15 ? T` · 加速 ×${UTIL.speed.toFixed(1)}` : '';
    readEl.textContent = now < msgUntil ? msg : trial ? (trial.preview ? T`试装中 · 在库 ${m.count()}/${m.capacity}` : T`试运转 · 在库 ${m.count()}/${m.capacity}`) : T`今夜 ${sold} 件 · ${UTIL.money(yen)} · 在库 ${m.count()}/${m.capacity}${fast}`;
    guideTick();
    hintEl.textContent = guideLine || (xr > .5 ? m.hint.xray + (UPG.open(m).length ? (trial && !trial.preview ? T` · 点「改造」免费试装` : T` · 点「改造」看能装什么`) : '') : m.hint.shut);
    hintEl.classList.toggle('guide', !!guideLine);
    // upgrades: a dot on 透视 when this machine can take a part you can pay for; pins say which ones
    const purse = trial && !trial.preview ? Infinity : ECON.bank;
    xBtn.classList.toggle('new', UPG.affordable(m, purse));
    roots[cur].querySelectorAll('.upin').forEach(p => { const nx = UPG.next(m, p.dataset.part); p.classList.toggle('ok', !!nx && nx.cost <= purse); });
    trialBtn.disabled = mode !== 'shut'; if (trial && trial.preview) $('trialbuy').disabled = mode !== 'shut' || ECON.bank < trial.cost;
    $('dockhint').textContent = m.hint.open;
    xBtn.disabled = mode !== 'shut'; doorBtn.disabled = mode !== 'shut'; layers();
  }
  const say = (t, ms = 3000) => { msg = t; msgUntil = performance.now() + ms; ui(); };
  let toastT = 0; const toast = (t, ms = 3400) => { toastEl.innerHTML = UTIL.hl(t); toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms); };
  function onSale(item, who, m) {
    if (trial) { say(trial.preview ? T`试装中 · ${item.name} · 不计收入` : T`试运转 · ${item.name}`, 1600); if (m && m.count() < 2) { m.refill(m.capacity * 3); setTimeout(() => { if (trial) rebuild(cur); }, 900); } return; }
    if (!item.bonus) tapSales++;
    const fig = m && roots[MACHINES.indexOf(m)] && roots[MACHINES.indexOf(m)].querySelector('.wfig .mnk'); if (fig) UTIL.restart(fig, 'wave');
    earn(item.price, item.bonus ? 0 : 1); CAT.startle(); say(item.price ? `+${UTIL.money(item.price)} · ${item.name}` : T`中奖 · ${item.name}`, 2600);
    if (m && !item.bonus) nekoSale(m, MACHINES.indexOf(m), item.price);
    // the first time anything sells it goes into the album; the starting goods go in quietly, new goods with a ceremony
    if (m && ECON.recordSale(m.goods.kind, item.pid)) { if (!m.goods.defaults.includes(item.pid)) firstSale(item.name); else setTimeout(seriesCheck, 900); }
    save();
  }
  function firstSale(name) {
    FX.pop(60, 84, 262, T`首卖！${name}`, '#ff4f8b', 15); CORE.sparkle(60, 84, 252, 14, '#ffd23f');
    SND.jingle(); UTIL.haptic([10, 40, 10]); toast(T`收进图鉴 · ${name}`, 2600); streetGoods();
    setTimeout(seriesCheck, 2800);
  }
  /* ---------- album: finished series, the cat's gear, stickers ---------- */
  const readyKnown = new Set();
  // a sale can finish a series: say so once (toast up close, a note on the street); the decoration waits in the album
  /* the lucky cat (polish, 2026-10-16): the first 招き猫 sold, the wholesaler sends a ceramic one as a thank-you. It sits on
     なんでも's top and beckons at every sale there; looks only (the album's wardrobe moves it to another machine) */
  function figureCheck() {
    if (COLLECT.owns('maneki') || !ECON.soldCount('spiral', 'maneki')) return;
    const d = COLLECT.grant('maneki', 'goods:spiral:maneki'); if (!d) return;
    const home = MACHINES.find(m => m.goods.kind === 'spiral'); if (home) COLLECT.perch(home.id);
    SND.jingle(); STREET.card(T`批发商送来一只${d.name}`, T`它坐在 ${home ? home.brand : ''} 顶上，那台机器每卖出一件，它就招一下手（图鉴 → 装扮可以换机器）`, '#maneki-fig');
    dressUp(); ALBUM.refresh(); save();
  }
  function seriesCheck() {
    figureCheck();
    const fresh = COLLECT.claimable().filter(s => !readyKnown.has(s.id));
    fresh.forEach(s => readyKnown.add(s.id)); ALBUM.refresh();
    if (!fresh.length) return;
    const s = fresh[0], t = T`集齐「${s.name}」！去图鉴领取 ${COLLECT.decor(s.reward).name}`;
    SND.chime(); UTIL.haptic([12, 40, 12]);
    if (view === 'street') note(t); else toast(t, 3800);
  }
  let noteT = 0;
  // a note on the street under the album button; it waits for a card in front of it, and is not needed with the album open
  function note(t, ms = 3800) {
    const el = $('st-note'); clearTimeout(noteT); if (ALBUM.isOpen) { el.hidden = true; return; }
    if (!$('st-carry-card').hidden || !$('news').hidden || !$('st-receipt').hidden) { noteT = setTimeout(() => note(t, ms), 600); return; }
    el.innerHTML = UTIL.hl(t); el.hidden = false; noteT = setTimeout(() => { el.hidden = true; }, ms);
  }
  /* ---------- one thing at a time (the first 15 minutes, 2026-10-15). Tapping fast, every "first" lands in the first minute
     (first sale, a series, letter A, sold out). So every card — a carry, a new step's goods, a new cat, 见证, a receipt —
     waits its turn on the street: the next one a breath after the last is closed. Up close nothing pops up; ‹ 街 shows
     how many are waiting ---------- */
  const cardQ = []; let cardGap = 0;
  const cardOpen = () => !$('st-carry-card').hidden || !$('news').hidden || !$('st-receipt').hidden || !$('st-neko').hidden || !$('st-sheet').hidden
    || !$('st-lots').hidden || ALBUM.isOpen || SHOP.isOpen || !$('ask-notif').hidden || !$('sys-alert').hidden || SETTINGS.isOpen || PHONE.isOpen || PAY.isOpen;
  function queueCard(show) { cardQ.push(show); waitBadge(); pumpCards(); }
  const streetCard = (t, s, icon) => queueCard(() => STREET.card(t, s, icon));
  /* small news (2026-10-18; the user: thirty-odd cat cards that all look alike get tapped away, and the real news with
     them). Only a new cat coming by and a cat's own accessory still get a card; a first knack, 见证 tiers 1 and 3 and a
     visitor staying are one line each in the next receipt, or, with no receipt on its way, one note on the street */
  const smallNews = []; let receiptsQueued = 0;
  const smallNote = t => { smallNews.push(t); };
  const takeNews = () => smallNews.splice(0);
  const queueReceipt = r => { receiptsQueued++; queueCard(() => { receiptsQueued--; STREET.receipt({ ...r, news: takeNews() }); });
    // (v0.38) the first time you come back to sold-out machines, the moment a notice would have helped: ask once
    if (r.empty > 0 && SETTINGS.shouldAsk()) queueCard(() => SETTINGS.ask()); };
  function pumpCards() {
    waitBadge();
    if (!cardQ.length) { if (smallNews.length && !receiptsQueued && view === 'street' && !allRun && !cardOpen() && performance.now() > cardGap) note(takeNews().join(' · '), 4600); return; }
    if (view !== 'street' || allRun || STREET.dining || cardOpen() || performance.now() < cardGap) return;
    cardQ.shift()(); waitBadge();
  }
  /* (2026-10-18, the new-player run: money for the next machine came in while the player was busy inside a machine,
     and nothing said so) with no cards waiting, the back button wears the street's own "+" while a lot stands empty
     and something on today's list is affordable */
  const buyable = () => { const lots = ECON.lots(); if (!lots.some((id, g) => ECON.lotOpen(g) && !id)) return false;
    const offer = ECON.offers(); return MACHINES.some(m => !ECON.owns(m.id) && (m.unlock ? openNow(m) : offer.includes(m.id)) && ECON.priceOf(m.id) <= ECON.bank); };
  const waitBadge = () => { $('tostreet').dataset.n = view !== 'machine' ? '' : cardQ.length ? cardQ.length : buyable() ? '+' : ''; };
  // a card closed: the next one after a breath
  ['st-carry-card', 'news', 'st-receipt', 'st-neko', 'ask-notif', 'sys-alert', 'settings', 'phone', 'pay-sheet', 'store-sheet'].forEach(id => new MutationObserver(() => { if (!cardOpen()) { cardGap = performance.now() + 1100; setTimeout(pumpCards, 1200); } })
    .observe($(id), { attributes: true, attributeFilter: ['hidden'] }));

  /* ---------- the guide: one line, the one thing to do next; done, the next. Up close it is the hint line under the
     buttons, on the street a bubble under the wallet. It runs once (a street saved before it existed skips it) ---------- */
  let guide = { done: [], end: false }, guideLine = '', guideLeave = 0, tapSales = 0, restocks = 0;
  const GUIDE = [
    { id: 'enter', at: 'street', t: T`点一台机器，进去看看`, done: () => view === 'machine' },
    { id: 'tap', at: 'machine', t: T`点机器招呼客人 · 点得越快，卖得越快`, done: () => tapSales >= 3 },
    { id: 'restock', at: 'machine', t: T`卖空了 · 点「开门码货」补货`, when: () => out(M()) && mode === 'shut', done: () => restocks > 0, pulse: 'opendoor' },
    { id: 'back', at: 'machine', t: T`补好了 · 点左上角「‹ 街」回街上看看`, when: () => restocks > 0 && mode === 'shut', done: () => restocks > 0 && view === 'street', pulse: 'tostreet' },
    { id: 'scarf', at: 'street', t: T`图鉴里有一条红围巾等你领 · 领了给ミケ戴上`, when: () => COLLECT.claimable().length > 0, done: () => COLLECT.owns('scarf-red') },
    { id: 'feed', at: 'street', t: T`点一下ミケ，送她一包小鱼干`, when: () => NEKO.foodOpen(NEKO.FOODS[0]), done: () => NEKO.state('mike').fed > 0 },
    { id: 'leave', at: 'street', t: T`放着它们也会自己卖 · 过几个小时回来看看`, when: () => GUIDE.every(g => g.id === 'leave' || guide.done.includes(g.id)) },
  ];
  function guideTick() {
    guideLine = '';
    if (guide.end) { $('st-guide').hidden = true; return; }
    GUIDE.forEach(g => { if (g.done && !guide.done.includes(g.id) && g.done()) guide.done.push(g.id); });
    const g = GUIDE.find(x => !guide.done.includes(x.id) && x.at === view && (!x.when || x.when())), quiet = cardOpen() || allRun || STREET.dining;
    if (view === 'machine' && g) guideLine = g.t;
    const bubble = $('st-guide'), show = view === 'street' && !!g && !quiet;
    if (show && bubble.textContent !== g.t) { bubble.textContent = g.t; UTIL.restart(bubble, 'pop'); }
    bubble.hidden = !show;
    ['opendoor', 'tostreet'].forEach(id => $(id).classList.toggle('guide-pulse', view === 'machine' && !!g && g.pulse === id));
    $('st-albumbtn').classList.toggle('guide-pulse', view === 'street' && !!g && g.id === 'scarf' && !quiet);
    // the last line stays a while, then the guide is done for good
    if (g && g.id === 'leave' && show) { if (!guideLeave) guideLeave = performance.now() + 9000; else if (performance.now() > guideLeave) { guide.done.push('leave'); guide.end = true; bubble.hidden = true; save(); } }
  }
  // the next thing to look forward to: the soonest of a price step, a cat coming visiting, a lot, the warehouse
  // demo only: a new street from scratch, to see the first 15 minutes again (tap twice: the first tap only asks)
  let fresh = false;   // set while the page reloads into a new street: nothing may save the old one back
  $('st-fresh').addEventListener('click', e => {
    const b = e.currentTarget; if (b.dataset.sure) { STORE.remove(KEY); fresh = true; location.reload(); return; }
    e.stopPropagation(); b.dataset.sure = '1'; b.textContent = T`再点一次确认：存档会清空`; setTimeout(() => { delete b.dataset.sure; b.textContent = T`演示用：从头开始（看开局向导）`; }, 4000);
  });
  function nextGoal() {
    // (v0.46) once the fifth lot is open, the line shows the next street, measured in assets (a different number from
    // takings, so it is not compared with the others)
    const nx = ECON.STREETS[ECON.streetN()];
    if (nx && nx.assets && ECON.lotOpen(4)) return T`下一个：${nx.name} 开张 · 资产还差 ${UTIL.money(Math.max(0, nx.assets - assets()))}`;
    const life = ECON.life, ev = [], s = ECON.stepOf();
    if (s + 1 < ECON.NSTEP) ev.push([ECON.stepLine(s + 1), T`进货升级 ${ECON.stepName(s + 1)}，所有货 ×${ECON.stepX(s + 1)}`]);
    NEKO.CATS.forEach(c => { if (c.arrive && !c.arrive.paid && !c.arrive.trial && NEKO.state(c.id).status === 'none') ev.push([c.arrive.letter ? Math.pow(1000, c.arrive.letter) : ECON.stepLine(c.arrive.step), T`${c.name}（${c.kind}）会来串门`]); });
    ECON.LOT_AT.forEach((at, j) => { if (at && !ECON.lotOpen(j)) ev.push([at, T`多一个机位`]); });
    const n = ev.filter(e => e[0] > life).sort((a, b) => a[0] - b[0])[0];
    return n ? T`下一个：${n[1]} · 再卖 ${UTIL.money(n[0] - life)}` : '';
  }
  // what the shop cat wears and which machine carries which sticker: street now, machines on their next redraw
  function dressUp() {
    const g = COLLECT.gear(), D = {};
    for (const k in g) if (g[k]) D[k] = COLLECT.decor(g[k]);
    CORE.setGear(D); STREET.setGear(D); mikeGear = D;
    MACHINES.forEach((m, i) => { STREET.setSticker(i, COLLECT.decor(COLLECT.stickerOn(m.id))); STREET.setFigure(i, !!COLLECT.figureOn(m.id)); });
    builtYaw.fill(NaN);
  }
  function albumChange(c) {
    if (c.try) { const i = idxOf(c.try); if (ACT.has(i)) { STREET.focus(i); enterMachine(i); } else startTrial(i); return; }
    if (c.gear || c.sticker) dressUp();
    save();
  }
  /* ---------- progression you can see ---------- */
  // what each mini machine on the street shows: its lineup's real colours, and NEW while it has unsold new goods
  function streetGoods() {
    MACHINES.forEach((m, i) => {
      const kind = m.goods.kind, list = ECON.planOf(m).map(id => ECON.product(kind, id));
      STREET.setLineup(i, list.map(g => ({ fill: g.c ? (g.c[0] === "#" ? g.c : `var(--${g.c})`) : g.liq || g.soup || g.fruit || g.fill, top: g.top, kind: g.kind, ice: g.ice, row: g.row })));
      STREET.setNew(i, list.some(g => !m.goods.defaults.includes(g.id) && !ECON.soldCount(kind, g.id)));
    });
    ALBUM.refresh();
  }
  // a new price step (进货升级: every product ×10) and/or a new ★ (new goods): what arrived and what it is worth
  function showNews(step, t, m) {
    const go = () => {
      let N = t ? ECON.tierNews(t, m && m.goods.kind) : null; if (N && !N.items.length) { N = null; t = 0; } if (!step && !t) return;
      const items = N ? N.items.slice(0, 6) : [];
      $('news-t').textContent = step ? T`进货升级！${ECON.stepName(step)}` + (t ? T` · 新货到了` : '') : m ? T`${m.brand} ${'★'.repeat(t)} 新货到了！` : T`${'★'.repeat(t)} 新货到了！`;
      $('news-items').innerHTML = step ? `<span class="news-step">${ECON.stepName(step)}</span>` : '';
      $('news-items').innerHTML += items.map(({ kind, g }, k) => `<span style="animation-delay:${(k * .09).toFixed(2)}s">${SHOP.icon(kind, g)}${g.name}</span>`).join('')
        + (N && N.items.length > items.length ? `<span>${T`…等 ${N.items.length} 种`}</span>` : '');
      $('news-s').innerHTML = (step ? `${T`所有货的售价和进价都 <b>×${ECON.stepX(step)}</b>`}` : '') + (step && N ? '<br>' : '')
        + (N && N.ratio > 1.01 ? `${T`同一台机器里，新货每件比以前最赚的多赚 <b>${Math.round((N.ratio - 1) * 100)}%</b>`}` : '');
      $('news-f').textContent = step ? T`下次补货时换上 · 钱不够的话，先换一部分` : T`自动配货会在下次补货时换上 · 第一次卖出时收进图鉴`;
      $('news').hidden = false; SND.chime(); setTimeout(() => SND.jingle(), 300); UTIL.haptic([12, 40, 12]);
    };
    queueCard(go);   // after a carry card that the same takings may raise: one card at a time, on the street
  }
  $('news-ok').addEventListener('click', () => { $('news').hidden = true; SND.pop(); });
  setInterval(ui, 1000);

  /* ---------- calling customers: each tap on the machine brings one over; tap quickly and everything hurries ---------- */
  function callCustomer(cx, cy) {
    const m = M();
    if (!m.count()) { say(T`卖空了 · 点门锁开门补货`, 2200); SND.clank(); return; }
    rush.q = Math.min(4, rush.q + 1); rush.taps.push(performance.now());
    SND.call(rush.q); UTIL.haptic(4);
    const r = stageRect(), k = cam.w / r.width, p = ISO.unproject(cam.x + (cx - r.left) * k, cam.y + (cy - r.top) * k, MBOX);
    FX.pop(p[0], p[1], p[2] + 6, rush.q > 2 ? T`欢迎光临！` : '!', 'var(--accent-hi)', rush.q > 2 ? 12 : 16);
  }
  function stepRush(now, dt) {
    if (allRun) { UTIL.speed = allSpeed; return; }
    rush.taps = rush.taps.filter(t => now - t < 2500);
    // a soft ceiling (2026-10-18): the speed eases toward ×3 instead of hitting it, so it follows the waves of a hold a little
    const want = 1 + 2 * (1 - Math.exp(-rush.taps.length / 5)) + (rush.q > 0 ? .15 : 0);
    UTIL.speed += (want - UTIL.speed) * Math.min(1, dt * (want > UTIL.speed ? 4 : 1.2));
    if (rush.q > 0 && view === 'machine' && mode === 'shut' && !sliding && !turning && !yawTweens && !rebuildPending && now > rush.next) {
      if (!M().count()) rush.q = 0;
      else if (M().customerBuy()) { rush.q--; rush.next = now + 260; }
    }
  }

  /* ---------- input ---------- */
  const pts = new Map(); let down = null, pinch = null, lpTimer = 0, unlocked = false;
  function firstGesture() { touched = true; if (unlocked) return; unlocked = true; SND.unlock(); }
  const worldY = cy => { const r = stageRect(); return cam.y + (cy - r.top) * (cam.h / r.height); };
  // (app build) the cat whose box, 22 px wider all round, holds this screen point
  const nearCat = (x, y) => { if (view !== 'machine' || !roots[cur] || xr > .998) return null;
    for (const n of roots[cur].querySelectorAll('[data-hit="cat"]')) { const r = n.getBoundingClientRect();
      if (r.width && x > r.left - 22 && x < r.right + 22 && y > r.top - 22 && y < r.bottom + 22) return n; } return null; };
  function tap(target, cx, cy) {
    const hit = (target && target.closest && target.closest('[data-hit]')) || nearCat(cx, cy);
    if (!hit) { if (mode === 'shut' && target && target.closest && target.closest('.mroot')) callCustomer(cx, cy); return; }
    const t = hit.dataset.hit;
    if (t === 'lock') { CORE.press(hit.querySelector('.thandle')); if (mode === 'shut') openDoor(); else if (mode === 'open') closeDoor(); }
    else if (t === 'door') { if (mode === 'open') closeDoor(); }
    else if (t === 'cat') { const r = CAT.tap(hit); if (r && r.purr) setTimeout(() => openNeko(r.id), 650); }
    else if (t === 'part') { if (mode === 'shut') openPart(hit.dataset.part); }
    else if (t === 'bins') { SND.clank(); UTIL.tween(300, e => hit.setAttribute('transform', `translate(${(Math.sin(e * Math.PI * 4) * (1 - e) * 1.2).toFixed(2)} 0)`), x => x); }
    else if (mode === 'open') M().openTap(hit);
    else M().tap(hit);
    ui();
  }
  // hold on the machine: keep calling customers (the same as tapping fast, without tiring the hand)
  function longPress(target) {
    // hold a cat: pet it
    const cat = (target && target.closest && target.closest('[data-hit="cat"]')) || (!(target && target.closest && target.closest('[data-hit]')) && nearCat(down.x, down.y));
    if (cat) { if (!CAT.pet(cat)) return false; down.pet = true; return true; }
    if (mode !== 'shut' || !(target && target.closest && target.closest('.mroot')) || target.closest('[data-hit]')) return false;
    const x = down.x, y = down.y; UTIL.haptic(10); callCustomer(x, y);
    // customers come in small waves, not like a metronome: the gap between calls breathes between about 0.24 and 0.42 s
    // over a few seconds, and now and then a short run comes close together (2026-10-18)
    clearTimeout(holdIv); const t0 = performance.now(), ph = Math.random() * 6.3;
    const next = () => { if (!(down && down.used && mode === 'shut')) return; callCustomer(x, y);
      const t = (performance.now() - t0) / 1000, wave = Math.sin(t * 1.1 + ph) * .5 + Math.sin(t * 2.7 + ph * 2) * .25, run = Math.random() < .06 ? .55 : 1;
      holdIv = setTimeout(next, 330 * (1 - .27 * wave) * run); };
    holdIv = setTimeout(next, 330);
    return true;
  }
  const onDown = e => {
    if (e.pointerType === 'touch' && e.isPrimary && pts.size) for (const id of [...pts.keys()]) end({ pointerId: id, type: 'pointercancel' });   // (app build: a lost finger)
    firstGesture(); if (flying()) commitCam(); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { camEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (pts.size === 1) {
      const onHandle = !!(e.target.closest && e.target.closest('#scanHandle'));
      down = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target, moved: false, used: false, scan: onHandle, kind: null, yaw0: yaw };
      if (onHandle) { xrAnim++; return; }
      clearTimeout(lpTimer); lpTimer = setTimeout(() => { if (down && !down.moved) down.used = longPress(down.target); }, 480);
    } else if (pts.size === 2) {   // two fingers: pinch to zoom, move them together to pan
      clearTimeout(lpTimer); if (down) { down.moved = true; down.kind = 'pinch'; }
      const [a, b] = [...pts.values()], r = stageRect();
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cam: { ...cam }, mx: (a.x + b.x) / 2 - r.left, my: (a.y + b.y) / 2 - r.top };
    }
  };
  // (v0.44) on #cam: a touch on the shell or the top layer lands there, not on the stage under them
  camEl.addEventListener('pointerdown', onDown);
  // a camera zoomed out on #cam's transform leaves the device's edges outside the svg: a touch there still drags or pinches
  device.addEventListener('pointerdown', e => { if (e.target === device && view === 'machine') onDown(e); });
  camEl.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = stageRect(), k = cam.w / r.width;
    if (pts.size === 1 && down && down.scan) { down.moved = true; setScan((worldY(e.clientY) - sy0) / (sy1 - sy0)); return; }
    if (pts.size === 1 && down) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (!down.moved && !down.used && Math.hypot(dx, dy) > 7) {
        down.moved = true; clearTimeout(lpTimer); camAnim++;
        // sideways turns the machine (zoomed in or not); up/down pans a zoomed view; shift-drag or an open door pans freely
        const zoomedIn = cam.w < baseView().w * .98, sideways = Math.abs(dx) > Math.abs(dy);
        if (sideways && mode === 'shut') { down.kind = canTurn() ? 'turn' : null; if (!canTurn()) { rush.q = 0; down.wantTurn = true; say(T`这一单卖完再转视角`, 1800); } }
        else down.kind = null;   // (app build: no panning)
        if (down.kind) camEl.classList.add('dragging');
        if (down.kind === 'turn') turning = true;
      }
      if (down.wantTurn && !down.kind && canTurn()) { down.kind = 'turn'; down.x = e.clientX; down.yaw0 = yaw; turning = true; camEl.classList.add('dragging'); return; }   // (app build: from this point on)
      if (down.kind === 'pan') apply(clamp({ ...cam, x: cam.x - (e.clientX - prev.x) * k, y: cam.y - (e.clientY - prev.y) * k }));
      else if (down.kind === 'panv') apply(clamp({ ...cam, y: cam.y - (e.clientY - prev.y) * k }));
      else if (down.kind === 'turn') queueYaw(rubber(down.yaw0 + dx * SENS));
    } else if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top, c0 = pinch.cam;
      // the world point first under the fingers' midpoint stays under it while they spread and move
      const s = d / pinch.d, k0 = c0.w / r.width, k1 = k0 / s, ax = c0.x + pinch.mx * k0, ay = c0.y + pinch.my * k0;
      camAnim++; pinchTo(clamp({ x: ax - pinch.mx * k1, y: ay - pinch.my * k1, w: c0.w / s, h: c0.h / s }));   // (app build)
    }
  });
  // (app build) the pinch on #cam's transform: the picture of the real viewBox (vb) scaled onto c, as flyTo does
  function pinchTo(c) { if (!vb) { apply(c); return; } cam = c; camLook(); const k = size().W / c.w;
    camEl.style.transition = 'none'; camEl.style.transform = `translate(${((vb.x - c.x) * k).toFixed(2)}px,${((vb.y - c.y) * k).toFixed(2)}px) scale(${(vb.w / c.w).toFixed(5)})`; }
  const end = e => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId); clearTimeout(lpTimer); clearInterval(holdIv); camEl.classList.remove('dragging');
    if (pts.size < 2 && pinch) { pinch = null; commitCam(); }   // (app build: the viewBox once, at the end)
    if (pts.size === 0 && down) {
      if (down.pet) CAT.petEnd();
      if (down.scan) { if (xr > .5) CAT.xray(); ui(); }
      else if (down.kind === 'turn') { turning = false; const t = clampYaw(window.TURN && TURN.settle ? TURN.settle(targetYaw) : targetYaw); if (Math.abs(t - targetYaw) > .01) tweenYaw(t, 360); else if (turnHandler) turnEnd(t); save(); }
      else if (!down.moved && !down.used && e.type === 'pointerup' && performance.now() - down.t < 700) tap(down.target, down.x, down.y);
      down = null;
    }
  };
  camEl.addEventListener('pointerup', end); camEl.addEventListener('pointercancel', end);
  camEl.addEventListener('contextmenu', e => e.preventDefault());
  // wheel / trackpad: scroll zooms at the cursor, a sideways swipe (or shift + wheel) turns the machine
  const onWheel = e => { e.preventDefault(); commitCam(); const r = stageRect();
    const side = !e.ctrlKey && (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY));
    if (side) { if (canTurn()) { queueYaw(clampYaw((rebuildPending || turnSess ? targetYaw : yaw) - (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * .08));
      if (turnHandler) { clearTimeout(wheelEndT); wheelEndT = setTimeout(() => turnEnd(targetYaw), 160); } } return; }   // (a wheel turn ends when the wheel rests)
    camAnim++; apply(clamp(zoomed(cam, Math.exp(-e.deltaY * .0015), cam.x + (e.clientX - r.left) * (cam.w / r.width), cam.y + (e.clientY - r.top) * (cam.h / r.height)))); };
  camEl.addEventListener('wheel', onWheel, { passive: false });
  device.addEventListener('wheel', e => { if (e.target === device && view === 'machine') onWheel(e); }, { passive: false });
  svg.addEventListener('keydown', e => {
    firstGesture();
    if (e.key === 'ArrowRight' && canTurn()) tweenYaw(Math.min(LIM_R, Math.round(yaw / 8) * 8 + 8));
    else if (e.key === 'ArrowLeft' && canTurn()) tweenYaw(Math.max(LIM_L, Math.round(yaw / 8) * 8 - 8));
    else if (e.key === ']') stepMachine(1);
    else if (e.key === '[') stepMachine(-1);
    else if (e.key === 'a') artBtn.click();
    else if (e.key === 'x' && mode === 'shut') xray(xr < .5);
    else if (e.key === 'o') mode === 'shut' ? openDoor() : closeDoor();
    else if (e.key === 'p' && mode === 'open') DOCK.pourAll(() => mode === 'open');
    else if (/^[0-9]$/.test(e.key) && mode === 'shut') M().vendKey(+e.key);
    else if (e.key === 'Escape') resetBtn.click();
    else if (e.key === 'Backspace' || e.key === 'h') enterStreet();
    else if (e.key === ' ' && mode === 'shut') { const r = stageRect(); callCustomer(r.left + r.width / 2, r.top + r.height * .45); }
    else return;
    e.preventDefault();
  });
  xBtn.addEventListener('click', () => { firstGesture(); if (mode === 'shut') xray(xr < .5); });
  doorBtn.addEventListener('click', () => { firstGesture(); openDoor(); });
  $('closedoor').addEventListener('click', () => { firstGesture(); closeDoor(); });
  // 全部放入: crate after crate until the machine is full (or the money runs out)
  $('pourall').addEventListener('click', async () => { firstGesture(); while (mode === 'opening') await UTIL.wait(80); const m = M(); DOCK.fillUp(() => mode === 'open', () => m.count() >= m.capacity); });
  dock.addEventListener('pointerdown', firstGesture);
  resetBtn.addEventListener('click', async () => { firstGesture(); if (Math.abs(yaw) > .3 && canTurn()) await tweenYaw(0, 420); computeHome(); flyTo(baseView()); });
  sndBtn.addEventListener('click', () => { firstGesture(); const on = !SND.enabled; SND.setEnabled(on); sndBtn.setAttribute('aria-pressed', on); sndBtn.textContent = on ? T`声音 开` : T`声音 关`; save(); });
  wxBtn.addEventListener('click', () => { firstGesture(); ENV.setRain(!ENV.raining); });
  /* language and names (localisation, 2026-10-15): three languages; for Chinese and English, the goods, brands and cats
     either keep their Japanese names (原汁原味) or take local ones (全部翻译). Picking reloads the page (the game saves) */
  const LANG_NAME = { zh: '简体中文', 'zh-Hant': '繁體中文', en: 'English', ja: '日本語' };
  const SAMPLE = { jp: 'ミケ · ミズイロ天然水', zh: '咪可 · 水色天然水', 'zh-Hant': '咪可 · 水色天然水', en: 'Patches · Aqua Spring Water' };
  $('lang').textContent = I18N.hant ? '繁中' : { zh: '中文', en: 'EN', ja: '日本' }[I18N.lang];   // short: the top bar is full at phone width
  function openLang() {
    let l = I18N.code, full = I18N.full;
    const draw = () => {
      $('lang-body').innerHTML = `<div class="lg-row" style="grid-template-columns:1fr 1fr">${['zh', 'zh-Hant', 'en', 'ja'].map(x => `<button type="button" class="lg-opt${x === l ? ' on' : ''}" data-l="${x}">${LANG_NAME[x]}</button>`).join('')}</div>`
        + (l === 'ja' ? `<p class="lg-note">${T`日语只有一种显示方式：全部是日文。`}</p>`
          : `<p class="lg-h">${T`商品、品牌和猫的名字`}</p><div class="lg-row two">`
            + `<button type="button" class="lg-opt${!full ? ' on' : ''}" data-f="0"><b>${T`原汁原味`}</b><small>${SAMPLE.jp}</small></button>`
            + `<button type="button" class="lg-opt${full ? ' on' : ''}" data-f="1"><b>${T`全部翻译`}</b><small>${SAMPLE[l]}</small></button></div>`)
        + `<p class="lg-note">${T`机器和招牌上画的字永远是日文：那是这条街本来的样子。`}</p>`;
    };
    $('lang-sheet').onclick = e => {
      const b = e.target.closest('button');
      if (!b) { if (e.target === $('lang-sheet')) $('lang-sheet').hidden = true; return; }
      if (b.classList.contains('al-x')) { $('lang-sheet').hidden = true; return; }
      if (b.dataset.l) { l = b.dataset.l; SND.tick(3); draw(); return; }
      if (b.dataset.f) { full = b.dataset.f === '1'; SND.tick(3); draw(); return; }
      if (b.id === 'lang-ok') { if (l === I18N.code && (l === 'ja' || full === I18N.full)) { $('lang-sheet').hidden = true; return; } save(); I18N.set(l, full); }
    };
    draw(); $('lang-sheet').hidden = false;
  }
  $('lang').addEventListener('click', () => { firstGesture(); openLang(); });
  /* ---------- v0.38: settings behind one gear, and the phone around the game (notifications, widgets) ---------- */
  const tell = (t, ms = 2600) => view === 'street' ? note(t, ms) : toast(t, ms);
  SETTINGS.init({ sound: () => sndBtn.click(), lang: () => $('lang').click(), phone: () => PHONE.open(), say: tell, gearOf: id => gearOf(id), restore: () => PAY.restore() });
  $('gear').addEventListener('click', () => { firstGesture(); SND.pop(); SETTINGS.open(); });
  /* what the app writes down as it goes to the background (v0.41: GAME.plan(); the phone demo reads it too).
     Per machine: shelf, warehouse box, average pace, average price, and how far it really gets: the nine machines with
     a flaw that can stop them (dry dashi, no rice, an empty ice block, a jam, a clogged filter …) are sold forward on a
     copy of their state at the average pace — washing up or reheating only delays them — and then put back exactly as
     they were. units = what it will sell, stopAt = when it stops (sold out or stuck). Cats: where each one sits, for
     every 25-minute stretch of the next day (their seating depends only on the stretch and the save) */
  const meanGap = m => ECON.hOf(m) * 3600e3 / Math.max(1, m.capacity) / (m.traffic || 1);
  function sellForward(i, t0, quick) {
    const m = MACHINES[i], gap = meanGap(m); let ware = ECON.ware(m);
    if (!m.stuck || quick) { const n = m.count() + ware; return { units: n, stopAt: t0 + n * gap }; }
    const snap = m.save(), realNow = Date.now; let t = t0, units = 0, stop = t0;
    Date.now = () => t;
    try {
      for (let k = 0; k < 4000 && t - t0 < 48 * 3600e3; k++) {
        if (out(m) && ware > 0) { const n = m.refill(ware); if (n) ware -= n; }
        if (out(m)) break;
        t += gap; if (m.idleSell()) { units++; stop = t; }
      }
    } finally { Date.now = realNow; m.load(snap); builtYaw[i] = NaN; if (view === 'machine' && cur === i) rebuild(i); }
    return { units, stopAt: stop };
  }
  function leavePlan(quick) {
    const t0 = Date.now(), SLOT = 25 * 60e3, lots = ECON.lots();
    const machines = actIdx().map(i => { const m = MACHINES[i], f = sellForward(i, t0, quick), g = lots.indexOf(m.id);
      return { i, id: m.id, brand: m.brand, street: ECON.STREETS[ECON.streetOf(g)].id, lot: g % 5, count: m.count(), cap: m.capacity, ware: ECON.ware(m), gap: meanGap(m),
        price: ECON.totals(m, ECON.planOf(m)).sell / Math.max(1, m.capacity), units: f.units, stopAt: f.stopAt }; });
    const cats = [];
    for (let t = Math.floor(t0 / SLOT) * SLOT; t < t0 + 24 * 3600e3; t += SLOT) {
      const seats = {}; Object.entries(NEKO.seatsAt(t)).forEach(([id, v]) => { seats[id] = { kind: v.kind, street: v.street >= 0 ? ECON.STREETS[v.street].id : null, lot: v.lot >= 0 ? v.lot % 5 : -1, pose: v.pose, machine: v.lot >= 0 ? lots[v.lot] || null : null }; });
      cats.push({ at: t, seats });
    }
    refreshStreet();
    const gear = Object.fromEntries(NEKO.CATS.map(c => [c.id, gearOf(c.id)]));   // (v0.43)
    // street (v0.44, for the medium widget): the street the player last looked at; streets (v0.46): the ones open
    const streets = ECON.STREETS.slice(0, ECON.streetN()).map((x, k) => ({ id: x.id, name: x.name, lots: lots.slice(k * 5, k * 5 + 5) }));
    return { t0, street: ECON.STREETS[curSt].id, streets, bank: ECON.bank, born: ECON.born, special: MACHINES.some(m => m.unlock && (opened[m.id] || openNow(m))), machines, cats, gear, slot: SLOT };
  }
  const phoneSnap = () => leavePlan();
  // coming back: the game settles the time away itself (the same replay as a real return), then opens what you tapped
  PHONE.init({ snap: phoneSnap, gearOf: id => gearOf(id), back: (h, i) => {
    if (i >= 0) cardGap = performance.now() + 1500;   // straight into a machine: the receipt waits on the street (‹ 街 shows it)
    if (h > .02) warp(Math.round(h * 10) / 10);
    if (i >= 0) { if (view === 'machine' && cur !== i) { enterStreet(); setTimeout(() => enterMachine(i), 500); } else if (view === 'street') enterMachine(i); }
    else if (view === 'machine') enterStreet();
  } });
  /* ---------- v0.39: the catalog (real money; in the prototype a mock purchase, see pay.js) ---------- */
  const looks = () => { device.classList.toggle('lic', PAY.has('license')); const i = idxOf('drink'); if (roots[i]) roots[i].classList.toggle('skin-sakura', PAY.on('skin-sakura')); };
  PAY.init({ icon: PHONE.icon, say: tell, card: (t, s) => streetCard(t, s, '#neko-paw'), apply: (id, fresh) => {
    looks();
    if (id === 'skin-sakura') { const i = idxOf('drink'); builtYaw[i] = NaN; layoutStreet(); if (view === 'machine' && cur === i) rebuild(i); }
    if (id === 'license' && fresh) refreshStreet();
    if (!PAY.has(id)) MACHINES.filter(m => m.paid === id).forEach(m => { if (ECON.takeBack(m.id)) { const i = idxOf(m.id); if (view === 'machine' && cur === i) enterStreet(); layoutStreet(); } });   // the second box fills at the next restock (全部补货 counts it)
    refreshStreet(); save();
  } });
  $('st-paybtn').addEventListener('click', () => { firstGesture(); SND.pop(); PAY.open(); });
  looks();   // (v0.41) at start as well: the licence's gold sign and the close-up's sakura after a restart
  addEventListener('resize', () => { commitCam(); const wasHome = !cam || cam.w > baseView().w * .93; computeHome(); apply(wasHome ? baseView() : clamp(cam)); DOCK.syncFly(); });

  /* ---------- the warehouse (仓库, opens with B): a machine that sells out is filled again from it, once ---------- */
  // out: nothing left, or nothing it can still make (the cup machine's water, おぼん's rice): the warehouse steps in
  const out = m => !m.count() || !!(m.stuck && m.stuck());
  function refillCheck(i) {
    const m = MACHINES[i]; if (!out(m) || !ECON.ware(m) || (trial && trial.i === i)) return;
    if (view === 'machine' && i === cur && (mode !== 'shut' || sliding || allRun || (m.isBusy && m.isBusy()))) return;
    const n = m.refill(ECON.ware(m)); if (!n) return;
    ECON.takeWare(m, n); builtYaw[i] = NaN;
    if (view === 'machine' && i === cur) { rebuild(i); FX.pop(60, 84, 250, T`仓库补满了`, 'var(--cyan)', 13); SND.crate(); toast(T`卖空了 · 仓库自动补满一次`, 2600); }
    else if (view === 'street') { STREET.refilled(i); SND.crate(); }
    refreshStreet(); save();
  }
  // the street between two moments (away, or 快进 in the demo): every machine sells at its own pace until its shelves and
  // warehouse are empty; machine flaws (washing up, frost, reboots) run on the replayed clock, as they would have
  function replay(from, to) {
    // now and then a stretch away is 大繁盛 (everything sells a quarter faster), or ends with 大口注文: a firm nearby buys a
    // batch from one machine at once (2026-10-18, so coming back is not always the same; only boxes, never people)
    const busy = to - from > 2 * 3600e3 && Math.random() < .12, gx = busy ? .75 : 1;
    const realNow = Date.now, a = actIdx(), next = a.map(i => from + saleGap(MACHINES[i]) * gx), firsts = [];
    let t = from, count = 0, money = 0, refills = 0, paws = 0, lucky = 0, stocked = 0, tips = 0; const ups = [];
    Date.now = () => t;
    try {
      for (let guard = 0; guard < 50000; guard++) {
        let k = -1; next.forEach((x, j) => { if (x <= to && (k < 0 || x < next[k])) k = j; }); if (k < 0) break;
        const i = a[k], m = MACHINES[i]; t = next[k]; next[k] = t + saleGap(m) * gx;
        if (out(m) && ECON.ware(m) > 0) { const n = m.refill(ECON.ware(m)); if (n) { ECON.takeWare(m, n); refills++; builtYaw[i] = NaN; } }
        if (out(m)) { next[k] = Infinity; continue; }   // sold out, nothing in the warehouse: it waits for you
        const p = m.idleSell(); if (!p) continue;   // a flaw holds it for now (washing up, defrosting): it catches up later
        count++; money += p.price;
        const r = NEKO.sale(m, p.price, t); money += r.extra; paws += r.paws.length; tips += r.tip; ups.push(...r.up);
        if (r.luck) lucky++;
        if (r.stock && m.refill(1)) { stocked++; builtYaw[i] = NaN; }
        if (ECON.recordSale(m.goods.kind, p.pid) && !m.goods.defaults.includes(p.pid)) firsts.push(p.name);
      }
    } finally { Date.now = realNow; }
    let bulk = null;
    if (to - from > 3600e3 && Math.random() < .1) { const live = a.filter(i => MACHINES[i].count() > 5); if (live.length) {
      const i = UTIL.pick(live), m = MACHINES[i]; let n = 0, y = 0;
      for (let k = 0; k < 30; k++) { const p = m.idleSell(); if (!p) break; n++; y += p.price; ECON.recordSale(m.goods.kind, p.pid); }
      if (n) { count += n; money += y; bulk = { n, brand: m.brand }; builtYaw[i] = NaN; } } }
    const empty = a.filter(i => out(MACHINES[i]) && !ECON.ware(MACHINES[i])).length;
    ups.forEach(([id, k], n) => setTimeout(() => nekoTier(id, k), 1400 + n * 900));
    return { count, money, refills, firsts, empty, paws, lucky, stocked, tips, busy, bulk };
  }
  // demo only: let an hour (or four) pass on the street, as if you had been away
  function warp(h) {
    const now = Date.now(), r = replay(now - h * 3600e3, now);
    ECON.newRound();   // hours have passed: the next restock is a new round (it sets aside its own share)
    if (r.money) earn(r.money, r.count);
    MACHINES.forEach((_, i) => { builtYaw[i] = NaN; });
    queueReceipt(({ away: T`${h} 小时（快进）`, n: r.count, yen: r.money, firsts: r.firsts, sets: [], refills: r.refills, empty: r.empty, paws: r.paws, lucky: r.lucky, stocked: r.stocked, tips: r.tips, busy: r.busy, bulk: r.bulk }));
    refreshStreet(); streetGoods(); setTimeout(seriesCheck, 900); save();
  }

  /* ---------- 全部补货: every machine that needs it, one after another, with the real restock sped up ×6 but whole —
     the camera stops at each machine, the door opens, the crates go in, the door closes (the user: nothing skipped) ---------- */
  const needs = m => m.count() < m.capacity || ECON.ware(m) < ECON.wareCap(m) || out(m);
  function restockBtn() {
    // it opens once three machines stand on the street, with a card to say so
    if (!allOn && !window.__ndTrial && ACT.size >= 3) { allOn = true; streetCard(T`解锁：全部补货`, T`街上有三台机器了。点一下，挨个开门补满，码货的过程照样看得到`, '#neko-paw'); save(); }
    $('st-restock').classList.toggle('locked', !allOn);
    const n = actMachines().filter(needs).length;
    $('st-restock-s').textContent = n ? T`${n} 台要补` : T`都是满的`; $('st-restock').classList.toggle('idle', !n);
  }
  async function restockAll() {
    if (allRun || view !== 'street' || !allOn) return;
    // (v0.46) only the street in view plays its doors; the other street is filled at once at the end (same goods, same money)
    const all = actIdx().filter(i => needs(MACHINES[i])), list = all.filter(i => stOf(i) === curSt), rest = all.filter(i => stOf(i) !== curSt);
    if (!all.length) { note(T`都是满的`, 2000); return; }
    const others = [...new Set(rest.map(i => ECON.STREETS[stOf(i)].name))];
    allRun = true; introDone = true; allSkip = false; $('allrun').hidden = false; allSpeed = 6 * devSpeed * skipX();
    device.classList.add('keep-street');   // (v0.46) the street stays laid out under the machines (index.html)
    const bank0 = ECON.bank;
    try {
      for (let n = 0; n < list.length; n++) {
        const i = list[n]; if (!allSkip) $('allrun-t').textContent = T`全部补货 ${n + 1}/${list.length} · 点一下跳过`;
        if (allSkip) { instantFill(list.slice(n).concat(rest).map(k => MACHINES[k])); rest.length = 0; break; }
        if (view === 'street') { enterMachine(i); await UTIL.wait(500); } else await switchTo(i, 1);
        if (cur !== i) continue;
        await openDoor(); if (mode !== 'open') continue;
        // the crates go in faster than the doors and the camera move (×14 against ×6)
        const m = M(); allSpeed = 14 * devSpeed * skipX(); await DOCK.fillUp(() => mode === 'open' && !allSkip, () => m.count() >= m.capacity); allSpeed = 6 * devSpeed * skipX();
        await UTIL.wait(250); await closeDoor();
        if (allSkip) { instantFill(list.slice(n).concat(rest).map(k => MACHINES[k])); rest.length = 0; break; }   // (this one's shelves are finished too)
        if (DOCK.poor) break;
      }
      if (rest.length) instantFill(rest.map(k => MACHINES[k]));   // (as far as the money goes, as a skip does)
    } finally { allRun = false; UTIL.speed = 1; }
    await enterStreet(); $('allrun').hidden = true; setTimeout(() => device.classList.remove('keep-street'), 600);
    const spent = bank0 - ECON.bank, also = others.length ? T` · ${I18N.list(others)} 也补好了` : '';
    note(spent > 0 ? T`全部补货完成${also} · 进货 −${UTIL.money(spent)}` : T`钱不够，先补了一部分`, 3400);
    save();
  }
  $('st-restock').addEventListener('click', () => { firstGesture(); restockAll(); });
  // a restock without its animation: the street planned as at a door (按钱包推荐), each machine's shelves filled with its
  // planned goods paid at the slots' average buy price (as the warehouse is paid), then its warehouse topped up
  function instantFill(ms) { const bank0 = ECON.bank; if (!ms.length) return 0;
    ECON.budget(actMachines());
    ms.forEach(m => {
      if (ECON.rescue(m)) { m.refill(m.capacity * 3); ECON.endRescue(m); return; }
      const kind = m.goods.kind, plan = ECON.planOf(m); let c = 0, n = 0, top = 1;
      m.goods.slots.forEach((sl, i) => { const g = ECON.product(kind, plan[i]); c += sl.cap * ECON.quote(kind, g, ECON.gradeOf(m, i)).buy; n += sl.cap; top = Math.max(top, g.tier || 1); });
      const unit = c / (n || 1), room = m.capacity - m.count(), k = Math.min(room, Math.floor(ECON.bank / unit));
      if (k > 0) { const before = m.count(); m.refill(k); const added = Math.max(0, m.count() - before); if (added) ECON.pay(m, added * unit, top); plan.forEach(id => ECON.recordStock(kind, id)); }
      ECON.fillWare(m);
    });
    MACHINES.forEach((_, i) => { builtYaw[i] = NaN; }); refreshStreet(); return bank0 - ECON.bank; }
  // a tap on the screen while it runs: the rest goes by at once (same money, same goods: only the animation is skipped)
  let allSkip = false; const skipX = () => allSkip ? 60 : 1;
  $('allrun').addEventListener('click', () => { if (!allRun || allSkip) return; allSkip = true; allSpeed *= 60; $('allrun-t').textContent = T`跳过中…`; });

  /* ---------- 机位: what stands on a lot (machines put away come back free, new ones are bought) ---------- */
  let lotFor = -1;
  function openLots(j) {
    if (allRun) return;
    if (!ECON.lotOpen(j) && window.__ndTrial && !isFinite(ECON.LOT_AT[j % 5])) { note(__ndTrialNote(), 3400); return; }
    if (!ECON.lotOpen(j)) { note(T`这个机位营业额到 ${UTIL.money(ECON.LOT_AT[j % 5])} 才开放`, 2600); return; }
    lotFor = j; const lots = ECON.lots(), here = lots[j], two = ECON.streetN() > 1, st = ECON.streetOf(j);
    const lotName = g => two ? T`${ECON.STREETS[ECON.streetOf(g)].name} 第 ${g % 5 + 1} 个机位` : T`第 ${g % 5 + 1} 个机位`;
    $('lots-t').textContent = lotName(j);
    $('lots-s').textContent = here ? T`换一台？换下来的机器连货带改造收起来，随时免费换回。` : T`摆哪一台？收着的机器免费，新机器要买。`;
    const offer = ECON.offers();
    $('lots-list').innerHTML = MACHINES.filter(m => (window.__ndTrial && !__ndTrialOk(m.id)) || ECON.owns(m.id) || openNow(m) || offer.includes(m.id)).map(m => {
      const at = lots.indexOf(m.id), owned = ECON.owns(m.id), price = ECON.priceOf(m.id), c = STREET.SKIN[m.id] || {};
      let tag, cls = '', ok = true;
      if (window.__ndTrial && !__ndTrialOk(m.id)) { tag = __ndTrialLot(); ok = false; cls = 'far'; }
      else if (at === j) { tag = T`在这里`; ok = false; cls = 'here'; }
      else if (at >= 0) tag = T`在${lotName(at)} · 换过来`;
      else if (owned) tag = T`收着的 · 免费摆出来`;
      else if (locked(m)) { tag = m.unlock.hint(); ok = false; cls = 'far'; }
      else if (ECON.bank >= price) { tag = T`买下 ${UTIL.money(price)}`; cls = 'buy'; }
      else { tag = T`${UTIL.money(price)} · 还差 ${UTIL.money(price - ECON.bank)}`; ok = false; cls = 'far'; }
      // (v0.46) machines that suit this street come first in their group, with a tag
      const fit = ECON.suits(m.goods.kind, st);
      return { o: window.__ndTrial && !__ndTrialOk(m.id) ? 100 + Math.log10(price + 1) : (at === j ? -1 : at >= 0 ? 0 : owned ? 1 : locked(m) ? 99 : 2 + Math.log10(price + 1)) - (fit ? .5 : 0),
        h: `<li><button type="button" class="lot-row ${cls}" data-id="${m.id}"${ok ? '' : ' disabled'}><i class="sw" style="background:${c.body};border-color:${c.side}"></i><b>${m.brand}${fit ? `<i class="lot-fit">${T`駅前向き`}</i>` : ''}</b><span>${(p => `${p.tag} · ${p.line}`)(ECON.personaLine(m.goods.kind, st))}</span><em>${tag}</em></button></li>` };
    }).sort((a, b) => a.o - b.o).map(r => r.h).join('') + `<li class="lot-more">${T`今日の入荷 · 明天会换几台`}</li>`;
    $('st-lots').hidden = false;
  }
  $('st-lots').addEventListener('click', e => {
    const b = e.target.closest('.lot-row');
    if (!b) { if (e.target === $('st-lots') || e.target.closest('.al-x')) { $('st-lots').hidden = true; SND.pop(); } return; }
    const id = b.dataset.id, owned = ECON.owns(id), m = MACHINES[idxOf(id)];
    if (!ECON.place(lotFor, id)) { SND.buzz(); return; }
    $('st-lots').hidden = true; SND.chime(); UTIL.haptic([8, 30, 8]);
    layoutStreet(); STREET.focus(idxOf(id));
    note(owned ? T`${m.brand} 摆上街了` : T`买下 ${m.brand} · 摆上街了`, 2600);
    save();
  });

  /* ---------- the cats (cat v1: ミケ; cat v2: seven of them): where they are, what they see and do, food, presents.
     NEKO keeps their state, NEKOART draws them on the street, CAT3D up close ---------- */
  let nekoKey = '', nekoHere = '', nekoStale = false, mikeGear = {}, nekoCard = 'mike', cardMode = 'cat';
  const nekoEat = {}, owed = {};
  const brandAt = lot => { const id = ECON.lots()[lot], i = id ? idxOf(id) : -1; return i >= 0 ? MACHINES[i].brand : ''; };
  const nameOf = id => (NEKO.byId[id] || NEKO.byId.mike).name;
  // what a cat wears: ミケ, the album wardrobe; the others, their own accessory from 见证 tier 2
  const gearOf = id => { if (id === 'mike') return mikeGear; const c = NEKO.byId[id]; return c && NEKO.tierOf(id) >= 2 ? { [c.gear.slot]: c.gear } : {}; };
  // paw prints on the glass of machines a cat sat on during the last stretch; シロ by that machine wipes them off
  function glassPrints(now, L) {
    const prev = NEKO.seatsAt(now - 25 * 60e3), lots = ECON.lots(), sh = L.shiro && NEKO.NEAR.includes(L.shiro.kind) ? L.shiro.lot : -1;
    return [...new Set(Object.values(prev).filter(s => s.kind === 'top').map(s => s.lot))].filter(j => lots[j]).map(lot => ({ lot, wiped: lot === sh }));
  }
  // チャトラ's goods: straight onto the shelves of a machine you are not watching; the one up close gets them when you leave it
  function owe(i) { owed[i] = (owed[i] || 0) + 1; payOwed(); }
  function payOwed() {
    for (const k in owed) { const i = +k; if (!owed[i] || (view === 'machine' && i === cur)) continue;
      const n = MACHINES[i].refill(owed[i]); owed[i] = 0; if (n) { builtYaw[i] = NaN; if (view === 'street') STREET.stock(i, MACHINES[i].count(), MACHINES[i].capacity); } }
  }
  // every second: who has come visiting, who sits where, who is full, presents. The street redraws them; up close the
  // cats at this machine come or go
  function nekoTick(force) {
    const now = Date.now();
    NEKO.arrivals(now).forEach((c, n) => { force = true;
      // every visitor gets its own card when it turns up (2026-10-18: no longer on the letter's card — they come later)
      { streetCard(T`${c.name} 来串门了`, T`${c.kind} · 在纸箱旁边张望。送它一次吃的，它就成了这条街的常客`, '#neko-paw'); if (view !== 'street') toast(T`${c.name}（${c.kind}）来串门了 · 回街上看看`, 4200); } });
    const hachi = NEKO.byId.hachi, L0 = NEKO.seatsAt(now);
    const hs = L0.hachi;   // (v0.46) ハチ's knack: a fourth cat on its street
    if (NEKO.state('hachi').status === 'regular' && NEKO.isFull('hachi', now) && hs && hs.kind !== 'out' && Object.values(L0).filter(s => s.kind !== 'out' && s.street === hs.street).length > 3) NEKO.discover(hachi.id);
    // a machine with its own way in (2026-10-16): its card the first time it opens
    // (not during 试运转: test-fitted parts are not real, and some unlocks depend on parts)
    if (!trial) MACHINES.forEach(m => { if (m.unlock && !opened[m.id] && openNow(m)) { opened[m.id] = Date.now(); ECON.setSpecial(m.id, dayTakings());
      const [t, s] = ECON.flyer === m.id && !m.unlock.open() ? [T`${nameOf(flyerCat())} 叼来一张传单`, T`「${m.brand}」开张了：机位里可以买这台机器了（图鉴 → 机器可以先试运转）`] : m.unlock.card();
      streetCard(t, s, '#neko-paw'); save(); } });
    // the day-3 floor (2026-10-18): any visit on the third day (and a day and a half in, for someone who began at night)
    // with still no special in sight — a cat brings a flyer for one
    const dayNo = t => { const d = new Date(t); return Math.round(new Date(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
    if (!trial && !window.__ndTrial && !ECON.flyer && dayNo(Date.now()) - dayNo(ECON.born) >= 2 && Date.now() - ECON.born > 36 * 3600e3 && !MACHINES.some(m => m.unlock && !m.paid && (opened[m.id] || m.unlock.open()))) {
      const pool = MACHINES.filter(m => m.unlock && !m.paid && !m.unlock.open()); if (pool.length) ECON.setFlyer(UTIL.pick(pool).id); }
    NEKO.takeFound().forEach(id => { const c = NEKO.byId[id], d = COLLECT.grant('st-nk-' + id, 'neko:knack');
      smallNote(T`${c.name} 第一次发挥了本事：${knackLine(c)}${d ? T`，还留下一张${d.name}` : ''}`); ALBUM.refresh(); });
    if (NEKO.giftCheck(now)) { force = true; if (view === 'street') note(T`${nameOf(NEKO.gift.cat)} 在 ${brandAt(NEKO.gift.lot)} 旁边留了个小包裹`, 3200); }
    payOwed();
    const L = NEKO.seatsAt(now), rain = ENV.raining, food = NEKO.newest();
    const cats = NEKO.regulars().map(c => ({ id: c.id, coat: c.id, g: gearOf(c.id), spot: L[c.id] || { kind: 'out', lot: -1, pose: 'out' }, full: NEKO.isFull(c.id, now), eating: nekoEat[c.id] && nekoEat[c.id].until > now ? nekoEat[c.id].food : 0 }));
    const visitors = NEKO.visitors().filter(c => NEKO.visiting(c.id, now)).map(c => ({ id: c.id, coat: c.id, g: {}, want: food ? food.letter : 0 }));
    const glass = glassPrints(now, L);
    // (v0.46) the street in view gets its own cats; the box, the bowl, visitors and paw prints are なんでも通り's
    const home = curSt === 0, onSt = sp => sp.kind === 'box' || sp.kind === 'out' ? home : ECON.streetOf(sp.lot) === curSt;
    const catsHere = cats.filter(c => onSt(c.spot)), giftHere = NEKO.gift && ECON.streetOf(NEKO.gift.lot) === curSt;
    const key = JSON.stringify([curSt, catsHere.map(c => [c.id, c.spot.kind, c.spot.lot, c.spot.pose, c.spot.duo, c.full, c.eating, Object.keys(c.g).length]), visitors.map(v => v.id), NEKO.gift && NEKO.gift.lot, glass, rain, food && food.letter]);
    if (key !== nekoKey || force) {
      nekoKey = key; STREET.setNeko({ cats: catsHere, visitors: home ? visitors : [], gift: giftHere ? { ...NEKO.gift, name: nameOf(NEKO.gift.cat) } : null, glass: glass.filter(p => ECON.streetOf(p.lot) === curSt), rain, bowl: home ? (food ? food.letter : 0) : undefined, home });
      MACHINES.forEach((_, i) => { if (view !== 'machine' || i !== cur) builtYaw[i] = NaN; });   // redrawn with them (or without) when next shown
    }
    if (view !== 'machine') { nekoHere = ''; nekoStale = false; return; }
    const here = JSON.stringify(NEKO.here(M().id, now));
    if (here !== nekoHere || nekoStale) {
      if (mode === 'shut' && !sliding && !allRun && !(M().isBusy && M().isBusy())) { nekoHere = here; nekoStale = false; rebuild(cur); }
      else nekoStale = true;   // after this sale / with the door shut
    }
  }
  // a sale: who saw it (见证), and what the full cats keeping that machine company add to it
  function nekoSale(m, i, price) {
    const r = NEKO.sale(m, price);
    r.up.forEach(([id, k]) => nekoTier(id, k));
    if (r.extra) earn(r.extra, 0);
    if (r.stock) owe(i);
    if (view === 'street') {
      if (r.paws.length) STREET.sale(i, price, { paw: true });
      if (r.luck) STREET.sale(i, price * ((r.luckX || 2) - 1), { luck: true });
      if (r.stock) STREET.sale(i, 0, { stock: true, paw: true });
    } else if (i === cur) {
      if (r.paws.length) FX.pop(60, 84, 270, T`${I18N.list(r.paws.map(nameOf))} 招来的客人 +${UTIL.money(price)}`, '#ff6f92', 11);
      if (r.luck) { FX.pop(60, 84, 282, T`当たり！×${r.luckX || 2}  +${UTIL.money(price * ((r.luckX || 2) - 1))}`, '#ffd23f', 14); CORE.sparkle(60, 84, 262, 12, '#ffd23f'); }
      if (r.stock) FX.pop(60, 84, 258, T`${nameOf(r.stock)} 叼来 1 件（离开时放进去）`, '#ffb877', 10);
      if (r.tip) FX.pop(60, 84, 248, T`小费 +${UTIL.money(r.tip)}`, '#9ae8ff', 9);
    }
  }
  // a special is open by its own story, or by the day-3 flyer
  const openNow = m => !!m.unlock && !(window.__ndTrial && !__ndTrialOk(m.id)) && (m.unlock.open() || ECON.flyer === m.id);
  const locked = m => !!m.unlock && !openNow(m);
  const flyerCat = () => { const r = NEKO.CATS.filter(c => NEKO.state(c.id).status === 'regular'); return (r.length ? UTIL.pick(r) : NEKO.byId.mike).id; };
  // about a day of takings on the street now: three full loads of each machine at today's prices
  const dayTakings = () => actMachines().reduce((a, m) => a + ECON.totals(m, ECON.planOf(m)).sell * 3, 0);
  // 见证: what a cat has seen opens things, one card each
  // a cat's knack as one multiplier (user, 2026-10-16: one number, no sums); the details are on the album's cat page
  const KNACK_X = { call: T`客人`, luck: T`当たり`, stock: T`存货`, tip: T`每单`, gift: T`礼物` };
  const knackLine = (c, x = NEKO.multOf(c.id)) => c.knack === 'host' ? T`吃饱时 · 街上的猫 +1` : T`吃饱时 · ${KNACK_X[c.knack]} ×${x}`;
  const STRONGER = c => c.knack === 'host' ? T`吃饱的时间长一半` : T`${KNACK_X[c.knack]} ×${c.x[0]} → ×${c.x[1]}，吃饱的时间也长一半`;
  function nekoTier(id, k) {
    const c = NEKO.byId[id], n = NEKO.state(id).seen.toLocaleString();
    if (k === 2 && id === 'mike') COLLECT.grant('tencho', 'neko:seen');
    const [t, s] = k === 1 ? [T`${c.name} 陪你卖了 ${n} 件`, T`${c.name} 开始去更多地方了：空机位里打盹、在机器上伸懒腰、路沿上洗脸、翻肚皮……`]
      : k === 2 ? (id === 'mike' ? [T`ミケ 的店長名牌`, T`陪你卖了 ${n} 件，这条街的店長是她了。去图鉴的装扮页给她戴上`] : [T`${c.name} 的${c.gear.name}`, T`陪你卖了 ${n} 件，${c.name} 戴上了自己的${c.gear.name}`])
      : [T`${c.name} 更能干了`, STRONGER(c)];
    // (tiers 1 and 3 are small news; tier 2 is a thing to see and wear: a card)
    if (k === 2) { streetCard(t, s); if (view !== 'street') toast(T`${t} · 回街上看看`, 3200); } else smallNote(k === 1 ? T`${c.name} 陪你卖了 ${n} 件，开始去更多地方了` : T`${c.name} 更能干了：${STRONGER(c)}`);
    if (k === 2 && id !== 'mike') { builtYaw.fill(NaN); nekoTick(true); }
    ALBUM.refresh(); save();
  }
  // a cat's card: where it is, full or not, what it has seen, two foods to give it (a visitor: one, its first meal)
  // the knack in full, for the album's cat page (opened the first time the knack works)
  const KNACK = {
    call: (c, x) => T`吃饱以后陪着一台机器时，那台机器的客人变成 ${x} 倍。多来的客人买的是它自己捎来的货，不会更早卖空。`,
    luck: (c, x) => T`吃饱以后陪着一台机器时，大约每 5 单就有 1 单是「当たり」：那一单收入 ×${x}，货只出一件。`,
    stock: (c, x) => T`吃饱以后陪着一台机器时，会叼来同样的货补回刚卖掉的那件：同样的存货能卖 ${x} 倍那么多单。`,
    tip: (c, x) => T`吃饱以后陪着一台机器时，把玻璃擦得亮晶晶，每一单客人都多给一点：收入 ×${x}。`,
    gift: (c, x) => T`吃饱的时候，街上的猫送礼物送得勤 ${x} 倍。`,
    host: () => T`吃饱的时候，别的猫会跟着来，街上同时可以多待一只猫。`,
  };
  const WHERE = (sp, brand) => ({ loaf: T`在 ${brand} 顶上打盹`, curl: T`在 ${brand} 顶上团成一团`, stretch: T`在 ${brand} 顶上伸懒腰`, lie: T`躺在 ${brand} 前面`, belly: T`在 ${brand} 前面翻着肚皮`,
    sit: T`坐在 ${brand} 旁边看街`, groom: T`在 ${brand} 旁边洗脸`, yawn: T`在 ${brand} 旁边打哈欠`, box: sp.duo ? T`和另一只猫挤在纸箱里` : T`窝在纸箱里`, sprawl: T`在空机位里打盹`,
    snack: T`头钻进 ${brand} 的取货口偷吃（只是看起来，货一件也没少）`, out: T`出去溜达了，等会儿回来` })[sp.pose] || '';
  function openNeko(id = 'mike') {
    if (allRun || STREET.dining) return;
    const c = NEKO.byId[id] || NEKO.byId.mike, my = NEKO.state(c.id), now = Date.now();
    nekoCard = c.id; cardMode = 'cat';
    $('nk-name').textContent = `${c.name} · ${c.kind}`;
    $('nk-face').innerHTML = c.id === 'mike' ? ALBUM.catPreview(COLLECT.gear()) : NEKOART.portrait(c.id, gearOf(c.id));
    $('nk-fine').textContent = T`它自己会找吃的，喂的是礼物，不喂也没关系。`;
    $('nk-demo').hidden = false;
    // one food (the newest: a newer one is not better value, it only lasts longer), one number: its price
    const food = f => { const pr = NEKO.foodPrice(f), ok = ECON.bank >= pr;
      return `<button type="button" class="nk-feed" data-food="${f.id}"${ok ? '' : ' disabled'}><svg viewBox="0 0 24 24"><use href="#tier-${f.letter}"/></svg><b>${T`喂它 ${f.name}`}</b>`
        + `<small>${ok ? UTIL.money(pr) : T`还差 ${UTIL.money(pr - ECON.bank)}`}</small></button>`; };
    if (my.status === 'visit') {
      const f = NEKO.newest();
      $('nk-where').textContent = T`来串门了，在纸箱旁边张望`;
      $('nk-state').innerHTML = UTIL.hl(f ? T`它好像想吃 ${f.name}。送它一次，它就成了这条街的常客，以后随心情出现` : T`进位到 A 解锁猫粮，就能请它吃了`);
      $('nk-seenbox').hidden = true;
      $('nk-food').innerHTML = f ? food(f) : ''; $('nk-food').className = 'nk-food one';
    } else {
      const sp = NEKO.spotAt(c.id, now), full = NEKO.isFull(c.id, now), comp = NEKO.companyAt(c.id, now);
      $('nk-where').innerHTML = UTIL.hl(WHERE(sp, sp.lot >= 0 ? brandAt(sp.lot) : ''));
      // fullness as a bar (12 h is the most a cat can hold) and the time it lasts till; under it the knack, one multiplier
      const left = Math.max(0, my.fullUntil - now), till = new Date(my.fullUntil).toLocaleTimeString(I18N.lang === 'zh' ? 'zh-CN' : I18N.lang, { hour: '2-digit', minute: '2-digit', hour12: false });
      $('nk-state').innerHTML = (full ? `<span class="nk-fb"><b>${T`満腹`}</b><i><i style="width:${Math.min(100, left / 432e3).toFixed(0)}%"></i></i><span>${T`饱到 ${till}`}</span></span>`
        : `<span>${T`有点困 · 送点吃的吧（不送也没关系）`}</span>`) + `<em class="nk-x">${UTIL.hl(knackLine(c))}</em>`;
      const tier = NEKO.tierOf(c.id), TH = NEKO.TIER.map(x => x * c.wit), lo = tier ? TH[tier - 1] : 0, hi = TH[tier];
      $('nk-seenbox').hidden = false;
      $('nk-seen').innerHTML = UTIL.hl(T`陪你卖了 ${my.seen.toLocaleString()} 件`);
      $('nk-bar').style.width = (hi ? Math.min(100, 100 * (my.loads - lo) / (hi - lo)) : 100).toFixed(0) + '%';
      $('nk-next').textContent = [T`下一样：更多地方和姿势（空机位、伸懒腰、洗脸……）`, T`下一样：${c.id === 'mike' ? T`她的店長名牌` : T`自己的` + c.gear.name}`,
        T`下一样：${c.knack === 'host' ? T`吃饱的时间长一半` : `${KNACK_X[c.knack]} ×${c.x[1]}`}`, T`都解锁了`][tier];
      const f = NEKO.newest();
      $('nk-food').innerHTML = f ? food(f) : `<p class="nk-none">${T`进位到 A 解锁小鱼干，就能送它吃的了`}</p>`; $('nk-food').className = 'nk-food one';
    }
    $('st-neko').hidden = false;
  }
  // the bowl: one tap feeds everyone (the price of three: only three can be at work at once)
  function openBowl() {
    if (allRun || STREET.dining) return;
    const f = NEKO.newest(), who = NEKO.known(); cardMode = 'bowl';
    $('nk-name').textContent = T`ごはんだよ · 喂全街的猫`;
    $('nk-face').innerHTML = `<svg viewBox="-20 -24 40 30" aria-hidden="true"><ellipse cy="2" rx="15" ry="3.4" fill="#000" opacity=".2"/><path d="M-13 -6h26l-3 8h-20z" fill="#ff8fb0" stroke="#141018" stroke-width="2" stroke-linejoin="round"/><ellipse cy="-6" rx="13" ry="3" fill="#ffd6e4" stroke="#141018" stroke-width="1.8"/>${f ? `<use href="#tier-${f.letter}" x="-8" y="-22" width="16" height="16"/>` : ''}</svg>`;
    $('nk-where').innerHTML = UTIL.hl(I18N.list(who.map(c => c.name)) + T` 都会过来`);
    $('nk-seenbox').hidden = true; $('nk-demo').hidden = true;
    $('nk-food').className = 'nk-food one';
    if (!f) { $('nk-state').textContent = T`进位到 A 解锁小鱼干，就能开饭了`; $('nk-food').innerHTML = ''; }
    else { const pr = NEKO.bowlPrice(f), ok = ECON.bank >= pr;
      $('nk-state').innerHTML = UTIL.hl(T`一盆 ${f.name}，街上的猫都吃饱`);
      $('nk-food').innerHTML = `<button type="button" class="nk-feed nk-bowl" data-bowl="1"${ok ? '' : ' disabled'}><svg viewBox="0 0 24 24"><use href="#tier-${f.letter}"/></svg>${T`<b>开饭！</b>`}<small>${ok ? UTIL.money(pr) : T`还差 ${UTIL.money(pr - ECON.bank)}`}</small></button>`; }
    $('nk-fine').textContent = T`按 3 只猫的价钱，大家一起吃，吃完各回各的位置。`;
    $('st-neko').hidden = false;
  }
  async function bowlFeed() {
    const t = Date.now(), seats = NEKO.seatsAt(t), visit = NEKO.visitors().filter(c => NEKO.visiting(c.id, t)).map(c => c.id);
    const r = NEKO.feedAll(t); if (!r) { SND.buzz(); return; }
    $('st-neko').hidden = true; SND.chime(); UTIL.haptic([10, 30, 10]); refreshStreet(); save();
    const list = r.who.map(id => { const v = visit.indexOf(id), sp = seats[id] && !(seats[id].street > 0) ? seats[id] : { kind: 'out', lot: -1 }; return { id, coat: id, g: gearOf(id), spot: sp, seat: v >= 0 ? v : undefined }; });
    setTimeout(() => SND.purr(), 1500);
    await STREET.meal(list, r.f.letter);
    note(T`大家都吃饱了 · ${r.f.name}，満腹 ${r.f.h} 小时以上`, 3000); nekoTick(true);
  }
  $('st-neko').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) { if (e.target === $('st-neko')) $('st-neko').hidden = true; return; }
    if (b.classList.contains('al-x')) { $('st-neko').hidden = true; SND.pop(); return; }
    if (b.id === 'nk-demo') { NEKO.nudge(); nekoTick(true); openNeko(nekoCard); SND.tick(4); return; }
    if (b.dataset.bowl) { bowlFeed(); return; }
    if (b.dataset.food) feed(nekoCard, b.dataset.food);
  });
  // a present: it eats where it is (out on its rounds: the food waits by the box), hearts, a few seconds of chewing
  function feed(id, foodId) {
    const was = NEKO.state(id).status, f = NEKO.feed(id, foodId); if (!f) { SND.buzz(); return; }
    const c = NEKO.byId[id];
    $('st-neko').hidden = true; SND.chime(); setTimeout(() => SND.purr(NEKO.voice(id)[1]), 400); UTIL.haptic([10, 30, 10]);
    nekoEat[id] = { until: Date.now() + 3600, food: f.letter }; nekoTick(true); setTimeout(() => nekoTick(true), 3700);
    const hours = NEKO.fullHours(f, id);
    if (was === 'visit') note(T`${c.name} 吃了 ${f.name}，成了这条街的常客！以后会随心情出现`, 3600);
    else if (view === 'machine') { if (CAT.has(id)) CAT.hearts(id); toast(T`${c.name} 吃了 ${f.name} · 満腹 ${hours} 小时`, 3000); }
    else note(NEKO.spotAt(id).kind === 'out' ? T`${f.name} 放在纸箱旁边了，${c.name} 回来就吃` : T`${c.name} 吃了 ${f.name} · 満腹 ${hours} 小时`, 3000);
    refreshStreet(); save();
  }
  // a present, unwrapped: a sticker for a machine's side, or a coin purse someone dropped
  function takeGift() {
    const g = NEKO.takeGift(); if (!g) return;
    const who = nameOf(g.cat);
    SND.jingle(); UTIL.haptic([12, 40, 12]);
    if (g.kind === 'sticker') { const d = COLLECT.grant(g.id, 'neko:gift'); STREET.card(T`${who} 送了你 ${d ? d.name : T`一张贴纸`}`, T`可以贴在任意一台机器的侧面（图鉴 → 装扮）`); ALBUM.refresh(); }
    else { const v = .5 * 4800 * ECON.stepMult(ECON.stepOf()); ECON.give(v); STREET.card(T`${who} 叼来一个小钱包`, T`里面有 ${UTIL.money(v)}，大概是谁掉的`); }
    nekoTick(true); refreshStreet(); save();
  }

  window.__ND = { get cur() { return cur; }, get view() { return view; }, get mode() { return mode; }, get xr() { return xr; }, save: () => save(),
    get cam() { return cam; }, get home() { return home; }, get yaw() { return yaw; }, SENS,
    // (turning with pictures, platform/turn.js and renderer.js: the save as it stands, the camera, any angle quietly)
    state: () => snapshot(), setCam: c => { apply(clamp({ ...c })); },
    // the home camera and the zoomed one at angle y, from the camera now, nothing drawn (zoomed in, a turn orbits the
    // point at the centre of the view; at home every angle frames the machine): setYaw's two cameras
    // (from: the camera and angle a turn started from, so a turn ends as it began)
    camsAt(y, from = { cam, yaw }) { const c = from.cam; ISO.setYaw(from.yaw);
      try { const focus = ISO.unproject(c.x + c.w / 2, c.y + c.h / 2, MBOX); ISO.setYaw(y); const f = fit(CONTENT(), 112, 176), [nx, ny] = ISO.P(...focus);
        return { home: { x: f.x + (f.w - home.w) / 2, y: f.y + (f.h - home.h) / 2, w: home.w, h: home.h }, cam: clamp({ ...c, x: nx - c.w / 2, y: ny - c.h / 2 }) };
      } finally { ISO.setYaw(yaw); } },
    shot(y) { quietTurn = true; try { setYaw(y); } finally { quietTurn = false; } },
    // (the turning pictures of the X-ray, platform/renderer.js: scanned all the way at once, no sweep)
    setXr(v) { xrAnim++; setScan(v); } };   // (app build)

  /* ---------- prototype-only test hook (2026-10-18, the economy re-run): a scripted player drives the real code — the
     away replay, 全部补货 (sped up), buying machines and parts — without the UI. Not part of the game ---------- */
  let devSpeed = 1, devQuiet = false;
  void {
    replay, warp, earn: (p, n) => earn(p, n), act: () => actIdx(), nekoTick: () => nekoTick(true), seriesCheck,
    restock: async () => { const was = allOn; allOn = true; if (view !== 'street') await enterStreet(); await restockAll(); allOn = was || ACT.size >= 3; },
    place: (j, id) => { if (!ECON.place(j, id)) return false; layoutStreet(); refreshStreet(); streetGoods(); return true; }, openNow, locked, dayTakings,
    assets: () => assets(), street: k => goStreet(k), get curSt() { return curSt; }, streetsCheck: () => streetsCheck(),
    buyPart: (mid, pid) => { const i = idxOf(mid), m = MACHINES[i], nx = UPG.next(m, pid); if (!nx || !ECON.spend(nx.cost)) return false;
      UPG.install(m, pid); m.applyParts(UPG.levels(m)); ECON.applyDefs(m); rebuild(i); return true; },   // (redrawn at once, as installPart does)
    // the money of 全部补货 without its animation: plan the street (按钱包推荐), fill each machine's shelves with its planned
    // goods paid at the slots' average buy price (as the warehouse is paid), then top up the warehouse
    fastRestock: () => instantFill(actMachines()),   // (the same as skipping 全部补货)
    set speed(v) { devSpeed = v; }, set quiet(v) { devQuiet = !!v; }, get view() { return view; },
  };

  /* ---------- saving + away tally ---------- */
  const pv = () => trial && trial.preview ? trial : null;   // 试装: what the machine and its parts were before it
  const snapshot = () => ({ cur, street: ECON.STREETS[curSt].id, streets: ECON.streetsSave(), art: device.dataset.art, skin: window.SKIN ? SKIN.save() : (() => { try { return JSON.parse(STORE.get(KEY) || 'null').skin; } catch (e) { return undefined; } })(), neon: window.SKIN ? SKIN.shown() : undefined, sold, yen, econ: ECON.save(), collect: COLLECT.save(), parts: pv() ? pv().upg : UPG.save(), neko: NEKO.save(), guide, seenTier, allOn, opened, last: paused ? pausedAt : Date.now(), snd: SND.enabled, m: Object.fromEntries(MACHINES.map((m, i) => [m.id, pv() && pv().i === i ? pv().snap : m.save()])) });
  function save() { if (fresh || (trial && !trial.preview)) return; STORE.set(KEY, JSON.stringify(snapshot())); }
  function load() { try { return JSON.parse(STORE.get(KEY) || 'null'); } catch (e) { return null; } }
  // the street between leaving and coming back (a cold start, or GAME.resume): it sold in real time until shelves and
  // warehouse were empty; returns the receipt, or null when nothing happened
  function settle(from, to) {
    const r = replay(from, to);
    // series finished while away go on the receipt (and are not announced again)
    const sets = COLLECT.claimable().filter(s => !readyKnown.has(s.id)).map(s => { readyKnown.add(s.id); return s.name; });
    if (!(r.count || r.refills)) return null;
    sold += r.count; yen += r.money; ECON.earn(r.money);
    return { away: fmtAway(to - from), n: r.count, yen: r.money, firsts: r.firsts, sets, refills: r.refills, empty: r.empty, paws: r.paws, lucky: r.lucky, stocked: r.stocked, tips: r.tips, busy: r.busy, bulk: r.bulk };
  }
  const fmtAway = ms => { const m = Math.round(ms / 60000); return m < 60 ? T`${m} 分钟` : T`${Math.floor(m / 60)} 小时 ${m % 60} 分`; };

  async function intro() {
    if (UTIL.reduced) return;
    const lights = [...roots[cur].querySelectorAll('[data-l="dk"]')];
    lights.forEach(n => n.classList.remove('on')); await UTIL.wait(300);
    for (let i = 0; i < 3; i++) { lights.forEach(n => n.classList.add('on')); await UTIL.wait(70 + i * 40); lights.forEach(n => n.classList.remove('on')); await UTIL.wait(90); }
    lights.forEach(n => n.classList.add('on'));
    await UTIL.wait(1300);
    if (touched || xr > 0) return;
    const id = ++xrAnim;
    await UTIL.tween(1300, e => { if (id === xrAnim && !touched) setScan(.52 * e); }, UTIL.ease.inOut);
    if (!touched) await UTIL.wait(1800);
    // back down, also when a touch cut the peek short (it used to stay half open); not while the scan is being dragged
    if (id === xrAnim && !(down && down.scan)) { const from = xr; UTIL.tween(900, e => { if (id === xrAnim && !(down && down.scan)) setScan(from * (1 - e)); }, UTIL.ease.inOut); }
  }

  function boot(hot) {
    // localisation, full names: brands and cats take their local names (the painted world keeps the Japanese)
    MACHINES.forEach(m => { m.jp = m.jp || m.brand; m.brand = I18N.name(m.jp); }); NEKO.CATS.forEach(c => { c.jp = c.jp || c.name; c.name = I18N.name(c.jp); });
    UTIL.hlNames([...NEKO.CATS.map(c => c.name), ...MACHINES.map(m => m.brand), ...Object.values(ECON.GOODS).flat().map(g => g.name), ...NEKO.FOODS.map(f => f.name), ...COLLECT.DECOR.map(d => d.name)]);
    const data = hot && hot.m ? hot : load();
    setArt('zzz');   // (v0.40) ZZZ is the main look; the 画风 chip still switches to iso in the prototype
    STREET.init({ ids: MACHINES.map(m => m.id), names: MACHINES.map(m => m.brand), onOpen: i => { firstGesture(); enterMachine(i); }, onDemo: demoBoost,
      onWarp: h => { firstGesture(); warp(h); }, onLot: j => { firstGesture(); openLots(curSt * 5 + j); }, carryExtra,
      onSign: () => { firstGesture(); signTap(); }, onStreet: () => { firstGesture(); goStreet((curSt + 1) % ECON.streetN()); },
      onCarry: t => queueCard(() => STREET.carry(t)),
      onNeko: id => { firstGesture(); SND.meow(NEKO.voice(id)[0]); openNeko(id); }, onGift: () => { firstGesture(); takeGift(); }, onBowl: () => { firstGesture(); openBowl(); } });
    CORE.setGearFor(gearOf);
    SHOP.init();
    ALBUM.init({ ids: MACHINES.map(m => m.id), names: MACHINES.map(m => m.brand), onChange: albumChange, gearOf,
      catInfo: c => { const x = NEKO.multOf(c.id); return { line: knackLine(c, x), detail: KNACK[c.knack](c, x) }; } });
    let away = 0, back = null;
    // money first (prices depend on lifetime takings), then every machine takes its planned goods and its saved stock
    ECON.load(data && (data.econ || { bank: data.bank, life: data.life }), data ? (+data.life || +data.yen || 0) : 0);
    ECON.loadStreets(data && data.streets);   // (v0.46) streets after the first, from the save's top level
    curSt = Math.max(0, ECON.STREETS.findIndex(x => x.id === (data && data.street))); if (curSt >= ECON.streetN()) curSt = 0;
    COLLECT.load(data && data.collect, !!data); COLLECT.claimable().forEach(s => readyKnown.add(s.id));
    NEKO.load(data && data.neko);
    // the guide runs once, for a new street (a street saved before it existed has been played already)
    guide = data ? (data.guide || { done: [], end: true }) : { done: [], end: false };
    stepSeen = ECON.stepOf(); seenTier = data && data.seenTier && typeof data.seenTier === 'object' ? data.seenTier : {}; tierCheck();
    ACT = new Set(actIdx()); lotsSeen = [0, 1, 2, 3, 4].filter(ECON.lotOpen).length;
    // goods already in the machines count as stocked (no 上新 for them); for an older save, so do their current lineups
    if (!(data && data.econ && data.econ.stocked)) MACHINES.forEach(m => [...m.goods.defaults, ...(data ? ECON.planOf(m) : [])].forEach(id => ECON.recordStock(m.goods.kind, id)));
    UPG.load(data && data.parts); applyParts();   // fitted upgrades change the machines' shape: before they are drawn
    dressUp();   // the cat's gear and the stickers, before any machine is drawn
    // a new street: the goods already in the machines are priced again at today's prices (load re-prices every unit)
    MACHINES.forEach(m => { ECON.applyDefs(m); try { if (data && data.m && data.m[m.id]) m.load(data.m[m.id]); else m.load(m.save()); } catch (e) { m.render(); } });
    builtYaw.fill(NaN);   // a machine's own render drops the street-art stickers: rebuild each in full when it first comes up
    if (data) {
      if (typeof data.cur === 'number' && MACHINES[data.cur]) cur = data.cur;
      if (data.art === 'zzz') setArt('zzz');
      allOn = !window.__ndTrial && (!!data.allOn || (data.allOn === undefined && actIdx().length >= 3));
      opened = data.opened || {};   // older saves: open if three already stand there
      away = Date.now() - (data.last || Date.now());
      if (away < 6 * 3600e3) { sold = data.sold | 0; yen = data.yen | 0; }
      if (data.snd === false) { SND.setEnabled(false); sndBtn.setAttribute('aria-pressed', 'false'); sndBtn.textContent = T`声音 关`; }
      // away: the street sold in real time while you were gone, until shelves and warehouse were empty
      if (away > 60000 && !(hot && hot.m)) back = settle(data.last, Date.now());
    }
    shopDot();
    // open on the street; the machine view is built underneath, ready to come up
    if (!ACT.has(cur)) cur = actIdx()[0];
    layoutScan(); showMachine(cur); apply(home); setScan(0); ui();
    layoutStreet(); nekoTick(true); showView(true);
    if (back) setTimeout(() => queueReceipt(back), 900);
    setTimeout(figureCheck, 1400);   // a 招き猫 sold while away (or before the figurine existed)
    let last = performance.now(), nextWare = last + 1000;
    // every machine on the street sells at its own pace (a full one sells out in about four hours); the one you are
    // watching up close sells with its whole animation instead; machines put away do not sell
    const nextIdle = MACHINES.map(m => last + saleGap(m) * UTIL.rand(.05, 1));
    const loop = now => {
      if (paused) return;   // (GAME.pause: the loop is restarted by GAME.resume)
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (view === 'machine') { M().step(now, dt); ENV.step(now, dt); CAT.step(now); if (now > nextTags) { nextTags = now + 600; tagsLayout(); }
        if (now > nextBusy) { nextBusy = now + 250; roots[cur].classList.toggle('busy', !!(M().isBusy && M().isBusy())); } }
      stepRush(now, dt);
      MACHINES.forEach((m, i) => {
        if (devQuiet || now < nextIdle[i]) return;   // (devQuiet: the scripted player keeps its own clock)
        nextIdle[i] = now + saleGap(m);
        if (!ACT.has(i)) return;
        if (view === 'machine' && i === cur) {
          // no sale starts while the camera is turning (a turn redraws the machine from its state): try again shortly
          if (mode !== 'shut' || sliding || turning || turnSess || yawTweens || rebuildPending || allRun || !m.customerBuy()) nextIdle[i] = now + 1500;
          return;
        }
        const p = m.idleSell(); if (!p) return;
        earn(p.price); nekoSale(m, i, p.price);
        // new in the album: starting goods go in quietly, new goods with 初売り; either can finish a series
        const added = ECON.recordSale(m.goods.kind, p.pid), first = added && !m.goods.defaults.includes(p.pid);
        if (view === 'street') {
          STREET.sale(i, p.price, { tier: p.tier, first, name: p.name }); STREET.stock(i, m.count(), m.capacity); ALBUM.refresh();
          if (first) { SND.jingle(); UTIL.haptic([10, 40, 10]); streetGoods(); } else SND.streetSale();
        } else if (first) toast(T`首卖 · ${p.name}（${m.brand}）· 收进图鉴`, 2600);
        if (added) setTimeout(seriesCheck, first ? (view === 'street' ? 1400 : 2800) : 600);
      });
      if (now > nextWare) { nextWare = now + 1000; ACT.forEach(refillCheck); nekoTick(); pumpCards(); if (view === 'street') guideTick(); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    setInterval(save, 5000); addEventListener('pagehide', save);
    /* ---------- v0.41: the app's lifecycle, for the shell (the prototype wires it to the page going hidden) ----------
       pause: save, remember when, stop the loop and the sound. resume(now): settle the time away with the same replay
       as a cold start (and its receipt), then sell live again. plan(): see leavePlan */
    window.GAME = {
      // (v0.43) going away mid 全部补货 finishes it at once, as a tap would; a trial (试运转 / 试装) ends on the way back,
      // before the time away is settled — so a night away is always counted
      pause() { if (paused) return; paused = true; pausedAt = Date.now();
        if (allRun) { allSkip = true; instantFill(actMachines().filter(needs)); }
        save(); SND.pause(); },
      resume(now = Date.now()) {
        if (!paused) return; paused = false; SND.resume();
        const from = pausedAt, settleAway = () => { if (now - from <= 60000) return; const b = settle(from, now); ECON.newRound(); if (b) { earn(0, 0); queueReceipt(b); }
          MACHINES.forEach((_, i) => { builtYaw[i] = NaN; }); refreshStreet(); streetGoods(); if (view === 'machine') rebuild(cur); };
        last = performance.now(); MACHINES.forEach((m, i) => { nextIdle[i] = last + saleGap(m) * UTIL.rand(.05, 1); });
        requestAnimationFrame(loop);
        if (trial) enterStreet().then(() => setTimeout(() => { settleAway(); save(); }, 600)); else { settleAway(); save(); }
      },
      // (v0.43) the shell takes the turn over: handler({type: 'start' | 'move' | 'end' | 'done', yaw}); null gives it back
      onTurn(h) { turnHandler = typeof h === 'function' ? h : null; if (!turnHandler) turnSess = false; },
      // (v0.43) a cat's accessories as the street and the close-up draw them (ミケ: what the album dresses her in; the
      // others once their 见证 reaches tier 2)
      gearOf: id => gearOf(id),
      plan: quick => leavePlan(!!quick),
      get paused() { return paused; },
      /* (v0.42) for a shell that pre-renders the turn (a native snapshot of each angle, behind a freeze-frame of the
         current one): the machine up close redrawn at yaw exactly as a drag would show it — same framing, glyphs,
         cats, stickers, look — quietly (no detent tick or haptic). Resolves true once that frame is painted, false when
         the view cannot turn now (street, door open or moving, a sale running). turnTo(the old yaw) puts it back */
      turnTo(y) {
        if (view !== 'machine' || !canTurn()) return Promise.resolve(false);
        quietTurn = true; try { setYaw(Math.max(LIM_L, Math.min(LIM_R, y))); } finally { quietTurn = false; }
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true))));
      },
      get yaw() { return yaw; }, get canTurn() { return view === 'machine' && canTurn(); }, yawRange: [LIM_L, LIM_R], detent: 8,
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) GAME.pause(); else GAME.resume(); });
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(snapshot);
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(boot); else boot(hot && hot.data ? hot.data : {});
})();
