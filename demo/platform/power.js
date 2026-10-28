/* The 30 fps cap (handoff list S11 and 设置: 「省电模式：……正式版再加 30 帧上限」; roadmap M0b: low power ≤ 33 ms a frame).
   While iOS Low Power Mode is on (the shell: window.__ndLowPower at document start, __ndPower(on) when it changes) or
   the game's own 省电模式 switch is (UTIL.low, settings.js), the page's requestAnimationFrame callbacks run on at most
   30 display frames a second: a frame that comes less than ~29 ms after the last one that ran holds every callback
   over to the next frame (every other frame at 60 Hz, every fourth at 120 Hz).
   The game times its motion by the clock, not by counting frames: the main loop's dt and its sales (app.js: `now`
   against nextIdle), UTIL.tween (now − t0), the machines' step(now) and their own 30 Hz redraws, the rain (dt). So
   everything keeps its pace in half the frames. CSS animations and Web Animations are the browser's to time and are
   not capped here (WebKit throttles its own rendering in Low Power Mode).
   Not in turn.html: that page is paused and only waits a frame or two before each snapshot.
   Debug: ?flags=fps30 (or the shell's -pageFlags fps30) caps it whatever the power state; __ndPower() says whether
   the cap is on. */
(() => {
  const raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  const MIN = 1000 / 30 - 4;   // (ms since the last frame that ran; 4 ms for the display's jitter)
  let lowPower = !!window.__ndLowPower;
  const capped = () => lowPower || !!UTIL.low || !!(window.__ndFlags && __ndFlags.fps30);
  // one decision per display frame (every callback in a frame gets the same timestamp)
  let frameTs = NaN, runs = true, lastRun = -Infinity;
  const due = ts => { if (ts !== frameTs) { frameTs = ts; runs = !capped() || ts - lastRun >= MIN; if (runs) lastRun = ts; } return runs; };
  const held = new Map();   // handle given out → the browser's request that stands for it now (held over a frame)
  window.requestAnimationFrame = cb => {
    if (!capped()) return raf(cb);   // (no cap: the browser's own, untouched)
    let h = 0;
    const go = ts => { if (due(ts)) { held.delete(h); cb(ts); } else held.set(h, raf(go)); };
    h = raf(go); held.set(h, h); return h;
  };
  window.cancelAnimationFrame = h => { const r = held.get(h); held.delete(h); caf(r === undefined ? h : r); };
  // the shell: iOS Low Power Mode went on or off (no argument: only asks)
  window.__ndPower = on => { if (on !== undefined) lowPower = !!on; return capped(); };
})();
