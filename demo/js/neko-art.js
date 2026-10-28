/* The street's cats, in every spot and pose they pick (cat v1: ミケ; cat v2: seven cats, 2026-10-15). The same doodle
   language as the street — firm black ink, flat colour, marker blush — and one set of poses for everyone: each cat is a
   coat (base colour, ears, the marks on its face, the marks on its back, the tail, eyes, nose) and a size.
     ミケ    三花: sakura-notched left ear (a neighbourhood cat), orange right ear and forehead patch, striped tail
     ちび    a calico kitten: the same coat mirrored (orange left ear), small, big-headed
     クロ    all black, gold eyes, pale lids so its face still reads in the dark
     チャトラ orange tabby: stripes on the back, an M on the forehead, white muzzle
     モフ    ragdoll: cream, dark brown points (ears, mask, tail), blue eyes, a black nose, a fluffy ruff, white mitts
     シロ    all white, one blue eye and one gold
     ハチワレ black and white: the 八-split over the forehead, black back, white chest and socks
   Gear: ミケ wears what the album wardrobe gives her; the others wear their own accessory once 见证 tier 2 opens.
   Each pose is drawn around its ground point (0, 0); the street places it on a machine's top, in front of it, on the
   kerb, in the box, in an empty lot, head first in a take-out flap, or round the food bowl. */
