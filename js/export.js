// ============================================================================
// WUBSTATION 9000 v6 — AUDIO EXPORT
// ============================================================================
'use strict';

// Render sequencer output to WAV via OfflineAudioContext
async function exportWav(bars) {
  bars = bars || 4;
  if (!S.playing) { alert('Engage the WUB first!'); return; }

  const sr = 44100;
  const stepsPerBar = S.seqLen;
  const totalSteps = stepsPerBar * bars;
  const stepDur = (60 / S.bpm) * SSB[S.stepSize];
  const duration = totalSteps * stepDur;
  const numSamples = Math.ceil(sr * duration);

  const offCtx = new OfflineAudioContext(2, numSamples, sr);

  // Recreate the audio graph in offline context
  // For simplicity, schedule all note triggers upfront
  const oLim = offCtx.createDynamicsCompressor();
  oLim.threshold.value = -2; oLim.knee.value = 2; oLim.ratio.value = 20;
  oLim.attack.value = .001; oLim.release.value = .04;

  const oMg = offCtx.createGain(); oMg.gain.value = S.vol;
  const oDist = offCtx.createWaveShaper(); oDist.curve = dCurve(S.distAmt); oDist.oversample = '4x';
  const oCrush = offCtx.createWaveShaper(); oCrush.curve = S.bcOn ? bCurve(S.bits) : null;
  const oFilt = offCtx.createBiquadFilter(); oFilt.type = S.filterType;
  oFilt.frequency.value = S.cutoff; oFilt.Q.value = S.reso;
  const oVca = offCtx.createGain(); oVca.gain.value = 0;

  // LFO1
  const oL1 = offCtx.createOscillator(); oL1.type = S.lfo1Shape; oL1.frequency.value = er1();
  const oL1g = offCtx.createGain(); oL1g.gain.value = sld();
  oL1.connect(oL1g); oL1g.connect(oFilt.frequency);

  // OSC1 + OSC2
  const oO1 = offCtx.createOscillator(); oO1.type = S.o1Wave; oO1.frequency.value = m2h(S.activeNote);
  const oO1g = offCtx.createGain(); oO1g.gain.value = S.o1Vol;
  oO1.connect(oO1g); oO1g.connect(oVca);

  const oO2 = offCtx.createOscillator(); oO2.type = S.o2Wave; oO2.frequency.value = m2h(S.activeNote);
  oO2.detune.value = S.detune;
  const oO2g = offCtx.createGain(); oO2g.gain.value = 0;
  oO2.connect(oO2g); oO2g.connect(oVca);

  if (S.fmOn) {
    const oFmg = offCtx.createGain();
    oFmg.gain.value = S.fmDepth * m2h(S.activeNote) / 440;
    oO2.connect(oFmg); oFmg.connect(oO1.frequency);
  }

  // Sub
  const oSub = offCtx.createOscillator(); oSub.type = 'sine';
  oSub.frequency.value = m2h(S.activeNote - S.subOct * 12);
  const oSubg = offCtx.createGain(); oSubg.gain.value = 0;
  oSub.connect(oSubg); oSubg.connect(oMg);

  // Chain
  oVca.connect(oDist); oDist.connect(oCrush); oCrush.connect(oFilt);
  oFilt.connect(oMg); oMg.connect(oLim); oLim.connect(offCtx.destination);

  // Schedule triggers
  for (let i = 0; i < totalSteps; i++) {
    const step = i % S.seqLen;
    if (!S.seqPat[step]) continue;

    const prob = S.seqProb[step];
    if (prob < 100 && Math.random() * 100 > prob) continue;

    const t = i * stepDur;
    const hz = m2h(S.seqNotes[step]);
    const vel = S.seqVel[step] / 127;
    const nd = stepDur * .85;
    const A = S.attack, D = S.decay, SU = S.sustain, R = S.release;

    oO1.frequency.setTargetAtTime(hz, t, .003);
    oO2.frequency.setTargetAtTime(hz, t, .003);

    oVca.gain.setValueAtTime(0, t);
    oVca.gain.linearRampToValueAtTime(vel, t + A);
    oVca.gain.linearRampToValueAtTime(SU * vel, t + A + D);
    oVca.gain.setValueAtTime(SU * vel, t + nd);
    oVca.gain.linearRampToValueAtTime(0, t + nd + R);

    if (S.subOn) {
      oSub.frequency.setTargetAtTime(m2h(S.seqNotes[step] - S.subOct * 12), t, .003);
      oSubg.gain.setValueAtTime(0, t);
      oSubg.gain.linearRampToValueAtTime(S.subVol * vel, t + A * .4);
      oSubg.gain.linearRampToValueAtTime(S.subVol * SU * vel, t + A * .4 + D * .7);
      oSubg.gain.setValueAtTime(S.subVol * SU * vel, t + nd);
      oSubg.gain.linearRampToValueAtTime(0, t + nd + R * 1.1);
    }
  }

  // Start all
  [oO1, oO2, oL1, oSub].forEach(n => n.start(0));

  // Render
  const btn = document.getElementById('export-wav');
  if (btn) { btn.textContent = 'RENDERING...'; btn.disabled = true; }

  const rendered = await offCtx.startRendering();

  // Convert to WAV
  const wav = audioBufferToWav(rendered);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (S.activePreset || 'custom').replace(/\s+/g, '-').toLowerCase();
  a.href = url;
  a.download = `wubstation-${name}-${S.bpm}bpm-${bars}bar.wav`;
  a.click();
  URL.revokeObjectURL(url);

  if (btn) { btn.textContent = 'EXPORT WAV'; btn.disabled = false; }
}

// Convert AudioBuffer to WAV ArrayBuffer
function audioBufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const len = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numCh * bytesPerSample;
  const dataSize = len * blockAlign;
  const headerSize = 44;
  const buf = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buf);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, headerSize + dataSize - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels and convert to int16
  const channels = [];
  for (let ch = 0; ch < numCh; ch++) channels.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < len; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      let sample = channels[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  return buf;
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
