/* The shop cat ミケ up close, on top of the machine: a papercraft cat with marker drawn on it (heta-uma: loose on
   purpose, on a construction that is not). Every part (body, head, ears, paws) is a faceted block lofted from a few
   rings, flat-shaded in three steps like folded card under the street lamp, with a firm outline and faint dashed folds.
   The face, the hatched blush and the fur ticks are drawn on like marker.
   Her signature, the same in every picture of her: a sakura-cut notch in the left ear (a neighbourhood cat), an orange
   right ear and forehead patch, an ω mouth, whiskers poking past the outline, and a striped tail with a dark tip that
   hangs over the front of the machine. Her gear from the album wardrobe is built the same way.
   Local units: x along her body (head at +x), y toward the front, z up; scaled by S and set on the machine top. */
const CAT3D = (() => {
  const { P, f, plane } = ISO;
  const CX = 88, CY = 63, HX = 10.5, HZ = 11;
  let S = 1.2, KS = S * Math.sqrt(1.5);
  /* coats (cat v2): every cat is the same papercraft, painted differently. paper: base; patch / dark: its marks;
     body / head: how the marks fall; ears: notched or plain, left and right colours; tail: base, rings, tip */
  const INKC = '#2a2030';
  const COATS = {
    mike: { paper: '#fffaf1', patch: '#ffac5a', dark: '#5b4752', mark: '#df7d34', body: 'calico', head: 'R', ears: ['notch', '#fffaf1', '#ffac5a'], tail: ['#fffaf1', '#ffac5a', '#5b4752'] },
    chibi: { paper: '#fffaf1', patch: '#ffac5a', dark: '#5b4752', mark: '#df7d34', body: 'calico', head: 'L', ears: ['plain', '#ffac5a', '#fffaf1'], tail: ['#fffaf1', '#ffac5a', '#5b4752'], size: .78 },
    kuro: { paper: '#3b3346', body: 'plain', head: 'plain', ears: ['plain', '#3b3346', '#3b3346'], inner: '#6a5878', tail: ['#3b3346', null, '#3b3346'], lid: '#cfc4e6', iris: '#ffd84a', nose: '#1d1724', pink: '#6a4a72', whisk: '#cfc4e6' },
    chatora: { paper: '#ffc285', patch: '#ec8a40', mark: '#d9742c', body: 'tabby', head: 'tabby', ears: ['plain', '#ffc285', '#ffc285'], tail: ['#ffc285', '#ec8a40', '#ec8a40'], muzzle: '#fff4e6' },
    mofu: { paper: '#fff3e0', patch: '#5e4536', body: 'plain', head: 'mask', ears: ['plain', '#5e4536', '#5e4536'], inner: '#9a7a66', tail: ['#5e4536', null, '#5e4536'], iris: '#4f9cff', nose: '#1d1724', paws: '#ffffff', size: 1.05, ruff: true },
    shiro: { paper: '#ffffff', body: 'plain', head: 'plain', ears: ['plain', '#ffffff', '#ffffff'], tail: ['#ffffff', null, '#ffffff'], iris: ['#4f9cff', '#ffd84a'] },
    ao: { paper: '#9aa9c2', body: 'plain', head: 'plain', ears: ['plain', '#9aa9c2', '#9aa9c2'], inner: '#c4b4d0', tail: ['#9aa9c2', null, '#9aa9c2'], iris: '#8ee05a', nose: '#55637a', pink: '#b08aa8' },
    hachi: { paper: '#ffffff', patch: '#3b3346', body: 'hachi', head: 'hachi', ears: ['plain', '#3b3346', '#3b3346'], inner: '#6a5878', tail: ['#3b3346', null, '#3b3346'], paws: '#ffffff' },
  };
  let K = COATS.mike;
  const C = { get paper() { return K.paper; }, get orange() { return K.patch; }, get dark() { return K.dark || K.patch; }, get pink() { return K.pink || '#ffa3ba'; }, get nose() { return K.nose || '#ff7f9a'; }, ink: INKC, get mark() { return K.mark || '#df7d34'; } };
  const L = (() => { const v = [-.38, .52, .76], l = Math.hypot(...v); return v.map(x => x / l); })();   // light: upper front left

  /* ---------- tiny mesh kit ---------- */
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const avg = ps => { const c = [0, 0, 0]; ps.forEach(p => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }); return c.map(v => v / ps.length); };
  function newell(ps) {
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; x += (a[1] - b[1]) * (a[2] + b[2]); y += (a[2] - b[2]) * (a[0] + b[0]); z += (a[0] - b[0]) * (a[1] + b[1]); }
    const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l];
  }
  const rnd = k => { const s = Math.sin(k * 12.9898) * 43758.5453; return s - Math.floor(s); };
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
  // three flat steps of light, shading toward the night's violet rather than black
  const shade = (c, n) => { const t = dot(n, L); return t > .5 ? c : t > .05 ? mix(c, '#7d6c9e', .17) : mix(c, '#4b3d6e', .33); };
  // a loft: rings of points (same count, same way round) joined by quads; caps close both ends. Faces point outward.
  function loft(rings, caps = true) {
    const n = rings[0].length, V = rings.flat(), F = [];
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) F.push([i * n + j, i * n + (j + 1) % n, (i + 1) * n + (j + 1) % n, (i + 1) * n + j]);
    if (caps) F.push(rings[0].map((_, j) => j), rings[rings.length - 1].map((_, j) => (rings.length - 1) * n + j));
    const c = avg(V);
    return { V, F: F.map(fc => { const ps = fc.map(k => V[k]); return dot(newell(ps), sub(avg(ps), c)) < 0 ? fc.slice().reverse() : fc; }) };
  }
  const ringX = (x, pr, c, s = [1, 1]) => pr.map(([y, z]) => [x, c[0] + (y - c[0]) * s[0], c[1] + (z - c[1]) * s[1]]);
  const ringY = (y, pr, c, s = [1, 1]) => pr.map(([x, z]) => [c[0] + (x - c[0]) * s[0], y, c[1] + (z - c[1]) * s[1]]);
  const ellipse = (cx, cy, z, rx, ry, n = 16) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), z]; });
  // hand-folded: every vertex off by a hair (the same every time), except where it stands on the machine
  const wobble = (m, seed, keep = () => false) => { m.V = m.V.map((p, k) => p[2] < .5 || keep(k) ? p : p.map((v, a) => v + (rnd(seed + k * 3.1 + a * 1.7) - .5) * .34)); return m; };
  const place = (m, W) => ({ F: m.F, V: m.V.map(W) });
  const pt = p => P(...p).map(f).join(' ');
  const poly = ps => 'M' + ps.map(pt).join('L') + 'Z';
  const depth = p => ISO.dir(...p);

  // a part: faces turned to the camera, far to near, flat-shaded; then its outline (firm) and folds (faint, dashed)
  function part(m, color, xray, two = false) {
    const vis = [];
    m.F.forEach((fc, i) => { const ps = fc.map(k => m.V[k]), n = newell(ps), front = ISO.dir(...n) > .01; if (front || two) vis.push({ i, fc, ps, n, front, d: depth(avg(ps)) }); });
    vis.sort((a, b) => a.d - b.d);
    const cnt = new Map(); let s = '';
    for (const v of vis) {
      s += xray ? `<path class="ckx" d="${poly(v.ps)}"/>` : `<path d="${poly(v.ps)}" fill="${v.front ? shade(color(v.i), v.n) : mix(color(v.i), '#3a2d55', .45)}"/>`;
      if (v.front) v.fc.forEach((a, k) => { const b = v.fc[(k + 1) % v.fc.length], key = a < b ? a + ',' + b : b + ',' + a; cnt.set(key, (cnt.get(key) || 0) + 1); });
    }
    let sil = '', fold = '';
    cnt.forEach((c, key) => { const [a, b] = key.split(',').map(Number), seg = `M${pt(m.V[a])}L${pt(m.V[b])}`; if (c === 1) sil += seg; else fold += seg; });
    return s + (fold ? `<path class="${xray ? 'ckxf' : 'ckf'}" d="${fold}"/>` : '') + (sil ? `<path class="${xray ? 'xcatline' : 'cks'}" d="${sil}"/>` : '');
  }
  // spheres (pompom, the chef's puff, a bell) drawn as one blob: outlines first, fills over them, so only the outer edge shows
  function balls(list, fill, W) {
    const cs = list.map(([x, y, z, r]) => { const [sx, sy] = P(...W([x, y, z])); return [f(sx), f(sy), f(r * KS)]; });
    return cs.map(([x, y, r]) => `<circle class="ckt" cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('') + cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('')
      + cs.map(([x, y, r]) => `<circle cx="${f(x - r * .32)}" cy="${f(y - r * .38)}" r="${f(r * .26)}" fill="#fff" opacity=".75"/>`).join('');
  }
  // drawing on a surface: a plane through local point o, u along local x, v along local -z (front-facing) or y (top)
  const onFront = (W, y, s) => `<g transform="${plane(W([0, y, 0]), [S, 0, 0], [0, 0, -S])}">${s}</g>`;
  const onTop = (W, z, s) => `<g transform="${plane(W([0, 0, z]), [S, 0, 0], [0, S, 0])}">${s}</g>`;

  /* ---------- her parts ---------- */
  const BODY = [[-7, 1], [-6, 0], [6, 0], [7, 1], [7, 5.6], [5.2, 8.9], [2.6, 10], [-2.6, 10], [-5.2, 8.9], [-7, 5.6]];
  const body = () => wobble(loft([ringX(-15, BODY, [0, 0], [.62, .8]), ringX(-13.4, BODY, [0, 0], [.9, .95]), ringX(-11, BODY, [0, 0]), ringX(-2, BODY, [0, 0]),
    ringX(6.5, BODY, [0, 0]), ringX(9, BODY, [0, 0], [.8, .9])]), 3);
  // calico: orange over the back half, a little dark saddle, white everywhere else (faces = segment * 10 + edge; 50 rear, 51 front)
  const bodyColor = i => { const seg = Math.floor(i / 10), j = i % 10;
    if (K.body === 'calico') {
      if (i === 50 || (seg <= 1 && j >= 3) || (seg === 2 && j >= 5 && j <= 8)) return C.orange;
      if (seg === 3 && (j === 7 || j === 8)) return C.dark; return C.paper;
    }
    // tabby: dark bands across the back
    if (K.body === 'tabby') return i < 50 && (seg === 1 || seg === 3) && j >= 4 && j <= 8 ? K.patch : C.paper;
    // black and white: a black back and rump, a white chest and belly
    if (K.body === 'hachi') return i === 50 || (i < 50 && j >= 4) ? K.patch : C.paper;
    return C.paper; };
  const HEAD = [[-4.2, 5], [4.2, 5], [6, 5.6], [7.6, 8.6], [7, 11.5], [5, 15.4], [2.2, 17], [-2.2, 17], [-5, 15.4], [-7, 11.5], [-7.6, 8.6], [-6, 5.6]].map(([x, z]) => [HX + x, z]);
  const head = () => wobble(loft([ringY(-6, HEAD, [HX, HZ], [.8, .82]), ringY(-4.2, HEAD, [HX, HZ], [.96, .97]), ringY(4.6, HEAD, [HX, HZ]), ringY(6.5, HEAD, [HX, HZ], [.86, .86])]), 9, k => k >= 36);
  const headColor = i => { const seg = Math.floor(i / 12), j0 = i % 12, j = K.head === 'L' ? (12 - j0) % 12 : j0;
    if ((K.head === 'R' || K.head === 'L') && i < 36 && (j === 4 || j === 5 || (j === 6 && seg <= 1) || (j === 3 && seg === 0))) return C.orange;
    if (K.head === 'hachi' && i < 36 && j0 >= 4 && j0 <= 8) return K.patch;
    return C.paper; };
  // ears: a wedge from the outline at the front to a smaller one behind; the left one has its sakura notch
  const EAR_L = [[HX - 6.5, 12.6], [HX - 1.7, 16.9], [HX - 3.7, 21.7], [HX - 5.1, 19.6], [HX - 6.5, 21.8]];
  const EAR_R = [[HX + 1.7, 16.9], [HX + 6.5, 12.6], [HX + 5.8, 21.6]];
  const EAR_LP = [[HX - 6.5, 12.6], [HX - 1.7, 16.9], [HX - 5.8, 21.6]];   // a plain left ear (no sakura notch)
  const ear = pr => { const c = [pr.reduce((a, p) => a + p[0], 0) / pr.length, Math.min(...pr.map(p => p[1])) + 2]; return loft([ringY(-.9, pr, c, [.62, .62]), ringY(2.6, pr, c)]); };
  const PAW = (tall = 1) => [[-2.2, 0], [2.2, 0], [2.5, 1.3 * tall], [1.7, 2.6 * tall], [-1.7, 2.6 * tall], [-2.5, 1.3 * tall]];
  const paw = (px, tall) => { const pr = PAW(tall).map(([x, z]) => [px + x, z]); return loft([ringY(4.4, pr, [px, 1]), ringY(9.6, pr, [px, 1]), ringY(10.7, pr, [px, 1.2], [.78, .8])]); };
  const PAWS = [8, 13.2];
  // the tail: from under her front, over the lid's edge and down the machine; k swings it. On the ground (lying in front
  // of a machine) it lies flat and curls round her back toward her front paws instead
  const tailPts = (k, pose) => pose === 'ground'
    ? [[-12.5, 3.5, 1.4], [-16.5, 5.5, 1], [-19, 9.5, .8], [-17.6, 13.6, .7], [-13.4, 15.2, .7], [-9 + .8 * k, 14.8, .7], [-5.4 + 1.6 * k, 13.6, .7]]
    : [[-7, 5.5, 1.3], [-7.2, 11, 1.1], [-7.3, 16.5, .7], [-7.1 + .3 * k, 19.9, -.9], [-6.9 + .8 * k, 20.9, -5.2], [-6.7 + 1.4 * k, 20.7, -9.8], [-6.4 + 2 * k, 20.3, -13.8]];
  const toWorld = o => p => [CX + o[0] + S * p[0], CY + o[1] + S * p[1], 240 + o[2] + S * p[2]];

  /* ---------- drawn on ---------- */
  // her face, on the front of the head: closed eyes (or open ones while awake), nose, ω mouth, hatched blush, whiskers, the patch
  const facePatch = () => {
    if (K.head === 'R' || K.head === 'L') return `<g${K.head === 'L' ? ' transform="scale(-1 1)"' : ''}><path d="M1.5-5.1C2.7-4.3 3.6-4.2 4.4-3.7L6-.5C5-.9 4.4-1.5 3.6-1.9C2.7-2.4 2.1-3.4 1.5-5.1Z" fill="${C.orange}"/>
      <path class="ckm" d="M1.8-4.4C2.4-3.2 3.3-2.4 4.7-1.6M4.9-3.2l.5.7" stroke="${C.mark}" stroke-width=".32"/></g>`;
    if (K.head === 'tabby') return `<path class="ckm" d="M-1.6-5.7l.35 2.1M0-6.1v2.4M1.6-5.7l-.35 2.1M-6.6-.4l1.6.3M-6.6 1.1l1.5.1M6.6-.4l-1.6.3M6.6 1.1l-1.5.1" stroke="${K.mark}" stroke-width=".5"/>`
      + `<ellipse cy="2.5" rx="2.7" ry="1.8" fill="${K.muzzle}"/>`;
    if (K.head === 'mask') return `<ellipse cy="1.1" rx="4.6" ry="3.9" fill="${K.patch}" opacity=".42"/><ellipse cy="2.1" rx="2.3" ry="1.9" fill="${K.patch}" opacity=".5"/>`;
    if (K.head === 'hachi') return `<path d="M-6.8-1.3C-6.6-4.6-4.4-6.6-.6-7.1L-.9-1.9Q-3.6-2.4-6.8-1.3Z" fill="${K.patch}"/><path d="M6.8-1.3C6.6-4.6 4.4-6.6 .6-7.1L.9-1.9Q3.6-2.4 6.8-1.3Z" fill="${K.patch}"/>`;
    return '';
  };
  const irisOf = n => Array.isArray(K.iris) ? K.iris[n] : K.iris;
  const openEyes = () => K.iris
    ? [[-2.75, 0], [2.75, 1]].map(([x, n]) => `<ellipse cx="${x}" cy=".45" rx="1.15" ry="1.3" fill="${irisOf(n)}" stroke="${C.ink}" stroke-width=".3"/><ellipse cx="${x}" cy=".5" rx=".36" ry=".95" fill="${C.ink}"/>`).join('')
    : `<ellipse cx="-2.75" cy=".45" rx=".95" ry="1.1" fill="${C.ink}"/><ellipse cx="2.75" cy=".45" rx=".95" ry="1.1" fill="${C.ink}"/>`;
  const ruff = () => K.ruff ? `<path d="M-5.6 4.6l-1.2 1.5 1.4.3-.7 1.6 1.6-.5.5 1.5 1.1-1.2 1 1.4.9-1.4 1 1.4 1-1.4 1.1 1.2.5-1.5 1.6.5-.7-1.6 1.4-.3-1.2-1.5z" fill="${K.paper}" stroke="${C.ink}" stroke-width=".35" stroke-linejoin="round"/>` : '';
  const face = () => `<g transform="translate(${HX} ${-HZ})">${facePatch()}
      <g class="eyes-shut"><path class="ckm" d="M-3.9.2q1.15 1.3 2.3 0M1.6.2q1.15 1.3 2.3 0M-3.9.2l-.7-.42M3.9.2l.7-.42" stroke="${K.lid || C.ink}" stroke-width=".62"/></g>
      <g class="eyes-open" style="display:none">${openEyes()}
        <circle cx="-2.42" cy=".05" r=".34" fill="#fff"/><circle cx="3.08" cy=".05" r=".34" fill="#fff"/></g>
      <path d="M-.62 1.5h1.24l-.62.72z" fill="${C.nose}" stroke="${C.ink}" stroke-width=".22" stroke-linejoin="round"/>
      <path class="ckm" d="M-1.45 2.45q.72 1 1.45.1q.73.9 1.45-.1" stroke="${K.lid || C.ink}" stroke-width=".42"/>
      <ellipse cx="-4.35" cy="2.05" rx="1.3" ry=".72" fill="${C.pink}" opacity=".9"/><ellipse cx="4.35" cy="2.05" rx="1.3" ry=".72" fill="${C.pink}" opacity=".9"/>
      ${K.pink ? '' : `<path class="ckm" d="M-5 2.5l.55-.85M-4.4 2.6l.55-.85M-3.8 2.5l.5-.8M3.7 2.5l.55-.85M4.3 2.6l.55-.85M4.9 2.5l.5-.8" stroke="#ff6f92" stroke-width=".24"/>`}
      <path class="ckm" d="M-5.7 2.7l-3.6-.75M-5.6 3.5l-3.4.55M5.7 2.7l3.6-.75M5.6 3.5l3.4.55" stroke="${K.whisk || C.ink}" stroke-width=".3"/>${ruff()}</g>`;
  const innerEar = side => side === 'notch' ? `<path d="M${HX - 5.6} -14L${HX - 2.9} -16.6L${HX - 4.2} -18.9L${HX - 5.3} -18.1Z" fill="${K.inner || '#ffa3ba'}"/>`
    : side === 'left' ? `<path d="M${HX - 2.9} -16.6L${HX - 5.6} -14L${HX - 5.2} -19.6Z" fill="${K.inner || '#ffa3ba'}"/>`
    : `<path d="M${HX + 2.9} -16.6L${HX + 5.6} -14L${HX + 5.2} -19.6Z" fill="${K.inner || '#ffa3ba'}"/>`;
  // fur ticks on her back, in a darker orange marker
  const backMarks = () => K.body === 'calico' ? `<path class="ckm" d="M-12.6-1.6q.6.7.1 1.5M-10.6.4q.6.7.1 1.5M-8.6-1.1q.6.7.1 1.5M-4.4-2.4q-.7.9-.1 1.8t-.2 1.8" stroke="${C.mark}" stroke-width=".36"/>`
    : K.body === 'tabby' ? `<path class="ckm" d="M-13-2.6q.8 1.6 0 3.4M-6.4-2.8q.8 1.7 0 3.6M.4-2.8q.8 1.7 0 3.6" stroke="${K.mark}" stroke-width=".5"/>` : '';
  const toes = px => `<path class="ckm" d="M${px - .75}-.5v-1.1M${px + .75}-.5v-1.1" stroke="${C.ink}" stroke-width=".3"/>`;

  /* ---------- gear (album wardrobe) ---------- */
  function neckGear(d, W) {
    if (d.id === 'tencho') {   // her name badge (店長): a red string and a little wooden plate under the chin
      const band = place(loft([ellipse(HX, .4, 5, 8.1, 6.9), ellipse(HX, .4, 5.7, 8.15, 6.95)], false), W);
      const plate = place(loft([[[HX - 2.6, 7.3, 4.6], [HX + 2.6, 7.3, 4.6], [HX + 2.6, 7.3, 1.4], [HX - 2.6, 7.3, 1.4]], [[HX - 2.6, 7.9, 4.6], [HX + 2.6, 7.9, 4.6], [HX + 2.6, 7.9, 1.4], [HX - 2.6, 7.9, 1.4]]]), W);
      return part(band, () => '#ff5a6a') + part(plate, () => d.c) + onFront(W, 7.95, `<text x="${HX}" y="-2.3" font-size="1.7" text-anchor="middle" class="ckbadge">店長</text>`);
    }
    if (d.id === 'bell') {   // a red collar and a gold bell under the chin
      const band = place(loft([ellipse(HX, .4, 4.9, 8.2, 7), ellipse(HX, .4, 6.1, 8.25, 7.05)], false), W), [bx, by] = P(...W([HX, 7.7, 3.9]));
      return part(band, () => '#ff5a6a') + balls([[HX, 7.7, 3.9, 1.75]], d.c, W) + `<path class="ckm" d="M${f(bx - 1.5)} ${f(by + .6)}h3" stroke="${C.ink}" stroke-width=".7"/>`;
    }
    if (d.id === 'bowtie') return onFront(W, 7.55, `<path d="M${HX} -3.6l-2.6-1.6v3.2zM${HX} -3.6l2.6-1.6v3.2z" fill="${d.c}" stroke="${C.ink}" stroke-width=".3" stroke-linejoin="round"/><circle cx="${HX}" cy="-3.6" r=".8" fill="${d.c}" stroke="${C.ink}" stroke-width=".28"/>`);
    if (d.id === 'bag') {   // a delivery bag on a strap across the chest
      const band = place(loft([ellipse(HX, .4, 4.4, 8.2, 7), ellipse(HX, .4, 5.4, 8.25, 7.05)], false), W);
      const pouch = place(loft([[[HX + 2.6, 7.4, 4.4], [HX + 6.4, 7.4, 4.4], [HX + 6.4, 7.4, .9], [HX + 2.6, 7.4, .9]], [[HX + 2.6, 8.8, 4.4], [HX + 6.4, 8.8, 4.4], [HX + 6.4, 8.8, .9], [HX + 2.6, 8.8, .9]]]), W);
      return part(band, () => d.c) + part(pouch, () => d.c) + onFront(W, 8.85, `<path class="ckm" d="M${HX + 2.7} -3.5h3.6" stroke="${C.ink}" stroke-width=".3"/><circle cx="${HX + 4.5}" cy="-2.4" r=".4" fill="#fff"/>`);
    }
    // a scarf: a band round the neck and a loose end hanging down on her right
    const band = place(loft([ellipse(HX, .4, 4.3, 8.4, 7.2), ellipse(HX, .4, 6.9, 8.5, 7.3)], false), W);
    const end = place(loft([[[15.8, 7.7, 6.2], [17.9, 7.5, 6], [17.6, 8.7, 2.3], [15.6, 8.7, 2.7]], [[15.8, 7.1, 6.2], [17.9, 6.9, 6], [17.6, 8.1, 2.3], [15.6, 8.1, 2.7]]]), W);
    const stars = d.id === 'scarf-star' ? onFront(W, 7.45, `<path d="M6.4-5.6l.35.75.8.08-.6.53.18.8-.73-.42-.73.42.18-.8-.6-.53.8-.08z" fill="#ffe14a"/><path d="M12.6-5.7l.3.6.65.06-.5.44.15.66-.6-.34-.6.34.15-.66-.5-.44.65-.06z" fill="#ffe14a"/>`) : '';
    return part(band, () => d.c) + stars + part(end, () => d.c) + onFront(W, 8.75, `<path class="ckm" d="M15.9-2.7v-.8M16.6-2.6v-.8M17.3-2.5v-.8" stroke="${C.ink}" stroke-width=".22"/>`);
  }
  // a crown between the ears: a zigzag ring, its inside showing through the top
  function crown(d, W) {
    const n = 10, bot = ellipse(HX, -.2, 16.4, 3.3, 2.7, n), top = Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [HX + 3.55 * Math.cos(a), -.2 + 2.9 * Math.sin(a), 16.4 + (i % 2 ? 2.2 : 4)]; });
    const m = place(loft([bot, top], false), W);
    const gems = top.filter((p, i) => i % 2 === 0 && Math.sin(i / n * Math.PI * 2) > -.2).map(p => { const [x, y] = P(...W(p)); return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.55 * KS)}" fill="#ff4f8b" stroke="${C.ink}" stroke-width=".4"/>`; }).join('');
    return part(m, () => d.c, false, true) + gems;
  }
  // a chef's hat: a band on top of the head and a puff of four balls
  const chef = (d, W) => part(place(loft([ellipse(HX, -1.4, 16.3, 3.6, 3, 14), ellipse(HX, -1.4, 19, 3.65, 3.05, 14)], false), W), () => '#ffffff')
    + balls([[HX - 2, -1.4, 19.8, 2.3], [HX + 2, -1.4, 19.8, 2.3], [HX, -2.2, 20.4, 2.3], [HX, -.8, 21, 2.7]], '#ffffff', W);
  // a knit hat over the ears: a dome, a white rim and a pompom
  const knit = (d, W) => part(place(loft([ellipse(HX, .3, 13, 8.6, 7.3, 14), ellipse(HX, .3, 16.8, 7.9, 6.7, 14), ellipse(HX, .3, 19.8, 6, 5.1, 14), ellipse(HX, .3, 21.4, 3.2, 2.7, 14)]), W), () => d.c)
    + part(place(loft([ellipse(HX, .3, 12.4, 9, 7.7, 14), ellipse(HX, .3, 14.6, 9.05, 7.75, 14)], false), W), () => '#ffffff')
    + balls([[HX, .3, 22.9, 2.3]], '#ffffff', W);
  const clip = (d, W) => onFront(W, 2.64, `<g transform="translate(${HX + 3.4} -16) rotate(-18)"><path d="M-.8-.3l-1.9-1.2v3l1.9-1.2zM.8-.3l1.9-1.2v3l-1.9-1.2z" fill="${d.c}" stroke="${C.ink}" stroke-width=".28" stroke-linejoin="round"/><rect x="-.9" y="-.9" width="1.8" height="1.8" rx=".6" fill="${d.c}" stroke="${C.ink}" stroke-width=".28"/></g>`);

  /* ---------- the tail ---------- */
  function catmull(ps, per = 5) {
    const out = [];
    for (let i = 0; i < ps.length - 1; i++) {
      const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
      for (let s = 0; s < per; s++) { const t = s / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(a => .5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3))); }
    }
    out.push(ps[ps.length - 1]); return out;
  }
  // a tapered tube in screen space: one outline for the whole tail, stripes painted inside it, a dark tip.
  // puff (1): startled by the X-ray line — the tail fluffs up fat and spiky (polish, 2026-10-16)
  function tail(k, o, xray, pose = 'top', coatId, world, puff = 0) {
    if (coatId) useCoat(coatId);
    const W = toWorld(o), cs = catmull(world ? world(k) : tailPts(k, pose).map(W)), sp = cs.map(p => P(...p)), n = sp.length, Lf = [], Rt = [];
    const [tb, tr, tt] = K.tail;
    const rad = i => (1.9 - .6 * i / (n - 1)) * KS * (puff ? (1.7 - .25 * i / (n - 1)) * (i > 2 ? (i % 2 ? 1.2 : .88) : 1) : 1);
    for (let i = 0; i < n; i++) { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, r = rad(i);
      Lf.push([sp[i][0] - dy / l * r, sp[i][1] + dx / l * r]); Rt.push([sp[i][0] + dy / l * r, sp[i][1] - dx / l * r]); }
    const band = (i0, i1) => 'M' + [...Lf.slice(i0, i1 + 1), ...Rt.slice(i0, i1 + 1).reverse()].map(p => f(p[0]) + ' ' + f(p[1])).join('L') + 'Z';
    const at = t => Math.round(t * (n - 1)), tip = sp[n - 1], whole = band(0, n - 1), cap = `cx="${f(tip[0])}" cy="${f(tip[1])}" r="${f(rad(n - 1))}"`;
    if (xray) return `<path class="xcatline" d="${whole}"/>` + sp.filter((_, i) => i % 3 === 1).map(p => `<circle class="xbone" cx="${f(p[0])}" cy="${f(p[1])}" r=".8"/>`).join('');
    return `<path class="ckt" d="${whole}" fill="${tb}"/><circle class="ckt" ${cap} fill="${tt}"/><path d="${whole}" fill="${tb}"/>`
      + (tr ? [[.34, .46], [.57, .68]].map(([a, b]) => `<path d="${band(at(a), at(b))}" fill="${tr}"/>`).join('') : '')
      + `<path d="${band(at(.82), n - 1)}" fill="${tt}"/><circle ${cap} fill="${tt}"/>`
      + `<path class="ckm" d="M${Lf.slice(at(.1), at(.8)).map(p => f(p[0] * .75 + sp[Lf.indexOf(p)][0] * .25) + ' ' + f(p[1] * .75 + sp[Lf.indexOf(p)][1] * .25)).join('L')}" stroke="#fff" stroke-width=".9" opacity=".7"/>`;
  }

  /* ---------- the whole cat ---------- */
  function useCoat(id) { K = COATS[id] || COATS.mike; S = 1.2 * (K.size || 1); KS = S * Math.sqrt(1.5); }
  function draw(xray, o = [0, 0, 0], gear = {}, pose = 'top', coatId = 'mike') {
    useCoat(coatId);
    const W = toWorld(o), { neck, head: hat, feet } = xray ? {} : gear;
    const B = place(body(), W), H = place(head(), W);
    const groups = [];
    // body, with fur ticks on the back
    groups.push({ d: depth(W([-3, 0, 5])), s: part(B, bodyColor, xray) + (xray ? '' : onTop(W, 10.05, backMarks())) });
    // head: the face drawn on, the neck gear, hats, ears (far one first)
    let hs = part(H, headColor, xray);
    if (xray) hs += onFront(W, 6.5, `<g transform="translate(${HX} ${-HZ})"><circle class="xcatline" cy="-.6" r="4.6"/><g class="xeyes"><circle class="xbone" cx="-2.6" cy="-.2" r="1.1"/><circle class="xbone" cx="2.6" cy="-.2" r="1.1"/></g><path class="xbone" d="M-1.4 3.2h2.8"/></g>`);
    else hs += onFront(W, 6.52, face());
    if (neck) hs += neckGear(neck, W);
    if (hat && hat.id === 'chef-hat') hs += chef(hat, W);
    if (hat && hat.id === 'crown') hs += crown(hat, W);
    const notch = K.ears[0] === 'notch';
    const ears = [[notch ? EAR_L : EAR_LP, K.ears[1], notch ? 'notch' : 'left'], [EAR_R, K.ears[2], 'right']].map(([pr, col, side]) => { const m = place(ear(pr), W); return { d: depth(avg(m.V)), s: part(m, () => col, xray) + (xray ? '' : onFront(W, 2.62, innerEar(side))) }; });
    ears.sort((a, b) => a.d - b.d).forEach(e => { hs += e.s; });
    if (hat && hat.id === 'knit-hat') hs += knit(hat, W);
    if (hat && hat.id === 'candy-clip') hs += clip(hat, W);
    groups.push({ d: depth(W([HX, 0, 11])), s: hs });
    // front paws, in socks or boots when worn
    const tall = feet && feet.id === 'boots-rain' ? 1.45 : 1;
    let ps = '';
    PAWS.forEach(px => { ps += part(place(paw(px, tall), W), () => feet ? feet.c : K.paws || C.paper, xray);
      if (!xray) ps += onFront(W, 10.72, toes(px) + (feet && feet.id === 'socks-white' ? `<path class="ckm" d="M${px - 1.6}-1.9h3.2" stroke="#ff5a6a" stroke-width=".45"/>` : '')
        + (feet && feet.id === 'boots-rain' ? `<path class="ckm" d="M${px - 1.8}-.35h3.6" stroke="${C.ink}" stroke-width=".6"/>` : '')); });
    groups.push({ d: depth(W([10.6, 7.5, 1.3])), s: ps });
    let s = groups.sort((a, b) => a.d - b.d).map(g => g.s).join('');
    // the tail hangs in front of everything; X-ray adds her bones and the fish she had for dinner
    s += `<g class="cat-tail">${tail(0, o, xray, pose, coatId)}</g>`;
    if (xray) {
      s += `<path class="xbone" d="M${[[-13, 0, 6.4], [-6, 0, 7.2], [1, 0, 7.4], [7, 0, 8.2]].map(p => pt(W(p))).join('L')}"/>`
        + [-9, -6, -3, 0].map(x => `<path class="xbone" d="M${pt(W([x, -5, 4.6]))}L${pt(W([x, 0, 7.6]))}L${pt(W([x, 5, 4.6]))}"/>`).join('')
        + onTop(W, 4, `<g transform="translate(-6 -1.4)"><path class="xfish" d="M0 1.6l2.6-1.6 5.4 0 1.6-1.2v4l-1.6-1.2h-5.4z"/><path class="xfish" d="M3.4.4v2.4M5 .2v2.8M6.6.2v2.8"/></g>`);
    } else { const [zx, zy] = P(...W([HX + 7.5, 0, 21])); s += `<text class="zz" x="${f(zx)}" y="${f(zy)}">z</text>`; }
    return s;
  }
  // head first in a machine's take-out flap (an easter egg): up close all you see is the tail hanging out, swinging.
  // at: the world point of the flap's lower edge
  const outPts = at => k => [[at[0], at[1], at[2]], [at[0] + .4, at[1] + 1.6, at[2] - 3], [at[0] + 1 + k * .8, at[1] + 2.6, at[2] - 7], [at[0] + 1.6 + k * 1.8, at[1] + 3, at[2] - 11.5], [at[0] + 2 + k * 2.8, at[1] + 3.2, at[2] - 15]];
  const tailOut = (k, at, coatId, xray, puff) => tail(k, [0, 0, 0], xray, 'top', coatId, outPts(at), puff);
  /* ---------- the lucky cat figurine (招き猫, polish 2026-10-16) ----------
     The album's 招き猫 up close, built like the cats (user: one style per scene, no mixing): faceted ceramic parts lofted
     from rings, three flat steps of light, a firm outline and faint folds, the face drawn on. A red cushion, a white
     calico body, a red collar with a gold bell, a koban held to the chest, the left paw raised. That paw is its own group
     (.mnk-paw) turning round the shoulder, so a sale can make it beckon. at: the world point it stands on; s: its scale.
     Local units as the cat's (x right, y toward the front, z up); about 25 tall. */
  const squircle = (z, r, k = 1, n = 16) => Array.from({ length: n }, (_, i) => { const a = (i + .5) / n * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a), q = Math.pow(c ** 4 + sn ** 4, -.25); return [r * k * c * q, r * k * sn * q, z]; });
  function maneki(at, s = .8) {
    const W = p => [at[0] + s * p[0], at[1] + s * p[1], at[2] + s * p[2]];
    const draw2 = (y, svg) => `<g transform="${plane(W([0, y, 0]), [s, 0, 0], [0, 0, -s])}">${svg}</g>`;
    const CER = '#fffdf6', RED = '#e8343f', GOLD = '#ffc93a', ORA = '#ffac5a', DK = '#3b3346';
    const ln = (w, c = INKC) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    // a plump cushion
    let out = part(place(loft([squircle(0, 10, .94), squircle(1.3, 10), squircle(2.7, 10, .9)]), W), () => '#c23a52');
    // body: an orange patch on the left flank, a dark one round the right back (faces: ring gap * 16 + step round)
    const body = wobble(loft([ellipse(0, 0, 2.6, 6.6, 5.8), ellipse(0, 0, 5.6, 7.4, 6.4), ellipse(0, 0, 9, 6.8, 5.9), ellipse(0, 0, 12, 5.2, 4.6), ellipse(0, 0, 13.2, 4, 3.6)]), 21);
    out += part(place(body, W), i => { const g = Math.floor(i / 16), j = i % 16; return i < 64 && g >= 1 && g <= 2 && j >= 7 && j <= 9 ? ORA : i < 64 && g === 2 && j >= 14 ? DK : CER; });
    // the koban, and the right paw holding it to the chest
    out += draw2(6.1, `<ellipse cx="-1.4" cy="-7.4" rx="3.5" ry="2.4" fill="${GOLD}" ${ln(.55)}/><path class="ckm" d="M-3.6-7.4h4.4M-1.4-8.9v3" ${ln(.35, '#b07a10')}/>`
      + `<path d="M-6-6.2q1.1-2.8 3.7-2q.7 1.9-.9 3z" fill="${CER}" ${ln(.45)}/>`);
    // the collar, under the chin
    out += part(place(loft([ellipse(0, .3, 11.2, 5.9, 5.3), ellipse(0, .3, 12.7, 5.3, 4.8)], false), W), () => RED);
    // head: round, a little forward, an orange patch over the left of the brow
    const head = wobble(loft([ellipse(0, .8, 13.3, 4.6, 4), ellipse(0, .8, 14.5, 7, 5.8), ellipse(0, .8, 17.4, 7.8, 6.4), ellipse(0, .8, 20.5, 6.8, 5.6), ellipse(0, .8, 22.3, 4.2, 3.6), ellipse(0, .8, 22.8, 1.8, 1.6)]), 27);
    let hs = part(place(head, W), i => { const g = Math.floor(i / 16), j = i % 16; return i < 80 && g >= 2 && g <= 4 && j >= 6 && j <= 9 ? ORA : CER; });
    hs += draw2(7.25, `<g transform="translate(0 -17.3)"><path class="ckm" d="M-4.2-.5q1.4-1.7 2.8 0M1.4-.5q1.4-1.7 2.8 0" ${ln(.6)}/><path d="M-.6 1h1.2l-.6.7z" fill="#ff7f9a" ${ln(.2)}/>`
      + `<path class="ckm" d="M-1.4 2q.7.9 1.4 0q.7.9 1.4 0" ${ln(.4)}/><ellipse cx="-4.5" cy="1.5" rx="1.3" ry=".7" fill="#ffa3ba"/><ellipse cx="4.5" cy="1.5" rx="1.3" ry=".7" fill="#ffa3ba"/>`
      + `<path class="ckm" d="M-5.5 2.1l-3.4-.7M-5.4 2.9l-3.2.6M5.5 2.1l3.4-.7M5.4 2.9l3.2.6" ${ln(.3)}/></g>`);
    const ears = [[[[-6.4, 19.7], [-2.4, 22.2], [-5.5, 26.2]], CER, `<path d="M-5.4 -20.5L-3.2 -21.9L-4.9 -24.5Z" fill="#ffa3ba"/>`], [[[2.4, 22.2], [6.4, 19.7], [5.5, 26.2]], DK, '']]
      .map(([pr, col, inner]) => { const m = place(ear(pr.map(([x, z]) => [x, z])), W); return { d: depth(avg(m.V)), s: part(m, () => col) + (inner ? draw2(2.62, inner) : '') }; });
    ears.sort((a, b) => a.d - b.d).forEach(e => { hs += e.s; });
    out += hs;
    // the bell, on the collar's front
    const [bx, by] = P(...W([0, 5.8, 10.9])), br = 1.35 * s * Math.sqrt(1.5);
    out += `<circle class="ckt" cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="${GOLD}"/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(br)}" fill="${GOLD}"/><path d="M${f(bx - br * .7)} ${f(by + br * .15)}h${f(br * 1.4)}" stroke="#b07a10" stroke-width=".5"/>`;
    // the raised left paw, palm to the street; it beckons round the shoulder
    const arm = wobble(loft([[11.4, 6, 2, 1.9], [14.6, 7.2, 2.3, 2.1], [17.7, 8.1, 2.5, 2.2], [20.2, 8.5, 2.6, 1.9], [21.4, 8.6, 2.6, 1.1]].map(([z, x, y, r]) => ellipse(x, y, z, r, r * .92, 10))), 33);
    const [sx, sy] = P(...W([6, 2, 12]));
    out += `<g class="mnk-paw" style="transform-origin:${f(sx)}px ${f(sy)}px">${part(place(arm, W), () => CER)}`
      + draw2(4.7, `<ellipse cx="8.5" cy="-19.3" rx=".95" ry=".75" fill="#ffa3ba"/><path class="ckm" d="M7.8-21.1v1M9-21.2v1" ${ln(.35)}/>`) + `</g>`;
    return `<g class="mnk mnk3">${out}</g>`;
  }
  return { draw, tail, tailOut, maneki, COATS };
})();
