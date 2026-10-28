/* Fig 4 · 昭和の現煮めん「ゆげ屋」— geometry, after the 1970s udon / soba / ramen machines (川鉄, 富士電機) that still run
   at roadside coin corners. Bowls already filled with boiled noodles and toppings wait on a cold two-tier carousel; a
   lift lowers one to the stand, hot water from the boiler warms it, the bowl tips to drain (湯切り), dashi pours from
   the tank, and the bowl slides out to the window. A nixie display on the door counts down from 25.
   Left: carousel (cold room). Centre: lift and stand over a drain basin. Right: dashi tank (top), coin mech, boiler (bottom). */
const RA = (() => {
  const W = 120, D = 84, H = 240;
  // carousel: centre, ring radius the bowls sit on, plate radius, slots per tier, tier heights (the third is an upgrade)
  const CAR = { x: 34, y: 40, r: 21, plate: 27, n: 10, z: [148, 180, 212] };
  // the lift stands in front of the carousel (bowls cross onto it at the front place, angle 90°) and the bowl cooks on its
  // platform at the bottom: front-left, where nothing (the coin column) hides it from the camera
  const PICK = Math.PI / 2;
  const LIFT = { x: 34, y: 68, bottom: 52 };
  const WATER = [34, 68, 92], DASHI_N = [39, 72, 94];   // nozzles over the stand
  const OUT = [52, 78, 44];                       // the bowl's way out, toward the window
  const WINDOW = [60, 80, 36];                    // where the ready bowl sits in the window (outside the door, world space)
  // the starting menu (overwritten by the goods plan): soup, noodle and topping colours
  const MENU = [
    { name: 'かけうどん', price: 260, soup: '#c98a4b', noodle: '#fbf3dc', top: '#7fc96b' },
    { name: 'たぬきそば', price: 280, soup: '#8a5a32', noodle: '#8c6d55', top: '#f2c46a' },
    { name: '醤油ラーメン', price: 300, soup: '#7a4a2a', noodle: '#f3d27a', top: '#ff8fa8' },
    { name: 'きつねうどん', price: 290, soup: '#c98a4b', noodle: '#fbf3dc', top: '#d9963b' },
  ];
  const at = (a, z) => [CAR.x + CAR.r * Math.cos(a), CAR.y + CAR.r * Math.sin(a), z];
  return { W, D, H, CAR, PICK, LIFT, WATER, DASHI_N, OUT, WINDOW, MENU, at, SLOTW: [105, D, 187] };
})();

