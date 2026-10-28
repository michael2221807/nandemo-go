/* Fig 7 · ピコ堂 — geometry, after the gadget vending machines (the SoftBank accessory machine at Haneda with its
   touchscreen and the charging station on its side, Nipponbashi's "gadget vender" with its ¥200 junk boxes):
   behind the glass a grid of shelves, five boxed goods to a shelf; an XY gantry over them (a carriage on the rail, a
   gripper that reaches into a cell), a drag chain following the carriage; a lift in the middle down to the drawer.
   The touchscreen on the door is run by an old PC in the cabinet that freezes now and then (the machine's flaw).
   Bottom: the PC and the 24V supply. Right: coin column. Shallow and to the left so the window shows the whole grid. */
const PK = (() => {
  const W = 120, D = 84, H = 240;
  const GRID = { x0: 4, cw: 12, cols: 5, y: 62, z: [98, 118, 138, 158, 178] };
  const cell = (r, c) => [GRID.x0 + 6 + c * GRID.cw, GRID.y, GRID.z[r]];
  const RAIL = { y: 73, z: 206, x0: 2, x1: 70 };
  const REACH_Y = 74, SAFE_Z = 192;            // the gripper travels in front of the shelves, parks up high
  const LIFT = { x: 34, y: 76, top: 90, bottom: 24 };
  const PARK = [10, 58];
  const WINDOW = [60, 74, 30];
  // the starting menu (overwritten by the goods plan): g = what is in the box, fill = its colour (box stripe, the thing)
  const MENU = [
    { name: 'USBケーブル', price: 200, g: 'cable', fill: '#3fb8ff' },
    { name: '充電器', price: 280, g: 'charger', fill: '#9aa6b8' },
    { name: 'SDカード', price: 320, g: 'sd', fill: '#2a6ad9' },
    { name: 'ジャンク箱', price: 200, g: 'junk', fill: '#c8a040' },
    { name: 'キーキャップ', price: 220, g: 'keycap', fill: '#ff4f8b' },
  ];
  return { W, D, H, GRID, cell, RAIL, REACH_Y, SAFE_Z, LIFT, PARK, WINDOW, MENU, SLOTW: [105, D, 187] };
})();

