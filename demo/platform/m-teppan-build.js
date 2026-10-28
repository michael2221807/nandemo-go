/* たこ焼き「てっぱん丸」— geometry (the app's own machine, 2026-10-24; built like the bakery: one station per step,
   no robot arm, the door frames the griddle).
   A cast-iron griddle with three rows of six dimples sits over its gas burner on the left. A carriage rides on two
   rails over it, front to back: on its front a bar of six steel picks (two air cylinders lower it), behind that the
   batter manifold (six nozzles), at its back the octopus feeder (six outlets). Every row cooks on its own: batter,
   octopus, turned with the picks, golden. An order takes the front-most ready row: the picks go down into it, turn the
   six balls once more and lift them out over a paper boat waiting on the narrow belt in front of the griddle; the
   carriage pours that row again on its way back.
   The belt then carries the boat right: under the sauce carousel (four upside-down squeeze bottles; the chosen one
   turns to the front), under the mayonnaise nozzle, the green-laver shaker and the bonito-flake hopper (the flakes
   move in the heat); the boat is a clear pack whose lid stands open at its back, and at the right end a guide bar
   folds it shut as it passes; down the slide to the take-out window.
   The flaw: a row takes COOK of real time; sell faster than three rows can cook and the line waits (焼き中).
   Where a world point shows on the door: u = x − y + 84, v = 156 + y − z (as on the prototype's machines). */
const TP = (() => {
  const W = 120, D = 84, H = 240;
  // the griddle: nx × ny dimples at pitch p, a margin m round them, its top at z (a ball's radius r)
  const PL = { x0: 10, y0: 48, nx: 6, ny: 3, p: 5.2, m: 2.2, z: 140, r: 2.15 };
  PL.x1 = PL.x0 + PL.nx * PL.p + 2 * PL.m; PL.y1 = PL.y0 + PL.ny * PL.p + 2 * PL.m;
  const CX = i => PL.x0 + PL.m + PL.p * (i + .5), CY = j => PL.y0 + PL.m + PL.p * (j + .5);
  // the boat belt in front of it (left to right), its top at z; the stations by x along it
  const LINE = { x0: 3, x1: 90, y0: 71, y1: 79, z: 132 };
  const LY = (LINE.y0 + LINE.y1) / 2;
  const STACK = 9.6, RECV = (PL.x0 + PL.x1) / 2, SAUCE = 55, MAYO = 61.8, NORI = 65.6, NEGI = 69.4, KATSU = 74, LID = 83, BK = .86;
  // the carriage: rails along y (at x xa and xb, their tops at z) from y0 to y1; its tools by y from its front: the
  // picks (0), the nozzles (−NOZ), the feeder (−FEED); at rest its picks are at y rest
  const CAR = { z: 170, y0: 34, y1: 81, xa: PL.x0 - 4.4, xb: PL.x1 + 2, rest: 45, NOZ: 4.2, FEED: 8.4, bar: 157 };
  // the frame the stations hang from: two posts at the back, arms forward, a front beam over the belt
  const FR = { xa: 50.6, xb: 86, y: 42, t: 2.4, z: 170, yf: 73 };
  const CAR4 = { x: SAUCE, y: LY - 3.4, r: 3.4, z: 151 };   // the carousel's centre (its front bottle over the belt)
  const WINDOW = [60, 79, 25];
  // the upper deck (the upgrades): a shelf at the back right, over what was empty, with a belt along its front. Left to
  // right on it: the pack magazine, the okonomiyaki griddle, the yakisoba griddle, the ikayaki press; at the belt's
  // right end the lift, which takes a pack down to the chute to the window. Each griddle has a gantry over it with a
  // turret of four tools (the active one at the front, over the food), two spatulas on a rail (okonomiyaki, yakisoba)
  // and a pusher at its back that pushes the food forward off the plate into the pack waiting on the belt
  const DECK = { x0: 51, x1: 106.4, y0: 2, y1: 41, z: 180 };   // its top at z
  const DB = { x0: 52, x1: 106.4, y0: 29.8, y1: 40.6, z: 182.4 }, DBY = (DB.y0 + DB.y1) / 2;
  const MAG = 57.8;
  const STN = { okono: { x0: 64, x1: 79, tools: ['hopper', 'brush', 'mayo', 'shaker'] }, soba: { x0: 80, x1: 95, tools: ['noodle', 'sauce', 'egg', 'shaker'] },
    ika: { x0: 96, x1: 105.6, tools: ['batter', 'squid', 'egg', 'brush'] } };
  Object.values(STN).forEach(st => { st.cx = (st.x0 + st.x1) / 2; });
  const SY0 = 10, SY1 = 28, SZ = 186, SCY = 19;   // the plates' y, their top; the food's centre
  const LIFT = { x0: 106.4, x1: 119.4, zb: 60 };
  const PACK = { l: 6, w: 5.2, h: 2 };   // the deck's pack (half its length, half its width, its height)
  // the starting menu (overwritten by the goods plan): the sauce, mayonnaise or not, the topping
  const MENU = [
    { name: 'ソースたこ焼き', jp: 'ソース', price: 300, g: 'sauce', sauce: '#4a2210', sw: 1.1, mayo: 1, top: 'nori', tier: 1 },
    { name: 'ねぎポン', price: 320, g: 'negipon', sauce: '#c89a3a', sw: .8, mayo: 0, top: 'negi', tier: 1 },
    { name: 'てりマヨ', price: 320, g: 'terimayo', sauce: '#a8501c', sw: .9, mayo: 1, top: 'nori', tier: 1 },
    { name: '明太マヨ', price: 340, g: 'mentai', sauce: '#ffa898', sw: .9, mayo: 0, top: 'nori', tier: 1 },
  ];
  // the batter: [in the dimple, set, golden, dark]
  const BATTER = ['#f6e6b4', '#ecc87a', '#d8903a', '#a85a22'];
  return { W, D, H, PL, CX, CY, LINE, LY, STACK, RECV, SAUCE, MAYO, NORI, NEGI, KATSU, LID, BK, CAR, FR, CAR4, WINDOW, MENU, BATTER, SLOTW: [105, D, 196], DECK, DB, DBY, MAG, STN, SY0, SY1, SZ, SCY, LIFT, PACK };
})();

