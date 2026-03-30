// ============================================================================
// WUBSTATION 9000 v6 — WEB MIDI
// ============================================================================
'use strict';

let midiAccess = null;
let midiLearnTarget = null; // knob key being learned
let midiMap = {}; // { "ch:cc": "paramKey", ... }

// Load MIDI mappings from localStorage
try {
  const saved = localStorage.getItem('wubstation-midi-map');
  if (saved) midiMap = JSON.parse(saved);
} catch (e) {}

function saveMidiMap() {
  try { localStorage.setItem('wubstation-midi-map', JSON.stringify(midiMap)); } catch (e) {}
}

async function initMidi() {
  if (!navigator.requestMIDIAccess) {
    console.warn('Web MIDI not available');
    return;
  }
  try {
    midiAccess = await navigator.requestMIDIAccess();
    midiAccess.inputs.forEach(input => {
      input.onmidimessage = handleMidiMessage;
    });
    // Listen for new devices
    midiAccess.onstatechange = () => {
      midiAccess.inputs.forEach(input => {
        input.onmidimessage = handleMidiMessage;
      });
    };
    led('l-midi', true, 'b');
    console.log('MIDI initialized');
  } catch (e) {
    console.warn('MIDI access denied:', e);
  }
}

function handleMidiMessage(msg) {
  const [status, data1, data2] = msg.data;
  const ch = status & 0x0F;
  const type = status & 0xF0;

  if (type === 0x90 && data2 > 0) {
    // Note On
    if (!S.playing) return;
    const vel = data2 / 127;
    S.activeNote = data1;
    trig(data1, -1, vel);
    updNB();
  } else if (type === 0x80 || (type === 0x90 && data2 === 0)) {
    // Note Off — handled by envelope release
  } else if (type === 0xB0) {
    // CC
    const key = `${ch}:${data1}`;

    // MIDI learn mode
    if (midiLearnTarget) {
      midiMap[key] = midiLearnTarget;
      saveMidiMap();
      midiLearnTarget = null;
      document.getElementById('midi-learn').textContent = 'MIDI LEARN';
      st(document.getElementById('midi-learn'), false, '#44aaff');
      return;
    }

    // Apply mapped CC
    const param = midiMap[key];
    if (param && KS[param]) {
      // Map CC 0-127 to param range
      const knobDef = KS[param];
      if (knobDef) {
        // Find the knob config from the knob definitions
        const ratio = data2 / 127;
        // We need min/max from the knob — stored on the knob widget
        applyMidiCC(param, ratio);
      }
    }
  }
}

// Map 0-1 ratio to parameter range
function applyMidiCC(key, ratio) {
  // Find knob definition
  const knobConfigs = {
    bpm: [60, 200], vol: [0, 1], cutoff: [80, 8000], reso: [0.1, 30],
    lfo1Rate: [0.1, 24], lfo1Depth: [0, 6000], lfo2Rate: [0.1, 20], lfo2Depth: [0, 1000],
    distAmt: [0, 200], bits: [2, 16], fmDepth: [0, 2000], fmRatio: [0.5, 12],
    phRate: [0.05, 8], phDepth: [0, 3000], alfoRate: [0.25, 8], alfoDepth: [0, 0.9],
    subVol: [0, 1], o1Vol: [0, 1], detune: [-50, 50], glide: [0, 400],
    vowelMix: [0, 1], rmFreq: [20, 2000], rmMix: [0, 1],
    combFreq: [40, 1200], combFB: [0, 0.93], stutterRate: [2, 100], stutterDepth: [0, 1],
    noiseVol: [0, 1], chorusRate: [0.1, 10], chorusDepth: [0, 20], chorusMix: [0, 1],
    delayFB: [0, 0.9], delayMix: [0, 1], delayFree: [50, 1000], delayFilter: [200, 8000],
    reverbSize: [0.1, 5], reverbDamp: [0, 1], reverbMix: [0, 1],
    swing: [0, 75], attack: [0.001, 1], decay: [0.01, 2], sustain: [0, 1], release: [0.01, 2],
    fenvAmount: [-8000, 8000],
  };

  const range = knobConfigs[key];
  if (!range) return;

  const [min, max] = range;
  const val = min + ratio * (max - min);
  S[key] = val;
  if (KS[key]) KS[key].draw();
  P(key, val);
}

function enterMidiLearn(paramKey) {
  midiLearnTarget = paramKey;
  document.getElementById('midi-learn').textContent = 'LEARNING: ' + paramKey;
  st(document.getElementById('midi-learn'), true, '#44aaff');
}

function clearMidiMap() {
  midiMap = {};
  saveMidiMap();
}

// Auto-init MIDI on load
initMidi();
