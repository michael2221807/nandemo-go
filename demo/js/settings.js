/* なんでも自販機 · settings, and the step before the phone's notification prompt (v0.38, 2026-10-18; the user agreed to
   mock notifications, widgets and settings before the port).
   - One gear in the top bar takes the place of the sound and language chips.
   - Notifications stay off until the player says yes. The question comes the first time they come back to sold-out
     machines (the moment a notice would have helped), never at the first launch; a "yes" leads to the system's own
     prompt. Saying no to our card costs nothing: the system prompt is still unused, so it can be asked later.
   - The prefs live apart from the game save (nandemo-settings), so a fresh game keeps them. */
const SETTINGS = (() => {
  const KEY = 'nandemo-settings', $ = id => document.getElementById(id);
  // perm: null (never asked) | true | false (the system prompt said no); sold: 'all' | 'one' | 'off'
  const P = { perm: null, asked: false, sold: 'all', cat: true, mach: true, quiet: true, haptic: true, low: false };
  try { Object.assign(P, JSON.parse(STORE.get(KEY)) || {}); } catch (e) { /* none yet */ }
  const keep = () => STORE.set(KEY, JSON.stringify(P));
  let hooks = { sound() {}, lang() {}, phone() {}, say() {} };

  const sw = (k, on, dis) => `<button type="button" class="sh-switch${on ? ' on' : ''}" role="switch" aria-checked="${on}" data-k="${k}"${dis ? ' disabled' : ''}><i></i></button>`;
  const row = (label, sub, ctl, dis) => `<div class="set-row${dis ? ' dis' : ''}"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span>${ctl}</div>`;
  const langName = () => I18N.lang === 'ja' ? '日本語' : (I18N.lang === 'en' ? 'English' : I18N.hant ? '繁體中文' : '简体中文') + ' · ' + (I18N.full ? T`全部翻译` : T`名字原汁原味`);
  function render() {
    const dis = P.perm !== true;
    const SOLD = [['all', T`全部卖空时`], ['one', T`有一台空了`], ['off', T`不用`]];
    let h = `<section class="set-g"><h4>${T`通知`}</h4>`;
    if (P.perm === null) h += `<button type="button" class="set-perm" data-act="perm"><b>${T`打开通知`}</b><small>${T`卖空的时候告诉你 · 夜里不打扰`}</small></button>`;
    if (P.perm === false) h += `<p class="set-off">${T`通知被关掉了 · 要去手机的「设置」里打开`}</p>`;
    h += `<div class="set-row set-col${dis ? ' dis' : ''}"><span>${T`卖空的时候`}</span><div class="set-seg" role="radiogroup">`
      + SOLD.map(([k, n]) => `<button type="button" role="radio" aria-checked="${P.sold === k}" data-sold="${k}"${dis ? ' disabled' : ''}>${n}</button>`).join('') + `</div></div>`;
    h += row(T`猫来串门`, '', sw('cat', P.cat, dis), dis) + row(T`新机器开张`, '', sw('mach', P.mach, dis), dis)
      + row(T`夜里不打扰`, T`22:00 – 8:00 的消息，早上 8 点再发`, sw('quiet', P.quiet, dis), dis);
    h += `<button type="button" class="set-link" data-act="phone"><span class="set-demo">${T`演示`}</span><span>${T`看看手机上的样子：通知和小组件`}</span><b>›</b></button></section>`;
    h += `<section class="set-g"><h4>${T`声音和震动`}</h4>${row(T`音效`, '', sw('snd', SND.enabled))}${row(T`震动`, '', sw('haptic', P.haptic))}</section>`;
    h += `<section class="set-g"><h4>${T`画面`}</h4><button type="button" class="set-row set-btn" data-act="lang"><span>${T`语言`}</span><em>${langName()}</em><b>›</b></button>`
      + row(T`省电模式`, T`不下雨，街上的小动画少一些`, sw('low', P.low)) + `</section>`;
    h += `<section class="set-g"><h4>${T`存档和购买`}</h4><div class="set-row"><span>${T`云存档`}</span><em>${T`已同步`}</em></div>`
      + `<button type="button" class="set-row set-btn" data-act="restore"><span>${T`恢复购买`}</span><b>›</b></button></section>`;
    h += `<p class="set-foot">なんでも自販機 v0.38 · <button type="button" data-act="about">${T`致谢`}</button> · <button type="button" data-act="about">${T`隐私`}</button> · <button type="button" data-act="about">${T`联系我们`}</button></p>`;
    $('set-body').innerHTML = h;
  }
  // what the prefs change right away (the notification ones are read by the phone demo and, later, the real scheduler)
  function apply() {
    UTIL.noHaptic = !P.haptic; UTIL.low = P.low;
    if (P.low && ENV.raining) ENV.setRain(false);
  }
  // the phone's own prompt (a mock: a real app calls the system here, and can do so only once)
  function system(then) {
    const d = $('sys-alert'); d.hidden = false;
    d.onclick = e => { const b = e.target.closest('button'); if (!b) return;
      d.hidden = true; P.perm = b.dataset.a === 'yes'; P.asked = true; keep(); if (!$('settings').hidden) render();
      hooks.say(P.perm ? T`通知打开了 · 全部卖空时告诉你` : T`没关系，以后可以在设置里打开`); if (then) then(P.perm); };
  }
  // our own card first: one question, in the cat's words, with an easy way out
  function ask() {
    P.asked = true; keep();
    $('ask-face').innerHTML = NEKOART.portrait('mike', hooks.gearOf ? hooks.gearOf('mike') : {});
    const d = $('ask-notif'); d.hidden = false;
    d.onclick = e => { const b = e.target.closest('button'); if (!b) return; d.hidden = true; SND.pop();
      if (b.dataset.a === 'yes') setTimeout(() => system(), 250); else hooks.say(T`好的 · 想要的时候去设置里打开`); };
  }
  function open() { render(); $('settings').hidden = false; }
  function close() { $('settings').hidden = true; }
  function init(h) {
    hooks = Object.assign(hooks, h); apply();
    $('settings').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) { if (e.target === $('settings')) close(); return; }
      if (b.classList.contains('al-x')) { close(); return; }
      if (b.disabled) return;
      SND.tick(3);
      if (b.dataset.k) { const k = b.dataset.k; if (k === 'snd') hooks.sound(); else { P[k] = !P[k]; keep(); apply(); } render(); return; }
      if (b.dataset.sold) { P.sold = b.dataset.sold; keep(); render(); return; }
      const a = b.dataset.act;
      if (a === 'perm') system();
      else if (a === 'phone') { close(); hooks.phone(); }
      else if (a === 'lang') { close(); hooks.lang(); }
      else if (a === 'restore') { if (hooks.restore) hooks.restore(); else hooks.say(T`没有找到要恢复的购买`); }
      else if (a === 'about') hooks.say(T`原型里还没有这一页`);
    });
  }
  return { init, open, close, ask, get prefs() { return P; }, shouldAsk: () => !P.asked && P.perm === null, get isOpen() { return !$('settings').hidden; } };
})();
