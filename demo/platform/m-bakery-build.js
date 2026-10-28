/* 焼きたてパン「こむぎ堂」— geometry (the app's own machine, 2026-10-23; built like the prototype's plants: one station
   per step, no robot arm, the door frames one moment).
   One belt runs right to left across the machine at the height of the door's window. On the right a glass proofing
   cabinet stands over the belt: the shaped dough waits there in a queue of four, swelling as it proves, and a pusher
   from the dough fridge behind it sets a new piece at the back of the queue whenever the front one leaves. The front
   piece rides into the tunnel oven, pale, and comes out the other end golden. At the next station the filling rack
   (four hoppers on a slide, like the taiyaki machine's) stands over the belt: a blade splits a roll down its length or a
   nozzle pushes into a bun, and the chosen hopper deposits. At the end of the belt the bread tips onto a chute, two
   suction cups hold a film bag open at its foot, the bread drops in, and the bag goes down a slide to the take-out
   window.
   The flaw: proving takes real time. Each piece in the cabinet needs a while before it can go in the oven; sell faster
   than that and the line waits (発酵中) with the queue still rising.
   Where a world point shows on the door: u = x − y + 84, v = 156 + y − z (as on the prototype's machines). */
const PB = (() => {
  const W = 120, D = 84, H = 240;
  // the belt: from x0 (its end, the chute) to x1 (the proofing cabinet's back), across y0–y1, its top at z
  const BELT = { x0: 8, x1: 94, y0: 56, y1: 76, z: 140 };
  const BY = (BELT.y0 + BELT.y1) / 2;
  // the stations by x on the belt: the queue in the cabinet (front first), the oven tunnel, the filling station, the chute
  const Q = [70, 76.5, 83, 89.5];
  // (the filling station clear of the oven's front: a roll there ends left of where the oven's glass starts on screen)
  const OVEN = { x0: 46, x1: 63, h: 20 };
  const FILL = 24, CHUTE = BELT.x0 + 2;
  const PROOF = { x0: 64, x1: 94, h: 36 };
  const WINDOW = [60, 79, 25];
  // the upgrades. The fryer: an oil vat in front of the belt between the oven and the filling station (a paddle from the
  // back sweeps the piece into its basket, the basket lifts it back). The sandwich table: in front of the filling
  // station, its knife on a post, a hatch over the bag rack. The pie roller: a sheeter on the proofing cabinet's roof,
  // a chute from it down to a slot in the oven's roof.
  const FRY = { x: 40, x0: 30, x1: 50, y0: 78.5, y1: 83.5, z: BELT.z - 2, z0: 116, oil: BELT.z - 2.6 };
  const SAN = { x: 15, x0: 1, x1: 29, y0: 77.4, y1: 83.6, z: BELT.z - 2 };
  const LAM = { x0: 65, x1: 93, y0: 58, y1: 74, z: BELT.z + PROOF.h + 5, rx: 79, ya: 61, yb: 71, st: [86, 92.4], slot: 59.6, from: 61 };
  // the starting menu (overwritten by the goods plan): shape, how it is filled, the filling's colour
  const MENU = [
    { name: 'あんパン', price: 240, g: 'anpan', dough: 'white', shape: 'round', how: 'inject', fill: '#5a2a22', tier: 1 },
    { name: 'クリームパン', price: 250, g: 'cream', dough: 'white', shape: 'round', how: 'inject', fill: '#f6d860', tier: 1 },
    { name: '焼きそばパン', price: 280, g: 'yakisoba', dough: 'white', shape: 'roll', how: 'split', fill: '#a8642a', tier: 1 },
    { name: '塩パン', price: 220, g: 'shio', dough: 'white', shape: 'roll', how: 'salt', fill: '#fff8e0', tier: 1 },
  ];
  // dough: [raw, baked, its light] (melon: the cookie crust; cro: laminated; fried: the fryer's)
  const DOUGH = { white: ['#f2e2c0', '#c97c2c', '#e8a050'], melon: ['#f6e8b0', '#e2b04a', '#f6d27a'], cro: ['#f0dcb0', '#c06e22', '#e8a050'],
    fried: ['#f2e2c0', '#b8702a', '#d89a4a'], brioche: ['#f6e0a8', '#b85a1a', '#e08a3a'], choco: ['#8a5a3a', '#4a2a18', '#6a4028'], loaf: ['#f4e8cc', '#d8a050', '#f0c880'] };
  return { W, D, H, BELT, BY, Q, OVEN, FILL, CHUTE, PROOF, WINDOW, MENU, DOUGH, FRY, SAN, LAM, SLOTW: [105, D, 196] };
})();

