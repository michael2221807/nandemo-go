/* The goods card as a collector's card, its finish by the good's ★ (the owner, 2026-10-23: collecting should be a
   rush; the card that opens on a collected good becomes a trading card with a hologram finish). The picture (立绘) sits
   in a framed window, and the rarer the good, the more the card shines:
     ★1  card stock: a framed window, one sweep of light as it opens
     ★2  silver foil edge, the light sweeps by now and then
     ★3  SR: purple foil edge (the familiar "epic" item purple, #a335ee), a rainbow film over the picture, a few sparkles
     ★4  SSR: gold foil edge that shines with the finger, a holo film over the whole card, more sparkles, a warm glow
     ★5  UR: a dark red card, an edge of reds that runs round it, light rays behind the picture, glitter, a pulsing glow,
         a buzz as it opens
   (colours by the owner, 2026-10-23: SR purple, SSR gold, UR red-rainbow)
   The card can be picked up and dragged (the owner, 10-23): it follows the finger a little and leans with it, the
   film and the shine move as a real holo card does under a lamp, and it springs back when let go. Left
   alone it drifts slowly. All of it is CSS on the open card (the album hides the card, so nothing runs once it closes);
   the only script is the tilt while a finger is on it. The album's card has no idea which good it shows, so the tap on
   a good is noted first (capture on the document) and the card dressed after the album has drawn it (bubble). */
