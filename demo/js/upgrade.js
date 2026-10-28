/* Machine upgrades (改造): parts fitted in the X-ray view. Every part is a real vending-machine mechanism with one
   effect told by one number; each machine lists its own parts (m.upgrades) and applies them (m.applyParts).
   This module only keeps the state: which level each part is at, and which fitted parts the album has shown. */
const UPG = (() => {
  const st = { lv: {}, seen: {} };
  const key = (mid, id) => mid + ':' + id;
  const parts = m => m.upgrades || [];
  const part = (m, id) => parts(m).find(p => p.id === id);
  const level = (mid, id) => st.lv[key(mid, id)] || 0;
  const has = (mid, id) => level(mid, id) > 0;
  const maxed = (m, id) => level(m.id, id) >= part(m, id).cost.length;
  // what the next level costs and does (null once it is all fitted)
  function next(m, id) { const p = part(m, id), lv = level(m.id, id); if (!p || lv >= p.cost.length) return null; return { lv, cost: p.cost[lv], effect: p.effect[lv] }; }
  // the cheapest part this machine can still take, and whether the wallet covers it
  const open = m => parts(m).filter(p => !maxed(m, p.id));
  const affordable = (m, bank) => open(m).some(p => next(m, p.id).cost <= bank);
  function install(m, id) { if (!next(m, id)) return false; st.lv[key(m.id, id)] = level(m.id, id) + 1; return true; }
  const levels = m => Object.fromEntries(parts(m).map(p => [p.id, level(m.id, p.id)]));
  // 试装 (试运转 only): every part of one machine fitted, or none; the app puts the saved state back afterwards
  const setAll = (m, on) => parts(m).forEach(p => { st.lv[key(m.id, p.id)] = on ? p.cost.length : 0; });
  const allIn = m => parts(m).length > 0 && parts(m).every(p => maxed(m, p.id));
  // album: a fitted part is NEW until looked at once
  const isNew = (mid, id) => has(mid, id) && !st.seen[key(mid, id)];
  const see = (mid, id) => { st.seen[key(mid, id)] = 1; };
  const unseen = machines => machines.reduce((n, m) => n + parts(m).filter(p => isNew(m.id, p.id)).length, 0);
  // the little 「改造」 tag over each pin, as wide as the word in the current language
  function tag() { const t = T`改造`, w = /[\u3040-\u9fff]/.test(t) ? 19 : Math.max(19, t.length * 3.6 + 7);
    return `<rect class="upin-tb" x="${-w / 2}" y="-21.5" width="${w}" height="8.6" rx="4.3"/><text class="upin-t" y="-15.3" text-anchor="middle">${t}</text>`; }
  const save = () => JSON.parse(JSON.stringify(st));
  function load(d) { if (!d) return; st.lv = d.lv || {}; st.seen = d.seen || {}; }
  return { part, parts, level, has, maxed, next, open, affordable, install, levels, setAll, allIn, tag, isNew, see, unseen, save, load };
})();
