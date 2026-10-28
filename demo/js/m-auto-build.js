/* Fig 6 · オートレストラン — geometry, after the 1970s roadside "auto restaurant" machines: the toast-sandwich machine
   (foil-wrapped sandwiches pressed on a hot plate, red トースト中 lamp, ゴトッ), the Gooten burger machine (the box goes
   into a microwave whole and comes up behind the window) and Kawatetsu's curry machine (steam-warmed rice, a blade slits
   the retort pouch over it). One cabinet that grows: it starts with the toaster only; the microwave bay and the curry
   station are upgrades, empty bays (dashed in X-ray, 近日登場 plates on the door) until then.
   Top: two magazines of foil sandwiches over the hot plate and its press (kept clear of the cat's X-ray, which hangs
   over the lid); a thin glass chute down the left edge, out of the way of everything behind it.
   Middle: the frozen box column, the oven with its turntable, the lift at the front. Bottom: the steam box of rice trays,
   the pouch rack, the blade. Right: coin column (and the microwave's transformer under it). */
const AR = (() => {
  const W = 120, D = 84, H = 240;
  const MAG = { x: [16, 38], y: 44, z0: 176, step: 4.4 };                 // toaster magazines (6 sandwiches each)
  const PLATE = { x: 27, y: 66, z: 166 }, PRESS_UP = 7, CHUTE = { x: 9, y: 70 };
  const COL = { x: 14, y: 50, z0: 107, step: 7.8 };                         // frozen burger boxes (6)
  const OVEN = { x: 28, y: 28, z: 104, w: 46, d: 44, h: 40 }, TURN = [51, 50, 106];
  const LIFT = { x: 51, y: 76, top: 106, bottom: 22 };
  const TRAY = { x: 18, y: 44, z0: 46, step: 5 }, STATION = [58, 48, 46], RACK = { x0: 47, y: 40, z: 80, dx: 3.4 }, BLADE = [58, 48, 66];
  const WINDOW = [60, 74, 30];   // the goods sit a little high in the window: opened, they spread wider than a cup
  const CAPS = [6, 6, 6, 8];
  // the starting menu (overwritten by the goods plan); row: 0 toast, 1 burger, 2 curry; fill = filling / box art / roux colour
  const MENU = [
    { name: 'ハムトースト', price: 260, row: 0, fill: '#ff9aa8' },
    { name: 'チーズトースト', price: 270, row: 0, fill: '#ffd23f', o: 1 },
    { name: 'ハンバーガー', price: 320, row: 1, fill: '#e8453a' },
    { name: 'カレーライス', price: 350, row: 2, fill: '#b5651d' },
  ];
  return { W, D, H, MAG, PLATE, PRESS_UP, CHUTE, COL, OVEN, TURN, LIFT, TRAY, STATION, RACK, BLADE, WINDOW, CAPS, MENU, SLOTW: [105, D, 187] };
})();

