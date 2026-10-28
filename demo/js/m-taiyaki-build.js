/* Fig 13 · たい焼き「しっぽまで」— geometry. Made up, built like a plant (one station per step, no robot arm; the door
   hides the works and frames one moment; 2026-10-17).
   A chain of seven hinged cast-iron moulds runs round a vertical loop, two sprockets on axles along y. Along the top run
   the moulds lie open: at the filling station a nozzle lays batter in (or the croissant sheet, with the upgrade), the
   filling rack slides the chosen hopper over and deposits, the nozzle lays the top layer; a guide closes the lid on the
   way to the right sprocket. Round the sprocket the mould turns upside down — the flip the hand does at a stall, done by
   the chain — and the bottom run carries it over the lower burner to bake the other side. Up the left sprocket it comes
   to the eject station: a cam opens the lid, pins lift the fish, a blade sweeps it onto the chute; at its foot two suction
   cups pull a paper sleeve open, the fish drops in, and the bag goes down a slide to the take-out window.
   The flaw: burnt batter builds up in a mould with every bake; a dirty mould turns out a scorched fish (sold cheaper)
   until a scraper goes over the moulds at a restock. The roller brush cleans each mould on every lap.
   The door shows the eject station only. Where a world point shows on the door: u = x − y + 84, v = 156 + y − z. */
const TY = (() => {
  const W = 120, D = 84, H = 240;
  // the chain loop in the x–z plane at depth y: sprocket centres x0, x1 at height zm, radius r
  const CH = { y: 60, x0: 25, x1: 73, zm: 112, r: 12 };
  const S = CH.x1 - CH.x0, LEN = 2 * S + 2 * Math.PI * CH.r, N = 7, PITCH = LEN / N;
  const MOULD = { a: 8.4, b: 8, t: 2.2, open: 1.75 };   // half length (along the chain), half depth, half thickness, the lid's open angle
  // a point on the loop: s = 0 at the top of the left sprocket, right along the top run, down round the right sprocket,
  // left along the bottom run, up round the left. o: [x, z]; t: the way it runs; n: outward
  function frame(s) {
    s = ((s % LEN) + LEN) % LEN; const { x0, x1, zm, r } = CH;
    if (s < S) return { o: [x0 + s, zm + r], t: [1, 0], n: [0, 1] };
    s -= S; if (s < Math.PI * r) { const a = s / r; return { o: [x1 + r * Math.sin(a), zm + r * Math.cos(a)], t: [Math.cos(a), -Math.sin(a)], n: [Math.sin(a), Math.cos(a)] }; }
    s -= Math.PI * r; if (s < S) return { o: [x1 - s, zm - r], t: [-1, 0], n: [0, -1] };
    s -= S; const a = s / r; return { o: [x0 - r * Math.sin(a), zm - r * Math.cos(a)], t: [-Math.cos(a), Math.sin(a)], n: [-Math.sin(a), -Math.cos(a)] };
  }
  // the stations by s, and their x on the top run
  const STN = { eject: 0, fill: PITCH, close: 2 * PITCH };
  const SX = { eject: CH.x0, fill: CH.x0 + PITCH, brush: CH.x0 + PITCH / 2 };
  const TOP = CH.zm + CH.r;
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): dough and filling colour
  const MENU = [
    { name: 'つぶあん', price: 240, g: 'tsubu', dough: 'plain', fill: '#6a2a2a', tier: 1 }, { name: 'こしあん', price: 240, g: 'koshi', dough: 'plain', fill: '#4a1a1a', tier: 1 },
    { name: 'カスタード', price: 260, g: 'custard', dough: 'plain', fill: '#f6d860', tier: 1 }, { name: 'チョコ', price: 260, g: 'choco', dough: 'plain', fill: '#5a3018', tier: 1 },
  ];
  // dough: [colour, its light]
  const DOUGH = { plain: ['#d8902a', '#f0b860'], matcha: ['#7a9a3a', '#a8c86a'], black: ['#3a3030', '#5e4e4a'], pink: ['#e08a96', '#f6b8c0'], cro: ['#c07a2a', '#e8a860'], gold: ['#d8a020', '#ffd860'] };
  // the fish in mould units (u along the chain, head toward −u, v across)
  const FISH = [[-7.6, 0], [-6.8, -2.6], [-4.2, -4.2], [-.4, -4.5], [3, -3.4], [4.8, -1.4], [7, -3.6], [7.9, -2.6], [7.4, 0], [7.9, 2.6], [7, 3.6], [4.8, 1.4], [3, 3.4], [-.4, 4.5], [-4.2, 4.2], [-6.8, 2.6]];
  return { W, D, H, CH, S, LEN, N, PITCH, MOULD, frame, STN, SX, TOP, WINDOW, MENU, DOUGH, FISH, SLOTW: [105, D, 196] };
})();

