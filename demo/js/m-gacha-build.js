/* Fig 15 · 扭蛋塔「ころころ」— geometry. Made up, built like a plant (one station per step, no robot arm; the door hides
   the works and frames one moment; 2026-10-18).
   Four capsule globes stand in a row up top, one series each. Under each globe a star wheel with four pockets: a small
   gearmotor turns it once round and one capsule, whichever lies in the pocket, drops out of the spout — the turn of a
   gacha handle, done by a motor (the big knob on the door turns with it). The capsule drops into a gutter that runs
   down to the left, falls into a funnel and rolls down a switchback run on a pegboard: five ramps, there and back,
   a bell at the bottom, then the chute to the take-out window.
   The flaw: when a globe runs low the last capsules lean on each other over the wheel (a bridge) and nothing drops; that
   series stops until someone knocks on it or it is restocked (the agitator, an upgrade, stirs them apart).
   The door frames the switchback run only. Where a world point shows on the door (the default view):
   u = x − y + 84, v = 156 + y − z. */
const GC = (() => {
  const W = 120, D = 84, H = 240;
  // the globes (centre, radius), each on a base with its star wheel; the spout in front of the base
  const GLOBES = [0, 1, 2, 3].map(k => ({ x: 22 + k * 21, y: 44, z: 198, r: 9.6 }));
  const BASE = { r: 6, z0: 183, z1: 188.6 };
  // the gutter under the spouts, sloping down to the left; at its end the drop to the run's funnel
  const GUTTER = { y: 52, x0: 92, x1: 21, z0: 177, z1: 169 };
  // the switchback run on its pegboard, in the plane y: ramps [x from, x to, z high end, z low end]; the steep set with the
  // upgrade (same high ends, twice the fall); the funnel on top, the bell and the exit at the bottom
  const RUN = { y: 63, w: 3.4, board: 58.6, funnel: [21, 63, 155], exit: [21, 63, 99], bell: [25.6, 63, 103],
    ramps: [[21, 31, 145, 143.5], [31, 11, 136, 133], [11, 31, 126, 123], [31, 11, 116, 113], [11, 21, 106, 104.5]],
    steep: [[21, 31, 145, 142], [31, 11, 136, 130], [11, 31, 126, 120], [31, 11, 116, 110], [11, 21, 106, 103]] };
  const CAPR = { n: 2.8, big: 4 };                                // a capsule's radius, a jumbo one's
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): the capsule's colour, the figure in it
  const MENU = [
    { name: 'ねこ', price: 200, g: 'neko', cap: '#ff8fb8', fig: 'neko', tier: 1 }, { name: 'おすし', price: 200, g: 'sushi', cap: '#e8453a', fig: 'sushi', tier: 1 },
    { name: 'じはんき', price: 200, g: 'jihanki', cap: '#3a8aff', fig: 'jihanki', tier: 1 }, { name: 'どうぶつ', price: 200, g: 'dobutsu', cap: '#5ac83a', fig: 'bear', tier: 1 },
  ];
  return { W, D, H, GLOBES, BASE, GUTTER, RUN, CAPR, WINDOW, MENU, SLOTW: [105, D, 196] };
})();

