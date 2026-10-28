/* Fig 16 · 純喫茶「しずく」— geometry. Made up, built like a plant (one station per step, no robot arm; the door hides
   the works and frames one moment; 2026-10-18).
   The soul of it is a siphon. A halogen ring heats the round lower flask; the steam pushes the water up the tube into
   the upper bowl; the grinder drops the grounds, a bamboo paddle stirs; the lamp goes off, the flask cools and pulls the
   coffee back down through the cloth filter. Then a tap under the flask opens and the coffee runs straight into the cup
   waiting below. Around it, a short belt carries the cup: from the cup rack (a cup and saucer, or a glass), past the ice
   chute (the cold ones), under the siphon, under the finishing head (milk, whipped cream, a scoop of ice cream, a
   cherry) to the end, where it goes down to the take-out window.
   The flaw: the cloth filter clogs; after 20 brews the coffee drains slowly, after 30 nothing drains and the coffee
   stops until a fresh filter goes in at a restock (the filter rinser, an upgrade, washes it after every brew).
   The door frames the siphon and the cup under it. Where a world point shows on the door (the default view):
   u = x − y + 84, v = 156 + y − z. */
const KS = (() => {
  const W = 120, D = 84, H = 240;
  const BELT = { y: 62, z: 100, x0: 6, x1: 92 };
  const STN = { rack: 14, ice: 30, brew: 50, finish: 72, exit: 86 };
  // the siphon: the flask (centre z, radius), its neck, the upper bowl (z from, to; radius), the halogen ring, the tap
  const SIPHON = { x: 50, y: 62, fz: 119, fr: 6, neck: [124.6, 127.4], bowl: [127.4, 145.6], br: 4.2, ring: 115.4, tap: [108.8, 113] };
  const VESSEL = { cup: { r0: 2.8, r1: 3.6, h: 4.4, sr: 5.2 }, glass: { r0: 2.5, r1: 3, h: 9.4 } };
  const WINDOW = [60, 79, 25];
  // the starting menu (overwritten by the goods plan): the vessel, the coffee's colour, what goes on, the cup's pattern
  const MENU = [
    { name: 'ブレンド', price: 230, g: 'blend', ves: 'cup', drink: '#4a2814', fin: null, pat: 0, tier: 1 }, { name: 'アメリカン', price: 230, g: 'american', ves: 'cup', drink: '#7a4a24', fin: null, pat: 1, tier: 1 },
    { name: 'アイスコーヒー', price: 240, g: 'iced', ves: 'glass', drink: '#3a1e0e', fin: null, pat: 0, tier: 1, jp: 'アイス' }, { name: 'カフェオレ', price: 240, g: 'aulait', ves: 'cup', drink: '#b8875a', fin: 'milk', pat: 2, tier: 1 },
  ];
  return { W, D, H, BELT, STN, SIPHON, VESSEL, WINDOW, MENU, SLOTW: [105, D, 196] };
})();