(() => {
  const album = document.getElementById('st-album'), detail = document.getElementById('al-detail');
  if (!album || !detail) return;
  const css = document.createElement('style');
  css.textContent = `@property --mx{syntax:'<percentage>';inherits:true;initial-value:50%}
@property --my{syntax:'<percentage>';inherits:true;initial-value:30%}
@property --spin{syntax:'<angle>';inherits:true;initial-value:0deg}
#al-detail{perspective:900px}
.al-d.ah{position:relative;overflow:visible;transform:translate(var(--tx,0px),var(--ty,0px)) scale(var(--sc,1)) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transform-style:preserve-3d;transition:transform .6s cubic-bezier(.3,1.5,.5,1)}
.al-d.ah.ah-drag{cursor:grabbing}
.al-d.ah.ah-drag{transition:none}
.ah-art{position:relative;display:grid;place-items:center;width:124px;height:112px;margin:2px 0 4px;border:2px solid var(--dink);border-radius:10px;overflow:hidden;
  background:radial-gradient(circle at 50% 42%,#fff 0,#fff6e4 60%,#f3e2c4 100%)}
.al-d .ah-art > svg{position:relative;width:76px;height:76px;z-index:1;filter:drop-shadow(0 3px 0 rgba(20,16,24,.18))}
.ah-art i,.ah-art u{position:absolute;inset:0;pointer-events:none}
.ah-sweep{z-index:2;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.85) 45%,transparent 60%) no-repeat;background-size:250% 100%;background-position:150% 0;mix-blend-mode:soft-light}
.ah-film{z-index:2;opacity:0;mix-blend-mode:color-dodge;background:linear-gradient(115deg,#ff5fa2 0,#ffd23f 18%,#3fd47a 36%,#3ff4ff 54%,#9a8cff 72%,#ff5fa2 90%) var(--mx) var(--my)/300% 300%}
.ah-rays{z-index:0;opacity:0;background:repeating-conic-gradient(from var(--spin) at 50% 46%,rgba(255,240,150,.6) 0 8deg,transparent 8deg 22deg)}
.ah-glit{z-index:2;opacity:0;background:radial-gradient(circle,#fff 0 .7px,transparent 1.2px) 0 0/9px 11px,radial-gradient(circle,#fff6b0 0 .6px,transparent 1.1px) 4px 6px/13px 10px;mix-blend-mode:screen}
.ah-sp{position:absolute;z-index:3;width:12px;height:12px;pointer-events:none;opacity:0;color:#fff;filter:drop-shadow(0 0 2px rgba(255,255,255,.9))}
.ah-sp svg{display:block;width:100%;height:100%}
.ah-badge{position:absolute;z-index:4;top:6px;right:6px;display:flex;gap:1px;padding:2px 4px;border:1.5px solid var(--dink);border-radius:999px;background:#fff}
.ah-badge svg{width:9px;height:9px}
.ah-rank{position:absolute;z-index:6;top:-11px;left:-8px;padding:3px 8px 2px;border:2px solid var(--dink);border-radius:8px;transform:rotate(-8deg);font:900 13px/1 var(--mono,monospace);letter-spacing:.06em;color:var(--dink);background:#fff;box-shadow:2px 2px 0 var(--dink)}
.ah-t2 .ah-rank{background:linear-gradient(135deg,#eef2f8,#aab3c4)}
.ah-t3 .ah-rank{color:#fff;background:linear-gradient(135deg,#c86aff,#a335ee 50%,#7a1ec8);text-shadow:0 1px 0 var(--dink)}
.ah-t4 .ah-rank{background:linear-gradient(135deg,#fff3c4,#ffd23f 45%,#d4a017);font-size:14px}
.ah-t5 .ah-rank{color:#fff;background:conic-gradient(from var(--spin),#ff2a3a,#ff8a2a,#ffd23f,#ff2a6a,#ff5fa2,#c8102a,#ff2a3a);text-shadow:0 1px 0 var(--dink),0 0 4px #000;font-size:15px}
/* the card's own foil, over everything (the text stays readable: soft-light at a low opacity) */
.al-d.ah::before{content:"";position:absolute;inset:0;border-radius:12px;pointer-events:none;z-index:5;opacity:0;mix-blend-mode:soft-light;
  background:linear-gradient(115deg,#ff5fa2 0,#ffd23f 16%,#3fd47a 32%,#3ff4ff 48%,#9a8cff 64%,#ff5fa2 80%,#ffd23f 100%) var(--mx) var(--my)/260% 260%}
.al-d.ah::after{content:"";position:absolute;inset:-4px;border-radius:17px;pointer-events:none;z-index:-1;opacity:0}
@keyframes ah-sweep{0%{background-position:150% 0}100%{background-position:-60% 0}}
@keyframes ah-drift{0%{--mx:20%;--my:20%}50%{--mx:80%;--my:70%}100%{--mx:20%;--my:20%}}
@keyframes ah-spin{to{--spin:360deg}}
@keyframes ah-tw{0%,100%{opacity:0;transform:scale(.3) rotate(0)}40%{opacity:1;transform:scale(1) rotate(45deg)}70%{opacity:0;transform:scale(.4) rotate(90deg)}}
@keyframes ah-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes ah-edge{to{--spin:360deg}}
.al-d.ah:not(.ah-drag){animation:carry .35s cubic-bezier(.2,1.6,.4,1),ah-drift 7s ease-in-out .35s infinite}
.ah .ah-sweep{animation:ah-sweep 1.1s ease-out .25s 1 both}
/* ★2 silver */
.al-d.ah-t2{border:4px solid transparent;box-shadow:4px 4px 0 #9aa3b4;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#8a94a6,#f4f7fb 30%,#9aa3b4 50%,#ffffff 70%,#7a8496) border-box}
.ah-t2 .ah-art{border-color:#8a94a6}
.ah-t2 .ah-sweep{animation:ah-sweep 1.4s ease-in-out .25s infinite;animation-delay:.25s;animation-duration:4s}
/* ★3 SR purple */
.al-d.ah-t3{border:4px solid transparent;box-shadow:4px 4px 0 #a335ee;background:linear-gradient(#fbf5ff,#fbf5ff) padding-box,linear-gradient(135deg,#6a12b0,#d49aff 26%,#a335ee 48%,#e8c4ff 70%,#5a0ea0) border-box}
.al-d.ah-t3::after{opacity:.5;box-shadow:0 0 16px 2px rgba(163,53,238,.55)}
.ah-t3 .ah-art{border-color:#a335ee;background:radial-gradient(circle at 50% 42%,#ffffff 0,#f0dcff 62%,#d6a8ff 100%)}
.ah-t3 .ah-sweep{animation:ah-sweep 3.2s ease-in-out .25s infinite}
.ah-t3 .ah-film{opacity:.4}
/* ★4 SSR gold: the gold edge shines along with the finger, a holo film over the card, a warm glow */
.al-d.ah-t4{border:4px solid transparent;box-shadow:4px 4px 0 #d4a017;background:linear-gradient(#fffdf4,#fffdf4) padding-box,linear-gradient(115deg,#a87400,#ffe9a0 20%,#d4a017 35%,#fff8d8 50%,#b8860b 65%,#ffe08a 80%,#a87400) var(--mx) 50%/220% 100% border-box}
.al-d.ah-t4::before{opacity:.42}
.al-d.ah-t4::after{opacity:.75;box-shadow:0 0 18px 3px rgba(255,210,63,.7),0 0 32px 8px rgba(255,170,40,.35)}
.ah-t4 .ah-art{border-color:#b8860b;background:radial-gradient(circle at 50% 42%,#fffbe8 0,#ffefc0 65%,#f2d88a 100%)}
.ah-t4 .ah-film{opacity:.55}
.ah-t4 .ah-glit{opacity:.55}
.ah-t4 .ah-sweep{animation:ah-sweep 2.6s ease-in-out .25s infinite}
/* ★5 UR red prism: a dark red card, an edge of reds and fire colours that runs round it */
.al-d.ah-t5{border:4px solid transparent;box-shadow:4px 4px 0 #c8102a;background:radial-gradient(ellipse at 50% 0,#5a1424 0,#2a0a16 60%,#16060c 100%) padding-box,conic-gradient(from var(--spin),#ff2a3a,#ff8a2a,#ffd23f,#ff2a6a,#ff5fa2,#3ff4ff,#c8102a,#ff2a3a) border-box}
.al-d.ah.ah-t5:not(.ah-drag){animation:carry .35s cubic-bezier(.2,1.6,.4,1),ah-drift 7s ease-in-out .35s infinite,ah-edge 4s linear infinite}
.al-d.ah.ah-t5.ah-drag{animation:carry .35s cubic-bezier(.2,1.6,.4,1),ah-edge 4s linear infinite}
.al-d.ah-t5::before{opacity:.35;mix-blend-mode:overlay}
.ah-t5 b{color:#ffe0a0!important;text-shadow:0 0 8px rgba(255,90,60,.8)} .ah-t5 p{color:#ffe8ea!important} .ah-t5 small,.ah-t5 em{color:#e0a8b4!important}
.al-d.ah-t5::after{opacity:.6;box-shadow:0 0 22px 4px rgba(255,60,60,.8),0 0 40px 10px rgba(255,170,40,.45);animation:ah-pulse 1.8s ease-in-out infinite}
.ah-t5 .ah-art{border-color:#c8102a;background:radial-gradient(circle at 50% 46%,#fff4e0 0,#ffb070 55%,#ff5a4a 100%)}
.ah-t5 .ah-rays{opacity:1;animation:ah-spin 14s linear infinite}
.ah-t5 .ah-film{opacity:.6}
.ah-t5 .ah-glit{opacity:.85}
.ah-t5 .ah-sweep{animation:ah-sweep 2s ease-in-out .25s infinite}
.ah .ah-sp{animation:ah-tw 2.2s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.al-d.ah,.al-d.ah-t5{animation:none!important}.ah .ah-sweep,.ah .ah-sp,.ah-t5 .ah-rays,.al-d.ah-t5::after{animation:none!important}.ah .ah-sp{opacity:.8}}`;
  document.head.appendChild(css);
  // drawn shapes (no glyphs): a four-pointed sparkle and the badge's star
  const SPARK = `<svg viewBox="-6 -6 12 12" aria-hidden="true"><path d="M0-6Q.7-.7 6 0Q.7.7 0 6Q-.7.7-6 0Q-.7-.7 0-6Z" fill="currentColor"/></svg>`;
  const STAR = c => `<svg viewBox="-5 -5 10 10" aria-hidden="true"><path d="M0-4.6l1.35 2.75 3.03.44-2.19 2.14.52 3.02L0 2.33l-2.71 1.42.52-3.02-2.19-2.14 3.03-.44z" fill="${c}" stroke="#141018" stroke-width=".8" stroke-linejoin="round"/></svg>`;
  // sparkles per ★ (where in the window, in %, and when): more of them, and wider spread, the rarer the good
  const SPOTS = [[18, 22, 0], [80, 30, .7], [70, 78, 1.4], [26, 70, 1.9], [50, 12, .35], [88, 60, 1.1], [10, 48, 1.6], [58, 88, .9], [40, 34, 2]];
  const COUNT = [0, 0, 1, 3, 6, 9], BADGE = ['', '#fff4dc', '#c9cfd8', '#a335ee', '#ffd23f', '#ff2a3a'];
  // the rarity letters collectors read at a glance (the same in every language)
  const RANK = ['', 'N', 'R', 'SR', 'SSR', 'UR'];

  let picked = null;
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('button');
    picked = t && album.contains(t) && t.dataset.kind && detail.hidden ? { kind: t.dataset.kind, id: t.dataset.id } : null;
  }, true);
  document.addEventListener('click', () => {
    const p = picked; picked = null;
    if (!p || detail.hidden) return;
    const g = ECON.product(p.kind, p.id), card = detail.querySelector('.al-d'), pic = card && card.querySelector(':scope > svg');
    if (g && pic) dress(card, pic, Math.max(1, Math.min(5, g.tier || 1)));
  });

  function dress(card, pic, tier) {
    card.classList.add('ah', 'ah-t' + tier);
    const art = document.createElement('div'); art.className = 'ah-art';
    art.innerHTML = `<i class="ah-rays"></i><i class="ah-film"></i><i class="ah-glit"></i><i class="ah-sweep"></i>`
      + SPOTS.slice(0, COUNT[tier]).map(([x, y, d]) => `<span class="ah-sp" style="left:calc(${x}% - 6px);top:calc(${y}% - 6px);animation-delay:${d}s">${SPARK}</span>`).join('')
      + `<span class="ah-badge">${STAR(BADGE[tier]).repeat(tier)}</span>`;
    pic.replaceWith(art); card.insertAdjacentHTML('afterbegin', `<span class="ah-rank">${RANK[tier]}</span>`); art.insertBefore(pic, art.children[1]);
    if (tier >= 4) UTIL.haptic(tier === 5 ? [10, 40, 10, 40, 18] : [10, 40, 10]);
    // tilt: the card leans toward the finger and the film follows it; a drag does not close the card
    let drag = null;
    // (the card is picked up: it follows the finger a third of the way, lifts a little and leans with the drag; the
    // film and shine follow where the finger is over it. Let go, it springs back to the middle)
    const set = (x, y) => { const dx = x - drag.x, dy = y - drag.y, cap = (d, m) => m * Math.tanh(d / m),
        u = Math.max(0, Math.min(1, .5 + dx / 260)), v = Math.max(0, Math.min(1, .5 + dy / 320)), P = (k, val) => card.style.setProperty(k, val);
      P('--tx', `${cap(dx * .35, 60).toFixed(1)}px`); P('--ty', `${cap(dy * .35, 70).toFixed(1)}px`); P('--sc', '1.05');
      P('--ry', `${cap(dx * .18, 28).toFixed(1)}deg`); P('--rx', `${cap(-dy * .15, 24).toFixed(1)}deg`);
      P('--mx', `${(u * 100).toFixed(0)}%`); P('--my', `${(v * 100).toFixed(0)}%`); };
    card.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false }; card.setPointerCapture(e.pointerId); });
    card.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) { drag.moved = true; card.classList.add('ah-drag'); }
      if (drag.moved) set(e.clientX, e.clientY); });
    const up = e => { if (!drag || e.pointerId !== drag.id) return; card.moved = drag.moved; drag = null; card.classList.remove('ah-drag');
      ['--tx', '--ty', '--sc', '--rx', '--ry', '--mx', '--my'].forEach(k => card.style.removeProperty(k)); };
    card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    card.addEventListener('click', e => { if (card.moved) { card.moved = false; e.stopPropagation(); } });
  }
})();
