/* The album sheet on the street, five sections (2026-10-16):
     商品  the goods, one page per machine named by what it sells (飲料, 零食杂货…: brand names said nothing); collected
           the first time they sell, tap one for its card
     系列  finish a set, claim its decoration
     机器  every machine, with three lines of its real history, its parts, and a test run (试运转) of any machine
     猫    every cat: where it is in your story, and its knack in full once it has worked (the cat card shows one number)
     装扮  dress the shop cat, stickers and the lucky cat on machines
   Keeps to one thing at a time: a grid to look at, one button where there is something to do. */
const ALBUM = (() => {
  const $ = id => document.getElementById(id), K = '#141018';
  const st = (w = 1.5) => `stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  let ids = [], names = [], sec = 'goods', kind = null, onChange = () => {}, catInfo = () => ({ line: '', detail: '' }), gearOf = () => ({});

  /* ---------- decoration icons (24 x 24) ---------- */
  function decorIcon(d, size = 24) {
    const c = d.c; let s = '';
    if (d.id.startsWith('st-nk-') && typeof NEKOART !== 'undefined') s = `<circle cx="12" cy="12" r="10.6" fill="#ffe1ec" ${st()}/><g transform="translate(12 13.2) scale(.78)">${NEKOART.face(d.id.slice(6))}</g>`;
    else switch (d.id) {
      case 'scarf-red': case 'scarf-brown': case 'scarf-star':
        s = `<path d="M3 9q9 5 18 0v4q-9 5-18 0z" fill="${c}" ${st()}/><path d="M14 13l2 8 4-1-2-8z" fill="${c}" ${st()}/>` + (d.id === 'scarf-star' ? `<path d="M8 11.4l.6 1.2 1.3.1-1 .9.3 1.3-1.2-.7-1.1.7.3-1.3-1-.9 1.3-.1z" fill="#ffe14a"/>` : `<path d="M6 11.2h12" stroke="#fff" stroke-width="1" opacity=".5"/>`); break;
      case 'maneki': s = `<g transform="translate(12 22.4) scale(.78)">${NEKOART.maneki(1.7)}</g>`; break;
      case 'bell': s = `<path d="M5 8q7 4 14 0" fill="none" stroke="#ff5a6a" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15" r="5.4" fill="${c}" ${st()}/><path d="M8 15h8M12 17.6v2" ${st(1.2)}/>`; break;
      case 'crown': s = `<path d="M4 18l1-10 4.5 4.5L12 5l2.5 7.5L19 8l1 10z" fill="${c}" ${st()}/><circle cx="12" cy="14.5" r="1.6" fill="#ff4f8b"/>`; break;
      case 'candy-clip': s = `<path d="M8 10L3.5 7v10L8 14zM16 10l4.5-3v10L16 14z" fill="${c}" ${st()}/><rect x="8" y="8" width="8" height="8" rx="3" fill="${c}" ${st()}/><circle cx="12" cy="12" r="1.8" fill="#fff"/>`; break;
      case 'chef-hat': s = `<path d="M7 15q-4-1-3-5t5-3q1-4 3-4t3 4q4-1 5 3t-3 5z" fill="#fff" ${st()}/><rect x="7" y="15" width="10" height="5" rx="1" fill="#fff" ${st()}/>`; break;
      case 'knit-hat': s = `<path d="M5 17q0-10 7-10t7 10z" fill="${c}" ${st()}/><rect x="4" y="16" width="16" height="4" rx="2" fill="#fff" ${st()}/><circle cx="12" cy="5.5" r="2.6" fill="#fff" ${st()}/>`; break;
      case 'socks-white': case 'socks-gold': s = `<path d="M6 3h5v10q0 3 3 3h1v4H9q-3 0-3-3z" fill="${c}" ${st()}/><path d="M6 6h5" ${st(1.2)}/><path d="M14 8h4v8h-4z" fill="none"/>`; break;
      case 'boots-rain': s = `<path d="M6 3h6v11l6 2q2 1 2 3v1H6z" fill="${c}" ${st()}/><path d="M6 17h14" ${st(1.2)}/>`; break;
      case 'st-star': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><path d="M12 5l2 4.4 4.8.5-3.6 3.2 1 4.7-4.2-2.4-4.2 2.4 1-4.7-3.6-3.2 4.8-.5z" fill="${c}" ${st(1.2)}/>`; break;
      case 'st-chips': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><path d="M7 7l1.3-1.2 1.3 1.2 1.3-1.2 1.3 1.2 1.3-1.2 1.3 1.2 1.3-1.2.4 5.2-.4 5.2-1.3 1.2-1.3-1.2-1.3 1.2-1.3-1.2-1.3 1.2-1.3-1.2-1.3 1.2-.4-5.2z" fill="${c}" ${st(1.2)}/><ellipse cx="12" cy="12" rx="2.6" ry="2.2" fill="#fff"/>`; break;
      case 'st-onigiri': s = `<circle cx="12" cy="12" r="10" fill="#a8e6cf" ${st()}/><path d="M12 5l6.6 12H5.4z" fill="#fff" ${st(1.2)}/><rect x="9.4" y="13" width="5.2" height="4" fill="#1d2b22"/>`; break;
      case 'st-duck': s = `<circle cx="12" cy="12" r="10" fill="#3fb8ff" ${st()}/><ellipse cx="10.5" cy="14.5" rx="5.6" ry="3.6" fill="${c}" ${st(1.2)}/><circle cx="14.2" cy="9.6" r="3" fill="${c}" ${st(1.2)}/><path d="M17 9.4h2.4l-1 1.6h-1.4z" fill="#ff9a3c"/>`; break;
      case 'st-latte': s = `<circle cx="12" cy="12" r="10" fill="#fff8ec" ${st()}/><circle cx="12" cy="12" r="6.6" fill="${c}" ${st(1.2)}/><path d="M12 15.6q-4-3-2.4-5.6q1.4-1.6 2.4.4q1-2 2.4-.4q1.6 2.6-2.4 5.6z" fill="#fff8ec"/>`; break;
      case 'st-naruto': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><path d="M6.4 14.6l-1-1.4 1-1.4-1-1.4 1-1.4M17.6 9.4l1 1.4-1 1.4 1 1.4-1 1.4" fill="none" ${st(1)}/><path d="M12 12a1.2 1.2 0 1 1 1.2 1.2a2.6 2.6 0 1 1-2.6-2.6a4 4 0 1 1 4 4" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`; break;
      case 'st-orange': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><circle cx="12" cy="12" r="7" fill="${c}" ${st(1.2)}/><circle cx="12" cy="12" r="5.3" fill="#ffd27a"/><path d="M12 6.8v10.4M6.8 12h10.4M8.3 8.3l7.4 7.4M15.7 8.3l-7.4 7.4" stroke="${c}" stroke-width="1.1"/>`; break;
      case 'st-toast': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><path d="M5.6 16.4L12 5.6l6.4 10.8z" fill="#c9d0da" ${st(1.1)}/><path d="M8 15L12 8.4l4 6.6z" fill="${c}"/><path d="M9.6 13.4l2.4-1.2M11.2 11.4l2-1" stroke="#8a5a2a" stroke-width=".9"/>`; break;
      case 'st-retro': s = `<rect x="2.5" y="5" width="19" height="11.5" rx="2" fill="#2a2016" ${st()}/><text x="12" y="12.9" font-size="5" text-anchor="middle" fill="${c}" font-weight="700" font-family="sans-serif">AUTO</text><path d="M6.5 16.5v3.5M17.5 16.5v3.5" ${st(1.3)}/><path d="M4.5 7.4h15" stroke="${c}" stroke-width=".8" opacity=".6"/>`; break;
      case 'st-chip': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/>${[8.6, 11, 13.4, 15.8].map(v => `<path d="M${v} 5.6v2M${v} 16.4v2M5.6 ${v}h2M16.4 ${v}h2" stroke="#9aa6b8" stroke-width="1.1"/>`).join('')}<rect x="7.4" y="7.4" width="9.2" height="9.2" rx="1" fill="#141018"/><circle cx="9.4" cy="9.4" r=".9" fill="${c}"/>`; break;
      case 'st-snow': s = `<circle cx="12" cy="12" r="10" fill="#2a6ad9" ${st()}/>${[0, 60, 120].map(a => `<path d="M12 4.6V19.4M12 6.6l-1.8-1.6M12 6.6l1.8-1.6M12 17.4l-1.8 1.6M12 17.4l1.8 1.6" transform="rotate(${a} 12 12)" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`).join('')}`; break;
      case 'st-noodle': s = `<circle cx="12" cy="12" r="10" fill="#fff8ec" ${st()}/><path d="M5 11h14q-1 7-7 7t-7-7z" fill="${c}" ${st(1.1)}/><ellipse cx="12" cy="11" rx="7" ry="1.8" fill="#c98a4b"/><path d="M8 10.6q2-1.2 4 0t4 0" fill="none" stroke="#f3d27a" stroke-width="1.1"/><path d="M15 9l3-5M16.6 9.4l3-5" stroke="#8a5a32" stroke-width=".9"/>`; break;
      case 'st-egg': s = `<circle cx="12" cy="12" r="10" fill="#7ac0ff" ${st()}/><ellipse cx="12" cy="13" rx="5.6" ry="7" fill="#fbf8f0" ${st(1.1)}/><circle cx="12" cy="14.6" r="2.6" fill="${c}"/><path d="M9.6 9.4q1-1.6 2.4-1.8" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`; break;
      case 'st-kissa': s = `<circle cx="12" cy="12" r="10" fill="#f4e6c8" ${st()}/><g transform="translate(1.2 1.4) scale(.9)">${KSB.icon({ ves: 'cup', drink: '#4a2814', pat: 1, fin: [] })}</g>`; break;
      case 'st-gacha': s = `<circle cx="12" cy="12" r="10" fill="#fff0f6" ${st()}/><g transform="translate(1.2 1.2) scale(.9)">${GCB.icon('#ff5fa2', 'neko', false)}</g>`; break;
      case 'st-kakigori': s = `<circle cx="12" cy="12" r="10" fill="#e8f6ff" ${st()}/><g transform="translate(0 .4)">${KGB.icon('#e83a4a', null, false)}</g>`; break;
      case 'st-taiyaki': s = `<circle cx="12" cy="12" r="10" fill="#fff4dc" ${st()}/><g transform="translate(0 .2)">${TYB.icon('plain', '#6a2a2a')}</g>`; break;
      case 'st-oden': s = `<circle cx="12" cy="12" r="10" fill="#fff4dc" ${st()}/><g transform="translate(0 .4)">${ODB.icon('tamago')}</g>`; break;
      case 'st-sushi': s = `<circle cx="12" cy="12" r="10" fill="#fff4dc" ${st()}/><g transform="translate(0 1)">${SUB.icon('salmon', 4)}</g>`; break;
      case 'st-tray': s = `<circle cx="12" cy="12" r="10" fill="#fff4dc" ${st()}/><rect x="4" y="7.4" width="16" height="10.4" rx="1.8" fill="${c}" ${st(1.1)}/><circle cx="8.4" cy="13.6" r="2.4" fill="#fff" ${st(.8)}/><circle cx="14.6" cy="13.8" r="2.4" fill="#c8964a" ${st(.8)}/><ellipse cx="11.6" cy="9.8" rx="3" ry="1.4" fill="#f08a6a"/>`; break;
      case 'tencho': s = `<path d="M5 7q7 6 14 0" fill="none" stroke="#ff5a6a" stroke-width="1.8" stroke-linecap="round"/><rect x="5" y="10" width="14" height="9.4" rx="1.6" fill="${c}" ${st()}/><text x="12" y="16.9" font-size="5.4" text-anchor="middle" font-weight="700" fill="#5a3a1a" font-family="'ND Sans',sans-serif">店長</text>`; break;
      case 'st-paw': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><ellipse cx="12" cy="14.6" rx="4.2" ry="3.4" fill="${c}" ${st(1.1)}/>${[[7.4, 10.4], [10.4, 7.6], [13.6, 7.6], [16.6, 10.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${c}" ${st(1)}/>`).join('')}`; break;
      case 'st-sakura': s = `<circle cx="12" cy="12" r="10" fill="${c}" ${st()}/><path d="M7 18l1.6-11.6 3 3.6 1.4-2 4 10z" fill="#fffdf8" ${st(1.2)}/><path d="M9 15.6l.8-5.6 4.4 5.6z" fill="#ffb3c8"/>`; break;
      case 'st-catcan': s = `<circle cx="12" cy="12" r="10" fill="#fff" ${st()}/><path d="M6.6 9v7.4q0 2 5.4 2t5.4-2V9" fill="${c}" ${st(1.1)}/><ellipse cx="12" cy="9" rx="5.4" ry="1.8" fill="#ffeab8" ${st(1.1)}/><path d="M9 13.4q2-1.8 4 0l1.6-1v2.2l-1.6-1q-2 1.8-4 0z" fill="#fff" ${st(.8)}/>`; break;
      case 'st-fish': s = `<circle cx="12" cy="12" r="10" fill="#2a6ad9" ${st()}/><path d="M5 12h12M8 9.6v4.8M10.6 9v6M13.2 9.6v4.8M17 12l2.6-2.6v5.2z" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="12" r="1.6" fill="#fff"/>`; break;
      default: s = `<circle cx="12" cy="12" r="9" fill="${c}" ${st()}/>`;
    }
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${s}</svg>`;
  }

  /* ---------- the shop cat, sitting, wearing its gear (for the wardrobe page) ---------- */
  function catPreview(gear) {
    const g = id => id && COLLECT.decor(id);
    const neck = g(gear.neck), head = g(gear.head), feet = g(gear.feet);
    let s = `<ellipse cx="60" cy="104" rx="34" ry="6" fill="#000" opacity=".12"/>
      <path d="M80 92q24 4 20-22" fill="none" stroke="#141018" stroke-width="7.6" stroke-linecap="round"/><path d="M80 92q24 4 20-22" fill="none" stroke="#fffdf8" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M93 92.6q5-1.6 6.6-6.4" fill="none" stroke="#ffac5a" stroke-width="4.4"/><path d="M100.6 76q.6-3.2-.6-6" fill="none" stroke="#5b4752" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M36 100q-6-44 24-48q30 4 24 48z" fill="#fffdf8" ${st(2.6)}/><path d="M40 80q8-10 18-6q-4 10-18 6z" fill="#ffb877"/><path d="M68 66q8 0 12 8q-8 2-12-8z" fill="#5b4a52"/>
      <path d="M41 30l1.4-17 3.8 4.6 2.4-3.4 8.4 8.8z" fill="#fffdf8" ${st(2.4)}/><path d="M79 30l-3-17-13 10z" fill="#ffac5a" ${st(2.4)}/>
      <path d="M45.2 25.6l.8-7 4.6 4.6zM74.6 25.4l-1.6-8-5.8 4.6z" fill="#ffa3ba"/>
      <circle cx="60" cy="40" r="22" fill="#fffdf8" ${st(2.6)}/><path d="M63.5 18.6q9 1.6 14.2 10.8q2 4.4 1.6 7.4q-6-2.4-9-6.6q-4.4-5-6.8-11.6z" fill="#ffac5a"/>
      <path d="M66 22q3 5 9 8.6" fill="none" stroke="#df7d34" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M49.5 40.6q2.7 3 5.4 0M65.1 40.6q2.7 3 5.4 0M49.5 40.6l-1.5-.9M70.5 40.6l1.5-.9" fill="none" ${st(2)}/>
      <path d="M58.6 44.6h2.8l-1.4 1.6z" fill="#ff7f9a" ${st(.9)}/><path d="M56.6 47.4q1.7 2.3 3.4.2q1.7 2.1 3.4-.2" fill="none" ${st(1.6)}/>
      <ellipse cx="46.8" cy="46.6" rx="3.6" ry="2.1" fill="#ffb3c8"/><ellipse cx="73.2" cy="46.6" rx="3.6" ry="2.1" fill="#ffb3c8"/>
      <path d="M44.6 48l1.4-2.4M46.6 48.3l1.4-2.4M48.6 48l1.3-2.2M71.4 48l1.4-2.4M73.4 48.3l1.4-2.4M75.4 48l1.3-2.2" stroke="#ff6f92" stroke-width="1" stroke-linecap="round"/>
      <path d="M42 46.4l-12-2.6M42 49.4l-11.4 1.8M78 46.4l12-2.6M78 49.4l11.4 1.8" fill="none" ${st(1.1)}/>`;
    // front paws, in socks or boots when worn
    const paw = x => feet ? (feet.id === 'boots-rain' ? `<path d="M${x - 6} 90v12h13v-4q0-3-4-3h-3v-5z" fill="${feet.c}" ${st(2)}/>` : `<rect x="${x - 6}" y="88" width="12" height="14" rx="5" fill="${feet.c}" ${st(2)}/><path d="M${x - 6} 92h12" ${st(1.2)}/>`)
      : `<ellipse cx="${x}" cy="99" rx="6" ry="4.4" fill="#fffdf8" ${st(2)}/>`;
    s += paw(52) + paw(68);
    if (neck && neck.id === 'tencho') s += `<path d="M43 57q17 9 34 0" fill="none" stroke="#ff5a6a" stroke-width="2.4" stroke-linecap="round"/><rect x="50" y="61" width="20" height="13" rx="2" fill="${neck.c}" ${st(2)}/><text x="60" y="70.8" font-size="7" text-anchor="middle" font-weight="700" fill="#5a3a1a" font-family="'ND Sans',sans-serif">店長</text>`;
    else if (neck) s += neck.id === 'bell' ? `<path d="M42 58q18 9 36 0" fill="none" stroke="#ff5a6a" stroke-width="4" stroke-linecap="round"/><circle cx="60" cy="66" r="6" fill="${neck.c}" ${st(2)}/><path d="M55 66h10" ${st(1.4)}/>`
      : `<path d="M40 56q20 10 40 0v6q-20 10-40 0z" fill="${neck.c}" ${st(2.2)}/><path d="M66 63l4 16 7-2-4-15z" fill="${neck.c}" ${st(2)}/>` + (neck.id === 'scarf-star' ? `<path d="M50 61l1 2 2 .2-1.6 1.4.5 2.1-1.9-1.1-1.9 1.1.5-2.1-1.6-1.4 2-.2z" fill="#ffe14a"/><path d="M71 70l.8 1.6 1.7.2-1.3 1.1.4 1.7-1.6-.9-1.5.9.4-1.7-1.3-1.1 1.7-.2z" fill="#ffe14a"/>` : '');
    if (head) s += head.id === 'crown' ? `<path d="M48 22l2-14 6 7 4-10 4 10 6-7 2 14z" fill="${head.c}" ${st(2.2)}/><circle cx="60" cy="17" r="2" fill="#ff4f8b"/>`
      : head.id === 'candy-clip' ? `<g transform="translate(70 20) rotate(-20)"><path d="M-4 -2l-5-3v10l5-3zM4 -2l5-3v10l5-3z" fill="${head.c}" ${st(1.6)}/><rect x="-4" y="-4" width="8" height="8" rx="3" fill="${head.c}" ${st(1.6)}/></g>`
      : head.id === 'chef-hat' ? `<path d="M46 24q-6-2-4-9t9-5q2-7 9-7t9 7q7-2 9 5t-4 9z" fill="#fff" ${st(2.2)}/><rect x="46" y="22" width="28" height="7" rx="2" fill="#fff" ${st(2)}/>`
      : `<path d="M41 30q0-22 19-22t19 22z" fill="${head.c}" ${st(2.2)}/><rect x="39" y="26" width="42" height="8" rx="4" fill="#fff" ${st(2)}/><circle cx="60" cy="7" r="5" fill="#fff" ${st(2)}/>`;
    return `<svg viewBox="0 0 120 112" aria-label="${T`穿着装扮的看板猫`}">${s}</svg>`;
  }

  /* ---------- pages ---------- */
  const stars = t => '★'.repeat(t), NEW = `<i class="al-new" aria-label="${T`新`}">NEW</i>`;
  const SELLS = { drink: T`饮料`, spiral: T`零食杂货`, cup: T`咖啡`, ramen: T`面`, juice: T`果汁`, auto: T`快餐`, digital: T`数码`, frozen: T`冷冻`, locker: T`农产`, sushi: T`寿司`, oden: T`关东煮`, taiyaki: T`鲷鱼烧`, kakigori: T`刨冰`, gacha: T`扭蛋`, kissa: T`咖啡`, teishoku: T`定食`, bakery: T`面包`, teppan: T`铁板粉物` };
  const FACTS = {
    drink: [T`日本街头最常见的一种：罐子横躺在 S 形货道里，靠重力一罐罐滚下来。`, T`出口有两个挡块轮流动作，一次只放一罐。`, T`同一道货夏天卖冰的、冬天卖热的，靠的是热泵。`],
    spiral: [T`弹簧转一圈，最前面那件就被推下货架。`, T`什么都能卖：零食、雨伞、电池，甚至录像带。`, T`讲究的机型有升降台接住商品，不用摔。`],
    cup: [T`一杯一杯现冲：落杯、加粉、注热水、搅拌。`, T`机器里有自己的锅炉和制冰机。`, T`做的时候，小窗里看得见杯子转到每一站。`],
    ramen: [T`1972 年川鉄推出面类自动调理贩卖机，到 1980 年约有 9000 台。`, T`早已停产，现存的靠店主拆同型机的零件维持，群马、秋田还在用。`, T`注热水、甩干、浇出汁，辉光管倒数约 25 秒出一碗。`],
    juice: [T`IJOOZ 这类鲜榨机，在日本约有 1300～1750 台。`, T`一杯用 4 个橙子：滚下、对半切、压榨、过筛，约 40 秒。`, T`玻璃后面堆着几百个橙子，本身就是招牌。`],
    auto: [T`1970 年代给卡车司机开的 24 小时无人「オートレストラン」。`, T`吐司机从 1975 年起造了约 300 台，现存约 16 台；汉堡机还有约 29 台在跑。`, T`按下按钮，25～60 秒后热乎乎地掉出来。`],
    digital: [T`2014 年羽田机场就有卖充电宝、耳机、SD 卡的配件机。`, T`JR 东日本的 acure 用 47 英寸触屏代替样品和按钮。`, T`机器人拣货正在走进自贩机和小店。`],
    frozen: [T`サンデン的「ど冷えもん」2021 年发售，几年就超过 5000 台。`, T`库内 -18～-25℃，组合货架最多放 11 种、308 件。`, T`会定期除霜，过了保质期的商品自动停售。`],
    locker: [T`东京练马区被叫作「野菜自販機銀座」，2018 年至少 31 户农家在用。`, T`老式的投 100 日元开一格小门，不找零。`, T`神户的鸡蛋自贩机，一天换三次蛋。`],
    kissa: [T`「纯喫茶」原本是和有女招待陪酒的「特殊喫茶」区分开来的叫法：只卖咖啡和简餐，不卖酒。`, T`虹吸壶在大正年间传进日本，1960～70 年代的纯喫茶几乎家家都有，吧台上一排玻璃壶是招牌风景。`, T`这台是虚构的：下壶底下多了一个阀门，煮好的咖啡直接流进下面的杯子；杯子坐在传送带上一站一站走，没有机械臂。`],
    gacha: [T`扭蛋（ガチャガチャ）1965 年从美国引进日本，最早投一枚 10 日元转一次。`, T`扭蛋机大多不用电：投币后转动把手，里面的星形转盘带着一颗扭蛋转到出口落下来。`, T`这台是虚构的：四个扭蛋球各有一个电动转盘，扭蛋沿洞洞板上的锯齿滑道一层层滚下来，没有机械臂。`],
    kakigori: [T`刨冰在日本很早就有记载：清少纳言在《枕草子》里写过，削下来的冰浇上甘葛的甜汁，盛在新的金属碗里，是「雅致的东西」。`, T`店门口白底红字的「氷」旗叫「氷旗」，下面的蓝色波浪和红色千鸟（小鸟）都是夏天的记号。`, T`这台是虚构的：压板按着冰块在刀盘上转，杯子坐在剪刀升降台上沿导轨一站一站走，没有机械臂。`],
    taiyaki: [T`鲷鱼烧一般认为是 1909 年东京麻布的「浪花家」做出来的：把当时卖得很好的今川烧换成鲷鱼的形状，因为鲷鱼是喜庆的鱼。`, T`爱好者把一个模具烤一条的叫「天然物」，一块铁板烤好几条的叫「养殖」。`, T`这台是虚构的：七把铰链铁模挂在一条竖着转的链子上，绕过链轮时自动翻面，没有机械臂。`],
    oden: [T`关东煮源自室町时代的「田乐」：豆腐串起来烤，抹上味噌。到了江户时代改成用汤煮，才有了今天的样子。`, T`1979 年 7-Eleven 开始在便利店卖关东煮，从此冬天的收银台旁边总有一口格子锅。`, T`这台是虚构的：分格锅转到捞篮下面，捞篮把料倒进滑槽，杯子沿导轨走过每个工位，没有机械臂。`],
    sushi: [T`1958 年大阪的「元禄寿司」，白石义明看着啤酒厂的传送带，开出了第一家回转寿司。`, T`1981 年起，铃茂的寿司机器人一小时能捏约 1200 个饭团。`, T`这台是虚构的：饭团转鼓、料盒转塔、读卡拱门，一个工位只做一件事，没有机械臂。`],
    teishoku: [T`这台是虚构的：现实里没有全自动的定食机。`, T`最接近的是食券机：买下的瞬间，厨房的打印机就出单。`, T`茨城有家店从 1972 年起，把现做的便当放进自贩机里保温。`],
  };
  function goodsPage(kind) {
    const m = MACHINES.find(x => x.id === kind);
    // (★ per machine, 2026-10-18: a tier opens when this machine has sold enough of its own goods)
    const tier = ECON.tierOf(kind), loads = ECON.loadsOf(kind), cap = m ? Math.max(1, m.baseCap || m.capacity) : 1;
    const left = t => Math.max(1, Math.ceil((ECON.TIER_LOADS[t] - loads) * cap));
    return `<p class="al-h">${m ? `${m.brand} · ${m.name}` : ''}</p><div class="al-grid">` + ECON.GOODS[kind].filter(ECON.listed).map(g => { const n = ECON.soldCount(kind, g.id), open = tier >= g.tier;
      const nw = n && COLLECT.isNewGood(kind, g.id);
      return n ? `<button type="button" class="al-c got${nw ? ' new' : ''}" data-kind="${kind}" data-id="${g.id}"${nw ? ` data-new="g:${kind}:${g.id}"` : ''}>${SHOP.icon(kind, g)}<b>${g.name}</b><small>${T`${stars(g.tier)} · 卖出 ${n}`}</small>${nw ? NEW : ''}</button>`
        : open ? `<div class="al-c dim">${SHOP.icon(kind, g)}<b>？？？</b><small>${T`${stars(g.tier)} · 还没卖出`}</small></div>`
        : `<div class="al-c lock"><i>?</i><b>${stars(g.tier)}</b><small>${T`这台再卖 ${left(g.tier)} 件`}</small></div>`; }).join('') + `</div>`;
  }
  function seriesPage() {
    return `<div class="al-series">` + COLLECT.SERIES.map(s => { const p = COLLECT.progress(s), d = COLLECT.decor(s.reward), got = COLLECT.isClaimed(s.id);
      // a missing piece you could have: tap it and the next restock brings one along (捎一件)
      const dots = s.items.map(([k, id]) => { const g = ECON.product(k, id), sold = ECON.soldCount(k, id), m = MACHINES.find(x => x.goods.kind === k);
        if (!sold && !got && m && ECON.owns(m.id) && g.tier <= ECON.tierOf(k) && !ECON.planOf(m).includes(id)) return `<button type="button" class="al-ask${ECON.extraFor(k) === id ? ' on' : ''}" data-ask="${k}:${id}" aria-label="${T`下次补货捎一件 ${g.name}`}">${SHOP.icon(k, g)}</button>`;
        return `<span class="${sold ? 'on' : ''}">${SHOP.icon(k, g)}</span>`; }).join('');
      return `<div class="al-s${p.done && !got ? ' ready' : ''}${got ? ' got' : ''}"><div class="al-s-r">${decorIcon(d, 30)}</div>
        <div class="al-s-m"><b>${s.name}</b><small>${T`${p.have}/${p.all} · 奖励：${d.name}`}</small><i class="al-bar"><i style="width:${(100 * p.have / p.all).toFixed(0)}%"></i></i><div class="al-s-i">${dots}</div></div>
        ${got ? `<em class="al-ok">${T`已领`}</em>` : p.done ? `<button type="button" class="al-claim" data-claim="${s.id}">${T`领取`}</button>` : ''}</div>`; }).join('') + `</div>`;
  }
  function wearPage() {
    const gear = COLLECT.gear();
    const slotRow = slot => { const list = COLLECT.DECOR.filter(d => d.slot === slot);
      return `<p class="al-h">${COLLECT.SLOT_NAMES[slot]}</p><div class="al-wear">` + list.map(d => {
        if (!COLLECT.owns(d.id)) { const s = COLLECT.SERIES.find(x => x.reward === d.id);
          return `<div class="al-w lock">${decorIcon(d, 30)}<small>${d.source === 'goods' ? T`卖出一个「${ECON.product('spiral', 'maneki').name}」` : d.id === 'tencho' ? T`ミケ 陪你卖得够多就有` : d.source === 'neko' ? T`猫送的礼物` : T`集齐「${s ? s.name : '?'}」`}</small></div>`; }
        const nw = COLLECT.isNewDecor(d.id), mark = nw ? ` data-new="d:${d.id}"` : '', tag = nw ? NEW : '';
        if (slot === 'sticker') { const on = ids.find(m => COLLECT.stickerOn(m) === d.id);
          return `<div class="al-w own${nw ? ' new' : ''}"${mark}>${tag}${decorIcon(d, 30)}<b>${d.name}</b><span class="al-to">${ids.map((m, i) => `<button type="button" data-stick="${d.id}" data-m="${m}" class="${on === m ? 'on' : ''}">${names[i]}</button>`).join('')}</span></div>`; }
        if (slot === 'figure') { const on = ids.find(m => COLLECT.figureOn(m));
          return `<div class="al-w own${nw ? ' new' : ''}"${mark}>${tag}${decorIcon(d, 30)}<b>${d.name}</b><span class="al-to">${ids.map((m, i) => `<button type="button" data-perch="${m}" class="${on === m ? 'on' : ''}">${names[i]}</button>`).join('')}</span></div>`; }
        const on = gear[slot] === d.id;
        return `<button type="button" class="al-w own${on ? ' on' : ''}${nw ? ' new' : ''}" data-wear="${d.id}"${mark}>${tag}${decorIcon(d, 30)}<b>${d.name}</b><small>${on ? T`戴着 · 点一下取下` : T`点一下戴上`}</small></button>`; }).join('') + `</div>`; };
    return `<div class="al-cat">${catPreview(gear)}<p>${T`看板猫 ミケ`}</p></div>` + ['neck', 'head', 'feet', 'sticker', 'figure'].map(slotRow).join('')
      + `<p class="al-note">${T`装扮只是外观，不影响任何数值。以后商店和节日活动的装扮也会放在这里。`}</p>`;
  }
  // 机器: a card per machine; tap for its history, its parts, and a test run
  const onStreet = id => ECON.lots().includes(id);
  const machArt = id => `<svg viewBox="-8 440 116 228" aria-hidden="true">${STREET.art(id)}</svg>`;
  function machPage() {
    return `<div class="al-ms">` + MACHINES.map(m => { const on = onStreet(m.id), own = ECON.owns(m.id), nw = UPG.parts(m).some(p => UPG.isNew(m.id, p.id));
      return `<button type="button" class="al-m${on ? ' on' : ''}${nw ? ' new' : ''}" data-mach="${m.id}"${nw ? ` data-new="m:${m.id}"` : ''}><span class="al-m-art">${machArt(m.id)}</span><b>${m.brand}</b><small>${SELLS[m.id] || m.name}</small>`
        + `<em>${on ? T`在街上` : own ? T`收着` : window.__ndTrial && !__ndTrialOk(m.id) ? __ndTrialLot() + ' · ' + T`可以试运转` : m.paid && !m.unlock.open() ? T`在商店里买` : m.unlock && !m.unlock.open() ? T`未解锁 · 可以试运转` : T`可以试运转`}</em>${nw ? NEW : ''}</button>`; }).join('') + `</div>`
      + `<p class="al-note">${T`免费的机器都能试运转：货是满的，能点、能透视、能转，不计收入；改造可以免费试装，结束后拆掉。商店里的机器不试运转，买下就是你的。`}</p>`;
  }
  function machDetail(id) {
    const m = MACHINES.find(x => x.id === id), on = onStreet(id), n = ECON.GOODS[id].reduce((a, g) => a + ECON.soldCount(id, g.id), 0);
    const parts = UPG.parts(m).map(p => { const lv = UPG.level(m.id, p.id); if (lv) UPG.see(m.id, p.id);
      return lv ? `<div class="al-mp got"><b>${p.name}</b><small>${T`${p.kind} · 已装`}</small><p>${p.fact}</p></div>`
        : `<div class="al-mp"><b>${p.name}</b><small>${p.effect[0]} · ${UTIL.money(p.cost[0])}</small></div>`; }).join('');
    const el = $('al-detail'); el.hidden = false;
    el.innerHTML = `<div class="al-d al-md"><div class="al-md-top">${machArt(id)}<div><b>${m.brand}</b><small>${T`Fig ${m.fig} · ${m.name}`}</small>${n ? `<small>${T`一共卖出 ${n} 件`}</small>` : ''}</div></div>`
      + ((p => `<p class="al-persona"><b>${p.tag}</b> ${p.line}<br><span>${p.dots}</span></p>`)(ECON.personaLine(m.goods.kind)))
      + `<ul class="al-facts">${(FACTS[id] || []).map(f => `<li>${UTIL.hl(f)}</li>`).join('')}</ul>`
      + (window.__ndTrial && !__ndTrialOk(m.id) ? `<p class="al-h">${T`怎么解锁`}</p><p class="al-unlock">${__ndTrialBuy()}</p>` : m.unlock && !m.unlock.open() ? `<p class="al-h">${T`怎么解锁`}</p><p class="al-unlock">${UTIL.hl(m.unlock.hint())}</p>` : '')
      + (parts ? `<p class="al-h">${T`能装的部件`}</p><div class="al-mps">${parts}</div>` : '')
      + (m.paid && !m.unlock.open() ? `<button type="button" class="al-claim" data-pay="${m.paid}">${T`在商店里看看`}</button>` : `<button type="button" class="al-claim" data-try="${id}">${on ? T`去看看` : T`试运转`}</button>`) + `${T`<em>点其他地方关闭</em>`}</div>`;
    renderTabs(); refresh(); onChange({ seen: true });
  }
  // 猫: every cat, met or not; a knack in full once it has worked
  function catsPage() {
    return `<div class="al-cats">` + NEKO.CATS.map(c => { const s = NEKO.state(c.id), met = s.status !== 'none', info = catInfo(c), nw = COLLECT.isNewCat(c.id);
      const how = !met ? (c.arrive && c.arrive.trial ? __ndTrialLot() : c.arrive && c.arrive.paid ? T`在商店里可以领养` : c.arrive && c.arrive.letter ? T`营业额到 ${UTIL.money(Math.pow(1000, c.arrive.letter))} 会来串门` : T`进货升到 ${ECON.stepName(c.arrive ? c.arrive.step : 1)} 会来串门`)
        : s.status === 'visit' ? T`来串门了 · 送它一次吃的就会留下` : T`常客 · 陪你卖了 ${s.seen.toLocaleString()} 件`;
      const knack = !met ? '' : s.knew ? `<em>${UTIL.hl(info.line)}</em><p>${UTIL.hl(info.detail)}</p><small>${UTIL.hl(T`发挥过 ${s.worked.toLocaleString()} 次`)}</small>`
        : `<em class="dim">${T`本事：还没见过`}</em><p>${T`吃饱以后陪着一台机器，它的本事就会发挥出来。`}</p>`;
      return `<div class="al-cat-r${nw ? ' new' : ''}"${nw ? ` data-new="c:${c.id}"` : ''}><span class="al-cf${met ? '' : ' unmet'}">${NEKOART.portrait(c.id, met ? gearOf(c.id) : {})}</span>`
        + `<div><b>${met ? `${c.name} · ${c.kind}` : T`？？？（${c.kind}）`}</b><small>${UTIL.hl(how)}</small>${knack}</div>${nw ? NEW : ''}</div>`; }).join('') + `</div>`;
  }
  function detail(kind, id) {
    const g = ECON.product(kind, id), q = ECON.quote(kind, g), n = ECON.soldCount(kind, id), series = COLLECT.seriesOf(kind, id);
    const el = $('al-detail'); el.hidden = false;
    el.innerHTML = `<div class="al-d">${SHOP.icon(kind, g)}<b>${g.name}</b><small>${T`${stars(g.tier)} · 进 ${UTIL.money(q.buy)} · 卖 ${UTIL.money(q.sell)}`}</small>
      <p>${(COLLECT.FLAVOR[kind] || {})[id] || ''}</p><small>${T`一共卖出 ${n} 件`}</small>${T`${series.length ? `<div class="al-d-s">${series.map(s => `<span>${s.name}</span>`).join('')}</div>` : ''}<em>点任意处关闭</em>`}</div>`;
  }
  // 捎一件: one line to say what will happen (or that it is off again)
  function ask(kind, id, on) {
    const g = ECON.product(kind, id), m = MACHINES.find(x => x.goods.kind === kind), el = $('al-detail'); el.hidden = false;
    el.innerHTML = `<div class="al-d">${SHOP.icon(kind, g)}<b>${on ? T`好的，下次捎一件` : T`不捎了`}</b><small>${on ? T`下次给 ${m.brand} 补货时，批发商会捎一件「${g.name}」放进去，只这一次，自动配货照常` : T`「${g.name}」不用捎了`}</small>${T`<em>点任意处关闭</em>`}</div>`;
  }
  // the moment a series pays out: the decoration, big, and one button that takes you to put it on
  function reward(d) {
    const el = $('al-detail'); el.hidden = false;
    el.innerHTML = `<div class="al-d al-got">${T`${decorIcon(d, 64)}<b>拿到了 ${d.name}！</b>`}<small>${d.slot === 'sticker' ? T`可以贴在任意一台机器的侧面` : T`给看板猫戴在${COLLECT.SLOT_NAMES[d.slot]}上`}</small>
      <button type="button" class="al-claim" data-go="wear">${T`去装扮`}</button>${T`<em>点其他地方关闭</em>`}</div>`;
  }
  // tabs: a small dot on a page that holds something new; 系列 says how many are ready to claim
  function renderTabs() {
    const ready = COLLECT.claimable().length, met = NEKO.CATS.filter(c => NEKO.state(c.id).status !== 'none').length;
    const secs = [['goods', T`商品`, '', ids.some(id => COLLECT.newGoods(id) > 0)],
      ['series', T`系列`, ready ? T`${ready} 个可领` : `${COLLECT.SERIES.filter(s => COLLECT.isClaimed(s.id)).length}/${COLLECT.SERIES.length}`, false],
      ['mach', T`机器`, `${MACHINES.filter(m => ECON.owns(m.id)).length}/${MACHINES.filter(m => !ECON.paidLock(m.id)).length}`, UPG.unseen(MACHINES) > 0],
      ['cats', T`猫`, `${met}/${NEKO.CATS.length}`, COLLECT.newCats() > 0], ['wear', T`装扮`, '', COLLECT.newDecor() > 0]];
    let h = `<div class="al-secs">` + secs.map(([id, n, sub, nw]) => `<button type="button" data-sec="${id}" class="${id === sec ? 'on' : ''}${id === 'series' && ready ? ' ready' : ''}${nw ? ' has-new' : ''}">${n}${sub ? `<small>${sub}</small>` : ''}</button>`).join('') + `</div>`;
    if (sec === 'goods') h += `<div class="al-kinds">` + ids.filter(id => !ECON.paidLock(id)).map(id => { const list = ECON.GOODS[id].filter(ECON.listed), have = list.filter(g => ECON.soldCount(id, g.id)).length;
      return `<button type="button" data-ktab="${id}" class="${id === kind ? 'on' : ''}${COLLECT.newGoods(id) > 0 ? ' has-new' : ''}">${SHOP.icon(id, list[0])}<b>${SELLS[id] || id}</b><small>${have}/${list.length}</small></button>`; }).join('') + `</div>`;
    $('al-tabs').innerHTML = h;
    $('al-readall').classList.toggle('off', !anyNew());
  }
  function render() {
    const c = ECON.albumCount(); $('al-count').textContent = `${c.have}/${c.all}`;
    renderTabs();
    $('al-body').innerHTML = sec === 'series' ? seriesPage() : sec === 'wear' ? wearPage() : sec === 'mach' ? machPage() : sec === 'cats' ? catsPage() : goodsPage(kind);
    $('al-body').scrollTop = 0; $('al-detail').hidden = true;
    markPage();
  }
  /* ---------- NEW marks (2026-10-16, user: on a phone nobody should have to tap each NEW away, and a red dot left over
     bothers the tidy-minded) ----------
     Opening a page is seeing what is on it: the page's dot goes at once; its NEW tags stay a moment, so you can spot what
     came in, then fade. One button (全部看过) clears every NEW in every section; a series ready to claim keeps its dot,
     since that one is a reward waiting, not news. */
  const markOne = key => { const [t, a, b] = key.split(':');
    if (t === 'g') COLLECT.seeGood(a, b); else if (t === 'p') UPG.see(a, b);
    else if (t === 'm') { const m = MACHINES.find(x => x.id === a); if (m) UPG.parts(m).forEach(p => { if (UPG.isNew(m.id, p.id)) UPG.see(m.id, p.id); }); }
    else if (t === 'c') COLLECT.seeCats(); else COLLECT.seeDecor(a); };
  let fadeT = 0;
  function markPage() {
    const els = [...$('al-body').querySelectorAll('[data-new]')]; if (!els.length) return;
    els.forEach(el => markOne(el.dataset.new));
    renderTabs(); refresh(); onChange({ seen: true });
    clearTimeout(fadeT); fadeT = setTimeout(() => els.forEach(el => el.classList.add('seen')), 2200);
  }
  // tapping a new thing counts as looking at it (its tag goes at once)
  function seen(el) { if (!el || !el.dataset.new || el.classList.contains('seen')) return; markOne(el.dataset.new); el.classList.add('seen'); renderTabs(); refresh(); onChange({ seen: true }); }
  const anyNew = () => ids.some(id => COLLECT.newGoods(id) > 0) || COLLECT.newDecor() > 0 || UPG.unseen(MACHINES) > 0 || COLLECT.newCats() > 0;
  function readAll() {
    ids.forEach(id => ECON.GOODS[id].forEach(g => { if (COLLECT.isNewGood(id, g.id)) COLLECT.seeGood(id, g.id); }));
    COLLECT.DECOR.forEach(d => { if (COLLECT.isNewDecor(d.id)) COLLECT.seeDecor(d.id); });
    MACHINES.forEach(m => markOne('m:' + m.id)); COLLECT.seeCats();
    SND.tick(3); render(); refresh(); onChange({ seen: true });
  }
  // open(t): a section ('series', 'mach', 'cats', 'wear'; the old 'parts' is now 'mach') or a machine's goods page
  function open(t) {
    if (t === 'parts') t = 'mach';
    if (['series', 'mach', 'cats', 'wear', 'goods'].includes(t)) sec = t; else if (t && ids.includes(t)) { sec = 'goods'; kind = t; }
    if (!kind) kind = ids[0];
    $('st-album').hidden = false; render(); refresh();
  }
  function close() { clearTimeout(fadeT); $('st-album').hidden = true; refresh(); }
  // the street button: count, and a dot when there is something new to see or claim
  function refresh() { const c = ECON.albumCount(), b = $('st-albumbtn'); $('st-albumn').textContent = `${c.have}/${c.all}`; b.classList.toggle('dot', COLLECT.unseen() || UPG.unseen(MACHINES) > 0); }
  const goTab = t => { if (t === 'parts') t = 'mach'; if (['series', 'mach', 'cats', 'wear', 'goods'].includes(t)) sec = t; else { sec = 'goods'; kind = t; } };
  function init(opts) {
    ids = opts.ids; names = opts.names; onChange = opts.onChange || onChange; catInfo = opts.catInfo || catInfo; gearOf = opts.gearOf || gearOf;
    $('st-albumbtn').addEventListener('click', () => { SND.pop(); open(COLLECT.claimable().length ? 'series' : null); });
    $('st-album').addEventListener('click', e => {
      const t = e.target.closest('button');
      seen(e.target.closest('[data-new]'));   // tapping a new thing counts as looking at it
      if (t && t.dataset.go) { goTab(t.dataset.go); SND.tick(3); render(); return; }
      if (t && t.dataset.pay) { SND.pop(); close(); PAY.open(t.dataset.pay); return; }
      if (t && t.dataset.try) { SND.pop(); close(); onChange({ try: t.dataset.try }); return; }
      if (!$('al-detail').hidden) { $('al-detail').hidden = true; return; }
      if (!t) { if (e.target === $('st-album')) close(); return; }
      if (t.classList.contains('al-x')) { close(); return; }
      if (t.id === 'al-readall') { readAll(); return; }
      if (t.dataset.sec) { sec = t.dataset.sec; SND.tick(3); render(); return; }
      if (t.dataset.ktab) { kind = t.dataset.ktab; SND.tick(3); render(); return; }
      if (t.dataset.mach) { SND.pick(); machDetail(t.dataset.mach); return; }
      if (t.dataset.kind) { SND.pick(); detail(t.dataset.kind, t.dataset.id); return; }
      if (t.dataset.ask) { const [k, id] = t.dataset.ask.split(':'), on = ECON.requestExtra(k, id); SND.pick(); render(); ask(k, id, on); onChange({}); return; }
      if (t.dataset.claim) { const d = COLLECT.claim(t.dataset.claim); if (d) { SND.jingle(); UTIL.haptic([12, 40, 12]); render(); refresh(); reward(d); onChange({ claimed: d }); } return; }
      if (t.dataset.wear) { COLLECT.wear(t.dataset.wear); SND.switchOn(); render(); onChange({ gear: true }); return; }
      if (t.dataset.stick) { const on = COLLECT.stickerOn(t.dataset.m) === t.dataset.stick; COLLECT.stick(t.dataset.stick, on ? null : t.dataset.m); SND.pick(); render(); onChange({ sticker: true }); }
      if (t.dataset.perch) { COLLECT.perch(COLLECT.figureOn(t.dataset.perch) ? null : t.dataset.perch); SND.pick(); render(); onChange({ sticker: true }); }
    });
  }
  return { init, open, close, refresh, decorIcon, catPreview, get isOpen() { return !$('st-album').hidden; } };
})();
