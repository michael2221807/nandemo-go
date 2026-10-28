/* Shared parts for every figure: machine registry, door hinge, coin path, sparks, glows and the cat.
   A machine module pushes { id, fig, name, size:[W,D,H], build(groups), step, tap, customerBuy, door, supply, save, load, ... } into MACHINES. */
const MACHINES = [];
const CORE = (() => {
  const { P, f, FRONT, SIDE, TOP, box, rounded, path, slits } = ISO;
  let fxLayer = null;
  const setFx = g => { fxLayer = g; };
  const glow = (el, ms, peak = 1) => el && UTIL.tween(ms, e => el.setAttribute('opacity', f(peak * Math.sin(Math.PI * e))), t => t);
  const replay = el => UTIL.restart(el);
  const setXY = (el, x, y, z) => { const [sx, sy] = P(x, y, z); el.setAttribute('x', f(sx)); el.setAttribute('y', f(sy)); };
  const moveEl = (el, a, b, ms, ease) => UTIL.tween(ms, e => setXY(el, a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e), ease);
  function sparkle(x, y, z, n, color) {
    if (!fxLayer) return;
    const [sx, sy] = P(x, y, z), k = 1 / (window.CAMSCALE || 1);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * 18, s = (2.4 + Math.random() * 2.4) * k * 1.6, q = s * .26;
      const el = UTIL.el('path', { d: `M0 ${-s}L${q} ${-q}L${s} 0L${q} ${q}L0 ${s}L${-q} ${q}L${-s} 0L${-q} ${-q}Z`, fill: color, class: 'spark' }, fxLayer);
      UTIL.tween(620 + Math.random() * 320, e => { el.setAttribute('transform', `translate(${f(sx + Math.cos(a) * d * e)} ${f(sy + Math.sin(a) * d * e - 8 * e)}) rotate(${f(e * 120)})`); el.setAttribute('opacity', f(1 - e * e)); }, UTIL.ease.out).then(() => el.remove());
    }
  }
  // an unseen customer picks something up: it rises and drifts toward the viewer, fading
  function liftAway(els, opts = {}) {
    const x0 = +els[0].getAttribute('x') || 0, y0 = +els[0].getAttribute('y') || 0, dx = opts.dx ?? 30 * ISO.fwd, dy = opts.dy ?? -62, rot = opts.rot ?? 28 * ISO.fwd;
    SND.lift();
    return UTIL.tween(opts.ms || 760, e => { const x = x0 + dx * e, y = y0 + dy * e + 26 * e * e;
      els.forEach(el => { el.setAttribute('x', f(x)); el.setAttribute('y', f(y)); el.setAttribute('transform', `rotate(${f(rot * e)} ${f(x)} ${f(y)})`); el.setAttribute('opacity', f(1 - e)); }); }, UTIL.ease.out)
      .then(() => els.forEach(el => el.remove()));
  }

  /* door hinged on the left edge of the front face (x = 0, y = D). refs: { door, out, in, shutOnly:[els], openOnly:[els] } */
  function hinge(refs, D, H, OPEN = 62 * Math.PI / 180) {
    let a = 0, open = false, moving = false;
    const tf = v => ISO.plane([0, D, H], [Math.cos(v), Math.sin(v), 0], [0, 0, -1]);
    function set(v) {
      a = v; refs.door.setAttribute('transform', tf(v));
      const back = v > Math.PI / 2 - ISO.alpha, shut = v < .002;
      refs.out.style.display = back ? 'none' : ''; refs.in.style.display = back ? '' : 'none';
      (refs.shutOnly || []).forEach(el => { el.style.display = shut ? '' : 'none'; });
      (refs.openOnly || []).forEach(el => { el.style.display = shut ? 'none' : ''; });
    }
    async function swing(toOpen, beforeOpen) {
      if (toOpen === open || moving) return false;
      moving = true;
      if (beforeOpen) await beforeOpen();
      open = toOpen; const from = a, to = toOpen ? OPEN : 0;
      if (toOpen) { SND.doorOpen(); UTIL.haptic(12); }
      await UTIL.tween(toOpen ? 760 : 560, e => set(from + (to - from) * e), toOpen ? UTIL.ease.out : UTIL.ease.in);
      if (!toOpen) { SND.doorClose(); UTIL.haptic(22); }
      moving = false; return true;
    }
    set(0);
    return { set, swing, get open() { return open; }, get moving() { return moving; }, OPEN,
      bounds: () => { const x = 120 * Math.cos(OPEN), y = D + 120 * Math.sin(OPEN); return [[x, y, 0], [x, y, H]]; } };
  }

  /* coin validator (zigzag track) + four coin tubes + control board. v = validator origin {x, z}; tubes sit 46 below it. */
  const TRACK = [[17, 3], [3, 10], [17, 17], [3, 24], [9, 31]];
  const TUBE_V = [10, 50, 100, 500], TUBE_C = ['c10', 'c50', 'c100', 'c500'];
  function coinMech(g, v, pcb, state) {
    const vx = v.x, vz = v.z, tz = vz - 46;
    let s = box(vx, 62, vz, 20, 16, 36) + `<g transform="${FRONT(vx, 78, vz + 36)}"><path class="track" d="M${TRACK.map(p => p.join(' ')).join('L')}"/><path class="detail" d="M${TRACK.map(p => `${p[0]} ${p[1] + 1.6}`).join('L')}"/></g>`;
    if (pcb) s += `<g transform="${FRONT(pcb.x, pcb.y, pcb.z)}"><rect width="24" height="30" fill="#0c1512" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>
      <path class="trace" d="M3 4H12V10H20M3 14H8V20H18M5 26H14V18"/><rect class="face" x="9" y="11" width="7" height="6"/><rect class="face" x="14" y="22" width="6" height="4"/>
      <circle class="led on cm-led" cx="20" cy="5" r="1.2"/><circle class="led cm-led" cx="20" cy="9" r="1.2"/></g>`;
    g.insertAdjacentHTML('beforeend', s);
    const tubesG = UTIL.g(g, '', { class: 'hit', 'data-hit': 'tubes' });
    g.insertAdjacentHTML('beforeend', `<g transform="${FRONT(vx - 1, 76, tz - .5)}"><rect class="face" width="21" height="5"/>${TUBE_V.map((t, i) => `<text class="label" x="${2.5 + i * 5}" y="3.8" font-size="2.4" text-anchor="middle">${t}</text>`).join('')}</g>`);
    const coinG = UTIL.g(g, '');
    const coins = state || [16, 8, 22, 5];
    const tx = i => vx + 1.5 + i * 5;
    const order = ISO.right ? [0, 1, 2, 3] : [3, 2, 1, 0];
    function render() { tubesG.innerHTML = order.map(i => { const h = Math.max(.6, Math.min(40, coins[i] * .95));
      return ISO.rounded(tx(i) - 2.1, 68.4, tz + .5, 4.2, 4.2, h, 2.1, 'coin ' + TUBE_C[i]) + ISO.rounded(tx(i) - 2.45, 68.05, tz, 4.9, 4.9, 41, 2.45, 'tubeglass'); }).join(''); }
    async function coinIn(price, slotWorld) {
      const [tx0, ty0] = P(...slotWorld), coin = UTIL.el('use', { href: '#g-coin' }, fxLayer), sx = tx0 + 150 * ISO.fwd, sy = ty0 + 190;
      await UTIL.tween(430, e => { coin.setAttribute('x', f(sx + (tx0 - sx) * e)); coin.setAttribute('y', f(sy + (ty0 - sy) * e - Math.sin(e * Math.PI) * 70)); coin.setAttribute('opacity', e > .9 ? (1 - e) * 10 : 1); }, UTIL.ease.out);
      coin.remove(); SND.coin(); UTIL.haptic(6);
      const roll = UTIL.el('use', { href: '#g-coin' }, coinG); SND.coinRoll();
      await UTIL.tween(420, e => { const q = e * (TRACK.length - 1), i = Math.min(TRACK.length - 2, Math.floor(q)), t = q - i;
        setXY(roll, vx + TRACK[i][0] + (TRACK[i + 1][0] - TRACK[i][0]) * t, 78.5, vz + 36 - (TRACK[i][1] + (TRACK[i + 1][1] - TRACK[i][1]) * t) - 2); }, t => t);
      const ti = price >= 500 ? 3 : 2;
      await moveEl(roll, [tx(ti), 70.5, vz - 3], [tx(ti), 70.5, tz + 2 + Math.min(40, coins[ti] * .95)], 160, UTIL.ease.in);
      roll.remove();
      coins[ti] = Math.min(42, coins[ti] + Math.max(1, Math.floor(price / (ti === 3 ? 500 : 100))));
      if (price % 100) coins[0] = Math.min(42, coins[0] + (price % 100) / 10);
      render(); SND.click();
    }
    function collect(fxAt) {
      const keep = [4, 3, 4, 2], from = coins.slice(), yen = from.reduce((s, n, i) => s + Math.max(0, n - keep[i]) * TUBE_V[i], 0);
      if (!yen) { SND.clank(); FX.pop(...fxAt, T`空的`, 'var(--ink-hi)'); return; }
      SND.cascade(); UTIL.haptic([10, 30, 10, 30, 10]);
      UTIL.tween(800, e => { coins.forEach((_, i) => { coins[i] = Math.round(from[i] + (Math.min(from[i], keep[i]) - from[i]) * e); }); render(); }, UTIL.ease.inOut)
        .then(() => FX.pop(...fxAt, T`回収 ${UTIL.money(yen)}`, 'var(--yellow)', 15));
    }
    render();
    return { coinIn, collect, save: () => coins.slice(), load: d => { if (Array.isArray(d)) d.forEach((n, i) => { if (i < 4) coins[i] = Math.max(0, Math.min(42, n | 0)); }); render(); } };
  }

  /* the cat (normal in the shell layer, X-rayed in the wireframe layer), drawn by CAT3D; o shifts it on a machine's top.
     gear = what it wears from the album's wardrobe (looks only): { neck, head, feet } decorations, set by the app */
  let gear = {}, gearFor = id => id === 'mike' ? gear : {};
  const setGear = g => { gear = g || {}; };
  // the other cats wear their own accessory (见证 tier 2); the app says who wears what
  const setGearFor = fn => { gearFor = id => id === 'mike' ? gear : fn(id) || {}; };
  /* the street's cats (NEKO) go where they like: up close, the ones at this machine — on top, lying in front of it,
     sitting at the kerb, or head first in its take-out flap (only the tail shows; X-ray finds the rest of the cat curled
     up inside with the fish it had). Every machine is 120 x 84 x 240, its front at y = 84 */
  const SPOT3 = { top: o => o, front: o => [o[0] - 48, o[1] + 32, o[2] - 246], kerb: o => [o[0] + 12, o[1] + 56, o[2] - 246] };
  const FLAP = [62, 86, 26], INSIDE = [-38, -23, -220];
  const cat = (g, xray, o = [0, 0, 0]) => {
    const r = g.closest && g.closest('.mroot'), list = typeof NEKO === 'undefined' || !r ? [{ id: 'mike', at: 'top' }] : NEKO.here(r.dataset.m);
    for (const { id, at } of list) {
      if (at === 'tray') {
        const data = { 'data-cat': id, 'data-pose': 'tray' };
        if (xray) UTIL.g(g, CAT3D.draw(true, INSIDE, {}, 'ground', id), { class: 'cat-x', 'pointer-events': 'none', ...data });
        else UTIL.g(g, `<g class="cat-tail">${CAT3D.tailOut(0, FLAP, id, false)}</g>`, { class: 'cat-n hit cat-snack', 'data-hit': 'cat', ...data });
        continue;
      }
      const oo = (SPOT3[at] || SPOT3.top)(o), pose = at === 'top' ? 'top' : 'ground', data = { 'data-o': oo.join(','), 'data-pose': pose, 'data-cat': id };
      UTIL.g(g, CAT3D.draw(xray, oo, gearFor(id), pose, id), xray ? { class: 'cat-x', 'pointer-events': 'none', ...data } : { class: 'cat-n hit', 'data-hit': 'cat', ...data });
    }
    return null;
  };
  const edges = (x, y, z, w, d, h, cls) => { const c = (i, j, k) => [x + i * w, y + j * d, z + k * h];
    return [[c(0, 0, 0), c(1, 0, 0)], [c(1, 0, 0), c(1, 1, 0)], [c(1, 1, 0), c(0, 1, 0)], [c(0, 1, 0), c(0, 0, 0)], [c(0, 0, 1), c(1, 0, 1)], [c(1, 0, 1), c(1, 1, 1)],
      [c(1, 1, 1), c(0, 1, 1)], [c(0, 1, 1), c(0, 0, 1)], [c(0, 0, 0), c(0, 0, 1)], [c(1, 0, 0), c(1, 0, 1)], [c(1, 1, 0), c(1, 1, 1)], [c(0, 1, 0), c(0, 1, 1)]]
      .map(e => `<path class="${cls}" d="${path(e)}"/>`).join(''); };
  // inner walls + floor, shared by every cabinet (the side wall is the one the camera looks at through the front)
  const shell = (W, D, H) => `<g transform="${FRONT(3, 3, H - 3)}"><rect width="${W - 6}" height="${H - 6}" fill="#0a0c11" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>${slits(12, H - 12, 12, 0, W - 6, false)}</g>
    <g transform="${SIDE(ISO.right ? 3 : W - 3, D - 3, H - 3)}"><rect width="${D - 6}" height="${H - 6}" fill="#0d1016" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/></g><g transform="${TOP(3, 3, 3)}"><rect width="${W - 6}" height="${D - 6}" fill="#0b0d12"/></g>`;
  /* ---------- 3D details drawn on a door / front panel (FRONT-plane local units: u right, v down) ----------
     A raised part is pushed toward the camera by t: its cap shifts by ISO.pushOut(t); the top wall and the side wall
     facing the camera show (right from the right, left from the left). A sunk part goes into the panel: its bottom
     inner wall and the far side's inner wall show. Both follow the current camera yaw. */
  function raised(u, v, w, h, t, inner = '', opt = {}) {
    const [du, dv] = ISO.pushOut(t), r = opt.r ?? 1.2, f2 = n => f(n), sx = du <= 0 ? u + w : u;
    const side = `M${f2(sx)} ${f2(v)}L${f2(sx)} ${f2(v + h)}L${f2(sx + du)} ${f2(v + h + dv)}L${f2(sx + du)} ${f2(v + dv)}Z`;
    const topw = `M${f2(u)} ${f2(v)}L${f2(u + w)} ${f2(v)}L${f2(u + w + du)} ${f2(v + dv)}L${f2(u + du)} ${f2(v + dv)}Z`;
    return `<g class="r3 ${opt.cls || ''}" ${opt.attrs || ''} style="--px:${f2(-du * .6)}px;--py:${f2(-dv * .6)}px"><path class="face side" d="${side}"/><path class="face top" d="${topw}"/>
      <g transform="translate(${f2(du)} ${f2(dv)})"><g class="capin">${opt.noCap ? '' : `<rect class="face cap ${opt.capCls || ''}" width="${w}" height="${h}" x="${u}" y="${v}" rx="${r}"/>`}${inner}</g></g></g>`;
  }
  function sunk(u, v, w, h, t, opt = {}) {
    const [du, dv] = ISO.pushOut(t), tx = -du, ty = dv, f2 = n => f(n), sx = tx >= 0 ? u : u + w;
    const wall = `M${f2(sx)} ${f2(v)}L${f2(sx)} ${f2(v + h)}L${f2(sx + tx)} ${f2(v + h - ty)}L${f2(sx + tx)} ${f2(v)}Z`;
    const bottom = `M${f2(u)} ${f2(v + h)}L${f2(u + w)} ${f2(v + h)}L${f2(u + w + Math.min(0, tx))} ${f2(v + h - ty)}L${f2(u + Math.max(0, tx))} ${f2(v + h - ty)}Z`;
    return (opt.hole ? '' : `<rect class="recess" x="${u}" y="${v}" width="${w}" height="${h}" rx="${opt.r ?? 1.5}"/>`) + `<path class="face inwall side nohit" d="${wall}"/><path class="face inwall top nohit" d="${bottom}"/>`;
  }
  function knob(cx, cy, rr, t, opt = {}) {
    const [du, dv] = ISO.pushOut(t), n = 18, pts = [];
    for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)], [cx + du + rr * Math.cos(a), cy + dv + rr * Math.sin(a)]); }
    const h = GLY.hull(pts);
    return `<g class="r3 ${opt.cls || ''}" ${opt.attrs || ''} style="--px:${f(-du * .6)}px;--py:${f(-dv * .6)}px"><path class="face side" d="${GLY.toD(h)}"/><g class="capin"><circle class="face cap" cx="${f(cx + du)}" cy="${f(cy + dv)}" r="${rr}"/>${opt.inner ? `<g transform="translate(${f(du)} ${f(dv)})">${opt.inner}</g>` : ''}</g></g>`;
  }
  // door lock: plate, key cylinder and a T-handle; tap it to open, tap the open door to close
  const lock = (u, v) => `<g data-hit="lock" class="hit lockg">${raised(u, v, 11, 24, 1, '', { r: 2 })}${(() => { const [du, dv] = ISO.pushOut(1); return `<g transform="translate(${f(du)} ${f(dv)})"><circle class="recess" cx="${u + 5.5}" cy="${v + 6}" r="2.3"/><path class="hair" d="M${u + 5.5} ${v + 4.6}v2.8"/></g>`; })()}
    ${raised(u + 2, v + 12.5, 7, 7.5, 2.6, `<rect class="lockglow" x="${u + 3.2}" y="${v + 17.6}" width="4.6" height="1.3" rx=".6"/>`, { r: 1.2, cls: 'thandle' })}</g>`;
  function press(el) { if (!el) return; el.classList.add('down'); clearTimeout(el._pt); el._pt = setTimeout(() => el.classList.remove('down'), 140); }
  // cabinet lid with a small overhang and a vent on top
  const lid = (W, D, H) => rounded(-2, -2, H, W + 4, D + 4, 6, 3, 'mshell lid') + `<g transform="${TOP(10, 10, H + 6)}">${slits(4, 40, 4, 0, 20, true)}<rect class="detail" x="54" y="4" width="36" height="16" rx="2"/></g>`;
  // three hinge barrels on the left front edge (they stay with the cabinet when the door swings)
  const hinges = (D, H) => [24, 114, 204].map(z => rounded(-1.8, D - 1.8, z, 3.6, 3.6, 12, 1.8, 'hingeb')).join('');
  // the cabinet's side wall that faces the camera (right x = W, or left x = 0), plain face
  const sideFace = (W, D, H) => ISO.rect(SIDE(ISO.right ? W : 0, D, H), D, H, 0, 'face side mshell');
  // transform for drawing on that side wall: u runs from front to back on the right, back to front on the left
  const sidePlane = (W, D, H) => ISO.right ? SIDE(W, D, H) : ISO.SIDEL(0, 0, H);
  // side panel: seams, screws and a louvred vent near the floor (side-plane local units, v down)
  const sidePanel = (D, H) => `<g transform="${sidePlane(120, D, H)}"><path class="detail" d="M7 6V${H - 6}M${D - 7} 6V${H - 6}"/>
    ${[[11, 11], [D - 11, 11], [11, H - 46], [D - 11, H - 46]].map(([x, y]) => `<circle class="screw" cx="${x}" cy="${y}" r="1.4"/><path class="detail" d="M${x - .9} ${y}h1.8"/>`).join('')}
    <rect class="recess" x="14" y="${H - 38}" width="${D - 28}" height="26" rx="1.5"/>${Array.from({ length: 7 }, (_, i) => `<rect class="louver" x="15.5" y="${H - 36 + i * 3.4}" width="${D - 31}" height="1.9" rx=".6"/>`).join('')}</g>`;
  return { setFx, glow, replay, setXY, moveEl, sparkle, liftAway, hinge, coinMech, cat, setGear, setGearFor, FLAP, edges, shell, raised, sunk, knob, lock, press, lid, hinges, sideFace, sidePlane, sidePanel, get fx() { return fxLayer; } };
})();
