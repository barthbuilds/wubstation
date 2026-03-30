// ============================================================================
// WUBSTATION 9000 v6 — AUDIO ENGINE
// ============================================================================
'use strict';

// Audio node references — static chain, never disconnect while running
let ctx, an, mg, lim, dist, crush, filt, vca;
let l1, l1g, l2, l2g, pha = [], phl, phg;
let al, alg, aldc;
let o1, o2, o1g, o2g, fmg;
let sub, subg;
// vowel: 3 bandpass always in chain, wet/dry mix
let vf1, vf2, vf3, vwet, vdry;
// ring: AM via gain driven by carrier; always in chain
let rmc, rmdepth, rmwet, rmdry;
// comb: delay+fb always in chain
let cbd, cbf, cbwet, cbdry;
// stutter: square lfo on vca gain — always connected
let stl, stg;
// v6: noise
let noiseNode, noiseGain;
// v6: unison — extra oscillator pairs
let uniOscs = [], uniGains = [];
// v6: LFO2 routing gains (gain-bypass instead of disconnect/reconnect)
let l2pitch, l2fm, l2cut;
// v6: chorus
let chDL, chDR, chLfo, chLfoG, chWet;
// v6: delay
let dlL, dlR, dlFbL, dlFbR, dlFilt, dlWet;
// v6: reverb
let rvConv, rvWet;
// Track whether worklets loaded
let workletsReady = false;

// Build algorithmic reverb IR (Schroeder/Freeverb-style)
function buildReverbIR(sampleRate, size, damping) {
  const len = Math.floor(sampleRate * Math.max(0.1, size));
  const buf = new Float32Array(len);
  const decay = Math.pow(0.001, 1 / len);
  const damp = 1 - Math.min(1, Math.max(0, damping));
  let lp = 0;
  for (let i = 0; i < len; i++) {
    let sample = (Math.random() * 2 - 1);
    // LP filter in feedback for damping
    lp = lp + damp * (sample - lp);
    buf[i] = lp * Math.pow(decay, i);
  }
  return buf;
}

function createReverbBuffer(ctx, size, damping) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * Math.max(0.1, size));
  const buffer = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const ir = buildReverbIR(sr, size, damping);
    data.set(ir);
  }
  return buffer;
}