const TYB = (() => {
  const { FRONT, TOP: TOPP, box, rect, path, P, f } = ISO;
  const { W, D, H, CH, MOULD, frame, STN, SX, TOP, DOUGH, FISH } = TY;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringZ(z0, r0, n, 0, Math.PI * 2, x, y), ...ringZ(z1, r1, n, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ringZ(z, r, n, 0, Math.PI * 2, x, y))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  // a cylinder lying along y (the roller brush, the dough roll): rings in the x–z plane
  const ringY = (y, x, z, r, n = 16) => Array.from({ length: n }, (_, i) => { const t = i / n * Math.PI * 2; return P(x + r * Math.cos(t), y, z + r * Math.sin(t)); });
  const cylY = (x, y0, y1, z, r, fill, end = fill) => `<path d="${toD(hull([...ringY(y0, x, z, r), ...ringY(y1, x, z, r)]))}" style="fill:${fill};${ST}"/>` + `<path d="${toD(ringY(y1, x, z, r))}" style="fill:${end};${ST}"/>`;

  /* ---------- the view: which way faces the camera (for the moulds' faces) ---------- */
  let VIEW = [1, 1, 1];
  function setView() { const a = P(1, 0, 0), b = P(0, 1, 0), c = P(0, 0, 1), r1 = [a[0], b[0], c[0]], r2 = [a[1], b[1], c[1]];
    let d = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]]; if (d[2] < 0) d = d.map(v => -v); VIEW = d; }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /* ---------- a mould at s, its lid open by phi: point functions in mould units (u along, v across, w out) ---------- */
  function mould(s, phi) {
    const { a, b, t } = MOULD, fr = frame(s), O = [fr.o[0], CH.y, fr.o[1]], T = [fr.t[0], 0, fr.t[1]], Nn = [fr.n[0], 0, fr.n[1]];
    const pt = (u, v, w) => [O[0] + u * T[0] + w * Nn[0], O[1] + v, O[2] + u * T[2] + w * Nn[2]];
    const c = Math.cos(phi), sn = Math.sin(phi);
    // the lid turns about its hinge (the back edge, v = −b, at w = t)
    const lp = (u, v, w) => pt(u, -b + (v + b) * c - (w - t) * sn, t + (v + b) * sn + (w - t) * c);
    const lidW = [Nn[0] * c, -sn, Nn[2] * c];   // the lid's outward normal
    return { pt, lp, N: Nn, lidW, centre: pt(0, 0, t / 2), lidCentre: lp(0, 0, t * 1.5) };
  }
  const slabHull = (fn, w0, w1) => { const { a, b } = MOULD, pts = []; for (const u of [-a, a]) for (const v of [-b, b]) for (const w of [w0, w1]) pts.push(P(...fn(u, v, w))); return toD(hull(pts)); };
  const faceD = (fn, w, k = 1) => { const { a, b } = MOULD; return toD([[-a, -b], [a, -b], [a, b], [-a, b]].map(([u, v]) => P(...fn(u * k, v * k, w)))); };
  const fishD = (fn, w, k = 1) => toD(FISH.map(([u, v]) => P(...fn(u * k, v * k, w))));
  const blobD = (fn, w, cu, cv, ru, rv) => toD(Array.from({ length: 10 }, (_, i) => { const t = i / 10 * Math.PI * 2; return P(...fn(cu + ru * Math.cos(t), cv + rv * Math.sin(t), w)); }));
  const dotsD = (fn, w, pts, r) => pts.map(([u, v]) => toD([[u - r, v - r], [u + r, v - r], [u + r, v + r], [u - r, v + r]].map(([x, y]) => P(...fn(x, y, w))))).join('');
  const CRUMBS = [[-4, -1.6], [-1, 2.2], [2.2, -1], [4.4, 1.6], [-5.6, 1.2], [.6, -3]];
  const SCORCH = [[-3, -1.2], [1.4, 1.6], [4.6, -.6]];
  // the paths of one mould: o = { st, dough, fill, dirty, burnt }; returns the d / fill of each of its eight slots and
  // whether the lid goes behind the bottom half
  function mouldPaths(s, phi, o) {
    const { t } = MOULD, M = mould(s, phi), up = dot(M.N, VIEW) > 0;   // up: the bottom half's open face shows
    const r = { bHull: slabHull(M.pt, 0, t), lHull: slabHull(M.lp, t, 2 * t), lidBehind: dot(M.lidCentre, VIEW) < dot(M.centre, VIEW), depth: dot(M.centre, VIEW) };
    r.bFace = faceD(M.pt, up ? t : 0); r.bFill = up ? '#3a3a42' : '#46464e';
    const [dc, dl] = DOUGH[o.dough] || DOUGH.plain;
    r.cont = ''; r.contFill = 'none'; r.contStroke = 'none'; r.spots = ''; r.spotFill = '#141416'; r.eye = null;
    if (up) {
      const w = t + .02;
      if (o.st === 'empty') { r.cont = fishD(M.pt, w); r.contFill = '#141416'; if (o.dirty) { r.spots = dotsD(M.pt, w + .01, CRUMBS, .45); r.spotFill = '#5a3a1a'; } }
      else if (o.st === 'batter' || o.st === 'top') { r.cont = fishD(M.pt, w); r.contFill = o.dough === 'cro' ? '#f0d8a0' : '#f2dc98'; r.contStroke = o.dough === 'cro' ? '#c8a060' : 'none'; }
      else if (o.st === 'fill') { r.cont = fishD(M.pt, w); r.contFill = o.dough === 'cro' ? '#f0d8a0' : '#f2dc98'; r.spots = blobD(M.pt, w + .01, .4, 0, 3.2, 2); r.spotFill = o.fill; }
      else if (o.st === 'baked') { const lift = o.lift || 0; r.cont = fishD(M.pt, w + .3 + lift, 1); r.contFill = dc; r.contStroke = dl; r.eye = P(...M.pt(-5.4, -1.3, w + .4 + lift));
        if (o.burnt) { r.spots = dotsD(M.pt, w + .35 + lift, SCORCH, 1.3); r.spotFill = '#4a2008'; } }
    } else { r.cont = fishD(M.pt, -.02, .92); r.contStroke = '#6a6a74'; }   // the back of the mould: the fish cast in the iron
    // the lid: its outer face (cast fish) or, open, its inside (the empty half of the fish)
    const outer = dot(M.lidW, VIEW) > 0;
    r.lFace = faceD(M.lp, outer ? 2 * t : t); r.lFill = outer ? '#4a4a52' : '#38383e';
    r.lFish = fishD(M.lp, outer ? 2 * t + .02 : t - .02, outer ? .92 : 1); r.lFishFill = outer ? 'none' : (o.st === 'baked' ? dl : '#141416'); r.lFishStroke = outer ? '#6a6a74' : 'none';
    return r;
  }

  /* ---------- the fish, flat (the board, the icons, the take-out, the chute) ---------- */
  const FISH2D = 'M-12 0Q-11-6.2-4-7.2Q4-7.6 8-3.2L12.4-6.4Q14 0 12.4 6.4L8 3.2Q4 7.6-4 7.2Q-11 6.2-12 0Z';
  // a fish lying flat at world (x, y, z), head toward −x (the chute, the take-out window)
  function fishAt(x, y, z, o, k = 1) {
    const [dc, dl] = DOUGH[o.dough] || DOUGH.plain, pts = FISH.map(([u, v]) => P(x + u * k, y + v * k, z));
    let s = `<path d="${toD(pts)}" fill="${dc}" stroke="${dl}" stroke-width=".7" vector-effect="non-scaling-stroke"/>`;
    const [ex, ey] = q(x - 5.4 * k, y - 1.3 * k, z + .1); s += `<circle cx="${ex}" cy="${ey}" r="${f(.55 * k)}" fill="#2a1408"/>`;
    [[-1.6, 0], [1.4, 0]].forEach(([u]) => { const [a, b] = q(x + u * k, y - 2.6 * k, z + .1), [c, d] = q(x + (u + 1) * k, y, z + .1), [e, g] = q(x + u * k, y + 2.6 * k, z + .1); s += `<path d="M${a} ${b}Q${c} ${d} ${e} ${g}" fill="none" stroke="${dl}" stroke-width=".5"/>`; });
    if (o.dough === 'gold') [[-2, -1.4], [1.6, 1.2], [3.4, -1]].forEach(([u, v]) => { const [a, b] = q(x + u * k, y + v * k, z + .2); s += `<path d="M${a} ${f(+b - .6)}l.5.6-.5.6-.5-.6z" fill="#fff6b0"/>`; });
    if (o.burnt) SCORCH.forEach(([u, v]) => { const [a, b] = q(x + u * k, y + v * k, z + .2); s += `<ellipse cx="${a}" cy="${b}" rx="1.3" ry=".8" fill="#4a2008" opacity=".85"/>`; });
    return s;
  }
  // the flat fish for the menu tiles and the shop (24 × 24): the fish, a bite at its head showing the filling
  function icon(dough, fill) {
    const [dc, dl] = DOUGH[dough] || DOUGH.plain, k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"';
    // (app build, goods polish: scales and the tail's fin lines from the mould, a shine, and what the filling is made
    // of in the bite: beans, chunks, sesame, seeds, ham and cheese — known by its colour, as the shop passes only that)
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const bite = { '#6a2a2a': ['#4a1414', dots([[-10.6, -2.6], [-9.4, 1.8], [-10.8, 3.6], [-9.6, -4.8]], .55)], '#9ac84a': ['#6a9a2a', dots([[-10.6, -2.4], [-9.6, 2], [-10.4, 4.4]], .6)],
      '#2a2420': ['#c8c0b0', dots([[-10.6, -3], [-9.8, 1], [-10.6, 3.8], [-9.6, -5]], .3)], '#ff8aa0': ['#ffe14a', dots([[-10.4, -3], [-9.8, 1.6], [-10.6, 4]], .3)],
      '#c88a3a': ['#f2c45a', 'M-11 -1.6l1.6-.6.6 1.6-1.6.6z'], '#f0b040': ['#c87a2a', 'M-11 .8l1.4-.4.4 1.4-1.4.4z'], '#f6c8b0': ['#ffd23f', 'M-11.2 1.6h1.6v1.8h-1.6z'] }[fill];
    let s = `<g transform="translate(12.6 12.6) scale(.82)"><path d="${FISH2D}" fill="${dc}" ${k}/><path d="M-12 0Q-11-6.2-8-6.8Q-6.4-3.4-8.6-1.2Q-6-0 -8.6 1.4Q-6.4 3.6-8 6.8Q-11 6.2-12 0Z" fill="${fill}" ${k}/>`
      + (bite ? `<path d="${bite[1]}" fill="${bite[0]}"/>` : '')
      + `<circle cx="-4.6" cy="-2.6" r="1.1" fill="#141018"/><path d="M-1 -5q2 5 0 10M3 -4.4q2 4.4 0 8.8" fill="none" stroke="${dl}" stroke-width="1.1"/>`
      + `<path d="M.6 -1.6q.9 .9 1.8 0M.6 1.6q.9 .9 1.8 0M4.6 -1.2q.8 .8 1.6 0M4.6 1.6q.8 .8 1.6 0M9.4 -2.4l2-2.4M9.8 0h2.2M9.4 2.4l2 2.4M-4 5.4q2.4 .8 5 .4" fill="none" stroke="${dl}" stroke-width=".7" stroke-linecap="round"/>`
      + `<path d="M-7.6 -4.6q2-1.8 4.8-2.2" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".5"/>`;
    if (dough === 'cro') s += `<path d="M-3-6.4l2 12.8M1-6.6l2 13.2M5-5.4l1.6 10.8" stroke="#8a4a1a" stroke-width=".8" opacity=".6"/>`;
    if (dough === 'gold') s += `<path d="M0-3l1 1.4-1 1.4-1-1.4zM6 1l.8 1.1-.8 1.1-.8-1.1z" fill="#fff6b0"/>`;
    return s + `</g>`;
  }
  // the crate: a pack of filling (in its colour), the batter bag, the scraper
  function defs() {
    const pack = `<g id="g-ty-pack">${box(-5.5, -3.5, 0, 11, 7, 2, 0, 'ty-pack')}<g transform="${TOPP(-5.5, -3.5, 2.03)}"><rect x="1" y="1" width="9" height="5" rx="2.4" style="fill:var(--c)"/></g></g>`;
    const bag = `<g id="g-ty-batter"><path d="M-6 0q-1-10 1-13q5-1.4 10 0q2 3 1 13q-6 1.4-12 0z" fill="#f6f0dc" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-4" y="-9" width="8" height="5" rx="1" fill="#d8902a"/><text x="0" y="-5.4" font-size="3.4" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">生地</text></g>`;
    const scraper = `<g id="g-ty-scraper"><rect x="-1" y="-14" width="2" height="9" rx="1" fill="#a8642a" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-5 -5h10l-1 5h-8z" fill="#c9d0da" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/></g>`;
    return pack + bag + scraper;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the bagging station (user, 2026-10-17: bagging can be a simple mechanism too) ----------
     At the foot of the chute a rack of flat paper sleeves stands on end. Two suction cups pull the front one open, the fish
     drops in head up, the cups let go, and the rack's floor flap lets the bag down the slide to the take-out window. The
     sleeves never run out (a feeder from the carton below; no extra chore at the restock) */
  const BAG = { x: SX.eject, y: 76, z: 84, w: 12, h: 14 };
  const print = (w, h) => `<circle cx="${w / 2}" cy="${h * .42}" r="${f(w * .27)}" fill="#a8302a"/><g transform="translate(${w / 2} ${f(h * .42)}) scale(${f(w * .016)})"><path d="${FISH2D}" fill="#fff4dc"/></g><text x="${w / 2}" y="${f(h * .86)}" font-size="${f(w * .16)}" text-anchor="middle" fill="#a8302a" class="sign">しっぽまで</text>`;
  // the back of the rack: the floor, the stack of flat sleeves, the open sleeve's back panel and its mouth (open: 0..1)
  function bagBack(open) {
    const { x, y, z, w, h } = BAG;
    let s = box(x - w / 2 - 2, y - 6, z - 2, w + 4, 11, 2, 0, 'ty-steel') + post(x - w / 2 - 1.4, y - 5, z, h + 4, 'ty-steel') + post(x + w / 2 + 1.4, y - 5, z, h + 4, 'ty-steel');
    for (let i = 4; i >= 1; i--) s += `<g transform="${FRONT(x - w / 2, y - i * 1.1, z + h)}"><rect width="${w}" height="${h}" fill="#e8d8b4" stroke="rgba(0,0,0,.3)" stroke-width=".4" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${FRONT(x - w / 2, y + .1, z + h)}"><rect width="${w}" height="${h}" fill="#d8c8a4"/></g>`;
    if (open > .05) s += `<path d="${toD([P(x - w / 2, y + .1, z + h), P(x + w / 2, y + .1, z + h), P(x + w / 2 - 1, y + .2 + 3 * open, z + h), P(x - w / 2 + 1, y + .2 + 3 * open, z + h)])}" fill="#6a5a3a"/>`;
    return s;
  }
  // the front of the rack: the open sleeve's printed front panel and the two cups holding it (drawn after a falling fish)
  function bagFront(open) {
    const { x, y, z, w, h } = BAG, yf = y + .2 + 3 * open;
    return `<g transform="${FRONT(x - w / 2, yf, z + h)}"><rect width="${w}" height="${h}" fill="#f0e2c4" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/>${print(w, h)}</g>`
      + [-1, 1].map(sx => seg([x + sx * (w / 2 - 2.4), yf + .3, z + h - 3], [x + sx * (w / 2 - 2.4), yf + 3.4 - open * 1.6, z + h - 3], '#8a93a4', .9) + disc(x + sx * (w / 2 - 2.4), yf + .3, z + h - 3, 1.2, '#2a2a30', 8)).join('');
  }
  // the fish standing head up (falling into the sleeve), and the fish in its bag (the slide, the take-out window)
  const fishUp = (x, y, z, o, k = 1) => { const [dc, dl] = DOUGH[o.dough] || DOUGH.plain;
    return `<g transform="${FRONT(x, y, z)}"><g transform="rotate(90) scale(${f(.5 * k)})"><path d="${FISH2D}" fill="${dc}" stroke="${dl}" stroke-width="1"/><circle cx="-8" cy="-2.4" r="1.4" fill="#2a1408"/></g></g>`; };
  function bagged(x, y, z, o, k = 1) {
    const w = BAG.w * k, h = BAG.h * k;
    return fishUp(x, y, z + h + 4 * k, o, k) + `<g transform="${FRONT(x - w / 2, y + .05, z + h)}"><rect width="${w}" height="${h}" fill="#f0e2c4" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M${f(w * .1)} 0v${f(h * .12)}M${f(w * .9)} 0v${f(h * .12)}" stroke="rgba(0,0,0,.18)" stroke-width=".5"/>${print(w, h)}</g>`;
  }

  /* ---------- moving parts, drawn again as they move ---------- */
  // the filling rack high over the filling station (above the door's window): four hoppers on a slide; off: how far it
  // has slid (hopper k over the drop tube at off = k). The filling falls through a fixed tube onto the mould
  const RACK = { y: CH.y + 5.4, z: TOP + 34, gap: 6.4, tube: TOP + 10 };
  function rack(off, slots) {
    let s = box(SX.fill - 16, RACK.y - 1, RACK.z + 11, 32 + 3 * RACK.gap, 2, 1.6, 0, 'ty-steel');
    slots.forEach((c, k) => { const x = SX.fill + (k - off) * RACK.gap;
      s += cyl(x, RACK.y, RACK.z + 3, RACK.z + 11, 2.6, 2.6, '#dfe5ec', 12) + `<g transform="${FRONT(x - 1.4, RACK.y + 2.65, RACK.z + 9)}"><rect width="2.8" height="4.4" rx=".6" style="fill:${c}"/></g>` + cyl(x, RACK.y, RACK.z, RACK.z + 3, .6, 2.6, '#aab3bf', 10); });
    return s;
  }
  // a stream from a nozzle down onto the mould at the filling station
  const stream = (x, y, z0, c, w) => seg([x, y, z0], [x, y, TOP + MOULD.t + .3], c, w, 'butt');
  // the drop tube under the rack (the chosen hopper stands over its funnel)
  const dropTube = () => cyl(SX.fill, RACK.y, RACK.tube, RACK.z - 1, .9, .9, '#c9d0da', 10) + cyl(SX.fill, RACK.y, RACK.z - 2.4, RACK.z - .6, 1, 2.6, '#aab3bf', 12);
  // the eject station: the pins (e: 0 down, 1 up through the mould), the blade (e: 0 at the back, 1 swept over to the front)
  const pins = e => post(SX.eject, CH.y, TOP - 9 + 6 * e, 6, 'ty-steel');
  const blade = e => box(SX.eject - 7, CH.y - 10 + 18 * e, TOP + MOULD.t + 1.4, 14, 1.2, 2.4, 0, 'ty-steel') + seg([SX.eject, CH.y - 10 + 18 * e, TOP + MOULD.t + 3.8], [SX.eject, CH.y - 14, TOP + 10], '#c9d0da', .8);
  // the roller brush (with the upgrade): its stripes turn while the chain moves
  const brush = turn => { const x = SX.brush, z = TOP + MOULD.t * 2 + 2.6;
    return cylY(x, CH.y - MOULD.b, CH.y + MOULD.b, z, 2.6, '#7a5a3a', '#9a7a5a') + Array.from({ length: 4 }, (_, i) => { const a = turn + i * Math.PI / 2; if (Math.sin(a) < -.3) return ''; return seg([x + 2.6 * Math.cos(a), CH.y - MOULD.b, z + 2.6 * Math.sin(a)], [x + 2.6 * Math.cos(a), CH.y + MOULD.b, z + 2.6 * Math.sin(a)], '#3a2a1a', .6); }).join(''); };

  /* ---------- the inside. lv: fitted parts { brush, fire, cro } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right; setView();
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the batter tank with its pump, the gas regulator, boxes of paper sleeves
    s += cyl(22, 46, 6, 50, 11, 11, '#e8e0cc', 20) + disc(22, 46, 50, 11, '#d0c8b4', 20) + `<g transform="${FRONT(14, 57.05, 42)}"><rect width="16" height="6" rx="1" fill="#d8902a"/><text x="8" y="4.4" font-size="3.4" text-anchor="middle" fill="#fff" class="sign">生地</text></g>`;
    s += `<path class="ty-pipe" d="${path([[22, 46, 50], [22, 46, 80], [SX.fill - 8, 44, 80], [SX.fill - 8, 44, TOP + 22]])}"/>`;
    s += box(56, 34, 6, 22, 16, 22, 0, 'ty-carton') + `<g transform="${FRONT(56, 50.05, 22)}"><text x="11" y="8" font-size="3" text-anchor="middle" fill="#a8302a" class="sign">たい焼き袋</text></g>`;
    s += box(80, 40, 6, 10, 10, 14, 0, 'ty-steel') + cyl(85, 45, 20, 26, 2.2, 2.2, '#e8453a', 10);
    s += box(2, 26, 70, 90, 58, 4, 0, 'ty-floor');
    // the frame: a back plate carrying the two axles, the sprockets, the chain behind the moulds
    const bp = CH.y - MOULD.b - 2.4;
    s += `<g transform="${FRONT(CH.x0 - CH.r - 6, bp, CH.zm + CH.r + 10)}"><rect width="${CH.x1 - CH.x0 + 2 * CH.r + 12}" height="${2 * CH.r + 20}" rx="3" fill="#2a2e36" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>`;
    s += post(CH.x0 - CH.r - 4, bp, 74, CH.zm - 74 + CH.r + 10, 'ty-steel') + post(CH.x1 + CH.r + 4, bp, 74, CH.zm - 74 + CH.r + 10, 'ty-steel');
    [CH.x0, CH.x1].forEach(x => { s += `<g transform="${FRONT(x - CH.r + 1, bp + .1, CH.zm + CH.r - 1)}"><circle cx="${CH.r - 1}" cy="${CH.r - 1}" r="${CH.r - 1}" fill="#3a3f48" stroke="#5a6270" stroke-width="1.6" stroke-dasharray="2 1.4" vector-effect="non-scaling-stroke"/><circle cx="${CH.r - 1}" cy="${CH.r - 1}" r="2.4" fill="#8a93a4"/></g>`; });
    s += `<g transform="${FRONT(CH.x0 - CH.r, bp + .2, CH.zm + CH.r)}"><rect width="${CH.x1 - CH.x0 + 2 * CH.r}" height="${2 * CH.r}" rx="${CH.r}" fill="none" stroke="#5a6270" stroke-width="2" stroke-dasharray="2.4 1.6" vector-effect="non-scaling-stroke"/></g>`;
    // the burners: one inside the loop (heats the top run from below), one under the bottom run; small still flames
    const flames = (x0, x1, y, z) => { let o = box(x0, y - 1.2, z - 2, x1 - x0, 2.4, 2, 0, 'ty-steel'); for (let x = x0 + 2; x < x1; x += 3.4) { const [a, b] = q(x, y, z); o += `<path d="M${f(+a - .8)} ${b}q.8-2.6.8-2.8q0 .2.8 2.8z" fill="#5ab4ff" opacity=".85"/>`; } return o; };
    s += flames(CH.x0 + 4, CH.x1 - 4, CH.y, CH.zm + 2) + flames(CH.x0 - 4, CH.x1 + 4, CH.y, CH.zm - CH.r - MOULD.t * 2 - 7);
    if (lv.fire) s += `<g data-part="fire">${flames(CH.x0 + 4, CH.x1 - 4, CH.y + 5, CH.zm + 2)}${flames(CH.x0 - 4, CH.x1 + 4, CH.y + 5, CH.zm - CH.r - MOULD.t * 2 - 7)}${cyl(CH.x1 + CH.r + 8, CH.y - 4, 74, 96, 2.6, 2.6, '#e8453a', 10)}${disc(CH.x1 + CH.r + 8, CH.y - 4, 96, 2, '#ffd23f', 10)}</g>`;
    g.insertAdjacentHTML('beforeend', s);
    if (!lv.fire) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(CH.x0 + 4, CH.y + 3.8, CH.zm, CH.x1 - CH.x0 - 8, 2.4, 2, 'ugh')}${CORE.edges(CH.x1 + CH.r + 5.4, CH.y - 6.6, 74, 5.2, 5.2, 22, 'ugh')}</g>`);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the batter hopper and its nozzle over the filling station (at the back); the croissant roll beside it (upgrade)
    let k = cyl(SX.fill - 8, 44, TOP + 22, TOP + 38, 5, 6, '#e8e0cc', 16) + disc(SX.fill - 8, 44, TOP + 38, 6, '#f2dc98', 16)
      + `<g transform="${FRONT(SX.fill - 12, 49.2, TOP + 33)}"><rect width="8" height="3" rx=".6" fill="#d8902a"/><text x="4" y="2.3" font-size="2.2" text-anchor="middle" fill="#fff" class="sign">生地</text></g>`
      + `<path class="ty-pipe" d="${path([[SX.fill - 8, 44, TOP + 22], [SX.fill - 8, 44, TOP + 14], [SX.fill, CH.y - 3, TOP + 14]])}"/>` + cyl(SX.fill, CH.y - 3, TOP + 9, TOP + 14, .8, 1.6, '#aab3bf', 10);
    k += lv.cro ? `<g data-part="cro">${cylY(SX.fill - 20, CH.y - 7, CH.y + 7, TOP + 30, 4.4, '#f0d8a0', '#e8c890')}${cylY(SX.fill - 20, CH.y - 7.2, CH.y + 7.2, TOP + 30, 1.4, '#8a93a4')}<path d="${toD([P(SX.fill - 16, CH.y - 7, TOP + 28), P(SX.fill - 16, CH.y + 7, TOP + 28), P(SX.fill - 6, CH.y + 7, TOP + 16), P(SX.fill - 6, CH.y - 7, TOP + 16)])}" fill="#f0d8a0" stroke="#c8a060" stroke-width=".5" vector-effect="non-scaling-stroke"/>${box(SX.fill - 7, CH.y - 8, TOP + 14, 2, 16, 1.6, 0, 'ty-steel')}<g transform="${FRONT(SX.fill - 24, CH.y + 7.1, TOP + 36)}"><text x="4" y="2" font-size="2" text-anchor="middle" fill="#fff4dc" class="sign">クロワッサン</text></g></g>`
      : `<g class="ugh-g">${CORE.edges(SX.fill - 24.4, CH.y - 7, TOP + 25.6, 8.8, 14, 8.8, 'ugh')}</g>`;
    // the eject chute: from the mould's front edge at the eject station down toward the take-out window
    k += `<path d="${toD([P(SX.eject - 6, CH.y + MOULD.b + 1, TOP + 2), P(SX.eject + 6, CH.y + MOULD.b + 1, TOP + 2), P(SX.eject + 6, BAG.y + 1, BAG.z + BAG.h + 8), P(SX.eject - 6, BAG.y + 1, BAG.z + BAG.h + 8)])}" style="fill:#aab3bf;${ST}"/>`;
    g.insertAdjacentHTML('beforeend', k);
    const pinsG = UTIL.g(g, pins(0), { class: 'ty-pins' });
    // the moulds (each a group of eight paths the machine updates), then what stands in front of them
    const mouldsG = UTIL.g(g, '', { class: 'ty-moulds' });
    const brushG = UTIL.g(g, lv.brush ? brush(0) : '', { class: 'ty-brush', 'data-part': lv.brush ? 'brush' : null });
    if (!lv.brush) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(SX.brush - 2.6, CH.y - MOULD.b, TOP + MOULD.t * 2, 5.2, MOULD.b * 2, 5.2, 'ugh')}</g>`);
    const bladeG = UTIL.g(g, blade(0), { class: 'ty-blade' });
    g.insertAdjacentHTML('beforeend', dropTube());
    const rackG = UTIL.g(g, '', { class: 'ty-rack' });
    const streamG = UTIL.g(g, '', { class: 'ty-streamg' });
    const bagG = UTIL.g(g, bagBack(0), { class: 'ty-bag' });
    const movers = UTIL.g(g, '', { class: 'ty-movers' });
    const bagFrontG = UTIL.g(g, bagFront(0), { class: 'ty-bagfront' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.brush ? '' : pin('brush', SX.brush, CH.y + MOULD.b + 2, TOP + 8)) + (lv.fire ? '' : pin('fire', CH.x1 - 6, CH.y + 8, CH.zm - CH.r - 12))
      + (lv.cro ? '' : pin('cro', SX.fill - 20, CH.y + 7, TOP + 30)));
    return { defs: defsEl, mouldsG, pinsG, brushG, bladeG, rackG, streamG, bagG, bagFrontG, movers, cm };
  }

  /* ---------- the shell and door: the noren, the menu, the sign, the window on the eject station, the board ---------- */
  // the door's grid: the window (x 30–68) is centred on the main column and frames the eject station (u 33–65, v 66–104):
  // the lid opening, the fish lifted out. Left of it the sign, right of it the crest and the lamps; under it the board
  const WN = [30, 64, 38, 40];
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, oc = '#d8902a', rd = '#a8302a';
    let s = CORE.sideFace(W, D, H) + rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a big fish in outline, たい焼き under it
    const sideFish = (cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="${FISH2D}" fill="rgba(216,144,42,.08)" stroke="${oc}" stroke-width=".7" vector-effect="non-scaling-stroke"/><circle cx="-7" cy="-2" r="1" fill="none" stroke="${oc}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M-2-5q2 5 0 10M2-4.6q2 4.6 0 9.2M6-3.6q1.6 3.6 0 7.2" fill="none" stroke="rgba(216,144,42,.6)" stroke-width=".6" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/>${sideFish(42, 70, 2.6)}
      ${['た', 'い', '焼', 'き'].map((ch, i) => `<text class="sign" x="42" y="${120 + i * 20}" font-size="17" text-anchor="middle" fill="rgba(216,144,42,.12)" stroke="rgba(216,144,42,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(216,144,42,.1)" stroke="${oc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${oc}">焼きたて ¥100〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}"/><g class="iso-only">${sideFish(42, 96, 2.4)}
      <text class="label" x="42" y="150" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(216,144,42,.6)">TAIYAKI · FRESHLY BAKED</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, fs = Math.min(2.8, 18.6 / (p.jp || p.name).length);
      return R3(x, y, 20.8, 30, 1, `<rect class="ty-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${oc}" opacity="0"/><g transform="translate(${x + 3.2} ${y + .6}) scale(.6)">${icon(p.dough, p.fill)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label ty-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit ty-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the sign left of the window, the crest and the lamps right of it, the cut-away board under it
    const sign = `<rect x="7" y="64" width="19" height="40" rx="2" class="ty-board"/>` + ['た', 'い', '焼'].map((c, i) => `<text class="ty-boardt" x="16.5" y="${76 + i * 11}" font-size="9" text-anchor="middle">${c}</text>`).join('');
    const crest = `<circle cx="82" cy="73" r="9" fill="${rd}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="82" cy="73" r="7.2" fill="none" stroke="#fff4dc" stroke-width=".8" vector-effect="non-scaling-stroke"/><g transform="translate(82 73) scale(.42)"><path d="${FISH2D}" fill="#fff4dc"/></g>`
      + R3(72, 85, 20, 6.4, .8, `<text class="lit-text ty-bakelamp" style="--lc:#ff8a3a" x="82" y="89.6" font-size="2.9" text-anchor="middle">焼成中</text>`, { r: 1.5, capCls: 'readycap' })
      + R3(72, 93.6, 20, 6.4, .8, `<text class="lit-text ty-scorchlamp" style="--lc:#ff4f3a" x="82" y="98.2" font-size="2.9" text-anchor="middle">焦げあり</text>`, { r: 1.5, capCls: 'readycap' });
    const board = `<rect x="6" y="110" width="86" height="58" rx="2" class="ty-board"/><text class="ty-boardt" x="49" y="119" font-size="4.6" text-anchor="middle">しっぽまで あんこぎっしり</text>`
      + `<g transform="translate(49 140) scale(2.3)"><path d="${FISH2D}" fill="#d8902a" stroke="#f0b860" stroke-width=".4"/><path d="M-10.4 -1Q-9.6-4.6-4-5.4Q4-5.6 7.4-2.2L11.4-4.6Q12.4 0 11.4 1.2L7.4 .6Q2 1.4-4 1Q-9.6 .6-10.4 -1Z" fill="#6a2a2a"/><circle cx="-8" cy="-3.2" r=".7" fill="#2a1408"/></g>`
      + `<path d="M75 128l6-4" stroke="#ffd27a" stroke-width=".7" vector-effect="non-scaling-stroke"/><text class="ty-boardt" x="82" y="124" font-size="2.8" text-anchor="middle">しっぽ</text>`
      + `<text class="ty-boardt" x="49" y="163" font-size="2.7" text-anchor="middle" opacity=".8">中身はメニューで選べます</text>`;
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd"/>
      ${[4, 42, 80].map(x => `<path d="M${x} 3h36v15q-9 2-18 0t-18 0z" fill="${rd}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('')}
      <text class="ty-noren" x="22" y="13.8" font-size="7" text-anchor="middle">たい</text><text class="ty-noren" x="60" y="13.8" font-size="7" text-anchor="middle">焼き</text><text class="ty-noren" x="98" y="13.2" font-size="5" text-anchor="middle">しっぽまで</text>
      <rect x="5" y="22" width="88" height="34" rx="2" class="ty-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#ffd27a">焼きたて · ひとつずつ</text>
      ${sign}${crest}${board}${SK(WN[0], WN[1], WN[2], WN[3], 3, { hole: true })}
      <rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><path class="nohit" d="M36 64L44 64L38 104H30Z" fill="#fff" opacity=".05"/><path class="nohit" d="M54 64L57 64L51 104H48Z" fill="#fff" opacity=".04"/>
      ${lv.cro ? `<g class="nohit" transform="translate(16 124) rotate(-8)"><circle r="7.4" fill="#c07a2a" stroke="#fff4dc" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-.6" font-size="2.3" text-anchor="middle" class="sign" fill="#fff">クロワッサン</text><text y="2.6" font-size="2.3" text-anchor="middle" class="sign" fill="#ffd27a">たい焼き</text><text y="5" font-size="1.3" text-anchor="middle" class="label" fill="#fff4dc">はじめました</text></g>` : ''}
      ${lv.brush ? `<g class="nohit" transform="translate(70 152) rotate(4)"><rect width="18" height="7" rx="1" fill="#e8fff0" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><circle cx="3" cy="3.5" r="1.6" fill="#3fd47a"/><text x="10.5" y="4.6" font-size="2.6" text-anchor="middle" class="sign" fill="#1a6a3a">毎回おそうじ</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="ty-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 60, 20, 14, .8, `<text class="label" x="105" y="64.4" font-size="2.2" text-anchor="middle">生地</text><rect x="98" y="66.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="ty-gauge" x="98.4" y="66.8" width="13.2" height="2.6" rx=".8" fill="#f2dc98"/>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${lv.fire ? R3(95, 91, 20, 8, .8, `<text class="lit-text ty-firelamp" style="--lc:#5ab4ff" x="105" y="96.4" font-size="3" text-anchor="middle">強火</text>`, { r: 1.5, capCls: 'readycap' }) : ''}
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="ty-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text ty-ready" style="--lc:${oc}" x="60" y="190.4" font-size="3.1" text-anchor="middle">焼きあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${rd}" opacity=".92"/><text class="ty-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="ty-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM${WN[0]} ${WN[1]}V${WN[1] + WN[3]}H${WN[0] + WN[2]}V${WN[1]}Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'ty-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'ty-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.ty-tile')], slotGlow: door.querySelector('.ty-slotglow'),
      lcd: door.querySelector('.ty-lcd'), gauge: door.querySelector('.ty-gauge'), bakeLamp: door.querySelector('.ty-bakelamp'), scorchLamp: door.querySelector('.ty-scorchlamp'), fireLamp: door.querySelector('.ty-firelamp'),
      ready: door.querySelector('.ty-ready'), flap: door.querySelector('.ty-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><rect class="xline" x="${WN[0]}" y="${WN[1]}" width="${WN[2]}" height="${WN[3]}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, mouldPaths, fishAt, fishUp, bagged, bagBack, bagFront, icon, rack, stream, pins, blade, brush, setView, FISH2D, RACK, BAG };
})();
