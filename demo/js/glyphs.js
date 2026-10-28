/* Reusable product glyphs, built once from real cylinder projections and stamped with <use>.
   Colours come from CSS variables on each <use>: --c (body/liquid), --cap (bottle cap). */
const GLY = (() => {
  const { P, f } = ISO;
  const TAU = Math.PI * 2;
  const vz = () => ISO.visZ(), sx = () => ISO.visX()[0] + Math.PI / 4;   // visible side of standing / shift for lying cylinders
  const toD = (pts, close = true) => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (close ? 'Z' : '');
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // rings: axis along x (lying) or z (standing)
  const ringX = (x, r, n = 30, a = 0, b = TAU, cy = 0, cz = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = a + (b - a) * i / n; return P(x, cy + r * Math.cos(t), cz + r * Math.sin(t)); });
  const ringZ = (z, r, n = 30, a = 0, b = TAU, cx = 0, cy = 0) => Array.from({ length: n + 1 }, (_, i) => { const t = a + (b - a) * i / n; return P(cx + r * Math.cos(t), cy + r * Math.sin(t), z); });
  const bandX = (x0, x1, r, a, b) => toD([...ringX(x0, r, 12, a, b), ...ringX(x1, r, 12, b, a)]);
  const bandZ = (z0, z1, r, a, b) => toD([...ringZ(z0, r, 12, a, b), ...ringZ(z1, r, 12, b, a)]);
  const lineX = (x0, x1, r, t) => toD([P(x0, r * Math.cos(t), r * Math.sin(t)), P(x1, r * Math.cos(t), r * Math.sin(t))], false);
  const lineZ = (z0, z1, r, t) => toD([P(r * Math.cos(t), r * Math.sin(t), z0), P(r * Math.cos(t), r * Math.sin(t), z1)], false);

  // lying can: axis +x, centred on the origin, length 14.5, radius 5.4; the end facing the camera gets the lid
  function canLying(R = 5.4, L = 14.5) {
    const a = -L / 2, b = L / 2, o = sx(), e = ISO.right ? b : a, s = ISO.right ? 1 : -1;
    return `<g id="g-can">
      <path class="gb" d="${toD(hull([...ringX(a, R), ...ringX(b, R)]))}"/>
      <path class="gl" d="${bandX(a + 2.4, b - 2.4, R, .05 + o, 1.0 + o)}"/>
      <path class="gs" d="${bandX(a + 2.4, b - 2.4, R, 1.2 + o, 1.42 + o)}"/>
      <path class="gh" d="${lineX(a + 1.1, b - 1.1, R, 1.8 + o)}"/>
      <path class="gc" d="${toD(ringX(e, R))}"/><path class="gr" d="${toD(ringX(e + .01 * s, R * .8))}"/>
      <path class="gt" d="${toD(ringX(e + .02 * s, R * .26, 12, 0, TAU, R * .3, R * .28))}"/>
    </g>`;
  }
  // lying PET bottle: cap toward +x (behind the body when the camera is on the left)
  function bottleLying() {
    const rb = 5.1, o = sx(), sec = [[-7.2, rb], [2.4, rb], [3.9, 3.9], [5.0, 2.4], [5.4, 2.0], [6.2, 2.0]];
    const bodyPts = sec.flatMap(([x, r]) => ringX(x, r, 24));
    const cap = `<path class="gcap" d="${toD(hull([...ringX(6.2, 2.35, 16), ...ringX(7.9, 2.35, 16)]))}"/>`;
    const body = `<path class="gbt" d="${toD(hull(bodyPts))}"/>
      <path class="gl" d="${bandX(-5.6, .8, rb, -.1 + o, 1.25 + o)}"/>
      <path class="gs" d="${bandX(-5.6, .8, rb, .35 + o, .62 + o)}"/>
      <path class="gh" d="${lineX(-6.6, 2.0, rb, 1.85 + o)}"/>`;
    return `<g id="g-bottle">${ISO.right ? body + cap + `<path class="gcap2" d="${toD(ringX(7.9, 2.35, 16))}"/>` : cap + body}</g>`;
  }
  // standing can for the display window: base at origin, radius 5.2, height 16
  function canUp(r = 5.2, h = 16) {
    const [V0, V1] = vz();
    return `<g id="g-can-up">
      <path class="gb" d="${toD(hull([...ringZ(0, r), ...ringZ(h, r)]))}"/>
      <path class="gl" d="${bandZ(3, h - 4, r, V0 + .15, V1 - .15)}"/>
      <path class="gs" d="${bandZ(6.6, 8.6, r, V0 + .15, V1 - .15)}"/>
      <path class="gh" d="${lineZ(1.2, h - 1.2, r, V0 + 1.735)}"/>
      <path class="gc" d="${toD(ringZ(h, r))}"/><path class="gr" d="${toD(ringZ(h + .01, r * .8))}"/>
      <path class="gt" d="${toD(ringZ(h + .02, r * .26, 12, 0, TAU, r * .32, -r * .3))}"/>
    </g>`;
  }
  // standing PET bottle: base at origin
  function bottleUp() {
    const [V0, V1] = vz(), rb = 4.6, sec = [[0, rb], [12, rb], [14, 3.4], [15.4, 2.1], [16, 1.8], [16.8, 1.8]];
    return `<g id="g-bottle-up">
      <path class="gbt" d="${toD(hull(sec.flatMap(([z, r]) => ringZ(z, r, 24))))}"/>
      <path class="gl" d="${bandZ(3, 9, rb, V0 + .1, V1 - .1)}"/>
      <path class="gs" d="${bandZ(5.2, 6.6, rb, V0 + .1, V1 - .1)}"/>
      <path class="gh" d="${lineZ(1, 13, rb, V0 + 1.785)}"/>
      <path class="gcap" d="${toD(hull([...ringZ(16.8, 2.1, 16), ...ringZ(18.8, 2.1, 16)]))}"/>
      <path class="gcap2" d="${toD(ringZ(18.8, 2.1, 16))}"/>
    </g>`;
  }
  // a coin standing on edge in the x-z plane (rolls along the validator track)
  const coinEdge = () => `<g id="g-coin"><path class="gcoin" d="${toD(Array.from({ length: 21 }, (_, i) => { const t = TAU * i / 20; return P(2.6 * Math.cos(t), 0, 2.6 * Math.sin(t)); }))}"/></g>`;
  // flat front views for the swinging door (origin = bottom centre, door-local units)
  const flatCan = () => `<g id="f-can"><rect class="gb" x="-5.2" y="-16" width="10.4" height="16" rx="1.6"/><rect class="gl" x="-5.2" y="-12.5" width="10.4" height="8"/><rect class="gs" x="-5.2" y="-9.6" width="10.4" height="2"/>
    <rect class="gc" x="-5.2" y="-16.9" width="10.4" height="1.9" rx=".9"/><path class="gh" d="M2.8 -14.8V-1.6"/></g>`;
  const flatBottle = () => `<g id="f-bottle"><path class="gbt" d="M-4.6 0V-11.8Q-4.6-14 -2.2-15.2L-1.8-16.8H1.8L2.2-15.2Q4.6-14 4.6-11.8V0Z"/><rect class="gl" x="-4.6" y="-9.6" width="9.2" height="6"/>
    <rect class="gs" x="-4.6" y="-7.4" width="9.2" height="1.6"/><rect class="gcap" x="-2.1" y="-18.9" width="4.2" height="2.2" rx=".6"/><path class="gh" d="M2.6 -12V-1.2"/></g>`;
  const defs = () => canLying() + bottleLying() + canUp() + bottleUp() + coinEdge() + flatCan() + flatBottle();
  return { defs, hull, ringX, ringZ, toD, vz };
})();
