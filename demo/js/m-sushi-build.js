/* Fig 11 · 回転寿司「すし丸」— geometry. Made up, but built like a plant (user, 2026-10-16: every machine its own
   mechanism, a process line where each step has its own station — never one arm doing everything).
   The upper deck, left to right: the magazine drops a plate (its colour is its ★: white, blue, yellow, red, black with
   a gold rim); the rice drum turns under the hopper, packs a mould pocket and pushes a ball of rice out onto the plate;
   the neta turret turns the ordered cassette to the front and a pusher slides one slice off its bottom, like a card shoe;
   (the torch sears it); the lift at the end lowers the plate onto the loop. The loop: a chain belt round the window.
   The reader arch over its front run counts the plates going by and stamps 半額 on one that has gone round too long;
   the diverter flips a sold plate off into the chute, down to the take-out window. The base: the chiller, the rice
   warmer with its pipe up to the hopper, spare plates. Everything deep sits left: a point y deep shows (84 − y) × .87
   further right, so the loop and the deck stay forward and left of x ≈ 72. */
const SU = (() => {
  const W = 120, D = 84, H = 240;
  // the loop: two straights between half-circles of radius R (centres at x0 and x1, CY); front run at y1, rear at y0
  const LOOP = { z: 90, y0: 60, y1: 76, x0: 14, x1: 60 };
  const R = (LOOP.y1 - LOOP.y0) / 2, CY = (LOOP.y0 + LOOP.y1) / 2, STR = LOOP.x1 - LOOP.x0, LEN = 2 * STR + 2 * Math.PI * R;
  // a point on the chain: s = 0 at the front run's left end, going right along the front, round, left along the back
  function posAt(s) {
    let d = ((s % 1) + 1) % 1 * LEN;
    if (d < STR) return [LOOP.x0 + d, LOOP.y1];
    d -= STR; if (d < Math.PI * R) { const a = Math.PI / 2 - d / R; return [LOOP.x1 + R * Math.cos(a), CY + R * Math.sin(a)]; }
    d -= Math.PI * R; if (d < STR) return [LOOP.x1 - d, LOOP.y0];
    d -= STR; const a = -Math.PI / 2 - d / R; return [LOOP.x0 + R * Math.cos(a), CY + R * Math.sin(a)];
  }
  const sFront = x => (x - LOOP.x0) / LEN;
  // the deck runs along y = CY at height z; the lift stands over the loop's rightmost point and lowers plates onto it
  const DECK = { z: 120, y: CY, x0: 3, x1: 72 };
  const STN = { mag: 7, rice: 18, neta: 31, burn: 44, lift: LOOP.x1 + R };
  const S_LIFT = (STR + Math.PI * R / 2) / LEN;
  const HOP = { x: 18, y: CY, z0: 138, z1: 156 };
  const DRUM = { x: 18, y0: CY - 5, y1: CY + 5, z: 130, r: 5 };
  const TUR = { x: 31, y: CY - 1, z: 126, r: 5.4, h: 15 };
  const EXIT = 52, LABEL = 30;
  const CHUTE = [[EXIT + 1, 82, LOOP.z - 2], [EXIT + 4, 82, 44]];
  const EXPRESS = [[STN.lift, CY + 6, DECK.z - 3], [STN.lift + 2, 82, 44]];
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): g = what is on the rice
  const MENU = [
    { name: 'たまご', price: 260, g: 'tamago', tier: 1 }, { name: 'かっぱ巻き', price: 250, g: 'kappa', tier: 1 }, { name: 'いなり', price: 250, g: 'inari', tier: 1 },
    { name: 'いか', price: 300, g: 'ika', tier: 1 }, { name: 'サーモン', price: 330, g: 'salmon', tier: 1 },
  ];
  // plate face and rim per ★ (the colour code of every conveyor-belt shop: the plate says the price)
  const PLATE = [null, ['#f4f2ec', '#bdb6a6'], ['#3a7ad9', '#24529a'], ['#ffd23f', '#c4941a'], ['#e8453a', '#a02a22'], ['#1c1c22', '#ffd23f']];
  // what each one looks like from above, for the icons, the crate's packs and the turret's slices
  const TOPC = { tamago: '#ffd23f', kappa: '#4aaa4a', inari: '#b8742a', ika: '#f4f2ea', salmon: '#ff8a4a', maguro: '#d8343a', ebi: '#ff9a5a', hamachi: '#f6c8b0',
    hotate: '#f6ecd6', ikura: '#ff6a2a', negitoro: '#ff9aa8', chutoro: '#ff8a96', uni: '#ffb02a', amaebi: '#ffb0b0', goldtoro: '#ffc0c8', asalmon: '#d8742a', aengawa: '#e8d0b0', atoro: '#ef8a90' };
  return { W, D, H, LOOP, R, CY, LEN, posAt, sFront, S_LIFT, DECK, STN, HOP, DRUM, TUR, EXIT, LABEL, CHUTE, EXPRESS, WINDOW, MENU, PLATE, TOPC, SLOTW: [105, D, 196] };
})();

