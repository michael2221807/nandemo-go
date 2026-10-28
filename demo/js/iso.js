/* Axonometric kernel + small helpers.
   Projection, plane() and the rounded box follow iso-figure / iso-glow (MIT, Tolga Cohce & April Zhu), generalised
   so the camera can turn around the vertical axis: yaw 0 = true isometric (azimuth 45°), elevation stays at 35.26°.
   +x runs down-right, +y down-left, +z up. FRONT = the y-max face. The camera sees the x-max side while the azimuth
   is positive (ISO.right) and the x-min side once it turns past the front (azimuth < 0). */
const ISO = (() => {
  const K = Math.sqrt(1.5), SB = 1 / Math.sqrt(3), CB = Math.sqrt(2 / 3), KSB = K * SB;
  let A = Math.PI / 4, ax, ay, bx, by, sa, ca;
  const set = a => { A = a; sa = Math.sin(a); ca = Math.cos(a); ax = K * ca; ay = -K * sa; bx = KSB * sa; by = KSB * ca; };
  set(A);
  const P = (x, y, z) => [ax * x + ay * y, bx * x + by * y - z];
  const D = P;
  const f = n => (Math.round(n * 100) / 100);
  const plane = (O, U, V) => { const o = P(...O), u = D(...U), v = D(...V);
    return `matrix(${f(u[0])} ${f(u[1])} ${f(v[0])} ${f(v[1])} ${f(o[0])} ${f(o[1])})`; };
  const TOP = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]);
  const FRONT = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]);
  const SIDE = (x, y, z) => plane([x, y, z], [0, -1, 0], [0, 0, -1]);
  // the x-min face seen from the left: origin at its back-top corner, u runs toward the front so text reads normally
  const SIDEL = (x, y, z) => plane([x, y, z], [0, 1, 0], [0, 0, -1]);
  const rect = (t, w, h, r = 0, cls = 'face', extra = '') => `<g transform="${t}"><rect class="${cls}" width="${w}" height="${h}" rx="${r}" ${extra}/></g>`;
  const d3 = pts => 'M' + pts.map(p => P(...p).map(f).join(' ')).join('L') + 'Z';
  const path = pts => 'M' + pts.map(p => P(...p).map(f).join(' ')).join('L');
  // rounded box: one rounded top + the side wall that faces the camera (outward normals at angle t with sin(t + A) > 0)
  const rounded = (x, y, z, w, d, h, r, cls = '') => {
    r = Math.min(r, w / 2, d / 2);
    const n = 10, z1 = z + h, H = Math.PI / 2, c = cls ? ' ' + cls : '';
    const corner = t => t < 0 ? [x + w - r, y + r] : t < H ? [x + w - r, y + d - r] : t < 2 * H ? [x + r, y + d - r] : [x + r, y + r];
    // outline points for normal angles a0..a1 (within -π/2..3π/2), one arc per corner, straight runs in between
    const walk = (a0, a1) => { const cuts = [a0], o = [];
      for (let k = 0; k <= 2; k++) if (k * H > a0 && k * H < a1) cuts.push(k * H);
      cuts.push(a1);
      for (let i = 0; i < cuts.length - 1; i++) { const s = cuts[i], e = cuts[i + 1], [cx, cy] = corner((s + e) / 2), m = Math.max(2, Math.ceil(n * (e - s) / H));
        for (let j = 0; j <= m; j++) { const a = s + (e - s) * j / m; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } }
      return o; };
    const ring = walk(-H, 3 * H), vis = walk(-A, Math.PI - A);
    const wall = [...vis.map(([a, b]) => [a, b, z]), ...vis.slice().reverse().map(([a, b]) => [a, b, z1])];
    return `<path class="face${c}" d="${d3(wall)}"/><path class="face top${c}" d="${d3(ring.map(([a, b]) => [a, b, z1]))}"/>`;
  };
  const box = (x, y, z, w, d, h, r = 0, cls = '') => r > 0 ? rounded(x, y, z, w, d, h, r, cls) :
    rect(SIDE(sa >= 0 ? x + w : x, y + d, z + h), d, h, 0, 'face side ' + cls) + rect(FRONT(x, y + d, z + h), w, h, 0, 'face front ' + cls) + rect(TOP(x, y, z + h), w, d, 0, 'face top ' + cls);
  const disc = (cx, cy, z, r, cls = 'face top', extra = '') => `<g transform="${TOP(cx, cy, z)}"><circle class="${cls}" r="${r}" ${extra}/></g>`;
  const bounds = pts => { const d = pts.map(p => P(...p)); const xs = d.map(p => p[0]), ys = d.map(p => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };
  const boxBounds = (x, y, z, w, d, h) => bounds([[x, y, z], [x + w, y, z], [x, y + d, z], [x + w, y + d, z], [x, y, z + h], [x + w, y, z + h], [x, y + d, z + h], [x + w, y + d, z + h]]);
  const slits = (a0, a1, step, b0, b1, vertical = true, cls = 'detail') => { let s = '';
    for (let a = a0; a <= a1 + 1e-6; a += step) s += vertical ? `<line class="${cls}" x1="${f(a)}" y1="${b0}" x2="${f(a)}" y2="${b1}"/>` : `<line class="${cls}" x1="${b0}" y1="${f(a)}" x2="${b1}" y2="${f(a)}"/>`;
    return s; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // painter's key: larger = nearer the camera
  const key = (x, y, z = 0) => x * sa + y * ca + z * .002;
  // camera yaw in degrees (0 = isometric)
  const setYaw = deg => set(Math.PI / 4 + deg * Math.PI / 180);
  // visible half of a standing cylinder (angles of its outward normal) and of one lying along x
  const visZ = () => [-A, Math.PI - A];
  const visX = () => { const t0 = Math.atan2(SB / CB, ca); return [t0 - Math.PI / 2, t0 + Math.PI / 2]; };
  // offset of a point pushed toward the viewer by t, in FRONT-plane local units (u right, v down)
  const pushOut = t => [-Math.tan(A) * t, KSB / ca * t];
  // how much a direction points at the camera (> 0 = toward it)
  const dir = (x, y, z) => x * sa + y * ca + z * KSB;
  // the world point under screen point (sx, sy) on the camera-facing surface of box b = [x, y, z, w, d, h];
  // off the box, the point on that view ray nearest the box's vertical axis
  function unproject(sx, sy, b) {
    const det = K * KSB, x0 = (sx * by - ay * sy) / det, y0 = (ax * sy - bx * sx) / det, v = [sa, ca, KSB], o = [x0, y0, 0];
    let t0 = -Infinity, t1 = Infinity;
    for (let i = 0; i < 3; i++) {
      const lo = b[i], hi = b[i] + b[i + 3];
      if (Math.abs(v[i]) < 1e-9) { if (o[i] < lo || o[i] > hi) { t0 = Infinity; break; } continue; }
      let a = (lo - o[i]) / v[i], c = (hi - o[i]) / v[i]; if (a > c) [a, c] = [c, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, c);
    }
    const t = t0 <= t1 ? t1 : (b[0] + b[3] / 2 - x0) * sa + (b[1] + b[4] / 2 - y0) * ca;
    return [x0 + t * sa, y0 + t * ca, t * KSB];
  }
  return { P, D, f, plane, TOP, FRONT, SIDE, SIDEL, rect, rounded, box, disc, path, d3, bounds, boxBounds, slits, esc, key, setYaw, visZ, visX, pushOut, dir, unproject,
    get alpha() { return A; }, get yaw() { return (A - Math.PI / 4) * 180 / Math.PI; },
    // true while the x-max side faces the camera; fwd = which way (+1 right, -1 left) the machine's front points on screen
    get right() { return sa >= 0; }, get fwd() { return sa > 0 ? -1 : 1; } };
})();