const NEKOART = (() => {
  const INK = '#141018', PINK = '#ffb3c8', DARK = '#3d3446';
  const ink = (w = 2.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const COAT = {
    mike: { a: '#fffdf8', ears: ['notch', '#fffdf8', '#ffb877'], patch: 'R', b: '#ffb877', e: '#5b4a52', body: 'calico', tail: ['#fffdf8', '#ffb877', '#5b4a52'] },
    chibi: { a: '#fffdf8', ears: ['plain', '#ffb877', '#fffdf8'], patch: 'L', b: '#ffb877', e: '#5b4a52', body: 'calico', tail: ['#fffdf8', '#ffb877', '#5b4a52'], size: .74 },
    kuro: { a: DARK, ears: ['plain', DARK, DARK], inner: '#6c5a7c', patch: null, body: null, tail: [DARK, null, DARK], lid: '#cfc4e6', iris: '#ffd84a', nose: '#1d1724', blush: '#7a5a8a', whisk: '#cfc4e6' },
    chatora: { a: '#ffc285', ears: ['plain', '#ffc285', '#ffc285'], patch: 'tabby', b: '#e8863e', body: 'tabby', tail: ['#ffc285', '#e8863e', '#e8863e'], muzzle: '#fff4e6' },
    mofu: { a: '#fff3e0', ears: ['plain', '#5e4536', '#5e4536'], inner: '#9a7a66', patch: 'mask', b: '#6e5242', body: null, tail: ['#5e4536', null, '#5e4536'], fluffy: true, iris: '#4f9cff', nose: '#1d1724', paw: '#ffffff', size: 1.06 },
    shiro: { a: '#ffffff', ears: ['plain', '#ffffff', '#ffffff'], patch: null, body: null, tail: ['#ffffff', null, '#ffffff'], iris: ['#4f9cff', '#ffd84a'] },
    ao: { a: '#9aa9c2', ears: ['plain', '#9aa9c2', '#9aa9c2'], inner: '#c4b4d0', patch: null, body: null, tail: ['#9aa9c2', null, '#9aa9c2'], iris: '#8ee05a', nose: '#5a6880', blush: '#c79ab8' },
    hachi: { a: '#ffffff', bodyA: DARK, ears: ['plain', DARK, DARK], inner: '#6c5a7c', patch: 'hachi', b: DARK, body: 'bib', tail: [DARK, null, DARK], paw: '#ffffff' },
  };
  const coat = id => COAT[id] || COAT.mike;
  const bodyOf = c => c.bodyA || c.a, pawOf = c => c.paw || c.a;
  // the street's box: the cats' home at the end of the street (front face x 3..43, y 698..724); the food bowl beside it
  const BOX = { x: 23, y: 724 }, BOWL = { x: 62, y: 752 };
  const defs = `<defs><pattern id="nk-tabby" width="5.2" height="5.2" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><rect width="2" height="5.2" fill="#e8863e"/></pattern></defs>`;

  /* ---------- the head, around its centre, radius 9.5. eyes: shut | open | happy | yawn | lick ---------- */
  function patch(c) {
    if (c.patch === 'R') return `<path d="M2.5 -8.6q4 1 6.2 5.2q-3.4-.4-6.2-5.2z" fill="${c.b}"/>`;
    if (c.patch === 'L') return `<path d="M-2.5 -8.6q-4 1-6.2 5.2q3.4-.4 6.2-5.2z" fill="${c.b}"/>`;
    if (c.patch === 'tabby') return `<path d="M-2.6 -8.8l.7 3.4M0 -9.5v3.8M2.6 -8.8l-.7 3.4M-9.3 -1.4l2.8.5M-9.4 1.2l2.6.1M9.3 -1.4l-2.8.5M9.4 1.2l-2.6.1" stroke="${c.b}" stroke-width="1.5" stroke-linecap="round"/>`;
    if (c.patch === 'mask') return `<ellipse cx=".3" cy="1.4" rx="6" ry="5.4" fill="${c.b}" opacity=".45"/><ellipse cx=".3" cy="2.8" rx="3.2" ry="2.8" fill="${c.b}" opacity=".5"/>`;
    if (c.patch === 'hachi') return `<path d="M-9.1 -2.6A9.5 9.5 0 0 1 -1 -9.45L-1.5 -3.2Q-5 -3.8 -9.1 -2.6Z" fill="${c.b}"/><path d="M9.1 -2.6A9.5 9.5 0 0 0 1 -9.45L1.5 -3.2Q5 -3.8 9.1 -2.6Z" fill="${c.b}"/>`;
    return '';
  }
  function eyesOf(c, eyes) {
    const lid = c.lid || INK, ir = Array.isArray(c.iris) ? c.iris : [c.iris || INK, c.iris || INK];
    if (eyes === 'open') return [[-3, ir[0]], [3.6, ir[1]]].map(([x, col]) => col === INK
      ? `<ellipse cx="${x}" cy=".2" rx="1.25" ry="1.5" fill="${INK}"/><circle cx="${x + .4}" cy="-.3" r=".45" fill="#fff"/>`
      : `<ellipse cx="${x}" cy=".2" rx="1.5" ry="1.75" fill="${col}" ${ink(.7)}/><ellipse cx="${x}" cy=".3" rx=".45" ry="1.2" fill="${INK}"/><circle cx="${x + .5}" cy="-.4" r=".4" fill="#fff"/>`).join('');
    if (eyes === 'happy') return `<path d="M-5 1q2-2.4 4 0M2 1q2-2.4 4 0" fill="none" stroke="${lid}" stroke-width="1.6" stroke-linecap="round"/>`;
    if (eyes === 'yawn') return `<path d="M-5.2-.8l2.6 1.2-2.6 1.2M5.8-.8l-2.6 1.2 2.6 1.2" fill="none" stroke="${lid}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<path d="M-5 0q2 2 4 0M2 0q2 2 4 0" fill="none" stroke="${lid}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  function head(c, eyes = 'shut', g = {}, neck = true) {
    const [kind, eL, eR] = c.ears, inner = c.inner || PINK, lid = c.lid || INK, blush = c.blush || PINK;
    let s = c.fluffy ? `<path d="M-9.6 1.4l-3 2 2.4.8-1.8 2.6 3-.4.4 2.6 2.2-1.8 1.6 2.4 1.4-2.4 1.6 2.6 1.4-2.6 1.6 2.4 1.6-2.4 2.2 1.8.4-2.6 3 .4-1.8-2.6 2.4-.8-3-2z" fill="${c.a}" ${ink(1.8)}/>` : '';
    s += kind === 'notch' ? `<path d="M-7 -7l.9-8.4 1.2 1.8.8-1.2 5.1 4.8z" fill="${eL}" ${ink(2)}/>`
      : `<path d="M-2 -10l-7-5.5-.5 8.5z" fill="${eL}" ${ink(2)}/><path d="M-3.8 -10l-4-3-.3 4.4z" fill="${inner}"/>`;
    s += `<path d="M2 -10l7-5.5 .5 8.5z" fill="${eR}" ${ink(2)}/><path d="M3.8 -10l4-3 .3 4.4z" fill="${inner}"/>`
      + `<circle r="9.5" fill="${c.a}"/>` + patch(c) + (c.muzzle ? `<ellipse cx=".2" cy="3.6" rx="4.6" ry="3.2" fill="${c.muzzle}"/>` : '') + `<circle r="9.5" fill="none" ${ink()}/>`;
    s += eyesOf(c, eyes);
    s += `<ellipse cx="-6" cy="3.5" rx="2.1" ry="1.2" fill="${blush}"/><ellipse cx="6.5" cy="3.5" rx="2.1" ry="1.2" fill="${blush}"/>`
      + (c.blush ? '' : `<path d="M-7 4.2l1-1.5M-5.6 4.2l1-1.5M5.6 4.2l1-1.5M7 4.2l1-1.5" stroke="#ff6f92" stroke-width="1" stroke-linecap="round"/>`)
      + (eyes === 'yawn' ? `<ellipse cx=".3" cy="5" rx="2.4" ry="2.8" fill="#ff7f9a" ${ink(1.2)}/>`
        : `<path d="M-.4 2.4h1.8l-.9 1z" fill="${c.nose || '#ff7f9a'}"/><path d="M-1.6 3.8q1.1 1.5 2.1.1q1 1.4 2.1-.1" fill="none" stroke="${lid}" stroke-width="1.2" stroke-linecap="round"/>`
          + (eyes === 'lick' ? `<path d="M-.4 4.6q.9 2.4 1.8 0z" fill="#ff7f9a" ${ink(.8)}/>` : ''))
      + `<path d="M8.5 2.8l6.5-1.6M8.5 4.6l6.2.8M-8.5 2.8l-6.5-1.6M-8.5 4.6l-6.2.8" stroke="${c.whisk || INK}" stroke-width="1" stroke-linecap="round"/>`;
    if (neck && g.neck) s += neckGear(g.neck);
    if (g.head) s += hatGear(g.head);
    return s;
  }
  // a sleeping head that opens its eyes for a moment when something sells below it (the street adds .look)
  const dozy = (c, g) => `<g class="hd-s">${head(c, 'shut', g)}</g><g class="hd-o">${head(c, 'open', g)}</g>`;
  // a collar, a scarf, a badge, a bag or a bow tie under the chin
  function neckGear(d) {
    if (d.id === 'bell') return `<path d="M-8.5 7.4q8.5 4.4 17 0" fill="none" stroke="#ff5a6a" stroke-width="2.6" stroke-linecap="round"/><circle cy="11.6" r="3.3" fill="${d.c}" ${ink(1.4)}/><path d="M-2 11.6h4" ${ink(1)}/>`;
    if (d.id === 'tencho') return `<path d="M-7.5 7.4q7.5 4 15 0" fill="none" stroke="#ff5a6a" stroke-width="1.6" stroke-linecap="round"/><rect x="-5" y="9.4" width="10" height="6" rx="1.2" fill="${d.c}" ${ink(1.3)}/><text x="0" y="13.9" font-size="4" text-anchor="middle" class="nk-badge">店長</text>`;
    if (d.id === 'bowtie') return `<path d="M0 10.4l-5.6-3.4v6.8zM0 10.4l5.6-3.4v6.8z" fill="${d.c}" ${ink(1.4)}/><circle cy="10.4" r="1.7" fill="${d.c}" ${ink(1.2)}/>`;
    if (d.id === 'bag') return `<path d="M-8 6.6q4 7 14 9" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M-8 6.6q4 7 14 9" fill="none" stroke="${d.c}" stroke-width="1.2" stroke-linecap="round"/>`
      + `<rect x="4.4" y="12.4" width="9" height="7" rx="1.6" fill="${d.c}" ${ink(1.4)}/><path d="M4.4 14.6h9" ${ink(1)}/><circle cx="8.9" cy="16.6" r=".9" fill="#fff"/>`;
    return `<path d="M-6.6 9.4l-3 6.6 4.4 1.4 2.4-6.6z" fill="${d.c}" ${ink(1.4)}/><path d="M-9.5 5.6q9.5 5.4 19 0v4q-9.5 5.6-19 0z" fill="${d.c}" ${ink(1.6)}/>`
      + (d.id === 'scarf-star' ? `<path d="M-5.1 7.2l.4.9 1 .1-.8.7.2 1-.8-.5-.8.5.2-1-.8-.7 1-.1z" fill="#ffe14a"/><path d="M3 7.6l.4.8.9.1-.7.6.2.9-.8-.4-.8.4.2-.9-.7-.6.9-.1z" fill="#ffe14a"/>` : '')
      + (d.c === '#ffffff' ? `<path d="M-8 9.6q1 1.6 2 0t2 0 2 0 2 0 2 0 2 0 2 0 2 0" fill="none" stroke="#c9bfe0" stroke-width=".9"/>` : '');
  }
  function hatGear(d) {
    if (d.id === 'crown') return `<path d="M-4.5 -6.5l.8-6.5 2.6 2.8 1.6-5 1.6 5 2.6-2.8.8 6.5z" fill="${d.c}" ${ink(1.5)}/><circle cx=".5" cy="-8.8" r="1.2" fill="#ff4f8b"/>`;
    if (d.id === 'candy-clip') return `<g transform="translate(7.5 -7.5) rotate(-20)"><path d="M-2-1l-3.4-2v6l3.4-2zM2-1l3.4-2v6l-3.4-2z" fill="${d.c}" ${ink(1.2)}/><rect x="-2.2" y="-2.2" width="4.4" height="4.4" rx="1.6" fill="${d.c}" ${ink(1.2)}/></g>`;
    if (d.id === 'chef-hat') return `<path d="M-6.5 -10q-4-1-3-5t5-3q1-4 4.5-4t4.5 4q4-1 5 3t-3 5z" fill="#fff" ${ink(1.5)}/><rect x="-7" y="-11.4" width="14" height="4.6" rx="1" fill="#fff" ${ink(1.4)}/>`;
    return `<path d="M-9.5 -5q0-11 9.5-11t9.5 11z" fill="${d.c}" ${ink(1.5)}/><rect x="-10.5" y="-7" width="21" height="4.6" rx="2.3" fill="#fff" ${ink(1.4)}/><circle cy="-15.6" r="2.8" fill="#fff" ${ink(1.4)}/>`;
  }
  // a front paw (in socks or boots when worn)
  function paw(c, g, x, y, rx = 4.2, ry = 2.6) {
    const f = g.feet;
    if (!f) return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${pawOf(c)}" ${ink(1.5)}/>`;
    const tall = f.id === 'boots-rain' ? 6.4 : 4.4;
    return `<rect x="${x - rx}" y="${y + ry - tall}" width="${rx * 2}" height="${tall}" rx="${Math.min(2.4, rx)}" fill="${f.c}" ${ink(1.5)}/>`
      + (f.id === 'socks-white' ? `<path d="M${x - rx + 1.2} ${y + ry - tall + 1.6}h${rx * 2 - 2.4}" stroke="#ff5a6a" stroke-width="1.2" stroke-linecap="round"/>` : '');
  }
  // the tail along a path from the body to the tip: base colour, rings when it has them, a tip, inside one ink outline
  function tail(d, c, k = 1) {
    const [base, ring, tip] = c.tail, w = k * (c.fluffy ? 1.35 : 1);
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${6.4 * w}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${base}" stroke-width="${3.8 * w}" stroke-linecap="round"/>`
      + (ring ? `<path d="${d}" pathLength="100" fill="none" stroke="${ring}" stroke-width="${3.8 * w}" stroke-dasharray="0 36 12 10 10 100"/>` : '')
      + (tip !== base ? `<path d="${d}" pathLength="100" fill="none" stroke="${tip}" stroke-width="${3.8 * w}" stroke-linecap="round" stroke-dasharray="0 84 16 100"/>` : '');
  }
  // the body: its base, then the coat's marks (calico patches, tabby stripes, a white bib on a black cat)
  function fur(c, el, pB, pE) {
    let s = `<${el} fill="${bodyOf(c)}" ${ink()}/>`;
    if (c.body === 'calico') s += `<path d="${pB}" fill="${c.b}"/><path d="${pE}" fill="${c.e}"/>`;
    else if (c.body === 'tabby') s += `<${el} fill="url(#nk-tabby)" opacity=".85"/>`;
    return s;
  }
  // placed by the outer group; the inner one is free to bob while it eats
  const at = (x, y, s, r = 0, k = 1) => `<g transform="translate(${x} ${y})${r ? ` rotate(${r})` : ''}${k !== 1 ? ` scale(${k})` : ''}"><g class="nk-head">${s}</g></g>`;
  const shadow = (rx, x = 0) => `<ellipse cx="${x}" cy=".6" rx="${rx}" ry="3" fill="#000" opacity=".2"/>`;
  const heart = (x, y) => `<path d="M${x} ${y + 3}q-4-2.6-4-5a2.2 2.2 0 0 1 4-1a2.2 2.2 0 0 1 4 1q0 2.4-4 5z" fill="#ff6f92" ${ink(1.2)}/>`;
  // a white chest for the black-and-white cat when it sits up
  const bib = c => c.body === 'bib' ? `<path d="M-5.6 0q-1.4-9 5.6-14q7 5 5.6 14z" fill="#fff" ${ink(1.4)}/>` : '';

  /* ---------- the poses. Each returns { s: markup, head: [x, y] (for the food and the heart), sleep } ---------- */
  const sitBody = c => shadow(13) + tail('M8 -2q12 1 10-11', c) + fur(c, 'path d="M-11 0q-3-20 11-22q14 2 11 22z"', 'M-9.5 -9q4-6 9.6-3.4q-2.4 5.4-9.6 3.4z', 'M5.4 -17q4.2-.2 5.8 3.8q-4.2 1-5.8-3.8z') + bib(c);
  const POSE = {
    // on a machine's top: the loaf (the classic), curled up, stretched out
    loaf: (c, g) => ({ s: tail('M-22 -5q-12 0-11 12q1 7 7 5', c) + fur(c, 'ellipse cx="-6" cy="-9" rx="21" ry="10.5"', 'M-20 -14q7-6 14-2q-3 6-14 2z', 'M-2 -18q5-2 8 2q-4 3-8-2z')
      + paw(c, g, 17, -1) + paw(c, g, 25, -1) + at(13, -14, dozy(c, g)), head: [13, -14], sleep: true }),
    curl: (c, g) => ({ s: fur(c, 'ellipse cx="-2" cy="-8" rx="17" ry="9"', 'M-17 -10q4-8 14-8q-2 7-14 8z', 'M0 -16q5-1 8 3q-5 2-8-3z')
      + at(12, -8, dozy(c, g), 14, .92) + tail('M-17 -5q-3 7 8 6.5q12-.5 18-4', c), head: [12, -8], sleep: true }),
    stretch: (c, g) => ({ s: tail('M-28 -6q-9 1-8 12', c) + fur(c, 'ellipse cx="-6" cy="-7.5" rx="24" ry="7.5"', 'M-24 -11q8-5 16-2q-4 5-16 2z', 'M0 -14q5-1 8 2q-4 2-8-2z')
      + paw(c, g, 24, -2.6, 4.6, 2.4) + paw(c, g, 31.5, -1.8, 4.6, 2.4) + at(14, -11, head(c, 'happy', g), -6), head: [14, -11] }),
    // in front of a machine, on the pavement: lying down; on its back (见证 1)
    lie: (c, g) => ({ s: shadow(28, -2) + tail('M-24 -4q-8 3-17 .5', c) + fur(c, 'ellipse cx="-6" cy="-9" rx="20" ry="9.5"', 'M-19 -13q7-6 13-2q-3 6-13 2z', 'M-2 -17q5-2 8 2q-4 3-8-2z')
      + paw(c, g, 16, -1) + paw(c, g, 23, -1) + at(13, -13, head(c, 'shut', g)), head: [13, -13], sleep: true }),
    belly: (c, g) => ({ s: shadow(26) + tail('M-20 -5q-9 0-11-8', c) + fur(c, 'ellipse cx="-3" cy="-8" rx="18" ry="8.5"', 'M-19 -6q16 8 32 -1q-1 3-3 4.6q-14 4.6-28 -.6z', 'M-9 -14q5-2 8 2q-4 3-8-2z')
      + (c.body === 'bib' ? `<path d="M-15 -6q14 7 28 -1q-1 3-3 4.6q-12 4-22 -.6z" fill="#fff"/>` : '')
      + paw(c, g, -12, -16, 2.6, 3.6) + paw(c, g, -5.5, -17.4, 2.6, 3.6) + paw(c, g, 7, -17.4, 2.6, 3.6) + paw(c, g, 12.6, -15.4, 2.6, 3.6) + at(19, -10, head(c, 'happy', g, false), 28), head: [19, -10] }),
    // on the kerb by a machine: sitting (awake, watching the street), washing its face, a big yawn (见证 1)
    sit: (c, g) => ({ s: sitBody(c) + paw(c, g, -4, -1.4, 3.3, 2.2) + paw(c, g, 4, -1.4, 3.3, 2.2) + at(0, -28, head(c, 'open', g)), head: [0, -28] }),
    groom: (c, g) => ({ s: sitBody(c) + paw(c, g, 4, -1.4, 3.3, 2.2) + at(-1, -27, head(c, 'lick', g), -12) + `<g transform="translate(-5.6 -21.4) rotate(-50)">${paw(c, g, 0, 0, 3.1, 2.2)}</g>`, head: [-1, -27] }),
    yawn: (c, g) => ({ s: sitBody(c) + paw(c, g, -4, -1.4, 3.3, 2.2) + paw(c, g, 4, -1.4, 3.3, 2.2) + at(0, -28.5, head(c, 'yawn', g), -8), head: [0, -28.5] }),
    // in an empty lot (见证 1): sprawled out, belly to the moon
    sprawl: (c, g) => POSE.belly(c, g),
    // head first in a machine's take-out flap, nibbling (an easter egg: only a picture, nothing goes missing)
    snack: (c, g) => ({ s: tail('M8 -12q12-6 9-19', c) + `<path d="M-12.5 -1q-2-15 12.5-16q14.5 1 12.5 16z" fill="${bodyOf(c)}" ${ink()}/>`
      + (c.body === 'calico' ? `<path d="M-10 -9q3-6 10-5q-2 6-10 5z" fill="${c.b}"/><path d="M4 -14q4-1 6 3q-4 1-6-3z" fill="${c.e}"/>` : c.body === 'tabby' ? `<path d="M-12.5 -1q-2-15 12.5-16q14.5 1 12.5 16z" fill="url(#nk-tabby)" opacity=".85"/>` : '')
      + `<path d="M-16 -16.4h32" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`
      + [-7, 7].map(x => `<ellipse cx="${x}" cy="-1" rx="4" ry="2.5" fill="${pawOf(c)}" ${ink(1.5)}/><ellipse cx="${x}" cy="-.6" rx="1.7" ry="1.1" fill="${PINK}"/>`).join('')
      + `<text class="nk-mogu" x="-30" y="-24" font-size="8.5">もぐもぐ</text><circle cx="-14" cy="-19" r="1" fill="#e2a95c"/><circle cx="15" cy="-20" r="1.1" fill="#e2a95c"/><circle cx="-18" cy="-14" r=".8" fill="#e2a95c"/>`, head: [0, -18] }),
    // round the food bowl: sitting with the head down in it
    eat: (c, g) => ({ s: sitBody(c) + paw(c, g, -4, -1.4, 3.3, 2.2) + paw(c, g, 4, -1.4, 3.3, 2.2) + at(1, -21, head(c, 'shut', g), 12), head: [1, -21] }),
  };
  // the cardboard box: back flap, then whoever is in it (now and then two squeezed in), then the front with its label
  function box(list, eating) {
    const x = BOX.x, y = BOX.y, two = list.length > 1;
    let s = `<g class="nk-box${eating ? ' eat' : ''}"${list[0] ? ` data-cat="${list[0].id}"` : ''}><path d="M${x - 16} ${y - 26}l4-8h24l4 8z" fill="#c98e52" ${ink(2)}/>`;
    if (two) s += at(x - 7.5, y - 29, head(coat(list[0].coat), 'shut', list[0].g), -12, .8 * (list[0].size || 1)) + at(x + 8, y - 30, head(coat(list[1].coat), 'happy', list[1].g), 10, .8 * (list[1].size || 1));
    else if (list[0]) s += at(x, y - 31, head(coat(list[0].coat), 'shut', list[0].g), 0, .95 * (coat(list[0].coat).size || 1));
    s += `<path d="M${x - 20} ${y - 26}l-6-7 7-2 4 9z" fill="#e4b07a" ${ink(1.8)}/><path d="M${x + 20} ${y - 26}l6-7-7-2-4 9z" fill="#e4b07a" ${ink(1.8)}/>`
      + `<rect x="${x - 20}" y="${y - 26}" width="40" height="26" rx="2" fill="#dda36a" ${ink(2.2)}/><path d="M${x - 20} ${y - 20}h40" stroke="#f2cf9e" stroke-width="2.2"/>`
      + `<rect x="${x - 10}" y="${y - 15}" width="20" height="9" rx="1.5" fill="#fff6e6" ${ink(1.2)}/><text x="${x}" y="${y - 8.4}" font-size="6.2" text-anchor="middle" class="nk-label">みかん</text>`;
    if (list[0]) { const c0 = coat(list[0].coat), g0 = list[0].g;
      s += two ? paw(c0, g0, x - 9, y - 25.6, 3, 2) + paw(coat(list[1].coat), list[1].g, x + 10, y - 25.6, 3, 2) + tail(`M${x + 20} ${y - 12}q9 1 9-9`, coat(list[1].coat), .85) + tail(`M${x - 20} ${y - 10}q-9 0-8-9`, c0, .85)
        : paw(c0, g0, x - 6, y - 25.6, 3.4, 2.2) + paw(c0, g0, x + 6, y - 25.6, 3.4, 2.2) + tail(`M${x + 20} ${y - 12}q9 1 9-9`, c0, .9); }
    return s + '</g>';
  }
  // out on its rounds: a few paw prints leaving the box
  const prints = () => [[52, 714], [62, 709], [73, 714], [84, 709]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(80)" fill="#2c2448" opacity=".55"><ellipse cy="1.2" rx="2" ry="1.6"/><circle cx="-1.8" cy="-1.4" r=".75"/><circle cy="-2" r=".75"/><circle cx="1.8" cy="-1.4" r=".75"/></g>`).join('');
  // paw prints on a machine's glass where a cat sat on top (an easter egg); シロ wipes them off. Wiped, the glass keeps
  // only a quiet shine; the squeak and the sparkles (.nk-wipe) are a moment, played now and then, never left standing
  const pawPrint = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(1.3)" fill="#5d6696" opacity=".62"><ellipse cy="1.3" rx="2.2" ry="1.8"/><circle cx="-2" cy="-1.5" r=".85"/><circle cy="-2.3" r=".85"/><circle cx="2" cy="-1.5" r=".85"/></g>`;
  const glass = (x, wiped) => wiped
    ? `<path d="M${x + 33} 501l-7 16M${x + 39} 503l-4.5 10" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`
      + `<g class="nk-wipe">` + [[x + 28, 504, 3.2], [x + 52, 514, 2.4], [x + 40, 524, 2]].map(([a, b, r]) => `<path d="M${a} ${b - r * 2}Q${a} ${b} ${a + r * 2} ${b}Q${a} ${b} ${a} ${b + r * 2}Q${a} ${b} ${a - r * 2} ${b}Q${a} ${b} ${a} ${b - r * 2}Z" fill="#fff6d6" ${ink(1)}/>`).join('')
      + `<text class="nk-mogu" x="${x + 46}" y="497" font-size="7" text-anchor="middle">キュッキュッ</text></g>`
    : pawPrint(x + 24, 506, -14) + pawPrint(x + 36, 516, 8) + pawPrint(x + 55, 508, 20);
  // a present (恩返し): a little furoshiki bundle on the pavement
  const parcel = (x, y, name) => `<g class="st-gift" role="button" aria-label="${name} 留下的礼物" transform="translate(${x} ${y})"><path d="M-8 0q-1-9 8-9t8 9z" fill="#ff8fb0" ${ink(2)}/>`
    + `<path d="M-2.4 -8.4l-3.4-4.4 4.6 1.2zM2.4 -8.4l3.4-4.4-4.6 1.2z" fill="#ff8fb0" ${ink(1.6)}/><circle cx="-3.4" cy="-3.6" r="1" fill="#fff"/><circle cx="2.6" cy="-5" r="1" fill="#fff"/><circle cx="3.8" cy="-1.4" r="1" fill="#fff"/></g>`;
  // a visitor waiting for its first meal: a speech bubble with the food it would like
  const ask = (x, y, letter) => `<g class="nk-ask" transform="translate(${x} ${y})"><path d="M-11 -11h22v15h-12l-4 4v-4h-6z" fill="#fff8ec" ${ink(1.8)}/>`
    + (letter ? `<use href="#tier-${letter}" x="-10" y="-11.4" width="14" height="14"/><text x="7" y="0" font-size="10" text-anchor="middle" class="nk-q">?</text>` : `<text y="0" font-size="11" text-anchor="middle" class="nk-q">?</text>`) + '</g>';
  // rain on a cat sitting at the kerb: it holds a big leaf over its head, drips run off the edges
  const leaf = `<g transform="translate(1 -41) rotate(-8)"><path d="M0 4v22" ${ink(1.8)}/><path d="M-19 4q3-15 19-15t19 15q-9-4.6-19-4.6t-19 4.6z" fill="#79c86a" ${ink(2)}/>`
    + `<path d="M0-10v9M-9-7l9 6M9-7l-9 6" stroke="#4f9a45" stroke-width="1.2" stroke-linecap="round"/></g>`
    + `<path d="M-21 -30v4M-23 -20v3M22 -32v4M25 -21v3" stroke="#9ec6ff" stroke-width="1.6" stroke-linecap="round"/>`;
  // the food bowl at the end of the street (tap it to feed everyone)
  const bowl = (food, open) => `<g class="st-bowl${open ? '' : ' off'}" role="button" aria-label="${T`猫饭盆：喂全街的猫`}" transform="translate(${BOWL.x} ${BOWL.y})">`
    + `<ellipse cy="2" rx="15" ry="3.4" fill="#000" opacity=".25"/><path d="M-13 -6h26l-3 8h-20z" fill="#ff8fb0" ${ink(2)}/><ellipse cy="-6" rx="13" ry="3" fill="#ffd6e4" ${ink(1.8)}/>`
    + `<path d="M-6 -3.4l1.6-1.2 1.6 1.2M2 -3.4l1.6-1.2 1.6 1.2" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>`
    + (food ? `<use href="#tier-${food}" x="-7" y="-17" width="14" height="14" opacity=".9"/>` : '') + '</g>';

  /* ---------- the whole street's cats. o: { cats: [{id, coat, g, spot, full, eating}], visitors: [{id, coat, g, want}],
     gift, glass: [{lot, wiped}], rain, bowl: food letter (0: none yet) }. lotX: a lot's left edge. zs: gets where each
     sleeping cat's z goes, { id, x, y (its baseline), k (its scale) }: the street puts the z's in a layer of their own ---------- */
  function spotXY(sp, lotX, rain) {
    if (sp.kind === 'top') return [lotX(sp.lot) + 50, 450];
    if (sp.kind === 'front') return [lotX(sp.lot) + 46, 701];
    if (sp.kind === 'kerb') return [lotX(sp.lot) + 50, 728];
    if (sp.kind === 'lot') return [lotX(sp.lot) + 46, 642];
    if (sp.kind === 'tray') return [lotX(sp.lot) + 45, 650];
    if (sp.kind === 'box') return [BOX.x, BOX.y - 6];
    return [-40, 760];   // out: off the left edge
  }
  // visitors sit in a row on the road past the bowl, clear of the 全部补货 button below
  const visitXY = n => [100 + n * 32, 758 + (n % 2) * 3];
  function draw(o, lotX, zs = []) {
    const cats = o.cats || [], inBox = cats.filter(x => x.spot.kind === 'box');
    // (v0.46) home: false on a street other than なんでも通り (no box, no paw prints out of it)
    let s = defs + (o.bowl !== undefined ? bowl(o.bowl, o.bowl > 0) : '') + (o.home === false ? '' : box(inBox, inBox.some(x => x.eating)));
    if (o.home !== false && cats.some(x => x.spot.kind === 'out')) s += prints();
    (o.glass || []).forEach(p => { s += glass(lotX(p.lot), p.wiped); });
    const items = [];
    cats.forEach(x => { const sp = x.spot; if (sp.kind === 'box' || sp.kind === 'out' || sp.kind === 'gone') return;
      const wet = o.rain && sp.kind === 'kerb', [gx, gy] = spotXY(sp, lotX, o.rain);
      items.push({ x, gx, gy, pose: wet ? 'sit' : sp.pose, wet }); });
    (o.visitors || []).forEach((v, n) => { const [gx, gy] = visitXY(n); items.push({ x: v, gx, gy, pose: 'sit', visitor: true }); });
    items.sort((a, b) => a.gy - b.gy);
    for (const it of items) {
      const c = coat(it.x.coat), p = (POSE[it.pose] || POSE.sit)(c, it.x.g || {}), k = c.size || 1;
      s += `<g class="nk-cat${it.x.eating ? ' eat' : ''}${it.visitor ? ' nk-visit' : ''}" data-cat="${it.x.id}" transform="translate(${it.gx} ${it.gy})${k !== 1 ? ` scale(${k})` : ''}">${p.s}`
        + `${it.wet ? leaf : ''}</g>`;
      if (p.sleep && !it.x.eating) zs.push({ id: it.x.id, x: it.gx + (p.head[0] + 9) * k, y: it.gy + (p.head[1] - 14) * k, k });
      const hx = it.gx + p.head[0] * k, hy = it.gy + p.head[1] * k;
      if (it.visitor) s += ask(hx + 13, hy - 13, it.x.want);
      else if (it.x.full && it.pose !== 'snack') s += heart(hx + 10, hy - 16);
      if (it.x.eating) s += `<use href="#tier-${it.x.eating}" x="${hx + 4}" y="${hy + 3}" width="14" height="14" class="nk-food"/>`;
    }
    inBox.forEach((x, n) => { if (x.full) s += heart(BOX.x - 6 + n * 14, BOX.y - 50); if (x.eating) s += `<use href="#tier-${x.eating}" x="${BOX.x + 6}" y="${BOX.y - 36}" width="14" height="14" class="nk-food"/>`; });
    if (o.gift) s += parcel(lotX(o.gift.lot) + 8, 700, o.gift.name || '猫');
    return `<g class="st-neko">${s}</g>`;
  }
  // mealtime: everyone hops over to the bowl, eats with hearts, and hops back (a few seconds; resolves when done).
  // list: [{id, coat, g, from: [x, y]}]; g: the layer to play it in
  function meal(layer, list, food) {
    const ring = [[-30, 0], [30, 0], [-15, -15], [15, -15], [-57, 7], [57, 7], [0, -25], [-45, -13], [45, -13]];
    let s = defs + `<g class="st-bowl" transform="translate(${BOWL.x} ${BOWL.y})"><ellipse cy="2" rx="15" ry="3.4" fill="#000" opacity=".25"/><path d="M-13 -6h26l-3 8h-20z" fill="#ff8fb0" ${ink(2)}/><ellipse cy="-6" rx="13" ry="3" fill="#ffd6e4" ${ink(1.8)}/>`
      + `<path d="M-9 -7q3-3 6-1t6-1 6 1" fill="none" stroke="#e2a95c" stroke-width="3" stroke-linecap="round"/>${food ? `<use href="#tier-${food}" x="-7" y="-20" width="14" height="14"/>` : ''}</g>`;
    const slots = list.map((x, i) => { const [dx, dy] = ring[i % ring.length]; return [BOWL.x + dx, BOWL.y + dy - 2]; });
    const order = list.map((x, i) => i).sort((a, b) => slots[a][1] - slots[b][1]);
    order.forEach(i => { const x = list[i], c = coat(x.coat), k = c.size || 1, face = slots[i][0] > BOWL.x ? -1 : 1;
      s += `<g class="nk-meal" data-i="${i}" transform="translate(${x.from[0]} ${x.from[1]})"><g transform="scale(${f2(k * face)} ${f2(k)})"><g class="nk-hop">${POSE.sit(c, x.g || {}).s}</g><g class="nk-chew" style="display:none">${POSE.eat(c, x.g || {}).s}</g></g></g>`; });
    layer.innerHTML = s;
    const els = [...layer.querySelectorAll('.nk-meal')];
    const hop = (el, from, to, ms, delay) => el.animate(Array.from({ length: 9 }, (_, n) => { const t = n / 8, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t - Math.abs(Math.sin(t * Math.PI * 3)) * 9;
      return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` }; }), { duration: ms, delay, easing: 'linear', fill: 'forwards' });
    const go = els.map(el => { const i = +el.dataset.i; return hop(el, list[i].from, slots[i], 1100, i * 90).finished; });
    return Promise.all(go).then(() => new Promise(res => {
      els.forEach(el => { el.querySelector('.nk-hop').style.display = 'none'; el.querySelector('.nk-chew').style.display = ''; el.classList.add('eat'); });
      const hearts = slots.map(([x, y]) => heart(x + 6, y - 40)).join(''); layer.insertAdjacentHTML('beforeend', `<g class="nk-meal-hearts">${hearts}</g>`);
      setTimeout(res, 2600);
    })).then(() => {
      layer.querySelector('.nk-meal-hearts')?.remove();
      els.forEach(el => { el.querySelector('.nk-hop').style.display = ''; el.querySelector('.nk-chew').style.display = 'none'; el.classList.remove('eat'); });
      return Promise.all(els.map(el => { const i = +el.dataset.i; return hop(el, slots[i], list[i].back || list[i].from, 1000, i * 70).finished; }));
    });
  }
  const f2 = v => (+v).toFixed(3);
  // a cat on its own, sitting up and looking at you (the cat card's portrait, the crate's stowaway)
  const portrait = (id, g = {}, box = '-22 -48 44 50') => `<svg viewBox="${box}" aria-hidden="true">${defs}${POSE.sit(coat(id), g).s}</svg>`;
  const sitting = (id, g = {}) => defs + POSE.sit(coat(id), g).s;
  // a cat's face on its own (its sticker): happy eyes, no gear
  const face = id => head(coat(id), 'happy', {}, false);
  /* the lucky cat (招き猫, polish 2026-10-16): a white ceramic figurine on a red cushion — calico spots, a red collar with
     a gold bell, a koban coin held to its chest, its left paw raised (the one that beckons customers). Drawn around its
     base (0, 0), about 26 tall; the raised paw is its own group (.mnk-paw) so a sale can make it beckon. w: ink width */
  function maneki(w = 1.6) {
    const k = ink(w), t = ink(w * .55), CER = '#fffdf6', RED = '#e8343f', GOLD = '#ffc93a';
    return `<g class="mnk"><path d="M-10.5 0q0-3.2 10.5-3.2t10.5 3.2q0 2.6-10.5 2.6t-10.5-2.6z" fill="#b2364e" ${k}/>`
      + `<path d="M-7.6-2.4q-1.8-6.4 1-10.6h13.2q2.8 4.2 1 10.6q-3.2 1.7-7.6 1.7t-7.6-1.7z" fill="${CER}" ${k}/>`
      + `<path d="M-6.8-20.4l1-6 4.2 3.2zM6.8-20.4l-1-6-4.2 3.2z" fill="${CER}" ${k}/><path d="M-5.6-21.6l.5-2.9 2 1.6zM5.6-21.6l-.5-2.9-2 1.6z" fill="#ff8fa3"/>`
      + `<ellipse cy="-17.4" rx="7.8" ry="6.4" fill="${CER}" ${k}/>`
      + `<path d="M-7.2-19.6q.6-3.6 4.4-4.1q.8 2.6-1.4 4.4q-1.6.6-3-.3z" fill="#ffb877"/><path d="M4.4-23.4q2.4.4 2.9 2.6q-1.5.5-2.6-.6z" fill="#3d3446"/>`
      + `<path d="M-4.3-17.6q1.4-1.5 2.8 0M1.5-17.6q1.4-1.5 2.8 0" fill="none" ${t}/><path d="M-.6-15.6h1.2l-.6.7z" fill="#ff6f86"/>`
      + `<path d="M-1.4-14.5q.7.9 1.4 0q.7.9 1.4 0" fill="none" ${t}/><path d="M-5.4-15.2l-3.2-.5M-5.3-14.4l-3 .7M5.4-15.2l3.2-.5M5.3-14.4l3 .7" ${t}/>`
      + `<ellipse cx="-4.6" cy="-15.6" rx="1.3" ry=".7" fill="#ff8fa3"/><ellipse cx="4.6" cy="-15.6" rx="1.3" ry=".7" fill="#ff8fa3"/>`
      + `<path d="M-6.3-12.4q6.3 2.4 12.6 0v1.9q-6.3 2.4-12.6 0z" fill="${RED}" ${k}/><circle cy="-9.7" r="1.6" fill="${GOLD}" ${t}/>`
      + `<ellipse cx="-1.6" cy="-6.4" rx="3.6" ry="2.4" fill="${GOLD}" ${k}/><path d="M-3.4-6.4h3.6" stroke="#b07a10" stroke-width="${(w * .45).toFixed(2)}"/>`
      + `<path d="M-6.6-5.6q1.2-2.6 3.6-1.8q.6 1.8-.8 2.8z" fill="${CER}" ${t}/>`
      + `<g class="mnk-paw"><path d="M4.8-11.2q1.2-6.4 3.4-10.6q1.8-1.7 3.2 0q.4 3.8-1.6 10.8z" fill="${CER}" ${k}/><path d="M8.7-21v1.3M10.1-21.1v1.3" ${t}/></g></g>`;
  }
  // one cat in one pose, on its own (the phone widget, v0.38): the svg content and where its head is
  const pose = (id, name, g = {}) => { const p = (POSE[name] || POSE.sit)(coat(id), g); return { s: defs + p.s, head: p.head || [0, -20] }; };
  return { draw, meal, portrait, sitting, face, pose, maneki, spotXY, visitXY, coat, BOX, BOWL, COAT };
})();
