/* Fig 9 · たまご小屋 — geometry, after the roadside farm-stand lockers (Nerima's "野菜自販機銀座", the old coin-and-knob
   "朝市くん" that needs no power, takes ¥100 coins and gives no change) and Sanden's MCL lockers (electronic self-holding
   locks, door closers, blue LEDs, cells set cold or ambient). A wooden cabinet of 4 × 5 small glass doors; each cell holds
   one bag of produce. Old cells: a coin slot and a knob on every door, a mechanical latch and a coin cup behind it.
   Base: the cash box and spare bags (and, with the upgrades, the lock controller and the cooling unit). */
const LK = (() => {
  const W = 120, D = 84, H = 240;
  const COLS = 4, ROWS = 5, CW = 25, GAP = 2, CH = 34, TOP = 26, PITCH = 36;
  // the cells of a row: four, or two wide ones on the top row with the big-cell upgrade
  const cellsOf = (r, big) => r === 0 && big ? [{ x0: 6, w: 52 }, { x0: 60, w: 52 }] : Array.from({ length: COLS }, (_, c) => ({ x0: 6 + c * (CW + GAP), w: CW }));
  const zTop = r => H - (TOP + r * PITCH), zBot = r => zTop(r) - CH;
  // shallow cells, the goods just behind the glass and a little left: seen from the default camera a point y deep shows
  // (84 − y) further right, and a deeper cell would hide its goods behind its own right-hand wall
  const BACK_Y = 60;
  const spot = (r, cell) => [cell.x0 + cell.w / 2 - (ISO.right ? 3 : -3), 73, zBot(r) + 1.2];    // where the goods sit in a cell
  const MENU = [
    { name: 'トマト', price: 100, row: 0, g: 'tomato', c: '#e8453a' },
    { name: 'きゅうり', price: 100, row: 0, g: 'cucumber', c: '#3a9a3a' },
    { name: 'なす', price: 100, row: 0, g: 'eggplant', c: '#6a3a8a' },
    { name: 'じゃがいも', price: 100, row: 0, g: 'potato', c: '#c8964a' },
    { name: 'たまねぎ', price: 100, row: 0, g: 'onion', c: '#e0a040' },
  ];
  return { W, D, H, COLS, ROWS, CW, GAP, CH, TOP, PITCH, cellsOf, zTop, zBot, BACK_Y, spot, MENU };
})();

