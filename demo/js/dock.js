/* The restock dock shown while a door is open. Each machine provides a "supply":
   { title, unit, slots() -> [{glyph, vars, pos:[x,y,z], target, name}], back(), front(), view:[pts],
     entry(target) -> world point, accept(target) -> bool, arrive(target, slot, el) -> true if it keeps el, dropTarget(hitEl), flyRot }.
   Gestures: tap = send to its own target, swipe = send everything crossed, hold + drag = drop on a chosen target. */
const DOCK = (() => {
  const { P, f } = ISO;
  // owner = the machine being restocked; every unit sent costs its buy price (supply.cost), summed in `spent`
  let svg, fly, device, stage, inner, label, dockEl, supply = null, owner = null, spent = 0, poor = false, slots = [], swapping = false, busy = false, gesture = null, revertOn = null;

  /* (v0.44) the screen matrices are read once per frame: at 全部补货's ×14 several units go in one frame, and each read
     right after the last unit changed the page laid the whole page out again (most of fillUp's 380 ms frames on iOS) */
  let ctms = null;
  const ctmOf = el => { if (!ctms) { ctms = new Map(); requestAnimationFrame(() => { ctms = null; }); }
    let c = ctms.get(el); if (!c) { c = { m: el.getScreenCTM(), r: device.getBoundingClientRect() }; ctms.set(el, c); } return c; };
  function toDevice(el, x, y) { const { m, r } = ctmOf(el); return [m.a * x + m.c * y + m.e - r.left, m.b * x + m.d * y + m.f - r.top, m.a]; }
  function syncFly() { const r = device.getBoundingClientRect(); fly.setAttribute('viewBox', `0 0 ${f(r.width)} ${f(r.height)}`); }
  const remaining = () => slots.filter(s => s.full).length;

  /* the crate's grade = its 进货档位 (the price ladder: every letter has 上等 · 特上 · 极上), graded like sushi.
     上等 glows; 特上 adds twinkling stars; 极上 adds slow light rays and a shine sweeping the crate; a crate with ★5 goods
     in it is 梦幻 and does it all in rainbow. Starting goods are 普通. */
  const GRADE = [null, { n: T`普通`, c: '#e8e2f6' }, { n: T`上等`, c: '#3ff4ff' }, { n: T`特上`, c: '#ffd23f' }, { n: T`极上`, c: '#ffb020' }, { n: T`梦幻`, c: '#ff4f8b' }];
  const RAINBOW = ['#ff8fc8', '#ffe14a', '#3ff4ff'];
  let grade = 1, gradeText = '', lite = false;
  const topTier = list => supply.tier ? Math.min(5, Math.max(1, ...list.map(s => supply.tier(s.target) || 1))) : 1;
  const starD = (x, y, r) => `M${f(x)} ${f(y - r * 2)}Q${f(x)} ${f(y)} ${f(x + r * 2)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y + r * 2)}Q${f(x)} ${f(y)} ${f(x - r * 2)} ${f(y)}Q${f(x)} ${f(y)} ${f(x)} ${f(y - r * 2)}Z`;
  // behind the crate: an aura (and, from 極上, turning rays)
  function gradeBack(t, b) {
    if (t < 2) return '';
    const c = GRADE[t].c, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, w = b.x1 - b.x0, h = b.y1 - b.y0;
    const stops = t >= 5 ? '<stop offset="0" stop-color="#fff6d6" stop-opacity=".8"/><stop offset=".3" stop-color="#ff8fc8" stop-opacity=".5"/><stop offset=".55" stop-color="#ffe14a" stop-opacity=".35"/><stop offset=".8" stop-color="#3ff4ff" stop-opacity=".22"/><stop offset="1" stop-color="#3ff4ff" stop-opacity="0"/>'
      : `<stop offset="0" stop-color="${c}" stop-opacity=".6"/><stop offset=".55" stop-color="${c}" stop-opacity=".2"/><stop offset="1" stop-color="${c}" stop-opacity="0"/>`;
    let s = `<defs><radialGradient id="dg-aura">${stops}</radialGradient></defs>`;
    if (t >= 4) { const R = w * 1.15;
      s += `<g class="drays" style="transform-origin:${f(cx)}px ${f(cy)}px">` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, d = .085;
        return `<path d="M${f(cx)} ${f(cy)}L${f(cx + R * Math.cos(a - d))} ${f(cy + R * .55 * Math.sin(a - d))}L${f(cx + R * Math.cos(a + d))} ${f(cy + R * .55 * Math.sin(a + d))}Z" fill="${t >= 5 ? RAINBOW[i % 3] : c}" opacity=".24"/>`; }).join('') + '</g>'; }
    return s + `<ellipse class="daura" cx="${f(cx)}" cy="${f(cy)}" rx="${f(w * .8)}" ry="${f(h * .98)}" fill="url(#dg-aura)"/>`;
  }
  // in front: stars (特上+), a shine across the crate (極上+) and the grade tag
  function gradeFront(t, b) {
    if (t < 2) return '';
    const c = GRADE[t].c, w = b.x1 - b.x0, h = b.y1 - b.y0, text = gradeText || GRADE[t].n, tw = 9 + [...text].reduce((a, ch) => a + (ch.charCodeAt(0) > 0x2e80 ? 8.6 : 5.4), 0);
    let s = '';
    if (t >= 3) s += [[.06, .12], [.95, .22], [.12, .9], [.9, .86], [.5, -.04], [1.03, .55]].map(([px, py], i) =>
      `<path class="dspark" style="animation-delay:${(i * .27).toFixed(2)}s" d="${starD(b.x0 + w * px, b.y0 + h * py, 2.4 + (i % 2) * .9)}" fill="${t >= 5 ? RAINBOW[i % 3] : '#fff6d6'}"/>`).join('');
    if (t >= 4) { const hull = GLY.hull(supply.view.map(p => P(...p)));
      s += `<defs><clipPath id="dg-clip"><path d="${GLY.toD(hull)}"/></clipPath><linearGradient id="dg-shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
        <g clip-path="url(#dg-clip)"><rect class="dshine" style="--w:${f(w + 46)}px" x="${f(b.x0 - 32)}" y="${f(b.y0 - 4)}" width="20" height="${f(h + 8)}" fill="url(#dg-shine)"/></g>`; }
    return s + `<g transform="translate(${f(b.x0 + 2)} ${f(b.y0 + 4)})"><g class="dtag"><g transform="skewX(-10)"><rect x="0" y="-6.6" width="${f(tw)}" height="10" rx="1.6" fill="${c}" stroke="#141018" stroke-width="1.1" vector-effect="non-scaling-stroke"/><text x="${f(tw / 2)}" y="1">${text}</text></g></g></g>`;
  }
  const updateLabel = () => { if (supply) label.textContent = T`${gradeText ? gradeText + ' · ' : ''}${supply.title} · 剩 ${remaining()} ${supply.unit || ''}`
    + (owner && ECON.isFree(owner) ? T` · 保底免费` : spent ? T` · 进货 −${UTIL.money(spent)}` : ''); };

  function render() {
    const list = supply.slots().map((s, i) => ({ ...s, i }));
    list.sort((a, b) => (a.pos[0] + a.pos[1]) - (b.pos[0] + b.pos[1]) || a.pos[2] - b.pos[2]);
    // goods this machine has never stocked wear one NEW tag per kind (on the front-most of them)
    const tagged = new Set(), badge = list.slice().reverse().filter(s => supply.isNew && supply.isNew(s.target) && !tagged.has(s.target) && tagged.add(s.target));
    const b = ISO.bounds(supply.view), st = owner ? ECON.crateStep(owner) : 0;
    grade = topTier(list) >= 5 ? 5 : st ? (st - 1) % 3 + 2 : 1; gradeText = st ? ECON.stepName(st) : '';
    inner.innerHTML = (lite ? '' : gradeBack(grade, b)) + (supply.back ? supply.back() : '') + list.map(s => { const [sx, sy] = P(...s.pos);
      return `<g class="dslot crcan" data-i="${s.i}"><use href="#${s.glyph}" x="${f(sx)}" y="${f(sy)}" style="${s.vars || ''}"/></g>`; }).join('') + (supply.front ? supply.front() : '')
      + badge.map(s => { const [sx, sy] = P(...s.pos); return `<g transform="translate(${f(sx)} ${f(sy - 24)})"><g class="dnew" data-t="${s.target}"><rect x="-9" y="-4.6" width="18" height="8" rx="4"/><text y="1.8" text-anchor="middle">NEW</text></g></g>`; }).join('')
      + (lite ? '' : gradeFront(grade, b));
    dockEl.className = dockEl.className.replace(/\s*grade-\d/g, '') + (grade >= 2 ? ` grade-${grade}` : '');
    slots = list.map(s => ({ ...s, el: inner.querySelector(`.dslot[data-i="${s.i}"]`), full: true }));
    updateLabel();
  }
  function fitView() {
    const b = ISO.bounds(supply.view), pad = 6;
    svg.setAttribute('viewBox', `${f(b.x0 - pad)} ${f(b.y0 - pad)} ${f(b.x1 - b.x0 + pad * 2)} ${f(b.y1 - b.y0 + pad * 2)}`);
  }
  // an easter egg: now and then a cat is sitting in the crate when the door opens; it hops off when the first unit goes
  let stow = null, stowVoice = 1;
  function stowaway(markup, voice = 1) {
    stowVoice = voice;
    if (!supply) return;
    const b = ISO.bounds(supply.view), k = (b.x1 - b.x0) / 230;
    stow = UTIL.g(inner, `<g class="stow-in">${markup}</g>`, { class: 'stow', transform: `translate(${f((b.x0 + b.x1) / 2)} ${f(b.y0 + (b.y1 - b.y0) * .66)}) scale(${f(k)})` });
  }
  function shoo() { if (!stow) return; const el = stow; stow = null; el.firstChild.classList.add('off'); SND.meow(stowVoice); setTimeout(() => el.remove(), 700); }
  /* (v0.44) 全部补货 goes by fast: its crates are plain (no aura, rays, stars or shine sweeping them, which repaint the
     crate on every frame) and no fanfare per crate; the goods still go in one by one, as the user wanted to see */
  function mount(sup, own, light = false) {
    lite = light; dockEl.classList.toggle('lite', lite);
    supply = sup; owner = own || null; spent = 0; stow = null; inner.setAttribute('transform', ''); inner.setAttribute('opacity', 1); fitView(); render();
    if (grade >= 3 && !lite) setTimeout(() => { if (grade >= 4) SND.jingle(); else SND.chime(); }, 420);   // a good crate is worth a little fanfare
  }

  // flight from a device-local point to a world point in the machine
  function flight(slot, from, scale0, target, first) {
    return new Promise(res => {
      const [ex, ey] = P(...supply.entry(target)), [tx, ty, s1] = toDevice(stage, ex, ey);
      const el = UTIL.el('use', { href: '#' + slot.glyph, style: slot.vars || '' }, fly);
      const [fx, fy] = from, cx = (fx + tx) / 2, cy = Math.min(fy, ty) - 110, rot = supply.flyRot ?? -80;
      UTIL.tween(470, e => {
        const x = (1 - e) * (1 - e) * fx + 2 * (1 - e) * e * cx + e * e * tx, y = (1 - e) * (1 - e) * fy + 2 * (1 - e) * e * cy + e * e * ty;
        el.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(rot * e * e)}) scale(${f(scale0 + (s1 - scale0) * e)})`);
      }, UTIL.ease.inOut).then(() => {
        const kept = supply.arrive(target, slot, el, [tx, ty, s1]); if (!kept) el.remove();
        // 捎一件: that one has landed, the slot sells its planned goods again
        if (revertOn !== null && revertOn === target) { revertOn = null; if (owner) ECON.applyDefs(owner); }
        // the first of a new product lands: 上新
        if (first) { const w = supply.entry(target); FX.pop(w[0], w[1], w[2] + 10, T`上新！`, '#ff4f8b', 16); CORE.sparkle(w[0], w[1], w[2], 10, '#ff4f8b'); SND.jingle(); UTIL.haptic([10, 30, 10]); }
        res(true);
      });
    });
  }
  function launch(slot, target = slot.target, from) {
    poor = false;
    if (!slot.full || swapping || !supply) return false;
    if (!supply.accept(target)) { nudge(slot, target); return false; }
    // pay for it on the way in
    const cost = supply.cost ? supply.cost(target) : 0, free = owner && ECON.isFree(owner);
    if (cost > 0 && owner && !ECON.pay(owner, cost, supply.tier ? supply.tier(target) : 0)) { broke(slot, target); return false; }
    if (!free) spent += cost;
    // first time this machine stocks it? its NEW tag comes off and the landing gets a 上新
    let first = false;
    let brought = null;
    if (supply.stocks) for (const [kind, id] of supply.stocks(target)) { if (ECON.recordStock(kind, id)) first = true; if (owner && ECON.takeExtra(owner, kind, id)) brought = ECON.product(kind, id); }
    if (brought) { revertOn = target; setTimeout(() => { const w = supply.entry(target); FX.pop(w[0], w[1], w[2] + 22, T`捎来的 ${brought.name}`, '#ffd23f', 12); }, 520); }
    if (first) inner.querySelectorAll(`.dnew[data-t="${target}"]`).forEach(n => n.remove());
    slot.full = false; slot.el.style.visibility = 'hidden'; updateLabel(); shoo();
    SND.pick(); UTIL.haptic(5);
    const [sx, sy] = P(slot.pos[0], slot.pos[1], slot.pos[2] + 8), [dx, dy, sc] = toDevice(svg, sx, sy);
    flight(slot, from || [dx, dy], sc, target, first);
    // the crate is empty, or what is left in it fits nowhere while the machine still has room: the next crate slides in
    // (before, a single empty lane meant closing the door and opening it again for every crate)
    if (!remaining() || (!slots.some(s => s.full && supply.accept(s.target)) && supply.slots().some(s => supply.accept(s.target)))) UTIL.wait(800).then(swap);
    return true;
  }
  function nudge(slot, target, text = T`満`) {
    SND.clank(); FX.pop(...supply.entry(target), text, 'var(--ink-hi)', 12);
    UTIL.tween(300, e => slot.el.setAttribute('transform', `translate(${f(Math.sin(e * Math.PI * 4) * (1 - e) * 2)} 0)`), t => t);
  }
  function broke(slot, target) { poor = true; SND.buzz(); nudge(slot, target, T`钱不够`); }
  async function swap() {
    if (swapping) return; swapping = true;
    await UTIL.tween(380, e => { inner.setAttribute('transform', `translate(${f(-160 * e)} 0)`); inner.setAttribute('opacity', f(1 - e)); }, UTIL.ease.in);
    render(); SND.crate(); UTIL.haptic(18);
    await UTIL.tween(460, e => { inner.setAttribute('transform', `translate(${f(160 * (1 - e))} 0)`); inner.setAttribute('opacity', f(e)); }, UTIL.ease.out);
    swapping = false;
  }
  let due = 0;   // (app build: when the next crate is due)
  const pace = ms => { const now = performance.now(), step = ms / (UTIL.speed || 1); due = Math.max(due, now - step * 4) + step;
    return due > now ? new Promise(r => setTimeout(r, due - now)) : Promise.resolve(); };
  async function pourAll(isOpen) {
    if (busy || !supply) return; busy = true;
    const list = slots.filter(s => s.full).sort((a, b) => (supply.order ? supply.order(a, b) : 0));
    for (const s of list) { if (!isOpen()) break; if (!supply.accept(s.target)) continue;   // goods for a full place stay put, quietly
      if (launch(s)) await pace(supply.gap || 85); else if (poor) break; }
    busy = false;
  }
  // 全部补货: pour crate after crate until the machine is full (or the money runs out)
  async function fillUp(isOpen, full) {
    for (let n = 0; n < 40 && isOpen() && !full(); n++) {
      await pourAll(isOpen);
      if (poor || !isOpen() || full()) break;
      if (!supply || !supply.slots().some(s => supply.accept(s.target))) break;   // nothing fits anywhere any more
      // the next crate: launch() has set it sliding in (or, if not, start it), then pour that one
      const t0 = performance.now();
      while (!swapping && isOpen() && performance.now() - t0 < 1200) await UTIL.wait(60);
      if (!swapping && isOpen()) await swap();
      while (swapping && isOpen()) await UTIL.wait(60);
    }
  }
  function sendTo(target) { const s = slots.find(x => x.full && x.target === target) || (supply.anyTarget ? slots.find(x => x.full) : null); if (s) launch(s, target); else FX.pop(...supply.entry(target), T`空`, 'var(--ink-hi)', 12); }

  /* gestures (app build): touch = stock it; sweep = stock everything crossed */
  const slotAt = (x, y) => { const n = document.elementFromPoint(x, y), c = n && n.closest && n.closest('.dslot'); return c ? slots.find(s => s.el === c) : null; };
  function sweep(g, x, y) {
    const n = Math.max(1, Math.ceil(Math.hypot(x - g.x, y - g.y) / 6));
    for (let k = 1; k <= n; k++) { const s = slotAt(g.x + (x - g.x) * k / n, g.y + (y - g.y) * k / n); if (s && s.full && !swapping && !g.sent.has(s)) { g.sent.add(s); launch(s); } }   // (not while the next crate slides in)
    g.x = x; g.y = y;
  }
  function onDown(e) {
    if (!supply || (gesture && gesture.id !== e.pointerId && !e.isPrimary)) return;   // (a second finger: ignored; a new first one replaces a lost one)
    e.preventDefault(); try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, sent: new Set(), mode: 'sweep' };
    sweep(gesture, e.clientX, e.clientY);
  }
  function onMove(e) { const g = gesture; if (g && e.pointerId === g.id) sweep(g, e.clientX, e.clientY); }
  function onUp(e) { if (gesture && e.pointerId === gesture.id) gesture = null; }
  window.addEventListener('lostpointercapture', onUp, true);
  function init() {
    device = document.querySelector('.device'); stage = document.getElementById('stage'); svg = document.getElementById('dock-svg'); fly = document.getElementById('fly'); label = document.getElementById('dock-label'); dockEl = document.getElementById('dock');
    inner = UTIL.g(svg, '', { id: 'dock-inner' }); syncFly(); addEventListener('resize', syncFly);
    svg.addEventListener('pointerdown', onDown); svg.addEventListener('pointermove', onMove); svg.addEventListener('pointerup', onUp); svg.addEventListener('pointercancel', onUp);
    document.addEventListener('pointermove', e => { if (gesture && gesture.mode === 'drag') onMove(e); });
    document.addEventListener('pointerup', e => { if (gesture && gesture.mode === 'drag') onUp(e); });
  }
  return { stowaway, init, mount, pourAll, fillUp, sendTo, syncFly, toDevice, remaining, get spent() { return spent; }, get poor() { return poor; } };
})();
