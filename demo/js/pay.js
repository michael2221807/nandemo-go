/* なんでも自販機 · the catalog: what real money buys (v0.39, 2026-10-19). The user's frame: no virtual currency, no ads;
   selling numbers is fine in moderation (a premium feel without breaking the numbers), but the star is the thing
   itself — machines, cats, decor, skins, cat food, goods nobody else has. Rules kept here (docs/nandemo-付费设计.md):
   - every item has a price in real money, is bought once, kept for good and restored on another phone
   - nothing random, no countdowns, no "only today", nothing pushed at the player: the catalog waits on the street
   - numbers stay inside what free play reaches: the 店长证's second warehouse box and longer fullness are the only
     plain numbers; a paid cat or machine earns like the free ones; paid goods earn like their ★
   - never sold: album rewards, the iso look, anything play unlocks (streets, lots, letters, steps)
   In the prototype a purchase is a mock (STORE 'nandemo-purchases'); the sheet stands in for the phone's store.
   revoke(id) (v0.41) takes a refunded item back: everything it did follows has(), quietly, and what the album already
   collected stays collected. */
const PAY = (() => {
  const KEY = 'nandemo-purchases', $ = id => document.getElementById(id);
  const S = { own: {}, off: {}, pick: null, swap: [], stamps: { n: 0, day: 0 }, seen: null };   // off: looks the player has switched off again
  try { Object.assign(S, JSON.parse(STORE.get(KEY)) || {}); } catch (e) { /* none yet */ }
  const keep = () => STORE.set(KEY, JSON.stringify(S));
  const fresh = !Array.isArray(S.seen);
  let hooks = { apply() {}, say() {}, icon: '' }, view = null;

  // store price points by region (CN and US are App Store points; the JP figures are placeholders until tiers are set)
  const PRICE = { 1: { zh: '¥6', en: '$0.99', ja: '¥160' }, 2: { zh: '¥12', en: '$1.99', ja: '¥320' }, 3: { zh: '¥18', en: '$2.99', ja: '¥480' }, 5: { zh: '¥30', en: '$4.99', ja: '¥800' } };
  // the shown price: the store's own string when the shell gives one (StoreKit displayPrice, by store region), else the table
  const price = x => (hooks.price && hooks.price(x.id)) || PRICE[x.tier][I18N.lang] || PRICE[x.tier].en;
  const ink = (w = 2) => `stroke="#141018" stroke-width="${w}" stroke-linejoin="round"`;
  // little drawings for the cards (the street's doodle style: flat colours, black ink)
  const ART = {
    license: () => `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="10" y="18" width="60" height="44" rx="6" fill="#ffd23f" ${ink(2.6)}/><rect x="15" y="23" width="50" height="34" rx="4" fill="#fff3b8" ${ink(1.6)}/>
      <use href="#neko-paw" x="19" y="28" width="22" height="22"/><path d="M45 32h14M45 39h14M45 46h9" stroke="#b07a10" stroke-width="2.6" stroke-linecap="round"/><path d="M54 58l5 12l3-6l6 2l-6-10z" fill="#ff4f8b" ${ink(1.6)}/></svg>`,
    flower: () => `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="12" width="44" height="62" rx="5" fill="#bfe9d6" ${ink()}/><rect x="23" y="18" width="34" height="38" rx="3" fill="#effaff" ${ink(1.6)}/>
      ${[[31, 28, '#ff7aa8'], [44, 26, '#ffd23f'], [36, 40, '#b48cff'], [48, 41, '#ff9a5a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.6" fill="${c}" ${ink(1.4)}/><path d="M${x} ${y + 5}v6" stroke="#3aa66b" stroke-width="2"/>`).join('')}<rect x="27" y="61" width="26" height="7" rx="2" fill="#141018"/></svg>`,
    pop: () => `<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="18" y="12" width="44" height="62" rx="5" fill="#ff6b6b" ${ink()}/><rect x="23" y="18" width="34" height="34" rx="3" fill="#fff8ec" ${ink(1.6)}/>
      ${[[30, 40], [36, 36], [43, 41], [49, 37], [33, 46], [40, 47], [47, 46], [39, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff3b0" ${ink(1.2)}/>`).join('')}<path d="M32 24h16v6H32z" fill="#8a8494" ${ink(1.4)}/><rect x="27" y="58" width="26" height="9" rx="2" fill="#141018"/></svg>`,
    omikuji: () => `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M10 24L40 8l30 16z" fill="#d8453a" ${ink()}/><rect x="18" y="24" width="44" height="50" rx="3" fill="#fff4e0" ${ink()}/><rect x="27" y="32" width="26" height="22" rx="2" fill="#2a2440" ${ink(1.6)}/>
      <path d="M33 50q0-12 7-12t7 12" fill="#ff4f6a" ${ink(1.4)}/><circle cx="37" cy="43" r="1.4" fill="#141018"/><circle cx="43" cy="43" r="1.4" fill="#141018"/><rect x="36" y="58" width="8" height="12" fill="#fff" ${ink(1.4)}/><path d="M38 62h4M38 65h4" stroke="#d8453a" stroke-width="1.4"/></svg>`,
    goods: () => `<svg viewBox="0 0 80 80" aria-hidden="true">${[['#d98a3a', 'bottle'], ['#a0522d', 'can'], ['#ffb3c8', 'can'], ['#b8f05a', 'bottle'], ['#5fbf6a', 'bottle']].map(([c, k], i) => { const x = 10 + i * 13;
      return k === 'bottle' ? `<rect x="${x}" y="30" width="10" height="34" rx="4" fill="${c}" ${ink(1.6)}/><rect x="${x + 2.5}" y="24" width="5" height="7" rx="1.5" fill="#7fb6ff" ${ink(1.2)}/>` : `<rect x="${x}" y="38" width="11" height="26" rx="3" fill="${c}" ${ink(1.6)}/>`; }).join('')}
      <path d="M8 66h64" stroke="#141018" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    decor: () => `<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M20 10v8" stroke="#141018" stroke-width="2"/><ellipse cx="20" cy="34" rx="12" ry="16" fill="#ff5a4a" ${ink()}/><path d="M10 30h20M10 38h20" stroke="#ffd23f" stroke-width="2"/><rect x="15" y="16" width="10" height="4" fill="#141018"/><rect x="15" y="48" width="10" height="4" fill="#141018"/>
      <path d="M44 30q4-14 8-2q4-12 8 2q8 2 8 14q0 16-16 16t-16-16q0-12 8-14z" fill="#fff8ec" ${ink()}/><path d="M48 44q4-3 6 0M58 44q4-3 6 0" stroke="#d8453a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M52 31l4 8l4-8" fill="#ff8aa6"/></svg>`,
  };
  /* the catalog: one shop-keeper's licence, then machines, a cat, a look, goods, decor. ready: works in the prototype.
     lines: [text, tag] — tag '数值' marks a plain number, so nobody has to guess what they are paying for */
  const ITEMS = [
    { id: 'license', kind: 'license', tier: 5, ready: true, art: ART.license, name: T`店长证`, sub: T`只卖一次，给想支持这条街的人`,
      lines: [[T`每台机器后面多放一箱货：离开 12 小时也不断货（不买是 8 小时）`, 'num'], [T`金のまぐろ缶：猫吃饱的时间 ×1.5`, 'num'], [T`街口的「なんでも通り」招牌换成金色霓虹`, 'look'], [T`附送一张券：猫、外观、货品里自选一件`, 'new']],
      got: [T`店长证到了`, T`仓库多了一层架子，招牌亮成了金色，猫粮罐贴上了金标签`] },
    { id: 'm-bakery', kind: 'machine', tier: 3, ready: true, art: () => `<svg viewBox="-8 440 116 228" aria-hidden="true">${STREET.art('bakery')}</svg>`, name: T`こむぎ堂 · 现烤面包自贩机`, sub: T`面团在玻璃柜里发酵，一个个烤出来，切开夹馅，装袋递出`,
      lines: [[T`19 种面包，3 个改造：油炸锅、开酥机、三明治台`, 'new'], [T`和特殊机器一样：每小时比你最好的普通机器多赚一点，不会更多`, 'num']] },
    { id: 'm-teppan', kind: 'machine', tier: 3, ready: true, art: () => `<svg viewBox="-8 440 116 228" aria-hidden="true">${STREET.art('teppan')}</svg>`, name: T`てっぱん丸 · 铁板粉物自贩机`, sub: T`章鱼烧在铁板上一颗颗翻面，大阪烧翻面、炒面翻炒、鱿鱼烧压板压熟，装盒递出`,
      lines: [[T`18 种粉物，3 个改造：大阪烧铁板、炒面台、鱿鱼烧压板`, 'new'], [T`和特殊机器一样：每小时比你最好的普通机器多赚一点，不会更多`, 'num']] },
    { id: 'cat-ao', kind: 'cat', tier: 2, ready: true, art: () => NEKOART.portrait('ao'), name: T`アオ · 蓝灰猫`, sub: T`领养以后，它会自己来街上串门`,
      lines: [[T`和别的猫一样随心情待着，不一定每次都在`, 'new'], [T`本事：吃饱时客人 ×1.2（和ちび一样）`, 'num']],
      got: [T`アオ 被你领养了`, T`过一会儿，它会自己来纸箱旁边看看`] },
    { id: 'skin-sakura', kind: 'skin', tier: 2, ready: true, art: () => `<svg viewBox="-8 440 116 228" aria-hidden="true">${STREET.art('drink', 'sakura')}</svg>`, name: T`ミズイロ · 桜`, sub: T`春天的樱花色，街上和特写里都换`,
      lines: [[T`随时可以换回原来的颜色`, 'look']], got: [T`ミズイロ 换上了樱花色`, T`在商店里随时可以换回来`] },
    { id: 'goods-gotochi', kind: 'goods', tier: 1, ready: true, art: ART.goods, name: T`ご当地ドリンク`, sub: T`ミズイロ 多 5 款各地的饮料，每一 ★ 一款`,
      lines: [[T`和同 ★ 的货赚得一样多，多的是 5 样新东西`, 'new']], got: [T`ご当地ドリンク 到货了`, T`自动配货会在下次补货时摆上`] },
  ];
  const byId = Object.fromEntries(ITEMS.map(x => [x.id, x]));
  const has = id => !!S.own[id] || (S.pick === id && !!S.own.license) || S.swap.includes(id), on = id => has(id) && !S.off[id];
  if (fresh) S.seen = ITEMS.map(x => x.id).filter(id => !(STORE.get('nandemo-v6') && ['m-bakery', 'm-teppan'].includes(id)));
  /* (2026-10-24, the paid-content plan v3) three ways to own a catalog item besides buying it, all kept with the
     purchases (and iCloud) but never told to the App Store, so the shell's entitlements never take them back:
     - pick: the 店长证 comes with a ticket for one cat, look or goods item of the two lowest price points
     - swap: 营业日印章 — a stamp on the 常客卡 for each day with a restock (no streak, nothing lost for a missed day);
       ten of them buy one goods pack, look or decor (never a cat, a machine or the licence)
     - the red dot on the shop's button: once for an item the player has not seen in the catalog, the ticket, a full card */
  const STAMPS = 10;
  const pickable = x => x.ready && x.kind !== 'license' && x.tier <= 2 && !has(x.id);
  const swappable = x => x.ready && ['goods', 'skin', 'decor'].includes(x.kind) && !has(x.id);
  const pickOpen = () => !!S.own.license && !S.pick;
  const full = () => S.stamps.n >= STAMPS && ITEMS.some(swappable);
  function dot() { const b = $('st-paybtn'); if (b) b.classList.toggle('dot', ITEMS.some(x => !S.seen.includes(x.id)) || (pickOpen() && !S.seenPick) || (full() && !S.seenFull)); }
  function seeAll() { S.seen = ITEMS.map(x => x.id); if (pickOpen()) S.seenPick = true; if (full()) S.seenFull = true; keep(); dot(); }
  // the two free ways, each with its own drawn mark, used together: the box at the top that says what the player holds,
  // and a chip per way on every item it can take (an item both can take shows both chips)
  const IC = {
    pick: `<svg viewBox="0 0 18 13" aria-hidden="true"><path d="M1.5 2.5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v2.3a1.7 1.7 0 0 0 0 3.4v2.3a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V8.2a1.7 1.7 0 0 0 0-3.4z" fill="#ffd23f" stroke="#141018" stroke-width="1.3" stroke-linejoin="round"/><path d="M12 3v7" stroke="#141018" stroke-width="1.1" stroke-dasharray="1.3 1.1"/></svg>`,
    swap: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#ff4f8b" stroke="#141018" stroke-width="2"/><use href="#neko-paw" x="5.5" y="5.5" width="13" height="13" style="fill:#fff"/></svg>` };
  const ways = x => has(x.id) ? [] : [pickOpen() && pickable(x) ? 'pick' : '', full() && swappable(x) ? 'swap' : ''].filter(Boolean);
  // (on the item: the marks only, in the card's corner, two side by side when both can take it; the box says what they mean)
  const chips = x => { const w = ways(x); return w.length ? `<span class="pay-badges">${w.map(k => `<i class="pay-badge ${k}" role="img" aria-label="${k === 'pick' ? T`可选` : T`可换`}">${IC[k]}</i>`).join('')}</span>` : ''; };
  function freeBox() {
    const p = pickOpen() && ITEMS.some(pickable), w = full(); if (!p && !w) return '';
    return `<div class="pay-free"><b>${T`可以免费换`}</b>`
      + (p ? `<p>${IC.pick}<span>${T`店长证的券 ×1：有这个标记的猫、外观、货品，任选一件`}</span></p>` : '')
      + (w ? `<p>${IC.swap}<span>${T`常客卡盖满了：有这个标记的货品、外观、装扮，任选一件`}</span></p>` : '')
      + (p && w ? `<small>${T`券和印章分开用，各换一件`}</small>` : '') + `</div>`;
  }
  // the 常客卡 (drawn: a paw in each stamped circle)
  const card10 = () => `<div class="pay-stamps" role="img" aria-label="${T`常客卡 ${S.stamps.n}/${STAMPS}`}">${Array.from({ length: STAMPS }, (_, i) => `<svg viewBox="0 0 24 24" aria-hidden="true">${i < S.stamps.n
    ? `<circle cx="12" cy="12" r="10" fill="#ff4f8b" stroke="#141018" stroke-width="1.8"/><use href="#neko-paw" x="5.5" y="5.5" width="13" height="13" style="fill:#fff"/>`
    : `<circle cx="12" cy="12" r="10" fill="#fff8ec" stroke="#b9a9c6" stroke-width="1.6" stroke-dasharray="3 2.4"/>`}</svg>`).join('')}</div>`;
  const stampBlock = () => `<h4>${T`营业日印章`}</h4><div class="pay-card">${card10()}<p class="pay-cardt">${full() ? T`盖满了 · 有印章标记的东西任选一件` : S.stamps.n >= STAMPS ? T`盖满了 · 能换的都换完了，以后上新再来` : T`每天补一次货，盖一个章 · 盖满 ${STAMPS} 个换一件货品、外观或装扮`}</p></div>`;
  // a day with a restock (app.js, the door shut after one): its stamp, the number now on the card, or 0
  function stamp() { const d = new Date(), day = d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate();
    if (S.stamps.day === day || S.stamps.n >= STAMPS) return 0; S.stamps.day = day; S.stamps.n++; if (S.stamps.n >= STAMPS) S.seenFull = false; keep(); dot(); return S.stamps.n; }
  function claim(id, how) { if (how === 'pick') S.pick = id; else { S.swap.push(id); S.stamps.n -= STAMPS; } keep(); dot(); render();
    hooks.apply(id, true); SND.chime(); const g = byId[id].got; if (g) hooks.card(g[0], g[1]); }

  const TAG = { num: T`数值`, look: T`外观`, new: T`新东西` };

  function card(x) {
    const st = has(x.id) ? `<em class="pay-own">${T`已拥有`}</em>` : x.ready ? `<em class="pay-price">${price(x)}</em>` : `<em class="pay-wip">${T`制作中`}</em>`;
    const tag = chips(x);
    return `<button type="button" class="pay-c pay-${x.kind}" data-item="${x.id}"><span class="pay-art">${x.art()}</span><b>${x.name}</b>${st}${tag}</button>`;
  }
  function list() {
    const L = ITEMS.find(x => x.kind === 'license');
    return `<p class="pay-lead">${T`用真钱买 · 买一次就一直是你的 · 换手机也能恢复`}</p>`
      + `<button type="button" class="pay-hero" data-item="license"><span class="pay-art">${L.art()}</span><span><b>${L.name}</b><small>${L.sub}</small>`
      + `<span class="pay-lines">${L.lines.map(([t, k]) => `<i class="pay-l"><u class="pay-tag pay-${k}">${TAG[k]}</u>${t}</i>`).join('')}</span></span>`
      + `${has('license') ? `<em class="pay-own">${T`已拥有`}</em>` : `<em class="pay-price">${price(L)}</em>`}</button>`
      + freeBox()
      + `<h4>${T`机器`}</h4><div class="pay-grid">${ITEMS.filter(x => x.kind === 'machine').map(card).join('')}</div>`
      + `<h4>${T`猫 · 外观 · 货品`}</h4><div class="pay-grid">${ITEMS.filter(x => ['cat', 'skin', 'goods'].includes(x.kind)).map(card).join('')}</div>`
      + (ITEMS.some(x => x.kind === 'decor') ? `<h4>${T`装扮`}</h4><div class="pay-grid">${ITEMS.filter(x => x.kind === 'decor').map(card).join('')}</div>` : '')
      + stampBlock()
      + `<p class="pay-foot">${T`没有虚拟币，没有广告，没有抽奖`}<br><button type="button" data-act="restore">${T`恢复购买`}</button> · <button type="button" data-act="reset">${T`演示：清空购买`}</button></p>`;
  }
  function detail(x) {
    let act;
    if (!x.ready) act = `<button type="button" class="sh-btn" disabled>${T`制作中`}</button><p class="pay-note">${x.kind === 'machine' ? T`做好以后在这里买，买之前可以先免费试运转` : T`做好以后在这里买，买之前可以先试穿`}</p>`;
    else if (has(x.id)) act = x.kind === 'skin' ? `<button type="button" class="sh-btn" data-act="toggle">${on(x.id) ? T`换回原来的颜色` : T`换上`}</button>` : `<button type="button" class="sh-btn" disabled>${T`已拥有`}</button>`;
    else act = `<button type="button" class="sh-btn" data-act="buy">${T`购买 ${price(x)}`}</button>`
      + (pickOpen() && pickable(x) ? `<button type="button" class="sh-btn pay-alt" data-act="pick">${T`用店长证的券换`}</button>` : '')
      + (full() && swappable(x) ? `<button type="button" class="sh-btn pay-alt" data-act="swap">${T`用 ${STAMPS} 个印章换`}</button>` : '');
    return `<button type="button" class="pay-back" data-act="back">‹ ${T`目录`}</button><div class="pay-big">${x.art()}</div><h4 class="pay-dt">${x.name}</h4><p class="pay-sub">${x.sub}</p>`
      + `<div class="pay-lines">${x.lines.map(([t, k]) => `<i class="pay-l"><u class="pay-tag pay-${k}">${TAG[k]}</u>${t}</i>`).join('')}</div>${act}`;
  }
  function render() { $('pay-body').innerHTML = view ? detail(byId[view]) : list(); $('pay-body').scrollTop = 0; if (!view) seeAll(); }
  function open(id = null) { view = id; render(); $('pay-sheet').hidden = false; }
  function close() { $('pay-sheet').hidden = true; }
  // the phone's own purchase sheet (a mock): name, price, one button
  function store(x) {
    const d = $('store-sheet');
    d.innerHTML = `<div class="store-box"><i class="store-grab"></i><small>${T`App 内购买项目`}</small><div class="store-app"><span class="store-ic">${hooks.icon}</span><span><b>${x.name}</b><small>なんでも通り</small></span></div>`
      + `<p class="store-price">${price(x)}</p><button type="button" class="store-buy" data-a="buy">${T`购买`}</button><button type="button" class="store-x" data-a="x">${T`取消`}</button><p class="store-demo">${T`演示：不会真的扣钱`}</p></div>`;
    d.hidden = false;
    d.onclick = e => { const b = e.target.closest('button'); if (!b) { if (e.target === d) d.hidden = true; return; }
      if (b.dataset.a === 'x') { d.hidden = true; return; }
      b.disabled = true; b.textContent = '…';
      setTimeout(() => { b.textContent = '✓'; setTimeout(() => { d.hidden = true; give(x.id); }, 500); }, 700); };
  }
  // grant (v0.43, the shell calls it when a real purchase or a restore succeeds): own it, redraw, apply; a purchase also
  // chimes and brings its arrival card, a restore ({quiet: true}) only applies
  function give(id, opt = {}) { if (!byId[id]) return; const was = has(id); S.own[id] = true; delete S.off[id]; keep(); dot(); if (!$('pay-sheet').hidden) render();
    hooks.apply(id, !was); if (opt.quiet || was) return; SND.chime(); const g = byId[id].got; if (g) hooks.card(g[0], g[1]); }
  function init(h) {
    hooks = Object.assign(hooks, h); dot();
    $('pay-sheet').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) { if (e.target === $('pay-sheet')) close(); return; }
      if (b.classList.contains('al-x')) { close(); return; }
      if (b.dataset.item) { SND.pick(); view = b.dataset.item; render(); return; }
      const a = b.dataset.act;
      if (a === 'back') { SND.tick(3); view = null; render(); }
      else if (a === 'buy') { SND.pop(); const x = byId[view];
        // a shell with a store: its buy(id) resolves true to have the catalog grant it, or it calls PAY.grant itself
        if (hooks.buy) Promise.resolve(hooks.buy(x.id)).then(ok => { if (ok) give(x.id); }).catch(() => {}); else store(x); }
      else if (a === 'toggle') { if (S.off[view]) delete S.off[view]; else S.off[view] = true; keep(); render(); hooks.apply(view, false); }
      else if (a === 'pick' && pickOpen() && pickable(byId[view])) { SND.pop(); claim(view, 'pick'); }
      else if (a === 'swap' && full() && swappable(byId[view])) { SND.pop(); claim(view, 'swap'); }
      else if (a === 'restore') restore();
      else if (a === 'reset') { S.own = {}; S.off = {}; S.pick = null; S.swap = []; S.stamps = { n: 0, day: 0 }; keep(); location.reload(); }
    });
  }
  function revoke(id) { if (!S.own[id]) return; delete S.own[id]; delete S.off[id]; keep(); dot(); if (!$('pay-sheet').hidden) render(); hooks.apply(id, false); }
  // restore: in a real app the store hands back what this account bought; here it is already on this device
  function restore() { if (hooks.store_restore) return hooks.store_restore(); const n = Object.keys(S.own).length; hooks.say(n ? T`恢复了 ${n} 件购买` : T`没有找到要恢复的购买`); }
  /* the shell's store (v0.43): useStore({buy(id) -> Promise<bool>, restore(), price(id) -> string}) — any of the three;
     without it the catalog keeps its mock sheet and mock restore */
  function useStore(s) { if (s.buy) hooks.buy = s.buy; if (s.restore) hooks.store_restore = s.restore; if (s.price) hooks.price = s.price; if (!$('pay-sheet').hidden) render(); }
  return { init, open, close, has, on, restore, revoke, grant: give, useStore, ITEMS, stamp, get isOpen() { return !$('pay-sheet').hidden || !$('store-sheet').hidden; } };
})();
