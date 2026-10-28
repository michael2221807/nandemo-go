/* Fig 3 · カップ式「ヨルカフェ」— geometry. A turntable carries each cup: cup tube (back-left) -> ice, powders,
   hot water and mixer (back-right) -> viewing window (front). Canisters along the back, boiler back-left, ice maker top-right. */
const CU = (() => {
  const W = 120, D = 84, H = 240;
  const TT = { x: 50, y: 52, z: 58, r: 25, rh: 18 };            // turntable centre, top, disc radius, holder ring radius
  const holder = a => [TT.x + TT.rh * Math.cos(a), TT.y + TT.rh * Math.sin(a), TT.z];
  const BL = 210 * Math.PI / 180, BR = 330 * Math.PI / 180, FR = 90 * Math.PI / 180;
  const CANS = [{ name: '珈琲', c: '#5a3620' }, { name: 'ココア', c: '#8a5434' }, { name: '抹茶', c: '#7fb85a' }, { name: 'ミルク', c: '#efe7d6' }];
  const CAN_X = i => 46 + i * 11;                                // canister left edge
  const DRINKS = [
    { name: 'ブレンド', price: 120, hot: true, pw: [0], liq: '#3e2414' },
    { name: 'カフェラテ', price: 150, hot: true, pw: [0, 3], liq: '#b48558' },
    { name: 'ココア', price: 140, hot: true, pw: [1, 3], liq: '#74472a' },
    { name: '抹茶ラテ', price: 170, ice: true, pw: [2, 3], liq: '#93c46e' },
    { name: 'アイスコーヒー', price: 130, ice: true, pw: [0], liq: '#2e1b0f' },
    { name: 'レモンティー', price: 130, ice: true, pw: [], liq: '#e6c056' },
  ];
  const BR_PT = holder(BR), BOWL = [BR_PT[0], BR_PT[1], 128], NOZZLE_Z = 106, TUBE = holder(BL);
  return { W, D, H, TT, holder, BL, BR, FR, CANS, CAN_X, DRINKS, BOWL, NOZZLE_Z, TUBE, SLOTW: [105, D, 207], BOILER: [16, 16], ICE: [94, 10, 170] };
})();

