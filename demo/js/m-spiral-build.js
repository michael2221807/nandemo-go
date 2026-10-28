/* Fig 2 · スパイラル「なんでも」— geometry. Glass door; 5 shelves x 4 coils; a lift in front of the shelves
   carries each item down to the outlet. Coils are drawn in two halves (back loops behind the goods, front loops over them). */
const SP = (() => {
  const W = 120, D = 84, H = 240;
  const ZR = [184, 150, 116, 82, 48], CX = [16, 37, 58, 79], CR = 7, SLOT = j => 67 - j * 9, NSLOT = 7;
  const ROWS = [
    [['コンソメ', 160, 'chips', 'yellow'], ['チリ', 160, 'chips', 'red'], ['のり塩', 160, 'chips', 'lime'], ['うめ', 160, 'chips', 'violet']],
    [['ミルクチョコ', 130, 'choco', 'brown'], ['いちごキャンディ', 110, 'candy', 'rose'], ['ミントチョコ', 130, 'choco', 'cyan'], ['レモンキャンディ', 110, 'candy', 'yellow']],
    [['しょうゆ麺', 210, 'cup', 'red'], ['カレー麺', 210, 'cup', 'amber'], ['しゃけ', 150, 'onigiri', 'rose'], ['うめぼし', 150, 'onigiri', 'red']],
    [['アヒル', 300, 'duck', 'yellow'], ['折りたたみ傘', 500, 'umbrella', 'rose'], ['電池', 240, 'battery', 'amber'], ['カセット', 380, 'cassette', 'lime']],
    [['天然水', 110, 'bottle-up', 'ice'], ['ピーチ', 150, 'bottle-up', 'rose'], ['招き猫', 980, 'maneki', 'ice'], ['ビデオ', 480, 'vhs', 'violet']],
  ];
  const coilIdx = (r, c) => r * 4 + c, coilRC = t => [Math.floor(t / 4), t % 4];
  const ze = r => ZR[r] - 8, ZE_OUT = 14;
  // 改造 (2026-10-18). The twin spiral: the bottom shelf's right-hand pair of coils (E3 + E4) linked by a belt into one wide
  // lane for boxed things; E4 turns the other way round (a left-hand coil), so the two push the box straight.
  // The counterweight: hangs on a cable over a pulley at the top left and goes down as the lift goes up
  const TW = { t: 18, t2: 19, cx: 68.5 }, CW = { x: .8, y: 78, w: 3.4, d: 6, h: 16, top: 212 };
  const cwZ = liftZ => CW.top - (liftZ - ZE_OUT) * .9;   // the weight's foot (it travels 0.9 of the lift: the drawing fits)
  // helix around the y axis, split by which side faces the viewer (hand -1: a left-hand coil)
  function helix(cx, zc, phase, hand = 1) {
    const turns = 7, n = 22 * turns, back = [], front = [];
    let run = null, vis = null, prev = null;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * turns * Math.PI * 2, a = t + phase;
      const p = ISO.P(cx + CR * hand * Math.sin(a), 10 + 9 * t / (Math.PI * 2), zc + CR * Math.cos(a));
      const v = ISO.dir(hand * Math.sin(a), 0, Math.cos(a)) > 0;
      if (v !== vis) { run = prev ? [prev] : []; (v ? front : back).push(run); vis = v; }
      run.push(p); prev = p;
    }
    const d = runs => runs.map(r => "M" + r.map(p => ISO.f(p[0]) + " " + ISO.f(p[1])).join("L")).join("");
    return { back: d(back), front: d(front) };
  }
  return { W, D, H, ZR, CX, CR, SLOT, NSLOT, ROWS, coilIdx, coilRC, ze, ZE_OUT, helix, TW, CW, cwZ, SLOTW: [105, D, 137] };
})();

