/* Comic-street decoration layer (shown only in the ZZZ-style art mode): halftone shading, stickers, hazard stripes,
   graffiti tags and specular strips. Side decorations sit on whichever side faces the camera (side: x = 120 face,
   u from the front; left: x = 0 face, u from the back); door ones live in door-local units. */
const ZZDECO = (() => {
  const { SIDE, FRONT } = ISO;
  const INK = '#17121f';
  const defs = () => `<pattern id="zzDots" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".78" fill="#000" fill-opacity=".36"/></pattern>
    <pattern id="zzDotsW" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".6" fill="#fff" fill-opacity=".4"/></pattern>
    <pattern id="zzHazard" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3.5" height="7" fill="#ffd23f"/><rect x="3.5" width="3.5" height="7" fill="${INK}"/></pattern>`;
  const ink = (w = 1.8) => `stroke="${INK}" stroke-width="${w}" vector-effect="non-scaling-stroke" stroke-linejoin="round"`;
  const star = (cx, cy, r1, r2, n = 12) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n - Math.PI / 2, r = i % 2 ? r2 : r1; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); } return d + 'Z'; };
  const T = (x, y, s, txt, fill = '#fff', w = 2.2) => `<text class="sign" x="${x}" y="${y}" font-size="${s}" text-anchor="middle" fill="${fill}" stroke="${INK}" stroke-width="${w}" paint-order="stroke" vector-effect="non-scaling-stroke">${txt}</text>`;
  const tag = (d, color) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  const bubble = (x, y, w, h, txt, s) => `<path d="M${x + 3} ${y}H${x + w - 3}Q${x + w} ${y} ${x + w} ${y + 3}V${y + h - 3}Q${x + w} ${y + h} ${x + w - 3} ${y + h}H${x + 14}L${x + 8} ${y + h + 6}L${x + 9} ${y + h}H${x + 3}Q${x} ${y + h} ${x} ${y + h - 3}V${y + 3}Q${x} ${y} ${x + 3} ${y}Z" fill="#fff" ${ink()}/>` + `<text class="sign" x="${x + w / 2}" y="${y + h / 2 + s * .36}" font-size="${s}" text-anchor="middle" fill="${INK}">${txt}</text>`;
  const SPEC = {
    drink: {
      side: `<circle cx="42" cy="68" r="22" fill="#ffd23f" ${ink(2.2)}/><circle cx="42" cy="68" r="17" fill="none" stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke" stroke-dasharray="2 2"/>${T(42, 67, 8.4, 'ミズイロ')}${T(42, 78, 6, 'COLD!', '#2f6bff')}
        <path d="${star(60, 128, 13, 8.6)}" fill="#ff4f8b" ${ink()}/>${T(60, 130.6, 6.4, 'NEW')}
        ${tag('M10 172q8-14 16 0t16 0q6-10 12 2l9-13', '#46e3ff')}<rect x="14" y="196" width="28" height="11" rx="5.5" fill="${INK}"/>${T(28, 204, 6, '24H', '#ffd23f', 1)}`,
      left: `${bubble(10, 30, 64, 20, '冷えてます!', 7)}
        <path d="M42 80q-18 24-18 37a18 18 0 0 0 36 0q0-13-18-37z" fill="#46e3ff" ${ink(2.2)}/><path d="M33 116a9 9 0 0 0 6 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${T(42, 152, 7.4, '天然水')}
        <path d="${star(60, 176, 12, 8)}" fill="#ffd23f" ${ink()}/>${T(60, 178.6, 5.4, '¥110', INK, .1)}${tag('M10 188q6-10 12 0t12-2', '#ff4f8b')}`,
      door: `<path d="${star(80, 110, 11, 7.4)}" fill="#ff4f8b" ${ink()}/>${T(80, 113, 7, '冷!')}<rect x="93" y="176" width="22" height="9" rx="2" fill="#46e3ff" ${ink(1.4)}/>${T(104, 183, 5.4, 'OK!', INK, .1)}`,
      band: [4, 226.5, 112, 9.5],
    },
    spiral: {
      side: `<circle cx="42" cy="64" r="22" fill="#2ee6c8" ${ink(2.2)}/>${T(42, 64, 8, 'なんでも')}${T(42, 74, 4.6, 'ANYTHING!', '#ffd23f')}
        ${bubble(10, 110, 62, 18, 'なんでもアリ!', 6.4)}<path d="${star(58, 166, 12, 8)}" fill="#ffd23f" ${ink()}/>${T(58, 168.6, 6, 'SALE', '#ff4f8b')}
        ${tag('M12 196q6-12 14-2t14-4q10-4 16 6', '#b6f04a')}`,
      left: `<circle cx="40" cy="58" r="21" fill="#ffd23f" ${ink(2.2)}/><ellipse cx="37" cy="66" rx="11" ry="6" fill="#fff" ${ink(1.4)}/><circle cx="46" cy="55" r="5.6" fill="#fff" ${ink(1.4)}/>
        <path d="M51 55.4h5.4l-2 2.8h-3.4z" fill="#ff8a24" ${ink(1)}/><circle cx="47.2" cy="54" r="1" fill="${INK}"/>
        ${bubble(8, 98, 68, 18, 'なんでも売ってる!', 5.8)}<path d="${star(30, 152, 13, 8.6)}" fill="#2ee6c8" ${ink()}/>${T(30, 154.6, 5.4, '¥100〜')}${tag('M44 178q8-12 14 0t14-2', '#ff4f8b')}`,
      door: `<path d="${star(111, 221, 7, 4.8)}" fill="#ffd23f" ${ink()}/>${T(111, 223, 4.2, '★', '#ff4f8b', 1.2)}`,
      band: [4, 230, 112, 7.5],
    },
    cup: {
      side: `<circle cx="42" cy="62" r="22" fill="#3a1f12" ${ink(2.2)}/>${T(42, 61, 7.2, 'ヨルカフェ')}${T(42, 72, 4.6, 'HOT & ICE', '#ffb547')}
        <path d="M58 138q-10-6-6-18q3 6 6 4q-2-10 6-16q0 8 6 10q6 6 0 16q-4 6-12 4z" fill="#ff5a4e" ${ink()}/>${T(61, 136, 5.6, 'HOT!')}
        ${bubble(12, 168, 50, 16, '挽きたて!', 6)}${tag('M14 214q8-10 14 0t14-2q6-6 12 4', '#3ff4ff')}`,
      left: `<path d="M50 26a22 22 0 1 0 15 36a17 17 0 1 1-15-36z" fill="#ffd23f" ${ink(2.2)}/><path d="${star(22, 40, 4.4, 1.8, 4)}" fill="#fff" ${ink(1)}/><path d="${star(66, 82, 3.6, 1.5, 4)}" fill="#fff" ${ink(1)}/>
        ${bubble(10, 100, 64, 18, 'おつかれさま', 6.4)}<path d="M28 146h28l-3.2 24h-21.6z" fill="#fff" ${ink(1.8)}/><rect x="28.6" y="152" width="26.8" height="6" fill="#3a1f12"/>
        <path d="M56 150h3.4a4.4 4.4 0 0 1 0 8.8h-4.4" fill="none" ${ink(1.8)}/><path d="M35 140q-2.4-4 0-8M42 140q-2.4-4 0-8M49 140q-2.4-4 0-8" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        ${tag('M12 188q8-10 14 0t14-2q6-6 12 4', '#3ff4ff')}`,
      door: `<path d="M22 124q-8-5-5-14q2 5 5 3q-1.6-8 5-12q0 6 4.6 8q4.6 4.6 0 12q-3 4.6-9.6 3z" fill="#ff5a4e" ${ink()}/>${T(25, 122, 4.6, 'HOT!')}`,
      band: [4, 229.6, 112, 7],
    },
  };
  SPEC.ramen = {
    side: `<circle cx="42" cy="62" r="22" fill="#ffd23f" ${ink(2.2)}/>${T(42, 61, 8, 'ゆげ屋', '#e8553a')}${T(42, 72, 4.6, 'UDON · SOBA', INK, .1)}
      <path d="${star(58, 124, 14, 9)}" fill="#ff4f8b" ${ink()}/>${T(58, 123, 6, 'あと')}${T(58, 131, 6.4, '25秒')}
      ${bubble(10, 158, 56, 18, 'あつあつ!', 7)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<path d="M18 92h48q-3 22-24 22t-24-22z" fill="#e8553a" ${ink(2.2)}/><ellipse cx="42" cy="92" rx="24" ry="5" fill="#ffd27a" ${ink(1.6)}/>
      <path d="M32 84q-4-7 0-14t0-14M42 84q-4-7 0-14t0-14M52 84q-4-7 0-14t0-14" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${bubble(10, 128, 64, 18, 'いただきます!', 6.2)}<path d="${star(60, 176, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 178.6, 5.4, '¥260〜', INK, .1)}${tag('M10 196q6-10 12 0t12-2', '#ff4f8b')}`,
    door: `<path d="${star(20, 170, 9, 6)}" fill="#ffd23f" ${ink()}/>${T(20, 172.4, 4.8, 'うまい!', '#e8553a', 1)}`,
    band: [4, 222, 112, 5],
  };
  SPEC.juice = {
    side: `<circle cx="42" cy="62" r="24" fill="#ff9a2e" ${ink(2.2)}/><circle cx="42" cy="62" r="18.5" fill="#ffd27a" ${ink(1.4)}/>
      <path d="M42 43.5v37M23.5 62h37M29 49l26 26M55 49l-26 26" stroke="#ff9a2e" stroke-width="2" vector-effect="non-scaling-stroke"/>
      <path d="${star(58, 124, 14, 9)}" fill="#3ff4ff" ${ink()}/>${T(58, 123, 6, '4個で')}${T(58, 131, 6.4, '1杯')}
      ${bubble(10, 158, 60, 18, 'しぼりたて!', 6.4)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `${[[30, 40, '#ff9a2e'], [54, 56, '#ffe14a'], [34, 78, '#ff8a1e'], [56, 100, '#e8453a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="10" fill="${c}" ${ink(2)}/><path d="M${x} ${y - 10}q2-4 6-3" fill="none" stroke="#3aa04a" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join('')}
      ${bubble(10, 126, 64, 18, 'ぎゅーっ!', 7)}<path d="${star(60, 176, 12, 8)}" fill="#ffd23f" ${ink()}/>${T(60, 178.6, 5.4, '¥300〜', INK, .1)}${tag('M10 196q6-10 12 0t12-2', '#3ff4ff')}`,
    door: `<path d="${star(20, 205, 9, 6)}" fill="#b8f05a" ${ink()}/>${T(20, 207.4, 4.6, '100%', INK, 1)}`,
    band: [6, 146.6, 86, 3],
  };
  SPEC.auto = {
    side: `<rect x="10" y="34" width="64" height="30" rx="5" fill="#ffb03a" ${ink(2.2)}/>${T(42, 53.6, 9, 'AUTO', INK, .1)}<path d="M10 70H74M10 77H74" stroke="#ff4f8b" stroke-width="3.4" vector-effect="non-scaling-stroke"/>
      <path d="${star(56, 122, 15, 9.6)}" fill="#ffd23f" ${ink()}/>${T(56, 124.4, 5.2, 'ゴトッ!', INK, .1)}
      ${bubble(10, 156, 60, 18, 'あつあつ!', 7)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<path d="M18 96q0-24 24-24t24 24z" fill="#e8a24a" ${ink(2.2)}/><rect x="16" y="98" width="52" height="8" rx="2" fill="#6a3a1e" ${ink(1.6)}/><rect x="18" y="108" width="48" height="10" rx="5" fill="#e8a24a" ${ink(1.8)}/>
      ${bubble(10, 128, 50, 18, 'チン!', 8)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, '¥260〜', INK, .1)}${tag('M10 196q6-10 12 0t12-2', '#ff4f8b')}`,
    door: `<path d="${star(20, 205, 9, 6)}" fill="#ff4f8b" ${ink()}/>${T(20, 207.4, 4.8, 'HOT!', '#fff', 1)}`,
    band: [6, 168.6, 86, 2.6],
  };
  SPEC.digital = {
    side: `<rect x="12" y="30" width="60" height="26" rx="4" fill="#3ff4ff" ${ink(2.2)}/>${T(42, 48.4, 9, 'PICO', INK, .1)}<path d="M12 62H72M12 68H72" stroke="#ff4f8b" stroke-width="3" vector-effect="non-scaling-stroke"/>
      <path d="${star(58, 88, 13, 8.6)}" fill="#ffd23f" ${ink()}/>${T(58, 87, 5, 'JUNK', INK, .1)}${T(58, 94, 5.4, '安い!', INK, .1)}
      ${bubble(10, 206, 60, 16, 'ガジェット!', 6.4)}`,
    left: `<rect x="22" y="70" width="40" height="40" rx="3" fill="#141018" ${ink(2.2)}/>${[0, 1, 2, 3, 4].map(i => `<path d="M${26 + i * 8} 70v-8M${26 + i * 8} 110v8M22 ${74 + i * 8}h-8M62 ${74 + i * 8}h8" stroke="${INK}" stroke-width="3" vector-effect="non-scaling-stroke"/>`).join('')}${T(42, 95, 10, 'IC', '#3ff4ff', 1)}
      ${bubble(10, 132, 52, 18, 'ピコッ!', 7.4)}<path d="${star(60, 180, 12, 8)}" fill="#ff4f8b" ${ink()}/>${T(60, 182.6, 5.4, '¥200〜')}${tag('M10 200q6-10 12 0t12-2', '#3ff4ff')}`,
    door: `<path d="${star(20, 205, 9, 6)}" fill="#3ff4ff" ${ink()}/>${T(20, 207.4, 4.6, 'NEW!', INK, .1)}`,
    band: [6, 146.6, 86, 2.4],
  };
  SPEC.frozen = {
    side: `<circle cx="42" cy="56" r="22" fill="#2a6ad9" ${ink(2.2)}/>${[0, 60, 120].map(a => `<path d="M42 38V74" transform="rotate(${a} 42 56)" stroke="#fff" stroke-width="3" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`).join('')}
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '−25℃', INK, .1)}${bubble(10, 156, 60, 18, 'ひんやり!', 7)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `<path d="M30 112l12 34 12-34z" fill="#e8b46a" ${ink(2.2)}/><circle cx="36" cy="104" r="10" fill="#ff8fb0" ${ink(2)}/><circle cx="48" cy="104" r="10" fill="#9bd06a" ${ink(2)}/><circle cx="42" cy="94" r="10" fill="#fff4d6" ${ink(2)}/>
      ${bubble(10, 40, 62, 18, 'つめた〜い', 6.4)}<path d="${star(60, 176, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 178.6, 5.4, '¥260〜', INK, .1)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(20, 205, 9, 6)}" fill="#9ae8ff" ${ink()}/>${T(20, 207.4, 4.4, 'COLD!', INK, .1)}`,
    band: [6, 183.4, 86, 2.4],
  };
  SPEC.locker = {
    side: `<ellipse cx="42" cy="62" rx="18" ry="23" fill="#fbf8f0" ${ink(2.2)}/><circle cx="36" cy="58" r="1.6" fill="${INK}"/><circle cx="48" cy="58" r="1.6" fill="${INK}"/><path d="M39 66q3 3 6 0" fill="none" stroke="${INK}" stroke-width="1.6" vector-effect="non-scaling-stroke"/><ellipse cx="32" cy="64" rx="3" ry="1.6" fill="#ffb3c8"/><ellipse cx="52" cy="64" rx="3" ry="1.6" fill="#ffb3c8"/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.6, 6.4, '100円', INK, .1)}${bubble(10, 156, 60, 18, '朝どれ!', 7.4)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<path d="M16 108h52l-7 26H23z" fill="#c8964a" ${ink(2.2)}/><path d="M20 116h44M22 124h40" stroke="${INK}" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".5"/>
      <circle cx="30" cy="100" r="9" fill="#e8453a" ${ink(2)}/><path d="M38 104l18-12" stroke="${INK}" stroke-width="7.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="M38 104l18-12" stroke="#3a9a3a" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke"/><path d="M48 104q4-10 12-8q-2 8-12 8z" fill="#6a3a8a" ${ink(1.8)}/>
      ${bubble(10, 44, 64, 18, 'おいしいよ!', 6.6)}<path d="${star(60, 176, 12, 8)}" fill="#ff4f8b" ${ink()}/>${T(60, 178.6, 5.4, '¥100', '#fff')}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(108, 216, 8, 5.4)}" fill="#ff4f8b" ${ink()}/>${T(108, 218, 4, 'NEW', '#fff', 1)}`,
    band: [6, 236.2, 108, 2.4],
  };
  SPEC.teishoku = {
    side: `<rect x="12" y="30" width="60" height="42" rx="4" fill="#7a2a1a" ${ink(2.2)}/><circle cx="30" cy="56" r="9" fill="#fff" ${ink(1.8)}/><circle cx="52" cy="57" r="8" fill="#c8964a" ${ink(1.8)}/><ellipse cx="42" cy="40" rx="11" ry="5" fill="#f08a6a" ${ink(1.6)}/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6.4, '23番', INK, .1)}${bubble(10, 156, 64, 18, 'いただきます!', 6.2)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<path d="M24 92h36l-4 24H28z" fill="#fff" ${ink(2.2)}/><path d="M24 92q18-14 36 0z" fill="#fffdf6" ${ink(2)}/><path d="M36 80q-3-5 0-10M44 80q-3-5 0-10M52 80q-3-5 0-10" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${bubble(10, 132, 52, 18, 'おかわり!', 7)}<path d="${star(60, 178, 12, 8)}" fill="#ff4f8b" ${ink()}/>${T(60, 180.6, 5.4, '¥380〜', '#fff')}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 4.2, 'HOT', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  SPEC.sushi = {
    side: `<ellipse cx="42" cy="56" rx="26" ry="11" fill="#3a7ad9" ${ink(2.2)}/><path d="M28 54q0-8 14-8t14 8q0 3-14 3t-14-3z" fill="#fbfaf4" ${ink(1.8)}/><path d="M26 50q2-9 16-9.4q14 .4 16 9.4q-3 3-16 3.4q-13-.4-16-3.4z" fill="#ff8a4a" ${ink(1.8)}/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥100〜', INK, .1)}${bubble(10, 156, 64, 18, 'まわってます!', 5.8)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `<ellipse cx="40" cy="100" rx="22" ry="9" fill="#e8453a" ${ink(2.2)}/><path d="M28 98q0-7 12-7t12 7q0 2.6-12 2.6t-12-2.6z" fill="#fbfaf4" ${ink(1.8)}/><path d="M26 95q2-8 14-8.4q12 .4 14 8.4q-3 2.6-14 3q-11-.4-14-3z" fill="#ff8a96" ${ink(1.8)}/>
      ${bubble(10, 132, 52, 18, 'いらっしゃい!', 6)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 4.2, 'FRESH', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  const zFish = (cx, cy, k, c) => `<g transform="translate(${cx} ${cy}) scale(${k})"><path d="M-12 0Q-11-6.2-4-7.2Q4-7.6 8-3.2L12.4-6.4Q14 0 12.4 6.4L8 3.2Q4 7.6-4 7.2Q-11 6.2-12 0Z" fill="${c}" ${ink(2 / k)}/><circle cx="-7" cy="-2.2" r="1.3" fill="${INK}"/><path d="M-2-5q2 5 0 10M2.4-4.4q2 4.4 0 8.8" fill="none" stroke="${INK}" stroke-width="${(1.2 / k).toFixed(2)}"/></g>`;
  SPEC.taiyaki = {
    side: `${zFish(42, 52, 2.2, '#f0a030')}<path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥100〜', INK, .1)}${bubble(10, 156, 64, 18, 'やきたて!', 6.8)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `${zFish(40, 102, 1.5, '#d8902a')}${bubble(10, 132, 52, 18, 'しっぽまで!', 6)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 4.2, 'HOT', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  SPEC.kissa = {
    side: `<ellipse cx="42" cy="68" rx="22" ry="5" fill="#fbfaf4" ${ink(2.2)}/><path d="M26 46h32l-3 18q-13 4-26 0z" fill="#fbfaf4" ${ink(2.4)}/><path d="M27 52h30l-.6 4h-28.8z" fill="#b8283a"/><ellipse cx="42" cy="46" rx="16" ry="4" fill="#4a2814" ${ink(2)}/><path d="M36 38q-3-5 0-10M46 38q-3-5 0-10" fill="none" stroke="${INK}" stroke-width="1.6"/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥230〜', INK, .1)}${bubble(10, 156, 64, 18, 'ごゆっくり', 6.6)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `<circle cx="40" cy="96" r="9" fill="#dfeef8" ${ink(2)}/><path d="M31 97a9 9 0 0 0 18 0z" fill="#3a1e0e" ${ink(1.6)}/><rect x="36" y="76" width="8" height="12" fill="#dfeef8" ${ink(1.8)}/><path d="M28 108a12 3 0 0 0 24 0" fill="none" stroke="#ffb43a" stroke-width="2.4"/>
      ${bubble(10, 132, 52, 18, 'サイフォン!', 6)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 4, 'CAFE', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  SPEC.gacha = {
    side: `<circle cx="42" cy="56" r="20" fill="#eef7ff" ${ink(2.4)}/><path d="M22 56a20 20 0 0 0 40 0z" fill="#ff5fa2" ${ink(2.4)}/><circle cx="35" cy="47" r="4" fill="#fff"/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥200〜', INK, .1)}${bubble(10, 156, 64, 18, 'ガチャッ!', 7)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<circle cx="40" cy="104" r="16" fill="#c9d0da" ${ink(2.2)}/><rect x="26" y="100" width="28" height="8" rx="4" fill="#ff5fa2" ${ink(2)}/><circle cx="40" cy="104" r="4" fill="#fff" ${ink(1.6)}/>
      ${bubble(10, 132, 52, 18, 'なにがでる?', 6)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 3.8, 'LUCKY', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  SPEC.kakigori = {
    side: `<path d="M30 58l3 16h18l3-16z" fill="#fbfaf4" ${ink(2.2)}/><path d="M26 58q0-20 16-20t16 20z" fill="#fff" ${ink(2.2)}/><path d="M28.4 52q2-12 13.6-12t13.6 12q-6.8 2.6-13.6 2.6t-13.6-2.6z" fill="#e83a4a"/>${T(42, 70.4, 7, '氷', '#e83a4a')}
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥100〜', INK, .1)}${bubble(10, 156, 64, 18, 'ふわっふわ!', 6.2)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#3ff4ff')}`,
    left: `<rect x="26" y="84" width="28" height="36" rx="1" fill="#fffdf6" ${ink(2.2)}/>${T(40, 108, 18, '氷', '#e83a4a')}<path d="M26 112q3.5-3 7 0t7 0t7 0t7 0v8H26z" fill="#2a6ad9"/>
      ${bubble(10, 132, 52, 18, 'ひんやり!', 6.6)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#3ff4ff" ${ink()}/>${T(102, 216, 4.2, 'COOL', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  SPEC.oden = {
    side: `<path d="M18 50q0 16 24 16t24-16z" fill="#fbfaf4" ${ink(2.2)}/><ellipse cx="42" cy="50" rx="24" ry="8" fill="#d8a040" ${ink(2)}/><path d="M24 52h36" stroke="#e8453a" stroke-width="3"/>
      <path d="M34 50l-6-22M50 50l6-22" stroke="#e8d0a0" stroke-width="2" stroke-linecap="round"/><circle cx="31" cy="38" r="5" fill="#c8955a" ${ink(1.8)}/><path d="M48 46l4-8 4 8z" fill="#8a8478" ${ink(1.8)}/>
      <path d="${star(58, 124, 14, 9)}" fill="#ffd23f" ${ink()}/>${T(58, 126.4, 6, '¥100〜', INK, .1)}${bubble(10, 156, 64, 18, 'ぐつぐつ!', 6.6)}${tag('M12 206q8-12 16 0t16-2q6-6 12 4', '#ff4f8b')}`,
    left: `<ellipse cx="40" cy="104" rx="14" ry="20" fill="#e8453a" ${ink(2.2)}/><rect x="32" y="82" width="16" height="5" rx="1.5" fill="${INK}"/><rect x="32" y="121" width="16" height="5" rx="1.5" fill="${INK}"/>${T(40, 108, 9, 'おでん', '#fff')}
      ${bubble(10, 136, 52, 18, 'あつあつ!', 7)}<path d="${star(60, 178, 12, 8)}" fill="#3ff4ff" ${ink()}/>${T(60, 180.6, 5.4, 'NEW', INK)}${tag('M10 200q6-10 12 0t12-2', '#ffd23f')}`,
    door: `<path d="${star(102, 214, 8, 5.4)}" fill="#ffd23f" ${ink()}/>${T(102, 216, 4.2, 'HOT', INK, .1)}`,
    band: [6, 184.4, 108, 2.4],
  };
  function apply(id, ge) {
    const sp = SPEC[id]; if (!sp) return;
    ge.querySelectorAll('text.sign').forEach(t => { if ((t.getAttribute('fill') || '').startsWith('rgba')) t.classList.add('iso-only'); });
    UTIL.g(ge, `<rect width="84" height="240" fill="url(#zzDots)"/>${ISO.right ? sp.side : sp.left}`, { class: 'zz-only', transform: CORE.sidePlane(120, 84, 240), 'pointer-events': 'none' });
    const door = ge.querySelector('.door-out');
    if (door) UTIL.g(door, `<rect x="${sp.band[0]}" y="${sp.band[1]}" width="${sp.band[2]}" height="${sp.band[3]}" fill="url(#zzHazard)" ${ink(1.6)}/>
      <rect x="2" y="6" width="1.8" height="228" rx=".9" fill="#fff" fill-opacity=".5"/><rect x="6" y="6" width="1" height="228" rx=".5" fill="#fff" fill-opacity=".25"/>${sp.door}`, { class: 'zz-only', 'pointer-events': 'none' });
  }
  return { defs, apply };
})();
