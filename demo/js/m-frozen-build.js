/* Fig 8 · ゆきんこ — geometry, after Sanden's ど冷えもん (2021-): a −25℃ cabinet with combination shelves (four kinds of
   module: twin, half, single, quarter), each a set of spirals with a pitch to suit its goods; the big things sit across
   two spirals that turn together. A goods item is pushed off the front and drops to the bin (or, with the multi-elevator,
   is caught by a platform). Frost grows on the evaporator with every sale and every door opening; when it is thick the
   machine defrosts (heater, meltwater into the drain pan, 霜取り中). Solid insulated door: the insides show in X-ray.
   Machine room at the bottom (compressor, condenser, fan, copper lines); coin column right. */
const FZ = (() => {
  const W = 120, D = 84, H = 240;
  // modules: spiral x positions, radius, pitch, places per spiral (front first); twin: one lane between two spirals
  const MOD = {
    quarter: { xs: [17, 37, 57, 77], r: 4.6, pitch: 9, n: 6 },
    single: { xs: [20, 47, 74], r: 6.2, pitch: 13, n: 4 },
    half: { xs: [27, 67], r: 7.4, pitch: 17, n: 3 },
    twin: { xs: [36, 58], r: 6.2, pitch: 17, n: 3, lane: 47 },
  };
  // shelves by menu place: k 0..3 always, k 4 (the top quarter shelf) with the upgrade
  const SHELVES = [{ z: 172, mod: 'quarter' }, { z: 134, mod: 'single' }, { z: 96, mod: 'half' }, { z: 58, mod: 'twin' }, { z: 210, mod: 'quarter' }];
  const FRONT_Y = 70, SHELF_Y = [16, 74];
  const lanes = k => { const m = MOD[SHELVES[k].mod]; return m.lane ? [m.lane] : m.xs; };
  const capOf = k => lanes(k).length * MOD[SHELVES[k].mod].n;
  const itemAt = (k, lane, j) => [lanes(k)[lane], FRONT_Y - j * MOD[SHELVES[k].mod].pitch, SHELVES[k].z];
  const LIFT = { x0: 8, x1: 86, y: 78, bottom: 20 };
  const WINDOW = [60, 74, 30];
  const MENU = [
    { name: 'バニラアイス', price: 260, row: 0, pack: 'cup', g: 'cup', fill: '#fff4d6', d: '#3f7fff' },
    { name: '餃子', price: 420, row: 1, pack: 'box', g: 'gyoza', fill: '#f2d29a', d: '#e8453a' },
    { name: 'チャーハン', price: 480, row: 2, pack: 'tall', g: 'chahan', fill: '#f2c46a', d: '#ff8a1e' },
    { name: '冷凍ピザ', price: 680, row: 3, pack: 'big', g: 'pizza', fill: '#e8453a', d: '#2f8a3a' },
    { name: '抹茶アイス', price: 280, row: 0, pack: 'cup', g: 'cup', fill: '#9bd06a', d: '#2f8a3a' },
  ];
  return { W, D, H, MOD, SHELVES, FRONT_Y, SHELF_Y, lanes, capOf, itemAt, LIFT, WINDOW, MENU, SLOTW: [105, D, 184] };
})();

