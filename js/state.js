// ============================================================================
// WUBSTATION 9000 v6 — STATE & CONSTANTS
// ============================================================================
'use strict';

const AC = window.AudioContext || window.webkitAudioContext;

function m2h(n) { return 440 * Math.pow(2, (n - 69) / 12); }

function dCurve(a) {
  const n = 512, c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    c[i] = ((3 + a) * x * 20 * (Math.PI / 180)) / (Math.PI + a * Math.abs(x));
  }
  return c;
}

// Linear identity curve for WaveShaper bypass (avoids null → curve pop)
const LINEAR_CURVE = (() => {
  const n = 8192, c = new Float32Array(n);
  for (let i = 0; i < n; i++) c[i] = (i * 2) / (n - 1) - 1;
  return c;
})();

function bCurve(bits) {
  const n = 8192, c = new Float32Array(n),
    st = Math.pow(2, Math.max(1, Math.round(bits)) - 1);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1;
    c[i] = Math.round(x * st) / st;
  }
  return c;
}

// Acoustic vowel formant frequencies (Hz) based on vocal tract resonance research
// [F1, F2, F3, F4, F5] — F1=jaw height, F2=tongue position, F3=lip rounding, F4/F5=presence/air
const VF = {
  A:  [700,  1220, 2600, 3300, 3750],
  E:  [360,  2400, 3000, 3500, 4000],
  I:  [270,  2290, 3010, 3600, 4100],
  O:  [570,   840, 2410, 3200, 3650],
  U:  [300,   870, 2240, 3200, 3500],
  AH: [750,  1100, 2500, 3300, 3700],
  EH: [530,  1840, 2480, 3350, 3900],
  OO: [310,   870, 2250, 3150, 3500],
  UH: [640,  1190, 2390, 3250, 3700],
};

const VC = {
  A: '#ff8800', E: '#ffcc00', I: '#00ff88', O: '#00ccff', U: '#cc44ff',
  AH: '#ff4444', EH: '#ff66aa', OO: '#4488ff', UH: '#88ff44',
};
const GL = { sine: '\u223F', square: '\u2293', sawtooth: '\u27CB', triangle: '\u2227' };
const NM = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function nn(m) { return NM[m % 12] + (Math.floor(m / 12) - 1); }

// Central state object
const S = {
  playing: false, seqRunning: false, bpm: 140, stepSize: '1/16',
  o1Wave: 'sawtooth', o2Wave: 'square', o1Vol: .75, detune: -7,
  fmOn: false, fmDepth: 200, fmRatio: 3, pbend: 0, pdecay: .1,
  subOn: true, subVol: .7, subOct: 1,
  attack: .004, decay: .12, sustain: .6, release: .18,
  filterType: 'lowpass', cutoff: 800, reso: 8,
  lfo1Rate: 4, lfo1Depth: 600, lfo1Shape: 'sine', lfo1Sync: false, lfo1Div: '1/4',
  lfo2Rate: 2, lfo2Depth: 100, lfo2Shape: 'sine', lfo2Target: 'pitch',
  bcOn: false, bits: 14, bcRate: 1,
  phOn: false, phRate: .4, phDepth: 400,
  alfoOn: false, alfoRate: 2.33, alfoDepth: .4,
  distAmt: 40, vol: .65,
  vowelOn: false, vowelMix: 1.0, seqVowels: Array(64).fill('O'),
  rmOn: false, rmFreq: 200, rmMix: .4,
  combOn: false, combFreq: 100, combFB: .7,
  stutterOn: false, stutterRate: 32, stutterDepth: .6,
  glide: 0,
  // v6: noise
  noiseOn: false, noiseType: 0, noiseVol: 0,
  // v6: unison
  uniVoices: 1, uniSpread: 0,
  // v6: filter envelope
  fenvAttack: .01, fenvDecay: .3, fenvSustain: .2, fenvRelease: .2, fenvAmount: 2000,
  fenvOn: false,
  // v6: chorus
  chorusOn: false, chorusRate: 1.5, chorusDepth: 5, chorusMix: 0,
  // v6: delay
  delayOn: false, delaySync: '1/8', delayFree: 250, delayFB: .3, delayMix: 0, delayFilter: 3000,
  // v6: reverb
  reverbOn: false, reverbSize: 1.5, reverbDamp: .5, reverbMix: 0,

  // Sequencer
  seqLen: 16,
  seqPat: Array(64).fill(false), seqNotes: Array(64).fill(36),
  seqVel: Array(64).fill(100), seqProb: Array(64).fill(100),
  seqLocks: Array(64).fill(null), // per-step param overrides
  seqStep: -1, selStep: -1, selVStep: -1,
  swing: 0,
  curPattern: 0, // 0-7 = A-H
  lockMode: false,
  activeNote: 36, activePreset: 'WUM WUM WUM',
};
// 8 pattern banks (A-H)
const PATTERNS = Array.from({ length: 8 }, () => ({
  pat: Array(64).fill(false),
  notes: Array(64).fill(36),
  vel: Array(64).fill(100),
  prob: Array(64).fill(100),
  vowels: Array(64).fill('O'),
  locks: Array(64).fill(null),
  len: 16,
}));
// Init pattern A with default
PATTERNS[0].pat = [true, false, false, false, true, false, false, false,
                   true, false, false, false, true, false, false, false,
                   ...Array(48).fill(false)];