const ARB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, MAG, PLATE, PRESS_UP, CHUTE, COL, OVEN, TURN, LIFT, TRAY, STATION, RACK, BLADE } = AR;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  /* ---------- glyphs: a foil sandwich (cold / toasted), a burger box, a rice tray (plain / with curry), a retort pouch,
     and the goods opened in the window: the foil spread out round a sandwich cut in two, the box with its lid back.
     CSS vars: --c filling / sauce / roux, --d topping colour, --o 1 for drips (cheese) or a topping on the curry ---------- */
  // a triangular sandwich half lying flat: bread, filling, bread in layers, its visible sides far to near, a toasted top
  function half(tri) {
    const bands = [[0, 1.3, 'fill:#e8b46a'], [1.3, 2.4, 'fill:var(--c)'], [2.4, 3.6, 'fill:#e8b46a']];
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
    const sides = tri.map((a, i) => { const b = tri[(i + 1) % 3]; let nx = b[1] - a[1], ny = a[0] - b[0];
      if (nx * ((a[0] + b[0]) / 2 - cx) + ny * ((a[1] + b[1]) / 2 - cy) < 0) { nx = -nx; ny = -ny; }
      return { a, b, vis: ISO.dir(nx, ny, 0) > 0, k: ISO.key((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }; }).filter(e => e.vis).sort((p, q) => p.k - q.k);
    let s = sides.map(({ a, b }) => bands.map(([z0, z1, fl]) => `<path d="${toD([P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)])}" style="${fl};${ST}"/>`).join('')).join('');
    const T = tri.map(p => P(p[0], p[1], 3.6)), mid = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    s += `<path d="${toD(T)}" fill="#d89a4a" style="${ST}"/>`;
    // grill marks across the top, and a topping (pepperoni, mayo) when the product has one
    [.35, .62].forEach(t => { const u = mid(T[0], T[1], t), v = mid(T[0], T[2], t); s += `<path d="M${f(u[0])} ${f(u[1])}L${f(v[0])} ${f(v[1])}" stroke="#9a5a22" stroke-width=".7" stroke-linecap="round"/>`; });
    [[.3, .3], [.5, .2], [.25, .55]].forEach(([u, v]) => { const x = tri[0][0] + (tri[1][0] - tri[0][0]) * u + (tri[2][0] - tri[0][0]) * v, y = tri[0][1] + (tri[1][1] - tri[0][1]) * u + (tri[2][1] - tri[0][1]) * v, q = P(x, y, 3.65);
      s += `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx="1" ry=".6" style="fill:var(--d)"/>`; });
    // the filling melting out of the cut side
    const m = [(tri[1][0] + tri[2][0]) / 2, (tri[1][1] + tri[2][1]) / 2], q = P(m[0], m[1], 1.6);
    return s + `<path d="M${f(q[0] - .8)} ${f(q[1])}q.2 2.4 .8 3.2q.6-.8.8-3.2z" style="fill:var(--c);opacity:var(--o)"/>`;
  }
  function defs() {
    const foil = (id, hot) => `<g id="${id}">${box(-9, -8, 0, 18, 16, 4, 0, hot ? 'au-foil hot' : 'au-foil')}<g transform="${TOP(-9, -8, 4.03)}"><path d="M2 3L15 13M5 1.6L17 9.6" class="au-crease"/><rect x="5.5" y="5" width="7" height="6" rx="1" style="fill:var(--c)" opacity=".9"/></g></g>`;
    const bbox = `<g id="g-bbox">${box(-6, -6, 0, 12, 12, 7, 0, 'au-bbox')}<g transform="${FRONT(-6, 6.03, 7)}"><rect y="1.4" width="12" height="2.2" style="fill:var(--c)"/><circle cx="6" cy="4.9" r="1.3" fill="#ffcf4a" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/></g><g transform="${TOP(-6, -6, 7.03)}"><path d="M2 6h8" class="au-crease"/></g></g>`;
    const rice = `<path d="${toD(hull([...ringZ(2.4, 4.4, 14, 0, Math.PI * 2, -1.8, 0), ...ringZ(4.2, 2.6, 14, 0, Math.PI * 2, -1.8, 0)]))}" fill="#fffdf6" style="${ST}"/>`;
    const tray = (id, curry) => `<g id="${id}">${rounded(-8, -6, 0, 16, 12, 2.4, 2.4, 'au-tray')}${rice}${curry ? `<path d="${toD(ringZ(2.6, 3.8, 16, 0, Math.PI * 2, 2.4, 0))}" style="fill:var(--c);${ST}"/><circle cx="${f(P(3.2, -.6, 2.7)[0])}" cy="${f(P(3.2, -.6, 2.7)[1])}" r=".7" fill="#fff" opacity=".35"/>
      <g style="opacity:var(--o)">${[-1.6, .4, 2.4].map(dx => `<path d="${toD([P(.6 + dx, -2.6, 3), P(2 + dx, -2.6, 3), P(2.6 + dx, 2.4, 3), P(1.2 + dx, 2.4, 3)])}" style="fill:var(--d);${ST}"/>`).join('')}</g>` : ''}</g>`;
    const pouch = `<g id="g-pouch"><g transform="${FRONT(-3.5, 0, 11)}"><rect width="7" height="11" rx=".8" fill="#c9d0da" style="${ST}"/><rect y="3.2" width="7" height="3.2" style="fill:var(--c)"/><path d="M1 1h5" stroke="#fff" stroke-width=".5" opacity=".7"/></g></g>`;
    const [px, py] = P(0, -4, 2.4);
    const set = `<g id="g-curryset"><use href="#g-pouch" x="${f(px)}" y="${f(py)}"/><use href="#g-tray"/></g>`;
    // opened toast: a crinkled foil sheet, two halves with their cut sides facing (far one first)
    const sheet = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = (i % 2 ? 8.6 : 10.2) + (i % 3) * .4; sheet.push(P(r * Math.cos(a), r * Math.sin(a) * .9, .1)); }
    const halves = [[[-7, -5], [1, -5], [-7, 3]], [[7, 5], [-1, 5], [7, -3]]].sort((a, b) => ISO.key(a[0][0], a[0][1]) - ISO.key(b[0][0], b[0][1]));
    const toastOpen = `<g id="g-toast-open"><path d="${toD(sheet)}" fill="#dfe5ec" style="${ST}"/><path d="${toD([P(-8, -1, .12), P(7, 2, .12)], false)}" class="au-crease"/><path d="${toD([P(-2, 7, .12), P(3, -7, .12)], false)}" class="au-crease"/>${halves.map(half).join('')}</g>`;
    // opened burger box: the lid tipped back, the burger on the base (bun, patty, cheese or sauce, sesame bun)
    const lid = toD([P(-6, -6, 3.5), P(6, -6, 3.5), P(6, -11, 12), P(-6, -11, 12)]);
    const cyl = (z0, z1, r0, r1, fill) => `<path d="${toD(hull([...ringZ(z0, r0, 18), ...ringZ(z1, r1, 18)]))}" style="fill:${fill};${ST}"/>`;
    const sesame = [[-1.6, -.8], [1.2, -1.6], [.4, 1.2], [-2.2, 1.4], [2.2, .6]].map(([x, y]) => { const q = P(x, y, 9.3); return `<ellipse cx="${f(q[0])}" cy="${f(q[1])}" rx=".55" ry=".3" fill="#fff8e6"/>`; }).join('');
    const bboxOpen = `<g id="g-bbox-open"><path d="${lid}" fill="#f6ecd4" style="${ST}"/><path d="${toD([P(-6, -8.2, 7.2), P(6, -8.2, 7.2), P(6, -9, 8.6), P(-6, -9, 8.6)])}" style="fill:var(--c)"/>${box(-6, -6, 0, 12, 12, 3.5, 0, 'au-bbox')}
      ${cyl(3.5, 4.9, 4.4, 4.7, '#e8a24a')}${cyl(4.9, 6.3, 4.9, 4.9, '#6a3a1e')}<path d="${toD(ringZ(6.4, 5.4, 18))}" style="fill:var(--c);${ST}"/>${cyl(6.5, 8.4, 4.8, 4.2, '#eaa24e')}${cyl(8.3, 9.4, 4.2, 2.6, '#eaa24e')}${sesame}</g>`;
    return foil('g-foil', false) + foil('g-foil-hot', true) + bbox + tray('g-tray', false) + tray('g-tray-c', true) + pouch + set + toastOpen + bboxOpen;
  }
  // a product's look as CSS vars (every var always set: an unset one would make its rule invalid)
  const vars = p => `--c:${p.fill};--d:${p.d || 'transparent'};--o:${p.o || 0}`;
  const use = (id, p, x, y, z) => { const [sx, sy] = P(x, y, z); return `<use href="#${id}" x="${f(sx)}" y="${f(sy)}" style="${vars(p)}"/>`; };
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const post = (x, y, z, h) => box(x - .8, y - .8, z, 1.6, 1.6, h);
  // glass drawn as its edges only: big translucent faces cost a full blend every frame the rain repaints over them
  const glassBox = (x, y, z, w, d, h, cls = 'au-glass') => CORE.edges(x, y, z, w, d, h, cls);

  /* ---------- the inside. lv: fitted parts { press, burger, curry } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right;
    let s = CORE.shell(W, D, H);
    // the main harness up the back wall from the control board: to the fan, the timer, and the bays (the burger bay's
    // socket, the curry bay's steam heater), so empty bays read as ready and waiting, not as empty space
    const harness = [[[104, 4, 70], [104, 4, 214], [96, 30, 214]], [[104, 4, 186], [66, 4, 186], [66, 42, 186]], [[104, 4, 128], [60, 4, 128]], [[104, 4, 70], [104, 4, 40], [30, 4, 40], [30, 4, 30]]];
    s += harness.map(w => `<path class="wire2" d="${path(w)}"/>`).join('');
    s += `<g transform="${FRONT(48, 3.2, 134)}"><rect class="face" width="13" height="10" rx="1"/><circle class="recess" cx="4.2" cy="4" r="1.1"/><circle class="recess" cx="8.8" cy="4" r="1.1"/><text class="label" x="6.5" y="8.6" font-size="2.2" text-anchor="middle">レンジ用</text></g>`;
    s += box(14, 3, 28, 6, 12, 5) + `<g transform="${FRONT(12, 3.2, 40)}"><text class="label" x="5" y="2.4" font-size="2.2" text-anchor="middle">蒸気</text></g>`;
    // behind the magazines a chill plate keeps the sandwiches cold until they are toasted
    s += box(6, 25, MAG.z0 - 3, 46, 6, 30, 0, 'au-chill') + `<g transform="${FRONT(7, 31.05, MAG.z0 + 27)}">${slits(3, 24, 2.7, 2, 44, false, 'au-frost')}<text class="label sign" x="3" y="29" font-size="2.6">冷蔵 5℃</text></g>`;
    // toaster: the magazines' floor, the hot plate with its coil, the motor over the press
    s += box(6, 34, MAG.z0 - 5, 54, 20, 2) + box(PLATE.x - 15, PLATE.y - 9, PLATE.z - 4, 30, 18, 4, 0, 'au-plate')
      + box(PLATE.x - 5, PLATE.y - 5, 200, 10, 10, 7) + `<g transform="${FRONT(PLATE.x - 6, PLATE.y + 5.05, 206)}"><text class="label sign" x="6" y="3.6" font-size="2.6" text-anchor="middle">TOAST</text></g>`;
    // the toaster's timer (a dial, a pilot lamp lit while it toasts) and its cable to the plate
    s += box(52, 42, MAG.z0, 14, 10, 18) + `<g transform="${FRONT(52, 52.05, MAG.z0 + 18)}"><circle class="face" cx="5" cy="7" r="3.2"/><path class="hair" d="M5 7l1.6-2"/><circle class="au-pilot" cx="11" cy="3.6" r="1.3"/><text class="label sign" x="7" y="15.6" font-size="2.4" text-anchor="middle">TIMER</text></g>`
      + `<path class="wire2" d="${path([[58, 52, MAG.z0 + 2], [58, 62, PLATE.z - 2], [PLATE.x + 15, PLATE.y, PLATE.z - 2]])}"/>`;
    // the exhaust fan over the toaster (it turns while toasting), its duct out through the back
    s += box(78, 8, 218, 10, 22, 6) + box(70, 30, 202, 26, 20, 22) + `<g transform="${FRONT(70, 50.05, 206)}"><text class="label sign" x="2" y="3" font-size="2.6">換気</text></g>`;
    g.insertAdjacentHTML('beforeend', s);
    const fan = UTIL.g(g, `<circle class="face" r="8.4"/><g class="au-blades">${[0, 90, 180, 270].map(a => `<path class="face" transform="rotate(${a})" d="M0 0L-2.4 -7.2Q0 -8.4 2.4 -7.2Z"/>`).join('')}</g><circle class="detail" r="2"/>`, { transform: FRONT(83, 50.1, 213) });
    const pilot = g.querySelector('.au-pilot');
    const coil = UTIL.el('path', { class: 'au-coil', d: 'M2 2.6h3l1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6 1-1.6 1 1.6h6', transform: FRONT(PLATE.x - 15, PLATE.y + 9.05, PLATE.z) }, g);
    let cm;
    const column = () => {
      cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState);
      // the microwave's transformer under the coin tubes
      g.insertAdjacentHTML('beforeend', lv.burger ? `<g data-part="burger">${box(94, 22, 6, 20, 26, 30)}<g transform="${FRONT(94, 48.05, 34)}"><text class="label sign" x="10" y="8" font-size="4" text-anchor="middle">HV</text>${slits(13, 26, 2.6, 4, 16, false)}</g></g>` : `<g class="ugh-g">${CORE.edges(94, 22, 6, 20, 26, 30, 'ugh')}</g>`);
    };
    if (!RT) column();
    // two magazines (far one first), each a stack of foil sandwiches between four rails
    const mags = [];
    (RT ? [0, 1] : [1, 0]).forEach(k => { const x = MAG.x[k];
      g.insertAdjacentHTML('beforeend', post(x - 10, MAG.y - 9, MAG.z0 - 3, 33) + post(x + 10, MAG.y - 9, MAG.z0 - 3, 33));
      mags[k] = UTIL.g(g, '', { class: 'au-mag' });
      g.insertAdjacentHTML('beforeend', post(x - 10, MAG.y + 9, MAG.z0 - 3, 33) + post(x + 10, MAG.y + 9, MAG.z0 - 3, 33)); });
    const onPlate = UTIL.g(g, '', { class: 'au-onplate' });
    // the press: up at rest, a rod to the motor; with the upgrade it heats from above too
    const press = UTIL.g(g, box(PLATE.x - 15, PLATE.y - 9, PLATE.z + PRESS_UP, 30, 18, 3, 0, 'au-press')
      + `<path class="hair" d="${path([[PLATE.x, PLATE.y, PLATE.z + PRESS_UP + 3], [PLATE.x, PLATE.y, 200]])}" style="stroke-width:2.4"/>`, { class: 'au-pressg' });
    let coil2 = null;
    if (lv.press) coil2 = UTIL.el('path', { class: 'au-coil', 'data-part': 'press', d: 'M2 1.4h3l1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1 1-1 1 1h6', transform: FRONT(PLATE.x - 15, PLATE.y + 9.05, PLATE.z + PRESS_UP + 3) }, press);
    else press.insertAdjacentHTML('beforeend', `<g class="ugh-g"><path class="ugh" transform="${FRONT(PLATE.x - 15, PLATE.y + 9.05, PLATE.z + PRESS_UP + 3)}" d="M2 1.4H28"/></g>`);

    /* curry station (drawn before the oven: it sits lower and further back) */
    let curry = null;
    if (lv.curry) {
      // the steam generator under the steam box (piped from the stub on the back wall), the bin for empty pouches
      g.insertAdjacentHTML('beforeend', `<g data-part="curry"><path class="hair" d="${path([[17, 15, 30], [17, 36, 30]])}" style="stroke-width:2.6"/>${rounded(8, 35, 6, 20, 18, 30, 8, 'au-tank')}
        <g transform="${FRONT(10, 53.05, 32)}"><circle class="face" cx="4" cy="4" r="2.8"/><path class="hair" d="M4 4l1.4-1.6"/><text class="label sign" x="12" y="5" font-size="2.6" text-anchor="middle">蒸気</text></g><path class="hair" d="${path([[18, 44, 36], [18, 44, TRAY.z0 - 4]])}" style="stroke-width:2"/>
        ${box(44, 22, 6, 24, 14, 20, 0, 'au-bin')}<g transform="${FRONT(44, 36.05, 24)}"><text class="label sign" x="12" y="4" font-size="2.6" text-anchor="middle">空袋</text></g></g>`);
      const trayG = UTIL.g(g, '', { class: 'au-trays', 'data-part': 'curry' });
      const pusher = UTIL.g(g, box(TRAY.x - 13, TRAY.y - 3, TRAY.z0, 3, 6, 3), { 'data-part': 'curry' });
      g.insertAdjacentHTML('beforeend', `<g data-part="curry">${glassBox(6, 32, TRAY.z0 - 4, 24, 24, 50, 'au-glass warm')}<g transform="${FRONT(7, 56.05, TRAY.z0 + 44)}"><text class="label sign" x="11" y="3" font-size="2.6" text-anchor="middle">スチーム</text></g>`
        + box(STATION[0] - 2, STATION[1] - 2, 8, 4, 4, STATION[2] - 10) + rounded(STATION[0] - 9, STATION[1] - 7, STATION[2] - 2, 18, 14, 2, 2)
        + box(RACK.x0 - 3, RACK.y - 1, RACK.z + 12, 30, 2, 2) + box(RACK.x0 + 26, RACK.y - 1, STATION[2], 2, 2, RACK.z - STATION[2] + 12) + `</g>`);
      const pouchG = UTIL.g(g, '', { class: 'au-pouches', 'data-part': 'curry' });
      // the blade on its arm: it swings down through the pouch
      const pv = [BLADE[0] + 10, BLADE[1], BLADE[2] + 4], [pvx, pvy] = P(...pv);
      g.insertAdjacentHTML('beforeend', `<g data-part="curry">${box(pv[0] - 2, pv[1] - 2, pv[2] - 2, 6, 4, 6)}</g>`);
      const blade = UTIL.g(g, `<path class="hair" d="${path([pv, [BLADE[0] + 3, BLADE[1], BLADE[2]]])}" style="stroke-width:1.8"/><path class="au-blade" d="${path([[BLADE[0] - 4, BLADE[1], BLADE[2] + .6], [BLADE[0] + 4, BLADE[1], BLADE[2] + .6], [BLADE[0] + 5, BLADE[1], BLADE[2] - 1], [BLADE[0] - 4, BLADE[1], BLADE[2] - 1.4]])}Z"/>`, { 'data-part': 'curry' });
      const stream = UTIL.el('path', { class: 'au-stream', d: path([[STATION[0], STATION[1], BLADE[2] - 3], [STATION[0] + 1.6, STATION[1], STATION[2] + 3]]) }, g);
      curry = { trayG, pusher, pouchG, blade, pivot: [pvx, pvy], stream };
    } else g.insertAdjacentHTML('beforeend', box(6, 30, 4, 26, 2, 1.6) + box(6, 58, 4, 26, 2, 1.6) + `<g transform="${TOP(17, 15.05, 33.05)}"><circle r="2.6" fill="#c8452f" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><path class="hair" d="M-2 0H2M0-2V2"/></g>`
      + `<g class="ugh-g">${CORE.edges(6, 32, TRAY.z0 - 4, 24, 24, 50, 'ugh')}${CORE.edges(STATION[0] - 9, STATION[1] - 7, STATION[2] - 2, 18, 14, RACK.z - STATION[2] + 14, 'ugh')}</g>`);

    /* microwave bay */
    let oven = null;
    if (lv.burger) {
      const O = OVEN, far = RT ? O.x : O.x + O.w;
      // a warm-rimmed box with a faint lamp always on, so it reads as an oven even when idle
      let m = `<g transform="${FRONT(O.x, O.y, O.z + O.h)}"><rect class="au-ovenw" width="${O.w}" height="${O.h}"/><rect class="au-light" x="2" y="2" width="${O.w - 4}" height="${O.h - 4}" rx="2"/>${slits(6, 16, 2.5, O.w - 8, O.w - 3, false, 'detail')}</g>`
        + `<g transform="${SIDE(far, O.y + O.d, O.z + O.h)}"><rect class="au-ovenw side" width="${O.d}" height="${O.h}"/></g>` + box(O.x, O.y, O.z - 3, O.w, O.d, 3, 0, 'au-ovenf');
      g.insertAdjacentHTML('beforeend', `<g data-part="burger">${m}</g>`);
      const turn = UTIL.g(g, `<circle class="au-plate-g" r="13"/><g class="au-spokes"><path class="hair" d="M-11 0H11M0-11V11"/><circle class="hair" r="4"/></g>`, { transform: TOP(...TURN), 'data-part': 'burger' });
      const inOven = UTIL.g(g, '', { class: 'au-inoven' });
      // the hatch in the oven's left wall, the column of frozen boxes beside it, its pusher
      const hatch = UTIL.g(g, `<rect width="15" height="12" fill="#1c2028" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`, { transform: SIDE(O.x, COL.y + 7.5, O.z + 13), 'data-part': 'burger' });
      g.insertAdjacentHTML('beforeend', `<g data-part="burger">${post(COL.x - 7.5, COL.y - 7.5, O.z - 3, 52) + post(COL.x + 7.5, COL.y - 7.5, O.z - 3, 52) + box(COL.x - 8, COL.y - 8, O.z - 3, 16, 16, 2)}</g>`);
      const colG = UTIL.g(g, '', { class: 'au-col', 'data-part': 'burger' });
      g.insertAdjacentHTML('beforeend', `<g data-part="burger">${post(COL.x - 7.5, COL.y + 7.5, O.z - 3, 52) + post(COL.x + 7.5, COL.y + 7.5, O.z - 3, 52)}</g>`);
      const pusher = UTIL.g(g, box(COL.x - 12, COL.y - 3, COL.z0, 3, 6, 5), { 'data-part': 'burger' });
      // the oven's near walls are glass (so you can watch it turn)
      g.insertAdjacentHTML('beforeend', `<g data-part="burger">${glassBox(O.x, O.y, O.z, O.w, O.d, O.h, 'au-glass oven')}<g transform="${FRONT(O.x + 3, O.y + O.d + .05, O.z + O.h - 2)}"><text class="label sign" x="${O.w - 10}" y="3" font-size="2.8" text-anchor="middle">レンジ</text></g></g>`);
      // the lift down to the window
      g.insertAdjacentHTML('beforeend', `<g data-part="burger">${post(LIFT.x - 8, LIFT.y + 4, LIFT.bottom - 4, LIFT.top - LIFT.bottom + 8) + post(LIFT.x + 8, LIFT.y + 4, LIFT.bottom - 4, LIFT.top - LIFT.bottom + 8)}</g>`);
      // the magnetron on the oven's top (fins, the high-voltage cable up from the transformer) and the plug in its socket
      g.insertAdjacentHTML('beforeend', `<g data-part="burger"><path class="au-hv" d="${path([[100, 26, 36], [100, 26, 152], [72, 26, 152], [70, 36, O.z + O.h + 4]])}"/><path class="wire2" d="${path([[54, 3.4, 128], [54, 30, 128], [54, 30, O.z + O.h]])}"/>
        ${box(56, 32, O.z + O.h, 14, 12, 8)}<g transform="${TOP(56, 32, O.z + O.h + 8.05)}">${slits(2, 12, 2, 1, 11, true)}</g><g transform="${FRONT(56, 44.05, O.z + O.h + 8)}"><text class="label sign" x="7" y="5.4" font-size="2.2" text-anchor="middle">マグネトロン</text></g></g>`);
      const lift = UTIL.g(g, rounded(LIFT.x - 7, LIFT.y - 5, LIFT.top - 2, 14, 10, 2, 2), { class: 'au-lift', 'data-part': 'burger' });
      oven = { turn, spokes: turn.querySelector('.au-spokes'), light: g.querySelector('.au-light'), inOven, hatch, colG, pusher, lift };
    } else g.insertAdjacentHTML('beforeend', box(OVEN.x - 2, OVEN.y, OVEN.z - 4, 2, OVEN.d, 2) + box(OVEN.x + OVEN.w, OVEN.y, OVEN.z - 4, 2, OVEN.d, 2)
      + `<g transform="${FRONT(48, 3.4, 124)}"><path class="au-hv" d="M7 0q-5 4 0 8t0 8t0 8"/><rect class="face" x="4.6" y="23" width="5" height="4" rx=".8"/></g>`
      + `<g class="ugh-g">${CORE.edges(OVEN.x, OVEN.y, OVEN.z - 3, OVEN.w, OVEN.d, OVEN.h + 3, 'ugh')}${CORE.edges(COL.x - 8, COL.y - 8, OVEN.z - 3, 16, 16, 52, 'ugh')}</g>`);

    // the toast chute down the left edge (thin glass) and the run along the floor to the window
    g.insertAdjacentHTML('beforeend', glassBox(CHUTE.x - 4, CHUTE.y - 3, 26, 8, 6, PLATE.z - 32) + box(4, 66, 22, 60, 10, 2));
    const movers = UTIL.g(g, '', { class: 'au-movers' });
    if (RT) column();
    // upgrade pins (seen in X-ray only)
    g.insertAdjacentHTML('beforeend', (lv.press ? '' : pin('press', PLATE.x + 36, PLATE.y + 2, PLATE.z + 4)) + (lv.burger ? '' : pin('burger', OVEN.x + OVEN.w / 2, OVEN.y + OVEN.d / 2, OVEN.z + 22)) + (lv.curry ? '' : pin('curry', 38, 46, 70)));
    return { mags, onPlate, press, coil, coil2, oven, curry, movers, cm, fan: fan.querySelector('.au-blades'), pilot };
  }

  /* ---------- the shell and door: a menu panel per module (blank 近日登場 plates until fitted) ---------- */
  const toastIcon = (cx, cy, p) => `<path d="M${cx - 9} ${cy + 5}L${cx} ${cy - 6}L${cx + 9} ${cy + 5}Z" fill="#c9d0da" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M${cx - 6.2} ${cy + 3.6}L${cx} ${cy - 3.4}L${cx + 6.2} ${cy + 3.6}Z" fill="#e2a95c"/>
    <path d="M${cx - 4.6} ${cy + 3.4}h9.2" stroke="${p.fill}" stroke-width="1.5"/><path d="M${cx - 2.6} ${cy + .6}l2.6 2M${cx + .2} ${cy - 1.6}l2.6 2" stroke="#8a5a2a" stroke-width=".7"/>`;
  const burgerIcon = (cx, cy, p) => `<path d="M${cx - 7.4} ${cy}q0-7.4 7.4-7.4t7.4 7.4z" fill="#e8a24a" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="${cx - 7.6}" y="${cy + .2}" width="15.2" height="1" fill="${p.fill}"/>
    <rect x="${cx - 7.4}" y="${cy + 1.2}" width="14.8" height="2.2" rx=".8" fill="#6a3a1e"/><rect x="${cx - 7}" y="${cy + 3.6}" width="14" height="2.4" rx="1.1" fill="#e8a24a"/><path d="M${cx - 3} ${cy - 4}h.6M${cx + 1} ${cy - 5}h.6M${cx + 3} ${cy - 3}h.6" stroke="#fff6d6" stroke-width=".8"/>`;
  const curryIcon = (cx, cy, p) => `<ellipse cx="${cx}" cy="${cy + 2.6}" rx="10" ry="3.8" fill="#f4f1ea" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M${cx - 8} ${cy + 2.6}a8 2.8 0 0 0 8 2.8v-5.6a8 2.8 0 0 0 -8 2.8z" fill="#fffdf6"/><path d="M${cx} ${cy - .2}a8 2.8 0 0 1 8 2.8a8 2.8 0 0 1 -8 2.8z" fill="${p.fill}"/>
    <path d="M${cx - 2} ${cy - 2}q-1-1.6 0-3.2M${cx + 1.6} ${cy - 2}q-1-1.6 0-3.2" fill="none" stroke="var(--ink-hi)" stroke-width=".6" vector-effect="non-scaling-stroke" opacity=".6"/>`;
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, oc = '#ffb03a';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const ln = `stroke="rgba(255,176,58,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    // right side: retro stripes and ドライブイン; left side: a steaming plate over 昭和の自販機
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/>
      ${[0, 1, 2].map(i => `<path d="M8 ${40 + i * 9}H76" stroke="rgba(255,176,58,${.45 - i * .12})" stroke-width="3.4"/>`).join('')}
      ${['オ', 'ー', 'ト'].map((ch, i) => `<text class="sign" x="42" y="${100 + i * 24}" font-size="20" text-anchor="middle" fill="rgba(255,176,58,.12)" stroke="rgba(255,176,58,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="12" y="176" width="60" height="12" rx="2" fill="rgba(255,90,78,.12)" stroke="var(--red)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="184.8" font-size="6" text-anchor="middle" fill="var(--red)">24時間 あつあつ</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/><g class="iso-only">
      <path d="M16 104h52q-2 10-26 10t-26-10z" fill="rgba(255,176,58,.07)" ${ln}/><ellipse cx="42" cy="104" rx="26" ry="5" fill="none" ${ln}/><path d="M32 94q-4-6 0-12t0-12M42 94q-4-6 0-12t0-12M52 94q-4-6 0-12t0-12" fill="none" ${ln}/>
      <text class="sign" x="42" y="150" font-size="10" text-anchor="middle" fill="rgba(255,176,58,.14)" stroke="rgba(255,176,58,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">昭和の自販機</text>
      <text class="label" x="42" y="164" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,176,58,.6)">TOAST · BURGER · CURRY</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const ICON = [toastIcon, toastIcon, burgerIcon, curryIcon];
    const tile = (k, x, y, p) => R3(x, y, 38, 30, 1, `<rect class="au-tglow nohit" x="${x}" y="${y}" width="38" height="30" rx="2" fill="${oc}" opacity="0"/>${ICON[k](x + 19, y + 10, p)}
        <text x="${x + 19}" y="${y + 21}" font-size="${f(Math.min(2.8, 34 / (p.jp || p.name).length))}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 19}" y="${y + 25.2}" font-size="2.7" text-anchor="middle" class="label">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 15}" y="${y + 26.8}" width="8" height="1.3" rx=".6"/><text class="soldout" x="${x + 19}" y="${y + 12}" font-size="3.8" text-anchor="middle">売切</text>`,
      { r: 2, cls: 'hit au-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' });
    const panel = (y, title) => `<rect class="au-panel" x="6" y="${y}" width="86" height="45" rx="2"/><text class="label" x="9" y="${y + 4.2}" font-size="2.6" letter-spacing=".4">${title}</text>`;
    const lamp = (x, y, cls, txt) => R3(x, y, 40, 6, .8, `<text class="lit-text ${cls}" style="--lc:var(--red)" x="${x + 20}" y="${y + 4.5}" font-size="3.2" text-anchor="middle">${txt}</text>`, { r: 1.5, capCls: 'readycap' });
    const soon = y => `${SK(9, y + 6, 80, 36, 2)}<text class="sign au-soon" x="49" y="${y + 25}" font-size="6.4" text-anchor="middle">近日登場</text><text class="label" x="49" y="${y + 32}" font-size="2.8" text-anchor="middle" letter-spacing="1">COMING SOON</text>
      ${[[12, y + 9], [86, y + 9], [12, y + 39], [86, y + 39]].map(([x, yy]) => `<circle class="detail" cx="${x}" cy="${yy}" r="1.2"/><path class="hair" d="M${x - .8} ${yy}h1.6"/>`).join('')}`;
    const o = `<rect class="face front mshell door-face" width="120" height="240"/>
      ${R3(4, 4, 112, 18, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="18" rx="2.5" style="stroke:${oc}"/>
        <text class="lit-text sign on" style="--lc:${oc}" x="44" y="16.4" font-size="8" text-anchor="middle" filter="url(#soft)">オートレストラン</text>
        <text class="label" x="99" y="11.6" font-size="2.8" text-anchor="middle" letter-spacing=".4">HOT MENU</text><text class="label" x="99" y="16.6" font-size="2.8" text-anchor="middle" letter-spacing=".4">24H</text>`, { noCap: true })}
      ${panel(25, 'トースト')}${tile(0, 9, 30, menu[0])}${tile(1, 51, 30, menu[1])}${lamp(29, 62.5, 'au-lamp-t', 'トースト中')}
      ${panel(73, 'ハンバーガー')}${lv.burger ? `${tile(2, 9, 78, menu[2])}<g transform="translate(51 79)"><rect width="38" height="22" rx="2" fill="#0e1014" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="4" y="4" width="22" height="14" rx="1.5" fill="#1d2027" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="15" cy="14" rx="7" ry="2" fill="none" stroke="${oc}" stroke-width=".7" vector-effect="non-scaling-stroke" opacity=".7"/><circle cx="32" cy="7" r="2" class="detail"/><circle cx="32" cy="13" r="2" class="detail"/><text class="label" x="15" y="10.4" font-size="3" text-anchor="middle">チン!</text></g>${lamp(51, 110.5, 'au-lamp-b', '加熱中')}` : soon(73)}
      ${panel(121, 'カレー')}${lv.curry ? `${tile(3, 9, 126, menu[3])}<g transform="translate(51 127)"><rect width="38" height="22" rx="2" fill="#0e1014" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><text class="sign" x="19" y="10" font-size="4.6" text-anchor="middle" fill="${oc}">ライス</text><text class="label" x="19" y="16.6" font-size="2.6" text-anchor="middle">スチーム保温</text></g>${lamp(51, 158.5, 'au-lamp-c', '調理中')}` : soon(121)}
      <text class="label" x="49" y="174.4" font-size="2.8" text-anchor="middle" letter-spacing=".5">あつあつ · 24時間営業</text>
      ${R3(100, 46, 10, 15, 1.6, `<rect class="recess" x="104.2" y="48" width="1.6" height="11" rx=".6"/><rect class="au-slotglow" x="98.6" y="44.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="65" font-size="2.6" text-anchor="middle">COIN</text>
      ${SK(95, 68, 20, 15, 1.2, { r: 1.5 })}<rect x="95" y="68" width="20" height="15" rx="1.5" fill="#120a08"/>
      ${[0, 1].map(i => `<text class="ra-nixie" x="${101 + i * 8}" y="79.6" font-size="10" text-anchor="middle">${i ? 5 : 2}</text>`).join('')}
      <text class="label" x="105" y="87" font-size="2.5" text-anchor="middle">あと · 秒</text>
      ${R3(95, 100, 20, 11, 1, `<path class="hair" d="M101 105.5a3 3 0 0 1 0-1M103 107a5 5 0 0 0 0-4M105 108.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="107" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 119, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 119h4"/>' })}<text class="label" x="105" y="127" font-size="2.6" text-anchor="middle">返却</text>
      <g data-hit="cup" class="hit">${SK(97, 130, 16, 13, 3.5, { r: 2 })}</g><text class="label" x="105" y="147" font-size="2.6" text-anchor="middle">おつり</text>
      ${CORE.lock(100, 152)}
      ${lv.press ? R3(71, 62.5, 19, 6, .8, `<text class="lit-text on" style="--lc:#ffb347" x="80.5" y="67" font-size="3.2" text-anchor="middle">両面焼</text>`, { r: 1.5, capCls: 'readycap' }) : ''}
      ${R3(36, 187, 48, 5.5, .8, `<text class="lit-text au-ready" style="--lc:${oc}" x="60" y="191.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(36, 195, 48, 24, 6, { r: 3 })}</g>
      <rect class="au-flap nohit" x="37" y="196" width="46" height="8" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="label" x="60" y="224" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<rect class="face" width="120" height="240" style="fill:#101318"/><rect class="detail" x="6" y="6" width="108" height="228" rx="2"/>
      ${[25, 73, 121].map(y => `<rect class="face" x="6" y="${y}" width="86" height="45" rx="2"/>`).join('')}<path class="wire2" d="M112 30V230M112 50H90M112 96H90M112 144H90M112 200H60"/><path class="hair" d="M117 20V220"/><rect class="face" x="113" y="152" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'au-door', transform: FRONT(0, D, H) });
    // the ready item sits in the window: outside the door group (world space) so it is not skewed with the door
    const windowG = UTIL.g(g, '', { class: 'au-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.au-tile')],
      slotGlow: door.querySelector('.au-slotglow'), nixie: [...door.querySelectorAll('.ra-nixie')], ready: door.querySelector('.au-ready'), flap: door.querySelector('.au-flap'),
      lamps: [door.querySelector('.au-lamp-t'), door.querySelector('.au-lamp-t'), door.querySelector('.au-lamp-b'), door.querySelector('.au-lamp-c')], windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}">${[25, 73, 121].map(y => `<rect class="xline" x="6" y="${y}" width="86" height="45"/>`).join('')}<rect class="xline" x="95" y="68" width="20" height="15"/><rect class="xline" x="36" y="195" width="48" height="24" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, use, vars };
})();
