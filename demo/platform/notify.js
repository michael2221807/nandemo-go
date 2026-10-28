/* Local notifications (roadmap M4; system doc §11, §15.3). When the app goes to the background the page works out
   what to send from GAME.plan() — the rules and words are the prototype's own (js/phone.js plan() and note(), which
   the phone demo used; ported here until the design side exposes them) — and the shell schedules them with
   UNUserNotificationCenter; back in the foreground the shell cancels whatever is still pending.
   - sold out: one notice when the whole street is empty (or, by choice, when the first machine is), never one per
     machine, nothing if it was left empty; a new cat on its way; the day-3 flyer (never names the machine)
   - quiet hours 22:00–8:00 hold everything until 8:00 ("夜里 3:14 卖空的"); when the first machine and the whole
     street both land on the same 8:00, only the whole street's notice goes; at most three a day; only between one
     minute and 30 hours ahead; no "come back" reminders, ever
   The permission keeps the prototype's two steps: ミケ asks first (settings.js ask()), and only a yes there brings up
   the system prompt, which takes the place of the prototype's simulated one (#sys-alert). */
(() => {
  if (!window.NATIVE || !NATIVE.on || typeof SETTINGS === 'undefined' || !window.GAME || !GAME.plan) return;
  const $ = id => document.getElementById(id), HOUR = 3600e3, MIN = 60e3;

  /* ---------- the prototype's rules (phone.js), on GAME.plan() ---------- */
  function notices(S) {
    const left = m => m.units !== undefined ? m.units : m.count + m.ware;
    const etaOf = m => m.stopAt !== undefined ? m.stopAt : S.t0 + left(m) * m.gap;
    const paceOf = m => left(m) > 0 ? (etaOf(m) - S.t0) / left(m) : m.gap;
    const soldAt = (m, tt) => Math.min(left(m), Math.max(0, (tt - S.t0) / paceOf(m)));
    const earned = tt => S.machines.reduce((a, m) => a + soldAt(m, tt) * m.price, 0);
    const lastOut = () => { const live = S.machines.filter(m => left(m) > 0); return live.length ? Math.max(...live.map(etaOf)) : S.t0; };
    const hm = tt => { const d = new Date(tt); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const morning = tt => { const d = new Date(tt), h = d.getHours();
      return h >= 22 ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 8).getTime() : h < 8 ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8).getTime() : tt; };
    const ORDER = ['top', 'front', 'kerb', 'tray', 'box', 'lot'];
    const catAt = tt => { let best = null; for (const [id, s] of Object.entries(NEKO.seatsAt(tt))) { const r = ORDER.indexOf(s.kind); if (r >= 0 && (!best || r < best.r)) best = { id, r }; } return best; };

    const P = SETTINGS.prefs, out = [];
    if (P.perm !== true) return [];
    const live = S.machines.filter(m => left(m) > 0);
    if (live.length && P.sold !== 'off') {
      if (P.sold === 'one' && live.length > 1) { const f = live.reduce((a, m) => etaOf(m) < etaOf(a) ? m : a); out.push({ real: etaOf(f), kind: 'one', m: f, rest: live.length - 1 }); }
      out.push({ real: lastOut(), kind: 'all' });
    }
    if (P.cat) NEKO.CATS.forEach(c => { const s = NEKO.state(c.id); if (s.status === 'none' && s.due > S.t0) out.push({ real: s.due, kind: 'cat', c }); });
    if (P.mach && !S.special) { const b = new Date(S.born); out.push({ real: Math.max(new Date(b.getFullYear(), b.getMonth(), b.getDate() + 2, 9).getTime(), S.born + 36 * HOUR), kind: 'flyer' }); }
    out.forEach(e => { e.at = P.quiet ? morning(e.real) : e.real; });
    // the first machine and the whole street both sold out in the night: only the whole street's notice at 8:00
    // (design §9 rev 84, 2026-10-19; the prototype's phone.js follows in v0.46)
    const all = out.find(e => e.kind === 'all');
    const kept = out.filter(e => !(e.kind === 'one' && all && e.at === all.at && e.at !== e.real));
    const per = {};
    return kept.filter(e => e.real > S.t0 + MIN && e.at < S.t0 + 30 * HOUR).sort((a, b) => a.at - b.at)
      .filter(e => { const k = new Date(e.at).toDateString(); per[k] = (per[k] || 0) + 1; return per[k] <= 3; })
      .map((e, k) => {
        const night = e.at !== e.real, tm = hm(e.real);
        let n;
        // (v0.46) the title by the number of streets open: one street, two, three or more
        if (e.kind === 'all') { const c = catAt(e.real), nSt = (S.streets || []).length; n = { title: nSt >= 3 ? T`每条街都卖空了` : nSt === 2 ? T`两条街都卖空了` : T`街上全部卖空了`, body: (night ? T`夜里 ${tm} 卖空的 · ` : '') + T`这一轮卖了约 ${UTIL.money(earned(e.real))}`, cat: c && c.id }; }
        else if (e.kind === 'one') n = { title: T`${e.m.brand} 卖空了`, body: T`其他 ${e.rest} 台还在卖` + (night ? T` · 夜里 ${tm} 空的` : ''), go: e.m.i };
        else if (e.kind === 'cat') n = { title: T`纸箱旁边来了一只${e.c.kind}`, body: T`送它一次吃的，它就成了这条街的常客`, cat: e.c.id };
        else n = { title: T`有只猫叼来一张传单`, body: T`上面写着「开张」。是哪一台呢？`, cat: (catAt(e.real) || { id: 'mike' }).id };
        return { id: `${e.kind}-${k}`, kind: e.kind, at: Math.round(e.at), ...n };
      });
  }

  // the shell, on its way to the background (after GAME.pause): what to schedule
  window.__ndNotices = () => { try { return notices(GAME.plan()); } catch (e) { console.error('notices: ' + e.message); return []; } };

  /* ---------- the permission: the system's prompt in place of the prototype's simulated one ---------- */
  const alertBox = $('sys-alert');
  new MutationObserver(() => { if (!alertBox.hidden) NATIVE.post('notifyAsk', {}); }).observe(alertBox, { attributes: true, attributeFilter: ['hidden'] });
  // native: the player answered the system prompt (or it was answered before): the prototype's own buttons do the rest
  window.__ndNotifyAnswer = yes => { if (alertBox.hidden) return; const b = alertBox.querySelector(`[data-a="${yes ? 'yes' : 'no'}"]`); if (b) b.click(); };
  // native, on start and on coming back: what the system says now (the player can change it in the phone's settings)
  window.__ndNotifyStatus = status => {
    const P = SETTINGS.prefs, perm = status === 'authorized' ? true : status === 'denied' ? false : P.perm;
    if (perm !== P.perm) { P.perm = perm; STORE.set('nandemo-settings', JSON.stringify(P)); }
  };

  /* ---------- opening from a notice: the street (a machine for the medium widget, M5) ---------- */
  window.__ndOpen = i => {
    const inMachine = __ND.view === 'machine';
    if (i == null || i < 0) { if (inMachine) $('tostreet').click(); return; }
    const go = () => { const g = document.querySelector(`#street-svg .st-m[data-i="${i}"]`); if (g) g.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    if (inMachine) { if (__ND.cur === i) return; $('tostreet').click(); setTimeout(go, 700); } else go();
  };
})();