const SUB = (() => {
  const { FRONT, TOP, box, rounded, rect, path, P, f } = ISO;
  const { W, D, H, LOOP, R, CY, DECK, STN, HOP, DRUM, TUR, EXIT, LABEL, CHUTE, EXPRESS, PLATE, TOPC } = SU;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const K = 'stroke="rgba(0,0,0,.42)" stroke-width=".45" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
  const q = (x, y, z) => P(x, y, z).map(f);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ringZ(z0, r0, n, 0, Math.PI * 2, x, y), ...ringZ(z1, r1, n, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ringZ(z, r, n, 0, Math.PI * 2, x, y))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  // an oval ring round the loop's two centres, radius r, at height z (in order round it: front, right, back, left)
  const oval = (r, z, n = 14) => { const pts = [];
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - Math.PI * i / n; pts.push(P(LOOP.x1 + r * Math.cos(a), CY + r * Math.sin(a), z)); }
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 - Math.PI * i / n; pts.push(P(LOOP.x0 + r * Math.cos(a), CY + r * Math.sin(a), z)); }
    return pts; };
  // a cylinder lying along y (the rice drum): rings in the x-z plane
  const ringY = (y, x, z, r, n = 16, a0 = 0) => Array.from({ length: n }, (_, i) => { const t = a0 + i / n * Math.PI * 2; return P(x + r * Math.cos(t), y, z + r * Math.sin(t)); });

  /* ---------- the sushi: two pieces a plate, each kind its own look (screen units, around the piece's foot) ---------- */
  const rice = (a, b) => `<path d="M${f(a - 2)} ${f(b + .5)}q0-1.7 2-1.7t2 1.7q0 1-2 1t-2-1z" fill="#fbfaf4" ${K}/>`;
  const slab = (a, b, c) => `<path d="M${f(a - 2.4)} ${f(b - .2)}q.3-1.7 2.4-1.8q2.1.1 2.4 1.8q-.4 .9-2.4 1q-2-.1-2.4-1z" fill="${c}" ${K}/><path d="M${f(a - 1.6)} ${f(b - 1.1)}q.7-.6 1.7-.7" fill="none" stroke="#fff" stroke-width=".35" stroke-linecap="round" opacity=".7"/>`;
  const lines = (a, b, c, w = .35) => `<path d="M${f(a - 1.4)} ${f(b - 1.5)}l.6 1.6M${f(a - .2)} ${f(b - 1.8)}l.6 1.8M${f(a + 1)} ${f(b - 1.6)}l.6 1.6" stroke="${c}" stroke-width="${w}" fill="none"/>`;
  const tail = (a, b, c) => `<path d="M${f(a + 2.2)} ${f(b - 1.2)}l1.4-.9.2 1.6z" fill="${c}" ${K}/>`;
  const char = (a, b) => `<path d="M${f(a - 2.2)} ${f(b - .9)}q2.2-1.4 4.4 0q-2.2-.5-4.4 0z" fill="#5a2a12" opacity=".7"/><path d="M${f(a - 1.2)} ${f(b - 1.5)}l.5 .3M${f(a + .6)} ${f(b - 1.7)}l.4 .4" stroke="#3a1a08" stroke-width=".4"/>`;
  const gunkan = (a, b, top) => `<path d="M${f(a - 2)} ${f(b - 1.4)}v1.9q2 1 4 0v-1.9z" fill="#1e2a20" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.4)}" rx="2" ry=".75" fill="#2c3a2c" ${K}/>` + top;
  const beads = (a, b, c, hi) => [[-1, -1.6], [0, -1.9], [1, -1.6], [-.5, -1.2], [.6, -1.2]].map(([u, v]) => `<circle cx="${f(a + u)}" cy="${f(b + v)}" r=".55" fill="${c}"/><circle cx="${f(a + u - .15)}" cy="${f(b + v - .2)}" r=".18" fill="${hi}"/>`).join('');
  const maki = (a, b, core) => `<path d="M${f(a - 1.6)} ${f(b - 1.4)}v1.6q1.6 .8 3.2 0v-1.6z" fill="#1e2a20" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.4)}" rx="1.6" ry=".7" fill="#fbfaf4" ${K}/><ellipse cx="${f(a)}" cy="${f(b - 1.4)}" rx=".6" ry=".28" fill="${core}"/>`;
  const PIECE = {
    tamago: (a, b) => rice(a, b) + slab(a, b, '#ffd23f') + `<path d="M${f(a - .6)} ${f(b - 2.1)}h1.2v3h-1.2z" fill="#1e2a20"/>`,
    kappa: (a, b) => maki(a, b, '#4aaa4a'),
    inari: (a, b) => `<path d="M${f(a - 2.2)} ${f(b + .6)}q-.3-2.8 2.2-3q2.5.2 2.2 3q-1 .8-2.2.8t-2.2-.8z" fill="#b8742a" ${K}/><path d="M${f(a - 1.2)} ${f(b - .9)}q1.2.6 2.4 0" fill="none" stroke="#8a4a1a" stroke-width=".4"/>`,
    ika: (a, b) => rice(a, b) + slab(a, b, '#f4f2ea') + lines(a, b, '#d8d2c4'),
    salmon: (a, b) => rice(a, b) + slab(a, b, '#ff8a4a') + lines(a, b, '#ffe0c8', .45),
    maguro: (a, b) => rice(a, b) + slab(a, b, '#d8343a'),
    ebi: (a, b) => rice(a, b) + slab(a, b, '#fff0e0') + lines(a, b, '#ff6a3a', .7) + tail(a, b, '#ff5a2a'),
    hamachi: (a, b) => rice(a, b) + slab(a, b, '#f6c8b0') + `<path d="M${f(a - 2.2)} ${f(b - .4)}q2.2 .7 4.4 0" fill="none" stroke="#c8846a" stroke-width=".5"/>`,
    hotate: (a, b) => rice(a, b) + `<ellipse cx="${f(a)}" cy="${f(b - 1.2)}" rx="1.9" ry="1" fill="#f6ecd6" ${K}/><path d="M${f(a - 1)} ${f(b - 1.3)}h2" stroke="#e0d0b0" stroke-width=".35"/>`,
    ikura: (a, b) => gunkan(a, b, beads(a, b, '#ff6a2a', '#ffd0a0')),
    negitoro: (a, b) => gunkan(a, b, `<ellipse cx="${f(a)}" cy="${f(b - 1.7)}" rx="1.6" ry=".7" fill="#ff9aa8"/>` + [[-.6, -1.9], [.5, -1.6], [.1, -2.1]].map(([u, v]) => `<circle cx="${f(a + u)}" cy="${f(b + v)}" r=".3" fill="#3a9a3a"/>`).join('')),
    chutoro: (a, b) => rice(a, b) + slab(a, b, '#ff8a96') + lines(a, b, '#ffd0d6', .5),
    uni: (a, b) => gunkan(a, b, [[-.8, -1.8], [.1, -2.1], [.9, -1.7], [-.2, -1.4]].map(([u, v]) => `<ellipse cx="${f(a + u)}" cy="${f(b + v)}" rx=".8" ry=".45" fill="#ffb02a" stroke="#c87a10" stroke-width=".25"/>`).join('')),
    amaebi: (a, b) => rice(a, b) + slab(a, b, '#ffc0c0') + lines(a, b, '#ff8a8a', .4) + tail(a, b, '#ff7a7a'),
    goldtoro: (a, b) => rice(a, b) + slab(a, b, '#ffc8cf') + lines(a, b, '#fff0f2', .6) + [[-1, -1.8], [.6, -1.6], [-.2, -1.3]].map(([u, v]) => `<path d="M${f(a + u)} ${f(b + v)}l.5-.3.4 .4-.5.3z" fill="#ffd23f"/>`).join(''),
    asalmon: (a, b) => rice(a, b) + slab(a, b, '#ff8a4a') + char(a, b),
    aengawa: (a, b) => rice(a, b) + slab(a, b, '#f0dcc0') + lines(a, b, '#d8b890', .4) + char(a, b),
    atoro: (a, b) => rice(a, b) + slab(a, b, '#ffb0b8') + lines(a, b, '#ffe0e4', .5) + char(a, b),
  };
  // the clear dome over a plate (upgrade) at world (x, y, z): the shell, the knob on top, a glint
  const dome = (x, y, z, r = 4.6) => { const k = r / 4.6, [a, b] = q(x - 2 * k, y, z + 3.6 * k);
    return `<path class="su-dome" d="${toD(hull([...ringZ(z + .5, r, 14, 0, Math.PI * 2, x, y), ...ringZ(z + 3.6 * k, r * .78, 12, 0, Math.PI * 2, x, y), ...ringZ(z + 5 * k, r * .35, 8, 0, Math.PI * 2, x, y)]))}"/>`
      + disc(x, y, z + 5.2 * k, .9 * k, '#e6f6ff', 8, 'stroke:rgba(120,200,240,.9);stroke-width:.5;vector-effect:non-scaling-stroke')
      + `<path d="M${a} ${b}q${f(.6 * k)}-${f(1.6 * k)} ${f(2 * k)}-${f(2 * k)}" fill="none" stroke="#fff" stroke-width=".7" opacity=".75"/>`; };
  // a plate as it stands at world (x, y, z): its ★ colour, the two pieces, a 半額 sticker, the clear dome (upgrade)
  function plate(p, x, y, z, o = {}) {
    const [fc, rc] = PLATE[Math.min(5, p.tier || 1)];
    let s = disc(x, y, z, 5.2, rc, 16) + disc(x, y, z + .5, 4.3, fc, 16, 'stroke:rgba(0,0,0,.18);stroke-width:.5;vector-effect:non-scaling-stroke');
    // stage (on the deck): 0 the bare plate, 1 the rice on it, 2 dressed
    const stg = o.stage == null ? 2 : o.stage, pcs = [[-1.8, -.4], [1.8, .4]].map(([u, v]) => q(x + u, y + v, z + .6)).sort((m, n) => m[1] - n[1]);
    if (stg >= 1) s += pcs.map(([a, b]) => stg === 1 ? rice(+a, +b) : (PIECE[p.g] || PIECE.salmon)(+a, +b)).join('');
    if (o.half) { const [a, b] = q(x + 3.4, y + 3.6, z + .7); s += `<g transform="translate(${a} ${b}) rotate(-14)"><rect x="-2.2" y="-1.05" width="4.4" height="2.1" rx=".5" fill="#ffe14a" stroke="#c0392b" stroke-width=".4" vector-effect="non-scaling-stroke"/><text class="su-half" y=".62" font-size="1.55" text-anchor="middle">半額</text></g>`; }
    if (o.dome) s += dome(x, y, z);
    return s;
  }
  // flat icons (24 × 24) for the menu tiles and the shop: the plate in its colour, one piece on it
  function icon(g, tier = 1) {
    const [fc, rc] = PLATE[Math.min(5, tier)], c = TOPC[g] || '#ff8a4a', k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"';
    // (app build, goods polish: each kind its own marks, the plate's style and outline kept; one element per colour of marks)
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const gloss = ln('M7.2 9.2q1.9-1.7 4.4-1.9', '#fff', .9, ' opacity=".75"');
    const stripes = (col, w = .9) => ln('M8.2 8l1.3 4.6M11.6 7.3l1.1 5.2M15 7.6l.9 4.8', col, w);
    const sear = ln('M6 10q6-3.4 12 0', '#5a2a12', 1.6, ' opacity=".7"') + ln('M8.4 8.6l1 1.5M11.2 7.8l1 1.6M14.2 8l.9 1.5', '#3a1a08', .7);
    const neta = (col, d = 'M4.4 11.4q1-4.6 7.6-4.8q6.6.2 7.6 4.8q-1.2 1.6-7.6 1.8q-6.4-.2-7.6-1.8z') => `<path d="${d}" fill="${col}" ${k}/>`;
    const rice = `<path d="M5.4 13q0-4.4 6.6-4.4t6.6 4.4q0 2-6.6 2t-6.6-2z" fill="#fbfaf4" ${k}/>` + ln('M7.6 13.8l.7.4M10.4 14.3l.8.1M13.6 14.3l.8-.1M16.2 13.8l.6-.4', '#cfc8b4', .55);
    const gunkan = top => `<path d="M6 8.4v5.2q6 2.6 12 0V8.4z" fill="#1e2a20" ${k}/>` + ln('M7.6 10.2v3.4M15.8 10.6v3.2', '#3e5244', .6) + `<ellipse cx="12" cy="8.4" rx="6" ry="2.2" fill="${c}" ${k}/>` + top;
    const NIGIRI = {
      tamago: () => neta(c) + ln('M5.6 11.6q6.4 1.7 12.8 0', '#d8a020', .55) + `<path d="M10.8 6.8h2.4v6.6h-2.4z" fill="#1e2a20"/>` + gloss,
      ika: () => neta(c) + ln('M8.4 8.2l.8 3.8M11.2 7.5l.8 4.6M14.2 7.7l.7 4.1M6.8 10.4q5.2-1.6 10.6-.2', '#cdc6b6', .55) + gloss,
      salmon: () => neta(c) + stripes('#ffe0c8') + gloss,
      maguro: () => neta(c) + ln('M6.4 11.6q5.6 1.3 11.2.2', '#a8202a', .6) + gloss,
      ebi: () => `<path d="M17.2 10.4l4.4-3.8q.9 2.2-.2 3.8q1.1 1.8.2 3.8z" fill="#ff5a2a" ${k}/>` + neta('#fff0e0') + stripes('#ff6a3a', 1.4) + gloss,
      hamachi: () => neta(c) + ln('M5.6 11.8q6.4 1.6 12.8 0', '#c8846a', 1.1) + gloss,
      asalmon: () => neta(c) + stripes('#ffd0b0') + sear,
      hotate: () => neta(c, 'M6 11.4q0-4.6 6-4.8q6 .2 6 4.8q-1.6 1.6-6 1.7q-4.4-.1-6-1.7z') + ln('M9.2 8.2l-.3 4M12 7.4v4.9M14.8 8.2l.3 4', '#e2d0ac', .55) + gloss,
      aengawa: () => neta(c) + ln('M6.6 10.8q1-.9 2.1 0t2.1 0t2.1 0t2.1 0t2.1 0', '#c8a070', .55) + sear,
      chutoro: () => neta(c) + stripes('#ffd6dc', 1) + gloss,
      atoro: () => neta(c) + stripes('#ffe0e4') + sear,
      goldtoro: () => neta(c) + stripes('#fff0f2', 1) + `<path d="M8.6 8.4l1-.6.7.8-1 .6zM13 7.6l1.1-.4.5.9-1.1.4zM15.6 9.4l.8-.7.8.6-.8.7zM11 10l.7-.5.6.6-.7.5z" fill="#ffd23f" stroke="#b8860b" stroke-width=".35"/>` + gloss,
    };
    let top;
    if (g === 'kappa') top = [8.4, 15.6].map(x => `<circle cx="${x}" cy="11.4" r="3.4" fill="#1e2a20" ${k}/><circle cx="${x}" cy="11.4" r="2.2" fill="#fbfaf4"/><circle cx="${x}" cy="11.4" r=".9" fill="${c}"/>`).join('')
      + ln('M5.6 10.2q.8-1.8 2.6-2.1M12.8 10.2q.8-1.8 2.6-2.1', '#4a5e4c', .6) + ln('M7.2 10.6l.4-.3M9.4 12.4l.3.3M14.4 10.6l.4-.3M16.6 12.4l.3.3', '#cfc8b4', .45);
    else if (g === 'inari') top = `<path d="M5.5 14q-.6-7 6.5-7.4q7.1.4 6.5 7.4q-3 2-6.5 2t-6.5-2z" fill="${c}" ${k}/>`
      + ln('M8 10.2q1 .8 2.2-.1M13.2 9.4q1.1.8 2.3-.2M9.4 13.2q1.4.6 2.9-.2M14.6 12.8q.9.4 1.8-.4', '#7a4216', .6) + ln('M8 8.8q1.6-1.6 3.6-1.7', '#e0a060', .9);
    else if (g === 'ikura') { const b = [[8.6, 8.4], [10.8, 7.6], [13.2, 7.6], [15.4, 8.4], [9.8, 9.4], [12, 8.9], [14.2, 9.4], [12, 6.9]];
      top = gunkan(`<path d="${dots(b, 1.25)}" fill="#ff6a2a" stroke="#b8380e" stroke-width=".45"/><path d="${dots(b.map(([x, y]) => [+(x - .4).toFixed(1), +(y - .4).toFixed(1)]), .35)}" fill="#ffe0c0"/>`); }
    else if (g === 'uni') top = gunkan(`<path d="${[[9, 8.2], [11.6, 7.4], [14.4, 7.9], [10.4, 9.2], [13.4, 9.2]].map(([x, y]) => `M${x - 1.7} ${y}a1.7 1 0 1 0 3.4 0a1.7 1 0 1 0 -3.4 0z`).join('')}" fill="#ffb02a" stroke="#c87a10" stroke-width=".5"/>`
      + ln('M8.4 8l.6.3M11 7.2l.6.3M13.8 7.7l.6.3M10 9l.5.3M12.9 9l.5.3', '#e08a10', .45));
    else if (g === 'negitoro') top = gunkan(`<path d="M6.8 8.6q.6-2.8 5.2-2.9q4.6.1 5.2 2.9q-2.6 1.2-5.2 1.2t-5.2-1.2z" fill="${c}" stroke="#c8606e" stroke-width=".5"/>`
      + ln('M8.6 7.6l.4.3M11.4 6.8l.4.3M14.6 7.4l.4.3M10 8.8l.4.2', '#ffd0d8', .5)
      + `<path d="${dots([[9.6, 7.4], [12.6, 6.6], [14.8, 8.4], [11.6, 8.8]], .6)}" fill="#bfe08a" stroke="#3a9a3a" stroke-width=".45"/>`);
    else top = rice + (NIGIRI[g] || NIGIRI.salmon)();
    return `<ellipse cx="12" cy="16" rx="10.4" ry="5" fill="${rc}" ${k}/><ellipse cx="12" cy="15.6" rx="8.4" ry="3.8" fill="${fc}"/>${top}${tier >= 5 ? '<ellipse cx="12" cy="16" rx="10.4" ry="5" fill="none" stroke="#ffd23f" stroke-width=".9"/>' : ''}`;
  }
  // the crate: a pack of sliced neta (in its colour) and the rice sack
  function defs() {
    const pack = `<g id="g-su-pack">${box(-6, -4, 0, 12, 8, 2.2, 0, 'su-pack')}<g transform="${TOP(-6, -4, 2.23)}"><rect x="1" y="1" width="10" height="6" rx="1" fill="rgba(230,245,255,.35)"/><path d="M2.4 2.2l2.2 3.6M4.8 2.2l2.2 3.6M7.2 2.2l2.2 3.6" style="stroke:var(--c)" stroke-width="1.8" stroke-linecap="round"/></g></g>`;
    const sack = `<g id="g-su-rice"><path d="M-6 0q-1-10 1-13q5-1.4 10 0q2 3 1 13q-6 1.4-12 0z" fill="#f6f2e6" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-4" y="-9" width="8" height="5" rx="1" fill="#e8453a"/><text x="0" y="-5.4" font-size="3.4" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">シャリ</text></g>`;
    return pack + sack;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- moving parts, drawn again as they move ---------- */
  // the rice in the hopper (lvl 0..1, seen through its window)
  const hopperFill = lvl => `<g transform="${FRONT(HOP.x - 4.5, HOP.y + 5.05, HOP.z1 - 4)}"><rect width="9" height="12" fill="#0e1218"/><rect y="${f(12 - 12 * Math.max(0, Math.min(1, lvl)))}" width="9" height="${f(12 * Math.max(0, Math.min(1, lvl)))}" fill="#f6f2e6"/><path d="M0 6h9" stroke="rgba(255,255,255,.12)" stroke-width=".5"/></g>`;
  // the drum at angle a: its body, the front face, four mould pockets round it (the bottom one pushes out the rice)
  function drum(a) {
    const { x, y0, y1, z, r } = DRUM;
    let s = `<path d="${toD(hull([...ringY(y0, x, z, r), ...ringY(y1, x, z, r)]))}" style="fill:#aab3bf;${ST}"/><path d="${toD(ringY(y1, x, z, r))}" style="fill:#c9d0da;${ST}"/>`;
    for (let i = 0; i < 4; i++) { const t = a + i * Math.PI / 2, [px, py] = q(x + r * .62 * Math.cos(t), y1 + .05, z + r * .62 * Math.sin(t)); s += `<ellipse cx="${px}" cy="${py}" rx="1.3" ry=".9" fill="#2a2f38"/>`; }
    const [cx, cy] = q(x, y1 + .1, z); return s + `<circle cx="${cx}" cy="${cy}" r=".9" fill="#5a6270"/>`;
  }
  // the turret at rotation rot: five cassettes round it, each a clear tube with its slices stacked inside (n of them)
  function turret(rot, cas) {
    const { x, y, z, r, h } = TUR;
    const pos = cas.map((c, k) => { const t = rot + k * Math.PI * 2 / 5; return { k, c, x: x + r * Math.cos(t), y: y + r * Math.sin(t) }; }).sort((m, n) => m.y - n.y || n.x - m.x);
    let s = cyl(x, y, z + h, z + h + 2, r + 2.4, r + 2.4, '#3a4250') + cyl(x, y, z - 1.4, z, r + 2.4, r + 2.4, '#3a4250') + cyl(x, y, z, z + h, 1.2, 1.2, '#8a93a4', 8);
    pos.forEach(({ c, x: cx, y: cy }) => {
      const n = Math.min(8, c.n), col = TOPC[c.g] || '#ff8a4a';
      s += `<g style="--sc:${col}">` + Array.from({ length: n }, (_, i) => box(cx - 1.4, cy - 1.4, z + .4 + i * 1.6, 2.8, 2.8, 1.1, 0, 'su-slice')).join('') + `</g>` + box(cx - 1.7, cy - 1.7, z, 3.4, 3.4, h, 0, 'su-cas');
    });
    return s;
  }
  // the pusher under the front cassette (e: 0 home, 1 out over the plate)
  const pusher = e => { const yy = TUR.y + TUR.r + 1.6 + e * 2.4; return box(TUR.x - 1.8, yy, DECK.z + 1.2, 3.6, 1.6, 1.6, 0, 'su-steel') + post(TUR.x, yy + 2, DECK.z + 2.8, 6, 'su-steel'); };
  // the reader arch's stamp (e: 0 up, 1 down on the plate)
  const stamp = e => post(LABEL, LOOP.y1, LOOP.z + 10 - 6 * e, 6, 'su-steel') + box(LABEL - 1.4, LOOP.y1 - 1.4, LOOP.z + 9 - 6 * e, 2.8, 2.8, 1.2, 0, 'su-stamp');
  // the diverter at the exit (e: 0 parked inside the loop, 1 swung across the front run)
  const paddle = e => { const a = -Math.PI / 2 + e * Math.PI / 2.2, px = EXIT - 2, py = LOOP.y1 - 6; return seg([px, py, LOOP.z + 2], [px + 7 * Math.cos(a + Math.PI / 2), py + 7 * Math.sin(a + Math.PI / 2), LOOP.z + 2], '#c9d0da', 2.2) + box(px - 1, py - 1, LOOP.z, 2, 2, 3, 0, 'su-steel'); };
  // the torch's flame (on: seared now)
  const flame = (on, k = 0) => { if (!on) return '';
    const [a, b] = q(STN.burn, DECK.y, DECK.z + 8.6).map(Number), [ga, gb] = q(STN.burn, DECK.y, DECK.z + 1.4), h = 7.6 + k * 1.4, w = 2.9 - k * .5, h2 = h * .62, w2 = w * .5;
    return `<ellipse cx="${ga}" cy="${gb}" rx="7.4" ry="3.7" fill="rgba(255,150,60,.32)"/><ellipse cx="${ga}" cy="${gb}" rx="3.4" ry="1.7" fill="rgba(255,210,120,.45)"/>`
      + `<path d="M${f(a - w)} ${f(b)}q${f(w)} ${f(h)} ${f(w)} ${f(h + .6)}q0-.6 ${f(w)}-${f(h + .6)}q-${f(w)} 1.6-${f(w * 2)} 0z" fill="#ff9a3a" opacity=".9"/>`
      + `<path d="M${f(a - w2)} ${f(b)}q${f(w2)} ${f(h2)} ${f(w2)} ${f(h2 + .4)}q0-.4 ${f(w2)}-${f(h2 + .4)}q-${f(w2)} 1-${f(w2 * 2)} 0z" fill="#7ac8ff"/>`; };

  /* ---------- the three upgrade kits: each a station of its own, big enough to see through the door ---------- */
  // 炙りバーナー: a gantry over the deck with the torch hanging from it, a steel heat shield behind, a cassette gas can
  // (the kind kitchen torches run on) on a bracket behind the deck, its hose to the torch. A blue pilot light at the nozzle
  const GAS = { x: 51.5, y: CY - 8.6, z0: DECK.z, z1: DECK.z + 13, r: 2.8 };
  const gasKit = () => box(GAS.x - 3.6, GAS.y - 3.6, GAS.z0 - 1.2, 7.2, 7.2, 1.2, 0, 'su-steel')
    + cyl(GAS.x, GAS.y, GAS.z0, GAS.z1, GAS.r, GAS.r, '#f08a24', 16) + cyl(GAS.x, GAS.y, GAS.z0 + 4, GAS.z0 + 8.4, GAS.r + .05, GAS.r + .05, '#fff4dc', 16)
    + cyl(GAS.x, GAS.y, GAS.z1, GAS.z1 + 1.4, GAS.r, 1.2, '#c9d0da', 16) + cyl(GAS.x, GAS.y, GAS.z1 + 1.4, GAS.z1 + 3, .7, .7, '#d8a84a', 8)
    + `<g transform="${FRONT(GAS.x - 2.4, GAS.y + GAS.r + .1, GAS.z0 + 7.8)}"><text x="2.4" y="2.2" font-size="2.1" text-anchor="middle" fill="#c0392b" class="sign">ガス</text></g>`
    + `<path class="su-hose" d="${path([[GAS.x, GAS.y, GAS.z1 + 3], [GAS.x - 1.6, GAS.y + 1, GAS.z1 + 7], [STN.burn + 4, CY - 6.2, DECK.z + 22]])}"/>`;
  function burnerKit() {
    const x = STN.burn, y = CY - 5.6, z = DECK.z;
    return gasKit() + `<g transform="${FRONT(x - 6, y - 1.05, z + 20)}"><rect width="12" height="19.6" fill="#7a8494" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="6" cy="13.4" rx="4.4" ry="3.4" fill="#3a2410" opacity=".5"/><ellipse cx="6" cy="14" rx="2.2" ry="1.6" fill="#2a1808" opacity=".5"/></g>`
      + post(x - 5, y, z, 22, 'su-steel') + post(x + 5, y, z, 22, 'su-steel') + box(x - 6.4, y - 1, z + 21, 12.8, 2, 2.6, 0, 'su-steel')
      + `<g transform="${FRONT(x - 6.4, y + 1.05, z + 23.6)}"><rect width="12.8" height="2.6" fill="#e8661a"/><text x="6.4" y="2.05" font-size="2" text-anchor="middle" fill="#fff" class="sign">炙り</text></g>`
      + box(x - 1.7, y - .8, z + 17.6, 3.4, CY - y + 1.6, 3.4, 0, 'su-torch') + cyl(x, CY, z + 9.2, z + 17.6, .9, 1.7, '#d8a84a', 10) + disc(x, CY, z + 9, .6, '#5ab4ff', 8, 'stroke:none');
  }
  const burnerGhost = () => CORE.edges(STN.burn - 6.4, CY - 6.6, DECK.z, 12.8, 2, 23.6, 'ugh') + CORE.edges(GAS.x - GAS.r, GAS.y - GAS.r, GAS.z0, GAS.r * 2, GAS.r * 2, GAS.z1 + 6 - GAS.z0, 'ugh');
  // 防干燥罩: a clear magazine of domes over the plate stop at the end of the deck (on the lift's rails, carried up);
  // each plate that stops under it gets the bottom dome, by gravity
  const DROP = { x: STN.lift, y: CY, z0: DECK.z + 11, z1: DECK.z + 30, r: 4.2 };
  function domeKit() {
    const { x, y, z0, z1, r } = DROP;
    let s = post(x - 4.6, y - 4.6, DECK.z + 10, z1 - DECK.z - 8, 'su-steel') + post(x + 4.6, y - 4.6, DECK.z + 10, z1 - DECK.z - 8, 'su-steel') + box(x - 5.4, y - 5.4, z1 + 1.6, 10.8, 1.6, 1.6, 0, 'su-steel');
    for (let i = 0; i < 6; i++) s += dome(x, y, z0 + .6 + i * 3, 3.6);
    s += `<path class="su-tube" d="${toD(hull([...ringZ(z0, r, 16, 0, Math.PI * 2, x, y), ...ringZ(z1, r, 16, 0, Math.PI * 2, x, y)]))}"/>`
      + cyl(x, y, z1, z1 + 2, r + .6, r + .6, '#8a93a4', 16) + cyl(x, y, z0 - 1.2, z0, r + .4, r + .4, '#8a93a4', 16) + disc(x, y, z1 + 2.05, .8, '#3fd4ff', 8, 'stroke:none')
      + `<g transform="${FRONT(x - 3.4, y + r + .7, z1 - 2)}"><rect width="6.8" height="2.8" rx=".5" fill="#fff4dc"/><text x="3.4" y="2.05" font-size="1.8" text-anchor="middle" fill="#2a6ad9" class="sign">鮮度</text></g>`;
    return s;
  }
  const domeGhost = () => CORE.edges(DROP.x - DROP.r, DROP.y - DROP.r, DROP.z0 - 1.2, DROP.r * 2, DROP.r * 2, DROP.z1 - DROP.z0 + 3.2, 'ugh');
  // 特急レーン: a straight rail from the plate stop down to the take-out window and a shuttle that rides it — white with a
  // blue band and a bullet nose, like the express trains real conveyor shops use. Its sign lights while it runs
  const shuttle = (x, y, z) => { const d = 4.2, w = 4.6, nose = (z0, z1, c) => `<path d="${toD(hull([...ringZ(z0, w, 10, 0, Math.PI, x, y + d), ...ringZ(z1, w, 10, 0, Math.PI, x, y + d)]))}" style="fill:${c};${ST}"/>`;
    return box(x - w, y - d, z - 2, w * 2, d * 2, 1, 0, 'su-shutb') + box(x - w, y - d, z - 1, w * 2, d * 2, 1, 0, 'su-shut') + nose(z - 2, z - 1, '#2a6ad9') + nose(z - 1, z, '#f4f2ec'); };
  function expressKit() {
    const [t, b] = EXPRESS, at = u => [t[0] + (b[0] - t[0]) * u, t[1] + (b[1] - t[1]) * u, t[2] + (b[2] - t[2]) * u];
    let s = `<path d="${toD([P(t[0] - 4, t[1] - 1, t[2] + 9), P(t[0] + 4, t[1] - 1, t[2] + 9), P(b[0] + 4, b[1] - 1, b[2]), P(b[0] - 4, b[1] - 1, b[2])])}" fill="#20252c" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
    for (let i = 1; i < 8; i++) { const [x, y, z] = at(i / 8); s += seg([x - 4, y - .6, z], [x + 4, y - .6, z], i % 2 ? '#ffd23f' : '#1a1d22', 1.1, 'butt'); }
    s += [-5.2, 5.2].map(dx => seg([t[0] + dx, t[1], t[2] + 9], [b[0] + dx, b[1], b[2]], '#c9d0da', 1.5)).join('')
      + box(t[0] - 6.6, t[1] - 1.6, t[2] + 9, 13.2, 3.2, 5.2, 0, 'su-expsign');
    return s;
  }
  const expressSign = () => { const [t] = EXPRESS; return `<g transform="${FRONT(t[0] - 6.6, t[1] + 1.65, t[2] + 14.2)}"><rect width="13.2" height="5.2" fill="#2a1410"/><text class="lit-text su-exp" style="--lc:#ffd23f" x="6.6" y="3.9" font-size="3.4" text-anchor="middle">特急</text></g>`; };

  /* ---------- the inside. lv: fitted parts { dome, express, burner } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right;
    const defs = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the chiller with its fan, the rice warmer and the pipe up to the hopper, spare plates in their colours
    s += box(4, 22, 6, 32, 38, 40, 0, 'su-chill') + `<g transform="${FRONT(4, 60.05, 44)}"><circle cx="16" cy="18" r="12" class="su-fan"/>${[0, 45, 90, 135].map(a => `<path d="M16 18l${f(10 * Math.cos(a * Math.PI / 180))} ${f(10 * Math.sin(a * Math.PI / 180))}" stroke="#4a525e" stroke-width="1.6"/>`).join('')}<text class="label sign" x="16" y="36" font-size="3" text-anchor="middle">冷蔵</text></g>`;
    s += cyl(50, 46, 6, 34, 9, 9, '#e8e4dc') + cyl(50, 46, 34, 37, 9.4, 9.4, '#c9c3b6') + `<g transform="${FRONT(44, 55.05, 26)}"><rect width="12" height="6" rx="1" fill="#2a2f3a"/><text x="6" y="4.4" font-size="3" text-anchor="middle" fill="#ffb347" class="label">保温</text></g>`;
    s += `<path class="chute" d="${path([[50, 46, 37], [50, 46, 64], [HOP.x, HOP.y - 6, 70], [HOP.x, HOP.y - 6, HOP.z0]])}" style="stroke-width:2.6;stroke:#8a93a4"/>`;
    [[70, 34], [80, 34], [70, 46], [80, 46], [75, 40]].forEach(([x, y], i) => { const c = PLATE[i + 1]; for (let j = 0; j < 5; j++) s += disc(x, y, 6 + j * 1.6, 4, c[1], 12) + disc(x, y, 6.6 + j * 1.6, 3.2, c[0], 12, 'stroke:none'); });
    s += box(2, 30, 58, 90, 52, 3, 0, 'su-floor');
    // the deck's legs stand behind the loop, so they go first
    s += post(DECK.x0 + 2, CY - 10, 61, DECK.z - 63) + post(DECK.x1 - 2, CY - 10, 61, DECK.z - 63);
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the loop: its legs, the skirt, the chain's band, the steel island inside it
    let L = [LOOP.x0 + 4, (LOOP.x0 + LOOP.x1) / 2, LOOP.x1 - 4].map(x => post(x, CY, 61, LOOP.z - 67)).join('');
    L += `<path class="su-skirt" d="${toD(hull([...oval(R + 3.2, LOOP.z - 6), ...oval(R + 3.2, LOOP.z)]))}"/><path class="su-band" d="${toD(oval(R + 3.2, LOOP.z))}"/><path class="su-island" d="${toD(oval(R - 3.2, LOOP.z + .05))}"/>`;
    g.insertAdjacentHTML('beforeend', L);
    // its length is summed from its points (v0.44): asking the path for it (getTotalLength) right after the machine came
    // into view laid out the whole page there and then, 397 ms on the iOS simulator
    const ring = oval(R, LOOP.z + .1, 24), chain = UTIL.el('path', { class: 'su-chain', d: toD(ring) }, g);
    chain._len = ring.reduce((L, p, i) => { const q = ring[(i + 1) % ring.length]; return L + Math.hypot(q[0] - p[0], q[1] - p[1]); }, 0);
    const rearG = UTIL.g(g, '', { class: 'su-rear' });
    // the reader arch's back post and the diverter, between the runs
    g.insertAdjacentHTML('beforeend', post(LABEL - 5, LOOP.y1 - 4, LOOP.z, 13, 'su-steel'));
    const paddleG = UTIL.g(g, paddle(0), { class: 'su-paddle' });
    const frontG = UTIL.g(g, '', { class: 'su-front' });
    // in front of the front run: the arch (an antenna on its bar, the stamp hanging under it), the exit chute
    g.insertAdjacentHTML('beforeend', post(LABEL + 5, LOOP.y1 + 4, LOOP.z, 13, 'su-steel') + box(LABEL - 6, LOOP.y1 - 4.6, LOOP.z + 12.4, 12, 9.2, 1.6, 0, 'su-steel')
      + `<g transform="${FRONT(LABEL - 6, LOOP.y1 + 4.65, LOOP.z + 14)}"><rect width="12" height="1.6" fill="#2a2f38"/><circle class="su-rfid" cx="10.6" cy=".8" r=".5"/><text x="5" y="1.3" font-size="1.2" fill="#8a93a4" class="label">RFID</text></g>`);
    const stampG = UTIL.g(g, stamp(0), { class: 'su-stampg' });
    g.insertAdjacentHTML('beforeend', `<path class="chute" d="${path(CHUTE)}" style="stroke-width:6;stroke:#2a3038"/>` + box(EXIT - 2, 79, 40, 10, 6, 2));
    // the deck above: its belt, the plate magazine, the hopper and the drum, the turret, (the torch), the lift
    let k = box(DECK.x0, DECK.y - 5, DECK.z - 4, DECK.x1 - DECK.x0, 10, 4, 0, 'su-deck') + [DECK.x0 + 1, DECK.x1 - 1].map(x => { const [a, b] = q(x, DECK.y + 5.1, DECK.z - 2); return `<circle cx="${a}" cy="${b}" r="1.6" fill="#c9d0da" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`; }).join('');
    k += post(STN.mag - 5, DECK.y + 5, DECK.z, 22) + post(STN.mag + 5, DECK.y + 5, DECK.z, 22) + post(STN.mag - 5, DECK.y - 5, DECK.z, 22) + post(STN.mag + 5, DECK.y - 5, DECK.z, 22) + box(STN.mag - 6, DECK.y - 6, DECK.z + 22, 12, 12, 1.4, 0, 'su-steel');
    k += box(HOP.x - 6, HOP.y - 6, HOP.z0, 12, 12, HOP.z1 - HOP.z0, 0, 'su-hopper') + `<g transform="${FRONT(HOP.x - 6, HOP.y + 6.05, HOP.z1 + 3)}"><text class="label sign" x="6" y="2.4" font-size="2.6" text-anchor="middle">シャリ</text></g>`;
    g.insertAdjacentHTML('beforeend', k);
    const deckStripes = UTIL.el('path', { class: 'su-stripes', d: path([[DECK.x0 + 1, DECK.y + 5.05, DECK.z - 2], [DECK.x1 - 1, DECK.y + 5.05, DECK.z - 2]]) }, g);
    const magG = UTIL.g(g, '', { class: 'su-mag' });
    const riceG = UTIL.g(g, '', { class: 'su-rice' });
    const drumG = UTIL.g(g, drum(0), { class: 'su-drum' });
    const turretG = UTIL.g(g, '', { class: 'su-turret' });
    const pusherG = UTIL.g(g, pusher(0), { class: 'su-pusher' });
    g.insertAdjacentHTML('beforeend', lv.burner ? `<g data-part="burner">${burnerKit()}</g>` : `<g class="ugh-g">${burnerGhost()}</g>`);
    const flameG = UTIL.g(g, '', { class: 'su-flameg' });
    // the lift: two rails from the loop up past the deck, its platform drawn by the machine
    g.insertAdjacentHTML('beforeend', post(STN.lift - 4.6, DECK.y - 4.6, LOOP.z, DECK.z - LOOP.z + 10, 'su-steel') + post(STN.lift + 4.6, DECK.y - 4.6, LOOP.z, DECK.z - LOOP.z + 10, 'su-steel'));
    const liftG = UTIL.g(g, '', { class: 'su-lift' });
    g.insertAdjacentHTML('beforeend', lv.express ? `<g data-part="express">${expressKit()}${expressSign()}</g>`
      : `<g class="ugh-g">${[-5.2, 5.2].map(dx => `<path class="ugh" d="${path(EXPRESS.map(([x, y, z], i) => [x + dx, y, z + (i ? 0 : 9)]))}"/>`).join('')}</g>`);
    const expSign = lv.express ? g.querySelector('.su-exp') : null;
    const shuttleG = UTIL.g(g, lv.express ? shuttle(...EXPRESS[0]) : '', { class: 'su-shuttle' });
    g.insertAdjacentHTML('beforeend', lv.dome ? `<g data-part="dome">${domeKit()}</g>` : `<g class="ugh-g">${domeGhost()}</g>`);
    const deckG = UTIL.g(g, '', { class: 'su-deckplate' });
    const movers = UTIL.g(g, '', { class: 'su-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.dome ? '' : pin('dome', 30, LOOP.y1 + 2, LOOP.z + 8)) + (lv.express ? '' : pin('express', EXPRESS[1][0], 80, 70)) + (lv.burner ? '' : pin('burner', STN.burn + 2, DECK.y + 5, DECK.z + 5)));
    return { defs, chain, rearG, frontG, paddleG, stampG, deckStripes, magG, riceG, drumG, turretG, pusherG, flameG, liftG, deckG, movers, cm, shuttleG, expSign };
  }

  /* ---------- the shell and door: the noren, the touch menu, the plate board, the counter window, the take-out window.
     (user, 2026-10-17: most real machines hide their works, and that is what X-ray is for. The door shows one strip at the
     height of the loop's front run — plates going by, the arch stamping, the paddle taking one off; the deck, the turret
     and the express lane are for X-ray) ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, rc = '#e8453a', nv = '#1e2a3a';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const ln = `stroke="rgba(232,69,58,.5)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${rc}" filter="url(#soft)"/>
      <ellipse cx="42" cy="62" rx="26" ry="10" fill="rgba(232,69,58,.06)" ${ln}/><path d="M24 60q0-6 18-6t18 6" fill="none" ${ln}/><path d="M28 58q4-6 14-6t14 6" fill="none" ${ln}/>
      ${['回', '転', '寿', '司'].map((ch, i) => `<text class="sign" x="42" y="${110 + i * 24}" font-size="20" text-anchor="middle" fill="rgba(232,69,58,.12)" stroke="rgba(232,69,58,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(232,69,58,.1)" stroke="${rc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${rc}">一皿 ¥100〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${rc}" filter="url(#soft)"/><g class="iso-only">
      ${[[26, 84], [44, 92], [62, 84]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4" fill="none" ${ln}/><path d="M${x - 4} ${y - 1}q4-3 8 0" fill="none" ${ln}/>`).join('')}<path d="M14 100h56" ${ln}/>
      <text class="sign" x="42" y="150" font-size="14" text-anchor="middle" fill="rgba(232,69,58,.14)" stroke="rgba(232,69,58,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">まわる</text>
      <text class="label" x="42" y="166" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(232,69,58,.6)">KAITEN SUSHI · 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 17.4, y = 24, fs = Math.min(2.6, 15 / (p.jp || p.name).length);
      return R3(x, y, 16.6, 30, 1, `<rect class="su-tglow nohit" x="${x}" y="${y}" width="16.6" height="30" rx="2" fill="${rc}" opacity="0"/><g transform="translate(${x + 1.3} ${y + 2}) scale(.58)">${icon(p.g, p.tier)}</g>
        <text x="${x + 8.3}" y="${y + 20}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 8.3}" y="${y + 25.4}" font-size="2.6" text-anchor="middle" class="label su-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 5}" y="${y + 27.4}" width="6.6" height="1.1" rx=".5"/><text class="soldout" x="${x + 8.3}" y="${y + 12}" font-size="3.6" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit su-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the door's grid: the left column (x 6–52) holds the plate board top to bottom; the right column (58–92) the crest,
    // the window and the lamps. The window frames the right-hand turn of the loop (u 60–90, v 118–148)
    const board = `<rect x="6" y="62" width="46" height="106" rx="2" class="su-board"/><text class="su-boardt" x="29" y="71" font-size="4.2" text-anchor="middle">お皿の色で</text><text class="su-boardt" x="29" y="77" font-size="4.2" text-anchor="middle">お値段</text>`
      + [1, 2, 3, 4, 5].map(t => { const cy = 89 + (t - 1) * 15, [fc, rc] = PLATE[t];
        return `<ellipse cx="18" cy="${cy}" rx="7" ry="3.3" fill="${rc}" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="18" cy="${cy - .4}" rx="5.6" ry="2.5" fill="${fc}"/>`
          + (t === 5 ? `<ellipse cx="18" cy="${cy}" rx="7" ry="3.3" fill="none" stroke="#ffd23f" stroke-width=".7"/>` : '')
          + `<text x="38.5" y="${cy + 1.1}" font-size="${t > 3 ? 2.5 : 3.1}" text-anchor="middle" fill="#ffd23f" class="label">${'★'.repeat(t)}</text>`; }).join('')
      + `<path d="M10 157h38" stroke="rgba(255,210,122,.35)" stroke-width=".6" stroke-dasharray="2 2" vector-effect="non-scaling-stroke"/><text class="su-boardt" x="29" y="163.4" font-size="2.8" text-anchor="middle">まわるお皿は 右の窓 →</text>`
      + `<circle cx="75" cy="88" r="15" fill="#c83a2a" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="75" cy="88" r="12.2" fill="none" stroke="#fff4dc" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="su-noren" x="75" y="93.4" font-size="15" text-anchor="middle">寿</text>`
      + R3(58, 154, 34, 10, .8, `<text class="lit-text on" style="--lc:#3fd47a" x="${lv.express ? 67 : 75}" y="160.6" font-size="3" text-anchor="middle">回転中</text>` + (lv.express ? `<text class="lit-text su-explamp" style="--lc:#ffd23f" x="84" y="160.6" font-size="3" text-anchor="middle">特急</text>` : ''), { r: 1.5, capCls: 'readycap' });
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM58 116V150H92V116Z" fill-rule="evenodd"/>
      ${[4, 42, 80].map(x => `<path d="M${x} 3h36v15q-9 2-18 0t-18 0z" fill="${rc}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('')}
      <text class="su-noren" x="22" y="13.6" font-size="7" text-anchor="middle">回転</text><text class="su-noren" x="60" y="13.6" font-size="7" text-anchor="middle">寿司</text><text class="su-noren" x="98" y="13" font-size="5.6" text-anchor="middle">すし丸</text>
      <rect x="5" y="22" width="88" height="34" rx="2" class="su-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#ffd27a">TOUCH · タッチで注文</text>
      ${board}${SK(58, 116, 34, 34, 3, { hole: true })}
      <rect class="dglass nohit" x="58" y="116" width="34" height="34"/><path class="nohit" d="M64 116L71 116L65 150H58Z" fill="#fff" opacity=".05"/><path class="nohit" d="M80 116L83 116L77 150H74Z" fill="#fff" opacity=".04"/>
      ${lv.dome ? `<g class="nohit" transform="translate(9 146) rotate(-4)"><rect width="16" height="6" rx="1" fill="#fff4dc" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><text x="8" y="4.3" font-size="2.8" text-anchor="middle" class="sign" fill="#2a6ad9">鮮度管理</text></g>` : ''}
      ${lv.burner ? `<g class="nohit" transform="translate(87 103) rotate(8)"><circle r="7.2" fill="#ff7a1a" stroke="#fff4dc" stroke-width="1" vector-effect="non-scaling-stroke"/><path d="M0-5.6q2.8 2.4 1.6 4.6q-.4-1.2-1.4-1.6q.4 1.6-1 2.6q-1-1.2-.2-3q-1.6 1-1.2 2.8q-1.4-2.6 2.2-5.4z" fill="#ffe14a"/><text y="3.5" font-size="3.4" text-anchor="middle" class="sign" fill="#fff">炙り</text><text y="5.7" font-size="1.4" text-anchor="middle" class="label" fill="#fff4dc">はじめました</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="su-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 60, 20, 14, .8, `<text class="label" x="105" y="64.6" font-size="2.2" text-anchor="middle">レーン</text><text class="su-count" x="105" y="70.8" font-size="4" text-anchor="middle">0皿</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${R3(95, 91, 20, 8, .8, `<text class="lit-text su-halflamp" style="--lc:#ffd23f" x="105" y="96.4" font-size="3" text-anchor="middle">半額あり</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="su-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text su-ready" style="--lc:${rc}" x="60" y="190.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${nv}" opacity=".92"/><text class="su-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="su-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM58 116V150H92V116Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="58" y="116" width="34" height="34"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'su-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'su-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.su-tile')], slotGlow: door.querySelector('.su-slotglow'),
      lcd: door.querySelector('.su-lcd'), count: door.querySelector('.su-count'), halfLamp: door.querySelector('.su-halflamp'), ready: door.querySelector('.su-ready'), flap: door.querySelector('.su-flap'), windowG,
      expLamp: door.querySelector('.su-explamp') };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><rect class="xline" x="58" y="116" width="34" height="34"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, plate, icon, hopperFill, drum, turret, pusher, stamp, paddle, flame, dome, shuttle, DROP, PIECE };
})();
