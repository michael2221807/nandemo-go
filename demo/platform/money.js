/* Money that reads at a glance (the owner, 2026-10-20 phone review, item 2; of three mock-ups he chose A on 10-21):
   - the decimal point and the thousands comma looked alike (¥1,234京 against ¥1.234京). Both keep their size and
     place; the point becomes a larger dot in its own colour (yellow on the dark wallet, pink on the cream letter
     chart and on the cat cards) and the comma turns grey. In the wallet, the letter chart's amounts and the price on
     the cat card's and the bowl's feed button. The dot is enlarged with a transform, so no figure gets any wider.
   - nobody knows how big 京 is. The letter chart (tap the wallet, as before) opens with a number line on top: every
     unit from a ¥100 coin to the last one, the money in hand marked on it, and how many ¥100 coins that is. English
     labels drop the "-illion" so the seventeen ticks fit (m, b, tr, quadr …).
   The prototype (v0.46.1) prints the figures as plain text and has no number line; this file only redraws what the
   game wrote, so the game's code stays as it is. */
(() => {
  const $ = id => document.getElementById(id);
  const num = $('st-num'), ladder = $('st-ladder'), sheet = $('st-sheet');
  if (!num || !ladder || !sheet) return;
  const L = (typeof I18N !== 'undefined' && I18N.lang) || 'zh', HANT = typeof I18N !== 'undefined' && I18N.hant;   // (繁體中文: Chinese, its own characters)
  const U = L === 'en'
    ? [['thousand', 3], ['m', 6], ['b', 9], ['tr', 12], ['quadr', 15], ['quint', 18], ['sext', 21], ['sept', 24], ['oct', 27], ['non', 30], ['dec', 33], ['undec', 36], ['duodec', 39], ['tredec', 42], ['quattuordec', 45], ['quindec', 48], ['sexdec', 51]]
    : (L === 'ja' ? ['万', '億', '兆', '京', '垓', '秭', '穣', '溝', '澗', '正', '載', '極'] : HANT ? ['萬', '億', '兆', '京', '垓', '秭', '穰', '溝', '澗', '正', '載', '極'] : ['万', '亿', '兆', '京', '垓', '秭', '穰', '沟', '涧', '正', '载', '极']).map((u, k) => [u, 4 * (k + 1)]);
  const FULL = L === 'en' ? ['thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion', 'sexdecillion'] : U.map(u => u[0]);
  const S = {
    zh: { axis: '钱的数轴', here: '你在这里', step: '每往右一格 ×1万', zeros: (u, n) => `${u} = 1 后面 ${n} 个 0`, times: r => `已经是一枚 ¥100 硬币的 <b>${r}</b> 倍` },
    'zh-Hant': { axis: '錢的數線', here: '你在這裡', step: '每往右一格 ×1萬', zeros: (u, n) => `${u} = 1 後面 ${n} 個 0`, times: r => `已經是一枚 ¥100 硬幣的 <b>${r}</b> 倍` },
    ja: { axis: 'お金の数直線', here: 'いまここ', step: '右へ 1 目盛りごとに ×1万', zeros: (u, n) => `<span class="nd-nw">${u} = 1 のあとに 0 が ${n} 個</span>`, times: r => `100 円玉 1 枚の <b>${r}</b> 倍になった` },
    en: { axis: 'How big is your money?', here: 'You are here', step: 'each tick ×1,000 (“-illion” left off)', zeros: (u, n) => `${u} = 1 followed by ${n} zeros`, times: r => `That is <b>${r}</b> ¥100 coins` },
  }[HANT ? 'zh-Hant' : L] || {};
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  // the figure as the game wrote it, with the point and the comma marked (only between digits)
  const marks = s => esc(s).replace(/(\d)([.,])(?=\d)/g, (m, d, p) => d + (p === '.' ? '<i class="nd-pt">.</i>' : '<i class="nd-cm">,</i>'));
  const redo = el => { if (el.firstElementChild || !/\d[.,]\d/.test(el.textContent)) return; el.innerHTML = marks(el.textContent); };

  // the wallet: the game sets st-num's text on every sale; marked again right after (no element child = fresh text)
  // English: an amount wider than the room left of the jar is set smaller until it fits (「¥999.9 quattuordecillion」
  // ran past the jar and the card, 2026-10-21; Chinese and Japanese units are one character and always fit)
  const money = num.closest('.st-money'), jar = document.querySelector('#st-wallet .st-jar');
  // (scaled whole, figure, badge and unit together: the unit's own size is fixed, so a smaller font left it as wide)
  const fit = () => {
    if (L !== 'en' || !money || !jar) return;
    money.style.transform = '';
    const room = jar.getBoundingClientRect().left - money.getBoundingClientRect().left - 8, w = money.scrollWidth;
    if (room > 0 && w > room) { money.style.transformOrigin = '0 50%'; money.style.transform = `scale(${(room / w).toFixed(3)})`; }
  };
  new MutationObserver(() => { redo(num); fit(); }).observe(num, { childList: true, characterData: true, subtree: true });
  const unitEl = document.getElementById('st-unit');   // (the unit word, in the badge after the figure)
  if (unitEl) new MutationObserver(fit).observe(unitEl, { childList: true, characterData: true, subtree: true });
  redo(num); fit();

  const big = n => { const v = UTIL.big(n); return v.num + v.unit; };
  function axis() {
    const card = sheet.querySelector('.st-card'); if (!card) return;
    let box = card.querySelector('.nd-axis');
    if (!box) { box = document.createElement('div'); box.className = 'nd-axis'; card.insertBefore(box, card.querySelector('p')); }
    const bank = Math.max(1, ECON.bank || 0), lg = Math.log10(bank), max = U[U.length - 1][1];
    let k = -1; U.forEach(([, e], i) => { if (bank >= Math.pow(10, e)) k = i; });
    const x = e => (Math.max(0, Math.min(max, e)) / max * 100).toFixed(2) + '%';
    const ticks = U.map(([u, e], i) => `<span class="nd-tk${i === k ? ' cur' : i < k ? ' got' : ''}" style="left:${x(e)}"><em>${u}</em></span>`).join('');
    const unit = k >= 0 ? S.zeros(FULL[k], U[k][1]) : '';
    box.innerHTML = `<h4>${S.axis}</h4><div class="nd-line"><span class="nd-fill" style="width:${x(lg)}"></span>${ticks}
      <span class="nd-coin" style="left:${x(2)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><text x="12" y="15.5">100</text></svg></span>
      <span class="nd-you" style="left:${x(lg)}"><b>${S.here}</b><span>¥${marks(big(bank))}</span></span></div>
      <p class="nd-cap">${S.step}${unit ? ' · ' + unit : ''}</p>${bank >= 1e4 ? `<p class="nd-big">${S.times(marks(big(bank / 100)))}</p>` : ''}`;
    // the marker's label stays inside the card at either end
    const you = box.querySelector('.nd-you'), line = box.querySelector('.nd-line');
    const half = you.offsetWidth / 2, at = line.offsetWidth * Math.max(0, Math.min(max, lg)) / max;
    you.style.setProperty('--dx', (Math.max(half - 8, Math.min(line.offsetWidth - half + 8, at)) - at).toFixed(1) + 'px');
    // little money: the marker's label would sit on the ¥100 coin; it goes up a row (and the title with it)
    const coin = line.offsetWidth * 2 / max, left = at + Math.max(half - 8, Math.min(line.offsetWidth - half + 8, at)) - at - half;
    box.classList.toggle('low', left < coin + 14);
  }
  // the letter chart: the game redraws the rows each time it opens; the amounts are marked and the line drawn then
  new MutationObserver(() => { ladder.querySelectorAll('li > b').forEach(redo); if (!sheet.hidden) axis(); }).observe(ladder, { childList: true });
  // money that comes in while the chart is open moves the marker (the wallet changes first, so this follows it)
  let pend = 0;
  new MutationObserver(() => { if (sheet.hidden || pend) return; pend = requestAnimationFrame(() => { pend = 0; if (!sheet.hidden) axis(); }); }).observe(num, { childList: true });
  // the cat card and the bowl: the price under 喂它 / 开饭！ (app.js redraws #nk-food each time a card opens)
  const food = $('nk-food');
  if (food) new MutationObserver(() => food.querySelectorAll('.nk-feed small').forEach(redo)).observe(food, { childList: true });

  const css = document.createElement('style');
  css.textContent = `
#st-num{white-space:nowrap}
.nd-pt{font-style:normal;color:#ffd23f;display:inline-block;transform:scale(1.3);transform-origin:50% 80%}
.nd-cm{font-style:normal;color:#8d84a8}
#st-ladder .nd-pt,.nk-feed .nd-pt{color:#ff4f8b;transform:none} #st-ladder .nd-cm{color:#b3a4c2} .nk-feed .nd-cm{color:#9d94b8}
.nk-feed small .nd-pt{font-weight:700}
.nd-nw{white-space:nowrap}
.nd-axis.low h4{margin-bottom:84px} .nd-axis.low .nd-you{bottom:30px}
.nd-axis.low .nd-you::before{content:"";position:absolute;left:50%;top:calc(100% - 7px);width:2px;height:31px;margin-left:-1px;background:#ffd23f;transform:translateX(calc(-1 * var(--dx,0px)))}
html[data-lang="en"] .nd-axis.low h4{margin-bottom:86px}
#st-sheet .st-card{max-height:calc(100% - 8px);overflow-y:auto;box-sizing:border-box}
.nd-axis{margin:2px 0 10px;padding:10px 10px 8px;border:2px solid var(--dink);border-radius:10px;background:var(--dink);color:#fff}
.nd-axis h4{margin:0 0 50px;font:400 12px/1 var(--display);color:#ffd23f;letter-spacing:.06em}
.nd-line{position:relative;height:6px;margin:0 6px 30px;border-radius:3px;background:#3a3358}
html[data-lang="en"] .nd-line{margin:0 30px 48px 6px}
html[data-lang="en"] .nd-axis h4{margin-bottom:60px}
.nd-fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#ffd23f,#ff9a3c)}
.nd-tk{position:absolute;top:-3px;width:2px;height:12px;margin-left:-1px;background:#6e6590}
.nd-tk em{position:absolute;top:14px;left:50%;transform:translateX(-50%);font:700 11px/1 var(--maru);font-style:normal;color:#a99fc6;white-space:nowrap}
.nd-tk.got{background:#ffd23f} .nd-tk.got em{color:#fff6d6}
.nd-tk.cur{background:#fff;height:14px;top:-4px} .nd-tk.cur em{color:#ffd23f;font-size:13px}
html[data-lang="en"] .nd-tk em{transform:translateX(-2px) rotate(50deg);transform-origin:0 0;font-size:10px;top:13px}
html[data-lang="en"] .nd-tk.cur em{font-size:11px}
.nd-coin{position:absolute;top:-24px;margin-left:-9px;width:18px;height:18px}
.nd-coin svg{width:18px;height:18px} .nd-coin circle{fill:#c9c2b0;stroke:#fff;stroke-width:1.5} .nd-coin text{font:700 7.5px var(--maru);fill:var(--dink);text-anchor:middle}
.nd-you{position:absolute;bottom:12px;transform:translateX(calc(-50% + var(--dx,0px)));display:grid;justify-items:center;white-space:nowrap}
.nd-you b{font:700 10px/1 var(--maru);color:var(--dink);background:#ffd23f;padding:3px 6px;border-radius:999px}
.nd-you span{font:400 13px/1.2 var(--num);color:#fff;margin-top:1px}
.nd-you::after{content:"";border:5px solid transparent;border-top-color:#ffd23f;margin-top:1px;transform:translateX(calc(-1 * var(--dx,0px)))}
#st-sheet .nd-axis p{margin:0;color:#d6cdea}
#st-sheet .nd-axis .nd-cap{font:500 11px/1.4 var(--maru)}
#st-sheet .nd-axis .nd-big{margin-top:4px;font:700 12.5px/1.4 var(--maru);color:#fff6d6}
.nd-big b{color:#ffd23f;font-family:var(--num);font-weight:400;font-size:14px} .nd-big .nd-pt{color:#fff}`;
  document.head.appendChild(css);
})();
