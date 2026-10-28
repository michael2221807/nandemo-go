/* Fig 12 · 関東煮「ぐつぐつ」— geometry. Made up, built like a plant (user, 2026-10-16: every machine its own mechanism,
   one station per step, never one arm doing everything; upgrades you can see, 2026-10-17).
   The pot: a round pot in six compartments on a turntable, simmering over a gas ring. It turns the ordered compartment
   under the basket; the basket (on a rod from an air cylinder in the hood) dips in, comes up with two pieces and tips them
   into a short trough that slides them down into a paper cup. The cup rides a carriage along a rail in front of the pot:
   from the cup magazine, under the trough, under the broth spout (fed from the pot's well through the hub), under the
   mustard tube, to the hatch at the end of the rail; it drops down a chute to the take-out window.
   The flaw: the broth simmers away (in real time) and every cup takes a ladle of it; a float on the hub shows the level.
   Dry, the machine sells nothing until a jug of dashi goes in. Everything deep sits left: a point y deep shows (84 − y) × .87
   further right, so the pot and the rail stay forward and left. */
const OD = (() => {
  const W = 120, D = 84, H = 240;
  // the pot: six compartments round a fixed hub; the broth surface sinks with the level
  const POT = { x: 40, y: 58, r: 16, z0: 86, z1: 104, zb: 101 };
  const surf = l => POT.z0 + 4 + (POT.zb - POT.z0 - 4) * (.3 + .7 * Math.max(0, Math.min(1, l)));
  // the rail in front of the pot and its stations (x); the baskets stand over the pot at fixed angles (front-right, front-left)
  const RAIL = { y: 79, z: 88, x0: 5, x1: 93 };
  const CUPZ = RAIL.z + 1.6, CUPH = 9;
  // (in this projection +x+y is straight toward the viewer: a basket there would hide the hub; +x and +y sit right and left of it)
  const ANG = { b1: 0, b2: Math.PI / 2 }, BR = 10.5;
  const at = a => [POT.x + BR * Math.cos(a), POT.y + BR * Math.sin(a)];
  const B1 = at(ANG.b1), B2 = at(ANG.b2);
  const STN = { mag: 12, b2: B2[0], b1: B1[0], spout: 63, miso: 71, mus: 79, exit: 88 };
  const HOOD = { x: 20, y: 34, z: 152, w: 50, d: 40 };
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): g = which piece
  const MENU = [
    { name: '大根', price: 220, g: 'daikon', tier: 1 }, { name: '玉子', price: 230, g: 'tamago', tier: 1 }, { name: 'こんにゃく', price: 210, g: 'konnyaku', tier: 1 },
    { name: 'ちくわ', price: 240, g: 'chikuwa', tier: 1 }, { name: 'はんぺん', price: 230, g: 'hanpen', tier: 1 }, { name: '昆布', price: 220, g: 'konbu', tier: 1 },
  ];
  // what each piece looks like from above (labels, the crate's packs, the street)
  const TOPC = { daikon: '#f6e6b0', tamago: '#c8955a', konnyaku: '#8a8478', chikuwa: '#e8c890', hanpen: '#fbfaf4', konbu: '#2a4a32', ganmo: '#c8862a', atsuage: '#d8a04a',
    shirataki: '#e8e4d8', mochikin: '#d89a4a', cabbage: '#9ac85a', tsumire: '#8a7a6a', gyusuji: '#a8643a', tako: '#c84a4a', kanizume: '#e8562a',
    mkonnyaku: '#7a3a12', mdaikon: '#7a3a12', mtamago: '#7a3a12' };
  return { W, D, H, POT, surf, RAIL, CUPZ, CUPH, ANG, BR, B1, B2, STN, HOOD, WINDOW, MENU, TOPC, SLOTW: [105, D, 196] };
})();

