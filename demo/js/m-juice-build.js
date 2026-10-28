/* Fig 5 · 生搾り「しぼりたて」— geometry, after the fresh-squeeze machines at Japanese stations (IJOOZ, Feed ME Orange):
   a cold glass hopper full of whole fruit you can see through the door; a star wheel lets one fruit out, it rolls along
   a trough and drops onto the cutter, the two halves are squeezed between press cups, the juice runs through a sieve into
   a cup below, the cup is sealed and slides to the window; the spent halves slide down a chute into the peel bag.
   Four fruits a cup. Through the door's big window: the hopper (top), the press and the cup filling (middle).
   Peel bin bottom left, cooling unit bottom middle, coin column right.
   Placement: seen from the default camera, a point y deep behind the door shows (84 - y) further right, so the hopper is
   shallow and sits left, and the press column stands at x 40: both land in the middle of the window, clear of the coin column. */
const JU = (() => {
  const W = 120, D = 84, H = 240;
  // hopper compartments: k spans x 4 + 16k .. +16 (a fourth with the upgrade), y 38 .. 68; fruit two across, four deep, layer on layer
  const HOP = { x0: 4, w: 16, y0: 38, d: 30, z0: 151, cups: 12 };
  const fruitAt = (k, i) => { const layer = Math.floor(i / 8), r = i % 8, col = r % 2, row = Math.floor(r / 2), o = layer % 2;
    return [HOP.x0 + k * HOP.w + 4 + col * 8 + o * .8, HOP.y0 + 3.6 + row * 7.2 + o * 1.2, HOP.z0 + layer * 6.2]; };
  const GATE = k => [HOP.x0 + k * HOP.w + 8, 71, 146];      // star wheel at the bottom front of a compartment
  const TROUGH_Z = 141, DROP = [40, 71, 141], CUT = [40, 66, 128], PRESS_Z = 119;
  const CUP = [40, 66, 86], SEAL = [40, 77, 86], CUPTUBE = [60, 64, 99], WINDOW = [60, 80, 24];
  const PEEL = { x: 8, y: 20, z: 4, d: 44, h: 46 };
  // the starting menu (overwritten by the goods plan): fruit and juice colours
  const MENU = [
    { name: '温州みかん', price: 300, fruit: '#ff9a2e', juice: '#ffb347' },
    { name: 'オレンジ', price: 320, fruit: '#ff8a1e', juice: '#ffa62b' },
    { name: 'はちみつレモン', price: 330, fruit: '#ffe14a', juice: '#fff07a' },
    { name: 'りんご', price: 350, fruit: '#e8453a', juice: '#f6d27a' },
  ];
  return { W, D, H, HOP, fruitAt, GATE, TROUGH_Z, DROP, CUT, PRESS_Z, CUP, SEAL, CUPTUBE, WINDOW, PEEL, MENU, SLOTW: [105, D, 187] };
})();

