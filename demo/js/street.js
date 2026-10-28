/* The street: the home view. A small back street at night — kawaii doodle (wobbly marker lines, cute cats) crossed
   with a comic city street (black ink, neon signs, graffiti and stickers, hazard stripes, halftone). The machines stand
   in miniature, sell on their own and pop their takings. The wallet shows money in letter units (every 1000 carries
   into the next letter), each letter with its own cat food: A 小鱼干, B 猫罐头 ... Each carry unlocks that food and
   brings a new cat. Tap a machine to open its full view. Design canvas 390 x 844. */
const STREET = (() => {
  // X: the five lots (机位) machines stand on; the street is WW wide and pans sideways when it is wider than the screen (390).
  // pos[i]: the lot machine i stands on (-1: put away); lots[j]: { state: 'machine' | 'open' | 'locked', letter }
  // (v0.46) one street at a time: K is the one shown (0 なんでも通り, 1 駅前通り); its lots are numbered 5K..5K+4 outside;
  // past the fifth lot, a signpost to the other street
  const INK = '#141018', X = [42, 149, 256, 363, 470], WW = 640;
  const SKIN = {
    drink: { body: '#8fd0ff', side: '#4f8fe0', lid: '#c4e8ff', sticker: 'star' },
    spiral: { body: '#ffa8c8', side: '#e0679a', lid: '#ffd4e4', sticker: 'heart' },
    cup: { body: '#ffc08a', side: '#e5884a', lid: '#ffe2c6', sticker: 'paw' },
    ramen: { body: '#ffb59a', side: '#e2684a', lid: '#ffdccc', sticker: 'star' },
    juice: { body: '#ffd27a', side: '#ec9a2a', lid: '#ffecc0', sticker: 'heart' },
    auto: { body: '#9fe3d6', side: '#3fae9c', lid: '#d6f6f0', sticker: 'paw' },
    digital: { body: '#c4b0ff', side: '#8a5cff', lid: '#e6dcff', sticker: 'star' },
    frozen: { body: '#bfe8f5', side: '#5aa8c8', lid: '#e6f8ff', sticker: 'heart' },
    locker: { body: '#e8c08a', side: '#b07a3a', lid: '#f6dcb0', sticker: 'paw' },
    teishoku: { body: '#9ab0e8', side: '#3a5aa8', lid: '#d6e0fa', sticker: 'star' },
    sushi: { body: '#ffe2cc', side: '#d8453a', lid: '#fff2e4', sticker: 'heart' },
    oden: { body: '#ffe6c4', side: '#e8862a', lid: '#fff4e2', sticker: 'star' },
    taiyaki: { body: '#ffe8c8', side: '#a8302a', lid: '#fff4e4', sticker: 'heart' },
    kakigori: { body: '#d8eeff', side: '#2a6ad9', lid: '#eef8ff', sticker: 'star' },
    gacha: { body: '#ffd8e8', side: '#ff5fa2', lid: '#fff0f6', sticker: 'star' },
    kissa: { body: '#e8d8c0', side: '#7a3020', lid: '#f6ecdc', sticker: 'heart' },
    bakery: { body: '#fff0d8', side: '#8a3a1a', lid: '#fff8ec', sticker: 'paw' },
    teppan: { body: '#d8352a', side: '#1f2a4a', lid: '#e8503e', sticker: 'star' },
  };
  // the cat-food ladder: one food per letter unit; new cats come visiting with the letters (see docs/nandemo-看板猫.md)
  const TIERS = [
    { name: T`小鱼干`, fur: ['#fffdf8', '#ffb877', '#5b4a52'] },
    { name: T`猫罐头` }, { name: T`猫条` }, { name: T`刺身拼盘` }, { name: T`猫薄荷` }, { name: T`鲷鱼烧` },
  ];
  // the cats a letter brings: the one at the carry, and the one at its 特上 step
  const catsOf = t => NEKO.CATS.filter(c => c.arrive && (c.arrive.letter === t || (c.arrive.step && Math.floor((c.arrive.step - 1) / 3) + 1 === t)));
  const ink = (w = 2.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const $ = id => document.getElementById(id);
  let svg, fx, catsG, mealG, ids = [], names = [], onOpen = () => {}, onDemo = () => {}, onWarp = () => {}, onLot = () => {}, onNeko = () => {}, onGift = () => {}, onBowl = () => {}, carryExtra = () => '', lastTier = -1, catOn = 0, gear = {};
  // neko: the cats' state from the app ({ cats, visitors, gift, glass, rain, bowl }); drawn by NEKOART. dining: mealtime
  let neko = null, dining = false, onCarry = null;
  let pos = [], lots = [];
  let K = 0, info = null, vxBy = [], onSign = () => {}, onStreet = () => {}, cardThen = null;
  const xOf = i => X[Math.max(0, pos[i])];

  /* ---------- cat-food badges (one symbol per letter unit) ---------- */
  const symbols = () => `
    <symbol id="tier-1" viewBox="0 0 24 24"><path d="M2.5 12.5q6.5-7 14-2.2l5-3.3v11l-5-3.3q-7.5 4.8-14-2.2z" fill="#cfd8e8" ${ink(1.7)}/><circle cx="6.6" cy="11.6" r="1.1" fill="${INK}"/><path d="M10 10.5q1.2 2 0 4" fill="none" ${ink(1.2)}/></symbol>
    <symbol id="tier-2" viewBox="0 0 24 24"><path d="M4 8v10q0 2.6 8 2.6t8-2.6V8" fill="#ffd27a" ${ink(1.7)}/><ellipse cx="12" cy="8" rx="8" ry="2.6" fill="#ffeab8" ${ink(1.7)}/><path d="M7.5 14.4q3-2.6 6 0l2.2-1.5v3l-2.2-1.5q-3 2.6-6 0z" fill="#fff" ${ink(1.1)}/></symbol>
    <symbol id="tier-3" viewBox="0 0 24 24"><path d="M9 3.5h6l.6 17.5q-3.6 1.2-7.2 0z" fill="#ffb3c8" ${ink(1.7)}/><path d="M9.2 7.4h5.6" ${ink(1.2)}/><path d="M10.4 12q1.6-1.4 3.2 0" fill="none" ${ink(1.2)}/></symbol>
    <symbol id="tier-4" viewBox="0 0 24 24"><ellipse cx="12" cy="16" rx="9.5" ry="4.4" fill="#eef4ff" ${ink(1.7)}/><path d="M5 14.5q2-6 7-6.5q-1 5-7 6.5zM10 14.5q2-6 7.5-6q-1.5 5.2-7.5 6z" fill="#ff9a8a" ${ink(1.5)}/></symbol>
    <symbol id="tier-5" viewBox="0 0 24 24"><path d="M12 21q-8-5-6.5-12.5Q12 3 18.5 8.5Q20 16 12 21z" fill="#a9e6b8" ${ink(1.7)}/><path d="M12 20V7.5M12 12l-3.6-2.2M12 15.6l3.8-2.4" fill="none" ${ink(1.2)}/></symbol>
    <symbol id="tier-6" viewBox="0 0 24 24"><path d="M2.5 12q6-7.5 13.5-3.2l5.5-3.6v13.6l-5.5-3.6Q8.5 19.5 2.5 12z" fill="#f2b45f" ${ink(1.7)}/><circle cx="6.4" cy="11" r="1.1" fill="${INK}"/><path d="M10 9.4q1.4 2.6 0 5.2M13 9.6q1.4 2.4 0 4.8" fill="none" ${ink(1.1)}/></symbol>
    <symbol id="maneki-fig" viewBox="-13 -28 26 31">${NEKOART.maneki(1.5)}</symbol>
    <symbol id="neko-paw" viewBox="0 0 24 24"><ellipse cx="12" cy="15.4" rx="5.6" ry="4.6" fill="#ffb3c8" ${ink(1.7)}/><circle cx="5.6" cy="9.6" r="2.4" fill="#ffb3c8" ${ink(1.5)}/><circle cx="9.6" cy="5.8" r="2.4" fill="#ffb3c8" ${ink(1.5)}/><circle cx="14.4" cy="5.8" r="2.4" fill="#ffb3c8" ${ink(1.5)}/><circle cx="18.4" cy="9.6" r="2.4" fill="#ffb3c8" ${ink(1.5)}/></symbol>
    <symbol id="tier-n" viewBox="0 0 24 24"><path d="M12 2.5l2.6 6 6.4.6-4.8 4.3 1.4 6.4L12 16.5l-5.6 3.3 1.4-6.4L3 9.1l6.4-.6z" fill="#ffe08a" ${ink(1.7)}/></symbol>`;
  const tierIcon = t => t <= 0 ? '' : t <= TIERS.length ? '#tier-' + t : '#tier-n';

  /* ---------- the scene ---------- */
  const sparkD = (x, y, r) => `M${x} ${y - r * 2}Q${x} ${y} ${x + r * 2} ${y}Q${x} ${y} ${x} ${y + r * 2}Q${x} ${y} ${x - r * 2} ${y}Q${x} ${y} ${x} ${y - r * 2}Z`;
  const sparkle = (x, y, r, c = '#fff6d6') => `<path d="${sparkD(x, y, r)}" fill="${c}"/>`;
  const win = (x, y, kind, w = 28, h = 30) => {
    const fill = kind === 'lit' ? '#ffd86b' : kind === 'tv' ? '#5ff0ff' : '#232a52';
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" ${ink(2.2)}/><path d="M${x + w / 2} ${y + 2}V${y + h - 2}" ${ink(1.6)}/>`
      + (kind === 'lit' ? `<path d="M${x + 4} ${y + 4}q5 ${h / 3} 0 ${h - 8}" fill="none" stroke="#ff8fb1" stroke-width="2.2" stroke-linecap="round"/>` : '')
      + (kind === 'tv' ? `<rect x="${x + 4}" y="${y + 6}" width="8" height="6" rx="1" fill="#fff" opacity=".8"/>` : '');
  };
  // neon tube lettering: a blurred glow under a crisp core
  const neon = (x, y, size, txt, col, opt = '') => `<text x="${x}" y="${y}" class="st-neon" font-size="${size}" text-anchor="middle" fill="${col}" stroke="${col}" stroke-width="2" filter="url(#st-glow-f)" ${opt}>${txt}</text>`
    + `<text x="${x}" y="${y}" class="st-neon" font-size="${size}" text-anchor="middle" fill="#fff6fb" stroke="${col}" stroke-width=".8" ${opt}>${txt}</text>`;
  const tag = (d, col) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${col}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  function backdrop() {   // なんでも通り
    let s = `<rect x="-20" y="-20" width="${WW + 40}" height="900" fill="url(#st-sky)"/><ellipse cx="${WW / 2}" cy="420" rx="${WW * .82}" ry="150" fill="url(#st-city)"/>`;
    s += [[38, 222, 1.8], [96, 196, 1.2], [176, 214, 1.4], [226, 196, 2], [300, 236, 1.2], [70, 300, 1]]
      .map(([x, y, r], i) => i % 2 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff6d6" opacity=".8"/>` : sparkle(x, y, r)).join('');
    s += `<path d="M323.9 148.1A24 24 0 1 0 348.9 179.3A20 20 0 1 1 323.9 148.1Z" fill="#ffe27a" ${ink()}/><text x="352" y="146" class="st-num" font-size="11" fill="#fff6d6">z</text>`;
    s += '<!--sky-->';
    // a cat-food billboard on a far rooftop
    s += `<rect x="146" y="300" width="100" height="90" fill="#251d4a" ${ink(2.2)}/>${[0, 1].map(r => [0, 1, 2, 3].map(c => `<rect x="${156 + c * 22}" y="${318 + r * 30}" width="12" height="14" rx="2" fill="${(r + c) % 3 ? '#3a3170' : '#ffd86b'}" ${ink(1.4)}/>`).join('')).join('')}
      <path d="M160 300v-14M232 300v-14" ${ink(2.2)}/><rect x="150" y="238" width="92" height="50" rx="4" fill="#fff1c9" ${ink()}/><rect x="150" y="238" width="92" height="50" rx="4" fill="url(#st-dots)"/>
      <path d="M164 278v-22q0-3 8-3t8 3v22q0 3-8 3t-8-3z" fill="#ffd27a" ${ink(2)}/><ellipse cx="172" cy="256" rx="8" ry="2.6" fill="#ffeab8" ${ink(1.6)}/><path d="M167 268q5-4 10 0l3-2v4l-3-2q-5 4-10 0z" fill="#fff" ${ink(1.2)}/>
      <text x="215" y="260" class="st-pop-t st-jp" font-size="13" text-anchor="middle" fill="#ff4f8b" stroke="${INK}" stroke-width="2.2" paint-order="stroke">ねこ缶</text><text x="215" y="278" class="st-pop-t st-jp" font-size="9" text-anchor="middle" fill="${INK}">NEW!</text>`;
    // wires with bunting and a pair of sneakers
    s += `<path d="M10 284Q200 336 400 300M10 298Q210 352 400 320M40 252Q230 300 400 262M24 240Q120 270 160 236M400 300Q460 286 ${WW + 10} 294M400 320Q462 306 ${WW + 10} 316M400 262Q456 248 ${WW + 10} 254" fill="none" stroke="${INK}" stroke-width="1.8"/>
      ${[[70, 300, '#ff4f8b'], [100, 307, '#ffd23f'], [130, 312, '#3ff4ff'], [160, 316, '#ff4f8b'], [190, 318, '#ffd23f'], [220, 318, '#3ff4ff'], [250, 316, '#ff4f8b']].map(([x, y, c]) => `<path d="M${x - 7} ${y - 2}L${x + 7} ${y + 1}L${x} ${y + 14}z" fill="${c}" ${ink(1.6)}/>`).join('')}
      <path d="M118 262v16M126 264v14" ${ink(1.2)}/><path d="M113 278h9l1 5h-11zM121 278h9l1 5h-11z" fill="#fff" ${ink(1.4)}/>`;
    // left: a blue apartment with lit windows, a balcony with laundry and a karaoke neon
    s += `<rect x="-10" y="236" width="160" height="150" fill="#3a4f94" ${ink()}/><rect x="-10" y="236" width="160" height="150" fill="url(#st-dots)"/><rect x="-12" y="228" width="164" height="12" rx="3" fill="#2c3d78" ${ink(2.2)}/>`
      + win(8, 254, 'dark') + win(48, 254, 'lit') + win(88, 254, 'tv') + win(8, 322, 'lit') + win(88, 322, 'dark')
      + `<path d="M44 312h40" ${ink(2)}/><rect x="44" y="318" width="40" height="2" fill="${INK}"/>${[48, 56, 64, 72, 80].map(x => `<path d="M${x} 312v8" ${ink(1.4)}/>`).join('')}
        <path d="M46 300h36" ${ink(1.4)}/><path d="M52 300l-4 8h10l-3-8z" fill="#9ce1c8" ${ink(1.4)}/><path d="M70 300v7q0 3 4 3h2v-3h-2v-7" fill="#ffb3c8" ${ink(1.4)}/>
        <rect x="122" y="246" width="24" height="122" rx="4" fill="${INK}"/>`
      + ['カ', 'ラ', 'オ', 'ケ'].map((ch, i) => neon(134, 270 + i * 27, 17, ch, '#ff4f8b')).join('');
    // right: a raspberry building, fire-escape stairs and a café neon
    s += `<rect x="238" y="214" width="170" height="172" fill="#b73a6a" ${ink()}/><rect x="238" y="214" width="170" height="172" fill="url(#st-dots)"/><rect x="236" y="206" width="174" height="12" rx="3" fill="#8f2a52" ${ink(2.2)}/>`
      + win(266, 236, 'lit') + win(306, 236, 'dark') + win(266, 304, 'dark') + win(306, 304, 'lit')
      + `<path d="M242 232h18M242 268h18M242 304h18M242 340h18M244 232l14 36M244 268l14 36M244 304l14 36" fill="none" ${ink(1.8)}/>
        <rect x="348" y="232" width="28" height="140" rx="5" fill="${INK}"/>`
      + ['喫', '茶', 'ね', 'こ'].map((ch, i) => neon(362, 258 + i * 30, 17, ch, '#3ff4ff')).join('');
    // further right (seen by panning): a little noodle shop with a vertical neon and red lanterns
    s += `<rect x="406" y="222" width="114" height="164" fill="#3b2a52" ${ink()}/><rect x="406" y="222" width="114" height="164" fill="url(#st-dots)"/><rect x="402" y="214" width="122" height="12" rx="3" fill="#2a1d40" ${ink(2.2)}/>`
      + win(426, 244, 'lit') + win(426, 312, 'dark') + `<rect x="466" y="236" width="28" height="140" rx="5" fill="${INK}"/>`
      + ['ら', 'ー', 'め', 'ん'].map((ch, i) => neon(480, 262 + i * 30, 17, ch, '#ffb347')).join('')
      + [432, 506].map(x => `<path d="M${x} 352v6" ${ink(1.6)}/><ellipse cx="${x}" cy="370" rx="9" ry="12" fill="#ff4f3a" ${ink(2)}/><path d="M${x - 9} 370h18M${x - 7} 362h14M${x - 7} 378h14" stroke="${INK}" stroke-width="1" opacity=".5"/><rect x="${x - 4}" y="356" width="8" height="3" fill="${INK}"/><rect x="${x - 4}" y="381" width="8" height="3" fill="${INK}"/>`).join('');
    // and past it: a fruit shop with a vertical neon, a striped awning and crates of oranges
    s += `<rect x="520" y="232" width="110" height="154" fill="#2f5a3c" ${ink()}/><rect x="520" y="232" width="110" height="154" fill="url(#st-dots)"/><rect x="516" y="224" width="118" height="12" rx="3" fill="#234530" ${ink(2.2)}/>`
      + win(574, 250, 'lit') + `<rect x="534" y="244" width="26" height="116" rx="5" fill="${INK}"/>`
      + ['く', 'だ', 'も', 'の'].map((ch, i) => neon(547, 268 + i * 26, 15, ch, '#b8f05a')).join('')
      + `<path d="M566 322H630V336H566Z" fill="#fff" ${ink(2)}/>${Array.from({ length: 6 }, (_, i) => `<path d="M${569 + i * 10} 322h5v14h-5z" fill="#3aa04a"/>`).join('')}
        <path d="M566 336${Array.from({ length: 7 }, () => 'q4.5 6 9 0').join('')}" fill="#3aa04a" ${ink(1.6)}/>`
      + [574, 602].map(x => `<rect x="${x}" y="366" width="24" height="16" fill="#c8894a" ${ink(1.8)}/>` + [0, 1, 2].map(j => `<circle cx="${x + 5 + j * 7}" cy="363" r="4" fill="${j === 1 ? '#ffe14a' : '#ff9a2e'}" ${ink(1.4)}/>`).join('')).join('');
    // the shop fascia between the buildings and the machines: graffiti, a neon street sign, stickers, a lost-cat poster
    s += `<rect x="-10" y="384" width="${WW + 20}" height="280" fill="#5d577e" ${ink()}/><rect x="-10" y="384" width="${WW + 20}" height="280" fill="url(#st-dots)"/>
      ${tag('M10 428q4-22 16-8q8 10 2 18M34 410q2 26 6 28q4-24 14-26q-2 20 4 24M64 432q8-20 18-10q-6 12-16 10M92 410v28q10-2 14-14', '#ffd23f')}
      <rect x="128" y="392" width="134" height="40" rx="6" fill="${INK}"/><g class="st-mainsign">${neon(195, 419, 19, 'なんでも通り', '#ff4f8b')}</g>
      <rect x="276" y="394" width="40" height="44" fill="#fff8ec" ${ink(2)} transform="rotate(4 296 416)"/><g transform="rotate(4 296 416)"><text x="296" y="404" class="st-sign" font-size="7" text-anchor="middle" fill="${INK}">さがしてます</text>
        <circle cx="296" cy="418" r="8" fill="#fff" ${ink(1.6)}/><path d="M290 412l1-5 4 3zM302 412l-1-5-4 3z" fill="#fff" ${ink(1.4)}/><path d="M293 418q1 1 2 0M297 418q1 1 2 0" fill="none" ${ink(1)}/><path d="M282 430h28M282 434h20" ${ink(1)} opacity=".5"/></g>
      <circle cx="330" cy="404" r="8" fill="#3ff4ff" ${ink(2)}/><path d="M326 404l3 3 5-6" fill="none" ${ink(1.8)}/>
      <rect x="342" y="398" width="22" height="13" rx="3" fill="#ffd23f" ${ink(2)} transform="rotate(-8 353 404)"/><text x="353" y="408" class="st-pop-t st-jp" font-size="7" text-anchor="middle" fill="${INK}" transform="rotate(-8 353 404)">24H</text>
      <path d="${sparkD(372, 420, 6)}" fill="#ff4f8b" ${ink(1.8)}/><rect x="318" y="420" width="18" height="18" rx="9" fill="#b8f05a" ${ink(2)}/><text x="327" y="432.5" class="st-pop-t st-jp" font-size="8" text-anchor="middle" fill="${INK}">!?</text>`;
    // the pole, its street lamp and the lamp's pool of light
    s += `<path d="M58 392L-8 652H168Z" fill="url(#st-glow)"/>
      <rect x="18" y="226" width="11" height="434" rx="3" fill="#8e86a8" ${ink()}/><rect x="4" y="260" width="40" height="7" rx="2" fill="#6e6690" ${ink(2)}/><rect x="9" y="282" width="30" height="6" rx="2" fill="#6e6690" ${ink(2)}/>
      <rect x="28" y="312" width="20" height="28" rx="4" fill="#a39cbd" ${ink(2)}/><path d="M29 368h20q9 0 9 9" fill="none" ${ink()}/><path d="M48 377h20l-3 8H51z" fill="#fff3b0" ${ink(2)}/>
      <rect x="2" y="440" width="42" height="22" rx="4" fill="#3c7cff" ${ink(2)}/><text x="23" y="455.5" class="st-sign" font-size="10" text-anchor="middle" fill="#fff">3丁目</text>`;
    // pavement, a hazard-striped kerb, the road with a 止まれ marking
    s += `<rect x="-10" y="650" width="${WW + 20}" height="58" fill="#4a4270" ${ink(2.2)}/><path d="M-10 679H${WW + 10}${Array.from({ length: Math.ceil(WW / 26) + 1 }, (_, i) => `M${13 + i * 26} 652V706`).join('')}" stroke="#625a8c" stroke-width="1.6"/>
      <rect x="-10" y="704" width="${WW + 20}" height="12" fill="url(#st-haz)" ${ink(2.2)}/><rect x="-10" y="716" width="${WW + 20}" height="150" fill="#221c3c"/>
      <path d="M-10 758H${WW + 10}" stroke="#efe8f8" stroke-width="5" opacity=".85"/><text x="195" y="812" class="st-pop-t st-jp" font-size="38" text-anchor="middle" fill="#efe8f8" opacity=".75" transform="translate(0 812) scale(1 .62) translate(0 -812)">止まれ</text>`;
    // a potted plant at the pole's foot, a traffic cone, a can bin
    s += `<path d="M7 620h30l-4 33H11z" fill="#f2a07b" ${ink(2)}/><rect x="5" y="614" width="34" height="8" rx="3" fill="#f6b693" ${ink(2)}/>
      <path d="M22 614q-16-18-6-34q8 14 6 34zM22 614q10-22 20-24q-2 16-20 24zM22 614q-4-26 2-40q6 22-2 40z" fill="#7fd99a" ${ink(2)}/>
      <path d="M352 744l7-26h6l7 26z" fill="#ff8a24" ${ink(2)}/><path d="M356 732h12M354 739h16" stroke="#fff" stroke-width="3"/><rect x="348" y="742" width="28" height="5" rx="2" fill="#ff8a24" ${ink(2)}/>`;
    return s;
  }

  /* 駅前通り (v0.46): the square in front of ねこまち駅. The station with its clock and name board, the ticket gates lit
     inside (nobody passing: only the gates' lamps), the elevated line behind; a convenience store, a game centre, a
     yakitori bar; a bus stop on the lamp post, a taxi sign, a zebra crossing. Same pens and inks as なんでも通り */
  function backdropEki() {
    let s = `<rect x="-20" y="-20" width="${WW + 40}" height="900" fill="url(#st-sky)"/><ellipse cx="${WW / 2}" cy="420" rx="${WW * .82}" ry="150" fill="url(#st-city)"/>`;
    s += [[34, 150, 1.6], [118, 112, 1.2], [214, 84, 1.8], [402, 132, 1.2], [468, 96, 1.4], [612, 168, 1.2], [590, 64, 2]]
      .map(([x, y, r], i) => i % 2 ? `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff6d6" opacity=".8"/>` : sparkle(x, y, r)).join('');
    s += `<path d="M523.9 98.1A24 24 0 1 0 548.9 129.3A20 20 0 1 1 523.9 98.1Z" fill="#ffe27a" ${ink()}/>`;
    s += '<!--sky-->';
    // left: a convenience store, its striped fascia and the bright shop window
    s += `<rect x="-10" y="262" width="152" height="124" fill="#2f5f86" ${ink()}/><rect x="-10" y="262" width="152" height="124" fill="url(#st-dots)"/>
      <rect x="-12" y="268" width="156" height="28" fill="#fff8ec" ${ink(2.2)}/><path d="M-12 288H144" stroke="#3aa04a" stroke-width="4"/><path d="M-12 293H144" stroke="#ff9a2e" stroke-width="3"/>
      <text x="62" y="284" class="st-pop-t st-jp" font-size="13" text-anchor="middle" fill="#2f5f86">コンビニ</text>
      <rect x="2" y="306" width="128" height="72" rx="2" fill="#c8f4ff" ${ink(2.2)}/>${[34, 66, 98].map(x => `<path d="M${x} 306v72" ${ink(1.6)}/>`).join('')}
      <path d="M8 324h20M40 330h20M72 322h20M104 328h20" stroke="#5ab8d8" stroke-width="3" stroke-linecap="round" opacity=".7"/>`
      + neon(118, 256, 11, '24H', '#3ff4ff');
    // the station: a gable roof with the clock, the name board, three lit arches with the ticket gates
    s += `<rect x="156" y="236" width="288" height="150" fill="#b8a48a" ${ink()}/><rect x="156" y="236" width="288" height="150" fill="url(#st-dots)"/>
      <path d="M142 242L300 176L458 242Z" fill="#7a3a3a" ${ink()}/>${[204, 218, 231].map(y => { const h = (y - 176) / 66 * 158 - 5; return `<path d="M${(300 - h).toFixed(1)} ${y}H${(300 + h).toFixed(1)}" stroke="#5e2a2a" stroke-width="2"/>`; }).join('')}
      <circle cx="300" cy="214" r="17" fill="#fff8ec" ${ink(2.4)}/><path d="M300 214V203M300 214l7 4" ${ink(2)}/><circle cx="300" cy="214" r="1.6" fill="${INK}"/>
      ${[0, 90, 180, 270].map(a => { const r = a * Math.PI / 180; return `<path d="M${(300 + 13 * Math.sin(r)).toFixed(1)} ${(214 - 13 * Math.cos(r)).toFixed(1)}l${(1.6 * Math.sin(r)).toFixed(1)} ${(-1.6 * Math.cos(r)).toFixed(1)}" ${ink(1.6)}/>`; }).join('')}
      <rect x="226" y="246" width="148" height="28" rx="4" fill="#1e2a5a" ${ink(2.2)}/><text x="300" y="266" class="st-pop-t st-jp" font-size="16" text-anchor="middle" fill="#fff8ec">ねこまち駅</text>`
      + [0, 1, 2].map(i => { const x = 178 + i * 84;
        return `<path d="M${x} 386V312q0-22 31-22t31 22V386z" fill="#ffe7a0" ${ink(2.4)}/><path d="M${x} 386V312q0-22 31-22t31 22V386z" fill="url(#st-glow)" opacity=".5"/>`
          + [8, 26, 44].map(dx => `<rect x="${x + dx}" y="350" width="10" height="34" rx="2" fill="#3a3550" ${ink(1.6)}/><circle cx="${x + dx + 5}" cy="356" r="2.2" fill="${(i + dx) % 3 ? '#6bff9a' : '#ff6a6a'}"/>`).join(''); }).join('')
      + [170, 254, 338, 422].map(x => `<rect x="${x}" y="284" width="8" height="102" fill="#9c8870" ${ink(1.8)}/>`).join('');
    // right: a game centre with a vertical neon, and a little yakitori bar with red lanterns
    s += `<rect x="452" y="222" width="104" height="164" fill="#4a2a6a" ${ink()}/><rect x="452" y="222" width="104" height="164" fill="url(#st-dots)"/><rect x="448" y="214" width="112" height="12" rx="3" fill="#331d4a" ${ink(2.2)}/>`
      + win(500, 244, 'tv') + win(500, 312, 'lit') + `<rect x="462" y="236" width="28" height="140" rx="5" fill="${INK}"/>`
      + ['ゲ', 'ー', 'セ', 'ン'].map((ch, i) => neon(476, 262 + i * 30, 17, ch, '#ff4fd8')).join('');
    s += `<rect x="556" y="252" width="96" height="134" fill="#5a2a24" ${ink()}/><rect x="556" y="252" width="96" height="134" fill="url(#st-dots)"/><rect x="552" y="244" width="104" height="12" rx="3" fill="#401c18" ${ink(2.2)}/>`
      + `<rect x="566" y="264" width="62" height="22" rx="3" fill="#f6ead0" ${ink(2)}/><text x="597" y="280" class="st-pop-t st-jp" font-size="12" text-anchor="middle" fill="#8a2a1a">やきとり</text>`
      + win(574, 300, 'lit', 32, 30)
      + [572, 624].map(x => `<path d="M${x} 340v6" ${ink(1.6)}/><ellipse cx="${x}" cy="360" rx="9" ry="12" fill="#ff4f3a" ${ink(2)}/><path d="M${x - 9} 360h18M${x - 7} 352h14M${x - 7} 368h14" stroke="${INK}" stroke-width="1" opacity=".5"/><rect x="${x - 4}" y="346" width="8" height="3" fill="${INK}"/><rect x="${x - 4}" y="371" width="8" height="3" fill="${INK}"/>`).join('');
    // the station-front wall behind the machines: tiles, the street's neon, the timetable, a festival poster, a taxi sign
    s += `<rect x="-10" y="384" width="${WW + 20}" height="280" fill="#4f5578" ${ink()}/><rect x="-10" y="384" width="${WW + 20}" height="280" fill="url(#st-dots)"/>
      <path d="${[412, 440, 468, 496, 524, 552, 580, 608, 636].map(y => `M-10 ${y}H${WW + 10}`).join('')}" stroke="#5f6690" stroke-width="1.4"/>
      <rect x="128" y="392" width="134" height="40" rx="6" fill="${INK}"/><g class="st-mainsign">${neon(195, 419, 19, '駅前通り', '#3ff4ff')}</g>
      <rect x="276" y="392" width="58" height="46" rx="3" fill="#1e2a5a" ${ink(2)}/><text x="305" y="403" class="st-sign" font-size="7.5" text-anchor="middle" fill="#fff8ec">時刻表</text>
      ${[0, 1, 2].map(r => `<path d="M282 ${412 + r * 8}h12M300 ${412 + r * 8}h8M314 ${412 + r * 8}h14" stroke="#ffd23f" stroke-width="2.2" stroke-linecap="round"/>`).join('')}
      <g transform="rotate(-5 370 416)"><rect x="346" y="394" width="48" height="44" fill="#ffe14a" ${ink(2)}/><text x="370" y="405" class="st-sign" font-size="7" text-anchor="middle" fill="${INK}">ねこまつり</text>
        <circle cx="370" cy="420" r="8" fill="#fff" ${ink(1.6)}/><path d="M364 414l1-5 4 3zM376 414l-1-5-4 3z" fill="#fff" ${ink(1.4)}/><path d="M367 420q1 1 2 0M371 420q1 1 2 0" fill="none" ${ink(1)}/><path d="M352 433h36" ${ink(1)} opacity=".5"/></g>
      <rect x="410" y="398" width="46" height="30" rx="4" fill="#ffd23f" ${ink(2)}/><text x="433" y="411" class="st-pop-t" font-size="9" text-anchor="middle" fill="${INK}">TAXI</text><text x="433" y="423" class="st-sign" font-size="7" text-anchor="middle" fill="${INK}">のりば</text>`;
    // the lamp post with a bus-stop sign on top, its pool of light
    s += `<path d="M58 392L-8 652H168Z" fill="url(#st-glow)"/>
      <rect x="18" y="246" width="11" height="414" rx="3" fill="#8e86a8" ${ink()}/><circle cx="23.5" cy="236" r="15" fill="#ffd23f" ${ink(2.4)}/><text x="23.5" y="240.5" class="st-sign" font-size="10" text-anchor="middle" fill="${INK}">バス</text>
      <rect x="28" y="312" width="20" height="28" rx="4" fill="#a39cbd" ${ink(2)}/><path d="M29 368h20q9 0 9 9" fill="none" ${ink()}/><path d="M48 377h20l-3 8H51z" fill="#fff3b0" ${ink(2)}/>
      <rect x="2" y="440" width="42" height="22" rx="4" fill="#3c7cff" ${ink(2)}/><text x="23" y="455.5" class="st-sign" font-size="10" text-anchor="middle" fill="#fff">駅前</text>`;
    // pavement, the kerb, the road with a zebra crossing
    s += `<rect x="-10" y="650" width="${WW + 20}" height="58" fill="#4a4270" ${ink(2.2)}/><path d="M-10 679H${WW + 10}${Array.from({ length: Math.ceil(WW / 26) + 1 }, (_, i) => `M${13 + i * 26} 652V706`).join('')}" stroke="#625a8c" stroke-width="1.6"/>
      <rect x="-10" y="704" width="${WW + 20}" height="12" fill="url(#st-haz)" ${ink(2.2)}/><rect x="-10" y="716" width="${WW + 20}" height="150" fill="#221c3c"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${206 + i * 26}" y="770" width="14" height="70" fill="#efe8f8" opacity=".72"/>`).join('')}`;
    // a flower bed at the post's foot
    s += `<rect x="2" y="626" width="46" height="26" rx="3" fill="#8a6a4a" ${ink(2)}/><path d="M6 626q4-14 8-2q4-16 9-1q5-14 9 0q5-15 9 2" fill="#7fd99a" ${ink(1.8)}/>`
      + [[10, 616, '#ff8fb8'], [22, 612, '#ffe14a'], [34, 616, '#ff8fb8'], [42, 620, '#fff6d6']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}" ${ink(1.4)}/>`).join('');
    return s;
  }
  const BACK = { nandemo: backdrop, ekimae: backdropEki };

  /* ---------- the machines in miniature (front view) ---------- */
  const STICK = {
    star: (x, y) => `<path d="M${x} ${y - 6}l1.8 4 4.2.4-3.2 2.8 1 4.2L${x} ${y + 3.2}l-3.8 2.2 1-4.2-3.2-2.8 4.2-.4z" fill="#ffd23f" ${ink(1.4)}/>`,
    heart: (x, y) => `<path d="M${x} ${y + 5}q-7-4-7-8a3.6 3.6 0 0 1 7-1.4a3.6 3.6 0 0 1 7 1.4q0 4-7 8z" fill="#3ff4ff" ${ink(1.4)}/>`,
    paw: (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" ${ink(1.4)}/><ellipse cx="${x}" cy="${y + 1.5}" rx="2.4" ry="2" fill="#ff4f8b"/><circle cx="${x - 2.6}" cy="${y - 2}" r="1" fill="#ff4f8b"/><circle cx="${x}" cy="${y - 3}" r="1" fill="#ff4f8b"/><circle cx="${x + 2.6}" cy="${y - 2}" r="1" fill="#ff4f8b"/>`,
  };
  const shell = (x, c) => `<rect x="${x + 82}" y="458" width="14" height="193" rx="4" fill="${c.side}" ${ink()}/>${STICK[c.sticker](x + 89, 600)}`
    + `<rect x="${x}" y="460" width="90" height="191" rx="7" fill="${c.body}" ${ink()}/>`
    + `<rect x="${x - 3}" y="450" width="100" height="14" rx="5" fill="${c.lid}" ${ink()}/>`
    + `<path d="M${x + 5.5} 470V518" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>`
    + `<rect x="${x + 8}" y="651" width="13" height="6" rx="2" fill="${INK}"/><rect x="${x + 70}" y="651" width="13" height="6" rx="2" fill="${INK}"/>`;
  const header = (x, txt, fg) => `<rect x="${x + 7}" y="469" width="76" height="19" rx="5" fill="#fff6c8" ${ink(2.2)}/><text x="${x + 45}" y="483" class="st-sign" font-size="11" text-anchor="middle" fill="${fg}">${txt}</text>`;
  const kick = x => `<path d="M${x + 10} 639h70M${x + 10} 644h70" stroke="${INK}" stroke-width="1.4" opacity=".35"/>`;
  // the mini machines show what they really sell: L = the lineup's products (colour, can or bottle, hot or iced)
  // (v0.39) a look from the catalog: ミズイロ in cherry-blossom pink, here and up close
  const SAKURA = { body: '#ffc6da', side: '#e8789f', lid: '#ffe3ee', sticker: 'heart', head: '#d9467a', panel: '#d9578a', wave: '#ffe3ee' };
  let forceSkin = null;
  const skinOf = id => id === 'drink' && (forceSkin === 'sakura' || (forceSkin === null && typeof PAY !== 'undefined' && PAY.on('skin-sakura'))) ? SAKURA : null;
  function drink(x, L) {
    const items = L || ['#eaf4ff', '#b8f05a', '#ffa3bd', '#c08048', '#ffd84a'].map((c, k) => ({ fill: c, kind: k % 2 ? 'can' : 'bottle' }));
    const k2 = skinOf('drink'), P = k2 || { head: '#2f73d6', panel: '#3d72cf', wave: '#bfe6ff' };
    let s = shell(x, k2 || SKIN.drink) + header(x, 'ミズイロ', P.head) + `<rect x="${x + 7}" y="493" width="76" height="40" rx="3" fill="#f2f9ff" ${ink(2)}/>`;
    s += items.map((p, k) => { const cx = x + 15 + k * 15;
      return p.kind === 'bottle' ? `<rect x="${cx - 3.5}" y="503" width="7" height="17" rx="3" fill="${p.fill}" ${ink(1.6)}/><rect x="${cx - 2}" y="499.4" width="4" height="4" rx="1" fill="#7fb6ff" ${ink(1.2)}/>`
        : `<rect x="${cx - 4}" y="506" width="8" height="14" rx="2.6" fill="${p.fill}" ${ink(1.6)}/>`; }).join('');
    s += items.map((_, k) => `<rect x="${x + 11 + k * 15}" y="524" width="8" height="4" rx="1.5" fill="${k > 2 ? '#ff7a6b' : '#5aa9ff'}"/><rect class="tk-flash" style="animation-delay:${(k * .12).toFixed(2)}s" x="${x + 11 + k * 15}" y="524" width="8" height="4" rx="1.5" fill="#fffbe0"/><rect x="${x + 11 + k * 15}" y="537" width="8" height="5" rx="2" fill="#fff" ${ink(1.4)}/>`).join('');
    s += `<rect x="${x + 7}" y="548" width="56" height="45" rx="4" fill="${P.panel}" ${ink(2)}/><path d="M${x + 22} 556q-8 10-8 15a8 8 0 0 0 16 0q0-5-8-15z" fill="${P.wave}" ${ink(1.6)}/>
      <path d="M${x + 36} 566q4-3 8 0t8 0M${x + 36} 575q4-3 8 0t8 0M${x + 13} 586q4-3 8 0t8 0t8 0t8 0" fill="none" stroke="${P.wave}" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="${x + 68}" y="548" width="12" height="18" rx="3" fill="#e9f5ff" ${ink(1.8)}/><path d="M${x + 74} 552v10" ${ink(1.6)}/><circle cx="${x + 74}" cy="576" r="4.6" fill="#e9f5ff" ${ink(1.6)}/>
      <rect x="${x + 12}" y="604" width="66" height="24" rx="5" fill="${INK}"/><path d="M${x + 16} 610h58" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/>`;
    return s + kick(x);
  }
  function spiral(x, L) {
    const goods = L ? [0, 1, 2, 3].map(r => [0, 1, 2].map(c => L[r * 4 + c].fill))
      : [['#ffd84a', '#ff7a7a', '#b8f05a'], ['#a8794a', '#ff9ec0', '#7fe0e0'], ['#ff8a6b', '#ffc26b', '#ffb3c8'], ['#ffe66b', '#ff9ec0', '#9b8cff']];
    let s = shell(x, SKIN.spiral) + header(x, 'なんでも', '#e23d78') + `<rect x="${x + 6}" y="493" width="60" height="104" rx="3" fill="#fff4f8" ${ink(2)}/>`;
    goods.forEach((row, r) => { const y = 498 + r * 25;
      row.forEach((c, k) => { const cx = x + 16 + k * 20;
        s += `<rect x="${cx - 6}" y="${y}" width="12" height="13" rx="3" fill="${c}" ${ink(1.5)}/><path d="M${cx - 7} ${y + 17}q2-3 4 0t4 0t4 0t4 0" fill="none" stroke="#9a8fb0" stroke-width="1.4" stroke-linecap="round"/>`; });
      s += `<path d="M${x + 8} ${y + 21}h56" stroke="${INK}" stroke-width="1.4" opacity=".4"/>`; });
    s += `<path d="M${x + 12} 497l-4 20" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`
      + Array.from({ length: 10 }, (_, k) => `<circle cx="${x + 73 + (k % 2) * 7}" cy="${499 + Math.floor(k / 2) * 8}" r="2.4" fill="#fff" ${ink(1.3)}/><circle class="tk-flash" style="animation-delay:${(k * .07).toFixed(2)}s" cx="${x + 73 + (k % 2) * 7}" cy="${499 + Math.floor(k / 2) * 8}" r="1.7" fill="#ffd23f"/>`).join('')
      + `<rect x="${x + 70}" y="545" width="12" height="18" rx="3" fill="#ffe9f1" ${ink(1.8)}/><path d="M${x + 76} 549v10" ${ink(1.6)}/>
      <rect x="${x + 8}" y="604" width="58" height="24" rx="5" fill="${INK}"/><text x="${x + 37}" y="619.5" font-size="7" text-anchor="middle" fill="#ffd4e4" class="st-num">PUSH</text>`;
    return s + kick(x);
  }
  function cup(x, L) {
    let s = shell(x, SKIN.cup) + header(x, 'ヨルカフェ', '#8a4a22');
    for (let k = 0; k < 6; k++) { const c = k % 3, r = Math.floor(k / 3), tx = x + 7 + c * 21, ty = 493 + r * 26, ice = L ? !!L[k].ice : r === 1;
      s += `<rect x="${tx}" y="${ty}" width="19" height="23" rx="3" fill="#fff8ee" ${ink(1.6)}/>`
        + (ice ? `<path d="M${tx + 5} ${ty + 6}h9l-1.2 11h-6.6z" fill="#cfe9ff" ${ink(1.3)}/>`
          : `<path d="M${tx + 5} ${ty + 8}h9l-1 9h-7z" fill="#fff" ${ink(1.3)}/><path d="M${tx + 8} ${ty + 5.5}q-1-2 0-3M${tx + 11} ${ty + 5.5}q-1-2 0-3" fill="none" stroke="#c9a79a" stroke-width="1.1" stroke-linecap="round"/>`)
        + `<rect x="${tx + 3}" y="${ty + 19.5}" width="13" height="2" rx="1" fill="${ice ? '#5aa9ff' : '#ff7a6b'}"/>`; }
    s += `<rect x="${x + 70}" y="494" width="12" height="18" rx="3" fill="#fff1e2" ${ink(1.8)}/><path d="M${x + 76} 498v10" ${ink(1.6)}/>
      <rect x="${x + 26}" y="550" width="38" height="45" rx="4" fill="#4a3346" ${ink(2)}/><path d="M${x + 39} 573h12l-1.4 14h-9.2z" fill="#fff" ${ink(1.3)}/>
      <path d="M${x + 42} 569q-1.5-3 0-6M${x + 47} 569q-1.5-3 0-6" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <path class="tk-puff" d="M${x + 40} 563q-2.4-4 0-8M${x + 45} 562q-2.4-4 0-9M${x + 50} 563q-2.4-4 0-8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
      <rect x="${x + 7}" y="603" width="76" height="29" rx="4" fill="#5a3322" ${ink(2)}/><text x="${x + 45}" y="622" class="st-sign" font-size="10" text-anchor="middle" fill="#ffc08a">一杯ずつ</text>`;
    return s + kick(x);
  }
  function ramen(x, L) {
    const bowls = L || [['#c98a4b', '#7fc96b'], ['#8a5a32', '#f2c46a'], ['#7a4a2a', '#ff8fa8'], ['#c98a4b', '#d9963b']].map(([fill, top]) => ({ fill, top }));
    let s = shell(x, SKIN.ramen) + header(x, 'ゆげ屋', '#c8452f');
    s += [0, 1, 2].map(i => `<path d="M${x + 7 + i * 26} 490h24v9q-6 2-12 0t-12 0z" fill="${i === 1 ? '#c8452f' : '#3b2a52'}" ${ink(1.6)}/>`).join('');
    s += bowls.slice(0, 4).map((b, k) => { const tx = x + 7 + k * 15.5; return `<rect x="${tx}" y="503" width="14" height="22" rx="3" fill="#fff8ee" ${ink(1.5)}/><path d="M${tx + 2} 512h10q-1 5-5 5t-5-5z" fill="#c8452f" ${ink(1.2)}/><ellipse cx="${tx + 7}" cy="512" rx="5" ry="1.4" fill="${b.fill}"/><circle cx="${tx + 8.6}" cy="511.4" r="1.4" fill="${b.top || '#ffcc66'}"/><rect x="${tx + 4}" y="520" width="6" height="2" rx="1" fill="#ff7a6b"/>`; }).join('');
    s += `<rect x="${x + 68}" y="503" width="15" height="12" rx="2" fill="${INK}"/><text x="${x + 75.5}" y="512.6" class="st-num tk-nix" font-size="8" text-anchor="middle" fill="#ffb347">25</text>
      <rect x="${x + 70}" y="519" width="12" height="18" rx="3" fill="#ffe9e0" ${ink(1.8)}/><path d="M${x + 76} 523v10" ${ink(1.6)}/>
      <rect x="${x + 7}" y="531" width="58" height="34" rx="4" fill="#2a1a14" ${ink(2)}/><path d="M${x + 20} 551h32q-2 9-16 9t-16-9z" fill="none" stroke="#ffb347" stroke-width="1.8"/><path d="M${x + 30} 545q-2-4 0-7M${x + 36} 545q-2-4 0-7M${x + 42} 545q-2-4 0-7" fill="none" stroke="#fff6d6" stroke-width="1.4" stroke-linecap="round"/>
      <path class="tk-puff" d="M${x + 26} 543q-3-5 0-10M${x + 36} 542q-3-5 0-11M${x + 46} 543q-3-5 0-10" fill="none" stroke="#fff6d6" stroke-width="1.9" stroke-linecap="round"/>
      <rect x="${x + 16}" y="575" width="58" height="28" rx="5" fill="${INK}"/><path d="M${x + 20} 581h50" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/><text x="${x + 45}" y="597" font-size="7" text-anchor="middle" fill="#ffb59a" class="st-num">できあがり</text>`;
    return s + kick(x);
  }
  function juice(x, L) {
    const fruits = (L || ['#ff9a2e', '#ff8a1e', '#ffe14a'].map(fill => ({ fill }))).filter(Boolean), n = fruits.length;
    let s = shell(x, SKIN.juice) + header(x, 'しぼりたて', '#d9700a') + `<rect x="${x + 7}" y="493" width="60" height="62" rx="3" fill="#eef7ff" ${ink(2)}/>`;
    // the window full of fruit, one compartment per lineup item, the press and a cup under it
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) s += `<circle cx="${x + 12.5 + c * 9.4 + (r % 2) * 1.6}" cy="${502 + r * 7.6}" r="4.3" fill="${fruits[Math.min(n - 1, Math.floor(c * n / 6))].fill}" ${ink(1.3)}/>`;
    s += `<path d="M${x + 9} 524h56" stroke="${INK}" stroke-width="1.4" opacity=".4"/><rect class="tk-pl" x="${x + 22}" y="530" width="9" height="8" rx="2" fill="#c9d0da" ${ink(1.4)}/><rect class="tk-pr" x="${x + 43}" y="530" width="9" height="8" rx="2" fill="#c9d0da" ${ink(1.4)}/>
      <path d="M${x + 33} 539h8l-1.2 12h-5.6z" fill="#fff" ${ink(1.4)}/><path d="M${x + 33.5} 544h7l-.8 7h-5.4z" fill="${fruits[0].fill}"/><circle class="tk-drop" cx="${x + 37}" cy="537.5" r="1.5" fill="${fruits[0].fill}" ${ink(.8)}/><path d="M${x + 12} 497l-4 20" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
      <rect x="${x + 70}" y="494" width="12" height="18" rx="3" fill="#fff4dc" ${ink(1.8)}/><path d="M${x + 76} 498v10" ${ink(1.6)}/>
      <circle cx="${x + 76}" cy="527" r="7.4" fill="#ffd23f" ${ink(1.8)}/><text x="${x + 76}" y="530" class="st-sign" font-size="7" text-anchor="middle" fill="${INK}">4個</text>
      <rect x="${x + 7}" y="561" width="60" height="18" rx="3" fill="#2a2014" ${ink(2)}/>${fruits.map((p, k) => `<circle cx="${x + 7 + (k + .5) * 60 / n}" cy="570" r="4.4" fill="${p.fill}" ${ink(1.3)}/>`).join('')}
      <rect x="${x + 16}" y="589" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 20} 595h50" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/><text x="${x + 45}" y="615" font-size="7" text-anchor="middle" fill="#ffd27a" class="st-num">FRESH 100%</text>`;
    return s + kick(x);
  }
  function auto(x, L) {
    const items = L || [{ fill: '#ff9aa8', row: 0 }, { fill: '#ffd23f', row: 0 }], toast = items.filter(p => p.row === 0), burger = items.find(p => p.row === 1), curry = items.find(p => p.row === 2);
    let s = shell(x, SKIN.auto) + header(x, 'オート', '#1f7a6c');
    // three panels: toast; burger and curry (blank SOON plates until their modules are fitted)
    s += `<rect x="${x + 7}" y="493" width="60" height="30" rx="3" fill="#fff8ee" ${ink(2)}/>` + toast.slice(0, 2).map((p, k) => { const cx = x + 22 + k * 30;
      return `<path d="M${cx - 9} 515L${cx} 500L${cx + 9} 515Z" fill="#dfe5ec" ${ink(1.5)}/><path d="M${cx - 5} 512.6h10" stroke="${p.fill}" stroke-width="2.6"/>`; }).join('');
    const plate = (y, p, draw) => p ? `<rect x="${x + 7}" y="${y}" width="60" height="26" rx="3" fill="#fff8ee" ${ink(2)}/>${draw(x + 37, y + 13, p)}`
      : `<rect x="${x + 7}" y="${y}" width="60" height="26" rx="3" fill="#cfc8bc" ${ink(2)}/><text x="${x + 37}" y="${y + 16.5}" class="st-sign" font-size="8" text-anchor="middle" fill="#7a7266">SOON</text>`;
    s += plate(527, burger, (cx, cy) => `<path d="M${cx - 10} ${cy}q0-9 10-9t10 9z" fill="#e8a24a" ${ink(1.5)}/><rect x="${cx - 10}" y="${cy + 1}" width="20" height="3" fill="#6a3a1e"/><rect x="${cx - 10}" y="${cy + 5}" width="20" height="4" rx="2" fill="#e8a24a" ${ink(1.3)}/>`);
    s += plate(557, curry, (cx, cy, p) => `<ellipse cx="${cx}" cy="${cy + 3}" rx="16" ry="6" fill="#fff" ${ink(1.5)}/><path d="M${cx} ${cy - 3}a14 5 0 0 1 14 5a14 5 0 0 1-14 5z" fill="${p.fill}"/>`);
    s += `<rect x="${x + 70}" y="494" width="12" height="18" rx="3" fill="#e6f7f3" ${ink(1.8)}/><path d="M${x + 76} 498v10" ${ink(1.6)}/>
      <rect x="${x + 68}" y="520" width="15" height="12" rx="2" fill="${INK}"/><text x="${x + 75.5}" y="529.6" class="st-num tk-nix" font-size="8" text-anchor="middle" fill="#ffb347">25</text>
      <rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 20} 596h50" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/><text x="${x + 45}" y="616" font-size="7" text-anchor="middle" fill="#9fe3d6" class="st-num">HOT MENU</text>`;
    return s + kick(x);
  }
  function digital(x, L) {
    const rows = (L || ['#3fb8ff', '#9aa6b8', '#2a6ad9', '#c8a040', '#ff4f8b'].map(fill => ({ fill }))).slice(0, 5);
    let s = shell(x, SKIN.digital) + header(x, 'ピコ堂', '#5a34c0') + `<rect x="${x + 7}" y="493" width="60" height="62" rx="3" fill="#eef0ff" ${ink(2)}/>`;
    // the shelf grid in the window, a box per cell coloured by its shelf's product; the gantry rail with its carriage
    rows.forEach((p, r) => { for (let c = 0; c < 5; c++) s += `<rect x="${x + 11 + c * 11}" y="${500 + r * 10.6}" width="8" height="6.6" rx="1" fill="${p.fill}" ${ink(1.2)}/>`; });
    s += `<path d="M${x + 9} 497h56" stroke="${INK}" stroke-width="2"/><rect class="tk-car" x="${x + 32}" y="494" width="8" height="7" rx="1" fill="#8a5cff" ${ink(1.3)}/>`;
    s += `<rect x="${x + 7}" y="561" width="60" height="18" rx="3" fill="#141a2a" ${ink(2)}/>` + rows.map((p, k) => `<rect x="${x + 10 + k * 11.4}" y="564" width="9" height="12" rx="1.5" fill="${p.fill}" opacity=".85"/>`).join('');
    s += `<rect x="${x + 70}" y="494" width="12" height="18" rx="3" fill="#efeaff" ${ink(1.8)}/><path d="M${x + 76} 498v10" ${ink(1.6)}/>
      <rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 20} 596h50" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/><text x="${x + 45}" y="616" font-size="7" text-anchor="middle" fill="#c4b0ff" class="st-num">GADGET</text>`;
    return s + kick(x);
  }
  function frozen(x, L) {
    const items = (L || ['#fff4d6', '#f2d29a', '#f2c46a', '#e8453a'].map(fill => ({ fill }))).slice(0, 5);
    let s = shell(x, SKIN.frozen) + header(x, 'ゆきんこ', '#2a7fb0');
    // a lit panel per shelf (a picture, the name lines, a blue button), the temperature, the cold sign
    s += items.map((p, i) => { const y = 493 + i * (items.length > 4 ? 12 : 14.6); return `<rect x="${x + 7}" y="${y}" width="60" height="${items.length > 4 ? 10.4 : 12.6}" rx="2" fill="#f4fbff" ${ink(1.6)}/><rect x="${x + 9}" y="${y + 2}" width="9" height="6.6" rx="1" fill="${p.fill}" ${ink(1.2)}/><path d="M${x + 22} ${y + 4}h26M${x + 22} ${y + 7.4}h16" stroke="#9aa6b8" stroke-width="1.4"/><circle cx="${x + 61}" cy="${y + 5.4}" r="2.6" fill="#2a6ad9" ${ink(1.2)}/>`; }).join('');
    s += `<rect x="${x + 70}" y="494" width="12" height="18" rx="3" fill="#e6f6ff" ${ink(1.8)}/><path d="M${x + 76} 498v10" ${ink(1.6)}/><rect x="${x + 68}" y="520" width="15" height="10" rx="2" fill="${INK}"/><text x="${x + 75.5}" y="527.6" class="st-num tk-nix" font-size="6" text-anchor="middle" fill="#9ae8ff">-25</text>
      <path class="tk-spark" d="${sparkD(x + 58, 501, 2.6)}" fill="#fff" ${ink(.8)}/><path class="tk-spark" style="animation-delay:.25s" d="${sparkD(x + 16, 530, 2.2)}" fill="#fff" ${ink(.8)}/>
      <rect x="${x + 7}" y="562" width="60" height="22" rx="3" fill="#0e1620" ${ink(2)}/><text x="${x + 37}" y="577.4" class="st-sign" font-size="9" text-anchor="middle" fill="#9ae8ff">れいとう</text>
      <rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 20} 596h50" stroke="#8a7d9a" stroke-width="1.6" stroke-linecap="round"/><text x="${x + 45}" y="616" font-size="7" text-anchor="middle" fill="#bfe8f5" class="st-num">-25℃</text>`;
    return s + kick(x);
  }
  function locker(x, L) {
    const rows = (L || ['#e8453a', '#3a9a3a', '#6a3a8a', '#c8964a', '#e0a040'].map(fill => ({ fill }))).slice(0, 5);
    let s = shell(x, SKIN.locker) + header(x, 'たまご小屋', '#8a4a1a');
    // a grid of little glass doors, each with a coloured bag behind it and a knob
    rows.forEach((p, r) => { for (let c = 0; c < 4; c++) { const tx = x + 7 + c * 15.4, ty = 493 + r * 18.6;
      s += `<g${r === 2 && c === 1 ? ' class="tk-door"' : r === 0 && c === 3 ? ' class="tk-door" style="animation-delay:.45s"' : ''}><rect x="${tx}" y="${ty}" width="14" height="17" rx="1.6" fill="#fff8ec" ${ink(1.4)}/><rect x="${tx + 2}" y="${ty + 2}" width="10" height="9" rx="1" fill="#e6f2fa"/><circle cx="${tx + 7}" cy="${ty + 8}" r="2.8" fill="${p.fill}" ${ink(1)}/><circle cx="${tx + 10.6}" cy="${ty + 14}" r="1.4" fill="#8a6a42"/></g>`; } });
    s += `<rect x="${x + 70}" y="494" width="12" height="40" rx="3" fill="#f6dcb0" ${ink(1.8)}/><text x="${x + 76}" y="508" class="st-sign" font-size="5" text-anchor="middle" fill="#8a4a1a">100</text><text x="${x + 76}" y="515" class="st-sign" font-size="4" text-anchor="middle" fill="#8a4a1a">円</text>
      <rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="#6a4a2e" ${ink(2)}/><text x="${x + 45}" y="611" font-size="7" text-anchor="middle" fill="#f6dcb0" class="st-sign">朝どれ</text>`;
    return s + kick(x);
  }
  function teishoku(x, L) {
    const items = (L || ['#a8742a', '#f6f2e6', '#ffd23f', '#a8642a', '#8a6a4a', '#d8964a'].map(fill => ({ fill }))).slice(0, 6);
    let s = shell(x, SKIN.teishoku) + [0, 1, 2].map(i => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><path d="M${x + 4 + i * 28} 464h27v14q-7 2-13.5 0t-13.5 0z" fill="#24346a" ${ink(1.6)}/>`
      + (i < 2 ? `<text x="${x + 17 + i * 28}" y="474" class="st-sign" font-size="8" text-anchor="middle" fill="#fff">${['定', '食'][i]}</text>` : '') + '</g>').join('');
    // the ticket buttons (a dish colour each), what comes in a set, the window on the rice stop, how to buy a ticket, the serving window
    s += `<rect x="${x + 7}" y="484" width="60" height="30" rx="2" fill="#1e1a18" ${ink(1.8)}/>` + items.map((p, k) => `<rect x="${x + 9 + (k % 3) * 19.4}" y="${487 + Math.floor(k / 3) * 13.4}" width="17" height="11" rx="1.6" fill="#fff8ec" ${ink(1.2)}/><circle cx="${x + 17.5 + (k % 3) * 19.4}" cy="${492.5 + Math.floor(k / 3) * 13.4}" r="3" fill="${p.fill}" ${ink(1)}/>`).join('');
    s += `<rect x="${x + 7}" y="518" width="60" height="12" rx="2" fill="#2a1410" ${ink(1.6)}/>` + ['#fbfaf4', '#a8742a', '#a8642a', '#6aaa4a', '#ffd23f'].map((c, i) => `<circle cx="${x + 14 + i * 11.5}" cy="524" r="3" fill="${c}" ${ink(1)}/>`).join('')
      + `<rect x="${x + 7}" y="533" width="35" height="30" rx="3" fill="#eef4ff" ${ink(2)}/>` + [0, 1, 2, 3].map(i => `<rect x="${x + 10}" y="${552 - i * 3.6}" width="9" height="3" rx=".8" fill="#c8402a" ${ink(.9)}/>`).join('')
      + `<rect x="${x + 21}" y="541" width="8" height="10" rx="2" fill="#fbfaf4" ${ink(1.2)}/><rect x="${x + 31}" y="543" width="8" height="8" rx="2" fill="#aab3bf" ${ink(1.2)}/><ellipse cx="${x + 35}" cy="543" rx="4" ry="1.4" fill="#d8a040" ${ink(.9)}/>`
      + `<rect x="${x + 20}" y="555" width="20" height="6" rx="1.5" fill="#7a2a1a" ${ink(1.2)}/><circle cx="${x + 26}" cy="557.4" r="2" fill="#fff" ${ink(.8)}/><circle cx="${x + 34}" cy="557.4" r="2" fill="#c8964a" ${ink(.8)}/>`
      + `<rect x="${x + 45}" y="533" width="22" height="30" rx="3" fill="#2a1410" ${ink(1.6)}/>` + [0, 1, 2].map(i => `<circle cx="${x + 51}" cy="${541 + i * 8}" r="2.8" fill="#ffd27a" ${ink(.9)}/><text x="${x + 51}" y="${543 + i * 8}" font-size="4.4" text-anchor="middle" fill="${INK}" class="st-num">${i + 1}</text><path d="M${x + 56} ${541 + i * 8}h8" stroke="#ffd27a" stroke-width="1.6" stroke-linecap="round"/>`).join('') + `
      <rect x="${x + 70}" y="486" width="12" height="18" rx="3" fill="#eef2ff" ${ink(1.8)}/><path d="M${x + 76} 490v10" ${ink(1.6)}/>
      <rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="#24346a"/><text x="${x + 45}" y="617" font-size="7" text-anchor="middle" fill="#ffd27a" class="st-num">23番</text>`;
    return s + kick(x);
  }
  function sushi(x, L) {
    const items = (L || ['#ffd23f', '#4aaa4a', '#b8742a', '#e8e4d8', '#ff8a4a'].map(fill => ({ fill }))).slice(0, 5), plates = ['#f4f2ec', '#3a7ad9', '#ffd23f', '#e8453a', '#1c1c22'];
    let s = shell(x, SKIN.sushi) + [0, 1, 2].map(i => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><path d="M${x + 4 + i * 28} 464h27v14q-7 2-13.5 0t-13.5 0z" fill="#d8453a" ${ink(1.6)}/>`
      + `<text x="${x + 17.5 + i * 28}" y="474" class="st-sign" font-size="${i < 2 ? 7 : 6}" text-anchor="middle" fill="#fff">${['回転', '寿司', 'すし丸'][i]}</text></g>`).join('');
    // the touch menu (a plate each), the plate board, the crest, the square window on the loop's turn, the take-out window
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#1e1a18" ${ink(1.6)}/>` + items.map((p, k) => `<ellipse cx="${x + 14 + k * 13}" cy="${494}" rx="5" ry="2.6" fill="${plates[k]}" ${ink(1)}/><ellipse cx="${x + 14 + k * 13}" cy="${491.6}" rx="3" ry="1.6" fill="${p.fill || '#ff8a4a'}" ${ink(.9)}/>`).join('');
    s += `<rect x="${x + 7}" y="504" width="30" height="58" rx="3" fill="#2a1410" ${ink(1.8)}/>` + plates.map((c, i) => `<ellipse cx="${x + 16}" cy="${513 + i * 10.4}" rx="5" ry="2.4" fill="${c}" ${ink(1)}/>` + Array.from({ length: i + 1 }, (_, j) => `<circle cx="${x + 24 + j * 2.6}" cy="${513 + i * 10.4}" r="1" fill="#ffd23f"/>`).join('')).join('')
      + `<circle cx="${x + 57}" cy="515" r="9" fill="#c83a2a" ${ink(1.6)}/><text x="${x + 57}" y="519" font-size="10" text-anchor="middle" fill="#fff" class="st-sign">寿</text>`
      + `<rect x="${x + 41}" y="528" width="32" height="30" rx="3" fill="#eef4ff" ${ink(2)}/><path d="M${x + 44} 550h16a8 8 0 0 0 0-16h-16" fill="none" stroke="#3a3f48" stroke-width="7"/><path d="M${x + 44} 550h16a8 8 0 0 0 0-16h-16" fill="none" stroke="#c9d0da" stroke-width="2"/>`
      + `<g class="tk-belt">${[[50, 548, 1], [65, 538, 3]].map(([u, v, k]) => `<g transform="translate(${x + u} ${v})"><ellipse rx="4.4" ry="2.2" fill="${plates[k]}" ${ink(1)}/><ellipse cy="-1.6" rx="2.6" ry="1.3" fill="${(items[k] || items[0]).fill || '#ff8a4a'}" ${ink(.8)}/></g>`).join('')}</g>`
      + `<rect x="${x + 76}" y="486" width="8" height="14" rx="2" fill="#fff2e4" ${ink(1.6)}/>`
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="#d8453a"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  function oden(x, L) {
    const items = (L || ['#f6e6b0', '#c8955a', '#8a8478', '#e8c890', '#fbfaf4', '#2a4a32'].map(fill => ({ fill }))).slice(0, 6), cx = x + 51.5, cy = 537;
    let s = shell(x, SKIN.oden) + [0, 1, 2].map(i => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><path d="M${x + 4 + i * 28} 464h27v14q-7 2-13.5 0t-13.5 0z" fill="#2a3a6a" ${ink(1.6)}/>`
      + `<text x="${x + 17.5 + i * 28}" y="474" class="st-sign" font-size="${i === 1 ? 7 : 5.2}" text-anchor="middle" fill="#fff">${['あつあつ', 'おでん', 'ぐつぐつ'][i]}</text></g>`).join('');
    // the menu (a bowl each), the banner, the board, the round sight glass on the pot, the take-out window
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#1e1a18" ${ink(1.6)}/>` + items.map((p, k) => `<ellipse cx="${x + 12.5 + k * 11}" cy="494" rx="4.2" ry="2.4" fill="#fbfaf4" ${ink(1)}/><circle cx="${x + 12.5 + k * 11}" cy="492" r="2" fill="${p.fill || '#e8c890'}" ${ink(.9)}/>`).join('');
    s += `<path d="M${x + 9} 505h16v54l-8-4.4-8 4.4z" fill="#c8402a" ${ink(1.6)}/>` + ['お', 'で', 'ん'].map((c, i) => `<text x="${x + 17}" y="${518 + i * 11}" font-size="8" text-anchor="middle" fill="#fff" class="st-sign">${c}</text>`).join('')
      + `<rect x="${x + 30}" y="504" width="43" height="10" rx="2" fill="#2a1410" ${ink(1.4)}/><text x="${x + 51.5}" y="511.8" font-size="5.2" text-anchor="middle" fill="#ffd27a" class="st-sign">だし自慢</text>`
      + `<circle cx="${cx}" cy="${cy}" r="18" fill="#fff4e4" stroke="#8a93a4" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="20" fill="none" ${ink(1.6)}/><ellipse cx="${cx}" cy="${cy + 5}" rx="15" ry="7" fill="#9aa3b0" ${ink(1.4)}/><ellipse cx="${cx}" cy="${cy + 2}" rx="13.6" ry="5.6" fill="#d8a040" ${ink(1.2)}/>`
      + [0, 1, 2].map(i => { const a = (i + .5) * Math.PI / 3; return `<path d="M${(cx - 13.6 * Math.cos(a)).toFixed(1)} ${(cy + 2 - 5.6 * Math.sin(a)).toFixed(1)}L${(cx + 13.6 * Math.cos(a)).toFixed(1)} ${(cy + 2 + 5.6 * Math.sin(a)).toFixed(1)}" stroke="${INK}" stroke-width=".9" opacity=".55"/>`; }).join('')
      + items.map((p, k) => { const a = k * Math.PI / 3; return `<circle cx="${(cx + 8.6 * Math.cos(a)).toFixed(1)}" cy="${(cy + 2 + 3.5 * Math.sin(a)).toFixed(1)}" r="2" fill="${p.fill || '#e8c890'}" ${ink(.8)}/>`; }).join('')
      + `<g class="tk-steam"><path d="M${cx - 6} ${cy - 4}q-2.4-4 0-7M${cx + 1} ${cy - 6}q-2.4-4 0-7M${cx + 8} ${cy - 4}q-2.4-4 0-7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`
      + `<rect x="${x + 86}" y="486" width="8" height="4" rx="1" fill="${INK}"/><ellipse cx="${x + 90}" cy="500" rx="7" ry="10" fill="#e8453a" ${ink(1.6)}/><text x="${x + 90}" y="503" font-size="6" text-anchor="middle" fill="#fff" class="st-sign">お</text><rect x="${x + 86}" y="510" width="8" height="3" rx="1" fill="${INK}"/>`
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="#2a3a6a"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  // the fish, flat, facing left (the menu, the board)
  const tFish = (cx, cy, k, c) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-12 0Q-11-6.2-4-7.2Q4-7.6 8-3.2L12.4-6.4Q14 0 12.4 6.4L8 3.2Q4 7.6-4 7.2Q-11 6.2-12 0Z" fill="${c}" ${ink(1.4 / k)}/><circle cx="-7" cy="-2.2" r="1.2" fill="${INK}"/></g>`;
  function taiyaki(x, L) {
    const items = (L || ['#6a2a2a', '#4a1a1a', '#f6d860', '#5a3018'].map(fill => ({ fill }))).slice(0, 4);
    let s = shell(x, SKIN.taiyaki) + [0, 1, 2].map(i => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><path d="M${x + 4 + i * 28} 464h27v14q-7 2-13.5 0t-13.5 0z" fill="#a8302a" ${ink(1.6)}/>`
      + `<text x="${x + 17.5 + i * 28}" y="474" class="st-sign" font-size="${i < 2 ? 7 : 4.6}" text-anchor="middle" fill="#fff">${['たい', '焼き', 'しっぽまで'][i]}</text></g>`).join('');
    // the menu (a fish each), the sign, the window on the eject station (a mould open, a fish lifted out), the crest, the board
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#1e1a18" ${ink(1.6)}/>` + items.map((p, k) => tFish(x + 15 + k * 16.4, 492, .42, '#d8902a') + `<circle cx="${x + 10.6 + k * 16.4}" cy="492" r="1.6" fill="${p.fill || '#6a2a2a'}"/>`).join('');
    s += `<rect x="${x + 7}" y="504" width="12" height="28" rx="2" fill="#2a1410" ${ink(1.4)}/>` + ['た', 'い', '焼'].map((c, i) => `<text x="${x + 13}" y="${512 + i * 8}" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-sign">${c}</text>`).join('')
      + `<rect x="${x + 22}" y="504" width="30" height="28" rx="3" fill="#fff4e4" ${ink(2)}/><path d="M${x + 26} 520h22l-3 6h-16z" fill="#3a3a42" ${ink(1.2)}/><path d="M${x + 27} 520v-12h20v12z" fill="#2a2a30" ${ink(1.2)}/>` + tFish(x + 37, 518, .62, '#d8902a')
      + `<circle cx="${x + 62}" cy="511" r="6.4" fill="#a8302a" ${ink(1.4)}/>` + tFish(x + 62, 511, .3, '#fff4dc') + `<rect x="${x + 55}" y="520" width="14" height="4.4" rx="1.2" fill="#ff8a3a" ${ink(1)}/><rect x="${x + 55}" y="526" width="14" height="4.4" rx="1.2" fill="#3a2a2a" ${ink(1)}/>`
      + `<rect x="${x + 7}" y="536" width="66" height="26" rx="3" fill="#2a1410" ${ink(1.6)}/>` + tFish(x + 40, 549, .95, '#d8902a') + `<path d="M${x + 29} 548q10-4 22-2l4-3q.6 3 0 4l-4-.6q-12 2-22 1.6z" fill="#6a2a2a"/>`
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="#a8302a"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  // a cup of shaved ice, flat: the paper cup, the dome, its syrup (the menu, the window)
  const kCup = (cx, cy, k, c) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-5 0l1.4 7h7.2l1.4-7z" fill="#fbfaf4" ${ink(1.2 / k)}/><path d="M-4.4 3.4h8.8" stroke="#3a8aff" stroke-width="${(1.2 / k).toFixed(2)}"/>`
    + `<path d="M-6 .4q0-9 6-9t6 9z" fill="#fff" ${ink(1.2 / k)}/><path d="M-4.8-2q.8-5.4 4.8-5.4t4.8 5.4q-2.4 1-4.8 1t-4.8-1z" fill="${c}"/></g>`;
  function kakigori(x, L) {
    const items = (L || ['#e83a4a', '#5ac83a', '#ffe04a', '#3a8aff'].map(fill => ({ fill }))).slice(0, 4), bl = '#2a6ad9', rd = '#e83a4a', cx = x + 41;
    let s = shell(x, SKIN.kakigori) + [0, 1, 2].map(i => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><path d="M${x + 4 + i * 28} 464h27v14q-7 2-13.5 0t-13.5 0z" fill="${bl}" ${ink(1.6)}/>`
      + `<text x="${x + 17.5 + i * 28}" y="474" class="st-sign" font-size="${i === 2 ? 5.2 : 7}" text-anchor="middle" fill="#fff">${['かき', '氷', 'ふわゆき'][i]}</text></g>`).join('');
    // the menu (a cup each), the 氷 flag, the arched window on the shaving column, the crest and its lamps, the board
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#10182a" ${ink(1.6)}/>` + items.map((p, k) => kCup(x + 15 + k * 16.4, 494, .62, p.fill || rd)).join('');
    s += `<path d="M${x + 7} 504h21" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M${x + 8} 505h19v41l-3.2-1.6-3.2 1.6-3.2-1.6-3.2 1.6-3.2-1.6-3.2 1.6z" fill="#fffdf6" ${ink(1.4)}/>`
      + `<text x="${x + 17.5}" y="524" font-size="13" text-anchor="middle" fill="${rd}" class="st-sign">氷</text><path d="M${x + 8} 534q3.2-3 6.4 0t6.4 0t6.4 0v10.4l-3.2 1.6-3.2-1.6-3.2 1.6-3.2-1.6-3.2 1.6-3.2-1.6z" fill="${bl}"/>`;
    s += `<path d="M${x + 31} 548V514a10 10 0 0 1 20 0V548z" fill="#e8f4ff" ${ink(2)}/><path d="M${cx} 505v5" stroke="#8a93a4" stroke-width="1.4"/><rect x="${cx - 4}" y="509.6" width="8" height="2" rx=".6" fill="#8a93a4" ${ink(1)}/>`
      + `<path d="M${cx - 4.6} 511.6h9.2v11h-9.2z" fill="#cfefff" ${ink(1.2)}/><ellipse cx="${cx}" cy="523.4" rx="7" ry="2.2" fill="#aab3bf" ${ink(1.2)}/>`
      + `<g class="tk-snow"><circle cx="${cx - 1}" cy="527.6" r=".9" fill="#fff" ${ink(.6)}/><circle cx="${cx + 1.4}" cy="529.4" r=".8" fill="#fff" ${ink(.6)}/></g>` + kCup(cx, 539, .8, (items[0] || {}).fill || rd)
      + `<path d="M${x + 34} 546.4h14" stroke="#8a93a4" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="${x + 62}" cy="511" r="6.4" fill="${bl}" ${ink(1.4)}/><path d="M${x + 62} 507v8M${x + 58.5} 509l7 4M${x + 58.5} 513l7-4" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`
      + `<rect x="${x + 55}" y="520" width="14" height="4.4" rx="1.2" fill="#7ad8ff" ${ink(1)}/><rect x="${x + 55}" y="526" width="14" height="4.4" rx="1.2" fill="#3a2a2a" ${ink(1)}/>`
      + `<rect x="${x + 7}" y="551" width="66" height="14" rx="2.4" fill="#10203a" ${ink(1.4)}/><text x="${x + 40}" y="560.6" font-size="6" text-anchor="middle" fill="#bfe6ff" class="st-sign">ふわふわ 削りたて</text>`
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="${bl}"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#9ad8ff" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  // a capsule, flat: the clear half above, the coloured half below
  const gCap = (cx, cy, r, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#eef7ff" ${ink(1.2)}/><path d="M${cx - r} ${cy}a${r} ${r} 0 0 0 ${2 * r} 0z" fill="${c}" ${ink(1.2)}/><circle cx="${cx - r * .35}" cy="${cy - r * .45}" r="${(r * .2).toFixed(2)}" fill="#fff"/>`;
  function gacha(x, L) {
    const items = (L || ['#ff8fb8', '#e8453a', '#3a8aff', '#5ac83a'].map(fill => ({ fill }))).slice(0, 4), pk = '#ff5fa2';
    let s = shell(x, SKIN.gacha) + [[4, pk, 'カプセル', 5.2], [32, '#3fd9ee', 'ころころ', 6.2], [60, '#ffd23f', '¥200〜', 6]].map(([dx, c, t, fs], i) => `<g class="tk-noren" style="animation-delay:${(i * .14).toFixed(2)}s"><rect x="${x + dx}" y="464" width="27" height="14" rx="5" fill="${c}" ${ink(1.6)}/>`
      + `<text x="${x + dx + 13.5}" y="473.6" class="st-sign" font-size="${fs}" text-anchor="middle" fill="#fff">${t}</text></g>`).join('');
    // the menu (a capsule each), the sign, the capsule window on the run (pegboard, ramps, a capsule), the knob, the board
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#2a1030" ${ink(1.6)}/>` + items.map((p, k) => gCap(x + 15 + k * 16.4, 492, 5, p.fill || pk)).join('');
    s += `<rect x="${x + 7}" y="504" width="12" height="44" rx="2" fill="#e8453a" ${ink(1.4)}/>` + ['ガ', 'チ', 'ャ'].map((c, i) => `<text x="${x + 13}" y="${516 + i * 11}" font-size="${c === 'ャ' ? 5.4 : 7}" text-anchor="middle" fill="#fff" class="st-sign">${c}</text>`).join('')
      + `<path d="M${x + 22} 513a9 9 0 0 1 18 0v26a9 9 0 0 1-18 0z" fill="#24307a" ${ink(2)}/>`
      + [[24, 517, 37, 520], [37, 526, 24, 529], [24, 535, 37, 538]].map(([a, b, c, d]) => `<path d="M${x + a} ${b}L${x + c} ${d}" stroke="#ffd23f" stroke-width="2.2" stroke-linecap="round"/>`).join('')
      + gCap(x + 33, 523, 2.6, items[0].fill || pk) + `<circle cx="${x + 31}" cy="508" r="2.6" fill="#ffd23f" ${ink(1)}/>`;
    s += `<circle cx="${x + 57}" cy="515" r="9" fill="#c9d0da" ${ink(1.6)}/><rect x="${x + 50}" y="513" width="14" height="4" rx="2" fill="${pk}" ${ink(1.2)}/><circle cx="${x + 57}" cy="515" r="2" fill="#fff" ${ink(1)}/>`
      + `<rect x="${x + 50}" y="529" width="14" height="4.4" rx="1.2" fill="#ffd23f" ${ink(1)}/>`
      + `<rect x="${x + 7}" y="552" width="66" height="14" rx="2.4" fill="#2a1030" ${ink(1.4)}/>` + [0, 1, 2, 3, 4].map(i => gCap(x + 15 + i * 9, 559, 3, ['#ff8fb8', '#3a8aff', '#5ac83a', '#ff9a2a', '#a07ae0'][i])).join('') + gCap(x + 64, 559, 3.6, '#ffd23f')
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v7H${x + 18}z" fill="${pk}"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffb8d8" class="st-num">とりだし口</text>`;
    return s + kick(x);
  }
  // a cup and saucer, flat (the menu, the window)
  const kCupS = (cx, cy, k, c, band) => `<g transform="translate(${cx} ${cy}) scale(${k})"><ellipse cy="5" rx="7" ry="1.8" fill="#fbfaf4" ${ink(1.2 / k)}/><path d="M-4.6-2h9.2l-1.2 6q-3.4 1.2-6.8 0z" fill="#fbfaf4" ${ink(1.2 / k)}/><path d="M-4.2 .4h8.4l-.3 1.4h-7.8z" fill="${band}"/><ellipse cy="-2" rx="4.6" ry="1.2" fill="${c}" ${ink(1 / k)}/></g>`;
  function kissa(x, L) {
    const items = (L || ['#4a2814', '#7a4a24', '#3a1e0e', '#b8875a'].map(fill => ({ fill }))).slice(0, 4), rd = '#b8283a';
    let s = shell(x, SKIN.kissa) + `<g class="tk-noren">` + Array.from({ length: 8 }, (_, i) => `<path d="M${x + 4 + i * 10.5} 464h10.5v12q-2.6 2.4-5.25 0t-5.25 0z" fill="${i % 2 ? '#fbfaf4' : rd}" ${ink(1.2)}/>`).join('')
      + `<rect x="${x + 22}" y="465" width="46" height="9" rx="4.5" fill="#5a3418" ${ink(1.2)}/><text x="${x + 45}" y="471.8" class="st-sign" font-size="5.6" text-anchor="middle" fill="#f4e6c8">珈琲 しずく</text></g>`;
    // the menu (a cup each), the neon sign, the lamps, the window on the siphon (the flask, the bowl, the cup under it), the menu card
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#2a1410" ${ink(1.6)}/>` + items.map((p, k) => kCupS(x + 15 + k * 16.4, 491.6, 1, p.fill || '#4a2814', ['#3a6ab0', '#a8302a', '#3a7a4a', '#c8a050'][k])).join('');
    s += `<rect x="${x + 7}" y="504" width="13" height="44" rx="2" fill="#160c10" ${ink(1.4)}/>` + ['純', '喫', '茶'].map((c, i) => `<text x="${x + 13.5}" y="${516 + i * 12}" font-size="8" text-anchor="middle" fill="#ff8ab8" stroke="#ff4f8b" stroke-width=".6" class="st-sign">${c}</text>`).join('')
      + `<rect x="${x + 23}" y="506" width="14" height="4" rx="1.2" fill="#ffb43a" ${ink(1)}/><rect x="${x + 23}" y="512" width="14" height="4" rx="1.2" fill="#3a2a2a" ${ink(1)}/><circle cx="${x + 30}" cy="537" r="6" fill="#5a3418" ${ink(1.2)}/><text x="${x + 30}" y="539.4" font-size="5" text-anchor="middle" fill="#f4e6c8" class="st-sign">珈琲</text>`
      + `<path d="M${x + 40} 548V508q0-4 4-4h16q4 0 4 4v40z" fill="#2a1e1a" ${ink(2)}/>` + ['#c8283a', '#e8b030', '#3a7a4a', '#3a6ab0'].map((c, i) => `<rect x="${x + 42 + i * 5}" y="506" width="4" height="2.4" fill="${c}"/>`).join('')
      + `<path d="M${x + 49} 514h6v6h-6z" fill="none" stroke="#c8e0f4" stroke-width="1.2"/><circle cx="${x + 52}" cy="528" r="6" fill="#dfeef8" ${ink(1.2)}/><path d="M${x + 46.4} 529a5.6 5.6 0 0 0 11.2 0z" fill="#3a1e0e"/><path d="M${x + 52} 520v2" stroke="#c8e0f4" stroke-width="1.6"/>`
      + `<path d="M${x + 45} 534.6a7 2 0 0 0 14 0" fill="none" stroke="#ffb43a" stroke-width="1.6"/>` + kCupS(x + 52, 541, .6, '#3a1e0e', '#3a6ab0')
      + `<rect x="${x + 7}" y="552" width="66" height="14" rx="1.6" fill="#f4e6c8" ${ink(1.4)}/><text x="${x + 40}" y="561.4" font-size="5.6" text-anchor="middle" fill="#5a3418" class="st-sign">M E N U</text>`
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v5${Array.from({ length: 9 }, () => 'q-3 2.4-6 0').join('')}z" fill="#fbfaf4"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#f4e6c8" class="st-num">お待たせしました</text>`;
    return s + kick(x);
  }
  // (the app's own) こむぎ堂: a bun, flat, side on (the menu, the window, the board)
  const pBun = (cx, cy, k, c, f) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-8 3Q-8-6 0-6Q8-6 8 3Q8 4.4 6.6 4.4H-6.6Q-8 4.4-8 3Z" fill="${c}" ${ink(1.3 / k)}/>${f ? `<circle cx="0" cy="0" r="2.2" fill="${f}"/>` : `<path d="M-4-2q4-2.4 8 0" fill="none" stroke="#f6c880" stroke-width="${(1.1 / k).toFixed(2)}"/>`}</g>`;
  function bakery(x, L) {
    const items = (L || ['#5a2a22', '#f6d860', '#a8642a', '#fff8e0'].map(fill => ({ fill }))).slice(0, 4), rd = '#8a3a1a', cr = '#fff1d6';
    let s = shell(x, SKIN.bakery) + Array.from({ length: 6 }, (_, i) => `<path d="M${x + 4 + i * 14} 464h14v12q-3.5 3-7 0t-7 0z" fill="${i % 2 ? cr : rd}" ${ink(1.4)}/>`).join('')
      + `<rect x="${x + 22}" y="466" width="46" height="9" rx="2" fill="${rd}" ${ink(1.2)}/><text x="${x + 45}" y="473" font-size="6" text-anchor="middle" fill="#fff" class="st-sign">こむぎ堂</text>`;
    // the menu (a bun each), the sign, the window on the oven's mouth (the belt, a golden bun out of the tunnel), the lamps, the board
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#1e1a18" ${ink(1.6)}/>` + items.map((p, k) => pBun(x + 15 + k * 16.4, 493, .62, '#c97c2c', p.fill)).join('');
    s += `<rect x="${x + 7}" y="504" width="13" height="28" rx="2" fill="#2a1410" ${ink(1.4)}/>` + ['こ', 'む', 'ぎ'].map((c, i) => `<text x="${x + 13.5}" y="${512 + i * 8}" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-sign">${c}</text>`).join('')
      + `<rect x="${x + 23}" y="504" width="34" height="28" rx="3" fill="#fff4e4" ${ink(2)}/><rect x="${x + 25}" y="522" width="30" height="4" fill="#3a3a42" ${ink(1)}/><path d="M${x + 39} 508h16v14h-16z" fill="#5a5e68" ${ink(1.2)}/><rect x="${x + 41}" y="512" width="12" height="3" rx="1" fill="#ff8a2a"/>`
      + pBun(x + 33, 519, .5, '#c97c2c') + `<rect x="${x + 60}" y="506" width="13" height="4.4" rx="1.2" fill="#ff8a3a" ${ink(1)}/><rect x="${x + 60}" y="512" width="13" height="4.4" rx="1.2" fill="#ffd23f" ${ink(1)}/>`
      + `<rect x="${x + 7}" y="536" width="66" height="26" rx="3" fill="#2a1410" ${ink(1.6)}/>` + pBun(x + 40, 550, 1.3, '#c97c2c', '#5a2a22')
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="${rd}"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  // (the app's own) てっぱん丸: a boat of three balls, flat, side on (the menu, the board)
  const tBoat = (cx, cy, k, c) => `<g transform="translate(${cx} ${cy}) scale(${k})">${[-5, 0, 5].map(u => `<circle cx="${u}" cy="-1" r="3.2" fill="#d8903a" ${ink(1.2 / k)}/>`).join('')}<path d="M-8-1.6Q-5-4.4-2.2-2Q0-4.4 2.4-2Q5-4.4 8-1.6" fill="none" stroke="${c || '#4a2210'}" stroke-width="${(1.6 / k).toFixed(2)}" stroke-linecap="round"/><path d="M-9.4 1H9.4L7.6 5H-7.6Z" fill="#e2c890" ${ink(1.2 / k)}/></g>`;
  function teppan(x, L) {
    const items = (L || ['#4a2210', '#c89a3a', '#a8501c', '#ffa898'].map(fill => ({ fill }))).slice(0, 4), nv = '#1f2a4a', rd = '#d8352a';
    let s = shell(x, SKIN.teppan) + Array.from({ length: 5 }, (_, i) => `<path d="M${x + 4 + i * 16.4} 464h15.6v14q-1 1.4-2 0h-11.6q-1 1.4-2 0z" fill="${nv}" ${ink(1.4)}/><text x="${x + 11.8 + i * 16.4}" y="474" font-size="7" text-anchor="middle" fill="#fff" class="st-sign">${'てっぱん丸'[i]}</text>`).join('');
    // the menu (a boat each), the lantern, the window on the griddle (dimples, balls), the lamps, the board
    s += `<rect x="${x + 7}" y="484" width="66" height="16" rx="2" fill="#1e1a18" ${ink(1.6)}/>` + items.map((p, k) => tBoat(x + 15 + k * 16.4, 493, .52, p.fill)).join('');
    s += `<path d="M${x + 9} 506Q${x + 7} 518 ${x + 9} 530H${x + 19}Q${x + 21} 518 ${x + 19} 506Z" fill="${rd}" ${ink(1.4)}/>` + ['た', 'こ'].map((c, i) => `<text x="${x + 14}" y="${515 + i * 8}" font-size="6" text-anchor="middle" fill="#fff" class="st-sign">${c}</text>`).join('')
      + `<rect x="${x + 23}" y="504" width="34" height="28" rx="3" fill="#fff4e4" ${ink(2)}/><rect x="${x + 26}" y="512" width="28" height="12" rx="1" fill="#2a2624" ${ink(1.2)}/>`
      + [0, 1].map(j => [0, 1, 2, 3, 4].map(i => `<circle cx="${x + 29 + i * 5.5}" cy="${515.5 + j * 5}" r="2" fill="#d8903a" ${ink(.8)}/>`).join('')).join('')
      + `<rect x="${x + 60}" y="506" width="13" height="4.4" rx="1.2" fill="#ff8a3a" ${ink(1)}/><rect x="${x + 60}" y="512" width="13" height="4.4" rx="1.2" fill="#ffd23f" ${ink(1)}/>`
      + `<rect x="${x + 7}" y="536" width="66" height="26" rx="3" fill="${nv}" ${ink(1.6)}/>` + tBoat(x + 40, 550, 1.3, '#4a2210')
      + `<rect x="${x + 16}" y="590" width="58" height="34" rx="5" fill="${INK}"/><path d="M${x + 18} 594h54v8q-6 2-13.5 0t-13.5 0t-13.5 0t-13.5 0z" fill="${nv}"/><text x="${x + 45}" y="617" font-size="6" text-anchor="middle" fill="#ffd27a" class="st-num">お持ち帰り</text>`;
    return s + kick(x);
  }
  const ART = { drink, spiral, cup, ramen, juice, auto, digital, frozen, locker, teishoku, sushi, oden, taiyaki, kakigori, gacha, kissa, bakery, teppan };
  function machine(id, i, name) {
    const x = xOf(i), c = SKIN[id] || SKIN.drink;
    return `<g class="st-m" data-i="${i}" role="button" tabindex="0" aria-label="${T`打开 ${name}`}">
      <rect x="${x - 6}" y="440" width="108" height="226" fill="transparent"/>
      <g class="st-bob"><g class="st-art" filter="url(#doodle)">${(ART[id] || drink)(x)}</g>
        <g class="st-stk"></g><g class="st-fig"></g>
        <g class="st-new" style="display:none"><g transform="rotate(12 ${x + 84} 470)"><rect x="${x + 66}" y="461" width="36" height="17" rx="8.5" fill="#ff4f8b" ${ink(2.2)}/><text x="${x + 84}" y="473.6" class="st-pop-t" font-size="10" text-anchor="middle" fill="#fff">NEW</text>
          <path d="${sparkD(x + 102, 458, 3)}" fill="#ffd23f" ${ink(1.2)}/></g></g>
        <g class="st-sold" style="display:none"><g transform="rotate(-11 ${x + 45} 520)"><rect x="${x + 15}" y="505" width="60" height="28" rx="6" fill="#ff4f8b" ${ink(2.4)}/><text x="${x + 45}" y="525.5" class="st-pop-t" font-size="${T`售罄`.length > 3 ? 11 : 15}" text-anchor="middle" fill="#fff">${T`售罄`}</text></g></g></g>
      <rect x="${x + 6}" y="666" width="78" height="8" rx="4" fill="#2a2446"/><rect class="st-bar" x="${x + 6}" y="666" width="78" height="8" rx="4" fill="${c.body}"/><rect x="${x + 6}" y="666" width="78" height="8" rx="4" fill="none" ${ink(2)}/>
      <g class="st-ware" style="display:none"><rect x="${x + 6}" y="677" width="78" height="5" rx="2.5" fill="#2a2446"/><rect class="st-wbar" x="${x + 6}" y="677" width="78" height="5" rx="2.5" fill="#ffd27a"/><rect x="${x + 6}" y="677" width="78" height="5" rx="2.5" fill="none" ${ink(1.4)}/></g>
      <g class="st-swap" role="button" aria-label="${T`换一台机器`}"><circle cx="${x + 95}" cy="672" r="8.5" fill="#fff8ec" ${ink(2)}/><path d="M${x + 90.6} 669.6h8l-2.4-2.4M${x + 99.4} 674.4h-8l2.4 2.4" fill="none" ${ink(1.6)}/></g>
    </g>`;
  }
  // an empty lot: a chalk outline and a + to put a machine there; a lot still to come: a building-site barrier
  function lot(j, L) {
    const x = X[j];
    if (L.state === 'open') return `<g class="st-lot" data-j="${j}" role="button" tabindex="0" aria-label="${T`空机位：摆一台机器`}">
      <rect x="${x - 6}" y="440" width="108" height="226" fill="transparent"/>
      <rect x="${x}" y="460" width="90" height="191" rx="7" fill="rgba(255,246,214,.07)" stroke="#fff6d6" stroke-width="2.4" stroke-dasharray="8 6"/>
      <g class="st-plus"><circle cx="${x + 45}" cy="540" r="18" fill="#ffd23f" ${ink(2.6)}/><path d="M${x + 45} 530v20M${x + 35} 540h20" ${ink(3.2)}/></g>
      <rect x="${x + 13}" y="574" width="64" height="22" rx="4" fill="#fff8ec" ${ink(2)}/><text x="${x + 45}" y="589.5" class="st-zh" font-size="12" text-anchor="middle" fill="${INK}">${T`摆一台`}</text>
      <path d="M${x + 4} 651l6-20h6l6 20z" fill="#ff8a24" ${ink(1.8)}/><path d="M${x + 7} 641h12" stroke="#fff" stroke-width="2.4"/></g>`;
    return `<g class="st-lot locked" data-j="${j}" role="button" tabindex="0" aria-label="${T`机位：营业额到 ${L.at} 开放`}">
      <rect x="${x - 6}" y="440" width="108" height="226" fill="transparent"/>
      <path d="M${x + 8} 651V566M${x + 82} 651V566" ${ink(3)}/><rect x="${x + 2}" y="572" width="86" height="16" rx="3" fill="url(#st-haz)" ${ink(2.2)}/><rect x="${x + 2}" y="606" width="86" height="12" rx="3" fill="url(#st-haz)" ${ink(2)}/>
      <g transform="rotate(-5 ${x + 45} 536)"><rect x="${x + 12}" y="520" width="66" height="34" rx="4" fill="#fff8ec" ${ink(2.2)}/><text x="${x + 45}" y="535" class="st-zh" font-size="10.5" text-anchor="middle" fill="${INK}">${T`准备中`}</text><text x="${x + 45}" y="548" class="st-zh" font-size="9" text-anchor="middle" fill="#e23d78">${L.trial ? L.at : T`营业额到 ${L.at}`}</text></g></g>`;
  }

  /* ---------- cats: the shop cat dozing on a machine, visitors sitting on the kerb ---------- */
  function sleeper(i, zs) {
    if (pos[i] === undefined || pos[i] < 0) return '';
    const x = xOf(i) + 50, y = 450, [a, b, e] = TIERS[0].fur, { neck, head, feet } = gear;
    // front paws peeking out under the chin: in socks or boots when worn
    const paw = px => feet ? `<rect x="${px - 4.4}" y="${y - (feet.id === 'boots-rain' ? 5.6 : 3.4)}" width="8.8" height="${feet.id === 'boots-rain' ? 7 : 5}" rx="2.4" fill="${feet.c}" ${ink(1.5)}/>`
      + (feet.id === 'socks-white' ? `<path d="M${px - 3} ${y - 1.6}h6" stroke="#ff5a6a" stroke-width="1.3" stroke-linecap="round"/>` : '')
      : `<ellipse cx="${px}" cy="${y - 1}" rx="4.2" ry="2.6" fill="${a}" ${ink(1.5)}/>`;
    let s = `<g filter="url(#doodle)"><path d="M${x - 24} ${y - 6}q-12 0-10 12q1 7 7 5" fill="none" ${ink(2.8)}/>
      <ellipse cx="${x - 6}" cy="${y - 9}" rx="21" ry="10.5" fill="${a}" ${ink()}/><path d="M${x - 20} ${y - 14}q7-6 14-2q-3 6-14 2z" fill="${b}"/><path d="M${x - 2} ${y - 18}q5-2 8 2q-4 3-8-2z" fill="${e}"/>
      <path d="M${x + 6} ${y - 21}l.9-8.4 1.2 1.8.8-1.2 5.1 4.8z" fill="${a}" ${ink(2)}/><path d="M${x + 15} ${y - 24}l7-5.5 .5 8.5z" fill="${b}" ${ink(2)}/><path d="M${x + 16.8} ${y - 24}l4-3 .3 4.4z" fill="#ffb3c8"/>
      ${paw(x + 17)}${paw(x + 25)}
      <circle cx="${x + 13}" cy="${y - 14}" r="9.5" fill="${a}" ${ink()}/><path d="M${x + 8} ${y - 14}q2 2 4 0M${x + 15} ${y - 14}q2 2 4 0" fill="none" ${ink(1.6)}/>
      <path d="M${x + 15.5} ${y - 22.6}q4 1 6.2 5.2q-3.4-.4-6.2-5.2z" fill="${b}"/>
      <ellipse cx="${x + 7}" cy="${y - 10.5}" rx="2.1" ry="1.2" fill="#ffb3c8"/><ellipse cx="${x + 19.5}" cy="${y - 10.5}" rx="2.1" ry="1.2" fill="#ffb3c8"/>
      <path d="M${x + 6} ${y - 9.8}l1-1.5M${x + 7.4} ${y - 9.8}l1-1.5M${x + 18.6} ${y - 9.8}l1-1.5M${x + 20} ${y - 9.8}l1-1.5" stroke="#ff6f92" stroke-width="1" stroke-linecap="round"/>
      <path d="M${x + 12.6} ${y - 11.6}h1.8l-.9 1z" fill="#ff7f9a"/><path d="M${x + 11.4} ${y - 10.2}q1.1 1.5 2.1.1q1 1.4 2.1-.1" fill="none" ${ink(1.2)}/>
      <path d="M${x + 21.5} ${y - 11.2}l6.5-1.6M${x + 21.5} ${y - 9.4}l6.2.8" ${ink(1)}/>`;
    // a scarf under the chin with a loose end, or a red collar with a bell
    if (neck) s += neck.id === 'bell' ? `<path d="M${x + 4.5} ${y - 6.6}q8.5 4.4 17 0" fill="none" stroke="#ff5a6a" stroke-width="2.6" stroke-linecap="round"/><circle cx="${x + 13}" cy="${y - 2.4}" r="3.3" fill="${neck.c}" ${ink(1.4)}/><path d="M${x + 11} ${y - 2.4}h4" ${ink(1)}/>`
      : `<path d="M${x + 6.4} ${y - 4.6}l-3 6.6 4.4 1.4 2.4-6.6z" fill="${neck.c}" ${ink(1.4)}/><path d="M${x + 3.5} ${y - 8.4}q9.5 5.4 19 0v4q-9.5 5.6-19 0z" fill="${neck.c}" ${ink(1.6)}/>`
        + (neck.id === 'scarf-star' ? `<path d="${sparkD(x + 9, y - 5, 1.1)}" fill="#ffe14a"/><path d="${sparkD(x + 17, y - 4.6, 1)}" fill="#ffe14a"/>` : '');
    if (head) s += head.id === 'crown' ? `<path d="M${x + 8.5} ${y - 20.5}l.8-6.5 2.6 2.8 1.6-5 1.6 5 2.6-2.8.8 6.5z" fill="${head.c}" ${ink(1.5)}/><circle cx="${x + 13.5}" cy="${y - 22.8}" r="1.2" fill="#ff4f8b"/>`
      : head.id === 'candy-clip' ? `<g transform="translate(${x + 20.5} ${y - 21.5}) rotate(-20)"><path d="M-2-1l-3.4-2v6l3.4-2zM2-1l3.4-2v6l-3.4-2z" fill="${head.c}" ${ink(1.2)}/><rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="1.6" fill="${head.c}" ${ink(1.2)}/></g>`
      : head.id === 'chef-hat' ? `<path d="M${x + 6.5} ${y - 24}q-4-1-3-5t5-3q1-4 4.5-4t4.5 4q4-1 5 3t-3 5z" fill="#fff" ${ink(1.5)}/><rect x="${x + 6}" y="${y - 25.4}" width="14" height="4.6" rx="1" fill="#fff" ${ink(1.4)}/>`
      : `<path d="M${x + 3.5} ${y - 19}q0-11 9.5-11t9.5 11z" fill="${head.c}" ${ink(1.5)}/><rect x="${x + 2.5}" y="${y - 21}" width="21" height="4.6" rx="2.3" fill="#fff" ${ink(1.4)}/><circle cx="${x + 13}" cy="${y - 29.6}" r="2.8" fill="#fff" ${ink(1.4)}/>`;
    zs.push({ id: '', x: x + 22, y: y - 28, k: 1 });
    return s + '</g>';
  }
  function drawCats() {
    if (!catsG) return;
    const zs = [];
    catsG.innerHTML = dining ? '' : neko ? NEKOART.draw(neko, j => X[j - 5 * K], zs) : sleeper(catOn, zs);
    zLayer(zs); wipe();
  }
  /* (v0.44) a sleeping cat's z is an HTML element over the street, its puff a compositor animation (transform and
     opacity). Puffed inside the street's svg, every frame of it repainted the hand-drawn cat and machine around it and
     the backdrop under them: a 0.5 s frame each time on an iPhone 13 Pro, the developers found. Each z is placed by its
     own transform (pan() moves them with the street), so its layer is no bigger than the letter */
  let zEls = [];
  function zLayer(zs) {
    const box = $('st-zs'); box.innerHTML = zs.map(z => `<b class="st-zz" data-cat="${z.id}"><i>z</i></b>`).join('');
    zEls = [...box.children].map((el, n) => ({ el, ...zs[n] })); zPlace();
  }
  const zPlace = () => zEls.forEach(z => { z.el.style.transform = `translate3d(${(fit.ox + (z.x - vx) * fit.s).toFixed(1)}px,${(fit.oy + (z.y - 9 * z.k) * fit.s).toFixed(1)}px,0) scale(${(fit.s * z.k).toFixed(3)})`; });
  const zOff = (id, on) => zEls.forEach(z => { if (z.id === id) z.el.classList.toggle('off', on); });
  // シロ polishing a machine's glass: the squeak and the sparkles, once (again now and then, from ambient())
  const wipe = () => { const w = catsG && catsG.querySelector('.nk-wipe'); if (w) UTIL.restart(w, 'go'); return !!w; };
  // mealtime (one tap on the bowl feeds everyone): the street slides to the box, every cat hops over to the bowl, eats,
  // and hops back to where it was. list: [{ id, coat, g, spot | visitor seat }]
  async function meal(list, food) {
    if (dining || !list.length) return;
    dining = true; await panTo(0); drawCats();
    const from = x => x.seat !== undefined ? NEKOART.visitXY(x.seat) : x.spot.kind === 'box' ? [NEKOART.BOX.x + 4, NEKOART.BOX.y + 10] : NEKOART.spotXY(x.spot, j => X[j - 5 * K], neko && neko.rain);
    try { await NEKOART.meal(mealG, list.map(x => ({ ...x, from: from(x) })), food); }
    finally { mealG.innerHTML = ''; dining = false; drawCats(); }
  }
  // something sold at machine i: a cat dozing on its top opens its eyes to watch it go
  function look(i) {
    if (!neko || pos[i] < 0) return;
    const c = (neko.cats || []).find(x => x.spot.kind === 'top' && x.spot.lot === pos[i] + 5 * K); if (!c) return;
    const g = catsG.querySelector(`.nk-cat[data-cat="${c.id}"]`); if (!g) return;
    g.classList.add('look'); zOff(c.id, true); clearTimeout(g._look); g._look = setTimeout(() => { g.classList.remove('look'); zOff(c.id, false); }, 1500);
  }

  /* ---------- build + public api ---------- */
  let bgId = '';
  function paintBg(id) {
    bgId = id;
    $('street-bg').innerHTML = `<defs>
        <filter id="doodle" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency=".032" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/></filter>
        <filter id="st-glow-f" x="-40%" y="-60%" width="180%" height="220%"><feGaussianBlur stdDeviation="2.4"/></filter>
        <linearGradient id="st-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="470"><stop offset="0" stop-color="#120f2b"/><stop offset=".45" stop-color="#2a1f5c"/><stop offset=".78" stop-color="#5a2f7a"/><stop offset="1" stop-color="#a33f7c"/></linearGradient>
        <radialGradient id="st-city"><stop offset="0" stop-color="#ff6f8f" stop-opacity=".5"/><stop offset="1" stop-color="#ff6f8f" stop-opacity="0"/></radialGradient>
        <linearGradient id="st-glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0" stop-opacity=".45"/><stop offset="1" stop-color="#fff3b0" stop-opacity="0"/></linearGradient>
        <pattern id="st-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".95" fill="${INK}" fill-opacity=".22"/></pattern>
        <pattern id="st-haz" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="12" fill="#ffd23f"/><rect x="6" width="6" height="12" fill="${INK}"/></pattern>
        ${symbols()}</defs>
      ${(([sky, city]) => `<g filter="url(#doodle)">${sky}</g>${railway()}<g id="st-amb-sky"></g><g filter="url(#doodle)">${city}</g><g id="st-amb-city"></g>`)(BACK[id]().split('<!--sky-->'))}`;
  }
  function init(opts) {
    ids = opts.ids; names = opts.names; onOpen = opts.onOpen || onOpen; onSign = opts.onSign || onSign; onStreet = opts.onStreet || onStreet; onDemo = opts.onDemo || onDemo; onLot = opts.onLot || onLot; onWarp = opts.onWarp || onWarp; onNeko = opts.onNeko || onNeko; onGift = opts.onGift || onGift; onBowl = opts.onBowl || onBowl; onCarry = opts.onCarry || null; carryExtra = opts.carryExtra || carryExtra;
    pos = opts.pos || ids.map((_, i) => i < X.length ? i : -1); lots = opts.lots || X.map(() => ({ state: 'machine' }));
    svg = $('street-svg');
    // the backdrop never changes (but with the street): it goes in its own layer under the live one (machines, cats, pops)
    paintBg('nandemo');
    draw();
    svg.addEventListener('click', e => { if (Date.now() < noClickUntil) return; const t = e.target.closest && e.target;
      const sw = t && t.closest('.st-swap'), m = t && t.closest('.st-m'), l = t && t.closest('.st-lot'), gift = t && t.closest('.st-gift'), cat = t && t.closest('.nk-cat, .nk-box'), bowlEl = t && t.closest('.st-bowl'), post = t && t.closest('.st-post');
      if (dining) return;
      if (gift) onGift(); else if (bowlEl) onBowl(); else if (cat) onNeko(cat.dataset.cat || 'mike'); else if (sw && m) { SND.pop(); onLot(pos[+m.dataset.i]); } else if (m) open(+m.dataset.i); else if (l) { SND.pop(); onLot(+l.dataset.j); } else if (post) { SND.pop(); onSign(); } });
    // pan the street sideways: drag (a drag is not a tap), wheel / trackpad, or the chip at the edge
    let drag = null;
    svg.addEventListener('pointerdown', e => { drag = { x: e.clientX, vx, moved: false, k: 1 / fit.s }; });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x; if (!drag.moved && Math.abs(dx) > 7) { drag.moved = true; petStop(); } if (drag.moved) pan(drag.vx - dx * drag.k); });
    // hold a cat to pet it (polish, 2026-10-15): its head leans into your hand, it purrs (the phone purrs along), hearts
    // float up; let go and it carries on as before — no card opens, nothing is counted, it is only for the two of you
    // (v0.43) the layers follow the screen's size (sizeLayers); the first fit happens as soon as the street has a size
    if (window.ResizeObserver) new ResizeObserver(() => sizeLayers()).observe($('street')); else addEventListener('resize', sizeLayers);
    sizeLayers();
    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest && e.target.closest('.nk-cat:not(.nk-visit), .nk-box'); if (!g || dining) return;
      clearTimeout(petT); petT = setTimeout(() => { if (drag && drag.moved) return; petting = g; g.classList.add('pet'); zOff(g.dataset.cat, true); beat(); petIv = setInterval(beat, 1100); }, 420);
    });
    addEventListener('pointerup', petStop); addEventListener('pointercancel', petStop);
    addEventListener('pointerup', () => { if (drag && drag.moved) noClickUntil = Date.now() + 250; drag = null; });
    svg.addEventListener('wheel', e => { const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0; if (d) { e.preventDefault(); pan(vx + d * .6); } }, { passive: false });
    $('st-more').addEventListener('click', () => { SND.pop(); panTo(vx < maxX() / 2 ? maxX() : 0); });
    pan(0);
    svg.addEventListener('keydown', e => { const m = e.target.closest && e.target.closest('.st-m'), l = e.target.closest && e.target.closest('.st-lot'), post = e.target.closest && e.target.closest('.st-post');
      if ((m || l || post) && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (m) open(+m.dataset.i); else if (l) onLot(+l.dataset.j); else onSign(); } });
    $('st-street').addEventListener('click', () => { SND.pop(); onStreet(); });
    $('st-wallet').addEventListener('click', () => sheet(true));
    // (v0.38.1) what sits under the wallet follows its real height: no forced layout, the observer reports after layout
    if (window.ResizeObserver) new ResizeObserver(es => { const e = es[0], h = e.borderBoxSize && e.borderBoxSize[0] ? e.borderBoxSize[0].blockSize : e.target.offsetHeight;
      $('street').style.setProperty('--wb', Math.round(58 + h) + 'px'); }).observe($('st-wallet'));
    $('st-sheet').addEventListener('click', e => { sheet(false); if (e.target.closest('#st-demo')) onDemo(); const w = e.target.closest('[data-warp]'); if (w) onWarp(+w.dataset.warp); });
    $('st-receipt').addEventListener('click', () => { $('st-receipt').hidden = true; });
    $('st-carry-card').addEventListener('click', () => { $('st-carry-card').hidden = true; const f = cardThen; cardThen = null; if (f) f(); });
    drawCats(0); tick(); ambT = setTimeout(ambient, 8000); snoreT = setTimeout(snore, 3000);
  }
  /* quiet moments (user, 2026-10-14: the street shows only machines and cats, customers are never seen). Every 9-16 s
     one machine that still has stock does a little something, once: lamps run, steam puffs, the noren sways, the gantry
     slides. One-shot CSS animations, nothing loops; sold-out machines stay still, and so does a hidden street. */
  let ticT = 0, awake = true;
  function tick() {
    clearTimeout(ticT); ticT = setTimeout(tick, UTIL.rand(9000, 16000));
    if (!awake || document.hidden || UTIL.reduced || UTIL.low) return;
    const g = UTIL.pick([...svg.querySelectorAll('.st-m')].filter(m => m.querySelector('.st-sold').style.display === 'none'));
    if (g) ticOn(g);
  }
  function ticOn(g) { UTIL.restart(g, 'tic'); setTimeout(() => g.classList.remove('tic'), 2500); }
  // a sleeping cat's z puffs now and then: one compositor animation each time (see zLayer)
  let snoreT = 0;
  const ZPUFF = [{ transform: 'translate(0,0)', opacity: 0 }, { offset: .2, transform: 'translate(1.2px,-2.8px)', opacity: .9 }, { transform: 'translate(6px,-14px)', opacity: 0 }];
  function snore() {
    clearTimeout(snoreT); snoreT = setTimeout(snore, UTIL.rand(6000, 10000));
    if (!awake || document.hidden || UTIL.reduced || !svg) return;
    zEls.forEach(z => { const i = z.el.firstChild; if (i.animate && !z.el.classList.contains('off')) i.animate(ZPUFF, { duration: 2800, easing: 'linear' }); });
  }
  const idle = on => { awake = on; };
  // petting a cat on the street (see init)
  let petT = 0, petIv = 0, petting = null, petN = 0;
  function petStop() { clearTimeout(petT); if (!petting) return; clearInterval(petIv); petting.classList.remove('pet'); zOff(petting.dataset.cat, false); petting = null; noClickUntil = Date.now() + 350; }
  function beat() {
    if (!petting || !petting.isConnected) { petStop(); return; }
    SND.purr(NEKO.voice(petting.dataset.cat || 'mike')[1]); UTIL.haptic([6, 60, 6, 60, 6]);
    const r = petting.getBoundingClientRect(), p = new DOMPoint(r.left + r.width / 2, r.top + 4).matrixTransform(svg.getScreenCTM().inverse());
    const t = petN++ % 2 ? T`ゴロゴロ` : '♥';
    const pop = UTIL.g(fx, `<g class="st-pop"><text text-anchor="middle" class="st-pop-t" font-size="${t === '♥' ? 16 : 11}" fill="#ff6f92" stroke="${INK}" stroke-width="2.4" paint-order="stroke">${t}</text></g>`,
      { transform: `translate(${(p.x + UTIL.rand(-6, 6)).toFixed(1)} ${p.y.toFixed(1)})` });
    setTimeout(() => pop.remove(), 1500);
  }

  /* ---------- the street's own small events (polish, 2026-10-15). The rule stays: only cats and machines, never a person,
     never a customer — so the street lives by light and weather: a train crossing behind the roofs (its lit windows only),
     a window lighting up or going dark, a neon letter stuttering, a leaf blown across the road, a cloud over the moon, a
     shooting star. One every 20-40 s, each plays once; none while the street is hidden. They sit outside the hand-drawn
     wobble filter (that filter is for the still backdrop: animating under it would redo the whole filter every frame) */
  const WINS_BY = { nandemo: [[8, 254, 'dark'], [48, 254, 'lit'], [8, 322, 'lit'], [88, 322, 'dark'], [266, 236, 'lit'], [306, 236, 'dark'], [266, 304, 'dark'], [306, 304, 'lit'],
    [426, 244, 'lit'], [426, 312, 'dark'], [574, 250, 'lit']], ekimae: [[500, 244, 'tv'], [500, 312, 'lit'], [574, 300, 'lit', 32, 30]] };
  const NEONS_BY = { nandemo: [...['カ', 'ラ', 'オ', 'ケ'].map((c, i) => [134, 270 + i * 27, 17]), ...['喫', '茶', 'ね', 'こ'].map((c, i) => [362, 258 + i * 30, 17]),
    ...[0, 1, 2, 3].map(i => [480, 262 + i * 30, 17]), ...[0, 1, 2, 3].map(i => [547, 268 + i * 26, 15])], ekimae: [0, 1, 2, 3].map(i => [476, 262 + i * 30, 17]) };
  // the elevated line behind the roofs (still): a girder on pillars, seen between the buildings
  const railway = () => `<g class="st-rail"><path d="M-10 213H${WW + 10}" stroke="${INK}" stroke-width="4.6"/><path d="M-10 213H${WW + 10}" stroke="#4d4672" stroke-width="2.4"/>`
    + Array.from({ length: Math.ceil(WW / 64) + 1 }, (_, i) => `<path d="M${i * 64 + 20} 215v30" stroke="${INK}" stroke-width="3.2"/>`).join('') + '</g>';
  const inView = x => x > vx - 10 && x < vx + 380;
  const play = (layer, markup, frames, ms, opts = {}) => {
    const g = UTIL.g($(layer), markup, opts.attrs || {}); if (!g) return;
    const a = g.animate(frames, { duration: ms, easing: opts.easing || 'linear', fill: 'forwards' });
    a.finished.then(() => g.remove(), () => g.remove());
  };
  const AMB = {
    // three lit cars, right to left behind the roofs: windows are light, nobody in them
    train() {
      const car = x => `<rect x="${x}" y="196" width="58" height="15" rx="3" fill="#2c2550" stroke="${INK}" stroke-width="2"/>`
        + [0, 1, 2, 3, 4].map(k => `<rect x="${x + 5 + k * 10.5}" y="199.5" width="7" height="6" rx="1" fill="#ffe7a0"/>`).join('')
        + `<path d="M${x + 20} 196l6-6h8M${x + 30} 190l-4 6" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
      const body = car(0) + car(61) + car(122) + `<circle cx="3" cy="207" r="1.6" fill="#fff6d6"/>`;
      const from = vx + 400, to = vx - 200;
      play('st-amb-sky', `<g>${body}</g>`, [{ transform: `translate(${from}px, 0)` }, { transform: `translate(${to}px, 0)` }], 6500);
    },
    // a window in view lights up (a strip-light flicker first) or goes dark, and some time later back again
    window() {
      const list = WINS_BY[info ? info.id : 'nandemo'].filter(w => inView(w[0])); if (!list.length) return;
      const [x, y, kind, w = 28, h = 30] = UTIL.pick(list), on = kind === 'dark';
      const fill = on ? '#ffd86b' : '#232a52';
      play('st-amb-city', `<g><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="2" fill="${fill}"/><path d="M${x + w / 2} ${y + 2}V${y + h - 2}" stroke="${INK}" stroke-width="1.6"/></g>`,
        on ? [{ opacity: 0 }, { opacity: .9, offset: .01 }, { opacity: .1, offset: .02 }, { opacity: 1, offset: .03 }, { opacity: 1, offset: .92 }, { opacity: 0 }]
          : [{ opacity: 0 }, { opacity: 1, offset: .04 }, { opacity: 1, offset: .92 }, { opacity: 0 }], 26000);
    },
    // a neon letter stutters
    neon() {
      const list = NEONS_BY[info ? info.id : 'nandemo'].filter(n => inView(n[0])); if (!list.length) return;
      const [x, y, size] = UTIL.pick(list);
      play('st-amb-city', `<rect x="${x - size / 2 - 2}" y="${y - size + 1}" width="${size + 4}" height="${size + 3}" fill="${INK}"/>`,
        [{ opacity: 0 }, { opacity: .9, offset: .1 }, { opacity: 0, offset: .2 }, { opacity: .9, offset: .35 }, { opacity: .2, offset: .5 }, { opacity: .9, offset: .62 }, { opacity: 0 }], 1400);
    },
    // a leaf blown across the road, tumbling
    leaf() {
      const y = UTIL.rand(736, 790), col = UTIL.pick(['#ffb03a', '#e8863e', '#b8f05a']);
      const g = `<g><path d="M-6 0q6-7 12 0q-6 7-12 0z" fill="${col}" stroke="${INK}" stroke-width="1.4"/><path d="M-6 0h11" stroke="${INK}" stroke-width=".9"/></g>`;
      play('st-fx', g, Array.from({ length: 9 }, (_, i) => { const t = i / 8, x = vx - 20 + 430 * t, yy = y + Math.sin(t * Math.PI * 3) * 6 - 10 * t;
        return { transform: `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px) rotate(${(t * 900).toFixed(0)}deg)` }; }), 4200);
    },
    // a cloud drifting over the moon
    cloud() {
      const c = `<path d="M0 12q-2-10 8-10q2-8 12-6q6-6 14 0q10-2 10 8q8 2 4 8z" fill="#3a3366" stroke="${INK}" stroke-width="2" opacity=".93"/>`;
      play('st-amb-sky', `<g>${c}</g>`, [{ transform: 'translate(420px, 150px)' }, { transform: 'translate(250px, 158px)' }], 16000);
    },
    // a shooting star
    star() {
      const x = vx + UTIL.rand(140, 330), y = UTIL.rand(40, 120);
      play('st-amb-sky', `<g><path d="M0 0l-34 16" stroke="#fff6d6" stroke-width="2" stroke-linecap="round" opacity=".85"/><circle r="2" fill="#fff"/></g>`,
        [{ transform: `translate(${x}px, ${y}px)`, opacity: 0 }, { opacity: 1, offset: .15 }, { transform: `translate(${x - 120}px, ${y + 56}px)`, opacity: 0 }], 900, { easing: 'ease-in' });
    },
  };
  let ambT = 0;
  function ambient() {
    clearTimeout(ambT); ambT = setTimeout(ambient, UTIL.rand(20000, 40000));
    if (!awake || document.hidden || UTIL.reduced || UTIL.low || !svg) return;   // (省电模式, v0.38)
    if (Math.random() < .35 && wipe()) return;
    AMB[UTIL.pick(['train', 'train', 'window', 'window', 'window', 'neon', 'neon', 'leaf', 'leaf', 'cloud', 'star'])]();
  }
  // past the fifth lot: a signpost to the other street; until it opens, a 准备中 board under it with the assets it needs
  // (the street's name is painted in Japanese, like every sign in the world)
  function signPost() {
    if (!info || !info.sign) return '';
    const g = info.sign, x = 606, open = g.open;
    return `<g class="st-post${open ? '' : ' locked'}" role="button" tabindex="0" aria-label="${open ? T`去 ${g.name}` : T`${g.name}：资产到 ${g.at} 开张`}">
      <rect x="574" y="440" width="66" height="226" fill="transparent"/>
      <g filter="url(#doodle)"><rect x="${x - 3}" y="482" width="7" height="170" rx="2" fill="#8e86a8" ${ink(2.2)}/>
        <path d="M576 486h54l9 11-9 11h-54z" fill="${open ? '#3ff4ff' : '#fff8ec'}" ${ink(2.2)}/><text x="603" y="501" class="st-pop-t st-jp" font-size="${g.name.length > 4 ? 8.4 : 10.5}" text-anchor="middle" fill="${INK}">${g.name}</text>
        ${open ? '' : `<path d="M${x - 14} 516v6M${x + 14} 516v6" ${ink(1.4)}/><g transform="rotate(4 ${x} 538)"><rect x="575" y="521" width="62" height="34" rx="4" fill="#fff8ec" ${ink(2.2)}/>
          <text x="606" y="535" class="st-zh" font-size="10" text-anchor="middle" fill="${INK}">${T`准备中`}</text><text x="606" y="548" class="st-zh" font-size="7.4" text-anchor="middle" fill="#e23d78">${T`资产 ${g.at}`}</text></g>`}
        <ellipse cx="${x}" cy="652" rx="13" ry="3.4" fill="#000" opacity=".25"/></g></g>`;
  }
  /* (v0.46) what a tic moves (the tk-* parts: lamps, steam, the nixie, the noren, …) is lifted out of the hand-drawn
     filter into a group of its own just over the drawing, under the transforms it sat in. Moving inside the filter made
     iOS redo the whole machine's filter on every frame of the tic (the developers' 50-100 ms frames on the idle street).
     They keep their look; only the wobble of the marker line is not on them */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function lift(m) {
    const art = m.querySelector('.st-art'); if (!art) return;
    let top = m.querySelector('.st-tk');
    if (!top) { top = document.createElementNS(SVGNS, 'g'); top.setAttribute('class', 'st-tk'); art.after(top); } else top.textContent = '';
    art.querySelectorAll('[class*="tk-"]').forEach(el => {
      const outer = el.parentNode.closest('[class*="tk-"]'); if (outer && art.contains(outer)) return;   // moves with the part around it
      const tf = []; for (let p = el.parentNode; p && p !== art; p = p.parentNode) { const t = p.getAttribute && p.getAttribute('transform'); if (t) tf.unshift(t); }
      if (tf.length) { const w = document.createElementNS(SVGNS, 'g'); w.setAttribute('transform', tf.join(' ')); w.appendChild(el); top.appendChild(w); } else top.appendChild(el);
    });
  }
  // the machines on their lots, the empty lots and the lots still to come (redrawn when the street changes)
  function draw() {
    svg.innerHTML = ids.map((id, i) => pos[i] >= 0 ? machine(id, i, names[i]) : '').join('')
      + lots.map((L, j) => L.state === 'machine' ? '' : lot(j, L)).join('') + signPost() + `<g id="st-cats"></g><g id="st-meal" class="st-neko"></g><g id="st-fx"></g>`;
    fx = $('st-fx'); catsG = $('st-cats'); mealG = $('st-meal'); drawCats();
    svg.querySelectorAll('.st-m').forEach(lift);
  }
  function layout(p, L) { pos = p.slice(); lots = L.slice(); draw(); pan(vx); }
  // the visible slice of the street: both layers (backdrop and live) share one viewBox
  let vx = 0, noClickUntil = 0;
  const maxX = () => Math.max(0, WW - 390);
  /* (v0.43) the whole street is drawn once, WW wide, in both layers (backdrop and live), and a pan only moves the layers
     with a CSS transform; the viewBox never changes. Re-setting the viewBox on every move made WebKit re-filter every
     hand-drawn (#doodle) shape — about 1 fps on the iOS simulator, the developers measured. The layers are fitted to
     the screen as the old viewBox was (cover, centred) whenever its size changes */
  let fit = { s: 1, ox: 0, oy: 0 };
  function sizeLayers() {
    const box = $('street'), W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    const s = Math.max(W / 390, H / 844); fit = { s, ox: (W - 390 * s) / 2, oy: (H - 844 * s) / 2 };
    [svg, $('street-bg')].forEach(el => { el.setAttribute('viewBox', `0 0 ${WW} 844`); el.setAttribute('preserveAspectRatio', 'none');
      Object.assign(el.style, { width: `${(WW * s).toFixed(1)}px`, height: `${(844 * s).toFixed(1)}px`, left: '0px', top: `${fit.oy.toFixed(1)}px`, right: 'auto', bottom: 'auto' }); });
    pan(vx);
  }
  function pan(x) {
    vx = Math.max(0, Math.min(maxX(), x)); vxBy[K] = vx; const tf = `translate3d(${(fit.ox - vx * fit.s).toFixed(1)}px,0,0)`;
    svg.style.transform = tf; $('street-bg').style.transform = tf; zPlace();
    // how many machines are (mostly) off the right edge
    const right = lots.map((L, j) => X[j] + 60 > vx + 390 ? L.state : null).filter(Boolean), off = right.filter(s => s === 'machine').length;
    const back = vx > maxX() / 2, txt = back ? T`‹ 回去` : off ? T`还有 ${off} 台 ›` : right.includes('open') ? T`空机位 ›` : T`还有 ›`, key = `${!maxX()}|${back}|${txt}`;
    // the chip is touched only when it changes (v0.43: writing it on every move laid the page out on every frame)
    if (key !== moreKey) { moreKey = key; const more = $('st-more'); more.hidden = !maxX(); more.classList.toggle('left', back); more.textContent = txt; }
  }
  let moreKey = '';
  const panTo = x => { const from = vx; return UTIL.tween(420, e => pan(from + (x - from) * e), UTIL.ease.inOut); };
  // make sure machine i is in view (coming back from it, say)
  function focus(i) { if (!(pos[i] >= 0)) return; const x0 = xOf(i) - 14, x1 = xOf(i) + 104; if (x0 < vx) pan(x0); else if (x1 > vx + 390) pan(x1 - 390); }
  function open(i) {
    const g = svg.querySelector(`.st-m[data-i="${i}"]`); if (!g) return;
    SND.pop(); UTIL.haptic(8);
    UTIL.restart(g, 'boing');
    setTimeout(() => onOpen(i), 160);
  }
  // a sale: the little machine bobs and its takings pop up in a comic bubble — cream for everyday goods,
  // yellow for ★3, gold with sparks for ★4 and up; a first-ever sale (初売り) gets a pink double-decker bubble
  const BUBBLE = t => t >= 4 ? '#ffb020' : t >= 3 ? '#ffd23f' : '#fff8ec';
  function sale(i, amount, o = {}) {
    const g = svg.querySelector(`.st-m[data-i="${i}"]`); if (!g) return;
    // (v0.46) no bob any more: it moved the whole drawing under the hand-drawn filter, which iOS redoes every frame
    look(i); const fig = g.querySelector('.st-fig .mnk'); if (fig) UTIL.restart(fig, 'wave');
    const txt = '+' + UTIL.money(amount), cx = xOf(i) + 45 + UTIL.rand(-8, 8), tier = o.tier || 1;
    let body;
    if (o.first) {
      const w = Math.max(18 + txt.length * 7.6, 18 + (o.name || '').length * 11);
      body = `<path d="M${-w / 2} -30h${w}v39h${-w / 2 + 10}l-6 7 -1-7h${-w / 2 + -3}z" fill="#ff4f8b" ${ink(2.6)}/>
        <text y="-15" text-anchor="middle" class="st-pop-t" font-size="11" fill="#fff">${T`首卖！${o.name || ''}`}</text><text y="3.8" text-anchor="middle" class="st-pop-t st-n" font-size="12.5" fill="#ffd23f">${txt}</text>`
        + [[-w / 2 - 6, -30], [w / 2 + 6, -24], [w / 2 - 4, 14]].map(([x, y]) => `<path d="${sparkD(x, y, 3.4)}" fill="#ffd23f" ${ink(1.2)}/>`).join('');
    } else {
      const lead = o.luck ? T`当たり ` : o.stock ? T`+1件 ` : '', w = 18 + (lead + txt).length * 7.6 + (o.paw ? 12 : 0);
      body = `<path d="M${-w / 2} -13h${w}v22h${-w / 2 + 10}l-6 7 -1-7h${-w / 2 + -3}z" fill="${o.luck ? '#ffd23f' : o.paw || o.stock ? '#ffd6e4' : BUBBLE(tier)}" ${ink(2.4)}/><text x="${o.paw ? 6 : 0}" y="3.8" text-anchor="middle" class="st-pop-t st-n" font-size="12.5" fill="${INK}">${lead}${o.stock ? '' : txt}</text>`
        + (o.paw ? `<use href="#neko-paw" x="${-w / 2 + 3}" y="-9" width="13" height="13"/>` : '')
        + (o.luck ? [[-w / 2 - 5, -12], [w / 2 + 5, -6]].map(([x, y]) => `<path d="${sparkD(x, y, 3.2)}" fill="#fff6d6" ${ink(1.1)}/>`).join('') : '')
        + (tier >= 4 ? `<path d="${sparkD(w / 2 + 4, -14, 3.2)}" fill="#fff6d6" ${ink(1.1)}/><path d="${sparkD(-w / 2 - 4, 4, 2.6)}" fill="#fff6d6" ${ink(1.1)}/>` : '');
    }
    const p = UTIL.g(fx, `<g class="st-pop${o.first ? ' first' : ''}">${body}</g>`, { transform: `translate(${cx.toFixed(1)} 424)` });
    setTimeout(() => p.remove(), o.first ? 2600 : 1600);
  }
  // the mini machine shows the lineup it sells now; NEW while it carries goods it has never sold
  // (v0.44) a machine's drawing is replaced only when its goods (or its look) changed: each replacement re-runs the
  // hand-drawn filter over it, and coming back from 全部补货 used to replace every machine on the street at once
  function setLineup(i, list) { const g = svg.querySelector(`.st-m[data-i="${i}"] .st-art`); if (!g) return;
    const k = JSON.stringify(list) + (skinOf(ids[i]) ? '|sakura' : ''); if (g._k === k) return; g._k = k; g.innerHTML = (ART[ids[i]] || drink)(xOf(i), list); lift(g.closest('.st-m')); }
  function setNew(i, on) { const g = svg.querySelector(`.st-m[data-i="${i}"] .st-new`); if (g && (g.style.display === 'none') !== !on) g.style.display = on ? '' : 'none'; }
  // a sticker from the wardrobe, slapped on the machine's side
  function setSticker(i, d) { const g = svg.querySelector(`.st-m[data-i="${i}"] .st-stk`); if (!g) return;
    g.innerHTML = d ? `<g transform="translate(${xOf(i) + 80} 548) rotate(-10 10 10)">${ALBUM.decorIcon(d, 20)}</g>` : ''; }
  // the lucky cat figurine on the machine's top, right corner (the cats on top lie left of it); it beckons at each sale
  function setFigure(i, on) { const g = svg.querySelector(`.st-m[data-i="${i}"] .st-fig`); if (!g) return;
    g.innerHTML = on ? `<g transform="translate(${xOf(i) + 72} 457) scale(1.05)">${NEKOART.maneki(2.2)}</g>` : ''; }
  // stock: the shelves' bar, and under it the warehouse's (w: its fill 0..1, or -1 while there is no warehouse)
  function stock(i, n, cap, w = -1) {
    const g = svg.querySelector(`.st-m[data-i="${i}"]`); if (!g) return;
    g.querySelector('.st-bar').setAttribute('width', Math.max(0, 78 * Math.min(1, n / cap)).toFixed(1));
    g.querySelector('.st-sold').style.display = n > 0 ? 'none' : '';
    g.querySelector('.st-ware').style.display = w < 0 ? 'none' : '';
    if (w >= 0) g.querySelector('.st-wbar').setAttribute('width', (78 * Math.min(1, w)).toFixed(1));
  }
  // the shelves sold out and the warehouse filled them again: a box hops in
  function refilled(i) {
    const g = svg.querySelector(`.st-m[data-i="${i}"]`); if (!g) return;
    UTIL.restart(g, 'boing');
    const p = UTIL.g(fx, `<g class="st-pop"><path d="M-34 -13h68v22h-24l-6 7-1-7h-37z" fill="#ffd27a" ${ink(2.4)}/><text y="3.8" text-anchor="middle" class="st-pop-t" font-size="11.5" fill="${INK}">${T`仓库补满了`}</text></g>`, { transform: `translate(${(xOf(i) + 45).toFixed(1)} 424)` });
    setTimeout(() => p.remove(), 1800);
  }
  // wallet card: balance in letter units with its cat-food badge; the jar fills toward the next carry (lifetime takings)
  function wallet(bank, life, today) {
    const v = UTIL.big(bank), t = UTIL.fmt(life).tier;
    $('st-num').textContent = v.num;
    const badge = $('st-badge'); badge.hidden = !v.unit;
    $('st-unit').textContent = v.unit.trim();   // (empty below 10万, so a hidden badge never reads out a stale unit)
    if (v.unit) $('st-badge-use').setAttribute('href', tierIcon(Math.max(1, UTIL.fmt(bank).tier)));
    const next = Math.pow(1000, t + 1), base = t ? Math.pow(1000, t) : 0, f = Math.max(0, Math.min(1, (life - base) / (next - base)));
    $('st-jar').style.height = (6 + 88 * f).toFixed(1) + '%';
    $('st-jar-use').setAttribute('href', tierIcon(t + 1));
    const nx = TIERS[t] ? TIERS[t].name : T`新的猫粮`;
    $('st-next').innerHTML = `${T`营业额到 <b>${UTIL.money(next)} · ${nx}</b><br>还差 ${UTIL.money(next - life).slice(1)}`}`;
    $('st-today').textContent = T`今日 ${today.n} 件 · ${UTIL.money(today.yen)}`;
    if (t !== lastTier) { const first = lastTier < 0; lastTier = t; drawCats(); if (!first && t > 0) (onCarry || carry)(t); }
  }
  // a carry: the next letter, its cat food and the cat it brings
  function carry(t) {
    const tier = TIERS[t - 1], card = $('st-carry-card'); cardThen = null;
    $('st-carry-use').setAttribute('href', tierIcon(t));
    $('st-carry-t').innerHTML = UTIL.hl(T`营业额破 ${UTIL.money(Math.pow(1000, t))}！`);
    // A: ミケ lives here already; its food is the first present you can give her. Later letters bring a visitor
    const who = NEKO.CATS.filter(c => c.arrive && c.arrive.letter === t).map(c => c.name); const whoS = I18N.list(who);
    // (a letter's visitor comes later on its own, with its own card: 2026-10-18)
    $('st-carry-s').innerHTML = UTIL.hl((t === 1 ? T`解锁 ${tier.name} · 可以喂ミケ了` : tier ? T`解锁 ${tier.name}` : T`解锁新的猫粮`) + (carryExtra(t) || ''));
    card.hidden = false; SND.chime(); UTIL.haptic([12, 40, 12]);
  }
  function sheet(on) {
    const el = $('st-sheet'); el.hidden = !on; if (!on) return;
    const t = Math.max(0, lastTier);
    $('st-ladder').innerHTML = TIERS.map((tier, k) => `<li class="${k < t ? 'got' : k === t ? 'next' : ''}"><svg viewBox="0 0 24 24"><use href="${tierIcon(k + 1)}"/></svg>
      <span>${tier.name}<small>${k ? (catsOf(k + 1).length ? T`${I18N.list(catsOf(k + 1).map(c => c.name))} 来串门` : T`新的猫粮`) : T`ミケ 能吃了`}</small></span><b>${UTIL.money(Math.pow(1000, k + 1))}</b><i>${k < t ? '✓' : ''}</i></li>`).join('')
      + `<li class="more"><svg viewBox="0 0 24 24"><use href="#tier-n"/></svg><span>${T`以后再加`}</span><b>…</b><i></i></li>`;   // (v0.38.1: named by amount, the row reads name · amount)
  }
  function receipt(r) {
    $('rc-away').textContent = T`你不在的 ${r.away}`;
    $('rc-n').textContent = T`${r.n} 件`; $('rc-y').textContent = UTIL.money(r.yen);
    const lines = [];
    if (r.busy) lines.push(T`今天大繁盛：这段时间卖得特别快`);
    if (r.bulk) lines.push(T`大口注文：附近一家公司一次买了 ${r.bulk.n} 件（${r.bulk.brand}）`);
    if (r.firsts && r.firsts.length) lines.push(T`首卖：${I18N.list(r.firsts)}`);
    if (r.sets && r.sets.length) lines.push(T`集齐「${r.sets.join('」「')}」· 去图鉴领取装扮`);
    if (r.refills) lines.push(T`仓库自动补满 ${r.refills} 次`);
    if (r.paws) lines.push(T`猫招来的客人 ${r.paws} 位`);
    if (r.lucky) lines.push(T`クロ 带来的当たり ${r.lucky} 次`);
    if (r.stocked) lines.push(T`チャトラ 帮你补了 ${r.stocked} 件`);
    if (r.tips) lines.push(T`シロ 擦亮玻璃，多收小费 ${UTIL.money(r.tips)}`);
    if (r.empty) lines.push(T`${r.empty} 台卖空了，等你来补货`);
    // small news while you were away (a cat's first knack, 见证, …): one line each, the rest counted
    const news = r.news || []; news.slice(0, 4).forEach(t => lines.push(t)); if (news.length > 4) lines.push(T`还有 ${news.length - 4} 件小事 · 在图鉴的猫页`);
    const f = $('rc-first'); f.hidden = !lines.length; f.innerHTML = lines.map(UTIL.hl).join('<br>');
    $('st-receipt').hidden = false;
  }
  const setCat = i => { catOn = i; drawCats(); };
  const setGear = g => { gear = g || {}; drawCats(); };
  const setNeko = n => { neko = n; drawCats(); };
  /* (v0.46) the street in view: { k, id, name, n (streets open), sign: { k, name, open, at } }. A new street repaints the
     backdrop layer and goes back to where it was panned last */
  function setStreet(inf) {
    // the cats drawn so far sit on the street left behind: none until the app sends this street's
    if (K !== inf.k && neko) neko = { ...neko, cats: [], visitors: [], gift: null, glass: [], home: inf.k === 0, bowl: inf.k === 0 ? neko.bowl : undefined };
    info = inf; K = inf.k;
    if (svg && bgId !== inf.id) { paintBg(inf.id); vx = vxBy[K] || 0; }
    $('st-street').hidden = inf.n < 2; $('st-street-n').textContent = I18N.name(inf.name);
  }
  // changing streets: this one fades out, the next is drawn, and fades in (both layers are composited: opacity is cheap)
  async function swap(fn) {
    const els = [svg, $('street-bg'), $('st-zs')];
    if (UTIL.reduced) { fn(); return; }
    els.forEach(e => { e.style.transition = 'opacity .16s'; e.style.opacity = 0; });
    await new Promise(r => setTimeout(r, 170));
    fn();
    requestAnimationFrame(() => requestAnimationFrame(() => els.forEach(e => { e.style.opacity = ''; })));
  }
  // a card over the street (the same as a carry's): a 见证 tier opening, a present unwrapped. then: run once it is closed
  function card(t, s, icon = '#neko-paw', then = null) {
    cardThen = then;
    const el = $('st-carry-card'); $('st-carry-use').setAttribute('href', icon); $('st-carry-t').innerHTML = UTIL.hl(t); $('st-carry-s').innerHTML = UTIL.hl(s);
    el.hidden = false; SND.chime(); UTIL.haptic([12, 40, 12]);
  }
  // the next thing to look forward to, the last line of the wallet
  const goal = t => { const el = $('st-goal'); el.textContent = t; el.hidden = !t; };
  return { init, layout, idle, setStreet, swap, get k() { return K; }, setNeko, meal, look, get dining() { return dining; }, card, carry, goal, amb: k => AMB[k] && AMB[k](), tic: i => { const g = svg.querySelector(`.st-m[data-i="${i}"]`); if (g) ticOn(g); }, sale, stock, refilled, wallet, receipt, setCat, setLineup, setNew, setSticker, setFigure, setGear, art: (id, skin) => { forceSkin = skin || null; try { return (ART[id] || drink)(0); } finally { forceSkin = null; } }, focus, TIERS, SKIN };
})();
