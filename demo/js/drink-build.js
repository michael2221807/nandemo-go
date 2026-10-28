/* Fig 1 · 缶・ペット飲料自販機 — geometry and SVG for the shell, the see-through interior and the X-ray wireframe.
   Interior after the real layout: cans lie in serpentine racks held by a pedal; a solenoid releases one,
   a belt carries it to the chute; cold and hot rooms are split by an insulated wall with evaporator, heater and fan. */
const DK = (() => {
  const W = 120, D = 84, H = 240, R = 5.4, GAP = 11.25;
  const LANES = [
    { name: 'ミズイロ天然水', price: 110, c: 'ice', cap: 'blue', kind: 'bottle', hot: false },
    { name: 'メロンソーダ', price: 140, c: 'lime', kind: 'can', hot: false },
    { name: 'ピーチティー', price: 150, c: 'rose', cap: 'ice', kind: 'bottle', hot: false },
    { name: 'ホットコーヒー', price: 130, c: 'brown', kind: 'can', hot: true },
    { name: 'コーンスープ', price: 130, c: 'yellow', kind: 'can', hot: true },
  ];
  const colX = k => 12.25 + k * 16.4;
  // serpentine centreline (y, z), from the pedal (s = 0) up to the loader at the top. The standard rack has 5 runs;
  // the 加深 upgrade folds it 7 times in the same height (flatter runs, tighter turns): 28 -> 43 cans a lane.
  // The bottom stays put, so the pedal, the belt and the whole vend sequence are the same for both.
  const RACKS = [{ n: 5, top: 214, run: 5, turn: 12, cap: 28 }, { n: 7, top: 222, run: 3, turn: 11, cap: 43 }];
  function pathFor(i) {
    const { n, top, run, turn } = RACKS[i], yb = 14, yf = 72, pts = []; let z = top;
    for (let k = 0; k < n; k++) { const ys = k % 2 ? yf : yb, ye = k % 2 ? yb : yf; pts.push([ys, z], [ye, z - run]); z -= run + turn; }
    pts.push([yf, 124]); pts.reverse(); pts.push([14, 234]); return pts;
  }
  let rack = 0, PATH, segs, TOTAL;
  function setRack(i) {
    rack = Math.max(0, Math.min(RACKS.length - 1, i | 0)); PATH = pathFor(rack); segs = []; TOTAL = 0;
    for (let j = 0; j < PATH.length - 1; j++) { const a = PATH[j], b = PATH[j + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l, s0: TOTAL }); TOTAL += l; }
  }
  setRack(0);
  const at = s => { s = Math.max(0, s); for (const g of segs) if (s <= g.s0 + g.l) { const t = (s - g.s0) / g.l; return [g.a[0] + (g.b[0] - g.a[0]) * t, g.a[1] + (g.b[1] - g.a[1]) * t]; } return PATH[PATH.length - 1].slice(); };
  function offsetPoly(pts, d) {
    const nrm = (a, b) => { const dy = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dy, dz) || 1; return [-dz / l, dy / l]; };
    return pts.map((p, i) => {
      const n1 = i > 0 ? nrm(pts[i - 1], p) : null, n2 = i < pts.length - 1 ? nrm(p, pts[i + 1]) : null;
      let m = n1 && n2 ? [n1[0] + n2[0], n1[1] + n2[1]] : (n1 || n2); const ml = Math.hypot(m[0], m[1]) || 1; m = [m[0] / ml, m[1] / ml];
      const dot = n1 && n2 ? m[0] * n1[0] + m[1] * n1[1] : 1, k = d / Math.max(.4, dot);
      return [p[0] + m[0] * k, p[1] + m[1] * k];
    });
  }
  const TUBES = [{ v: 10, cls: 'c10', x: 97.5 }, { v: 50, cls: 'c50', x: 102.5 }, { v: 100, cls: 'c100', x: 107.5 }, { v: 500, cls: 'c500', x: 112.5 }];
  const SAMPLE_X = [14, 31, 48, 65, 82];
  // hp: the heat-pump switching room is fitted (lane 3 can run cold or hot)
  return { W, D, H, R, GAP, LANES, colX, at, offsetPoly, TUBES, SAMPLE_X, BELT_Z: 98, SHAFT_X: 94, TRAY: [56, 77, 27.4],
    TRACK: [[17, 3], [3, 10], [17, 17], [3, 24], [9, 31]], RACKS, pathFor, setRack, hp: false,
    get PATH() { return PATH; }, get TOTAL() { return TOTAL; }, get CAP() { return RACKS[rack].cap; }, get rack() { return rack; } };
})();

