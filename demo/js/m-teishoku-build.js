/* Fig 10 · 定食「おぼん」— geometry. The one machine that does not exist: a ticket machine (食券機) in front of a tiny
   robot kitchen. Behind the door's kitchen window a belt carries a tray (with a clean set of empty bowls) from the tray
   magazine past two SCARA arms: arm A fills the rice bowl from the cooker and ladles miso soup; arm B takes the main dish
   from the 60℃ warming cabinet (via the fryer, with the upgrade) and a 小鉢 from the little fridge; chopsticks and pickles
   drop in at the end, and the tray goes down to the serving window. The order ticket rides a clip on the rail above.
   The base: the dishwasher the used trays come back to through the 返却口, and the lift that takes clean sets back up.
   Everything deep sits left: from the default camera a point y deep shows (84 − y) further right. */
const OB = (() => {
  const W = 120, D = 84, H = 240;
  // what the window shows: a point at depth y appears 0.87 × (84 − y) further right, so the stations stand fairly far
  // forward and everything stays left of x ≈ 70 (the belt, at the front, can run to 80)
  const BELT = { y: 74, z: 80, x0: 3, x1: 80 };
  const STOP = { start: 16, rice: 18, main: 40, finish: 58, end: 74 };
  const MAG = { x: 16, y: 74 };                                  // the tray magazine over the belt's start
  const COOKER = [9, 58, 84], POT = [23, 58, 84], FRYER = [54, 60, 84], KOBACHI = [38, 57, 127], DESSERT = [51, 60, 110];   // the 小鉢 sit in a chilled tray on top of the warming cabinet
  const CAB = { x0: 30, x1: 46, y0: 50, y1: 64, z0: 84, z1: 126, shelf: [86, 100, 114], col: [34, 42] };
  const place = k => [CAB.col[k % 2], 57, CAB.shelf[Math.floor(k / 2)]];   // a menu place's stack in the warming cabinet
  const ARM = { z: 138, L1: 12.5, L2: 12.5, A: [14, 66], B: [46, 68] };
  const RAIL = { y: 81, z: 147 };
  const WINDOW = [60, 79, 25];
  // where each part sits on a tray (u along the belt, v toward the front)
  const SPOT = { rice: [-8, 3.6], miso: [.6, 4.6], main: [-4, -4.4], kobachi: [8.4, -4.6], pickles: [7.6, 4.4], dessert: [11.8, .4] };
  // the starting menu (overwritten by the goods plan): g = the main dish, c = its colour
  const MENU = [
    { name: '納豆定食', price: 380, g: 'natto', c: '#a8742a' }, { name: '冷奴定食', price: 420, g: 'hiyayakko', c: '#f6f2e6' },
    { name: '卵焼き定食', price: 430, g: 'tamagoyaki', c: '#ffd23f' }, { name: '生姜焼き定食', price: 520, g: 'shogayaki', c: '#a8642a' },
    { name: 'さば味噌定食', price: 540, g: 'sabamiso', c: '#8a6a4a' }, { name: '肉じゃが定食', price: 500, g: 'nikujaga', c: '#d8964a' },
  ];
  return { W, D, H, BELT, STOP, MAG, COOKER, POT, FRYER, KOBACHI, DESSERT, CAB, place, ARM, RAIL, WINDOW, SPOT, MENU, SLOTW: [105, D, 196] };
})();