const JUB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, HOP, GATE, TROUGH_Z, DROP, CUT, PRESS_Z, CUP, SEAL, CUPTUBE, PEEL } = JU;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(40,16,4,.5);stroke-width:.6;vector-effect:non-scaling-stroke';
  /* ---------- glyphs: a fruit (a sphere looks the same from every side), a cut half, a net bag of fruit, a peel bag ---------- */
  function defs() {
    const fruit = `<g id="g-fruit"><circle r="4.3" style="fill:var(--c);${ST}"/><circle cx="-1.4" cy="-1.6" r="1.3" fill="#fff" opacity=".42"/><path d="M0-4.3l.7-1.4" stroke="#4a6a22" stroke-width="1" stroke-linecap="round"/><circle cx="1.6" cy="1.4" r=".5" fill="#000" opacity=".12"/></g>`;
    const half = `<g id="g-half"><path d="M-4.3 0a4.3 4.3 0 0 0 8.6 0z" style="fill:var(--c);${ST}"/><path d="M-3.4 .2h6.8" style="stroke:color-mix(in srgb,var(--c) 35%,#fff);stroke-width:1.3"/></g>`;
    const bag = `<g id="g-netbag">${[[-3.4, -3.4], [3, -3.6], [0, -8.4], [-3, -12.6], [3.2, -12.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" style="fill:var(--c);${ST}"/>`).join('')}
      <path d="M-7 -1q0-17 7-17t7 17z" fill="none" stroke="#3aa04a" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M-6 -6l12 -6M-6 -12l11 -4M-5 -2l11 -10M6 -6l-12 -6M6 -12l-11 -4" stroke="#3aa04a" stroke-width=".45" vector-effect="non-scaling-stroke"/>
      <rect x="-2.6" y="-20" width="5.2" height="2.6" rx="1" fill="#ffd23f" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/></g>`;
    const peel = `<g id="g-peelbag"><path d="M-6 0q-1-10 2-14h8q3 4 2 14z" fill="#3a3f48" stroke="rgba(0,0,0,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-4 -14l4 -3 4 3" fill="none" stroke="#3a3f48" stroke-width="1.4"/><path d="M-3.4 -7h6.8" stroke="#c9d0da" stroke-width=".8" opacity=".6"/></g>`;
    return fruit + half + bag + peel;
  }
  const vars = p => `--c:${p.fruit}`;
  // a fruit at a world point, as a <use> (one node per fruit: a full hopper is a few hundred nodes that never move)
  const fruitUse = (p, x, y, z, extra = '') => { const [sx, sy] = P(x, y, z); return `<use href="#g-fruit" x="${f(sx)}" y="${f(sy)}" style="--c:${p.fruit}" ${extra}/>`; };
  // a clear cup filled to level 0..1, sealed with a film when done (drawn around the cup's foot at the origin)
  function cupSVG(level, juice, sealed) {
    const r0 = 3.8, r1 = 5.2, h = 11, L = .6 + level * 9.4, rl = r0 + (r1 - r0) * L / h;
    let s = `<path d="${toD(hull([...ringZ(0, r0, 16), ...ringZ(h, r1, 16)]))}" fill="rgba(220,240,255,.2)" stroke="rgba(220,240,255,.7)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
    if (level > .01) s += `<path d="${toD(hull([...ringZ(.4, r0 - .3, 16), ...ringZ(L, rl - .3, 16)]))}" fill="${juice}" opacity=".92"/><path d="${toD(ringZ(L, rl - .3, 16))}" fill="${juice}" style="filter:brightness(1.12)"/>`;
    s += `<path d="${toD(ringZ(h, r1, 16))}" fill="${sealed ? 'rgba(255,255,255,.8)' : 'none'}" stroke="rgba(220,240,255,.8)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`;
    if (sealed) s += `<path d="${toD(ringZ(h + .05, r1 * .55, 14))}" fill="none" stroke="#ff8a1e" stroke-width=".8" vector-effect="non-scaling-stroke"/>`;
    return s;
  }
  // the menu tiles' fruit (door-local units)
  const tileFruit = (x, y, p, r = 4.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.fruit}" stroke="rgba(0,0,0,.4)" stroke-width=".6" vector-effect="non-scaling-stroke"/><circle cx="${f(x - r * .34)}" cy="${f(y - r * .38)}" r="${f(r * .28)}" fill="#fff" opacity=".45"/><path d="M${x} ${y - r}q2-2.4 4-1.4" fill="none" stroke="#4a8a2a" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const PEEL_W = [30, 38, 44];   // the peel bin grows wider with each level

  /* ---------- the inside. lv: fitted parts { bin, press, hopper } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right, comps = 3 + (lv.hopper > 0 ? 1 : 0), pw = PEEL_W[lv.bin || 0], hw = comps * HOP.w;
    let s = CORE.shell(W, D, H);
    // the cold hopper's tint (no blur: a plain tint costs nothing), its floor
    s += `<g transform="${FRONT(4, 4, 230)}"><rect width="${hw + 4}" height="84" fill="var(--blue)" fill-opacity=".08"/></g>` + box(HOP.x0 - 1, HOP.y0 - 2, HOP.z0 - 8, hw + 2, HOP.d + 2, 3);
    // cooling unit with its fan grille
    s += rounded(56, 12, 4, 28, 30, 22, 5) + `<g transform="${FRONT(58, 42.05, 24)}">${slits(2, 24, 2.5, 2, 18, true)}</g><g transform="${FRONT(58, 42.1, 8)}"><text class="label sign" x="12" y="2.4" font-size="2.8" text-anchor="middle">4℃</text></g>`;
    // the peel bin (its fill is drawn by the machine), the next size as a ghost
    s += `<g ${lv.bin ? 'data-part="bin"' : ''}>${box(PEEL.x, PEEL.y, PEEL.z, pw, PEEL.d, PEEL.h, 0, 'ju-bin')}</g>`;
    if ((lv.bin || 0) < 2) s += `<g class="ugh-g">${CORE.edges(PEEL.x, PEEL.y, PEEL.z, PEEL_W[(lv.bin || 0) + 1], PEEL.d, PEEL.h, 'ugh')}</g>`;
    g.insertAdjacentHTML('beforeend', s);
    const peelG = UTIL.g(g, '', { class: 'ju-peel' });
    g.insertAdjacentHTML('beforeend', `<path class="chute" d="${path([[CUT[0] - 5, CUT[1], PRESS_Z - 5], [PEEL.x + pw / 2, PEEL.y + 26, PEEL.z + PEEL.h + 2]])}" style="stroke-width:4;stroke:#2a3038"/>`);
    let cm;
    const column = () => { cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState); };
    if (!RT) column();
    // compartments: glass walls and the fruit piles, drawn far to near
    const order = Array.from({ length: comps }, (_, k) => RT ? k : comps - 1 - k);
    const wall = (x, part) => `<g ${part ? 'data-part="hopper"' : ''} transform="${SIDE(x, HOP.y0 + HOP.d, 226)}"><rect width="${HOP.d}" height="79" style="fill:rgba(170,210,240,.04);stroke:rgba(170,210,240,.3);stroke-width:1;vector-effect:non-scaling-stroke"/></g>`;
    const compG = [];
    order.forEach(k => { const x = HOP.x0 + k * HOP.w;
      g.insertAdjacentHTML('beforeend', wall(RT ? x : x + HOP.w, k === 3 && !RT));
      compG[k] = UTIL.g(g, '', k === 3 ? { class: 'ju-pile', 'data-part': 'hopper' } : { class: 'ju-pile' }); });
    g.insertAdjacentHTML('beforeend', wall(RT ? HOP.x0 + hw : HOP.x0, comps === 4 && RT));
    if (comps < 4) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(HOP.x0 + 3 * HOP.w, HOP.y0, HOP.z0 - 5, HOP.w, HOP.d, 75, 'ugh')}</g>`);
    // the hopper's front glass
    g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(HOP.x0, HOP.y0 + HOP.d, 226)}"><rect width="${hw}" height="79" style="fill:rgba(170,210,240,.05);stroke:rgba(170,210,240,.35);stroke-width:1;vector-effect:non-scaling-stroke"/></g>`);
    // star wheels under each compartment, the trough, the drop chute
    const wheels = [];
    for (let k = 0; k < comps; k++) { const [x, y, z] = GATE(k);
      wheels.push(UTIL.g(g, `<g class="ju-spin"><circle class="face" r="3.4"/>${[0, 60, 120].map(a => `<path class="hair" transform="rotate(${a})" d="M-3.2 0H3.2"/>`).join('')}</g>`, { class: 'ju-wheel', transform: FRONT(x, y, z) })); }
    g.insertAdjacentHTML('beforeend', box(HOP.x0, 68, TROUGH_Z - 3, hw, 6, 1.4) + box(DROP[0] - 4, 66, CUT[2] + 5, 8, 6, TROUGH_Z - CUT[2] - 8, 0, 'tubeglass'));
    // the cutter, the sieve over the cup
    const blade = UTIL.el('path', { class: 'ju-blade', d: path([[CUT[0], CUT[1] - 5, CUT[2] + 5], [CUT[0], CUT[1] + 5, CUT[2] + 5], [CUT[0], CUT[1] + 5, CUT[2] - 1], [CUT[0], CUT[1] - 5, CUT[2] - 1]]) + 'Z' }, g);
    g.insertAdjacentHTML('beforeend', `<g transform="${TOP(CUT[0], CUT[1], PRESS_Z - 8)}"><circle class="face top" r="6.4"/>${[-3.6, -1.2, 1.2, 3.6].map(x => `<circle class="detail" cx="${x}" cy="0" r=".6"/>`).join('')}</g>`);
    // press cups: one pair, two with the upgrade (the second pair sits behind the first)
    const presses = [];
    const pair = (dy, part) => {
      const a = part ? { 'data-part': 'press' } : {};
      const L = UTIL.g(g, box(CUT[0] - 21, CUT[1] + dy - 1, PRESS_Z, 8, 2, 2) + rounded(CUT[0] - 13, CUT[1] + dy - 4, PRESS_Z - 3, 6, 8, 7, 3), { class: 'ju-press', ...a });
      const R = UTIL.g(g, box(CUT[0] + 13, CUT[1] + dy - 1, PRESS_Z, 8, 2, 2) + rounded(CUT[0] + 7, CUT[1] + dy - 4, PRESS_Z - 3, 6, 8, 7, 3), { class: 'ju-press', ...a });
      presses.push([L, R, dy]);
    };
    if (lv.press) pair(-10, true);
    pair(0, false);
    if (!lv.press) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(CUT[0] - 13, CUT[1] - 14, PRESS_Z - 3, 26, 8, 7, 'ugh')}</g>`);
    // the cup tube (a stack of empty cups), the stand under the sieve, the sealer in front of it
    // (the stand and the sealer table hang off posts standing on the floor beside the cooling unit)
    const post = (y, z) => box(54, y - 2, 4, 4, 4, z - 3) + box(CUP[0] + 6, y - 1.5, z - 6, 48 - CUP[0], 3, 3);
    g.insertAdjacentHTML('beforeend', post(CUP[1], CUP[2]) + rounded(CUP[0] - 8, CUP[1] - 8, CUP[2] - 3, 16, 16, 3, 8)
      + post(SEAL[1], SEAL[2]) + rounded(SEAL[0] - 7, SEAL[1] - 5, SEAL[2] - 3, 14, 10, 3, 4)
      + rounded(CUPTUBE[0] - 5.6, CUPTUBE[1] - 5.6, CUPTUBE[2], 11.2, 11.2, 13, 5.6, 'cupstack') + rounded(CUPTUBE[0] - 6.4, CUPTUBE[1] - 6.4, CUPTUBE[2], 12.8, 12.8, 18, 6.4, 'tubeglass'));
    const juiceStream = UTIL.el('path', { class: 'ju-stream', d: path([[CUT[0], CUT[1], PRESS_Z - 9], [CUP[0], CUP[1], CUP[2] + 10]]) }, g);
    const station = UTIL.g(g, '', { class: 'ju-station' });
    const sealer = UTIL.g(g, box(SEAL[0] - 5, SEAL[1] - 4, SEAL[2] + 16, 10, 8, 4) + `<path class="hair" d="${path([[SEAL[0], SEAL[1], SEAL[2] + 20], [SEAL[0], SEAL[1], SEAL[2] + 30]])}" style="stroke-width:2.4"/>`, { class: 'ju-sealer' });
    const movers = UTIL.g(g, '', { class: 'ju-movers' });
    if (RT) column();
    // upgrade pins (seen in X-ray only)
    g.insertAdjacentHTML('beforeend', ((lv.bin || 0) < 2 ? pin('bin', PEEL.x + 15, PEEL.y + 44, 30) : '') + (lv.press ? '' : pin('press', CUT[0] - 24, CUT[1] + 6, PRESS_Z + 4)) + (comps < 4 ? pin('hopper', HOP.x0 + 3 * HOP.w + 8, HOP.y0 + HOP.d - 2, 196) : ''));
    g.insertAdjacentHTML('beforeend', `<path class="tubelight" d="${path([[6, 80, 226], [hw + 6, 80, 226]])}"/>`);
    return { compG, wheels, blade, presses, juiceStream, sealer, station, movers, peelG, cm, pw };
  }

  /* ---------- the shell and door: a big window onto the hopper and the press ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, comps = 3 + (lv.hopper > 0 ? 1 : 0);
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const oc = '#ff9a2e', ln = `stroke="rgba(255,154,46,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    // right side: a big orange slice over しぼり and the cold sign; left side: fruit tumbling down to 100%
    const spokes = [0, 45, 90, 135].map(a => { const c = Math.cos(a * Math.PI / 180) * 22, d = Math.sin(a * Math.PI / 180) * 22; return `<path d="M${f(42 - c)} ${f(70 - d)}L${f(42 + c)} ${f(70 + d)}" ${ln}/>`; }).join('');
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/>
      <circle cx="42" cy="70" r="28" fill="rgba(255,154,46,.08)" ${ln}/><circle cx="42" cy="70" r="22" fill="none" ${ln}/>${spokes}
      ${['し', 'ぼ', 'り'].map((ch, i) => `<text class="sign" x="42" y="${128 + i * 22}" font-size="18" text-anchor="middle" fill="rgba(255,154,46,.12)" stroke="rgba(255,154,46,.42)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="196" width="56" height="12" rx="2" fill="rgba(90,169,255,.12)" stroke="var(--blue)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="204.8" font-size="6" text-anchor="middle" fill="var(--blue)">4℃ れいぞう</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${oc}" filter="url(#soft)"/><g class="iso-only">
      ${[[30, 40], [52, 58], [34, 80], [56, 102], [38, 122]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="rgba(255,154,46,.08)" ${ln}/><path d="M${x} ${y - 9}q2-3 5-2" fill="none" ${ln}/>`).join('')}
      <text class="sign" x="42" y="170" font-size="22" text-anchor="middle" fill="rgba(255,154,46,.12)" stroke="rgba(255,154,46,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">100%</text>
      <text class="label" x="42" y="186" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,154,46,.6)">FRESH SQUEEZED</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tw = comps > 3 ? 20.4 : 28, gap = comps > 3 ? 1.3 : 1;
    const tile = (k, p) => { const x = 6 + k * (tw + gap), y = 150, fs = Math.min(2.6, (tw - 2) / (p.jp || p.name).length);
      return R3(x, y, tw, 22, 1, `<rect class="ju-tglow nohit" x="${x}" y="${y}" width="${tw}" height="22" rx="2" fill="${oc}" opacity="0"/>${tileFruit(x + tw / 2, y + 6.6, p)}
        <text x="${x + tw / 2}" y="${y + 14.4}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + tw / 2}" y="${y + 18.2}" font-size="2.6" text-anchor="middle" class="label">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + tw / 2 - 4}" y="${y + 19.6}" width="8" height="1.2" rx=".6"/><text class="soldout" x="${x + tw / 2}" y="${y + 8}" font-size="3.6" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit ju-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM6 22V146H92V22Z" fill-rule="evenodd"/>
      ${R3(4, 4, 112, 15, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="15" rx="2.5" style="stroke:${oc}"/>
        <text class="lit-text sign on" style="--lc:${oc}" x="40" y="15.4" font-size="10" text-anchor="middle" filter="url(#soft)">しぼりたて</text>
        <text class="label" x="96" y="10.4" font-size="2.8" text-anchor="middle" letter-spacing=".4">FRESH · 100%</text><text class="label" x="96" y="15" font-size="2.8" text-anchor="middle" letter-spacing=".4">4個で1杯</text>`, { noCap: true })}
      ${SK(6, 22, 86, 124, 4, { hole: true })}
      <rect class="dglass nohit" x="6" y="22" width="86" height="124"/><path class="nohit" d="M14 22L26 22L8 146H-4Z" fill="#fff" opacity=".045"/><path class="nohit" d="M60 22L66 22L48 146H42Z" fill="#fff" opacity=".035"/>
      <g class="nohit" transform="translate(17 134) rotate(-8)"><circle r="7" fill="#ffd23f" stroke="rgba(0,0,0,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"/><text y="-.4" font-size="3.6" text-anchor="middle" class="sign" fill="#141018">4個</text><text y="3.4" font-size="2.6" text-anchor="middle" class="sign" fill="#141018">1杯</text></g>
      ${R3(95, 24, 20, 12, .8, `<text class="label" x="105" y="29.4" font-size="2.6" text-anchor="middle">庫内</text><text class="lit-text on" style="--lc:var(--cyan)" x="105" y="34" font-size="3.8" text-anchor="middle">4℃</text>`, { r: 1.5, capCls: 'readycap' })}
      ${menu.slice(0, comps).map((p, k) => tile(k, p)).join('')}
      ${R3(100, 46, 10, 15, 1.6, `<rect class="recess" x="104.2" y="48" width="1.6" height="11" rx=".6"/><rect class="ju-slotglow" x="98.6" y="44.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="65" font-size="2.6" text-anchor="middle">COIN</text>
      ${R3(95, 70, 20, 11, 1, `<path class="hair" d="M101 75.5a3 3 0 0 1 0-1M103 77a5 5 0 0 0 0-4M105 78.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="77" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 90, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 90h4"/>' })}<text class="label" x="105" y="98" font-size="2.6" text-anchor="middle">返却</text>
      <g data-hit="cup" class="hit">${SK(97, 101, 16, 12, 3.5, { r: 2 })}</g><text class="label" x="105" y="117" font-size="2.6" text-anchor="middle">おつり</text>
      ${R3(95, 121, 20, 7, .8, `<text class="lit-text ju-clean" style="--lc:var(--red)" x="105" y="126" font-size="3.3" text-anchor="middle">圧縮中</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 136)}
      ${lv.bin ? `<g class="nohit" transform="translate(7 190)"><rect width="26" height="15" rx="2.4" fill="#2f8a3a" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M3.6 10q3.4-6.4 7.2 0z" fill="#ff9a2e" stroke="#fff" stroke-width=".4"/><text x="17" y="6.6" font-size="3.1" text-anchor="middle" fill="#fff" class="sign">皮入れ</text><text x="17" y="11.8" font-size="3.8" text-anchor="middle" fill="#ffe14a" class="sign">${lv.bin > 1 ? '特大' : '大'}</text></g>` : ''}
      ${lv.press ? `<g class="nohit" transform="translate(81 132) rotate(10)"><path d="${Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12 - Math.PI / 2, q = i % 2 ? 6.6 : 8.6; return (i ? 'L' : 'M') + (q * Math.cos(a)).toFixed(2) + ' ' + (q * Math.sin(a)).toFixed(2); }).join('') + 'Z'}" fill="#ff8a1e" stroke="#fff" stroke-width=".6" vector-effect="non-scaling-stroke"/><text y="-.2" font-size="3.3" text-anchor="middle" fill="#fff" class="sign">W搾り</text><text y="3.2" font-size="2.3" text-anchor="middle" fill="#fff" class="label">2こずつ</text></g>` : ''}
      ${lv.hopper ? `<g class="nohit" transform="translate(95 160)"><rect width="20" height="14" rx="2" fill="#fff8ea" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>${['#ff9a2e', '#ff8a1e', '#e8453a', '#ffe14a'].map((c, i) => `<circle cx="${4 + i * 4}" cy="4.6" r="1.6" fill="${c}"/>`).join('')}<text x="10" y="11.4" font-size="3.6" text-anchor="middle" fill="#2a5a1a" class="sign">4種</text></g>` : ''}
      <g transform="translate(6 175)"><rect width="86" height="9" rx="1.5" fill="#0d1410" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <text class="ju-lcd" x="4" y="6.3" font-size="3.4">しぼりたて · いつでも</text><rect class="ju-bar" x="55" y="3" width="0" height="3" rx="1" fill="${oc}"/><rect x="55" y="3" width="27" height="3" rx="1" fill="none" stroke="rgba(255,154,46,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/></g>
      ${R3(36, 187, 48, 5.5, .8, `<text class="lit-text ju-ready" style="--lc:${oc}" x="60" y="191.4" font-size="3.1" text-anchor="middle">できあがり</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(36, 195, 48, 24, 6, { r: 3 })}</g>
      <rect class="ju-flap nohit" x="37" y="196" width="46" height="8" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="label" x="60" y="224" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0ZM6 22V146H92V22Z" fill-rule="evenodd" style="fill:#101318"/><rect class="dglass nohit" x="6" y="22" width="86" height="124"/>
      <rect class="detail" x="6" y="150" width="108" height="84" rx="2"/><path class="wire2" d="M112 30V230M112 150H96M112 200H60"/><path class="hair" d="M117 20V220"/><rect class="face" x="113" y="136" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'ju-door', transform: FRONT(0, D, H) });
    // the ready cup sits in the window: outside the door group (world space) so it is not skewed with the door
    const windowG = UTIL.g(g, '', { class: 'ju-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.ju-tile')],
      slotGlow: door.querySelector('.ju-slotglow'), clean: door.querySelector('.ju-clean'), ready: door.querySelector('.ju-ready'), flap: door.querySelector('.ju-flap'),
      lcd: door.querySelector('.ju-lcd'), bar: door.querySelector('.ju-bar'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="6" y="22" width="86" height="124"/><rect class="xline" x="6" y="150" width="86" height="22"/><rect class="xline" x="36" y="195" width="48" height="24" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, cupSVG, fruitUse, vars, PEEL_W };
})();
