/* All sound is synthesised with WebAudio: no files. The context starts on the first tap (browser rule). */
const SND = (() => {
  let ctx = null, master = null, noiseBuf = null, enabled = true;
  let rainGain = null, humGain = null, whirGain = null, wantRain = true, humLevel = 0;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = enabled ? 0.7 : 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      startBeds();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const ready = () => ctx && enabled && ctx.state === 'running';
  const t0 = () => ctx.currentTime;
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, dur, peak = .2, type = 'sine', at = 0, to = null) {
    if (!ready()) return; const t = t0() + at, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    env(g, t, 0.005, peak, dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.08);
  }
  function noise(dur, peak = .3, type = 'bandpass', freq = 1000, q = 1, at = 0, a = 0.002) {
    if (!ready()) return; const t = t0() + at, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
    env(g, t, a, peak, dur); s.connect(fl); fl.connect(g); g.connect(master); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.08);
  }
  // continuous beds: rain, fluorescent hum, washing machine
  function loopNoise(filters, gainNode) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    let node = s; filters.forEach(([type, f, q]) => { const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7; node.connect(fl); node = fl; });
    node.connect(gainNode); gainNode.connect(master); s.start(); return s; }
  function startBeds() {
    ND_RAIN.start(ctx, master, wantRain);   // (app build: platform/rain.js)
    humGain = ctx.createGain(); humGain.gain.value = 0; humGain.connect(master);
    [[100, 1], [200, .45], [300, .15]].forEach(([f, a]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f; g.gain.value = a; o.connect(g); g.connect(humGain); o.start(); });
    whirGain = ctx.createGain(); whirGain.gain.value = 0; loopNoise([['lowpass', 420]], whirGain);
    beltGain = ctx.createGain(); beltGain.gain.value = 0; loopNoise([['bandpass', 260, 2.5]], beltGain);
    const mo = ctx.createOscillator(), mg = ctx.createGain(); mo.type = 'triangle'; mo.frequency.value = 58; mg.gain.value = .35; mo.connect(mg); mg.connect(beltGain); mo.start();
    hum(humLevel);
  }
  let beltGain = null;
  function belt(on) { if (beltGain) beltGain.gain.setTargetAtTime(on ? .09 : 0, t0(), on ? .05 : .12); }
  function rain(on) { wantRain = on; ND_RAIN.set(on); }   // (app build: platform/rain.js)
  function hum(level) { humLevel = level; if (humGain) humGain.gain.setTargetAtTime(level * .02, t0(), .4); }
  function whir(on) { if (whirGain) whirGain.gain.setTargetAtTime(on ? .05 : 0, t0(), .5); }
  function setEnabled(b) { enabled = b; if (master) master.gain.setTargetAtTime(b ? .7 : 0, t0(), .05); }

  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];
  return {
    unlock, setEnabled, rain, hum, whir,
    // (v0.41) GAME.pause / resume: the audio context sleeps with the app
    pause() { if (ctx && ctx.state === 'running') ctx.suspend(); }, resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); },
    get enabled() { return enabled; },
    // the vending-machine drop: low thud + sheet-metal clank + small bounce
    gakon() { tone(95, .17, .9, 'sine', 0, 42); noise(.09, .55, 'bandpass', 1700, 5); noise(.05, .22, 'bandpass', 3200, 8, .012);
      tone(70, .1, .3, 'sine', .075, 40); noise(.04, .14, 'bandpass', 1500, 5, .08); },
    canDrop() { tone(82, .22, 1, 'sine', 0, 38); noise(.12, .6, 'bandpass', 1300, 4); noise(.08, .3, 'bandpass', 2600, 9, .03);
      noise(.4, .05, 'bandpass', 900, 2, .12, .05); tone(62, .08, .28, 'sine', .17, 35); },
    coin() { tone(2637, .25, .11); tone(3520, .32, .08, 'sine', .035); tone(5274, .14, .03, 'sine', .035); },
    tick(i = 0) { tone(PENTA[((i % PENTA.length) + PENTA.length) % PENTA.length], .09, .12, 'triangle'); noise(.012, .07, 'highpass', 4000, .7); },
    chime() { [1046.5, 1318.51, 1567.98, 2093].forEach((f, k) => tone(f, .55, .09, 'triangle', k * .07)); },
    click() { noise(.015, .25, 'highpass', 3500, .8); tone(1800, .02, .04, 'square'); },
    pop() { tone(520, .07, .22, 'sine', 0, 1300); noise(.02, .07, 'highpass', 5000, .7); },
    crank() { noise(.03, .35, 'bandpass', 2200, 6); tone(300, .04, .1, 'square', 0, 200); },
    korokoro() { for (let k = 0; k < 6; k++) noise(.02, .2 - k * .025, 'bandpass', 2400 + Math.random() * 600, 6, k * .07 + k * k * .006);
      tone(900, .05, .07, 'triangle', .46); },
    capOpen() { tone(700, .06, .2, 'sine', 0, 1400); tone(1567.98, .2, .08, 'triangle', .06); tone(2093, .3, .07, 'triangle', .12); },
    // a startled little puff of breath (the X-ray line swept over a cat): a short hiss and a squeak, more surprise than anger
    fuff(k = 1) { if (!ready()) return; noise(.16, .07, 'bandpass', 3400, 1.1); tone(1150 * k, .09, .05, 'triangle', .03, 1650 * k); },
    // k: the cat's voice (1 = ミケ; クロ lower, the kitten higher and shorter: each cat has its own, see NEKO.voice)
    meow(k = 1) { if (!ready()) return; const t = t0(), o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain(), d = k > 1.3 ? .7 : k < .9 ? 1.15 : 1;
      o.type = 'sawtooth'; lp.type = 'lowpass'; lp.frequency.value = 1500 * Math.sqrt(k); lp.Q.value = 3;
      o.frequency.setValueAtTime(520 * k, t); o.frequency.exponentialRampToValueAtTime(840 * k, t + .13 * d); o.frequency.exponentialRampToValueAtTime(560 * k, t + .5 * d);
      l.frequency.value = 6; lg.gain.value = 14 * k; l.connect(lg); lg.connect(o.frequency);
      env(g, t, .05, .16 * d, .5 * d); o.connect(lp); lp.connect(g); g.connect(master); o.start(t); l.start(t); o.stop(t + .62 * d); l.stop(t + .62 * d); },
    purr(k = 1) { if (!ready()) return; const t = t0(), s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), am = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      s.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.value = 160 * k; l.frequency.value = 23 * Math.sqrt(k); lg.gain.value = .5; am.gain.value = .5;
      l.connect(lg); lg.connect(am.gain); env(g, t, .2, .5, 1.3); s.connect(lp); lp.connect(am); am.connect(g); g.connect(master);
      s.start(t); l.start(t); s.stop(t + 1.6); l.stop(t + 1.6); },
    clank() { noise(.12, .4, 'bandpass', 900, 3); noise(.08, .25, 'bandpass', 2400, 7, .02); tone(420, .12, .07, 'triangle', 0, 380); },
    jingle() { [784, 987.77, 1174.66, 1567.98, 1174.66, 1567.98, 2093].forEach((f, k) => tone(f, .12, .06, 'square', k * .075)); },
    buzz() { tone(120, .09, .05, 'sawtooth'); noise(.05, .05, 'bandpass', 3000, 2); },
    rumble() { noise(.7, .09, 'bandpass', 600, 1.5, 0, .08); for (let k = 0; k < 7; k++) noise(.03, .12, 'bandpass', 1800 + Math.random() * 900, 7, .05 + k * .09); },
    switchOn() { noise(.02, .3, 'bandpass', 2600, 4); tone(150, .03, .06, 'square'); },
    belt,
    lift() { tone(620, .2, .05, 'sine', 0, 1250); noise(.22, .035, 'bandpass', 2600, 1.4, 0, .06); tone(1567.98, .25, .035, 'triangle', .12); },
    doorOpen() { noise(.03, .3, 'bandpass', 2400, 5); tone(320, .05, .1, 'square', 0, 180); noise(.5, .05, 'bandpass', 700, 6, .05, .12); tone(140, .4, .05, 'sawtooth', .08, 110); },
    doorClose() { tone(90, .2, .7, 'sine', 0, 45); noise(.1, .4, 'bandpass', 900, 2); noise(.03, .3, 'bandpass', 2600, 6, .1); tone(260, .04, .1, 'square', .1, 160); },
    crate() { tone(110, .16, .5, 'sine', 0, 70); noise(.12, .3, 'bandpass', 500, 1.5); for (let k = 0; k < 4; k++) noise(.03, .1, 'bandpass', 1800 + k * 300, 7, .05 + k * .04); },
    poton() { tone(175, .13, .45, 'sine', 0, 82); noise(.07, .2, 'lowpass', 650, 1); noise(.03, .1, 'bandpass', 1500, 4, .05); },
    // cup machine
    cupDrop() { noise(.03, .3, 'bandpass', 2600, 4); tone(900, .04, .08, 'triangle', 0, 600); noise(.02, .15, 'bandpass', 1800, 6, .06); },
    turn() { tone(70, .3, .18, 'sawtooth', 0, 90); noise(.3, .05, 'bandpass', 500, 2, 0, .05); noise(.02, .2, 'bandpass', 2200, 6, .3); },
    ice() { for (let k = 0; k < 3; k++) { tone(2400 + Math.random() * 900, .07, .09, 'sine', k * .12); noise(.03, .12, 'bandpass', 3800, 6, k * .12); } },
    powder() { noise(.5, .05, 'bandpass', 4200, .8, 0, .08); },
    pour(ms = .9) { noise(ms, .07, 'bandpass', 900, 1.2, 0, .08); noise(ms, .03, 'lowpass', 400, 1, 0, .1); },
    mix(ms = .8) { tone(180, ms, .06, 'sawtooth', 0, 240); noise(ms, .04, 'bandpass', 1200, 2, 0, .1); },
    ding() { tone(1567.98, .5, .1, 'sine'); tone(2093, .7, .07, 'sine', .14); },
    pick() { tone(880, .05, .08, 'triangle', 0, 1320); noise(.02, .08, 'bandpass', 2600, 5); },
    // solenoid pulling the pedal: a dry electric clack
    solenoid() { noise(.025, .45, 'bandpass', 1400, 3); tone(210, .05, .14, 'square', 0, 120); noise(.02, .2, 'bandpass', 3000, 6, .045); },
    // cans settling down the zigzag rack, one soft knock each
    settle(n = 7) { for (let k = 0; k < n; k++) { noise(.03, .13 - k * .01, 'bandpass', 700 + Math.random() * 260, 5, k * .045); tone(170 - k * 6, .05, .05, 'sine', k * .045, 120); } },
    tok() { tone(240, .06, .3, 'sine', 0, 110); noise(.03, .2, 'bandpass', 1100, 4); },
    coinRoll() { for (let k = 0; k < 5; k++) noise(.018, .14, 'bandpass', 3200 + k * 180, 9, k * .07); tone(2900, .12, .05, 'sine', .36); },
    // scanner sweep: soft rising (on) or falling (off) tone with air
    scan(on) { tone(on ? 340 : 900, .7, .06, 'sine', 0, on ? 900 : 340); noise(.6, .035, 'bandpass', on ? 2400 : 1600, 1.4, 0, .2); tone(on ? 1760 : 1320, .09, .05, 'triangle', .68); },
    beep() { tone(2093, .09, .1, 'square'); tone(2637, .12, .08, 'square', .1); },
    // a sale somewhere down the street: a soft muffled drop and a tiny coin twinkle
    streetSale() { tone(130, .12, .16, 'sine', 0, 70); noise(.05, .06, 'lowpass', 800, 1); tone(2637, .18, .03, 'sine', .08); },
    // calling a passer-by over: a light two-note chirp that climbs with the queue
    call(i = 0) { const f = PENTA[Math.min(PENTA.length - 2, 2 + i)]; tone(f, .07, .07, 'triangle'); tone(f * 1.25, .09, .06, 'triangle', .06); },
    cascade() { for (let k = 0; k < 14; k++) { tone(2400 + Math.random() * 1600, .12, .05, 'sine', k * .045 + Math.random() * .02); } noise(.6, .05, 'bandpass', 3800, 2, 0, .05); },
    load(i = 0) { const P = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760]; tone(P[i % P.length], .07, .09, 'triangle'); noise(.02, .1, 'bandpass', 900, 5); },
  };
})();