const GCB = (() => {
  const { FRONT, TOP: TOPP, box, rect, path, P, f } = ISO;
  const { W, D, H, GLOBES, BASE, GUTTER, RUN, CAPR } = GC;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ring = (x, y, z, r, n = 14) => ringZ(z, r, n, 0, Math.PI * 2, x, y);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ring(x, y, z0, r0, n), ...ring(x, y, z1, r1, n)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ring(x, y, z, r, n))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  // the screen radius of a sphere of radius 1 (the projection turns with the camera)
  let SR = 1;
  function setView() { const pts = [...ringZ(0, 1, 24, 0, Math.PI * 2, 0, 0)]; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; pts.push(P(Math.cos(t), 0, Math.sin(t)), P(0, Math.cos(t), Math.sin(t))); }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); SR = (Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys)) / 4; }

  /* ---------- the figures in the capsules (flat, about ±5; v: which of six colours; gold: the secret one) ---------- */
  const PAL = {
    neko: ['#fff4e8', '#3a3030', '#f0a040', '#b0b0b8', '#f6d8b0', '#8a5a3a'], sushi: ['#ff7a5a', '#e8453a', '#ffd23f', '#f6c8a8', '#ff9a2a', '#c8102a'],
    jihanki: ['#3a8aff', '#e8453a', '#3fd47a', '#ffd23f', '#ff8fb8', '#f4f2ec'], bear: ['#a8743a', '#f4f2ec', '#3a3030', '#ffb38a', '#c8c8c8', '#8ad0ff'],
    dino: ['#5ac83a', '#ff9a2a', '#3a8aff', '#a07ae0', '#e8453a', '#ffd23f'], ghost: ['#f4f2ec', '#b8a8ff', '#a8f0e0', '#ffd8e8', '#d8d8d8', '#fff4a8'],
    food: ['#ffd23f', '#ff8fb8', '#8a5a3a', '#f4f2ec', '#5ac83a', '#ff9a2a'], kingyo: ['#ff6a3a', '#e8453a', '#ffd23f', '#f4f2ec', '#3a3030', '#ff9ab8'],
    daruma: ['#c8283a', '#ffd23f', '#3a3030', '#f4f2ec', '#3a8aff', '#5ac83a'], penguin: ['#2a3a6a', '#3a3030', '#8ad0ff', '#ff8fb8', '#5a5a64', '#a07ae0'],
    rocket: ['#e8453a', '#3a8aff', '#f4f2ec', '#ffd23f', '#5ac83a', '#a07ae0'], gem: ['#2ad8c8', '#e8453a', '#3a8aff', '#a07ae0', '#3fd47a', '#ff8fb8'],
    maneki: ['#ffd23f', '#ffd23f', '#ffd23f', '#ffd23f', '#ffd23f', '#ffd23f'],
  };
  const INK = '#2a1a1a';
  function figure(fig, v = 0, gold = false) {
    const c = gold ? '#ffd23f' : (PAL[fig] || PAL.neko)[v % 6], k = 'stroke="' + INK + '" stroke-width=".55" stroke-linejoin="round"';
    const eyes = (y = 0, dx = 1.4) => `<circle cx="${-dx}" cy="${y}" r=".5" fill="${INK}"/><circle cx="${dx}" cy="${y}" r=".5" fill="${INK}"/>`;
    switch (fig) {
      case 'neko': case 'maneki': return `<path d="M-3.6 3.6Q-4.2-1.4-3.4-3.6L-1.8-1.8Q0-2.4 1.8-1.8L3.4-3.6Q4.2-1.4 3.6 3.6Z" fill="${c}" ${k}/>${eyes(.4)}<path d="M-.5 1.4L0 1.9L.5 1.4" stroke="${INK}" stroke-width=".4" fill="none"/>`
        + (fig === 'maneki' ? `<path d="M3 1.6Q5.2.6 4.6-1.8Q3.6-2.2 3.2-.6" fill="${c}" ${k}/><circle cy="3" r=".9" fill="#e8453a"/>` : '');
      case 'sushi': return `<rect x="-3.6" y="0" width="7.2" height="3.4" rx="1.2" fill="#fbfaf4" ${k}/><path d="M-4-.2Q0-3.2 4-.2Q4 1 3 1H-3Q-4 1-4-.2Z" fill="${c}" ${k}/><path d="M-1.6-1.4l.8 1.6M.8-1.8l.8 1.8" stroke="#fff" stroke-width=".4" opacity=".7"/>`;
      case 'jihanki': return `<rect x="-2.8" y="-3.8" width="5.6" height="7.6" rx=".6" fill="${c}" ${k}/><rect x="-2" y="-3" width="4" height="3" fill="#dff2ff"/><circle cx="-1.2" cy="-1.6" r=".5" fill="#e8453a"/><circle cx="0" cy="-1.6" r=".5" fill="#3fd47a"/><circle cx="1.2" cy="-1.6" r=".5" fill="#ffd23f"/><rect x="-1.6" y="1.8" width="3.2" height="1.2" fill="${INK}"/>`;
      case 'bear': return `<circle cx="-2.6" cy="-2.4" r="1.3" fill="${c}" ${k}/><circle cx="2.6" cy="-2.4" r="1.3" fill="${c}" ${k}/><circle r="3.4" cy=".4" fill="${c}" ${k}/>${eyes(0)}<ellipse cy="1.8" rx="1.3" ry=".9" fill="#fff4e8"/><circle cy="1.5" r=".4" fill="${INK}"/>`;
      case 'dino': return `<path d="M-4 3.6V1Q-4-1-2-1.4L-.6-3.4Q1.4-4.4 3.2-3.2Q4.4-2.2 3.6-1.2Q2.6-.6 1.4-1L1.4 1.6Q3.6 2.2 4.6 3.6Z" fill="${c}" ${k}/><circle cx="1.8" cy="-2.6" r=".45" fill="${INK}"/><path d="M-3 -.4l.6-1.2.6 1M-1.6-1.2l.6-1.2.5 1" fill="${c}" ${k}/>`;
      case 'ghost': return `<path d="M-3.4 3.6V-.4Q-3.4-3.8 0-3.8Q3.4-3.8 3.4-.4V3.6L2.2 2.6 1.1 3.6 0 2.6-1.1 3.6-2.2 2.6Z" fill="${c}" ${k}/>${eyes(-.6, 1.2)}<ellipse cy="1" rx=".6" ry=".8" fill="${INK}"/>`;
      case 'food': return `<path d="M-3.4 3.4L-2.4-1.6H2.4L3.4 3.4Z" fill="#ffe6a0" ${k}/><path d="M-2.4-1.6Q-2.4-3.4 0-3.4T2.4-1.6Z" fill="${c === '#ffd23f' ? '#8a4a1a' : c}" ${k}/><circle cy="-3.8" r=".8" fill="#e8453a"/>`;
      case 'kingyo': return `<path d="M-4 0Q-3-3 .4-2.4Q2.2-2 2.6 0Q2.2 2 .4 2.4Q-3 3-4 0Z" fill="${c}" ${k}/><path d="M2.4 0L4.8-2.6Q4 0 4.8 2.6Z" fill="${c}" ${k}/><circle cx="-2.4" cy="-.6" r=".5" fill="${INK}"/>`;
      case 'daruma': return `<path d="M0-3.8Q3.6-3.8 3.6 .4Q3.6 3.8 0 3.8Q-3.6 3.8-3.6.4Q-3.6-3.8 0-3.8Z" fill="${c}" ${k}/><ellipse cy="-.6" rx="2.2" ry="1.8" fill="#fff4e8" ${k}/>${eyes(-.8, .9)}<path d="M-1.4 2.2h2.8" stroke="#ffd23f" stroke-width=".7"/>`;
      case 'penguin': return `<ellipse rx="3.2" ry="3.8" fill="${c}" ${k}/><ellipse cy=".8" rx="2" ry="2.6" fill="#fff"/>${eyes(-1.6, 1)}<path d="M-.6-.8L0-.2L.6-.8Z" fill="#ffb02a"/>`;
      case 'rocket': return `<path d="M0-4.2Q2.2-2.4 2.2 1.6H-2.2Q-2.2-2.4 0-4.2Z" fill="${c}" ${k}/><circle cy="-1" r="1" fill="#dff2ff" ${k}/><path d="M-2.2.6L-3.6 3H-2.2ZM2.2.6L3.6 3H2.2Z" fill="#ffd23f" ${k}/><path d="M-1 1.6L0 4L1 1.6Z" fill="#ff9a2a"/>`;
      case 'gem': return `<path d="M-2.4-2.6H2.4L3.8-.6L0 3.8L-3.8-.6Z" fill="${c}" ${k}/><path d="M-3.8-.6H3.8M-1.2-2.6L0 3.8L1.2-2.6" stroke="#fff" stroke-width=".4" opacity=".6" fill="none"/>`;
    }
    return '';
  }
  // a capsule on screen at (sx, sy), radius r (screen units): the coloured half below, the clear half above, the figure in
  // it; turned by rot (rolling). o = { cap, fig, v, s: secret }
  function capsule(sx, sy, r, o, rot = 0) {
    const c = o.s ? '#ffd23f' : o.cap;
    return `<g transform="translate(${f(sx)} ${f(sy)}) rotate(${f(rot)})"><circle r="${f(r)}" fill="rgba(236,246,255,.6)" stroke="rgba(0,0,0,.5)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`
      + `<path d="M${f(-r)} 0A${f(r)} ${f(r)} 0 0 0 ${f(r)} 0Z" fill="${c}"/>`
      + `<g transform="scale(${f(r / 5.6)})">${figure(o.fig, o.v || 0, o.s)}</g>`
      + `<path d="M${f(-r)} 0H${f(r)}" stroke="rgba(0,0,0,.35)" stroke-width=".4" vector-effect="non-scaling-stroke"/><ellipse cx="${f(-r * .35)}" cy="${f(-r * .5)}" rx="${f(r * .28)}" ry="${f(r * .16)}" fill="#fff" opacity=".7"/>`
      + (o.s ? `<path d="M${f(r * .55)} ${f(-r * .9)}l.5 1 1 .2-.8.6.2 1-.9-.5-.9.5.2-1-.8-.6 1-.2z" fill="#fff6b0"/>` : '') + `</g>`;
  }
  // a capsule at a world point (its centre)
  const capAt = (x, y, z, o, big, rot) => { const [a, b] = q(x, y, z); return capsule(+a, +b, (big ? CAPR.big : CAPR.n) * SR, o, rot); };
  // flat (24 × 24) for the menu tiles and the shop: a capsule with the figure in it
  function icon(cap, fig, big) {
    const r = big ? 10.4 : 9;
    // (app build, goods polish: the clear half's lip catching the light, a sheen on the coloured half, rosy cheeks on
    // the cute figures; the capsules in the globes are drawn as before)
    const dots = (pts, rr) => pts.map(([x, y]) => `M${x - rr} ${y}a${rr} ${rr} 0 1 0 ${2 * rr} 0a${rr} ${rr} 0 1 0 ${-2 * rr} 0z`).join('');
    const cheek = { neko: [2.2, 1.3], maneki: [2.2, 1.3], bear: [2.1, 1], ghost: [2, .4], penguin: [1.7, -.6], daruma: [1.6, .3] }[fig];
    return `<circle cx="12" cy="12.4" r="${r}" fill="#eef7ff" stroke="#141018" stroke-width="1.1"/><path d="M${12 - r} 12.4A${r} ${r} 0 0 0 ${12 + r} 12.4Z" fill="${cap}" stroke="#141018" stroke-width="1.1"/>`
      + `<path d="M${12 - r + 1.4} 11.5H${12 + r - 1.4}" stroke="#fff" stroke-width=".8" stroke-linecap="round" opacity=".85"/><ellipse cx="${12 + r * .45}" cy="${12.4 + r * .6}" rx="${r * .18}" ry="${r * .08}" transform="rotate(-30 ${12 + r * .45} ${12.4 + r * .6})" fill="#fff" opacity=".4"/>`
      + `<g transform="translate(12 10.6) scale(${big ? 1.25 : 1.05})">${figure(fig, 0)}${cheek ? `<path d="${dots([[-cheek[0], cheek[1]], [cheek[0], cheek[1]]], .5)}" fill="#ff7aa8" opacity=".55"/>` : ''}</g><ellipse cx="8" cy="7" rx="2.2" ry="1.2" fill="#fff" opacity=".8"/>`
      + (big ? `<text x="12" y="22.4" font-size="3.2" text-anchor="middle" fill="#fff" font-weight="700">BIG</text>` : '');
  }
  // the crate: a capsule (in its colour)
  function defs() {
    return `<g id="g-gc-cap"><circle cy="-3" r="3" fill="#eef7ff" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-3-3A3 3 0 0 0 3-3Z" style="fill:var(--c)"/><ellipse cx="-1" cy="-4.6" rx=".9" ry=".5" fill="#fff" opacity=".8"/></g>`;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- a globe: the glass, the capsules in it, its lid; its base with the star wheel and the spout ---------- */
  // the capsules piled in a globe (up to 12, back to front); list: [{ cap, fig, v, s, big }]
  // (each capsule stays inside the glass: its distance from the centre plus its radius under the globe's 9.6)
  const PILE = (() => { const out = []; [[5, 0, 4.2, -5.4], [4, 1, 3.6, -.8], [3, 2, 2.4, 3.6]].forEach(([n, layer, rr, z]) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + layer * .6; out.push([Math.cos(a) * rr, Math.sin(a) * rr, z]); } }); return out; })();
  function globe(k, list, o = {}) {
    const G = GLOBES[k], { x, y, z, r } = G, R = r * SR, [cx, cy] = q(x, y, z), big = o.jumbo;
    let s = '';
    // the base and its wheel (the wheel turns: o.wheel radians)
    s += cyl(x, y, BASE.z0, BASE.z1, BASE.r, BASE.r + .6, big ? '#ff9a2a' : '#e8453a', 16) + disc(x, y, BASE.z1, BASE.r + .6, big ? '#ffb85a' : '#ff6a5a', 16);
    s += wheel(k, o.wheel || 0) + box(x - 1.6, y + BASE.r - 1, BASE.z0 + .4, 3.2, 3, 3, 0, 'gc-steel');   // the wheel's pockets, the spout
    // the capsules, back to front (the far ones first), then the glass over them
    const pts = list.slice(0, 12).map((c, i) => ({ c, p: [x + PILE[i][0], y + PILE[i][1], z + PILE[i][2]] })).sort((a, b) => (a.p[0] + a.p[1]) - (b.p[0] + b.p[1]) || a.p[2] - b.p[2]);
    pts.forEach(({ c, p }) => { s += capAt(p[0], p[1], p[2], c, c.big); });
    if (o.agitator) { const a = o.stir || 0; s += seg([x, y, z + r], [x, y, z - r + 3], '#c9d0da', .9); [0, Math.PI].forEach(d => { s += seg([x, y, z - r + 4.4], [x + 4.6 * Math.cos(a + d), y + 4.6 * Math.sin(a + d), z - r + 4.4], '#8a93a4', 1.1); }); }
    s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" class="gc-glass"/><ellipse cx="${f(cx - R * .38)}" cy="${f(cy - R * .42)}" rx="${f(R * .22)}" ry="${f(R * .12)}" fill="#fff" opacity=".55" transform="rotate(-30 ${f(cx - R * .38)} ${f(cy - R * .42)})"/>`;
    s += cyl(x, y, z + r - 1.4, z + r + 1.6, 4.4, 4, o.lid || '#ff5fa2', 14) + (o.agitator ? cyl(x, y, z + r + 1.6, z + r + 4, 1.8, 1.8, '#8a93a4', 10) : '');
    return s;
  }
  // the star wheel seen from above in its base (X-ray): four pockets, turned by a
  const wheel = (k, a) => { const { x, y } = GLOBES[k]; let s = ''; for (let i = 0; i < 4; i++) { const t = a + i * Math.PI / 2; s += disc(x + 3.4 * Math.cos(t), y + 3.4 * Math.sin(t), BASE.z1 + .05, 1.5, '#5a1a1a', 8, 'stroke:none'); } return s; };

  /* ---------- the switchback run ---------- */
  // the ramps (yellow troughs with red stops at both ends) on the blue pegboard; steep: the upgrade's slopes
  function run(steep) {
    const { y, w, board } = RUN, R = steep ? RUN.steep : RUN.ramps;
    let s = `<g transform="${FRONT(3, board, 162)}"><rect width="32" height="74" rx="2" fill="#24307a" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + Array.from({ length: 8 }, (_, i) => Array.from({ length: 18 }, (_, j) => `<circle cx="${3 + i * 3.7}" cy="${3 + j * 4}" r=".55" fill="#4a5ab0"/>`).join('')).join('') + `</g>`;
    // the funnel the gutter drops into; the bell; the exit funnel
    const [fx, , fz] = RUN.funnel;
    s += cyl(fx, y, fz - 4, fz + 2, 2.2, 5, '#ffd23f', 14) + disc(fx, y, fz + 2, 5, '#c8a020', 14);
    R.forEach(([x0, x1, z0, z1], i) => {
      const lo = Math.min(x0, x1), hi = Math.max(x0, x1), zl = x0 < x1 ? z0 : z1, zr = x0 < x1 ? z1 : z0;
      s += `<path d="${toD([P(lo, y - w, zl), P(hi, y - w, zr), P(hi, y + w, zr), P(lo, y + w, zl)])}" class="gc-ramp"/>`
        + `<path d="${toD([P(lo, y + w, zl), P(hi, y + w, zr), P(hi, y + w, zr + 1), P(lo, y + w, zl + 1)])}" class="gc-rail"/>`;
      // the stop at the low end, where the capsule turns and drops (the ramps hang on the pegboard: no posts)
      s += box(x1 + (x1 > x0 ? 0 : -1.2), y - w, z1, 1.2, 2 * w, 3, 0, 'gc-stop');
    });
    const [bx, by, bz] = RUN.bell; s += cyl(bx, by, bz, bz + 2.4, 1.8, .8, '#e8b030', 12) + seg([bx, by, bz + 2.4], [bx, by - 4, bz + 5], '#8a93a4', .7);
    const [ex, , ez] = RUN.exit; s += cyl(ex, y, ez - 6, ez, 2.4, 4.6, '#ffd23f', 14);
    return s;
  }
  // the capsule's way down the run: a list of [x, y, z] (its centre) — the funnel, along each ramp, the drops between
  function route(steep, big) {
    const r = big ? CAPR.big : CAPR.n, R = steep ? RUN.steep : RUN.ramps, y = RUN.y, pts = [[RUN.funnel[0], y, RUN.funnel[2] + 4]];
    R.forEach(([x0, x1, z0, z1]) => { pts.push([x0, y, z0 + r + .2], [x1 - Math.sign(x1 - x0) * r, y, z1 + r + .2]); });
    pts.push([RUN.exit[0], y, RUN.exit[2] + 1], [RUN.exit[0], y, RUN.exit[2] - 8]);
    return pts;
  }

  /* ---------- the three upgrade kits ---------- */
  // つまり防止の撹拌棒: drawn inside each globe (globe(…, { agitator })); its ghost: the four shafts
  const agGhost = () => GLOBES.map(G => CORE.edges(G.x - .8, G.y - .8, G.z - G.r + 3, 1.6, 1.6, 2 * G.r + 1, 'ugh')).join('');
  // 急勾配レール: a jack under the pegboard (the ramps themselves are steeper: run(true))
  const JACK = { x: 19, y: 58 };
  const jack = () => box(JACK.x - 3, JACK.y - 3, 74, 6, 6, 4, 0, 'gc-steel') + cyl(JACK.x, JACK.y, 78, 88, 1.6, 1.6, '#e8453a', 10) + cyl(JACK.x, JACK.y, 88, 92, 1, 1, '#c9d0da', 8);
  const jackGhost = () => CORE.edges(JACK.x - 3, JACK.y - 3, 74, 6, 6, 18, 'ugh');
  // ジャンボホイール: the bigger, orange wheels in the globes' bases (globe(…, { jumbo })); its ghost: a ring on each base
  const jumboGhost = () => GLOBES.map(G => CORE.edges(G.x - BASE.r - 1, G.y - BASE.r - 1, BASE.z0, 2 * BASE.r + 2, 2 * BASE.r + 2, BASE.z1 - BASE.z0, 'ugh')).join('');

  /* ---------- the inside. lv: fitted parts { agitator, steep, jumbo } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right; setView();
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: cartons of capsules, the controller
    s += box(8, 30, 6, 30, 22, 26, 0, 'gc-carton') + `<g transform="${FRONT(8, 52.05, 22)}"><text x="15" y="8" font-size="3.4" text-anchor="middle" fill="#ff5fa2" class="sign">カプセル</text></g>`
      + box(44, 32, 6, 24, 20, 20, 0, 'gc-carton') + box(74, 36, 6, 14, 14, 30, 0, 'gc-steel');
    s += box(2, 26, 70, 90, 34, 4, 0, 'gc-floor');
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the shelf the globes stand on, their gearmotors under it
    let k = box(10, 30, 178, 86, 18, 3, 0, 'gc-shelf');   // (the spouts overhang its front edge: the capsules drop past it)
    GLOBES.forEach(G => { k += box(G.x - 2.4, G.y - 2.4, 172, 4.8, 4.8, 6, 0, 'gc-steel'); });
    // the gutter under the spouts and its drop to the funnel; the chute from the run's exit to the take-out window
    const { y: gy, x0, x1, z0, z1 } = GUTTER;
    k += `<path d="${toD([P(x1, gy - 2.6, z1), P(x0, gy - 2.6, z0), P(x0, gy + 2.6, z0), P(x1, gy + 2.6, z1)])}" class="gc-ramp"/>`
      + `<path d="${toD([P(x1, gy + 2.6, z1), P(x0, gy + 2.6, z0), P(x0, gy + 2.6, z0 + 1.4), P(x1, gy + 2.6, z1 + 1.4)])}" class="gc-rail"/>`
      + `<path class="gc-tube" d="${path([[x1, gy, z1 - 1], [RUN.funnel[0], RUN.y - 1, RUN.funnel[2] + 4]])}"/>`;
    k += `<path class="gc-tube" d="${path([[RUN.exit[0], RUN.y, RUN.exit[2] - 6], [RUN.exit[0], RUN.y + 4, 80], [GC.WINDOW[0], 80, 34]])}"/>`;
    g.insertAdjacentHTML('beforeend', k);
    // the run (behind the globes' row it stands lower and further forward)
    g.insertAdjacentHTML('beforeend', run(lv.steep) + (lv.steep ? `<g data-part="steep">${jack()}</g>` : `<g class="ugh-g">${jackGhost()}</g>`));
    // the globes, left to right (the far ones first in the default view)
    const globesG = UTIL.g(g, '', { class: 'gc-globes' });
    if (!lv.agitator) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${agGhost()}</g>`);
    if (!lv.jumbo) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${jumboGhost()}</g>`);
    const movers = UTIL.g(g, '', { class: 'gc-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.agitator ? '' : pin('agitator', GLOBES[1].x, GLOBES[1].y, GLOBES[1].z + 14)) + (lv.steep ? '' : pin('steep', JACK.x, JACK.y + 10, 96))
      + (lv.jumbo ? '' : pin('jumbo', GLOBES[3].x, GLOBES[3].y + 8, BASE.z0 - 6)));
    return { defs: defsEl, globesG, movers, cm };
  }

  /* ---------- the shell and the door: the placards, the menu, the ガチャガチャ sign, the capsule window, the knob ---------- */
  // the door's grid: the capsule-shaped window (x 28–54, y 63–127) frames the run whole (u 28–54: the funnel in its top
  // round, the five ramps, the bell and the exit funnel in its bottom round); the sign left of it, the big knob and the
  // lamps right of it; under them the 「シークレット」 board
  const WN = { x: 28, y: 63, w: 26, h: 64 };
  const pill = (d = 0) => { const x = WN.x - d, w = WN.w + 2 * d, r = w / 2, t = WN.y - d, b = WN.y + WN.h + d; return `M${x} ${t + r}A${r} ${r} 0 0 1 ${x + w} ${t + r}V${b - r}A${r} ${r} 0 0 1 ${x} ${b - r}Z`; };
  const KNOB = [75, 86];
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, pk = '#ff5fa2', cy = '#3fd9ee', yl = '#ffd23f';
    let s = CORE.sideFace(W, D, H) + rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a big capsule in outline, its figure, ガチャ under it
    const sideCap = (cx, cyy, r) => `<circle cx="${cx}" cy="${cyy}" r="${r}" fill="rgba(255,95,162,.06)" stroke="${pk}" stroke-width=".8" vector-effect="non-scaling-stroke"/><path d="M${cx - r} ${cyy}A${r} ${r} 0 0 0 ${cx + r} ${cyy}" fill="rgba(255,95,162,.14)" stroke="${pk}" stroke-width=".8" vector-effect="non-scaling-stroke"/><path d="M${cx - r} ${cyy}H${cx + r}" stroke="${pk}" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${pk}"/>${sideCap(42, 74, 24)}
      <text class="sign" x="42" y="132" font-size="20" text-anchor="middle" fill="rgba(255,95,162,.12)" stroke="rgba(255,95,162,.5)" stroke-width=".6" vector-effect="non-scaling-stroke">ガチャ</text>
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(255,95,162,.1)" stroke="${pk}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${pk}">1回 ¥200〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${pk}"/><g class="iso-only">${sideCap(42, 96, 20)}
      <text class="label" x="42" y="140" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,95,162,.6)">CAPSULE TOYS · ROLL DOWN</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, fs = Math.min(2.8, 18.6 / (p.jp || p.name).length);
      return R3(x, y, 20.8, 30, 1, `<rect class="gc-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${pk}" opacity="0"/><g transform="translate(${x + 3.6} ${y + .8}) scale(.57)">${icon(p.cap, p.fig, p.big)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label gc-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>
        <g class="gc-jam"><rect x="${x + 2}" y="${y + 8.6}" width="16.8" height="5" rx="1" fill="#ff4f3a"/><text x="${x + 10.4}" y="${y + 12.2}" font-size="3" text-anchor="middle" fill="#fff" class="sign">つまり</text></g>`,
        { r: 2, cls: 'hit gc-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the placards up top (plastic, not cloth: a toy corner's signs)
    const plac = [[4, pk, 'カプセル', 6], [42, cy, 'ころころ', 7.4], [80, yl, '1回 ¥200〜', 5.2]].map(([x, c, t, fs]) => `<rect x="${x}" y="4" width="36" height="14" rx="5" fill="${c}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="${x + 2}" y="5.6" width="32" height="3" rx="1.5" fill="#fff" opacity=".35"/>`
      + `<text class="gc-plac" x="${x + 18}" y="${f(11 + fs * .36)}" font-size="${fs}" text-anchor="middle">${t}</text>`).join('');
    // the ガチャガチャ sign left of the window
    const sign = `<rect x="6" y="63" width="18" height="64" rx="3" fill="#e8453a" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + ['ガ', 'チ', 'ャ', 'ガ', 'チ', 'ャ'].map((c, i) => `<text class="gc-signt" x="15" y="${75 + i * 9.6 - (c === 'ャ' ? 1 : 0)}" font-size="${c === 'ャ' ? 6 : 8}" text-anchor="middle">${c}</text>`).join('');
    // the big knob right of the window (it turns with each capsule), and the lamps under it
    const [kx, ky] = KNOB;
    const knob = `<circle cx="${kx}" cy="${ky}" r="13" fill="#c9d0da" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="${kx}" cy="${ky}" r="10.6" fill="#eef1f5" stroke="rgba(0,0,0,.25)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`
      + `<g class="gc-knob" transform="rotate(0 ${kx} ${ky})"><rect x="${kx - 10}" y="${ky - 2.6}" width="20" height="5.2" rx="2.6" fill="${pk}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><circle cx="${kx}" cy="${ky}" r="3.4" fill="#fff" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><circle cx="${kx + 7.4}" cy="${ky}" r="1" fill="#fff" opacity=".8"/></g>`
      + `<path d="M${kx - 15.4} ${ky - 6}A16 16 0 0 1 ${kx - 6} ${ky - 15.4}" fill="none" stroke="${yl}" stroke-width="1.1" stroke-linecap="round"/><path d="M${kx - 6} ${ky - 15.4}l-.6 2.4M${kx - 6} ${ky - 15.4}l-2.4-.4" stroke="${yl}" stroke-width="1.1" stroke-linecap="round"/>`;
    const lamps = R3(65, 104, 20, 6.4, .8, `<text class="lit-text gc-secretlamp" style="--lc:#ffd23f" x="75" y="108.6" font-size="2.7" text-anchor="middle">シークレット</text>`, { r: 1.5, capCls: 'readycap' })
      + (lv.steep ? R3(65, 112.6, 20, 6.4, .8, `<text class="lit-text gc-steeplamp" style="--lc:#3fd9ee" x="75" y="117.2" font-size="2.9" text-anchor="middle">急こう配</text>`, { r: 1.5, capCls: 'readycap' }) : '');
    // the board under them: six colours and the gold one
    const board = `<rect x="6" y="132" width="86" height="36" rx="2" class="gc-board"/><text class="gc-boardt" x="49" y="140.6" font-size="4.8" text-anchor="middle">シークレット 出るかも!</text>`
      + ['#ff8fb8', '#3a8aff', '#5ac83a', '#ff9a2a', '#a07ae0', '#e8453a'].map((c, i) => capsule(16 + i * 9.6, 152, 3.6, { cap: c, fig: 'ghost', v: 0 })).join('')
      + `<g transform="translate(80 151)"><circle r="6" fill="#ffd23f" stroke="#fff4b0" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="2.4" font-size="7" text-anchor="middle" fill="#8a5a00" class="sign">?</text></g>`
      + `<text class="gc-boardt" x="40" y="164" font-size="2.6" text-anchor="middle" opacity=".8">6いろ ＋ ひみつの きんいろ</text>`;
    const rivets = [80, 96, 112].map(y => `<circle cx="26.9" cy="${y}" r=".6" fill="#6a7384"/><circle cx="55.1" cy="${y}" r=".6" fill="#6a7384"/>`).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0Z${pill()}" fill-rule="evenodd"/>
      ${plac}
      <rect x="5" y="22" width="88" height="34" rx="2" class="gc-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#ffb8d8">なにが出るかな</text>
      ${sign}${knob}${lamps}${board}
      <path class="nohit" d="${pill(2)}${pill()}" fill-rule="evenodd" fill="#aab3bf" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>${rivets}
      <path class="dglass nohit" d="${pill()}"/><path class="nohit" d="M33 70L38 66L32 124H28V78Z" fill="#fff" opacity=".05"/>
      ${lv.agitator ? `<g class="nohit" transform="translate(63 121)"><rect width="24" height="7" rx="1" fill="#fff0f6" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><circle cx="3.2" cy="3.5" r="1.6" fill="#3fd47a"/><text x="14" y="4.6" font-size="2.6" text-anchor="middle" class="sign" fill="#c8286a">つまり防止</text></g>` : ''}
      ${lv.jumbo ? `<g class="nohit" transform="translate(87 133) rotate(8)"><circle r="7.4" fill="${yl}" stroke="${pk}" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-.4" font-size="2.8" text-anchor="middle" class="sign" fill="#c8286a">ジャンボ</text><text y="3" font-size="1.5" text-anchor="middle" class="label" fill="#c8286a">はじめました</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="gc-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${CORE.knob(105, 66, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 66h4"/>' })}<text class="label" x="105" y="73" font-size="2.4" text-anchor="middle">返却</text>
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="gc-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text gc-ready" style="--lc:${pk}" x="60" y="190.4" font-size="3.1" text-anchor="middle">でてきたよ</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v6.4H31z" fill="${pk}" opacity=".92"/><text class="gc-plac nohit" x="60" y="199.8" font-size="3.4" text-anchor="middle">カプセル とりだし口</text>
      <rect class="gc-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0Z${pill()}" fill-rule="evenodd" style="fill:#101318"/><path class="dglass nohit" d="${pill()}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'gc-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'gc-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.gc-tile')], slotGlow: door.querySelector('.gc-slotglow'),
      lcd: door.querySelector('.gc-lcd'), knob: door.querySelector('.gc-knob'), secretLamp: door.querySelector('.gc-secretlamp'), steepLamp: door.querySelector('.gc-steeplamp'),
      ready: door.querySelector('.gc-ready'), flap: door.querySelector('.gc-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><path class="xline" d="${pill()}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, globe, wheel, capsule, capAt, figure, icon, route, setView, KNOB, sr: () => SR };
})();