async function start() {
  ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume();

  // Try loading AudioWorklets (won't work from file://)
  try {
    await ctx.audioWorklet.addModule('js/worklets/bitcrush-processor.js');
    await ctx.audioWorklet.addModule('js/worklets/noise-processor.js');
    workletsReady = true;
  } catch (e) {
    console.warn('AudioWorklets unavailable (file:// or unsupported), using fallbacks');
    workletsReady = false;
  }

  an = ctx.createAnalyser(); an.fftSize = 2048;
  lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -2; lim.knee.value = 2; lim.ratio.value = 20;
  lim.attack.value = .001; lim.release.value = .04;
  mg = ctx.createGain(); mg.gain.value = S.vol;
  dist = ctx.createWaveShaper(); dist.curve = dCurve(S.distAmt); dist.oversample = '4x';

  // Bitcrush: AudioWorklet if available, WaveShaper fallback
  if (workletsReady) {
    crush = new AudioWorkletNode(ctx, 'bitcrush-processor');
    if (S.bcOn) {
      crush.parameters.get('bits').value = S.bits;
      crush.parameters.get('rateReduction').value = S.bcRate;
    } else {
      crush.parameters.get('bits').value = 16;
      crush.parameters.get('rateReduction').value = 1;
    }
  } else {
    crush = ctx.createWaveShaper();
    crush.curve = S.bcOn ? bCurve(S.bits) : LINEAR_CURVE;
  }

  filt = ctx.createBiquadFilter(); filt.type = S.filterType;
  filt.frequency.value = S.cutoff; filt.Q.value = S.reso;
  vca = ctx.createGain(); vca.gain.value = 0;

  // LFO1 -> filter freq
  l1 = ctx.createOscillator(); l1.type = S.lfo1Shape; l1.frequency.value = er1();
  l1g = ctx.createGain(); l1g.gain.value = sld();
  l1.connect(l1g); l1g.connect(filt.frequency);

  // LFO2 with gain-bypass routing (no disconnect/reconnect)
  l2 = ctx.createOscillator(); l2.type = S.lfo2Shape; l2.frequency.value = S.lfo2Rate;
  l2g = ctx.createGain(); l2g.gain.value = S.lfo2Depth;
  l2.connect(l2g);
  // Three permanent routes, only one active at a time via gain
  l2pitch = ctx.createGain(); l2pitch.gain.value = S.lfo2Target === 'pitch' ? 1 : 0;
  l2fm = ctx.createGain(); l2fm.gain.value = S.lfo2Target === 'fm' ? 1 : 0;
  l2cut = ctx.createGain(); l2cut.gain.value = S.lfo2Target === 'cutoff2' ? 1 : 0;
  l2g.connect(l2pitch); l2g.connect(l2fm); l2g.connect(l2cut);

  // Amp LFO pump (inverted, always connected)
  al = ctx.createOscillator(); al.type = 'sine'; al.frequency.value = S.alfoRate;
  alg = ctx.createGain(); alg.gain.value = S.alfoOn ? S.alfoDepth : 0;
  aldc = ctx.createGain(); aldc.gain.value = -1;
  al.connect(alg); alg.connect(aldc); aldc.connect(mg.gain);

  // OSC1 + OSC2
  o1 = ctx.createOscillator(); o1.type = S.o1Wave; o1.frequency.value = m2h(S.activeNote);
  o1g = ctx.createGain(); o1g.gain.value = S.o1Vol; o1.connect(o1g);
  o2 = ctx.createOscillator(); o2.type = S.o2Wave; o2.frequency.value = m2h(S.activeNote);
  o2.detune.value = S.detune;
  o2g = ctx.createGain(); o2g.gain.value = 0; o2.connect(o2g);
  fmg = ctx.createGain(); fmg.gain.value = S.fmOn ? S.fmDepth * m2h(S.activeNote) / 440 : 0;
  o2.connect(fmg); fmg.connect(o1.frequency);

  // v6: NOISE GENERATOR
  if (workletsReady) {
    noiseNode = new AudioWorkletNode(ctx, 'noise-processor');
    noiseNode.parameters.get('type').value = S.noiseType;
  } else {
    // Fallback: buffer-based white noise
    const nBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nData.length; i++) nData[i] = Math.random() * 2 - 1;
    noiseNode = ctx.createBufferSource();
    noiseNode.buffer = nBuf;
    noiseNode.loop = true;
  }
  noiseGain = ctx.createGain();
  noiseGain.gain.value = S.noiseOn ? S.noiseVol : 0;
  noiseNode.connect(noiseGain);
  noiseGain.connect(vca); // noise goes through same chain as oscs

  // v6: UNISON — extra detuned copies of OSC1
  rebuildUnison();

  // Phaser (6 allpass) — Q set low when OFF to be transparent
  for (let i = 0; i < 6; i++) {
    const a = ctx.createBiquadFilter();
    a.type = 'allpass';
    a.frequency.value = 300 + i * 500;
    a.Q.value = S.phOn ? 6 : 0.1; // low Q = transparent when off
    pha.push(a);
  }
  for (let i = 0; i < 5; i++) pha[i].connect(pha[i + 1]);
  phl = ctx.createOscillator(); phl.frequency.value = S.phRate;
  phg = ctx.createGain(); phg.gain.value = S.phOn ? S.phDepth : 0;
  phl.connect(phg); pha.forEach(a => phg.connect(a.frequency));

  // Sub (clean, direct to mg)
  sub = ctx.createOscillator(); sub.type = 'sine';
  sub.frequency.value = m2h(S.activeNote - S.subOct * 12);
  subg = ctx.createGain(); subg.gain.value = 0;
  sub.connect(subg); subg.connect(mg);

  // VOWEL: 3 BPF in parallel
  vf1 = ctx.createBiquadFilter(); vf1.type = 'bandpass'; vf1.Q.value = 35;
  vf2 = ctx.createBiquadFilter(); vf2.type = 'bandpass'; vf2.Q.value = 30;
  vf3 = ctx.createBiquadFilter(); vf3.type = 'bandpass'; vf3.Q.value = 25;
  let vg1 = ctx.createGain(); vg1.gain.value = 1.4;
  let vg2 = ctx.createGain(); vg2.gain.value = 0.9;
  let vg3 = ctx.createGain(); vg3.gain.value = 0.5;
  vwet = ctx.createGain(); vwet.gain.value = S.vowelOn ? S.vowelMix : 0;
  vdry = ctx.createGain(); vdry.gain.value = S.vowelOn ? (1 - S.vowelMix * 0.85) : 1;
  vf1.connect(vg1); vg1.connect(vwet);
  vf2.connect(vg2); vg2.connect(vwet);
  vf3.connect(vg3); vg3.connect(vwet);
  applyVowel('O');

  // RING MOD
  rmc = ctx.createOscillator(); rmc.type = 'sine'; rmc.frequency.value = S.rmFreq;
  rmdepth = ctx.createGain(); rmdepth.gain.value = S.rmOn ? S.rmMix * .5 : 0;
  rmwet = ctx.createGain(); rmwet.gain.value = S.rmOn ? S.rmMix * .5 : 0;
  rmdry = ctx.createGain(); rmdry.gain.value = S.rmOn ? (1 - S.rmMix * .5) : 1;
  rmc.connect(rmdepth); rmdepth.connect(rmwet.gain);

  // COMB: delay + feedback, wet/dry
  cbd = ctx.createDelay(.05);
  cbd.delayTime.value = Math.min(.05, 1 / Math.max(S.combFreq, 1));
  cbf = ctx.createGain(); cbf.gain.value = S.combOn ? Math.min(.93, S.combFB) : 0;
  cbwet = ctx.createGain(); cbwet.gain.value = S.combOn ? S.rmMix * .4 : 0;
  cbdry = ctx.createGain(); cbdry.gain.value = 1;
  cbd.connect(cbf); cbf.connect(cbd);

  // STUTTER
  stl = ctx.createOscillator(); stl.type = 'square'; stl.frequency.value = S.stutterRate;
  stg = ctx.createGain(); stg.gain.value = S.stutterOn ? -S.stutterDepth * .35 : 0;
  stl.connect(stg); stg.connect(vca.gain);

  // v6: CHORUS — 2 modulated delay lines
  chDL = ctx.createDelay(0.05);
  chDR = ctx.createDelay(0.05);
  chDL.delayTime.value = 0.005; // 5ms base
  chDR.delayTime.value = 0.007; // 7ms base (offset for stereo)
  chLfo = ctx.createOscillator(); chLfo.type = 'sine';
  chLfo.frequency.value = S.chorusRate;
  chLfoG = ctx.createGain();
  chLfoG.gain.value = S.chorusDepth / 1000; // depth in ms → seconds
  chLfo.connect(chLfoG);
  chLfoG.connect(chDL.delayTime);
  chLfoG.connect(chDR.delayTime);
  chWet = ctx.createGain(); chWet.gain.value = S.chorusOn ? S.chorusMix : 0;

  // v6: DELAY — stereo ping-pong
  const dt = delayTime();
  dlL = ctx.createDelay(2.0); dlL.delayTime.value = dt;
  dlR = ctx.createDelay(2.0); dlR.delayTime.value = dt;
  dlFbL = ctx.createGain(); dlFbL.gain.value = S.delayOn ? S.delayFB : 0;
  dlFbR = ctx.createGain(); dlFbR.gain.value = S.delayOn ? S.delayFB : 0;
  dlFilt = ctx.createBiquadFilter(); dlFilt.type = 'lowpass';
  dlFilt.frequency.value = S.delayFilter;
  // Ping-pong: L→R→L feedback
  dlL.connect(dlFbL); dlFbL.connect(dlFilt); dlFilt.connect(dlR);
  dlR.connect(dlFbR); dlFbR.connect(dlL);
  dlWet = ctx.createGain(); dlWet.gain.value = S.delayOn ? S.delayMix : 0;

  // v6: REVERB — convolution with generated IR
  rvConv = ctx.createConvolver();
  rvConv.buffer = createReverbBuffer(ctx, S.reverbSize, S.reverbDamp);
  rvWet = ctx.createGain(); rvWet.gain.value = S.reverbOn ? S.reverbMix : 0;

  // ══════════════════════════════════════════════════════════════════════════
  // FIXED STATIC CHAIN
  // ══════════════════════════════════════════════════════════════════════════
  // osc1g + osc2g + noiseGain + uniGains → vca → dist → crush → filt
  //   → phaser → chorus split → delay split → reverb split → mg → lim → out
  // Vowel/ring/comb/stutter tap same as v5

  o1g.connect(vca); o2g.connect(vca);
  // unison oscs already connected to vca in rebuildUnison()

  vca.connect(dist); dist.connect(crush); crush.connect(filt);
  filt.connect(pha[0]);

  // vowel filters tap raw osc for max harmonics
  o1g.connect(vf1); o1g.connect(vf2); o1g.connect(vf3);

  // Post-phaser: collect all paths into a single mix bus before FX chain
  const mixBus = ctx.createGain(); mixBus.gain.value = 1;

  const phaOut = pha[5];

  // Dry/vowel paths → mixBus
  phaOut.connect(vdry);
  vdry.connect(mixBus); vwet.connect(mixBus);

  // Ring mod → mixBus
  phaOut.connect(rmdry); phaOut.connect(rmwet);
  rmdry.connect(mixBus); rmwet.connect(mixBus);

  // Comb → mixBus
  phaOut.connect(cbdry); phaOut.connect(cbd);
  cbdry.connect(mixBus); cbwet.connect(mixBus); cbd.connect(cbwet);

  // mixBus → chorus (send/return) → delay (send/return) → reverb (send/return) → mg
  // Each effect: signal passes through dry, wet is additive

  // Chorus: mixBus feeds delays, wet mixes in
  mixBus.connect(chDL); mixBus.connect(chDR);
  chDL.connect(chWet); chDR.connect(chWet);

  // Delay: mixBus feeds delay input, wet mixes in
  mixBus.connect(dlL);
  dlL.connect(dlWet); dlR.connect(dlWet);

  // Reverb: mixBus feeds convolver, wet mixes in
  mixBus.connect(rvConv);
  rvConv.connect(rvWet);

  // All to master: dry signal + effect returns
  mixBus.connect(mg);   // dry
  chWet.connect(mg);    // chorus return
  dlWet.connect(mg);    // delay return
  rvWet.connect(mg);    // reverb return

  // master chain
  mg.connect(lim); lim.connect(an); an.connect(ctx.destination);
  connectL2Static();

  const startNodes = [o1, o2, l1, l2, al, sub, phl, rmc, stl, chLfo];
  if (!workletsReady && noiseNode.start) startNodes.push(noiseNode);
  startNodes.forEach(n => n.start());
  if (workletsReady) {
    // AudioWorkletNode doesn't need .start()
  }
  // Start unison oscs
  uniOscs.forEach(o => o.start());

  startScope();
}