const KSB = (() => {
  const { FRONT, TOP: TOPP, box, rect, path, P, f } = ISO;
  const { W, D, H, BELT, STN, SIPHON, VESSEL } = KS;
  const { hull, ringZ, toD } = GLY;
  const ST = 'stroke:rgba(0,0,0,.45);stroke-width:.6;vector-effect:non-scaling-stroke';
  const q = (x, y, z) => P(x, y, z).map(f);
  const ring = (x, y, z, r, n = 14) => ringZ(z, r, n, 0, Math.PI * 2, x, y);
  const cyl = (x, y, z0, z1, r0, r1, fill, n = 14, sk = ST) => `<path d="${toD(hull([...ring(x, y, z0, r0, n), ...ring(x, y, z1, r1, n)]))}" style="fill:${fill};${sk}"/>`;
  const disc = (x, y, z, r, fill, n = 14, sk = ST) => `<path d="${toD(ring(x, y, z, r, n))}" style="fill:${fill};${sk}"/>`;
  const seg = (p0, p1, stroke, w, cap = 'round') => { const [a, b] = q(...p0), [c, d] = q(...p1); return `<path d="M${a} ${b}L${c} ${d}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="${cap}"/>`; };
  const post = (x, y, z, h, cls = '') => box(x - .8, y - .8, z, 1.6, 1.6, h, 0, cls);
  // the angle round a ring nearest the camera (the half round it is drawn after what the ring goes round)
  const nearT = () => { const o = P(0, 0, 0), ax = P(1, 0, 0)[1] - o[1], ay = P(0, 1, 0)[1] - o[1]; return Math.atan2(ay, ax); };
  // a sphere's outline (the flask): the hull of three great circles
  const sphere = (x, y, z, r) => { const pts = [...ring(x, y, z, r, 20)]; for (let i = 0; i < 20; i++) { const t = i / 20 * Math.PI * 2; pts.push(P(x + r * Math.cos(t), y, z + r * Math.sin(t)), P(x, y + r * Math.cos(t), z + r * Math.sin(t))); } return toD(hull(pts)); };
  // the part of a sphere below height zl (the liquid in the flask): the hull of the rings under it
  const capBelow = (x, y, z, r, zl) => { const pts = []; for (let i = 0; i <= 5; i++) { const zz = z - r + (Math.min(zl, z + r) - (z - r)) * i / 5, rr = Math.sqrt(Math.max(0, r * r - (zz - z) ** 2)); pts.push(...ring(x, y, zz, rr * .96, 12)); } return toD(hull(pts)); };
  // the parts of the siphon that never change shape, worked out once per view (it is redrawn 30 times a second while it
  // brews)
  let FIX = null;
  const fixed = () => FIX || (FIX = (() => { const { x, y, fz, fr, neck, bowl, br } = SIPHON, glassSk = 'stroke:rgba(150,190,225,.9);stroke-width:.6;vector-effect:non-scaling-stroke';
    return { flask: `<path d="${sphere(x, y, fz, fr)}" class="ks-glass"/>`, neck: cyl(x, y, neck[0], neck[1], 1.6, 1.6, 'rgba(200,225,250,.35)', 10),
      bowl: disc(x, y, bowl[0] + 1.6, br * .76, '#efe4cc', 12) + cyl(x, y, bowl[0], bowl[1], br * .74, br, 'rgba(210,232,250,.22)', 16, glassSk) + disc(x, y, bowl[1], br, 'rgba(210,232,250,.18)', 16, glassSk) }; })());

  /* ---------- the siphon. o = { water: 0..1 still in the flask, bowl: 0..1 risen into the bowl, coffee: the liquid is
     coffee now, grounds: on, lamp: 0..1 glow, lamp2: the second ring (upgrade), stir: paddle angle (null: up), tap: open,
     rinse: the rinser (upgrade) } ---------- */
  function siphon(o = {}) {
    const { x, y, fz, fr, neck, bowl, br, ring: rz, tap } = SIPHON, liq = o.coffee ? '#3a1e0e' : 'rgba(170,205,235,.75)';
    let s = '';
    // the stand behind it: a rod, the clamp arm to the bowl's collar
    s += post(x + 2, y - 7, 104, 50, 'ks-brass') + seg([x + 2, y - 7, 140], [x, y - br, 140], '#c8a050', 1.2);
    // the halogen ring (and the second one with the upgrade) goes round the flask: its far half before the glass, its near
    // half after; dark when off, glowing when on
    const tm = nearT(), arc = (z, near) => toD(ringZ(z, fr + 1.6, 12, tm + (near ? -1 : 1) * Math.PI / 2, tm + (near ? 1 : 3) * Math.PI / 2, x, y));
    const halo = (z, on, near) => `<path d="${arc(z, near)}" fill="none" stroke="#8a7a68" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`
      + (on > .05 ? `<path d="${arc(z, near)}" fill="none" stroke="#ffb43a" stroke-width="2" opacity="${f(on)}" stroke-linecap="round"/><path d="${arc(z, near)}" fill="none" stroke="#fff4c0" stroke-width=".6" opacity="${f(on)}"/>` : '');
    const halos = near => halo(rz, o.lamp || 0, near) + (o.lamp2 !== undefined ? halo(rz - 2.6, o.lamp2, near) : '');
    s += halos(false);
    // the tap under the flask, the flask (glass), the liquid left in it, the tube from the bowl down into it
    s += cyl(x, y, tap[0], tap[1], .7, .9, '#c8a050', 8) + box(x - 1.4, y - .6, tap[0] + 1.2, 2.8, 1.2, 1.2, 0, o.tap ? 'ks-tapon' : 'ks-brass');
    if (o.water > .02) s += `<path d="${capBelow(x, y, fz, fr, fz - fr + 2 * fr * Math.min(1, o.water) * .82)}" style="fill:${liq};stroke:none"/>`;
    s += fixed().flask + seg([x, y, fz - fr + 1.4], [x, y, neck[1]], 'rgba(200,225,250,.7)', 1.1);
    if (o.lamp > .05 && o.water > .1 && !o.coffee) for (let i = 0; i < 5; i++) { const [a, b] = q(x + Math.sin(i * 2.3 + (o.t || 0)) * 2.6, y + 1, fz - fr + 2 + ((i * 1.7 + (o.t || 0) * 3) % 5)); s += `<circle cx="${a}" cy="${b}" r=".45" fill="#fff" opacity=".8"/>`; }
    // the neck, the bowl (glass), the liquid risen into it, the grounds, the cloth filter at its foot
    s += fixed().neck;
    const zb = bowl[0] + 2, top = bowl[0] + 2 + (bowl[1] - bowl[0] - 5) * Math.min(1, o.bowl || 0);
    if ((o.bowl || 0) > .02) s += cyl(x, y, zb, top, br * .78, br * .95, liq, 14, 'stroke:none') + (o.grounds ? disc(x, y, top, br * .95, '#5a3418', 14, 'stroke:none') + (o.coffee ? '' : disc(x, y, top + .05, br * .6, '#7a4a24', 10, 'stroke:none')) : '');
    s += fixed().bowl;
    // the bamboo paddle: up beside the bowl, or down in it turning
    if (o.stir === null || o.stir === undefined) s += seg([x + br + 1.4, y - 2, bowl[1] + 1], [x + br + 1.4, y - 2, bowl[1] + 12], '#d8b070', 1.4);
    else { const a = o.stir, ex = x + 2.4 * Math.cos(a), ey = y + 2.4 * Math.sin(a); s += seg([ex, ey, top - 2], [x + .6 * Math.cos(a), y + .6 * Math.sin(a), bowl[1] + 10], '#d8b070', 1.4); }
    if (o.rinse) s += seg([x - 3, y - 3, bowl[1] + 8], [x - 1.4, y - 1.4, bowl[1] + 2], '#8a93a4', 1) + disc(x - 1.4, y - 1.4, bowl[1] + 2, .9, '#5a6374', 8);
    // the near half of the halogen ring(s) over the flask, the glow on the glass
    s += halos(true);
    if ((o.lamp || 0) > .05) { const [a, b2] = q(x, y, fz - fr * .5); s += `<ellipse cx="${a}" cy="${b2}" rx="${f(fr * .8)}" ry="${f(fr * .4)}" fill="#ffb43a" opacity="${f(.18 * o.lamp)}"/>`; }
    return s;
  }
  // a stream (the coffee from the tap, the milk, the soda) and the grounds falling from the grinder's chute
  const stream = (x, y, z0, z1, c, w) => seg([x, y, z0], [x, y, z1], c, w, 'butt');

  /* ---------- the cups ---------- */
  // the patterns of the cups (純喫茶 serve each coffee in its own cup): [the band's colour, the rim]
  const PAT = [['#3a6ab0', '#c8a050'], ['#a8302a', '#c8a050'], ['#3a7a4a', '#fff'], ['#c8a050', '#c8a050'], ['#7a3a8a', '#c8a050'], ['#1a1a1a', '#e8c060'], ['#2a8a8a', '#fff'], ['#e8e0c8', '#e8c060'], ['#ffd23f', '#e8c060']];
  // a vessel at (x, y, z) (its foot) with what is in it. o = { ves, drink, fill: 0..1, fin: [what is on], pat, ice }
  function vessel(x, y, z, o = {}) {
    let s = '';
    if (o.ves === 'glass') {
      const { r0, r1, h } = VESSEL.glass, lv = Math.min(1, o.fill || 0);
      s += cyl(x, y, z, z + h, r0, r1, 'rgba(225,240,252,.28)', 14, 'stroke:rgba(150,190,225,.9);stroke-width:.6;vector-effect:non-scaling-stroke');
      if (lv > .02) s += cyl(x, y, z + .5, z + .5 + (h - 1.8) * lv, r0 * .92, r0 + (r1 - r0) * lv * .9, o.drink, 14, 'stroke:none');
      if (o.ice) [[-1, .6, 6.6], [1, -.4, 7.4], [0, 1.2, 5.6]].forEach(([u, v, w]) => { const [a, b] = q(x + u, y + v, z + w); s += `<rect x="${f(+a - 1)}" y="${f(+b - 1)}" width="2" height="2" rx=".4" fill="rgba(255,255,255,.75)" stroke="rgba(150,190,225,.8)" stroke-width=".3"/>`; });
      s += disc(x, y, z + h, r1, 'rgba(225,240,252,.15)', 14, 'stroke:rgba(150,190,225,.9);stroke-width:.5;vector-effect:non-scaling-stroke');
      const topZ = z + .5 + (h - 1.8) * lv;
      (o.fin || []).forEach(t => { s += topping(x, y, topZ, t, r1); });
      if (o.straw) s += seg([x + 1, y + .5, z + 3], [x + 2.4, y - .4, z + h + 4], '#e8453a', .9);
      return s;
    }
    const { r0, r1, h, sr } = VESSEL.cup, [band, rim] = PAT[(o.pat || 0) % PAT.length], lv = Math.min(1, o.fill || 0);
    s += disc(x, y, z, sr, '#fbfaf4', 18) + disc(x, y, z + .5, sr * .62, '#efe8d8', 14, 'stroke:none');
    // the handle (on the side away from the camera's left), the cup, its band, the rim, the coffee
    s += `<path d="M${q(x + r1 - .2, y, z + h - 1).join(' ')}Q${q(x + r1 + 2.2, y, z + h - 1.4).join(' ')} ${q(x + r1 - .4, y, z + 1.4).join(' ')}" fill="none" stroke="#fbfaf4" stroke-width="1.6"/>`;
    s += cyl(x, y, z + .4, z + h, r0, r1, '#fbfaf4', 16) + cyl(x, y, z + h * .45, z + h * .7, r0 + (r1 - r0) * .45 + .02, r0 + (r1 - r0) * .7 + .02, band, 16, 'stroke:none');
    s += disc(x, y, z + h, r1, rim === '#fff' ? '#fbfaf4' : rim, 16, 'stroke:rgba(0,0,0,.35);stroke-width:.4;vector-effect:non-scaling-stroke');
    s += disc(x, y, z + h - .05, r1 - .5, lv > .02 ? o.drink : '#efe8d8', 16, 'stroke:none');
    if (lv > .6) (o.fin || []).forEach(t => { s += topping(x, y, z + h, t, r1 - .5); });
    return s;
  }
  // what goes on top: milk (a lighter swirl), whipped cream, a scoop of ice cream, a cherry
  function topping(x, y, z, t, r) {
    if (t === 'milk') { const [a, b] = q(x, y, z + .05); return `<path d="M${f(+a - 1.6)} ${b}q1.6-1.2 3.2 0" stroke="#f4e8d0" stroke-width=".7" fill="none"/>`; }
    if (t === 'cream') return cyl(x, y, z, z + 1.6, r * .9, r * .5, '#fffdf4', 14) + cyl(x, y, z + 1.6, z + 2.8, r * .5, .3, '#fffdf4', 10);
    if (t === 'ice') return `<path d="${sphere(x, y, z + 1.6, r * .9)}" style="fill:#fff8e8;${ST}"/>`;
    if (t === 'flame') { const [a, b] = q(x - r - 1, y, z + .6), [c, d] = q(x + r + 1, y, z + .6), [m, n] = q(x, y, z + .8);   // a spoon across the cup, a sugar cube burning blue on it
      return `<path d="M${a} ${b}L${c} ${d}" stroke="#c8c8c8" stroke-width=".9" stroke-linecap="round"/><rect x="${f(+m - .8)}" y="${f(+n - 1.4)}" width="1.6" height="1.4" fill="#fff"/><path d="M${f(+m - 1)} ${f(+n - 1.2)}q1-3 1-4q0 1.6 1 4z" fill="#5ab4ff" opacity=".85"/>`; }
    if (t === 'cherry') { const [a, b] = q(x + .8, y, z + 3.6); return `<circle cx="${a}" cy="${b}" r="1.1" fill="#d8102a" stroke="rgba(0,0,0,.4)" stroke-width=".3"/><path d="M${a} ${f(+b - 1)}q.8-1.6 2-2.2" stroke="#5a8a2a" stroke-width=".4" fill="none"/>`; }
    return '';
  }
  // flat (24 × 24) for the menu tiles and the shop: a cup and saucer, or a glass with what goes on top
  function icon(o) {
    const k = 'stroke="#141018" stroke-width="1.1" stroke-linejoin="round"';
    // (app build, goods polish: a glass's shine and the cold beads on it; a cup's crema ring, a spoon)
    if (o.ves === 'glass') {
      let s = `<path d="M7.6 4.4h8.8l-1 16.4h-6.8z" fill="#eef7ff" ${k}/><path d="M8.2 9h7.6l-.8 11.2h-6z" fill="${o.drink}"/>`;
      if ((o.fin || []).includes('ice')) s += `<circle cx="12" cy="7.6" r="3.4" fill="#fff8e8" ${k}/>`;
      else s += `<rect x="9" y="10" width="2.4" height="2.4" fill="#fff" opacity=".7"/><rect x="12.6" y="12.6" width="2.4" height="2.4" fill="#fff" opacity=".7"/>`;
      if ((o.fin || []).includes('cherry')) s += `<circle cx="13.6" cy="4.2" r="1.6" fill="#d8102a" ${k}/>`;
      return s + `<path d="M9.2 11.2l.5 7.6" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".55"/><path d="M14.4 16.6a.45 .45 0 1 0 .9 0a.45 .45 0 1 0 -.9 0zM10.6 18.4a.4 .4 0 1 0 .8 0a.4 .4 0 1 0 -.8 0zM14 19.4a.35 .35 0 1 0 .7 0a.35 .35 0 1 0 -.7 0z" fill="#fff" opacity=".8"/>`
        + `<path d="M14.6 2.4l1.6 8" stroke="#e8453a" stroke-width="1.1"/>`;
    }
    const [band, rim] = PAT[(o.pat || 0) % PAT.length];
    let s = `<ellipse cx="12" cy="19.4" rx="9.6" ry="2.8" fill="#fbfaf4" ${k}/><path d="M3.4 20.4l4.2-1.1" stroke="#a8acb4" stroke-width="1.1" stroke-linecap="round"/><path d="M17 10.4q4.2.2 3.2 3.6t-4.2 1.6" fill="none" stroke="#141018" stroke-width="1.6"/><path d="M17 10.4q4.2.2 3.2 3.6t-4.2 1.6" fill="none" stroke="#fbfaf4" stroke-width=".7"/>`
      + `<path d="M5.6 9.6h12.8l-1.6 8.2q-4.8 1.6-9.6 0z" fill="#fbfaf4" ${k}/><path d="M6.2 12.6h11.6l-.4 2.2H6.6z" fill="${band}"/><ellipse cx="12" cy="9.6" rx="6.4" ry="1.8" fill="${o.drink}" stroke="${rim === '#fff' ? '#141018' : rim}" stroke-width="1"/>`
      + `<ellipse cx="12" cy="9.6" rx="4.4" ry="1.05" fill="none" stroke="#c8925a" stroke-width=".5" opacity=".7"/>`;
    if ((o.fin || []).includes('cream')) s += `<path d="M7.6 9.4q4.4-6 8.8 0z" fill="#fffdf4" ${k}/>`;
    if ((o.fin || []).includes('flame')) s += `<path d="M4.6 8.6h14.8" stroke="#c8c8c8" stroke-width="1.2" stroke-linecap="round"/><path d="M11 8q1-4 1-5.4q0 2 1.6 5.4z" fill="#5ab4ff"/>`;
    if ((o.fin || []).includes('milk')) s += `<path d="M9.4 9.6q2.6-1 5.2 0" stroke="#f4e8d0" stroke-width="1" fill="none"/>`;
    return s + `<path d="M10 6.4q-1-1.8 0-3.4M13.6 6.4q-1-1.8 0-3.4" stroke="#bbb" stroke-width=".8" fill="none" opacity=".7"/>`;
  }
  // the crate: a bag of beans (coloured by the coffee), a fresh cloth filter
  function defs() {
    const beans = `<g id="g-ks-beans"><path d="M-3.4 0v-7.6q0-1.6 1.2-2.2l.6-1.4h3.2l.6 1.4q1.2.6 1.2 2.2v7.6z" style="fill:var(--c)" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><rect x="-2.4" y="-6.8" width="4.8" height="3.2" rx=".6" fill="#f4e6c8"/><ellipse cx="0" cy="-5.2" rx="1.1" ry=".7" fill="#5a3418"/></g>`;
    const filter = `<g id="g-ks-filter"><path d="M-4.6-8h9.2l-2.4 7.4h-4.4z" fill="#f4ecd8" stroke="rgba(0,0,0,.45)" stroke-width=".6" vector-effect="non-scaling-stroke"/><ellipse cx="0" cy="-8" rx="4.6" ry="1.2" fill="#e8dcc0" stroke="rgba(0,0,0,.45)" stroke-width=".5" vector-effect="non-scaling-stroke"/><path d="M-3-5.6h6M-2.4-3.2h4.8" stroke="#c8b890" stroke-width=".5"/></g>`;
    return beans + filter;
  }
  const pin = (id, x, y, z) => { const [sx, sy] = P(x, y, z); return `<g class="upin hit" data-hit="part" data-part="${id}" transform="translate(${f(sx)} ${f(sy)})"><circle class="upin-ring" r="12"/><circle class="upin-c" r="8.5"/><path class="upin-plus" d="M-4 0H4M0-4V4"/>${UPG.tag()}</g>`; };

  /* ---------- the three upgrade kits ---------- */
  // ネル自動洗浄: a spray head over the bowl and its hose (drawn by the siphon with o.rinse), a drip tray by the stand
  const rinseKit = () => post(SIPHON.x - 4, SIPHON.y - 4, 104, 52, 'ks-steel') + seg([SIPHON.x - 4, SIPHON.y - 4, 156], [SIPHON.x - 3, SIPHON.y - 3, SIPHON.bowl[1] + 8], '#8a93a4', 1)
    + box(SIPHON.x - 9, SIPHON.y - 9, 104, 6, 6, 1.6, 0, 'ks-steel');
  const rinseGhost = () => CORE.edges(SIPHON.x - 4.8, SIPHON.y - 4.8, 104, 1.6, 1.6, 52, 'ugh');
  // ソーダファウンテン: three syrup bottles and a carbonator over the finishing head, a cherry jar
  const SODA = { x: STN.finish + 6, y: BELT.y - 8 };
  const sodaKit = () => box(SODA.x - 4, SODA.y - 4, 104, 8, 8, 14, 0, 'ks-steel') + `<g transform="${FRONT(SODA.x - 3, SODA.y + 4.05, 116)}"><text x="3" y="3" font-size="2" text-anchor="middle" fill="#fff" class="sign">CO₂</text></g>`
    + ['#5ac83a', '#3a8aff', '#ff6a8a'].map((c, i) => cyl(SODA.x - 3 + i * 3, SODA.y, 118, 128, 1.2, 1.2, c, 10)).join('')
    + cyl(STN.finish - 6, BELT.y - 6, 116, 122, 1.8, 1.8, 'rgba(225,240,252,.4)', 10) + [0, 1, 2].map(i => { const [a, b] = q(STN.finish - 6 + (i - 1) * .9, BELT.y - 6, 117.4 + i * 1.2); return `<circle cx="${a}" cy="${b}" r=".7" fill="#d8102a"/>`; }).join('');
  const sodaGhost = () => CORE.edges(SODA.x - 4, SODA.y - 4, 104, 8, 8, 24, 'ugh');

  /* ---------- the inside. lv: fitted parts { rinse, halogen, soda } ---------- */
  function interior(g, coinState, lv) {
    const RT = ISO.right; FIX = null;
    const defsEl = UTIL.el('defs', {}, g);
    let s = CORE.shell(W, D, H);
    // the base: the water tank and its pump, sacks of beans, the dishwasher for the cups
    s += box(8, 30, 6, 26, 24, 34, 0, 'ks-tank') + `<g transform="${FRONT(8, 54.05, 30)}"><rect width="26" height="7" rx="1" fill="#3a6ab0"/><text x="13" y="5" font-size="3.6" text-anchor="middle" fill="#fff" class="sign">浄水</text></g>`
      + box(40, 34, 6, 20, 16, 16, 0, 'ks-sack') + box(64, 30, 6, 24, 24, 28, 0, 'ks-steel') + `<g transform="${FRONT(64, 54.05, 26)}"><text x="12" y="6" font-size="3" text-anchor="middle" fill="#fff" class="sign">食器洗浄</text></g>`;
    s += box(2, 26, 70, 90, 30, 4, 0, 'ks-floor');
    // the belt along the counter, on its legs
    s += box(BELT.x0, BELT.y - 4.6, BELT.z - 3, BELT.x1 - BELT.x0, 9.2, 3, 0, 'ks-belt') + [BELT.x0 + 4, BELT.x1 - 4].map(x => post(x, BELT.y, 74, BELT.z - 77, 'ks-steel')).join('');
    g.insertAdjacentHTML('beforeend', s);
    let cm; const column = () => { cm = CORE.coinMech(g, { x: 96, z: 150 }, { x: 92, y: 6, z: 100 }, coinState); };
    if (!RT) column();
    // the cup rack (cups and saucers, glasses) at the start of the belt; the ice chute; the finishing head; the exit chute
    let k = box(STN.rack - 6, BELT.y - 12, BELT.z + 10, 12, 8, 30, 0, 'ks-wood') + [0, 1, 2].map(i => cyl(STN.rack - 2.6, BELT.y - 8, BELT.z + 12 + i * 5, BELT.z + 15.6 + i * 5, 2.6, 3.4, '#fbfaf4', 12)).join('')
      + [0, 1].map(i => cyl(STN.rack + 3, BELT.y - 8, BELT.z + 12 + i * 10, BELT.z + 20 + i * 10, 2.4, 2.8, 'rgba(225,240,252,.4)', 12)).join('')
      + `<g transform="${FRONT(STN.rack - 6, BELT.y - 3.95, BELT.z + 38)}"><rect width="12" height="4" rx=".6" fill="#5a3418"/><text x="6" y="3" font-size="2.4" text-anchor="middle" fill="#f4e6c8" class="sign">食器</text></g>`;
    k += box(STN.ice - 4, BELT.y - 4, BELT.z + 20, 8, 8, 14, 0, 'ks-steel') + cyl(STN.ice, BELT.y, BELT.z + 14, BELT.z + 20, 1.4, 2.6, '#aab3bf', 10)
      + `<g transform="${FRONT(STN.ice - 4, BELT.y + 4.05, BELT.z + 32)}"><text x="4" y="3" font-size="2.4" text-anchor="middle" fill="#fff" class="sign">氷</text></g>`;
    k += box(STN.finish - 5, BELT.y - 5, BELT.z + 22, 10, 10, 8, 0, 'ks-steel') + [[-2.4, 0, '#f4ecd8'], [0, 0, '#fffdf4'], [2.4, 0, '#fff8e8']].map(([dx, , c]) => cyl(STN.finish + dx, BELT.y, BELT.z + 17, BELT.z + 22, .6, 1.4, c, 8)).join('')
      + `<g transform="${FRONT(STN.finish - 5, BELT.y + 5.05, BELT.z + 28)}"><text x="5" y="3.4" font-size="2" text-anchor="middle" fill="#fff" class="sign">仕上げ</text></g>`;
    k += `<path d="${toD([P(STN.exit - 4, BELT.y + 4.6, BELT.z - 3), P(STN.exit + 4, BELT.y + 4.6, BELT.z - 3), P(STN.exit + 4, 82, 40), P(STN.exit - 4, 82, 40)])}" style="fill:#aab3bf;${ST}"/>`;
    // the brass drip tray on the belt under the siphon's tap (the cup stands on it to be filled; at rest it is what the
    // window shows under the flask)
    k += box(STN.brew - 6, BELT.y - 4.4, BELT.z, 12, 8.8, .6, 0, 'ks-brass') + Array.from({ length: 5 }, (_, i) => seg([STN.brew - 4.4 + i * 2.2, BELT.y - 3.4, BELT.z + .62], [STN.brew - 4.4 + i * 2.2, BELT.y + 3.4, BELT.z + .62], '#6a4a1a', .5)).join('');
    // the grinder over the siphon, its bean hopper, the chute to the bowl
    k += box(SIPHON.x - 4, SIPHON.y - 4, 152, 8, 8, 9, 0, 'ks-grinder') + cyl(SIPHON.x, SIPHON.y, 161, 172, 3.2, 4.6, 'rgba(225,240,252,.35)', 14) + cyl(SIPHON.x, SIPHON.y, 161.4, 167, 3.2, 3.8, '#5a3418', 14, 'stroke:none')
      + cyl(SIPHON.x, SIPHON.y, 148.4, 152, .7, 1.4, '#c8a050', 8);
    k += lv.rinse ? `<g data-part="rinse">${rinseKit()}</g>` : `<g class="ugh-g">${rinseGhost()}</g>`;
    k += lv.soda ? `<g data-part="soda">${sodaKit()}</g>` : `<g class="ugh-g">${sodaGhost()}</g>`;
    g.insertAdjacentHTML('beforeend', k);
    const siphonG = UTIL.g(g, '', { class: 'ks-siphon', 'data-part': lv.halogen ? 'halogen' : null });
    if (!lv.halogen) g.insertAdjacentHTML('beforeend', `<g class="ugh-g">${CORE.edges(SIPHON.x - SIPHON.fr - 1.6, SIPHON.y - SIPHON.fr - 1.6, SIPHON.ring - 3.4, 2 * SIPHON.fr + 3.2, 2 * SIPHON.fr + 3.2, 1.6, 'ugh')}</g>`);
    const streamG = UTIL.g(g, '', { class: 'ks-streamg' });
    const cupG = UTIL.g(g, '', { class: 'ks-cup' });
    const movers = UTIL.g(g, '', { class: 'ks-movers' });
    if (RT) column();
    g.insertAdjacentHTML('beforeend', (lv.rinse ? '' : pin('rinse', SIPHON.x - 4.8, SIPHON.y - 4.8, 150)) + (lv.halogen ? '' : pin('halogen', SIPHON.x + 9, SIPHON.y + 9, SIPHON.ring - 8))
      + (lv.soda ? '' : pin('soda', SODA.x, SODA.y, 126)));
    return { defs: defsEl, siphonG, streamG, cupG, movers, cm };
  }

  /* ---------- the shell and the door: the awning, the menu, the neon sign, the lamps, the stained-glass window ---------- */
  // the door's grid: the window (x 58–86, y 64–128) is centred on the siphon (u 72) and frames it whole, the grinder's
  // chute at its top, the cup on the belt at its foot; the neon 「純喫茶」 sign and the lamps fill the left; under them all
  // the menu card
  const WN = { x: 58, y: 64, w: 28, h: 64, r: 6 };
  const win = (d = 0) => { const { x, y, w, h, r } = WN, X0 = x - d, Y0 = y - d, X1 = x + w + d, Y1 = y + h + d, R = r + d; return `M${X0} ${Y1}V${Y0 + R}Q${X0} ${Y0} ${X0 + R} ${Y0}H${X1 - R}Q${X1} ${Y0} ${X1} ${Y0 + R}V${Y1}Z`; };
  function exterior(g, menu, lv = {}) {
    const R3 = CORE.raised, SK = CORE.sunk, br = '#5a3418', rd = '#b8283a', cr = '#f4e6c8';
    let s = CORE.sideFace(W, D, H) + rect(TOPP(0, 0, H), W, D, 0, 'face top mshell');
    s += `<g transform="${FRONT(0, D, H)}"><path class="face front mshell" d="M0 0H120V240H0ZM3.5 3.5V236.5H116.5V3.5Z" fill-rule="evenodd"/></g>`;
    s += CORE.sidePanel(D, H);
    // the side: a big cup and saucer in outline, steam, COFFEE
    const sideCup = (cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k})"><ellipse cx="0" cy="8" rx="14" ry="3.4" fill="rgba(244,230,200,.08)" stroke="${cr}" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-9-4h18l-2 10q-7 2.4-14 0z" fill="rgba(244,230,200,.08)" stroke="${cr}" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M9-2q5 0 4 4t-5 2" fill="none" stroke="${cr}" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M-3-8q-2-3 0-6M3-8q-2-3 0-6" fill="none" stroke="rgba(244,230,200,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/></g>`;
    s += `<g transform="${CORE.sidePlane(W, D, H)}">` + (ISO.right ? `<rect class="lamp-light on" x=".4" y="5" width="1.8" height="230" rx=".9" fill="${rd}"/>${sideCup(42, 80, 2.2)}
      <text class="sign" x="42" y="136" font-size="13" text-anchor="middle" letter-spacing="1" fill="rgba(244,230,200,.1)" stroke="rgba(244,230,200,.5)" stroke-width=".5" vector-effect="non-scaling-stroke">COFFEE</text>
      <rect x="14" y="204" width="56" height="12" rx="2" fill="rgba(184,40,58,.12)" stroke="${rd}" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="sign" x="42" y="212.8" font-size="6" text-anchor="middle" fill="${cr}">サイフォン珈琲</text>`
      : `<rect class="lamp-light on" x="81.8" y="5" width="1.8" height="230" rx=".9" fill="${rd}"/><g class="iso-only">${sideCup(42, 100, 2)}
      <text class="label" x="42" y="146" font-size="4" text-anchor="middle" letter-spacing=".6" fill="rgba(244,230,200,.6)">SIPHON COFFEE · SINCE 1973</text></g>`) + `</g>`;
    s += CORE.hinges(D, H);
    g.insertAdjacentHTML('beforeend', s);
    const tile = (k, p) => { const x = 6 + k * 21.8, y = 24, fs = Math.min(2.8, 18.6 / (p.jp || p.name).length);
      return R3(x, y, 20.8, 30, 1, `<rect class="ks-tglow nohit" x="${x}" y="${y}" width="20.8" height="30" rx="2" fill="${rd}" opacity="0"/><g transform="translate(${x + 3.6} ${y + .8}) scale(.57)">${icon(p)}</g>
        <text x="${x + 10.4}" y="${y + 19.6}" font-size="${f(fs)}" text-anchor="middle" class="sign tiletext">${p.jp || p.name}</text><text x="${x + 10.4}" y="${y + 25.2}" font-size="2.6" text-anchor="middle" class="label ks-price">${UTIL.money(p.price)}</text>
        <rect class="led" x="${x + 7.4}" y="${y + 27.4}" width="6" height="1.1" rx=".5"/><text class="soldout" x="${x + 10.4}" y="${y + 12}" font-size="3.4" text-anchor="middle">売切</text>`,
        { r: 2, cls: 'hit ks-tile', attrs: `data-hit="menu" data-k="${k}"`, capCls: 'tilecap' }); };
    // the striped awning, its scalloped edge, the shop's name on it
    const awn = Array.from({ length: 10 }, (_, i) => `<path d="M${4 + i * 11.2} 3h11.2v12.4q-2.8 3-5.6 0t-5.6 0z" fill="${i % 2 ? '#fbfaf4' : rd}" stroke="var(--line)" stroke-width=".6" vector-effect="non-scaling-stroke"/>`).join('')
      + `<rect x="30" y="5" width="60" height="9" rx="4.5" fill="${br}" stroke="${cr}" stroke-width=".7" vector-effect="non-scaling-stroke"/><text class="ks-name" x="60" y="11.6" font-size="6" text-anchor="middle">珈琲 しずく</text>`;
    // the neon sign: 純喫茶 in tubes on a dark board (a bright core over a wide soft stroke: no blur filter)
    const neon = `<rect x="6" y="64" width="20" height="64" rx="3" fill="#160c10" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`
      + ['純', '喫', '茶'].map((c, i) => `<text class="ks-neon-o" x="16" y="${84 + i * 17}" font-size="13" text-anchor="middle">${c}</text><text class="ks-neon" x="16" y="${84 + i * 17}" font-size="13" text-anchor="middle">${c}</text>`).join('');
    // between it and the window: the サイフォン式 plaque, the lamps, a round 珈琲 sign
    const lamps = `<rect x="30" y="64" width="24" height="8" rx="1.4" fill="${br}" stroke="${cr}" stroke-width=".5" vector-effect="non-scaling-stroke"/><text class="ks-name" x="42" y="69.6" font-size="3.4" text-anchor="middle">サイフォン式</text>`
      + R3(32, 77, 20, 6.4, .8, `<text class="lit-text ks-brewlamp" style="--lc:#ffb43a" x="42" y="81.6" font-size="2.9" text-anchor="middle">抽出中</text>`, { r: 1.5, capCls: 'readycap' })
      + R3(32, 85.6, 20, 6.4, .8, `<text class="lit-text ks-filterlamp" style="--lc:#ff4f3a" x="42" y="90.2" font-size="2.4" text-anchor="middle">フィルター交換</text>`, { r: 1.5, capCls: 'readycap' })
      + (lv.halogen ? R3(32, 94.2, 20, 6.4, .8, `<text class="lit-text ks-halolamp" style="--lc:#ffd23f" x="42" y="98.8" font-size="2.6" text-anchor="middle">ハロゲン×2</text>`, { r: 1.5, capCls: 'readycap' }) : '')
      + `<circle cx="42" cy="116" r="9" fill="${br}" stroke="${cr}" stroke-width=".8" vector-effect="non-scaling-stroke"/><circle cx="42" cy="116" r="7.4" fill="none" stroke="${cr}" stroke-width=".4" stroke-dasharray="1 .8" vector-effect="non-scaling-stroke"/><text class="ks-name" x="42" y="114.6" font-size="4.2" text-anchor="middle">珈琲</text><text class="ks-name" x="42" y="120" font-size="2" text-anchor="middle">COFFEE</text>`;
    // the stained-glass border round the window (small coloured panes in lead)
    const panes = [];
    const col = ['#c8283a', '#e8b030', '#3a7a4a', '#3a6ab0', '#e8b030', '#7a3a8a'];
    for (let i = 0; i < 7; i++) panes.push([WN.x - 3.6, WN.y + 6 + i * 8.2, 3, 7.4, col[i % 6]], [WN.x + WN.w + .6, WN.y + 6 + i * 8.2, 3, 7.4, col[(i + 3) % 6]]);
    for (let i = 0; i < 4; i++) panes.push([WN.x + 2 + i * 6.2, WN.y - 3.6, 5.6, 3, col[(i + 1) % 6]]);
    const glass = panes.map(([x, y, w, h, c]) => `<rect x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" fill="${c}" opacity=".85" stroke="#2a2420" stroke-width=".7" vector-effect="non-scaling-stroke"/>`).join('');
    // the menu card under them all: dotted leaders, the year it opened
    const card = `<rect x="6" y="133" width="86" height="35" rx="1.5" fill="${cr}" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/><rect x="8" y="135" width="82" height="31" rx="1" fill="none" stroke="${br}" stroke-width=".4" vector-effect="non-scaling-stroke"/>`
      + `<text class="ks-card" x="49" y="141.6" font-size="4.6" text-anchor="middle" letter-spacing="1">M E N U</text>`
      + [['サイフォン珈琲', 148.6], ['アイス珈琲', 154], ['ウインナー珈琲', 159.4]].map(([t, y]) => `<text class="ks-card" x="12" y="${y}" font-size="3">${t}</text><path d="M${12 + t.length * 3 + 1} ${y - .8}H78" stroke="${br}" stroke-width=".5" stroke-dasharray=".6 1.2"/><text class="ks-card" x="86" y="${y}" font-size="2.6" text-anchor="end">一杯ずつ</text>`).join('')
      + `<text class="ks-card" x="49" y="165" font-size="2.2" text-anchor="middle" opacity=".7">創業 昭和四十八年</text>`;
    const o = `<path class="face front mshell door-face" d="M0 0H120V240H0Z${win()}" fill-rule="evenodd"/>
      ${awn}
      <rect x="5" y="22" width="88" height="34" rx="2" class="ks-panel"/>${menu.map((p, k) => tile(k, p)).join('')}
      <text class="label" x="49" y="59.6" font-size="2.2" text-anchor="middle" fill="${cr}">いらっしゃいませ ごゆっくり</text>
      ${neon}${lamps}${glass}${card}
      <path class="nohit" d="${win(1.6)}${win()}" fill-rule="evenodd" fill="#7a5030" stroke="var(--line)" stroke-width=".8" vector-effect="non-scaling-stroke"/>
      <path class="dglass nohit" d="${win()}"/><path class="nohit" d="M63 66L69 66L61 128H58V76Z" fill="#fff" opacity=".05"/>
      ${lv.rinse ? `<g class="nohit" transform="translate(30 101.6)"><rect width="24" height="7" rx="1" fill="#f4ecd8" stroke="rgba(0,0,0,.4)" stroke-width=".5" vector-effect="non-scaling-stroke"/><circle cx="3.2" cy="3.5" r="1.6" fill="#3fd47a"/><text x="14" y="4.6" font-size="2.5" text-anchor="middle" class="sign" fill="${br}">毎回ネル洗浄</text></g>` : ''}
      ${lv.soda ? `<g class="nohit" transform="translate(86 134) rotate(8)"><circle r="7.6" fill="#5ac83a" stroke="#fff" stroke-width="1" vector-effect="non-scaling-stroke"/><text y="-1" font-size="2.2" text-anchor="middle" class="sign" fill="#fff">クリーム</text><text y="1.8" font-size="2.2" text-anchor="middle" class="sign" fill="#fff">ソーダ</text><text y="4.4" font-size="1.4" text-anchor="middle" class="label" fill="#fff">はじめました</text></g>` : ''}
      ${R3(95, 24, 20, 12, 1, `<rect class="recess" x="98" y="28" width="14" height="1.6" rx=".6"/><text class="label" x="105" y="34" font-size="2.4" text-anchor="middle">千円札</text>`, { r: 1.5 })}
      ${R3(100, 39, 10, 13, 1.6, `<rect class="recess" x="104.2" y="41" width="1.6" height="9" rx=".6"/><rect class="ks-slotglow" x="98.6" y="37.6" width="12.8" height="15.8" rx="2.8" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke" opacity="0"/>`, { r: 2, cls: 'hit', attrs: 'data-hit="coinslot"' })}
      <text class="label" x="105" y="56" font-size="2.4" text-anchor="middle">COIN</text>
      ${R3(95, 60, 20, 14, .8, `<text class="label" x="105" y="64.4" font-size="2.2" text-anchor="middle">ネル</text><rect x="98" y="66.4" width="14" height="3.4" rx="1" fill="#0a0e14"/><rect class="ks-gauge" x="98.4" y="66.8" width="13.2" height="2.6" rx=".8" fill="#f4e6c8"/>`, { r: 1.5, capCls: 'readycap' })}
      ${CORE.knob(105, 80, 3, 2, { cls: 'hit', attrs: 'data-hit="lever"', inner: '<path class="hair" d="M103 80h4"/>' })}<text class="label" x="105" y="87" font-size="2.4" text-anchor="middle">返却</text>
      ${CORE.lock(100, 118)}
      <g transform="translate(6 173)"><rect width="108" height="10" rx="1.5" fill="#0a0e14" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="ks-lcd" x="54" y="7.2" font-size="4.4" text-anchor="middle">いらっしゃいませ</text></g>
      ${R3(30, 186, 60, 5.5, .8, `<text class="lit-text ks-ready" style="--lc:#ffb43a" x="60" y="190.4" font-size="3.1" text-anchor="middle">お待たせしました</text>`, { r: 1.5, capCls: 'readycap' })}
      <g data-hit="window" class="hit">${SK(30, 194, 60, 26, 6, { r: 3 })}</g>
      <path class="nohit" d="M31 195h58v5.6${Array.from({ length: 12 }, () => 'q-2.4 2-4.83 0').join('')}z" fill="#fbfaf4" opacity=".92"/><path class="nohit" d="M31 196.6h58" stroke="#e8dcc0" stroke-width=".5" stroke-dasharray="1 1"/>
      <rect class="ks-flap nohit" x="31" y="203" width="58" height="6" rx="1.5" fill="#1a1f27" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${SK(6, 229, 108, 7, 1)}${ISO.slits(230.4, 235, 1.8, 10, 110, false)}`;
    const inn = `<path class="face" d="M0 0H120V240H0Z${win()}" fill-rule="evenodd" style="fill:#101318"/><path class="dglass nohit" d="${win()}"/>
      <rect class="face" x="5" y="22" width="88" height="34" rx="2"/><path class="wire2" d="M10 40H90M112 30V230M112 120H94M112 200H60"/><rect class="face" x="113" y="118" width="5" height="22" rx="1"/>`;
    const door = UTIL.g(g, `<g class="door-out">${o}</g><g class="door-in hit" data-hit="door" style="display:none">${inn}</g>`, { class: 'ks-door', transform: FRONT(0, D, H) });
    const windowG = UTIL.g(g, '', { class: 'ks-window' });
    g.insertAdjacentHTML('beforeend', CORE.lid(W, D, H));
    return { door, doorOut: door.querySelector('.door-out'), doorIn: door.querySelector('.door-in'), tiles: [...door.querySelectorAll('.ks-tile')], slotGlow: door.querySelector('.ks-slotglow'),
      lcd: door.querySelector('.ks-lcd'), gauge: door.querySelector('.ks-gauge'), brewLamp: door.querySelector('.ks-brewlamp'), filterLamp: door.querySelector('.ks-filterlamp'), haloLamp: door.querySelector('.ks-halolamp'),
      ready: door.querySelector('.ks-ready'), flap: door.querySelector('.ks-flap'), windowG };
  }
  function ghost(g) {
    g.insertAdjacentHTML('beforeend', CORE.edges(0, 0, 0, W, D, H, 'xedge') + `<g transform="${FRONT(0, D, H)}"><rect class="xline" x="5" y="22" width="88" height="34"/><path class="xline" d="${win()}"/><rect class="xline" x="30" y="194" width="60" height="26" rx="3"/></g>`);
  }
  return { defs, interior, exterior, ghost, siphon, vessel, stream, icon, SODA };
})();
