/* Around the machine: plinth, recycling bin, rain, floating labels, clock, and the cat on top. */
const FX = (() => {
  let layer = null;
  const init = g => { layer = g; };
  function pop(x, y, z, text, color = 'var(--ink-hi)', px = 14) {
    if (!layer) return;
    const [sx, sy] = ISO.P(x, y, z), k = 1 / (window.CAMSCALE || 1);
    const t = UTIL.el('text', { class: 'pop', x: sx, y: sy, 'text-anchor': 'middle', 'font-size': px * k, fill: color, 'stroke-width': 3 * k }, layer);
    t.textContent = text;
    UTIL.tween(1400, e => { t.setAttribute('y', sy - 24 * k * e); t.setAttribute('opacity', e < .7 ? 1 : 1 - (e - .7) / .3); }, UTIL.ease.out).then(() => t.remove());
  }
  return { init, pop };
})();

const ENV = (() => {
  const { TOP, FRONT, box, rounded, disc } = ISO;
  let canvas, cx2d, drops = [], raining = true, rainAlpha = 1, rainUntil = 0, clear = false;
  // recycling bins on the right of the machine: in front of it from the right, behind it once the camera is on the left
  const bins = g => UTIL.g(g, box(130, 44, -8, 24, 38, 54) + disc(136, 54, 46, 4, 'recess') + disc(148, 54, 46, 4, 'recess') + disc(142, 70, 46, 4, 'recess')
    + `<g transform="${FRONT(130, 82, 46)}"><rect x="2" y="6" width="20" height="8" rx="1.5" fill="none" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/><text class="label sign" x="12" y="12" font-size="4.4" text-anchor="middle">かん · びん</text></g>`,
    { 'data-hit': 'bins', class: 'hit' });
  // plinth (sunk 8 below the cabinet floor), a contact shadow and the machine base with a vent and levelling feet
  function back(g) {
    let s = rounded(-14, -10, -17, 178, 112, 9, 12);
    s += `<g transform="${TOP(-14, -10, -8)}"><rect class="detail" x="8" y="8" width="162" height="96" rx="7"/>
      <rect class="nohit" x="12" y="8" width="128" height="94" rx="6" fill="#000" fill-opacity=".55" filter="url(#bloom-s)"/>
      <rect data-l="dk" class="lamp-light on nohit" x="12" y="96" width="132" height="16" fill="var(--tube)" fill-opacity=".09" filter="url(#bloom)"/></g>`;
    s += disc(-4, 94, -8, 2.4, 'detail') + disc(156, 94, -8, 2.4, 'detail');
    g.insertAdjacentHTML('beforeend', s);
    if (!ISO.right) bins(g);
    s = [[7, 7], [113, 7], [7, 77], [113, 77]].map(([x, y]) => rounded(x - 2.4, y - 2.4, -8, 4.8, 4.8, 2.6, 2.4, 'foot')).join('');
    s += box(4, 4, -5.4, 112, 76, 5.4, 0, 'basebox') + `<g transform="${FRONT(4, 80, 0)}"><rect class="recess" x="12" y="1.3" width="88" height="2.8" rx="1"/>${ISO.slits(16, 96, 3, 1.6, 3.8, true)}</g>`;
    g.insertAdjacentHTML('beforeend', s);
  }
  function front(g) { if (ISO.right) bins(g); }
  /* rain on a canvas overlay */
  function sizeCanvas() { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
  function stepRain(dt) {
    const W = canvas.width, H = canvas.height, dpr = Math.min(2, devicePixelRatio || 1);
    rainAlpha += ((raining ? 1 : 0) - rainAlpha) * Math.min(1, dt * 1.2);
    if (rainAlpha < .02 || UTIL.reduced) { if (!clear) { cx2d.clearRect(0, 0, W, H); clear = true; } return; }
    cx2d.clearRect(0, 0, W, H); clear = false;
    const want = Math.round(130 * rainAlpha * ND_RAIN.drops());   // (app build: platform/rain.js)
    while (drops.length < want) drops.push({ x: Math.random() * W * 1.2, y: Math.random() * -H, l: UTIL.rand(10, 22) * dpr, v: UTIL.rand(700, 1100) * dpr });
    if (drops.length > want) drops.length = want;
    cx2d.strokeStyle = `rgba(175,198,232,${.26 * rainAlpha})`; cx2d.lineWidth = dpr; cx2d.beginPath();
    for (const d of drops) { d.y += d.v * dt; d.x -= d.v * dt * .16; if (d.y > H) { d.y = -d.l - Math.random() * 60; d.x = Math.random() * W * 1.2; } cx2d.moveTo(d.x, d.y); cx2d.lineTo(d.x + d.l * .16, d.y - d.l); }
    cx2d.stroke();
  }
  function setRain(on) {
    raining = on; rainUntil = performance.now() + (on ? UTIL.rand(70000, 140000) : UTIL.rand(50000, 100000)); SND.rain(on);
    document.getElementById('wx').setAttribute('aria-pressed', on); document.getElementById('wxlabel').textContent = on ? T`雨` : T`晴`;
  }
  function clock() { const d = new Date(); document.getElementById('clock').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
  function init() { canvas = document.getElementById('rain'); cx2d = canvas.getContext('2d'); sizeCanvas(); addEventListener('resize', sizeCanvas); clock(); setInterval(clock, 10000); setRain(true); }
  function step(now, dt) { stepRain(dt); if (now > rainUntil) setRain(!raining && !UTIL.low); }   // (省电模式, v0.38: it never starts raining by itself)
  return { back, front, init, step, setRain, get raining() { return raining; } };
})();

/* The cats up close (cat v2): whoever is at the machine shown — on top, lying in front, sitting at the kerb, or only a
   tail hanging out of the take-out flap while its owner nibbles inside. Tap one: it wakes; tap again: it purrs. A drop
   makes their ears twitch. Each has its own tail, swinging. */
const CAT = (() => {
  let cats = [], sawXray = false, nextMogu = 0;
  const wob = (node, amp = 1.2) => node && UTIL.tween(300, e => node.setAttribute("transform", `translate(${(Math.sin(e * Math.PI * 4) * (1 - e) * amp).toFixed(2)} 0)`), t => t);
  const at = c => c.pose === "tray" ? [CORE.FLAP[0], CORE.FLAP[1] + 4, CORE.FLAP[2] + 10] : [100 + c.off[0], 64 + c.off[1], 262 + c.off[2]];
  // the cats on this machine (none at all, often: they go where they like)
  function attach(root) {
    petEnd();
    cats = [...root.querySelectorAll(".cat-n")].map(g => { const id = g.dataset.cat || "mike", pose = g.dataset.pose || "top";
      return { id, g, gx: root.querySelector(`.cat-x[data-cat="${id}"]`), pose, off: (g.dataset.o || "0,0,6").split(",").map(Number),
        eyesO: g.querySelector(".eyes-open"), eyesS: g.querySelector(".eyes-shut"), xeyes: root.querySelector(`.cat-x[data-cat="${id}"] .xeyes`), puffUntil: 0, puffNext: 0, tails: [...root.querySelectorAll(`.cat-n[data-cat="${id}"] .cat-tail, .cat-x[data-cat="${id}"] .cat-tail`)], awakeUntil: 0, nextZ: 0, nextTail: 0 }; });
    cats.forEach(c => { if (c.eyesO) { c.eyesO.style.display = "none"; c.eyesS.style.display = ""; } });
  }
  const find = el => { const g = el && el.closest && el.closest(".cat-n"); return cats.find(c => c.g === g) || cats[0] || null; };
  function wake(c, ms = 3500) { c.awakeUntil = performance.now() + ms; if (c.eyesO) { c.eyesO.style.display = ""; c.eyesS.style.display = "none"; } }
  // tap a cat: returns { id, purr } (purr: it was already awake), or null
  function tap(el) {
    const c = find(el); if (!c) return null;
    const [vm, vp] = NEKO.voice(c.id);
    if (c.pose === "tray") { SND.meow(vm); FX.pop(...at(c), T`もぐもぐ…!?`, "var(--accent-hi)", 12); wob(c.g); c.awakeUntil = performance.now() + 2000; return { id: c.id, purr: false, snack: true }; }
    if (performance.now() < c.awakeUntil) { SND.purr(vp); FX.pop(...at(c), T`呼噜呼噜`, "var(--ink-hi)", 12); wake(c); wob(c.g); wob(c.gx); return { id: c.id, purr: true }; }
    wake(c); SND.meow(vm); UTIL.haptic(12); FX.pop(...at(c), T`喵～`, "var(--accent-hi)", 14); return { id: c.id, purr: false };
  }
  // hold a cat (polish, 2026-10-15): eyes closed, content, a purr you can feel every second, the tail swishing; let go to stop
  let petC = null, petIv = 0, petN = 0;
  function pet(el) {
    const c = find(el); if (!c) return false;
    if (c.pose === "tray") { SND.meow(NEKO.voice(c.id)[0]); FX.pop(...at(c), T`もぐ…!?`, "var(--accent-hi)", 12); return false; }
    petEnd(); petC = c; c.petting = true; c.awakeUntil = 0; if (c.eyesO) { c.eyesO.style.display = "none"; c.eyesS.style.display = ""; }
    const beat = () => { SND.purr(NEKO.voice(c.id)[1]); UTIL.haptic([6, 60, 6, 60, 6]); wob(c.g, .5); FX.pop(...at(c), petN++ % 2 ? T`ゴロゴロ` : "♥", "#ff6f92", petN % 2 ? 15 : 11); };
    beat(); petIv = setInterval(beat, 1100); return true;
  }
  function petEnd() { clearInterval(petIv); if (petC) petC.petting = false; petC = null; }
  function startle() { cats.forEach(c => { if (performance.now() < c.awakeUntil || c.pose === "tray" || c.petting) return; wob(c.g, .8); wob(c.gx, .8); if (Math.random() < .35) wake(c, 900); }); }
  // the first X-ray of a visit finds the one nibbling inside (the others react to the scan line itself, below)
  function xray() { const c = cats.find(x => x.pose === "tray"); if (sawXray || !c) return; sawXray = true;
    setTimeout(() => { SND.meow(NEKO.voice(c.id)[0]); FX.pop(...at(c), T`…被发现了!?`, "var(--cyan)", 14); }, 700); }
  /* the X-ray scan line (polish, 2026-10-16; cat memo §5): the cats watch it — eyes, or the X-ray skull's sockets, follow
     it up and down — and when it sweeps over one, its tail puffs up fat and spiky for a moment (not on every pass) */
  let scanY = null;
  function scan(y, on) {
    if (!on) { if (scanY !== null) cats.forEach(c => { if (c.eyesO) c.eyesO.removeAttribute("transform"); if (c.xeyes) c.xeyes.removeAttribute("transform"); }); scanY = null; return; }
    const now = performance.now();
    for (const c of cats) {
      const cy = ISO.P(...at(c))[1], d = Math.max(-1, Math.min(1, (y - cy) / 50)), tr = `translate(${(d * .12).toFixed(2)} ${(d * .5).toFixed(2)})`;
      if (c.eyesO && !c.petting) { if (now > c.awakeUntil - 1200) wake(c, 1800); c.eyesO.setAttribute("transform", tr); }
      if (c.xeyes) c.xeyes.setAttribute("transform", tr);
      if (scanY !== null && scanY !== y && (scanY - cy) * (y - cy) <= 0 && now > c.puffNext) {
        c.puffUntil = now + 1500; c.puffNext = now + 5000; c.nextTail = 0; wob(c.g, 1.6); wob(c.gx, 1.6);
        SND.fuff(NEKO.voice(c.id)[0]); UTIL.haptic(8); FX.pop(...at(c), "!!", "var(--cyan)", 13);
      }
    }
    scanY = y;
  }
  function step(now) {
    for (const c of cats) {
      if (c.eyesO && c.awakeUntil && now > c.awakeUntil) { c.awakeUntil = 0; c.eyesO.style.display = "none"; c.eyesS.style.display = ""; }
      if (c.eyesO && !c.awakeUntil && !c.petting && now > c.nextZ) { UTIL.puff(c.g.querySelector(".zz")); c.nextZ = now + 6000 + Math.random() * 3000; }
      if (c.puffUntil && now > c.puffUntil) { c.puffUntil = 0; c.nextTail = 0; }
      if (now > c.nextTail) { const k = Math.random() * 2 - 1, puff = c.puffUntil ? 1 : 0;
        c.tails.forEach(t => { const x = !!t.closest(".cat-x"); t.innerHTML = c.pose === "tray" ? (x ? t.innerHTML : CAT3D.tailOut(k, CORE.FLAP, c.id, false, puff)) : CAT3D.tail(k, c.off, x, c.pose, c.id, undefined, puff); });
        c.nextTail = now + (puff ? 140 : c.petting ? 300 : c.awakeUntil ? 380 : c.pose === "tray" ? 900 : 1700); }
    }
    // the one nibbling in the flap: now and then a muffled もぐもぐ
    const snack = cats.find(c => c.pose === "tray");
    if (snack && now > nextMogu) { nextMogu = now + 4200 + Math.random() * 2400; FX.pop(...at(snack), T`もぐもぐ`, "#e2a95c", 10); }
  }
  // a present, up close: hearts over the cat that got it (when it is on this machine)
  function hearts(id) { const c = cats.find(x => x.id === id && x.pose !== "tray"); if (!c) return; wake(c, 2600); SND.purr(NEKO.voice(id)[1]); FX.pop(...at(c), T`♥ 好吃`, "#ff6f92", 13); }
  const has = id => cats.some(c => c.id === id);
  return { attach, tap, startle, xray, scan, step, hearts, has, pet, petEnd, get here() { return cats.length > 0; }, get ids() { return cats.map(c => c.id); },
    awake: el => { const c = find(el); return !!c && performance.now() < c.awakeUntil; } };
})();