/* tiny animation + DOM helpers. UTIL.speed (>= 1) runs every tween and wait faster: tapping a machine to call
   customers raises it, so the whole mechanism visibly hurries. */
const UTIL = (() => {
  const S = { speed: 1 };
  /* reduced motion (v0.41, agreed with the developers): the machines' mechanisms keep playing (they are the show, and
     not the large motion the setting is for); camera flights fade instead of flying, puffs and the street's ambient
     touches stop. Read live, so changing the setting takes effect at once */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  S.reduced = mq.matches;
  if (mq.addEventListener) mq.addEventListener('change', e => { S.reduced = e.matches; });
  const ease = {
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    in: t => t * t * t,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    bounce: t => { const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  };
  const tween = (ms, step, e = ease.out) => new Promise(res => {
    if (ms <= 0) { step(1); res(); return; }
    const t0 = performance.now(); ms /= S.speed;
    const tick = now => { const t = Math.max(0, Math.min(1, (now - t0) / ms)); step(e(t)); if (t < 1) requestAnimationFrame(tick); else res(); };
    requestAnimationFrame(tick);
  });
  const wait = ms => new Promise(r => setTimeout(r, ms / S.speed));
  /* money in letter units: every 1000 carries into the next letter (1A = 1,000, 1B = 1,000A ... Z, AA, AB ...) */
  const unitName = t => { let s = ''; while (t > 0) { t--; s = String.fromCharCode(65 + t % 26) + s; t = Math.floor(t / 26); } return s; };
  function fmt(n) {
    n = Math.max(0, n || 0);
    if (n < 1000) return { num: String(Math.floor(n)), unit: '', tier: 0 };
    let t = Math.floor(Math.log10(n) / 3), m = n / Math.pow(1000, t);
    let num = m >= 100 ? m.toFixed(0) : m >= 10 ? m.toFixed(1) : m.toFixed(2);
    if (+num >= 1000) { t++; m /= 1000; num = m.toFixed(2); }
    return { num, unit: unitName(t), tier: t };
  }
  /* money as the player reads it (2026-10-18; the user: thousands with a letter felt small): yen in full while it fits
     (¥12,345), then 万-steps in Chinese and Japanese — one character each, 万 亿 兆 京 垓 秭 穰 沟 涧 正 载 极 (no
     恒河沙 and such: too silly, the user) — and million, billion … in English. Always four figures, so it visibly runs.
     The letters (fmt, unitName) stay underneath as the milestones: each one ×1000 */
  const BIG = { zh: ['', '万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极'], ja: ['', '万', '億', '兆', '京', '垓', '秭', '穣', '溝', '澗', '正', '載', '極'] };
  const EN = ['', '', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion', ' decillion', ' undecillion', ' duodecillion', ' tredecillion', ' quattuordecillion', ' quindecillion', ' sexdecillion'];
  const four = m => m >= 1000 ? Math.floor(m).toLocaleString('en-US') : m >= 100 ? m.toFixed(1) : m >= 10 ? m.toFixed(2) : m.toFixed(3);
  function big(n) {
    n = Math.max(0, n || 0);
    const lang = (typeof I18N !== 'undefined' && I18N.lang) || 'zh';
    if (lang === 'en') {
      if (n < 1e6) return { num: Math.floor(n).toLocaleString('en-US'), unit: '' };
      let k = Math.min(EN.length - 1, Math.floor(Math.log10(n) / 3)), m = n / Math.pow(1e3, k);
      if (m >= 999.95 && k < EN.length - 1) { k++; m /= 1e3; }
      return { num: four(m), unit: EN[k] };
    }
    if (n < 1e5) return { num: Math.floor(n).toLocaleString('en-US'), unit: '' };
    const U = BIG[lang] || BIG.zh; let k = Math.min(U.length - 1, Math.floor(Math.log10(n) / 4)), m = n / Math.pow(1e4, k);
    if (m >= 9999.5 && k < U.length - 1) { k++; m /= 1e4; }
    return { num: four(m), unit: U[k] };
  }
  const money = n => { const v = big(n); return '¥' + v.num + v.unit; };
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const g = (parent, html = '', attrs = {}) => { const n = el('g', attrs, parent); if (html) n.insertAdjacentHTML('beforeend', html); return n; };
  const rand = (a, b) => a + Math.random() * (b - a);
  // play a CSS animation again without forcing a layout: drop the class, let a frame render without it, add it back
  // (reading a size in between, the usual trick, lays out the whole scene there and then — costly mid-animation)
  const puff = (el, ms = 2600, dx = 6, dy = -16, peak = .85) => { if (!el || S.reduced) return Promise.resolve(); let last = 0;
    return tween(ms, e => { const now = performance.now(); if (now - last < 31 && e < 1) return; last = now;
      el.setAttribute('transform', `translate(${(dx * e).toFixed(2)} ${(dy * e).toFixed(2)})`); el.style.opacity = (e < .2 ? e / .2 * peak : peak * (1 - (e - .2) / .8)).toFixed(2); }, t => t)
      .then(() => { el.style.opacity = 0; }); };
  const restart = (el, cls = 'go') => { if (!el) return; el.classList.remove(cls); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add(cls))); };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const haptic = ms => { if (S.noHaptic) return; try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* not supported */ } };   // (settings can turn it off, v0.38)
  /* popups read at a glance (user, 2026-10-16): names and numbers stand out. hl(text) escapes it, then marks the names
     the app registers (cats, brands, goods, cat food, decorations) and the numbers (money, ×N, a time, counts with their
     unit). Only for popups (cards, notes, toasts, the receipt, the cat card, album details), never the world */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  const NUM = '[+\\-−]?¥\\s?[\\d,.]+(?:[A-Z]+|[万亿億兆京垓秭穰穣沟溝涧澗正载載极極]|\\s[a-z]*illion)?|×\\s?[\\d.]+|\\d{1,2}:\\d{2}|[+\\-−]?\\d[\\d,.]*(?:\\s?(?:%|件|个|位|次|台|只|小时|分钟|分|秒|個|回|杯|碗|份|匹))?';
  let hlRx = new RegExp(`()(${NUM})`, 'g');
  function hlNames(list) {
    const names = [...new Set(list.filter(n => n && n.length > 1))].sort((a, b) => b.length - a.length)
      .map(n => { const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return /^[A-Za-z]/.test(n) ? `(?<![A-Za-z])${e}(?![A-Za-z])` : e; });
    hlRx = new RegExp(`(${names.join('|') || '(?!)'})|(${NUM})`, 'g');
  }
  const hl = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ESC[c]).replace(hlRx, (m, name) => name ? `<mark class="hl-k">${m}</mark>` : `<mark class="hl-n">${m}</mark>`);
  return Object.assign(S, { ease, tween, wait, el, g, rand, pick, restart, puff, haptic, fmt, big, money, unitName, hl, hlNames });
})();