const CUB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, TT, CANS, CAN_X, BOWL, NOZZLE_Z, TUBE } = CU;
  const { hull, ringZ, toD } = GLY;
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  /* ---------- the three upgrade kits (lv: { turret, turbo, mill }), 2026-10-18 ---------- */
  // カップターレット: three cup tubes round a shaft; the one over the turntable (where the single tube stood) is in use.
  // Counts by position (0 = in use, 1 and 2 the next ones round); phi turns the whole turret
  const TC = [TUBE[0] - 10, TUBE[1]], TR = 10, PER = 30;
  const turretCounts = n => { if (n <= 0) return [0, 0, 0]; const nf = Math.floor((n - 1) / PER); return [n - PER * nf, nf >= 1 ? PER : 0, nf >= 2 ? PER : 0]; };
  const stackSVG = (x, y, n) => n ? ISO.rounded(x - 6.2, y - 6.2, 118, 12.4, 12.4, 8 + n * 2.2, 6.2, 'cupstack')
    + Array.from({ length: Math.min(n, PER) }, (_, k) => `<path class="detail" d="${toD(ringZ(126 + k * 2.2, 6.25, 16, GLY.vz()[0], GLY.vz()[1], x, y), false)}"/>`).join('') : '';
  function turretSVG(counts, phi = 0) {
    return [0, 1, 2].map(p => { const a = phi + p * 2 * Math.PI / 3; return { x: TC[0] + TR * Math.cos(a), y: TC[1] + TR * Math.sin(a), n: counts[p] }; })
      .sort((u, v) => P(u.x, u.y, 116)[1] - P(v.x, v.y, 116)[1])
      .map(t => stackSVG(t.x, t.y, t.n) + rounded(t.x - 7.4, t.y - 7.4, 116, 14.8, 14.8, 112, 7.4, 'tubeglass')).join('');
  }
  const turretTop = () => `<path class="hair" d="${path([[TC[0], TC[1], 112], [TC[0], TC[1], 229]])}" style="stroke-width:2.4"/>` + rounded(TC[0] - 18, TC[1] - 18, 228.4, 36, 36, 1.6, 18, 'cu-plate')
    + box(TC[0] - 4, TC[1] - 4, 230, 8, 8, 6) + `<g transform="${FRONT(TC[0] - 4, TC[1] + 4.05, 236)}"><rect width="8" height="2.6" fill="var(--amber)"/><text x="4" y="2.1" font-size="1.8" text-anchor="middle" fill="#141018" class="sign">90</text></g>`;
  const turretGhost = () => CORE.edges(TC[0] - 18, TC[1] - 18, 116, 36, 36, 114, 'ugh');
  // 高速ホイッパー: the whipper motor under the mixing bowl, twice the size, with cooling fins and a red tag
  const turboKit = () => box(BOWL[0] - 4.5, BOWL[1] - 4.5, 108.6, 9, 9, 11.4, 0, 'cu-turbo') + `<g transform="${FRONT(BOWL[0] - 4.5, BOWL[1] + 4.55, 120)}">${slits(1.4, 7.6, 1.1, 1.6, 6.4, true, 'hpfin')}<rect x="1.4" y="8" width="6.2" height="2.6" rx=".4" fill="#e8322a"/><text x="4.5" y="10" font-size="1.7" text-anchor="middle" fill="#fff" class="sign">TURBO</text></g>`;
  const turboGhost = () => CORE.edges(BOWL[0] - 4.5, BOWL[1] - 4.5, 108.6, 9, 9, 11.4, 'ugh');
  // ミル: a clear bean hopper, the burr grinder under it, a chute down to the bowl
  const MILL = { x: 37, y: 16, z: 186 };
  const millKit = () => box(MILL.x - 5, MILL.y - 5, MILL.z, 10, 10, 13, 0, 'cu-mill') + `<g transform="${FRONT(MILL.x - 5, MILL.y + 5.05, MILL.z + 13)}"><circle cx="5" cy="5.6" r="3.2" class="face"/><g class="cu-burr" transform="translate(5 5.6)"><path class="hair" d="M-2.6 0H2.6M0-2.6V2.6M-1.8-1.8L1.8 1.8M1.8-1.8L-1.8 1.8"/></g><text x="5" y="12" font-size="1.8" text-anchor="middle" fill="var(--amber)" class="label">MILL</text></g>`
    + `<path d="${toD(hull([...ringZ(MILL.z + 13, 3.4, 18, 0, Math.PI * 2, MILL.x, MILL.y), ...ringZ(MILL.z + 36, 6, 18, 0, Math.PI * 2, MILL.x, MILL.y)]))}" style="fill:rgba(225,240,252,.18);stroke:rgba(225,240,252,.55);stroke-width:.6;vector-effect:non-scaling-stroke"/>`
    + `<path class="cu-beans" d="${toD(hull([...ringZ(MILL.z + 14, 3.2, 18, 0, Math.PI * 2, MILL.x, MILL.y), ...ringZ(MILL.z + 29, 5.2, 18, 0, Math.PI * 2, MILL.x, MILL.y)]))}"/>`
    + `<path class="chute" d="${path([[MILL.x + 2, MILL.y + 5, MILL.z + 1], [BOWL[0] - 2, BOWL[1] - 2, BOWL[2] + 6]])}"/>`;
  const millGhost = () => CORE.edges(MILL.x - 5, MILL.y - 5, MILL.z, 10, 10, 36, 'ugh');
  // a paper cup at the origin (screen-relative), with liquid at level 0..1 and optional ice
  function cupSVG(level, liq, ice) {
    const r0 = 4.4, r1 = 6.2, h = 10, L = 1 + level * 8;
    let s = `<path d="${toD(hull([...ringZ(0, r0), ...ringZ(h, r1)]))}" style="fill:#f2ede4;stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke"/>`;
    { const [a, b] = GLY.vz(); s += `<path d="${toD([...ringZ(3, r0 + .7, 12, a + .08, b - .08), ...ringZ(5.6, r0 + 1.2, 12, b - .08, a + .08)])}" fill="var(--amber)"/>`; }
    s += `<path d="${toD(ringZ(h, r1))}" style="fill:#e3dccd;stroke:rgba(0,0,0,.4);stroke-width:.6;vector-effect:non-scaling-stroke"/>`;
    if (level > .01) {
      s += `<path d="${toD(ringZ(L, r0 + (r1 - r0) * L / h - .35))}" fill="${liq}"/>`;
      if (ice) s += [[-1.6, -1], [1.4, .6], [-.2, 2]].map(([x, y]) => { const p = P(x, y, L + .2); return `<rect x="${f(p[0] - 1)}" y="${f(p[1] - .9)}" width="2" height="1.8" rx=".3" fill="rgba(220,240,255,.85)"/>`; }).join('');
    }
    return s;
  }
  function interior(g, coinState, lv = {}) {
    const RT = ISO.right;
    // drip tray under everything
    g.insertAdjacentHTML('beforeend', CORE.shell(W, D, H) + `<g transform="${TOP(14, 30, 20)}"><rect class="recess" width="70" height="40" rx="3"/>${slits(4, 66, 4, 2, 38, true)}</g>`);
    // the right-hand column (ice maker on top, coin path + board below) is nearest from the right and farthest from the left
    let cm, iceBin;
    const icePts = [[104, 34, 168], [BOWL[0] + 5, BOWL[1] + 2, 96]];
    const iceMaker = () => { g.insertAdjacentHTML('beforeend', box(94, 10, 170, 22, 30, 52) + `<path class="chute ice" d="${path(icePts)}"/>`); iceBin = UTIL.g(g, '', { transform: FRONT(95.5, 40.05, 214) }); };
    const service = () => { cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState); };
    if (!RT) { service(); iceMaker(); }
    // boiler (back-left) with a heater and a level gauge
    let s = rounded(6, 6, 4, 20, 20, 66, 10) + `<g transform="${FRONT(7.5, 23.5, 60)}"><path class="heater" d="M3 40h10v-3H3v-3h10v-3H3v-3h10"/><rect x="14.5" y="4" width="2.4" height="44" rx="1.2" fill="#0b0d11" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>`;
    // canisters with see-through fronts, augers and chutes to the bowl (nearest canister last)
    s += (RT ? [0, 1, 2, 3] : [3, 2, 1, 0]).map(i => box(CAN_X(i), 10, 150, 10, 16, 56) + `<g transform="${TOP(CAN_X(i), 10, 206)}"><rect class="detail" x="2" y="3" width="6" height="10" rx="1"/></g>`).join('');
    g.insertAdjacentHTML('beforeend', s);
    const levels = CANS.map((cn, i) => UTIL.g(g, '', { transform: FRONT(CAN_X(i) + 1.5, 26.05, 204) }));
    g.insertAdjacentHTML('beforeend', CANS.map((cn, i) => `<g transform="${FRONT(CAN_X(i), 26.1, 210)}"><text class="label sign" x="5" y="2.8" font-size="3" text-anchor="middle">${cn.name}</text></g>`).join(''));
    const augers = CANS.map((cn, i) => UTIL.g(g, '', { class: 'cu-auger' }));
    g.insertAdjacentHTML('beforeend', CANS.map((cn, i) => `<path class="chute" d="${path([[CAN_X(i) + 5, 33, 149], [BOWL[0], BOWL[1], BOWL[2] + 6]])}"/>`).join(''));
    // boiler pipe with a pump, mixing bowl, nozzle
    const pipe = [[16, 16, 70], [16, 16, 140], [BOWL[0] - 6, BOWL[1] - 4, 140], [BOWL[0] - 6, BOWL[1] - 4, BOWL[2] + 5]];
    g.insertAdjacentHTML('beforeend', `<path class="wire2" d="${path(pipe)}" style="stroke:#3a3226;stroke-width:2"/><path class="pulse hot cu-water" pathLength="1000" d="${path(pipe)}"/>` + box(13, 13, 104, 6, 6, 8));
    const bowl = UTIL.g(g, `<path d="${toD(hull([...ringZ(-8, 3), ...ringZ(0, 9)]))}" transform="translate(${f(P(...BOWL)[0])} ${f(P(...BOWL)[1])})" class="face" style="fill:#151a20"/>
      <path d="${toD(ringZ(0, 9))}" transform="translate(${f(P(...BOWL)[0])} ${f(P(...BOWL)[1])})" class="recess"/>`, { class: 'cu-bowl' });
    const swirl = UTIL.el('path', { class: 'cu-swirl', transform: `translate(${f(P(...BOWL)[0])} ${f(P(...BOWL)[1])})`, d: '' }, g);
    g.insertAdjacentHTML('beforeend', (lv.turbo ? `<g data-part="turbo">${turboKit()}</g>` : box(BOWL[0] - 2.5, BOWL[1] - 2.5, 110, 5, 5, 10) + `<g class="ugh-g">${turboGhost()}</g>`)
      + `<path class="hair" d="${path([[BOWL[0], BOWL[1], lv.turbo ? 108.6 : 110], [BOWL[0], BOWL[1], NOZZLE_Z]])}" style="stroke-width:2"/>`);
    const stream = UTIL.el('path', { class: 'cu-stream', d: path([[BOWL[0], BOWL[1], NOZZLE_Z], [BOWL[0], BOWL[1], TT.z + 4]]) }, g);
    // cup tube with its stack and separator gears
    if (!lv.turret) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${turretGhost()}</g>`);
    g.insertAdjacentHTML('beforeend', lv.mill ? `<g data-part="mill">${millKit()}</g>` : `<g class="ugh-g">${millGhost()}</g>`);
    const stack = UTIL.g(g, '', lv.turret ? { class: 'cu-stack', 'data-part': 'turret' } : { class: 'cu-stack' });
    g.insertAdjacentHTML('beforeend', (lv.turret ? `<g data-part="turret">${turretTop()}</g>` : rounded(TUBE[0] - 7.4, TUBE[1] - 7.4, 116, 14.8, 14.8, 112, 7.4, 'tubeglass'))
      + `<g transform="${FRONT(TUBE[0] - 9, TUBE[1] + 8, 120)}">${[[3, 3], [15, 3]].map(([x, y]) => `<g class="cu-gear" transform="translate(${x} ${y})"><circle class="face" r="2.6"/><path class="hair" d="M-2.6 0H2.6M0-2.6V2.6M-1.8-1.8L1.8 1.8M1.8-1.8L-1.8 1.8"/></g>`).join('')}</g>`);
    // ice maker (top right) with a chute to the back-right holder
    if (RT) iceMaker();
    // turntable: base and shaft, disc, three holders and the cups riding on them
    g.insertAdjacentHTML('beforeend', box(TT.x - 6, TT.y - 6, 4, 12, 12, 10) + `<path class="hair" d="${path([[TT.x, TT.y, TT.z], [TT.x, TT.y, 6]])}" style="stroke-width:3"/>` + rounded(TT.x - TT.r, TT.y - TT.r, TT.z - 3, TT.r * 2, TT.r * 2, 3, TT.r));
    const holders = [0, 1, 2].map(() => UTIL.el('ellipse', { class: 'recess' }, g));
    const cupsG = UTIL.g(g, '', { class: 'cu-cups' });
    const movers = UTIL.g(g, '', { class: 'cu-movers' });
    // service column
    if (RT) service();
    g.insertAdjacentHTML('beforeend', `<path class="tubelight" d="${path([[44, 80, 118], [86, 80, 118]])}"/><ellipse class="lamp-light on" transform="${TOP(50, 70, TT.z + .2)}" rx="14" ry="11" fill="var(--amber)" fill-opacity=".18" filter="url(#bloom-s)"/>`);
    g.insertAdjacentHTML('beforeend', (lv.turret ? '' : pin('turret', TC[0], TC[1] + 6, 214)) + (lv.turbo ? '' : pin('turbo', BOWL[0], BOWL[1] + 4, 112)) + (lv.mill ? '' : pin('mill', MILL.x, MILL.y + 4, 206)));
    return { levels, augers, bowl, swirl, stream, stack, iceBin, holders, cupsG, movers, cm, water: g.querySelector('.cu-water'), gears: [...g.querySelectorAll('.cu-gear')],
      turret: !!lv.turret, burr: g.querySelector('.cu-burr'), beans: g.querySelector('.cu-beans') };
  }
  function exterior(g, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk;
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // right side: 珈琲 + a steaming cup; left side: the night (a crescent moon, stars) over a big 夜
    const ln = 'stroke="rgba(255,169,64,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"';
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="var(--amber)" filter="url(#soft)"/>
      ${['珈', '琲'].map((ch, i) => `<text class="sign" x="42" y="${62 + i * 36}" font-size="30" text-anchor="middle" fill="rgba(255,169,64,.12)" stroke="rgba(255,169,64,.4)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <path d="M30 140q-4-6 0-12t0-12M42 140q-4-6 0-12t0-12M54 140q-4-6 0-12t0-12" fill="none" stroke="var(--amber)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".55"/>
      <rect x="22" y="146" width="40" height="22" rx="3" fill="none" stroke="var(--amber)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".55"/>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="var(--amber)" filter="url(#soft)"/><g class="iso-only">
      <path d="M50 28a22 22 0 1 0 14 38a18 18 0 1 1-14-38z" fill="rgba(255,169,64,.08)" ${ln}/>
      ${[[20, 34, 2.2], [68, 30, 1.6], [64, 84, 1.8], [16, 92, 1.4]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2}L${x + r * .6} ${y - r * .6}L${x + r * 2} ${y}L${x + r * .6} ${y + r * .6}L${x} ${y + r * 2}L${x - r * .6} ${y + r * .6}L${x - r * 2} ${y}L${x - r * .6} ${y - r * .6}Z" fill="rgba(255,169,64,.3)"/>`).join('')}
      <text class="sign" x="42" y="148" font-size="40" text-anchor="middle" fill="rgba(255,169,64,.1)" stroke="rgba(255,169,64,.4)" stroke-width=".5" vector-effect="non-scaling-stroke">夜</text>
      <path d="M30 172h24l-2.4 16h-19.2z" fill="rgba(255,169,64,.06)" ${ln}/><path d="M54 175h3a3 3 0 0 1 0 6h-4" fill="none" ${ln}/><path d="M36 168q-2-3 0-6M42 168q-2-3 0-6M48 168q-2-3 0-6" fill="none" ${ln}/>
      <text class="label" x="42" y="196" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,169,64,.6)">NIGHT CAFE · 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, d) => { const c = k % 3, r = Math.floor(k / 3), x = 6 + c * 28, y = 26 + r * 41;
      const art = d.ice ? `<path d="M${x + 8} ${y + 10}h10l-1.4 13h-7.2z" fill="rgba(170,210,240,.12)" stroke="var(--ice)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="${x + 10}" y="${y + 13}" width="2.6" height="2.4" fill="none" stroke="var(--cyan)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="${x + 13.6}" y="${y + 15}" width="2.6" height="2.4" fill="none" stroke="var(--cyan)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M${x + 10.6} ${y + 18}h5" stroke="${d.liq}" stroke-width="2.4" vector-effect="non-scaling-stroke"/>`
        : `<path d="M${x + 8} ${y + 12}h10l-1 10h-8z" fill="#f2ede4" opacity=".9"/><path d="M${x + 18} ${y + 14}h1.6a2 2 0 0 1 0 4H${x + 17.4}" fill="none" stroke="#f2ede4" stroke-width=".9" vector-effect="non-scaling-stroke"/><ellipse cx="${x + 13}" cy="${y + 12}" rx="5" ry="1.2" fill="${d.liq}"/><path d="M${x + 11} ${y + 9}q-1-1.6 0-3.2M${x + 14} ${y + 9}q-1-1.6 0-3.2" fill="none" stroke="var(--ink-hi)" stroke-width=".6" vector-effect="non-scaling-stroke" opacity=".7"/>`;
      return R3(x, y, 26, 38, 1, `<rect class="cu-tglow nohit" x="${x}" y="${y}" width="26" height="38" rx="2" fill="var(--amber)" opacity="0" filter="url(#bloom-s)"/>${art}
        <text x="${x + 13}" y="${y + 28}" font-size="3.3" text-anchor="middle" class="sign tiletext">${d.jp || d.name}</text><text x="${x + 13}" y="${y + 32.4}" font-size="2.8" text-anchor="middle" class="label">${UTIL.money(d.price)}</text>
        <rect x="${x + 2}" y="${y + 2}" width="7.4" height="3.4" rx=".8" fill="var(--${d.ice ? 'blue' : 'red'})"/><text x="${x + 5.7}" y="${y + 4.6}" font-size="2.2" text-anchor="middle" fill="#fff">${d.ice ? 'ICE' : 'HOT'}</text>
        <rect class="led" x="${x + 9}" y="${y + 34.6}" width="8" height="1.4" rx=".6"/><text class="soldout" x="${x + 13}" y="${y + 36.4}" font-size="2.6" text-anchor="middle">売切</text>
        ${d.mill ? `<circle cx="${x + 21.6}" cy="${y + 5.4}" r="3" fill="#5a3418" stroke="#f4e6c8" stroke-width=".5" vector-effect="non-scaling-stroke"/><text x="${x + 21.6}" y="${y + 6.6}" font-size="3" text-anchor="middle" fill="#f4e6c8" class="sign">挽</text>` : ''}`,
        { r: 2, cls: 'hit cu-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    const bar = (lbl, y, cls) => `<text class="label" x="104" y="${y}" font-size="2.7" text-anchor="middle">${lbl}</text>`
      + R3(93, y + 1.5, 5, 5, 1, `<text class="label" x="95.5" y="${y + 5.2}" font-size="3.4" text-anchor="middle">−</text>`, { r: 1, cls: 'hit', attrs: `data-hit="${cls}-"` })
      + [0, 1, 2, 3, 4].map(i => `<rect class="led ${cls}" x="${99.4 + i * 2.3}" y="${y + 2.8}" width="1.6" height="2.4" rx=".4"/>`).join('')
      + R3(110.6, y + 1.5, 5, 5, 1, `<text class="label" x="113.1" y="${y + 5.3}" font-size="3.4" text-anchor="middle">+</text>`, { r: 1, cls: 'hit', attrs: `data-hit="${cls}+"` });
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM46 130V186H84V130Z" fill-rule="evenodd"/>
      ${R3(4, 4, 112, 18, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="18" rx="2.5" style="stroke:var(--amber)"/>
        <text class="lit-text sign on" style="--lc:var(--amber)" x="44" y="17.6" font-size="12" text-anchor="middle" filter="url(#soft)">ヨルカフェ</text>
        <text class="label" x="98" y="12" font-size="2.9" text-anchor="middle" letter-spacing=".4">CUP · HOT · ICE</text><text class="label" x="98" y="17" font-size="2.9" text-anchor="middle" letter-spacing=".4">挽きたて</text>`, { noCap: true })}
      ${CU.DRINKS.map((d, k) => tile(k, d)).join('')}
      ${R3(100, 26, 10, 15, 1.6, `<rect class="recess" x="104.2" y="28" width="1.6" height="11" rx=".6"/><rect class="cu-slotglow" x="98.6" y="24.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" filter="url(#soft)" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="45.6" font-size="2.6" text-anchor="middle">COIN</text>
      ${R3(95, 50, 20, 11, 1, `<path class="hair" d="M101 55.5a3 3 0 0 1 0-1M103 57a5 5 0 0 0 0-4M105 58.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="57" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${bar('さとう', 70, 'su')}${bar('ミルク', 86, 'mi')}
      ${CORE.knob(105, 108, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 108h4"/>' })}
      <g data-hit="cup" class="hit">${SK(97, 116, 16, 14, 3.5, { r: 2 })}</g><text class="label" x="105" y="135" font-size="2.6" text-anchor="middle">おつり</text>
      ${R3(50, 121, 30, 5.5, .8, `<text class="lit-text cu-readyt" style="--lc:var(--amber)" x="65" y="125" font-size="3" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      ${SK(46, 130, 38, 56, 4, { hole: true })}
      <rect class="nohit" x="45" y="129" width="40" height="58" rx="3" fill="none" stroke="var(--line)" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
      <g class="cu-win" data-hit="window"><rect class="hit" x="46" y="130" width="38" height="56" rx="2.5" fill="rgba(170,205,240,.06)" stroke="rgba(170,205,240,.35)" stroke-width="1" vector-effect="non-scaling-stroke"/><path class="nohit" d="M52 130L60 130L50 186H42Z" fill="#fff" opacity=".04"/><rect class="nohit" x="62" y="180" width="6" height="2" rx="1" fill="var(--line)"/></g>
      ${CORE.lock(100, 140)}
      ${lv.turret ? `<g class="nohit" transform="translate(8 134)"><rect width="34" height="9" rx="1.6" fill="#1a1410" stroke="var(--amber)" stroke-width=".7" vector-effect="non-scaling-stroke"/>${[0, 1, 2].map(i => `<path d="M${3 + i * 3.4} 2.2h2.6l-.4 4.8h-1.8z" fill="#f2ede4" opacity=".9"/>`).join('')}<text x="23" y="6.2" font-size="3.6" text-anchor="middle" fill="var(--amber)" class="sign">カップ 90</text></g>` : ''}
      ${lv.turbo ? R3(8, 147, 34, 8, .8, `<text class="lit-text on" style="--lc:#ff5a3a" x="25" y="152.6" font-size="4" text-anchor="middle" letter-spacing=".6">TURBO</text>`, { r: 1.5, capCls: 'readycap' }) : ''}
      ${lv.mill ? `<g class="nohit" transform="translate(25 172) rotate(-6)"><circle r="9.6" fill="#5a3418" stroke="#f4e6c8" stroke-width=".9" vector-effect="non-scaling-stroke"/><ellipse cx="0" cy="-4.4" rx="2" ry="1.4" fill="#a8743a"/><path d="M-1.4-4.4q1.4-.4 2.8 0" stroke="#5a3418" stroke-width=".4" fill="none"/><text y="0" font-size="3" text-anchor="middle" fill="#f4e6c8" class="sign">豆から</text><text y="3.6" font-size="3" text-anchor="middle" fill="#f4e6c8" class="sign">挽きます</text><text y="6.6" font-size="1.7" text-anchor="middle" fill="#f4e6c8" class="label">FRESH MILL</text></g>` : ''}
      <g transform="translate(8 192)"><rect width="104" height="33" rx="3" fill="#120d09" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
        ${[[14, 14], [24, 22], [34, 12], [82, 18], [92, 24]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.6" fill="none" stroke="var(--amber)" stroke-width=".8" vector-effect="non-scaling-stroke" opacity=".7" transform="rotate(-25 ${x} ${y})"/><path d="M${x - 2.6} ${y + 1}q2.6-2 5.2-2" fill="none" stroke="var(--amber)" stroke-width=".6" vector-effect="non-scaling-stroke" opacity=".7"/>`).join('')}
        <text class="sign" x="58" y="20" font-size="7" text-anchor="middle" fill="var(--amber)">一杯ずつ</text><text x="58" y="27" font-size="2.8" text-anchor="middle" fill="var(--ink)" letter-spacing=".5">MADE CUP BY CUP · 24H</text></g>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<rect class="face" width="120" height="240" style="fill:#101318"/><path class="face nohit" d="M0 0H120V240H0ZM46 130V186H84V130Z" fill-rule="evenodd" style="fill:#12151b"/>
      <rect class="face" x="6" y="24" width="86" height="84" rx="2"/><path class="wire2" d="M112 30V230M112 50H90M112 90H90M112 200H60"/><path class="hair" d="M117 20V220"/><rect class="face" x="113" y="140" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'cu-door', transform: FRONT(0, D, H) });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.cu-tile')], slotGlow: door.querySelector('.cu-slotglow'),
      win: door.querySelector('.cu-win'), readyT: door.querySelector('.cu-readyt'), su: [...door.querySelectorAll('.led.su')], mi: [...door.querySelectorAll('.led.mi')] };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="6" y="26" width="82" height="79"/><rect class="xline" x="46" y="130" width="38" height="56"/><rect class="xline" x="8" y="192" width="104" height="34"/><rect class="xline" x="93" y="70" width="23" height="24"/></g>`);
  }
  // refill props for the dock: powder pouch, cup sleeve, water jug, ice bag
  const defs = () => {
    const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
    const bag = `<g id="g-bag"><g transform="${SIDE(ISO.right ? 6 : -6, 2.4, 20)}"><rect width="4.8" height="20" style="fill:color-mix(in srgb,var(--c) 60%,#000)"/></g><g transform="${FRONT(-6, 2.4, 22)}"><path d="M.6 2h10.8l.6 20H0z" style="fill:var(--c);${ST}"/><rect y="2" width="12" height="2" fill="#fff" opacity=".4"/>
      <rect x="2.4" y="7" width="7.2" height="9" rx="1.2" fill="#fff" opacity=".9"/><text x="6" y="13" font-size="2.6" text-anchor="middle" fill="#1a130c" class="sign">粉</text></g></g>`;
    const sleeve = `<g id="g-sleeve"><path d="${toD(hull([...ringZ(0, 5.4), ...ringZ(26, 6.2)]))}" style="fill:rgba(240,236,228,.92);${ST}"/>${[4, 8, 12, 16, 20, 24].map(z => `<path d="${toD(ringZ(z, 5.6 + z * .025, 18, GLY.vz()[0], GLY.vz()[1]))}" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`).join('')}
      <path d="${toD(ringZ(26, 6.2))}" style="fill:#e7e0d2;${ST}"/><path d="${toD([...ringZ(10, 5.9, 12, GLY.vz()[0] + .08, GLY.vz()[1] - .08), ...ringZ(14, 6, 12, GLY.vz()[1] - .08, GLY.vz()[0] + .08)])}" fill="var(--amber)"/></g>`;
    const jug = `<g id="g-jug"><path d="${toD(hull([...ringZ(0, 6.6), ...ringZ(16, 6.6), ...ringZ(20, 3), ...ringZ(23, 2.4)]))}" style="fill:rgba(140,200,240,.45);stroke:rgba(220,240,255,.7);stroke-width:.6;vector-effect:non-scaling-stroke"/>
      <path d="${toD([...ringZ(4, 6.7, 12, GLY.vz()[0] + .08, GLY.vz()[1] - .08), ...ringZ(11, 6.7, 12, GLY.vz()[1] - .08, GLY.vz()[0] + .08)])}" fill="#fff" opacity=".85"/><path d="${toD(hull([...ringZ(23, 2.6, 12), ...ringZ(25.5, 2.6, 12)]))}" fill="var(--blue)"/></g>`;
    const ice = `<g id="g-icebag"><g transform="${FRONT(-6.5, 2.6, 18)}"><path d="M0 0h13l-1 18H1z" style="fill:rgba(170,215,245,.4);stroke:rgba(220,240,255,.75);stroke-width:.6;vector-effect:non-scaling-stroke"/>
      ${[[2.6, 7], [6.4, 9], [9, 6], [4, 12], [8, 13]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2.6" height="2.4" rx=".4" fill="none" stroke="var(--cyan)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`).join('')}<rect x="1" y="1.4" width="11" height="3" fill="var(--blue)" opacity=".8"/></g></g>`;
    return bag + sleeve + jug + ice;
  };
  return { interior, exterior, ghost, cupSVG, defs, turretSVG, turretCounts, PER, MILL };
})();
