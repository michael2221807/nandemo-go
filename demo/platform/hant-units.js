/* 繁體中文 (zh-Hant, build_www.py build_i18n_js): the money's 万-step units in Traditional (萬 億 溝 澗 載 極). They are
   iso.js's, which the turning pictures' hash counts, so iso.js stays as it is: this file loads right after it and wraps
   the two functions that write a sum (UTIL.big, UTIL.money). Nothing changes in the other languages. */
if (I18N.hant && typeof UTIL !== 'undefined') {
  const U = { '万': '萬', '亿': '億', '沟': '溝', '涧': '澗', '载': '載', '极': '極' }, u = s => s.replace(/[万亿沟涧载极]/g, c => U[c]);
  const big = UTIL.big, money = UTIL.money;
  UTIL.big = n => { const v = big(n); return { num: v.num, unit: u(v.unit) }; };
  UTIL.money = n => u(money(n));
}