const RAB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, CAR, LIFT, WATER, DASHI_N } = RA;
  const { hull, ringZ, toD } = GLY;
  const vars = p => `--c:${p.soup};--n:${p.noodle};--t:${p.top}`;

  /* ---------- glyphs: a bowl of noodles (dry, as loaded), the same with soup, a dashi jug ---------- */
  function defs() {
    const ST = 'stroke:rgba(20,10,8,.55);stroke-width:.6;vector-effect:non-scaling-stroke';
    const body = `<path d="${toD(hull([...ringZ(0, 3.4), ...ringZ(5.6, 6.6)]))}" style="fill:#c8452f;${ST}"/><path d="${toD([...ringZ(1.6, 4.6, 12, GLY.vz()[0] + .1, GLY.vz()[1] - .1), ...ringZ(2.6, 5.2, 12, GLY.vz()[1] - .1, GLY.vz()[0] + .1)])}" fill="#2a1410" opacity=".5"/>`;
    const rim = `<path d="${toD(ringZ(5.6, 6.6))}" style="fill:#2a1410;${ST}"/>`;
    const noodles = [-2.6, -.8, 1, 2.6].map((y, i) => { const a = P(-3.4, y, 5.2), b = P(3.2, y + .6, 5.2), m = P(0, y + (i % 2 ? .9 : -.9), 5.2); return `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}" fill="none" style="stroke:var(--n);stroke-width:1.1;stroke-linecap:round"/>`; }).join('');
    const top = `<path d="${toD(ringZ(5.5, 2.1, 14, 0, Math.PI * 2, 1.6, -1.2))}" style="fill:var(--t);${ST}"/><circle cx="${f(P(-2, 1.8, 5.5)[0])}" cy="${f(P(-2, 1.8, 5.5)[1])}" r=".8" fill="#7fc96b"/>`;
    const dry = `<g id="g-bowl-dry">${body}${rim}<path d="${toD(ringZ(5.3, 5.9))}" fill="#3a2a22"/>${noodles}${top}</g>`;
    const wet = `<g id="g-bowl">${body}${rim}<path d="${toD(ringZ(5.3, 5.9))}" style="fill:var(--c)"/>${noodles}${top}<path d="${toD(ringZ(5.32, 5.9))}" style="fill:var(--c);opacity:.35"/></g>`;
    const jug = `<g id="g-dashi"><path d="${toD(hull([...ringZ(0, 4.6), ...ringZ(14, 4.6), ...ringZ(18, 2), ...ringZ(21, 1.7)]))}" style="fill:rgba(200,140,70,.7);stroke:rgba(255,220,170,.6);stroke-width:.6;vector-effect:non-scaling-stroke"/>
      <path d="${toD([...ringZ(4, 4.7, 12, GLY.vz()[0] + .1, GLY.vz()[1] - .1), ...ringZ(10, 4.7, 12, GLY.vz()[1] - .1, GLY.vz()[0] + .1)])}" fill="#fff8ec" opacity=".9"/><path d="${toD(hull([...ringZ(21, 1.9, 12), ...ringZ(23, 1.9, 12)]))}" fill="#c8452f"/></g>`;
    return dry + wet + jug;
  }
  // a bowl at a world point, as a <use> (one node per bowl: cheap to move around)
  const bowlUse = (p, x, y, z, dry = true, extra = '') => { const [sx, sy] = P(x, y, z); return `<use href="#${dry ? 'g-bowl-dry' : 'g-bowl'}" x="${f(sx)}" y="${f(sy)}" style="${vars(p)}" ${extra}/>`; };
  // the menu tiles' little bowl, front view (door-local units)
  const tileBowl = (x, y, p) => `<path d="M${x - 7} ${y}h14q-1 6-7 6t-7-6z" fill="#c8452f" stroke="rgba(0,0,0,.4)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="${x}" cy="${y}" rx="7" ry="1.6" fill="${p.soup}"/>
    <path d="M${x - 4} ${y - .2}q2-.9 4 0t4 0" fill="none" stroke="${p.noodle}" stroke-width=".9" vector-effect="non-scaling-stroke"/><ellipse cx="${x + 2.4}" cy="${y - .8}" rx="2.2" ry="1.1" fill="${p.top}"/>
    <path d="M${x - 2.4} ${y - 3.4}q-1-1.6 0-3.2M${x + .6} ${y - 3.6}q-1-1.6 0-3.2" fill="none" stroke="var(--ink-hi)" stroke-width=".6" vector-effect="non-scaling-stroke" opacity=".6"/>`;

  /* ---------- the inside ---------- */
  // lv: fitted parts { boiler, spin, tier } — a bigger boiler, a spinning stand, a third carousel tier
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const BOILER_H = [62, 80, 96];
  function interior(g, coinState, lv) {
    const RT = ISO.right, tiers = 2 + (lv.tier > 0 ? 1 : 0), bh = BOILER_H[lv.boiler || 0];
    let s = CORE.shell(W, D, H);
    // cold room behind the carousel (no blur filter: a plain tint is enough and costs nothing)
    s += `<g transform="${FRONT(4, 4, 232)}"><rect width="60" height="96" fill="var(--blue)" fill-opacity=".07"/></g>`;
    // drain basin and the hot-water / dashi lines
    s += box(42, 58, 30, 18, 22, 6, 0, 'ra-basin') + `<g transform="${TOP(43, 59, 36.02)}"><rect class="recess" width="16" height="20" rx="1.5"/>${slits(3, 13, 2.5, 2, 18, true)}</g>`;
    const water = [[96, 22, 70], [96, 22, 104], [70, 22, 104], [70, WATER[1], 104], [WATER[0], WATER[1], 104], [WATER[0], WATER[1], WATER[2] + 4]];
    const dashi = [[94, 24, 146], [94, 24, 116], [74, 24, 116], [74, DASHI_N[1], 116], [DASHI_N[0], DASHI_N[1], 116], [DASHI_N[0], DASHI_N[1], DASHI_N[2] + 4]];
    s += `<path class="wire2" d="${path(water)}" style="stroke:#3a3226;stroke-width:2"/><path class="pulse hot ra-wpulse" pathLength="1000" d="${path(water)}"/>`
      + `<path class="wire2" d="${path(dashi)}" style="stroke:#4a3020;stroke-width:2"/><path class="pulse ra-dpulse" pathLength="1000" d="${path(dashi)}" style="stroke:#d08a4a"/>`
      + box(WATER[0] - 2, WATER[1] - 2, WATER[2] + 4, 4, 4, 6) + box(DASHI_N[0] - 2, DASHI_N[1] - 2, DASHI_N[2] + 4, 4, 4, 6);
    g.insertAdjacentHTML('beforeend', s);
    const waterStream = UTIL.el('path', { class: 'ra-stream', d: path([WATER, [WATER[0], WATER[1], LIFT.bottom + 6]]) }, g);
    const dashiStream = UTIL.el('path', { class: 'ra-stream dashi', d: path([DASHI_N, [DASHI_N[0] - 2, DASHI_N[1] - 2, LIFT.bottom + 6]]) }, g);
    // the right-hand column (dashi tank, coin mech, boiler) is nearest from the right, farthest from the left
    let cm, thermo, dashiLevel, heater;
    const column = () => {
      // boiler with its heater and a thermometer: it runs cold after a run of bowls and has to heat up again
      g.insertAdjacentHTML('beforeend', `<g ${lv.boiler ? 'data-part="boiler"' : ''}>${rounded(84, 10, 6, 24, 24, bh, 12)}</g>` + `<g transform="${FRONT(86, 34.05, 58)}"><path class="heater ra-heater" d="M2 40h14v-3H2v-3h14v-3H2v-3h14"/></g>`);
      if ((lv.boiler || 0) < 2) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(84, 10, 6, 24, 24, BOILER_H[(lv.boiler || 0) + 1], 'ugh')}</g>`);
      thermo = UTIL.g(g, '', { transform: FRONT(104, 34.1, 62) });
      g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(86, 34.1, 66)}"><text class="label sign" x="8" y="2.6" font-size="3" text-anchor="middle">ボイラー</text></g>`);
      cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState);
      // dashi tank with a sight glass
      g.insertAdjacentHTML('beforeend', rounded(82, 12, 146, 24, 24, 56, 12) + `<g transform="${FRONT(84, 36.05, 206)}"><text class="label sign" x="10" y="2.8" font-size="3.2" text-anchor="middle">だし</text></g>`);
      dashiLevel = UTIL.g(g, '', { transform: FRONT(90, 36.1, 200) });
    };
    if (!RT) column();
    // carousel: shaft, motor, a plate per tier, the bowls on each tier (filled in by the machine)
    g.insertAdjacentHTML('beforeend', `<path class="hair" d="${path([[CAR.x, CAR.y, 138], [CAR.x, CAR.y, 228]])}" style="stroke-width:3"/>` + box(CAR.x - 6, CAR.y - 6, 226, 12, 12, 8) + box(CAR.x - 5, CAR.y - 5, 132, 10, 10, 8));
    const tiersG = [];
    for (let t = 0; t < tiers; t++) {
      const third = t === 2 ? { 'data-part': 'tier' } : {};
      UTIL.g(g, rounded(CAR.x - CAR.plate, CAR.y - CAR.plate, CAR.z[t] - 2, CAR.plate * 2, CAR.plate * 2, 2, CAR.plate), third);
      tiersG.push(UTIL.g(g, '', { class: 'ra-tier', ...third }));
    }
    if (tiers < 3) g.insertAdjacentHTML('beforeend', `<g class="ugh-g"><g transform="${TOP(CAR.x, CAR.y, CAR.z[2] - 1)}"><circle class="ugh" r="${CAR.plate}"/></g></g>`);
    // lift: two rails, a motor on top, the platform (moved by the machine)
    g.insertAdjacentHTML('beforeend', box(LIFT.x - 9, LIFT.y + 6, 46, 2, 2, 182) + box(LIFT.x + 7, LIFT.y + 6, 46, 2, 2, 182) + box(LIFT.x - 10, LIFT.y + 5, 228, 20, 5, 5));
    const carriage = UTIL.g(g, rounded(LIFT.x - 7, LIFT.y - 7, LIFT.bottom - 2, 14, 14, 2, 3) + box(LIFT.x - 6, LIFT.y + 5, LIFT.bottom - 2, 12, 2, 6)
      + (lv.spin ? `<g data-part="spin"><g transform="${TOP(LIFT.x, LIFT.y, LIFT.bottom + .05)}"><circle class="face top" r="6.2"/><path class="hair" d="M-5 0H5M0-5V5"/></g>${box(LIFT.x - 2, LIFT.y - 2, LIFT.bottom - 8, 4, 4, 6)}</g>` : ''), { class: 'ra-carriage' });
    if (!lv.spin) g.insertAdjacentHTML('beforeend', `<g class="ugh-g"><g transform="${TOP(LIFT.x, LIFT.y, LIFT.bottom + .05)}"><circle class="ugh" r="8"/></g></g>`);
    const station = UTIL.g(g, '', { class: 'ra-station' });
    const movers = UTIL.g(g, '', { class: 'ra-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', `<path class="tubelight" d="${path([[6, 80, 226], [64, 80, 226]])}"/>`);
    // upgrade pins (seen in X-ray only)
    g.insertAdjacentHTML('beforeend', ((lv.boiler || 0) < 2 ? pin('boiler', 96, 40, 44) : '') + (lv.spin ? '' : pin('spin', LIFT.x + 22, LIFT.y + 14, 40)) + (tiers < 3 ? pin('tier', CAR.x - 14, CAR.y, 222) : ''));
    heater = g.querySelector('.ra-heater');
    return { tiersG, carriage, station, movers, cm, thermo, dashiLevel, heater, waterStream, dashiStream,
      wpulse: g.querySelector('.ra-wpulse'), dpulse: g.querySelector('.ra-dpulse') };
  }

  /* ---------- the shell and door ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk;
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // right side: うどん / そば in big outlined letters and the warm sign; left side: a steaming bowl over 昭和の味
    const ln = 'stroke="rgba(255,122,74,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"';
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="#ff7a4a" filter="url(#soft)"/>
      ${['う', 'ど', 'ん'].map((ch, i) => `<text class="sign" x="28" y="${44 + i * 30}" font-size="24" text-anchor="middle" fill="rgba(255,122,74,.12)" stroke="rgba(255,122,74,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      ${['そ', 'ば'].map((ch, i) => `<text class="sign" x="58" y="${74 + i * 30}" font-size="24" text-anchor="middle" fill="rgba(255,122,74,.12)" stroke="rgba(255,122,74,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="160" width="56" height="12" rx="2" fill="rgba(255,90,78,.12)" stroke="var(--red)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="168.8" font-size="6" text-anchor="middle" fill="var(--red)">あったか〜い</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="#ff7a4a" filter="url(#soft)"/><g class="iso-only">
      <path d="M14 96h56q-3 26-28 26t-28-26z" fill="rgba(255,122,74,.07)" ${ln}/><ellipse cx="42" cy="96" rx="28" ry="5" fill="none" ${ln}/>
      <path d="M30 86q-5-8 0-16t0-16M42 86q-5-8 0-16t0-16M54 86q-5-8 0-16t0-16" fill="none" ${ln}/>
      <text class="sign" x="42" y="150" font-size="12" text-anchor="middle" fill="rgba(255,122,74,.14)" stroke="rgba(255,122,74,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">昭和の味</text>
      <text class="label" x="42" y="166" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,122,74,.6)">UDON · SOBA · RAMEN</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 22, y = 48;
      return R3(x, y, 20, 44, 1, `<rect class="ra-tglow nohit" x="${x}" y="${y}" width="20" height="44" rx="2" fill="#ff7a4a" opacity="0"/>${tileBowl(x + 10, y + 15, p)}
        <text x="${x + 10}" y="${y + 29}" font-size="2.7" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 10}" y="${y + 33.6}" font-size="2.8" text-anchor="middle" class="label">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 6}" y="${y + 37.4}" width="8" height="1.4" rx=".6"/><text class="soldout" x="${x + 10}" y="${y + 40.8}" font-size="2.6" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit ra-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    const o = `<rect class="face front mshell door-face" width="120" height="240"/>
      ${R3(4, 4, 112, 22, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="22" rx="2.5" style="stroke:#ff7a4a"/>
        <text class="lit-text sign on" style="--lc:#ff7a4a" x="40" y="19.6" font-size="14" text-anchor="middle" filter="url(#soft)">ゆげ屋</text>
        <text class="label" x="94" y="13" font-size="2.9" text-anchor="middle" letter-spacing=".4">うどん · そば</text><text class="label" x="94" y="18.4" font-size="2.9" text-anchor="middle" letter-spacing=".4">らーめん · 24H</text>`, { noCap: true })}
      ${[8, 44, 80].map((x, i) => `<path d="M${x} 29h32v12q-8 2-16 0t-16 0z" fill="${i === 1 ? '#5a2418' : '#2a1a3a'}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>
        <path d="M${x + 12} 37q2-4 4 0t4 0" fill="none" stroke="#fff8ec" stroke-width=".9" vector-effect="non-scaling-stroke" opacity=".7"/>`).join('')}
      ${menu.map((p, k) => tile(k, p)).join('')}
      ${R3(100, 46, 10, 15, 1.6, `<rect class="recess" x="104.2" y="48" width="1.6" height="11" rx=".6"/><rect class="ra-slotglow" x="98.6" y="44.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="65" font-size="2.6" text-anchor="middle">COIN</text>
      ${SK(95, 68, 20, 15, 1.2, { r: 1.5 })}<rect x="95" y="68" width="20" height="15" rx="1.5" fill="#120a08"/>
      ${[0, 1].map(i => `<text class="ra-nixie" x="${101 + i * 8}" y="79.6" font-size="10" text-anchor="middle">${i ? 5 : 2}</text>`).join('')}
      <text class="label" x="105" y="87" font-size="2.5" text-anchor="middle">あと · 秒</text>
      ${R3(95, 89, 20, 7, .8, `<text class="lit-text ra-prep" style="--lc:var(--red)" x="105" y="94" font-size="3.3" text-anchor="middle">準備中</text>`, { r: 1.5, capCls: 'readycap' })}
      ${R3(95, 100, 20, 11, 1, `<path class="hair" d="M101 105.5a3 3 0 0 1 0-1M103 107a5 5 0 0 0 0-4M105 108.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="107" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 119, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 119h4"/>' })}<text class="label" x="105" y="127" font-size="2.6" text-anchor="middle">返却</text>
      <g data-hit="cup" class="hit">${SK(97, 130, 16, 13, 3.5, { r: 2 })}</g><text class="label" x="105" y="147" font-size="2.6" text-anchor="middle">おつり</text>
      ${CORE.lock(100, 152)}
      ${lv.spin ? `<g class="nohit" transform="translate(19 190)"><circle r="9.4" fill="#fff8ec" stroke="#ff7a4a" stroke-width=".8" vector-effect="non-scaling-stroke"/><path d="M-5.4 -4.6a7.2 7.2 0 1 1 -1.4 6.4" fill="none" stroke="#ff7a4a" stroke-width=".9" vector-effect="non-scaling-stroke"/><path d="M-8.4 .2l1.6 1.8 1.8-1.4" fill="none" stroke="#ff7a4a" stroke-width=".9" vector-effect="non-scaling-stroke"/><text y="-.4" font-size="2.9" text-anchor="middle" fill="#5a2418" class="sign">回転</text><text y="3.2" font-size="2.9" text-anchor="middle" fill="#5a2418" class="sign">湯切り</text></g>` : ''}
      ${lv.tier ? `<g class="nohit" transform="translate(91 178)"><rect width="22" height="15" rx="2" fill="#2a120a" stroke="#ffb347" stroke-width=".8" vector-effect="non-scaling-stroke"/><text x="11" y="7.4" font-size="5" text-anchor="middle" fill="#ffb347" class="sign">三段</text><text x="11" y="12.4" font-size="3" text-anchor="middle" fill="#ffb347" class="label">30食</text></g>` : ''}
      <g transform="translate(6 98)"><rect width="84" height="66" rx="3" fill="#140b08" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <path d="M22 36h40q-2 16-20 16t-20-16z" fill="none" stroke="#ff7a4a" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/><ellipse cx="42" cy="36" rx="20" ry="3.6" fill="none" stroke="#ff7a4a" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/>
        <path d="M34 30q-3-5 0-10t0-10M42 30q-3-5 0-10t0-10M50 30q-3-5 0-10t0-10" fill="none" stroke="var(--ink-hi)" stroke-width=".8" vector-effect="non-scaling-stroke" opacity=".5"/>
        <text class="sign" x="42" y="60" font-size="6.4" text-anchor="middle" fill="#ff7a4a">あったかい めん類</text></g>
      ${lv.boiler ? `<g class="nohit" transform="translate(80 110) rotate(8)"><circle r="7.6" fill="#c8282a"/><circle r="6.3" fill="none" stroke="#fff4e0" stroke-width=".5" vector-effect="non-scaling-stroke"/><text y="1.6" font-size="4.6" text-anchor="middle" fill="#fff4e0" class="sign">${lv.boiler > 1 ? '二釜' : '大釜'}</text></g>` : ''}
      ${R3(34, 166, 52, 6, .8, `<text class="lit-text ra-ready" style="--lc:#ff7a4a" x="60" y="170.6" font-size="3.2" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(34, 176, 52, 30, 6, { r: 3 })}</g>
      <rect class="ra-flap nohit" x="35" y="177" width="50" height="9" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="label" x="60" y="212.6" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<rect class="face" width="120" height="240" style="fill:#101318"/><rect class="detail" x="6" y="6" width="108" height="228" rx="2"/>
      <rect class="face" x="6" y="46" width="88" height="48" rx="2"/><path class="wire2" d="M112 30V230M112 50H90M112 90H90M112 200H60"/><path class="hair" d="M117 20V220"/><rect class="face" x="113" y="152" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'ra-door', transform: FRONT(0, D, H) });
    // the ready bowl sits in the window: outside the door group (world space) so it is not skewed with the door
    const windowG = UTIL.g(g, '', { class: 'ra-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.ra-tile')],
      slotGlow: door.querySelector('.ra-slotglow'), nixie: [...door.querySelectorAll('.ra-nixie')], prep: door.querySelector('.ra-prep'), ready: door.querySelector('.ra-ready'),
      flap: door.querySelector('.ra-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="6" y="48" width="86" height="44"/><rect class="xline" x="95" y="68" width="20" height="15"/><rect class="xline" x="34" y="176" width="52" height="30" rx="3"/><rect class="xline" x="6" y="98" width="84" height="66"/></g>`);
  }
  return { defs, interior, exterior, ghost, bowlUse, vars };
})();
