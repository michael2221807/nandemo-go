/* なんでも自販機 · the phone around the game (v0.38, 2026-10-18). A demo layer, not part of the game: a lock screen
   with the notifications the game would have sent and the lock-screen widgets, a home screen with a small and a
   medium widget, and a clock you can move on.
   Everything here is worked out the way the real app has to work: when you leave, it writes down each machine's
   shelf, warehouse box and pace; the widgets and the scheduled notifications read only that plan (a widget cannot
   run the game). Back in the game, the time away is settled by the game's own replay, so the two can differ by a few
   minutes (a 大繁盛 sells out sooner, a machine flaw later). Where the cats sit depends only on the 25-minute stretch
   and the save, so a widget can work out a whole day of cats in advance. */
const PHONE = (() => {
  const $ = id => document.getElementById(id), HOUR = 3600e3, MIN = 60e3;
  let hooks = { snap: null, back() {}, gearOf: () => ({}) }, S = null, t = 0, scr = 'lock', ev = [], wasRain = false;

  /* ---------- the plan written down on leaving ---------- */
  // (v0.41) the plan says how far each machine really gets (units) and when it stops (stopAt: sold out or stuck)
  const left = m => m.units !== undefined ? m.units : m.count + m.ware;
  const etaOf = m => m.stopAt !== undefined ? m.stopAt : S.t0 + left(m) * m.gap;
  const paceOf = m => left(m) > 0 ? (etaOf(m) - S.t0) / left(m) : m.gap;
  function at(m, tt) {
    const sold = Math.min(left(m), Math.max(0, (tt - S.t0) / paceOf(m))), rest = m.count + m.ware - sold;
    const shelf = sold < m.count ? m.count - sold : rest;   // the warehouse box refills the shelf once
    return { sold, shelf: tt >= etaOf(m) ? 0 : shelf };     // stopped (sold out or stuck) reads as 売切
  }
  const earned = tt => S.machines.reduce((a, m) => a + at(m, tt).sold * m.price, 0);
  const lastOut = (list = S.machines) => { const live = list.filter(m => left(m) > 0); return live.length ? Math.max(...live.map(etaOf)) : S.t0; };
  // (v0.46) the street the widgets show: the one the player last looked at (plan.street), its name and its machines
  const stName = () => { const x = (S.streets || []).find(z => z.id === S.street); return x ? x.name : 'なんでも通り'; };
  const stMachines = () => S.machines.filter(m => !m.street || m.street === S.street);

  /* ---------- times as the phone says them ---------- */
  const hm = tt => { const d = new Date(tt); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const day0 = tt => { const d = new Date(tt); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
  const when = tt => Math.round((day0(tt) - day0(t)) / 864e5) === 1 ? T`明天 ${hm(tt)}` : hm(tt);
  const dur = ms => { const m = Math.max(1, Math.round(ms / MIN)), h = Math.floor(m / 60); return h ? T`${h} 小时 ${m % 60} 分` : T`${m} 分钟`; };
  const ago = tt => { const d = t - tt; return d < MIN ? T`现在` : d < HOUR ? T`${Math.floor(d / MIN)} 分钟前` : d < 24 * HOUR ? T`${Math.floor(d / HOUR)} 小时前` : hm(tt); };
  const morning = tt => { const d = new Date(tt), h = d.getHours();
    return h >= 22 ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 8).getTime() : h < 8 ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8).getTime() : tt; };

  /* ---------- what gets scheduled on leaving (the rules a real app follows too) ----------
     - sold out: one notice when the whole street is empty (or, by choice, also when the first machine is), never one
       per machine; nothing if you left it empty
     - a new cat on its way, and the day-3 flyer (the notice keeps the surprise: it never names the machine)
     - quiet hours 22:00–8:00 hold everything until 8:00; at most three a day; no "come back" reminders, ever */
  function plan() {
    const P = SETTINGS.prefs, out = [];
    if (P.perm !== true) return out;
    const live = S.machines.filter(m => left(m) > 0);
    if (live.length && P.sold !== 'off') {
      if (P.sold === 'one' && live.length > 1) { const f = live.reduce((a, m) => etaOf(m) < etaOf(a) ? m : a); out.push({ real: etaOf(f), kind: 'one', m: f, rest: live.length - 1 }); }
      out.push({ real: lastOut(), kind: 'all' });
    }
    if (P.cat) NEKO.CATS.forEach(c => { const s = NEKO.state(c.id); if (s.status === 'none' && s.due > S.t0) out.push({ real: s.due, kind: 'cat', c }); });
    if (P.mach && !S.special) { const b = new Date(S.born); out.push({ real: Math.max(new Date(b.getFullYear(), b.getMonth(), b.getDate() + 2, 9).getTime(), S.born + 36 * HOUR), kind: 'flyer' }); }
    out.forEach(e => { e.at = P.quiet ? morning(e.real) : e.real; });
    // (v0.46) the first machine and the whole street both held until the same 8:00: only the whole street is said
    const all = out.find(e => e.kind === 'all'), one = out.find(e => e.kind === 'one');
    if (all && one && one.at === all.at && one.at !== one.real) out.splice(out.indexOf(one), 1);
    const per = {};
    return out.filter(e => e.real > S.t0 + MIN && e.at < S.t0 + 30 * HOUR).sort((a, b) => a.at - b.at)
      .filter(e => { const k = new Date(e.at).toDateString(); per[k] = (per[k] || 0) + 1; return per[k] <= 3; });
  }
  // the cat to show at a moment: one on a machine if any, else in front, at the kerb, in the box …
  const ORDER = ['top', 'front', 'kerb', 'tray', 'box', 'lot'];
  function catAt(tt) {
    let best = null;
    for (const [id, s] of Object.entries(NEKO.seatsAt(tt))) { const r = ORDER.indexOf(s.kind); if (r >= 0 && (!best || r < best.r)) best = { id, s, r }; }
    return best;
  }
  function note(e) {
    const night = e.at !== e.real, tm = hm(e.real);
    const nSt = (S.streets || []).length;
    if (e.kind === 'all') { const c = catAt(e.real); return { title: nSt >= 3 ? T`每条街都卖空了` : nSt === 2 ? T`两条街都卖空了` : T`街上全部卖空了`, body: (night ? T`夜里 ${tm} 卖空的 · ` : '') + T`这一轮卖了约 ${UTIL.money(earned(e.real))}`, thumb: c && c.id }; }
    if (e.kind === 'one') return { title: T`${e.m.brand} 卖空了`, body: T`其他 ${e.rest} 台还在卖` + (night ? T` · 夜里 ${tm} 空的` : ''), go: e.m.i };
    if (e.kind === 'cat') return { title: T`纸箱旁边来了一只${e.c.kind}`, body: T`送它一次吃的，它就成了这条街的常客`, thumb: e.c.id };
    return { title: T`有只猫叼来一张传单`, body: T`上面写着「开张」。是哪一台呢？`, thumb: (catAt(e.real) || { id: 'mike' }).id };
  }

  /* ---------- drawing ---------- */
  // the app icon: a night-blue tile, the cream machine with its window of drinks, ミケ asleep on top
  const ICON = `<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" fill="#1f1848"/><rect y="38" width="60" height="22" fill="#2b2160"/>
    <path d="M0 50h60" stroke="#ffd23f" stroke-width="3" stroke-dasharray="5 4"/>
    <rect x="17" y="20" width="26" height="33" rx="3" fill="#fff8ec" stroke="#141018" stroke-width="2.2"/>
    <rect x="20.5" y="23.5" width="13.5" height="16" rx="1.5" fill="#55d4ff" stroke="#141018" stroke-width="1.6"/>
    <g stroke="#141018" stroke-width=".8"><circle cx="24" cy="28" r="1.9" fill="#ff4f8b"/><circle cx="28.4" cy="28" r="1.9" fill="#ffd23f"/><circle cx="24" cy="34.5" r="1.9" fill="#7fe36b"/><circle cx="28.4" cy="34.5" r="1.9" fill="#ff8a3d"/></g>
    <rect x="36" y="25" width="4" height="7" rx="1" fill="#141018"/><rect x="20.5" y="44" width="19" height="5.5" rx="1.5" fill="#141018"/>
    <path d="M20 19.6q0-6.6 9-6.6q6 0 8 3.4l1.4-3.6l1.4 4.4q1.6 1 1.6 2.4z" fill="#fff" stroke="#141018" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M23 15.6q3-2.2 6-1.6l-.6 3.4q-3.4 0-5.4-1.8z" fill="#e8863e"/><path d="M33.6 14.6l2 1.6l-1.8 1.4z" fill="#3a2b2b"/>
    <path d="M36.2 17.6q1 .8 2 0" stroke="#141018" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
  // other apps on the phone: plain tiles with plain marks (no real brands)
  const GLYPH = {
    clock: ['#1c1c1e', '<circle cx="30" cy="30" r="17" fill="#fff"/><path d="M30 19v12l8 5" stroke="#1c1c1e" stroke-width="3" fill="none" stroke-linecap="round"/>'],
    sun: ['#3d8de0', '<circle cx="25" cy="25" r="9" fill="#ffd60a"/><path d="M19 43h22a7 7 0 0 0 0-14a10 10 0 0 0-19 3a5.5 5.5 0 0 0-3 11z" fill="#fff"/>'],
    photo: ['#fff', '<g opacity=".9"><circle cx="30" cy="21" r="8" fill="#ff9f0a"/><circle cx="39" cy="30" r="8" fill="#30d158"/><circle cx="30" cy="39" r="8" fill="#0a84ff"/><circle cx="21" cy="30" r="8" fill="#ff375f"/></g>'],
    memo: ['#fff', '<rect width="60" height="16" fill="#ffd60a"/><path d="M12 28h36M12 36h36M12 44h24" stroke="#c7c7cc" stroke-width="2.5"/>'],
    map: ['#dff0d4', '<path d="M8 48L52 14" stroke="#fff" stroke-width="8"/><path d="M30 44q-10-11-10-17a10 10 0 0 1 20 0q0 6-10 17z" fill="#ff453a"/><circle cx="30" cy="27" r="3.4" fill="#fff"/>'],
    music: ['#fa3e55', '<path d="M24 41V20l16-3v20" stroke="#fff" stroke-width="3.4" fill="none"/><circle cx="21" cy="41" r="4.6" fill="#fff"/><circle cx="37" cy="37" r="4.6" fill="#fff"/>'],
    cam: ['#8e8e93', '<rect x="12" y="20" width="36" height="24" rx="5" fill="#2c2c2e"/><circle cx="30" cy="32" r="8" fill="#636366" stroke="#fff" stroke-width="2"/>'],
    call: ['#30c759', '<path d="M22 16l6 7l-3 4q3 6 8 8l4-3l7 6l-3 5q-14 0-22-14z" fill="#fff"/>'],
    chat: ['#30c759', '<path d="M30 16c-10 0-17 6-17 13c0 4 2 7 5 9l-2 6l7-4c2 1 5 1 7 1c10 0 17-5 17-12s-7-13-17-13z" fill="#fff"/>'],
    web: ['#fff', '<circle cx="30" cy="30" r="19" fill="#0a84ff"/><path d="M30 14v32M14 30h32" stroke="#fff" stroke-width="1"/><path d="M37 23l-4 10l-10 4l4-10z" fill="#fff"/><path d="M33 33l-10 4l4-10z" fill="#ff453a"/>'],
    gear: ['#8e8e93', '<circle cx="30" cy="30" r="13" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="5 3.2"/><circle cx="30" cy="30" r="7" fill="#fff"/>'],
  };
  const tile = (k, label) => `<span class="ph-app"><span class="ph-ic"><svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" fill="${GLYPH[k][0]}"/>${GLYPH[k][1]}</svg></span>${label ? `<small>${label}</small>` : ''}</span>`;
  // wallpaper: the night over the street's roofs, a few windows still lit (drawn once; no filters)
  function skyline() {
    let s = '<svg class="ph-sky" viewBox="0 0 390 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><g fill="#120d26">';
    const H = [120, 160, 96, 180, 130, 210, 150, 104, 170, 136, 190, 118];
    H.forEach((h, k) => { s += `<rect x="${k * 33 - 4}" y="${300 - h}" width="35" height="${h}"/>`; });
    s += '</g><g fill="#ffd27a">';
    H.forEach((h, k) => { for (let r = 0; r < 4; r++) if ((k * 7 + r * 3) % 5 === 1) s += `<rect x="${k * 33 + 6 + (r % 2) * 12}" y="${300 - h + 16 + r * 22}" width="6" height="8" opacity=".75"/>`; });
    return s + '</g></svg>';
  }
  // the cat widget: whoever is on the street now, in the pose it really has, and how long the shelves last
  const BOXES = { sit: '-25 -54 50 56', groom: '-25 -54 50 56', yawn: '-25 -54 50 56' };
  function wSmall() {
    const c = catAt(t), out = S.machines.every(m => at(m, t).shelf <= 0);
    const status = out ? T`全部卖空了` : T`还能卖 ${dur(lastOut() - t)}`;
    if (!c) return `<p class="ws-where">${T`猫们出去溜达了`}</p><svg class="ws-paws" viewBox="0 0 24 24" aria-hidden="true"><use href="#neko-paw"/></svg><b class="ws-st">${status}</b>`;
    const id = ECON.lots()[c.s.lot], brand = id ? MACHINES.find(m => m.id === id).brand : '';
    const where = { top: T`在 ${brand} 顶上`, front: T`躺在 ${brand} 前面`, kerb: T`坐在 ${brand} 旁边`, tray: T`钻进 ${brand} 的取货口`, box: T`在纸箱里`, lot: T`在空地上打滚` }[c.s.kind];
    const pn = { box: 'loaf', snack: 'loaf', sprawl: 'belly' }[c.s.pose] || c.s.pose || 'sit', p = NEKOART.pose(c.id, pn, hooks.gearOf(c.id));
    return `<p class="ws-where"><b>${I18N.name(NEKO.byId[c.id].name)}</b>${where}</p>`
      + `<button type="button" class="ws-cat" data-pet aria-label="${T`摸摸它`}"><svg viewBox="${BOXES[pn] || '-42 -36 70 40'}" aria-hidden="true">${p.s}</svg><i class="ws-hearts" aria-hidden="true">♥<i>♥</i></i></button>`
      + `<b class="ws-st">${status}</b>`;
  }
  // the street widget: the machines as they stand, each with its shelf; the one time that matters at the foot
  function wMed() {
    const mine = stMachines(), now = mine.map(m => ({ m, a: at(m, t) })), soldN = now.filter(x => x.a.shelf <= 0).length;
    const foot = soldN === now.length ? T`全部卖空了 · 点开补货` : soldN ? T`${soldN} 台卖空了 · 其余 ${when(lastOut(mine))} 卖空` : T`${when(lastOut(mine))} 全部卖空`;
    return `<div class="wm-head"><b class="wm-tag">${stName()}</b><span class="wm-bank">${UTIL.money(S.bank + earned(t))}</span></div>`
      + `<div class="wm-row">${now.map(({ m, a }) => { const f = Math.max(0, Math.min(1, a.shelf / m.cap));
        return `<button type="button" class="wm-m${a.shelf <= 0 ? ' out' : ''}" data-i="${m.i}" aria-label="${m.brand}"><svg viewBox="-8 440 116 228" aria-hidden="true">${STREET.art(m.id)}</svg>`
          + `<i class="wm-bar"><i style="width:${(f * 100).toFixed(0)}%;background:${f > .5 ? '#7fe36b' : f > .2 ? '#ffd23f' : '#ff5a6a'}"></i></i>${a.shelf <= 0 ? '<b class="wm-sold">売切</b>' : ''}</button>`; }).join('')}</div>`
      + `<p class="wm-foot">${foot}</p>`;
  }
  // lock-screen widgets: one colour only (the system tints them), the same plan
  function lockW() {
    const tot = S.machines.reduce((a, m) => a + m.cap, 0), have = S.machines.reduce((a, m) => a + Math.max(0, Math.min(m.cap, at(m, t).shelf)), 0);
    const f = tot ? have / tot : 0, out = have <= 0, L = lastOut(), r = 25, C = 2 * Math.PI * r;
    const nm = stName(), mine = stMachines(), Lm = lastOut(mine), outM = mine.every(m => at(m, t).shelf <= 0);
    $('ph-inline').textContent = outM ? T`${nm} · 卖空了` : T`${nm} · ${when(Lm)} 卖空`;
    $('ph-circ').innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="${r}" class="g0"/><circle cx="32" cy="32" r="${r}" class="g1" stroke-dasharray="${(C * f).toFixed(1)} 999" transform="rotate(-90 32 32)"/></svg><b>${Math.round(f * 100)}<small>%</small></b>`;
    $('ph-rect').innerHTML = `<b>${nm}</b><span>${outM ? T`全部卖空了` : T`${when(Lm)} 全部卖空`}</span><i class="ph-bars">${mine.map(m => `<i><i style="height:${(Math.max(0, Math.min(1, at(m, t).shelf / m.cap)) * 100).toFixed(0)}%"></i></i>`).join('')}</i>`;
  }
  function noteCard(e) {
    const n = note(e);
    return `<button type="button" class="ph-ln" data-go="${n.go === undefined ? -1 : n.go}"><span class="ph-lic">${ICON}</span>`
      + `<span class="ph-lt"><span class="ph-lh"><i>なんでも通り</i><time>${ago(e.at)}</time></span><b>${n.title}</b><span>${n.body}</span></span>`
      + `${n.thumb ? `<span class="ph-lth">${NEKOART.portrait(n.thumb, hooks.gearOf(n.thumb))}</span>` : ''}</button>`;
  }
  function render() {
    $('ph-sbt').textContent = $('ph-clock').textContent = hm(t);
    $('ph-date').textContent = new Date(t).toLocaleDateString(I18N.hant ? 'zh-TW' : { zh: 'zh-CN', en: 'en-US', ja: 'ja-JP' }[I18N.lang], { month: 'long', day: 'numeric', weekday: 'long' });
    $('ph-lock').hidden = scr !== 'lock'; $('ph-home').hidden = scr !== 'home';
    document.querySelectorAll('#phone [data-scr]').forEach(b => b.classList.toggle('on', b.dataset.scr === scr));
    $('ph-away').textContent = t > S.t0 ? T`离开了 ${dur(t - S.t0)}` : T`刚离开游戏`;
    if (scr === 'lock') {
      lockW();
      $('ph-notes').innerHTML = SETTINGS.prefs.perm !== true ? `<p class="ph-nonote">${T`通知还没打开：这里不会有消息，小组件照样更新`}</p>`
        : ev.filter(e => e.at <= t).reverse().map(noteCard).join('');
    } else { $('ph-wm').innerHTML = wMed(); $('ph-ws').innerHTML = wSmall(); }
  }
  // time moves on: what arrived meanwhile drops in as a banner on the home screen
  function advance(k) {
    const was = t;
    if (k === 'am') { const d = new Date(t); let n = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8).getTime(); if (n <= t) n += 864e5; t = n; } else t += +k * HOUR;
    render();
    const fresh = ev.filter(e => e.at > was && e.at <= t);
    if (fresh.length) { SND.pop();
      if (scr === 'home') { const b = $('ph-banner'); b.innerHTML = noteCard(fresh[fresh.length - 1]); UTIL.restart(b, 'go'); }
      else { const first = $('ph-notes').firstElementChild; if (first) UTIL.restart(first, 'new'); } }
  }
  function back(i) {
    const h = (t - S.t0) / HOUR;
    $('phone').hidden = true; document.querySelector('.device').classList.remove('ph-on');
    if (wasRain && !UTIL.low) ENV.setRain(true);
    hooks.back(h, i);
  }
  function open() {
    S = hooks.snap(); t = S.t0; scr = 'lock'; ev = plan();
    wasRain = ENV.raining; if (wasRain) ENV.setRain(false);
    document.querySelector('.device').classList.add('ph-on'); $('phone').hidden = false; render();
  }
  function init(h) {
    hooks = Object.assign(hooks, h);
    const bars = '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>';
    const batt = '<svg viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2.2" y="2.2" width="16" height="8.6" rx="2"/><path d="M25 4.5v4q1.6-.6 1.6-2t-1.6-2z" opacity=".45"/></svg>';
    $('phone').innerHTML = skyline()
      + `<div class="ph-status"><b id="ph-sbt">9:41</b><span>${bars}${batt}</span></div>`
      + `<div id="ph-lock" class="ph-lock"><p id="ph-inline" class="ph-inline"></p><p id="ph-date" class="ph-date"></p><p id="ph-clock" class="ph-clock"></p>`
      + `<div class="ph-lw"><div id="ph-circ" class="ph-circ"></div><div id="ph-rect" class="ph-rect"></div></div>`
      + `<div id="ph-notes" class="ph-notes"></div>`
      + `<div class="ph-lbot"><i class="ph-round"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 2h6v4l-2 3v9H9V9L7 6z" fill="currentColor"/></svg></i><button type="button" class="ph-unlock">${T`上滑打开`}</button><i class="ph-round"><svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2" y="5" width="16" height="11" rx="2.5" fill="currentColor"/><circle cx="10" cy="10.5" r="3.2" fill="#2a2440"/><rect x="7" y="3" width="6" height="3" rx="1" fill="currentColor"/></svg></i></div></div>`
      + `<div id="ph-home" class="ph-home" hidden><div id="ph-wm" class="wg wg-m"></div>`
      + `<div class="ph-row"><div id="ph-ws" class="wg wg-s"></div><div class="ph-grid">${tile('clock', T`时钟`)}${tile('sun', T`天气`)}${tile('photo', T`照片`)}${tile('memo', T`备忘录`)}</div></div>`
      + `<div class="ph-grid4">${tile('map', T`地图`)}${tile('music', T`音乐`)}${tile('cam', T`相机`)}<button type="button" id="ph-app" class="ph-app"><span class="ph-ic">${ICON}</span><small>なんでも通り</small></button></div>`
      + `<div class="ph-dock">${tile('call')}${tile('chat')}${tile('web')}${tile('gear')}</div></div>`
      + `<div id="ph-banner" class="ph-banner"></div>`
      + `<div class="ph-demo"><div class="ph-dr"><b class="ph-dl">${T`演示`}</b><button type="button" class="ph-db" data-scr="lock">${T`锁屏`}</button><button type="button" class="ph-db" data-scr="home">${T`主屏幕`}</button><button type="button" class="ph-db ph-go" data-act="back">${T`打开游戏`}</button></div>`
      + `<div class="ph-dr"><span id="ph-away" class="ph-away"></span><button type="button" class="ph-db" data-adv="1">+1 h</button><button type="button" class="ph-db" data-adv="4">+4 h</button><button type="button" class="ph-db" data-adv="am">${T`到早上 8 点`}</button></div></div>`;
    $('phone').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.scr) { scr = b.dataset.scr; $('ph-banner').classList.remove('go'); render(); return; }
      if (b.dataset.adv) { advance(b.dataset.adv); return; }
      if (b.hasAttribute('data-pet')) { UTIL.restart(b, 'pet'); return; }   // a widget button can only change the widget (iOS 17+)
      if (b.dataset.act === 'back' || b.id === 'ph-app') { back(-1); return; }
      if (b.dataset.go !== undefined) { back(+b.dataset.go); return; }
      if (b.dataset.i !== undefined) { back(+b.dataset.i); return; }
      if (b.classList.contains('ph-unlock')) { scr = 'home'; render(); }
    });
    // the small widget outside its cat opens the game
    $('ph-home').addEventListener('click', e => { if (!e.target.closest('button') && e.target.closest('.wg')) back(-1); });
    let y0 = null;
    $('ph-lock').addEventListener('pointerdown', e => { y0 = e.clientY; });
    $('ph-lock').addEventListener('pointerup', e => { if (y0 !== null && e.clientY - y0 < -60) { scr = 'home'; render(); } y0 = null; });
  }
  return { init, open, icon: ICON, get isOpen() { return !$('phone').hidden; } };
})();
