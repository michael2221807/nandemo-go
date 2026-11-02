/* The 3D hull of a round part's points (full 3D, tools/turn3d and platform/turn.js, 2026-10-31).
   The game draws a cylinder, a disc, a ball as the outline of its points on the screen: glyphs.js GLY.hull, the 2D hull of
   their projections. The hull of the points in 3D, projected, is that same outline at every angle (a projection keeps
   convexity), so the shell draws this one solid and the page's outline comes out at any angle: its triangles filled in
   the part's colour, its edges stroked where one of their two faces looks at the camera and the other away (the outline).
   HULL3D.of(pts) → { p: points, tri: [i, j, k …] wound outward, edges: [i, j, face a, face b …], n: face normals }, or
   { p, flat: true, ring: [i …] } for points in one plane (a disc: drawn as a polygon from both sides), or null. */
const HULL3D = (() => {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]), unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  function of(src) {
    // (the same point twice, a ring's first and last: once)
    const seen = new Set(), p = [];
    for (const q of src) { if (!q) return null; const k = q.map(v => Math.round(v * 1e4)).join(','); if (!seen.has(k)) { seen.add(k); p.push([+q[0], +q[1], +q[2]]); } }
    if (p.length < 3) return null;
    let size = 0; for (const q of p) size = Math.max(size, len(sub(q, p[0]))); const eps = Math.max(1e-6, size * 1e-6);
    // a first tetrahedron: the point farthest from the first, from the line through both, from the plane through the three
    let i1 = 0, i2 = -1, i3 = -1, best = 0;
    p.forEach((q, i) => { const d = len(sub(q, p[0])); if (d > best) { best = d; i1 = i; } });
    best = 0; p.forEach((q, i) => { const d = len(cross(sub(p[i1], p[0]), sub(q, p[0]))); if (d > best) { best = d; i2 = i; } });
    if (i2 < 0 || best < eps * size) return null;
    const n0 = unit(cross(sub(p[i1], p[0]), sub(p[i2], p[0])));
    best = 0; p.forEach((q, i) => { const d = Math.abs(dot(n0, sub(q, p[0]))); if (d > best) { best = d; i3 = i; } });
    if (i3 < 0 || best < Math.max(1e-3, size * 1e-4)) return flat(p, n0);
    // (faces as point triples wound outward: seen from outside, counter-clockwise; plane: normal, offset)
    const inner = [0, i1, i2, i3].reduce((s, i) => [s[0] + p[i][0] / 4, s[1] + p[i][1] / 4, s[2] + p[i][2] / 4], [0, 0, 0]);
    let faces = [];
    const face = (a, b, c) => { let n = unit(cross(sub(p[b], p[a]), sub(p[c], p[a]))); if (dot(n, sub(inner, p[a])) > 0) { [b, c] = [c, b]; n = n.map(v => -v); } return { v: [a, b, c], n, d: dot(n, p[a]) }; };
    faces.push(face(0, i1, i2), face(0, i1, i3), face(0, i2, i3), face(i1, i2, i3));
    const done = new Set([0, i1, i2, i3]);
    for (let i = 0; i < p.length; i++) {
      if (done.has(i)) continue;
      const q = p[i], vis = faces.filter(F => dot(F.n, q) - F.d > eps);
      if (!vis.length) continue;
      // (the horizon: the seen faces' edges whose other face is not seen, kept in their winding)
      const cnt = new Map(); for (const F of vis) for (let k = 0; k < 3; k++) { const a = F.v[k], b = F.v[(k + 1) % 3]; cnt.set(a + ',' + b, [a, b]); }
      const horizon = [...cnt.values()].filter(([a, b]) => !cnt.has(b + ',' + a));
      faces = faces.filter(F => !vis.includes(F));
      for (const [a, b] of horizon) { const n = unit(cross(sub(p[b], p[a]), sub(q, p[a]))); faces.push({ v: [a, b, i], n, d: dot(n, p[a]) }); }
    }
    // the points the hull keeps, renumbered; each edge with its two faces
    const keep = new Map(), P = [];
    for (const F of faces) for (const v of F.v) if (!keep.has(v)) { keep.set(v, P.length); P.push(p[v].map(x => Math.round(x * 1e4) / 1e4)); }
    const tri = faces.flatMap(F => F.v.map(v => keep.get(v))), n = faces.map(F => F.n.map(x => Math.round(x * 1e4) / 1e4));
    const half = new Map(), edges = [];
    faces.forEach((F, fi) => { for (let k = 0; k < 3; k++) { const a = keep.get(F.v[k]), b = keep.get(F.v[(k + 1) % 3]); half.set(a + ',' + b, fi); } });
    for (const [k, fi] of half) { const [a, b] = k.split(',').map(Number); if (a < b && half.has(b + ',' + a)) edges.push(a, b, fi, half.get(b + ',' + a)); }
    return { p: P, tri, edges, n };
  }
  // points in one plane: their 2D hull in it, in order round
  function flat(p, nrm) {
    const t1 = unit(Math.abs(nrm[0]) < .9 ? cross(nrm, [1, 0, 0]) : cross(nrm, [0, 1, 0])), t2 = cross(nrm, t1);
    const uv = p.map((q, i) => [dot(q, t1), dot(q, t2), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of uv) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = uv.length - 1; i >= 0; i--) { const q = uv[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    const ring = lo.slice(0, -1).concat(up.slice(0, -1)).map(q => q[2]);
    if (ring.length < 3) return null;
    return { p: ring.map(i => p[i].map(x => Math.round(x * 1e4) / 1e4)), flat: true, ring: ring.map((_, k) => k) };
  }
  // an outline drawn through iso.js P's points (M, L, Q, C, Z; their places recorded by their screen points, __REC.pts):
  // its 3D polylines, a curve's control points in 3D too (a projection keeps a Bézier curve one, so the curve comes out
  // as the page draws it at every angle), each curve in steps. null: a point not recorded, or one the screen shares
  // with another 3D point (conf), or a command drawn on the screen alone (H, V, A, relative)
  function path(d, pts, conf) {
    const tk = (d || '').match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g); if (!tk || !pts) return null;
    const out = []; let cur = null, i = 0, cmd = null;
    const pt = () => { if (i + 1 >= tk.length) return null; const x = +tk[i++], y = +tk[i++]; if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      const k = x + ' ' + y; return conf && conf.has(k) ? null : pts.get(k) || null; };
    const last = () => cur.pts[cur.pts.length - 1], mix = (fn, n) => { for (let s = 1; s <= n; s++) cur.pts.push([0, 1, 2].map(j => fn(s / n, j))); };
    while (i < tk.length) {
      if (/[A-Za-z]/.test(tk[i])) { cmd = tk[i++]; if (cmd === 'Z') { if (!cur) return null; cur.closed = true; cur = null; continue; } }
      if (cmd === 'M') { const p = pt(); if (!p) return null; out.push(cur = { pts: [p], closed: false }); cmd = 'L'; }
      else if (cmd === 'L') { const p = pt(); if (!p || !cur) return null; cur.pts.push(p); }
      else if (cmd === 'Q') { const c = pt(), p = pt(); if (!c || !p || !cur) return null; const a = last(); mix((t, j) => (1 - t) * (1 - t) * a[j] + 2 * (1 - t) * t * c[j] + t * t * p[j], 8); }
      else if (cmd === 'C') { const c1 = pt(), c2 = pt(), p = pt(); if (!c1 || !c2 || !p || !cur) return null; const a = last();
        mix((t, j) => (1 - t) ** 3 * a[j] + 3 * (1 - t) ** 2 * t * c1[j] + 3 * (1 - t) * t * t * c2[j] + t ** 3 * p[j], 10); }
      else return null;
    }
    return out.length ? out : null;
  }
  return { of, path };
})();
if (typeof module !== 'undefined') module.exports = HULL3D;