const FZB = (() => {
  const { FRONT, SIDE, TOP, box, rounded, rect, path, P, f, slits } = ISO;
  const { W, D, H, MOD, SHELVES, SHELF_Y, LIFT } = FZ;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const vars = p => `--c:${p.fill};--d:${p.d || '#3f7fff'}`;
  const at = (x, y, z) => { const q = P(x, y, z); return [f(q[0]), f(q[1])]; };
  const disc = (x, y, z, r, fill, n = 16) => `<path d="${toD(ringZ(z, r, n, 0, Math.PI * 2, x, y))}" style="fill:${fill};${ST}"/>`;
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 16) => `<path d="${toD(hull([...ringZ(z0, r0, n, 0, Math.PI * 2, x, y), ...ringZ(z1, r1, n, 0, Math.PI * 2, x, y)]))}" style="fill:${fill};${ST}"/>`;
  const quad = (pts, fill) => `<path d="${toD(pts.map(p => P(...p)))}" style="fill:${fill};${ST}"/>`;

  /* ---------- glyphs: the packed goods on the shelves (cup, flat box, tall box, big box, cake jar) ---------- */
  function defs() {
    const cup = `<g id="g-fz-cup">${cyl(0, 0, 0, 6.4, 3.2, 4, '#fafcff')}<path d="${toD(hull([...ringZ(2, 3.45, 16), ...ringZ(4, 3.7, 16)]))}" style="fill:var(--d)"/>${disc(0, 0, 6.5, 4.1, 'var(--d)')}</g>`;
    const flat = `<g id="g-fz-box">${box(-5, -5.5, 0, 10, 11, 6, 0, 'fz-pack')}<g transform="${TOP(-5, -5.5, 6.03)}"><rect x="1.4" y="1.6" width="7.2" height="7.8" rx="1" fill="#fff8ec"/><ellipse cx="5" cy="5.5" rx="2.4" ry="1.6" style="fill:var(--c)"/></g></g>`;
    const tall = `<g id="g-fz-tall">${box(-6, -6, 0, 12, 12, 13, 0, 'fz-pack')}<g transform="${FRONT(-6, 6.03, 13)}"><rect x="1.5" y="2" width="9" height="7" rx="1" fill="#fff8ec"/><path d="M3 5.4h6q-.4 2.6-3 2.6t-3-2.6z" style="fill:var(--c)"/></g></g>`;
    const big = `<g id="g-fz-big">${box(-12, -8, 0, 24, 16, 7, 0, 'fz-pack')}<g transform="${TOP(-12, -8, 7.03)}"><rect x="4" y="3" width="16" height="10" rx="1.4" fill="rgba(220,240,255,.85)"/><circle cx="12" cy="8" r="3.6" style="fill:var(--c)"/></g></g>`;
    const jar = `<g id="g-fz-jar">${cyl(0, 0, 0, 3, 4, 4, '#fff4dc')}${cyl(0, 0, 3, 5.4, 4, 4, 'var(--c)')}${cyl(0, 0, 5.4, 8, 4, 4, '#fffaf0')}${cyl(0, 0, 8, 9.2, 4.2, 4.2, 'var(--d)')}<path d="${toD(hull([...ringZ(0, 4.2, 16), ...ringZ(8, 4.2, 16)]))}" fill="rgba(220,240,255,.18)" stroke="rgba(220,240,255,.7)" stroke-width=".6" vector-effect="non-scaling-stroke"/></g>`;
    return cup + flat + tall + big + jar;
  }
  const use = (id, p, x, y, z, extra = '') => { const [sx, sy] = P(x, y, z); return `<use href="#${id}" x="${f(sx)}" y="${f(sy)}" style="${vars(p)}" ${extra}/>`; };
  const packOf = p => 'g-fz-' + (p.pack || 'box');

  /* ---------- the goods out in the window, frost gone: what each one really is (drawn in place, not as shared glyphs) ---------- */
  const SHOW = {
    cup: (x, y, z, p) => { const [sx, sy] = at(x, y, z + 7.2); return `${cyl(x, y, z, z + 6.4, 3.2, 4, '#fafcff')}<path d="${toD(hull([...ringZ(z + 2, 3.45, 16, 0, Math.PI * 2, x, y), ...ringZ(z + 4, 3.7, 16, 0, Math.PI * 2, x, y)]))}" style="fill:${p.d}"/>
      <path d="${toD(hull([...ringZ(z + 6.4, 3.9, 16, 0, Math.PI * 2, x, y), ...ringZ(z + 8, 2.6, 16, 0, Math.PI * 2, x, y)]))}" style="fill:${p.fill};${ST}"/><path d="M${sx - 1} ${sy - 1.4}l4.6 -3.6" stroke="#d8b080" stroke-width="1.4" stroke-linecap="round"/>
      ${quad([[x - 4, y - 4.4, z + 6.6], [x + 4, y - 4.4, z + 6.6], [x + 4, y - 8, z + 11], [x - 4, y - 8, z + 11]], p.d)}`; },
    gyoza: (x, y, z, p) => `${box(x - 7, y - 6, z, 14, 12, 1.6, 0, 'fz-tray')}${[[-4, -2.4], [0, -2.4], [4, -2.4], [-2, 2.2], [2, 2.2]].map(([u, v]) => { const [a, b] = at(x + u, y + v, z + 2.6);
      return `<path d="M${f(a - 2.4)} ${f(b + .8)}q2.4-3.4 4.8 0z" fill="#f6ead0" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M${f(a - 2)} ${f(b + .8)}h4" stroke="#c88a3a" stroke-width=".9"/>`; }).join('')}`,
    yakitori: (x, y, z, p) => `${box(x - 7, y - 5, z, 14, 10, 1.6, 0, 'fz-tray')}${[-3, 0, 3].map(v => { const a = at(x - 6, y + v, z + 2.6), b = at(x + 6, y + v, z + 2.6);
      return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#d8b080" stroke-width=".7"/>` + [-3.4, -.6, 2.2].map((u, i) => { const c = at(x + u, y + v, z + 3); return `<circle cx="${c[0]}" cy="${c[1]}" r="1.4" fill="${i === 1 ? '#7fc96b' : p.fill}" stroke="rgba(0,0,0,.4)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`; }).join(''); }).join('')}`,
    karaage: (x, y, z, p) => `${box(x - 6, y - 5, z, 12, 10, 1.6, 0, 'fz-tray')}${[[-2.4, -1.6, 0], [1.6, -2, 0], [-1, 1.6, 0], [2.6, 1.8, 0], [.2, -.2, 1.6]].map(([u, v, h]) => { const c = at(x + u, y + v, z + 3.2 + h); return `<ellipse cx="${c[0]}" cy="${c[1]}" rx="2.2" ry="1.7" fill="${p.fill}" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`; }).join('')}${(() => { const c = at(x + 4.4, y - 3, z + 2.4); return `<path d="M${c[0] - 1.6} ${c[1]}a1.6 1.6 0 0 1 3.2 0z" fill="#ffe14a" stroke="rgba(0,0,0,.4)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`; })()}`,
    chahan: (x, y, z, p) => `${cyl(x, y, z, z + 3.6, 3.6, 5.4, '#f6f2ea')}<path d="${toD(hull([...ringZ(z + 3.6, 5, 18, 0, Math.PI * 2, x, y), ...ringZ(z + 5.6, 3.2, 18, 0, Math.PI * 2, x, y)]))}" style="fill:${p.fill};${ST}"/>${[[-1.6, -1, '#7fc96b'], [1.4, -1.8, '#ff8fa8'], [.4, 1.4, '#7fc96b'], [-2.4, 1.2, '#ff8fa8'], [2.4, .8, '#ffd23f']].map(([u, v, c]) => { const q = at(x + u, y + v, z + 5.4); return `<circle cx="${q[0]}" cy="${q[1]}" r=".55" fill="${c}"/>`; }).join('')}`,
    ramen: (x, y, z, p) => `${cyl(x, y, z, z + 4.6, 3.6, 6, '#c8452f')}${disc(x, y, z + 4.6, 5.6, p.fill)}${[-2, 0, 2].map(v => { const a = at(x - 3.4, y + v, z + 4.7), b = at(x + 3, y + v + .6, z + 4.7); return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#f3d27a" stroke-width="1"/>`; }).join('')}${disc(x + 2, y - 1.8, z + 4.9, 1.8, '#e8b080')}${disc(x - 2.4, y + 2, z + 4.9, 1.3, '#ffd23f')}`,
    tsukemen: (x, y, z, p) => `${box(x - 8, y - 5, z, 9, 10, 1.6, 0, 'fz-tray')}${[-2.6, -.8, 1, 2.8].map(v => { const a = at(x - 7, y + v, z + 2), b = at(x - .4, y + v, z + 2); return `<path d="M${a[0]} ${a[1]}Q${f((+a[0] + +b[0]) / 2)} ${f(+a[1] - 1.4)} ${b[0]} ${b[1]}" fill="none" stroke="#f3d27a" stroke-width="1.1"/>`; }).join('')}${cyl(x + 5, y, z, z + 4, 2.6, 3.6, '#2a1a14')}${disc(x + 5, y, z + 4, 3.2, p.fill)}`,
    pizza: (x, y, z, p) => `${box(x - 10, y - 8, z, 20, 16, 1.4, 0, 'fz-tray')}${disc(x, y, z + 1.6, 7.4, '#e8b46a', 22)}${disc(x, y, z + 1.9, 6.4, p.fill, 22)}${[[-3, -2], [2.4, -3], [3.4, 2.4], [-2, 3.4], [0, 0], [-4.4, .8]].map(([u, v]) => disc(x + u, y + v, z + 2.1, 1.1, '#9a1f14', 10)).join('')}${[[-1.4, -3.4], [1.6, 1], [-3, 2]].map(([u, v]) => disc(x + u, y + v, z + 2.15, .6, '#3aa04a', 8)).join('')}`,
    jar: (x, y, z, p) => `${cyl(x, y, z, z + 3, 4, 4, '#fff4dc')}${cyl(x, y, z + 3, z + 5.4, 4, 4, p.fill)}${cyl(x, y, z + 5.4, z + 8, 4, 4, '#fffaf0')}${disc(x, y, z + 8, 4, '#fffaf0')}${[[-1.6, -1], [1.6, -.6], [0, 1.6]].map(([u, v]) => disc(x + u, y + v, z + 8.4, 1, '#e8453a', 10)).join('')}${(() => { const c = at(x - .4, y - .4, z + 9.6); return `<path d="M${c[0]} ${c[1]}l.8-1.6" stroke="#3aa04a" stroke-width=".8"/>`; })()}
      <path d="${toD(hull([...ringZ(z, 4.2, 16, 0, Math.PI * 2, x, y), ...ringZ(z + 8.4, 4.2, 16, 0, Math.PI * 2, x, y)]))}" fill="rgba(220,240,255,.16)" stroke="rgba(220,240,255,.75)" stroke-width=".6" vector-effect="non-scaling-stroke"/>
      ${quad([[x - 4.2, y - 4.6, z + 8.6], [x + 4.2, y - 4.6, z + 8.6], [x + 4.2, y - 8, z + 12.4], [x - 4.2, y - 8, z + 12.4]], p.d)}`,
    sashimi: (x, y, z, p) => `${box(x - 9, y - 6, z, 18, 12, 1.6, 0, 'fz-tray')}${disc(x - 5, y + 2, z + 1.8, 2.6, '#3aa04a', 10)}${[['#ff8a5a', -6], ['#d8263a', -1], ['#fff4ea', 4]].map(([c, u]) => [0, 1, 2].map(i => { const q = at(x + u + i * 1.2, y - 2 + i * 1.4, z + 2.4 + i * .3);
      return `<path d="M${f(q[0] - 2.4)} ${f(q[1] + .8)}q2.4-2.2 4.8 0q-2.4 1-4.8 0z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width=".4" vector-effect="non-scaling-stroke"/>`; }).join('')).join('')}`,
    crab: (x, y, z, p) => `${box(x - 11, y - 7, z, 22, 14, 1.6, 0, 'fz-tray')}${[-3.6, -1.2, 1.2, 3.6].map((v, i) => { const a = at(x - 9, y + v, z + 2.4), b = at(x + 8, y + v + (i % 2 ? .6 : -.6), z + 2.4);
      return `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${p.fill}" stroke-width="2.2" stroke-linecap="round"/><path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#fff4ea" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`; }).join('')}${(() => { const c = at(x + 7, y, z + 3.4); return `<path d="M${c[0] - 2} ${c[1]}l2-2.4 2 2.4-2 1.4z" fill="${p.fill}" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/>`; })()}`,
  };
  const show = (p, x, y, z) => (SHOW[p.g] || SHOW.gyoza)(x, y, z, p);
  // the cloud of cold air that rolls out when the goods arrive
  const fog = (x, y, z) => [[-4, 0, .0], [3, -1, .08], [0, 2, .16], [-2, -2, .1]].map(([u, v, d]) => { const [sx, sy] = at(x + u, y + v, z + 4); return `<circle class="fz-fog" style="animation-delay:${d}s" cx="${sx}" cy="${sy}" r="4"/>`; }).join('');

  // flat icons (24 × 24) for the door and the shop
  // (app build, goods polish: the prototype's icon (icon0) with frost and each dish's own marks on top: a swirl in the
  // ice cream, gyoza pleats and their browned bottoms, grill marks, crumbs, egg in the fried rice, naruto and nori,
  // basil and cheese, the cake's layers, the fish's lines, the crab's joints)
  function icon(g, c, d) {
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const shine = d => ln(d, '#fff', .9, ' opacity=".55"');
    const G = [6.5, 12, 17.5];
    const M = {
      cup: () => ln('M8 8.6q2-1.6 4-.6t3.6-.6', '#fff', 1, ' opacity=".5"') + `<path d="${dots([[8.4, 18.4], [15.4, 11.6], [9.6, 11.4], [14.6, 18.8]], .4)}" fill="#cfe8ff"/>`,
      gyoza: () => ln(G.map(x => `M${x - 1.6} 12.2l.4.8M${x} 11.3v.9M${x + 1.6} 12.2l-.4.8`).join(''), '#c8b890', .5) + ln(G.map(x => `M${x - 2.8} 13.6h5.6`).join(''), '#c88a3a', .9),
      yakitori: () => ln([7, 12, 17].map(y => `M6.2 ${y + .6}l1.6-1.2M16.2 ${y + .6}l1.6-1.2`).join(''), '#5a2a10', .6) + `<path d="${dots([[6.4, 6.2], [11.4, 11.2], [16.4, 16.2]], .35)}" fill="#fff" opacity=".7"/>`,
      karaage: () => ln('M6.6 13.4l.5.3M8.6 15l.4-.2M13 14.2l.5.3M15.4 16l.4-.2M10.4 9.2l.5.3M15 9.4l.5.3M17 11l.4-.2', '#a8601a', .6),
      chahan: () => `<path d="${dots([[7.4, 10.6], [11, 8.4], [16.4, 10.4], [12.6, 11]], .55)}" fill="#ffd23f"/>` + ln('M8.6 9.2l.4.2M10.4 10.6l.4-.1M14 9.4l.4.2M13.6 11.2l.4-.1', '#fff8e0', .5),
      ramen: () => `<circle cx="8.6" cy="10.6" r="1.4" fill="#fff" stroke="#141018" stroke-width=".5"/>` + ln('M8.2 10.4q.4-.5.8 0t-.4.6', '#ff5fa2', .5) + `<path d="M17.4 6.8l2 .6-.8 3.6-2-.6z" fill="#1e2a20" stroke="#141018" stroke-width=".5"/>`,
      tsukemen: () => `<path d="${dots([[16.6, 11.8], [18.4, 12.2], [19.4, 11.6]], .45)}" fill="#7fc96b"/>`,
      pizza: () => `<path d="M8.4 12.4q.8-1.4 2-.6q-.6 1.4-2 .6zM13.6 7.4q.8-1.4 2-.6q-.6 1.4-2 .6z" fill="#3a9a3a"/>` + `<path d="${dots([[12.6, 12.2], [8.6, 15.6], [14.4, 12.8]], .9)}" fill="#fff4dc" opacity=".85"/>`,
      jar: () => ln('M7.4 16h9.2', '#e8c890', .7) + `<path d="${dots([[9, 18], [12.4, 17.6], [15, 18.4]], .35)}" fill="#e0b870"/>` + shine('M7.6 7v12'),
      sashimi: () => ln('M5.4 13.4l.6-1.2M7.4 13.4l.6-1.4M11 13.4l.6-1.2M13 13.4l.6-1.4', '#fff', .5, ' opacity=".7"') + `<path d="M17.4 16.4q1.6-2 3.4-1q-1.2 2-3.4 1z" fill="#3aa04a"/>`,
      crab: () => ln('M8 6.6v2.8M13 6.6v2.8M8 10.6v2.8M13 10.6v2.8M8 14.6v2.8M13 14.6v2.8', '#a82a1a', .6) + ln('M3 8h1.6M3 12h1.6M3 16h1.6', '#fff4ea', 2.2),
    };
    return icon0(g, c, d) + (M[g] ? M[g]() : '');
  }
  function icon0(g, c, d) {
    const k = 'stroke="#141018" stroke-width="1.3" stroke-linejoin="round"';
    switch (g) {
      case 'cup': return `<path d="M6 10h12l-1.6 10H7.6z" fill="#fafcff" ${k}/><rect x="6.6" y="13" width="10.8" height="3" fill="${d}"/><path d="M6 10q0-6 6-6t6 6z" fill="${c}" ${k}/><path d="M14 5l3-3" stroke="#d8b080" stroke-width="1.6" stroke-linecap="round"/>`;
      case 'gyoza': return `<rect x="3" y="12" width="18" height="7" rx="1.4" fill="#2a2f3a" ${k}/>${[6.5, 12, 17.5].map(x => `<path d="M${x - 3.4} 14q3.4-6 6.8 0z" fill="#f6ead0" ${k}/>`).join('')}`;
      case 'yakitori': return `${[7, 12, 17].map(y => `<path d="M3 ${y}h18" stroke="#d8b080" stroke-width="1.2"/><circle cx="7" cy="${y}" r="2" fill="${c}" ${k}/><circle cx="12" cy="${y}" r="2" fill="#7fc96b" ${k}/><circle cx="17" cy="${y}" r="2" fill="${c}" ${k}/>`).join('')}`;
      case 'karaage': return `${[[8, 14], [14, 15], [11, 10], [16, 10]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="3" fill="${c}" ${k}/>`).join('')}<path d="M4 18a3 3 0 0 1 6 0z" fill="#ffe14a" ${k}/>`;
      case 'chahan': return `<path d="M3 12h18q-1 8-9 8t-9-8z" fill="#f6f2ea" ${k}/><path d="M4.4 12q7.6-9 15.2 0z" fill="${c}" ${k}/><circle cx="9" cy="10" r=".9" fill="#7fc96b"/><circle cx="13" cy="9" r=".9" fill="#ff8fa8"/><circle cx="15" cy="11" r=".9" fill="#7fc96b"/>`;
      case 'ramen': return `<path d="M3 11h18q-1.4 9-9 9t-9-9z" fill="#c8452f" ${k}/><ellipse cx="12" cy="11" rx="9" ry="2.4" fill="${c}" ${k}/><path d="M6 11q3-1.6 6 0t6 0" fill="none" stroke="#f3d27a" stroke-width="1.4"/><circle cx="15" cy="10.4" r="1.6" fill="#ffd23f"/>`;
      case 'tsukemen': return `<rect x="2.5" y="10" width="11" height="9" rx="1.4" fill="#2a2f3a" ${k}/><path d="M4 13q3.6-2 7 0M4 16q3.6-2 7 0" fill="none" stroke="#f3d27a" stroke-width="1.4"/><path d="M14 12h8q-.6 7-4 7t-4-7z" fill="#2a1a14" ${k}/><ellipse cx="18" cy="12" rx="4" ry="1.2" fill="${c}"/>`;
      case 'pizza': return `<circle cx="12" cy="12" r="9" fill="#e8b46a" ${k}/><circle cx="12" cy="12" r="7" fill="${c}"/>${[[9, 9], [15, 10], [11, 15], [16, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#9a1f14"/>`).join('')}`;
      case 'jar': return `<rect x="6" y="5" width="12" height="16" rx="2" fill="rgba(220,240,255,.5)" ${k}/><rect x="7" y="13" width="10" height="7" fill="#fff4dc"/><rect x="7" y="10" width="10" height="3" fill="${c}"/><rect x="5.4" y="3.4" width="13.2" height="3" rx="1" fill="${d}" ${k}/><circle cx="12" cy="8.4" r="1.4" fill="#e8453a"/>`;
      case 'sashimi': return `<rect x="2.5" y="12" width="19" height="7" rx="1.4" fill="#2a2f3a" ${k}/><path d="M4 14q3-4 6 0z" fill="#ff8a5a" ${k}/><path d="M9.6 14q3-4 6 0z" fill="#d8263a" ${k}/><path d="M15 14q3-4 6 0z" fill="#fff4ea" ${k}/><circle cx="6" cy="17" r="1.6" fill="#3aa04a"/>`;
      case 'crab': return `${[8, 12, 16].map(y => `<path d="M3 ${y}h16" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('')}<path d="M18 9l3 3-3 3-2-3z" fill="${c}" ${k}/>`;
    }
    return `<rect x="5" y="6" width="14" height="12" rx="1.4" fill="${d}" ${k}/>`;
  }

  // a spiral along y (back to front) around (cx, zc), split into the half behind and the half in front of the goods
  function helix(cx, zc, r, pitch, phase) {
    const turns = (SHELF_Y[1] - SHELF_Y[0]) / pitch, n = Math.ceil(16 * turns), back = [], front = [];
    let run = null, vis = null, prev = null;
    for (let i = 0; i <= n; i++) {
      const t = i / n * turns * Math.PI * 2, a = t + phase, q = P(cx + r * Math.sin(a), SHELF_Y[0] + pitch * t / (Math.PI * 2), zc + r * Math.cos(a));
      const v = ISO.dir(Math.sin(a), 0, Math.cos(a)) > 0;
      if (v !== vis) { run = prev ? [prev] : []; (v ? front : back).push(run); vis = v; }
      run.push(q); prev = q;
    }
    const d = runs => runs.map(r => 'M' + r.map(q => f(q[0]) + ' ' + f(q[1])).join('L')).join('');
    return { back: d(back), front: d(front) };
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };
  const post = (x, y, z, h) => box(x - .8, y - .8, z, 1.6, 1.6, h);

  /* ---------- the inside. lv: fitted parts { defrost, elev, shelf } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right, ks = [0, 1, 2, 3, ...(lv.shelf ? [4] : [])];
    let s = CORE.shell(W, D, H);
    // the machine room: compressor, condenser with its fan, the copper lines up to the evaporator, the drain and its tray
    s += `<path class="fz-cu" d="${path([[22, 26, 22], [22, 26, 34], [12, 8, 34], [12, 8, 60]])}"/><path class="fz-cu" d="${path([[30, 26, 16], [44, 20, 16]])}"/><path class="fz-cu" d="${path([[80, 20, 30], [86, 8, 40], [86, 8, 60]])}"/>`
      + cyl(22, 26, 6, 18, 8, 8, '#2a3038') + `<path d="${toD(hull([...ringZ(18, 8, 18, 0, Math.PI * 2, 22, 26), ...ringZ(24, 5, 18, 0, Math.PI * 2, 22, 26)]))}" style="fill:#343b45;${ST}"/>`
      + `<g transform="${FRONT(14, 34.1, 16)}"><text class="label sign" x="8" y="3" font-size="2.6" text-anchor="middle">COMP</text></g>`
      + box(40, 8, 6, 40, 22, 28) + `<g transform="${FRONT(40, 30.05, 34)}">${slits(3, 37, 2, 2, 26, true)}<circle class="face" cx="30" cy="14" r="8"/><path class="hair" d="M22 14H38M30 6V22"/></g>`
      + box(6, 50, 4, 30, 16, 4, 0, 'fz-pan') + `<path class="wire2" d="${path([[50, 12, 44], [50, 30, 8], [30, 58, 8]])}"/>`;
    // the insulated freezer: a cold liner on back and side, the floor; the evaporator on the back wall with its heater
    s += `<g transform="${FRONT(5, 5, 228)}"><rect width="84" height="184" class="fz-liner"/></g><g transform="${SIDE(RT ? 5 : 89, 78, 228)}"><rect width="73" height="184" class="fz-liner side"/></g>`
      + box(5, 5, 42, 84, 73, 2, 0, 'fz-floor') + box(8, 5, 52, 78, 7, 170, 0, 'fz-evap') + `<g transform="${FRONT(8, 12.05, 222)}">${slits(3, 75, 2.4, 2, 168, true, 'fz-fin')}</g>`;
    g.insertAdjacentHTML('beforeend', s);
    const frost = UTIL.g(g, '', { class: 'fz-frost' });   // drawn by the machine: frost on the evaporator and the shelves' backs
    const heater = UTIL.el('path', { class: 'fz-heater', d: 'M2 2h4l1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2 1.6-2 1.6 2h6', transform: FRONT(8, 12.1, 56) }, g);
    g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(36, 12.1, 226)}">${[0, 1].map(i => `<circle class="face" cx="${i * 18}" cy="0" r="5.4"/><path class="hair" d="M${i * 18 - 4} 0H${i * 18 + 4}M${i * 18} -4V4"/>`).join('')}</g>`);
    const drips = UTIL.g(g, '', { class: 'fz-drips' });
    let cm;
    const column = () => { cm = CORE.coinMech(g, { x: 96, z: 122 }, { x: 92, y: 6, z: 70 }, coinState); };
    if (!RT) column();
    // the shelves, bottom to top: a board, its spirals (back halves, the goods, front halves), a label strip
    const shelves = [];
    ks.slice().sort((a, b) => SHELVES[a].z - SHELVES[b].z).forEach(k => {
      const { z, mod } = SHELVES[k], M = MOD[mod], part = k === 4 ? { 'data-part': 'shelf' } : {};
      g.insertAdjacentHTML('beforeend', `<g ${k === 4 ? 'data-part="shelf"' : ''}>${box(6, SHELF_Y[0], z - 2, 82, SHELF_Y[1] - SHELF_Y[0], 2, 0, 'fz-shelf')}</g>`);
      const order = M.xs.map((x, i) => i).sort((a, b) => RT ? M.xs[a] - M.xs[b] : M.xs[b] - M.xs[a]);
      const coils = M.xs.map(x => ({ x, zc: z + M.r + .4, phase: 0 }));
      const backG = UTIL.g(g, order.map(i => box(M.xs[i] - 3, SHELF_Y[0] - 4, coils[i].zc - 3, 6, 4, 6) + `<path class="coil back" data-i="${i}"/>`).join(''), part);
      const items = UTIL.g(g, '', { class: 'fz-items', ...part });
      const frontG = UTIL.g(g, order.map(i => `<path class="coil front" data-i="${i}"/>`).join(''), part);
      coils.forEach((c, i) => { c.back = backG.querySelector(`.coil.back[data-i="${i}"]`); c.front = frontG.querySelector(`.coil.front[data-i="${i}"]`); });
      g.insertAdjacentHTML('beforeend', `<g ${k === 4 ? 'data-part="shelf"' : ''}><g transform="${FRONT(6, SHELF_Y[1] + .05, z)}"><rect class="fz-strip" width="82" height="1.6"/><text class="label" x="2" y="4.6" font-size="2.4">${{ quarter: 'クォーター', single: 'シングル', half: 'ハーフ', twin: 'ツイン' }[mod]}</text></g></g>`);
      shelves[k] = { coils, items, M, z };
    });
    if (!lv.shelf) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(6, SHELF_Y[0], SHELVES[4].z - 2, 82, SHELF_Y[1] - SHELF_Y[0], 12, 'ugh')}</g>`);
    // the drop at the front: the bin at the bottom; with the upgrade, the elevator's rails and its platform
    g.insertAdjacentHTML('beforeend', box(LIFT.x0, 70, 14, LIFT.x1 - LIFT.x0, 12, 4, 0, 'fz-bin'));
    let lift = null;
    if (lv.elev) {
      g.insertAdjacentHTML('beforeend', `<g data-part="elev">${post(5, LIFT.y + 2, 18, 200) + post(89, LIFT.y + 2, 18, 200) + box(4, LIFT.y, 216, 87, 4, 4)}</g>`);
      lift = UTIL.g(g, box(LIFT.x0, LIFT.y - 4, LIFT.bottom, LIFT.x1 - LIFT.x0, 6, 1.6, 0, 'fz-lift'), { class: 'fz-liftg', 'data-part': 'elev' });
    } else g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(LIFT.x0, LIFT.y - 4, 60, LIFT.x1 - LIFT.x0, 6, 1.6, 'ugh')}<path class="ugh" d="${path([[5, LIFT.y + 2, 18], [5, LIFT.y + 2, 218]])}"/><path class="ugh" d="${path([[89, LIFT.y + 2, 18], [89, LIFT.y + 2, 218]])}"/></g>`);
    const movers = UTIL.g(g, '', { class: 'fz-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', ((lv.defrost || 0) < 2 ? pin('defrost', 46, 14, 64) : '') + (lv.elev ? '' : pin('elev', 89, 80, 110)) + (lv.shelf ? '' : pin('shelf', 47, 44, SHELVES[4].z + 8)));
    return { shelves, frost, heater, drips, lift, movers, cm };
  }
  // frost: a white crust on the evaporator's face and along each shelf's back, thicker as it grows (0..1)
  function frostSVG(level, ks) {
    if (level < .02) return '';
    const a = Math.min(.92, level * 1.05);
    let s = `<g transform="${FRONT(8, 12.15, 222)}"><path d="M0 ${f(170 - 170 * level)}V170H78V${f(170 - 168 * level)}q-6 -3 -12 0t-12 0t-12 0t-12 0t-12 0t-12 0z" fill="#eaf6ff" opacity="${f(a * .85)}"/></g>`;
    s += ks.map(k => { const z = SHELVES[k].z; return `<g transform="${TOP(6, SHELF_Y[0], z + .05)}"><rect width="82" height="${f(2 + 5 * level)}" fill="#eaf6ff" opacity="${f(a * .8)}"/></g>`; }).join('');
    return s;
  }

  /* ---------- the shell and door: a lit panel per shelf (picture, name, price), temperature and frost, the snow child ---------- */
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, ic = '#9ae8ff', ks = lv.shelf ? [4, 0, 1, 2, 3] : [0, 1, 2, 3];
    let s = CORE.sideFace(W, D, H) + rect(TOP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    const ln = `stroke="rgba(154,232,255,.45)" stroke-width=".7" vector-effect="non-scaling-stroke"`;
    const flake = (x, y, r) => [0, 60, 120].map(a => `<path d="M${f(x - r * Math.cos(a * Math.PI / 180))} ${f(y - r * Math.sin(a * Math.PI / 180))}L${f(x + r * Math.cos(a * Math.PI / 180))} ${f(y + r * Math.sin(a * Math.PI / 180))}" ${ln}/>`).join('');
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${ic}" filter="url(#soft)"/>
      ${flake(42, 64, 26)}${flake(42, 64, 14)}<circle cx="42" cy="64" r="30" fill="rgba(154,232,255,.05)" ${ln}/>
      ${['冷', '凍'].map((ch, i) => `<text class="sign" x="42" y="${132 + i * 26}" font-size="22" text-anchor="middle" fill="rgba(154,232,255,.12)" stroke="rgba(154,232,255,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">${ch}</text>`).join('')}
      <rect x="14" y="196" width="56" height="12" rx="2" fill="rgba(90,169,255,.12)" stroke="var(--blue)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="204.8" font-size="6" text-anchor="middle" fill="var(--blue)">−25℃ れいとう</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${ic}" filter="url(#soft)"/><g class="iso-only">
      ${[[24, 40, 8], [56, 58, 10], [30, 92, 6], [58, 112, 7], [36, 130, 9]].map(([x, y, r]) => flake(x, y, r)).join('')}
      <text class="sign" x="42" y="170" font-size="14" text-anchor="middle" fill="rgba(154,232,255,.12)" stroke="rgba(154,232,255,.45)" stroke-width=".5" vector-effect="non-scaling-stroke">−25℃</text>
      <text class="label" x="42" y="186" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(154,232,255,.6)">FROZEN · 24H</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    // one panel per shelf, top to bottom; the snow child fills the top place until the extra shelf is fitted
    const row = (k, i) => { const p = menu[k], y = 26 + i * 24 + (lv.shelf ? 0 : 24);
      return R3(6, y, 86, 22, 1, `<rect class="fz-glow nohit" x="6" y="${y}" width="86" height="22" rx="2" fill="${ic}" opacity="0"/><rect x="8" y="${y + 2}" width="20" height="18" rx="1.6" class="fz-photo"/>
        <g transform="translate(9 ${y + 2}) scale(.75)">${icon(p.g, p.fill, p.d || '#3f7fff')}</g><text x="32" y="${y + 9}" font-size="${f(Math.min(4, 46 / (p.jp || p.name).length))}" class="sign tiletext">${p.jp || p.name}</text>
        <text x="32" y="${y + 16}" font-size="3.4" class="label">${UTIL.money(p.price)}</text><rect class="led" x="78" y="${y + 15}" width="8" height="1.4" rx=".6"/><text class="soldout" x="56" y="${y + 13}" font-size="3.8" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit fz-row', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    const kid = lv.shelf ? '' : `<g class="nohit" transform="translate(49 37)"><circle r="10" fill="#f4fbff" stroke="${ic}" stroke-width=".8" vector-effect="non-scaling-stroke"/><path d="M-10.6 -1q0-11 10.6-11t10.6 11q-4-6-10.6-6t-10.6 6z" fill="#9ae8ff" stroke="rgba(0,0,0,.4)" stroke-width=".6" vector-effect="non-scaling-stroke"/>
      <circle cx="-3.4" cy="2" r="1" fill="#141018"/><circle cx="3.4" cy="2" r="1" fill="#141018"/><path d="M-1.4 5q1.4 1.2 2.8 0" fill="none" stroke="#141018" stroke-width=".7"/><ellipse cx="-6" cy="4.6" rx="1.6" ry=".9" fill="#ffb3c8"/><ellipse cx="6" cy="4.6" rx="1.6" ry=".9" fill="#ffb3c8"/>
      ${flake(-26, 0, 4)}${flake(26, -2, 5)}<text x="0" y="-13" font-size="3" text-anchor="middle" class="label">ゆきんこ</text></g>`;
    const o = `<rect class="face front mshell door-face" width="120" height="240"/>
      ${R3(4, 4, 112, 18, 3, `<rect class="glass on nohit" x="4" y="4" width="112" height="18" rx="2.5" style="stroke:${ic}"/>
        <text class="lit-text sign on" style="--lc:${ic}" x="42" y="17" font-size="11" text-anchor="middle" filter="url(#soft)">ゆきんこ</text>
        <text class="label" x="96" y="11.6" font-size="2.8" text-anchor="middle" letter-spacing=".4">FROZEN</text><text class="label" x="96" y="16.6" font-size="2.8" text-anchor="middle" letter-spacing=".4">−25℃</text>`, { noCap: true })}
      ${kid}${ks.map((k, i) => row(k, i)).join('')}
      ${R3(95, 24, 20, 20, .8, `<text class="label" x="105" y="28.6" font-size="2.6" text-anchor="middle">庫内</text><text class="lit-text on fz-temp" style="--lc:${ic}" x="105" y="35" font-size="4.6" text-anchor="middle">−25℃</text>
        <text class="label" x="98.6" y="41.4" font-size="2.4">霜</text>${[0, 1, 2, 3, 4].map(i => `<rect class="fz-fr" x="${102 + i * 2.6}" y="38.8" width="2" height="3" rx=".4"/>`).join('')}`, { r: 1.5, capCls: 'readycap' })}
      ${R3(100, 48, 10, 15, 1.6, `<rect class="recess" x="104.2" y="50" width="1.6" height="11" rx=".6"/><rect class="fz-slotglow" x="98.6" y="46.6" width="12.8" height="17.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="67" font-size="2.6" text-anchor="middle">COIN</text>
      ${R3(95, 72, 20, 11, 1, `<path class="hair" d="M101 77.5a3 3 0 0 1 0-1M103 79a5 5 0 0 0 0-4M105 80.5a7 7 0 0 0 0-7"/><text class="label" x="110.5" y="79" font-size="3" text-anchor="middle">IC</text>`, { r: 2.4, cls: 'hit', attrs: 'data-hit="ic"' })}
      ${CORE.knob(105, 92, 3.4, 2.2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 92h4"/>' })}<text class="label" x="105" y="100" font-size="2.6" text-anchor="middle">返却</text>
      <g data-hit="cup" class="hit">${SK(97, 103, 16, 11, 3.5, { r: 2 })}</g><text class="label" x="105" y="118" font-size="2.6" text-anchor="middle">おつり</text>
      ${R3(95, 121, 20, 7, .8, `<text class="lit-text fz-defrost" style="--lc:var(--red)" x="105" y="126" font-size="3" text-anchor="middle">霜取り中</text>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.lock(100, 136)}
      ${lv.defrost ? `<g class="nohit" transform="translate(95 156)"><rect width="20" height="14" rx="2" fill="${lv.defrost > 1 ? '#e8f4ff' : '#fff1e6'}" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><g transform="translate(5 7)" stroke="${lv.defrost > 1 ? '#2a7ad9' : '#e8602a'}" stroke-width=".7" stroke-linecap="round">${[0, 60, 120].map(a => `<path transform="rotate(${a})" d="M0-3.6V3.6M-1 -2.6L0-1.6 1-2.6M-1 2.6L0 1.6 1 2.6"/>`).join('')}</g><text x="13.6" y="6.2" font-size="2.7" text-anchor="middle" fill="#141018" class="sign">${lv.defrost > 1 ? '霜なし' : 'ホット'}</text><text x="13.6" y="10.8" font-size="2.7" text-anchor="middle" fill="#141018" class="sign">${lv.defrost > 1 ? '送風' : 'ガス'}</text></g>` : ''}
      ${lv.elev ? `<g class="nohit" transform="translate(7 190)"><rect width="26" height="15" rx="2" fill="#0e1620" stroke="${ic}" stroke-width=".7" vector-effect="non-scaling-stroke"/><path d="M5.4 3.4v8.2M3.6 5.2l1.8-1.8 1.8 1.8M3.6 9.8l1.8 1.8 1.8-1.8" fill="none" stroke="${ic}" stroke-width=".8" stroke-linecap="round"/><text x="16.8" y="6.6" font-size="2.8" text-anchor="middle" fill="${ic}" class="sign">落とさず</text><text x="16.8" y="11.4" font-size="2.8" text-anchor="middle" fill="${ic}" class="sign">お届け</text></g>` : ''}
      <g transform="translate(6 152)"><rect width="86" height="30" rx="2" fill="#0e1620" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${flake(14, 15, 8)}${flake(72, 15, 8)}
        <text class="sign" x="43" y="13" font-size="5.4" text-anchor="middle" fill="${ic}">れいとう</text><text class="label" x="43" y="21" font-size="2.8" text-anchor="middle">アイス · 餃子 · ラーメン · ピザ</text></g>
      ${R3(36, 187, 48, 5.5, .8, `<text class="lit-text fz-ready" style="--lc:${ic}" x="60" y="191.4" font-size="3.1" text-anchor="middle">お取りください</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(36, 195, 48, 24, 6, { r: 3 })}</g>
      <rect class="fz-flap nohit" x="37" y="196" width="46" height="8" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <text class="label" x="60" y="224" font-size="2.8" text-anchor="middle" letter-spacing=".5">とりだしぐち</text>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<rect class="face" width="120" height="240" style="fill:#e8f2f8"/><rect x="5" y="5" width="110" height="230" rx="3" fill="none" stroke="#9aa6b8" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <rect x="9" y="9" width="102" height="222" rx="2" fill="#d6e4ee" stroke="#b8c6d4" stroke-width=".8" vector-effect="non-scaling-stroke"/><path class="wire2" d="M112 30V230M112 140H96"/><rect class="face" x="113" y="136" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'fz-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'fz-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), rows: [...door.querySelectorAll('.fz-row')],
      slotGlow: door.querySelector('.fz-slotglow'), ready: door.querySelector('.fz-ready'), flap: door.querySelector('.fz-flap'), defrost: door.querySelector('.fz-defrost'),
      temp: door.querySelector('.fz-temp'), fr: [...door.querySelectorAll('.fz-fr')], windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="6" y="26" width="86" height="120"/><rect class="xline" x="95" y="24" width="20" height="20"/><rect class="xline" x="36" y="195" width="48" height="24" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, helix, frostSVG, use, packOf, show, fog, icon, vars };
})();
