/* The background music's settings (2026-10-21). The music itself is played natively (ios MusicPlayer.swift, an
   AVAudioPlayer streaming from the bundle: decoded here by WebAudio a whole track would sit in this page's memory).
   Four rows join 音效 under 声音和震动: the music on or off, the track (‹ name ›), its volume, and one track on repeat
   (off: the list plays on). The music has only its own switch: 音效 (and the top bar's sound button, the same switch)
   is the game's sounds and the rain, 背景音乐 is the music (owner, 2026-10-21: two separate switches). It pauses with
   the app in the background (native). The prefs are kept with the game's own settings (nandemo-settings: bgm, bgmTrack, bgmVol, bgmOne). */
(() => {
  if (!window.NATIVE || !NATIVE.on || typeof SETTINGS === 'undefined' || typeof SND === 'undefined') return;   // (top-level consts)
  const tracks = window.__ndMusicTracks || [];
  if (!tracks.length) return;
  const P = SETTINGS.prefs;
  // the switches split (2026-10-21): a player whose 音效 was off heard no music either, and must not hear it start
  // after the update. The first time, 背景音乐 takes over 音效's state if that was off; after that they are separate
  // (bgmOwn marks it done). The game's save may not be read yet here, so its snd is read straight from the store
  if (!P.bgmOwn) {
    let off = !SND.enabled; try { const g = JSON.parse(STORE.get('nandemo-v6') || 'null'); if (g && g.snd === false) off = true; } catch (e) { /* no save */ }
    if (off) P.bgm = false; P.bgmOwn = 'new';
  }
  if (typeof P.bgm !== 'boolean') P.bgm = true;
  if (!(P.bgmVol >= 0 && P.bgmVol <= 1)) P.bgmVol = .35;   // (under the rain at its own level: the rain stays heard)
  if (!(P.bgmTrack >= 0 && P.bgmTrack < tracks.length)) P.bgmTrack = 0;
  if (typeof P.bgmOne !== 'boolean') P.bgmOne = false;
  const save = () => { try { STORE.set('nandemo-settings', JSON.stringify(P)); } catch (e) { /* not saved */ } };
  if (P.bgmOwn === 'new') { P.bgmOwn = true; save(); }
  const send = () => NATIVE.post('music', { on: !!P.bgm, track: P.bgmTrack, volume: P.bgmVol, repeatOne: !!P.bgmOne });

  const TXT = {
    zh: { bgm: '背景音乐', track: '曲目', vol: '音乐音量', one: '单曲循环', oneSub: '关掉时一首放完接下一首', prev: '上一首', next: '下一首' },
    'zh-Hant': { bgm: '背景音樂', track: '曲目', vol: '音樂音量', one: '單曲循環', oneSub: '關掉時一首放完接下一首', prev: '上一首', next: '下一首' },
    en: { bgm: 'Music', track: 'Track', vol: 'Music volume', one: 'Repeat one track', oneSub: 'Off: the next track plays when one ends', prev: 'Previous track', next: 'Next track' },
    ja: { bgm: 'BGM', track: '曲', vol: 'BGM の音量', one: '1 曲リピート', oneSub: 'オフ：1 曲終わると次の曲へ', prev: '前の曲', next: '次の曲' },
  }[I18N.code] || {};
  const body = document.getElementById('set-body'), panel = document.getElementById('settings');
  if (!body || !panel) return;
  const sw = (k, on) => `<button type="button" class="sh-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" data-k="${k}"><i></i></button>`;
  // ‹ › drawn, not typed: a glyph sits on its font's baseline and side bearings, never in the middle of the circle
  // (the owner, 2026-10-21: off centre again). The chevron is symmetric about the 12×12 box's centre, its point and its
  // two ends' box centred on 6, 6 (3.15–8.85 with the round caps)
  const chev = d => `<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="${d < 0 ? 'M7.75 2.5 4.25 6l3.5 3.5' : 'M4.25 2.5 7.75 6l-3.5 3.5'}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // after 音效; the game draws the sheet again on every switch, so the rows go in again each time
  const add = () => {
    const snd = body.querySelector('[data-k="snd"]'), row = snd && snd.closest('.set-row');
    if (!row || body.querySelector('[data-k="bgm"]')) return;
    const off = !P.bgm ? ' nd-bgm-row dis' : ' nd-bgm-row';
    row.insertAdjacentHTML('afterend', `<div class="set-row"><span>${TXT.bgm}</span>${sw('bgm', P.bgm)}</div>`
      + `<div class="set-row${off}"><span>${TXT.track}</span><div class="nd-bgm-pick"><button type="button" data-bgm="-1" aria-label="${TXT.prev}">${chev(-1)}</button>`
      + `<em>${esc(tracks[P.bgmTrack])}</em><button type="button" data-bgm="1" aria-label="${TXT.next}">${chev(1)}</button></div></div>`
      + `<div class="set-row${off}"><span>${TXT.vol}</span><input type="range" class="nd-bgm-vol" min="0" max="100" step="5" value="${Math.round(P.bgmVol * 100)}" aria-label="${TXT.vol}"></div>`
      + `<div class="set-row${off}"><span>${TXT.one}<small>${TXT.oneSub}</small></span>${sw('bgmOne', P.bgmOne)}</div>`);
  };
  new MutationObserver(add).observe(body, { childList: true });
  add();
  // the switches are the game's own (it flips P[k], saves and draws the sheet again); then the player hears of it
  panel.addEventListener('click', e => {
    const k = e.target.closest('button[data-k]');
    if (k && /^(bgm|bgmOne)$/.test(k.dataset.k)) { send(); return; }
    const b = e.target.closest('button[data-bgm]'); if (!b) return;
    P.bgmTrack = (P.bgmTrack + +b.dataset.bgm + tracks.length) % tracks.length; save(); send();
    const em = b.parentNode.querySelector('em'); if (em) em.textContent = tracks[P.bgmTrack];
  });
  panel.addEventListener('input', e => {
    if (!e.target.classList || !e.target.classList.contains('nd-bgm-vol')) return;
    P.bgmVol = +e.target.value / 100; send();
  });
  panel.addEventListener('change', e => { if (e.target.classList && e.target.classList.contains('nd-bgm-vol')) save(); });
  // the list moved on by itself (native): the sheet shows the track playing
  window.__ndMusic = { now(i) { P.bgmTrack = i; save(); const em = body.querySelector('.nd-bgm-pick em'); if (em) em.textContent = tracks[i]; draw(); } };

  /* ---------- the little player (owner's pick, 2026-10-22: mockup C, the cat-ear square). A square button at the
     street's bottom right; a tap opens the player above it: the track on a dark screen with a cat (awake while the music
     plays, asleep when it is paused), ‹ play/pause ›, the volume as five dots and the 单曲 switch. The same prefs as the
     settings rows (bgm, bgmTrack, bgmVol, bgmOne). Icons drawn, not typed (glyphs sit off centre). */
  const MP = {
    zh: { open: '音乐播放器', vol: '音量', one: '单曲', play: '播放', pause: '暂停', paused: '已暂停' },
    'zh-Hant': { open: '音樂播放器', vol: '音量', one: '單曲', play: '播放', pause: '暫停', paused: '已暫停' },
    en: { open: 'Music player', vol: 'Volume', one: 'Repeat', play: 'Play', pause: 'Pause', paused: 'Paused' },
    ja: { open: 'ミュージックプレーヤー', vol: '音量', one: '1曲', play: '再生', pause: '一時停止', paused: '一時停止中' },
  }[I18N.code] || {};
  // in the street's own layer (#street, z 2 in .device), first, so the street's cards and sheets (the receipt, a cat
  // coming by, z 5 there, with their dimming) cover it as they cover the street; the sheets over the whole game (shop 6,
  // settings 9, phone 20, store 40) are above the street's layer anyway. The button z 3, the player z 4: over the
  // street's 还有 N 台 (z 3) it opens across, under the street's notes and hints (z 4, later in the page)
  const device = document.querySelector('.device'), street = document.getElementById('street');
  const ico = {
    // (the note's ink runs 2.3-19.9 down and 3.5-20.2 across: moved by its own offset so its ink box sits in the middle;
    // measured in the simulator, tools/check_centering.sh street)
    note: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><g transform="translate(.15 .9)"><path d="M9 17.5V5.5l10-2v12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="currentColor"/><ellipse cx="16.5" cy="15.5" rx="3" ry="2.4" fill="currentColor"/></g></svg>',
    prev: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="3" y="4" width="2.6" height="12" rx="1.1" fill="currentColor"/><path d="M16.5 4.6v10.8a.8.8 0 0 1-1.2.7L7 10.7a.8.8 0 0 1 0-1.4l8.3-5.4a.8.8 0 0 1 1.2.7z" fill="currentColor"/></svg>',
    next: '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><rect x="14.4" y="4" width="2.6" height="12" rx="1.1" fill="currentColor"/><path d="M3.5 4.6v10.8a.8.8 0 0 0 1.2.7l8.3-5.4a.8.8 0 0 0 0-1.4L4.7 3.9a.8.8 0 0 0-1.2.7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><rect x="5" y="4" width="4.2" height="14" rx="1.4" fill="currentColor"/><rect x="12.8" y="4" width="4.2" height="14" rx="1.4" fill="currentColor"/></svg>',
    play: '<svg viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><path d="M7 4.3v13.4a1 1 0 0 0 1.5.9l10.4-6.7a1 1 0 0 0 0-1.8L8.5 3.4A1 1 0 0 0 7 4.3z" fill="currentColor"/></svg>',
    // a cat of our own: round head, two ears, eyes open (playing) or shut (paused)
    cat: on => `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><path d="M8 15 7 5l9 6M32 15l1-10-9 6" fill="#fff" stroke="#141018" stroke-width="2" stroke-linejoin="round"/><ellipse cx="20" cy="22" rx="14" ry="12" fill="#fff" stroke="#141018" stroke-width="2"/>${on
      ? '<ellipse cx="14.5" cy="21" rx="1.9" ry="2.4" fill="#141018"/><ellipse cx="25.5" cy="21" rx="1.9" ry="2.4" fill="#141018"/>'
      : '<path d="M12.3 21.5q2.2 1.8 4.4 0M23.3 21.5q2.2 1.8 4.4 0" fill="none" stroke="#141018" stroke-width="1.8" stroke-linecap="round"/>'}<path d="M18 25.5q2 1.6 4 0" fill="none" stroke="#141018" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="11" cy="25.5" rx="2.4" ry="1.4" fill="#ffb3cf"/><ellipse cx="29" cy="25.5" rx="2.4" ry="1.4" fill="#ffb3cf"/></svg>`,
  };
  const DOTS = 5, dotOf = v => v <= 0 ? 0 : Math.max(1, Math.min(DOTS, Math.round(v * DOTS / .8))), volOf = k => Math.min(1, k * .8 / DOTS);   // (5 dots = .8; the default .35 ≈ 2)
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nd-mp-btn'; btn.setAttribute('aria-label', MP.open);
  btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = ico.note;
  const pop = document.createElement('div'); pop.className = 'nd-mp'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', MP.open);
  if (street) street.prepend(btn, pop);
  function draw() {
    if (pop.hidden) return;
    const on = !!P.bgm, k = dotOf(P.bgmVol);
    pop.innerHTML = '<i class="nd-mp-ear l"></i><i class="nd-mp-ear r"></i>'
      + `<div class="nd-mp-scr"><span class="nd-mp-cat">${ico.cat(on)}</span><span class="nd-mp-t"><b>${esc(tracks[P.bgmTrack])}</b>`
      + `<small>${on ? '♪ ' : ''}${P.bgmTrack + 1}/${tracks.length}${on ? '' : ' · ' + MP.paused}</small></span></div>`
      + `<div class="nd-mp-keys"><button type="button" data-mp="-1" aria-label="${TXT.prev}">${ico.prev}</button>`
      + `<button type="button" class="pp" data-mp="pp" aria-label="${on ? MP.pause : MP.play}">${on ? ico.pause : ico.play}</button>`
      + `<button type="button" data-mp="1" aria-label="${TXT.next}">${ico.next}</button></div>`
      + `<div class="nd-mp-foot"><span>${MP.vol}</span><span class="nd-mp-dots">${Array.from({ length: DOTS }, (_, i) => `<button type="button" data-dot="${i + 1}" class="${i < k ? 'f' : ''}" aria-label="${MP.vol} ${i + 1}/${DOTS}"></button>`).join('')}</span>`
      + `<button type="button" class="nd-mp-one${P.bgmOne ? ' on' : ''}" role="switch" aria-checked="${!!P.bgmOne}" data-mp="one">${MP.one}<i></i></button></div>`;
  }
  const show = open => { pop.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.classList.toggle('open', open); draw(); };
  btn.addEventListener('click', e => { e.stopPropagation(); show(pop.hidden); });
  pop.addEventListener('click', e => {
    e.stopPropagation();
    const d = e.target.closest('[data-dot]'), b = e.target.closest('[data-mp]');
    if (d) { const k = +d.dataset.dot; P.bgmVol = volOf(k === dotOf(P.bgmVol) ? k - 1 : k); }   // (the last lit dot again: one less, down to none)
    else if (b && b.dataset.mp === 'pp') P.bgm = !P.bgm;
    else if (b && b.dataset.mp === 'one') P.bgmOne = !P.bgmOne;
    else if (b) P.bgmTrack = (P.bgmTrack + +b.dataset.mp + tracks.length) % tracks.length;
    else return;
    save(); send(); draw();
  });
  // a tap anywhere else closes it (and still does what it does there); so does leaving the street
  document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) show(false); }, true);
  if (device) new MutationObserver(() => { if (!device.classList.contains('is-street')) show(false); }).observe(device, { attributes: true, attributeFilter: ['class'] });

  const css = document.createElement('style');
  css.textContent = `.nd-bgm-row.dis{pointer-events:none}
.nd-bgm-pick{display:flex;align-items:center;gap:8px;flex:none;max-width:64%}
.nd-bgm-pick em{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dink)!important;font-weight:700!important}
/* (the street switch's look, 「なんでも通り ⇄」: cream, a dark 2 px border and its offset shadow, the icon in its pink) */
.nd-bgm-pick button{flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:999px;border:2px solid var(--zink,#141018);background:#fff8ec;color:#e23d78;box-shadow:2px 2px 0 var(--zink,#141018);cursor:pointer;padding:0;box-sizing:border-box}
.nd-bgm-pick button{position:relative}
.nd-bgm-pick button svg{display:block;position:absolute;left:50%;top:50%;margin:-6px 0 0 -6px}
.nd-bgm-vol{flex:none;width:52%;accent-color:#ff4f8b}`;
  css.textContent += `
.nd-mp-btn{position:absolute;z-index:3;right:16px;bottom:calc(var(--nd-safe-bottom) + 14px);width:48px;height:48px;padding:0;border-radius:14px;border:2.5px solid var(--dink);background:#ffd23f;color:var(--dink);box-shadow:3px 3px 0 #ff4f8b;display:flex;align-items:center;justify-content:center;cursor:pointer}
.nd-mp-btn.open{transform:translate(2px,2px);box-shadow:1px 1px 0 #ff4f8b}
.device:not(.is-street) .nd-mp-btn,.device:not(.is-street) .nd-mp{display:none}
.nd-mp{position:absolute;z-index:4;right:16px;bottom:calc(var(--nd-safe-bottom) + 76px);width:232px;box-sizing:border-box;padding:14px 12px 12px;background:var(--dcream);border:3px solid var(--dink);border-radius:22px;box-shadow:4px 4px 0 #ff4f8b;font-family:var(--maru);color:var(--dink)}
.nd-mp[hidden]{display:none}
.nd-mp-ear{position:absolute;top:-19px;width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-bottom:20px solid var(--dink)}
.nd-mp-ear.l{left:22px}.nd-mp-ear.r{right:22px}
.nd-mp-ear::after{content:"";position:absolute;left:-9px;top:7px;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:12px solid #ffb3cf}
.nd-mp-scr{display:flex;align-items:center;gap:9px;padding:7px 10px;background:#2b2238;border:2.5px solid var(--dink);border-radius:12px;color:#c9f5ff}
.nd-mp-cat{flex:none;width:38px;height:38px;border-radius:50%;background:#3d3352;display:flex;align-items:center;justify-content:center}
.nd-mp-t{min-width:0;display:flex;flex-direction:column;gap:3px}
.nd-mp-t b{font:700 12px/1.3 var(--maru);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nd-mp-t small{font:700 10px/1.2 var(--maru);color:#ffd23f;white-space:nowrap}
.nd-mp-keys{display:flex;justify-content:space-between;margin-top:12px}
.nd-mp-keys button{width:52px;height:52px;padding:0;border-radius:50%;border:2.5px solid var(--dink);background:#ffb3cf;color:var(--dink);box-shadow:0 3px 0 var(--dink);display:flex;align-items:center;justify-content:center;cursor:pointer}
.nd-mp-keys button.pp{background:#ff4f8b;color:#fff}
.nd-mp-keys button:active{transform:translateY(2px);box-shadow:0 1px 0 var(--dink)}
.nd-mp-foot{display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:12px;font:700 11px/1 var(--maru)}
.nd-mp-dots{display:flex;gap:2px}
.nd-mp-dots button{width:16px;height:22px;padding:0;border:0;background:none;cursor:pointer;position:relative}
.nd-mp-dots button::after{content:"";position:absolute;left:2.5px;top:5px;width:9px;height:9px;border-radius:50%;border:2px solid var(--dink);background:#fff}
.nd-mp-dots button.f::after{background:#ff4f8b}
.nd-mp-one{display:flex;align-items:center;gap:4px;padding:0;border:0;background:none;font:700 11px/1 var(--maru);color:var(--dink);cursor:pointer;white-space:nowrap}
.nd-mp-one i{width:30px;height:17px;box-sizing:border-box;border-radius:9px;border:2px solid var(--dink);background:#d9d2c4;position:relative}
.nd-mp-one i::after{content:"";position:absolute;left:1px;top:1px;width:11px;height:11px;box-sizing:border-box;border-radius:50%;background:#fff;border:1.5px solid var(--dink)}
.nd-mp-one.on i{background:#7fd4e6}.nd-mp-one.on i::after{left:auto;right:1px}`;
  document.head.appendChild(css);
  send();
})();
