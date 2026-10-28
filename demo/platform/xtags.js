/* The X-ray's name tags (the owner, 2026-10-22): they cover most of a machine's details, worst on the oden machine. So
   they fade out once the player has left the screen alone for 2 s, and fade back in for a while when the view moves (a
   drag, a pinch, a turn, the wheel, ← →) or the X-ray is opened again. The 2 s count from the end of the scan (the tags
   pop up as its line passes them) and from the last touch, not from its start. Only the group's opacity: the tags' own
   pop-in (.tagb.on) stays as the prototype has it */
(() => {
  const tags = document.getElementById('tags');
  if (!tags || !window.__ND) return;
  const IDLE = 2000;
  let last = 0, down = null, timer = 0;
  const show = () => { last = performance.now(); tags.classList.remove('nd-idle'); arm(); };
  function arm() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!tags.firstChild) return;   // (the X-ray closed: the next one starts shown)
      const left = IDLE - (performance.now() - last);
      if (down || __ND.xr < 1 || left > 0) { if (__ND.xr < 1) last = performance.now(); arm(); return; }
      tags.classList.add('nd-idle');
    }, __ND.xr < 1 ? 150 : Math.max(120, IDLE - (performance.now() - last)));   // (while the scan runs, every 150 ms)
  }
  // a fresh X-ray: the group goes from empty to its tags (a sale or a turn redraws them in place, no change here)
  let had = !!tags.firstChild;
  new MutationObserver(() => { const has = !!tags.firstChild; if (has && !had) show(); if (!has) { clearTimeout(timer); tags.classList.remove('nd-idle'); } had = has; })
    .observe(tags, { childList: true });
  // moving the view: a finger (or the mouse) that travels, a second finger, the wheel, the arrow keys. A plain tap
  // (selling) leaves them as they are
  const on = (t, f, o) => document.addEventListener(t, f, { capture: true, passive: true, ...o });
  const pts = new Map();
  on('pointerdown', e => { pts.set(e.pointerId, [e.clientX, e.clientY]); down = true; if (pts.size > 1 && tags.firstChild) show(); });
  on('pointermove', e => { const p = pts.get(e.pointerId); if (!p || !tags.firstChild) return;
    if (Math.hypot(e.clientX - p[0], e.clientY - p[1]) > 6) { pts.set(e.pointerId, [e.clientX, e.clientY]); show(); } });
  const up = e => { pts.delete(e.pointerId); down = pts.size > 0; if (tags.firstChild) arm(); };
  on('pointerup', up); on('pointercancel', up);
  on('wheel', () => { if (tags.firstChild) show(); });
  on('keydown', e => { if (tags.firstChild && /^Arrow/.test(e.key)) show(); });
})();
