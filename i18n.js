// the site's four languages: ?lang= first, then the one picked before, then English (the owner, 2026-10-28).
// The page's table T fills [data-t] (text), [data-a] (an image's alt) and the title; after(lang) does the rest.
window.SITE = (() => {
  const LANGS = [['zh-Hans', '简体'], ['zh-Hant', '繁體'], ['ja', '日本語'], ['en', 'EN']];
  const ok = l => LANGS.some(x => x[0] === l);
  const guess = () => 'en';
  const saved = () => { try { return localStorage.getItem('nandemo-site-lang'); } catch (e) { return null; } };
  const keep = l => { try { localStorage.setItem('nandemo-site-lang', l); } catch (e) { /* private mode */ } };
  function page(T, after) {
    const q = new URLSearchParams(location.search).get('lang');
    const nav = document.querySelector('.langs');
    const set = l => {
      document.documentElement.lang = l;
      document.querySelectorAll('[data-t]').forEach(el => { const s = T[l][el.dataset.t]; if (s !== undefined) el.innerHTML = s; });
      document.querySelectorAll('[data-a]').forEach(el => { const s = T[l][el.dataset.a]; if (s !== undefined) el.alt = s; });
      if (T[l].title) document.title = T[l].title;
      nav.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === l)));
      document.querySelectorAll('a[data-keep]').forEach(a => { a.href = a.dataset.keep + '?lang=' + l; });
      if (after) after(l);
    };
    nav.innerHTML = LANGS.map(([l, n]) => `<button type="button" data-l="${l}" lang="${l}" aria-pressed="false">${n}</button>`).join('');
    nav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { keep(b.dataset.l); set(b.dataset.l); } });
    set(ok(q) ? q : ok(saved()) ? saved() : guess());
  }
  return { page };
})();