const LKB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, ROWS, CH, cellsOf, zTop, zBot, BACK_Y } = LK;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ball = (x, y, z, r, fill, hi = true) => { const [a, b] = q(x, y, z); return `<circle cx="${a}" cy="${b}" r="${r}" style="fill:${fill};${ST}"/>` + (hi ? `<circle cx="${f(+a - r * .35)}" cy="${f(+b - r * .4)}" r="${f(r * .3)}" fill="#fff" opacity=".4"/>` : ''); };
  const oval = (x, y, z, rx, ry, rot, fill) => { const [a, b] = q(x, y, z); return `<ellipse cx="${a}" cy="${b}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${a} ${b})" style="fill:${fill};${ST}"/>`; };
  const line = (p0, p1, stroke, w) => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`; };
  const tray = (w, d, h = 1.6, cls = 'lk-tray') => box(-w / 2, -d / 2, 0, w, d, h, 0, cls);
  const sortK = items => items.sort((a, b) => ISO.key(a[0], a[1], a[2]) - ISO.key(b[0], b[1], b[2]));

  /* ---------- the goods, one glyph each (a bag, a tray, a carton, a whole melon): what you see through the little door ---------- */
  const G = {
    tomato: () => tray(14, 10) + sortK([[-3, -2.2, 3.8], [3, -2.2, 3.8], [-3, 2.2, 3.8], [3, 2.2, 3.8]]).map(([x, y, z]) => { const [a, b] = q(x, y, z + 2.4); return ball(x, y, z, 2.7, '#e8453a') + `<path d="M${a - 1.2} ${b}l1.2 -.8 1.2 .8 -1.2 .5z" fill="#3a8a3a"/>`; }).join(''),
    cucumber: () => tray(14, 10) + [-2.6, 0, 2.6].map(v => line([-6, v, 2.8], [6, v + .4, 2.8], '#2f7a2f', 2.6) + line([-5, v - .3, 3.3], [5, v + .1, 3.3], '#5aba5a', .7)).join(''),
    eggplant: () => tray(14, 10) + [-2.6, 0, 2.6].map((v, i) => { const [a, b] = q(-1, v, 3.2); return `<path d="M${f(+a - 5)} ${b}q4-3.4 9-1.2q1.4 1.6 0 3.2q-5 1.6-9-2z" style="fill:#5a2a7a;${ST}"/><path d="M${f(+a + 4)} ${f(+b - .6)}l2.4-1 .6 2.4z" fill="#3a8a3a"/>`; }).join(''),
    potato: () => sortK([[-3, -2, 2], [2.4, -2.4, 2], [0, 1, 2], [-3.4, 2.4, 2], [3, 2.2, 2], [0, -.4, 4.4]]).map(([x, y, z]) => oval(x, y, z, 2.8, 2.1, 12, '#c8964a')).join('') + (() => { const [a, b] = q(0, 0, 3); return `<path d="M${f(+a - 8)} ${f(+b + 4)}q8-12 16 0" fill="none" stroke="#e8642a" stroke-width=".6" stroke-dasharray="1.2 .8"/><path d="M${f(+a - 7)} ${f(+b + 1)}l14 -2M${f(+a - 6)} ${f(+b - 2)}l12 -1" stroke="#e8642a" stroke-width=".5"/>`; })(),
    onion: () => sortK([[-3, -1.6, 2.6], [3, -1.6, 2.6], [0, 2, 2.6]]).map(([x, y, z]) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - 2.8)} ${f(+b + 1)}q0-4.4 2.8-5.6q2.8 1.2 2.8 5.6q-1.4 2.2-2.8 2.2t-2.8-2.2z" style="fill:#e0a040;${ST}"/><path d="M${a} ${f(+b - 4.6)}l.4-2" stroke="#8a5a22" stroke-width=".7"/><path d="M${f(+a - .8)} ${f(+b - 2)}q.8 2.4 0 4.6" fill="none" stroke="#b8782a" stroke-width=".4"/>`; }).join(''),
    carrot: () => tray(14, 10) + [-3, -1, 1, 3].map(v => { const [a, b] = q(-5, v, 3), [c, d] = q(4, v, 3); return `<path d="M${a} ${f(+b - 1.2)}L${c} ${d}L${a} ${f(+b + 1.2)}z" style="fill:#f08a2a;${ST}"/><path d="M${a} ${b}l-2.4 -1.4M${a} ${b}l-2.6 .4M${a} ${b}l-1.6 1.8" stroke="#3a9a3a" stroke-width=".8"/>`; }).join(''),
    corn: () => tray(14, 10) + [-2, 2].map(v => line([-5.4, v, 3.2], [5, v, 3.2], '#f2c43a', 3.4) + line([-5.4, v, 3.3], [5, v, 3.3], '#ffe07a', 1) + line([-7, v - 1, 3], [-3, v - 1.6, 3.6], '#5aaa4a', 1.4)).join(''),
    daikon: () => tray(14, 10) + line([-5, 0, 3.4], [6, .4, 3.2], '#f6f4ec', 3.8) + line([-4.6, -.6, 4], [5, -.2, 3.8], '#ffffff', 1) + [-1.6, 0, 1.6].map(d => line([-5, d * .4, 3.6], [-9, d, 6], '#3a9a3a', 1.1)).join(''),
    shiitake: () => tray(14, 10, 1.6, 'lk-tray dark') + sortK([[-3.4, -2, 2.4], [1, -2.4, 2.4], [4, 1, 2.4], [-2, 2, 2.4], [1.6, 1.6, 3.6]]).map(([x, y, z]) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - 2.6)} ${b}a2.6 2 0 0 1 5.2 0z" style="fill:#7a4a2a;${ST}"/><circle cx="${f(+a - .8)}" cy="${f(+b - 1)}" r=".35" fill="#f6ead0"/><circle cx="${f(+a + .9)}" cy="${f(+b - .6)}" r=".3" fill="#f6ead0"/>`; }).join(''),
    egg: (brown) => box(-7, -3.2, 0, 14, 6.4, 2.6, 0, 'lk-carton') + sortK([0, 1, 2, 3, 4].flatMap(i => [[-5.6 + i * 2.8, -1.5, 3.4], [-5.6 + i * 2.8, 1.5, 3.4]])).map(([x, y, z]) => oval(x, y, z, 1.25, 1.6, 0, brown ? '#d8945a' : '#fbf8f0')).join('')
      + `<path d="${toD([P(-7, -3.2, 2.6), P(7, -3.2, 2.6), P(7, -5.4, 6.4), P(-7, -5.4, 6.4)])}" fill="rgba(235,245,255,.28)" stroke="rgba(235,245,255,.7)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`,
    strawberry: () => box(-6, -4.4, 0, 12, 8.8, 2.4, 0, 'lk-pack') + sortK([[-3, -2, 3], [0, -2.4, 3], [3, -2, 3], [-2, 1, 3], [1.4, 1.4, 3], [-.4, -.4, 4.4]]).map(([x, y, z]) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - 1.6)} ${f(+b - .6)}q1.6-1.4 3.2 0q0 2.4-1.6 3.2q-1.6-.8-1.6-3.2z" style="fill:#e8263a;${ST}"/><path d="M${f(+a - 1)} ${f(+b - .8)}l1 -.8 1 .8" stroke="#3a8a3a" stroke-width=".7" fill="none"/>`; }).join('')
      + (() => { const [a, b] = q(0, 4.4, 1.2); return `<rect x="${f(+a - 3)}" y="${f(+b - 1)}" width="6" height="2" fill="#ff4f6a"/><text x="${a}" y="${f(+b + .6)}" font-size="1.4" text-anchor="middle" fill="#fff" font-family="sans-serif">いちご</text>`; })(),
    blueberry: () => box(-5, -4, 0, 10, 8, 2.4, 0, 'lk-pack') + sortK([...Array(9)].map((_, i) => [-3 + (i % 3) * 3, -2.6 + Math.floor(i / 3) * 2.6, 3])).map(([x, y, z]) => ball(x, y, z, 1.2, '#3a4a9a', false)).join(''),
    hakusai: () => sortK([[-6, 0, 5], [6, 0, 5]]).map(([x, y, z]) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - 5)} ${f(+b + 4)}q-1-10 5-12q6 2 5 12z" style="fill:#e6f2c8;${ST}"/><path d="M${f(+a - 4)} ${f(+b - 2)}q4-6 8 0q-1 4-4 5q-3-1-4-5z" fill="#7ac04a"/><path d="M${a} ${f(+b - 6)}v9" stroke="#fff" stroke-width=".8"/>`; }).join(''),
    watermelon: () => { const [a, b] = q(0, 0, 8.6); return `<circle cx="${a}" cy="${b}" r="9.4" style="fill:#3a9a3a;${ST}"/>${[-6, -2.4, 1.2, 4.8].map(d => `<path d="M${f(+a + d)} ${f(+b - 9)}q${f(-d * .3)} 9 0 18" fill="none" stroke="#1a4a1a" stroke-width="1.2"/>`).join('')}<circle cx="${f(+a - 3.4)}" cy="${f(+b - 3.6)}" r="2.6" fill="#fff" opacity=".25"/><path d="M${a} ${f(+b - 9.4)}q1-2 2.4-1.6" fill="none" stroke="#6a4a22" stroke-width=".8"/>`; },
    rice: () => { const [a, b] = q(0, 0, 0); return `<path d="M${f(+a - 9)} ${b}q-1-11 1-15q8-2 16 0q2 4 1 15q-9 2-18 0z" style="fill:#f6f2e6;${ST}"/><path d="M${f(+a - 8)} ${f(+b - 15)}h16" stroke="#c8a060" stroke-width="1.6"/><circle cx="${a}" cy="${f(+b - 8)}" r="4.4" fill="#e8453a"/><text x="${a}" y="${f(+b - 6.4)}" font-size="5" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">米</text><text x="${a}" y="${f(+b - 1.6)}" font-size="2.4" text-anchor="middle" fill="#6a5a3a" font-family="sans-serif">5kg</text>`; },
    melon: () => { const [a, b] = q(0, 0, 7.4); return box(-9, -6, 0, 18, 12, 2.4, 0, 'lk-box') + `<circle cx="${a}" cy="${b}" r="8" style="fill:#c8e09a;${ST}"/>${[[-5, -4, 5, 4], [-6, 1, 4, -5], [-2, 6, 6, -2], [-6, -1, 2, 7]].map(([x1, y1, x2, y2]) => `<path d="M${f(+a + x1)} ${f(+b + y1)}Q${f(+a + (x1 + x2) / 2 + 2)} ${f(+b + (y1 + y2) / 2)} ${f(+a + x2)} ${f(+b + y2)}" fill="none" stroke="#f6f8e6" stroke-width=".7"/>`).join('')}<path d="M${a} ${f(+b - 8)}v-2.4M${f(+a - 2)} ${f(+b - 10.4)}h4" stroke="#6a8a3a" stroke-width="1"/>`; },
    matsutake: () => box(-9, -6, 0, 18, 12, 4, 0, 'lk-basket') + sortK([[-4, -1, 4], [0, 1, 4], [4, -1, 4]]).map(([x, y, z]) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - .9)} ${b}v-6h1.8v6z" fill="#efe4cc" stroke="rgba(0,0,0,.4)" stroke-width=".4" vector-effect="non-scaling-stroke"/><path d="M${f(+a - 2.4)} ${f(+b - 5.6)}q2.4-2.6 4.8 0z" style="fill:#7a4a22;${ST}"/>`; }).join('') + (() => { const [a, b] = q(-6, 4, 4.2); return `<path d="M${a} ${b}q4-3 9-1" fill="none" stroke="#3a9a3a" stroke-width="1.4"/>`; })(),
  };
  const draw = g => g === 'redegg' ? G.egg(true) : (G[g] || G.tomato)();
  function defs() { return Object.keys(G).map(k => `<g id="g-lk-${k}">${draw(k)}</g>`).join('') + `<g id="g-lk-redegg">${draw('redegg')}</g>`; }
  const use = (p, x, y, z, extra = '') => { const [sx, sy] = P(x, y, z); return `<use href="#g-lk-${p.g}" x="${f(sx)}" y="${f(sy)}" ${extra}/>`; };

  // flat icons (24 × 24) for the shop
  // (app build, goods polish: the prototype's icon (icon0) with each crop's own marks on top: calyxes and shine, bumps,
  // eyes, ridges, kernels, root hairs, cracks, seeds, veins; the onion gets its own shape instead of the potato's)
  function icon(g, c) {
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const shine = d => ln(d, '#fff', .9, ' opacity=".55"');
    if (g === 'onion') return `<path d="M8 20.4q-5-.4-4.6-5q.6-4 4.6-6.4q4 2.4 4.6 6.4q.4 4.6-4.6 5zM16 19.4q-5-.4-4.6-5q.6-4 4.6-6.4q4 2.4 4.6 6.4q.4 4.6-4.6 5z" fill="${c}" stroke="#141018" stroke-width="1.3" stroke-linejoin="round"/>`
      + ln('M8 9.4q-2.4 5 0 10.8M8 9.4q2.4 5 0 10.8M16 8.4q-2.4 5 0 10.8M16 8.4q2.4 5 0 10.8', '#b8742a', .6)
      + ln('M8 8.8l.6-3M16 7.8l.6-3M7 20.6l-.6.8M9 20.6l.6.8M15 19.6l-.6.8M17 19.6l.6.8', '#7a5a2a', .9) + shine('M5.6 14q.4-2 1.6-3');
    const T = [[8, 10], [15, 10], [8, 16], [15, 16]];
    const M = {
      tomato: () => `<path d="${T.map(([x, y]) => `M${x} ${y - 3.4}l.6 1 1.1.1-.8.7.3 1.1-1.2-.6-1.2.6.3-1.1-.8-.7 1.1-.1z`).join('')}" fill="#3a9a3a"/>` + shine(T.map(([x, y]) => `M${x - 2.2} ${y - .2}q.3-1.4 1.2-1.8`).join('')),
      cucumber: () => `<path d="${dots([[7.2, 13.4], [10, 12.1], [12.8, 10.8], [15.6, 9.5]], .45)}" fill="#1e5a1e"/><circle cx="19.4" cy="7.8" r=".9" fill="#ffe14a" stroke="#141018" stroke-width=".5"/>`,
      eggplant: () => shine('M8.2 15.4q1.2-5 5-7.6') + `<path d="M14.6 6.2q-1 2.2.6 3.8q1.8-1.8 3.4-1.6q-1.4-2.2-4-2.2z" fill="#3a8a3a" stroke="#141018" stroke-width=".6" stroke-linejoin="round"/>`,
      potato: () => ln('M7.4 13.4l.6.3M10 15.4l.5-.2M14.4 12.4l.6.3M17 14.2l.5-.2M11 8.4l.6.3M13.4 10l.4-.2', '#6a4a1a', .7) + shine('M6 13q.6-1.6 1.8-2'),
      carrot: () => ln('M7.4 16.2l1.6.6M10 13.6l1.6.6M12.6 11l1.4.6', '#b84a10', .6),
      corn: () => `<path d="${dots([[7.6, 16], [9.2, 14.1], [10.8, 12.2], [12.4, 10.3], [14, 8.4], [8.6, 15.6], [10.2, 13.7], [11.8, 11.8], [13.4, 9.9]], .5)}" fill="#e0a820"/>`,
      daikon: () => ln('M12.4 11.6l1.6-1.6', '#c8e0a0', 2) + ln('M9 19l1.2.6M11 17l1.2.6M7.2 20.8l.9.8', '#141018', .5),
      shiitake: () => ln('M7.6 11.4l1.4-1.4M10.8 8.8l.6-1.6M15 10.2l-1.2-1.2M12.6 11.4l.2-1.4', '#f6ead0', .7) + ln('M5.2 12.6h13.6', '#a8804a', .6),
      egg: () => ln('M8 13v5M12 13v5M16 13v5', '#c8bca8', .6) + `<path d="${dots([[5.4, 10], [9.4, 10], [13.4, 10], [17.4, 10]], .45)}" fill="#fff" opacity=".9"/>`,
      strawberry: () => `<path d="${dots([[9, 14.6], [12, 11], [12, 16.4], [15, 15.4], [10.4, 18], [13.6, 18.2], [8.4, 11.2], [15.6, 11.4]], .45)}" fill="#ffe14a"/>` + shine('M7.4 10.6q.2 2 1 3.4'),
      blueberry: () => `<path d="${[[8, 10], [15, 10], [11.5, 15.6], [6, 16], [17, 16]].map(([x, y]) => `M${x - .7} ${y - 1.6}l.7.5.7-.5-.2.8.4.6h-1.8l.4-.6z`).join('')}" fill="#1a2050"/>` + shine('M6.6 9.4q.4-1 1.2-1.4M13.6 9.4q.4-1 1.2-1.4M10.1 15q.4-1 1.2-1.4'),
      hakusai: () => ln('M12 20.4V11.4M12 18l-2.8-1.8M12 15.6l2.8-1.8M12 13.4l-2.2-1.4M12 18l2.6-1.6', '#a8c878', .6),
      watermelon: () => `<ellipse cx="8.6" cy="9" rx="2" ry="1.2" transform="rotate(-35 8.6 9)" fill="#fff" opacity=".3"/>` + ln('M12 4q.6-1.8 2.2-1.6', '#6a4a22', .9),
      rice: () => ln('M6.2 6.2h11.6', '#c8a060', 1.4) + `<path d="${dots([[8, 18.4], [9.6, 19], [15.2, 18.6], [16.6, 19.2]], .35)}" fill="#c8bca8"/>`,
      melon: () => shine('M6.4 10.4q1.2-3 4-4'),
      matsutake: () => ln('M3.6 14q5-3.4 10-1.2', '#3a9a3a', 1.4) + shine('M5.6 8.4q.8-.8 1.8-1M10.6 8.4q.8-.8 1.8-1M15.6 8.4q.8-.8 1.8-1'),
    };
    M.redegg = M.egg;
    return icon0(g, c) + (M[g] ? M[g]() : '');
  }
  function icon0(g, c) {
    const k = 'stroke="#141018" stroke-width="1.3" stroke-linejoin="round"';
    switch (g) {
      case 'cucumber': return `<path d="M4 15l15-7" stroke="#141018" stroke-width="5.4" stroke-linecap="round"/><path d="M4 15l15-7" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/><path d="M7 15l11-5" stroke="#8ad08a" stroke-width=".9"/>`;
      case 'eggplant': return `<path d="M5 17q2-9 10-11q4 1 4 4q-2 8-11 9q-3 0-3-2z" fill="${c}" ${k}/><path d="M15 6l3-3M14 6.6l5 .6" stroke="#3a8a3a" stroke-width="1.6"/>`;
      case 'potato': case 'onion': return `<ellipse cx="9" cy="14" rx="5" ry="4" fill="${c}" ${k}/><ellipse cx="15.6" cy="13" rx="4.4" ry="3.6" fill="${c}" ${k}/><ellipse cx="12" cy="9" rx="4" ry="3.2" fill="${c}" ${k}/>`;
      case 'carrot': return `<path d="M5 19L16 8l2 2z" fill="${c}" ${k}/><path d="M17 9l3-5M17 9l4-1M17 9l1-5" stroke="#3a9a3a" stroke-width="1.6"/>`;
      case 'corn': return `<path d="M6 18l10-12" stroke="#141018" stroke-width="6" stroke-linecap="round"/><path d="M6 18l10-12" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M5 20q0-8 6-10" fill="none" stroke="#3a9a3a" stroke-width="1.6"/>`;
      case 'daikon': return `<path d="M5 19l10-10" stroke="#141018" stroke-width="5.6" stroke-linecap="round"/><path d="M5 19l10-10" stroke="#fbf8f0" stroke-width="3.8" stroke-linecap="round"/><path d="M15 9l3-6M15 9l5-2M15 9l1-6" stroke="#3a9a3a" stroke-width="1.6"/>`;
      case 'shiitake': return `<path d="M4 13a8 6 0 0 1 16 0z" fill="${c}" ${k}/><rect x="10" y="13" width="4" height="7" fill="#efe4cc" ${k}/><circle cx="9" cy="10" r=".9" fill="#f6ead0"/><circle cx="14" cy="9" r=".8" fill="#f6ead0"/>`;
      case 'egg': case 'redegg': return `<rect x="3" y="12" width="18" height="7" rx="1.2" fill="#e6dccc" ${k}/>${[6, 10, 14, 18].map(x => `<ellipse cx="${x}" cy="11" rx="1.9" ry="2.4" fill="${g === 'egg' ? '#fbf8f0' : '#d8945a'}" ${k}/>`).join('')}`;
      case 'strawberry': return `<path d="M6 9q6-4 12 0q0 8-6 12q-6-4-6-12z" fill="${c}" ${k}/><path d="M8 8l4-3 4 3" fill="none" stroke="#3a8a3a" stroke-width="1.8"/><circle cx="10" cy="12" r=".6" fill="#ffe14a"/><circle cx="14" cy="13" r=".6" fill="#ffe14a"/>`;
      case 'blueberry': return `${[[8, 10], [15, 10], [11.5, 15.6], [6, 16], [17, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}" ${k}/>`).join('')}`;
      case 'hakusai': return `<path d="M6 21q-2-14 6-17q8 3 6 17z" fill="#e6f2c8" ${k}/><path d="M8 11q4-8 8 0q-1 5-4 6q-3-1-4-6z" fill="#7ac04a"/>`;
      case 'watermelon': return `<circle cx="12" cy="12.6" r="8.6" fill="${c}" ${k}/>${[8, 12, 16].map(x => `<path d="M${x} 4.4q-1.4 8 0 16.4" fill="none" stroke="#1a4a1a" stroke-width="1.4"/>`).join('')}`;
      case 'rice': return `<path d="M5 21q-1-12 1-16q6-1.6 12 0q2 4 1 16q-7 1.6-14 0z" fill="#f6f2e6" ${k}/><circle cx="12" cy="13" r="4" fill="#e8453a"/><text x="12" y="15" font-size="5" text-anchor="middle" fill="#fff" font-weight="700" font-family="sans-serif">米</text>`;
      case 'melon': return `<circle cx="12" cy="13" r="8" fill="${c}" ${k}/><path d="M6 9q6 4 12 8M6 17q6-4 12-8M12 5v16" fill="none" stroke="#f6f8e6" stroke-width=".9"/><path d="M12 5V2M10 2h4" stroke="#6a8a3a" stroke-width="1.4"/>`;
      case 'matsutake': return `<rect x="3" y="14" width="18" height="7" rx="1" fill="#c8a060" ${k}/>${[7, 12, 17].map(x => `<rect x="${x - 1}" y="8" width="2" height="7" fill="#efe4cc" ${k}/><path d="M${x - 3} 9q3-4 6 0z" fill="#7a4a22" ${k}/>`).join('')}`;
    }
    return `${[[8, 10], [15, 10], [8, 16], [15, 16]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}" ${k}/>`).join('')}`;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the inside: the cells row by row (bottom up), the base below. lv: { lock, cool, big } ---------- */
  function interior(g, lv) {
    const RT = ISO.right, cold = r => lv.cool && r >= 3;
    let s = CORE.shell(W, D, H);
    // the base: the cash box and spare paper bags (old); the lock controller with its battery (electronic); the cooling unit
    s += box(4, 6, 4, 112, 78, 28, 0, 'lk-base') ;
    g.insertAdjacentHTML('beforeend', s);
    let base = '';
    if (!lv.lock) base += box(76, 40, 32, 30, 22, 14, 0, 'lk-cash') + `<g transform="${FRONT(76, 62.05, 46)}"><text class="label sign" x="15" y="6" font-size="3" text-anchor="middle">集金箱</text><rect class="recess" x="11" y="8" width="8" height="1.6" rx=".6"/></g>`;
    else base += `<g data-part="lock">${box(76, 40, 32, 30, 22, 12)}<g transform="${FRONT(76, 62.05, 44)}"><rect x="3" y="2.4" width="16" height="7" rx="1" fill="#1e5a2e" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><circle class="lk-led on" cx="24" cy="4" r="1"/><text class="label" x="15" y="11.6" font-size="2.4" text-anchor="middle">LOCK CTRL</text></g>`
      + `<path class="wire2" d="${path([[104, 44, 44], [113, 44, 44], [113, 44, 214]])}"/></g>`;
    base += [0, 1, 2].map(i => box(10 + i * 9, 30 + i * 4, 32, 8, 12, 10 - i * 2, 0, 'lk-bag')).join('') + `<g transform="${FRONT(8, 58.05, 46)}"><text class="label sign" x="14" y="3" font-size="2.6" text-anchor="middle">予備の袋</text></g>`;
    if (lv.cool) base += `<g data-part="cool">${box(40, 12, 32, 30, 30, 22)}<g transform="${FRONT(40, 42.05, 54)}">${slits(2, 28, 2.4, 2, 20, true)}</g><path class="lk-cu" d="${path([[55, 26, 54], [55, 26, 68], [55, BACK_Y - .5, 68], [55, BACK_Y - .5, 106]])}"/></g>`;
    else base += `<g class="ugh-g">${CORE.edges(40, 12, 32, 30, 30, 22, 'ugh')}</g>`;
    g.insertAdjacentHTML('beforeend', base);
    const cells = [], dividers = x => `<g transform="${SIDE(x, D - 1, 0)}"></g>`;
    // the rows, bottom first: the floor board, the back board, then cell by cell (far to near) its divider, goods and latch
    for (let r = ROWS - 1; r >= 0; r--) {
      const z0 = zBot(r), z1 = zTop(r), row = cellsOf(r, lv.big), part = r === 0 && lv.big ? ' data-part="big"' : cold(r) ? ' data-part="cool"' : '';
      let rs = box(4, BACK_Y, z0 - 2, 112, D - BACK_Y - 1, 2, 0, 'lk-board')
        + `<g transform="${FRONT(4, BACK_Y, z1 + 2)}"><rect width="112" height="${CH + 2}" class="lk-backw${cold(r) ? ' cold' : ''}"/>${cold(r) ? `<text class="label sign" x="104" y="6" font-size="2.6" text-anchor="end" fill="var(--blue)">冷蔵 5℃</text>` : ''}</g>`;
      g.insertAdjacentHTML('beforeend', `<g${part}>${rs}</g>`);
      const order = row.map((_, i) => i).sort((a, b) => RT ? a - b : b - a);
      const rowCells = [];
      order.forEach(i => {
        const c = row[i], wallX = RT ? c.x0 - 1 : c.x0 + c.w + 1;
        g.insertAdjacentHTML('beforeend', `<g transform="${SIDE(wallX, D - 1, z1)}"><rect width="${D - 1 - BACK_Y}" height="${CH}" class="lk-wall${cold(r) ? ' cold' : ''}"/></g>`);
        const goods = UTIL.g(g, '', { class: 'lk-goods' });
        // behind the door's right edge: the latch, and (old) the coin chute and the coin cup; (electronic) a lock with its LED
        const mx = c.x0 + c.w - 4;
        const mech = lv.lock ? `${box(mx, D - 7, z0 + 10, 4, 5, 8, 0, 'lk-lock')}<g transform="${FRONT(mx, D - 2, z0 + 18)}"><circle class="lk-led" cx="2" cy="2" r=".9"/></g>`
          : `${box(mx, D - 8, z0 + 12, 3, 6, 5, 0, 'lk-latch')}<path class="lk-chute" d="${path([[mx + 1.5, D - 2, z0 + 8], [mx + 1.5, D - 5, z0 + 3]])}"/>${box(mx - .5, D - 9, z0, 4, 4, 3.4, 0, 'lk-cup')}`;
        const mg = UTIL.g(g, mech, { class: 'lk-mech' });
        const coins = lv.lock ? null : UTIL.g(g, '', { class: 'lk-coins hit', 'data-hit': 'coins' });
        rowCells[i] = { ...c, goods, mech: mg, coins };
      });
      const farX = RT ? row[row.length - 1].x0 + row[row.length - 1].w + 1 : row[0].x0 - 1;
      g.insertAdjacentHTML('beforeend', `<g transform="${SIDE(farX, D - 1, z1)}"><rect width="${D - 1 - BACK_Y}" height="${CH}" class="lk-wall${cold(r) ? ' cold' : ''}"/></g>`);
      cells[r] = rowCells;
    }
    if (!lv.big) g.insertAdjacentHTML('beforeend', `<g class="ugh-g"><path class="ugh" d="${path([[33, D - 1, zTop(0)], [33, D - 1, zBot(0)]])}"/><path class="ugh" d="${path([[87, D - 1, zTop(0)], [87, D - 1, zBot(0)]])}"/></g>`);
    const movers = UTIL.g(g, '', { class: 'lk-movers' });
    g.insertAdjacentHTML('beforeend', (lv.lock ? '' : pin('lock', 91, 52, 52)) + (lv.cool ? '' : pin('cool', 55, 30, 62)) + (lv.big ? '' : pin('big', 60, 60, zTop(0) + 4)));
    return { cells, movers };
  }

  /* ---------- the shell, the front panel with its 20 openings, the little doors (each its own hinge), the awning ---------- */
  // a little door in door-local units (w × 34): its glass, a hand-written price tag, and (old) a coin slot and a knob,
  // (electronic) a blue LED and the cell's number
  function doorFace(w, r, i, lv, price) {
    const big = w > 30, cold = lv.cool && r >= 3, lbl = 'ABCDE'[r] + (i + 1);
    // the frame is a ring round the glass, so the cell shows through
    return `<path class="face lk-door" d="M0 0H${w}V34H0ZM2.4 2.4V23H${w - 2.4}V2.4Z" fill-rule="evenodd"/><rect class="lk-glass${cold ? ' cold' : ''}" x="2.4" y="2.4" width="${w - 4.8}" height="20.6" rx=".8"/>
      <path d="M${4} 22L${big ? 14 : 9} 2.4" stroke="#fff" stroke-width="1.2" opacity=".14"/>
      <g transform="translate(3.4 3.6) rotate(-4)"><rect width="${big ? 13 : 10.4}" height="5" rx=".6" fill="#fff8e6" stroke="rgba(0,0,0,.35)" stroke-width=".4" vector-effect="non-scaling-stroke"/><text class="lk-price" x="${big ? 6.5 : 5.2}" y="3.8" font-size="3.4" text-anchor="middle">${price}円</text></g>
      ${cold ? `<g transform="translate(${w - 9} 4)"><rect width="6.6" height="3.6" rx="1" fill="#2a6ad9"/><text x="3.3" y="2.7" font-size="2.2" text-anchor="middle" fill="#fff">5℃</text></g>` : ''}
      ${lv.lock ? `<circle class="lk-dled" cx="5" cy="28.4" r="1.3"/><text class="label" x="${w - 4}" y="29.6" font-size="2.8" text-anchor="end">${lbl}</text><path class="hair" d="M${w / 2 - 3} 26h6"/>`
        : `<rect x="3.6" y="25.4" width="8" height="4.6" rx=".8" fill="#2a2620" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="5" y="27.2" width="5.2" height="1" rx=".4" fill="#0a0806"/>
          <g class="lk-knob" transform="translate(${w - 6} 28)"><circle r="3" class="face lk-knobc"/><rect x="-.7" y="-2.6" width="1.4" height="5.2" rx=".6" fill="#3a3028"/></g><text class="label" x="7.6" y="33" font-size="2" text-anchor="middle">100円玉</text>`}
      <rect x="-.6" y="5" width="1.2" height="4" fill="#3a3028"/><rect x="-.6" y="25" width="1.2" height="4" fill="#3a3028"/>`;
  }
  const doorBack = w => `<path class="face lk-doorin" d="M0 0H${w}V34H0ZM2.4 2.4V23H${w - 2.4}V2.4Z" fill-rule="evenodd"/><rect class="lk-glass" x="2.4" y="2.4" width="${w - 4.8}" height="20.6" rx=".8"/><rect x="${w - 4}" y="12" width="2" height="8" rx=".6" fill="#3a3028"/>`;
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, wc = '#f2b84a';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    // the front panel with an opening per cell
    const holes = []; for (let r = 0; r < ROWS; r++) cellsOf(r, lv.big).forEach(c => holes.push(`M${c.x0} ${LK.TOP + r * LK.PITCH}h${c.w}v34h${-c.w}z`));
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell lk-front" d="M0 0H120V240H0Z${holes.join('')}" fill-rule="evenodd"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<path class="lk-grain" d="M${i * 24 + 3} 206v28"/>`).join('')}</g>`;
    s += CORE.sidePanel(D, H);
    // the sides: planks, a painted egg and たまご (right); a basket of vegetables and 朝どれ野菜 (left)
    const ln = `stroke="rgba(242,184,74,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">${[14, 28, 42, 56, 70].map(x => `<path d="M${x} 6V234" stroke="rgba(242,184,74,.12)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join('')}` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${wc}" filter="url(#soft)"/>
      <ellipse cx="42" cy="66" rx="20" ry="26" fill="rgba(255,248,230,.08)" ${ln}/><ellipse cx="36" cy="56" rx="5" ry="7" fill="rgba(255,255,255,.06)"/>
      ${['た', 'ま', 'ご'].map((ch, i) => `<text class="sign" x="42" y="${124 + i * 24}" font-size="20" text-anchor="middle" fill="rgba(242,184,74,.12)" stroke="rgba(242,184,74,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="196" width="56" height="12" rx="2" fill="rgba(242,184,74,.1)" stroke="${wc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="204.8" font-size="6" text-anchor="middle" fill="${wc}">無人販売所</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${wc}" filter="url(#soft)"/><g class="iso-only">
      <path d="M16 96h52l-6 22H22z" fill="rgba(242,184,74,.08)" ${ln}/><path d="M22 96q20-14 40 0" fill="none" ${ln}/>
      ${[[28, 88, 7], [42, 84, 8], [56, 88, 7]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(242,184,74,.06)" ${ln}/>`).join('')}<path d="M40 76l4-8M44 76l6-6" ${ln}/>
      <text class="sign" x="42" y="150" font-size="11" text-anchor="middle" fill="rgba(242,184,74,.14)" stroke="rgba(242,184,74,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">朝どれ野菜</text>
      <text class="label" x="42" y="166" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(242,184,74,.6)">FARM · ¥100</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    // the sign board, the bulb, the base with its note (and, electronic, the pay panel)
    const sign = `<g transform="${FRONT(0, D, H)}"><rect x="6" y="5" width="108" height="17" rx="1.6" class="lk-sign"/><path d="M8 9.4h104M8 14h104M8 18.6h104" stroke="rgba(90,50,20,.16)" stroke-width=".6"/>
        <ellipse cx="17" cy="13.4" rx="4" ry="5.2" fill="#fbf8f0" stroke="#5a3a1a" stroke-width=".7" vector-effect="non-scaling-stroke"/><text class="lk-brush" x="60" y="17.6" font-size="10.4" text-anchor="middle">たまご小屋</text>
        <text class="lk-brush small" x="103" y="12.4" font-size="3" text-anchor="middle">朝どれ</text><text class="lk-brush small" x="103" y="17" font-size="3" text-anchor="middle">野菜</text>
        <rect x="6" y="206" width="108" height="22" rx="1.4" class="lk-sign"/>${lv.lock ? `${R3(80, 208.5, 30, 17, .8, `<path class="hair" d="M86 214a3 3 0 0 1 0-1M88 215.5a5 5 0 0 0 0-4M90 217a7 7 0 0 0 0-7"/><text class="label" x="102" y="216" font-size="3" text-anchor="middle">IC · ¥</text><text class="label" x="95" y="222.6" font-size="2.4" text-anchor="middle">番号を押して</text>`, { r: 1.6, cls: 'hit', attrs: 'data-hit="ic"' })}`
          : `<text class="lk-brush small" x="96" y="214.6" font-size="3.4" text-anchor="middle">おつりは</text><text class="lk-brush small" x="96" y="219.6" font-size="3.4" text-anchor="middle">出ません</text>`}
        <text class="lk-brush small" x="${lv.lock ? 40 : 46}" y="215" font-size="4.6" text-anchor="middle">いつもありがとう</text><text class="lk-brush small" x="${lv.lock ? 40 : 46}" y="222.6" font-size="3" text-anchor="middle">— 小林農園</text>
        ${''/* (2026-10-18: no generic plates; the IC reader, the blue cold cells and the merged top cells are the tells) */}</g>`;
    g.insertAdjacentHTML('beforeend', sign);
    // the little doors: each a group on its own hinge plane (drawn far column to near so open doors overlap right)
    const doors = [];
    for (let r = 0; r < ROWS; r++) cellsOf(r, lv.big).forEach((c, i) => doors.push({ r, i, ...c, price: menu[r].price }));
    doors.sort((a, b) => ISO.right ? a.x0 - b.x0 || a.r - b.r : b.x0 - a.x0 || a.r - b.r);
    const D2 = doors.map(d => { const el = UTIL.g(g, `<g class="lk-out">${doorFace(d.w, d.r, d.i, lv, d.price)}</g><g class="lk-in" style="display:none">${doorBack(d.w)}</g>`, { class: 'hit lk-cell', 'data-hit': 'cell', 'data-r': d.r, 'data-i': d.i });
      return { ...d, el, out: el.firstChild, inn: el.lastChild, knob: el.querySelector('.lk-knob'), led: el.querySelector('.lk-dled'), a: 0 }; });
    // a bare bulb on a bent arm off the front left corner, lighting the sign
    const arm = [[2, D, H - 4], [2, D + 9, H - 4], [8, D + 11, H - 4]], [bx, by] = P(8, D + 11, H - 8);
    g.insertAdjacentHTML('beforeend', `<path d="${path(arm)}" fill="none" stroke="#2a2620" stroke-width="1.4" stroke-linejoin="round"/><path d="M${f(bx)} ${f(by - 4)}v2.2" stroke="#2a2620" stroke-width=".8"/><circle cx="${f(bx)}" cy="${f(by + 1)}" r="2.2" class="lk-bulb"/><circle cx="${f(bx)}" cy="${f(by + 1)}" r="8" fill="#ffd27a" opacity=".12"/>`);
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { doors: D2 };
  }
  // a little door at angle a (0 shut, ~1.7 open): its own hinge plane on its left edge
  function setDoor(d, a) {
    d.a = a; d.el.setAttribute('transform', ISO.plane([d.x0, D, zTop(d.r)], [Math.cos(a), Math.sin(a), 0], [0, 0, -1]));
    const back = a > Math.PI / 2 - ISO.alpha;
    if ((d.inn.style.display === 'none') === back) { d.inn.style.display = back ? '' : 'none'; d.out.style.display = back ? 'none' : ''; }
  }
  function ghost(g, lv = {}) {
    let s = ''; for (let r = 0; r < ROWS; r++) cellsOf(r, lv.big).forEach(c => { s += `<rect class="xline" x="${c.x0}" y="${LK.TOP + r * LK.PITCH}" width="${c.w}" height="34"/>`; });
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}">${s}</g>`);
  }
  return { defs, interior, exterior, ghost, setDoor, use, icon };
})();