const PKB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, GRID, RAIL, LIFT } = PK;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const vars = p => `--c:${p.fill}`;
  const dot = (x, y, z, r, fill) => { const q = P(x, y, z); return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${r}" style="fill:${fill}"/>`; };
  const quad = (pts, fill, extra = '') => `<path d="${toD(pts.map(p => P(...p)))}" style="fill:${fill};${ST}" ${extra}/>`;

  /* ---------- glyphs: the product box (on the shelf), and each gadget out of its box (in the window) ---------- */
  const THINGS = {
    cable: () => `<path d="${toD(ringZ(3, 3.2, 20))}" fill="none" style="stroke:var(--c);stroke-width:1.4"/><path d="${toD(ringZ(3.8, 2.3, 20))}" fill="none" style="stroke:var(--c);stroke-width:1.4"/>${box(2.4, -.7, 2.6, 2.8, 1.4, 1.2, 0, 'pk-metal')}`,
    charger: () => `${box(-2.4, -2.4, 2.6, 4.8, 4.8, 4.4, 0, 'pk-white')}<path d="${toD([P(-.9, 0, 7), P(-.9, 0, 8.6)], false)}" stroke="#9aa6b8" stroke-width="1"/><path d="${toD([P(.9, 0, 7), P(.9, 0, 8.6)], false)}" stroke="#9aa6b8" stroke-width="1"/>${quad([[-2.4, 2.45, 4], [2.4, 2.45, 4], [2.4, 2.45, 5], [-2.4, 2.45, 5]], 'var(--c)')}`,
    sd: () => `${quad([[-2.6, -3.4, 3], [1.6, -3.4, 3], [2.6, -2.4, 3], [2.6, 3.4, 3], [-2.6, 3.4, 3]], 'var(--c)')}${quad([[-1.8, -.6, 3.05], [1.8, -.6, 3.05], [1.8, 2.6, 3.05], [-1.8, 2.6, 3.05]], '#f4f4f8')}`,
    keycap: () => { const b = [[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]].map(([x, y]) => P(x, y, 2.6)), t = [[-1.7, -1.9], [1.7, -1.9], [1.7, 1.5], [-1.7, 1.5]].map(([x, y]) => P(x, y, 6));
      const q = P(0, -.2, 6.05); return `<path d="${toD(hull([...b, ...t]))}" style="fill:var(--c);${ST}"/><path d="${toD(t)}" style="fill:color-mix(in srgb,var(--c) 70%,#fff);${ST}"/><text x="${f(q[0])}" y="${f(q[1] + 1)}" font-size="2.8" text-anchor="middle" fill="#fff" font-weight="700" font-family="sans-serif">A</text>`; },
    earbuds: () => `${rounded(-3, -2.2, 2.6, 6, 4.4, 2.6, 2.2, 'pk-white')}${quad([[-3, -2.2, 5.2], [3, -2.2, 5.2], [3, -4.6, 8.4], [-3, -4.6, 8.4]], '#f4f4f8')}${[-1.3, 1.3].map(x => `<path d="${toD([P(x, .6, 5.4), P(x, .6, 7.2)], false)}" stroke="#e6e6ee" stroke-width="1.2"/>${dot(x, .6, 7.6, 1.2, '#fafaff')}`).join('')}${dot(0, 2.25, 4, .5, 'var(--c)')}`,
    mouse: () => `<path d="${toD(hull([...ringZ(2.6, 2.8, 18), ...ringZ(4.6, 2.3, 18), ...ringZ(5.8, 1.2, 18)]))}" style="fill:var(--c);${ST}"/><path d="${toD([P(0, -2.2, 5.4), P(0, -.4, 5.9)], false)}" stroke="#141018" stroke-width="1.2"/><path d="${toD([P(0, -2.8, 2.8), P(-1, -5, 2.7), P(1, -7, 2.7)], false)}" fill="none" stroke="#6a7484" stroke-width=".8"/>`,
    battery: () => `${box(-2.8, -3.6, 2.6, 5.6, 7.2, 2.2, 0, 'pk-dark')}${[-1.5, -.5, .5, 1.5].map((y, i) => dot(1.4, y, 4.85, .45, i < 3 ? '#3fd47a' : '#2a4a32')).join('')}${box(-1, 3.6, 3.1, 2, .5, 1.2, 0, 'pk-metal')}`,
    board: () => `${box(-3.8, -2.6, 2.6, 7.6, 5.2, .8, 0, 'pk-pcb')}${box(-1.4, -1.2, 3.4, 2.8, 2.4, .7, 0, 'pk-chip')}${[-3.2, -2, -.8, .4, 1.6, 2.8].map(x => dot(x, -2.1, 3.42, .35, '#ffd23f') + dot(x, 2.1, 3.42, .35, '#ffd23f')).join('')}${box(3.4, -.9, 3.4, 1.4, 1.8, .9, 0, 'pk-metal')}`,
    handheld: () => `${box(-3, -4, 2.6, 6, 8, 1.6, 0, 'pk-c')}${quad([[-2.2, -3.2, 4.25], [2.2, -3.2, 4.25], [2.2, -.2, 4.25], [-2.2, -.2, 4.25]], '#9ad08a')}${quad([[-1.9, 1.2, 4.25], [-.9, 1.2, 4.25], [-.9, 2.2, 4.25], [-1.9, 2.2, 4.25]], '#141018')}${dot(1.2, 1.3, 4.3, .55, '#e8453a')}${dot(2, 2.2, 4.3, .55, '#e8453a')}`,
    mystery: () => { const q = P(0, 0, 9.6), m = P(0, 2.45, 5);
      return `<circle cx="${f(P(0, 0, 5)[0])}" cy="${f(P(0, 0, 5)[1])}" r="7" style="fill:var(--c)" opacity=".22"/>${box(-2.4, -2.4, 2.6, 4.8, 4.8, 4.8, 0, 'pk-myst')}<path d="${toD([P(1.4, -1.4, 7.4), P(1.4, -1.4, 10.4)], false)}" stroke="#fff" stroke-width=".7"/>${dot(1.4, -1.4, 10.6, .7, '#ffd23f')}
        <text x="${f(m[0])}" y="${f(m[1] + 1.2)}" font-size="3.4" text-anchor="middle" fill="#fff" font-weight="700" font-family="sans-serif">?</text><circle cx="${f(q[0] - 4)}" cy="${f(q[1] + 2)}" r=".6" fill="#fff"/><circle cx="${f(q[0] + 4)}" cy="${f(q[1] + 4)}" r=".5" fill="#fff"/>`; },
    junk: () => '',   // a bag of random parts: drawn per sale (bagOf)
  };
  // the open box: its base, the lid tipped back with the product's stripe, the gadget standing in it
  const openBox = inner => `${quad([[-4.5, -4, 2.5], [4.5, -4, 2.5], [4.5, -7.6, 9], [-4.5, -7.6, 9]], '#f6f6fa')}${quad([[-4.5, -5.2, 4.6], [4.5, -5.2, 4.6], [4.5, -5.8, 5.8], [-4.5, -5.8, 5.8]], 'var(--c)')}${box(-4.5, -4, 0, 9, 8, 2.5, 0, 'pk-box')}${inner}`;
  function defs() {
    const gbox = `<g id="g-gbox">${box(-4.5, -4, 0, 9, 8, 7, 0, 'pk-box')}<g transform="${FRONT(-4.5, 4.03, 7)}"><rect y="1.2" width="9" height="2.6" style="fill:var(--c)"/><rect x="5.6" y="4.6" width="2.6" height="1.6" fill="#141018" opacity=".7"/></g><g transform="${TOP(-4.5, -4, 7.03)}"><rect x="1" y="1" width="2" height="6" style="fill:var(--c)" opacity=".8"/></g></g>`;
    return gbox + Object.keys(THINGS).map(k => `<g id="g-pko-${k}">${openBox(THINGS[k]())}</g>`).join('');
  }
  // a junk box: a clear bag of random parts (resistors, LEDs, buttons, chips, capacitors, a 7-seg digit), seeded per sale
  function bagOf(seed, x, y, z) {
    let s = seed * 9301 + 49297; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const parts = [
      (u, v) => `<rect x="${u - 3}" y="${v - .9}" width="6" height="1.8" rx=".9" fill="#e9d6a8"/><path d="M${u - 4.6} ${v}h1.6M${u + 3} ${v}h1.6" stroke="#9aa6b8" stroke-width=".5"/>${['#e8453a', '#141018', '#ffb020'].map((c, i) => `<rect x="${u - 1.8 + i * 1.3}" y="${v - .9}" width=".6" height="1.8" fill="${c}"/>`).join('')}`,
      (u, v) => { const c = ['#ff4a3a', '#3fd47a', '#3f9fff', '#ffd23f'][Math.floor(rnd() * 4)]; return `<path d="M${u - 1.4} ${v + 1}v-2a1.4 1.4 0 0 1 2.8 0v2z" fill="${c}" opacity=".9"/><path d="M${u - .6} ${v + 1}v2.4M${u + .6} ${v + 1}v1.8" stroke="#9aa6b8" stroke-width=".4"/>`; },
      (u, v) => `<rect x="${u - 1.8}" y="${v - 1.8}" width="3.6" height="3.6" fill="#22262d"/><circle cx="${u}" cy="${v}" r="1.1" fill="#6a7484"/>`,
      (u, v) => `<rect x="${u - 2.4}" y="${v - 1.3}" width="4.8" height="2.6" fill="#141018"/>${[-1.6, -.5, .6, 1.7].map(d => `<path d="M${u + d} ${v - 1.3}v-.8M${u + d} ${v + 1.3}v.8" stroke="#c9d0da" stroke-width=".35"/>`).join('')}`,
      (u, v) => `<rect x="${u - 1.1}" y="${v - 1.8}" width="2.2" height="3.6" rx=".8" fill="#2a6ad9"/><path d="M${u - .4} ${v + 1.8}v1.4M${u + .4} ${v + 1.8}v1.4" stroke="#9aa6b8" stroke-width=".35"/>`,
      (u, v) => `<rect x="${u - 1.6}" y="${v - 2.2}" width="3.2" height="4.4" fill="#141018"/><text x="${u}" y="${v + 1.5}" font-size="4" text-anchor="middle" fill="#ff4a3a" font-family="monospace">8</text>`,
    ];
    let inner = '';
    for (let i = 0; i < 6; i++) { const u = 3 + rnd() * 12, v = 4 + rnd() * 9; inner += `<g transform="rotate(${f((rnd() - .5) * 70)} ${f(u)} ${f(v)})">${parts[Math.floor(rnd() * parts.length)](u, v)}</g>`; }
    return `<g transform="${FRONT(x - 9, y, z + 16)}"><path d="M1 0h16q1 0 1 1v14q0 1-1 1H1q-1 0-1-1V1q0-1 1-1z" fill="rgba(235,245,255,.22)" stroke="rgba(235,245,255,.75)" stroke-width=".6" vector-effect="non-scaling-stroke"/>${inner}
      <rect x="0" y="-1.6" width="18" height="2.4" rx=".6" fill="#c8a040" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><text x="9" y=".2" font-size="1.8" text-anchor="middle" fill="#141018" font-weight="700" font-family="sans-serif">JUNK ¥200</text></g>`;
  }
  // flat icons (24 × 24) for the touchscreen tiles and the shop
  // (app build, goods polish: the prototype's icon (icon0) with each gadget's own marks on top: plug contacts, a
  // charge light, the card's gold contacts and label, a scroll wheel, a port, traces, a sprite on the handheld's screen)
  function icon(g, c) {
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const shine = d => ln(d, '#fff', .9, ' opacity=".55"');
    const M = {
      cable: () => ln('M17 6.6h2M17 8.2h2', '#8a93a4', .6) + `<rect x="3.6" y="11.6" width="2.6" height="2.2" rx=".5" fill="#c9d0da" stroke="#141018" stroke-width=".7"/>`,
      charger: () => `<circle cx="15.6" cy="9.4" r=".8" fill="#3fd47a"/>` + ln('M8.4 10.2h4M8.4 12h2.8', '#c9d0da', .7),
      sd: () => ln('M8.6 4.8v2.2M10.2 4.8v2.2M11.8 4.8v2.2M13.4 5.4v1.8', '#ffd23f', .7) + ln('M10.2 13.4h4.2M10.2 15.4h2.8', '#3a6ad9', .6),
      junk: () => ln('M14 9q2 1 1 3', '#3a8aff', .7) + `<circle cx="9" cy="9.4" r=".7" fill="#9aa6b8"/>`,
      keycap: () => `<path d="M17.6 6l2.4 12h-2.4l-1-7z" fill="#000" opacity=".16"/>` + shine('M8 9h3.4'),
      earbuds: () => ln('M5.4 13h13.2', '#c8cad4', .6) + `<circle cx="12" cy="17" r=".45" fill="#fff"/>`,
      mouse: () => `<rect x="11.2" y="6.2" width="1.6" height="2.8" rx=".8" fill="#2a2f3a"/>` + shine('M7.4 11q.4-3.4 2.6-5'),
      battery: () => `<rect x="18.4" y="10.6" width="1.6" height="3.6" fill="#141018"/>` + shine('M6 8h5'),
      board: () => ln('M5 10h3.6M15.4 10h3.8M5 14h3.6M15.4 14h3.8', '#9ad08a', .5) + `<circle cx="10" cy="10" r=".5" fill="#ffd23f"/>`,
      handheld: () => `<path d="M10.4 7.4h1.2v1.2h1.2v2.4h-3.6V8.6h1.2z" fill="#2a5a2a"/>` + `<path d="${dots([[9, 18.6], [10.2, 18.6], [11.4, 18.6]], .3)}" fill="#141018"/>`,
      mystery: () => `<path d="M19 6.6l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5zM5 9l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z" fill="#fff6b0"/>`,
    };
    return icon0(g, c) + (M[g] ? M[g]() : '');
  }
  function icon0(g, c) {
    const k = 'stroke="#141018" stroke-width="1.3" stroke-linejoin="round"';
    switch (g) {
      case 'cable': return `<ellipse cx="11" cy="13" rx="7" ry="4.4" fill="none" stroke="${c}" stroke-width="2.4"/><ellipse cx="11" cy="12" rx="4.4" ry="2.6" fill="none" stroke="${c}" stroke-width="2.2"/><rect x="16" y="5" width="4" height="6" rx="1" fill="#c9d0da" ${k}/>`;
      case 'charger': return `<rect x="6" y="7" width="12" height="12" rx="2.4" fill="#fafaff" ${k}/><path d="M10 7V3.5M14 7V3.5" ${k}/><rect x="6" y="15" width="12" height="2" fill="${c}"/>`;
      case 'sd': return `<path d="M7 3.5h7l3.5 3.5v13.5H7z" fill="${c}" ${k}/><rect x="9" y="11" width="6.5" height="7" fill="#fff"/>`;
      case 'junk': return `<path d="M5 6h14v13q0 1.5-1.5 1.5h-11Q5 20.5 5 19z" fill="rgba(235,245,255,.5)" ${k}/><rect x="4.4" y="4" width="15.2" height="3" rx="1" fill="${c}" ${k}/><rect x="7" y="12" width="6" height="2" rx="1" fill="#e9d6a8"/><path d="M15 15a1.4 1.4 0 0 1 2.8 0v2H15z" fill="#ff4a3a"/><rect x="8" y="16" width="4" height="2.4" fill="#141018"/>`;
      case 'keycap': return `<path d="M4 18l2.4-12h11.2L20 18z" fill="${c}" ${k}/><path d="M7.4 8h9.2l1 7H6.4z" fill="#fff" opacity=".35"/><text x="12" y="14.4" font-size="6" text-anchor="middle" fill="#fff" font-weight="700" font-family="sans-serif">A</text>`;
      case 'earbuds': return `<rect x="5" y="10" width="14" height="10" rx="5" fill="#fafaff" ${k}/><path d="M9 10V5.5M15 10V5.5" stroke="#d6d8e0" stroke-width="2.4" stroke-linecap="round"/><circle cx="9" cy="5" r="2.4" fill="#fafaff" ${k}/><circle cx="15" cy="5" r="2.4" fill="#fafaff" ${k}/><circle cx="12" cy="17" r="1" fill="${c}"/>`;
      case 'mouse': return `<path d="M12 4c4.4 0 6.6 3.6 6.6 8.6S16 20.5 12 20.5 5.4 17.6 5.4 12.6 7.6 4 12 4z" fill="${c}" ${k}/><path d="M12 4.6v5" ${k}/>`;
      case 'battery': return `<rect x="4" y="6" width="16" height="13" rx="2" fill="#2a2f3a" ${k}/>${[0, 1, 2, 3].map(i => `<circle cx="${7.6 + i * 3}" cy="12.5" r="1" fill="${i < 3 ? '#3fd47a' : '#2a4a32'}"/>`).join('')}`;
      case 'board': return `<rect x="3.5" y="6" width="17" height="12" rx="1" fill="#2f8a3a" ${k}/><rect x="9" y="9" width="6" height="6" fill="#141018"/>${[5, 7.4, 9.8, 12.2, 14.6, 17].map(x => `<circle cx="${x}" cy="7.6" r=".6" fill="#ffd23f"/><circle cx="${x}" cy="16.4" r=".6" fill="#ffd23f"/>`).join('')}`;
      case 'handheld': return `<rect x="5.5" y="3" width="13" height="18" rx="2" fill="${c}" ${k}/><rect x="7.6" y="5" width="8.8" height="7" fill="#9ad08a" stroke="#141018" stroke-width=".8"/><path d="M8.6 15.6h3M10.1 14.1v3" stroke="#141018" stroke-width="1.2"/><circle cx="15" cy="15" r="1" fill="#e8453a"/><circle cx="16.6" cy="17" r="1" fill="#e8453a"/>`;
      case 'mystery': return `<circle cx="12" cy="13" r="9" fill="${c}" opacity=".25"/><rect x="7" y="8" width="10" height="10" rx="1.4" fill="${c}" ${k}/><text x="12" y="16.4" font-size="7" text-anchor="middle" fill="#fff" font-weight="700" font-family="sans-serif">?</text><path d="M15 8V3.5" ${k}/><circle cx="15" cy="3" r="1.2" fill="#ffd23f"/>`;
    }
    return `<rect x="6" y="6" width="12" height="12" fill="${c}" ${k}/>`;
  }
  const use = (id, p, x, y, z, extra = '') => { const [sx, sy] = P(x, y, z); return `<use href="#${id}" x="${f(sx)}" y="${f(sy)}" style="${vars(p)}" ${extra}/>`; };
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const post = (x, y, z, h) => box(x - .8, y - .8, z, 1.6, 1.6, h);

  /* ---------- the inside. lv: fitted parts { ctrl, arm2, charger } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right, gw = GRID.cols * GRID.cw;
    let s = CORE.shell(W, D, H);
    // back wall: a cooling fan, the harness from the PC up to the gantry motors, the screen, the lift
    s += `<g transform="${FRONT(74, 3.2, 232)}"><circle class="face" cx="9" cy="9" r="8"/>${[0, 45, 90, 135].map(a => `<path class="hair" transform="rotate(${a} 9 9)" d="M2 9H16"/>`).join('')}<circle class="detail" cx="9" cy="9" r="2.4"/></g>`;
    s += [[[20, 4, 36], [20, 4, 212], [4, 70, 212]], [[30, 4, 36], [30, 4, 150], [92, 4, 150]], [[56, 4, 28], [56, 4, 92], [LIFT.x, LIFT.y, 92]]].map(w => `<path class="wire2" d="${path(w)}"/>`).join('');
    // the controller PC (the source of the freezes) and the 24V supply, on the floor
    s += box(6, 14, 6, 34, 30, 30, 0, 'pk-pc') + `<g transform="${FRONT(6, 44.05, 36)}"><rect class="detail" x="3" y="3" width="15" height="9" rx="1"/><text class="label sign" x="10.5" y="9.2" font-size="2.6" text-anchor="middle">CTRL PC</text>${slits(21, 31, 2.4, 4, 26, false)}<circle class="pk-led on" cx="25" cy="5" r="1"/><circle class="pk-hdd" cx="28.6" cy="5" r="1"/></g>`;
    s += box(46, 14, 6, 22, 24, 22) + `<g transform="${FRONT(46, 38.05, 28)}"><text class="label sign" x="11" y="6" font-size="3.4" text-anchor="middle">24V</text>${slits(9, 18, 2.2, 3, 19, false)}</g>`;
    // the right side, behind the coin column's door panel: a cable tray up the back, the 4G router that takes new menus and
    // prices over the air (with its aerials), and the UPS that keeps the PC alive through a blackout
    s += box(84, 8, 40, 6, 6, 168, 0, 'pk-tray') + `<path class="wire2" d="${path([[86, 14.1, 44], [86, 14.1, 204]])}"/><path class="wire2" d="${path([[88, 14.1, 44], [88, 14.1, 170]])}"/>`;
    s += box(64, 16, 168, 20, 14, 8) + `<path class="hair" d="${path([[68, 22, 176], [66, 22, 194]])}" style="stroke-width:1.6"/><path class="hair" d="${path([[80, 22, 176], [82, 22, 192]])}" style="stroke-width:1.6"/>`
      + `<g transform="${FRONT(64, 30.05, 176)}"><text class="label sign" x="3" y="5.6" font-size="3.2">4G</text>${[11, 14, 17].map(x => `<circle class="pk-led on" cx="${x}" cy="4.2" r=".8"/>`).join('')}</g>`;
    s += box(70, 40, 6, 20, 18, 18) + `<g transform="${FRONT(70, 58.05, 24)}"><text class="label sign" x="10" y="6" font-size="3.2" text-anchor="middle">UPS</text>${[0, 1, 2, 3].map(i => `<rect x="${3 + i * 3.8}" y="10" width="3" height="4" fill="${i < 3 ? '#3fd47a' : '#24302a'}"/>`).join('')}</g>`;
    // the shelves: a back panel, a board under each row, a price strip on each lip
    s += `<g transform="${FRONT(GRID.x0, GRID.y - 6, GRID.z[4] + 24)}"><rect width="${gw}" height="${GRID.z[4] + 28 - GRID.z[0]}" fill="#11141a" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`;
    g.insertAdjacentHTML('beforeend', s);
    const ctrlNew = lv.ctrl ? UTIL.g(g, `<g transform="${FRONT(6, 44.1, 20)}"><rect x="3" y="0" width="14" height="10" rx="1" fill="#1e5a2e" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="6" y="2.4" width="5" height="5" fill="#141018"/><circle class="pk-led on" cx="14" cy="3" r=".8"/><text class="label" x="10" y="12.6" font-size="2.2" text-anchor="middle">${lv.ctrl > 1 ? 'NEW CTRL+' : 'NEW CTRL'}</text></g>`, { 'data-part': 'ctrl' }) : null;
    if (!ctrlNew) g.insertAdjacentHTML('beforeend', `<g class="ugh-g"><g transform="${FRONT(6, 44.1, 20)}"><rect class="ugh" x="3" y="0" width="14" height="10" rx="1"/></g></g>`);
    let cm;
    const column = () => { cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState); };
    if (!RT) column();
    const rows = GRID.z.map(z => { g.insertAdjacentHTML('beforeend', box(GRID.x0, GRID.y - 6, z - 2, gw, 12, 2));
      const rg = UTIL.g(g, '', { class: 'pk-row' });
      g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(GRID.x0, GRID.y + 6.05, z)}"><rect class="pk-strip" y="-.2" width="${gw}" height="1.4"/></g>`);
      return rg; });
    // the X rail with its motors and belt; the moving parts (carriages, grippers, drag chain) are drawn by the machine
    g.insertAdjacentHTML('beforeend', box(RAIL.x0, RAIL.y - 2, RAIL.z, RAIL.x1 - RAIL.x0, 4, 3) + box(RAIL.x0 - 2, RAIL.y - 4, RAIL.z - 2, 5, 8, 7) + box(RAIL.x1 - 3, RAIL.y - 4, RAIL.z - 2, 5, 8, 7)
      + `<path class="pk-belt" d="${path([[RAIL.x0 + 3, RAIL.y + 2.05, RAIL.z + 1.6], [RAIL.x1 - 3, RAIL.y + 2.05, RAIL.z + 1.6]])}"/><g transform="${FRONT(RAIL.x0 + 4, RAIL.y + 2.1, RAIL.z + 6)}"><text class="label" x="0" y="2.4" font-size="2.2">X · STEP</text></g>`);
    // the lift in the middle, down to the drawer
    g.insertAdjacentHTML('beforeend', post(LIFT.x - 7, LIFT.y + 3, LIFT.bottom - 2, LIFT.top - LIFT.bottom + 6) + post(LIFT.x + 7, LIFT.y + 3, LIFT.bottom - 2, LIFT.top - LIFT.bottom + 6) + box(LIFT.x - 8, LIFT.y - 4, LIFT.bottom - 4, 50, 8, 2));
    const lift = UTIL.g(g, rounded(LIFT.x - 6, LIFT.y - 5, LIFT.top - 2, 12, 10, 2, 2), { class: 'pk-lift' });
    const gantry = UTIL.g(g, '', { class: 'pk-gantry' });
    if (!lv.arm2) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(PK.PARK[1] - 4, RAIL.y - 3, RAIL.z - 4, 8, 6, 4, 'ugh')}<path class="ugh" d="${path([[PK.PARK[1], RAIL.y, RAIL.z - 4], [PK.PARK[1], RAIL.y, PK.SAFE_Z + 4]])}"/></g>`);
    const movers = UTIL.g(g, '', { class: 'pk-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.ctrl >= 2 ? '' : pin('ctrl', 23, 44, 30)) + (lv.arm2 ? '' : pin('arm2', PK.PARK[1] + 6, RAIL.y + 2, RAIL.z + 10)) + (lv.charger ? '' : pin('charger', 112, 44, 118)));
    return { rows, gantry, lift, movers, cm, hdd: g.querySelector('.pk-hdd') };
  }
  // the moving parts of the gantry: per arm a carriage on the rail, a rod down to the gripper, the box it holds;
  // the drag chain from the rail's middle loops over to the first carriage
  function gantry(arms) {
    let s = '';
    arms.forEach((a, i) => {
      s += box(a.x - 4, RAIL.y - 3, RAIL.z - 4, 8, 6, 4, 0, 'pk-car');
      s += `<path class="hair" d="${path([[a.x, RAIL.y, RAIL.z - 4], [a.x, a.hy, a.hz + 5]])}" style="stroke-width:2"/>` + `<path class="hair" d="${path([[a.x, RAIL.y, RAIL.z - 4], [a.x, a.hy, RAIL.z - 4]])}" style="stroke-width:1.4"/>`;
      if (a.box) s += use('g-gbox', a.box, a.x, a.hy, a.hz - 7);
      s += box(a.x - 3, a.hy - 3, a.hz + 1, 6, 6, 4, 0, 'pk-head') + box(a.x - 4.6, a.hy - 1, a.hz - 4, 1.2, 2, 5, 0, 'pk-head') + box(a.x + 3.4, a.hy - 1, a.hz - 4, 1.2, 2, 5, 0, 'pk-head');
      if (i === 0) { const [x0, y0] = P(36, RAIL.y - 1, RAIL.z + 3), [x1, y1] = P(a.x, RAIL.y - 1, RAIL.z + 1);
        s = `<path class="pk-chain" d="M${f(x0)} ${f(y0)}C${f(x0)} ${f(y0 - 9)} ${f(x1)} ${f(y1 - 9)} ${f(x1)} ${f(y1)}"/>` + s; }
    });
    return s;
  }

  /* ---------- the shell and door: the window onto the grid, the touchscreen menu, the side charging station ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, nc = '#3ff4ff';
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const ln = `stroke="rgba(63,244,255,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    // the charging station on the side that faces the camera: three docks, phones charging, a sign
    const charger = lv.charger ? `<g class="pk-charge"><rect x="12" y="104" width="60" height="58" rx="3" fill="#0e1218" stroke="${nc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="113" font-size="5.4" text-anchor="middle" fill="${nc}">無料充電</text>
      ${[0, 1, 2].map(i => `<rect x="${17 + i * 18}" y="118" width="14" height="24" rx="2.4" fill="#1d2230" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="${18.6 + i * 18}" y="120.4" width="10.8" height="17" rx="1" fill="${i === 1 ? '#3ff4ff' : '#26324a'}" opacity="${i === 1 ? .55 : 1}"/><path d="M${24 + i * 18} 142v8" stroke="#9aa6b8" stroke-width="1.2"/><rect x="${21 + i * 18}" y="150" width="6" height="4" rx="1" fill="#2a2f3a"/><rect x="${20 + i * 18}" y="127" width="8" height="3" rx="1" fill="${['#3fd47a', '#ffd23f', '#3fd47a'][i]}" opacity=".9"/>`).join('')}
      <text class="label" x="42" y="159.6" font-size="2.8" text-anchor="middle" fill="${nc}">USB · Type-C · Lightning</text>
      <rect x="12" y="165" width="60" height="21" rx="3" fill="#0e1218" stroke="${nc}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="172.4" font-size="4.2" text-anchor="middle" fill="${nc}">予備ストック</text>
      ${Array.from({ length: 9 }, (_, i) => `<rect x="${17.5 + i * 5.6}" y="175.6" width="4.4" height="6.4" rx=".6" fill="${['#3fb8ff', '#9aa6b8', '#2a6ad9', '#c8a040', '#ff4f8b'][i % 5]}" opacity=".85"/>`).join('')}</g>` : '';
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${nc}" filter="url(#soft)"/>
      <rect x="18" y="26" width="48" height="48" rx="2" fill="rgba(63,244,255,.06)" ${ln}/><rect x="28" y="36" width="28" height="28" fill="rgba(63,244,255,.1)" ${ln}/>${[0, 1, 2, 3, 4].map(i => `<path d="M${30 + i * 6} 26v-6M${30 + i * 6} 74v6M18 ${38 + i * 6}h-6M66 ${38 + i * 6}h6" ${ln}/>`).join('')}
      <text class="sign" x="42" y="54" font-size="9" text-anchor="middle" fill="rgba(63,244,255,.14)" stroke="rgba(63,244,255,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">PICO</text>
      ${lv.charger ? charger : ['ピ', 'コ', '堂'].map((ch, i) => `<text class="sign" x="42" y="${116 + i * 24}" font-size="20" text-anchor="middle" fill="rgba(63,244,255,.12)" stroke="rgba(63,244,255,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="196" width="56" height="12" rx="2" fill="rgba(255,79,139,.12)" stroke="#ff4f8b" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="204.8" font-size="6" text-anchor="middle" fill="#ff4f8b">でんし部品</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${nc}" filter="url(#soft)"/>${lv.charger ? charger : ''}<g class="iso-only">
      <path d="M10 40h20v20h24v-30h20M10 70h40v14h24M20 30v-12h44" fill="none" ${ln}/>${[[30, 40], [54, 60], [50, 84], [20, 18], [64, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="rgba(63,244,255,.15)" ${ln}/>`).join('')}
      ${lv.charger ? '' : `<text class="sign" x="42" y="140" font-size="16" text-anchor="middle" fill="rgba(63,244,255,.12)" stroke="rgba(63,244,255,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">8-BIT</text>`}
      <text class="label" x="42" y="186" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(63,244,255,.6)">GADGET · PARTS · 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    // touchscreen tiles: an icon, the name, the price (flat: it is a screen, nothing is raised)
    const tile = (k, p) => { const x = 6 + k * 17.5, y = 151, fs = Math.min(2.3, 15.4 / (p.jp || p.name).length);
      return `<g class="hit pk-tile" data-hit="menu" data-k="${k}"><rect class="pk-tilebg" x="${x}" y="${y}" width="16" height="25" rx="1.6"/><rect class="pk-tglow nohit" x="${x}" y="${y}" width="16" height="25" rx="1.6" fill="${nc}" opacity="0"/>
        <g transform="translate(${x + 2.6} ${y + 1}) scale(.45)">${icon(p.g, p.fill)}</g><text x="${x + 8}" y="${y + 15.6}" font-size="${f(fs)}" text-anchor="middle" class="sign pk-tname">${p.jp || p.name}</text>
        <text x="${x + 8}" y="${y + 20}" font-size="2.6" text-anchor="middle" class="pk-price">${UTIL.money(p.price)}</text><rect class="led" x="${x + 5}" y="${y + 22}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 8}" y="${y + 7}" font-size="3.4" text-anchor="middle">売切</text></g>`; };
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM6 22V146H92V22Z" fill-rule="evenodd"/>
      ${R3(4, 4, 112, 15, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="15" rx="2.5" style="stroke:${nc}"/>
        <text class="lit-text sign on" style="--lc:${nc}" x="40" y="15.6" font-size="10" text-anchor="middle" filter="url(#soft)">ピコ堂</text>
        <text class="label" x="94" y="10.4" font-size="2.8" text-anchor="middle" letter-spacing=".4">GADGET · PARTS</text><text class="label" x="94" y="15" font-size="2.8" text-anchor="middle" letter-spacing=".4">24H</text>`, { noCap: true })}
      ${SK(6, 22, 86, 124, 4, { hole: true })}
      <rect class="dglass nohit" x="6" y="22" width="86" height="124"/><path class="nohit" d="M14 22L26 22L8 146H-4Z" fill="#fff" opacity=".045"/><path class="nohit" d="M60 22L66 22L48 146H42Z" fill="#fff" opacity=".035"/>
      <rect class="pk-screen" x="5" y="149" width="88" height="29" rx="2.4"/>
      ${menu.map((p, k) => tile(k, p)).join('')}
      <g class="pk-boot nohit" style="display:none"><rect x="5" y="149" width="88" height="29" rx="2.4" fill="#05070c"/><text class="pk-boottext" x="49" y="159.6" font-size="3.6" text-anchor="middle">PICO-OS 再起動中…</text>
        <rect x="19" y="164" width="60" height="3" rx="1" fill="none" stroke="rgba(63,244,255,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect class="pk-bootbar" x="19" y="164" width="0" height="3" rx="1" fill="${nc}"/><text class="pk-bootleft" x="49" y="173" font-size="2.8" text-anchor="middle" fill="#6a7484">あと 20 秒</text></g>
      ${R3(100, 46, 10, 15, 1.6, `<rect class="recess" x="104.2" y="48" width="1.6" height="11" rx=".6"/><rect class="pk-slotglow" x="98.6" y="44.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="65" font-size="2.6" text-anchor="middle">COIN</text>
      ${R3(95, 70, 20, 14, 1, `<path class="hair" d="M101 77a3 3 0 0 1 0-1M103 78.5a5 5 0 0 0 0-4M105 80a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="78.6" font-size="3" text-anchor="middle">IC</text><text class="label" x="105" y="82.6" font-size="2.2" text-anchor="middle">タッチ決済</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 92, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 92h4"/>' })}<text class="label" x="105" y="100" font-size="2.6" text-anchor="middle">返却</text>
      <g data-hit="cup" class="hit">${SK(97, 103, 16, 11, 3.5, { r: 2 })}</g><text class="label" x="105" y="118" font-size="2.6" text-anchor="middle">おつり</text>
      ${R3(95, 121, 20, 7, .8, `<text class="lit-text pk-reboot" style="--lc:var(--red)" x="105" y="126" font-size="3.1" text-anchor="middle">再起動中</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 136)}
      ${lv.ctrl ? `<g class="nohit" transform="translate(95 156)"><rect width="20" height="12" rx="1" fill="#0f3a2a" stroke="#d6b45a" stroke-width=".5" vector-effect="non-scaling-stroke"/>${[0, 1, 2, 3, 4].map(i => `<path d="M${3 + i * 3.5} 0v-1.4M${3 + i * 3.5} 12v1.4" stroke="#d6b45a" stroke-width=".6"/>`).join('')}<text x="10" y="5.2" font-size="2.5" text-anchor="middle" fill="#3ff4ff" class="label">PICO-OS</text><text x="10" y="9.8" font-size="3.4" text-anchor="middle" fill="#fff" class="sign">${lv.ctrl > 1 ? 'v3' : 'v2'}</text></g>` : ''}
      ${lv.arm2 ? `<g class="nohit" transform="translate(7 190)"><rect width="26" height="15" rx="2" fill="#071820" stroke="${nc}" stroke-width=".7" vector-effect="non-scaling-stroke"/>${[6, 20].map((x, i) => `<path d="M${x} 2.4v3.4l${i ? -3 : 3} 2.4v1.8" fill="none" stroke="${nc}" stroke-width=".9" stroke-linecap="round"/>`).join('')}<text x="13" y="13" font-size="3" text-anchor="middle" fill="${nc}" class="sign">Wアーム</text></g>` : ''}
      ${lv.charger ? `<g class="nohit" transform="translate(95 173)"><rect width="20" height="12" rx="2" fill="#ffd23f" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M6.4 1.4L3.6 6.6h2.6l-1.2 4.2 4-6h-2.6l1.4-3.4z" fill="#141018"/><text x="14" y="5.4" font-size="2.7" text-anchor="middle" fill="#141018" class="sign">充電</text><text x="14" y="9.6" font-size="2.7" text-anchor="middle" fill="#141018" class="sign">OK</text></g>` : ''}
      ${R3(36, 186, 48, 6, .8, `<text class="lit-text pk-ready" style="--lc:${nc}" x="60" y="190.6" font-size="3.1" text-anchor="middle">お取りください</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(36, 195, 48, 24, 6, { r: 3 })}</g>
      <rect class="pk-flap nohit" x="37" y="196" width="46" height="8" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="label" x="60" y="224" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM6 22V146H92V22Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="6" y="22" width="86" height="124"/>
      <rect class="face" x="5" y="149" width="88" height="29" rx="2"/><path class="wire2" d="M12 163H60M112 30V230M112 160H94M112 200H60"/><path class="hair" d="M117 20V220"/><rect class="face" x="113" y="136" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'pk-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'pk-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.pk-tile')],
      slotGlow: door.querySelector('.pk-slotglow'), ready: door.querySelector('.pk-ready'), flap: door.querySelector('.pk-flap'), reboot: door.querySelector('.pk-reboot'),
      boot: door.querySelector('.pk-boot'), bootBar: door.querySelector('.pk-bootbar'), bootLeft: door.querySelector('.pk-bootleft'), bootText: door.querySelector('.pk-boottext'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="6" y="22" width="86" height="124"/><rect class="xline" x="5" y="149" width="88" height="29"/><rect class="xline" x="36" y="195" width="48" height="24" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, gantry, use, vars, icon, bagOf };
})();
