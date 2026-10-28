/* 涂装 (the owner, 2026-10-21): the prototype's second look (data-art="iso": hairlines and glow) as a reward, purely
   visual, "like a gold camo in an FPS game". Per machine: once every one of its 改造 is fitted, its page shows a chip at
   the top right (the 「去别的街」 chip's look) that switches that machine between 漫画 (the main look, "zzz") and 霓虹
   ("iso"). Before that the chip is a dimmed hint with how many parts are fully fitted. The look is the machine's own
   (class nd-neon on its groups); the page, the street, the album and the widget keep the main one.
   The choice is saved per machine in the game's save (snapshot's `skin`, so it syncs with it through iCloud); the
   turning pictures (platform/turn.js, renderer.js) follow data-art by themselves. Names: the owner, not ZZZ or iso. */
(() => {
  if (!window.GAME || !window.__ND || typeof UPG === 'undefined' || typeof MACHINES === 'undefined') return;
  const device = document.querySelector('.device'), back = document.getElementById('tostreet');
  if (!device || !back) return;
  const TXT = {
    zh: { name: { zzz: '漫画', iso: '霓虹' }, chip: n => `涂装 · ${n}`, hint: (d, n) => `改造装满解锁涂装 · ${d}/${n}`,
      say: n => `换涂装，现在是${n}`, lockSay: (d, n) => `改造全部装满后可以换涂装，已装满 ${d}/${n}`,
      stage: ['右上角切换画风。', '改造全部装满后，右上角可以换涂装。'] },
    'zh-Hant': { name: { zzz: '漫畫', iso: '霓虹' }, chip: n => `塗裝 · ${n}`, hint: (d, n) => `改造裝滿解鎖塗裝 · ${d}/${n}`,
      say: n => `換塗裝，現在是${n}`, lockSay: (d, n) => `改造全部裝滿後可以換塗裝，已裝滿 ${d}/${n}`,
      stage: ['右上角切換畫風。', '改造全部裝滿後，右上角可以換塗裝。'] },
    en: { name: { zzz: 'Comic', iso: 'Neon' }, chip: n => `Paint · ${n}`, hint: (d, n) => `Max upgrades for Neon · ${d}/${n}`,
      say: n => `Change the paint, now ${n}`, lockSay: (d, n) => `Fit every upgrade to change the paint: ${d} of ${n} done`,
      stage: ['switch the art style at the top right.', 'once every upgrade is fitted, change the paint at the top right.'] },
    ja: { name: { zzz: 'コミック', iso: 'ネオン' }, chip: n => `塗装 · ${n}`, hint: (d, n) => `改造コンプで塗装解放 · ${d}/${n}`,
      say: n => `塗装を変える、今は${n}`, lockSay: (d, n) => `改造をすべて付けると塗装を変えられる：${d}/${n}`,
      stage: ['右上で画風を切り替え。', '改造をすべて付けると、右上で塗装を変えられる。'] },
  }[I18N.code] || null;
  if (!TXT) return;

  // the machine page's description for VoiceOver said "switch the art style at the top right" (the prototype's chip);
  // it also stayed in Chinese, as the page's translation skips the drawing (.stage-l): translated here as well
  const stage = document.getElementById('stage'), lab = stage && I18N.T(stage.getAttribute('aria-label') || '');
  if (lab && lab.includes(TXT.stage[0])) stage.setAttribute('aria-label', lab.replace(TXT.stage[0], TXT.stage[1]));

  // machine id -> 'iso' for the machines switched to 霓虹 (left out: the main look)
  let pick = {};
  try { const s = JSON.parse(STORE.get('nandemo-v6') || 'null'); if (s && s.skin && typeof s.skin === 'object') pick = { ...s.skin }; } catch (e) { /* none yet */ }
  const done = m => UPG.parts(m).filter(p => UPG.maxed(m, p.id)).length;
  // not the machine in 试运转 / 试装 (.device.trial): those fit parts for a while, which must not unlock anything (only
  // that one: the others keep their look on the street around it)
  let trialM = null;
  const unlocked = m => UPG.allIn(m) && !(trialM && m.id === trialM);
  const look = m => m && unlocked(m) && pick[m.id] === 'iso' ? 'iso' : 'zzz';

  // drawn icons (never glyphs): the lock, and the ⇄ mask the street chip uses (platform.css)
  const lock = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><rect x="2.5" y="5.2" width="7" height="5.3" rx="1.2" fill="currentColor"/>'
    + '<path d="M4.1 5.4V4a1.9 1.9 0 0 1 3.8 0v1.4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
  const chip = document.createElement('button');
  chip.type = 'button'; chip.id = 'nd-skin'; chip.className = 'chip';
  back.insertAdjacentElement('afterend', chip);

  // each machine's own look, on its groups (.mroot, all four layers): the page stays 漫画 and build_www.py scopes the 漫画
  // rules out of a .nd-neon group, so a machine keeps its look while it flies back to the street or slides past another
  // one (it used to be the page's look: it jumped as the view or the machine changed)
  const groups = {}, neon = {};
  const mark = m => { const on = look(m) === 'iso'; if (!!neon[m.id] === on) return; neon[m.id] = on;
    (groups[m.id] || (groups[m.id] = [...document.querySelectorAll(`.mroot[data-m="${m.id}"]`)])).forEach(g => g.classList.toggle('nd-neon', on)); };
  let drawn = '';
  // what the close-up draws outside the machine's groups (the X-ray's name tags, the scan, sparks and coins) takes the
  // look of the machine up close
  const around = ['tags', 'scan', 'fx'].map(id => document.getElementById(id)).filter(Boolean);
  function sync(m) {   // m: the machine up close (its chip), or null on the street
    if (!device.classList.contains('trial')) trialM = null; else if (m) trialM = m.id;
    MACHINES.forEach(mark);
    if (!m) return;
    const a = look(m);
    around.forEach(e => e.classList.toggle('nd-neon', a === 'iso'));
    const open = unlocked(m), d = done(m), n = UPG.parts(m).length, key = [m.id, open, a, d, n].join();
    if (key === drawn) return; drawn = key;
    chip.hidden = !n; chip.classList.toggle('locked', !open);
    if (open) { chip.innerHTML = `<span>${TXT.chip(TXT.name[a])}</span><b aria-hidden="true"></b>`; chip.setAttribute('aria-label', TXT.say(TXT.name[a])); chip.removeAttribute('aria-disabled'); }
    else { chip.innerHTML = `<span class="lk">${lock}</span><span>${TXT.hint(d, n)}</span>`; chip.setAttribute('aria-label', TXT.lockSay(d, n)); chip.setAttribute('aria-disabled', 'true'); }
  }
  chip.addEventListener('click', () => {
    const m = MACHINES[__ND.cur]; if (__ND.view !== 'machine' || !m || !unlocked(m)) return;
    if (look(m) === 'iso') delete pick[m.id]; else pick[m.id] = 'iso';
    sync(m); try { SND.switchOn(); } catch (e) { /* no sound */ } UTIL.haptic(8);
    __ND.save();
  });

  // save: the choices; shown: the machines in 霓虹 now (the turning pictures, platform/renderer.js)
  window.SKIN = { sync, save: () => ({ ...pick }), shown: () => MACHINES.filter(m => neon[m.id]).map(m => m.id), canWear: m => unlocked(m) };
  sync(__ND.view === 'machine' ? MACHINES[__ND.cur] : null);
})();
