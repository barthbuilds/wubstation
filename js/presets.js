// ============================================================================
// WUBSTATION 9000 v6 — PRESETS
// ============================================================================
'use strict';

const PC = {
  'WUM WUM WUM': '#00ff88', 'CLASSIC WUB': '#00ccff', 'SKRILLEX': '#ff44cc',
  'DOCTOR P YOY': '#ff8800', 'EXCISION': '#ff4400', 'RIDDIM': '#ffcc00',
  'TALKING BASS': '#cc44ff', 'RAPTOR HELL': '#ff0044'
};

const PS = {
  'WUM WUM WUM': {
    o1Wave:'sawtooth',o2Wave:'square',o1Vol:.75,detune:-5,fmOn:false,fmDepth:100,fmRatio:2,
    pbend:0,pdecay:.1,subOn:true,subVol:.75,subOct:1,attack:.003,decay:.1,sustain:.6,release:.15,
    filterType:'lowpass',cutoff:700,reso:8,lfo1Rate:4,lfo1Depth:500,lfo1Shape:'sine',
    lfo1Sync:false,lfo1Div:'1/4',lfo2Rate:2,lfo2Depth:0,lfo2Shape:'sine',lfo2Target:'pitch',
    bcOn:false,bits:14,phOn:false,phRate:.4,phDepth:800,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:30,vol:.7,bpm:140,vowelOn:false,vowelMix:1.0,
    seqVowels:Array(16).fill('O'),rmOn:false,rmFreq:200,rmMix:.4,combOn:false,combFreq:100,
    combFB:.7,stutterOn:false,stutterRate:32,stutterDepth:.6,glide:0,
    seqPat:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'CLASSIC WUB': {
    o1Wave:'sawtooth',o2Wave:'square',o1Vol:.75,detune:-7,fmOn:false,fmDepth:200,fmRatio:3,
    pbend:0,pdecay:.1,subOn:true,subVol:.6,subOct:1,attack:.004,decay:.15,sustain:.55,release:.2,
    filterType:'lowpass',cutoff:900,reso:9,lfo1Rate:4,lfo1Depth:650,lfo1Shape:'sine',
    lfo1Sync:false,lfo1Div:'1/4',lfo2Rate:2,lfo2Depth:0,lfo2Shape:'sine',lfo2Target:'pitch',
    bcOn:false,bits:14,phOn:false,phRate:.4,phDepth:800,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:35,vol:.65,bpm:140,vowelOn:false,vowelMix:1.0,
    seqVowels:Array(16).fill('O'),rmOn:false,rmFreq:200,rmMix:.4,combOn:false,combFreq:100,
    combFB:.7,stutterOn:false,stutterRate:32,stutterDepth:.6,glide:0,
    seqPat:[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'SKRILLEX': {
    o1Wave:'sawtooth',o2Wave:'sawtooth',o1Vol:.85,detune:-5,fmOn:true,fmDepth:380,fmRatio:5,
    pbend:7,pdecay:.06,subOn:true,subVol:.6,subOct:1,attack:.001,decay:.08,sustain:.5,release:.1,
    filterType:'bandpass',cutoff:950,reso:18,lfo1Rate:7,lfo1Depth:800,lfo1Shape:'square',
    lfo1Sync:false,lfo1Div:'1/8',lfo2Rate:3.5,lfo2Depth:280,lfo2Shape:'sine',lfo2Target:'fm',
    bcOn:false,bits:12,phOn:true,phRate:.8,phDepth:500,alfoOn:true,alfoRate:4,alfoDepth:.35,
    distAmt:95,vol:.6,bpm:140,vowelOn:false,vowelMix:1.0,
    seqVowels:Array(16).fill('E'),rmOn:false,rmFreq:400,rmMix:.4,combOn:false,combFreq:100,
    combFB:.7,stutterOn:false,stutterRate:32,stutterDepth:.6,glide:0,
    seqPat:[1,0,0,1,0,0,1,0,1,0,0,1,0,1,0,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'DOCTOR P YOY': {
    o1Wave:'sawtooth',o2Wave:'square',o1Vol:.8,detune:-10,fmOn:false,fmDepth:100,fmRatio:2,
    pbend:2,pdecay:.1,subOn:true,subVol:.7,subOct:1,attack:.002,decay:.12,sustain:.5,release:.12,
    filterType:'lowpass',cutoff:320,reso:28,lfo1Rate:5,lfo1Depth:1400,lfo1Shape:'sine',
    lfo1Sync:false,lfo1Div:'1/4',lfo2Rate:5,lfo2Depth:0,lfo2Shape:'sine',lfo2Target:'pitch',
    bcOn:true,bits:7,phOn:false,phRate:.3,phDepth:600,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:60,vol:.62,bpm:140,vowelOn:false,vowelMix:1.0,
    seqVowels:['O','I','O','U','O','I','U','O','O','I','O','U','O','I','U','O'],
    rmOn:false,rmFreq:200,rmMix:.4,combOn:false,combFreq:100,combFB:.7,
    stutterOn:false,stutterRate:32,stutterDepth:.6,glide:0,
    seqPat:[1,0,0,0,1,0,1,0,1,0,0,0,1,0,0,1].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'EXCISION': {
    o1Wave:'square',o2Wave:'sawtooth',o1Vol:.9,detune:-14,fmOn:true,fmDepth:650,fmRatio:1,
    pbend:12,pdecay:.04,subOn:true,subVol:.8,subOct:2,attack:.001,decay:.06,sustain:.6,release:.08,
    filterType:'lowpass',cutoff:450,reso:22,lfo1Rate:9,lfo1Depth:1100,lfo1Shape:'square',
    lfo1Sync:false,lfo1Div:'1/8',lfo2Rate:4.5,lfo2Depth:400,lfo2Shape:'square',lfo2Target:'cutoff2',
    bcOn:false,bits:14,phOn:false,phRate:.3,phDepth:800,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:130,vol:.58,bpm:150,vowelOn:false,vowelMix:1.0,
    seqVowels:Array(16).fill('A'),rmOn:false,rmFreq:200,rmMix:.4,combOn:false,combFreq:100,
    combFB:.7,stutterOn:false,stutterRate:32,stutterDepth:.6,glide:0,
    seqPat:[1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'RIDDIM': {
    o1Wave:'square',o2Wave:'sawtooth',o1Vol:.88,detune:0,fmOn:false,fmDepth:50,fmRatio:1,
    pbend:0,pdecay:.1,subOn:true,subVol:.75,subOct:1,attack:.001,decay:.08,sustain:.6,release:.1,
    filterType:'lowpass',cutoff:300,reso:24,lfo1Rate:8,lfo1Depth:1000,lfo1Shape:'square',
    lfo1Sync:false,lfo1Div:'1/8',lfo2Rate:8,lfo2Depth:0,lfo2Shape:'square',lfo2Target:'pitch',
    bcOn:false,bits:14,phOn:false,phRate:.2,phDepth:400,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:85,vol:.62,bpm:140,vowelOn:false,vowelMix:1.0,
    seqVowels:Array(16).fill('O'),rmOn:false,rmFreq:200,rmMix:.4,combOn:true,combFreq:80,
    combFB:.8,stutterOn:false,stutterRate:32,stutterDepth:.6,glide:40,
    seqPat:[1,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'TALKING BASS': {
    o1Wave:'sawtooth',o2Wave:'square',o1Vol:.85,detune:-5,fmOn:false,fmDepth:100,fmRatio:2,
    pbend:0,pdecay:.1,subOn:true,subVol:.7,subOct:1,attack:.003,decay:.1,sustain:.6,release:.15,
    filterType:'bandpass',cutoff:800,reso:12,lfo1Rate:4,lfo1Depth:400,lfo1Shape:'sine',
    lfo1Sync:false,lfo1Div:'1/4',lfo2Rate:2,lfo2Depth:0,lfo2Shape:'sine',lfo2Target:'pitch',
    bcOn:false,bits:14,phOn:false,phRate:.4,phDepth:800,alfoOn:false,alfoRate:2.33,alfoDepth:.4,
    distAmt:45,vol:.65,bpm:140,vowelOn:true,vowelMix:.8,
    seqVowels:['A','E','I','O','U','O','I','E','A','O','U','I','E','A','O','U'],
    rmOn:false,rmFreq:200,rmMix:.4,combOn:false,combFreq:100,combFB:.7,
    stutterOn:false,stutterRate:32,stutterDepth:.6,glide:40,
    seqPat:[1,0,1,0,1,0,0,1,1,0,1,0,0,0,1,0].map(Boolean),seqNotes:Array(16).fill(36)
  },
  'RAPTOR HELL': {
    o1Wave:'sawtooth',o2Wave:'sawtooth',o1Vol:.95,detune:-19,fmOn:true,fmDepth:900,fmRatio:7,
    pbend:24,pdecay:.03,subOn:true,subVol:.85,subOct:2,attack:.001,decay:.05,sustain:.7,release:.06,
    filterType:'bandpass',cutoff:650,reso:30,lfo1Rate:13,lfo1Depth:1800,lfo1Shape:'square',
    lfo1Sync:false,lfo1Div:'1/16',lfo2Rate:7,lfo2Depth:600,lfo2Shape:'sawtooth',lfo2Target:'fm',
    bcOn:true,bits:5,phOn:true,phRate:3,phDepth:600,alfoOn:true,alfoRate:4,alfoDepth:.4,
    distAmt:180,vol:.5,bpm:150,vowelOn:true,vowelMix:.75,
    seqVowels:['I','U','A','I','O','U','I','A','U','I','O','A','I','U','O','I'],
    rmOn:true,rmFreq:300,rmMix:.35,combOn:true,combFreq:80,combFB:.82,
    stutterOn:true,stutterRate:32,stutterDepth:.55,glide:0,
    seqPat:[1,0,1,0,1,0,0,1,1,0,1,0,0,0,1,1].map(Boolean),seqNotes:Array(16).fill(36)
  },
};

function applyPreset(name) {
  const wasRunning = S.seqRunning;
  if (wasRunning) { S.seqRunning = false; clearTimeout(stt); stt = null; }
  const p = PS[name];
  // Pad sequence arrays to 64 if preset uses shorter arrays
  // Default all v6 params to OFF so v5 presets reset them cleanly
  const v6defaults = {
    noiseOn: false, noiseType: 0, noiseVol: 0,
    uniVoices: 1, uniSpread: 0,
    fenvOn: false, fenvAttack: .01, fenvDecay: .3, fenvSustain: .2, fenvRelease: .2, fenvAmount: 2000,
    chorusOn: false, chorusRate: 1.5, chorusDepth: 5, chorusMix: 0,
    delayOn: false, delaySync: '1/8', delayFree: 250, delayFB: .3, delayMix: 0, delayFilter: 3000,
    reverbOn: false, reverbSize: 1.5, reverbDamp: .5, reverbMix: 0,
    swing: 0,
  };
  const padded = { ...v6defaults, ...p, activePreset: name };
  if (padded.seqPat && padded.seqPat.length < 64) {
    padded.seqPat = [...padded.seqPat, ...Array(64 - padded.seqPat.length).fill(false)];
  }
  if (padded.seqNotes && padded.seqNotes.length < 64) {
    padded.seqNotes = [...padded.seqNotes, ...Array(64 - padded.seqNotes.length).fill(36)];
  }
  if (padded.seqVowels && padded.seqVowels.length < 64) {
    padded.seqVowels = [...padded.seqVowels, ...Array(64 - padded.seqVowels.length).fill('O')];
  }
  if (!padded.seqVel) padded.seqVel = Array(64).fill(100);
  if (!padded.seqProb) padded.seqProb = Array(64).fill(100);
  if (!padded.seqLocks) padded.seqLocks = Array(64).fill(null);
  if (!padded.seqLen) padded.seqLen = 16;
  Object.assign(S, padded);
  rdraw(); hlStep(S.seqStep); updNS(); updNB();
  if (typeof updVelGrid === 'function') updVelGrid();
  if (typeof updSeqLenDisp === 'function') updSeqLenDisp();
  updW('o1w', 'o1Wave', '#00ff88'); updW('o2w', 'o2Wave', '#00ff88');
  updW('l1w', 'lfo1Shape', '#cc44ff'); updW('l2w', 'lfo2Shape', '#00ccff');
  const fm2 = { lowpass: 'lpf', bandpass: 'bpf', highpass: 'hpf', notch: 'notch' };
  ['lpf', 'bpf', 'hpf', 'notch'].forEach(x =>
    st(document.getElementById('ft-' + x), fm2[S.filterType] === x, '#ff8800'));
  ['pitch', 'fm', 'cutoff2'].forEach(t =>
    st(document.getElementById('t-' + t.replace('cutoff2', 'cut2')), t === S.lfo2Target, '#00ccff'));
  ['1/4', '1/8', '1/16'].forEach(x =>
    st(document.getElementById('ss-' + x), x === S.stepSize, '#ffcc00'));
  const togs = [
    ['sub-tog', 'subOn',     '\u25C9 SUB ON',          'SUB OFF',           '#00ccff'],
    ['fm-tog',  'fmOn',      '\u26A1 FM ON',            'FM OFF',            '#ff8800'],
    ['bc-tog',  'bcOn',      '\u2620 CRUSH ON',         '\u2620 CRUSH OFF',  '#ff4444'],
    ['ph-tog',  'phOn',      '\u301C PH ON',            '\u301C PH OFF',     '#ff8800'],
    ['al-tog',  'alfoOn',    '\u26A1 PUMP ON',          'PUMP OFF',          '#ffcc00'],
    ['vow-tog', 'vowelOn',   '\uD83D\uDDE3 VOWEL ON',  'VOWEL OFF',         '#cc44ff'],
    ['rm-tog',  'rmOn',      '\u26A1 RING ON',          'RING OFF',          '#ff44cc'],
    ['cb-tog',  'combOn',    '\u26A1 COMB ON',          'COMB OFF',          '#00ff88'],
    ['st-tog',  'stutterOn', '\u26A1 STUT ON',          'STUTTER OFF',       '#ff4444'],
    ['noise-tog','noiseOn',  '\u26A1 NOISE ON',         'NOISE OFF',         '#00ccff'],
    ['fenv-tog', 'fenvOn',   '\u26A1 FILT ENV ON',      'FILT ENV OFF',      '#ffcc00'],
    ['ch-tog',   'chorusOn', '\u26A1 CHORUS ON',        'CHORUS OFF',        '#00ccff'],
    ['dl-tog',   'delayOn',  '\u26A1 DELAY ON',         'DELAY OFF',         '#00ccff'],
    ['rv-tog',   'reverbOn', '\u26A1 REVERB ON',        'REVERB OFF',        '#cc44ff'],
  ];
  togs.forEach(([id, key, on, off, col]) => {
    const el = document.getElementById(id);
    if (el) { el.textContent = S[key] ? on : off; st(el, S[key], col); }
  });
  led('l-sub', S.subOn, 'b'); led('l-fm', S.fmOn, 'b');
  led('l-bc', S.bcOn, 'o'); led('l-ph', S.phOn, 'p');
  led('l-vow', S.vowelOn, 'p'); led('l-rm', S.rmOn, 'pk');
  led('l-comb', S.combOn, 'g'); led('l-stut', S.stutterOn, 'o');
  led('l-noise', S.noiseOn, 'b'); led('l-fenv', S.fenvOn, 'y');
  led('l-chorus', S.chorusOn, 'b'); led('l-delay', S.delayOn, 'b');
  led('l-reverb', S.reverbOn, 'p');
  updSync(); updFViz();
  document.getElementById('bdisp').textContent = Math.round(S.bpm);
  // Update noise type buttons
  ['white', 'pink', 'brown'].forEach((x, j) => {
    const el = document.getElementById('nt-' + x);
    if (el) st(el, j === S.noiseType, '#00ccff');
  });
  // Update delay sync buttons
  ['1/4', '1/8', '1/8d', '1/16', 'free'].forEach(d => {
    const el = document.getElementById('ds-' + d);
    if (el) st(el, d === S.delaySync, '#00ccff');
  });
  // Highlight active preset
  document.getElementById('presets').querySelectorAll('.pb').forEach(b => {
    const on = b.dataset.n === name;
    b.style.background = on ? '#ff880010' : '#040404';
    b.style.color = on ? '#ff8800' : '#555';
    b.style.borderColor = on ? '#ff8800' : '#1a1a1a';
    b.style.boxShadow = on ? '0 0 10px rgba(255,136,0,.18)' : 'none';
  });
  // Apply all params to audio engine (use padded which includes v6 defaults)
  if (ctx) { Object.keys(padded).forEach(k => P(k, padded[k])); }
  if (wasRunning) { S.seqRunning = true; runSeq(); }
}

// Build preset buttons
Object.keys(PS).forEach(name => {
  const b = document.createElement('button'); b.className = 'pb'; b.dataset.n = name;
  b.innerHTML = `<span style="color:${PC[name] || '#ff8800'};font-size:10px;">${name}</span>`;
  b.addEventListener('click', () => applyPreset(name));
  document.getElementById('presets').appendChild(b);
});

// ── USER PRESET SYSTEM ───────────────────────────────────────────────────────
// Keys to serialize for a preset snapshot
const PRESET_KEYS = [
  'o1Wave','o2Wave','o1Vol','detune','fmOn','fmDepth','fmRatio','pbend','pdecay',
  'subOn','subVol','subOct','attack','decay','sustain','release',
  'filterType','cutoff','reso','lfo1Rate','lfo1Depth','lfo1Shape','lfo1Sync','lfo1Div',
  'lfo2Rate','lfo2Depth','lfo2Shape','lfo2Target',
  'bcOn','bits','bcRate','phOn','phRate','phDepth','alfoOn','alfoRate','alfoDepth',
  'distAmt','vol','bpm','stepSize',
  'vowelOn','vowelMix','seqVowels',
  'rmOn','rmFreq','rmMix','combOn','combFreq','combFB',
  'stutterOn','stutterRate','stutterDepth','glide',
  'noiseOn','noiseType','noiseVol','uniVoices','uniSpread',
  'fenvOn','fenvAttack','fenvDecay','fenvSustain','fenvRelease','fenvAmount',
  'chorusOn','chorusRate','chorusDepth','chorusMix',
  'delayOn','delaySync','delayFree','delayFB','delayMix','delayFilter',
  'reverbOn','reverbSize','reverbDamp','reverbMix',
  'seqPat','seqNotes','seqVel','seqProb','seqLen','swing',
];

function capturePreset() {
  const p = {};
  PRESET_KEYS.forEach(k => {
    const v = S[k];
    p[k] = Array.isArray(v) ? v.slice() : v;
  });
  return p;
}

// Load user presets from localStorage
let userPresets = {};
try {
  const saved = localStorage.getItem('wubstation-user-presets');
  if (saved) userPresets = JSON.parse(saved);
} catch (e) {}

function saveUserPresetsToStorage() {
  try { localStorage.setItem('wubstation-user-presets', JSON.stringify(userPresets)); } catch (e) {}
}

function saveUserPreset() {
  const name = prompt('Preset name:');
  if (!name || !name.trim()) return;
  const key = name.trim();
  userPresets[key] = capturePreset();
  saveUserPresetsToStorage();
  rebuildUserPresetBtns();
}

function deleteUserPreset(name) {
  delete userPresets[name];
  saveUserPresetsToStorage();
  rebuildUserPresetBtns();
}

function rebuildUserPresetBtns() {
  const c = document.getElementById('user-presets');
  if (!c) return;
  c.innerHTML = '';
  Object.keys(userPresets).forEach(name => {
    const b = document.createElement('button'); b.className = 'pb'; b.dataset.n = name;
    b.innerHTML = `<span style="color:#44aaff;font-size:10px;">${name}</span>`;
    b.addEventListener('click', () => {
      PS['__user__' + name] = userPresets[name];
      applyPreset('__user__' + name);
    });
    b.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (confirm(`Delete preset "${name}"?`)) deleteUserPreset(name);
    });
    c.appendChild(b);
  });
}

// Export preset as .wub file
function exportPreset() {
  const data = JSON.stringify(capturePreset(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = S.activePreset || 'custom';
  a.href = url;
  a.download = `wubstation-${name.replace(/\s+/g, '-').toLowerCase()}-${S.bpm}bpm.wub`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import preset from .wub file
function importPreset(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const p = JSON.parse(e.target.result);
      const name = file.name.replace('.wub', '').replace(/-/g, ' ');
      userPresets[name] = p;
      saveUserPresetsToStorage();
      rebuildUserPresetBtns();
      PS['__user__' + name] = p;
      applyPreset('__user__' + name);
    } catch (err) {
      console.error('Invalid .wub file:', err);
    }
  };
  reader.readAsText(file);
}

// Drag-and-drop import
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  for (let i = 0; i < files.length; i++) {
    if (files[i].name.endsWith('.wub')) importPreset(files[i]);
  }
});

// Init user preset buttons
rebuildUserPresetBtns();

// Wire up preset management buttons
const saveBtn = document.getElementById('preset-save');
const exportBtn = document.getElementById('preset-export');
if (saveBtn) saveBtn.addEventListener('click', saveUserPreset);
if (exportBtn) exportBtn.addEventListener('click', exportPreset);