const TPB = (() => {
  const { FRONT, TOP: TOPP, box, P, f } = ISO;
  const { W, D, H, PL, CX, CY, LINE, LY, STACK, RECV, SAUCE, MAYO, NORI, NEGI, KATSU, LID, BK, CAR, FR, CAR4, MENU, BATTER, DECK, DB, DBY, MAG, STN, SY0, SY1, SZ, SCY, LIFT, PACK } = TP;
  const { hull, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ringE = (z, rx, ry, x, y, n = 18) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(x + rx * Math.cos(t), y + ry * Math.sin(t), z); });
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringE(z0, r0, r0, x, y, n), ...ringE(z1, r1, r1, x, y, n)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, extra = '') => `<path d="${toD(ringE(z, r, r, x, y, n))}" style="fill:${fill};${ST}"${extra}/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const poly = (pts, attrs) => `<path d="M${pts.map(p => q(...p).join(' ')).join('L')}" ${attrs}/>`;
  const mix = (a, b, t) => { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = h(a), B = h(b); t = Math.max(0, Math.min(1, t));
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const ringX = (cx, cy, cz, r, n = 14) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(cx, cy + r * Math.cos(t), cz + r * Math.sin(t)); });
  const cylX = (x0, x1, y, z, r, fill) => `<path d="${toD(hull([...ringX(x0, y, z, r), ...ringX(x1, y, z, r)]))}" style="fill:${fill};${ST}"/>`;

  /* ---------- a ball: c, how far it has cooked (0 batter in the dimple … 1 golden); a, its turn (the seam's angle) ---------- */
  // (a sphere's outline: the hull of rings up its height)
  const sphereD = (x, y, z, r) => toD(hull([.25, .7, 1.1, 1.57, 2.05, 2.45, 2.9].flatMap(t => ringE(z + r * (1 - Math.cos(t)), r * Math.sin(t), r * Math.sin(t), x, y, 12)).concat([P(x, y, z), P(x, y, z + 2 * r)])));
  const ballColour = c => c < .55 ? mix(BATTER[0], BATTER[1], (c - .3) / .25) : mix(BATTER[1], BATTER[2], (c - .55) / .45);
  // a ball sitting with its bottom at z (k: its size)
  function ball(x, y, z, c = 1, a = 0, k = 1) {
    const r = PL.r * k, col = ballColour(c), line = mix(col, '#3a1a08', .5);
    let s = `<path d="${sphereD(x, y, z, r)}" fill="${col}" stroke="${line}" stroke-width=".55" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
    // the side still pale (turned a quarter, the raw side shows round its seam), the seam where the batter skirt was
    if (c < .75) s += `<path d="${toD(ringE(z + r * 1.05, r * .78, r * .78, x - r * .2, y + r * .25, 12))}" fill="${BATTER[0]}" opacity="${f(Math.max(0, (.75 - c) / .45))}"/>`;
    const sa = Math.cos(a), sb = Math.sin(a);
    s += `<path d="${toD(Array.from({ length: 16 }, (_, i) => { const t = i / 16 * Math.PI * 2; return P(x + r * .98 * Math.cos(t) * sa, y + r * .98 * Math.sin(t), z + r + r * .98 * Math.cos(t) * sb); }))}" fill="none" stroke="${mix(col, '#5a2a08', .35)}" stroke-width=".35" opacity=".7"/>`;
    s += `<path d="${toD(ringE(z + r * 1.62, r * .38, r * .3, x - r * .3, y - r * .22, 10))}" fill="#fff" opacity="${f(.12 + .2 * c)}"/>`;
    return s;
  }
  // a dimple: batter (c below .3) filling it with the octopus in it; set, a ball; empty, the oiled iron
  function dimple(x, y, c, a = 0, oct = true) {
    const z = PL.z, r = PL.r;
    if (c == null) return disc(x, y, z + .02, r * 1.02, '#14100e', 16) + `<path d="${toD(ringE(z + .03, r * .6, r * .4, x - r * .25, y - r * .2, 10))}" fill="#3a3230" opacity=".7"/>`;
    if (c < .3) { const t = c / .3;
      return disc(x, y, z + .02, r * 1.02, '#14100e', 16) + `<path d="${toD(ringE(z + .2 + .9 * t, r * (1.08 + .1 * t), r * (1.08 + .1 * t), x, y, 16))}" fill="${mix(BATTER[0], '#efd294', t)}" stroke="rgba(120,80,20,.45)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`
        + (oct ? (() => { const [a1, b1] = q(x + .4, y - .3, z + .6 + .9 * t); return `<rect x="${f(+a1 - .7)}" y="${f(+b1 - .5)}" width="1.4" height="1" rx=".3" fill="#c8303a" opacity="${f(1 - .6 * t)}"/>`; })() : ''); }
    return disc(x, y, z + .02, r * 1.02, '#14100e', 16) + ball(x, y, z - r * .7, c, a);
  }
  // the batter skirt over a row while it is liquid (it runs over between the dimples, as on a real griddle)
  const skirt = (j, c) => { if (c == null || c >= .3) return ''; const y = CY(j), t = c / .3;
    return `<path d="${toD([P(PL.x0 + 1, y - PL.p * .5, PL.z + .05), P(PL.x1 - 1, y - PL.p * .5, PL.z + .05), P(PL.x1 - 1, y + PL.p * .5, PL.z + .05), P(PL.x0 + 1, y + PL.p * .5, PL.z + .05)])}" fill="${mix(BATTER[0], BATTER[1], t)}" opacity="${f(.85 - .5 * t)}"/>`; };
  // the griddle's balls: rows of cook levels (null: empty), turn angles
  // (noOct: a row poured but not fed yet)
  function griddle(rows, turns = [], noOct = -1) {
    let s = '';
    for (let j = 0; j < PL.ny; j++) { s += skirt(j, rows[j]); for (let i = 0; i < PL.nx; i++) s += dimple(CX(i), CY(j), rows[j], turns[j] || 0, j !== noOct); }
    return s;
  }

  /* ---------- the boat: a paper tray (経木 colour), six balls, what is on them ---------- */
  // o = { n: balls in it, sauce: colour or null (s: 0..1, how much of the zigzag is on), mayo (m 0..1), top: nori /
  // negi / lemon / cheese / mentai (t 0..1), katsu (flakes 0..1, ph their wave), lid (0 open … 1 shut) }
  const BOAT = { l: 6.8, w: 3.6, h: 1.9 }, BOAT_W = 3.6 * 1.08;
  const BALLS = [[-3.6, -1.65], [0, -1.65], [3.6, -1.65], [-3.6, 1.65], [0, 1.65], [3.6, 1.65]];
  const hex = (x, y, z, l, w) => [[x - l, y, z], [x - l + 2.2, y - w, z], [x + l - 2.2, y - w, z], [x + l, y, z], [x + l - 2.2, y + w, z], [x - l + 2.2, y + w, z]];
  function boat(x, y, z, o = {}, k = 1) {
    const { l, w, h } = BOAT, L = l * k, Wd = w * k, Hh = h * k;
    let s = `<path d="${toD(hull([...hex(x, y, z, L * .86, Wd * .8), ...hex(x, y, z + Hh, L, Wd)].map(p => P(...p))))}" fill="#e2c890" stroke="#7a5a2a" stroke-width=".55" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`
      + `<path d="${toD(hex(x, y, z + Hh, L * .9, Wd * .84).map(p => P(...p)))}" fill="#c8a86a" stroke="#9a7a42" stroke-width=".35" vector-effect="non-scaling-stroke"/>`
      + [-.45, 0, .45].map(t => seg([x + t * L, y + Wd * .9, z + Hh * .5], [x + t * L + L * .2, y + Wd * .92, z + Hh * .5], '#b8945a', .3)).join('');
    const n = o.n ?? 6, zb = z + .5 * k;
    // the back row first
    BALLS.slice(0, n).forEach(([u, v], i) => { s += ball(x + u * k, y + v * k, zb - (i >= 3 ? .1 : 0), 1, .4 + i, .82 * k); });
    if (!n) return s + lid(x, y, z + (o.lz || 0), o.lid, k);
    const zt = zb + PL.r * .82 * k * 2 - .1;   // the balls' tops
    if (o.sauce && (o.s ?? 1) > 0) s += zig(x, y, zt + .1, o.sauce, o.s ?? 1, o.sw || 1.1, 5, k, .95);
    if (o.top === 'cheese' && (o.t ?? 1) > 0) s += BALLS.slice(0, n).map(([u, v], i) => `<path d="${toD(ringE(zt + .12, 1.2 * k, 1 * k, x + u * k, y + v * k, 10))}" fill="#f6d050" stroke="#c89a20" stroke-width=".3" opacity="${f(Math.min(1, (o.t ?? 1) * 1.6))}"/>`).join('');
    if (o.mayo && (o.m ?? 1) > 0) s += zig(x, y, zt + .2, o.top === 'mentai' ? '#ffb0a0' : '#fffaf0', o.m ?? 1, .55, 7, k, .9);
    const tp = o.t ?? 1;
    if (o.top === 'nori' && tp > 0) s += dots(x, y, zt + .25, k, Math.round(22 * tp), '#3a7a2a', .5);
    if (o.top === 'negi' && tp > 0) s += BALLS.slice(0, Math.round(n * Math.min(1, tp * 1.2))).map(([u, v], i) => { const [a, b] = q(x + u * k + .2, y + v * k - .1, zt + .3);
      return `<circle cx="${a}" cy="${b}" r="${f(.55 * k)}" fill="#bfe08a" stroke="#4a8a2a" stroke-width=".35"/><circle cx="${f(+a + 1.1 * k)}" cy="${f(+b - .3 * k)}" r="${f(.45 * k)}" fill="#d8f0a8" stroke="#4a8a2a" stroke-width=".3"/>`; }).join('');
    if (o.top === 'lemon' && tp > 0) { const [a, b] = q(x + 1.8 * k, y, zt + .4); s += dots(x, y, zt + .25, k, Math.round(14 * tp), '#ffffff', .4)
      + `<g opacity="${f(Math.min(1, tp * 2))}"><circle cx="${a}" cy="${b}" r="${f(1.6 * k)}" fill="#f6e04a" stroke="#c8a81a" stroke-width=".35"/><path d="M${a} ${f(+b - 1.3 * k)}V${f(+b + 1.3 * k)}M${f(+a - 1.3 * k)} ${b}H${f(+a + 1.3 * k)}" stroke="#fff8c0" stroke-width=".3"/></g>`; }
    if (o.top === 'mentai' && tp > 0) s += dots(x, y, zt + .25, k, Math.round(16 * tp), '#e8604a', .45);
    if (o.g === 'ootako') [[-3.6, -1.65], [3.6, 1.65]].forEach(([u, v]) => { const a = [x + u * k, y + v * k, zt - .2], b = [x + u * k + 1.2 * k, y + v * k - .4 * k, zt + 1.4 * k], c = [x + u * k + 2.2 * k, y + v * k, zt + 1 * k];
      s += `<path d="M${q(...a).join(' ')}Q${q(...b).join(' ')} ${q(...c).join(' ')}" fill="none" stroke="#7a1a10" stroke-width="${f(1.3 * k)}" stroke-linecap="round"/><path d="M${q(...a).join(' ')}Q${q(...b).join(' ')} ${q(...c).join(' ')}" fill="none" stroke="#d8483a" stroke-width="${f(.8 * k)}" stroke-linecap="round"/>`; });
    if (o.top === 'gold' && tp > 0) s += dots(x, y, zt + .25, k, Math.round(18 * tp), '#ffd23f', .6);
    if ((o.katsu ?? 0) > 0) s += flakes(x, y, zt + .3, k, o.katsu, o.ph || 0);
    return s + lid(x, y, z + (o.lz || 0), o.lid, k);
  }
  // a zigzag across the boat (back and forth along y as it goes along x), drawn up to e of its length
  function zig(x, y, z, c, e, w, n, k, amp) {
    const L = BOAT.l * k * .78, pts = Array.from({ length: n * 2 + 1 }, (_, i) => [x - L + 2 * L * i / (n * 2), y + (i % 2 ? 1 : -1) * BOAT.w * k * amp * .62, z + (i % 2 ? 0 : .15)]);
    const m = Math.max(1, Math.round(pts.length * e)), ps = pts.slice(0, m + 1).map(p => q(...p).join(' '));
    if (ps.length < 2) return '';
    return `<path d="M${ps.join('L')}" fill="none" stroke="${mix(c, '#000000', .35)}" stroke-width="${f((w + .35) * k)}" stroke-linecap="round" stroke-linejoin="round"/><path d="M${ps.join('L')}" fill="none" stroke="${c}" stroke-width="${f(w * k)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const dots = (x, y, z, k, n, c, r) => Array.from({ length: n }, (_, i) => { const u = ((i * 37) % 23) / 23 * 2 - 1, v = ((i * 59) % 17) / 17 * 2 - 1, [a, b] = q(x + u * BOAT.l * .78 * k, y + v * BOAT.w * .7 * k, z);
    return `<rect x="${f(+a - r / 2)}" y="${f(+b - r / 2)}" width="${r}" height="${r}" fill="${c}"/>`; }).join('');
  // the bonito flakes: thin curled shavings, standing up and moving in the heat (ph)
  function flakes(x, y, z, k, e, ph) {
    let s = '';
    const n = Math.round(9 * e);
    for (let i = 0; i < n; i++) { const u = ((i * 41) % 19) / 19 * 2 - 1, v = ((i * 29) % 13) / 13 * 2 - 1, [a, b] = q(x + u * BOAT.l * .7 * k, y + v * BOAT.w * .6 * k, z), w = Math.sin(ph * 6 + i * 1.7);
      s += `<path d="M${a} ${b}q${f(.8 * k + .5 * w)} ${f(-1.2 * k)} ${f(.2 * k + w * .7)} ${f(-2.2 * k)}q${f(-.6 * k)} ${f(.9 * k)} ${f(-.9 * k - w * .3)} ${f(.6 * k)}z" fill="#e8c8a0" stroke="#9a6a3a" stroke-width=".3"/>`; }
    return s;
  }
  // the clear lid: hinged at the boat's back edge, open (0) standing up, shut (1) over the balls
  function lid(x, y, z, e, k = 1) {
    if (e == null) return '';
    const L = BOAT.l * k * 1.04, Wd = BOAT.w * k * 1.08, hz = z + BOAT.h * k, th = (1 - e) * Math.PI / 2 * 1.05, hy = y - Wd, dome = 3.4 * k;
    // (a point of the shut lid at depth dy from the hinge and height dz above the rim, turned up by th about the hinge)
    const R = (xx, dy, dz) => P(xx, hy + dy * Math.cos(th) - dz * Math.sin(th), hz + dy * Math.sin(th) + dz * Math.cos(th));
    const rim = [[-L, Wd], [-L + 2.2, 0], [L - 2.2, 0], [L, Wd], [L - 2.2, 2 * Wd], [-L + 2.2, 2 * Wd]];
    const pts = [...rim.map(([u, v]) => R(x + u, v, 0)), ...rim.map(([u, v]) => R(x + u * .82, Wd + (v - Wd) * .78, dome))];
    return `<path d="${toD(hull(pts))}" class="tp-lid"/><path d="${toD(rim.map(([u, v]) => R(x + u * .82, Wd + (v - Wd) * .78, dome)))}" class="tp-lidtop"/>`;
  }

  /* ---------- the menu tiles and the shop (24 × 24): the boat side on, three balls, what is on them ---------- */
  // the deck's goods: okonomiyaki on its tray, yakisoba heaped in its pack, ikayaki folded in its paper
  function iconDeck(g) {
    const ink = '#141018', k = `stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"`, thin = `stroke="${ink}" stroke-width=".8" stroke-linejoin="round"`, sc = g.sauce || '#4a2210';
    let s = '';
    if (g.kind === 'okono') {
      if (g.top === 'tonpei') s += `<path d="M4 13.6Q4 7.6 12 7.6Q20 7.6 20 13.6Z" fill="#f2c03a" ${k}/><path d="M6 11.4Q12 8.6 18 11.4" fill="none" stroke="${sc}" stroke-width="1.6" stroke-linecap="round"/>`;
      else s += `<path d="M2.6 13.4Q2.6 9 12 9Q21.4 9 21.4 13.4Z" fill="#c8782a" ${k}/><path d="M4.2 11.6Q4.6 9.8 12 9.8Q19.4 9.8 19.8 11.6Q12 12.8 4.2 11.6Z" fill="${sc}"/>`;
      if (g.mayo) s += `<path d="M6 11.6l2-1.8M9.4 12l2.4-2.2M13 12l2.4-2.2M16.6 11.6l2-1.6" stroke="#fffaf0" stroke-width=".7" stroke-linecap="round"/>`;
      if (g.top === 'negi') s += [[6, 10.4], [9, 9.8], [12.4, 10.2], [15.4, 9.8], [18, 10.6]].map(([x, y]) => `<rect x="${x}" y="${y}" width="1.9" height=".9" rx=".35" fill="#8ad05a" stroke="#2a6a1a" stroke-width=".4"/>`).join('');
      if (g.top === 'mix' || g.top === 'kaisen') s += `<path d="M7.4 10.6q1.2-1.8 2.6 0M14 10.4q1.2-1.8 2.6 0" fill="none" stroke="#ff7a5a" stroke-width="1.1" stroke-linecap="round"/>` + (g.top === 'kaisen' ? `<circle cx="12" cy="10.4" r="1" fill="none" stroke="#fff" stroke-width=".7"/>` : '');
      if (g.nori) s += [[7, 10.8], [10.6, 10.2], [14.4, 10.6], [17.4, 11]].map(([x, y]) => `<rect x="${x}" y="${y}" width=".8" height=".8" fill="#2a6a1a"/>`).join('');
      if (g.katsu) s += `<path d="M9.6 10.2q1.2-1.6.4-3.2q-1 .8-.9 2zM13.8 10q1.3-1.4.8-3.2q-1.1.7-1.2 2z" fill="#f2d6aa" stroke="#9a6a3a" stroke-width=".5"/>`;
      s += `<path d="M1.6 13.6H22.4L20.8 19H3.2Z" fill="#e2c890" ${k}/><path d="M4.6 16.4H19.4" stroke="#b8945a" stroke-width=".6"/>`;
    } else if (g.kind === 'soba') {
      s += `<path d="M3.4 14Q4 7 12 7Q20 7 20.6 14Z" fill="${g.top === 'omu' ? '#f6d050' : sc}" ${k}/>`;
      if (g.top === 'omu') s += `<path d="M6 11.4l2.2-1.6 2.2 1.6 2.2-1.6 2.2 1.6 2.2-1.6 2.2 1.4" fill="none" stroke="#8a2a10" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>`;
      else s += [10, 12, 13.4].map((y, i) => `<path d="M${5 + i} ${y}q2-1.6 3.6 0t3.6 0t3.6 0" fill="none" stroke="${mix(sc, '#ffffff', .35)}" stroke-width=".8" stroke-linecap="round"/>`).join('');
      if (g.beni) s += `<path d="M14.6 8.6h2.2M15 9.6h2" stroke="#e8304a" stroke-width=".8" stroke-linecap="round"/>`;
      if (g.nori) s += [[7.6, 9], [10, 8.4], [12.4, 9.2]].map(([x, y]) => `<rect x="${x}" y="${y}" width=".8" height=".8" fill="#2a6a1a"/>`).join('');
      s += `<path d="M2 13.6H22L20.6 19.2H3.4Z" fill="#f2efe8" ${k}/><path d="M2.6 13.6H21.4" stroke="#b8c4d0" stroke-width=".6"/>`;
    } else {
      s += `<path d="M4 15.4A8 8 0 0 1 20 15.4Z" fill="#e0a858" ${k}/><path d="M6.4 13Q12 9.4 17.6 13" fill="none" stroke="${sc}" stroke-width="1.6" stroke-linecap="round"/>`
        + [[8.4, 12.6], [12, 10.8], [15.4, 12.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="#b8742a"/>`).join('');
      if (g.egg) s += `<circle cx="12" cy="13.8" r="1.6" fill="#ffb020" ${thin}/>`;
      s += `<path d="M3 14.6H21L19.6 20H4.4Z" fill="#f4efe4" ${k}/><path d="M6 17.2H18" stroke="#c8303a" stroke-width=".8"/>`;
    }
    return `<g transform="translate(0 .2)">${s}</g>`;
  }
  function icon(g) {
    if (g.kind && g.kind !== 'tako') return iconDeck(g);
    const ink = '#141018', k = `stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"`, thin = `stroke="${ink}" stroke-width=".8" stroke-linejoin="round"`;
    const gold = g.g === 'gold' || g.id === 'gold';
    const bc = gold ? '#e8b030' : BATTER[2];
    let s = [6.4, 12, 17.6].map(x => `<circle cx="${x}" cy="12.6" r="3.5" fill="${bc}" ${k}/><path d="M${x - 1.8} 11.2q1.2-1.1 2.6-.8" fill="none" stroke="#f6d090" stroke-width=".8" stroke-linecap="round"/>`).join('');
    if (g.sauce) s += `<path d="M3.6 11.8Q6.4 9 9.2 11.4Q12 9 14.8 11.4Q17.6 9 20.4 11.8" fill="none" stroke="${ink}" stroke-width="2.7" stroke-linecap="round"/><path d="M3.6 11.8Q6.4 9 9.2 11.4Q12 9 14.8 11.4Q17.6 9 20.4 11.8" fill="none" stroke="${g.sauce}" stroke-width="1.7" stroke-linecap="round"/>`;
    if (g.top === 'cheese') s += `<path d="M3.4 10.6Q6.4 8.2 9 10.4Q12 8.2 15 10.4Q17.6 8.2 20.6 10.6L20 12.6Q17.6 11.6 15.6 13.4Q12 11.4 8.4 13.4Q6.4 11.6 4 12.6Z" fill="#f6d050" ${thin}/>`;
    if (g.mayo) s += `<path d="M4.6 10.4l2.4-1.6 2.2 1.6 2.6-1.8 2.4 1.8 2.6-1.8 2.4 1.6" fill="none" stroke="${g.top === 'mentai' ? '#ffb0a0' : '#fffaf0'}" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (g.top === 'nori') s += [[6, 9.6], [9.4, 8.8], [13, 9], [16.4, 8.8], [18.6, 10]].map(([x, y]) => `<rect x="${x}" y="${y}" width=".9" height=".9" fill="#2a6a1a"/>`).join('');
    if (g.top === 'negi') s += [[6.4, 8.8], [10, 8], [13.6, 8.4], [17.2, 8.8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#bfe08a" ${thin}/>`).join('');
    if (g.top === 'mentai') s += [[7, 9.2], [11, 8.6], [15, 8.8], [18, 9.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6" fill="#e8604a"/>`).join('');
    if (g.top === 'lemon') s += `<circle cx="16.6" cy="8.6" r="2.4" fill="#f6e04a" ${thin}/><path d="M16.6 6.8v3.6M14.8 8.6h3.6" stroke="#fff8c0" stroke-width=".5"/>` + [[6.4, 9.6], [9.6, 9], [12.2, 9.4]].map(([x, y]) => `<rect x="${x}" y="${y}" width=".8" height=".8" fill="#fff"/>`).join('');
    // the bonito flakes: pale curled shavings, a brown edge (an ink outline makes them read as leaves)
    if (g.katsu !== false && (g.top === 'nori' || g.top === 'cheese' || gold)) s += `<path d="M7.4 9.4q2-.6 2.4-3q-1.8.2-2.6 1.4q-.6 .9 .2 1.6zM12.6 8.8q2.2-.2 3-2.6q-1.9-.1-2.8 1q-.7 .8-.2 1.6z" fill="#f2d6aa" stroke="#9a6a3a" stroke-width=".5" stroke-linejoin="round"/>`;
    if (gold) s += `<path d="M19.6 2.6l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#fff4a0" ${thin}/>`;
    // 大だこ: a piece of tentacle too big for the ball, curling out of it
    if (g.g === 'ootako' || g.id === 'ootako') s += `<path d="M15.6 9.6q.4-3.6 3.6-4.2q2 .1 1.6 1.8" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/><path d="M15.6 9.6q.4-3.6 3.6-4.2q2 .1 1.6 1.8" fill="none" stroke="#d8483a" stroke-width="1.6" stroke-linecap="round"/><circle cx="17" cy="6.6" r=".4" fill="#ffd0c8"/><circle cx="18.6" cy="5.8" r=".35" fill="#ffd0c8"/>`;
    // the boat in front of the balls
    s += `<path d="M1.8 14.4H22.2L20.2 19.2H3.8Z" fill="#e2c890" ${k}/><path d="M5 16.8H19" stroke="#b8945a" stroke-width=".6"/>`;
    return `<g transform="translate(0 .6)">${s}</g>`;
  }
  // the crate: a sauce bottle (in its colour), the batter tub
  function defs() {
    const pack = `<g id="g-tp-bottle">${box(-2.2, -2.2, 0, 4.4, 4.4, 8, 0, 'tp-bottle')}<g transform="${TOPP(-2.2, -2.2, 8.03)}"><rect x=".6" y=".6" width="3.2" height="3.2" rx="1.2" style="fill:var(--c)"/></g></g>`;
    const tub = `<g id="g-tp-batter"><path d="M-7 0l-1-11h16l-1 11z" fill="#e6eef6" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="0" cy="-11" rx="8" ry="2.2" fill="#f6e6b4" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-5" y="-8" width="10" height="4.4" rx="1" fill="#c8303a"/><text x="0" y="-4.8" font-size="3.2" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">生地</text></g>`;
    return pack + tub;
  }

  /* ---------- the belt ---------- */
  function belt(off) {
    const { x0, x1, y0, y1, z } = LINE;
    let s = box(x0, y0, z - 2.6, x1 - x0, y1 - y0, 2.6, 0, 'tp-belt');
    for (let x = x0 + ((off % 4) + 4) % 4; x < x1; x += 4) s += seg([x, y0 + .4, z + .02], [x, y1 - .4, z + .02], '#4a4e58', .45, 'butt');
    return s;
  }

  /* ---------- the carriage at y (its picks' line): the beam on the rails, the pick bar lowered by d (0 up … 1 into
     the dimples), what hangs on the picks (balls), the nozzles' streams (pour 0..1), the feeder's drops (feed 0..1) ---------- */
  const DROP = 8.6;   // how far the pick bar goes down
  function carriage(y, d = 0, o = {}) {
    const { xa, xb, z, NOZ, FEED, bar } = CAR, x0 = xa - .6, x1 = xb + 3, yb = y - FEED - 2.2, yf = y + 1.6;
    // the beam riding on the rails (its ends over them), the motor at its right end
    let s = box(x0, yb, z, x1 - x0, yf - yb, 3, 0, 'ty-steel') + box(x1 - 4.6, yb + 1, z + 3, 4.2, 5, 3.4, 0, 'ty-steel')
      + `<g transform="${FRONT(x1 - 4.2, yb + 6.05, z + 6)}"><rect width="3.4" height="2.4" rx=".4" fill="#1a1d22"/><circle cx="1" cy="1.2" r=".55" fill="${o.run ? '#5aff7a' : '#3a5a3a'}"/></g>`;
    // the octopus feeder at the back: a box under the beam, its window, six outlets
    const fy = y - FEED;
    s += box(CX(0) - 2.6, fy - 1.6, z - 6.6, CX(PL.nx - 1) - CX(0) + 5.2, 3.2, 6.6, 0, 'ty-steel')
      + `<g transform="${FRONT(CX(0) - 1.2, fy + 1.65, z - 1.4)}"><rect width="${f(CX(PL.nx - 1) - CX(0) + 2.4)}" height="3" rx=".6" fill="#1d2430"/>${Array.from({ length: 7 }, (_, i) => `<rect x="${f(1 + i * 4.3)}" y="1.2" width="1.6" height="1.1" rx=".3" fill="#c8303a"/>`).join('')}<text x="${f((CX(PL.nx - 1) - CX(0) + 2.4) / 2)}" y="-.6" font-size="1.7" text-anchor="middle" fill="#ffd27a" class="sign">たこ</text></g>`;
    for (let i = 0; i < PL.nx; i++) s += box(CX(i) - 1.1, fy - 1.1, z - 8.4, 2.2, 2.2, 1.8, 0, 'ty-steel pb-fine');
    if (o.feed != null) for (let i = 0; i < PL.nx; i++) { const zz = z - 8.4 - (z - 8.4 - PL.z - 1) * Math.min(1, o.feed * 1.4); if (o.feed < .8) { const [a, b] = q(CX(i), fy, zz); s += `<rect x="${f(+a - .7)}" y="${f(+b - .5)}" width="1.4" height="1" rx=".3" fill="#c8303a"/>`; } }
    // the batter manifold: two hangers, the pipe along x, six nozzles; their streams
    const ny = y - NOZ, mz = z - 8;
    s += box(CX(0) - 1.1, ny - 1.1, mz + 1, 2.2, 2.2, z - mz - 1, 0, 'ty-steel pb-fine') + box(CX(PL.nx - 1) - 1.1, ny - 1.1, mz + 1, 2.2, 2.2, z - mz - 1, 0, 'ty-steel pb-fine')
      + cylX(CX(0) - 2.4, CX(PL.nx - 1) + 2.4, ny, mz, 1.25, '#d9dee6');
    for (let i = 0; i < PL.nx; i++) s += cyl(CX(i), ny, mz - 3.4, mz - .6, .3, .95, '#aab3bf', 10);
    if (o.pour != null && o.pour < 1) for (let i = 0; i < PL.nx; i++) s += seg([CX(i), ny, mz - 3.4], [CX(i), ny, PL.z + .4], BATTER[0], .9) + seg([CX(i), ny, mz - 3.4], [CX(i), ny, PL.z + .4], 'rgba(255,255,255,.4)', .3);
    // the pick bar: two air cylinders at its ends (bodies on the beam, rods down to it), the bar, six picks
    const zb = bar - DROP * d;
    [PL.x0 - 1.4, PL.x1 + 1.4].forEach(cx => { s += cyl(cx, y, zb + 2.4, z, .6, .6, '#f4f6f8', 8) + cyl(cx, y, z - 7, z, 1.4, 1.4, '#d9dee6', 14) + cyl(cx, y, z - 5.6, z - 4.6, 1.45, 1.45, '#2a6ad9', 14); });
    s += box(PL.x0 - 3, y - 1.2, zb, PL.x1 - PL.x0 + 6, 2.4, 2.4, 0, 'ty-steel');
    for (let i = 0; i < PL.nx; i++) {
      const x = CX(i), tip = zb - 7.4;
      s += seg([x, y, zb], [x, y, tip], '#2a2e36', .95) + seg([x, y, zb], [x, y, tip], '#dfe5ec', .5) + disc(x, y, zb - .05, .6, '#8a93a4', 8);
      if (o.balls) s += ball(x, y + .1, tip - PL.r * .55, o.c ?? 1, o.a ?? 0);
    }
    return s;
  }
  // (still) the rails and their posts at the back, drawn before the griddle
  function rails() {
    const { xa, xb, z, y0, y1 } = CAR;
    let s = '';
    [xa, xb].forEach(x => { s += box(x, y0, 78, 2.6, 2.6, z - 78 - 2.4, 0, 'ty-steel') + box(x, y0, z - 2.4, 2.6, y1 - y0, 2.4, 0, 'ty-steel')
      // a brace under each rail from its post
      + `<path d="${toD([P(x + 1.3, y0 + 2.6, z - 2.4), P(x + 1.3, y0 + 14, z - 2.4), P(x + 1.3, y0 + 2.6, z - 13)])}" style="fill:#aab3bf;${ST}"/>`; });
    // the left rail's front end on a post of its own (in front of the belt); the right one bolts to the topper frame
    s += box(xa, y1 - 1, 78, 2.6, 2.6, z - 2.4 - 78, 0, 'ty-steel') + box(xa, y1 - .2, z - 2.4, 2.6, 1.8, 2.4, 0, 'ty-steel');
    return s + box(xa, y0, 120, xb - xa + 2.6, 2.6, 2.4, 0, 'ty-steel');
  }

  /* ---------- the griddle's body: the burner box on its legs, the iron plate, the gas panel ---------- */
  function griddleBody(fire) {
    const { x0, x1, y0, y1, z } = PL;
    let s = '';
    [[x0 + .6, y0 + .6], [x1 - 3, y0 + .6], [x0 + .6, y1 - 3], [x1 - 3, y1 - 3]].forEach(([x, y]) => { s += box(x, y, 78, 2.4, 2.4, z - 6 - 14 - 78, 0, 'ty-steel'); });
    s += box(x0 - .6, y0 - .6, z - 20, x1 - x0 + 1.2, y1 - y0 + 1.2, 14, 0, 'ty-steel')
      + `<g transform="${FRONT(x0 + 2, y1 + .65, z - 9)}"><rect width="${f(x1 - x0 - 4)}" height="5" rx="1" fill="#1a1d22"/>${Array.from({ length: 9 }, (_, i) => `<path class="tp-flame${fire ? ' on' : ''}" d="M${f(2 + i * 3.4)} 4.4q.8-1.8 0-3.2q1.6 1.2 .9 3.2z" fill="#3a8aff"/>`).join('')}</g>`
      + `<g transform="${FRONT(x0 + 3, y1 + .65, z - 15)}"><rect width="12" height="4" rx=".8" fill="#2a1a10"/><text x="6" y="2.9" font-size="2.2" text-anchor="middle" fill="#ffd27a" class="sign">ガス 中火</text></g>`
      + disc(x1 - 5, y1 + .65, z - 13, 1.4, '#2a2e36', 12);
    // the iron plate: its body, the oiled top
    s += box(x0, y0, z - 6, x1 - x0, y1 - y0, 6, 0, 'tp-iron');
    return s;
  }

  /* ---------- the frame at the back right, the sauce carousel, the mayonnaise, laver, bonito, the lid arm ---------- */
  function frame() {
    const { xa, xb, y, t, z, yf } = FR;
    return box(xa, y, 78, t, t, z - 78, 0, 'ty-steel') + box(xb, y, 78, t, t, z - 78, 0, 'ty-steel') + box(xa, y, z, xb - xa + t, t, t, 0, 'ty-steel')
      + box(xa, y + t, z, t, yf - y - t + 3, t, 0, 'ty-steel') + box(xb, y + t, z, t, yf - y - t + 3, t, 0, 'ty-steel')
      + box(xa, yf, z - t, xb - xa + t, 3, t, 0, 'ty-steel')
      // the front beam reaches back to the right carriage rail and carries its front end
      + box(CAR.xb + 2.6, yf, z - t, xa - CAR.xb - 2.6, 3, t, 0, 'ty-steel');
  }
  // the carousel: four bottles round the spindle under a gearbox on the front beam; rot: the turn (bottle k at the
  // front at rot = k); squeeze: the front one pressed (0..1); stream: its sauce down to z; cols: the bottles' sauces
  function carousel(rot, cols, levels = [], squeeze = 0, stream = null) {
    const { x, y, r, z } = CAR4, top = FR.z - FR.t;
    let s = box(x - 2.2, y - 2.2, top - 4.4, 4.4, 4.4, 4.4, 0, 'ty-steel') + cyl(x, y, z + 9.4, top - 4.4, .7, .7, '#8a93a4', 8) + disc(x, y, z + 9.4, r + 2, '#aab3bf', 18);
    // the bottles, back ones first (by y after turning)
    const bs = cols.map((c, k) => { const a = (k - rot) * Math.PI / 2 + Math.PI / 2; return { k, c, bx: x + r * Math.cos(a), by: y + r * Math.sin(a) }; }).sort((a, b) => (a.bx + a.by) - (b.bx + b.by));
    bs.forEach(({ k, c, bx, by }) => { const front = Math.abs(((k - rot) % 4 + 4) % 4) < .05, sq = front ? squeeze : 0, zz = z - (front ? 1.6 * Math.min(1, squeeze * 3) : 0), lv = Math.max(0, Math.min(1, levels[k] ?? 1)), rw = 1.55 * (1 - .12 * sq);
      s += cyl(bx, by, zz + 8.6, z + 9.4, .5, .5, '#8a93a4', 8) + cyl(bx, by, zz + 1.6, zz + 8.6, rw, rw, mix(c || '#f4f0e0', '#ffffff', .25), 14)
        + cyl(bx, by, zz + 1.6, zz + 1.6 + 7 * lv, rw * .9, rw * .9, c || '#f4f0e0', 14) + cyl(bx, by, zz - .6, zz + 1.6, .25, 1.2, '#e8453a', 10); });
    if (stream && stream.z != null) s += seg([stream.x ?? x, y + r, z - .6], [stream.x ?? x, y + r + (stream.dy || 0), stream.z], stream.c, .7);
    return s;
  }
  // the mayonnaise nozzle, the laver shaker and the bonito hopper on the front beam (mz: the mayonnaise stream's end;
  // nori/katsu: 0..1 through their sprinkle, to z)
  function toppers(o = {}) {
    const top = FR.z - FR.t, yy = LY;
    let s = box(MAYO - 1.2, yy - 1.2, top - 6, 2.4, 2.4, 6, 0, 'ty-steel pb-fine') + cyl(MAYO, yy, top - 15, top - 6, 1.7, 1.7, '#fdfcf6', 14) + cyl(MAYO, yy, top - 13.2, top - 12.2, 1.75, 1.75, '#e8453a', 14)
      + cyl(MAYO, yy, top - 17.4, top - 15, .25, 1.3, '#fdfcf6', 10)
      + `<g transform="${FRONT(MAYO - 1.4, yy + 1.75, top - 7.6)}"><text x="1.4" y="1.6" font-size="1.4" text-anchor="middle" fill="#c8303a" class="sign">マヨ</text></g>`;
    if (o.mz != null) s += seg([MAYO + (o.mx || 0), yy + (o.my || 0), top - 17.4], [MAYO + (o.mx || 0), yy + (o.my || 0), o.mz], '#fffaf0', .55);
    // the laver: a canister, its perforated lid down; the bonito: a box hopper with a chute
    s += box(NORI - 1.2, yy - 1.2, top - 5, 2.4, 2.4, 5, 0, 'ty-steel pb-fine') + cyl(NORI, yy, top - 12, top - 5, 1.8, 1.8, '#2a5a2a', 14) + disc(NORI, yy, top - 12.02, 1.8, '#c9d0da', 14)
      + `<g transform="${FRONT(NORI - 1.6, yy + 1.85, top - 6.6)}"><text x="1.6" y="1.6" font-size="1.4" text-anchor="middle" fill="#bfe08a" class="sign">青のり</text></g>`;
    s += box(NEGI - 1.6, yy - 1.6, top - 9, 3.2, 3.2, 9, 0, 'tp-negi') + box(NEGI - 1.1, yy - 1.1, top - 11.4, 2.2, 2.2, 2.4, 0, 'ty-steel pb-fine')
      + `<g transform="${FRONT(NEGI - 1.6, yy + 1.65, top - 1.6)}"><text x="1.6" y="1.4" font-size="1.4" text-anchor="middle" fill="#2a5a1a" class="sign">ねぎ</text></g>`;
    s += box(KATSU - 3, yy - 2.6, top - 9, 6, 5.2, 9, 0, 'tp-katsu') + box(KATSU - 1.6, yy - 1.4, top - 12.4, 3.2, 2.8, 3.4, 0, 'ty-steel')
      + `<g transform="${FRONT(KATSU - 2.4, yy + 2.65, top - 1.4)}"><rect width="4.8" height="4.4" rx=".6" fill="#3a2a1a"/>${[[.8, 2.6], [2.2, 1.8], [3.4, 3]].map(([a, b]) => `<path d="M${a} ${b}q.5-.8 .2-1.4q-.6.4-.5 1z" fill="#e8c8a0"/>`).join('')}<text x="2.4" y="-.5" font-size="1.4" text-anchor="middle" fill="#ffd27a" class="sign">かつお</text></g>`;
    for (const [key, x, c, w] of [['nori', NORI, '#3a7a2a', .5], ['negi', NEGI, '#bfe08a', .8], ['katsu', KATSU, '#e8c8a0', .9]]) if (o[key] != null) for (let i = 0; i < 8; i++) {
      const ph = (o[key] * 2 + i / 8) % 1, u = ((i * 37) % 9 - 4) / 4, v = ((i * 53) % 7 - 3) / 3, z0 = top - ({ nori: 12, negi: 11.4, katsu: 12.4 })[key];
      const [a, b] = q(x + u * (.6 + 1.6 * ph), yy + v * (.5 + 1.2 * ph), z0 - (z0 - (o.z ?? LINE.z + 3)) * ph); s += `<rect x="${f(+a - w / 2)}" y="${f(+b - w / 2)}" width="${w}" height="${f(key === 'katsu' ? w * .6 : w)}" fill="${c}" opacity="${f(1 - ph * .4)}"/>`; }
    return s;
  }
  // the lid closer: a round guide bar hung from the front beam over the belt's right end, sloping down to the right,
  // so the pack's open lid meets it and is folded shut as the boat passes under it
  const CLOSE = { x0: LID + 3.4, x1: KATSU + 3.6, z0: LINE.z + 3.6, z1: LINE.z + 10.4, y: LY - BOAT_W * BK - .6 };
  function closer() {
    const top = FR.z - FR.t, { x0, x1, z0, z1, y } = CLOSE;
    return box(x0 - 2.6, y - 1.1, z0 + .8, 2.2, 2.2, top - z0 - .8, 0, 'ty-steel pb-fine') + box(x1 + .4, y - 1.1, z1 + .8, 2.2, 2.2, top - z1 - .8, 0, 'ty-steel pb-fine')
      + seg([x0, y, z0], [x1, y, z1], '#2a2e36', 1.9) + seg([x0, y, z0], [x1, y, z1], '#d4dae2', 1.1) + seg([x0, y - .2, z0 + .3], [x1, y - .2, z1 + .3], '#fff', .3);
  }

  /* ---------- the boat stack at the left end of the belt ---------- */
  function stack() {
    const z0 = LINE.z + 3.2;
    let s = '';
    for (let i = 0; i < 6; i++) s += boat(STACK, LY, z0 + i * 1.1, { n: 0, lid: i === 5 ? 0 : null }, BK);
    return s + box(STACK - 7.4, LY - 5.6, z0, 2.4, 2.4, 13, 0, 'ty-steel pb-fine') + box(STACK + 5, LY - 5.6, z0, 2.4, 2.4, 13, 0, 'ty-steel pb-fine')
      + box(STACK - 7.4, LY - 5.6, z0 + 13, 14.8, 2.4, 2.4, 0, 'ty-steel');
  }

  /* ---------- the tanks behind: the batter tank with its sight glass, the octopus chiller; hoses to the carriage ---------- */
  function tanks(batter = 1) {
    const x = 22, y = 30, z = 150;
    let s = box(x - 4, y - 4, 120, 8, 8, z - 120, 0, 'ty-steel') + cyl(x, y, z, z + 22, 6, 6, '#e6ebf1', 18) + cyl(x, y, z + 21.4, z + 23, 6.3, 6.3, '#aab3bf', 18) + disc(x, y, z + 23, 5.2, '#d4dae2', 18)
      + `<g transform="${FRONT(x - 1.4, y + 6.05, z + 19)}"><rect width="2.8" height="16" rx=".7" fill="#1d2430"/><rect x=".45" y="${f(.45 + 15.1 * (1 - batter))}" width="1.9" height="${f(15.1 * batter)}" rx=".4" fill="${BATTER[0]}" class="tp-level"/></g>`
      + `<g transform="${FRONT(x - 5, y + 6.05, z + 7)}"><rect width="10" height="4" rx=".8" fill="#c8303a"/><text x="5" y="2.9" font-size="2.4" text-anchor="middle" fill="#fff" class="sign">生地</text></g>`;
    s += box(33, 24, 120, 12, 12, 52, 0, 'pb-fridge') + `<g transform="${FRONT(35, 36.05, 168)}"><rect width="8" height="10" rx="1" fill="#1a2a3a"/><rect x="1.4" y="3" width="5.2" height="5" rx=".8" fill="#c8303a"/><text x="4" y="2.2" font-size="1.7" text-anchor="middle" fill="#9fdcff" class="sign">たこ 4℃</text></g>`;
    return s;
  }
  // the two hoses from them to the carriage at y (they hang in a loop that follows it)
  function hoses(y) {
    const z = CAR.z;
    const h = (ax, ay, az, bx, by, bz, c) => { const [a, b] = q(ax, ay, az), [c2, d] = q(bx, by, bz), [e, g] = q((ax + bx) / 2, (ay + by) / 2 + 2, Math.max(az, bz) + 8);
      const d0 = `M${a} ${b}Q${e} ${g} ${c2} ${d}`; return `<path d="${d0}" fill="none" stroke="#2a2e36" stroke-width="1.6" stroke-linecap="round"/><path d="${d0}" fill="none" stroke="${c}" stroke-width=".9" stroke-linecap="round"/>`; };
    return h(22, 30, 173, CX(0) - 2.4, y - CAR.NOZ, z - 8, BATTER[0]) + h(39, 30, 172, CX(0), y - CAR.FEED, z - 1, '#c8303a');
  }

  /* ---------- the deck's food: okonomiyaki, yakisoba, ikayaki (bottom at z, k its size) ---------- */
  // f = { kind, c (cooked 0..1), flip (0..1, over the y axis), sauce (colour; s 0..1 brushed), mayo (m 0..1), top
  // (mix / negi / tonpei / kaisen; beni; omu; egg), t (the topping 0..1), katsu (flakes), fold (ikayaki 0..1), tz (tossed up) }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const rnd = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };   // a hash (scattered, not on a line)
  function okono(x, y, z, o, k = 1) {
    const tonpei = o.top === 'tonpei', rx = (tonpei ? 5.2 : 5) * k, ry = (tonpei ? 3 : 5) * k, th = 1.2 * k, A = Math.PI * (o.flip || 0), zc = z + th / 2 + (o.tz || 0) + Math.sin(A) * 4 * k;
    const ring = side => Array.from({ length: 20 }, (_, i) => { const t = i / 20 * Math.PI * 2, dx = rx * Math.cos(t), dz = side * th / 2;
      return [x + dx * Math.cos(A) - dz * Math.sin(A), y + ry * Math.sin(t), zc + dx * Math.sin(A) + dz * Math.cos(A)]; });
    const top = ring(1), bot = ring(-1), up = Math.cos(A) >= 0, face = up ? top : bot;
    const c = o.c ?? 1, raw = tonpei ? '#f6e08a' : '#efe0b0', done = tonpei ? '#f2c03a' : '#c8782a';
    // the face that shows: before the turn the raw top (cabbage in it); after it the browned underside
    const flipped = (o.flip || 0) > .5, fc = up ? (flipped ? mix(raw, done, Math.max(c, .85)) : mix(raw, mix(raw, done, .35), c)) : mix(raw, done, Math.max(c, .85));
    let s = `<path d="${toD(hull([...top, ...bot].map(p => P(...p))))}" fill="${mix(done, '#5a2a0a', .25)}" stroke="#5a2a0a" stroke-width=".5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`
      + `<path d="${toD(face.map(p => P(...p)))}" fill="${fc}"/>`;
    const flat = Math.abs(Math.sin(A)) < .05, zt = zc + th / 2 + .05;
    if (!flat) return s;
    // cabbage and the batter's bits on the raw side
    if (!flipped && !tonpei) for (let i = 0; i < 14; i++) { const [a, b] = q(x + (rnd(i) * 2 - 1) * rx * .7, y + (rnd(i + 40) * 2 - 1) * ry * .7, zt); s += `<rect x="${f(a - .45)}" y="${f(b - .3)}" width=".9" height=".6" fill="${i % 3 ? '#9ad06a' : '#e8f0c0'}" opacity="${f(1 - c * .6)}"/>`; }
    if (flipped && !tonpei) for (let i = 0; i < 9; i++) { const [a, b] = q(x + (rnd(i + 7) * 2 - 1) * rx * .65, y + (rnd(i + 60) * 2 - 1) * ry * .65, zt); s += `<circle cx="${a}" cy="${b}" r=".55" fill="#8a4a1a" opacity=".5"/>`; }
    if (tonpei && flipped) s += [-.45, 0, .45].map(t => seg([x + t * rx, y - ry * .9, zt], [x + t * rx + .6, y + ry * .9, zt], '#d8a020', .35)).join('');
    if (o.sauce && (o.s ?? 1) > 0) { const e = o.s ?? 1; s += `<path d="${toD(ringE(zt, rx * .9 * Math.min(1, e * 1.2), ry * .9 * Math.min(1, e * 1.2), x, y, 18))}" fill="${o.sauce}" opacity=".95"/><path d="${toD(ringE(zt + .02, rx * .35, ry * .2, x - rx * .3, y - ry * .3, 10))}" fill="#fff" opacity="${f(.25 * e)}"/>`; }
    if ((o.top === 'mix' || o.top === 'kaisen') && (o.t ?? 1) > 0) for (let i = 0; i < (o.top === 'kaisen' ? 7 : 4); i++) { const [a, b] = q(x + (rnd(i + 3) * 2 - 1) * rx * .6, y + (rnd(i + 30) * 2 - 1) * ry * .6, zt + .1);
      s += i % 2 || o.top === 'mix' ? `<path d="M${f(a - 1)} ${b}q1-1.4 2 0" fill="none" stroke="#ff8a6a" stroke-width=".8" stroke-linecap="round"/>` : `<circle cx="${a}" cy="${b}" r=".8" fill="none" stroke="#f6f0e8" stroke-width=".55"/>`; }
    if (o.mayo && (o.m ?? 1) > 0) { const e = o.m ?? 1, n = 5; for (let i = 0; i < Math.ceil(n * e); i++) { const u = (i / (n - 1) * 2 - 1) * .7; s += seg([x + u * rx - rx * .25, y - ry * .7, zt + .15], [x + u * rx + rx * .25, y + ry * .7, zt + .15], '#fffaf0', .45); } }
    if (o.top === 'negi' && (o.t ?? 1) > 0) for (let i = 0; i < Math.round(20 * (o.t ?? 1)); i++) { const [a, b] = q(x + (rnd(i + 5) * 2 - 1) * rx * .75, y + (rnd(i + 50) * 2 - 1) * ry * .75, zt + .2); s += `<rect x="${f(a - .7)}" y="${f(b - .25)}" width="1.4" height=".5" rx=".2" fill="${i % 2 ? '#6aaa3a' : '#bfe08a'}"/>`; }
    if ((o.nori ?? 0) > 0) s += dots(x, y, zt + .25, k * .9, Math.round(26 * o.nori), '#3a7a2a', .5);
    if ((o.katsu ?? 0) > 0) s += flakes(x, y, zt + .3, k * .9, o.katsu, o.ph || 0);
    return s;
  }
  function soba(x, y, z, o, k = 1) {
    const rx = 4.8 * k, ry = 3.6 * k, zt = z + 1.4 * k + (o.tz || 0), c = o.c ?? 1, nc = mix('#efd9a0', o.sauce || '#efd9a0', Math.min(1, c));
    let s = `<path d="${toD(ringE(z + .3, rx, ry, x, y, 18))}" fill="${mix(nc, '#3a1a08', .3)}" stroke="#5a3010" stroke-width=".45" vector-effect="non-scaling-stroke"/>`;
    // the noodles: wavy strands over the heap
    for (let i = 0; i < 13; i++) { const v = (i / 12 * 2 - 1) * .85, w = Math.sqrt(1 - v * v), ph = i * 1.7 + (o.tz || 0) * 3;
      const pts = Array.from({ length: 9 }, (_, j) => { const u = (j / 8 * 2 - 1) * w * .95; return q(x + u * rx, y + v * ry + Math.sin(j * 1.4 + ph) * .5 * k, z + .5 + (zt - z - .5) * (1 - (u * u + v * v) * .6)); });
      s += `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" stroke="${mix(nc, '#ffffff', (i % 3) * .08)}" stroke-width="${f(.7 * k)}" stroke-linecap="round"/>`; }
    for (let i = 0; i < 9; i++) { const [a, b] = q(x + (rnd(i + 2) * 2 - 1) * rx * .6, y + (rnd(i + 20) * 2 - 1) * ry * .6, zt - .2);
      s += i % 3 === 0 ? `<rect x="${f(a - .8)}" y="${f(b - .4)}" width="1.6" height=".8" rx=".3" fill="#d89a8a"/>` : `<rect x="${f(a - .6)}" y="${f(b - .5)}" width="1.2" height="1" rx=".3" fill="#9ad06a"/>`; }
    if (o.top === 'omu' && (o.t ?? 1) > 0) { s += `<path d="${toD(ringE(zt + .2, rx * .9, ry * .82, x, y, 18))}" fill="#f6d050" stroke="#c89a20" stroke-width=".4" opacity="${f(Math.min(1, (o.t ?? 1) * 1.5))}"/>`;
      if ((o.m ?? 0) > 0) s += zig(x, y, zt + .3, '#8a2a10', o.m, .9, 4, k * .9, .7); }
    if ((o.nori ?? 0) > 0) s += dots(x, y, zt + .3, k * .9, Math.round(18 * o.nori), '#3a7a2a', .5);
    if ((o.beni ?? 0) > 0) for (let i = 0; i < Math.round(5 * o.beni); i++) { const [a, b] = q(x + 1.4 * k + (rnd(i + 9) - .5) * 1.6 * k, y - .6 * k + (rnd(i + 19) - .5) * 1.2 * k, zt + .4); s += `<rect x="${f(a - .5)}" y="${f(b - .2)}" width="1" height=".4" fill="#e8304a"/>`; }
    return s;
  }
  function ika(x, y, z, o, k = 1) {
    const r = 4.4 * k, c = o.c ?? 1, fold = o.fold || 0, zt = z + .5 + (o.tz || 0);
    const col = mix('#f6e6b4', '#e0a858', c);
    let s;
    if (fold < .5) s = `<path d="${toD(ringE(zt, r, r, x, y, 20))}" fill="${col}" stroke="#a8682a" stroke-width=".45" vector-effect="non-scaling-stroke"/>`;
    else { // folded in half toward the front: a half-moon, two layers
      const half = (zz, rr) => Array.from({ length: 12 }, (_, i) => { const t = i / 11 * Math.PI; return P(x + rr * Math.cos(t), y - rr * .4 + rr * Math.sin(t), zz); });
      s = `<path d="${toD(hull([...half(z + .3, r), ...half(zt + 1, r)]))}" fill="${mix(col, '#7a4a1a', .15)}" stroke="#a8682a" stroke-width=".45" vector-effect="non-scaling-stroke"/><path d="${toD(half(zt + 1, r * .98))}" fill="${col}"/>`; }
    // the pressed batter's lace, the squid
    if (c > .3) for (let i = 0; i < 8; i++) { const [a, b] = q(x + (rnd(i + 4) * 2 - 1) * r * .6, y + (fold < .5 ? (rnd(i + 44) * 2 - 1) * r * .6 : rnd(i + 44) * r * .8), zt + (fold < .5 ? .05 : 1.05)); s += `<circle cx="${a}" cy="${b}" r=".6" fill="#b8742a" opacity="${f((c - .3) * .8)}"/>`; }
    if (fold < .5 && (o.sq ?? 1) > 0) for (let i = 0; i < Math.round(6 * (o.sq ?? 1)); i++) { const [a, b] = q(x + (rnd(i + 8) * 2 - 1) * r * .55, y + (rnd(i + 80) * 2 - 1) * r * .55, zt + .15); s += `<circle cx="${a}" cy="${b}" r=".75" fill="none" stroke="${c > .5 ? '#f0e0d0' : '#f6f0f0'}" stroke-width=".5"/><circle cx="${f(+a + .3)}" cy="${b}" r=".25" fill="#e89090"/>`; }
    if (o.egg && (o.e ?? 1) > 0 && fold < .5) s += `<path d="${toD(ringE(zt + .12, 2.2 * k, 2 * k, x + .4, y, 14))}" fill="#fffaf0" opacity="${f(o.e ?? 1)}"/><path d="${toD(ringE(zt + .2, 1 * k, .9 * k, x + .4, y, 12))}" fill="${mix('#ffb020', '#e8a040', c)}" opacity="${f(o.e ?? 1)}"/>`;
    if (o.sauce && (o.s ?? 0) > 0) s += fold < .5 ? `<path d="${toD(ringE(zt + .25, r * .8 * o.s, r * .8 * o.s, x, y, 18))}" fill="${o.sauce}" opacity=".85"/>` : `<path d="${toD(Array.from({ length: 12 }, (_, i) => { const t = (.06 + i / 11 * .88) * Math.PI; return P(x + r * .82 * Math.cos(t), y - r * .3 + r * .78 * Math.sin(t), zt + 1.1); }))}" fill="${o.sauce}" opacity=".88"/>`;
    // folded: a squid leg or two curling out of the front edge
    if (fold >= .5 && (o.sq ?? 1) > 0) for (const t of [.3, .64]) { const [a, b] = q(x + r * Math.cos(t * Math.PI), y - r * .4 + r * Math.sin(t * Math.PI) + .2, z + .9);
      s += `<path d="M${f(a)} ${f(b)}q${f(.8 * k)} ${f(.9 * k)} ${f(1.8 * k)} ${f(.3 * k)}" fill="none" stroke="#f0e2d8" stroke-width="${f(.7 * k)}" stroke-linecap="round"/><path d="M${f(a)} ${f(b)}q${f(.8 * k)} ${f(.9 * k)} ${f(1.8 * k)} ${f(.3 * k)}" fill="none" stroke="#c8705a" stroke-width="${f(.25 * k)}" stroke-dasharray=".3 .5" stroke-linecap="round"/>`; }
    return s;
  }
  const food = (x, y, z, o, k = 1) => o.kind === 'okono' ? okono(x, y, z, o, k) : o.kind === 'soba' ? soba(x, y, z, o, k) : o.kind === 'ika' ? ika(x, y, z, o, k) : '';

  /* ---------- the deck's pack: a paper tray, its clear lid hinged at the back (f: the food in it) ---------- */
  function pack(x, y, z, o = {}, k = 1) {
    const { l, w, h } = PACK, L = l * k, Wd = w * k, Hh = h * k;
    const rect = (zz, a, b) => [[x - a, y - b, zz], [x + a, y - b, zz], [x + a, y + b, zz], [x - a, y + b, zz]];
    const paper = o.kind === 'ika' ? '#f4efe4' : '#e2c890', edge = o.kind === 'ika' ? '#a89a7a' : '#7a5a2a';
    let s = `<path d="${toD(hull([...rect(z, L * .9, Wd * .86), ...rect(z + Hh, L, Wd)].map(p => P(...p))))}" fill="${paper}" stroke="${edge}" stroke-width=".55" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`
      + `<path d="${toD(rect(z + Hh, L * .92, Wd * .9).map(p => P(...p)))}" fill="${mix(paper, '#7a5a2a', .18)}" stroke="${mix(edge, '#ffffff', .3)}" stroke-width=".35" vector-effect="non-scaling-stroke"/>`;
    if (o.f) s += food(x, y, z + .4 * k, { ...o.f, ph: o.ph }, k * .92);
    if (o.lid == null) return s;
    // the lid: a shallow clear box hinged along the back edge (0 standing open … 1 shut)
    const th = (1 - o.lid) * Math.PI / 2 * 1.05, hy = y - Wd, hz = z + Hh, dome = 2.6 * k;
    const R = (xx, dy, dz) => P(xx, hy + dy * Math.cos(th) - dz * Math.sin(th), hz + dy * Math.sin(th) + dz * Math.cos(th));
    const rim = [[-L, 0], [L, 0], [L, 2 * Wd], [-L, 2 * Wd]], topR = rim.map(([u, v]) => [u * .9, Wd + (v - Wd) * .88]);
    return s + `<path d="${toD(hull([...rim.map(([u, v]) => R(x + u, v, 0)), ...topR.map(([u, v]) => R(x + u, v, dome))]))}" class="tp-lid"/><path d="${toD(topR.map(([u, v]) => R(x + u, v, dome)))}" class="tp-lidtop"/>`;
  }

  /* ---------- the deck: the shelf on its posts, its belt, the magazine, the lift's frame, the chute to the window ---------- */
  function deckBelt(off) {
    const { x0, x1, y0, y1, z } = DB;
    let s = box(x0, y0, DECK.z, x1 - x0, y1 - y0, z - DECK.z, 0, 'tp-belt');
    for (let x = x0 + ((off % 4) + 4) % 4; x < x1; x += 4) s += seg([x, y0 + .4, z + .02], [x, y1 - .4, z + .02], '#4a4e58', .45, 'butt');
    return s;
  }
  // under the floor (drawn before it): the chute from the lift's foot to the window
  function lowChute() {
    return `<path d="${toD([P(LIFT.x0 + .6, DB.y1, LIFT.zb - 1.4), P(LIFT.x1 - .6, DB.y1, LIFT.zb - 1.4), P(TP.WINDOW[0] + 14, LINE.y1 + 2, 42), P(TP.WINDOW[0] + 4, LINE.y1 + 2, 42)])}" style="fill:#aab3bf;fill-opacity:.6;${ST}"/>`
      + seg([LIFT.x1 - .6, DB.y1, LIFT.zb - 1], [TP.WINDOW[0] + 14, LINE.y1 + 2, 42.6], '#d4dae2', .8);
  }
  function deck() {
    const { x0, x1, y0, y1, z } = DECK;
    let s = '';
    // the posts (the right ones down to the cabinet's base, past the floor's edge), the shelf, a rail round its back
    [[x0 + .4, y0 + .4, 78], [x1 - 2.8, y0 + .4, 6], [x0 + .4, y1 - 2.8, 78], [x1 - 2.8, y1 - 2.8, 6]].forEach(([x, y, zb]) => { s += box(x, y, zb, 2.4, 2.4, z - 2 - zb, 0, 'ty-steel'); });
    s += box(x0, y0, z - 2, x1 - x0, y1 - y0, 2, 0, 'ty-steel');
    // the magazine of packs at the belt's left end: two posts and a bar, the packs stacked
    for (let i = 0; i < 5; i++) s += pack(MAG, DBY, DB.z + 2.6 + i * 1.2, { lid: i === 4 ? 0 : null }, BK);
    s += box(MAG - 6.8, DB.y0 - 1.4, DB.z + 2.6, 2.2, 2.2, 10, 0, 'ty-steel pb-fine') + box(MAG + 4.6, DB.y0 - 1.4, DB.z + 2.6, 2.2, 2.2, 10, 0, 'ty-steel pb-fine')
      + box(MAG - 6.8, DB.y0 - 1.4, DB.z + 12.6, 13.6, 2.2, 2.2, 0, 'ty-steel');
    return s;
  }
  // the lift: two guide posts at the back of its shaft, a sprocket on each; the motor at their foot (nothing over the
  // deck: the press is behind it); (the platform is drawn moving)
  const LZT = DB.z + 7;
  function liftFrame() {
    const { x0, x1 } = LIFT, yb = DB.y0 - 3.2, cx = (x0 + x1) / 2;
    return box(x0 + 1, yb, 6, 2.4, 2.4, LZT - 6, 0, 'ty-steel') + box(x1 - 3.4, yb, 6, 2.4, 2.4, LZT - 6, 0, 'ty-steel')
      + cylX(x0 + .6, x1 - .6, yb + 1.2, LZT - 1.4, .9, '#8a93a4')
      + box(cx - 3.4, yb - 1, 6, 6.8, 4.4, 8, 0, 'ty-steel') + `<g transform="${FRONT(cx - 3.4, yb + 3.45, 12)}"><rect x=".8" y=".8" width="5.2" height="3" rx=".5" fill="#1a1d22"/><text x="3.4" y="3" font-size="1.7" text-anchor="middle" fill="#ffd27a" class="sign">昇降</text></g>`;
  }
  function liftCar(z, pk, k = BK) {
    const { x0, x1 } = LIFT, yb = DB.y0 - 3.2, cx = (x0 + x1) / 2;
    // the carriage on the posts; the platform (a short belt), its rails
    return box(x0 + .6, yb + 2.4, z - 3, x1 - x0 - 1.2, 1.4, 6, 0, 'ty-steel')
      + box(x0, DB.y0, z - 2.4, x1 - x0, DB.y1 - DB.y0, 2.4, 0, 'tp-belt') + (pk ? pack(cx, DBY, z, pk, k) : '')
      + box(x0, DB.y1, z - .6, x1 - x0, .8, 2.2, 0, 'ty-steel pb-fine');
  }
  // the lid closer over the belt before the lift: a round guide bar from a bracket on the lift's left post, rising to
  // the left, so the pack's open lid meets it and is folded shut as it rides on to the lift
  const DCLOSE = { x0: LIFT.x0 + 1.4, x1: LIFT.x0 - 9, z0: DB.z + 3.6, z1: DB.z + 8.8, y: DB.y0 - .2 };
  function deckCloser() {
    const { x0, x1, z0, z1, y } = DCLOSE;
    // (its high end on a post up from the deck behind the belt)
    return box(LIFT.x0 + .8, y - 1.1, z0 - 1.2, 2.8, 2.2, 2.4, 0, 'ty-steel pb-fine') + box(x1 - 1.2, y - 2.6, DB.z - 1, 2.4, 2.4, z1 - DB.z + 2, 0, 'ty-steel') + seg([x0, y, z0], [x1, y, z1], '#2a2e36', 1.9) + seg([x0, y, z0], [x1, y, z1], '#d4dae2', 1.1);
  }

  /* ---------- a station: the plate on its burner, the gantry (back posts, arms, the turret's beam, the spatulas' rail),
     the pusher's cylinder; and its moving parts ---------- */
  const GZ = SZ + 26;   // the gantry's top
  function stationBase(kind) {
    const st = STN[kind], { x0, x1, cx } = st, w = x1 - x0;
    let s = box(x0 + .6, SY0 + .6, DECK.z, w - 1.2, SY1 - SY0 - 1.2, SZ - 1.4 - DECK.z, 0, 'ty-steel') + box(x0, SY0, SZ - 1.4, w, SY1 - SY0, 1.4, 0, 'tp-iron')
      + `<g transform="${FRONT(x0 + 1.4, SY1 - .55, SZ - 1.8)}"><rect width="${f(w - 2.8)}" height="1.2" rx=".5" class="tp-flame on" fill="#ff7a2a"/></g>`
      // the apron from the plate's front edge down to the belt
      + `<path d="${toD([P(x0 + 1, SY1, SZ), P(x1 - 1, SY1, SZ), P(x1 - 1, DB.y0 + .6, DB.z + .2), P(x0 + 1, DB.y0 + .6, DB.z + .2)])}" style="fill:#c9d0da;${ST}"/>`;
    // the gantry: two posts at the back, arms forward, the turret's beam across, the spatulas' rail across in front
    s += box(x0 + .2, SY0 - 3.4, DECK.z, 2.4, 2.4, GZ - DECK.z, 0, 'ty-steel') + box(x1 - 2.6, SY0 - 3.4, DECK.z, 2.4, 2.4, GZ - DECK.z, 0, 'ty-steel')
      + box(x0 + .2, SY0 - 3.4, GZ, w - .4, 2.4, 2.4, 0, 'ty-steel')
      + box(x0 + .2, SY0 - 1, GZ, 2.4, SCY + 4.4 - SY0, 2.4, 0, 'ty-steel') + box(x1 - 2.6, SY0 - 1, GZ, 2.4, SCY + 4.4 - SY0, 2.4, 0, 'ty-steel')
      + box(x0 + 2.6, SCY - 5.2, GZ, w - 5.2, 2.4, 2.4, 0, 'ty-steel');
    // the pusher's cylinder behind the plate
    s += box(cx - 1.6, DECK.y0 + .8, SZ - .2, 3.2, SY0 - DECK.y0 - 1, 3, 0, 'ty-steel');
    return s;
  }
  // the tools on the turret (hanging from its disc at z, the tip at the bottom)
  function tool(kind, x, y, z) {
    const lab = (t, c, bg) => `<g transform="${FRONT(x - 1.6, y + 1.85, z - 2.4)}"><rect width="3.2" height="2" rx=".4" fill="${bg}"/><text x="1.6" y="1.5" font-size="1.3" text-anchor="middle" fill="${c}" class="sign">${t}</text></g>`;
    switch (kind) {
      case 'hopper': case 'batter': return cyl(x, y, z - 6, z, 1.8, 1.8, '#e6ebf1', 14) + cyl(x, y, z - 8.4, z - 6, .4, 1.8, '#d4dae2', 12) + disc(x, y, z, 1.8, kind === 'hopper' ? '#d8e8b0' : BATTER[0], 14) + lab(kind === 'hopper' ? '生地' : '生地', '#fff', '#c8303a');
      case 'brush': return seg([x, y, z], [x, y, z - 6], '#8a93a4', .6) + cyl(x, y, z - 8, z - 6, 1.5, 1.5, '#c8883a', 14) + disc(x, y, z - 6, 1.6, '#aab3bf', 12);
      case 'mayo': return cyl(x, y, z - 6, z, 1.6, 1.6, '#fdfcf6', 14) + cyl(x, y, z - 4.4, z - 3.6, 1.65, 1.65, '#e8453a', 14) + cyl(x, y, z - 8, z - 6, .25, 1.2, '#fdfcf6', 10);
      case 'sauce': return cyl(x, y, z - 6, z, 1.6, 1.6, '#4a2210', 14) + cyl(x, y, z - 8, z - 6, .25, 1.2, '#e8453a', 10);
      case 'shaker': return cyl(x, y, z - 6, z, 1.7, 1.7, '#2a5a2a', 14) + disc(x, y, z - 6.02, 1.7, '#c9d0da', 14) + lab('のり', '#bfe08a', '#1a3a1a');
      case 'noodle': return box(x - 1.8, y - 1.8, z - 6, 3.6, 3.6, 6, 0, 'ty-steel') + box(x - 1, y - 1, z - 7.6, 2, 2, 1.6, 0, 'ty-steel pb-fine') + lab('麺', '#2a2010', '#f0d890');
      case 'cabbage': return box(x - 1.8, y - 1.8, z - 6, 3.6, 3.6, 6, 0, 'ty-steel') + box(x - 1, y - 1, z - 7.6, 2, 2, 1.6, 0, 'ty-steel pb-fine') + lab('具', '#fff', '#4a8a2a');
      case 'squid': return box(x - 1.8, y - 1.8, z - 6, 3.6, 3.6, 6, 0, 'ty-steel') + box(x - 1, y - 1, z - 7.6, 2, 2, 1.6, 0, 'ty-steel pb-fine') + lab('いか', '#c8303a', '#fff');
      case 'egg': return box(x - 1.8, y - 1.8, z - 6, 3.6, 3.6, 6, 0, 'ty-steel') + box(x - 1, y - 1, z - 7.6, 2, 2, 1.6, 0, 'ty-steel pb-fine') + lab('玉子', '#6a4a10', '#ffd860');
    }
    return '';
  }
  const TR = 3.6;   // the turret's radius (the active tool at the front, over the food)
  // the moving parts: st = { rot (the turret's turn), food, fx/fy/fz (where the food is), hx (the spatulas: 0 out … 1
  // under the food), hz (lifted), py (the pusher: 0 at the back … 1 at the plate's front edge), th (the press: 0 shut …
  // 1 open), act ({ tool, e }: the active tool working), steam }
  function station(kind, o = {}) {
    const st = STN[kind], { x0, x1, cx, tools } = st, tz = GZ - 4.4, scy = SCY - TR;
    let s = '';
    // the pusher: its rod from the cylinder, the blade across the plate
    const py = SY0 + .5 + (SY1 - SY0 + 1.6) * (o.py || 0);
    s += seg([cx, SY0 - 1, SZ + 1.3], [cx, py, SZ + 1.3], '#c9d0da', .7) + box(x0 + 1.6, py, SZ + .1, x1 - x0 - 3.2, .8, 2.6, 0, 'ty-steel pb-fine');
    // the press (ikayaki): the bottom plate's top half on a hinge at the back, swung open by its cylinder
    const press = () => { if (kind !== 'ika') return '';
      const a = (o.th ?? 1) * Math.PI / 2 * 1.04, hy = SY0 + .2, hz = SZ + .1, R = (xx, d, dz) => P(xx, hy + d * Math.cos(a) - dz * Math.sin(a), hz + d * Math.sin(a) + dz * Math.cos(a));
      const pts = [x0 + .4, x1 - .4].flatMap(xx => [R(xx, 0, 0), R(xx, SY1 - SY0 - .4, 0), R(xx, 0, 1.6), R(xx, SY1 - SY0 - .4, 1.6)]);
      const lever = [cx, hy - 3.4 * Math.cos(a) + 1.2 * Math.sin(a), hz - 3.4 * Math.sin(a) - 1.2 * Math.cos(a) + 1.6];
      return seg([cx, DECK.y0 + 1.6, DECK.z + 2.4], lever, '#2a2e36', 1.8) + seg([cx, DECK.y0 + 1.6, DECK.z + 2.4], lever, '#c9d0da', 1.1)
        + `<path d="${toD(hull(pts))}" class="face tp-iron" style="${ST}"/>`
        + `<path d="M${R(x0 + 2.4, SY1 - SY0 + .6, 1.2).map(f).join(' ')}L${R(x1 - 2.4, SY1 - SY0 + .6, 1.2).map(f).join(' ')}" stroke="#2a2e36" stroke-width="1.4" stroke-linecap="round"/>`; };
    // the press stands open behind the food (drawn first) or lies over it (drawn after)
    const open = kind === 'ika' && (o.th ?? 1) > .45;
    // (the sliders ride under the turret's beam; each rod comes down behind the food, its blade reaching forward)
    const spatulas = () => { if (kind === 'ika') return ''; const hx = 8.8 - 5.6 * (o.hx || 0), hz = o.hz || 0, ry = SCY - 4.4;
      return [-1, 1].map(sd => { const x = cx + sd * hx;
        return box(x - 1.2, SCY - 5.6, GZ - 1.8, 2.4, 2.4, 1.8, 0, 'ty-steel pb-fine') + seg([x, ry, GZ - 1.8], [x, ry, SZ + 1.4 + hz], '#2a2e36', 1.3) + seg([x, ry, GZ - 1.8], [x, ry, SZ + 1.4 + hz], '#aab3bf', .7)
          + `<path d="${toD([P(x, ry, SZ + 1.6 + hz), P(x, SCY + 4.4, SZ + .3 + hz), P(x - sd * 3.2, SCY + 4.2, SZ + .1 + hz), P(x - sd * 3.2, ry + .4, SZ + 1.4 + hz)])}" style="fill:#d4dae2;${ST}"/>`; }).join(''); };
    if (open) s += press();
    if (!(o.hx > 0)) s += spatulas();
    if (o.food) s += food(o.fx ?? cx, o.fy ?? SCY, o.fz ?? SZ, o.food, o.food.sz ?? 1);
    if (o.hx > 0) s += spatulas();
    if (kind === 'ika' && !open) s += press();
    // the spatulas: sliders on the rail, a rod down each, the blade turned in under the food
    // the turret: the gearbox on the beam, the spindle, the disc; the four tools round it, the back ones first
    s += box(cx - 1.6, scy - 1.6, GZ - 2.4, 3.2, 3.2, 2.4, 0, 'ty-steel') + cyl(cx, scy, tz, GZ - 2.4, .5, .5, '#8a93a4', 8) + disc(cx, scy, tz, TR + 1.8, '#aab3bf', 18);
    const rot = o.rot || 0;
    tools.map((t, i) => { const a = (i - rot) * Math.PI / 2; return { t, x: cx + TR * Math.sin(a), y: scy + TR * Math.cos(a) }; }).sort((a, b) => (a.x + a.y) - (b.x + b.y))
      .forEach(({ t, x, y }) => { s += tool(t, x, y, tz - .1); });
    // the active tool at work over the food
    if (o.act && o.act.e > 0) { const { tool: t, e } = o.act, fz = (o.fz ?? SZ) + 1.5, tip = tz - 8.4;
      if (t === 'hopper' || t === 'batter' || t === 'sauce' || t === 'mayo') s += seg([cx + (o.act.dx || 0), SCY + (o.act.dy || 0), tip + .4], [cx + (o.act.dx || 0), SCY + (o.act.dy || 0), fz], t === 'sauce' ? '#4a2210' : t === 'mayo' ? '#fffaf0' : t === 'hopper' ? '#e8d8a0' : BATTER[0], t === 'mayo' ? .5 : 1);
      else for (let i = 0; i < 8; i++) { const ph = (e * 2.4 + i / 8) % 1, u = ((i * 37) % 9 - 4) / 4, v = ((i * 53) % 7 - 3) / 3, c = { shaker: i % 2 ? '#3a7a2a' : '#e8c8a0', noodle: '#efd9a0', cabbage: '#9ad06a', squid: '#f6f0f0', egg: '#ffc030', brush: 'none' }[t];
        if (c === 'none') break;
        const [a, b] = q(cx + u * (.5 + 2 * ph), SCY + v * (.5 + 1.6 * ph), tip - (tip - fz) * ph); s += `<rect x="${f(+a - .45)}" y="${f(+b - .45)}" width=".9" height=".9" fill="${c}" opacity="${f(1 - ph * .3)}"/>`; } }
    if (o.steam) for (let i = 0; i < 5; i++) { const ph = (o.steam + i / 5) % 1, [a, b] = q(cx - 4 + i * 2, SY1 - 1, SZ + 2 + ph * 9); s += `<circle cx="${a}" cy="${b}" r="${f(1 + ph * 1.6)}" fill="#fff" opacity="${f(.45 * (1 - ph))}"/>`; }
    return s;
  }

  /* ---------- the inside ---------- */
  function interior(g, coinState, lv = {}) {
    const up = !!(lv.flat || lv.soba || lv.ika);
    const RT = ISO.right;
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the gas bottle's cabinet, cartons of boats, the breaker box
    s += box(6, 30, 6, 26, 26, 30, 0, 'ty-steel') + `<g transform="${FRONT(6, 56.05, 32)}"><rect x="3" y="2" width="20" height="5" rx="1" fill="#1a1d22"/><text x="13" y="5.6" font-size="2.8" text-anchor="middle" fill="#ffd27a" class="sign">LPガス</text></g>`
      + cyl(19, 43, 36, 58, 7, 7, '#c8303a', 18) + cyl(19, 43, 58, 62, 3, 2, '#aab3bf', 12);
    s += box(42, 34, 6, 26, 18, 20, 0, 'ty-carton') + `<g transform="${FRONT(42, 52.05, 20)}"><text x="13" y="8" font-size="3" text-anchor="middle" fill="#8a3a1a" class="sign">舟皿</text></g>`;
    s += box(74, 36, 6, 14, 12, 30, 0, 'ty-steel') + `<g transform="${FRONT(74, 48.05, 32)}"><rect x="2" y="3" width="10" height="5" rx="1" fill="#1a1d22"/><rect x="3" y="4.2" width="3" height="2.6" fill="#ff8a3a"/><text x="7" y="13" font-size="2.4" text-anchor="middle" fill="#fff" class="sign">100V</text></g>`;
    if (up) s += lowChute();
    s += box(2, 24, 74, 92, 59.5, 4, 0, 'ty-floor');
    s += tanks();
    g.insertAdjacentHTML('beforeend', s);
    // the deck (with any upgrade): the shelf, the stations bought, its belt, the packs on it, the closer, the lift
    const DK = {};
    if (up) {
      g.insertAdjacentHTML('beforeend', deck());
      [['okono', lv.flat], ['soba', lv.soba], ['ika', lv.ika]].forEach(([kind, on]) => { if (!on) return; g.insertAdjacentHTML('beforeend', stationBase(kind)); DK[kind] = UTIL.g(g, station(kind, {}), { class: 'tp-st' }); });
      DK.beltG = UTIL.g(g, deckBelt(0), { class: 'tp-dbelt' });
      DK.packG = UTIL.g(g, '', { class: 'tp-packs' });
      g.insertAdjacentHTML('beforeend', deckCloser() + liftFrame());
      DK.liftG = UTIL.g(g, liftCar(DB.z), { class: 'tp-lift' });
    }
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    g.insertAdjacentHTML('beforeend', rails() + frame());
    const hoseG = UTIL.g(g, hoses(CAR.rest), { class: 'tp-hoses' });
    const bodyG = UTIL.g(g, griddleBody(false), { class: 'tp-body' });
    const plateG = UTIL.g(g, '', { class: 'tp-plate' });
    // the belt on its legs, the boat stack at its left end
    let k = '';
    [LINE.x0 + 4, 40, 64, LINE.x1 - 4].forEach(x => { k += box(x - 1.2, LINE.y0 + .6, 78, 2.4, 2.4, LINE.z - 2.6 - 78, 0, 'ty-steel') + box(x - 1.2, LINE.y1 - 3, 78, 2.4, 2.4, LINE.z - 2.6 - 78, 0, 'ty-steel'); });
    g.insertAdjacentHTML('beforeend', k);
    const beltG = UTIL.g(g, belt(0), { class: 'tp-beltg' });
    const boatG = UTIL.g(g, '', { class: 'tp-boats' });
    g.insertAdjacentHTML('beforeend', stack());
    const carG = UTIL.g(g, carriage(CAR.rest), { class: 'tp-car' });
    const carouselG = UTIL.g(g, '', { class: 'tp-carousel' });
    const toppersG = UTIL.g(g, toppers(), { class: 'tp-toppers' });
    g.insertAdjacentHTML('beforeend', closer());
    const movers = UTIL.g(g, '', { class: 'tp-movers' });
    // the slide from the belt's end down to the take-out window
    g.insertAdjacentHTML('beforeend', `<path d="${toD([P(LINE.x1 - 4, LINE.y1, LINE.z - 3), P(LINE.x1 + 1, LINE.y1, LINE.z - 3), P(TP.WINDOW[0] + 6, LINE.y1 + 2, 40), P(TP.WINDOW[0] - 6, LINE.y1 + 2, 40)])}" style="fill:#aab3bf;fill-opacity:.55;${ST}"/>`);
    if (RT) column();
    // the pins for the stations not bought yet, where each would stand on the deck
    g.insertAdjacentHTML('beforeend', (lv.flat ? '' : pin('flat', STN.okono.cx, DB.y1, SZ - 2)) + (lv.soba ? '' : pin('soba', STN.soba.cx, SY1, SZ + 12)) + (lv.ika ? '' : pin('ika', STN.ika.cx, SY0, SZ + 26)));
    return { defs: defsEl, hoseG, bodyG, plateG, beltG, boatG, carG, carouselG, toppersG, movers, cm, deck: DK };
  }

  /* ---------- the shell and door: the noren, the menu, the lantern, the window on the griddle, the board ---------- */
  // the door's window (u 26–90, v 56–102) frames the griddle and the toppings
  const WN = [26, 56, 64, 46];
  function exterior(g, menu) {
    const R3 = CORE.raised, SK = CORE.sunk, nv = '#1f2a4a', rd = '#d8352a', cr = '#fff1d6', yl = '#ffc83a';
    let s = CORE.sideFace(W, D, H) + ISO.rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a ball on a pick in outline, 粉もん under it
    const sideBall = (cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k})"><circle r="10" fill="rgba(216,53,42,.07)" stroke="${rd}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M-6-2q3-4 8-3" fill="none" stroke="${rd}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M4-8L13-21" stroke="${rd}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M-9 1q4.5-3 9 0t9 0" fill="none" stroke="${rd}" stroke-width=".7" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${rd}"/>${sideBall(42, 72, 2.4)}
      ${['粉', 'も', 'ん'].map((ch, i) => `<text class="sign" x="42" y="${132 + i * 22}" font-size="18" text-anchor="middle" fill="rgba(216,53,42,.12)" stroke="rgba(216,53,42,.5)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(216,53,42,.1)" stroke="${rd}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${rd}">6こ入り ¥300〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${rd}"/><g class="iso-only">${sideBall(42, 96, 2.2)}
      <text class="label" x="42" y="150" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(216,53,42,.6)">TAKOYAKI · OFF THE GRIDDLE</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, nm = p.jp || p.name, fs = Math.min(2.6, 15.4 / nm.length);
      return R3(x, y, 20.8, 30, 1, `<rect class="tp-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${yl}" opacity="0"/><g transform="translate(${x + 3.2} ${y + .6}) scale(.6)">${icon(p)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext"${nm.length * fs > 14.6 ? ' textLength="14.6" lengthAdjust="spacingAndGlyphs"' : ''}>${nm}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label tp-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit tp-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // left of the window a red lantern (たこ焼), right of it the lamps (焼き中, 仕上げ中); under it the board
    const lantern = `<g class="nohit" transform="translate(-5.6 0)"><rect x="16" y="58" width="6" height="2.4" rx=".6" fill="#2a2420"/><path d="M12 61.4Q9.4 72 12 86H26Q28.6 72 26 61.4Z" fill="${rd}" stroke="var(--line)" stroke-width=".9" vector-effect="non-scaling-stroke"/>`
      + [65, 70, 75, 80].map(y => `<path d="M${11.2} ${y}Q19 ${y + 1.6} ${26.8} ${y}" fill="none" stroke="#a82820" stroke-width=".5"/>`).join('')
      + `<rect x="15.6" y="86" width="6.8" height="2.4" rx=".6" fill="#2a2420"/><path d="M19 88.4v8" stroke="#2a2420" stroke-width=".8"/><path d="M17.6 96.4h2.8l-.4 4h-2z" fill="#2a2420"/>`
      + ['た', 'こ', '焼'].map((c, i) => `<text class="tp-lant" x="19" y="${68.6 + i * 6.4}" font-size="5.2" text-anchor="middle">${c}</text>`).join('') + `</g>`;
    const lamps = R3(94, 62, 22, 6.4, .8, `<text class="lit-text tp-cooklamp" style="--lc:#ff8a3a" x="105" y="66.6" font-size="2.9" text-anchor="middle">焼き中</text>`, { r: 1.5, capCls: 'readycap' })
      + R3(94, 70.6, 22, 6.4, .8, `<text class="lit-text tp-waitlamp" style="--lc:#ffd23f" x="105" y="75.2" font-size="2.9" text-anchor="middle">仕上げ中</text>`, { r: 1.5, capCls: 'readycap' });
    const board = `<rect x="6" y="108" width="86" height="60" rx="2" class="tp-board"/><text class="tp-boardt" x="49" y="116.4" font-size="4.2" text-anchor="middle">外はカリッ 中はトロッ</text>`
      + `<g transform="translate(49 143)"><path d="M-17 4H17L14 10H-14Z" fill="#e2c890" stroke="#7a5a2a" stroke-width=".5"/>${[-10, 0, 10].map(x => `<circle cx="${x}" cy="0" r="5.6" fill="${BATTER[2]}" stroke="#7a3a10" stroke-width=".5"/><path d="M${x - 3} -1.6q2-1.8 4.4-1.2" fill="none" stroke="#f6d090" stroke-width=".9" stroke-linecap="round"/>`).join('')}
        <path d="M-14-1Q-10-5-5-1Q0-5 5-1Q10-5 14-1" fill="none" stroke="#4a2210" stroke-width="2.2" stroke-linecap="round"/><path d="M-12-3l3-2 3 2 3-2 3 2 3-2 3 2 3-2" fill="none" stroke="#fffaf0" stroke-width=".9" stroke-linecap="round"/>
        <path class="tp-dance" d="M-4-5q1.6-3 .4-6q-1.8 1.4-1.4 3.6zM5-5q2-2.6 1-5.6q-1.8 1.2-1.6 3.4z" fill="#e8c8a0" stroke="#9a6a3a" stroke-width=".35"/></g>`
      + `<text class="tp-boardt" x="49" y="163.4" font-size="2.6" text-anchor="middle" opacity=".8">注文ごとに 鉄板からひと舟</text>`;
    const noren = Array.from({ length: 5 }, (_, i) => `<path d="M${5 + i * 22.2} 3h21.4v15q-1 1.2-2 0H${7 + i * 22.2}q-1 1.2-2 0z" fill="${nv}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><text class="tp-noren" x="${15.7 + i * 22.2}" y="14" font-size="8" text-anchor="middle">${'てっぱん丸'[i]}</text>`).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd"/>
      ${noren}
      <rect x="5" y="21" width="88" height="35" rx="2" class="tp-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      ${lantern}${lamps}${board}${SK(WN[0], WN[1], WN[2], WN[3], 3, { hole: true })}
      <rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><path class="nohit" d="M34 56L42 56L36 102H28Z" fill="#fff" opacity=".05"/><path class="nohit" d="M62 56L65 56L59 102H56Z" fill="#fff" opacity=".04"/>
      ${R3(95, 22, 20, 12, 1, `<rect class="recess" x="98" y="26" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="32" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 37, 10, 13, 1.6, `<rect class="recess" x="104.2" y="39" width="1.6" height="9" rx=".6"/><rect class="tp-slotglow" x="98.6" y="35.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="54" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 82, 20, 14, .8, `<text class="label" x="105" y="86.4" font-size="2.2" text-anchor="middle">生地</text><rect x="98" y="88.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="tp-gauge" x="98.4" y="88.8" width="13.2" height="2.6" rx=".8" fill="${BATTER[0]}"/>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 104, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 104h4"/>' })}<text class="label" x="105" y="111" font-size="2.4" text-anchor="middle">返却</text>
      ${CORE.lock(100, 122)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="tp-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃい</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text tp-ready" style="--lc:${yl}" x="60" y="190.4" font-size="3.1" text-anchor="middle">焼きあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${nv}" opacity=".95"/><text class="tp-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="tp-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/>
      <rect class="face" x="5" y="21" width="88" height="35" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    void cr;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'tp-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'tp-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.tp-tile')], slotGlow: door.querySelector('.tp-slotglow'),
      lcd: door.querySelector('.tp-lcd'), gauge: door.querySelector('.tp-gauge'), cookLamp: door.querySelector('.tp-cooklamp'), waitLamp: door.querySelector('.tp-waitlamp'),
      ready: door.querySelector('.tp-ready'), flap: door.querySelector('.tp-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="21" width="88" height="35"/><rect class="xline" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, ball, dimple, griddle, griddleBody, boat, carriage, carousel, toppers, belt, hoses, icon, tanks, BOAT, DROP,
    food, pack, station, deckBelt, liftCar, DCLOSE, LZT };
})();