const SPB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, ZR, CX, TW, CW, ZE_OUT } = SP;
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  // the counterweight's two cable runs for a lift at height z: lift -> pulley, pulley -> weight
  const cables = z => [path([[5.4, 80.5, z + 2.2], [5.4, 80.5, 229]]), path([[2.5, 80.5, 229], [2.5, 80.5, SP.cwZ(z) + CW.h]])];

  /* ---------- the three upgrade kits (lv: { eye, lift, twin }) ---------- */
  // 光电确认 (落下センサー): an emitter and a receiver at the two ends of the lift tray, a red beam across it; rides the lift
  const eyeKit = () => box(6.4, 76, 2.2, 3, 4, 4.4, 0, 'sp-eye') + box(84.6, 76, 2.2, 3, 4, 4.4, 0, 'sp-eye')
    + `<path class="sp-beam" d="${path([[9.4, 78, 4.6], [84.6, 78, 4.6]])}"/>`;
  const eyeGhost = () => CORE.edges(6.4, 76, 2.2, 3, 4, 4.4, 'ugh') + CORE.edges(84.6, 76, 2.2, 3, 4, 4.4, 'ugh');
  // 配重リフト: the top-left pulley, the weight and its cables, a bigger motor with a flywheel by the lift's foot
  const liftKit = () => `<g transform="${FRONT(2.6, 81, 229)}"><circle class="face" r="3"/><path class="hair" d="M-2.2 0H2.2M0-2.2V2.2"/></g>`
    + cables(ZE_OUT).map(d => `<path class="sp-cable" d="${d}"/>`).join('')
    + `<g class="sp-cw">${box(CW.x, CW.y, CW.top, CW.w, CW.d, CW.h, 0, 'sp-weight')}<g transform="${FRONT(CW.x, CW.y + CW.d, CW.top + 11)}"><text x="1.7" y="3" font-size="2.2" text-anchor="middle" fill="#ffd23f" class="sign">重</text></g></g>`
    + box(78, 64, 3, 13, 15, 11) + `<g transform="${FRONT(78, 79, 13)}"><circle cx="6.5" cy="5.4" r="4" class="face"/><circle cx="6.5" cy="5.4" r="1.2" fill="#ffd23f"/><text x="6.5" y="10.6" font-size="1.7" text-anchor="middle" fill="#ffd23f" class="label">HI-SPEED</text></g>`;
  const liftGhost = () => CORE.edges(CW.x, CW.y, CW.top, CW.w, CW.d, CW.h, 'ugh') + `<path class="ugh" d="${path([[2.5, 80.5, 229], [2.5, 80.5, CW.top + CW.h]])}"/>`;
  // 双螺旋: a toothed belt over the two motors' fronts, and a clear wall keeping the wide lane apart from E2
  const twinBelt = () => { const z = ZR[4] + 7.5, [a, b] = [CX[2], CX[3]];
    return `<path class="sp-belt" d="${path([[a, 8.2, z + 3.6], [b, 8.2, z + 3.6]])}M${P(b, 8.2, z - 3.6).map(f).join(' ')}L${P(a, 8.2, z - 3.6).map(f).join(' ')}"/>`
      + [a, b].map(x => `<g transform="${FRONT(x, 8.2, z)}"><circle r="3.6" class="face"/><circle r="1" fill="#ffd23f"/></g>`).join('')
      + `<g transform="${FRONT(TW.cx - 6, 8.3, z + 9)}"><rect width="12" height="3.4" rx=".6" fill="#ffd23f"/><text x="6" y="2.6" font-size="2.3" text-anchor="middle" fill="#141018" class="sign">TWIN</text></g>`; };
  const twinWall = () => box(47.2, 8, ZR[4], 1, 68, 23, 0, 'sp-wall') + `<path class="sp-wallrail" d="${path([[47.7, 8, ZR[4] + 23], [47.7, 76, ZR[4] + 23]])}"/>`;
  const twinGhost = () => CORE.edges(47.2, 8, ZR[4], 1, 68, 23, 'ugh') + CORE.edges(CX[2] - 4, 8, ZR[4] + 3.9, CX[3] - CX[2] + 8, .4, 7.2, 'ugh');

  function interior(g, coinState, lv = {}) {
    let s = CORE.shell(W, D, H);
    // machinery behind the outlet: small compressor + fan for the chocolate shelf
    s += rounded(10, 8, 3, 20, 20, 22, 10) + `<g transform="${FRONT(36, 30, 40)}"><circle class="face" cx="13" cy="15" r="13"/><circle class="recess" cx="13" cy="15" r="10.5"/>
      <g class="sp-fan" transform="translate(13 15)">${[0, 72, 144, 216, 288].map(a => `<path class="fanblade" transform="rotate(${a})" d="M0 0Q2.6-3.4 1.3-9.4Q-2.2-7.8-1.4-2.6Z"/>`).join('')}<circle class="face" r="2"/></g></g>`;
    s += `<g transform="${TOP(8, 72, 12)}"><rect class="recess" width="80" height="12"/></g>`;
    g.insertAdjacentHTML('beforeend', s);
    // service column: coin path + board + harness to each shelf's motors (behind the shelves when seen from the left)
    let cm, pulses;
    const service = () => {
      cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 98 }, coinState);
      pulses = ZR.map(z => { const pts = [[93, 6, 90], [91, 6, z + 7.5], [8, 6, z + 7.5]];
        g.insertAdjacentHTML('beforeend', `<path class="wire2" d="${path(pts)}"/><path class="pulse" pathLength="1000" d="${path(pts)}"/>`); return g.lastElementChild; });
    };
    if (!ISO.right) service();
    const rows = [], cols = ISO.right ? [0, 1, 2, 3] : [3, 2, 1, 0];
    for (let r = 4; r >= 0; r--) {
      const z = ZR[r], rg = UTIL.g(g, box(5, 8, z - 2, 84, 66, 2), { class: 'sp-row' });
      if (r === 4 && lv.twin) rg.insertAdjacentHTML('beforeend', `<g data-part="twin">${twinBelt()}</g>`);
      const coils = [];
      for (const c of cols) {
        const cx = CX[c], zc = z + 7.5, t = SP.coilIdx(r, c);
        const hullPts = [[cx - 9, 8, z], [cx + 9, 8, z], [cx - 9, 76, z], [cx + 9, 76, z], [cx - 9, 8, z + 24], [cx + 9, 8, z + 24], [cx - 9, 76, z + 24], [cx + 9, 76, z + 24]].map(p => P(...p));
        if (r === 4 && lv.twin && c === (ISO.right ? 2 : 1)) rg.insertAdjacentHTML('beforeend', `<g data-part="twin">${twinWall()}</g>`);
        const cg = UTIL.g(rg, box(cx - 4.5, 3, zc - 4.5, 9, 5, 9) + `<path class="coil back"/>`, { class: 'hit sp-coil', 'data-hit': 'coil', 'data-t': lv.twin && t === TW.t2 ? TW.t : t });
        const items = UTIL.g(cg, '', { class: 'sp-items' });
        cg.insertAdjacentHTML('beforeend', `<path class="coil front"/><path d="${GLY.toD(GLY.hull(hullPts))}" fill="transparent"/>`);
        coils[c] = { g: cg, items, back: cg.querySelector('.coil.back'), front: cg.querySelector('.coil.front'), cx, zc };
      }
      // price strips; the twin lane has one, in its middle
      // (the twin lane's is yellow and twice as wide: 「E3·4」)
      const tw = lv.twin && r === 4, strip = (x, c) => { const w = tw && c === 2 ? 20 : 12, y = tw && c === 2;
        return `<g transform="${FRONT(x - w / 2, 74.8, z - .4)}"><rect width="${w}" height="3.8" rx=".6" fill="${y ? '#ffd23f' : '#10141a'}" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/><text x="${w / 2}" y="2.9" font-size="2.5" text-anchor="middle" fill="${y ? '#141018' : 'var(--ink-hi)'}">${'ABCDE'[r]}${y ? '3·4' : c + 1} ${UTIL.money(SP.ROWS[r][c][1])}</text></g>`; };
      rg.insertAdjacentHTML('beforeend', `<path class="shelfled" d="${path([[5.5, 74.6, z], [88.5, 74.6, z]])}"/>`
        + CX.map((cx, c) => tw && c === 3 ? '' : strip(tw && c === 2 ? TW.cx : cx, c)).join(''));
      if (r === 4 && !lv.twin) rg.insertAdjacentHTML('beforeend', `<g class="ugh-g">${twinGhost()}</g>`);
      rows[r] = coils;
    }
    if (ISO.right) service();
    // the lift: rails, belt, pulleys, tray
    g.insertAdjacentHTML('beforeend', [4.5, 89.5].map(x => `<path class="hair" d="${path([[x, 80, 10], [x, 80, 230]])}"/><path class="detail" d="${path([[x, 82, 10], [x, 82, 230]])}"/>`).join('')
      + [228, 12].map((z, i) => `<g transform="${FRONT(89.5, 81, z)}"><circle class="face" r="3"/><g class="sp-pulley" data-i="${i}"><path class="hair" d="M-2.4 0H2.4M0 -2.4V2.4"/></g></g>`).join('')
      + (lv.lift ? '' : box(82, 70, 3, 9, 10, 8)));
    const liftG = lv.lift ? UTIL.g(g, liftKit(), { 'data-part': 'lift' }) : (g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${liftGhost()}</g>`), null);
    const lift = UTIL.g(g, box(6, 75.5, 0, 82, 7.5, 2.2) + `<g transform="${FRONT(6, 83, 4.4)}"><rect width="82" height="2.2" fill="#1b2029" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/></g>`
      + `<path class="liftled" d="${path([[7, 83.2, 2.4], [87, 83.2, 2.4]])}"/>` + (lv.eye ? `<g data-part="eye">${eyeKit()}</g>` : `<g class="ugh-g">${eyeGhost()}</g>`), { class: 'sp-lift' });
    const movers = UTIL.g(g, '', { class: 'sp-movers' });
    g.insertAdjacentHTML('beforeend', `<path class="tubelight" d="${path([[6, 80, 224], [88, 80, 224]])}"/>`
      + (lv.eye ? '' : pin('eye', 86, 80, ZE_OUT + 10)) + (lv.lift ? '' : pin('lift', 3, 80, 196)) + (lv.twin ? '' : pin('twin', TW.cx, 72, ZR[4] + 18)));
    return { rows, cm, pulses, lift, movers, fan: g.querySelector('.sp-fan'), pulleys: [...g.querySelectorAll('.sp-pulley')],
      beam: lift.querySelector('.sp-beam'), cw: liftG && liftG.querySelector('.sp-cw'), cables: liftG ? [...liftG.querySelectorAll('.sp-cable')] : [], cablesAt: cables };
  }

  // the door tells: a row of stickers on the strip between the glass and the outlet, as real machines carry them
  const sticker = (x, w, bg, fg, t, icon = '') => `<g class="nohit" transform="translate(${x} 194.9)"><rect width="${w}" height="4.6" rx="1.1" fill="${bg}" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><g transform="translate(0 -.8)">${icon}</g><text x="${w / 2 + (icon ? 2.2 : 0)}" y="3.4" font-size="2.5" text-anchor="middle" fill="${fg}" class="sign">${t}</text></g>`;
  function exterior(g, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk;
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // right side: the name in big letters; left side: an outline "menu" of what it sells
    const ln = 'fill="rgba(255,111,145,.07)" stroke="rgba(255,111,145,.42)" stroke-width=".7" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="var(--rose)" filter="url(#soft)"/>
      ${['な', 'ん', 'で', 'も'].map((ch, i) => `<text class="sign" x="42" y="${50 + i * 28}" font-size="23" text-anchor="middle" fill="rgba(255,111,145,.14)" stroke="rgba(255,111,145,.38)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <g transform="translate(18 160)"><circle cx="8" cy="8" r="7" fill="none" stroke="var(--yellow)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/><path d="M4 9q4 4 8 0" fill="none" stroke="var(--yellow)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/>
      <path d="M30 2l-6 14h12z" fill="none" stroke="var(--cyan)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/><rect x="40" y="3" width="8" height="13" rx="1.5" fill="none" stroke="var(--rose)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/></g>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="var(--rose)" filter="url(#soft)"/><g class="iso-only">
      <path d="M30 32l2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 2-3 2 3 1 12-1 12-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-2 3-2-3-1-12z" ${ln}/><ellipse cx="42" cy="44" rx="6" ry="4.6" ${ln}/>
      <path d="M42 70l14 24H28z" ${ln}/><rect x="37" y="86" width="10" height="8" ${ln}/>
      <ellipse cx="40" cy="126" rx="13" ry="7" ${ln}/><circle cx="50" cy="113" r="6" ${ln}/><path d="M56 113h5l-2 3h-3" ${ln}/>
      <path d="M27 160q15-16 30 0z" ${ln}/><path d="M42 160v15q0 3-3 3t-3-3" fill="none" stroke="rgba(255,111,145,.42)" stroke-width=".7" vector-effect="non-scaling-stroke"/>
      <text class="label" x="42" y="193" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(255,111,145,.6)">SNACK · TOY · ANYTHING</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const key = (k, x, y) => R3(x, y, 9, 7, 1.2, `<rect class="led" x="${x + 1.4}" y="${y + 5}" width="6.2" height="1" rx=".5"/><text class="label" x="${x + 4.5}" y="${y + 4.4}" font-size="3.2" text-anchor="middle">${k}</text>`, { r: 1.4, cls: 'sp-key', attrs: `data-key="${k}"` });
    const keys = ['A', 'B', 'C', 'D', 'E'].map((k, i) => key(k, 94, 44 + i * 8.6)).join('') + ['1', '2', '3', '4'].map((k, i) => key(k, 105, 44 + i * 8.6)).join('');
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0ZM5 24V194H89V24ZM8 200V228H86V200Z" fill-rule="evenodd"/>
      ${R3(4, 4, 112, 16, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="16" rx="2.5" style="stroke:var(--rose)"/>
        <text class="lit-text sign on" style="--lc:var(--rose)" x="40" y="16.6" font-size="12" text-anchor="middle" filter="url(#soft)">なんでも</text>
        <text class="label" x="96" y="11" font-size="2.9" text-anchor="middle" letter-spacing=".4">SNACK · ANYTHING</text><text class="label" x="96" y="16" font-size="2.9" text-anchor="middle" letter-spacing=".4">24H</text>`, { noCap: true })}
      ${SK(5, 24, 84, 170, 4, { hole: true })}
      <rect class="dglass nohit" x="5" y="24" width="84" height="170"/><path class="nohit" d="M14 24L30 24L10 194H-6Z" fill="#fff" opacity=".03"/><path class="nohit" d="M60 24L66 24L48 194H42Z" fill="#fff" opacity=".028"/>
      ${lv.eye ? sticker(7, 25, '#eaf8ee', '#1d5a32', '落下センサー', '<circle cx="3" cy="3.1" r="1.3" fill="#e8322a"/><path d="M4.6 3.1h2.2" stroke="#e8322a" stroke-width=".6" stroke-dasharray="1 .6"/>') : ''}
      ${lv.lift ? sticker(34, 24, '#ffd23f', '#141018', 'スピード出庫', '<path d="M1.8 1.6l1.6 1.5-1.6 1.5M3.8 1.6l1.6 1.5-1.6 1.5" fill="none" stroke="#141018" stroke-width=".6"/>') : ''}
      ${lv.twin ? sticker(61, 26, '#ff4f8b', '#fff', '大きい物 OK', '<rect x="1.4" y="1.5" width="4" height="3.2" rx=".4" fill="none" stroke="#fff" stroke-width=".6"/>') : ''}
      ${SK(93, 26, 22, 12, 1.4)}<text class="scr sp-scr" x="104" y="34.2" font-size="4" text-anchor="middle">SELECT</text>
      ${keys}${R3(105, 78.4, 9, 7, 1.2, `<text class="label" x="109.5" y="82.8" font-size="2.6" text-anchor="middle">CLR</text>`, { r: 1.4 })}
      ${R3(100, 96, 10, 15, 1.6, `<rect class="recess" x="104.2" y="98" width="1.6" height="11" rx=".6"/><rect class="sp-slotglow" x="98.6" y="94.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" filter="url(#soft)" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="116" font-size="2.6" text-anchor="middle">COIN</text>
      ${R3(96, 119, 18, 5, 1, `<rect class="recess" x="98" y="121" width="14" height="1.2"/>`, { r: 1 })}
      ${R3(95, 128, 20, 12, 1, `<path class="hair" d="M101 134a3 3 0 0 1 0-1M103 135.5a5 5 0 0 0 0-4M105 137a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="135.6" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 147, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 147h4"/>' })}
      <g data-hit="cup" class="hit">${SK(97, 156, 16, 16, 3.5, { r: 2 })}</g><text class="label" x="105" y="177" font-size="2.6" text-anchor="middle">おつり</text>
      ${SK(8, 200, 78, 28, 5, { hole: true })}
      <rect class="sp-outglow nohit" x="10" y="204" width="74" height="22" rx="2" fill="var(--accent)" opacity="0" filter="url(#bloom-s)"/>
      <g data-hit="outlet" class="hit sp-flapg"><rect class="sp-flap" x="9.5" y="201" width="75" height="26" rx="2" fill="rgba(140,150,165,.16)" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
        <text class="label" x="47" y="207" font-size="3" text-anchor="middle" letter-spacing="1">PUSH</text></g>
      ${CORE.lock(100, 186)}
      ${SK(6, 231, 108, 6, 1)}${ISO.slits(232.2, 236, 1.8, 10, 110, false)}`;
    const inn = `<rect class="face" width="120" height="240" style="fill:#101318"/><path class="face nohit" d="M0 0H120V240H0ZM5 24V194H89V24Z" fill-rule="evenodd" style="fill:#121620"/>
      <rect class="face" x="92" y="40" width="24" height="50" rx="1.5"/><path class="wire2" d="M112 30V230M112 64H95M112 150H96"/><path class="hair" d="M117 20V220"/>
      <rect class="face" x="113" y="186" width="5" height="22" rx="1"/><rect class="dglass nohit" x="5" y="24" width="84" height="170"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'sp-door', transform: FRONT(0, D, H) });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'),
      keys: Object.fromEntries([...door.querySelectorAll('.sp-key')].map(k => [k.dataset.key, k])), scr: door.querySelector('.sp-scr'),
      slotGlow: door.querySelector('.sp-slotglow'), outGlow: door.querySelector('.sp-outglow'), flap: door.querySelector('.sp-flap') };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="24" width="84" height="170"/><rect class="xline" x="4" y="4" width="112" height="16"/>
      <rect class="xline" x="93" y="26" width="22" height="12"/><rect class="xline" x="94" y="44" width="20" height="41"/><rect class="xline" x="8" y="200" width="78" height="28"/></g>`);
  }
  return { interior, exterior, ghost };
})();