const ODB = (() => {
  const { FRONT, TOP, box, rect, path, P, f } = ISO;
  const { W, D, H, POT, surf, RAIL, CUPZ, CUPH, ANG, BR, B1, B2, STN, HOOD, TOPC } = OD;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const K = 'stroke="rgba(0,0,0,.45)" stroke-width=".45" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
  const q = (x, y, z) => P(x, y, z).map(f);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringZ(z0, r0, n, 0, Math.PI * 2, x, y), ...ringZ(z1, r1, n, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ringZ(z, r, n, 0, Math.PI * 2, x, y))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);

  /* ---------- the pieces: each its own shape (screen units, around the piece's foot) ---------- */
  const miso = (a, b) => `<path d="M${f(a - 1.8)} ${f(b - 2)}q1.8-1.2 3.6 0q-.4 .9-1.8.9t-1.8-.9z" fill="#7a3a12" ${K}/><circle cx="${f(a - .5)}" cy="${f(b - 2.2)}" r=".2" fill="#f4e4c0"/><circle cx="${f(a + .6)}" cy="${f(b - 2)}" r=".2" fill="#f4e4c0"/>`;
  const skewer = (a, b) => `<path d="M${f(a - 3)} ${f(b + .4)}L${f(a + 3)} ${f(b - 2.2)}" stroke="#e8d0a0" stroke-width=".55" stroke-linecap="round"/>`;
  const PIECE = {
    daikon: (a, b) => `<path d="M${f(a - 2.6)} ${f(b - 1.3)}v1.6q2.6 1.4 5.2 0v-1.6z" fill="#e8cf86" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.3)}" rx="2.6" ry="1.2" fill="#f6e6b0" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.3)}" rx="2.1" ry=".9" fill="none" stroke="#e0b860" stroke-width=".3"/><path d="M${f(a - 1.2)} ${f(b - 1.3)}h2.4M${f(a)} ${f(b - 1.9)}v1.2" stroke="#d8b860" stroke-width=".35"/>`,
    tamago: (a, b) => `<ellipse cx="${f(a)}" cy="${f(b - 1.4)}" rx="2.1" ry="1.6" fill="#c8955a" ${K}/><ellipse cx="${f(a - .7)}" cy="${f(b - 1.9)}" rx=".7" ry=".4" fill="#f0c890" opacity=".85"/>`,
    konnyaku: (a, b) => `<path d="M${f(a - 2.7)} ${f(b + .2)}L${f(a + 2.7)} ${f(b + .2)}L${f(a + .3)} ${f(b - 2.8)}z" fill="#8a8478" ${K}/>` + [[-1.2, -.4], [.4, -.9], [1.2, -.2], [-.2, -1.8], [-.6, -.2]].map(([u, v]) => `<circle cx="${f(a + u)}" cy="${f(b + v)}" r=".22" fill="#2e2a24"/>`).join(''),
    chikuwa: (a, b) => `<rect x="${f(a - 2.9)}" y="${f(b - 2.3)}" width="5.8" height="2.5" rx="1.25" fill="#e8c890" ${K}/><path d="M${f(a - 1.7)} ${f(b - 2.3)}h3.2v2.5h-3.2z" fill="#b8783a" opacity=".85"/><path d="M${f(a - 1.2)} ${f(b - 1.8)}l.25.12M${f(a + .3)} ${f(b - 1.5)}l.25.12M${f(a - .5)} ${f(b - .7)}l.25.12M${f(a + .9)} ${f(b - .6)}l.2.1" stroke="#7a4a1a" stroke-width=".25" stroke-linecap="round"/><ellipse cx="${f(a + 2.4)}" cy="${f(b - 1.05)}" rx=".45" ry=".95" fill="#6a4a2a"/>`,
    hanpen: (a, b) => `<path d="M${f(a - 2.6)} ${f(b - .9)}L${f(a + .2)} ${f(b + .3)}L${f(a + 2.7)} ${f(b - 1)}L${f(a - .1)} ${f(b - 2.3)}z" fill="#fbfaf4" ${K}/><path d="M${f(a - 2.6)} ${f(b - .9)}v.7L${f(a + .2)} ${f(b + 1)}L${f(a + 2.7)} ${f(b - .3)}v-.7L${f(a + .2)} ${f(b + .3)}z" fill="#e4e0d4" ${K}/>`,
    konbu: (a, b) => `<path d="M${f(a - 2.5)} ${f(b - 1.1)}q1.25-2.1 2.5 0q1.25 2.1 2.5 0q-1.25-2.1-2.5 0q-1.25 2.1-2.5 0z" fill="#2a4a32" ${K}/><path d="M${f(a)} ${f(b - 2.1)}v2" stroke="#c8a86a" stroke-width=".55"/>`,
    ganmo: (a, b) => `<ellipse cx="${f(a)}" cy="${f(b - 1)}" rx="2.5" ry="1.5" fill="#c8862a" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.3)}" rx="1.7" ry=".9" fill="#d89a3a"/>` + [[-.8, -1.3, '#ff8a3a'], [.7, -1, '#4aaa4a'], [.1, -1.7, '#2a2a2a']].map(([u, v, c]) => `<circle cx="${f(a + u)}" cy="${f(b + v)}" r=".28" fill="${c}"/>`).join(''),
    atsuage: (a, b) => `<path d="M${f(a - 2.3)} ${f(b - 1.6)}h4.4v1.9h-4.4z" fill="#c8862a" ${K}/><path d="M${f(a - 2.3)} ${f(b - 1.6)}l1-1h4.4l-1 1z" fill="#d8a04a" ${K}/><path d="M${f(a + 2.1)} ${f(b - 1.6)}l1-1v1.9l-1 1z" fill="#a8682a" ${K}/><rect x="${f(a - 1.6)}" y="${f(b - 1.2)}" width="3" height="1.1" fill="#f4e4c0"/>`,
    shirataki: (a, b) => { const d = `M${f(a - 2.3)} ${f(b - .8)}q1.1-2.3 2.3-.6q1.2 1.7 2.3-.4M${f(a - 2.3)} ${f(b - 1.7)}q1.15 1.9 2.3.2q1.15-1.7 2.3.4`;
      return `<path d="${d}" fill="none" stroke="#9a9484" stroke-width="1.5" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#f2eee2" stroke-width=".85" stroke-linecap="round"/><path d="M${f(a - .3)} ${f(b - 2.1)}v1.6" stroke="#c8a86a" stroke-width=".55"/>`; },
    mochikin: (a, b) => `<path d="M${f(a - 2.3)} ${f(b)}q-.4-2.4 1.3-2.8l.6-.7.6.7q1.7.4 1.3 2.8q-1.9.9-3.8 0z" fill="#d89a4a" ${K}/><path d="M${f(a - 1)} ${f(b - 2.7)}h2" stroke="#8a5a1a" stroke-width=".55"/><path d="M${f(a - .6)} ${f(b - 2.4)}q-.8 1-1 2.2M${f(a + .6)} ${f(b - 2.4)}q.8 1 1 2.2M${f(a)} ${f(b - 2.4)}v2.4" stroke="#b87a2a" stroke-width=".3" fill="none"/>`,
    cabbage: (a, b) => `<rect x="${f(a - 2.7)}" y="${f(b - 2.3)}" width="5.4" height="2.7" rx="1.35" fill="#9ac85a" ${K}/><path d="M${f(a - 1.2)} ${f(b - 2.3)}q.6 1.35 0 2.7M${f(a + .6)} ${f(b - 2.3)}q.6 1.35 0 2.7" stroke="#6a9a3a" stroke-width=".45" fill="none"/><ellipse cx="${f(a + 2.3)}" cy="${f(b - .95)}" rx=".5" ry="1.15" fill="#c8e88a"/>`,
    tsumire: (a, b) => skewer(a, b) + `<circle cx="${f(a - 1.2)}" cy="${f(b - .8)}" r="1.35" fill="#8a7a6a" ${K}/><circle cx="${f(a + 1.3)}" cy="${f(b - 1.7)}" r="1.35" fill="#8a7a6a" ${K}/><circle cx="${f(a - 1.6)}" cy="${f(b - 1.2)}" r=".35" fill="#b8a898"/><circle cx="${f(a + .9)}" cy="${f(b - 2.1)}" r=".35" fill="#b8a898"/>`,
    gyusuji: (a, b) => skewer(a, b) + [[-1.8, -.3], [0, -1.1], [1.8, -1.9]].map(([u, v]) => `<path d="M${f(a + u - 1.1)} ${f(b + v)}q.2-1.3 1.1-1.2q1.1-.1 1 1.1q-.4.8-1.1.7q-.8 0-1-.6z" fill="#a8643a" ${K}/><path d="M${f(a + u - .5)} ${f(b + v - .7)}q.5-.4 1 0" stroke="#ecd0a8" stroke-width=".5" fill="none"/>`).join(''),
    tako: (a, b) => skewer(a, b) + `<path d="M${f(a - 2.3)} ${f(b - .2)}q0-2.6 2.4-2.6q2 0 2 1.6q0 1-1 1" fill="none" stroke="#c84a4a" stroke-width="1.7" stroke-linecap="round"/>` + [[-1.6, -1.3], [-.4, -2.4], [1, -2.5], [2, -1.6]].map(([u, v]) => `<circle cx="${f(a + u)}" cy="${f(b + v)}" r=".3" fill="#f4c0b0"/>`).join(''),
    kanizume: (a, b) => `<ellipse cx="${f(a - .9)}" cy="${f(b - 1.1)}" rx="1.9" ry="1.35" fill="#fbfaf4" ${K}/><path d="M${f(a - 2)} ${f(b - 1.5)}q1-.5 2 0" stroke="#ff9a8a" stroke-width=".5" fill="none"/><path d="M${f(a + .5)} ${f(b - 1.2)}q1.6-2.3 2.7-.6q-.4 1.3-1.7 1.4z" fill="#e8562a" ${K}/><path d="M${f(a + 1.2)} ${f(b - 1.3)}q.8-1.1 1.6-.7" stroke="#ffb090" stroke-width=".35" fill="none" stroke-linecap="round"/>`,
  };
  PIECE.mdaikon = (a, b) => PIECE.daikon(a, b) + miso(a, b + .3);
  PIECE.mkonnyaku = (a, b) => PIECE.konnyaku(a, b) + miso(a, b + .6);
  PIECE.mtamago = (a, b) => PIECE.tamago(a, b) + miso(a, b + .3);
  const piece = g => (PIECE[g] || PIECE.daikon)(0, 0);
  // flat icons (24 × 24) for the menu tiles and the shop: a bowl of broth, the piece big in it
  function icon(g) {
    const k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"';
    // (app build, goods polish: the piece in the icon takes the icon's ink outline instead of the machine's hairline
    // (it is the machine's piece at 2.3×); a shine on the broth and a wisp of steam)
    const pc = piece(g).replace(/stroke="rgba\(0,0,0,\.45\)" stroke-width="\.45" vector-effect="non-scaling-stroke"/g, 'stroke="#141018" stroke-width=".32"');
    return `<path d="M2.6 13q0 7 9.4 7t9.4-7z" fill="#fbfaf4" ${k}/><ellipse cx="12" cy="13" rx="9.4" ry="3.2" fill="#d8a040" ${k}/><path d="M3 14.6h18" stroke="#c8402a" stroke-width="1.4"/>`
      + `<path d="M4.8 12.6q2-1.4 4.4-1.6M15.4 11.2q2.2.3 3.6 1.2" fill="none" stroke="#f6d690" stroke-width=".8" stroke-linecap="round"/>`
      + `<g transform="translate(12 14.4) scale(2.3)">${pc}</g>`
      + `<path d="M18.6 8.6q-1-1.4 0-2.8t0-2.8" fill="none" stroke="#b8b0a0" stroke-width=".8" stroke-linecap="round" opacity=".7"/>`;
  }
  // the crate: a tray of pieces (in their colour) and the jug of dashi
  function defs() {
    const pack = `<g id="g-od-pack">${box(-5.5, -3.5, 0, 11, 7, 2, 0, 'od-pack')}<g transform="${TOP(-5.5, -3.5, 2.03)}"><rect x="1" y="1" width="9" height="5" rx="1" fill="rgba(230,245,255,.35)"/><circle cx="3.4" cy="3.5" r="1.5" style="fill:var(--c)"/><circle cx="7.4" cy="3.5" r="1.5" style="fill:var(--c)"/></g></g>`;
    const jug = `<g id="g-od-jug"><path d="M-5 0q-1-8 1-11h8q2 3 1 11q-5 1.4-10 0z" fill="#e8e0cc" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-4.2 -11v-2.4h8.4v2.4" fill="#c9d0da" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M5 -9q3 0 3 3t-3 3" fill="none" stroke="#c9d0da" stroke-width="1.4"/><rect x="-3.6" y="-8" width="7.2" height="4.4" rx="1" fill="#2a3a6a"/><text x="0" y="-4.7" font-size="3.2" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">だし</text></g>`;
    return pack + jug;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the pot ---------- */
  // the pot, its broth at level l, the dividers at rotation rot (the pieces are <use>s the machine places on top);
  // the front wall above the broth is drawn by potFront, after the pieces
  function pot(l, rot) {
    const { x, y, r, z0, z1 } = POT, zs = surf(l);
    let s = cyl(x, y, z0, z1, r, r, '#9aa3b0', 24) + disc(x, y, z1, r, '#5a6270', 24) + disc(x, y, zs, r - .6, '#c8902a', 24, 'stroke:none')
      + disc(x, y, zs + .05, r - 4, '#d8a040', 20, 'stroke:none');
    s += `<path class="od-div" d="${dividers(rot, zs)}"/>`;
    return s;
  }
  // the six dividers (radial plates sticking up out of the broth) and the hub's foot
  const dividers = (rot, zs) => Array.from({ length: 6 }, (_, k) => { const a = rot + (k + .5) * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
    const [x0, y0] = q(POT.x + 2.4 * c, POT.y + 2.4 * s, zs + 1.4), [x1, y1] = q(POT.x + (POT.r - .8) * c, POT.y + (POT.r - .8) * s, zs + 1.4); return `M${x0} ${y0}L${x1} ${y1}`; }).join('');
  // the front half of the wall from the broth up to the rim, so the broth stays inside; the rim's lip; the hub with its scale
  function potFront(l) {
    const { x, y, r, z1 } = POT, zs = surf(l), front = (z, a0, a1) => ringZ(z, r, 16, a0, a1, x, y);
    return `<path d="${toD([...front(z1, 0, Math.PI), ...front(zs - .4, Math.PI, 0)])}" style="fill:#9aa3b0;stroke:none"/>`
      + `<path d="${toD(front(z1, 0, Math.PI))}" fill="none" stroke="#c9d0da" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`;
  }
  // the hub (fixed: the pot turns round it) carries the broth pipe up to the hood and the float that shows the level
  function hub(l) {
    const { x, y } = POT, zs = surf(l);
    let s = cyl(x, y, zs, HOOD.z, 1.7, 1.7, '#c9d0da', 10);
    for (let i = 0; i < 6; i++) { const z = POT.z0 + 6 + i * 1.8; s += seg([x - .2, y + 1.75, z], [x + .9, y + 1.75, z], i === 5 ? '#e8453a' : '#3a404c', .35); }
    s += cyl(x, y, zs - .4, zs + 1.2, 2.8, 2.8, '#e8453a', 12);   // the float: a red ring riding on the broth
    return s;
  }
  // a piece's place in compartment k (j: 0..2, how many are drawn), at rotation rot and broth level l
  function slotPos(k, j, rot, l) {
    const a = rot + k * Math.PI / 3 + [0, -.34, .32][j], rr = [9.4, 5.6, 12.6][j];
    return P(POT.x + rr * Math.cos(a), POT.y + rr * Math.sin(a), surf(l) + .3);
  }
  // the burner under the pot: the turntable's housing, a ring of small blue flames (still: no animation)
  function burner() {
    const { x, y, z0 } = POT;
    let s = cyl(x, y, z0 - 12, z0 - 2, POT.r - 4, POT.r - 4, '#2a2f38', 20) + cyl(x, y, z0 - 2, z0, POT.r - 2.5, POT.r - 2.5, '#3a414c', 20);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; if (Math.sin(a) < -.2) continue; const [fx, fy] = q(x + (POT.r - 4.4) * Math.cos(a), y + (POT.r - 4.4) * Math.sin(a), z0 - 1.6);
      s += `<path d="M${f(fx - .9)} ${fy}q.9-2.6.9-2.8q0 .2.9 2.8z" fill="#5ab4ff" opacity=".85"/>`; }
    return s;
  }

  /* ---------- the basket, the trough, the cup ---------- */
  // a wire basket at (x, y) with its bottom at bz; only what stands above the broth (zs) shows; tip: 0..1 tipped forward
  function basket(x, y, bz, zs, pcs = [], tip = 0) {
    const r = 4.4, h = 6, lo = Math.max(bz, zs);
    let s = '';
    if (bz + h > zs) {
      s += `<path d="${toD(hull([...ringZ(lo, r * .92, 14, 0, Math.PI * 2, x, y), ...ringZ(bz + h, r, 14, 0, Math.PI * 2, x, y)]))}" class="od-mesh"/>`;
      for (let i = 0; i < 7; i++) { const a = Math.PI * (i + .5) / 7; s += seg([x + r * .92 * Math.cos(a), y + r * .92 * Math.sin(a), lo], [x + r * Math.cos(a), y + r * Math.sin(a), bz + h], 'rgba(220,226,234,.75)', .4); }
      pcs.forEach((g, i) => { const [a, b] = q(x + (i ? 1.6 : -1.4), y + (i ? -.6 : .8), bz + 2.2); s += `<g transform="translate(${a} ${b})">${piece(g)}</g>`; });
      s += `<path d="${toD(ringZ(bz + h, r, 16, 0, Math.PI * 2, x, y))}" fill="none" stroke="#dfe5ec" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
    }
    // the rod up to the air cylinder in the hood, hung from the basket's back edge
    s = seg([x, y - r, bz + h], [x, y - r, HOOD.z - 12], '#c9d0da', .9) + s;
    if (!tip) return s;
    const [px, py] = q(x, y + r, bz + h);
    return `<g transform="rotate(${f(-38 * tip)} ${px} ${py})">${s}</g>`;
  }
  // a trough from the basket's front over the rim down to the cup on the rail
  const troughPts = (bx, by) => [[bx, by + 4.6, 109.5], [bx, RAIL.y - .5, CUPZ + CUPH + 2.2]];
  function trough(bx, by) {
    const [[x, y0, z0], [, y1, z1]] = troughPts(bx, by);
    return `<path d="${toD([P(x - 3, y0, z0), P(x + 3, y0, z0), P(x + 3, y1, z1), P(x - 3, y1, z1)])}" style="fill:#b8c0cc;${ST}"/>`
      + seg([x - 3, y0, z0 + 1.2], [x - 3, y1, z1 + 1.2], '#8a93a4', .8) + seg([x + 3, y0, z0 + 1.2], [x + 3, y1, z1 + 1.2], '#8a93a4', .8);
  }
  // the air cylinder hanging under the hood over a basket
  const actuator = (x, y) => cyl(x, y - 4.4, HOOD.z - 12, HOOD.z, 1.8, 1.8, '#8a93a4', 12) + disc(x, y - 4.4, HOOD.z - 12, 1, '#c9d0da', 8);
  // a paper cup at world (x, y, z) (its foot): o = { pcs: [g, g], broth, miso, mus }
  function cup(x, y, z, o = {}) {
    const top = z + CUPH;
    let s = `<path d="${toD(hull([...ringZ(z, 3.1, 14, 0, Math.PI * 2, x, y), ...ringZ(top, 4.1, 14, 0, Math.PI * 2, x, y)]))}" style="fill:#fbfaf4;${ST}"/>`
      + `<path d="${toD(hull([...ringZ(z + 5.2, 3.75, 14, 0, Math.PI * 2, x, y), ...ringZ(z + 7, 3.95, 14, 0, Math.PI * 2, x, y)]))}" style="fill:#c8402a;stroke:none"/>`
      + disc(x, y, top, 4.1, o.broth ? '#c8902a' : '#e6dccb', 16);
    (o.pcs || []).forEach((g, i) => { const [a, b] = q(x + (i ? 1.4 : -1.3), y + (i ? -.7 : .8), top - .4); s += `<g transform="translate(${a} ${b})">${piece(g)}</g>`; });
    if (o.miso) { const [a, b] = q(x, y, top + .6); s += `<path d="M${f(a - 2.4)} ${f(b)}q2.4-1.4 4.8 0q-1 1.2-2.4 1.2t-2.4-1.2z" fill="#7a3a12" opacity=".92"/>`; }
    if (o.mus) { const [a, b] = q(x + 3.2, y + 1.2, top + .2); s += `<ellipse cx="${a}" cy="${b}" rx="1.1" ry=".7" fill="#ffd23f" stroke="#c89a10" stroke-width=".35"/>`; }
    return s;
  }
  // the carriage that carries a cup along the rail (drawn at x = 0; the machine moves it)
  const carriage = () => box(-4.2, RAIL.y - 2.4, RAIL.z, 8.4, 4.8, 1.6, 0, 'od-steel') + disc(0, RAIL.y, CUPZ + .05, 3.4, '#5a6270', 12, 'stroke:none');
  // a stream from a spout down into the cup (broth gold, miso brown, thick); only while it pours
  const stream = (x, z0, c, w) => seg([x, RAIL.y, z0], [x, RAIL.y, CUPZ + CUPH + .3], c, w, 'butt');
  // steam over the pot while a basket comes up (one-shot CSS, removed after)
  const steam = () => { const [a, b] = q(POT.x, POT.y + 4, POT.z1 + 6); return [[-8, 0], [0, -4], [8, -1]].map(([u, v], i) => `<path class="od-steam" style="animation-delay:${i * .18}s" d="M${f(+a + u)} ${f(+b + v)}q-3-5 0-9t0-9" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.6" stroke-linecap="round"/>`).join(''); };

  /* ---------- the three upgrade kits: each a station of its own, with a sign on the door ---------- */
  // 自動給湯: a dashi tank up at the back left, its pipe to the pot and a float valve (a ball on an arm) that opens it when
  // the broth goes down — the toilet-cistern valve
  const TANK = { x: 6, y: 34, z: 96, w: 14, d: 14, h: 26 };
  function refillKit() {
    const { x, y, z, w, d, h } = TANK, vx = 28, vy = 44, vz = POT.z1 + 3;
    return box(x, y, z, w, d, h, 0, 'od-tank') + post(x + 3, y + 3, POT.z1 - 30, z - POT.z1 + 30, 'od-steel') + post(x + w - 3, y + d - 3, POT.z1 - 30, z - POT.z1 + 30, 'od-steel')
      + `<g transform="${FRONT(x + 2, y + d + .05, z + h - 6)}"><rect width="10" height="7" rx="1" fill="#2a3a6a"/><text x="5" y="5.2" font-size="4.4" text-anchor="middle" fill="#fff" class="sign">だし</text></g>`
      + `<g transform="${FRONT(x + 2, y + d + .05, z + 11)}"><rect width="10" height="2.4" rx=".6" fill="#3fd47a"/><text x="5" y="1.85" font-size="1.7" text-anchor="middle" fill="#0a2a14" class="label">AUTO</text></g>`
      + `<path class="od-pipe" d="${path([[x + w / 2, y + d / 2, z + h], [x + w / 2, y + d / 2, z + h + 3], [vx, vy, z + h + 3], [vx, vy, vz]])}"/>`
      + box(vx - 1.4, vy - 1.4, vz - 1, 2.8, 2.8, 2.6, 0, 'od-valve') + seg([vx, vy + 1.4, vz], [vx + 4, vy + 6, surf(1) + 1.6], '#c9d0da', .7) + disc(vx + 4.4, vy + 6.4, surf(1) + .6, 1.6, '#ff8a2a', 12);
  }
  const refillGhost = () => CORE.edges(TANK.x, TANK.y, TANK.z, TANK.w, TANK.d, TANK.h, 'ugh');
  // 二番かご: a second basket on its own air cylinder at the front left, with its trough (the basket itself the machine draws)
  const basket2Kit = () => actuator(B2[0], B2[1]) + trough(B2[0], B2[1]);
  const basket2Ghost = () => CORE.edges(B2[0] - 4.4, B2[1] - 4.4, 108, 8.8, 8.8, 6, 'ugh') + `<path class="ugh" d="${path(troughPts(B2[0], B2[1]))}"/>`;
  // 味噌だれ: an earthenware pot of thick miso on a bracket over the rail, a paddle in it, a nozzle under it
  const MISO = { x: STN.miso, y: RAIL.y - 3, z: 114 };
  function misoKit() {
    const { x, y, z } = MISO;
    return post(x + 6, y - 4, POT.z1 - 20, z - POT.z1 + 30, 'od-steel') + box(x - 1, y - 4.6, z + 9, 8, 1.4, 1.4, 0, 'od-steel')
      + cyl(x, y, z, z + 9, 4.2, 5.2, '#8a4a22', 16) + disc(x, y, z + 9, 4.6, '#5a2a10', 16) + seg([x, y, z + 8], [x + 1.6, y - 1.2, z + 15], '#c9d0da', .8)
      + `<g transform="${FRONT(x - 3.2, y + 5.3, z + 6.4)}"><text x="3.2" y="2" font-size="2.6" text-anchor="middle" fill="#fff4dc" class="sign">味噌</text></g>`
      + cyl(x, RAIL.y, CUPZ + CUPH + 6, z, .8, 1.3, '#5a2a10', 10);
  }
  const misoGhost = () => CORE.edges(MISO.x - 5.2, MISO.y - 5.2, MISO.z, 10.4, 10.4, 9, 'ugh');

  /* ---------- the inside. lv: fitted parts { refill, basket2, miso }; l: the broth's level ---------- */
  function interior(g, coinState, lv, l) {
    const RT = ISO.right;
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the stock pot for the broth, a cup carton, the gas regulator; the shelf the pot stands on
    s += cyl(22, 46, 6, 52, 12, 12, '#c9d0da', 20) + disc(22, 46, 52, 12, '#aab3bf', 20) + `<g transform="${FRONT(14, 58.05, 44)}"><rect width="16" height="6" rx="1" fill="#2a3a6a"/><text x="8" y="4.4" font-size="3.4" text-anchor="middle" fill="#fff" class="sign">だし</text></g>`;
    s += box(52, 34, 6, 22, 18, 26, 0, 'od-carton') + `<g transform="${FRONT(52, 52.05, 26)}"><text x="11" y="8" font-size="3.2" text-anchor="middle" fill="#c8402a" class="sign">カップ</text></g>`;
    s += box(76, 40, 6, 12, 12, 16, 0, 'od-steel') + cyl(82, 46, 22, 30, 2.4, 2.4, '#e8453a', 10);
    s += box(2, 26, 70, 90, 58, 4, 0, 'od-floor');
    s += burner();
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the dashi tank stands deep at the back left: before the pot
    g.insertAdjacentHTML('beforeend', lv.refill ? `<g data-part="refill">${refillKit()}</g>` : `<g class="ugh-g">${refillGhost()}</g>`);
    // the pot (redrawn by the machine as it turns and as the broth goes down), its pieces, its front wall, the hub
    const potG = UTIL.g(g, '', { class: 'od-pot' });
    const pcsG = UTIL.g(g, '', { class: 'od-pcs' });
    const frontG = UTIL.g(g, '', { class: 'od-potfront' });
    const hubG = UTIL.g(g, '', { class: 'od-hub' });
    const steamG = UTIL.g(g, '', { class: 'od-steamg' });
    // the hood over the pot: the air cylinders hang from it; the broth pipe runs under it from the hub to the spout
    let k = box(HOOD.x, HOOD.y, HOOD.z, HOOD.w, HOOD.d, 6, 0, 'od-hood') + `<g transform="${FRONT(HOOD.x + 14, HOOD.y + HOOD.d + .05, HOOD.z + 5)}"><rect width="22" height="4" rx=".6" fill="#2a3a6a"/><text x="11" y="3.1" font-size="3" text-anchor="middle" fill="#fff" class="sign">おでん</text></g>`;
    k += `<path class="od-pipe" d="${path([[POT.x, POT.y, HOOD.z - 2], [STN.spout, POT.y, HOOD.z - 2], [STN.spout, RAIL.y, HOOD.z - 2], [STN.spout, RAIL.y, CUPZ + CUPH + 13]])}"/>`
      + disc(STN.spout, (POT.y + RAIL.y) / 2, HOOD.z - 2.6, 1.9, '#d8a84a', 12) + cyl(STN.spout, RAIL.y, CUPZ + CUPH + 10, CUPZ + CUPH + 13, .9, 1.4, '#c9d0da', 10);
    k += actuator(B1[0], B1[1]) + trough(B1[0], B1[1]);
    // the cup magazine at the left end of the rail: a clear tube of stacked cups
    const mx = STN.mag, mz = CUPZ + CUPH + 1;
    k += cyl(mx, RAIL.y, mz, mz + 46, 4, 4.4, '#fbfaf4', 14) + `<path d="${toD(hull([...ringZ(mz + 1.2, 4.05, 14, 0, Math.PI * 2, mx, RAIL.y), ...ringZ(mz + 3, 4.1, 14, 0, Math.PI * 2, mx, RAIL.y)]))}" style="fill:#c8402a;stroke:none"/>`
      + Array.from({ length: 13 }, (_, i) => `<path d="${toD(ringZ(mz + 6 + i * 3.2, 4.12 + i * .02, 16, 0, Math.PI, mx, RAIL.y))}" fill="none" stroke="#b8b0a0" stroke-width=".7" vector-effect="non-scaling-stroke"/>`).join('')
      + `<path class="od-tube" d="${toD(hull([...ringZ(mz - 1, 5.2, 16, 0, Math.PI * 2, mx, RAIL.y), ...ringZ(mz + 48, 5.2, 16, 0, Math.PI * 2, mx, RAIL.y)]))}"/>` + cyl(mx, RAIL.y, mz + 48, mz + 50, 5.6, 5.6, '#8a93a4', 16);
    // the mustard tube over the rail
    k += post(STN.mus + 5, RAIL.y - 3, POT.z1 - 18, 34, 'od-steel') + box(STN.mus - 1, RAIL.y - 3.8, CUPZ + CUPH + 15.4, 7, 1.4, 1.4, 0, 'od-steel')
      + cyl(STN.mus, RAIL.y, CUPZ + CUPH + 6, CUPZ + CUPH + 17, 1.9, 1.9, '#ffd23f', 12) + cyl(STN.mus, RAIL.y, CUPZ + CUPH + 4, CUPZ + CUPH + 6, .5, 1.6, '#e8453a', 10)
      + `<g transform="${FRONT(STN.mus - 2, RAIL.y + 2, CUPZ + CUPH + 14)}"><text x="2" y="1.6" font-size="2" text-anchor="middle" fill="#7a5a00" class="sign">からし</text></g>`;
    // the rail and its legs; the hatch at its end
    k += post(RAIL.x0 + 3, RAIL.y - 1, 74, RAIL.z - 76) + post(RAIL.x1 - 3, RAIL.y - 1, 74, RAIL.z - 76) + box(RAIL.x0, RAIL.y - 1.4, RAIL.z - 3, RAIL.x1 - RAIL.x0, 2.8, 3, 0, 'od-rail')
      + `<path d="${toD([P(STN.exit - 4, RAIL.y - 2.4, RAIL.z + .05), P(STN.exit + 4, RAIL.y - 2.4, RAIL.z + .05), P(STN.exit + 4, RAIL.y + 2.4, RAIL.z + .05), P(STN.exit - 4, RAIL.y + 2.4, RAIL.z + .05)])}" fill="#0e1218" stroke="#5a6270" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
    g.insertAdjacentHTML('beforeend', k);
    // the kits that stand over the rail: the second basket, the miso pot
    g.insertAdjacentHTML('beforeend', lv.basket2 ? `<g data-part="basket2">${basket2Kit()}</g>` : `<g class="ugh-g">${basket2Ghost()}</g>`);
    const basket2G = lv.basket2 ? UTIL.g(g, '', { class: 'od-basket2', 'data-part': 'basket2' }) : null;
    g.insertAdjacentHTML('beforeend', lv.miso ? `<g data-part="miso">${misoKit()}</g>` : `<g class="ugh-g">${misoGhost()}</g>`);
    const basketG = UTIL.g(g, '', { class: 'od-basket' });
    const cartG = UTIL.g(g, '', { class: 'od-cart' });
    const streamG = UTIL.g(g, '', { class: 'od-streamg' });
    const movers = UTIL.g(g, '', { class: 'od-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.refill ? '' : pin('refill', TANK.x + TANK.w / 2, TANK.y + TANK.d / 2, TANK.z + 14)) + (lv.basket2 ? '' : pin('basket2', B2[0] - 3, RAIL.y + 2, CUPZ + 5))
      + (lv.miso ? '' : pin('miso', MISO.x + 3, RAIL.y + 2, CUPZ + 3)));
    return { defs: defsEl, potG, pcsG, frontG, hubG, steamG, basketG, basket2G, cartG, streamG, movers, cm };
  }

  /* ---------- the shell and door: the noren, the menu, a banner, the peek window onto the pot, the take-out window.
     (user, 2026-10-17: most real machines hide their works, and that is what X-ray is for. The window frames the pot —
     it turns, the basket dips and comes up steaming; the cups, the rail, the spout and the mustard are for X-ray) ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, oc = '#e8862a', nv = '#2a3a6a', lc = '#e8453a';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a red paper lantern with おでん on it (its ribs, its black caps), あつあつ under it
    const lantern = (cx, cy) => `<rect x="${cx - 9}" y="${cy - 30}" width="18" height="4" rx="1" fill="#1a1414"/><rect x="${cx - 9}" y="${cy + 26}" width="18" height="4" rx="1" fill="#1a1414"/>`
      + `<path d="M${cx - 9} ${cy - 26}q-10 26 0 52h18q10-26 0-52z" fill="rgba(232,69,58,.2)" stroke="${lc}" stroke-width="1" vector-effect="non-scaling-stroke"/>`
      + [-16, -8, 0, 8, 16].map(v => `<path d="M${cx - 12.4 + Math.abs(v) * .2} ${cy + v}h${f(24.8 - Math.abs(v) * .4)}" stroke="rgba(232,69,58,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`).join('')
      + `<text class="sign" x="${cx}" y="${cy - 6}" font-size="11" text-anchor="middle" fill="rgba(232,69,58,.2)" stroke="${lc}" stroke-width=".5" vector-effect="non-scaling-stroke">お</text><text class="sign" x="${cx}" y="${cy + 8}" font-size="11" text-anchor="middle" fill="rgba(232,69,58,.2)" stroke="${lc}" stroke-width=".5" vector-effect="non-scaling-stroke">でん</text>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/>${lantern(42, 92)}
      <path d="M42 56v6" stroke="#1a1414" stroke-width="1"/>
      <text class="sign" x="42" y="150" font-size="12" text-anchor="middle" fill="rgba(232,134,42,.14)" stroke="rgba(232,134,42,.5)" stroke-width=".5" vector-effect="non-scaling-stroke">あつあつ</text>
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(232,134,42,.1)" stroke="${oc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${oc}">一品 ¥100〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/><g class="iso-only">${lantern(42, 96)}
      <text class="label" x="42" y="150" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(232,134,42,.6)">ODEN · SIMMERING 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 5.6 + k * 14.6, y = 24, fs = Math.min(2.4, 12.4 / (p.jp || p.name).length);
      return R3(x, y, 13.8, 30, 1, `<rect class="od-tglow nohit" x="${x}" y="${y}" width="13.8" height="30" rx="2" fill="${oc}" opacity="0"/><g transform="translate(${x + .6} ${y + 1.6}) scale(.52)">${icon(p.g)}</g>
        <text x="${x + 6.9}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 6.9}" y="${y + 25.2}" font-size="2.4" text-anchor="middle" class="label od-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 4}" y="${y + 27.4}" width="5.8" height="1.1" rx=".5"/><text class="soldout" x="${x + 6.9}" y="${y + 12}" font-size="3.2" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit od-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the door's grid: the banner down the left; on the right, centred on x 66 (where the pot shows: u 43–89, v 94–126),
    // the だし自慢 board, the round sight glass on the pot, a plate under it
    const WC = [66, 108, 22];   // the sight glass: centre and radius (door units)
    const hole = `M${WC[0] - WC[2]} ${WC[1]}a${WC[2]} ${WC[2]} 0 1 0 ${WC[2] * 2} 0a${WC[2]} ${WC[2]} 0 1 0 ${-WC[2] * 2} 0Z`;
    const banner = `<path d="M9 64h24" stroke="#5a3a1a" stroke-width="2" stroke-linecap="round"/><path d="M11 65h20v98l-10-5-10 5z" fill="#c8402a" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + ['お', 'で', 'ん'].map((c, i) => `<text class="od-noren" x="21" y="${86 + i * 17}" font-size="13" text-anchor="middle">${c}</text>`).join('')
      + `<path d="M14 138h14" stroke="rgba(255,255,255,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/><text class="od-noren" x="21" y="146" font-size="3.6" text-anchor="middle">あつあつ</text>`
      + `<rect x="40" y="64" width="52" height="16" rx="2" class="od-board"/><text class="od-boardt" x="66" y="74.4" font-size="5.4" text-anchor="middle">だし自慢</text>`
      + `<rect x="44" y="136" width="44" height="9" rx="1.5" class="od-board"/><text class="od-boardt" x="66" y="141.9" font-size="3" text-anchor="middle">二個入り · からし付き</text>`;
    // the sight glass's ring: steel with eight bolts
    const ring = `<circle cx="${WC[0]}" cy="${WC[1]}" r="${WC[2] + 2.4}" fill="none" stroke="#8a93a4" stroke-width="3.2" vector-effect="non-scaling-stroke"/><circle cx="${WC[0]}" cy="${WC[1]}" r="${WC[2] + .5}" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`
      + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4 + Math.PI / 8; return `<circle cx="${f(WC[0] + (WC[2] + 2.4) * Math.cos(a))}" cy="${f(WC[1] + (WC[2] + 2.4) * Math.sin(a))}" r=".8" fill="#dfe5ec"/>`; }).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0Z${hole}" fill-rule="evenodd"/>
      ${[4, 42, 80].map(x => `<path d="M${x} 3h36v15q-9 2-18 0t-18 0z" fill="${nv}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('')}
      <text class="od-noren" x="22" y="13.4" font-size="5.6" text-anchor="middle">あつあつ</text><text class="od-noren" x="60" y="13.8" font-size="7" text-anchor="middle">おでん</text><text class="od-noren" x="98" y="13.4" font-size="5.6" text-anchor="middle">ぐつぐつ</text>
      <rect x="5" y="22" width="88" height="34" rx="2" class="od-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#ffd27a">おしながき · OSHINAGAKI</text>
      ${banner}<circle class="dglass nohit" cx="${WC[0]}" cy="${WC[1]}" r="${WC[2]}"/><path class="nohit" d="M50 98a19 19 0 0 1 12-9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".14"/>${ring}
      ${lv.miso ? `<g class="nohit" transform="translate(50 157) rotate(-8)"><circle r="7.2" fill="#7a3a12" stroke="#fff4dc" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-.4" font-size="3.6" text-anchor="middle" class="sign" fill="#fff">味噌</text><text y="3.4" font-size="2.2" text-anchor="middle" class="sign" fill="#ffd27a">おでん</text><text y="5.7" font-size="1.3" text-anchor="middle" class="label" fill="#fff4dc">はじめました</text></g>` : ''}
      ${lv.refill ? `<g class="nohit" transform="translate(63 151) rotate(4)"><rect width="18" height="7" rx="1" fill="#e8fff0" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><circle cx="3" cy="3.5" r="1.6" fill="#3fd47a"/><text x="10.5" y="4.6" font-size="2.7" text-anchor="middle" class="sign" fill="#1a6a3a">自動給湯</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="od-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 60, 20, 14, .8, `<text class="label" x="105" y="64.4" font-size="2.2" text-anchor="middle">だし</text><rect x="98" y="66.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="od-gauge" x="98.4" y="66.8" width="13.2" height="2.6" rx=".8" fill="#d8a040"/>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${R3(95, 91, 20, 8, .8, `<text class="lit-text od-lowlamp" style="--lc:#ff6a3a" x="105" y="96.4" font-size="3" text-anchor="middle">だし少</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="od-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text od-ready" style="--lc:${oc}" x="60" y="190.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      ${lv.basket2 ? R3(8, 186, 19, 5.5, .8, `<text class="lit-text od-b2lamp" style="--lc:#3fd4ff" x="17.5" y="190.4" font-size="3" text-anchor="middle">二番かご</text>`, { r: 1.5, capCls: 'readycap' }) : ''}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${nv}" opacity=".92"/><text class="od-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="od-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0Z${hole}" fill-rule="evenodd" style="fill:#101318"/><circle class="dglass nohit" cx="${WC[0]}" cy="${WC[1]}" r="${WC[2]}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'od-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'od-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.od-tile')], slotGlow: door.querySelector('.od-slotglow'),
      lcd: door.querySelector('.od-lcd'), gauge: door.querySelector('.od-gauge'), lowLamp: door.querySelector('.od-lowlamp'), ready: door.querySelector('.od-ready'), flap: door.querySelector('.od-flap'), windowG,
      b2Lamp: door.querySelector('.od-b2lamp') };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><circle class="xline" cx="66" cy="108" r="22"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, pot, potFront, hub, dividers, slotPos, basket, cup, carriage, stream, steam, piece, icon, troughPts, TANK, MISO, PIECE };
})();
