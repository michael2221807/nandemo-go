/* Snack + "anything" glyphs for Fig 2. Origin = bottom centre, front face toward +y. Main colour from --c. */
const GLY2 = (() => {
  const { P, f, FRONT, SIDE, TOP, rounded } = ISO;
  const { hull, ringZ, toD } = GLY;
  const SH = 'color-mix(in srgb,var(--c) 68%,#000)', HI = 'color-mix(in srgb,var(--c) 78%,#fff)', ST = 'stroke:rgba(0,0,0,.5);stroke-width:.6;vector-effect:non-scaling-stroke';
  // tinted box: front var(--c), side darker, top lighter (the side is whichever one faces the camera)
  const tbox = (x, y, z, w, d, h, fr = 'var(--c)') => `<g transform="${SIDE(ISO.right ? x + w : x, y + d, z + h)}"><rect width="${d}" height="${h}" style="fill:${SH};${ST}"/></g>`
    + `<g transform="${FRONT(x, y + d, z + h)}"><rect width="${w}" height="${h}" style="fill:${fr};${ST}"/></g>`
    + `<g transform="${TOP(x, y, z + h)}"><rect width="${w}" height="${d}" style="fill:${HI};${ST}"/></g>`;
  const tround = (x, y, z, w, d, h, r) => rounded(x, y, z, w, d, h, r, 'gt');
  const g = (id, s) => `<g id="${id}">${s}</g>`;
  function build() {
  const sd = x => ISO.right ? x : -x;   // x of the visible side for a glyph centred on x = 0

  const chips = g('g-chips', `<g transform="${SIDE(sd(7.4), 3.2, 21)}"><rect y="1" width="6.4" height="19" style="fill:${SH};${ST}"/></g>
    <g transform="${FRONT(-7, 3.2, 22)}"><path d="M0 2L1.75 0 3.5 2 5.25 0 7 2 8.75 0 10.5 2 12.25 0 14 2 14.8 11 14 20 12.25 22 10.5 20 8.75 22 7 20 5.25 22 3.5 20 1.75 22 0 20-.8 11Z" style="fill:var(--c);${ST}"/>
    <rect y="5" width="14" height="1.6" fill="#fff" opacity=".35"/><ellipse cx="7" cy="12" rx="4.6" ry="3.8" fill="#fff" opacity=".92"/><ellipse cx="7" cy="12.2" rx="2.4" ry="1.5" fill="var(--amber)"/>
    <path d="M2.2 3.6L5 9" stroke="#fff" stroke-width=".8" vector-effect="non-scaling-stroke" opacity=".5"/></g>`);
  const choco = g('g-choco', tbox(-6.5, -2, 0, 13, 4, 21) + `<g transform="${FRONT(-6.5, 2, 21)}"><rect width="13" height="3.4" fill="#d9c27a"/><rect y="8" width="13" height="6" fill="#fff" opacity=".9"/><rect y="10" width="13" height="2" style="fill:var(--c)"/></g>`);
  const candy = g('g-candy', tbox(-6, -3, 0, 12, 6, 14) + `<g transform="${FRONT(-6, 3, 14)}"><circle cx="6" cy="7.4" r="3.6" fill="#fff" opacity=".92"/><circle cx="6" cy="7.4" r="1.8" style="fill:var(--c)"/><path d="M2.4 7.4H.6M9.6 7.4h1.8" stroke="#fff" stroke-width="1.2" vector-effect="non-scaling-stroke"/></g>`);
  const cup = (() => { const r = 6.2, h = 15; return g('g-cup', `<path d="${toD(hull([...ringZ(0, r * .86), ...ringZ(h, r)]))}" style="fill:#f1ece3;${ST}"/>
    <path d="${(() => { const [a, b] = GLY.vz(); return toD([...ringZ(5, r * .92, 12, a + .08, b - .08), ...ringZ(10, r * .96, 12, b - .08, a + .08)]); })()}" style="fill:var(--c)"/>
    <path d="${toD(ringZ(h, r))}" style="fill:#e6dfd0;${ST}"/><path d="${toD(ringZ(h + .01, r * .7))}" fill="none" stroke="var(--c)" stroke-width=".8" vector-effect="non-scaling-stroke"/>`); })();
  const oni = (() => { const v = [[-7, 0], [7, 0], [0, 14]], Pf = (x, z, y) => P(x, y, z);
    const front = v.map(([x, z]) => Pf(x, z, 2.6)), side = [Pf(sd(7), 0, 2.6), Pf(sd(7), 0, -2.6), Pf(0, 14, -2.6), Pf(0, 14, 2.6)];
    return g('g-onigiri', `<path d="${toD(side)}" style="fill:#c9ccd2;${ST}"/><path d="${toD(front)}" style="fill:#f3f5f8;${ST};stroke-linejoin:round"/>
      <g transform="${FRONT(-3, 2.6, 5)}"><rect width="6" height="5" fill="#16241c"/></g><g transform="${FRONT(-.5, 2.6, 13)}"><rect width="1" height="13" style="fill:var(--c)"/></g>`); })();
  const duck = g('g-duck', tround(-6.5, -4, 0, 13, 8, 7.5, 4) + tround(.5, -2.6, 7, 6.4, 5.6, 6, 2.8)
    + `<g transform="${FRONT(5.2, 3.2, 10.6)}"><path d="M0 1h3.2l-1 2.2h-2.2z" fill="var(--amber)"/></g><g transform="${FRONT(.5, 3, 12)}"><circle cx="3.6" cy="1.6" r=".7" fill="#15171c"/></g>`);
  const umb = g('g-umbrella', `<g transform="${SIDE(sd(2.6), 1.4, 21)}"><rect width="2.8" height="17" style="fill:${SH}"/></g>
    <g transform="${FRONT(-3, 1.4, 25)}"><path d="M3 0v3.6q0 2.4-2.2 2.4" fill="none" stroke="#2b2f36" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
    <path d="M1.2 4.4h3.6l.9 13.6L3 25 .3 18z" style="fill:var(--c);${ST}"/><path d="M3 5v19M2 5.2l-.8 12.6M4 5.2l.8 12.6" stroke="#000" stroke-width=".5" vector-effect="non-scaling-stroke" opacity=".35"/>
    <rect x=".6" y="11" width="4.8" height="1.6" fill="#fff" opacity=".85"/></g>`);
  const batt = g('g-battery', `<g transform="${SIDE(sd(6.5), 1, 20)}"><rect width="2" height="20" style="fill:${SH}"/></g>
    <g transform="${FRONT(-6.5, 1, 20)}"><rect width="13" height="20" rx="1" style="fill:var(--c);${ST}"/><circle cx="6.5" cy="2" r="1.1" fill="#0b0d11"/>
    <rect x="1.6" y="5" width="9.8" height="13" rx="2" fill="rgba(220,235,255,.16)" stroke="rgba(220,235,255,.55)" stroke-width=".6" vector-effect="non-scaling-stroke"/>
    <rect x="2.8" y="6.6" width="3.2" height="10" rx="1" fill="#16181d"/><rect x="7" y="6.6" width="3.2" height="10" rx="1" fill="#16181d"/><rect x="2.8" y="6.6" width="3.2" height="2.2" fill="#d6b45a"/><rect x="7" y="6.6" width="3.2" height="2.2" fill="#d6b45a"/></g>`);
  const cass = g('g-cassette', tbox(-6.5, -1.3, 0, 13, 2.6, 9, '#22262e') + `<g transform="${FRONT(-6.5, 1.3, 9)}"><rect x="1" y="1" width="11" height="4.2" rx=".6" style="fill:var(--c)"/><circle cx="4" cy="3.1" r="1.1" fill="#0b0d11"/><circle cx="9" cy="3.1" r="1.1" fill="#0b0d11"/><path d="M3 8.4l1.2-2h4.6l1.2 2" fill="none" stroke="#000" stroke-width=".6" vector-effect="non-scaling-stroke" opacity=".5"/></g>`);
  const neko = g('g-maneki', `${rounded(-5.5, -4, 0, 11, 8, 10, 4, 'gw')}${rounded(-5, -3.6, 10, 10, 7.2, 8, 3.6, 'gw')}${rounded(3.6, -1.4, 13, 3.2, 3.2, 7, 1.6, 'gw')}
    <g transform="${FRONT(-5, 3.6, 21)}"><path d="M.8 3.4L2 0 3.8 2.6ZM6.2 2.6L8 0 9.2 3.4Z" fill="#f3f5f8" stroke="rgba(0,0,0,.5)" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M2.6 6.6q.8.8 1.6 0M5.8 6.6q.8.8 1.6 0" fill="none" stroke="#15171c" stroke-width=".7" vector-effect="non-scaling-stroke"/></g>
    <g transform="${FRONT(-5.5, 4, 11)}"><rect y="0" width="11" height="1.4" fill="var(--red)"/><circle cx="5.5" cy="2.2" r="1.2" fill="#e2c25b"/></g>`);
  const vhs = g('g-vhs', tbox(-7, -2, 0, 14, 4, 22, '#1b1e24') + `<g transform="${FRONT(-7, 2, 22)}"><rect x="1.4" y="2" width="11.2" height="7" style="fill:var(--c)"/><rect x="3" y="12" width="8" height="5" rx="1" fill="#0b0d11" stroke="#3a404a" stroke-width=".5" vector-effect="non-scaling-stroke"/></g>`);
  // the twin lane's boxed things (2026-10-18): a cookie tin, a wrapped gift box, a cat plush in its bag, a melon in a box
  const tin = g('g-cookietin', tbox(-9.5, -3.5, 0, 19, 7, 12) + tbox(-10, -3.8, 12, 20, 7.6, 2.4, HI)
    + `<g transform="${FRONT(-9.5, 3.5, 12)}"><rect x="2" y="2.4" width="15" height="7.2" rx="1.4" fill="#fff8ea"/>${[[5.4, 6], [9.5, 5], [13.6, 6.2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#d8a050" stroke="#a87030" stroke-width=".4" vector-effect="non-scaling-stroke"/>`).join('')}</g>`);
  const gift = g('g-omiyage', tbox(-10, -3.4, 0, 20, 6.8, 15)
    + `<g transform="${FRONT(-10, 3.4, 15)}"><rect x="6.6" width="6.8" height="15" fill="#fbf6ea"/><path d="M6.6 6.2h6.8" stroke="#d8102a" stroke-width=".9"/><path d="M6.6 7.4h6.8" stroke="#e8c050" stroke-width=".6"/><text x="10" y="4.6" font-size="2.6" text-anchor="middle" fill="#141018" class="sign">御</text></g>`
    + `<g transform="${TOP(-10, -3.4, 15)}"><rect x="6.6" width="6.8" height="6.8" fill="#fbf6ea" opacity=".9"/></g>`);
  const plush = g('g-plush', `${rounded(-7.5, -3.4, 0, 15, 6.8, 11, 5, 'gt')}${rounded(-6.5, -3, 10, 13, 6, 9.5, 4.6, 'gt')}
    <g transform="${FRONT(-6.5, 3, 19.5)}"><path d="M1 3.6L2.6-.4 5 2.6ZM8 2.6L10.4-.4 12 3.6Z" style="fill:var(--c);${ST}"/><circle cx="4.2" cy="5.4" r=".8" fill="#15171c"/><circle cx="8.8" cy="5.4" r=".8" fill="#15171c"/><path d="M5.8 7.2q.7.7 1.4 0" fill="none" stroke="#15171c" stroke-width=".6" vector-effect="non-scaling-stroke"/><path d="M2 4h-2M11 4h2" stroke="#fff" stroke-width=".4" vector-effect="non-scaling-stroke"/></g>
    <g transform="${FRONT(-7.5, 3.4, 11)}"><path d="M3 2q4.5 2.6 9 0" fill="none" stroke="${HI}" stroke-width="1.2" vector-effect="non-scaling-stroke"/><rect x="11.4" y="3.6" width="3.4" height="4.4" rx=".6" fill="#ff4f8b"/></g>`);
  const melon = g('g-melonbox', tbox(-9.5, -3.4, 0, 19, 6.8, 6, '#e8d3a4')
    + `<g transform="${FRONT(-9.5, 3.4, 6)}"><rect x="5" y="1.4" width="9" height="3.2" rx=".4" fill="#fbf6ea"/><text x="9.5" y="3.9" font-size="2.2" text-anchor="middle" fill="#2a5a1a" class="sign">特選</text></g>`
    + (() => { const R = 6.4, c = [0, 0, 6 + R * .9]; const ring = (z, r) => ringZ(z, r, 18); return `<path d="${toD(hull([...ring(c[2] - R * .7, R * .7), ...ring(c[2], R), ...ring(c[2] + R * .7, R * .7)]))}" style="fill:var(--c);${ST}"/>`
      + `<path d="${toD(ringZ(c[2], R, 18, GLY.vz()[0], GLY.vz()[1]), false)}" fill="none" stroke="#f4f0d8" stroke-width=".6" vector-effect="non-scaling-stroke" stroke-dasharray="1.4 1"/>`
      + `<path d="${toD(ringZ(c[2] + R * .45, R * .86, 18, GLY.vz()[0], GLY.vz()[1]), false)}" fill="none" stroke="#f4f0d8" stroke-width=".5" vector-effect="non-scaling-stroke" stroke-dasharray="1.2 1"/>`
      + `<g transform="${FRONT(-1.6, 0, c[2] + R + 2.4)}"><path d="M1.6 2.4V0M0 0h3.2" stroke="#5a7a2a" stroke-width=".9" vector-effect="non-scaling-stroke" stroke-linecap="round"/></g>`; })());
  return chips + choco + candy + cup + oni + duck + umb + batt + cass + neko + vhs + tin + gift + plush + melon;
  }
  const defs = () => build();
  return { defs };
})();