const PBB = (() => {
  const { FRONT, TOP: TOPP, box, path, P, f } = ISO;
  const { W, D, H, BELT, BY, Q, OVEN, FILL, CHUTE, PROOF, DOUGH, FRY, SAN, LAM } = PB;
  const { hull, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ringE = (z, rx, ry, x, y, n = 18) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(x + rx * Math.cos(t), y + ry * Math.sin(t), z); });
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringE(z0, r0, r0, x, y, n), ...ringE(z1, r1, r1, x, y, n)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14) => `<path d="${toD(ringE(z, r, r, x, y, n))}" style="fill:${fill};${ST}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  const mix = (a, b, t) => { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = h(a), B = h(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  /* ---------- the bread, standing on the belt at (x, y, z): o = { shape, dough, how, fill, bake 0..1, cut, filled, k } ---------- */
  const SIZE = { round: [4.6, 4.6, 4.4], roll: [7.2, 3.4, 3.8], cornet: [6.6, 3, 3.6], loaf: [6.4, 4.4, 6.4], crescent: [6.8, 3.6, 3.4] };
  function bread(x, y, z, o) {
    if (o.shape === 'sando') return sando(x, y, z, o);
    if (o.shape === 'crescent' || o.shape === 'cornet') return (o.shape === 'cornet' ? cornet : crescent)(x, y, z, o);
    const [rx0, ry0, h0] = SIZE[o.shape] || SIZE.round, k = o.k || 1, rx = rx0 * k, ry = ry0 * k, h = h0 * k;
    const [raw, baked, light] = DOUGH[o.dough] || DOUGH.white, b = Math.max(0, Math.min(1, o.bake || 0));
    const c = mix(raw, baked, b), cl = mix(raw, light, b);
    // the dome: rings narrowing to the top (a loaf: square-sided, its top domed)
    const loaf = o.shape === 'loaf', rings = loaf ? [[0, 1], [.66, 1], [.84, .9], [1, .55]] : [[0, 1], [.35, .98], [.65, .86], [.88, .6], [1, .22]];
    const ring = (zz, a, b) => loaf ? Array.from({ length: 20 }, (_, i) => { const t = i / 20 * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      return P(x + a * Math.sign(c) * Math.abs(c) ** .45, y + b * Math.sign(sn) * Math.abs(sn) ** .45, zz); }) : ringE(zz, a, b, x, y);
    let s = `<path d="${toD(hull(rings.flatMap(([zz, r]) => ring(z + h * zz, rx * r, ry * (loaf ? Math.min(1, r * 1.1) : r)))))}" fill="${c}" stroke="${mix(c, '#3a1a08', .45)}" stroke-width=".6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
    s += `<path d="${toD(ringE(z + h * .8, rx * .62, ry * .55, x - rx * .08, y - ry * .1))}" fill="${cl}" opacity="${f(.35 + .45 * b)}"/>`;
    if (o.dough === 'melon') for (let i = -1; i <= 1; i++) s += seg([x - rx * .5, y + i * ry * .45 - ry * .3, z + h * .9], [x + rx * .5, y + i * ry * .45 + ry * .3, z + h * .9], mix(c, '#7a4a10', .4), .5) + seg([x + i * rx * .4 - rx * .2, y - ry * .55, z + h * .9], [x + i * rx * .4 + rx * .2, y + ry * .55, z + h * .9], mix(c, '#7a4a10', .4), .5);
    if (o.dough === 'cro' || o.shape === 'crescent') for (let i = -2; i <= 2; i++) s += seg([x + i * rx * .3, y - ry * .8, z + h * .55], [x + i * rx * .3 + rx * .08, y + ry * .8, z + h * .55], mix(c, '#5a2a08', .5), .45);
    if (o.shape === 'cornet') s += [.2, .45, .7].map(t => seg([x - rx + rx * 2 * t, y - ry * .9, z + h * .5], [x - rx + rx * 2 * t - rx * .12, y + ry * .9, z + h * .5], mix(c, '#5a2a08', .5), .5)).join('');
    if (o.dough === 'fried' && b > .5) s += [[-.4, -.3], [.2, .4], [.5, -.2], [-.1, .1], [-.6, .3]].map(([u, v]) => { const [a, bb] = q(x + u * rx, y + v * ry, z + h * .92); return `<circle cx="${a}" cy="${bb}" r=".45" fill="${mix(c, '#fff0c0', .5)}"/>`; }).join('');
    // a split roll: the slit along its length and, filled, the filling heaped in it
    if (o.cut) { s += seg([x - rx * .7, y, z + h + .05], [x + rx * .7, y, z + h + .05], '#3a1a08', .8);
      // (o.filled from 0 to 1 while the nozzle runs along the slit from its right end; true: all of it)
      const fl = o.filled === true ? 1 : +o.filled || 0, fx = x + rx * .72 * (1 - fl);
      if (fl > .02) { s += `<path d="${toD(hull([...ringE(z + h + .2, rx * .72 * fl, ry * .3, fx, y, 14), ...ringE(z + h + 1.6 * k, rx * .6 * fl, ry * .22, fx, y, 14)]))}" fill="${o.fill}" stroke="rgba(0,0,0,.35)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`;
        if (o.g === 'yakisoba' || o.fill === '#a8642a') s += [-.4, 0, .4].filter(t => x + t * rx >= fx - rx * .6 * fl).map(t => seg([x + t * rx - rx * .12, y - ry * .12, z + h + 1.7 * k], [x + t * rx + rx * .12, y + ry * .12, z + h + 1.9 * k], '#e8453a', .5)).join(''); } }
    // a bun with its filling pushed in: a little mark where the nozzle went
    if (o.how === 'inject' && o.filled && o.shape !== 'cornet') { const [a, bb] = q(x, y + ry * .96, z + h * .45); s += `<circle cx="${a}" cy="${bb}" r="${f(.7 * k)}" fill="${o.fill}" stroke="rgba(0,0,0,.4)" stroke-width=".3"/>`; }
    if (o.how === 'salt' && o.filled) s += [[-.3, -.1], [.1, .2], [.35, -.15], [-.05, -.3], [.5, .1]].map(([u, v]) => { const [a, bb] = q(x + u * rx, y + v * ry, z + h * .95); return `<rect x="${f(+a - .35)}" y="${f(+bb - .35)}" width=".7" height=".7" fill="#fff"/>`; }).join('');
    if (o.how === 'glaze' && o.filled) s += `<path d="${toD(ringE(z + h * .9, rx * .7, ry * .62, x, y))}" fill="${o.fill}" opacity=".85"/>`;
    return s;
  }
  // the croissant: a crescent, its horns toward the front, thick in the middle; drawn as overlapping humps along the
  // arc (all their outlines first, then all their fills, so only the outline of the whole shows), the rolled layers
  // across it
  const tone = o => { const [raw, baked, light] = DOUGH[o.dough] || DOUGH.cro, b = Math.max(0, Math.min(1, o.bake || 0)), c = mix(raw, baked, b); return [c, mix(raw, light, b), mix(c, '#3a1a08', .45)]; };
  function crescent(x, y, z, o) {
    const [rx0, ry0, h0] = SIZE.crescent, k = o.k || 1, rx = rx0 * k, ry = ry0 * k, h = h0 * k, [c, cl, line] = tone(o), n = 7;
    const pts = Array.from({ length: n }, (_, i) => { const a = i / (n - 1) * 2 - 1, th = a * 1.4, w = .32 + .68 * (1 - Math.abs(a) ** 1.4);
      return { x: x + rx * .82 * Math.sin(th), y: y + ry * 1.25 * (1 - Math.cos(th)) - ry * .6, r: ry * .7 * w, h: h * w, th }; });
    const hump = (p, q2) => toD(hull([p, q2].flatMap(t => [...ringE(z, t.r, t.r, t.x, t.y, 12), ...ringE(z + t.h * .62, t.r * .78, t.r * .78, t.x, t.y, 12), ...ringE(z + t.h, t.r * .3, t.r * .3, t.x, t.y, 8)])));
    const ds = pts.slice(1).map((p, i) => hump(pts[i], p));
    let s = ds.map(d => `<path d="${d}" fill="${line}" stroke="${line}" stroke-width="1.2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`).join('')
      + ds.map(d => `<path d="${d}" fill="${c}"/>`).join('');
    s += `<path d="${toD(ringE(z + h * .78, rx * .3, ry * .3, x - rx * .05, y - ry * .5))}" fill="${cl}" opacity="${f(.3 + .4 * (o.bake || 0))}"/>`;
    // the layers: a line across the arc at each hump
    pts.slice(1, -1).forEach(p => { const nx = -Math.sin(p.th), ny = Math.cos(p.th) * .9;
      s += seg([p.x - nx * p.r * .85, p.y - ny * p.r * .85, z + p.h * .62], [p.x + nx * p.r * .2, p.y + ny * p.r * .2, z + p.h * .98], line, .45); });
    return s;
  }
  // the chocolate cornet: a cone lying along x, its tip to the left and its mouth (the chocolate in it) to the right,
  // the spiral of dough round it
  const ringX = (cx, cy, cz, r, n = 14) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(cx, cy + r * Math.cos(t), cz + r * Math.sin(t)); });
  function cornet(x, y, z, o) {
    const [rx0, ry0] = SIZE.cornet, k = o.k || 1, rx = rx0 * k, R = ry0 * k * 1.05, [c, cl, line] = tone(o);
    const at = t => ({ x: x - rx + 2 * rx * t, r: R * (.18 + .82 * t) }), rings = [0, .25, .5, .75, 1].map(at);
    let s = `<path d="${toD(hull(rings.flatMap(p => ringX(p.x, y, z + p.r, p.r))))}" fill="${c}" stroke="${line}" stroke-width=".6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
    // the spiral: one band over the top at each turn
    [.22, .42, .62, .82].forEach(t => { const a = at(t), b = at(t + .1), [p0x, p0y] = q(a.x, y - a.r * .96, z + a.r), [p1x, p1y] = q((a.x + b.x) / 2, y, z + 2 * (a.r + b.r) / 2 + .05), [p2x, p2y] = q(b.x, y + b.r * .96, z + b.r);
      s += `<path d="M${p0x} ${p0y}Q${f(2 * p1x - (+p0x + +p2x) / 2)} ${f(2 * p1y - (+p0y + +p2y) / 2)} ${p2x} ${p2y}" fill="none" stroke="${line}" stroke-width=".5"/>`; });
    s += `<path d="${toD(ringE(z + R * 1.08, rx * .36, R * .22, x - rx * .1, y - R * .12))}" fill="${cl}" opacity="${f(.25 + .4 * (o.bake || 0))}"/>`;
    // the mouth: the dough's rim, the chocolate in it once filled
    const m = at(1);
    s += `<path d="${toD(ringX(m.x, y, z + m.r, m.r * .96))}" fill="${mix(c, '#fff0d0', .25)}" stroke="${line}" stroke-width=".5" vector-effect="non-scaling-stroke"/>`;
    if (o.filled) s += `<path d="${toD(ringX(m.x + .05, y, z + m.r, m.r * .72))}" fill="${o.fill}"/><path d="${toD(ringX(m.x + .1, y - m.r * .2, z + m.r * 1.2, m.r * .25))}" fill="#fff" opacity=".35"/>`;
    return s;
  }
  // the sandwich, cut: two triangles of crustless bread standing side by side, the filling between the slices showing
  // on the cut faces (layers along y: the back slice, the filling, the front slice)
  function sando(x, y, z, o) {
    const k = o.k || 1, L = 5.6 * k, Hh = 5 * k, T = 4.2 * k, y0 = y - T / 2, ln = 'stroke="#6a5a40" stroke-width=".5" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
    let s = '';
    [x + 3.1 * k, x - 3.1 * k].forEach(cx => {
      const A = [cx - L / 2, z], B = [cx + L / 2, z], C = [cx + (cx < x ? .6 : -.6) * k, z + Hh];
      const band = (p, q, t0, t1, c) => `<path d="${toD([P(p[0], y0 + t0, p[1]), P(q[0], y0 + t0, q[1]), P(q[0], y0 + t1, q[1]), P(p[0], y0 + t1, p[1])])}" fill="${c}"/>`;
      // the two cut faces (from above), each in its layers; then the front slice's face
      [[A, C], [C, B]].forEach(([p, q]) => { s += `<path d="${toD([P(p[0], y0, p[1]), P(q[0], y0, q[1]), P(q[0], y0 + T, q[1]), P(p[0], y0 + T, p[1])])}" fill="#fff6e0" ${ln}/>`
        + band(p, q, T * .36, T * .64, o.fill) + (o.g === 'fruit' || o.g === 'amaou' ? band(p, q, T * .4, T * .6, '#fffaf0') + [.3, .7].map(t => { const [a, b] = q2(p, q, t, y0 + T / 2); return `<circle cx="${a}" cy="${b}" r="${f(.55 * k)}" fill="${o.fill}"/>`; }).join('') : ''); });
      s += `<path d="${toD([P(A[0], y0 + T, A[1]), P(B[0], y0 + T, B[1]), P(C[0], y0 + T, C[1])])}" fill="#fffaf0" ${ln}/>`
        + `<path d="${toD([P(A[0] + .5 * k, y0 + T + .02, A[1] + .4 * k), P(B[0] - .5 * k, y0 + T + .02, B[1] + .4 * k), P(C[0], y0 + T + .02, C[1] - .7 * k)])}" fill="none" stroke="#f0e2c0" stroke-width=".35"/>`;
    });
    return s;
  }
  const q2 = (a, b, t, yy) => q(a[0] + (b[0] - a[0]) * t, yy, a[1] + (b[1] - a[1]) * t);
  // the flat bread for the menu tiles and the shop (24 × 24), side on, each good its own shape: a bun (its filling
  // in a cut), the glove-shaped cream bun, a roll split along the top, the spiral cornet with chocolate in its mouth,
  // the croissant's crescent, the laminated pain au chocolat, a crumbed curry bun, a sugared fried roll, the tall loaf,
  // a triangle sandwich (the back slice, the filling, the front slice)
  function icon(g) {
    const id = g.g || g.id, sh = g.shape || 'round', [, baked, light] = DOUGH[g.dough] || DOUGH.white, ink = '#141018';
    const k = `stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"`, thin = `stroke="${ink}" stroke-width=".8" stroke-linejoin="round"`;
    const bun = `<path d="M3.6 16Q3.6 6.4 12 6.4Q20.4 6.4 20.4 16Q20.4 17.6 18.8 17.6H5.2Q3.6 17.6 3.6 16Z" fill="${baked}" ${k}/><path d="M7 10Q12 7.6 17 10" fill="none" stroke="${light}" stroke-width="1.1" stroke-linecap="round"/>`;
    const roll = c => `<path d="M3 15Q3 8 12 7.6Q21 8 21 15Q21 17 19 17H5Q3 17 3 15Z" fill="${c || baked}" ${k}/><path d="M6.4 10.4Q12 8.6 17.6 10.4" fill="none" stroke="${light}" stroke-width="1" stroke-linecap="round"/>`;
    const dot = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" ${thin}/>`;
    let s;
    if (g.how === 'sando') {
      const fruit = id === 'fruit' || id === 'amaou';
      const tri = (dx, dy, c, st) => `<path d="M${2.6 + dx} ${18.8 + dy}L${10.6 + dx} ${7.4 + dy}L${18.4 + dx} ${18.8 + dy}Z" fill="${c}" ${st}/>`;
      s = tri(4.4, -2.8, '#fff8e8', k) + tri(2.2, -1.4, fruit ? '#fffaf0' : g.fill, k)
        + (fruit ? [[6.4, 15.4], [9.2, 11.4], [12, 7.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.05" fill="${g.fill}" ${thin}/>`).join('') : '')
        + (id === 'katsu' ? `<path d="M5.4 16.6L12.8 6" stroke="#5a2a10" stroke-width=".8"/>` : '')
        + tri(0, 0, '#fffdf6', k) + `<path d="M5.4 17.4L10.6 10L15.8 17.4" fill="none" stroke="#f0e0bc" stroke-width=".7"/>`;
    } else if (sh === 'loaf') {
      s = `<path d="M4.6 19V10Q4.6 5 8.6 5Q12 3.4 15.4 5Q19.4 5 19.4 10V19Z" fill="${baked}" ${k}/><path d="M7.4 9.6Q7.4 7.6 9.4 7.6Q12 6.6 14.6 7.6Q16.6 7.6 16.6 9.6V17H7.4Z" fill="#fff4dc"/><path d="M8.6 6.6Q12 5.4 15.4 6.6" fill="none" stroke="${light}" stroke-width=".9" stroke-linecap="round"/>`;
    } else if (id === 'cream') {
      // (the half-moon cream bun: the cuts along its rim)
      s = `<path d="M3 16.2Q3 6.8 12 6.8Q21 6.8 21 16.2Q21 17.6 19.4 17.6H4.6Q3 17.6 3 16.2Z" fill="${baked}" ${k}/>` + [[14.6, 7.4, 13.8, 9.4], [17.4, 8.8, 16.2, 10.4], [19.4, 11.2, 17.8, 12.2]].map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}" stroke="${ink}" stroke-width=".9" stroke-linecap="round"/>`).join('')
        + `<path d="M6 10.6Q8.6 8.6 11.6 8.4" fill="none" stroke="${light}" stroke-width="1.1" stroke-linecap="round"/>` + dot(10.6, 13.6, 2.4, g.fill);
    } else if (sh === 'cornet') {
      s = `<path d="M2.6 12.6L17.6 6.6Q21.6 12 17.6 17.6Z" fill="${baked}" ${k}/>` + [[7, 10.8, 7.6, 14.6], [10.6, 9.4, 11.4, 15.6], [14.2, 7.9, 15, 16.6]].map(([a, b, c, d]) => `<path d="M${a} ${b}Q${a + 1.6} ${(b + d) / 2} ${c} ${d}" fill="none" stroke="${ink}" stroke-width=".7"/>`).join('')
        + `<ellipse cx="18.4" cy="12.1" rx="1.8" ry="4.2" fill="${g.fill}" ${thin}/>`;
    } else if (sh === 'crescent') {
      s = `<path d="M2.6 16.8Q1.8 12.6 6 10.6Q12 6.4 18 10.6Q22.2 12.6 21.4 16.8Q19.6 15.2 17.6 15.8Q12 13.2 6.4 15.8Q4.4 15.2 2.6 16.8Z" fill="${baked}" ${k}/>` + [[8.6, 9.4, 9.4, 14.6], [12, 8.2, 12, 13.6], [15.4, 9.4, 14.6, 14.6]].map(([a, b, c, d]) => `<path d="M${a} ${b}L${c} ${d}" stroke="${ink}" stroke-width=".7"/>`).join('')
        + `<path d="M6.6 11.6Q12 8.4 17.4 11.6" fill="none" stroke="${light}" stroke-width=".9" stroke-linecap="round"/>`;
    } else if (id === 'painchoco') {
      s = `<rect x="3.4" y="8.6" width="17.2" height="8.6" rx="2.4" fill="${baked}" ${k}/>` + [11.2, 13.4, 15.4].map(y => `<path d="M5 ${y}H19" stroke="#8a4a14" stroke-width=".6"/>`).join('')
        + `<path d="M6 10.2Q12 8.6 18 10.2" fill="none" stroke="${light}" stroke-width=".9" stroke-linecap="round"/><rect x="18.4" y="10.6" width="2.4" height="1.6" rx=".4" fill="${g.fill}" ${thin}/><rect x="18.4" y="13.6" width="2.4" height="1.6" rx=".4" fill="${g.fill}" ${thin}/>`;
    } else if (id === 'curry') {
      s = `<path d="M3.2 15.2Q3.2 7.6 12 7.6Q20.8 7.6 20.8 15.2Q20.8 17.6 18.6 17.6H5.4Q3.2 17.6 3.2 15.2Z" fill="${baked}" ${k}/>` + [[6, 11], [8.6, 9.4], [12, 8.8], [15.4, 9.4], [18, 11], [6.8, 14], [17.4, 14.2], [9.4, 12], [14.8, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".55" fill="#e8b060"/>`).join('') + dot(12, 14.2, 2.2, g.fill);
    } else if (id === 'agepan') {
      s = roll() + [[6, 10.6], [8.4, 9.4], [11, 8.8], [13.6, 8.9], [16.2, 9.6], [18.4, 11], [7.2, 13], [10, 12.2], [12.8, 12], [15.6, 12.6], [17.6, 14]].map(([x, y]) => `<rect x="${x - .35}" y="${y - .35}" width=".7" height=".7" fill="#fff6dc"/>`).join('');
    } else if (sh === 'roll' || id === 'mentai') {
      s = roll() + (id === 'mentai' ? `<path d="M7.4 10.2l2.2-1.6M11 9.2l2.2-1.4M14.4 9.4l2.2-1.2" stroke="${ink}" stroke-width=".8"/>` : '');
      if (g.how === 'split') s += id === 'wiener' ? `<rect x="2.6" y="8.2" width="18.8" height="2.8" rx="1.4" fill="${g.fill}" ${thin}/>` : `<path d="M5.4 9.4Q12 6.6 18.6 9.4L18 11Q12 9 6 11Z" fill="${g.fill}" ${thin}/>`;
      if (id === 'yakisoba') s += `<path d="M8 8.6l1.2.8M11.4 7.8l1.2.8M14.8 8.2l1.2.8" stroke="#e8453a" stroke-width=".7"/>`;
      if (g.how === 'salt') s += `<path d="M9 9.2h.9M12 8.4h.9M15 9.4h.9M10.6 11h.9" stroke="#fff" stroke-width=".9"/><path d="M5.4 15.6H18.6" stroke="#f6e0a0" stroke-width=".8"/>`;
    } else {
      s = bun;
      if (g.dough === 'melon') s += `<path d="M7 9l6 7M11 8l6 7M15 8.4l-8 6.6M18 10l-7 6" stroke="#b07a20" stroke-width=".7" opacity=".7"/>` + (id === 'goldmelon' ? `<path d="M19.4 3.2l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#fff4a0" ${thin}/>` : '');
      else if (g.how === 'inject') s += dot(12, 13.4, 2.6, g.fill);
      if (id === 'anpan') s += `<circle cx="12" cy="7.6" r="1.1" fill="#3a2418"/><path d="M11.4 7.4h.4M12.2 7.9h.4" stroke="#fff" stroke-width=".35"/>`;
      if (id === 'jam') s += `<path d="M10 7.4Q12 6.2 14 7.4" fill="none" stroke="${g.fill}" stroke-width="1" stroke-linecap="round"/>`;
    }
    return `<g transform="translate(.2 .4)">${s}</g>`;
  }
  // the crate: a pack of filling (in its colour), the dough tub
  function defs() {
    const pack = `<g id="g-pb-pack">${box(-5.5, -3.5, 0, 11, 7, 2.4, 0, 'pb-pack')}<g transform="${TOPP(-5.5, -3.5, 2.43)}"><rect x="1" y="1" width="9" height="5" rx="2.4" style="fill:var(--c)"/></g></g>`;
    const tub = `<g id="g-pb-dough"><path d="M-7 0l-1-11h16l-1 11z" fill="#e6eef6" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="0" cy="-11" rx="8" ry="2.2" fill="#f2e2c0" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-5" y="-8" width="10" height="4.4" rx="1" fill="#c97c2c"/><text x="0" y="-4.8" font-size="3.2" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">生地</text></g>`;
    return pack + tub;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the belt: its top as a dark strip with slats that move ---------- */
  function belt(off) {
    const { x0, x1, y0, y1, z } = BELT;
    let s = box(x0, y0, z - 3, x1 - x0, y1 - y0, 3, 0, 'pb-belt');
    for (let x = x0 + ((off % 5) + 5) % 5; x < x1; x += 5) s += seg([x, y0 + .4, z + .02], [x, y1 - .4, z + .02], '#4a4e58', .5, 'butt');
    return s;
  }

  /* ---------- the bagging station: a rack of flat film bags at the foot of the chute (as the taiyaki machine's) ---------- */
  const BAG = { x: CHUTE + 3, y: 78, z: 92, w: 13, h: 13 };
  const print = (w, h) => `<path d="M${f(w * .25)} ${f(h * .5)}Q${f(w * .25)} ${f(h * .26)} ${f(w / 2)} ${f(h * .26)}Q${f(w * .75)} ${f(h * .26)} ${f(w * .75)} ${f(h * .5)}Z" fill="#c97c2c"/><text x="${w / 2}" y="${f(h * .82)}" font-size="${f(w * .17)}" text-anchor="middle" fill="#8a3a1a" class="sign">こむぎ堂</text>`;
  function bagBack(open) {
    const { x, y, z, w, h } = BAG;
    let s = box(x - w / 2 - 2, y - 6, z - 2, w + 4, 11, 2, 0, 'ty-steel') + box(x - w / 2 - 2.2, y - 6, z, 2.2, 2.2, h + 3, 0, 'ty-steel') + box(x + w / 2, y - 6, z, 2.2, 2.2, h + 3, 0, 'ty-steel')
      + box(x - w / 2 - 2.2, y - 6, z + h + 1, w + 4.4, 2.2, 2, 0, 'ty-steel');
    for (let i = 4; i >= 1; i--) s += `<g transform="${FRONT(x - w / 2, y - i * 1.1, z + h)}"><rect width="${w}" height="${h}" fill="#e8eef4" opacity=".9" stroke="rgba(0,0,0,.3)" stroke-width=".4" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${FRONT(x - w / 2, y + .1, z + h)}"><rect width="${w}" height="${h}" fill="#dfe6ee"/></g>`;
    if (open > .05) s += `<path d="${toD([P(x - w / 2, y + .1, z + h), P(x + w / 2, y + .1, z + h), P(x + w / 2 - 1, y + .2 + 3 * open, z + h), P(x - w / 2 + 1, y + .2 + 3 * open, z + h)])}" fill="#8a96a6"/>`;
    return s;
  }
  function bagFront(open) {
    const { x, y, z, w, h } = BAG, yf = y + .2 + 3 * open;
    return `<g transform="${FRONT(x - w / 2, yf, z + h)}"><rect width="${w}" height="${h}" fill="#f4f8fc" fill-opacity=".86" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/>${print(w, h)}</g>`
      + [-1, 1].map(sx => seg([x + sx * (w / 2 - 2.4), yf + .3, z + h - 3], [x + sx * (w / 2 - 2.4), yf + 3.4 - open * 1.6, z + h - 3], '#8a93a4', .9) + disc(x + sx * (w / 2 - 2.4), yf + .3, z + h - 3, 1.2, '#2a2a30', 8)).join('');
  }
  // the bread in its bag (the slide, the take-out window): the bread inside, the film over it
  function bagged(x, y, z, o, k = 1) {
    const w = BAG.w * k, h = BAG.h * k;
    return bread(x, y - 2 * k, z + 1, { ...o, k: .9 * k }) + `<g transform="${FRONT(x - w / 2, y + .05, z + h)}"><rect width="${w}" height="${h}" fill="#f4f8fc" fill-opacity=".55" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M${f(w * .1)} 0v${f(h * .12)}M${f(w * .9)} 0v${f(h * .12)}" stroke="rgba(0,0,0,.18)" stroke-width=".5"/>${print(w, h)}</g>`;
  }

  /* ---------- moving parts, drawn again as they move ---------- */
  // the depositor. A beam behind the belt carries the four filling hoppers; they slide along it until the chosen one
  // docks on the dosing block, which meters its filling down a hose to the head: a small air cylinder on a cross rail
  // out over the belt, its rod driving the nozzle down into a bun or along the slit of a roll.
  const RACK = { y: 55, z: BELT.z + 36, gap: 7, r: 3 };
  const HEAD = { y: BY, rail: RACK.z - 7, cyl: RACK.z - 18 };
  const TIP = HEAD.cyl - 8.2;   // the nozzle's tip at rest (clear of the tallest loaf passing under it)
  // the hoppers; off: how far they have slid (hopper k docked at off = k); slots: each one's filling colour; levels: 0–1
  function rack(off, slots, levels = []) {
    let s = '';
    slots.forEach((c, k) => { const x = FILL + (k - off) * RACK.gap, y = RACK.y, z = RACK.z, r = RACK.r, lv = Math.max(0, Math.min(1, levels[k] ?? 1));
      // the hanger on the beam, the outlet stub and the cone, the body, the rim and lid with its knob
      s += box(x - 1, BEAM.y + BEAM.t, BEAM.z + .4, 2, y - BEAM.y - BEAM.t - r + .6, 2.4, 0, 'ty-steel pb-fine')
        + cyl(x, y, z - 3.4, z - 1.6, .55, .55, '#7a8494', 8) + cyl(x, y, z - 1.6, z + 2.2, .7, r, '#b9c2cd', 14)
        + cyl(x, y, z + 2.2, z + 12, r, r, '#e6ebf1', 14) + cyl(x, y, z + 11.4, z + 12.2, r + .35, r + .35, '#aab3bf', 14)
        + cyl(x, y, z + 12.2, z + 12.9, r - .2, r - .5, '#d4dae2', 14) + cyl(x, y, z + 12.9, z + 14, .55, .55, '#2a2e36', 8)
        // the sight glass on its front: the filling's colour up to its level, a scale, a glint
        + `<g transform="${FRONT(x - 1.15, y + r + .05, z + 10.6)}"><rect width="2.3" height="7.6" rx=".6" fill="#1d2430"/>`
        + `<rect x=".35" y="${f(.35 + 6.9 * (1 - lv))}" width="1.6" height="${f(6.9 * lv)}" rx=".3" fill="${c}"/>`
        + [2, 3.8, 5.6].map(t => `<path d="M1.75 ${t}h.55" stroke="#fff" stroke-width=".25" opacity=".7"/>`).join('')
        + `<path d="M.6 .9v5.6" stroke="#fff" stroke-width=".3" opacity=".35"/></g>`; });
    return s;
  }
  // (still) the frame at the back, drawn before the oven and the belt (it stands behind them): two posts, the beam
  // across their tops, the blade's rail on a bracket from the left post. Every member ends inside the one it meets.
  const BEAM = { y: RACK.y - RACK.r - 5, z: RACK.z + 9, t: 3.2, x1: FILL + 3.5 * RACK.gap + 2 };
  function frame() {
    const { y, z, t, x1 } = BEAM;
    // (the posts stand on the shelf under the belt, z 78; the beam sits on them)
    return box(1, y, 78, t, t, z - 78, 0, 'ty-steel') + box(x1 - t, y, 78, t, t, z - 78, 0, 'ty-steel')
      + box(1, y, z, x1 - 1, t, t, 0, 'ty-steel')
      + box(1, y + t, BLADE.z, t, BELT.y0 - y - t, 2.4, 0, 'ty-steel') + box(1, BELT.y0, BLADE.z, FILL + 11, 2.6, 2.4, 0, 'ty-steel');
  }
  // (still) the dosing block under the docked hopper (its lamp, its lever), the arm from it out to the cross rail the
  // head runs on (flush with the rail's top and bottom)
  function depositor() {
    const z = RACK.z;
    return box(FILL - 3, RACK.y - 3, z - 9.2, 6, 6, 5.4, 0, 'ty-steel')
      + `<g transform="${FRONT(FILL - 2.4, RACK.y + 3.05, z - 4.4)}"><rect width="4.8" height="3.6" rx=".5" fill="#1a1d22"/><circle class="pb-dock" cx="1.2" cy="1.8" r=".6" fill="#3a5a3a"/><text x="3.2" y="2.6" font-size="1.5" text-anchor="middle" fill="#9fdcff" class="sign">定量</text></g>`
      + seg([FILL + 3, RACK.y, z - 6], [FILL + 6, RACK.y + 1.5, z - 7.6], '#2a2e36', .9, 'butt') + disc(FILL + 6, RACK.y + 1.5, z - 7.6, .8, '#e8453a', 8)
      + box(FILL - 1.5, RACK.y + 3, HEAD.rail - 2.2, 3, HEAD.y - 1.6 - RACK.y - 3, 2.2, 0, 'ty-steel')
      + box(FILL - 11, HEAD.y - 1.6, HEAD.rail - 2.2, 22, 3.2, 2.2, 0, 'ty-steel');
  }
  // the head at x: ext, how far the rod has driven the nozzle down from rest; c, the filling (the hose and the nozzle's
  // band); flow: a stream from the tip down to z flow; drip: a drop on the tip; dust: 0–1 through a sprinkle of salt
  // or sugar (its colour) down to z dustZ
  function head({ x = FILL, ext = 0, c = '#f6d860', flow = null, drip = 0, dust = -1, dustC = '#fff', dustZ = BELT.z } = {}) {
    const y = HEAD.y, rb = HEAD.cyl - 1 - ext, tip = rb - 7.2;
    // the hose: from the dosing block's outlet, a loop forward and over to the cylinder's port; the filling seen in it
    const [ax, ay] = q(FILL, RACK.y + 3, RACK.z - 8), [bx, by] = q(x - 1.6, y, HEAD.cyl + 3.4), [cx, cy] = q((FILL + x) / 2, (RACK.y + y) / 2 + 3, RACK.z - 15);
    const hose = `M${ax} ${ay}Q${cx} ${cy} ${bx} ${by}`;
    let s = `<path d="${hose}" fill="none" stroke="#2a2e36" stroke-width="1.7" stroke-linecap="round"/><path d="${hose}" fill="none" stroke="${c}" stroke-width="1.05" stroke-linecap="round"/><path d="${hose}" fill="none" stroke="#fff" stroke-width=".3" opacity=".5" transform="translate(-.25 -.25)"/>`;
    // the carriage on the rail, the air cylinder (its two ports), the rod, the nozzle (its band) and its tip
    s += box(x - 2.4, y - 2.4, HEAD.rail - 4.4, 4.8, 4.8, 2.2, 0, 'ty-steel')
      + cyl(x, y, HEAD.cyl, HEAD.rail - 4.4, 1.9, 1.9, '#d9dee6', 14) + cyl(x, y, HEAD.cyl + 2.4, HEAD.cyl + 3.4, 1.95, 1.95, '#2a6ad9', 14)
      + disc(x + 1.2, y + 1.5, HEAD.cyl + 5.6, .45, '#2a2e36', 6) + disc(x + 1.2, y + 1.5, HEAD.cyl + 1.2, .45, '#2a2e36', 6)
      + cyl(x, y, rb, HEAD.cyl, .42, .42, '#f4f6f8', 8)
      + cyl(x, y, rb - 3.4, rb, 1.25, 1.25, '#aab3bf', 12) + cyl(x, y, rb - 2.3, rb - 1.3, 1.3, 1.3, c, 12)
      + cyl(x, y, tip, rb - 3.4, .2, 1.05, '#c9d0da', 10);
    if (flow != null && flow < tip) s += seg([x, y, tip], [x, y, flow], c, 1.1) + seg([x, y, tip], [x, y, flow], 'rgba(255,255,255,.35)', .35);
    if (drip > 0) { const [dx, dy] = q(x, y, tip - .5 * drip); s += `<circle cx="${dx}" cy="${dy}" r="${f(.5 * drip)}" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width=".25"/>`; }
    if (dust >= 0) for (let i = 0; i < 9; i++) { const ph = (dust * 2.2 + i / 9) % 1, u = ((i * 37) % 9 - 4) / 4, v = ((i * 53) % 7 - 3) / 3;
      const [px, py] = q(x + u * (1 + 2.6 * ph), y + v * (1 + 1.6 * ph), tip - (tip - dustZ) * ph); s += `<rect x="${f(+px - .3)}" y="${f(+py - .3)}" width=".6" height=".6" fill="${dustC}" opacity="${f(1 - ph * .5)}"/>`; }
    return s;
  }
  // the blade: a thin knife on a carriage that runs along the roll (e: 0 at the right end, 1 at the left), down by d
  // (its rail at the back over the belt, on the depositor's post; the arm drops from its carriage to the blade's back)
  const BLADE = { y: BELT.y0 + 1.3, z: BELT.z + 15 };
  const blade = (e, d, top) => { const x = FILL + 8 - 16 * e, z = top + 3 - 3.6 * d;
    return box(x - 1.8, BLADE.y - 1.8, BLADE.z - 2.4, 3.6, 3.6, 2.4, 0, 'ty-steel pb-fine') + box(x - .9, BLADE.y - .9, z + 2.6, 1.8, 1.8, BLADE.z - 2.4 - z - 2.6, 0, 'ty-steel pb-fine')
      + box(x - .9, BLADE.y + .9, z + 2.6, 1.8, BY - 4 - BLADE.y - .9, 1.4, 0, 'ty-steel pb-fine') + box(x - .3, BY - 4, z, .6, 8, 4, 0, 'pb-blade'); };
  // the pusher in the proofing cabinet: a paddle behind the front piece; e: 0 back, 1 pushed through to the oven mouth
  const pusher = e => { const x = Q[0] + 5 - 7 * e; return box(x, BELT.y0 + 1.5, BELT.z + .5, 1.2, BELT.y1 - BELT.y0 - 3, 5, 0, 'ty-steel') + seg([x + .6, BY, BELT.z + 5.5], [PROOF.x1 - 2, BY, BELT.z + 5.5], '#8a93a4', 1); };

  /* ---------- the upgrades ---------- */
  const cylY = (x, z, y0, y1, r, fill, n = 12) => { const ring = yy => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(x + r * Math.cos(t), yy, z + r * Math.sin(t)); });
    return `<path d="${toD(hull([...ring(y0), ...ring(y1)]))}" style="fill:${fill};${ST}"/>`; };
  // a sweeping paddle at x (e: 0 behind the belt, 1 at its front edge): an air cylinder on a post from the shelf, its
  // rod, the paddle. (The fryer's and the sandwich table's.)
  const SWEEP = { y0: BELT.y0 - 2.6, y1: BELT.y1 - 1.4, cy: 40 };
  const sweepY = e => SWEEP.y0 + (SWEEP.y1 - SWEEP.y0) * e;
  function sweeper(x, e) {
    const y = sweepY(e);
    return box(x - 1.2, SWEEP.cy + 2.4, 78, 2.4, 2.4, BELT.z - 78.2, 0, 'ty-steel')
      + box(x - 2.6, SWEEP.cy, BELT.z - .4, 5.2, 7, 5.2, 0, 'ty-steel') + disc(x, SWEEP.cy + 7.02, BELT.z + 2.2, .5, '#2a2e36', 6)
      + box(x - 1.1, SWEEP.cy + 6.5, BELT.z + 1.1, 2.2, y - SWEEP.cy - 6, 2.2, 0, 'ty-steel')
      + box(x - 6, y, BELT.z + .4, 12, 2.2, 4.4, 0, 'ty-steel');
  }
  // the fryer: the vat on two legs from the shelf, the oil in it, its plate and lamp; the lift column at its right end
  function fryer() {
    const { x0, x1, y0, y1, z, z0 } = FRY;
    return box(x0 + 1, y0 + .4, 78, 2.4, 2.4, z0 - 78 + .2, 0, 'ty-steel') + box(x1 - 3.4, y0 + .4, 78, 2.4, 2.4, z0 - 78 + .2, 0, 'ty-steel')
      + box(x0, y0, z0, x1 - x0, y1 - y0, z - z0, 0, 'ty-steel')
      + `<path d="${toD([P(x0 + .8, y0 + .8, z), P(x1 - .8, y0 + .8, z), P(x1 - .8, y1 - .8, z), P(x0 + .8, y1 - .8, z)])}" class="pb-oil"/>`
      + `<g transform="${FRONT(x0 + 2.5, y1 + .05, z - 3)}"><rect width="${x1 - x0 - 5}" height="5" rx=".8" fill="#1a1d22"/><circle class="pb-frylamp" cx="2.2" cy="2.5" r=".8" fill="#5a2a1a"/><text x="${(x1 - x0 - 5) / 2 + 1.2}" y="3.6" font-size="2.8" text-anchor="middle" fill="#ffd27a" class="sign">フライ 170℃</text></g>`
      + box(x1 + .2, y0 + 1.2, 78, 2.4, 2.4, BELT.z + 6 - 78, 0, 'ty-steel');
  }
  // the basket (lift: 0 down in the oil, 1 up level with the belt) with what is in it (inner, drawn by the caller), the
  // oil over what is still under it, the bubbles while it fries (boil: a phase, or −1), its arm to the column
  function basket(lift, inner = '', boil = -1) {
    const { x, x1, y0, y1, z, oil } = FRY, zb = oil - 2.6 + (BELT.z + .4 - (oil - 2.6)) * lift, by0 = y0 + 1, by1 = y1 - 1;
    let s = box(x - 8, by0, zb, 16, by1 - by0, 2.4, 0, 'pb-basket') + inner
      + `<g transform="${FRONT(x - 8, by1 + .02, zb + 2.4)}"><rect width="16" height="2.4" class="pb-mesh"/>${[2, 4, 6, 8, 10, 12, 14].map(t => `<path d="M${t} 0v2.4" class="pb-meshl"/>`).join('')}</g>`;
    s += `<path d="${toD([P(FRY.x0 + .8, y0 + .8, z), P(x1 - .8, y0 + .8, z), P(x1 - .8, y1 - .8, z), P(FRY.x0 + .8, y1 - .8, z)])}" class="pb-oil" opacity="${f(.78 * (1 - Math.min(1, lift * 1.6)))}"/>`;
    if (boil >= 0) for (let i = 0; i < 12; i++) { const ph = (boil + i * .37) % 1, [a, b] = q(x - 8.5 + ((i * 7.3) % 17), y0 + 1.2 + ((i * 2.9) % (y1 - y0 - 2.4)), z);
      s += `<circle cx="${a}" cy="${b}" r="${f(.25 + .45 * ph)}" fill="none" stroke="#fff4c8" stroke-width=".3" opacity="${f(1 - ph)}"/>`; }
    // (the hook into the basket's right end, the arm over the rim to the column)
    const za = zb + 3.2;
    return s + box(x + 5.4, by0 + .9, zb + 1.2, 2.2, 2.2, 4.2, 0, 'ty-steel') + box(x + 5.4, by0 + .9, za, x1 + 1.6 - x - 5.4, 2.2, 2.2, 0, 'ty-steel');
  }
  // the pie roller on the proofing cabinet's roof, running from right to left: its table, the back frame (the
  // gearbox) and the lower roller (still); the chilled stocker at the right end, the dough, the upper roller and the
  // front frame are drawn again as they move. At the left end a steep chute takes the piece down to a slot in the
  // oven's roof (drawn before the cabinet, which stands nearer).
  function sheeterBack() {
    const { x0, x1, y0, y1, z, rx, ya, yb } = LAM;
    return box(x0, y0, z - 2.2, x1 - x0, y1 - y0, 2.2, 0, 'ty-steel')
      + box(rx - 3, y0 - 3.6, z - 2.2, 6, 4, 6, 0, 'ty-steel') + box(rx - 2.6, y0 - .4, z - 2.2, 5.2, 2.4, 8.4, 0, 'ty-steel')
      + cylY(rx, z - 1.2, ya - 1.2, yb + 1.2, 1.3, '#c9d0da');
  }
  function chute(inner = '') {
    const { z, ya, yb, slot } = LAM, xt = LAM.x0 + .4, zt = z - .1, zb = BELT.z + OVEN.h + .2;
    const plate = (dz, y) => toD([P(xt, y, zt + dz), P(slot, y, zb + dz), P(slot, y, zb), P(xt, y, zt)]);
    return `<path d="${toD([P(slot - 2.2, ya, zb - .18), P(slot + 2.2, ya, zb - .18), P(slot + 2.2, yb, zb - .18), P(slot - 2.2, yb, zb - .18)])}" fill="#1a0e08"/>`
      + `<path d="${plate(1.8, ya)}" style="fill:#9aa3ae;${ST}"/>` + `<path d="${toD([P(xt, ya, zt), P(xt, yb, zt), P(slot, yb, zb), P(slot, ya, zb)])}" style="fill:#c9d0da;${ST}"/>`
      + inner + `<path d="${plate(1.8, yb)}" style="fill:#b9c2cd;${ST}"/>`;
  }
  // st: { parts: the dough on the table, [x0, x1, thickness] each (its butter layers on the front); cro: { x, k, o,
  // op } the rolled piece on the table; ph: the rollers' turn (null: stopped); gap: between the rollers }
  function sheeter(st = {}) {
    const { z, rx, ya, yb, y0, y1 } = LAM, [s0, s1] = LAM.st, gap = st.gap ?? 1, zu = z + gap + 1.3;
    const dough = (st.parts || []).map(([a, b, th]) => [a, Math.min(b, s0), th]).filter(([a, b]) => b > a).map(([a, b, th]) => box(a, ya, z, b - a, yb - ya, th, 0, 'pb-dough')
      + (th > .9 ? `<g transform="${FRONT(a, yb + .03, z + th)}">${[.3, .55, .8].map(t => `<path d="M.3 ${f(th * t)}H${f(b - a - .3)}" stroke="#e0b060" stroke-width=".3"/>`).join('')}</g>` : '')).join('');
    // the stocker (its door toward the rollers, its label on the front)
    let s = dough + box(s0, y0 + .6, z - 2.2, s1 - s0, y1 - y0 - 1.2, 9.6, 0, 'pb-fridge')
      + `<g transform="${FRONT(s0 + .6, y1 - .55, z + 6.4)}"><rect width="${s1 - s0 - 1.2}" height="3.2" rx=".5" fill="#1a2a3a"/><text x="${(s1 - s0 - 1.2) / 2}" y="2.3" font-size="1.8" text-anchor="middle" fill="#9fdcff" class="sign">折込生地</text></g>`;
    if (st.cro) s += `<g opacity="${f(st.cro.op ?? 1)}">${bread(st.cro.x, (ya + yb) / 2, z, { ...st.cro.o, bake: 0, k: st.cro.k })}</g>`;
    // the upper roller (lines on it turning), the front frame with its lamp
    s += cylY(rx, zu, ya - 1.2, yb + 1.2, 1.3, '#e6ebf1') + [0, 1, 2].map(i => { const a = (((st.ph || 0) + i / 3) % 1) * Math.PI; return seg([rx + 1.3 * Math.cos(a), ya - .9, zu + 1.3 * Math.sin(a)], [rx + 1.3 * Math.cos(a), yb + .9, zu + 1.3 * Math.sin(a)], '#9aa3ae', .3); }).join('');
    return s + box(rx - 2.6, yb + .8, z - 2.2, 5.2, 2.4, 8.4, 0, 'ty-steel') + `<g transform="${FRONT(rx - 1.6, yb + 3.25, z + 5.4)}"><rect width="3.2" height="2.6" rx=".4" fill="#1a1d22"/><circle cx="1.6" cy="1.3" r=".6" fill="${st.ph != null ? '#5aff7a' : '#3a5a3a'}"/></g>`;
  }
  // the sandwich table: its top (the left end on the side wall), a leg at the right end on the shelf, the knife's post
  // at the left end; the hatch over the bag rack (open 0..1) and the knife (down 0..1) move
  function table(open = 0) {
    const { x, x0, x1, y0, y1, z } = SAN;
    return box(x1 - 3.4, y0 + .6, 78, 2.4, 2.4, z - 2.4 - 78 + .2, 0, 'ty-steel') + box(x0, y0, z - 2.4, x1 - x0, y1 - y0, 2.4, 0, 'ty-steel')
      + `<path d="${toD([P(x - 5, y0 + .8, z + .02), P(x + 5, y0 + .8, z + .02), P(x + 5, y1 - .8, z + .02), P(x - 5, y1 - .8, z + .02)])}" fill="${open > .05 ? '#14161a' : '#b9c2cd'}" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`
      + box(x0 + .4, 79.4, z - 2.4, 2.4, 2.4, 18.4, 0, 'ty-steel');
  }
  const knife = d => { const { x, x0, y0, y1, z } = SAN, za = z + 12 - 6.8 * d, kb = za - 5.4;
    return `<path d="${toD([P(x, y0 + .4, za + .6), P(x, y1 - .4, za + .6), P(x, y1 - .4, kb), P(x, y0 + .4, kb)])}" class="pb-knife"/>`
      + box(x - 1.1, y0 + .2, za, 2.2, y1 - y0 - .4, 2.4, 0, 'ty-steel') + box(x0 + .8, 79.4, za + .1, x - x0 - .8, 2.2, 2.2, 0, 'ty-steel'); };

  /* ---------- the inside. lv: fitted parts { fryer, lam, sando } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right;
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the dough fridge's compressor, the oven's breaker box, cartons of bags, the filling chiller
    s += box(6, 30, 6, 30, 26, 28, 0, 'pb-fridge') + `<g transform="${FRONT(6, 56.05, 30)}"><rect width="30" height="6" rx="1" fill="#2a6ad9"/><text x="15" y="4.4" font-size="3.2" text-anchor="middle" fill="#fff" class="sign">冷蔵 4℃</text></g>`;
    s += box(44, 34, 6, 24, 18, 22, 0, 'ty-carton') + `<g transform="${FRONT(44, 52.05, 22)}"><text x="12" y="8" font-size="3" text-anchor="middle" fill="#8a3a1a" class="sign">パン袋</text></g>`;
    s += box(74, 36, 6, 14, 12, 30, 0, 'ty-steel') + `<g transform="${FRONT(74, 48.05, 32)}"><rect x="2" y="3" width="10" height="5" rx="1" fill="#1a1d22"/><rect x="3" y="4.2" width="3" height="2.6" fill="#ff8a3a"/><text x="7" y="13" font-size="2.4" text-anchor="middle" fill="#fff" class="sign">200V</text></g>`;
    s += box(2, 24, 74, 92, 59.5, 4, 0, 'ty-floor');
    // legs under the belt, the belt itself
    [BELT.x0 + 14, 40, 64, BELT.x1 - 4].forEach(x => { s += box(x - 1.2, BELT.y0 + .6, 78, 2.4, 2.4, BELT.z - 81, 0, 'ty-steel') + box(x - 1.2, BELT.y1 - 3, 78, 2.4, 2.4, BELT.z - 81, 0, 'ty-steel'); });
    // the dough fridge behind the proofing cabinet: a steel cabinet, its door window showing the tubs
    const FR = { x: PROOF.x0, y: 18, z: BELT.z - 4, w: PROOF.x1 - PROOF.x0, d: BELT.y0 - 20, h: 46 };
    s += box(FR.x, FR.y, FR.z, FR.w, FR.d, FR.h, 0, 'pb-fridge') + `<g transform="${FRONT(FR.x + 4, FR.y + FR.d + .05, FR.z + FR.h - 6)}"><rect width="${FR.w - 8}" height="14" rx="1.5" fill="#1a2a3a"/>${[0, 1, 2].map(i => `<rect x="${3 + i * 7}" y="5" width="5" height="7" rx="1" fill="#f2e2c0"/>`).join('')}<text x="${(FR.w - 8) / 2}" y="3.4" font-size="2.6" text-anchor="middle" fill="#9fdcff" class="sign">生地 冷蔵</text></g>`;
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the chute: from the belt's end down toward the bag rack (under the belt's end, so under the bread on the belt)
    g.insertAdjacentHTML('beforeend', `<path d="${toD([P(BELT.x0 - 1, BELT.y0 + 2, BELT.z - .5), P(BELT.x0 + 6, BELT.y0 + 2, BELT.z - .5), P(BAG.x + 6, BAG.y + 1, BAG.z + BAG.h + 8), P(BAG.x - 6, BAG.y + 1, BAG.z + BAG.h + 8)])}" style="fill:#aab3bf;${ST}"/>`);
    g.insertAdjacentHTML('beforeend', frame());
    const beltG = UTIL.g(g, belt(0), { class: 'pb-beltg' });
    // the sweeping paddles behind the belt (the fryer's, the sandwich table's)
    const sweepG = UTIL.g(g, (lv.fryer ? sweeper(FRY.x, 0) : '') + (lv.sando ? sweeper(FILL, 0) : ''), { class: 'pb-sweep' });
    // the oven's back wall and floor heaters (drawn before the bread inside it)
    let k = box(OVEN.x0, BELT.y0 - 4, BELT.z - 3, OVEN.x1 - OVEN.x0, 2, OVEN.h + 3, 0, 'pb-oven');
    g.insertAdjacentHTML('beforeend', k);
    const breadG = UTIL.g(g, '', { class: 'pb-breads' });
    // the oven tunnel over the belt: the roof, and a front of heat-proof glass in a steel frame (the glow strip above it,
    // the plate below), so the pieces are seen going in pale and browning on their way through
    const ow = OVEN.x1 - OVEN.x0, oy = BELT.y1 + 2, gz0 = BELT.z + 3, gz1 = BELT.z + OVEN.h - 9;
    k = box(OVEN.x0, BELT.y0 - 2, BELT.z + OVEN.h - 4, ow, BELT.y1 - BELT.y0 + 4, 4, 0, 'pb-oven')
      + box(OVEN.x0, BELT.y1, BELT.z - 3, ow, 2, 6, 0, 'pb-oven') + box(OVEN.x0, BELT.y1, gz1, ow, 2, 8, 0, 'pb-oven')
      + box(OVEN.x0, BELT.y1, gz0, 2, 2, gz1 - gz0, 0, 'pb-oven') + box(OVEN.x1 - 2, BELT.y1, gz0, 2, 2, gz1 - gz0, 0, 'pb-oven')
      + `<path class="pb-ovenglass" d="${toD([P(OVEN.x0 + 2, oy, gz0), P(OVEN.x1 - 2, oy, gz0), P(OVEN.x1 - 2, oy, gz1), P(OVEN.x0 + 2, oy, gz1)])}"/>`
      + `<path class="pb-ovenglint" d="${toD([P(OVEN.x0 + 5, oy, gz1 - 1), P(OVEN.x0 + 9, oy, gz1 - 1), P(OVEN.x0 + 6, oy, gz0 + 1), P(OVEN.x0 + 4, oy, gz0 + 1)])}"/>`
      + `<g transform="${FRONT(OVEN.x0 + 3, oy + .05, BELT.z + OVEN.h - 2)}"><rect width="${ow - 6}" height="6" rx="1" fill="#1a0e08"/><rect class="pb-glow" x="1" y="1.2" width="${ow - 8}" height="3.6" rx=".8" fill="#ff8a2a"/></g>`
      + `<g transform="${FRONT(OVEN.x0 + 3, oy + .05, BELT.z + 2.4)}"><text x="${(ow - 6) / 2}" y="3.2" font-size="3" text-anchor="middle" fill="#ffd27a" class="sign">200℃</text></g>`
      + cyl(OVEN.x0 + 7, BELT.y0, BELT.z + OVEN.h, BELT.z + OVEN.h + 8, 1.8, 1.8, '#8a93a4', 10);
    // the exit curtain (steel strips) at the oven's left mouth
    for (let i = 0; i < 4; i++) k += box(OVEN.x0 - .6, BELT.y0 + 1 + i * 4.6, BELT.z + 6, .6, 4, OVEN.h - 10, 0, 'pb-curtain');
    g.insertAdjacentHTML('beforeend', k);
    // the filling station: the depositor's beam and dosing block, the hoppers, the head on its rail, the blade (before the pie
    // roller and the cabinet, which stand nearer)
    g.insertAdjacentHTML('beforeend', depositor());
    const rackG = UTIL.g(g, '', { class: 'pb-rack' });
    const nozzleG = UTIL.g(g, head(), { class: 'pb-nozzle' });
    const bladeG = UTIL.g(g, blade(0, 0, BELT.z + 4), { class: 'pb-bladeg' });
    // the pie roller's chute down to the oven's roof, the fryer in front of the belt (upgrades)
    const chuteG = lv.lam ? UTIL.g(g, chute(), { class: 'pb-lamchute' }) : null;
    if (lv.fryer) g.insertAdjacentHTML('beforeend', fryer());
    const fryG = lv.fryer ? UTIL.g(g, basket(0), { class: 'pb-fry' }) : null;
    // the proofing cabinet: a glass box over the belt's right end, warm light, the pusher behind the queue
    const glass = `<g class="pb-proof">${box(PROOF.x0, BELT.y0 - 2, BELT.z - 3, PROOF.x1 - PROOF.x0, BELT.y1 - BELT.y0 + 4, 3, 0, 'ty-steel')}</g>`;
    g.insertAdjacentHTML('beforeend', glass);
    const pusherG = UTIL.g(g, pusher(0), { class: 'pb-pusher' });
    const proofG = UTIL.g(g, '', { class: 'pb-queue' });
    g.insertAdjacentHTML('beforeend', `<path class="pb-glass" d="${toD(hull([P(PROOF.x0, BELT.y0 - 2, BELT.z), P(PROOF.x1, BELT.y0 - 2, BELT.z), P(PROOF.x0, BELT.y1 + 2, BELT.z), P(PROOF.x1, BELT.y1 + 2, BELT.z),
      P(PROOF.x0, BELT.y0 - 2, BELT.z + PROOF.h), P(PROOF.x1, BELT.y0 - 2, BELT.z + PROOF.h), P(PROOF.x0, BELT.y1 + 2, BELT.z + PROOF.h), P(PROOF.x1, BELT.y1 + 2, BELT.z + PROOF.h)]))}"/>`
      + box(PROOF.x0, BELT.y0 - 2, BELT.z + PROOF.h, PROOF.x1 - PROOF.x0, BELT.y1 - BELT.y0 + 4, 3, 0, 'ty-steel')
      + `<g transform="${FRONT(PROOF.x0 + 2, BELT.y1 + 2.05, BELT.z + PROOF.h - 2)}"><rect width="${PROOF.x1 - PROOF.x0 - 4}" height="5" rx="1" fill="#2a1a10"/><text x="${(PROOF.x1 - PROOF.x0 - 4) / 2}" y="3.8" font-size="3" text-anchor="middle" fill="#ffd27a" class="sign">発酵 38℃</text></g>`);
    // the pie roller on the cabinet's roof (upgrade)
    if (lv.lam) g.insertAdjacentHTML('beforeend', sheeterBack());
    const lamG = lv.lam ? UTIL.g(g, sheeter({}), { class: 'pb-lam' }) : null;
    const bagG = UTIL.g(g, bagBack(0), { class: 'pb-bag' });
    const movers = UTIL.g(g, '', { class: 'pb-movers' });
    const bagFrontG = UTIL.g(g, bagFront(0), { class: 'pb-bagfront' });
    // the sandwich table (upgrade): over the bag rack, in front of the bag's slide
    const tableG = lv.sando ? UTIL.g(g, table(0) + knife(0), { class: 'pb-table' }) : null;
    if (RT) column();
    // the pins for the upgrades not fitted yet
    g.insertAdjacentHTML('beforeend', (lv.fryer ? '' : pin('fryer', FRY.x, FRY.y1, FRY.z - 6)) + (lv.lam ? '' : pin('lam', LAM.rx, LAM.y1, LAM.z + 3)) + (lv.sando ? '' : pin('sando', SAN.x + 6, SAN.y1, SAN.z - 2)));
    return { defs: defsEl, beltG, breadG, proofG, pusherG, rackG, nozzleG, bladeG, bagG, bagFrontG, movers, cm, sweepG, lamG, chuteG, fryG, tableG };
  }

  /* ---------- the shell and door: the awning, the menu, the sign, the window on the oven's mouth, the board ---------- */
  // the door's window (u 36–84, v 62–104) frames the belt from the filling station to the middle of the oven
  const WN = [36, 62, 48, 42];
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, oc = '#c97c2c', rd = '#8a3a1a', cr = '#fff1d6';
    let s = CORE.sideFace(W, D, H) + ISO.rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a big round loaf in outline, パン under it
    const sideBun = (cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-12 4Q-12-8 0-8Q12-8 12 4Q12 6 10 6H-10Q-12 6-12 4Z" fill="rgba(201,124,44,.08)" stroke="${oc}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M-6-3q6-3 12 0" fill="none" stroke="${oc}" stroke-width=".7" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/>${sideBun(42, 70, 2.6)}
      ${['焼', 'き', 'た', 'て'].map((ch, i) => `<text class="sign" x="42" y="${120 + i * 20}" font-size="17" text-anchor="middle" fill="rgba(201,124,44,.12)" stroke="rgba(201,124,44,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(201,124,44,.1)" stroke="${oc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${oc}">ひとつから ¥200〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/><g class="iso-only">${sideBun(42, 96, 2.4)}
      <text class="label" x="42" y="150" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(201,124,44,.6)">BAKERY · FRESH FROM THE OVEN</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, fs = Math.min(2.6, 15.4 / (p.jp || p.name).length);
      return R3(x, y, 20.8, 30, 1, `<rect class="pb-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${oc}" opacity="0"/><g transform="translate(${x + 3.2} ${y + .6}) scale(.6)">${icon(p)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext"${(p.jp || p.name).length * fs > 14.6 ? ' textLength="14.6" lengthAdjust="spacingAndGlyphs"' : ''}>${p.jp || p.name}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label pb-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit pb-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // left of the window the sign, right of it the lamps (焼成中, 発酵中); under it the board
    const sign = `<rect x="7" y="62" width="25" height="42" rx="2" class="pb-board"/>` + ['こ', 'む', 'ぎ'].map((c, i) => `<text class="pb-boardt" x="19.5" y="${74 + i * 11}" font-size="9" text-anchor="middle">${c}</text>`).join('');
    const lamps = R3(88, 64, 26, 6.4, .8, `<text class="lit-text pb-bakelamp" style="--lc:#ff8a3a" x="101" y="68.6" font-size="2.9" text-anchor="middle">焼成中</text>`, { r: 1.5, capCls: 'readycap' })
      + R3(88, 72.6, 26, 6.4, .8, `<text class="lit-text pb-prooflamp" style="--lc:#ffd23f" x="101" y="77.2" font-size="2.9" text-anchor="middle">発酵中</text>`, { r: 1.5, capCls: 'readycap' });
    const board = `<rect x="6" y="110" width="86" height="58" rx="2" class="pb-board"/><text class="pb-boardt" x="49" y="118" font-size="4.2" text-anchor="middle">毎日 この窓で焼いています</text>`
      + `<g transform="translate(49 144) scale(1.85)"><path d="M-12 4Q-12-8 0-8Q12-8 12 4Q12 6 10 6H-10Q-12 6-12 4Z" fill="${oc}" stroke="#e8a050" stroke-width=".4"/><path d="M-6-3q6-3 12 0" fill="none" stroke="#f6c880" stroke-width=".6" stroke-linecap="round"/></g>`
      + `<text class="pb-boardt" x="49" y="163.4" font-size="2.6" text-anchor="middle" opacity=".8">ぜんぶ 焼きたて · 中身はメニューで</text>`
      // a round sticker on the board for each upgrade fitted
      + [[lv.fryer, 16, 126, -8, '#d8702a', '揚げたて', 'カレーパン'], [lv.lam, 82, 126, 7, '#b8862a', 'サクサク', 'クロワッサン'], [lv.sando, 82, 151, -5, '#5a9a4a', 'できたて', 'サンド']]
        .filter(t => t[0]).map(([, x, y, r, c, a, b]) => `<g class="nohit" transform="translate(${x} ${y}) rotate(${r})"><circle r="7.6" fill="${c}" stroke="#fff4dc" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-.4" font-size="2.6" text-anchor="middle" fill="#fff" class="sign">${a}</text><text y="2.8" font-size="${b.length > 4 ? 1.9 : 2.4}" text-anchor="middle" fill="#fff4dc" class="sign">${b}</text></g>`).join('');
    const awning = Array.from({ length: 8 }, (_, i) => `<path d="M${4 + i * 14} 3h14v9q-3.5 2.4-7 0t-7 0z" fill="${i % 2 ? cr : rd}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd"/>
      ${awning}<rect x="29" y="4" width="62" height="7.6" rx="2" fill="${rd}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><text class="pb-awnt" x="60" y="9.6" font-size="5.2" text-anchor="middle">こむぎ堂 ベーカリー</text>
      <rect x="5" y="22" width="88" height="34" rx="2" class="pb-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#ffd27a">焼きたて · ひとつずつ</text>
      ${sign}${lamps}${board}${SK(WN[0], WN[1], WN[2], WN[3], 3, { hole: true })}
      <rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><path class="nohit" d="M42 62L50 62L44 104H36Z" fill="#fff" opacity=".05"/><path class="nohit" d="M62 62L65 62L59 104H56Z" fill="#fff" opacity=".04"/>
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="pb-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 82, 20, 14, .8, `<text class="label" x="105" y="86.4" font-size="2.2" text-anchor="middle">生地</text><rect x="98" y="88.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="pb-gauge" x="98.4" y="88.8" width="13.2" height="2.6" rx=".8" fill="#f2e2c0"/>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 102, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 102h4"/>' })}<text class="label" x="105" y="109" font-size="2.4" text-anchor="middle">返却</text>
      ${CORE.lock(100, 122)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="pb-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text pb-ready" style="--lc:${oc}" x="60" y="190.4" font-size="3.1" text-anchor="middle">焼きあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${rd}" opacity=".92"/><text class="pb-awnt nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="pb-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'pb-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'pb-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.pb-tile')], slotGlow: door.querySelector('.pb-slotglow'),
      lcd: door.querySelector('.pb-lcd'), gauge: door.querySelector('.pb-gauge'), bakeLamp: door.querySelector('.pb-bakelamp'), proofLamp: door.querySelector('.pb-prooflamp'),
      ready: door.querySelector('.pb-ready'), flap: door.querySelector('.pb-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><rect class="xline" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, bread, bagged, bagBack, bagFront, icon, rack, head, blade, pusher, belt, sweeper, basket, sheeter, chute, table, knife, RACK, HEAD, TIP, SIZE, BAG, SWEEP, sweepY, pin };
})();