const OBB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, BELT, STOP, MAG, COOKER, POT, FRYER, KOBACHI, DESSERT, CAB, ARM, RAIL, SPOT } = OB;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringZ(z0, r0, n, 0, Math.PI * 2, x, y), ...ringZ(z1, r1, n, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ringZ(z, r, n, 0, Math.PI * 2, x, y))}" style="fill:${fill};${sk}"/>`;
  const dome = (x, y, z, r, h, fill) => `<path d="${toD(hull([...ringZ(z, r, 14, 0, Math.PI * 2, x, y), ...ringZ(z + h * .7, r * .7, 14, 0, Math.PI * 2, x, y), ...ringZ(z + h, r * .25, 8, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const dot = (x, y, z, r, fill) => { const [a, b] = q(x, y, z); return `<circle cx="${a}" cy="${b}" r="${r}" fill="${fill}"/>`; };
  const ell = (x, y, z, rx, ry, rot, fill) => { const [a, b] = q(x, y, z); return `<ellipse cx="${a}" cy="${b}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${a} ${b})" style="fill:${fill};${ST}"/>`; };
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const cabbage = (x, y, z) => dome(x, y, z, 2.4, 2.2, '#d8f0a8') + [[-.8, -.4], [.6, .2], [-.2, .8]].map(([u, v]) => seg([x + u - .8, y + v, z + 1.6], [x + u + .8, y + v + .3, z + 1.8], '#a8d070', .5)).join('');
  const lemon = (x, y, z) => { const [a, b] = q(x, y, z); return `<path d="M${f(+a - 1.6)} ${b}a1.6 1.6 0 0 0 3.2 0z" fill="#ffe14a" stroke="rgba(0,0,0,.4)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`; };

  /* ---------- the main dishes, each on its own vessel: what makes one 定食 look unlike another ---------- */
  const plate = (x, y, z, r = 6.4) => disc(x, y, z, r, '#f6f2ea', 18) + disc(x, y, z + .05, r * .78, '#ffffff', 18, 'stroke:rgba(0,0,0,.12);stroke-width:.5;vector-effect:non-scaling-stroke');
  const MAIN = {
    natto: (x, y, z) => plate(x, y, z, 5.4) + cyl(x - 1, y, z, z + 2.4, 2.2, 2.8, '#f4f0e6') + disc(x - 1, y, z + 2.4, 2.5, '#a8742a') + [[-1.6, -.6], [-.4, .8], [.4, -.4]].map(([u, v]) => dot(x - 1 + u, y + v, z + 2.5, .45, '#6a4a1a')).join('') + dot(x - .2, y - .2, z + 2.6, .6, '#ffd23f') + seg([x + 2.2, y + 1, z + .2], [x + 4.4, y - 1, z + .2], '#141018', 1.8, 'butt'),
    hiyayakko: (x, y, z) => plate(x, y, z) + box(x - 3, y - 2.4, z, 6, 4.8, 3, 0, 'ob-tofu') + [[-1.4, -.6], [.6, .4], [1.6, -.8]].map(([u, v]) => dot(x + u, y + v, z + 3.05, .5, '#4aaa4a')).join('') + (() => { const [a, b] = q(x, y, z + 3.1); return `<path d="M${f(+a - 1.6)} ${b}q.8-1.4 1.6 0t1.6 0" fill="none" stroke="#c88a4a" stroke-width=".7"/>`; })() + dot(x + 3.6, y + 2.6, z + .4, .8, '#e8d06a'),
    tamagoyaki: (x, y, z) => plate(x, y, z) + [-2.6, 0, 2.6].map(u => box(x + u - 1.1, y - 2, z, 2.2, 4, 2.4, 0, 'ob-egg')).join('') + dome(x + 3.6, y + 2.6, z, 1.4, 1.2, '#ffffff'),
    shogayaki: (x, y, z) => plate(x, y, z) + cabbage(x + 2.8, y - 1.6, z) + [[-3, .6, 8], [-1, 1.6, -6], [-2, -1.2, 14]].map(([u, v, r]) => ell(x + u, y + v, z + .8, 3.2, 1.6, r, '#a8642a')).join('') + ell(x + 3.4, y + 2.6, z + .6, 1.2, .8, 0, '#e8453a'),
    sabamiso: (x, y, z) => plate(x, y, z) + (() => { const [a, b] = q(x - .6, y, z + 1); return `<path d="M${f(+a - 4.4)} ${f(+b + 1)}q4.4-3.6 8.8-.4l-.4 2.2q-4.4 1.6-8.4 0z" fill="#8a6a4a" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M${f(+a - 3)} ${f(+b - .4)}l5.4 -.6M${f(+a - 2.6)} ${f(+b + .8)}l5.4 -.4" stroke="#5a6a7a" stroke-width=".6"/><path d="M${f(+a - 4.6)} ${f(+b + 2.4)}q4.6 1.4 9 -.4" fill="none" stroke="#c88a3a" stroke-width="1.4"/>`; })() + dot(x + 3, y + 2.4, z + .5, .9, '#ffd27a'),
    nikujaga: (x, y, z) => cyl(x, y, z, z + 3.2, 3.6, 5.2, '#f2ead8') + disc(x, y, z + 3.2, 4.8, '#b07a3a') + [[-2, -1, '#e8c070'], [1.4, -1.4, '#e8c070'], [0, 1.6, '#f08a2a'], [-1.4, 1.4, '#8a4a2a'], [2, .8, '#5aaa4a']].map(([u, v, c]) => ell(x + u, y + v, z + 3.6, 1.3, 1, 10, c)).join(''),
    hamburg: (x, y, z) => plate(x, y, z) + ell(x - 1.2, y, z + 1.4, 3.6, 2.4, 0, '#5a3218') + ell(x - 1.4, y - .4, z + 1.8, 2.6, 1.4, 0, '#7a2a14') + [[2.6, -2], [3.4, -1.2], [4, -2.6]].map(([u, v]) => seg([x + u, y + v, z + .6], [x + u + 1.8, y + v + 1.2, z + .6], '#f2c43a', 1)).join('') + dot(x + 3.2, y + 2.6, z + 1, 1.3, '#3a8a3a'),
    yakizakana: (x, y, z) => plate(x, y, z) + (() => { const [a, b] = q(x - .8, y - .4, z + .8); return `<path d="M${f(+a - 4)} ${f(+b + 1.6)}h7.6q.6-2.8-1.2-3.6h-5.6q-1.8 .8-.8 3.6z" fill="#f08a6a" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M${f(+a - 3.6)} ${f(+b - 1.4)}h6.6" stroke="#8a4a3a" stroke-width="1.1"/><path d="M${f(+a - 2)} ${f(+b + .2)}l1-1M${f(+a + .6)} ${f(+b + .2)}l1-1" stroke="#a8542a" stroke-width=".5"/>`; })() + dome(x + 3.2, y + 2.4, z, 1.6, 1.3, '#ffffff') + lemon(x + 3.8, y - 2.2, z + .6),
    sukiyaki: (x, y, z) => cyl(x - .6, y, z, z + 3, 4.8, 5.2, '#2a2620') + disc(x - .6, y, z + 3, 4.8, '#6a3a1a') + [[-2, -1, '#a8542a'], [1.2, -1.6, '#a8542a'], [-.4, 1.4, '#f6f2e6'], [2, .8, '#5aaa4a']].map(([u, v, c]) => ell(x - .6 + u, y + v, z + 3.3, 1.6, .9, 15, c)).join('') + cyl(x + 5, y + 3, z, z + 1.6, 1.4, 1.8, '#f4f0e6') + dot(x + 5, y + 3, z + 1.7, .9, '#ffb020'),
    wagyu: (x, y, z) => ell(x, y, z + .6, 6.2, 3.2, -8, '#2a2620') + [-2.4, -.4, 1.6].map(u => ell(x + u, y, z + 1.4, 1.2, 2.2, -10, '#c8645a')).join('') + [-2.4, -.4, 1.6].map(u => ell(x + u - .3, y, z + 1.5, .5, 1.4, -10, '#f0a8a0')).join('') + dot(x + 3.6, y - 1.6, z + 1.2, .6, '#ffd27a'),
    unagi: (x, y, z) => box(x - 5.4, y - 4, z, 10.8, 8, 3.4, 0, 'ob-jubako') + `<g transform="${TOP(x - 4.8, y - 3.4, z + 3.45)}"><rect width="9.6" height="6.8" fill="#fffdf6"/><rect x=".8" y="1" width="8" height="4.8" rx=".6" fill="#7a3a12"/><path d="M2 1.4l1.4 4M4.4 1.4l1.4 4M6.8 1.4l1.4 4" stroke="#3a1a08" stroke-width=".5"/></g>`,
    karaage: (x, y, z) => plate(x, y, z) + cabbage(x + 2.8, y - 1.8, z) + [[-3, -.6], [-1, .8], [-2.6, 1.6], [-.8, -1.2]].map(([u, v]) => ell(x + u, y + v, z + 1.2, 1.7, 1.3, 20, '#d8902a')).join('') + lemon(x + 3.4, y + 2.4, z + .6),
    tonkatsu: (x, y, z) => plate(x, y, z) + cabbage(x + 2.8, y - 1.8, z) + [-3.4, -1.8, -.2].map(u => box(x + u - .7, y - 1.8, z, 1.4, 4, 1.8, 0, 'ob-katsu')).join('') + dot(x + 3.4, y + 2.6, z + .5, .7, '#ffd23f'),
    tempura: (x, y, z) => plate(x, y, z) + [-1.4, 1.2].map(v => { const [a, b] = q(x - 1, y + v, z + 1); return `<path d="M${f(+a - 3.6)} ${b}q3.6-1.8 7 0q-3.4 1.6-7 0z" fill="#f2c45a" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M${f(+a + 3.4)} ${b}l1.4 -.8v1.6z" fill="#e8453a"/>`; }).join('') + ell(x + 3.4, y - 2, z + 1, 1.8, 1.4, 0, '#3a9a3a') + cyl(x + 4, y + 3, z, z + 1.2, 1.2, 1.5, '#2a4a6a'),
    ebifry: (x, y, z) => plate(x, y, z) + cabbage(x + 2.8, y - 1.8, z) + [-1.4, 1].map(v => { const [a, b] = q(x - 1.4, y + v, z + 1.2); return `<path d="M${f(+a - 3.4)} ${b}q3-2.2 6.4-.6l-.4 1.6q-3 1-6-.2z" fill="#e8a23a" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M${f(+a + 3)} ${f(+b - .4)}l1.8 -1.2.2 2z" fill="#e8453a"/>`; }).join('') + dome(x + 3.4, y + 2.6, z, 1.3, 1, '#fff8e0'),
  };
  // a tray as it stands: which parts are on it so far (rice, miso, main, kobachi, pickles, hashi, dessert)
  function tray(p, s, x, y, z) {
    const at = k => [x + SPOT[k][0], y + SPOT[k][1]], jubako = p.g === 'unagi';
    let o = rounded(x - 14, y - 10, z, 28, 20, 1.4, 3, 'ob-tray');
    const zt = z + 1.4;
    // the far row first (main, kobachi, dessert), then the near row (rice, miso, pickles), then the chopsticks
    const [mx, my] = at('main');
    if (s.main) o += MAIN[p.g] ? MAIN[p.g](jubako ? mx + 1 : mx, my + (jubako ? 1 : 0), zt) : MAIN.shogayaki(mx, my, zt);
    else if (!jubako) o += plate(mx, my, zt);
    const [kx, ky] = at('kobachi');
    o += cyl(kx, ky, zt, zt + 2.2, 2, 2.8, '#2a4a6a') + (s.kobachi ? dome(kx, ky, zt + 2, 2.2, 1.4, '#3a8a2a') + dot(kx + .4, ky - .3, zt + 3.3, .5, '#f6e6c8') : disc(kx, ky, zt + 2.2, 2.6, '#16283a'));
    if (s.dessert) { const [dx, dy] = at('dessert'); o += cyl(dx, dy, zt, zt + 2.4, 1.6, 2, 'rgba(235,245,255,.5)') + cyl(dx, dy, zt + .2, zt + 2, 1.5, 1.8, '#ffd27a') + disc(dx, dy, zt + 2, 1.8, '#8a4a1a'); }
    if (!jubako) { const [rx, ry] = at('rice'); o += cyl(rx, ry, zt, zt + 3, 2.6, 3.8, '#f6f4ee') + disc(rx, ry, zt + 3, 3.8, s.rice ? '#ffffff' : '#e0dcd2') + (s.rice ? dome(rx, ry, zt + 2.9, 3.4, 1.8, '#fffdf6') : '') + `<path d="${toD(ringZ(zt + 2.2, 3.5, 14, ISO.visZ()[0], ISO.visZ()[1], rx, ry), false)}" fill="none" stroke="#3a6ad9" stroke-width=".5"/>`; }
    const [sx, sy] = at('miso'); o += cyl(sx, sy, zt, zt + 2.8, 2.6, 3.8, '#5a1410') + disc(sx, sy, zt + 2.8, 3.6, s.miso ? '#c8964a' : '#2a0a08') + (s.miso ? dot(sx - 1, sy - .4, zt + 2.9, .6, '#fffdf6') + dot(sx + 1, sy + .6, zt + 2.9, .6, '#fffdf6') + seg([sx - .4, sy + 1.2, zt + 2.9], [sx + 1.6, sy - .8, zt + 2.9], '#2a5a2a', .8) : '');
    if (s.pickles) { const [px, py] = at('pickles'); o += box(px - 1.6, py - 1.2, zt, 3.2, 2.4, .6, 0, 'ob-dish') + ell(px - .5, py, zt + .7, .9, .6, 0, '#ffe14a') + ell(px + .7, py, zt + .7, .9, .6, 0, '#ffe14a'); }
    if (s.hashi) o += seg([x - 12, y + 8.4, zt + .6], [x + 4, y + 7.8, zt + .6], '#8a4a1a', 1) + seg([x - 12, y + 9.2, zt + .6], [x + 4, y + 8.6, zt + .6], '#8a4a1a', 1) + box(x - 11, y + 7.6, zt, 1.6, 2, .6, 0, 'ob-dish');
    return o;
  }
  // flat icons (24 × 24) for the ticket buttons and the shop: a tray, a rice bowl and the main dish in its colour
  function icon(g, c) {
    const k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"', t = 'stroke="#141018" stroke-width=".6" stroke-linejoin="round"';
    // (app build, goods polish: every main dish its own shape and marks, as on its tray inside; one element per colour of marks)
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const P = `<ellipse cx="9" cy="9" rx="5.6" ry="4.2" fill="#fff" ${k}/>`;
    const cab = `<path d="M10 6.4q1.8-1.6 3.8-.4q.6 1.8-.6 3.2q-2 .4-3.2-.8z" fill="#d8f0a8" ${t}/>` + ln('M10.8 6.8l2 .3M11 7.8l1.8-.1', '#8ac04a', .45);
    const lemon = (x, y) => `<path d="M${x - 1.4} ${y}a1.4 1.4 0 0 1 2.8 0z" fill="#ffe14a" ${t}/>`;
    const main = {
      natto: `<circle cx="9" cy="9" r="4" fill="#f4f0e6" ${k}/><circle cx="9" cy="9" r="2.6" fill="${c}"/><path d="${dots([[8, 8.4], [9.8, 9.6], [8.6, 10.2], [10.2, 8.2]], .45)}" fill="#6a4a1a"/><circle cx="9.4" cy="8.8" r=".8" fill="#ffd23f" ${t}/>` + ln('M7.4 9.8l.5-.4M10.6 9.2l.4.4', '#4aaa4a', .6),
      hiyayakko: `<rect x="5" y="6" width="8" height="6" fill="#fffdf6" ${k}/>` + ln('M7.6 7.6q.8-.6 1.6 0t1.6 0', '#c88a4a', .6) + `<path d="${dots([[7, 7.4], [11.2, 9.8], [9.4, 8.8]], .6)}" fill="#4aaa4a"/><circle cx="11" cy="7.6" r=".8" fill="#e8d06a" ${t}/>`,
      tamagoyaki: `<rect x="4" y="6" width="3" height="6" fill="${c}" ${k}/><rect x="7.4" y="6" width="3" height="6" fill="${c}" ${k}/><rect x="10.8" y="6" width="3" height="6" fill="${c}" ${k}/>` + ln('M4.6 8.2q.9-.8 1.8 0M8 8.2q.9-.8 1.8 0M11.4 8.2q.9-.8 1.8 0M4.6 10q.9-.8 1.8 0M8 10q.9-.8 1.8 0M11.4 10q.9-.8 1.8 0', '#d8a020', .5),
      unagi: `<rect x="3" y="4" width="18" height="10" rx="1" fill="#1a1414" ${k}/><rect x="5" y="6" width="14" height="6" fill="#7a3a12"/>` + ln('M7 6.6l1.4 4.8M10.4 6.6l1.4 4.8M13.8 6.6l1.4 4.8', '#3a1a08', .7) + ln('M6 7.2h11.6', '#c8743a', .5, ' opacity=".8"') + `<path d="${dots([[16.6, 10.6], [17.6, 10]], .35)}" fill="#6aaa3a"/>`,
      sukiyaki: `<circle cx="9" cy="9" r="5" fill="#2a2620" ${k}/><circle cx="9" cy="9" r="3.6" fill="#a8542a"/><rect x="9.4" y="6.6" width="2.4" height="2" fill="#f6f2e6" ${t}/>` + ln('M6.2 9.6q1.4-1 2.8 0M6.8 7.6q1.2-.6 2.2.2', '#6a2a10', .7) + ln('M7 11.4l2.4-.6', '#5aaa4a', .8),
      nikujaga: `<circle cx="9" cy="9" r="5" fill="#f2ead8" ${k}/><circle cx="9" cy="9" r="3.8" fill="#b07a3a"/><circle cx="8" cy="8" r="1.6" fill="#e8c070" ${t}/><circle cx="10.4" cy="9.6" r="1.4" fill="#f08a2a" ${t}/>` + `<path d="${dots([[7.4, 10.6], [11, 7.4], [6.4, 8.8]], .5)}" fill="#5aaa4a"/>` + ln('M9.4 7.2q1 .2 1.6-.4', '#8a4a2a', .7),
      shogayaki: P + cab + `<path d="M4.4 9.4q1-2.2 3.4-1.8q2 .6 2.4 2.2q-1 1.6-3.2 1.4q-2.2-.2-2.6-1.8zM6 11q1.4-1.6 3.6-.8q1.6.8 1.4 2q-1.6 1-3.4.6q-1.6-.6-1.6-1.8z" fill="${c}" ${t}/>` + ln('M5.4 9.4q1.6-.8 3.2 0M7 11.4q1.4-.6 2.8.2', '#e8c070', .5),
      sabamiso: P + `<path d="M4.2 10.2q2.4-3.6 9-2.2l-.4 2.6q-4.4 1.8-8.6-.4z" fill="${c}" ${t}/>` + ln('M5.8 9.2l6.4-.8M6 10.4l6.2-.4', '#5a6a7a', .6) + ln('M4.6 11.2q4.4 1.6 8.2-.6', '#c88a3a', 1) + ln('M11.6 11l.6-.3', '#4aaa4a', .6),
      hamburg: P + `<ellipse cx="8.4" cy="9.2" rx="3.6" ry="2.6" fill="${c}" ${t}/><path d="M5.8 8.8q2.6-1.8 5.2 0q-.6 1.4-2.6 1.4t-2.6-1.4z" fill="#7a2a14"/>` + ln('M6.8 8.3q1.1-.6 2.3-.4', '#fff', .6, ' opacity=".6"') + ln('M12.2 10.6l1.4-1.2M12.4 11.6l1.4-1', '#f2c43a', .9) + `<circle cx="12.6" cy="7.2" r="1.2" fill="#3a8a3a" ${t}/>`,
      yakizakana: P + `<path d="M4.4 10.6h7.4q.8-2.8-1.2-3.6H5.2q-1.8.8-.8 3.6z" fill="${c}" ${t}/>` + ln('M5.2 7.4h5.6', '#8a4a3a', 1) + ln('M6.2 8.6l.8 1.4M8.2 8.4l.8 1.6M10.2 8.6l.5 1.2', '#ffd8c8', .5) + lemon(13, 10.8),
      karaage: P + cab + `<path d="${dots([[6, 9.6], [8.4, 8.4], [8.8, 10.8], [6.6, 11.4]], 1.6)}" fill="${c}" ${t}/>` + ln('M5.6 9.2l.4.3M8 8l.4.3M8.6 10.6l.4.2M6.2 11.2l.4.2', '#a8601a', .5) + lemon(12.6, 11),
      ebifry: P + cab + `<path d="M4 9q3-2.2 6.6-1l-.4 1.6q-3 .9-6.2-.6zM4.4 11q3-2 6.6-.8l-.4 1.6q-3 .8-6.2-.8z" fill="${c}" ${t}/><path d="M10.2 8l1.6-1.2.3 2zM10.6 10.2l1.6-1 .2 2z" fill="#e8453a" ${t}/>` + ln('M5.4 8.6l.4.3M7.4 8.2l.4.3M5.8 10.6l.4.3M7.8 10.2l.4.3', '#b8701a', .5),
      tonkatsu: P + cab + `<path d="M4.2 8.2l1.8-.4.6 3.8-1.8.4zM6.6 7.6l1.8-.4.6 3.8-1.8.4zM9 7l1.8-.4.6 3.8-1.8.4z" fill="${c}" ${t}/>` + ln('M5.2 8.6l.4 2.6M7.6 8l.4 2.6M10 7.4l.4 2.6', '#f6e8cc', .7) + `<circle cx="12.4" cy="11" r=".7" fill="#ffd23f" ${t}/>`,
      tempura: P + `<path d="M10.4 6.4q3.4-.6 3.8 2.8q-3 1-3.8-2.8z" fill="#3a9a3a" ${t}/><path d="M4 8.8q3.4-2.4 7-.4q-3.4 2.2-7 .4zM4.6 11.2q3.4-2.2 7-.2q-3.4 2-7 .2z" fill="${c}" ${t}/><path d="M10.8 8.4l1.4-.9v1.8zM11.4 11l1.4-.9v1.8z" fill="#e8453a"/>` + ln('M5.6 8.6l.5-.3M7.6 8.2l.5-.2M6.2 11l.5-.3M8.4 10.8l.5-.2', '#e0a030', .55),
      wagyu: `<ellipse cx="9" cy="9" rx="5.6" ry="4.2" fill="#2a2620" ${k}/><path d="M4.8 9.6l1.6-2.6 1.6.4-1.4 3zM7.4 10.2l1.6-3 1.6.4-1.4 3.2zM10 10.6l1.6-3 1.6.4-1.4 3.2z" fill="${c}" ${t}/>` + ln('M6 9.2l.8-1.4M8.6 9.6l.9-1.6M11.2 10l.9-1.6', '#f0b0a8', .6) + `<circle cx="12.6" cy="7" r=".6" fill="#ffd27a"/>`,
    }[g] || P + `<ellipse cx="8.4" cy="9" rx="3.6" ry="2.4" fill="${c}" ${k}/>`;
    return `<rect x="1.5" y="3" width="21" height="18" rx="2.4" fill="#7a2a1a" ${k}/>${main}${g === 'unagi' ? '' : `<path d="M13 15h7q-.6 4-3.5 4t-3.5-4z" fill="#fff" ${k}/><ellipse cx="16.5" cy="15" rx="3.4" ry="1" fill="#fffdf6"/>`}<path d="M4 18h9" stroke="#e8c070" stroke-width="1.1"/>`;
  }
  // a hotel pan of portions for the crate, the rice sack, the miso jug
  function defs() {
    const pan = `<g id="g-ob-pan">${box(-6, -4.4, 0, 12, 8.8, 2.6, 0, 'ob-pan')}<g transform="${TOP(-6, -4.4, 2.63)}"><rect x="1" y="1" width="10" height="6.8" rx="1" style="fill:var(--c)"/><path d="M3 3h6M3 5h4" stroke="#fff" stroke-width=".6" opacity=".35"/></g></g>`;
    const rice = `<g id="g-ob-rice"><path d="M-6 0q-1-10 1-13q5-1.4 10 0q2 3 1 13q-6 1.4-12 0z" fill="#f6f2e6" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><circle cx="0" cy="-6.6" r="3" fill="#e8453a"/><text x="0" y="-5.4" font-size="3.4" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">米</text></g>`;
    const miso = `<g id="g-ob-miso">${cyl(0, 0, 0, 10, 4, 4, '#c8964a')}${cyl(0, 0, 10, 12, 4.2, 4.2, '#6a1a14')}<text x="0" y="${f(P(0, 4, 5)[1])}" font-size="3" text-anchor="middle" fill="#fff" font-family="sans-serif">味噌</text></g>`;
    return pan + rice + miso;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const post = (x, y, z, h) => box(x - .8, y - .8, z, 1.6, 1.6, h);
  const edgesOnly = (x, y, z, w, d, h, cls) => CORE.edges(x, y, z, w, d, h, cls);

  /* ---------- the inside. lv: fitted parts { wash, fryer, dessert } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right;
    let s = CORE.shell(W, D, H);
    // the base: the dishwasher (with its window), the dirty trays waiting, the return chute from the door, the clean-set lift
    s += box(4, 20, 6, 40, 40, 34, 0, lv.wash ? 'ob-wash new' : 'ob-wash') + `<g transform="${FRONT(4, 60.05, 40)}"><rect class="ob-washwin" x="6" y="6" width="22" height="18" rx="3"/><text class="label sign" x="34" y="10" font-size="3" text-anchor="middle">${lv.wash ? '食洗機' : '洗い場'}</text><circle class="ob-washled" cx="34" cy="16" r="1.4"/></g>`
      + `<path class="chute" d="${path([[16, 83, 26], [16, 62, 34]])}" style="stroke-width:5;stroke:#2a3038"/>` + post(4, 76, 6, 82) + post(14, 76, 6, 82);
    s += box(50, 30, 6, 30, 26, 4) + `<g transform="${FRONT(50, 56.05, 10)}"><text class="label" x="15" y="3" font-size="2.4" text-anchor="middle">下げ膳</text></g>`;
    // the kitchen floor over the base
    s += box(2, 30, 58, 90, 52, 3, 0, 'ob-floor');
    g.insertAdjacentHTML('beforeend', s);
    if (!lv.wash) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(4, 20, 6, 44, 44, 36, 'ugh')}</g>`);
    const dirtyG = UTIL.g(g, '', { class: 'ob-dirty' });       // used trays waiting to be washed
    const spray = UTIL.g(g, '', { class: 'ob-spray' });
    const liftG = UTIL.g(g, '', { class: 'ob-setlift' });       // a clean set riding up
    let cm;
    const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the back of the kitchen: the cooker, the pot, (the fryer), the warming cabinet, the kobachi fridge, (the dessert shelf)
    let k = '';
    k += cyl(COOKER[0], COOKER[1], COOKER[2] - 24, COOKER[2], 6.6, 6.6, '#e8e4dc') + `<g transform="${FRONT(COOKER[0] - 4, COOKER[1] + 6.6, COOKER[2] - 8)}"><rect width="8" height="3.4" rx=".6" fill="#2a2f3a"/><circle class="ob-cookled" cx="6.6" cy="1.7" r=".7"/></g>`;
    k += cyl(POT[0], POT[1], POT[2] - 24, POT[2] - 10, 5.4, 5.4, '#3a3f48') + cyl(POT[0], POT[1], POT[2] - 10, POT[2], 6, 6, '#8a8f98');
    g.insertAdjacentHTML('beforeend', k);
    const cookLid = UTIL.g(g, disc(COOKER[0], COOKER[1], COOKER[2], 6.6, '#f4f2ec') + disc(COOKER[0], COOKER[1], COOKER[2] + .1, 1.6, '#3a3f48'), { class: 'ob-lid' });
    const potTop = UTIL.g(g, '', { class: 'ob-pottop' });
    // the warming cabinet: shelves, the stacks of plates per menu place (drawn by the machine), glass edges, a 60℃ tag
    g.insertAdjacentHTML('beforeend', box(CAB.x0, CAB.y0, CAB.z0 - 24, CAB.x1 - CAB.x0, CAB.y1 - CAB.y0, 24) + CAB.shelf.map(z => box(CAB.x0, CAB.y0, z - 1, CAB.x1 - CAB.x0, CAB.y1 - CAB.y0, 1, 0, 'ob-shelf')).join('')
      + `<g transform="${FRONT(CAB.x0, CAB.y0 + .1, CAB.z1)}"><rect width="${CAB.x1 - CAB.x0}" height="${CAB.z1 - CAB.z0}" class="ob-warm"/></g>`);
    const stacks = [0, 1, 2, 3, 4, 5].map(() => UTIL.g(g, '', { class: 'ob-stack' }));
    g.insertAdjacentHTML('beforeend', edgesOnly(CAB.x0, CAB.y0, CAB.z0, CAB.x1 - CAB.x0, CAB.y1 - CAB.y0, CAB.z1 - CAB.z0, 'ob-glass') + `<g transform="${FRONT(CAB.x0 + 1, CAB.y1 + .1, CAB.z1 - 1)}"><rect width="9" height="4" rx=".8" fill="#ff8a4a"/><text x="4.5" y="3" font-size="2.6" text-anchor="middle" fill="#fff">60℃</text></g>`);
    // the fryer stands right of the cabinet and nearer the camera, so it is drawn after it
    if (lv.fryer) g.insertAdjacentHTML('beforeend', `<g data-part="fryer">${box(FRYER[0] - 6, FRYER[1] - 5, FRYER[2] - 24, 12, 10, 24, 0, 'ob-fryer')}<g transform="${TOP(FRYER[0] - 5, FRYER[1] - 4, FRYER[2] + .02)}"><rect width="10" height="8" fill="#e8a82a"/><path d="M1 2h8M1 4h8M1 6h8" stroke="#8a5a1a" stroke-width=".5"/></g><g transform="${FRONT(FRYER[0] - 6, FRYER[1] + 5.05, FRYER[2] - 6)}"><text class="label sign" x="6" y="3" font-size="2.6" text-anchor="middle">揚げ場</text></g></g>`);
    else g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(FRYER[0] - 6, FRYER[1] - 5, FRYER[2] - 24, 12, 10, 24, 'ugh')}</g>`);
    const basket = lv.fryer ? UTIL.g(g, '', { class: 'ob-basket', 'data-part': 'fryer' }) : null;
    const bubbles = lv.fryer ? UTIL.g(g, '', { class: 'ob-bubbles' }) : null;
    g.insertAdjacentHTML('beforeend', box(KOBACHI[0] - 7, KOBACHI[1] - 6, KOBACHI[2] - 2, 14, 12, 2, 0, 'ob-fridge') + `<g transform="${FRONT(KOBACHI[0] - 7, KOBACHI[1] + 6.05, KOBACHI[2])}"><text class="label sign" x="7" y="1.8" font-size="1.8" text-anchor="middle">小鉢 · 冷</text></g>`
      + [[-2.6, -1.6], [0, -1.6], [2.6, -1.6], [-1.3, 1.6], [1.3, 1.6]].map(([u, v]) => cyl(KOBACHI[0] + u, KOBACHI[1] + v, KOBACHI[2], KOBACHI[2] + 1.6, 1.2, 1.6, '#2a4a6a') + disc(KOBACHI[0] + u, KOBACHI[1] + v, KOBACHI[2] + 1.6, 1.4, '#3a8a2a')).join(''));
    // the dessert shelf hangs on the warming cabinet's right side, high over the fryer (so it hides nothing)
    if (lv.dessert) g.insertAdjacentHTML('beforeend', `<g data-part="dessert">${post(DESSERT[0] + 4, DESSERT[1] - 3, DESSERT[2], 40)}${box(DESSERT[0] - 5, DESSERT[1] - 4, DESSERT[2] - 3, 10, 8, 3, 0, 'ob-fridge')}${[[-2.4, -1.6], [2, -1.6], [-.2, 1.8]].map(([u, v]) => cyl(DESSERT[0] + u, DESSERT[1] + v, DESSERT[2], DESSERT[2] + 2.2, 1.4, 1.8, '#ffd27a') + disc(DESSERT[0] + u, DESSERT[1] + v, DESSERT[2] + 2.2, 1.7, '#8a4a1a')).join('')}<g transform="${FRONT(DESSERT[0] - 5, DESSERT[1] + 4.05, DESSERT[2])}"><text class="label sign" x="5" y="2.6" font-size="2.4" text-anchor="middle">プリン</text></g></g>`);
    else g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(DESSERT[0] - 5, DESSERT[1] - 4, DESSERT[2] - 3, 10, 8, 6, 'ugh')}</g>`);
    // the belt with its rollers and its moving stripes, the tray magazine (clean sets inside), the chopstick dropper
    g.insertAdjacentHTML('beforeend', box(BELT.x0, BELT.y - 6, BELT.z - 22, BELT.x1 - BELT.x0, 12, 18, 0, 'ob-beltbody') + box(BELT.x0, BELT.y - 6, BELT.z - 4, BELT.x1 - BELT.x0, 12, 4, 0, 'ob-belt'));
    const stripes = UTIL.el('path', { class: 'ob-stripes', d: path([[BELT.x0 + 1, BELT.y + 6.05, BELT.z - 2], [BELT.x1 - 1, BELT.y + 6.05, BELT.z - 2]]) }, g);
    const magG = UTIL.g(g, '', { class: 'ob-mag' });
    g.insertAdjacentHTML('beforeend', post(MAG.x - 13, MAG.y + 9, BELT.z + 8, 30) + post(MAG.x + 13, MAG.y + 9, BELT.z + 8, 30) + box(MAG.x - 14, MAG.y - 10, BELT.z + 38, 28, 20, 2));
    // the chopstick dropper: a slim tube right at the front, so it hides nothing behind it
    g.insertAdjacentHTML('beforeend', box(STOP.finish - 2, BELT.y + 4, BELT.z + 16, 4, 3, 12, 0, 'ob-armbase') + `<g transform="${FRONT(STOP.finish - 2, BELT.y + 7.05, BELT.z + 27)}"><text class="label" x="2" y="3" font-size="2.2" text-anchor="middle">箸</text></g>`);
    const trays = UTIL.g(g, '', { class: 'ob-trays' });
    // the order rail with its printer, and the clips that ride it
    g.insertAdjacentHTML('beforeend', box(BELT.x0, RAIL.y - 1, RAIL.z, BELT.x1 - BELT.x0, 2, 1.6, 0, 'ob-rail') + box(2, RAIL.y - 6, RAIL.z - 3, 10, 8, 7, 0, 'ob-printer') + `<g transform="${FRONT(2, RAIL.y + 2.05, RAIL.z + 4)}"><rect x="2" y="3" width="6" height=".8" fill="#0a0c10"/><circle class="ob-pled" cx="8.6" cy="1.6" r=".6"/></g>`);
    const tickets = UTIL.g(g, '', { class: 'ob-tickets' });
    // the arms hang from the ceiling (their moving parts are drawn by the machine)
    g.insertAdjacentHTML('beforeend', [ARM.A, ARM.B].map(([x, y]) => box(x - 3, y - 3, ARM.z + 3, 6, 6, 16, 0, 'ob-armbase')).join(''));
    const arms = UTIL.g(g, '', { class: 'ob-arms' });
    const potG = potTop;
    // the drop at the end of the belt to the serving window
    g.insertAdjacentHTML('beforeend', post(STOP.end + 4, BELT.y + 4, 24, 58) + box(STOP.end - 6, BELT.y - 8, 24, 14, 16, 2));
    const movers = UTIL.g(g, '', { class: 'ob-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', ((lv.wash || 0) < 2 ? pin('wash', 24, 46, 46) : '') + (lv.fryer ? '' : pin('fryer', FRYER[0], FRYER[1] + 2, FRYER[2] - 8)) + (lv.dessert ? '' : pin('dessert', DESSERT[0] + 2, DESSERT[1] + 2, DESSERT[2] + 6)));
    return { dirtyG, spray, liftG, cookLid, potTop: potG, basket, bubbles, stacks, stripes, magG, trays, tickets, arms, movers, cm };
  }
  // a SCARA arm: shoulder at (sx, sy) on the arm plane, the tool at (tx, ty, tz); elbow bends to side `hand` (±1)
  function arm(sx, sy, tx, ty, tz, hand, tool, holding) {
    const { L1, L2, z } = ARM;
    let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy); const dm = Math.max(Math.abs(L1 - L2) + .5, Math.min(L1 + L2 - .1, d));
    if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
    const a = Math.atan2(dy, dx), c = Math.max(-1, Math.min(1, (L1 * L1 + dm * dm - L2 * L2) / (2 * L1 * dm))), b = Math.acos(c) * hand;
    const ex = sx + L1 * Math.cos(a + b), ey = sy + L1 * Math.sin(a + b), wx = sx + dx / d * dm, wy = sy + dy / d * dm;
    let o = seg([sx, sy, z + 1], [ex, ey, z + 1], '#3a4250', 4.4) + seg([sx, sy, z + 1.4], [ex, ey, z + 1.4], '#8a93a4', 2.4)
      + seg([ex, ey, z - 1], [wx, wy, z - 1], '#3a4250', 3.6) + seg([ex, ey, z - .6], [wx, wy, z - .6], '#aab4c4', 1.8) + dot(ex, ey, z, 2, '#5a6270') + dot(sx, sy, z + 1.6, 2.6, '#5a6270');
    o += seg([wx, wy, z - 2], [wx, wy, tz + 3], '#c9d0da', 1.4);
    if (holding) o += holding(wx, wy, tz - 1);
    o += tool === 'scoop' ? `${(() => { const [p0, p1] = q(wx, wy, tz + 2); return `<path d="M${f(+p0 - 1.8)} ${p1}a1.8 1.2 0 0 0 3.6 0z" fill="#efe4cc" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`; })()}`
      : tool === 'ladle' ? cyl(wx, wy, tz + 1, tz + 2.6, 1.6, 2, '#8a93a4') : box(wx - 2, wy - 1, tz + 1.6, 4, 2, 1.6, 0, 'ob-grip');
    return o;
  }
  // the warming cabinet's stack for a menu place: a plate per portion, each showing a dab of its own dish
  function stack(list, k) {
    const [x, y, z] = OB.place(k); let o = '';
    list.forEach((p, i) => { o += disc(x, y, z + i * 1.4, 3.2, '#f6f2ea', 12) + disc(x, y, z + i * 1.4 + .3, 2, p.c, 10); });
    return o;
  }

  /* ---------- the shell and door: the noren, the ticket machine, the kitchen window, the number board, the serving window ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, oc = '#ff8a4a', nv = '#24346a';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const ln = `stroke="rgba(255,138,74,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/>
      <rect x="14" y="26" width="56" height="70" rx="4" fill="rgba(255,138,74,.06)" ${ln}/><path d="M22 54h40q-2 14-20 14t-20-14z" fill="none" ${ln}/><ellipse cx="42" cy="54" rx="20" ry="4" fill="none" ${ln}/><path d="M34 46q-3-5 0-10M42 46q-3-5 0-10M50 46q-3-5 0-10" fill="none" ${ln}/><path d="M24 84h36" ${ln}/>
      ${['定', '食'].map((ch, i) => `<text class="sign" x="42" y="${130 + i * 28}" font-size="24" text-anchor="middle" fill="rgba(255,138,74,.12)" stroke="rgba(255,138,74,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="196" width="56" height="12" rx="2" fill="rgba(255,138,74,.1)" stroke="${oc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="204.8" font-size="6" text-anchor="middle" fill="${oc}">ごはん おかわり</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/><g class="iso-only">
      <rect x="12" y="70" width="60" height="40" rx="3" fill="rgba(255,138,74,.06)" ${ln}/>${[[24, 84, 6], [44, 82, 8], [60, 88, 5], [30, 100, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" ${ln}/>`).join('')}<path d="M16 106h22" ${ln}/>
      <text class="sign" x="42" y="150" font-size="12" text-anchor="middle" fill="rgba(255,138,74,.14)" stroke="rgba(255,138,74,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">いただきます</text>
      <text class="label" x="42" y="166" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,138,74,.6)">TEISHOKU · 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const price = p => Math.round(p.price * (lv.dessert ? 1.3 : 1));
    const tile = (k, p) => { const x = 6 + (k % 3) * 29, y = 25 + Math.floor(k / 3) * 26, fs = Math.min(3, 25 / (p.jp || p.name).length);
      return R3(x, y, 28, 24, 1, `<rect class="ob-tglow nohit" x="${x}" y="${y}" width="28" height="24" rx="2" fill="${oc}" opacity="0"/><g transform="translate(${x + 1.4} ${y + 1.4}) scale(.62)">${icon(p.g, p.c)}</g>
        <text x="${x + 22}" y="${y + 7}" font-size="3" text-anchor="middle" class="label ob-price">${UTIL.money(price(p))}</text>${lv.dessert ? `<text x="${x + 22}" y="${y + 11}" font-size="2.2" text-anchor="middle" class="label" fill="#ffd27a">+プリン</text>` : ''}
        <text x="${x + 14}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><rect class="led" x="${x + 10}" y="${y + 21.4}" width="8" height="1.2" rx=".5"/><text class="soldout" x="${x + 14}" y="${y + 10}" font-size="3.8" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit ob-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // (user, 2026-10-17: hide the works, X-ray is for them) the door shows a serving hatch at the height of the belt — the
    // tray going by and the bowls landing on it; the arms, the cooker and the cabinet stay behind the door. Above the
    // hatch, how to buy a ticket, as on every real 食券機
    const steps = [['お金を入れる', `<circle cx="0" cy="0" r="3.4" fill="#ffd23f" stroke="#141018" stroke-width=".6"/><text y="1.2" font-size="3.4" text-anchor="middle" fill="#7a5a00" class="label">¥</text>`],
      ['ボタンを押す', `<rect x="-4" y="-3" width="8" height="6" rx="1.2" fill="#fff8ec" stroke="#141018" stroke-width=".6"/><circle cx="0" cy="0" r="1.4" fill="${oc}"/>`],
      ['食券をとる', `<rect x="-3.4" y="-4" width="6.8" height="8" rx=".6" fill="#fffdf6" stroke="#141018" stroke-width=".6"/><path d="M-2 -1.6h4M-2 0h4M-2 1.6h2.6" stroke="#8a2a1a" stroke-width=".5"/>`]];
    const k5 = 'stroke="#141018" stroke-width=".5"';
    const set = [['ごはん', `<path d="M-4 -.6q0 4 4 4t4-4z" fill="#c8402a" ${k5}/><path d="M-3.6 -.6q.4-2.8 3.6-2.8t3.6 2.8z" fill="#fbfaf4" ${k5}/>`],
      ['みそ汁', `<path d="M-4 -1q0 4.4 4 4.4t4-4.4z" fill="#3a1a12" ${k5}/><ellipse cy="-1" rx="4" ry="1.2" fill="#a8742a" ${k5}/>`],
      ['主菜', `<ellipse cy=".6" rx="5" ry="2" fill="#fbfaf4" ${k5}/><path d="M-3 0q3-2.6 6 0q-3 1.4-6 0z" fill="#a8642a" ${k5}/>`],
      ['小鉢', `<path d="M-3.2 -.4q0 3.4 3.2 3.4t3.2-3.4z" fill="#3a6ad9" ${k5}/><ellipse cy="-.4" rx="3.2" ry=".9" fill="#6aaa4a" ${k5}/>`],
      ['漬物', `<ellipse cy=".8" rx="3.8" ry="1.5" fill="#fbfaf4" ${k5}/><path d="M-2.2 0h1.8v1h-1.8zM.4 -.2h1.8v1h-1.8z" fill="#ffd23f"/>`]];
    // the door's grid: a board across (x 6–92) says what comes in a set; under it the window (x 6–52) frames the rice stop
    // — the tray magazine, the cooker, the soup pot, the tray (u 10–57, v 116–158) — and the right column (62–92) says how to buy a ticket
    const howto = `<rect x="6" y="80" width="86" height="30" rx="2" class="ob-board"/><text class="ob-boardt" x="49" y="88" font-size="4" text-anchor="middle">定食のセット</text>`
      + set.map(([t, ic], i) => { const cx = 15.6 + i * 16.7; return `<g transform="translate(${cx} 97)">${ic}</g><text class="ob-boardt" x="${cx}" y="106" font-size="2.7" text-anchor="middle">${t}</text>`; }).join('')
      + `<rect x="62" y="114" width="30" height="46" rx="2" class="ob-board"/><text class="ob-boardt" x="77" y="121.4" font-size="3.2" text-anchor="middle">食券の買い方</text>`
      + steps.map(([t, ic], i) => { const y = 130 + i * 10.6; return `<circle cx="65.6" cy="${y}" r="2" fill="#ffd27a"/><text x="65.6" y="${y + .9}" font-size="2.4" text-anchor="middle" fill="#141018" class="label">${i + 1}</text>`
        + `<g transform="translate(71 ${y}) scale(.58)">${ic}</g><text class="ob-boardt" x="75.2" y="${y + .9}" font-size="2.35">${t}</text>`; }).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM6 114V160H58V114Z" fill-rule="evenodd"/>
      ${[4, 42, 80].map((x, i) => `<path d="M${x} 3h36v15q-9 2-18 0t-18 0z" fill="${nv}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('')}
      <text class="ob-noren" x="22" y="14" font-size="8" text-anchor="middle">定</text><text class="ob-noren" x="60" y="14" font-size="8" text-anchor="middle">食</text><text class="ob-noren" x="98" y="13" font-size="5.6" text-anchor="middle">おぼん</text>
      <rect x="5" y="23" width="88" height="54" rx="2" class="ob-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      ${howto}${SK(6, 114, 52, 46, 3, { hole: true })}
      <rect class="dglass nohit" x="6" y="114" width="52" height="46"/><path class="nohit" d="M14 114L22 114L14 160H6Z" fill="#fff" opacity=".05"/><path class="nohit" d="M34 114L37 114L29 160H26Z" fill="#fff" opacity=".04"/>
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="ob-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      <g data-hit="ticket" class="hit">${SK(96, 59, 18, 8, 2, { r: 1.2 })}</g><g class="ob-ticketout" style="display:none"><rect x="99" y="54" width="12" height="7" fill="#fffdf6" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><text class="ob-tickettext" x="105" y="58.6" font-size="2.4" text-anchor="middle" fill="#141018">食券</text></g>
      <text class="label" x="105" y="71" font-size="2.4" text-anchor="middle">食券</text>
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${R3(95, 91, 20, 13, .8, `<text class="label" x="105" y="95.6" font-size="2.4" text-anchor="middle">食器</text><text class="ob-sets" x="105" y="101.4" font-size="4" text-anchor="middle">6/6</text>`, { r: 1.5, capCls: 'readycap' })}
      ${R3(95, 106, 20, 7, .8, `<text class="lit-text ob-washing" style="--lc:var(--red)" x="105" y="111" font-size="3" text-anchor="middle">洗い物中</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 118)}
      ${lv.wash ? `<g class="nohit" transform="translate(95 138)"><rect width="20" height="14" rx="2" fill="#eaf4ff" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>${[[4, 5, 1.6], [6.6, 8.4, 1.2], [3.4, 9.6, .9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#2a7ad9" stroke-width=".5"/>`).join('')}<text x="13" y="6" font-size="2.6" text-anchor="middle" fill="#141018" class="sign">${lv.wash > 1 ? '高速' : '自動'}</text><text x="13" y="10.6" font-size="2.6" text-anchor="middle" fill="#141018" class="sign">食洗機</text></g>` : ''}
      ${lv.fryer ? `<g class="nohit" transform="translate(104 199) rotate(-6)"><circle r="9" fill="#fff8ec" stroke="#d8102a" stroke-width=".9" vector-effect="non-scaling-stroke"/><path d="M-1.4-6.4q1.4-2 2.8 0q-1.4 1-2.8 0z" fill="#e8a23a"/><text y="-.4" font-size="3.2" text-anchor="middle" fill="#d8102a" class="sign">揚げたて</text><text y="3.4" font-size="2.2" text-anchor="middle" fill="#5a2418" class="label">からっと</text></g>` : ''}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#120a08" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="ob-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text ob-ready" style="--lc:${oc}" x="60" y="190.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${nv}" opacity=".92"/><text class="ob-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お食事処</text>
      <rect class="ob-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 196, 20, 14, 3, { r: 2 })}<rect class="ob-retflap nohit" x="7" y="197" width="18" height="6" rx="1" fill="#2a2f3a" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><text class="label" x="16" y="214" font-size="2.4" text-anchor="middle">返却口</text>
      <text class="label" x="102" y="214" font-size="2.4" text-anchor="middle">ごちそうさま</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM6 114V160H58V114Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="6" y="114" width="52" height="46"/>
      <rect class="face" x="5" y="23" width="88" height="54" rx="2"/><path class="wire2" d="M10 50H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'ob-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'ob-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.ob-tile')],
      slotGlow: door.querySelector('.ob-slotglow'), ticketOut: door.querySelector('.ob-ticketout'), sets: door.querySelector('.ob-sets'), washing: door.querySelector('.ob-washing'),
      lcd: door.querySelector('.ob-lcd'), ready: door.querySelector('.ob-ready'), flap: door.querySelector('.ob-flap'), retFlap: door.querySelector('.ob-retflap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="23" width="88" height="54"/><rect class="xline" x="6" y="114" width="52" height="46"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, tray, arm, stack, icon, MAIN };
})();
