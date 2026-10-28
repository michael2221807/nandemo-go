/* Fig 14 · かき氷「ふわゆき」— geometry. Made up, built like a plant (one station per step, no robot arm; the door hides the
   works and frames one moment; 2026-10-17).
   A block of ice stands on a round blade plate under a spiked presser; the presser turns the block over the blade and the
   snow falls through the slot into the cup below. The cup rides a scissor lift on a carriage along a rail: it takes a cup
   from the magazine, rises under the blade, and turns and sinks as the snow piles up into a dome; then the carriage runs
   to the syrup head — four bottles upside down whose lines meet in one nozzle, like a soda fountain's — where one valve
   opens; at the end of the rail, the last stop: the milk pump (upgrade) beside the outlet, then a drum of four topping
   cells turns the right one over the cup (azuki through a flap, kinako shaken through a sieve, the fruit pressed on in a
   bear's face by a plunger, gold leaf); then the lift goes down and the cup slides to the take-out window.
   (The rail stops at x 78: right of that the coin column's glass tubes stand in front of everything in the X-ray.) The carriage goes back for the next cup and waits with it under the blade.
   The flaw: the block shaves down (ten cups to a block); when it is gone nothing sells until a new block goes on the
   plate. The block loader (upgrade) beside the shaver keeps two spare blocks and pushes the next one in by itself.
   The door frames the shaving column only: the presser, the block, the blade, the snow, the cup. Where a world point
   shows on the door (the default view): u = x − y + 84, v = 156 + y − z. */
const KG = (() => {
  const W = 120, D = 84, H = 240;
  const LANE = { y: 62, z: 78 };                                   // the rail along x at depth y; the carriage's deck at z
  const STN = { mag: 9, shave: 30, syrup: 64, exit: 78 };
  const BLADE = { x: 30, y: 62, z: 129, r: 6.6 };                  // the blade plate: its underside at z, its top at z + 2
  const ICE = { s: 8, h: 14, z: 131 };                             // a full block: side, height; it stands at z
  const CUP = { r0: 3.4, r1: 4.8, h: 9, dome: 8.6 };
  // the lift (the cup's foot) at each stop: along the rail; under the blade, rising to start and sinking while the dome
  // grows (the plate hides 6.6 under it on screen: the dome's top stays 6 lower, so the snow shows falling); the exit
  const ZP = { travel: 96, start: 105, end: 99, exit: 84 };
  const SYR = { x: STN.syrup, y: LANE.y, z: 121 };                 // the syrup nozzle's tip
  const MAG = { x: STN.mag, y: LANE.y, z: 106 };                   // the cup magazine's mouth
  const LOADER = { x: 58, y: LANE.y };                             // the block loader (upgrade): its blocks level with the plate
  // the topping drum over the last stop: its outlet over the cup at (x, y), its hub front-left of it (so on screen it
  // stays clear of the coin tubes); four cells round the hub (cell k at drum angle a + k·90°; the one at OUT over the
  // outlet); its floor at z (5.4 over the dome's top)
  const OUT = -Math.PI / 4, TOPS = { x: STN.exit, y: LANE.y, z: 122, r: 5, hx: STN.exit - 5 * Math.cos(OUT), hy: LANE.y - 5 * Math.sin(OUT), out: OUT, cells: ['azuki', 'kinako', 'bear', 'gold'] };
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): the syrup's colour, the topping, the milk
  const MENU = [
    { name: 'いちご', price: 230, g: 'ichigo', syrup: '#e83a4a', top: null, tier: 1 }, { name: 'メロン', price: 230, g: 'melon', syrup: '#5ac83a', top: null, tier: 1 },
    { name: 'レモン', price: 230, g: 'lemon', syrup: '#ffe04a', top: null, tier: 1 }, { name: 'ブルーハワイ', price: 240, g: 'bluehawaii', syrup: '#3a8aff', top: null, tier: 1 },
  ];
  return { W, D, H, LANE, STN, BLADE, ICE, CUP, ZP, SYR, MAG, LOADER, TOPS, WINDOW, MENU, SLOTW: [105, D, 196] };
})();

