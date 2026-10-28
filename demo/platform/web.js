/* The web build (tools/build_www.py --web, 2026-10-28): the app's page in a plain browser, as a playable demo and the
   base for an H5 or Android version. Loaded after pay.js and before app.js. It stands in for the native shell:
   - a bridge with the iOS shell's name (window.webkit.messageHandlers.nandemo), so platform.js and music.js work as in
     the app; it answers only what a browser can do (music, haptics, the settings' 致谢 / 隐私 / 联系我们)
   - the background music played by an <audio> element from bgm/ (the app's six tracks, the same prefs)
   - no paid content (the owner's pick, 2026-10-28: hidden for now): the catalog's machines, cat and goods are taken
     out of the game's tables before boot, the shop button and 恢复购买 are hidden (web.css)
   The save stays in the browser's localStorage (store.js's default); there is no iCloud, widget or notification. */
(() => {
  // the app's tracks (ios/App/Resources/bgm, copied to bgm/ by the build); names as MusicPlayer.swift shows them
  const FILES = window.__ndWebTracks || [];
  window.__ndMusicTracks = FILES.map(f => f.replace(/\.\w+$/, '').split('-').slice(2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  window.__ndAppVersion = window.__ndAppVersion || 'v1.0';
  window.__ndCloud = false;
  window.__ndTurnPictures = false;   // (the machines turn in the game's own drawing: the pictures are made by the shell)
  window.__ndWeb = true;

  // ---------- paid content out (pay.js ids on machines, cats and goods)
  // (a paid machine's goods go with it: the album counts every kind no machine claims)
  for (let i = MACHINES.length - 1; i >= 0; i--) { const m = MACHINES[i]; if (!m.paid) continue;
    if (m.goods && typeof ECON !== 'undefined' && ECON.GOODS) delete ECON.GOODS[m.goods.kind];
    MACHINES.splice(i, 1); }
  if (typeof NEKO !== 'undefined' && NEKO.CATS) for (let i = NEKO.CATS.length - 1; i >= 0; i--) { const c = NEKO.CATS[i]; if (c.arrive && c.arrive.paid) NEKO.CATS.splice(i, 1); }
  if (typeof ECON !== 'undefined' && ECON.GOODS) Object.values(ECON.GOODS).forEach(l => { for (let i = l.length - 1; i >= 0; i--) if (l[i].paid) l.splice(i, 1); });

  // ---------- the trial (the promo site's build, --web --trial; the owner, 2026-10-28): every machine and cat is there to
  // see (the lot list, the album, 试运转 from the album) but only the first street's four machines can be bought, and
  // only the cats that come early come; four lots, no 全部补货 and no warehouse (its one automatic refill), no second
  // street. The rest says 完整版. A redeem code opens the whole web version (still without paid content). The code is
  // checked in the page against its SHA-256: it keeps ordinary players to the trial; anyone reading the page's code can
  // open it (the whole game is downloaded either way: a static site has nothing to hide it behind)
  const CODES = ['13ca9d112243cb8f149f8524f4dbe327f3de1b0ad1a1d5cfb07ecd086e72f976'];
  const FULL_KEY = 'nandemo-web-full';
  const full = () => { try { return CODES.includes(localStorage.getItem(FULL_KEY)); } catch (e) { return false; } };
  const TRIAL = !!window.__ndWebTrial && !full();
  window.__ndTrial = TRIAL;
  const TRIAL_MACHINES = ['drink', 'spiral', 'cup', 'ramen'], TRIAL_CATS = ['mike', 'kuro', 'chibi'];
  window.__ndTrialOk = id => TRIAL_MACHINES.includes(id);
  if (TRIAL) {
    // (the build's hooks in app.js show the others in the lot list as 完整版 and keep the specials shut)
    const offers = ECON.offers, place = ECON.place;
    ECON.offers = () => offers().filter(id => TRIAL_MACHINES.includes(id));
    ECON.place = (g, id) => TRIAL_MACHINES.includes(id) && place(g, id);
    // the later cats never come (the album says 完整版 under them)
    NEKO.CATS.forEach(c => { if (!TRIAL_CATS.includes(c.id) && c.arrive) c.arrive = { letter: 99, trial: true }; });
    ECON.LOT_AT[4] = Infinity;   // (the fifth lot never opens: the street shows 完整版 on its board)
    ECON.STREETS.splice(1);      // (no second street)
  }
  I18N.add('en', { '试玩版只能买这 4 台机器：饮料、螺旋、杯面、拉面 · 在设置里输入兑换码，可以玩完整版': 'The trial sells four machines: drinks, spiral, cup noodles and ramen. Enter a redeem code in Settings to play the full game', '完整版': 'Full game', '兑换码': 'Redeem code', '输入兑换码': 'Enter code', '兑换': 'Redeem', '兑换码不对，再看一下': 'That code doesn’t work. Check it and try again',
    '已解锁完整网页版': 'Full web version unlocked', '试玩版只开放 4 个机位 · 在设置里输入兑换码，可以玩完整版': 'The trial has four lots. Enter a redeem code in Settings to play the full game',
    '试玩版': 'Trial', '完整网页版': 'Full web version' });
  I18N.add('ja', { '试玩版只能买这 4 台机器：饮料、螺旋、杯面、拉面 · 在设置里输入兑换码，可以玩完整版': '体験版で買えるのはドリンク・スパイラル・カップ麺・ラーメンの 4 台です。設定で引き換えコードを入れると製品版が遊べます', '完整版': '製品版', '兑换码': '引き換えコード', '输入兑换码': 'コードを入力', '兑换': '引き換え', '兑换码不对，再看一下': 'コードが違います。もう一度ご確認ください',
    '已解锁完整网页版': 'Web 製品版が解放されました', '试玩版只开放 4 个机位 · 在设置里输入兑换码，可以玩完整版': '体験版の区画は 4 つまで。設定で引き換えコードを入れると製品版が遊べます',
    '试玩版': '体験版', '完整网页版': 'Web 製品版' });
  I18N.add('zh-Hant', { '试玩版只能买这 4 台机器：饮料、螺旋、杯面、拉面 · 在设置里输入兑换码，可以玩完整版': '試玩版只能買這 4 台機器：飲料、螺旋、杯麵、拉麵 · 在設定裡輸入兌換碼，可以玩完整版', '完整版': '完整版', '兑换码': '兌換碼', '输入兑换码': '輸入兌換碼', '兑换': '兌換', '兑换码不对，再看一下': '兌換碼不對，再看一下',
    '已解锁完整网页版': '已解鎖完整網頁版', '试玩版只开放 4 个机位 · 在设置里输入兑换码，可以玩完整版': '試玩版只開放 4 個機位 · 在設定裡輸入兌換碼，可以玩完整版',
    '试玩版': '試玩版', '完整网页版': '完整網頁版' });
  window.__ndTrialNote = () => T`试玩版只开放 4 个机位 · 在设置里输入兑换码，可以玩完整版`;
  window.__ndTrialLot = () => T`完整版`;
  window.__ndTrialBuy = () => T`试玩版只能买这 4 台机器：饮料、螺旋、杯面、拉面 · 在设置里输入兑换码，可以玩完整版`;
  // the settings: a 兑换码 row above the footer while in the trial, which build of the page this is otherwise
  const hash = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  addEventListener('DOMContentLoaded', () => {
    const body = document.getElementById('set-body'); if (!body || !window.__ndWebTrial) return;
    const add = () => {
      if (body.querySelector('.nd-code')) return;
      const foot = body.querySelector('.set-foot'); if (!foot) return;
      foot.insertAdjacentHTML('beforebegin', TRIAL
        ? `<section class="set-g nd-code"><h4>${T`兑换码`}</h4><div class="set-row"><input type="text" id="nd-code-in" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${T`输入兑换码`}" aria-label="${T`兑换码`}"><button type="button" class="nd-code-go">${T`兑换`}</button></div><p class="nd-code-msg" role="status"></p></section>`
        : `<section class="set-g nd-code"><h4>${T`兑换码`}</h4><div class="set-row"><span>${T`已解锁完整网页版`}</span></div></section>`);
    };
    new MutationObserver(add).observe(body, { childList: true }); add();
    body.addEventListener('click', async e => {
      if (!e.target.closest('.nd-code-go')) return;
      const inp = document.getElementById('nd-code-in'), msg = body.querySelector('.nd-code-msg');
      const h = await hash(String(inp.value).toUpperCase().replace(/[^0-9A-Z]/g, ''));
      if (!CODES.includes(h)) { msg.textContent = T`兑换码不对，再看一下`; return; }
      try { localStorage.setItem(FULL_KEY, h); } catch (err) { /* not kept */ }
      if (window.__ndPause) __ndPause();   // (the save first: the page reloads with the whole game)
      msg.textContent = T`已解锁完整网页版`; setTimeout(() => location.reload(), 900);
    });
  });

  // ---------- music
  const audio = new Audio(); audio.preload = 'auto';
  const M = { on: false, track: 0, volume: .35, repeatOne: false };
  let unlocked = false;
  const src = i => 'bgm/' + FILES[i];
  const play = () => {
    if (!M.on || !unlocked || document.hidden || !FILES.length) { audio.pause(); return; }
    if (!audio.src.endsWith(src(M.track))) audio.src = src(M.track);
    audio.volume = M.volume; audio.loop = M.repeatOne;
    audio.play().catch(() => { /* waits for the next touch */ });
  };
  audio.addEventListener('ended', () => {   // the list plays on
    M.track = (M.track + 1) % FILES.length; play();
    if (window.__ndMusic) __ndMusic.now(M.track);
  });
  // a browser plays sound only after a touch on the page
  const unlock = () => { if (unlocked) return; unlocked = true; play(); };
  addEventListener('pointerdown', unlock, true); addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', play);

  // ---------- the settings' three pages (the app shows them as native sheets)
  const SITE = 'https://michael2221807.github.io/nandemo-go/';
  const LANG = { zh: 'zh-Hans', 'zh-Hant': 'zh-Hant', en: 'en', ja: 'ja' };
  const about = d => {
    const lang = LANG[d && d.lang] || 'en';
    const url = d.page === 'credits' ? 'credits.html?lang=' + lang : SITE + (d.page === 'privacy' ? 'privacy.html' : 'support.html') + '?lang=' + lang;
    window.open(url, '_blank', 'noopener');
  };

  const on = m => {
    const d = m && m.data;
    switch (m && m.type) {
      case 'music': Object.assign(M, { on: !!d.on, track: d.track | 0, volume: +d.volume, repeatOne: !!d.repeatOne }); play(); break;
      case 'haptic': try { if (navigator.vibrate) navigator.vibrate(Math.min(+d || 10, 60)); } catch (e) { /* none */ } break;
      case 'about': about(d || {}); break;
      default: break;   // ready, store, … : nothing to do in a browser
    }
  };
  window.webkit = window.webkit || {};
  window.webkit.messageHandlers = Object.assign(window.webkit.messageHandlers || {}, { nandemo: { postMessage: on } });
})();
