/* The rain you hear (user, 2026-10-20: too loud, always the same downpour, like white noise). The prototype's rain is one
   loop of white noise, band-passed 500–3200 Hz, at one fixed level for the whole shower (sound.js startBeds / rain()).
   Here (build patch in sound.js and env.js, tools/build_www.py):
   - softer: pink noise (more low, less hiss) through a lowpass that opens as the rain gets heavier; measured in
     Chromium, light rain is about 15 dB under the prototype's rain and the heaviest about 5 dB under
   - it changes: each shower wanders between light rain and a heavier one; the next intensity is picked every 12–30 s and
     reached slowly (time constant 5 s), never a jump; light rain is more likely than heavy
   - drops: a few soft separate patters on top, more of them when it rains harder, so it is not a flat hiss
   - the drops on screen follow the same intensity (40–100 % of the prototype's 130 drops)
   It plays through the game's own master gain (the sound switch, pause with the app). */
const ND_RAIN = window.ND_RAIN = (() => {
  const TAU = 5;                        // seconds: how slowly the intensity follows its target
  let ctx = null, out = null, body = null, lp = null, on = false, timer = 0, dropTimer = 0;
  let from = .4, target = .4, since = performance.now();
  const level = () => target + (from - target) * Math.exp(-(performance.now() - since) / 1000 / TAU);
  const pick = () => .1 + .9 * Math.pow(Math.random(), 1.4);     // 0.1 light … 1 heavy, mostly light-to-medium
  const bodyGain = i => .012 + .072 * i;                      // (the prototype: .085 of white noise, whatever the rain)
  const cutoff = i => 900 + 1900 * i;

  function retarget(t) {
    from = level(); target = t; since = performance.now();
    if (ctx && on) { const now = ctx.currentTime; body.gain.setTargetAtTime(bodyGain(target), now, TAU); lp.frequency.setTargetAtTime(cutoff(target), now, TAU); }
  }
  function wander() { clearTimeout(timer); if (!on) return; timer = setTimeout(() => { retarget(pick()); wander(); }, 12000 + Math.random() * 18000); }

  function pinkBuffer(c, seconds) {   // Paul Kellet's pink filter over white noise; long enough that the loop is not heard
    const n = Math.round(c.sampleRate * seconds), fade = Math.round(c.sampleRate * .05), x = new Float32Array(n + fade);
    const b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < x.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
      b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
      x[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
    }
    // (no click where the loop joins: the head fades from what would have followed the tail into its own noise)
    d.set(x.subarray(0, n)); for (let i = 0; i < fade; i++) { const k = i / fade; d[i] = x[i] * k + x[n + i] * (1 - k); }
    return b;
  }
  let white = null;
  function drop() {   // one soft patter: a short band of noise, 1.6–4.6 kHz, quiet
    const i = level(), t = ctx.currentTime + Math.random() * .05, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = white; f.type = 'bandpass'; f.frequency.value = 1600 + Math.random() * 3000; f.Q.value = 3 + Math.random() * 4;
    const peak = (.012 + Math.random() * .03) * (.5 + .5 * i), dur = .012 + Math.random() * .03;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .002); g.gain.exponentialRampToValueAtTime(.0001, t + .002 + dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + .05);
  }
  function patter() {   // drops per second: about 3 in light rain, 14 in heavy
    clearTimeout(dropTimer); if (!on) return;
    const live = ctx && ctx.state === 'running' && SND.enabled;   // (otherwise: look again in a second, play nothing)
    dropTimer = setTimeout(() => { if (live && ctx.state === 'running' && SND.enabled) drop(); patter(); }, live ? -Math.log(1 - Math.random()) * 1000 / (2 + 12 * level()) : 1000);
  }

  return {
    // sound.js startBeds(), once the first touch has made the audio context
    start(c, master, wantRain) {
      ctx = c; out = master;
      white = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const w = white.getChannelData(0); for (let i = 0; i < w.length; i++) w[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(), hp = c.createBiquadFilter(); s.buffer = pinkBuffer(c, 9); s.loop = true;
      hp.type = 'highpass'; hp.frequency.value = 180; lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff(level()); lp.Q.value = .5;
      body = c.createGain(); body.gain.value = 0; s.connect(hp); hp.connect(lp); lp.connect(body); body.connect(master); s.start();
      on = false; this.set(wantRain);
    },
    // sound.js rain(on): a new shower starts at its own intensity and fades in over a few seconds; stopping fades out
    set(want) {
      const was = on; if (want && !on) { from = target = pick(); since = performance.now(); }
      on = want;
      if (ctx) { const now = ctx.currentTime; body.gain.setTargetAtTime(on ? bodyGain(target) : 0, now, on ? (was ? TAU : 1.5) : 1); lp.frequency.setTargetAtTime(cutoff(target), now, was ? TAU : .5); }
      wander(); patter();
    },
    // env.js stepRain: the share of the prototype's drops drawn now
    drops: () => .4 + .6 * level(),
    get level() { return level(); },
  };
})();