const KGB = (() => {
  const { FRONT, TOP: TOPP, box, rect, path, P, f } = ISO;
  const { W, D, H, LANE, STN, BLADE, ICE, CUP, ZP, SYR, MAG, LOADER, TOPS } = KG;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ring = (x, y, z, r, n = 14) => ringZ(z, r, n, 0, Math.PI * 2, x, y);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14) => `<path d="${toD(hull([...ring(x, y, z0, r0, n), ...ring(x, y, z1, r1, n)]))}" style="fill:${fill};${ST}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ring(x, y, z, r, n))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  // which way the camera looks (for the block's faces)
  let VIEW = [1, 1, 1];
  function setView() { const a = P(1, 0, 0), b = P(0, 1, 0), c = P(0, 0, 1), r1 = [a[0], b[0], c[0]], r2 = [a[1], b[1], c[1]];
    let d = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]]; if (d[2] < 0) d = d.map(v => -v); VIEW = d; }

  /* ---------- the block of ice (level: 0..1 of a full block; turned by a) and the presser on it ---------- */
  function block(x, y, z, level, a = 0) {
    if (level <= .01) return '';
    const h = ICE.h * level, s = ICE.s / 2, c = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [x + (u * Math.cos(a) - v * Math.sin(a)) * s, y + (u * Math.sin(a) + v * Math.cos(a)) * s]);
    // the four sides, the far ones first (the ice is clear: the far sides show through), then the top
    const sides = c.map((p, i) => { const n = c[(i + 1) % 4], mx = (p[0] + n[0]) / 2 - x, my = (p[1] + n[1]) / 2 - y;
      return { d: toD([P(p[0], p[1], z), P(n[0], n[1], z), P(n[0], n[1], z + h), P(p[0], p[1], z + h)]), front: mx * VIEW[0] + my * VIEW[1] > 0, k: mx * VIEW[0] + my * VIEW[1] }; });
    sides.sort((m, n) => m.k - n.k);
    return sides.map(o => `<path d="${o.d}" class="${o.front ? 'kg-ice' : 'kg-iceb'}"/>`).join('') + `<path d="${toD(c.map(([px, py]) => P(px, py, z + h)))}" class="kg-icetop"/>`
      + `<path d="M${q(c[0][0], c[0][1], z + h * .85).join(' ')}L${q(c[1][0], c[1][1], z + h * .35).join(' ')}" stroke="rgba(255,255,255,.55)" stroke-width=".5" fill="none"/>`;
  }
  // the presser: a spiked plate on the block's top, its rod up to the motor (turning with the block: a mark on its rim)
  function presser(level, a = 0) {
    const zt = ICE.z + ICE.h * Math.max(0, level) + .2, mx = BLADE.x + 3.6 * Math.cos(a), my = BLADE.y + 3.6 * Math.sin(a);
    return seg([BLADE.x, BLADE.y, zt + 1.2], [BLADE.x, BLADE.y, 168], '#c9d0da', 1.1) + disc(BLADE.x, BLADE.y, zt, 4.4, '#7a8394', 14) + disc(BLADE.x, BLADE.y, zt + 1.2, 4.4, '#aab3bf', 14)
      + disc(mx, my, zt + 1.25, .7, '#3a404c', 6, 'stroke:none');
  }
  // the snow falling from the slot, seen below the plate's front edge (the plate hides the first 6.6), to the dome's top
  function snow(k, z1) {
    const z0 = BLADE.z - BLADE.r + .6; if (z1 >= z0) return '';
    let s = '';
    for (let i = 0; i < 12; i++) { const t = (i * .37 + k * .23) % 1, x = BLADE.x + Math.sin(i * 2.1 + k * .9) * 1.6, y = BLADE.y + 1 + Math.cos(i * 1.7 + k * .7) * 1.3, [a, b] = q(x, y, z0 - (z0 - z1) * t);
      s += `<circle cx="${a}" cy="${b}" r="${(.35 + (i % 3) * .14).toFixed(2)}" fill="#fff"/>`; }
    return s;
  }

  /* ---------- the cup and its dome of snow ---------- */
  // a paper cup with its foot at (x, y, z); d: how far the dome has grown (0..1); o = { syrup, sy: syrup on, milk: milk on,
  // tps: the toppings on it so far }
  function cup(x, y, z, d = 0, o = {}) {
    const top = z + CUP.h, r = CUP.r1;
    // the print on the side facing the camera: a blue band near the foot, 氷 above it
    const av = Math.atan2(VIEW[1], VIEW[0]), rz = w => CUP.r0 + (r - CUP.r0) * w / CUP.h, [lx, ly] = q(x + rz(5.2) * Math.cos(av), y + rz(5.2) * Math.sin(av), z + 5.2);
    let s = `<path d="${toD(hull([...ring(x, y, z, CUP.r0), ...ring(x, y, top, r)]))}" style="fill:#fbfaf4;${ST}"/>`
      + `<path d="${toD([...ringZ(z + 1.2, rz(1.2) + .02, 12, av - 1.5, av + 1.5, x, y), ...ringZ(z + 2.6, rz(2.6) + .02, 12, av + 1.5, av - 1.5, x, y)])}" style="fill:#3a8aff;stroke:none"/>`
      + `<text x="${lx}" y="${f(+ly + 1.3)}" font-size="3.4" text-anchor="middle" fill="#e83a4a" class="sign">氷</text>`;
    if (d < .02) return s + `<path d="${toD(ring(x, y, top, r - .4))}" style="fill:#e8e4d8;stroke:none"/>`;
    const h = CUP.dome * d, rr = r + .4 * d;
    const domeD = (z0, k0, k1) => toD(hull([...ring(x, y, z0, rr * k0, 16), ...ring(x, y, z0 + (top + h - z0) * .5, rr * .8 * k1, 14), ...ring(x, y, top + h * .88, rr * .42 * k1, 10), ...ring(x, y, top + h, .6, 6)]));
    s += `<path d="${domeD(top - .2, 1, 1)}" class="kg-snow"/>`;
    if (o.sy) {
      s += `<path d="${domeD(top + h * .3, .92, .96)}" style="fill:${o.syrup};opacity:.86;stroke:none"/>`;
      [[-2.6, .3], [1.2, -.2], [3.2, .4]].forEach(([u, du]) => { const [a, b] = q(x + u, y + rr * .9, top + h * .34), [c, e] = q(x + u + du, y + rr, top + h * .06); s += `<path d="M${a} ${b}L${c} ${e}" stroke="${o.syrup}" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`; });
    }
    if (o.milk && o.sy) { const [a, b] = q(x - 3.2, y + 1, top + h * .62), [c, e] = q(x + 3.2, y + 1, top + h * .66), [m, n] = q(x, y + 1.6, top + h * 1.02); s += `<path d="M${a} ${b}Q${m} ${n} ${c} ${e}" stroke="#fffdf4" stroke-width="1.3" fill="none" stroke-linecap="round"/>`; }
    if (o.tps && o.tps.length) s += topping(x, y, top, h, o.tps);
    // a few crystals catching the light
    [[-1.6, 2, .5], [1.8, 1.4, .7], [.2, 3, .3]].forEach(([u, v, w]) => { const [a, b] = q(x + u, y + v, top + h * w); s += `<circle cx="${a}" cy="${b}" r=".35" fill="#fff"/>`; });
    return s;
  }
  // what the turret puts on, one cell at a time: azuki on the rim, kinako on top, a bear's face of fruit, gold leaf
  function topping(x, y, top, h, tps) {
    let s = '';
    tps.forEach(t => {
    if (t === 'azuki') [[-2.8, 2.4], [-.6, 3.6], [1.8, 3], [3.4, 1.2], [-3.6, .2]].forEach(([u, v]) => { const [a, b] = q(x + u, y + v, top + h * .25); s += `<ellipse cx="${a}" cy="${b}" rx="1" ry=".75" fill="#6a1a1a"/>`; });
    if (t === 'kinako') [[-1.4, -.4], [.6, .6], [1.8, -.8], [-.4, 1.6], [-2, .9], [1, 2]].forEach(([u, v]) => { const [a, b] = q(x + u, y + v, top + h * .8); s += `<circle cx="${a}" cy="${b}" r=".55" fill="#d8b878"/>`; });
    if (t === 'bear') { const pt = (u, v, w) => q(x + u, y + v, top + h * w), e1 = pt(-1.6, 1.6, .74), e2 = pt(1.6, 1.6, .74), n = pt(0, 3.2, .5);
      s += `<circle cx="${e1[0]}" cy="${e1[1]}" r=".75" fill="#3a1a1a"/><circle cx="${e2[0]}" cy="${e2[1]}" r=".75" fill="#3a1a1a"/><ellipse cx="${n[0]}" cy="${n[1]}" rx="1.1" ry=".8" fill="#3a1a1a"/>`
        + [[-3.4, .6, .5, '#ff8a2a'], [3.4, .6, .5, '#ff8a2a'], [0, -1.6, .9, '#e83a4a']].map(([u, v, w, c]) => { const [a, b] = pt(u, v, w); return `<circle cx="${a}" cy="${b}" r="1" fill="${c}"/>`; }).join(''); }
    if (t === 'gold') [[-1, -.6, .8], [1.2, .6, .7], [0, 1.6, .5]].forEach(([u, v, w]) => { const [a, b] = q(x + u, y + v, top + h * w); s += `<path d="M${a} ${f(+b - .8)}l.7.8-.7.8-.7-.8z" fill="#ffe680"/>`; });
    });
    return s;
  }
  // flat (24 × 24) for the menu tiles and the shop: the cup, the dome in its syrup, the topping
  function icon(syrup, top, milk) {
    const k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"';
    // (app build, goods polish: the cup's pleats, syrup running down the snow, a glint of ice, the spoon-straw)
    let s = `<path d="M6.6 13.6l1.6 8h7.6l1.6-8z" fill="#fbfaf4" ${k}/><path d="M8 14.4l.9 6.6M16 14.4l-.9 6.6" stroke="#d8d2c4" stroke-width=".5"/><path d="M7.4 17.2h9.2" stroke="#3a8aff" stroke-width="1.4"/><text x="12" y="21" font-size="3.4" text-anchor="middle" fill="#e83a4a" font-weight="700">氷</text>`
      + `<path d="M5 13.8q0-9.8 7-9.8t7 9.8z" fill="#fff" ${k}/><path d="M6.2 11q1-6.2 5.8-6.2t5.8 6.2q-2.9 1.3-5.8 1.3t-5.8-1.3zM7.2 11.4q.4 1.8.9 0zM10.4 12q.4 1.8.9 0zM15.2 11.6q.4 1.6.9 0z" fill="${syrup}" opacity=".92"/>`
      + `<path d="M8.6 7.6l.6.6M13.4 6.4l.5.5M15.4 8.8l.5.5M10.6 9.6l.4.4" stroke="#fff" stroke-width=".7" stroke-linecap="round" opacity=".85"/>`;
    if (top === 'azuki' || top === 'gold') s += `<circle cx="7.6" cy="12.8" r="1.2" fill="#6a1a1a"/><circle cx="11" cy="13.2" r="1.2" fill="#6a1a1a"/><circle cx="14.6" cy="13" r="1.2" fill="#6a1a1a"/>`;
    if (top === 'kinako') s += `<circle cx="10" cy="7" r=".8" fill="#d8b878"/><circle cx="13.4" cy="8" r=".8" fill="#d8b878"/><circle cx="12" cy="5.8" r=".8" fill="#d8b878"/>`;
    if (top === 'bear') s += `<circle cx="10" cy="8.2" r="1" fill="#3a1a1a"/><circle cx="14" cy="8.2" r="1" fill="#3a1a1a"/><ellipse cx="12" cy="10.6" rx="1.4" ry="1" fill="#3a1a1a"/><circle cx="7.6" cy="10.6" r="1.1" fill="#ff8a2a"/><circle cx="16.4" cy="10.6" r="1.1" fill="#ff8a2a"/><circle cx="12" cy="6" r="1.1" fill="#e83a4a"/>`;
    if (top === 'gold') s += `<path d="M12 5l1 1.2-1 1.2-1-1.2zM9 8.4l.7.8-.7.8-.7-.8z" fill="#ffe680"/>`;
    if (milk) s += `<path d="M7.6 9.4q4.4-3.6 8.8 0" stroke="#fffdf4" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    return s + `<path d="M15.8 8.6l3.4-5.4" stroke="#ff5fa2" stroke-width="1.1" stroke-linecap="round"/>`;
  }
  // the crate: a syrup bottle (in its colour), a block of ice
  function defs() {
    const pouch = `<g id="g-kg-syrup"><path d="M-2.2 0v-6.4q0-1.4 1.4-1.8v-1.8h1.6v1.8q1.4.4 1.4 1.8v6.4z" style="fill:var(--c)" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-1.6" y="-5.4" width="3.2" height="2.4" rx=".4" fill="#fff8ec"/></g>`;
    const ice = `<g id="g-kg-ice">${box(-6, -6, 0, 12, 12, 10, 0, 'kg-iceb2')}<g transform="${TOPP(-6, -6, 10.03)}"><path d="M2 3l4 1.4M7 8l3-2" stroke="#fff" stroke-width=".8" opacity=".7"/></g></g>`;
    return pouch + ice;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the carriage on the rail, its scissor lift, the cup on it (drawn at x = 0; the machine moves it) ---------- */
  // zp: the platform's top; turn: the turntable's angle (its three bolts show it turning); c: the cup ({ d, ...o }) or null
  function carriage(zp, turn = 0, c = null) {
    const y = LANE.y, z0 = LANE.z;
    let s = box(-5, y - 5, z0 - 2.6, 10, 10, 2.6, 0, 'kg-steel');
    [y - 3.6, y + 3.6].forEach((yy, i) => { s += seg([-3.6, yy, z0], [3.6, yy, zp - 1.6], i ? '#aab3bf' : '#6a7384', .9) + seg([3.6, yy, z0], [-3.6, yy, zp - 1.6], i ? '#8a93a4' : '#5a6374', .9); });
    s += cyl(0, y, zp - 1.4, zp, 5.4, 5.4, '#c9d0da', 16);
    [0, 1, 2].forEach(i => { const a = turn + i * Math.PI * 2 / 3; s += disc(4.4 * Math.cos(a), y + 4.4 * Math.sin(a), zp + .05, .5, '#5a6374', 6, 'stroke:none'); });
    if (c) s += cup(0, y, zp, c.d, c);
    return s;
  }

  /* ---------- the three upgrade kits ---------- */
  // 自動ブロック補給: a frosted column of two spare blocks right of the shaver, a shelf to the plate, a pusher behind them.
  // o = { bot, top: which blocks are there; slide: 0..1 the bottom one pushed across onto the plate; up: 1 the top one
  // resting on the bottom one, 0 come down in its place; rod: 0..1 how far the pusher is out }
  const LZ = ICE.z;
  function loader(o) {
    const { x, y } = LOADER, { bot, top, slide = 0, up = 1, rod = 0 } = o;
    let s = box(BLADE.x + BLADE.r - .4, y - 4.4, LZ - 2, x - 7 - BLADE.x - BLADE.r + .4, 8.8, 2, 0, 'kg-steel') + box(x - 7, y - 7, LZ - 2, 14, 14, 2, 0, 'kg-steel')
      + post(x + 6.6, y - 6.6, LZ, 40, 'kg-steel') + post(x - 6.6, y - 6.6, LZ, 40, 'kg-steel') + post(x + 6.6, y + 6.6, LZ, 40, 'kg-steel');
    const px = x + ICE.s / 2 + .2 - rod * (x - BLADE.x);
    s += box(x + 7.6, y - 1.4, LZ + 4, 4, 2.8, 2.8, 0, 'kg-steel') + seg([x + 7.6, y, LZ + 5.4], [px + 1.4, y, LZ + 5.4], '#dfe5ec', 1.2) + box(px, y - 3.4, LZ + 2, 1.4, 6.8, 7, 0, 'kg-pusher');
    if (bot) s += block(x - slide * (x - BLADE.x), y, LZ, 1);
    if (top) s += block(x, y, LZ + (ICE.h + .6) * up, 1);
    s += `<path d="${toD(hull([P(x - 7, y - 7, LZ), P(x + 7, y - 7, LZ), P(x + 7, y + 7, LZ), P(x - 7, y + 7, LZ), P(x - 7, y - 7, LZ + 40), P(x + 7, y - 7, LZ + 40), P(x + 7, y + 7, LZ + 40), P(x - 7, y + 7, LZ + 40)]))}" class="kg-frost"/>`
      + `<g transform="${FRONT(x - 5, y + 7.05, LZ + 36)}"><rect width="10" height="3.6" rx=".6" fill="#2a6ad9"/><text x="5" y="2.7" font-size="2.4" text-anchor="middle" fill="#fff" class="sign">予備氷</text></g>`;
    return s;
  }
  const loaderGhost = () => CORE.edges(LOADER.x - 7, LOADER.y - 7, LZ, 14, 14, 40, 'ugh');
  // 練乳ポンプ: a tube of condensed milk at the last stop, behind and right of the drum's outlet; its nozzle (tip) bent
  // toward the cup
  const MILK = { x: STN.exit + 4, y: LANE.y - 3.5, z: 124, tip: [STN.exit + 2, LANE.y - 1.6, 125.4] };
  const milkKit = () => post(MILK.x + 3, MILK.y - 3, 74, 76, 'kg-steel') + seg([MILK.x + 3, MILK.y - 3, 140], [MILK.x, MILK.y, 140], '#8a93a4', 1)
    + seg([MILK.x, MILK.y, MILK.z + 3.4], MILK.tip, '#c9d0da', 1.4) + cyl(MILK.x, MILK.y, MILK.z + 3, MILK.z + 6, .7, 2.6, '#c9d0da', 10) + cyl(MILK.x, MILK.y, MILK.z + 6, MILK.z + 22, 2.6, 2.6, '#fffdf4', 12) + cyl(MILK.x, MILK.y, MILK.z + 22, MILK.z + 25, 2.6, 1, '#2a6ad9', 12)
    + `<g transform="${FRONT(MILK.x - 2.5, MILK.y + 2.65, MILK.z + 18)}"><rect width="5" height="5" rx=".6" fill="#2a6ad9"/><text x="2.5" y="2.4" font-size="1.8" text-anchor="middle" fill="#fff" class="sign">練</text><text x="2.5" y="4.4" font-size="1.8" text-anchor="middle" fill="#fff" class="sign">乳</text></g>`;
  const milkGhost = () => CORE.edges(MILK.x - 2.6, MILK.y - 2.6, MILK.z + 3, 5.2, 5.2, 22, 'ugh');
  // the syrup head: four bottles upside down over it, their valves, their lines meeting in one nozzle; lit: the open valve
  const bottle = k => [SYR.x - 8.1 + k * 5.4, SYR.y - 10];
  function syrups(cols, lit = -1) {
    let s = post(SYR.x - 11, SYR.y - 10, 74, 86, 'kg-steel') + box(SYR.x - 11.4, SYR.y - 12, 136, 22.8, 4, 1.4, 0, 'kg-steel');
    cols.forEach((c, k) => { const [x, y] = bottle(k);
      s += `<path class="kg-line" style="stroke:${c}" d="${path([[x, y, 137.4], [x, y, 133 - k * .8], [SYR.x, y, 133 - k * .8], [SYR.x, y, SYR.z + 6], [SYR.x, SYR.y - 1.4, SYR.z + 5]])}"/>`
        + cyl(x, y, 140, 156, 1.8, 1.8, c, 12) + cyl(x, y, 156, 158, 1.8, 1, c, 10) + cyl(x, y, 138, 140, .8, 1.8, '#fff8ec', 10) + box(x - 1, y - 1, 135.4, 2, 2, 2.6, 0, 'kg-valve')
        + disc(x, y + 1.05, 136.8, .55, k === lit ? '#3fd47a' : '#2a2f38', 6, 'stroke:none'); });
    return s + cyl(SYR.x, SYR.y, SYR.z, SYR.z + 2.4, .8, 2.4, '#aab3bf', 12) + cyl(SYR.x, SYR.y, SYR.z + 2.4, SYR.z + 5, 2.4, 2.4, '#8a93a4', 12);
  }
  const stream = (x, y, z0, z1, c, w) => seg([x, y, z0], [x, y, z1], c, w, 'butt');
  const streamTo = (p0, p1, c, w) => seg(p0, p1, c, w);
  // the topping drum: a steel drum on a hub hung from the back wall; four cells in it, their mouths on its lid (they go
  // round as it turns); the outlet under it over the cup, a flap under the outlet, and fixed over the outlet the
  // plunger that pushes the bear's face template down through its cell.
  // o = { k: the working cell, jig: the drum shaken sideways (the sieve), press: 0..1 the plunger down, flap: 0..1 open }
  const TOPC = { azuki: '#6a1a1a', kinako: '#d8b878', bear: '#ff8a2a', gold: '#ffe680' };
  const cellAt = (k, a) => [TOPS.hx + TOPS.r * Math.cos(a + k * Math.PI / 2), TOPS.hy + TOPS.r * Math.sin(a + k * Math.PI / 2)];
  function turret(a, o = {}) {
    const { hx: x, hy: y, z, r } = TOPS, R = r + 2.4, zt = z + 9, dx = o.jig || 0, ox = TOPS.x + dx, oy = TOPS.y, press = o.press || 0;
    let s = box(x - 1, 26, 174, 2, y - 26, 2, 0, 'kg-steel') + post(x, y, zt, 174 - zt, 'kg-steel') + box(x - 2.4, y - 2.4, zt + 3, 4.8, 4.8, 4, 0, 'kg-steel');
    // the drum, its lid with the four cell mouths (the topping in each), its label
    s += cyl(x + dx, y, z, zt, R, R, '#8a93a4', 24) + disc(x + dx, y, zt, R, '#c9d0da', 24);
    TOPS.cells.forEach((t, k) => { const [cx, cy] = cellAt(k, a); s += disc(cx + dx, cy, zt + .05, 2, '#3a404c', 12) + disc(cx + dx, cy, zt + .1, 1.5, TOPC[t], 10, 'stroke:none'); });
    s += `<g transform="${FRONT(x + dx - 4, y + R + .05, z + 6.4)}"><text x="4" y="2.2" font-size="2" text-anchor="middle" fill="#fff" class="sign">トッピング</text></g>`;
    // the outlet and its flap
    s += cyl(ox, oy, z - 1.4, z, 1.2, 1.9, '#5a6374', 10);
    if (o.flap) { const fe = o.flap * 1.4, fy = oy + 1.6 * Math.cos(fe), fz = z - 1.4 - 1.6 * Math.sin(fe);
      s += `<path d="${toD([P(ox - 1.4, oy, z - 1.4), P(ox + 1.4, oy, z - 1.4), P(ox + 1.4, fy, fz), P(ox - 1.4, fy, fz)])}" style="fill:#aab3bf;${ST}"/>`; }
    // the plunger over the outlet (on a bracket from the hub); pressing, its rod runs down through the cell, the template
    // with the bear's face on its end
    s += seg([x, y, zt + 5], [TOPS.x, oy, zt + 5], '#8a93a4', 1) + box(TOPS.x - 1, oy - 1, zt + 2, 2, 2, 4, 0, 'kg-steel');
    if (press > 0) { const zb = z - 1.4 - 4.4 * press;
      s += seg([ox, oy, z - 1.4], [ox, oy, zb], '#dfe5ec', .7) + disc(ox, oy, zb, 1.9, '#e8eef6', 12)
        + [[-1, .4, '#3a1a1a'], [1, .4, '#3a1a1a'], [0, 1.4, '#3a1a1a'], [-1.8, -.3, '#ff8a2a'], [1.8, -.3, '#ff8a2a']].map(([u, v, c]) => disc(ox + u * .8, oy + v * .8, zb - .05, .38, c, 6, 'stroke:none')).join(''); }
    return s;
  }
  // a pinch of one topping falling (drawn round 0, 0, 0; the machine moves it down onto the dome)
  function bits(t) {
    const pts = { azuki: [[-.8, 0, 0], [.6, .4, .8], [0, -.6, 1.6], [.8, -.2, 2.4]], kinako: [[-1, 0, 0], [.4, .8, .6], [1, -.4, 1.2], [-.4, -.8, 1.8], [.2, .2, 2.6], [-.8, .6, 3.2]], gold: [[-.6, 0, 0], [.8, .4, 1.4]] }[t] || [];
    return pts.map(([u, v, w]) => { const [a, b] = q(u, v, w);
      return t === 'azuki' ? `<ellipse cx="${a}" cy="${b}" rx=".9" ry=".7" fill="#6a1a1a"/>` : t === 'kinako' ? `<circle cx="${a}" cy="${b}" r=".45" fill="#d8b878"/>` : `<path d="M${a} ${f(+b - .8)}l.7.8-.7.8-.7-.8z" fill="#ffe680"/>`; }).join('');
  }

  /* ---------- the inside. lv: fitted parts { loader, dblade, milk } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right; setView();
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the freezer for the blocks, the cup carton (it feeds the magazine)
    s += box(6, 30, 6, 42, 30, 34, 0, 'kg-freezer') + `<g transform="${FRONT(10, 60.05, 32)}"><rect width="34" height="9" rx="1.4" fill="#2a6ad9"/><text x="17" y="6.6" font-size="5" text-anchor="middle" fill="#fff" class="sign">氷 冷凍庫</text></g>`;
    s += box(56, 36, 6, 24, 16, 22, 0, 'kg-carton') + `<g transform="${FRONT(56, 52.05, 22)}"><text x="12" y="8" font-size="3" text-anchor="middle" fill="#2a6ad9" class="sign">紙カップ</text></g>`;
    s += box(2, 26, 70, 90, 50, 4, 0, 'kg-floor');
    // the rail along the deck
    s += box(4, LANE.y - 1.4, 74, STN.exit + 6 - 4, 2.8, 1.6, 0, 'kg-rail');
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the shaver's frame: a post in front of the rail at the left, an arm out to the plate, a beam over to the motor
    const fx = 16, fy = 69;
    let k = post(fx, fy, 74, 104, 'kg-steel') + box(fx - .8, fy - 1, 176, BLADE.x + 6 - fx, 2, 2.2, 0, 'kg-steel')
      + `<path d="${toD([P(fx, fy - 1, BLADE.z - .2), P(fx, fy + 1, BLADE.z - .2), P(BLADE.x - BLADE.r + 1, BLADE.y + 1.4, BLADE.z - .2), P(BLADE.x - BLADE.r + 1, BLADE.y - 1.4, BLADE.z - .2)])}" style="fill:#8a93a4;${ST}"/>`
      + box(BLADE.x - 5, BLADE.y - 5, 168, 10, 10, lv.dblade ? 10 : 7, 0, lv.dblade ? 'kg-motor2' : 'kg-steel')
      + (lv.dblade ? `<g transform="${FRONT(BLADE.x - 4, BLADE.y + 5.05, 176.4)}"><rect width="8" height="3" rx=".6" fill="#ffd23f"/><text x="4" y="2.3" font-size="2" text-anchor="middle" fill="#141018" class="sign">二枚刃</text></g>` : '');
    // the cup magazine at the left end of the rail (a stack of nested cups in a clear tube)
    const mz = MAG.z;
    k += cyl(MAG.x, MAG.y, mz, mz + 40, CUP.r0, CUP.r1 + .3, '#fbfaf4', 14) + Array.from({ length: 10 }, (_, i) => `<path d="${toD(ringZ(mz + 3 + i * 3.7, CUP.r1 + .1, 14, 0, Math.PI, MAG.x, MAG.y))}" fill="none" stroke="#3a8aff" stroke-width=".7" vector-effect="non-scaling-stroke"/>`).join('')
      + `<path class="kg-tube" d="${toD(hull([...ring(MAG.x, MAG.y, mz - 1, CUP.r1 + .8, 16), ...ring(MAG.x, MAG.y, mz + 42, CUP.r1 + .8, 16)]))}"/>` + disc(MAG.x, MAG.y, mz - 1, CUP.r1 + .8, 'rgba(170,179,191,.6)', 16);
    // the slide at the end of the rail, down to the take-out window
    k += `<path d="${toD([P(STN.exit - 5, LANE.y + 5, ZP.exit), P(STN.exit + 5, LANE.y + 5, ZP.exit), P(STN.exit + 5, 82, ZP.exit - 14), P(STN.exit - 5, 82, ZP.exit - 14)])}" style="fill:#aab3bf;${ST}"/>`;
    g.insertAdjacentHTML('beforeend', k);
    // the blade plate (one slot; two with the upgrade), the block and the presser (the machine draws them)
    g.insertAdjacentHTML('beforeend', cyl(BLADE.x, BLADE.y, BLADE.z, BLADE.z + 2, BLADE.r, BLADE.r, '#aab3bf', 20)
      + seg([BLADE.x - 5, BLADE.y + 1.4, BLADE.z + 2.05], [BLADE.x + 5, BLADE.y + 1.4, BLADE.z + 2.05], '#2a2f38', .9)
      + (lv.dblade ? `<g data-part="dblade">${seg([BLADE.x - 5, BLADE.y - 2, BLADE.z + 2.05], [BLADE.x + 5, BLADE.y - 2, BLADE.z + 2.05], '#2a2f38', .9)}</g>` : `<g class="ugh-g">${CORE.edges(BLADE.x - 5, BLADE.y - 5, 168, 10, 10, 10, 'ugh')}</g>`));
    const iceG = UTIL.g(g, '', { class: 'kg-iceg' });
    const presserG = UTIL.g(g, '', { class: 'kg-presser' });
    // the loader stands right of the shaver (nearer the camera in the default view)
    const loaderG = UTIL.g(g, '', { class: 'kg-loader', 'data-part': lv.loader ? 'loader' : null });
    if (!lv.loader) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${loaderGhost()}</g>`);
    const syrupG = UTIL.g(g, '', { class: 'kg-syrups' });
    g.insertAdjacentHTML('beforeend', lv.milk ? `<g data-part="milk">${milkKit()}</g>` : `<g class="ugh-g">${milkGhost()}</g>`);
    const cartG = UTIL.g(g, '', { class: 'kg-cart' });
    const turretG = UTIL.g(g, '', { class: 'kg-turret' });
    const snowG = UTIL.g(g, '', { class: 'kg-snowg' });
    const streamG = UTIL.g(g, '', { class: 'kg-streamg' });
    const movers = UTIL.g(g, '', { class: 'kg-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.loader ? '' : pin('loader', LOADER.x, LOADER.y, LZ + 22)) + (lv.dblade ? '' : pin('dblade', BLADE.x, BLADE.y, 186))
      + (lv.milk ? '' : pin('milk', MILK.x + 2, MILK.y + 8, MILK.z - 12)));
    return { defs: defsEl, iceG, presserG, loaderG, syrupG, cartG, turretG, snowG, streamG, movers, cm };
  }

  /* ---------- the shell and the door: the noren, the menu, the 氷 flag, the arched window, the crest, the board ---------- */
  // the door's grid: the arched window (x 39–65, y 63–127) is centred on the shaving column (u 52) and frames it whole
  // from the presser (v 66) to the turntable (v 126); the 氷 flag hangs left of it, the crest and the lamps right of it,
  // the board under it, all three on the same lines (y 63 / 127)
  const WN = { x: 39, y: 63, w: 26, h: 64 };
  const arch = (d = 0) => { const x = WN.x - d, w = WN.w + 2 * d, r = w / 2, y = WN.y - d, b = WN.y + WN.h + d; return `M${x} ${b}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${b}Z`; };
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, bl = '#2a6ad9', rd = '#e83a4a';
    let s = CORE.sideFace(W, D, H) + rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a big 氷 in outline over waves
    const waves = (x0, y0, w, c) => `<path d="M${x0} ${y0}${Array.from({ length: Math.round(w / 12) }, () => 'q3-5 6 0t6 0').join('')}" fill="none" stroke="${c}" stroke-width=".8" vector-effect="non-scaling-stroke"/>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${bl}"/>
      <text class="sign" x="42" y="104" font-size="54" text-anchor="middle" fill="rgba(232,58,74,.1)" stroke="rgba(232,58,74,.45)" stroke-width=".6" vector-effect="non-scaling-stroke">氷</text>${waves(12, 132, 60, 'rgba(58,138,255,.55)')}${waves(12, 140, 60, 'rgba(58,138,255,.35)')}
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(58,138,255,.1)" stroke="${bl}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${bl}">削りたて ¥100〜</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${bl}"/><g class="iso-only"><text class="sign" x="42" y="112" font-size="44" text-anchor="middle" fill="rgba(232,58,74,.1)" stroke="rgba(232,58,74,.45)" stroke-width=".6" vector-effect="non-scaling-stroke">氷</text>${waves(14, 132, 56, 'rgba(58,138,255,.55)')}
      <text class="label" x="42" y="152" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(58,138,255,.6)">KAKIGORI · SHAVED TO ORDER</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, fs = Math.min(2.8, 18.6 / (p.jp || p.name).length);
      return R3(x, y, 20.8, 30, 1, `<rect class="kg-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${bl}" opacity="0"/><g transform="translate(${x + 3.6} ${y + .8}) scale(.57)">${icon(p.syrup, p.top, p.milk)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label kg-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit kg-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the 氷 flag: white cloth on a pole, the red 氷, two plovers, blue waves at the hem
    const flag = `<path d="M7 63.6h28" stroke="#141018" stroke-width="1.6" stroke-linecap="round"/><circle cx="7" cy="63.6" r="1.2" fill="#141018"/>`
      + `<path d="M8.4 64.4h25.2V124l-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6z" fill="#fffdf6" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + `<path d="M8.4 64.4h25.2v2.6H8.4z" fill="${rd}"/><text x="21" y="93" font-size="20" text-anchor="middle" fill="${rd}" class="sign">氷</text>`
      + `<path d="M12 101q1.6-1.8 3.2 0q1.6-1.8 3.2 0M23 98.6q1.4-1.6 2.8 0q1.4-1.6 2.8 0" fill="none" stroke="${rd}" stroke-width=".9" stroke-linecap="round"/>`
      + `<path d="M8.4 108q4.2-4 8.4 0t8.4 0t8.4 0V124l-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6-3.15-1.6-3.15 1.6z" fill="${bl}"/><path d="M8.4 113q4.2-3.4 8.4 0t8.4 0t8.4 0M8.4 118q4.2-3.4 8.4 0t8.4 0t8.4 0" fill="none" stroke="#fff" stroke-width=".7"/>`;
    // the crest (a snowflake) and the lamps right of the window
    const crest = `<circle cx="80" cy="73" r="9" fill="${bl}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><circle cx="80" cy="73" r="7.2" fill="none" stroke="#fff" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + [0, 1, 2].map(i => { const a = i * Math.PI / 3 + Math.PI / 2, c = Math.cos(a) * 5, sn = Math.sin(a) * 5; return `<path d="M${f(80 - c)} ${f(73 - sn)}L${f(80 + c)} ${f(73 + sn)}" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`; }).join('')
      + R3(70, 86, 20, 6.4, .8, `<text class="lit-text kg-shavelamp" style="--lc:#7ad8ff" x="80" y="90.6" font-size="2.9" text-anchor="middle">削り中</text>`, { r: 1.5, capCls: 'readycap' })
      + R3(70, 94.6, 20, 6.4, .8, `<text class="lit-text kg-outlamp" style="--lc:#ff4f3a" x="80" y="99.2" font-size="2.9" text-anchor="middle">氷切れ</text>`, { r: 1.5, capCls: 'readycap' })
      + (lv.dblade ? R3(70, 103.2, 20, 6.4, .8, `<text class="lit-text kg-dbladelamp" style="--lc:#ffd23f" x="80" y="107.8" font-size="2.9" text-anchor="middle">二枚刃</text>`, { r: 1.5, capCls: 'readycap' }) : '');
    const board = `<rect x="6" y="132" width="86" height="36" rx="2" class="kg-board"/><text class="kg-boardt" x="49" y="140.4" font-size="5" text-anchor="middle">ふわふわ 削りたて</text>`
      + `<g transform="translate(13 142) scale(1.05)">${icon('#e83a4a', null, false)}</g><g transform="translate(60 142) scale(1.05)">${icon('#3a8aff', null, false)}</g>`
      + `<text class="kg-boardt" x="49" y="151" font-size="3" text-anchor="middle">雪みたいに</text><text class="kg-boardt" x="49" y="156" font-size="3" text-anchor="middle">うすく削ります</text>`
      + `<text class="kg-boardt" x="49" y="164" font-size="2.4" text-anchor="middle" opacity=".75">シロップはメニューで</text>`;
    const rivets = [84, 100, 116].map(y => `<circle cx="37.9" cy="${y}" r=".6" fill="#6a7384"/><circle cx="66.1" cy="${y}" r=".6" fill="#6a7384"/>`).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0Z${arch()}" fill-rule="evenodd"/>
      ${[4, 42, 80].map(x => `<path d="M${x} 3h36v15q-9 2-18 0t-18 0z" fill="${bl}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`).join('')}
      <text class="kg-noren" x="22" y="13.6" font-size="7" text-anchor="middle">かき</text><text class="kg-noren" x="60" y="14" font-size="8.4" text-anchor="middle">氷</text><text class="kg-noren" x="98" y="13.4" font-size="5.6" text-anchor="middle">ふわゆき</text>
      <rect x="5" y="22" width="88" height="34" rx="2" class="kg-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="#9ad8ff">一杯ずつ 削ります</text>
      ${flag}${crest}${board}
      <path class="nohit" d="${arch(2)}${arch()}" fill-rule="evenodd" fill="#aab3bf" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>${rivets}
      <path class="dglass nohit" d="${arch()}"/><path class="nohit" d="M44 70L49 66L43 127H39V80Z" fill="#fff" opacity=".05"/><path class="nohit" d="M57 64L59.4 64.6L53 127H50.6Z" fill="#fff" opacity=".04"/>
      ${lv.milk ? `<g class="nohit" transform="translate(87 133) rotate(8)"><circle r="7.4" fill="#fffdf4" stroke="${bl}" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-.2" font-size="3.6" text-anchor="middle" class="sign" fill="${bl}">練乳</text><text y="3.2" font-size="1.5" text-anchor="middle" class="label" fill="${rd}">はじめました</text></g>` : ''}
      ${lv.loader ? `<g class="nohit" transform="translate(69 113.4)"><rect width="22" height="7" rx="1" fill="#e8f6ff" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><rect x="1.6" y="1.6" width="3.8" height="3.8" rx=".6" fill="#9ad8ff" stroke="${bl}" stroke-width=".5" vector-effect="non-scaling-stroke"/><text x="13.4" y="4.6" font-size="2.6" text-anchor="middle" class="sign" fill="${bl}">氷 自動補給</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="kg-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 60, 20, 14, .8, `<text class="label" x="105" y="64.4" font-size="2.2" text-anchor="middle">氷</text><rect x="98" y="66.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="kg-gauge" x="98.4" y="66.8" width="13.2" height="2.6" rx=".8" fill="#9ad8ff"/>`
        + (lv.loader ? `<rect class="kg-spare" x="101" y="70.6" width="2.6" height="2.2" rx=".4"/><rect class="kg-spare" x="106.4" y="70.6" width="2.6" height="2.2" rx=".4"/>` : ''), { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="kg-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text kg-ready" style="--lc:#7ad8ff" x="60" y="190.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v7q-7 1.6-14.5 0t-14.5 0t-14.5 0t-14.5 0z" fill="${bl}" opacity=".92"/><text class="kg-noren nohit" x="60" y="200.4" font-size="3.4" text-anchor="middle">お持ち帰り</text>
      <rect class="kg-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0Z${arch()}" fill-rule="evenodd" style="fill:#101318"/><path class="dglass nohit" d="${arch()}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'kg-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'kg-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.kg-tile')], slotGlow: door.querySelector('.kg-slotglow'),
      lcd: door.querySelector('.kg-lcd'), gauge: door.querySelector('.kg-gauge'), spares: [...door.querySelectorAll('.kg-spare')], shaveLamp: door.querySelector('.kg-shavelamp'), outLamp: door.querySelector('.kg-outlamp'),
      dbladeLamp: door.querySelector('.kg-dbladelamp'), ready: door.querySelector('.kg-ready'), flap: door.querySelector('.kg-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><path class="xline" d="${arch()}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, block, presser, snow, cup, carriage, loader, syrups, bottle, stream, streamTo, turret, bits, icon, setView, MILK };
})();
