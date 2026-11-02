/* The new player's guide, drawn (the owner 2026-11-01: testers opened the game and did not know where to start; plan
   doc 新手引导方案, picked "变暗加手指"). app.js (build_www GUIDE_JS) decides the step and hands it here at every ui():
   TUT.show(step, tip, quiet, view). This file only draws: the screen dimmed with a hole over what to tap, a drawn hand
   pointing at it, and ミケ (the shop's manager cat) saying the one thing to do in a bubble. Nothing here takes a tap
   meant for the game: the dim, the hole and the hand let every touch through (pointer-events: none); only the bubble's
   own buttons and the first-time welcome card are touchable. Not loaded in turn.html.
   Settings get a row 重看新手引导 (replay). */
(() => {
  if (typeof I18N === 'undefined') return;
  const code = I18N.code || I18N.lang;
  const cat = I18N.name ? I18N.name('ミケ') : 'ミケ';
  // [title, line under it]; n: the sales so far in step 2
  const TXT = {
    zh: {
      hello: '欢迎来到南丁猫街！', helloP: [`我是店长${cat}。这两台自贩机从今天起归你了。`, '卖货赚钱 → 买新机器 → 把整条街摆满。我带你走一遍，大概两分钟。'],
      go: '好，开始', skipAll: '我玩过了，跳过引导', skip: '跳过引导', ok: '知道了',
      enter: ['点这台机器，进去看看', '每台机器卖的东西不一样'],
      tap: n => ['点机器招呼客人', `每点一下就有人来买一件 · 已卖 ${n}/5`],
      door: ['货卖完就没钱赚了，随时可以补', '点「开门码货」'],
      load: ['点「全部放入」把货摆上去', '也可以一件件拖进去'],
      close: ['摆好了，点「✓ 关门」', ''],
      back: ['点左上角「‹ 街」回街上', ''],
      goal: y => ['钱包下面写着下一个目标', `这块空地写着：营业额到 ${y} 就开放，能摆第三台机器`],
      leave: ['机器放着也会自己卖，关掉游戏也在卖', '过几个小时回来收钱吧！'],
      'to-street': ['点「‹ 街」回街上继续', ''], 'to-machine': ['回到机器里，接着来', '点这台机器'],
      lot: ['有空地了！点它摆一台新机器', ''], upgrade: ['钱够改造了！点「透视」', '看机器内部，花钱装零件：卖得更快、更贵'],
      lineup: ['有新货可以卖了！点「配货」', '换上更贵的货，赚得更多'], restockall: ['机器多了，点「全部补货」', '一次补满街上所有机器'],
      album: ['图鉴里有奖励可以领！', '点「图鉴」领取'], feed: [`点一下${cat}，送她一包小鱼干`, '猫吃饱了会帮你招客'],
      street2: ['新的街开张了！', '点这里换到新街'], tipTag: '小提示',
    },
    'zh-Hant': {
      hello: '歡迎來到南丁貓街！', helloP: [`我是店長${cat}。這兩台自販機從今天起歸你了。`, '賣貨賺錢 → 買新機器 → 把整條街擺滿。我帶你走一遍，大概兩分鐘。'],
      go: '好，開始', skipAll: '我玩過了，跳過引導', skip: '跳過引導', ok: '知道了',
      enter: ['點這台機器，進去看看', '每台機器賣的東西不一樣'],
      tap: n => ['點機器招呼客人', `每點一下就有人來買一件 · 已賣 ${n}/5`],
      door: ['貨賣完就沒錢賺了，隨時可以補', '點「開門上貨」'],
      load: ['點「全部放入」把貨擺上去', '也可以一件件拖進去'],
      close: ['擺好了，點「✓ 關門」', ''],
      back: ['點左上角「‹ 街」回街上', ''],
      goal: y => ['錢包下面寫著下一個目標', `這塊空地寫著：營業額到 ${y} 就開放，能擺第三台機器`],
      leave: ['機器放著也會自己賣，關掉遊戲也在賣', '過幾個小時回來收錢吧！'],
      'to-street': ['點「‹ 街」回街上繼續', ''], 'to-machine': ['回到機器裡，接著來', '點這台機器'],
      lot: ['有空地了！點它擺一台新機器', ''], upgrade: ['錢夠改造了！點「透視」', '看機器內部，花錢裝零件：賣得更快、更貴'],
      lineup: ['有新貨可以賣了！點「配貨」', '換上更貴的貨，賺得更多'], restockall: ['機器多了，點「全部補貨」', '一次補滿街上所有機器'],
      album: ['圖鑑裡有獎勵可以領！', '點「圖鑑」領取'], feed: [`點一下${cat}，送她一包小魚乾`, '貓吃飽了會幫你招客'],
      street2: ['新的街開張了！', '點這裡換到新街'], tipTag: '小提示',
    },
    ja: {
      hello: 'なんでも通りへようこそ！', helloP: [`店長の${cat}だよ。この2台の自販機は今日から君のもの。`, '売ってお金をためて、新しい自販機を買って、通りをいっぱいにしよう。2分くらいで案内するね。'],
      go: 'はじめる', skipAll: '遊んだことがあるのでスキップ', skip: 'スキップ', ok: 'わかった',
      enter: ['この自販機をタップして、中を見てみよう', '自販機ごとに売り物がちがうよ'],
      tap: n => ['自販機をタップしてお客を呼ぼう', `タップごとに1つ売れるよ · ${n}/5`],
      door: ['売り切れたら稼げない。いつでも補充できるよ', '「扉を開けて補充」をタップ'],
      load: ['「全部入れる」で商品を並べよう', '1つずつドラッグしてもOK'],
      close: ['並べたら「✓ 閉める」', ''],
      back: ['左上の「‹ 通り」で通りに戻ろう', ''],
      goal: y => ['財布の下に次の目標があるよ', `この空き地は売上${y}でオープン。3台目を置けるよ`],
      leave: ['放っておいても、アプリを閉じても売れ続けるよ', '数時間後にまた来てね！'],
      'to-street': ['「‹ 通り」で通りに戻って続けよう', ''], 'to-machine': ['自販機に戻って続けよう', 'この自販機をタップ'],
      lot: ['空き地ができた！タップして自販機を置こう', ''], upgrade: ['改造できるお金がたまった！「透視」をタップ', '中を見て部品をつけよう：もっと速く、もっと高く売れる'],
      lineup: ['新しい商品が入荷！「品ぞろえ」をタップ', '高い商品に替えてもっと稼ごう'], restockall: ['自販機が増えたら「全部補充」', '通りの自販機をまとめて補充'],
      album: ['図鑑でごほうびがもらえるよ！', '「図鑑」をタップ'], feed: [`${cat}をタップして、小魚をあげよう`, 'おなかいっぱいの猫はお客を呼んでくれる'],
      street2: ['新しい通りがオープン！', 'ここをタップして移動'], tipTag: 'ヒント',
    },
    en: {
      hello: 'Welcome to Nandemo Street!', helloP: [`I'm ${cat}, the manager. These two vending machines are yours from today.`, 'Sell, save up, buy more machines and fill the whole street. Let me show you around: about two minutes.'],
      go: "Let's go", skipAll: "I've played before, skip", skip: 'Skip', ok: 'Got it',
      enter: ['Tap this machine to take a look', 'Each machine sells something different'],
      tap: n => ['Tap the machine to call customers', `Every tap sells one · ${n}/5 sold`],
      door: ['No stock, no sales. Restock any time', 'Tap “Open & restock”'],
      load: ['Tap “Load all” to fill the shelves', 'Or drag goods in one by one'],
      close: ['All set: tap “✓ Close”', ''],
      back: ['Tap “‹ Street” at the top left to go back', ''],
      goal: y => ['Your next goal is under the wallet', `This lot opens at ${y} in takings: room for a third machine`],
      leave: ['Machines keep selling on their own, even with the game closed', 'Come back in a few hours!'],
      'to-street': ['Tap “‹ Street” to carry on', ''], 'to-machine': ['Back into the machine to carry on', 'Tap this machine'],
      lot: ['A lot is free! Tap it to place a new machine', ''], upgrade: ['You can afford an upgrade! Tap “X-ray”', 'Fit parts inside: sell faster and for more'],
      lineup: ['New goods to sell! Tap “Lineup”', 'Pricier goods earn more'], restockall: ['More machines now: tap “Restock all”', 'Fills every machine on the street at once'],
      album: ['A reward is waiting in the album!', 'Tap “Album” to claim it'], feed: [`Tap ${cat} and give her some dried fish`, 'A well-fed cat calls customers for you'],
      street2: ['A new street is open!', 'Tap here to go there'], tipTag: 'Tip',
    },
  };
  const L = TXT[code] || TXT[I18N.lang] || TXT.en;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // the hand: a cartoon glove pointing up, the game's ink and outline (drawn, not a typed emoji); its fingertip at 24, 3
  const HAND = '<svg class="tut-hand-svg" viewBox="-3 -3 62 82" aria-hidden="true">'
    // (a cream rim outside the ink: the dark outline alone melts into the night street)
    + '<path d="M18 36V10a6 6 0 0 1 12 0v18a5.2 5.2 0 0 1 10 1.4a4.8 4.8 0 0 1 9 2.6V48c0 9-6 14.5-14 14.5H27c-7 0-11-4-14-9L6.6 43a4.4 4.4 0 0 1 7-5.2L18 43z" fill="none" stroke="#fff6d6" stroke-width="8" stroke-linejoin="round"/><path d="M18.5 61.5h25l1.4 11H17z" fill="none" stroke="#fff6d6" stroke-width="8" stroke-linejoin="round"/>'
    + '<path d="M18 36V10a6 6 0 0 1 12 0v18a5.2 5.2 0 0 1 10 1.4a4.8 4.8 0 0 1 9 2.6V48c0 9-6 14.5-14 14.5H27c-7 0-11-4-14-9L6.6 43a4.4 4.4 0 0 1 7-5.2L18 43z" fill="#fffaf0" stroke="#1d1230" stroke-width="3.2" stroke-linejoin="round"/>'
    + '<path d="M30 28v8M40 29.6v6.4M21 6.8q2.6-1.4 5 0" fill="none" stroke="#1d1230" stroke-width="2.4" stroke-linecap="round"/>'
    + '<path d="M18.5 61.5h25l1.4 11H17z" fill="#ff5d8f" stroke="#1d1230" stroke-width="3.2" stroke-linejoin="round"/>'
    + '<path d="M22 66.6h18" stroke="#1d1230" stroke-width="2" stroke-linecap="round" opacity=".45"/></svg>';
  const face = () => typeof NEKOART !== 'undefined' && NEKOART.face ? `<svg viewBox="-15 -17 30 30" aria-hidden="true">${NEKOART.face('mike')}</svg>` : '';

  const root = document.createElement('div');
  root.id = 'tut'; root.hidden = true;
  root.innerHTML = '<div class="tut-dim"></div><div class="tut-hole"></div><div class="tut-hole"></div>'
    + `<div class="tut-hand"><i class="tut-ring"></i>${HAND}</div><div class="tut-bub" role="status" aria-live="polite"></div><div class="tut-card" hidden></div>`;
  document.body.appendChild(root);
  const dim = root.querySelector('.tut-dim'), holes = [...root.querySelectorAll('.tut-hole')], hand = root.querySelector('.tut-hand'),
    bub = root.querySelector('.tut-bub'), card = root.querySelector('.tut-card');

  let cur = null, key = '', targets = [], posT = 0, lastTipEnd = 0;
  const API = () => window.__NDGUIDE;

  function drawCard() {
    card.innerHTML = `<div class="tut-face big">${face()}</div><h2>${esc(L.hello)}</h2>${L.helloP.map(p => `<p>${esc(p)}</p>`).join('')}`
      + `<button type="button" class="tut-go">${esc(L.go)}</button><button type="button" class="tut-no">${esc(L.skipAll)}</button>`;
  }
  card.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !API()) return;
    if (typeof SND !== 'undefined' && SND.pop) SND.pop();
    if (b.classList.contains('tut-go')) API().done('welcome'); else API().skip();
  });
  bub.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !API() || !cur) return;
    if (typeof SND !== 'undefined' && SND.pop) SND.pop();
    if (b.dataset.a === 'skip') API().skip();
    else if (b.dataset.a === 'ok') { if (cur.tip) endTip(); else API().done(cur.s.id); }
  });
  // a step done by tapping its target (全部放入: the warehouse can run out before the shelves are full); a tip seen
  document.addEventListener('click', e => {
    if (!cur || !API()) return;
    if (!targets.some(t => t && t.contains && t.contains(e.target))) return;
    if (cur.tip) endTip(); else if (cur.s.byTap) API().done(cur.s.id);
  }, true);
  function endTip() { if (cur && cur.tip) { API().tip(cur.s.id); lastTipEnd = performance.now(); } hide(); }

  function hide() { root.hidden = true; cur = null; key = ''; targets = []; clearInterval(posT); posT = 0; }

  function lines(s) {
    const t = L[s.id]; if (!t) return ['', ''];
    const lotAt = () => { try { return UTIL.money(ECON.LOT_AT[2]); } catch (e) { return '¥30,000'; } };
    return typeof t === 'function' ? t(s.id === 'goal' ? lotAt() : s.n ? s.n() : 0) : t;
  }

  function show(step, tip, quiet, view) {
    // a card on top, a door or a slide moving: out of the way for now, back as it was after
    if (quiet) { if (cur) root.hidden = true; return; }
    if (!step && !tip) {
      // a tip gone (another screen) counts as seen; the guide's last step gone: the tips wait a while
      if (cur && cur.tip) endTip(); else if (cur) { lastTipEnd = performance.now(); hide(); }
      return;
    }
    if (tip && !step) {
      if (cur && !cur.tip) { lastTipEnd = performance.now(); hide(); }
      if (cur && cur.tip && cur.s.id !== tip.id) endTip();
      // tips: one at a time, never straight after the guide or another tip
      if (!cur && performance.now() - lastTipEnd < 25000) return;
    }
    const s = step || tip, k = (step ? 'g:' : 't:') + s.id + (s.n ? ':' + s.n() : '');
    if (step && step.card) {
      if (key !== k) { hide(); key = k; cur = { s, tip: false }; drawCard(); }
      root.hidden = false; root.className = 'card'; card.hidden = false; bub.hidden = true; hand.hidden = true; holes.forEach(h => h.hidden = true); dim.hidden = false;
      return;
    }
    card.hidden = true; bub.hidden = false;
    if (key !== k) {
      const fresh = !cur || cur.s.id !== s.id;
      cur = { s, tip: !step }; key = k;
      const [a, b] = lines(s), no = step && step.no ? `<span class="tut-step">${step.no} / 7</span>` : cur.tip ? `<span class="tut-step">${esc(L.tipTag)}</span>` : '';
      const btns = (step && step.ok) || cur.tip ? `<button type="button" class="tut-ok" data-a="ok">${esc(L.ok)}</button>` : '';
      const skip = step && step.id !== 'leave' ? `<button type="button" class="tut-skip" data-a="skip">${esc(L.skip)} ›</button>` : '';
      bub.innerHTML = `<div class="tut-face">${face()}</div><div class="tut-t"><b>${esc(a)}</b>${b ? `<small>${esc(b)}</small>` : ''}</div>`
        + `<div class="tut-foot">${no}${skip}${btns}</div>`;
      if (fresh) { root.classList.remove('in'); void root.offsetWidth; root.classList.add('in'); }
    }
    root.hidden = false;
    root.className = 'in' + (cur.tip ? ' tip' : '') + (s.tap ? ' tapping' : '') + (s.id === 'leave' ? ' plain' : '');
    targets = s.el ? s.el().filter(Boolean) : [];
    place();
    if (!posT) posT = setInterval(place, 250);
  }

  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? r : null; };
  function place() {
    if (!cur || root.hidden || !cur.s) return;
    const W = innerWidth, H = innerHeight, s = cur.s;
    const rs = targets.map(vis).filter(Boolean);
    holes.forEach((h, i) => {
      const r = rs[i]; h.hidden = !r; if (!r) return;
      const pad = 6; h.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + 2 * pad}px;height:${r.height + 2 * pad}px`;
    });
    // with a hole, the hole's shadow is the dim; with none (the tap step, the last line), the plain dim or nothing
    dim.hidden = rs.length > 0 || s.tap || s.id === 'leave';
    let fx, fy, down = false, bubTop = null, bubBottom = null;
    if (s.tap) {
      // the machine up close: its middle (drawn natively in the app, so the screen's middle, not an element)
      const bar = document.getElementById('opendoor'), barTop = bar && vis(bar) ? bar.getBoundingClientRect().top : H - 140;
      fx = W / 2 + 10; fy = H * .46; bubBottom = H - barTop + 44;
    } else if (rs.length) {
      const r = rs[rs.length - 1]; fx = r.left + r.width / 2;
      down = r.bottom + 86 > H;
      fy = down ? r.top + 6 : r.bottom - 6;
      const first = rs[0];
      if (rs.length > 1) bubTop = first.bottom + 18;
      else if (down) bubBottom = H - r.top + 84;
      else if (r.bottom + 86 + 120 < H) bubTop = r.bottom + 82;
      else bubBottom = H - r.top + 18;
    } else { bubTop = null; bubBottom = H * .32; }
    hand.hidden = fx === undefined;
    if (fx !== undefined) { hand.style.left = Math.round(fx) + 'px'; hand.style.top = Math.round(fy) + 'px'; hand.classList.toggle('down', down); }
    bub.style.top = bubTop !== null ? Math.round(bubTop) + 'px' : 'auto';
    bub.style.bottom = bubTop === null && bubBottom !== null ? Math.round(bubBottom) + 'px' : 'auto';
  }
  addEventListener('resize', place);

  /* settings: 重看新手引导, after 语言 (the game draws the sheet again on every switch, so the row goes in each time) */
  const REPLAY = { zh: '重看新手引导', 'zh-Hant': '重看新手引導', ja: 'チュートリアルをもう一度', en: 'Replay the tutorial' }[code] || 'Replay the tutorial';
  const body = document.getElementById('set-body');
  if (body) {
    const add = () => {
      const lang = body.querySelector('[data-act="lang"]');
      if (!lang || body.querySelector('[data-act="nd-tut"]')) return;
      lang.insertAdjacentHTML('afterend', `<button type="button" class="set-row set-btn" data-act="nd-tut"><span>${esc(REPLAY)}</span><b>›</b></button>`);
    };
    new MutationObserver(add).observe(body, { childList: true }); add();
    body.addEventListener('click', e => {
      if (!e.target.closest('[data-act="nd-tut"]') || !API()) return;
      if (typeof SETTINGS !== 'undefined') SETTINGS.close();
      lastTipEnd = 0; hide(); API().replay();
    });
  }

  window.TUT = { show, hide };
})();
