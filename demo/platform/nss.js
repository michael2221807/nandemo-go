/* Thin lines without vector-effect (2026-10-19, rewritten the same night). The machines draw their ink lines with
   vector-effect: non-scaling-stroke (a 1-px line stays 1 px however far the camera zooms). WebKit on iOS draws those
   with its older SVG engine and, for every such shape at every redraw, works out the shape's transform to the screen
   by walking up the tree: on an iPhone 13 Pro that was about half of each camera step while turning a machine.
   Here, inside the four stage layers, the same lines are drawn as ordinary strokes whose width is divided by the
   scale from the shape to the screen:
     --ndw   the width the cascade gives the element (every stroke-width the page declares — its stylesheet rules,
             presentation attributes, inline styles, keyframes — is declared again as --ndw, with the same precedence)
     --ndz   that element's own scale: 1, or for a non-scaling stroke var(--nss) × var(--ndk) (every vector-effect
             the page declares is declared again as --ndz, with the same precedence; not inherited)
     --nss   1 / the camera's zoom, on each layer (from its viewBox and its size, no layout read)
     --ndk   1 / the line-thickness scale of the transforms between the layer and the element (set on transformed
             groups and <use>s as they are added; independent of the camera)
   and every element in the layers draws stroke-width: calc(var(--ndw) × var(--ndz)). So the art style switch, the
   keyframes and the cascade work exactly as before. `-pageFlags keepNSS` (debug) leaves everything as the prototype
   draws it. */