// v6: Unison — creates extra detuned copies of osc1
function rebuildUnison() {
  // Clean up old unison oscs
  uniOscs.forEach(o => { try { o.stop(); } catch (e) {} });
  uniOscs = []; uniGains = [];

  const voices = S.uniVoices;
  if (voices <= 1 || !ctx) return;

  const spread = S.uniSpread;
  const hz = m2h(S.activeNote);
  // Create pairs: -spread, +spread, -spread/2, +spread/2, etc.
  const count = voices - 1; // extra voices beyond the main osc
  for (let i = 0; i < count; i++) {
    const osc = ctx.createOscillator();
    osc.type = S.o1Wave;
    osc.frequency.value = hz;
    // Spread evenly: alternating +/- with decreasing offset
    const pair = Math.floor(i / 2) + 1;
    const sign = i % 2 === 0 ? 1 : -1;
    osc.detune.value = sign * (spread / (voices - 1)) * pair * 2;
    const g = ctx.createGain();
    g.gain.value = S.o1Vol / voices; // scale volume by voice count
    osc.connect(g);
    g.connect(vca);
    uniOscs.push(osc);
    uniGains.push(g);
  }
  // Scale main osc volume too
  if (o1g) o1g.gain.value = S.o1Vol / voices;
}

function applyVowel(v, t) {
  if (!vf1) return;
  const tc = .018, now = t || (ctx ? ctx.currentTime : 0);
  const [f1, f2, f3] = VF[v] || VF.O;
  vf1.frequency.setTargetAtTime(f1, now, tc);
  vf2.frequency.setTargetAtTime(f2, now, tc);
  vf3.frequency.setTargetAtTime(f3, now, tc);
}