S.seqPat = PATTERNS[0].pat;
S.seqNotes = PATTERNS[0].notes;
S.seqVel = PATTERNS[0].vel;
S.seqProb = PATTERNS[0].prob;
S.seqVowels = PATTERNS[0].vowels;
S.seqLocks = PATTERNS[0].locks;

// Undo system
const UNDO_STACK = [];
const REDO_STACK = [];
const UNDO_MAX = 50;
function pushUndo() {
  const snap = JSON.parse(JSON.stringify({
    seqPat: S.seqPat.slice(), seqNotes: S.seqNotes.slice(),
    seqVel: S.seqVel.slice(), seqProb: S.seqProb.slice(),
    seqVowels: S.seqVowels.slice(), seqLocks: S.seqLocks.slice(),
    seqLen: S.seqLen, activeNote: S.activeNote,
  }));
  UNDO_STACK.push(snap);
  if (UNDO_STACK.length > UNDO_MAX) UNDO_STACK.shift();
  REDO_STACK.length = 0;
}
function doUndo() {
  if (!UNDO_STACK.length) return;
  const cur = JSON.parse(JSON.stringify({
    seqPat: S.seqPat.slice(), seqNotes: S.seqNotes.slice(),
    seqVel: S.seqVel.slice(), seqProb: S.seqProb.slice(),
    seqVowels: S.seqVowels.slice(), seqLocks: S.seqLocks.slice(),
    seqLen: S.seqLen, activeNote: S.activeNote,
  }));
  REDO_STACK.push(cur);
  const snap = UNDO_STACK.pop();
  Object.assign(S, snap);
}
function doRedo() {
  if (!REDO_STACK.length) return;
  const cur = JSON.parse(JSON.stringify({
    seqPat: S.seqPat.slice(), seqNotes: S.seqNotes.slice(),
    seqVel: S.seqVel.slice(), seqProb: S.seqProb.slice(),
    seqVowels: S.seqVowels.slice(), seqLocks: S.seqLocks.slice(),
    seqLen: S.seqLen, activeNote: S.activeNote,
  }));
  UNDO_STACK.push(cur);
  const snap = REDO_STACK.pop();
  Object.assign(S, snap);
}

const DIV = { '1/1': .25, '1/2': .5, '1/4': 1, '1/8': 2, '1/16': 4, '1/32': 8 };
const SSB = { '1/4': 1, '1/8': .5, '1/16': .25 };

function sdur() { return (60 / S.bpm) * SSB[S.stepSize]; }
function er1() { return S.lfo1Sync ? (S.bpm / 60) * DIV[S.lfo1Div] : S.lfo1Rate; }
function sld() { return Math.min(S.lfo1Depth, Math.max(0, S.cutoff - 20)); }

// Delay time from sync division
function delayTime() {
  if (S.delaySync === 'free') return S.delayFree / 1000;
  const beat = 60 / S.bpm;
  const divs = { '1/4': 1, '1/8': 0.5, '1/8d': 0.75, '1/16': 0.25 };
  return beat * (divs[S.delaySync] || 0.5);
}

const TC = .015;