(() => {
  if (window.__ndFlags && __ndFlags.keepNSS) return;
  const LAYERS = ['stage', 'stage-ext', 'stage-ghost', 'stage-top'].map(id => document.getElementById(id)).filter(Boolean);
  if (!LAYERS.length || !(window.CSS && CSS.registerProperty)) return;
  const NSS = 'non-scaling-stroke', P = `:is(${LAYERS.map(l => '#' + l.id).join(',')})`;
  const reg = (name, syntax, inherits, initialValue) => { try { CSS.registerProperty({ name, syntax, inherits, initialValue }); } catch (e) { /* already */ } };
  reg('--ndw', '<length-percentage>', true, '1px'); reg('--nss', '<number>', true, '1'); reg('--ndk', '<number>', true, '1'); reg('--ndz', '<number>', false, '1');
  const ZON = 'calc(var(--nss) * var(--ndk))';
  const width = v => { v = String(v).trim(); return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(v) ? v + 'px' : v; };

  // a selector list split at its top-level commas (each part keeps its own specificity)
  function parts(list) {
    const out = []; let depth = 0, quote = '', cur = '';
    for (const ch of list) {
      if (quote) { cur += ch; if (ch === quote) quote = ''; continue; }
      if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === ',' && !depth) { out.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  // 1. the page's own rules, again, in the same order: stroke-width → --ndw, vector-effect → --ndz, each under the
  //    layers (:is(#stage, …) adds the same specificity to every one of them, so they rank among themselves as before)
  function convert(rules, out) {
    for (const r of rules) {
      if (r.type === CSSRule.STYLE_RULE) {
        const da = r.style.getPropertyValue('stroke-dasharray').trim();
        if (da && da !== 'none') parts(r.selectorText).forEach(sel => dashed.add(sel));
        const sw = r.style.getPropertyValue('stroke-width'), ve = r.style.getPropertyValue('vector-effect');
        if (!sw && !ve) continue;
        let body = '';
        if (sw) body += `--ndw:${width(sw)}${r.style.getPropertyPriority('stroke-width') ? '!important' : ''};`;
        if (ve) body += `--ndz:${ve.trim() === NSS ? ZON : '1'}${r.style.getPropertyPriority('vector-effect') ? '!important' : ''};`;
        for (const sel of parts(r.selectorText)) out.push(`${P} :is(${sel}),${P}:is(${sel}){${body}}`);
      } else if (r.type === CSSRule.KEYFRAMES_RULE) {
        // the same keyframes under the same name (the later one wins), widths as --ndw (registered: it interpolates)
        let has = false; const frames = [...r.cssRules].map(k => { const decl = [...k.style].map(p => {
          const v = k.style.getPropertyValue(p);
          if (p === 'stroke-width') { has = true; return `--ndw:${width(v)}`; }
          return `${p}:${v}`; }).join(';'); return `${k.keyText}{${decl}}`; });
        if (has) out.push(`@keyframes ${r.name}{${frames.join('')}}`);
      } else if (r.cssRules && (r.type === CSSRule.MEDIA_RULE || r.type === CSSRule.SUPPORTS_RULE)) {
        const inner = []; convert(r.cssRules, inner);
        if (inner.length) out.push(`@${r.type === CSSRule.MEDIA_RULE ? 'media' : 'supports'} ${r.conditionText}{${inner.join('')}}`);
      }
    }
  }
  const sheetRules = [], dashed = new Set();
  for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch (e) { continue; } convert(rules, sheetRules); }
  // 2. presentation attributes (below every rule, as they are): one --ndw rule per width in use, added as new ones appear
  const attrWidths = new Set(), attrRules = [];
  const scanAttrs = root => {
    const one = el => { const v = el.getAttribute('stroke-width'); if (v !== null && !attrWidths.has(v)) { attrWidths.add(v); attrRules.push(`:where([stroke-width="${v.replace(/"/g, '\\"')}"]){--ndw:${width(v)}}`); } };
    if (root.nodeType === 1 && root.hasAttribute('stroke-width')) one(root);
    for (const el of root.querySelectorAll('[stroke-width]')) one(el);
  };
  // 3. inline styles (above every rule): the same declarations as custom properties, in place
  const inline = root => {
    const one = el => { const s = el.style; if (!s) return;
      const sw = s.getPropertyValue('stroke-width'), ve = s.getPropertyValue('vector-effect');
      if (sw) s.setProperty('--ndw', width(sw), s.getPropertyPriority('stroke-width'));
      if (ve) s.setProperty('--ndz', ve.trim() === NSS ? ZON : '1', s.getPropertyPriority('vector-effect')); };
    if (root.nodeType === 1 && root.hasAttribute('style')) one(root);
    for (const el of root.querySelectorAll('[style*="stroke-width"],[style*="vector-effect"]')) one(el);
  };

  // the line-thickness scale of a transform attribute's linear part (|det| over the axes' mean length: exact for
  // uniform scales and for the iso faces, whose axes have equal length; a compromise for unequal scales)
  const linOf = t => {
    let M = [1, 0, 0, 1], m; const re = /(matrix|scale|translate|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
    const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3]];
    while ((m = re.exec(t))) { const a = m[2].split(/[\s,]+/).filter(Boolean).map(Number), r = Math.PI / 180; let L = null;
      if (m[1] === 'matrix' && a.length === 6) L = a.slice(0, 4);
      else if (m[1] === 'scale') L = [a[0], 0, 0, a.length > 1 ? a[1] : a[0]];
      else if (m[1] === 'rotate') L = [Math.cos(a[0] * r), Math.sin(a[0] * r), -Math.sin(a[0] * r), Math.cos(a[0] * r)];
      else if (m[1] === 'skewX') L = [1, 0, Math.tan(a[0] * r), 1];
      else if (m[1] === 'skewY') L = [1, Math.tan(a[0] * r), 0, 1];
      if (L) M = mul(M, L); }
    return M;
  };
  const thickOf = M => { const det = Math.abs(M[0] * M[3] - M[1] * M[2]), ax = Math.hypot(M[0], M[1]), ay = Math.hypot(M[2], M[3]);
    return det && ax && ay ? det / Math.sqrt(ax * ay) : 1; };
  const num = v => { const n = parseFloat(v); return isFinite(n) ? n : null; };
  // --ndk on each transformed element and <use> under root (lines inside <defs> are drawn through <use>s). memo: the
  // linear part from the layer down to an element, kept for the one batch of changes being handled
  let memo = new Map();
  const chain = (layer, e) => {
    if (!e || e === layer || e.nodeType !== 1) return [1, 0, 0, 1];
    let M = memo.get(e); if (M) return M;
    const A = chain(layer, e.parentNode), t = e.getAttribute('transform');
    if (t) { const L = linOf(t); M = [A[0] * L[0] + A[2] * L[1], A[1] * L[0] + A[3] * L[1], A[0] * L[2] + A[2] * L[3], A[1] * L[2] + A[3] * L[3]]; } else M = A;
    memo.set(e, M); return M;
  };
  /* each shape under root: drawn as an ordinary stroke only where one width gives exactly the prototype's line —
     a transform from the layer that is a plain scale (and rotation), a horizontal or vertical line (its one direction),
     a rectangle in a plane whose two axes have the same length (its edges run along them). A slanted line or a curve
     in a sheared plane (the printed art on the iso faces) has no single width that matches it in every direction: it
     keeps the effect (data-ndq). --ndk: 1 / the stretch of that transform across the line */
  const SHAPES = 'path,rect,circle,ellipse,line,polyline,polygon,text,use';
  function groups(layer, root) {
    const list = [...root.querySelectorAll(SHAPES)]; if (root.matches(SHAPES)) list.unshift(root);
    for (const e of list) {
      if (e.closest('defs,symbol')) continue;
      const M = chain(layer, e), s1 = Math.hypot(M[0], M[1]), s2 = Math.hypot(M[2], M[3]), det = Math.abs(M[0] * M[3] - M[1] * M[2]);
      const same = s1 && s2 && Math.abs(s1 / s2 - 1) < .01, square = same && Math.abs((M[0] * M[2] + M[1] * M[3]) / (s1 * s2)) < .01;
      let k = null;   // the line's scale on screen relative to the layer (null: keeps the effect)
      if (!det) k = null;
      else if (e.localName === 'use') k = null;   // (what it draws lies inside its own coordinates)
      else if (square) k = s1;
      else if (e.localName === 'line') { const x1 = e.getAttribute('x1') || '0', x2 = e.getAttribute('x2') || '0', y1 = e.getAttribute('y1') || '0', y2 = e.getAttribute('y2') || '0';
        if (x1 === x2) k = det / s2; else if (y1 === y2) k = det / s1; }
      else if (e.localName === 'rect' && same) k = det / s1;
      if (k === null) { if (!e.hasAttribute('data-ndq')) e.setAttribute('data-ndq', ''); continue; }
      if (e.hasAttribute('data-ndq')) e.removeAttribute('data-ndq');
      const v = String(1 / k); if (Math.abs(k - 1) > 1e-6 ? e.style.getPropertyValue('--ndk') !== v : e.style.getPropertyValue('--ndk')) e.style.setProperty('--ndk', v);
    }
  }

  // each layer's zoom: its size (kept by a ResizeObserver, read once here) against its viewBox
  const size = new Map(LAYERS.map(l => [l, { w: l.clientWidth, h: l.clientHeight }])), zoom = new Map();
  function fit(l) {
    const vb = (l.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number), s = size.get(l);
    const z = vb.length === 4 && vb[2] > 0 && vb[3] > 0 && s.w ? Math.min(s.w / vb[2], s.h / vb[3]) : 1;
    if (Math.abs((zoom.get(l) || 0) - z) <= z * 1e-6) return;
    zoom.set(l, z); l.style.setProperty('--nss', String(1 / z));
  }
  const ro = window.ResizeObserver && new ResizeObserver(es => { for (const e of es) { size.set(e.target, { w: e.contentRect.width, h: e.contentRect.height }); zoom.delete(e.target); fit(e.target); } });
  if (ro) LAYERS.forEach(l => ro.observe(l));

  const style = document.createElement('style'); style.id = 'nd-nss'; document.head.appendChild(style);
  let written = -1;
  const flush = () => { if (attrRules.length === written) return; written = attrRules.length;
    style.textContent = [`:where([vector-effect="${NSS}"]){--ndz:${ZON}}`, ...attrRules, ...sheetRules, `${P} ${draw}{stroke-width:calc(var(--ndw) * var(--ndz))!important;vector-effect:none!important}`].join('\n'); };
  // dashed lines keep the prototype's own drawing: with the effect their dashes are measured on the screen too, and
  // their dash patterns and offsets (some animated, some set from script) cannot be rescaled the same way
  const draw = `:not(:is([data-ndq],[stroke-dasharray]:not([stroke-dasharray="none"]),[style*="stroke-dasharray"]${[...dashed].map(sel => ',' + sel).join('')}))`;
  LAYERS.forEach(l => { scanAttrs(l); inline(l); groups(l, l); fit(l); }); memo = new Map();
  document.querySelectorAll('defs').forEach(d => { scanAttrs(d); inline(d); });
  flush();

  // rebuilt content (every camera step): its widths, inline styles and transformed groups; a new viewBox (the camera
  // moved or zoomed): the layer's zoom, written only when it changes (turning at home keeps it)
  const stat = { calls: 0, ms: 0, max: 0, nodes: 0 };
  const mo = new MutationObserver(list => { const t0 = performance.now(); stat.calls++;
    for (const m of list) {
      const layer = LAYERS.find(l => l === m.target || l.contains(m.target)); if (!layer) continue;
      if (m.type === 'attributes') { if (m.target === layer && m.attributeName === 'viewBox') fit(layer); else if (m.attributeName === 'stroke-width') scanAttrs(m.target); continue; }
      m.addedNodes.forEach(n => { if (n.nodeType !== 1 || !n.isConnected) return; scanAttrs(n); inline(n); groups(layer, n); stat.nodes++; });
    }
    flush(); memo = new Map();
    const dt = performance.now() - t0; stat.ms += dt; stat.max = Math.max(stat.max, dt);
  });
  LAYERS.forEach(l => mo.observe(l, { subtree: true, childList: true, attributes: true, attributeFilter: ['viewBox', 'stroke-width'] }));
  window.__ndNSS = { rules: () => attrRules.length + sheetRules.length, stat };
})();