function connectL2() {
  // Static connections made once in start(). This just switches gains.
  if (!l2pitch || !ctx) return;
  ramp(l2pitch.gain, S.lfo2Target === 'pitch' ? 1 : 0);
  ramp(l2fm.gain, S.lfo2Target === 'fm' ? 1 : 0);
  ramp(l2cut.gain, S.lfo2Target === 'cutoff2' ? 1 : 0);
}

function connectL2Static() {
  // Called once during start() to wire permanent connections
  l2pitch.connect(o1.frequency); l2pitch.connect(o2.frequency);
  if (fmg) l2fm.connect(fmg.gain);
  if (filt) l2cut.connect(filt.frequency);
}

function stop() {
  stopSeq();
  const stopNodes = [o1, o2, l1, l2, al, sub, phl, rmc, stl, chLfo];
  if (!workletsReady && noiseNode) stopNodes.push(noiseNode);
  stopNodes.forEach(n => { try { n && n.stop(); } catch (e) {} });
  uniOscs.forEach(o => { try { o.stop(); } catch (e) {} });
  uniOscs = []; uniGains = [];
  try { ctx && ctx.close(); } catch (e) {}
  ctx = an = mg = lim = dist = crush = filt = vca = l1 = l1g = l2 = l2g = al = alg = aldc =
    o1 = o2 = o1g = o2g = fmg = sub = subg = vf1 = vf2 = vf3 = vwet = vdry =
    rmc = rmdepth = rmwet = rmdry = cbd = cbf = cbwet = cbdry = stl = stg =
    l2pitch = l2fm = l2cut = noiseNode = noiseGain =
    chDL = chDR = chLfo = chLfoG = chWet =
    dlL = dlR = dlFbL = dlFbR = dlFilt = dlWet =
    rvConv = rvWet = null;
  pha = [];
  workletsReady = false;
  if (raf) cancelAnimationFrame(raf);
  drawIdle();
}

