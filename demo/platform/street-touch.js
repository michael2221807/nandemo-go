/* The street's small touches (the owner, 2026-11-03): more detail on the station square (駅前通り), little things on the
   backdrop a player can tap (a window's light on and off, the lamp post shaking, a neon stuttering, a lantern swinging,
   the station clock, the ticket gates, the moon), and a bubble when a machine is held (what it sells, how many are left,
   when it should sell out).
   - The backdrop is drawn once as a picture (platform/opt.js bgBitmap) and takes no taps (#street-bg is
     pointer-events:none): the places to tap are see-through shapes in the live layer (#street-svg), under the machines,
     and what moves is drawn over the picture in the street's own layer for its small events (#st-amb-city), with one-shot
     animations of position and opacity only (nothing loops; what changes stays only while a window is switched).
   - Taps are still judged by the street's own code (street.js's click handler calls STX.tap first): nothing new on the
     native side. A machine held 0.5 s shows its bubble and does not open on release; a short tap opens it as before; a
     finger that moves 10 px (or starts panning the street) is not a hold.
   tools/build_www.py hooks this into street.js (STX.ekiMore, STX.hots, STX.tap, STX.press, STX.held, STX.holding) and
   app.js (STX.infoOf). */
const STX = (() => {
  const INK = '#141018', NS = 'http://www.w3.org/2000/svg';
  const ink = (w = 2.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const $ = id => document.getElementById(id);
  let inner = null;   // street.js's handle: { vx(), street(), amb, setNoClick(t), dragMoved(), svg() }

  /* ---------- 1. the station square: more detail (inside backdropEki, over the station, under the shops to its right) ----------
     No words: pictograms only, so no new letters for the fonts and nothing to translate */
  // (the station clock, from the gable's middle (300, 214) down onto the station's left pillar, under the bunting, where
  // neither the wallet card (its foot at 206-221 CSS px: the gable and name board lie under it on an iPhone 13 Pro, the
  // whole of them on an SE) nor the street's name button (wider in English) covers it, 2026-11-03. Drawn as before, in
  // the gable's units, through this)
  const EKI_CLOCK = 'translate(174 324) scale(.7) translate(-300 -214)';
  function ekiMore() {
    let s = '';
    // the clock (moved here from street.js, drawn over the arches, build_www.py) grows a cat's ears; a weather vane with a
    // cat on the gable's top
    s += `<g transform="${EKI_CLOCK}"><circle cx="300" cy="214" r="17" fill="#fff8ec" ${ink(2.4)}/><path d="M300 214V203M300 214l7 4" ${ink(2)}/><circle cx="300" cy="214" r="1.6" fill="${INK}"/>
      ${[0, 90, 180, 270].map(a => { const r = a * Math.PI / 180; return `<path d="M${(300 + 13 * Math.sin(r)).toFixed(1)} ${(214 - 13 * Math.cos(r)).toFixed(1)}l${(1.6 * Math.sin(r)).toFixed(1)} ${(-1.6 * Math.cos(r)).toFixed(1)}" ${ink(1.6)}/>`; }).join('')}
      <path d="M287.5 202.5l2-9 7 5zM312.5 202.5l-2-9-7 5z" fill="#fff8ec" ${ink(2)}/><path d="M290.6 198l.8-2.6 2.2 1.6zM309.4 198l-.8-2.6-2.2 1.6z" fill="#ff8fb1"/></g>
      <path d="M300 177V156" ${ink(2.2)}/><path d="M293 160h14" ${ink(1.6)}/><path d="M300 150q-7 0-7 4q0 3 4 3h7q3 0 3-3l2-3l-3 1q-1-2-6-2z" fill="${INK}"/><path d="M295 150.5l1-3.5 2.5 2.5M302 150.5l1-3.5 2 2.8" fill="${INK}" stroke="${INK}" stroke-width="1"/>`;
    // the gable's trim: a cream fascia along the eaves, tiles' ends at the ridge
    s += `<path d="M142 242L300 176L458 242" fill="none" stroke="#fff3d6" stroke-width="2.2" stroke-linejoin="round"/>`
      + [0, 1, 2, 3, 4, 5, 6].map(k => { const x = 166 + k * 22; return `<path d="M${x} ${(242 - (x - 142) * 66 / 158).toFixed(1)}v4" stroke="#5e2a2a" stroke-width="2"/>`; }).join('')
      + [0, 1, 2, 3, 4, 5, 6].map(k => { const x = 302 + k * 22; return `<path d="M${x} ${(176 + (x - 300) * 66 / 158).toFixed(1)}v4" stroke="#5e2a2a" stroke-width="2"/>`; }).join('');
    // two lamps hung under the eaves
    s += [164, 436].map(x => `<path d="M${x} 236v8" ${ink(1.6)}/><circle cx="${x}" cy="250" r="9" fill="#fff3b0" opacity=".28"/><path d="M${x - 5} 244h10l-1.5 4h-7z" fill="#3a3550" ${ink(1.4)}/><circle cx="${x}" cy="251" r="3.6" fill="#ffe27a" ${ink(1.4)}/>`).join('');
    // left of the name board: the line's map (a loop of coloured lines and stations); right: the departures board
    s += `<rect x="176" y="250" width="44" height="26" rx="3" fill="#f6f1e4" ${ink(2)}/>
      <path d="M182 268q0-12 12-12h14q8 0 8 7" fill="none" stroke="#3aa04a" stroke-width="2.4" stroke-linecap="round"/><path d="M182 262h30q4 0 4 5v4" fill="none" stroke="#ff8a24" stroke-width="2.4" stroke-linecap="round"/><path d="M190 272q10-14 22-10" fill="none" stroke="#3c7cff" stroke-width="2.4" stroke-linecap="round"/>
      ${[[182, 268], [194, 256], [208, 256], [212, 262], [216, 271], [190, 272]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.9" fill="#fff" ${ink(1.1)}/>`).join('')}<circle cx="201" cy="262" r="2.6" fill="#ff4f8b" ${ink(1.1)}/>
      <rect x="380" y="250" width="44" height="26" rx="3" fill="#15121e" ${ink(2)}/>
      ${[0, 1, 2].map(r => `<path d="M386 ${257 + r * 7}h6M395 ${257 + r * 7}h12M410 ${257 + r * 7}h8" stroke="${r ? '#ff9a2e' : '#7dff8a'}" stroke-width="2.2" stroke-linecap="round"/>`).join('')}`;
    // the festival's bunting from pillar to pillar, over the arches
    s += [[170, 254], [254, 338], [338, 422]].map(([a, b]) => `<path d="M${a + 4} 284Q${(a + b) / 2 + 4} 294 ${b + 4} 284" fill="none" ${ink(1.2)}/>`
      + [0, 1, 2, 3, 4].map(k => { const t = (k + .5) / 5, x = a + 4 + (b - a) * t, y = 284 + 20 * t * (1 - t);
        return `<path d="M${(x - 4).toFixed(1)} ${(y - .5).toFixed(1)}L${(x + 4).toFixed(1)} ${(y + .5).toFixed(1)}L${x.toFixed(1)} ${(y + 8).toFixed(1)}z" fill="${['#ff4f8b', '#ffd23f', '#3ff4ff'][(k + a) % 3]}" ${ink(1.1)}/>`; }).join('')).join('');
    // a sign hung inside each arch over the gates: tickets ←, the trains →, the way out (green)
    const sign = (x, col, pict) => `<path d="M${x + 19} 300v18M${x + 43} 300v18" ${ink(1.2)}/><rect x="${x + 13}" y="318" width="36" height="16" rx="2.5" fill="${col}" ${ink(1.8)}/>${pict}`;
    s += sign(178, '#2a4fb0', `<rect x="194" y="322" width="13" height="8" rx="1" fill="#fff" ${ink(1)}/><path d="M197 326h7" stroke="${INK}" stroke-width="1"/><path d="M219 326h-7m3-3l-3 3 3 3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`)
      + sign(262, '#2a4fb0', `<rect x="279" y="321" width="16" height="10" rx="3" fill="#fff" ${ink(1)}/><rect x="281.5" y="323" width="4.5" height="3.5" rx=".8" fill="#2a4fb0"/><rect x="288" y="323" width="4.5" height="3.5" rx=".8" fill="#2a4fb0"/><path d="M297 326h9m-3-3l3 3-3 3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`)
      + sign(346, '#1f9a52', `<path d="M366 322h7v9h-7z" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M376 326h9m-3-3l3 3-3 3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="378.5" cy="321.5" r="1.6" fill="#fff"/>`);
    // a ticket machine row in the gap at each side of the station's front, and small potted pines by the outer pillars
    s += [[157, 1], [430, -1]].map(([x]) => `<rect x="${x}" y="340" width="12" height="44" rx="2" fill="#dfe6f2" ${ink(1.6)}/><rect x="${x + 2.5}" y="345" width="7" height="6" rx="1" fill="#5ff0ff" ${ink(1)}/>${[0, 1, 2].map(r => `<path d="M${x + 3} ${356 + r * 5}h2M${x + 7} ${356 + r * 5}h2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`).join('')}<rect x="${x + 3}" y="374" width="6" height="2.4" fill="${INK}"/>`).join('');
    // the far platform on the elevated line, seen past the roofs: a canopy on posts, its lamps, a cat-face board
    s += [[40, 132], [462, 600]].map(([a, b]) => `<path d="M${a} 186H${b}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${a} 186H${b}" stroke="#6a5f9a" stroke-width="2.6" stroke-linecap="round"/>`
      + Array.from({ length: Math.floor((b - a) / 30) + 1 }, (_, k) => `<path d="M${a + 6 + k * 30} 188v24" stroke="${INK}" stroke-width="2"/><circle cx="${a + 21 + k * 30}" cy="191" r="1.8" fill="#ffe7a0"/>`).filter((_, k) => a + 6 + k * 30 < b).join('')).join('')
      + `<rect x="500" y="193" width="26" height="13" rx="2" fill="#f6f1e4" ${ink(1.6)}/><circle cx="513" cy="200" r="4" fill="#fff" ${ink(1)}/><path d="M509.6 197.6l.6-2.8 2 1.6zM516.4 197.6l-.6-2.8-2 1.6z" fill="#fff" ${ink(.9)}/>`;
    return s;
  }
  // the convenience store's window: the posters and the drinks fridge inside (drawn just after the window)
  function konbiniMore() {
    return `<rect x="10" y="314" width="18" height="24" rx="1.5" fill="#ffe14a" ${ink(1.4)}/><circle cx="19" cy="324" r="5" fill="#fff" ${ink(1.1)}/><path d="M16 321.5l.6-3 2.2 1.8zM22 321.5l-.6-3-2.2 1.8z" fill="#fff" ${ink(.9)}/><path d="M13 334h12" ${ink(1)}/>
      <rect x="104" y="312" width="22" height="60" rx="2" fill="#e8fbff" ${ink(1.4)}/>${[0, 1, 2, 3].map(r => `<path d="M106 ${325 + r * 13}h18" ${ink(1)}/>` + [0, 1, 2, 3].map(c => `<rect x="${107 + c * 4.3}" y="${317 + r * 13}" width="3" height="7" rx="1" fill="${['#ff4f8b', '#3ff4ff', '#ffd23f', '#7fd99a'][(r + c) % 4]}"/>`).join('')).join('')}
      <path d="M40 360h56" stroke="#5ab8d8" stroke-width="2" opacity=".6"/><rect x="44" y="350" width="10" height="10" rx="1" fill="#ffb3c8" ${ink(1)}/><rect x="58" y="352" width="12" height="8" rx="1" fill="#ffd27a" ${ink(1)}/><rect x="74" y="349" width="9" height="11" rx="1" fill="#b8f05a" ${ink(1)}/>`;
  }

  /* ---------- 2. what can be tapped on each street ---------- */
  // windows [x, y, kind, w, h] (as street.js draws them; kind as drawn: lit, dark, tv)
  const WINS = {
    nandemo: [[8, 254, 'dark'], [48, 254, 'lit'], [88, 254, 'tv'], [8, 322, 'lit'], [88, 322, 'dark'], [266, 236, 'lit'], [306, 236, 'dark'], [266, 304, 'dark'], [306, 304, 'lit'], [426, 244, 'lit'], [426, 312, 'dark'], [574, 250, 'lit']],
    ekimae: [[500, 244, 'tv'], [500, 312, 'lit'], [574, 300, 'lit', 32, 30]],
  };
  // neon columns: the black board [x, y, w, h] and its letters [x, y0, step, size, n, colour]
  const NEONS = {
    nandemo: [[122, 246, 24, 122, 134, 270, 27, 17, 4, '#ff4f8b'], [348, 232, 28, 140, 362, 258, 30, 17, 4, '#3ff4ff'], [466, 236, 28, 140, 480, 262, 30, 17, 4, '#ffb347'], [534, 244, 26, 116, 547, 268, 26, 15, 4, '#b8f05a']],
    ekimae: [[462, 236, 28, 140, 476, 262, 30, 17, 4, '#ff4fd8']],
  };
  // red lanterns: x, the hook's y, the wall behind them (to cover the still one while it swings)
  const LANTERNS = { nandemo: [[432, 352, '#3b2a52'], [506, 352, '#3b2a52']], ekimae: [[572, 340, '#5a2a24'], [624, 340, '#5a2a24']] };
  const MOON = { nandemo: [328, 166], ekimae: [528, 116] };
  // the hit areas: [kind, index, x, y, w, h] (design units; padded to a finger's size where the thing is small)
  function areas(id) {
    const a = [], top = id === 'ekimae' ? 220 : 224;
    // the post first: a window behind it still takes a tap where it shows
    a.push(['pole', 0, 10, top, 28, 436 - top], ['pole', 0, 38, 362, 34, 28]);
    (WINS[id] || []).forEach(([x, y, , w = 28, h = 30], k) => a.push(['win', k, x - 3, y - 3, w + 6, h + 6]));
    (NEONS[id] || []).forEach(([x, y, w, h], k) => a.push(['neon', k, x - 3, y, w + 6, h]));
    (LANTERNS[id] || []).forEach(([x, y], k) => a.push(['lantern', k, x - 15, y - 4, 30, 40]));
    const [mx, my] = MOON[id]; a.push(['moon', 0, mx - 30, my - 30, 60, 60]);
    if (id === 'ekimae') {
      a.push(['clock', 0, 157, 304, 34, 35]);   // (where the clock is now, EKI_CLOCK: 276, 186, 48 × 50 at the gable before)
      [0, 1, 2].forEach(i => a.push(['gate', i, 178 + i * 84, 340, 62, 46]));
      a.push(['konbini', 0, 2, 300, 128, 82]);
    } else a.push(['board', 0, 148, 236, 96, 54]);
    return a;
  }
  // the live layer's see-through shapes (street.js draws them first, under the machines)
  function hots(id) {
    setTimeout(() => restore(id), 0);
    return `<g class="stx-hots">${areas(id).map(([k, i, x, y, w, h]) => `<rect class="st-hot" data-hot="${k}" data-k="${i}" x="${x}" y="${y}" width="${w}" height="${h}" fill="transparent"/>`).join('')}</g>`;
  }

  /* ---------- what a tap does ---------- */
  const layer = () => $('st-amb-city');
  const add = (markup, attrs = {}) => { const L = layer(); if (!L) return null; const g = document.createElementNS(NS, 'g'); g.innerHTML = markup;
    for (const k in attrs) g.setAttribute(k, attrs[k]); L.appendChild(g); return g; };
  const once = (g, frames, ms, o = {}) => { if (!g) return; if (!g.animate) { g.remove(); return; }
    const a = g.animate(frames, { duration: ms, easing: o.easing || 'linear', fill: 'forwards', delay: o.delay || 0 }); if (o.keep) return a;
    a.finished.then(() => g.remove(), () => g.remove()); return a; };
  const calm = () => (window.UTIL && UTIL.reduced);
  const buzz = n => { if (window.UTIL) UTIL.haptic(n); };
  // the windows a player switched, per street: their covers stay till switched back (or the street is drawn anew: restore)
  const switched = { nandemo: new Map(), ekimae: new Map() };
  const winCover = (x, y, kind, w, h, on) => `<rect x="${x + 1.2}" y="${y + 1.2}" width="${w - 2.4}" height="${h - 2.4}" rx="2.4" fill="${on ? (kind === 'tv' ? '#5ff0ff' : '#ffd86b') : '#232a52'}"/>`
    + `<path d="M${x + w / 2} ${y + 2}V${y + h - 2}" stroke="${INK}" stroke-width="1.6"/>` + (on ? `<path d="M${x + 4} ${y + 4}q5 ${h / 3} 0 ${h - 8}" fill="none" stroke="#ff8fb1" stroke-width="2.2" stroke-linecap="round"/>` : '');
  function restore(id) {
    const m = switched[id]; if (!m) return;
    m.forEach((v, k) => { if (!v.g || !v.g.isConnected) { const [x, y, kind, w = 28, h = 30] = WINS[id][k]; v.g = add(winCover(x, y, kind, w, h, v.on), { class: 'stx-win' }); } });
  }
  const held = (id, x, y) => { const m = switched[id]; if (!m) return false; const k = (WINS[id] || []).findIndex(w => w[0] === x && w[1] === y); return k >= 0 && m.has(k); };
  const last = {};
  const ACT = {
    win(id, k) {
      const [x, y, kind, w = 28, h = 30] = WINS[id][k], m = switched[id], cur = m.get(k), litNow = cur ? cur.on : kind !== 'dark', on = !litNow;
      if (cur && cur.g) cur.g.remove();
      if (on === (kind !== 'dark')) m.delete(k);   // back as drawn
      else { const g = add(winCover(x, y, kind, w, h, on), { class: 'stx-win' }); m.set(k, { on, g });
        if (on && g && !calm()) once(g, [{ opacity: 0 }, { opacity: .9, offset: .15 }, { opacity: .1, offset: .3 }, { opacity: 1 }], 260, { keep: true }); }
      if (on) SND.click(); else SND.tick(0);
      buzz(5);
    },
    neon(id, k) {
      const [, , , , lx, ly, step, size, n] = NEONS[id][k];
      for (let i = 0; i < n; i++) {
        const g = add(`<rect x="${lx - size / 2 - 2}" y="${ly + i * step - size + 1}" width="${size + 4}" height="${size + 3}" fill="${INK}"/>`);
        once(g, calm() ? [{ opacity: 0 }, { opacity: .9 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: .95, offset: .12 }, { opacity: 0, offset: .24 }, { opacity: .9, offset: .4 }, { opacity: .15, offset: .55 }, { opacity: .9, offset: .68 }, { opacity: 0 }], 900, { delay: i * 70 });
      }
      SND.click(); setTimeout(() => SND.click(), 160); buzz([4, 50, 4]);
    },
    lantern(id, k) {
      const [x, y, wall] = LANTERNS[id][k], cy = y + 18;
      const cover = add(`<rect x="${x - 12}" y="${y - 1}" width="24" height="${384 - y + 1}" fill="${wall}"/><rect x="${x - 12}" y="${y - 1}" width="24" height="${384 - y + 1}" fill="url(#st-dots)"/>`);
      const body = `<path d="M${x} ${y}v6" ${ink(1.6)}/><ellipse cx="${x}" cy="${cy}" rx="9" ry="12" fill="#ff4f3a" ${ink(2)}/><path d="M${x - 9} ${cy}h18M${x - 7} ${cy - 8}h14M${x - 7} ${cy + 8}h14" stroke="${INK}" stroke-width="1" opacity=".5"/><rect x="${x - 4}" y="${y + 4}" width="8" height="3" fill="${INK}"/><rect x="${x - 4}" y="${cy + 11}" width="8" height="3" fill="${INK}"/>`;
      const g = add(body); if (g) { g.style.transformOrigin = `${x}px ${y}px`; g.style.transformBox = 'view-box'; }
      const amp = calm() ? 4 : 14, fr = [0, -1, .75, -.5, .3, -.15, 0].map((v, i, A) => ({ transform: `rotate(${(v * amp).toFixed(1)}deg)`, offset: i / (A.length - 1) }));
      const ms = 1500; once(g, fr, ms, { easing: 'ease-out' }); setTimeout(() => cover && cover.remove(), ms);
      SND.tick(2); buzz(6);
    },
    pole(id) {
      // the post's top half shakes (a copy with a heavier line laid over the picture's, so the still one stays hidden),
      // its lamp blinks and the pool of light goes with it
      const eki = id === 'ekimae', top = eki ? 246 : 226;
      let post = `<rect x="18" y="${top}" width="11" height="${440 - top}" rx="3" fill="#8e86a8" ${ink(5)}/>`;
      if (eki) post += `<circle cx="23.5" cy="236" r="15" fill="#ffd23f" ${ink(5)}/><text x="23.5" y="240.5" class="st-sign" font-size="10" text-anchor="middle" fill="${INK}">${inner && inner.sg ? inner.sg('バス', T`公交`, 10, 26) : 'バス'}</text>`;
      else post += `<rect x="4" y="260" width="40" height="7" rx="2" fill="#6e6690" ${ink(4.4)}/><rect x="9" y="282" width="30" height="6" rx="2" fill="#6e6690" ${ink(4.4)}/>`;
      post += `<rect x="28" y="312" width="20" height="28" rx="4" fill="#a39cbd" ${ink(4.4)}/><path d="M29 368h20q9 0 9 9" fill="none" ${ink(5)}/><path d="M48 377h20l-3 8H51z" fill="#fff3b0" ${ink(4.4)}/><path d="M48 377h20l-3 8H51z" fill="#fff3b0" ${ink(2)}/>`;
      const g = add(post), dim = add(`<path d="M58 392L-8 652H168Z" fill="#141028" opacity=".55"/><path d="M50 378h17l-2.4 6H52.4z" fill="#5a5470"/>`);
      const amp = calm() ? 0 : 2;
      once(g, [0, -1, 1, -.8, .8, -.5, .4, -.2, 0].map((v, i, A) => ({ transform: `translate(${(v * amp).toFixed(2)}px, 0)`, offset: i / (A.length - 1) })), 700);
      once(dim, [{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 0, offset: .2 }, { opacity: 1, offset: .32 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .56 }, { opacity: 0 }], 1100);
      SND.click(); buzz([10, 40, 6]);
    },
    moon(id) {
      if (inner && inner.amb && inner.amb.star) inner.amb.star();
      const [mx, my] = MOON[id];
      const g = add(`<path d="M0 -6Q0 0 6 0Q0 0 0 6Q0 0 -6 0Q0 0 0 -6Z" fill="#fff6d6"/>`, { transform: `translate(${mx + 22} ${my - 20})` });
      once(g, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.2)', offset: .3 }, { opacity: 0, transform: 'scale(.6)' }], 700);
      SND.tick(7); buzz(4);
    },
    clock() {
      const face = add(`<g transform="${EKI_CLOCK}"><circle cx="300" cy="214" r="17" fill="#fff8ec" ${ink(2.4)}/>` + [0, 90, 180, 270].map(a => { const r = a * Math.PI / 180;
        return `<path d="M${(300 + 13 * Math.sin(r)).toFixed(1)} ${(214 - 13 * Math.cos(r)).toFixed(1)}l${(1.6 * Math.sin(r)).toFixed(1)} ${(-1.6 * Math.cos(r)).toFixed(1)}" ${ink(1.6)}/>`; }).join('') + '</g>');
      // (each hand turned inside the clock's place, EKI_CLOCK: its group the one that turns, round the clock's centre)
      const hand = d => { const o = add(`<g transform="${EKI_CLOCK}"><g><path d="${d}" ${ink(2)}/></g></g>`); return o && o.firstElementChild.firstElementChild; };
      const min = hand('M300 214V203'), hr = hand('M300 214l7 4'), pin = add(`<g transform="${EKI_CLOCK}"><circle cx="300" cy="214" r="1.6" fill="${INK}"/></g>`);
      [min, hr].forEach(g => { if (g) { g.style.transformOrigin = '300px 214px'; g.style.transformBox = 'view-box'; } });
      const ms = calm() ? 400 : 1200;
      once(min, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], ms, { easing: 'ease-in-out' });
      once(hr, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(30deg)' }], ms, { easing: 'ease-in-out' });
      setTimeout(() => { face && face.remove(); pin && pin.remove(); [min, hr].forEach(g => g && g.parentNode && g.parentNode.parentNode && g.parentNode.parentNode.remove()); }, ms);
      SND.chime(); buzz(6);
    },
    gate(id, i) {
      const x = 178 + i * 84;
      [8, 26, 44].forEach((dx, n) => { const g = add(`<circle cx="${x + dx + 5}" cy="356" r="3" fill="#6bff9a"/><circle cx="${x + dx + 5}" cy="356" r="6" fill="#6bff9a" opacity=".35"/>`);
        once(g, [{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], 900, { delay: n * 120 }); });
      [0, 120, 240].forEach(t => setTimeout(() => SND.tick(5), t)); buzz(4);
    },
    konbini() {
      const g = add(`<rect x="3" y="307" width="126" height="70" fill="#fff" opacity=".6"/>`);
      once(g, [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 0 }], 700);
      SND.chime(); buzz(5);
    },
    board() {
      [[154, 240], [238, 246], [196, 290], [244, 280]].forEach(([x, y], n) => { const g = add(`<path d="M0 -5Q0 0 5 0Q0 0 0 5Q0 0 -5 0Q0 0 0 -5Z" fill="#ffd23f" stroke="${INK}" stroke-width="1"/>`, { transform: `translate(${x} ${y})` });
        once(g, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1.3)', offset: .35 }, { opacity: 0, transform: 'scale(.5)' }], 650, { delay: n * 90 }); });
      SND.coin(); buzz(5);
    },
  };
  // street.js's click handler: true when the tap was on one of these
  function tap(el) {
    if (!el || !inner) return false;
    const kind = el.dataset.hot, k = +el.dataset.k, id = inner.street(), key = id + kind + k, now = Date.now();
    if (!ACT[kind]) return false;
    if (kind !== 'win' && last[key] && now - last[key] < 600) return true;   // (one at a time on each thing)
    last[key] = now;
    try { ACT[kind](id, k); } catch (e) { /* a missing layer (the street redrawing): nothing to show */ }
    return true;
  }

  /* ---------- 3. hold a machine: its bubble ---------- */
  const HOLD_MS = 500, SLOP = 10;
  let press = null, bubble = null, hideT = 0;
  const fmtLeft = ms => {
    const min = Math.max(1, Math.round(ms / 60000));
    if (min < 60) return T`约 ${min} 分钟`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? T`约 ${h} 小时 ${m} 分` : T`约 ${h} 小时`;
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function hide() {
    clearTimeout(hideT); if (!bubble) return; const b = bubble; bubble = null;
    b.classList.add('out'); setTimeout(() => b.remove(), 180);
  }
  function show(i, el) {
    hide(); const box = $('street'); if (!box || !STX.infoOf) return;
    let d; try { d = STX.infoOf(i); } catch (e) { return; } if (!d) return;
    const rows = d.items.map(g => `<li><i style="background:${esc(g.c || '#ccc')}"></i><span class="n">${esc(g.name)}</span>`
      + (g.sold ? (g.n === null ? '' : `<b>${T`剩 ${g.n}`}</b>`) : `<em>${T`还没卖出`}</em>${g.n === null ? '' : `<b>${T`剩 ${g.n}`}</b>`}`) + '</li>').join('');
    const left = d.count + d.ware;
    const eta = !left ? `<p class="eta out">${T`售罄 · 等补货`}</p>`
      : d.stopAt > Date.now() + 30000 ? `<p class="eta">${d.stuck ? T`${fmtLeft(d.stopAt - Date.now())}后停卖（机器要照看）` : T`预计${fmtLeft(d.stopAt - Date.now())}后卖光`}</p>`
      : `<p class="eta">${T`快卖光了`}</p>`;
    const b = document.createElement('div'); b.className = 'stx-bubble'; b.setAttribute('role', 'status');
    b.innerHTML = `<p class="t">${esc(d.brand)}</p><ul>${rows}</ul><p class="sum">${d.cup ? T`还能做 ${d.count} 杯` : T`货架 ${d.count}/${d.cap}`}${d.wareCap ? ' · ' + T`仓库 ${d.ware}` : ''}</p>${eta}`;
    box.appendChild(b); bubble = b;
    // above the machine, inside the screen; its tail points at the machine's middle
    const r = el.getBoundingClientRect(), R = box.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight;
    const cx = r.left + r.width / 2 - R.left, left0 = Math.max(8, Math.min(R.width - w - 8, cx - w / 2));
    let top = r.top - R.top - h - 10; const below = top < 8; if (below) top = Math.min(R.height - h - 8, r.top - R.top + 40);
    Object.assign(b.style, { left: left0 + 'px', top: top + 'px' });
    b.style.setProperty('--tail', Math.max(16, Math.min(w - 16, cx - left0)) + 'px'); b.classList.toggle('below', below);
  }
  // street.js's pointerdown on the live layer: a hold on a machine (not its swap button) starts the clock
  function down(e) {
    hide();
    const m = e.target.closest && e.target.closest('.st-m'); if (!m || e.target.closest('.st-swap') || !inner) return;
    clearTimeout(press && press.t);
    press = { x: e.clientX, y: e.clientY, i: +m.dataset.i, el: m, fired: false, id: e.pointerId };
    press.t = setTimeout(() => {
      if (!press || inner.dragMoved()) { press = null; return; }
      press.fired = true; inner.setNoClick(Date.now() + 864e5);
      buzz(12); SND.pop(); show(press.i, press.el.querySelector('.st-art') || press.el);
    }, HOLD_MS);
  }
  function move(e) {
    if (!press || press.fired || e.pointerId !== press.id) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP || inner.dragMoved()) { clearTimeout(press.t); press = null; }
  }
  function up() {
    if (!press) return; clearTimeout(press.t);
    if (press.fired) { inner.setNoClick(Date.now() + 350); clearTimeout(hideT); hideT = setTimeout(hide, 2600); }
    press = null;
  }
  function attach(handle) {
    inner = handle; const svg = handle.svg();
    svg.addEventListener('pointerdown', down);
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
    // a tap anywhere else, or leaving the street, takes the bubble away
    document.addEventListener('pointerdown', e => { if (bubble && !svg.contains(e.target)) hide(); }, true);
    document.addEventListener('visibilitychange', hide);
  }

  // the words (Chinese keys; English, Japanese, Traditional)
  const words = (l, d) => { try { I18N.add(l, d); } catch (e) { /* that language's dictionary not loaded */ } };
  if (typeof I18N !== 'undefined' && I18N.add) {
    words('en', { '约 {0} 分钟': 'about {0} min', '约 {0} 小时 {1} 分': 'about {0} h {1} min', '约 {0} 小时': 'about {0} h', '剩 {0}': '{0} left', '还没卖出': 'not sold yet',
      '售罄 · 等补货': 'Sold out · needs restocking', '{0}后停卖（机器要照看）': 'Stops in {0} (needs a look)', '预计{0}后卖光': 'Sells out in {0}', '快卖光了': 'Almost sold out',
      '还能做 {0} 杯': '{0} cups left', '货架 {0}/{1}': 'Shelves {0}/{1}', '仓库 {0}': 'Stockroom {0}' });
    words('ja', { '约 {0} 分钟': '約{0}分', '约 {0} 小时 {1} 分': '約{0}時間{1}分', '约 {0} 小时': '約{0}時間', '剩 {0}': '残り{0}', '还没卖出': 'まだ売れてない',
      '售罄 · 等补货': '売り切れ・補充待ち', '{0}后停卖（机器要照看）': '{0}で止まりそう（お世話が必要）', '预计{0}后卖光': '{0}で売り切れそう', '快卖光了': 'もうすぐ売り切れ',
      '还能做 {0} 杯': 'あと{0}杯', '货架 {0}/{1}': '棚 {0}/{1}', '仓库 {0}': '倉庫 {0}' });
    words('zh-Hant', { '约 {0} 分钟': '約 {0} 分鐘', '约 {0} 小时 {1} 分': '約 {0} 小時 {1} 分', '约 {0} 小时': '約 {0} 小時', '剩 {0}': '剩 {0}', '还没卖出': '還沒賣出',
      '售罄 · 等补货': '售罄 · 等補貨', '{0}后停卖（机器要照看）': '{0}後停賣（機器要照看）', '预计{0}后卖光': '預計{0}後賣光', '快卖光了': '快賣光了',
      '还能做 {0} 杯': '還能做 {0} 杯', '货架 {0}/{1}': '貨架 {0}/{1}', '仓库 {0}': '倉庫 {0}' });
  }

  return { ekiMore, konbiniMore, hots, tap, held, attach, hide, get holding() { return !!(press && press.fired); }, infoOf: null };
})();
