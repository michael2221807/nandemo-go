/* Localisation (2026-10-15). Three languages: 中文 (zh, the source text), English (en), 日本語 (ja).
   Two ways to show the street's names (user, 2026-10-15):
     原汁原味 (authentic): the interface in your language; the goods, machine brands and cats keep their Japanese names.
     全部翻译 (full): those in your language too — cats and brands get local names (as Neko Atsume names its cats).
   Japanese has the one way only. Text painted into the world — machine prints and buttons, packaging, neon, signs,
   the road's 止まれ, sounds like ゴトン — is always Japanese in every mode: it is the street itself.
   Strings: every interface string in the code is its Chinese text tagged T`…`; the Chinese is the key and each ${}
   becomes {0} {1}… in the dictionaries (i18n-en.js, i18n-ja.js), so a translation may reorder them. Static markup is
   translated once at start by walking the page's text. Changing language or mode reloads the page (the game saves
   on the way out). */
const I18N = (() => {
  const KEY = 'nandemo-lang', LANGS = ['zh', 'en', 'ja'];
  const guess = () => 'en';
  let saved = null; try { saved = JSON.parse(STORE.get(KEY)); } catch (e) { /* none yet */ }
  { const q = ({ en: 'en', ja: 'ja', zh: 'zh', 'zh-hans': 'zh', 'zh-cn': 'zh', 'zh-hant': 'zh-Hant', 'zh-tw': 'zh-Hant' })[(new URLSearchParams(location.search).get('lang') || '').toLowerCase()];
    if (q && STORE.get(KEY + '-q') !== q) { STORE.set(KEY + '-q', q); saved = { lang: q }; STORE.set(KEY, JSON.stringify(saved)); } }
  const code = saved && (LANGS.includes(saved.lang) || saved.lang === 'zh-Hant') ? saved.lang : guess(), hant = code === 'zh-Hant', lang = hant ? 'zh' : code;
  // English starts on full names (Japanese script would be unreadable to most), Chinese on the authentic ones
  const full = lang === 'ja' ? false : saved && typeof saved.full === 'boolean' ? saved.full : lang === 'en';
  const DICT = { zh: {}, en: {}, ja: {}, 'zh-Hant': {} }, CJK = /[぀-ヿ一-鿿]/, H = DICT['zh-Hant'];
  const hz = s => hant && typeof s === 'string' && H[s] !== undefined ? H[s] : s;
  // local names for full mode: { zh: { 'ミケ': '咪可', … }, en: {…} } (brands and cats), goods by kind:id
  const LOCAL = { zh: {}, en: {} }, GOODS = { zh: {}, en: {} };
  let swap = null;   // a regex over every Japanese name that has a local one (longest first)
  // the game's own names keep their Japanese even in full mode (なんでも is also a brand: Anything)
  const KEEP = ['なんでも自販機', 'なんでも通り', 'なんでもカタログ'];   // (the catalog's name, v0.39)

  function build() {
    const L = LOCAL[lang]; if (!full || !L) { swap = null; return; }
    const keys = [...KEEP, ...Object.keys(L)].sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    swap = keys.length ? new RegExp(keys.join('|'), 'g') : null;
  }
  // full mode: a Japanese name inside an interface string becomes its local name
  const localise = s => swap && typeof s === 'string' ? s.replace(swap, m => hz(LOCAL[lang][m]) || m) : s;
  // the tag: T`在 ${brand} 顶上打盹` -> key '在 {0} 顶上打盹'; also T('plain text')
  function T(strings, ...vals) {
    let key;
    if (typeof strings === 'string') key = strings;
    else { key = strings[0]; for (let i = 1; i < strings.length; i++) key += '{' + (i - 1) + '}' + strings[i]; }
    const d = DICT[lang]; let s = d[key];
    if (s === undefined) { s = key; if (lang !== 'zh' && CJK.test(key)) (window.__missing || (window.__missing = new Set())).add(key); }
    if (hant) { if (H[s] !== undefined) s = H[s]; else if (CJK.test(s)) (window.__missingHant || (window.__missingHant = new Set())).add(s); }
    // (v0.46) a count that changes the words: {0|one form|other form}, # in a form stands for the number (English)
    if (vals.length) s = s.replace(/\{(\d+)\|([^|{}]*)\|([^|{}]*)\}/g, (m, n, one, other) => (String(vals[+n]) === '1' ? one : other).replace(/#/g, vals[+n]));
    if (vals.length) s = s.replace(/\{(\d+)\}/g, (m, n) => vals[+n] !== undefined && vals[+n] !== null ? vals[+n] : '');
    return localise(s);
  }
  // a product's name for the interface (its Japanese name stays on the machines)
  const good = (kind, id, jp) => full && GOODS[lang] && GOODS[lang][kind + ':' + id] ? hz(GOODS[lang][kind + ':' + id]) : jp;
  const name = jp => full && LOCAL[lang] && LOCAL[lang][jp] ? hz(LOCAL[lang][jp]) : jp;

  // static markup: translate text nodes and labels once (not the painted world, not the designer's notes)
  const SKIP = '.stage-l, #street-svg, #street-bg, #dock-svg, #fly, .notes, script, style';
  function apply(root = document.body) {
    document.documentElement.lang = hant ? 'zh-Hant' : lang === 'zh' ? 'zh-CN' : lang; document.documentElement.dataset.lang = lang;
    if (hant) document.documentElement.dataset.script = 'hant';
    if (lang === 'zh' && !full && !hant) return;
    const walk = el => {
      if (el.matches && el.matches(SKIP)) return;
      for (const a of ['aria-label', 'title']) { const v = el.getAttribute && el.getAttribute(a); if (v && CJK.test(v)) el.setAttribute(a, T(v)); }
      for (const n of [...el.childNodes]) {
        if (n.nodeType === 3) { const t = n.nodeValue, k = t.trim(); if (k && CJK.test(k)) { const r = T(k); if (r !== k) n.nodeValue = t.replace(k, r); } }
        else if (n.nodeType === 1) walk(n);
      }
    };
    walk(root);
  }
  function set(l, f) { STORE.set(KEY, JSON.stringify({ lang: l, full: !!f })); location.reload(); }
  return {
    lang, full, T, good, name, apply, set, LANGS, code, hant, hz,
    list: a => a.join(lang === 'en' ? ', ' : '、'),   // names in a row: ミケ、クロ / Patches, Shadow
    add: (l, d) => { Object.assign(DICT[l], d); },
    names: (local, goods) => { for (const l in local) Object.assign(LOCAL[l], local[l]); for (const l in goods) Object.assign(GOODS[l], goods[l]); build(); },
    // the keys this session asked for that have no translation yet (a check for the dictionaries)
    missing: () => [...(window.__missing || [])],
  };
})();
const T = I18N.T;