const DKB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, R, LANES, colX } = DK;
  const use = (id, x, y, z, lane, extra = '') => { const [sx, sy] = P(x, y, z), L = LANES[lane];
    return `<use href="#${id}" x="${f(sx)}" y="${f(sy)}" style="--c:var(--${L.c});--cap:var(--${L.cap || 'ice'})" ${extra}/>`; };
  const edges = (x, y, z, w, d, h, cls) => { const c = (i, j, k) => [x + i * w, y + j * d, z + k * h];
    const E = [[c(0, 0, 0), c(1, 0, 0)], [c(1, 0, 0), c(1, 1, 0)], [c(1, 1, 0), c(0, 1, 0)], [c(0, 1, 0), c(0, 0, 0)], [c(0, 0, 1), c(1, 0, 1)], [c(1, 0, 1), c(1, 1, 1)],
      [c(1, 1, 1), c(0, 1, 1)], [c(0, 1, 1), c(0, 0, 1)], [c(0, 0, 0), c(0, 0, 1)], [c(1, 0, 0), c(1, 0, 1)], [c(1, 1, 0), c(1, 1, 1)], [c(0, 1, 0), c(0, 1, 1)]];
    return E.map(e => `<path class="${cls}" d="${path(e)}"/>`).join(''); };

  /* ---------- interior ---------- */
  function interior(g) {
    const RT = ISO.right;   // camera on the right (default) or turned past the front to the left
    let s = `<g transform="${FRONT(3, 3, 237)}"><rect width="114" height="234" fill="#0a0c11" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${slits(12, 228, 12, 0, 114, false)}</g>`;
    s += `<g transform="${SIDE(RT ? 3 : 117, 81, 237)}"><rect width="78" height="234" fill="#0d1016" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${slits(10, 70, 12, 0, 234, true)}</g>`;
    s += `<g transform="${TOP(3, 3, 3)}"><rect width="114" height="78" fill="#0b0d12"/></g>`;
    // machinery bay (back, bottom): compressor, condenser coil, evaporator, heater, fan
    s += rounded(10, 10, 3, 26, 26, 28, 13) + rounded(17, 17, 31, 12, 12, 5, 6);
    s += `<g transform="${FRONT(40, 40, 56)}"><path class="hair" d="M2 4H40V10H2V16H40V22H2V28H40V34H2V40H40V46H8"/>${slits(5, 37, 3, 1, 49, true)}
      <path class="flow cold" pathLength="1000" d="M2 4H40V10H2V16H40V22H2V28H40V34H2V40H40V46H8"/></g>`;
    s += `<path class="hair" d="${path([[36, 22, 20], [40, 40, 52]])}"/><path class="hair" d="${path([[48, 40, 10], [30, 30, 66]])}"/>`;
    const evap = box(8, 10, 64, 44, 44, 20) + `<g transform="${FRONT(8, 54, 84)}">${slits(3, 41, 3, 2, 18, true, 'evap')}</g>`;
    const heater = `<g transform="${TOP(58, 14, 76)}"><path class="heater" d="M0 0H28V6H0V12H28V18H0V24H28V30H0V36H28"/></g>`;
    s += RT ? evap + heater : heater + evap;
    s += `<g transform="${FRONT(85, 56, 50)}"><circle class="face" cx="15" cy="16" r="15"/><circle class="recess" cx="15" cy="16" r="12.5"/>
      <g id="dk-fan" transform="translate(15 16)">${[0, 72, 144, 216, 288].map(a => `<path class="fanblade" transform="rotate(${a})" d="M0 0Q3-4 1.5-11Q-2.5-9-1.6-3Z"/>`).join('')}<circle class="face" r="2.4"/></g></g>`;
    // insulated storage floor + room glow
    s += `<g transform="${TOP(4, 4, 110)}"><rect width="86" height="77" fill="rgba(20,24,30,.55)" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${slits(4, 84, 5, 0, 77, true)}</g>`;
    // room glow: cold (blue) and hot (red); with the heat pump, lane 3 is its own room, glowing whichever way it runs
    s += `<g transform="${FRONT(4, 4, 226)}">` + (DK.hp ? `<rect width="33" height="114" fill="var(--blue)" fill-opacity=".09" filter="url(#bloom)"/>
      <rect x="33.6" width="16" height="114" fill="var(--${LANES[2].hot ? 'red' : 'blue'})" fill-opacity="${LANES[2].hot ? .13 : .09}" filter="url(#bloom)"/>`
      : `<rect width="49" height="114" fill="var(--blue)" fill-opacity=".09" filter="url(#bloom)"/>`) + `<rect x="50" width="38" height="114" fill="var(--red)" fill-opacity=".09" filter="url(#bloom)"/></g>`;
    // the heat pump's own exchanger above the evaporator (fins, a little fan) and its copper line from the compressor
    if (DK.hp) s += `<g data-part="heatpump" class="${LANES[2].hot ? 'hp-heat' : ''}">${box(36, 14, 88, 18, 36, 16, 0, 'hpbox')}<g transform="${FRONT(36, 50, 104)}">${slits(2, 16, 1.6, 1.5, 14.5, true, 'hpfin')}</g>
      <g transform="${TOP(45, 32, 104.02)}"><circle class="face" r="5.5"/><path class="hair" d="M-4 0H4M0-4V4"/></g>
      <path class="hppipe" d="${path([[23, 23, 31], [23, 30, 60], [40, 30, 60], [40, 30, 88]])}"/></g>`;
    else s += `<g class="ugh-g">${edges(36, 14, 88, 18, 36, 16, 'ugh')}</g>`;
    // belt conveyor under the racks
    s += box(5, 62, 94, 86, 16, 4) + `<g transform="${TOP(5, 62, 98.02)}"><line id="dk-belt" class="beltmark" x1="1" y1="8" x2="85" y2="8"/><line class="detail" x1="0" y1="2" x2="86" y2="2"/><line class="detail" x1="0" y1="14" x2="86" y2="14"/></g>`;
    s += [5.5, 89.5].map((x, i) => `<g transform="${FRONT(x, 78.2, 98)}"><circle class="face" r="3" cy="2"/><g class="roller" id="dk-roll${i}" transform="translate(0 2)"><path class="hair" d="M-2.4 0H2.4M0 -2.4V2.4"/></g></g>`).join('');
    g.insertAdjacentHTML('beforeend', s);
    const parts = UTIL.g(g, '', { id: 'dk-particles' });
    // service column (x 92-116): bill validator, coin validator with its zigzag track, coin tubes, control board.
    // It sits nearest the camera from the right and farthest from the left, so it is drawn after or before the racks.
    let tubes, coinG;
    const service = () => {
      let c = box(96, 64, 196, 20, 14, 9) + `<g transform="${FRONT(96, 78, 205)}"><rect class="recess" x="3" y="3" width="14" height="1.6"/></g>`;
      c += box(96, 62, 150, 20, 16, 36) + `<g transform="${FRONT(96, 78, 186)}"><path class="track" d="M${DK.TRACK.map(p => p.join(' ')).join('L')}"/><path class="detail" d="M${DK.TRACK.map(p => `${p[0]} ${p[1] + 1.6}`).join('L')}"/></g>`;
      c += `<g transform="${FRONT(92, 6, 98)}"><rect width="24" height="34" fill="#0c1512" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <path class="trace" d="M3 4H12V10H20M3 14H8V22H18M5 28H14V18M20 26V31"/>
        <rect class="face" x="9" y="12" width="7" height="6"/><rect class="face" x="14" y="24" width="6" height="4"/><rect class="face" x="3" y="18" width="4" height="7"/>
        <circle id="dk-led0" class="led on" cx="20" cy="5" r="1.2"/><circle id="dk-led1" class="led" cx="20" cy="9" r="1.2"/><circle id="dk-led2" class="led" cx="4" cy="30" r="1.2"/></g>`;
      g.insertAdjacentHTML('beforeend', c);
      tubes = [];
      (RT ? [0, 1, 2, 3] : [3, 2, 1, 0]).forEach(i => { tubes[i] = { ...DK.TUBES[i], g: UTIL.g(g, '', { class: 'tube' }) }; });
      g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(95, 76, 103.5)}"><rect class="face" width="21" height="5"/>${DK.TUBES.map((t, i) => `<text class="label" x="${2.5 + i * 5}" y="3.8" font-size="2.4" text-anchor="middle">${t.v}</text>`).join('')}</g>`);
      coinG = UTIL.g(g, '', { id: 'dk-coin' });
    };
    if (!RT) service();
    // racks: rails left and right of every lane, cans in between; nearest lane last
    const lanesG = [], pedals = [];
    const railA = DK.offsetPoly(DK.PATH, R + .8), railB = DK.offsetPoly(DK.PATH, -(R + .8));
    const rail = (x, pts, cls) => `<path class="${cls}" d="${path(pts.map(([y, z]) => [x, y, z]))}"/>`;
    // insulated walls between rooms: cold | hot, and with the heat pump a second wall that boxes lane 3 in
    const insul = (x, ghost) => UTIL.g(g, ghost ? `<g transform="${SIDE(x, 81, 226)}"><rect class="ugh" width="77" height="114"/></g>`
      : `<g transform="${SIDE(x, 81, 226)}"><rect width="77" height="114" fill="rgba(140,185,230,.05)" stroke="rgba(140,190,230,.35)" stroke-width="1" vector-effect="non-scaling-stroke"/>${slits(6, 72, 6, 0, 114, true, 'insul')}</g>`,
      x < 40 && DK.hp ? { 'data-part': 'heatpump' } : {});
    for (const k of RT ? [0, 1, 2, 3, 4] : [4, 3, 2, 1, 0]) {
      if (RT && k === 3) insul(53.6);
      if (RT && k === 2) insul(37.2, !DK.hp);
      const x = colX(k), xl = x - 7.7, xr = x + 7.7;
      const slab = GLY.hull([[xl, 8, 118], [xr, 8, 118], [xl, 80, 118], [xr, 80, 118], [xl, 8, 236], [xr, 8, 236], [xl, 80, 236], [xr, 80, 236]].map(p => P(...p)));
      const lg = UTIL.g(g, `<path d="${GLY.toD(slab)}" fill="transparent"/>${rail(xl, railA, 'rail')}${rail(xl, railB, 'rail')}`, { class: 'hit lane', 'data-hit': 'lane', 'data-k': k });
      lanesG[k] = lg;
      lg.insertAdjacentHTML('beforeend', rail(xr, railA, 'rail hi') + rail(xr, railB, 'rail hi') +
        `<path class="pedal" d="${path([[x - 6, 70, 118.4], [x + 6, 70, 118.4]])}"/>` + box(x + 2.5, 74, 111, 5, 5, 6, 0, 'sol'));
      pedals[k] = lg.querySelector('.pedal');
      if (!RT && k === 3) insul(53.6);
      if (!RT && k === 2) insul(37.2, !DK.hp);
    }
    // the deeper rack not fitted yet: its runs in dashed outline
    if (DK.rack < DK.RACKS.length - 1) { const nx = DK.pathFor(DK.rack + 1), a = DK.offsetPoly(nx, R + .8), b = DK.offsetPoly(nx, -(R + .8));
      g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${[0, 1, 2, 3, 4].map(k => rail(colX(k) + 7.7, a, 'ugh') + rail(colX(k) + 7.7, b, 'ugh')).join('')}</g>`); }
    // every can lives in one group so the painter order can follow the camera yaw
    const cansAll = UTIL.g(g, '', { class: 'cans-all' });
    // loader bar at the top, movers (released cans), chute frame and inner tray
    g.insertAdjacentHTML('beforeend', box(4, 9, 236, 86, 8, 1.6) + Array.from({ length: 5 }, (_, k) => `<path class="detail" d="${path([[colX(k) - 6, 13, 236], [colX(k), 13, 230], [colX(k) + 6, 13, 236]])}"/>`).join(''));
    const movers = UTIL.g(g, '', { id: 'dk-movers' });
    g.insertAdjacentHTML('beforeend', edges(88, 62, 60, 12, 18, 38, 'detail') + `<g transform="${TOP(12, 64, 21)}"><rect width="78" height="20" class="recess"/></g>`);
    const trayIn = UTIL.g(g, '', { id: 'dk-tray-in' });
    if (RT) service();
    const wires = [], pulses = [];
    for (let k = 0; k < 5; k++) {
      const pts = [[93, 7, 96], [90.5, 7, 116], [90.5, 81, 116], [colX(k) + 5, 81, 116], [colX(k) + 5, 79, 114]];
      g.insertAdjacentHTML('beforeend', `<path class="wire2" d="${path(pts)}"/><path class="pulse" pathLength="1000" d="${path(pts)}"/>`);
      pulses.push(g.lastElementChild);
    }
    g.insertAdjacentHTML('beforeend', `<path class="wire2" d="${path([[103, 70, 150], [103, 70, 128], [94, 7, 92]])}"/><path class="pulse" pathLength="1000" d="${path([[103, 70, 150], [103, 70, 128], [94, 7, 92]])}"/>`);
    const coinPulse = g.lastElementChild;
    g.insertAdjacentHTML('beforeend', `<path class="tubelight" d="${path([[6, 81, 223], [88, 81, 223]])}"/>`);
    // upgrade pins (only seen in X-ray): tap one to see the part
    const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
    g.insertAdjacentHTML('beforeend', (DK.rack < DK.RACKS.length - 1 ? pin('rack', colX(2), 78, 226) : '') + (DK.hp ? '' : pin('heatpump', 45, 50, 100)));
    return { lanesG, cansAll, pedals, movers, trayIn, tubes, coinG, pulses, coinPulse, parts, fan: g.querySelector('#dk-fan'),
      rollers: [g.querySelector('#dk-roll0'), g.querySelector('#dk-roll1')], belt: g.querySelector('#dk-belt'), leds: [0, 1, 2].map(i => g.querySelector('#dk-led' + i)) };
  }

  /* ---------- the shell: body (side, top, front frame, hinges, lid), a hinged door with raised / sunk parts,
     and the 3D display window (clipped to its opening) seen while the door is shut.
     Door-local coordinates: u = x across the door, v = 240 - z downward. Hinge on the left edge (x = 0, y = 84). */
  function exterior(g) {
    const sample = k => LANES[k].kind === 'bottle' ? 'bottle' : 'can';
    const vv = k => `--c:var(--${LANES[k].c});--cap:var(--${LANES[k].cap || 'ice'})`;
    const R3 = CORE.raised, SK = CORE.sunk;
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/><rect class="detail" x="5" y="5" width="110" height="230" rx="1.5"/></g>`;
    s += CORE.sidePanel(D, H);
    // right side: the name in big letters + cold / hot signs; left side: a big water drop over waves
    const ln = 'stroke="rgba(90,169,255,.4)" stroke-width=".7" vector-effect="non-scaling-stroke"';
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect data-l="dk" class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="var(--blue)" filter="url(#soft)"/>
      ${['ミ', 'ズ', 'イ', 'ロ'].map((ch, i) => `<text class="sign" x="42" y="${52 + i * 28}" font-size="23" text-anchor="middle" fill="rgba(90,169,255,.16)" stroke="rgba(90,169,255,.35)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="160" width="56" height="12" rx="2" fill="rgba(90,169,255,.12)" stroke="var(--blue)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="168.8" font-size="6" text-anchor="middle" fill="var(--blue)">つめた〜い</text>
      <rect x="14" y="176" width="56" height="12" rx="2" fill="rgba(255,90,78,.12)" stroke="var(--red)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="184.8" font-size="6" text-anchor="middle" fill="var(--red)">あったか〜い</text>`
      : `<rect data-l="dk" class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="var(--blue)" filter="url(#soft)"/><g class="iso-only">
      <path d="M42 22q-25 34-25 52a25 25 0 0 0 50 0q0-18-25-52z" fill="rgba(90,169,255,.07)" ${ln}/><path d="M30 76a12 12 0 0 0 9 11" fill="none" ${ln}/>
      ${[0, 1, 2, 3].map(i => `<path d="M8 ${122 + i * 9}q8.5-5 17 0t17 0t17 0t17 0" fill="none" ${ln} opacity="${(.9 - i * .18).toFixed(2)}"/>`).join('')}
      <text class="sign" x="42" y="174" font-size="15" text-anchor="middle" fill="rgba(90,169,255,.16)" stroke="rgba(90,169,255,.38)" stroke-width=".5" vector-effect="non-scaling-stroke">天然水</text>
      <text class="label" x="42" y="190" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(90,169,255,.6)">MIZUIRO · NATURAL WATER</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);

    // door: outer face
    let o = `<rect class="face front mshell door-face" width="120" height="240"/>`;
    o += R3(5, 5, 110, 22, 3, `<rect data-l="dk" class="glass on" x="5" y="5" width="110" height="22" rx="2.5"/>
      <text data-l="dk" class="lit-text sign on" style="--lc:var(--blue)" x="44" y="21.6" font-size="14" text-anchor="middle" filter="url(#soft)">ミズイロ</text>
      <text class="label" x="96" y="15" font-size="3.2" text-anchor="middle" letter-spacing=".4">COLD · HOT</text><text class="label" x="96" y="20" font-size="3.2" text-anchor="middle" letter-spacing=".4">24H</text>`, { noCap: true });
    o += `<g class="flatdisp" style="display:none"><rect x="5" y="31" width="85" height="47" fill="#0c0f15"/><rect x="5" y="69" width="85" height="3" fill="#1a1e25"/>
      ${DK.SAMPLE_X.map((x, k) => `<use href="#f-${sample(k)}" x="${x}" y="69" style="${vv(k)}"/>`).join('')}<rect class="dglass" x="5" y="31" width="85" height="47"/></g>`;
    o += DK.SAMPLE_X.map((x, k) => `<g transform="translate(${x - 6.5} 72.5)"><rect width="13" height="4.4" rx=".8" fill="var(--${LANES[k].hot ? 'red' : 'blue'})" opacity=".9"/><text x="6.5" y="3.4" font-size="3" text-anchor="middle" fill="#fff">${UTIL.money(LANES[k].price)}</text></g>`).join('');
    o += DK.SAMPLE_X.map(x => `<path class="dtrace" d="M105 86V92.5H${x}V87.5"/>`).join('') + DK.SAMPLE_X.map(x => `<path class="pulse dpulse" pathLength="1000" d="M105 86V92.5H${x}V87.5"/>`).join('');
    o += DK.SAMPLE_X.map((x, k) => R3(x - 6.5, 80, 13, 5.5, 1.6, `<rect class="led" x="${x - 3.5}" y="81.8" width="7" height="1.9" rx=".8"/><text class="soldout" x="${x}" y="84.3" font-size="3" text-anchor="middle">売切</text>`, { r: 1.6, cls: 'hit btn', attrs: `data-hit="btn" data-k="${k}"` })).join('');
    o += SK(5, 96, 85, 80, .8, { r: 3 }) + `<g transform="translate(5 96)"><rect width="85" height="80" rx="3" fill="#0b131d" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${[52, 58, 64, 70].map((y, i) => `<path d="M0 ${y}q10.6-${4 - i * .6} 21.2 0t21.2 0t21.2 0t21.4 0" fill="none" stroke="var(--blue)" stroke-width="1" vector-effect="non-scaling-stroke" opacity="${.75 - i * .15}"/>`).join('')}
      <circle cx="64" cy="24" r="13" fill="none" stroke="var(--cyan)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/>
      <path d="M64 13q-7.5 10-7.5 14a7.5 7.5 0 0 0 15 0q0-4-7.5-14z" fill="rgba(63,217,238,.14)" stroke="var(--cyan)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="sign" x="7" y="24" font-size="13" fill="var(--ice)">ミズイロ</text><text x="7" y="32" font-size="3.4" fill="var(--ink)" letter-spacing=".4">NATURAL · COLD · HOT</text>
      <text class="sign" x="7" y="42" font-size="6" fill="var(--blue)">天然水 · 110ml〜</text>
      <g transform="translate(66 74)"><rect x="-2" y="-6" width="18" height="8" rx="1.5" fill="var(--yellow)"/><path d="M0 0q0-3 2-3l1-2 1 2h2l1-2 1 2q2 0 2 3z" fill="#14161b"/><text x="11.5" y="-.6" font-size="2.6" fill="#14161b" text-anchor="middle" class="sign">ねこ</text></g></g>`;
    o += SK(94, 31, 22, 12, 1.4) + [0, 1, 2, 3].map(i => `<text id="dk-d${i}" class="lit-text" style="--lc:var(--accent-hi)" x="${97.4 + i * 5.1}" y="40.3" font-size="6" text-anchor="middle">7</text>`).join('')
      + `<text class="label" x="105" y="47.6" font-size="2.7" text-anchor="middle">あたりでもう1本</text>`;
    o += R3(95, 52, 20, 13, 1, `<path class="hair" d="M101 58.5a3 3 0 0 1 0-1M103 60a5 5 0 0 0 0-4M105 61.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="60.2" font-size="3" text-anchor="middle">IC</text>`, { r: 2.5, cls: 'hit', attrs: 'data-hit="ic"' });
    o += R3(100, 70, 10, 16, 1.6, `<rect class="recess" x="104.2" y="72" width="1.6" height="12" rx=".6"/><rect id="dk-slotglow" x="98.6" y="68.6" width="12.8" height="18.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" filter="url(#soft)" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })
      + `<text class="label" x="105" y="91" font-size="2.6" text-anchor="middle">COIN</text>`;
    o += R3(96, 96, 18, 5, 1, `<rect class="recess" x="98" y="98" width="14" height="1.2"/>`, { r: 1 }) + `<text class="label" x="105" y="105" font-size="2.6" text-anchor="middle">1000</text>`;
    o += CORE.knob(105, 113, 3.6, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 113h4"/>' }) + `<text class="label" x="105" y="121" font-size="2.6" text-anchor="middle">返却</text>`;
    o += `<g data-hit="cup" class="hit">${SK(97, 150, 16, 18, 3.5, { r: 2 })}</g><text class="label" x="105" y="172" font-size="2.6" text-anchor="middle">おつり</text>`;
    o += `<g data-hit="tray" class="hit">${SK(12, 184, 78, 36, 6, { r: 2.5 })}<rect id="dk-trayglow" class="nohit" x="14" y="192" width="74" height="26" rx="2" fill="var(--accent)" opacity="0" filter="url(#bloom-s)"/>
      <rect id="dk-flap" class="face" x="14" y="184" width="74" height="8" rx="1.5"/></g><text class="label" x="51" y="224.6" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>`;
    o += CORE.lock(101, 186);
    // fitted upgrades get a small plate on the door, under the coin return
    // fitted upgrades show on the door, each in its own way (2026-10-18; the generic plates went): a 大容量 sticker on
    // the poster's corner (the display window is drawn over the door), a red あったか〜い bar on the poster once lane 3 can heat
    if (DK.rack > 0) o += `<g class="nohit" transform="translate(69 99) rotate(5)"><rect width="20" height="7.6" rx="1.4" fill="#ffd23f" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><text x="10" y="3.9" font-size="3.1" text-anchor="middle" fill="#141018" class="sign">大容量</text><text x="10" y="6.6" font-size="2" text-anchor="middle" fill="#141018" class="label">${DK.CAP}本</text></g>`;
    if (DK.hp) o += R3(12, 140, 38, 6.6, .8, `<text class="lit-text on" style="--lc:var(--red)" x="31" y="145" font-size="3.8" text-anchor="middle">あったか〜い</text>`, { r: 1.5, capCls: 'readycap' });
    o += SK(6, 228, 108, 8, 1.2) + ISO.slits(229.5, 235, 1.8, 10, 110, false);
    // door: inner face (seen once it swings away from the camera); tap it to close
    const inn = `<rect class="face" width="120" height="240" style="fill:#101318"/><rect class="detail" x="6" y="6" width="108" height="228" rx="2"/>
      <rect class="face" x="5" y="5" width="110" height="22" rx="2"/><rect class="face" x="5" y="31" width="85" height="47"/>
      <rect class="face" x="94" y="60" width="22" height="64" rx="1.5"/>${ISO.slits(66, 118, 6, 96, 114, false)}
      <path class="wire2" d="M112 8V230M112 40H60V82M112 82H14M112 120H60V182M112 200H40"/>
      <path class="hair" d="M117 20V220"/><rect class="face" x="113" y="186" width="5" height="22" rx="1"/>
      <rect x="20" y="150" width="30" height="16" rx="1.5" fill="none" stroke="var(--yellow)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".6"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { id: 'dk-door', transform: FRONT(0, D, H) });

    // the 3D display (only while the door is shut), clipped to the window so nothing deep pokes past the frame
    g.insertAdjacentHTML('beforeend', `<clipPath id="dk-dispclip" clipPathUnits="userSpaceOnUse"><path d="${ISO.d3([[5, 84, 209], [90, 84, 209], [90, 84, 162], [5, 84, 162]])}"/></clipPath>`);
    let d3 = `<g transform="${FRONT(5, 76, 209)}"><rect width="85" height="47" fill="#0c0f15"/></g><g transform="${SIDE(ISO.right ? 5 : 90, 84, 209)}"><rect width="8" height="47" fill="#10141a"/></g>`;
    d3 += `<g data-l="dk" class="halo on"><g transform="${FRONT(5, 76, 209)}"><rect y="2" width="85" height="20" fill="var(--tube)" filter="url(#bloom-s)" opacity=".5"/></g></g>`;
    d3 += DK.SAMPLE_X.map((x, k) => `<g transform="${FRONT(x - 9, 76.4, 196)}"><rect class="shalo" width="18" height="26" rx="5" fill="var(--${LANES[k].c})" filter="url(#bloom-s)" opacity="0"/></g>`).join('');
    d3 += box(5, 76, 168, 85, 8, 3);
    d3 += DK.SAMPLE_X.map((x, k) => ({ x, k })).sort((a, b) => ISO.key(a.x, 80) - ISO.key(b.x, 80)).map(({ x, k }) => `<g data-hit="btn" data-k="${k}" class="hit">${use(sample(k) === 'bottle' ? 'g-bottle-up' : 'g-can-up', x, 80, 171, k)}</g>`).join('');
    d3 += `<g transform="${FRONT(5, D, 209)}"><rect class="dglass" width="85" height="47"/><path d="M8 0L22 0L6 47H-8Z" fill="#fff" opacity=".035"/><path d="M52 0L58 0L44 47H38Z" fill="#fff" opacity=".03"/>
      <rect data-l="dk" class="lamp-light on" x="2" y="1.2" width="81" height="1.6" rx=".8" fill="var(--tube)" filter="url(#soft)"/></g>`;
    const disp3d = UTIL.g(g, d3, { id: 'dk-disp3d', 'clip-path': 'url(#dk-dispclip)' });
    const trayOut = UTIL.g(g, '', { id: 'dk-tray-out', 'data-hit': 'tray', class: 'hit' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, disp3d, trayOut, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), flat: door.querySelector('.flatdisp'),
      digits: [0, 1, 2, 3].map(i => g.querySelector('#dk-d' + i)), buttons: [...door.querySelectorAll('.btn')], dpulses: [...door.querySelectorAll('.dpulse')],
      shalos: [...disp3d.querySelectorAll('.shalo')], slotGlow: g.querySelector('#dk-slotglow'), trayGlow: g.querySelector('#dk-trayglow'), flap: g.querySelector('#dk-flap') };
  }
  // door transform for an opening angle (radians): the panel rotates about the left hinge toward the viewer
  const doorTransform = a => ISO.plane([0, D, H], [Math.cos(a), Math.sin(a), 0], [0, 0, -1]);

  /* ---------- X-ray wireframe (shown above the scan line) ---------- */
  function ghost(g) {
    const fr = FRONT(0, D, H);
    let s = edges(0, 0, 0, W, D, H, 'xedge');
    s += `<g transform="${fr}"><rect class="xline" x="5" y="5" width="110" height="22" rx="2.5"/><rect class="xline" x="5" y="31" width="85" height="47"/><rect class="xline" x="5" y="90" width="85" height="86" rx="3"/>
      <rect class="xline" x="94" y="31" width="22" height="12"/><rect class="xline" x="100" y="70" width="10" height="16" rx="2"/><rect class="xline" x="12" y="184" width="78" height="36" rx="2.5"/><rect class="xline" x="97" y="150" width="16" height="18"/></g>`;
    g.insertAdjacentHTML('beforeend', s);
  }

  /* ---------- the cat: normal (in the shell layer) and X-rayed (in the wireframe layer) ---------- */
  const tailPts = k => [[80, 70, 241], [80, 85.5, 241], [80 + k, 86, 230], [82 + k * 2, 86, 221]];
  function cat(g, xray) {
    const body = rounded(72, 56, H, 28, 15, 10, 7, xray ? 'xcat' : ''), head = rounded(95, 58, H + 6, 12, 11, 9, 5, xray ? 'xcat' : '');
    let s = body + head + `<g transform="${FRONT(95, 69, H + 15)}"><path class="${xray ? 'xcatline' : 'face'}" d="M1.6 .2L3.4-3.4 5.3.2ZM6.8.2L8.6-3.4 10.4.2Z"/>`;
    if (xray) s += `<circle class="xcatline" cx="6" cy="4.4" r="4.2"/><circle class="xbone" cx="4" cy="4" r="1"/><circle class="xbone" cx="8" cy="4" r="1"/></g>`;
    else s += `<g class="eyes-shut"><path class="hair" d="M2.4 4.4q1.1 1.1 2.2 0M7.4 4.4q1.1 1.1 2.2 0"/></g><g class="eyes-open" style="display:none"><circle cx="3.5" cy="4.4" r="1" fill="var(--accent-hi)" filter="url(#soft)"/><circle cx="8.5" cy="4.4" r="1" fill="var(--accent-hi)" filter="url(#soft)"/></g></g>`;
    s += `<path class="tail ${xray ? 'xcatline' : 'hair'}" d="${path(tailPts(0))}" style="stroke-width:2"/>`;
    if (xray) {   // skeleton gag: spine, ribs, tail bones and a fish in the belly
      s += `<path class="xbone" d="${path([[74, 63.5, H + 9], [96, 63.5, H + 9]])}"/>` + [78, 82, 86, 90].map(x => `<path class="xbone" d="${path([[x, 59, H + 5], [x, 63.5, H + 9], [x, 68, H + 5]])}"/>`).join('');
      s += tailPts(0).map(p => `<circle class="xbone" cx="${f(P(...p)[0])}" cy="${f(P(...p)[1])}" r=".9"/>`).join('');
      s += `<g transform="${TOP(80, 60, H + 4)}"><path class="xfish" d="M0 3l3-2 7 0 2-1.6v5.2l-2-1.6h-7z"/><path class="xfish" d="M4 1.2v3.6M6 1v4M8 1v4"/></g>`;
    }
    s += xray ? '' : `<text class="zz" x="${f(P(104, 62, H + 22)[0])}" y="${f(P(104, 62, H + 22)[1])}">z</text>`;
    return UTIL.g(g, s, xray ? { id: 'cat-x', 'pointer-events': 'none' } : { id: 'cat', 'data-hit': 'cat', class: 'hit' });
  }
  return { interior, exterior, ghost, cat, tailPts, use, edges, doorTransform };
})();