// Envelope trigger
function trig(noteNum, stepIdx, vel) {
  if (!ctx || !vca) return;
  vel = vel !== undefined ? vel : 1;
  const hz = m2h(noteNum), t = ctx.currentTime;
  const A = S.attack, D = S.decay, SU = S.sustain, R = S.release, nd = sdur() * .85;

  // Glide or snap
  const freqTargets = [o1.frequency, o2.frequency];
  // Include unison osc frequencies
  uniOscs.forEach(o => freqTargets.push(o.frequency));

  if (S.glide > .001) {
    const gt = S.glide / 1000;
    freqTargets.forEach(p => {
      p.cancelScheduledValues(t); p.setValueAtTime(p.value, t);
      p.exponentialRampToValueAtTime(Math.max(hz, .1), t + gt);
    });
  } else {
    freqTargets.forEach(p => p.setTargetAtTime(hz, t, .003));
  }

  if (sub) sub.frequency.setTargetAtTime(m2h(noteNum - S.subOct * 12), t, .003);
  if (fmg && S.fmOn) fmg.gain.setTargetAtTime(S.fmDepth * hz / 440, t, .003);

  if (S.pbend > 0) {
    const bHz = hz * Math.pow(2, S.pbend / 12) - hz;
    o1.frequency.setValueAtTime(hz + bHz, t);
    o1.frequency.exponentialRampToValueAtTime(Math.max(hz, .1), t + S.pdecay);
  }

  // VCA ADSR (velocity-scaled)
  vca.gain.cancelScheduledValues(t);
  vca.gain.setValueAtTime(0, t);
  vca.gain.linearRampToValueAtTime(vel, t + A);
  vca.gain.linearRampToValueAtTime(SU * vel, t + A + D);
  vca.gain.setValueAtTime(SU * vel, t + nd);
  vca.gain.linearRampToValueAtTime(0, t + nd + R);

  // Sub ADSR (velocity-scaled)
  if (subg && S.subOn) {
    const sv = S.subVol * vel;
    subg.gain.cancelScheduledValues(t);
    subg.gain.setValueAtTime(0, t);
    subg.gain.linearRampToValueAtTime(sv, t + A * .4);
    subg.gain.linearRampToValueAtTime(sv * SU, t + A * .4 + D * .7);
    subg.gain.setValueAtTime(sv * SU, t + nd);
    subg.gain.linearRampToValueAtTime(0, t + nd + R * 1.1);
  }

  // v6: Filter envelope
  if (S.fenvOn && filt) {
    const base = S.cutoff;
    const peak = Math.max(20, Math.min(18000, base + S.fenvAmount));
    filt.frequency.cancelScheduledValues(t);
    filt.frequency.setValueAtTime(base, t);
    filt.frequency.linearRampToValueAtTime(peak, t + S.fenvAttack);
    filt.frequency.linearRampToValueAtTime(
      base + (peak - base) * S.fenvSustain, t + S.fenvAttack + S.fenvDecay);
    filt.frequency.setValueAtTime(
      base + (peak - base) * S.fenvSustain, t + nd);
    filt.frequency.linearRampToValueAtTime(base, t + nd + S.fenvRelease);
  }

  // Vowel per step
  if (S.vowelOn && stepIdx >= 0) applyVowel(S.seqVowels[stepIdx] || 'O', t);
}

