/* The wholesale shop (問屋), designed to ask as little as possible:
   - opening it shows the machine's lineup as a shelf, ONE number (what a full restock earns) and the 自动配货 switch,
     which is on by default (best profit, trends and cats counted, new goods taken up as they unlock);
   - only when you tap a slot does it ask one question — "what goes here?" — with the three best answers,
     one number each (profit per unit); everything else is folded away under 看全部;
   - picking by hand turns 自动配货 off for that machine; one tap turns it back on.
   Nothing costs anything to change: new goods queue behind what is already in the machine. */
const SHOP = (() => {
  const $ = id => document.getElementById(id);
  const K = '#141018', st = (w = 1.5) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let root, m = null, plan = [], auto = true, sel = -1, all = false, start = null, onApply = null;

  /* ---------- little product icons (24 x 24) ---------- */
  // (app build, goods polish: the prototype's icon (icon0) with each good's own marks on top, for the goods drawn
  // here rather than by their machine: the auto machine's toasts, burgers and curries; drinks, the spiral's snacks and
  // trinkets, cup drinks, ramen, juice)
  function icon(kind, g) {
    const ln = (d, col, w, x = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${x}/>`;
    const dots = (pts, r) => pts.map(([x, y]) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`).join('');
    const shine = d => ln(d, '#fff', .9, ' opacity=".55"');
    const AUTO = {
      ham: () => ln('M9 14.4q.9-.6 1.8 0t1.8 0 1.8 0', g.fill, .7),
      cheese: () => `<path d="M9.4 16v1q.5.6 1 0v-1zM13.6 16v1.4q.5.6 1 0V16z" fill="#ffd23f"/>`,
      tamago: () => `<path d="${dots([[10.4, 14.4], [12.4, 13.6], [13.8, 14.6]], .6)}" fill="#ffc93a"/>`,
      pizza: () => `<path d="${dots([[10, 15.6], [13.6, 15.6]], .6)}" fill="#9a1f14"/>` + `<circle cx="12" cy="14" r=".6" fill="none" stroke="#3a9a3a" stroke-width=".5"/>`,
      mentai: () => ln('M8.8 14.6h6.4', '#fff3c0', .8) + `<path d="${dots([[10.4, 15.6], [12.6, 15.6], [14.2, 15.6]], .4)}" fill="#e8455a"/>`,
      burger: () => '', cheeseb: () => `<path d="M7 13.8l1.2 1.8 1.2-1.8zM14.6 13.8l1.2 1.8 1.2-1.8z" fill="#ffcf4a"/>`,
      teriyaki: () => ln('M6 14.8h4.4M12.4 14.8h3', '#c8743a', .6), goldb: () => `<path d="M17.6 4.6l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z" fill="#ffd000" stroke="#141018" stroke-width=".4"/>`,
      curry: () => '', katsu: () => `<path d="M10.4 12.2l1.8-.4.6 6-1.8.4zM12.6 11.9l1.8-.2.4 6-1.8.2z" fill="#d89040" stroke="#141018" stroke-width=".5"/>`,
      wagyu: () => `<path d="${dots([[14.8, 14.2], [16.8, 15.6]], .9)}" fill="#4a1e0a"/>`,
    };
    let s = '';   // (the marks go inside icon0's <svg>)
    if (kind === 'auto') {
      if (g.row === 0) s += ln('M7 16.2L12 8l5 8.2', '#b8742a', .6) + shine('M5.8 16.2l3.4-5.6');
      else if (g.row === 1) s += `<path d="${dots([[8, 8.6], [11, 6.8], [14.2, 7.6], [16.2, 9.8], [10.4, 10.2]], .4)}" fill="#fff8e0"/>` + ln('M4.2 13.9q1-.8 2 0t2 0 2 0 2 0 2 0 2 0 2 0 2 0', '#5ac83a', .9);
      else s += ln('M6.6 14.4l.6.2M8.4 16.6l.6.2M9.6 13.6l.6.2M7.6 15.6l.5.2', '#d8d2c0', .5) + `<path d="${dots([[14.4, 14.2], [16.6, 15.8]], .6)}" fill="#f08a2a"/><path d="${dots([[14.2, 16.6], [17, 14.2]], .55)}" fill="#f2d27a"/>`;
      s += (AUTO[g.id] || (() => ''))();
    }
    // the bottle, shared by drinks and the spiral's default: ridges on the cap, a shine, bubbles
    const bottle = () => ln('M10.6 2.2v2M12 2.2v2M13.4 2.2v2', '#141018', .4, ' opacity=".35"') + shine('M8.8 10.4v8.6') + `<path d="${dots([[14.6, 18.6], [13.8, 19.8], [15, 10.6]], .4)}" fill="#fff" opacity=".7"/>`;
    const SPIRAL = {
      chips: () => `<path d="M9.6 12.6q1.2-2 3.4-1.4q1.6.8.8 2.2q-2 1-4.2-.8z" fill="#f2c43a" stroke="#141018" stroke-width=".5"/>` + shine('M6.8 6.4v11'),
      choco: () => ln('M12 7v5M12 16v5M5.8 18.6h12.4', '#000', .6, ' opacity=".2"') + shine('M7.4 8v3'),
      candy: () => ln('M4.6 8.6v6.8M19.4 8.6v6.8', '#fff', .7, ' opacity=".55"') + ln('M11.4 12.2a.8 .8 0 1 1 .8.8', '#141018', .5, ' opacity=".35"'),
      cup: () => `<path d="M14 5.2l4.4-.4-1.4 2.6z" fill="#fff" stroke="#141018" stroke-width=".5" stroke-linejoin="round"/>` + ln('M8.6 17.6h6.8M9 19.2h5', '#d0c8b8', .6),
      onigiri: () => `<path d="${dots([[9.6, 9.4], [14.4, 9.6], [12, 6.8], [7.4, 13.4], [16.6, 13.2]], .35)}" fill="#c8ccd4"/>` + ln('M9.6 16h4.8', '#2e4436', .6),
      duck: () => ln('M6.4 15.6q2.4 2 5.4.4', '#141018', .7, ' opacity=".45"') + `<circle cx="16.6" cy="10.6" r=".9" fill="#ff8a6a" opacity=".6"/>`,
      umbrella: () => ln('M12 3v8.5M7.8 11.5q1.4-6 4.2-8.5M16.2 11.5q-1.4-6-4.2-8.5', '#141018', .6, ' opacity=".45"'),
      battery: () => shine('M8.2 7.4v11') + ln('M9 18.6h6', '#141018', .6, ' opacity=".35"'),
      cassette: () => ln('M8.2 10.7h1.6M14.2 10.7h1.6M6 16.4h12', '#9aa0aa', .6) + `<path d="${dots([[6, 7.2], [18, 7.2]], .4)}" fill="#9aa0aa"/>`,
      vhs: () => ln('M6 9h7M6 10.6h4.4', '#fff', .7, ' opacity=".6"') + ln('M10 15.7h4', '#3a3e48', .6),
      maneki: () => `<path d="M8.6 5.6l.3-1.6 1.2 1.1zM15.4 5.6l-.3-1.6-1.2 1.1z" fill="#ff9ab8"/>` + ln('M6.4 10.4l2 .4M6.6 11.8l1.8-.2M17.6 10.4l-2 .4M17.4 11.8l-1.8-.2', '#141018', .4, ' opacity=".6"'),
      cookietin: () => `<path d="${dots([[7.8, 13.2], [9, 14], [14.2, 13], [15.2, 14.2]], .35)}" fill="#6a3a1a"/>` + ln('M3.4 10.4h17.2', '#fff', .7, ' opacity=".45"'),
      omiyage: () => `<path d="M12 11.4l-2.2-1.6v3.2zM12 11.4l2.2-1.6v3.2z" fill="#d8102a"/>` + ln('M4 8.4l3 3M4 12.4l3 3M17 8.4l3 3M17 12.4l3 3', '#fff', .6, ' opacity=".4"'),
      plush: () => `<path d="M8.4 5.6l.4-1.8 1.4 1.2zM15.6 5.6l-.4-1.8-1.4 1.2z" fill="#ff9ab8"/><path d="${dots([[8.6, 11.4], [15.4, 11.4]], .8)}" fill="#ff8aa8" opacity=".55"/>` + ln('M11.2 11.6q.8.8 1.6 0', '#141018', .5),
      melonbox: () => shine('M8.4 7.4q1-1.8 2.8-2.4') + `<path d="M13.2 2.4q2.4-1 3.4.6q-2 1.2-3.4-.6z" fill="#5a9a3a"/>`,
    };
    if (kind === 'drink') s += g.kind === 'can' ? `<ellipse cx="12" cy="3.8" rx="1.6" ry=".5" fill="#8a93a4"/>` + shine('M8.4 5.4v14') : bottle();
    else if (kind === 'spiral') s += (SPIRAL[g.g] || bottle)();
    else if (kind === 'ramen') s += `<circle cx="8.4" cy="11" r="1.3" fill="#fff" stroke="#141018" stroke-width=".45"/>` + ln('M8 10.8q.4-.5.8 0t-.4.6', '#ff5fa2', .5) + `<path d="M17.4 7.8l2.2.6-.8 3.2-2.2-.6z" fill="#1e2a20" stroke="#141018" stroke-width=".45"/>`;
    else if (kind === 'juice') s += shine('M8 10.6l.6 9') + `<path d="${dots([[15.6, 8.8], [9.6, 18.6], [14.2, 19.2]], .35)}" fill="#fff" opacity=".8"/>` + shine('M15 15.2q.6-1.4 1.8-1.8') + ln('M13 6l1.6-4.4', '#e8453a', 1.1);
    else if (kind === 'cup') s += g.ice ? ln('M13.6 6.8l1.8-5.2', '#e8453a', 1.1) + shine('M7.6 7v12') : ln('M7.4 17.6h9.4', '#d8cfbe', .6) + shine('M7.8 9.4l.6 8') + `<ellipse cx="12" cy="8" rx="5.6" ry="1.2" fill="#e8dcc8" stroke="#141018" stroke-width=".6"/>`;
    const svg = icon0(kind, g);
    return s ? svg.replace(/<\/svg>$/, s + '</svg>') : svg;
  }
  function icon0(kind, g) {
    const c = g.c ? `var(--${g.c})` : g.liq, cap = g.cap ? `var(--${g.cap})` : '#fff';
    let s = '';
    const bottle = () => `<path d="M10 3.6h4v3.2l2.6 2.4V21H7.4V9.2L10 6.8z" fill="${c}" fill-opacity=".8" ${st()}/><rect x="9.5" y="1.6" width="5" height="3" rx="1" fill="${cap}" ${st(1.1)}/><rect x="7.4" y="12" width="9.2" height="4.4" fill="#fff" opacity=".85"/>`;
    if (kind === 'drink') s = g.kind === 'can' ? `<rect x="6.5" y="4" width="11" height="17" rx="2.6" fill="${c}" ${st()}/><rect x="6.5" y="9" width="11" height="5" fill="#fff" opacity=".85"/><rect x="7.2" y="2.6" width="9.6" height="2.4" rx="1" fill="#c9cfd8" ${st(1.1)}/>` : bottle();
    else if (kind === 'ramen') s = `<path d="M3.6 11.5h16.8q-1.2 8.5-8.4 8.5t-8.4-8.5z" fill="#c8452f" ${st()}/><ellipse cx="12" cy="11.5" rx="8.4" ry="2.4" fill="${g.soup}" ${st(1.1)}/>
      <path d="M6.6 11.4q2.7-1.4 5.4 0t5.4 0" fill="none" stroke="${g.noodle}" stroke-width="1.4" stroke-linecap="round"/><ellipse cx="14.8" cy="10.6" rx="2.6" ry="1.3" fill="${g.top}" ${st(.9)}/>
      <path d="M9 7.6q-1.2-1.8 0-3.6M13 7.6q-1.2-1.8 0-3.6" fill="none" ${st(1.1)}/>`;
    else if (kind === 'digital') s = PKB.icon(g.g, g.fill);
    else if (kind === 'frozen') s = FZB.icon(g.g, g.fill, g.d);
    else if (kind === 'locker') s = LKB.icon(g.g, g.c);
    else if (kind === 'teishoku') s = OBB.icon(g.g, g.c);
    else if (kind === 'sushi') s = SUB.icon(g.g, g.tier);
    else if (kind === 'oden') s = ODB.icon(g.g);
    else if (kind === 'taiyaki') s = TYB.icon(g.dough, g.fill);
    else if (kind === 'kakigori') s = KGB.icon(g.syrup, g.top, g.milk);
    else if (kind === 'gacha') s = GCB.icon(g.cap, g.fig, g.big);
    else if (kind === 'kissa') s = KSB.icon(g);
    else if (kind === 'bakery') s = PBB.icon(g);
    else if (kind === 'teppan') s = TPB.icon(g);
    else if (kind === 'auto') s = g.row === 0 ? `<path d="M3.5 18L12 4.5L20.5 18z" fill="#c9d0da" ${st()}/><path d="M7 16.2L12 8l5 8.2z" fill="#e2a95c"/><path d="M8.4 15.6h7.2" stroke="${g.fill}" stroke-width="1.8"/>`
      : g.row === 1 ? `<path d="M4 12q0-7.5 8-7.5t8 7.5z" fill="#e8a24a" ${st()}/><rect x="3.6" y="12.4" width="16.8" height="1.4" fill="${g.fill}"/><rect x="4" y="14" width="16" height="2.8" rx="1" fill="#6a3a1e"/><rect x="4.4" y="17.2" width="15.2" height="3" rx="1.4" fill="#e8a24a" ${st(1.1)}/>`
      : `<ellipse cx="12" cy="15" rx="9.5" ry="4.4" fill="#f4f1ea" ${st()}/><path d="M4.4 15a7.6 3.2 0 0 0 7.6 3.2v-6.4a7.6 3.2 0 0 0-7.6 3.2z" fill="#fffdf6"/><path d="M12 11.8a7.6 3.2 0 0 1 7.6 3.2a7.6 3.2 0 0 1-7.6 3.2z" fill="${g.fill}"/><path d="M9 9q-1.2-1.8 0-3.6M13 9q-1.2-1.8 0-3.6" fill="none" ${st(1.1)}/>`;
    else if (kind === 'juice') s = `<path d="M6.4 6h10.4l-1.4 15H7.8z" fill="#eef6ff" fill-opacity=".85" ${st()}/><path d="M6.9 10h9.4l-1 11H7.9z" fill="${g.juice}"/><ellipse cx="11.6" cy="6" rx="5.2" ry="1.4" fill="#fff" ${st(1.1)}/>
      <circle cx="17.4" cy="16.8" r="4.2" fill="${g.fruit}" ${st(1.2)}/><path d="M17.4 12.6q1.4-1.8 3-1" fill="none" stroke="#4a8a2a" stroke-width="1.2" stroke-linecap="round"/>`;
    else if (kind === 'cup') s = g.ice ? `<path d="M6 5h12l-1.6 15.5H7.6z" fill="#e4f2ff" fill-opacity=".8" ${st()}/><path d="M6.8 10h10.4l-1 10H7.8z" fill="${c}"/><rect x="9" y="8" width="3" height="3" rx=".6" fill="#fff" ${st(.8)}/><rect x="12.6" y="9.4" width="3" height="3" rx=".6" fill="#fff" ${st(.8)}/>`
      : `<path d="M6 8h12l-1.4 13H7.4z" fill="#f4efe6" ${st()}/><path d="M6.6 12h10.8l-.5 4.4H7.1z" fill="${c}"/><path d="M10 6q-1.4-1.6 0-3.2M14 6q-1.4-1.6 0-3.2" fill="none" ${st(1.2)}/>`;
    else switch (g.g) {
      case 'chips': s = `<path d="M5 4.4l1.75-1.6 1.75 1.6 1.75-1.6 1.75 1.6 1.75-1.6 1.75 1.6 1.75-1.6 1.75 1.6.6 7.6-.6 7.6-1.75 1.6-1.75-1.6-1.75 1.6-1.75-1.6-1.75 1.6-1.75-1.6-1.75 1.6L5 19.6l-.6-7.6z" fill="${c}" ${st()}/><ellipse cx="12" cy="12" rx="4.2" ry="3.4" fill="#fff"/>`; break;
      case 'choco': s = `<rect x="5.5" y="3" width="13" height="18" rx="1.6" fill="${c}" ${st()}/><rect x="5.5" y="3" width="13" height="4" fill="#d9c27a" ${st(1)}/><rect x="5.5" y="12" width="13" height="4" fill="#fff" opacity=".9"/>`; break;
      case 'candy': s = `<path d="M7 9.5L3 6.5v11l4-3zM17 9.5l4-3v11l-4-3z" fill="${c}" ${st()}/><rect x="7" y="7" width="10" height="10" rx="3.5" fill="${c}" ${st()}/><circle cx="12" cy="12" r="2.2" fill="#fff"/>`; break;
      case 'cup': s = `<path d="M5.5 6h13l-1.5 15H7z" fill="#f2ede4" ${st()}/><path d="M6 10.5h12l-.4 4H6.4z" fill="${c}"/><ellipse cx="12" cy="6" rx="6.5" ry="1.8" fill="#e6dfd0" ${st(1.1)}/>`; break;
      case 'onigiri': s = `<path d="M12 3.6l8.4 16H3.6z" fill="#f6f7f9" ${st()}/><rect x="8.6" y="14" width="6.8" height="5.6" fill="#1d2b22"/><circle cx="12" cy="11" r="1.8" fill="${c}"/>`; break;
      case 'duck': s = `<ellipse cx="10.5" cy="15.5" rx="7.6" ry="5" fill="${c}" ${st()}/><circle cx="15" cy="9" r="4.2" fill="${c}" ${st()}/><path d="M18.8 8.6h3.2l-1.4 2.2h-1.8z" fill="#ff9a3c" ${st(1)}/><circle cx="15.8" cy="8.2" r=".9" fill="${K}"/>`; break;
      case 'umbrella': s = `<path d="M3.5 11.5a8.5 8.5 0 0 1 17 0z" fill="${c}" ${st()}/><path d="M12 11.5v7.5q0 2.2-2.2 2.2T7.6 19" fill="none" ${st()}/>`; break;
      case 'battery': s = `<rect x="6" y="5" width="12" height="16" rx="2" fill="${c}" ${st()}/><rect x="9.6" y="2.6" width="4.8" height="2.6" rx=".8" fill="${K}"/><path d="M12 9.4v6M9 12.4h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`; break;
      case 'cassette': s = `<rect x="2.6" y="6" width="18.8" height="12.4" rx="2" fill="#2a2e38" ${st()}/><rect x="4.6" y="8" width="14.8" height="5.4" rx="1" fill="${c}"/><circle cx="9" cy="10.7" r="1.5" fill="${K}"/><circle cx="15" cy="10.7" r="1.5" fill="${K}"/>`; break;
      case 'vhs': s = `<rect x="2.6" y="5" width="18.8" height="14" rx="1.6" fill="#1d2027" ${st()}/><rect x="4.6" y="7" width="14.8" height="5.4" fill="${c}"/><rect x="8" y="14" width="8" height="3.4" rx="1" fill="#0b0d11"/>`; break;
      case 'maneki': s = `<path d="M5.5 21.4q0-8.6 6.5-8.6t6.5 8.6z" fill="#fff" ${st()}/><circle cx="12" cy="9" r="5.2" fill="#fff" ${st()}/><path d="M7.8 6.4l.8-3.8 2.8 2.6zM16.2 6.4l-.8-3.8-2.8 2.6z" fill="#fff" ${st(1.1)}/><path d="M7.4 13.6h9.2" stroke="#ff5a4e" stroke-width="2"/><circle cx="12" cy="15.4" r="1.4" fill="${c === 'var(--ice)' ? '#ffd84a' : c}" ${st(.8)}/><path d="M10 9q1 1 2 0M12 9q1 1 2 0" fill="none" ${st(.9)}/>`; break;
      case 'cookietin': s = `<rect x="3" y="8" width="18" height="11" rx="1.6" fill="${c}" ${st()}/><rect x="2.4" y="5.6" width="19.2" height="3.4" rx="1.2" fill="${c}" ${st(1.2)}/><circle cx="8.4" cy="13.6" r="2" fill="#d8a050" ${st(.8)}/><circle cx="14.6" cy="13.6" r="2" fill="#d8a050" ${st(.8)}/>`; break;
      case 'omiyage': s = `<rect x="2.6" y="6" width="18.8" height="13" rx="1" fill="${c}" ${st()}/><rect x="9" y="6" width="6" height="13" fill="#fbf6ea"/><path d="M9 11.4h6" stroke="#d8102a" stroke-width="1.2"/>`; break;
      case 'plush': s = `<ellipse cx="12" cy="16.6" rx="7" ry="5" fill="${c}" ${st()}/><circle cx="12" cy="9.6" r="5.4" fill="${c}" ${st()}/><path d="M7.4 6.6l.6-4 3 2.6zM16.6 6.6l-.6-4-3 2.6z" fill="${c}" ${st(1.1)}/><circle cx="10" cy="9.6" r=".9" fill="${K}"/><circle cx="14" cy="9.6" r=".9" fill="${K}"/>`; break;
      case 'melonbox': s = `<rect x="3" y="15" width="18" height="5.6" rx=".8" fill="#e8d3a4" ${st()}/><circle cx="12" cy="10" r="6.4" fill="${c}" ${st()}/><path d="M7 8.4q5 2 10 0M6.6 11.6q5.4 2 10.8 0" fill="none" stroke="#f4f0d8" stroke-width=".9"/><path d="M12 3.6V2M10.6 2h2.8" ${st(1.1)}/>`; break;
      default: s = bottle();
    }
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${s}</svg>`;
  }
  const paw = `<svg viewBox="0 0 24 24" class="paw" aria-hidden="true"><ellipse cx="12" cy="15.5" rx="5" ry="4.2"/><circle cx="6.4" cy="9.6" r="2.2"/><circle cx="10" cy="6.4" r="2.2"/><circle cx="14" cy="6.4" r="2.2"/><circle cx="17.6" cy="9.6" r="2.2"/></svg>`;

  /* ---------- drawing ---------- */
  const kind = () => m.goods.kind;
  const prodOf = i => ECON.product(kind(), plan[i]);
  function slotName(i) {
    if (kind() === 'drink') return T`第${i + 1}道`;
    if (kind() === 'cup' || kind() === 'ramen') return T`菜单第${i + 1}格`;
    if (kind() === 'juice') return T`料斗第${i + 1}格`;
    if (kind() === 'digital' || kind() === 'frozen') return T`第${i + 1}层货架`;
    if (kind() === 'locker') return T`第${i + 1}排格子`;
    if (kind() === 'teishoku') return T`食券第${i + 1}格`;
    if (kind() === 'sushi') return T`第${i + 1}号料盒`;
    if (kind() === 'oden') return T`锅的第${i + 1}格`;
    if (kind() === 'taiyaki') return T`第${i + 1}号料斗`;
    if (kind() === 'kakigori') return T`第${i + 1}瓶糖浆`;
    if (kind() === 'gacha') return T`第${i + 1}个扭蛋球`;
    if (kind() === 'kissa') return T`第${i + 1}格豆子`;
    if (kind() === 'bakery') return T`第${i + 1}号料斗`;
    if (kind() === 'teppan') return T`第${i + 1}瓶酱`;
    if (kind() === 'auto') { const r = m.goods.slots[i].row; return r === 0 ? T`吐司第${i + 1}格` : r === 1 ? T`汉堡仓` : T`咖喱站`; }
    return `${ECON.ROW_NAMES[Math.floor(i / 4)]} ${i % 4 + 1}`;
  }
  // the shelf: the lineup as it stands in the machine, tap anything to change it
  function shelf() {
    // drink: one row of five lanes; snacks: four shelves of four; the menu machines: their menu on one row (cup: two rows of three)
    const k = kind(), per = k === 'spiral' ? 4 : k === 'cup' ? 3 : k === 'drink' ? 5 : plan.length, rows = Math.ceil(plan.length / per), named = k !== 'spiral';
    let h = '';
    for (let r = 0; r < rows; r++) {
      // on the snack shelves a cat likes a whole shelf: its paw goes on the shelf's name, not on every item
      const rowCat = k === 'spiral' && Array.from({ length: per }, (_, c) => ECON.quote(k, prodOf(r * per + c)).cat).some(Boolean);
      h += `<div class="sh-row">${k === 'spiral' ? `<i>${ECON.ROW_NAMES[r]}${rowCat ? paw : ''}</i>` : ''}`;
      for (let c = 0; c < per && r * per + c < plan.length; c++) { const i = r * per + c, g = prodOf(i), q = ECON.quote(k, g);
        if (m.goods.slots[i].cap === 0) { h += `<span class="sh-slot sh-joined" aria-hidden="true"><small>${T`并进左边`}</small></span>`; continue; }
        h += `<button type="button" class="sh-slot${i === sel ? ' on' : ''}" data-slot="${i}" aria-label="${T`${slotName(i)}：${g.name}，点一下换`}">${icon(k, g)}`
          + (q.trend ? `<b class="tag-hot">${T`热`}</b>` : '') + (q.cat && k !== 'spiral' ? `<b class="tag-cat">${paw}</b>` : '')
          + (named ? `<small>${g.name}</small>` : '') + '</button>'; }
      h += '</div>';
    }
    return h;
  }
  // one question: what goes in this slot? three best answers first, the rest folded away
  function picker() {
    const k = kind(), list = ECON.candidates(m, sel), cur = plan[sel], nx = ECON.nextTier(m);
    const card = g => { const q = ECON.quote(k, g, ECON.stepOf()), on = g.id === cur, elsewhere = !on ? plan.indexOf(g.id) : -1;
      return `<button type="button" class="sh-cand${on ? ' on' : ''}" data-id="${g.id}">${icon(k, g)}
        <span class="nm">${g.name}${q.trend ? `<i class="hot">${T`热销`}</i>` : ''}${q.cat ? `<i class="cat">${paw}${q.cat}</i>` : ''}${on ? `<i class="now">${T`现在`}</i>` : ''}${elsewhere >= 0 ? `<i class="away">${T`在${slotName(elsewhere)}`}</i>` : ''}</span>
        <span class="px">${T`进 ${UTIL.money(q.buy)} · 卖 ${UTIL.money(q.sell)}`}</span><b class="gain">${T`赚 ${UTIL.money(q.gain)}`}</b></button>`; };
    const top = list.slice(0, 3), rest = list.slice(3);
    return `<p class="sh-q">${T`<b>${slotName(sel)}</b> 现在是 ${ECON.product(k, cur).name}，换成什么？`}</p>
      <div class="sh-cands">${top.map(card).join('')}</div>
      ${rest.length ? (all ? `<div class="sh-cands sh-rest">${rest.map(card).join('')}</div>` : `<button type="button" class="sh-more" data-more="1">${T`还有 ${rest.length} 种 ▾`}</button>`) : ''}
      <p class="sh-legend"><i class="hot">${T`热销`}</i> ${T`本周多卖五成`}　${T`每样货只摆一个位置，选了别处在卖的会互换`}</p>
      ${nx ? `<p class="sh-next">${T`${'★'.repeat(nx.tier)} 这台再卖 ${nx.units} 件，再上 ${nx.count} 种新货`}</p>` : ''}`;
  }
  function render() {
    const k = kind(), tot = ECON.totals(m, plan), d = tot.gain - start.gain;
    $('sh-name').textContent = m.brand; $('sh-bank').textContent = UTIL.money(ECON.bank);
    const sw = $('sh-auto'); sw.setAttribute('aria-checked', auto); sw.classList.toggle('on', auto);
    $('sh-mode-d').textContent = auto ? T`一直挑最赚的货，热销也算进去，有新货也会自动换上。` : T`按你挑的卖，以后补货都照这个。`;
    $('sh-shelf').innerHTML = shelf(); $('sh-shelf').className = 'sh-shelf ' + k;
    $('sh-earn').textContent = UTIL.money(tot.gain);
    // the price step: what the slots were last bought at, and when the next one opens (every product ×10)
    const st = ECON.stepOf(), nx = st + 1 < ECON.NSTEP ? ECON.stepLine(st + 1) : 0;
    $('sh-step').innerHTML = `${T`进货档位 <b>${ECON.stepName(st)}</b>`}` + (nx ? T` · 累计营业额到 ${UTIL.money(nx)} 升到 ${ECON.stepName(st + 1)}（所有货 ×${ECON.stepX(st + 1)}）` : '');
    $('sh-delta').textContent = Math.abs(d) >= 1 ? `${d > 0 ? '+' : '−'}${UTIL.money(Math.abs(d))}` : '';
    $('sh-delta').className = d > 0 ? 'up' : 'down';
    // hand-picked and the automatic lineup earns clearly more: offer it, once, in one line
    const best = ECON.totals(m, ECON.auto(m)).gain, tip = $('sh-tip');
    tip.hidden = auto || best <= tot.gain * 1.03;
    if (!tip.hidden) tip.innerHTML = `${T`交给自动配货，每次多赚 <b>${UTIL.money(best - tot.gain)}</b>`}<span>${T`交给自动`}</span>`;
    const pk = $('sh-picker'); pk.hidden = sel < 0; if (sel >= 0) pk.innerHTML = picker();
    $('sh-hint').hidden = sel >= 0;
  }
  function init() {
    root = $('shop');
    root.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) { if (e.target === root) close(); return; }
      if (t.dataset.slot !== undefined) { const i = +t.dataset.slot; sel = sel === i ? -1 : i; all = false; SND.tick(i % 9); render(); if (sel >= 0) setTimeout(() => $('sh-picker').scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30); return; }
      if (t.dataset.more) { all = true; render(); return; }
      if (t.dataset.id) {
        const id = t.dataset.id;
        if (plan[sel] !== id) {
          // one place per product in a machine: taking it from another slot swaps the two
          const other = plan.indexOf(id); if (other >= 0) plan[other] = plan[sel];
          plan[sel] = id; auto = false; SND.pick(); UTIL.haptic(5);
        }
        sel = -1; render(); return;
      }
      if (t.id === 'sh-auto') { auto = !auto; if (auto) plan = ECON.auto(m); sel = -1; SND.switchOn(); render(); return; }
      if (t.id === 'sh-tip') { auto = true; plan = ECON.auto(m); sel = -1; SND.chime(); UTIL.haptic([8, 30, 8]); render(); return; }
      if (t.id === 'sh-ok') { done(); return; }
      if (t.id === 'sh-x') close();
    });
  }
  function done() {
    const was = ECON.isAuto(m), same = auto === was && plan.every((id, i) => id === start.plan[i]), f = onApply, res = { auto, plan: plan.slice() };
    close(); if (!same && f) f(res);
  }
  function open(machine, opts = {}) {
    m = machine; auto = ECON.isAuto(m); plan = ECON.planOf(m); sel = -1; all = false; onApply = opts.onApply || null;
    start = { plan: plan.slice(), gain: ECON.totals(m, plan).gain };
    root.hidden = false; render(); SND.pop();
  }
  function close() { root.hidden = true; m = null; }
  return { init, open, close, icon, get isOpen() { return !!m; } };
})();