// Live parameter update — cancel → anchor → smooth ramp (eliminates pops)
function ramp(p, v) {
  if (!p) return;
  const t = ctx.currentTime;
  p.cancelScheduledValues(t);
  p.setValueAtTime(p.value, t);
  p.setTargetAtTime(v, t + 0.001, 0.03);
}

function P(k, v) {
  if (!ctx) return;
  switch (k) {
    case 'cutoff':
      if (filt) { ramp(filt.frequency, Math.max(20, Math.min(18000, v))); if (l1g) ramp(l1g.gain, sld()); updFViz(); } break;
    case 'reso':
      if (filt) { ramp(filt.Q, Math.max(.001, Math.min(30, v))); updFViz(); } break;
    case 'filterType':
      if (filt) {
        // Duck filter Q briefly to soften the type switch
        const t = ctx.currentTime;
        filt.Q.cancelScheduledValues(t);
        filt.Q.setValueAtTime(filt.Q.value, t);
        filt.Q.linearRampToValueAtTime(0.001, t + 0.008);
        setTimeout(() => {
          if (filt) {
            filt.type = v;
            const t2 = ctx.currentTime;
            filt.Q.cancelScheduledValues(t2);
            filt.Q.setValueAtTime(0.001, t2);
            filt.Q.linearRampToValueAtTime(S.reso, t2 + 0.008);
          }
        }, 10);
        updFViz();
      } break;
    case 'lfo1Rate':
      if (l1) { ramp(l1.frequency, Math.max(.01, er1())); updSync(); } break;
    case 'lfo1Depth':
      if (l1g) ramp(l1g.gain, sld()); break;
    case 'lfo1Shape':
      if (l1) { ramp(l1g.gain, 0); setTimeout(() => { if (l1) { l1.type = v; ramp(l1g.gain, sld()); } }, 15); } break;
    case 'lfo1Sync': case 'lfo1Div':
      if (l1) { ramp(l1.frequency, Math.max(.01, er1())); updSync(); } break;
    case 'lfo2Rate':
      if (l2) ramp(l2.frequency, Math.max(.01, v)); break;
    case 'lfo2Depth':
      if (l2g) ramp(l2g.gain, v); break;
    case 'lfo2Shape':
      if (l2) { ramp(l2g.gain, 0); setTimeout(() => { if (l2) { l2.type = v; ramp(l2g.gain, S.lfo2Depth); } }, 15); } break;
    case 'lfo2Target':
      connectL2(); break;
    case 'vol':
      if (mg) ramp(mg.gain, v); break;
    case 'distAmt':
      if (dist) {
        // Crossfade: briefly duck gain, swap curve, restore — avoids pop
        const t = ctx.currentTime;
        mg.gain.cancelScheduledValues(t);
        mg.gain.setValueAtTime(mg.gain.value, t);
        mg.gain.linearRampToValueAtTime(0.001, t + 0.01);
        setTimeout(() => {
          if (dist) dist.curve = dCurve(v);
          if (mg && ctx) {
            const t2 = ctx.currentTime;
            mg.gain.cancelScheduledValues(t2);
            mg.gain.setValueAtTime(0.001, t2);
            mg.gain.linearRampToValueAtTime(S.vol, t2 + 0.01);
          }
        }, 12);
      } break;
    case 'o1Wave':
      if (o1) o1.type = v;
      uniOscs.forEach(o => o.type = v);
      break;
    case 'o2Wave':
      if (o2) o2.type = v; break;
    case 'detune':
      if (o2) ramp(o2.detune, v); break;
    case 'o1Vol':
      if (o1g) {
        const vv = S.uniVoices > 1 ? v / S.uniVoices : v;
        ramp(o1g.gain, vv);
        uniGains.forEach(g => ramp(g.gain, vv));
      } break;
    case 'fmOn':
      if (fmg) { ramp(fmg.gain, v ? S.fmDepth * m2h(S.activeNote) / 440 : 0); }
      led('l-fm', v, 'b'); break;
    case 'fmDepth':
      if (fmg && S.fmOn) ramp(fmg.gain, v * m2h(S.activeNote) / 440); break;
    case 'phOn':
      if (phg) ramp(phg.gain, v ? S.phDepth : 0);
      // Ramp allpass Q: resonant when on, transparent when off
      pha.forEach(a => ramp(a.Q, v ? 6 : 0.1));
      led('l-ph', v, 'p'); break;
    case 'phRate':
      if (phl) ramp(phl.frequency, Math.max(.01, v)); break;
    case 'phDepth':
      if (phg) ramp(phg.gain, S.phOn ? v : 0); break;
    case 'subOn':
      // Ramp sub gain so toggling during sustain has immediate effect
      if (subg) ramp(subg.gain, v ? S.subVol * S.sustain : 0);
      led('l-sub', v, 'b'); break;
    case 'alfoOn':
      if (alg) ramp(alg.gain, v ? S.alfoDepth : 0); break;
    case 'alfoRate':
      if (al) ramp(al.frequency, Math.max(.01, v)); break;
    case 'alfoDepth':
      if (alg && S.alfoOn) ramp(alg.gain, v); break;
    case 'bcOn':
      if (workletsReady && crush) {
        crush.parameters.get('bits').value = v ? S.bits : 16;
        crush.parameters.get('rateReduction').value = v ? S.bcRate : 1;
      } else if (crush) {
        crush.curve = v ? bCurve(S.bits) : LINEAR_CURVE;
      }
      led('l-bc', v, 'o'); break;
    case 'bits':
      if (S.bcOn) {
        if (workletsReady && crush) {
          crush.parameters.get('bits').value = v;
        } else if (crush) {
          // Smooth curve transition — the curves are close enough that
          // swapping between adjacent bit depths doesn't pop audibly,
          // but we do it safely with the identity curve approach
          crush.curve = bCurve(v);
        }
      } break;
    case 'bcRate':
      if (S.bcOn && workletsReady && crush) crush.parameters.get('rateReduction').value = v;
      break;
    case 'vowelOn':
      if (vwet) {
        ramp(vwet.gain, v ? S.vowelMix : 0);
        // Crossfade dry: at mix=1 dry is quiet (0.15), at mix=0 dry is full (1)
        ramp(vdry.gain, v ? (1 - S.vowelMix * 0.85) : 1);
      }
      led('l-vow', v, 'p'); break;
    case 'vowelMix':
      if (vwet && S.vowelOn) {
        ramp(vwet.gain, v);
        ramp(vdry.gain, 1 - v * 0.85); // mix=0 → dry=1, mix=1 → dry=0.15
      } break;
    case 'rmOn':
      if (rmdepth && rmwet && rmdry) {
        ramp(rmdepth.gain, v ? S.rmMix * .5 : 0);
        ramp(rmwet.gain, v ? S.rmMix * .5 : 0);
        ramp(rmdry.gain, v ? (1 - S.rmMix * .5) : 1);
      } led('l-rm', v, 'pk'); break;
    case 'rmFreq':
      if (rmc) ramp(rmc.frequency, Math.max(1, v)); break;
    case 'rmMix':
      if (rmwet && S.rmOn) {
        ramp(rmwet.gain, v * .5); ramp(rmdry.gain, 1 - v * .5); ramp(rmdepth.gain, v * .5);
      } break;
    case 'combOn':
      if (cbf && cbwet && cbdry) {
        ramp(cbf.gain, v ? Math.min(.93, S.combFB) : 0);
        ramp(cbwet.gain, v ? S.rmMix * .4 : 0);
      } led('l-comb', v, 'g'); break;
    case 'combFreq':
      if (cbd) ramp(cbd.delayTime, Math.min(.05, 1 / Math.max(v, 1))); break;
    case 'combFB':
      if (cbf) ramp(cbf.gain, S.combOn ? Math.min(.93, v) : 0); break;
    case 'stutterOn':
      if (stg) ramp(stg.gain, v ? -S.stutterDepth * .35 : 0);
      led('l-stut', v, 'o'); break;
    case 'stutterRate':
      if (stl) ramp(stl.frequency, Math.max(.5, v)); break;
    case 'stutterDepth':
      if (stg && S.stutterOn) ramp(stg.gain, -v * .35); break;
    case 'bpm':
      if (S.seqRunning) { stopSeq(); S.seqRunning = true; runSeq(); }
      // Update delay time if synced
      if (dlL && S.delaySync !== 'free') {
        const dt = delayTime();
        ramp(dlL.delayTime, dt); ramp(dlR.delayTime, dt);
      }
      break;
    // v6: Noise
    case 'noiseOn':
      if (noiseGain) ramp(noiseGain.gain, v ? S.noiseVol : 0);
      led('l-noise', v, 'b'); break;
    case 'noiseVol':
      if (noiseGain && S.noiseOn) ramp(noiseGain.gain, v); break;
    case 'noiseType':
      if (workletsReady && noiseNode) noiseNode.parameters.get('type').value = v;
      break;
    // v6: Unison (requires restart to rebuild graph — handled via UI)
    case 'uniVoices': case 'uniSpread':
      break;
    // v6: Filter envelope (applied during trig, nothing to do live)
    case 'fenvOn':
      led('l-fenv', v, 'y'); break;
    // v6: Chorus
    case 'chorusOn':
      if (chWet) ramp(chWet.gain, v ? S.chorusMix : 0);
      led('l-chorus', v, 'b'); break;
    case 'chorusRate':
      if (chLfo) ramp(chLfo.frequency, Math.max(.01, v)); break;
    case 'chorusDepth':
      if (chLfoG) ramp(chLfoG.gain, v / 1000); break;
    case 'chorusMix':
      if (chWet && S.chorusOn) ramp(chWet.gain, v); break;
    // v6: Delay
    case 'delayOn':
      if (dlWet && dlFbL && dlFbR) {
        ramp(dlWet.gain, v ? S.delayMix : 0);
        ramp(dlFbL.gain, v ? S.delayFB : 0);
        ramp(dlFbR.gain, v ? S.delayFB : 0);
      }
      led('l-delay', v, 'b'); break;
    case 'delaySync': case 'delayFree':
      if (dlL) { const dt = delayTime(); ramp(dlL.delayTime, dt); ramp(dlR.delayTime, dt); }
      break;
    case 'delayFB':
      if (S.delayOn && dlFbL) { ramp(dlFbL.gain, v); ramp(dlFbR.gain, v); } break;
    case 'delayMix':
      if (S.delayOn && dlWet) ramp(dlWet.gain, v); break;
    case 'delayFilter':
      if (dlFilt) ramp(dlFilt.frequency, v); break;
    // v6: Reverb
    case 'reverbOn':
      if (rvWet) ramp(rvWet.gain, v ? S.reverbMix : 0);
      led('l-reverb', v, 'p'); break;
    case 'reverbMix':
      if (rvWet && S.reverbOn) ramp(rvWet.gain, v); break;
    case 'reverbSize': case 'reverbDamp':
      if (rvConv && rvWet) {
        // Duck reverb wet, swap buffer, restore — avoids pop
        const t = ctx.currentTime;
        rvWet.gain.cancelScheduledValues(t);
        rvWet.gain.setValueAtTime(rvWet.gain.value, t);
        rvWet.gain.linearRampToValueAtTime(0, t + 0.015);
        setTimeout(() => {
          if (rvConv && ctx) {
            rvConv.buffer = createReverbBuffer(ctx, S.reverbSize, S.reverbDamp);
            if (rvWet && S.reverbOn) {
              const t2 = ctx.currentTime;
              rvWet.gain.cancelScheduledValues(t2);
              rvWet.gain.setValueAtTime(0, t2);
              rvWet.gain.linearRampToValueAtTime(S.reverbMix, t2 + 0.015);
            }
          }
        }, 18);
      }
      break;
  }
}
