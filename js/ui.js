// ============================================================================
// WUBSTATION 9000 v6 — UI (Knobs, Buttons, Event Handlers)
// ============================================================================
'use strict';

// ── HELPERS ──────────────────────────────────────────────────────────────────
function st(el, on, col) {
  el.style.color = on ? col : '#2e2e2e';
  el.style.borderColor = on ? col : '#181818';
  el.style.background = on ? `${col}18` : '#090909';
  el.style.boxShadow = on ? `0 0 7px ${col}44` : 'none';
}

function led(id, on, cls) {
  const el = document.getElementById(id);
  if (el) el.className = 'led' + (on && cls ? ' ' + cls : '');
}

function updSync() {
  const b = document.getElementById('syn1');
  b.textContent = S.lfo1Sync ? 'SYNCED' : 'FREE';
  st(b, S.lfo1Sync, '#cc44ff');
  ['1/4', '1/8', '1/16', '1/32'].forEach(d =>
    st(document.getElementById('d1-' + d), d === S.lfo1Div && S.lfo1Sync, '#cc44ff'));
  document.getElementById('l1hz').textContent = S.lfo1Sync ? `= ${er1().toFixed(2)}Hz` : '';
}

// ── KNOB ─────────────────────────────────────────────────────────────────────
function knob(el, opts) {
  const { lbl, key, min, max, step = 1, unit = '', log = false, sz = 44, acc = '#00ff88' } = opts;
  const id = 'k' + Math.random().toString(36).slice(2);
  const w = document.createElement('div'); w.className = 'kw'; w.style.touchAction = 'none';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', sz); svg.setAttribute('height', sz);
  const cx2 = sz / 2, cy2 = sz / 2, r = sz / 2 - 4;

  const dfs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gr = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
  gr.setAttribute('id', id); gr.setAttribute('cx', '38%'); gr.setAttribute('cy', '28%');
  [{ o: '0%', c: '#3a3a3a' }, { o: '100%', c: '#0d0d0d' }].forEach(({ o, c }) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    s.setAttribute('offset', o); s.setAttribute('stop-color', c); gr.appendChild(s);
  });
  dfs.appendChild(gr); svg.appendChild(dfs);

  const S2 = 135, T = 270;
  const pol = (d, rr) => ({
    x: cx2 + rr * Math.cos((d - 90) * Math.PI / 180),
    y: cy2 + rr * Math.sin((d - 90) * Math.PI / 180)
  });
  const arc = (s, e, rr) => {
    const sp = pol(s, rr), ep = pol(e, rr);
    return `M ${sp.x.toFixed(2)} ${sp.y.toFixed(2)} A ${rr} ${rr} 0 ${e - s > 180 ? 1 : 0} 1 ${ep.x.toFixed(2)} ${ep.y.toFixed(2)}`;
  };

  const trk = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  trk.setAttribute('fill', 'none'); trk.setAttribute('stroke', '#181818');
  trk.setAttribute('stroke-width', '3'); trk.setAttribute('stroke-linecap', 'round');
  svg.appendChild(trk);

  const fil = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  fil.setAttribute('fill', 'none'); fil.setAttribute('stroke', acc);
  fil.setAttribute('stroke-width', '3'); fil.setAttribute('stroke-linecap', 'round');
  fil.style.filter = `drop-shadow(0 0 3px ${acc})`;
  svg.appendChild(fil);

  const ci = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ci.setAttribute('cx', cx2); ci.setAttribute('cy', cy2);
  ci.setAttribute('r', r - 6); ci.setAttribute('fill', `url(#${id})`);
  ci.setAttribute('stroke', '#090909'); ci.setAttribute('stroke-width', '1.5');
  svg.appendChild(ci);

  const ind = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  ind.setAttribute('x1', cx2); ind.setAttribute('y1', cy2);
  ind.setAttribute('stroke', acc); ind.setAttribute('stroke-width', '2');
  ind.setAttribute('stroke-linecap', 'round');
  ind.style.filter = `drop-shadow(0 0 2px ${acc})`;
  svg.appendChild(ind);

  const lb = document.createElement('div'); lb.className = 'kl'; lb.textContent = lbl;
  const vl = document.createElement('div'); vl.className = 'kv'; vl.style.color = acc;
  w.appendChild(svg); w.appendChild(lb); w.appendChild(vl); el.appendChild(w);

  const toN = v => log ? Math.log(Math.max(v, min + 1e-9) / min) / Math.log(max / min) : (v - min) / (max - min);
  const frN = n => log ? min * Math.pow(max / min, n) : min + n * (max - min);

  function draw() {
    const v = S[key], n = Math.max(0, Math.min(1, toN(v)));
    const fe = S2 + n * T, ip = pol(fe, r - 5);
    trk.setAttribute('d', arc(S2, S2 + T - .1, r));
    n > .005 ? (fil.setAttribute('d', arc(S2, fe, r)), fil.style.display = '') : fil.style.display = 'none';
    ind.setAttribute('x2', ip.x.toFixed(2)); ind.setAttribute('y2', ip.y.toFixed(2));
    const dv = Math.abs(v) >= 100 ? Math.round(v) : v % 1 !== 0 ? v.toFixed(2) : v;
    vl.textContent = dv + unit;
    if (key === 'bpm') document.getElementById('bdisp').textContent = Math.round(v);
    if (['attack', 'decay', 'sustain', 'release'].includes(key)) updAdsr();
  }

  function drag(sy, sn) {
    return cy3 => {
      const n2 = Math.max(0, Math.min(1, sn + (sy - cy3) / 150));
      let v = frN(n2);
      if (step) v = Math.round(v / step) * step;
      v = parseFloat(Math.max(min, Math.min(max, v)).toFixed(6));
      S[key] = v; draw(); P(key, v);
      // Parameter lock: if lock mode + step selected, save to that step
      if (S.lockMode && S.selStep >= 0 && S.selStep < S.seqLen) {
        if (!S.seqLocks[S.selStep]) S.seqLocks[S.selStep] = {};
        S.seqLocks[S.selStep][key] = v;
      }
    };
  }

  w.addEventListener('mousedown', e => {
    e.preventDefault();
    const sy = e.clientY, sn = toN(S[key]), mv = drag(sy, sn);
    const up = () => { window.removeEventListener('mousemove', mv2); window.removeEventListener('mouseup', up); };
    const mv2 = e2 => mv(e2.clientY);
    window.addEventListener('mousemove', mv2); window.addEventListener('mouseup', up);
  });

  w.addEventListener('touchstart', e => {
    e.preventDefault();
    const t0 = e.touches[0], sy = t0.clientY, sn = toN(S[key]), mv = drag(sy, sn);
    const up = () => { w.removeEventListener('touchmove', om); w.removeEventListener('touchend', up); };
    const om = te => { const t = te.touches[0]; if (t) mv(t.clientY); };
    w.addEventListener('touchmove', om, { passive: false });
    w.addEventListener('touchend', up);
  }, { passive: false });

  // Double-click to reset to default
  const defaultVal = S[key];
  w.addEventListener('dblclick', e => {
    e.preventDefault();
    S[key] = defaultVal; draw(); P(key, defaultVal);
  });

  // Scroll wheel for fine adjustment
  w.addEventListener('wheel', e => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const fine = e.shiftKey ? 0.1 : 1;
    const n = toN(S[key]);
    const n2 = Math.max(0, Math.min(1, n + dir * 0.02 * fine));
    let v = frN(n2);
    if (step) v = Math.round(v / step) * step;
    v = parseFloat(Math.max(min, Math.min(max, v)).toFixed(6));
    S[key] = v; draw(); P(key, v);
  }, { passive: false });

  draw();
  return { draw };
}

// ── ALL KNOBS ────────────────────────────────────────────────────────────────
const KS = {};
[
  ['k-bpm',  { lbl: 'BPM',       key: 'bpm',         min: 60,   max: 200,  step: 1,    unit: '',   acc: '#ffcc00', sz: 52 }],
  ['k-sv',   { lbl: 'SUB LVL',   key: 'subVol',      min: 0,    max: 1,    step: .01,              acc: '#00ccff', sz: 46 }],
  ['k-so',   { lbl: 'SUB OCT',   key: 'subOct',      min: 1,    max: 3,    step: 1,    unit: '\u25BC', acc: '#00ccff', sz: 46 }],
  ['k-A',    { lbl: 'ATTACK',    key: 'attack',       min: .001, max: 1,    step: .001, unit: 's',  acc: '#ffcc00', sz: 44 }],
  ['k-D',    { lbl: 'DECAY',     key: 'decay',        min: .01,  max: 2,    step: .01,  unit: 's',  acc: '#ffcc00', sz: 44 }],
  ['k-S',    { lbl: 'SUSTAIN',   key: 'sustain',      min: 0,    max: 1,    step: .01,              acc: '#ffcc00', sz: 44 }],
  ['k-R',    { lbl: 'RELEASE',   key: 'release',      min: .01,  max: 2,    step: .01,  unit: 's',  acc: '#ffcc00', sz: 44 }],
  ['k-o1v',  { lbl: 'OSC LVL',   key: 'o1Vol',        min: 0,    max: 1,    step: .01,              acc: '#00ff88', sz: 44 }],
  ['k-det',  { lbl: 'DETUNE',    key: 'detune',       min: -50,  max: 50,   step: 1,    unit: '\u00A2', acc: '#00ff88', sz: 44 }],
  ['k-fmd',  { lbl: 'FM DEPTH',  key: 'fmDepth',      min: 0,    max: 2000, step: 10,               acc: '#ff8800', sz: 46 }],
  ['k-fmr',  { lbl: 'FM RATIO',  key: 'fmRatio',      min: .5,   max: 12,   step: .5,   unit: 'x',  acc: '#ff8800', sz: 46 }],
  ['k-pb',   { lbl: 'P.BEND',    key: 'pbend',        min: 0,    max: 24,   step: 1,    unit: 'st', acc: '#ff8800', sz: 44 }],
  ['k-pd',   { lbl: 'BD DEC',    key: 'pdecay',       min: .01,  max: 1,    step: .01,  unit: 's',  acc: '#ff8800', sz: 44 }],
  ['k-cut',  { lbl: 'CUTOFF',    key: 'cutoff',       min: 80,   max: 8000, step: 10,   unit: 'Hz', acc: '#ff8800', sz: 50, log: true }],
  ['k-res',  { lbl: 'RESO',      key: 'reso',         min: .1,   max: 30,   step: .1,               acc: '#ff8800', sz: 50 }],
  ['k-l1r',  { lbl: 'RATE',      key: 'lfo1Rate',     min: .1,   max: 24,   step: .1,   unit: 'Hz', acc: '#cc44ff', sz: 44 }],
  ['k-l1d',  { lbl: 'DEPTH',     key: 'lfo1Depth',    min: 0,    max: 6000, step: 10,               acc: '#cc44ff', sz: 44 }],
  ['k-l2r',  { lbl: 'RATE',      key: 'lfo2Rate',     min: .1,   max: 20,   step: .1,   unit: 'Hz', acc: '#00ccff', sz: 44 }],
  ['k-l2d',  { lbl: 'DEPTH',     key: 'lfo2Depth',    min: 0,    max: 1000, step: 10,               acc: '#00ccff', sz: 44 }],
  ['k-bit',  { lbl: 'BITS',      key: 'bits',         min: 2,    max: 16,   step: 1,    unit: 'b',  acc: '#ff4444', sz: 44 }],
  ['k-phr',  { lbl: 'PH RATE',   key: 'phRate',       min: .05,  max: 8,    step: .05,  unit: 'Hz', acc: '#ff8800', sz: 44 }],
  ['k-phd',  { lbl: 'PH DEPTH',  key: 'phDepth',      min: 0,    max: 3000, step: 50,               acc: '#ff8800', sz: 44 }],
  ['k-alr',  { lbl: 'PUMP RATE', key: 'alfoRate',     min: .25,  max: 8,    step: .25,  unit: 'Hz', acc: '#ffcc00', sz: 44 }],
  ['k-ald',  { lbl: 'PUMP AMT',  key: 'alfoDepth',    min: 0,    max: .9,   step: .01,              acc: '#ffcc00', sz: 44 }],
  ['k-dis',  { lbl: 'DISTORT',   key: 'distAmt',      min: 0,    max: 200,  step: 1,                acc: '#ff4444', sz: 46 }],
  ['k-vol',  { lbl: 'VOLUME',    key: 'vol',          min: 0,    max: 1,    step: .01,              acc: '#ff4444', sz: 46 }],
  ['k-vmix', { lbl: 'VOW MIX',   key: 'vowelMix',     min: 0,    max: 1,    step: .01,              acc: '#cc44ff', sz: 42 }],
  ['k-rmf',  { lbl: 'CARRIER',   key: 'rmFreq',       min: 20,   max: 2000, step: 10,   unit: 'Hz', acc: '#ff44cc', sz: 44, log: true }],
  ['k-rmm',  { lbl: 'RM MIX',    key: 'rmMix',        min: 0,    max: 1,    step: .01,              acc: '#ff44cc', sz: 44 }],
  ['k-cbf',  { lbl: 'PITCH',     key: 'combFreq',     min: 40,   max: 1200, step: 5,    unit: 'Hz', acc: '#00ff88', sz: 44, log: true }],
  ['k-cbg',  { lbl: 'FEEDBACK',  key: 'combFB',       min: 0,    max: .93,  step: .01,              acc: '#00ff88', sz: 44 }],
  ['k-str',  { lbl: 'RATE',      key: 'stutterRate',  min: 2,    max: 100,  step: 1,    unit: 'Hz', acc: '#ff4444', sz: 44 }],
  ['k-std',  { lbl: 'DEPTH',     key: 'stutterDepth', min: 0,    max: 1,    step: .01,              acc: '#ff4444', sz: 44 }],
  ['k-gli',  { lbl: 'GLIDE',     key: 'glide',        min: 0,    max: 400,  step: 5,    unit: 'ms', acc: '#ffcc00', sz: 54 }],
  // v6: Swing
  ['k-swing',{ lbl: 'SWING',     key: 'swing',        min: 0,    max: 75,   step: 1,    unit: '%',  acc: '#ffcc00', sz: 46 }],
  // v6: Noise
  ['k-nvol', { lbl: 'NOISE LVL', key: 'noiseVol',    min: 0,    max: 1,    step: .01,              acc: '#00ccff', sz: 44 }],
  // v6: Unison
  ['k-univ', { lbl: 'VOICES',    key: 'uniVoices',   min: 1,    max: 7,    step: 2,                acc: '#00ff88', sz: 46 }],
  ['k-unis', { lbl: 'SPREAD',    key: 'uniSpread',   min: 0,    max: 100,  step: 1,    unit: '\u00A2', acc: '#00ff88', sz: 46 }],
  // v6: Filter envelope
  ['k-fea',  { lbl: 'F.ATK',     key: 'fenvAttack',  min: .001, max: 2,    step: .001, unit: 's',  acc: '#ffcc00', sz: 40 }],
  ['k-fed',  { lbl: 'F.DEC',     key: 'fenvDecay',   min: .01,  max: 3,    step: .01,  unit: 's',  acc: '#ffcc00', sz: 40 }],
  ['k-fes',  { lbl: 'F.SUS',     key: 'fenvSustain', min: 0,    max: 1,    step: .01,              acc: '#ffcc00', sz: 40 }],
  ['k-fer',  { lbl: 'F.REL',     key: 'fenvRelease', min: .01,  max: 2,    step: .01,  unit: 's',  acc: '#ffcc00', sz: 40 }],
  ['k-feamt',{ lbl: 'F.AMT',     key: 'fenvAmount',  min: -8000,max: 8000, step: 50,   unit: 'Hz', acc: '#ffcc00', sz: 44 }],
  // v6: Chorus
  ['k-chr',  { lbl: 'CH RATE',   key: 'chorusRate',  min: .1,   max: 10,   step: .1,   unit: 'Hz', acc: '#00ccff', sz: 44 }],
  ['k-chd',  { lbl: 'CH DEPTH',  key: 'chorusDepth', min: 0,    max: 20,   step: .5,   unit: 'ms', acc: '#00ccff', sz: 44 }],
  ['k-chm',  { lbl: 'CH MIX',    key: 'chorusMix',   min: 0,    max: 1,    step: .01,              acc: '#00ccff', sz: 44 }],
  // v6: Delay
  ['k-dlfb', { lbl: 'DL FB',     key: 'delayFB',     min: 0,    max: .9,   step: .01,              acc: '#00ccff', sz: 44 }],
  ['k-dlm',  { lbl: 'DL MIX',    key: 'delayMix',    min: 0,    max: 1,    step: .01,              acc: '#00ccff', sz: 44 }],
  ['k-dlf',  { lbl: 'DL FREE',   key: 'delayFree',   min: 50,   max: 1000, step: 5,    unit: 'ms', acc: '#00ccff', sz: 44 }],
  ['k-dlft', { lbl: 'DL TONE',   key: 'delayFilter', min: 200,  max: 8000, step: 50,   unit: 'Hz', acc: '#00ccff', sz: 44, log: true }],
  // v6: Reverb
  ['k-rvs',  { lbl: 'RV SIZE',   key: 'reverbSize',  min: .1,   max: 5,    step: .1,   unit: 's',  acc: '#cc44ff', sz: 44 }],
  ['k-rvd',  { lbl: 'RV DAMP',   key: 'reverbDamp',  min: 0,    max: 1,    step: .01,              acc: '#cc44ff', sz: 44 }],
  ['k-rvm',  { lbl: 'RV MIX',    key: 'reverbMix',   min: 0,    max: 1,    step: .01,              acc: '#cc44ff', sz: 44 }],
].forEach(([id, o]) => {
  const el = document.getElementById(id);
  if (el) KS[o.key] = knob(el, o);
});

function rdraw() { Object.values(KS).forEach(k => k.draw && k.draw()); updAdsr(); }

// ── WAVE BUTTONS ─────────────────────────────────────────────────────────────
function mkW(cid, key, acc) {
  const c = document.getElementById(cid);
  Object.entries(GL).forEach(([w, g]) => {
    const b = document.createElement('button'); b.className = 'wb'; b.textContent = g; b.dataset.wave = w;
    b.addEventListener('click', () => { S[key] = w; updW(cid, key, acc); P(key, w); });
    c.appendChild(b);
  });
  updW(cid, key, acc);
}

function updW(cid, key, acc) {
  document.getElementById(cid).querySelectorAll('.wb').forEach(b => {
    const on = b.dataset.wave === S[key];
    b.style.background = on ? `${acc}18` : '#090909';
    b.style.color = on ? acc : '#2a2a2a';
    b.style.borderColor = on ? acc : '#181818';
    b.style.boxShadow = on ? `0 0 6px ${acc}44` : 'none';
  });
}

mkW('o1w', 'o1Wave', '#00ff88');
mkW('o2w', 'o2Wave', '#00ff88');
mkW('l1w', 'lfo1Shape', '#cc44ff');
mkW('l2w', 'lfo2Shape', '#00ccff');

// ── TOGGLE BUTTONS ───────────────────────────────────────────────────────────
function tog(id, key, onLbl, offLbl, col, pk) {
  document.getElementById(id).addEventListener('click', () => {
    S[key] = !S[key];
    const b = document.getElementById(id);
    b.textContent = S[key] ? onLbl : offLbl;
    st(b, S[key], col);
    P(pk || key, S[key]);
  });
}

tog('sub-tog', 'subOn',     '\u25C9 SUB ON',      'SUB OFF',         '#00ccff', 'subOn');
tog('fm-tog',  'fmOn',      '\u26A1 FM ON',        'FM OFF',          '#ff8800', 'fmOn');
tog('bc-tog',  'bcOn',      '\u2620 CRUSH ON',     '\u2620 CRUSH OFF','#ff4444', 'bcOn');
tog('ph-tog',  'phOn',      '\u301C PH ON',        '\u301C PH OFF',   '#ff8800', 'phOn');
tog('al-tog',  'alfoOn',    '\u26A1 PUMP ON',      'PUMP OFF',        '#ffcc00', 'alfoOn');
tog('vow-tog', 'vowelOn',   '\uD83D\uDDE3 VOWEL ON', 'VOWEL OFF',    '#cc44ff', 'vowelOn');
tog('rm-tog',  'rmOn',      '\u26A1 RING ON',      'RING OFF',        '#ff44cc', 'rmOn');
tog('cb-tog',  'combOn',    '\u26A1 COMB ON',      'COMB OFF',        '#00ff88', 'combOn');
tog('st-tog',  'stutterOn', '\u26A1 STUT ON',      'STUTTER OFF',     '#ff4444', 'stutterOn');
// v6 toggles
tog('noise-tog','noiseOn',  '\u26A1 NOISE ON',     'NOISE OFF',       '#00ccff', 'noiseOn');
tog('fenv-tog', 'fenvOn',   '\u26A1 FILT ENV ON',  'FILT ENV OFF',    '#ffcc00', 'fenvOn');
tog('ch-tog',   'chorusOn', '\u26A1 CHORUS ON',    'CHORUS OFF',      '#00ccff', 'chorusOn');
tog('dl-tog',   'delayOn',  '\u26A1 DELAY ON',     'DELAY OFF',       '#00ccff', 'delayOn');
tog('rv-tog',   'reverbOn', '\u26A1 REVERB ON',    'REVERB OFF',      '#cc44ff', 'reverbOn');

// ── NOISE TYPE ───────────────────────────────────────────────────────────────
['white', 'pink', 'brown'].forEach((t, i) => {
  document.getElementById('nt-' + t).addEventListener('click', () => {
    S.noiseType = i;
    ['white', 'pink', 'brown'].forEach((x, j) =>
      st(document.getElementById('nt-' + x), j === i, '#00ccff'));
    P('noiseType', i);
  });
});
st(document.getElementById('nt-white'), true, '#00ccff');

// ── DELAY SYNC ───────────────────────────────────────────────────────────────
['1/4', '1/8', '1/8d', '1/16', 'free'].forEach(d => {
  document.getElementById('ds-' + d).addEventListener('click', () => {
    S.delaySync = d;
    ['1/4', '1/8', '1/8d', '1/16', 'free'].forEach(x =>
      st(document.getElementById('ds-' + x), x === d, '#00ccff'));
    P('delaySync', d);
  });
});
st(document.getElementById('ds-1/8'), true, '#00ccff');

// ── FILTER TYPE ──────────────────────────────────────────────────────────────
['lpf', 'bpf', 'hpf', 'notch'].forEach(x => {
  document.getElementById('ft-' + x).addEventListener('click', () => {
    const m = { lpf: 'lowpass', bpf: 'bandpass', hpf: 'highpass', notch: 'notch' };
    S.filterType = m[x];
    ['lpf', 'bpf', 'hpf', 'notch'].forEach(y =>
      st(document.getElementById('ft-' + y), y === x, '#ff8800'));
    P('filterType', S.filterType);
  });
});
st(document.getElementById('ft-lpf'), true, '#ff8800');

// ── LFO1 SYNC ────────────────────────────────────────────────────────────────
document.getElementById('syn1').addEventListener('click', () => {
  S.lfo1Sync = !S.lfo1Sync; P('lfo1Sync', S.lfo1Sync); updSync();
});
['1/4', '1/8', '1/16', '1/32'].forEach(d => {
  document.getElementById('d1-' + d).addEventListener('click', () => {
    S.lfo1Div = d; P('lfo1Div', d); updSync();
  });
});

// ── LFO2 TARGETS ─────────────────────────────────────────────────────────────
['pitch', 'fm', 'cutoff2'].forEach(t => {
  document.getElementById('t-' + t.replace('cutoff2', 'cut2')).addEventListener('click', () => {
    S.lfo2Target = t;
    ['pitch', 'fm', 'cutoff2'].forEach(x =>
      st(document.getElementById('t-' + x.replace('cutoff2', 'cut2')), x === t, '#00ccff'));
    P('lfo2Target', t);
  });
});
st(document.getElementById('t-pitch'), true, '#00ccff');

// ── STEP SIZE ────────────────────────────────────────────────────────────────
['1/4', '1/8', '1/16'].forEach(x => {
  document.getElementById('ss-' + x).addEventListener('click', () => {
    S.stepSize = x;
    ['1/4', '1/8', '1/16'].forEach(y =>
      st(document.getElementById('ss-' + y), y === x, '#ffcc00'));
    if (S.seqRunning) { stopSeq(); S.seqRunning = true; runSeq(); }
  });
});
st(document.getElementById('ss-1/16'), true, '#ffcc00');

// ── SEQUENCER UI ─────────────────────────────────────────────────────────────
const MAX_SEQ_STEPS = 64;

function rebuildSeqGrid() {
  // Clear and rebuild all grids for current seqLen
  ['sg', 'vg', 'ns', 'vs'].forEach(id => {
    document.getElementById(id).innerHTML = '';
  });
  buildStepGrid();
  buildVelGrid();
  buildNoteGrid();
  buildVowelGrid();
}

function buildStepGrid() {
  const sg = document.getElementById('sg');
  for (let i = 0; i < MAX_SEQ_STEPS; i++) {
    const b = document.createElement('div');
    b.className = 'sb' + (S.seqPat[i] ? ' on' : '') + (i >= S.seqLen ? ' dimmed' : '');
    b.addEventListener('click', () => {
      if (i >= S.seqLen) return;
      pushUndo();
      // Shift+click = toggle probability
      S.seqPat[i] = !S.seqPat[i];
      S.selStep = i;
      hlStep(S.seqStep); updNS(); updVelGrid();
    });
    b.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (i >= S.seqLen) return;
      // Right-click: cycle probability
      const probs = [100, 75, 50, 25];
      const cur = probs.indexOf(S.seqProb[i]);
      S.seqProb[i] = probs[(cur + 1) % probs.length];
      hlStep(S.seqStep);
    });
    sg.appendChild(b);
  }
}

function buildVelGrid() {
  const vg = document.getElementById('vg');
  for (let i = 0; i < MAX_SEQ_STEPS; i++) {
    const b = document.createElement('div');
    b.className = 'velbar' + (i >= S.seqLen ? ' dimmed' : '');
    const fill = document.createElement('div');
    fill.className = 'vfill';
    fill.style.height = (S.seqVel[i] / 127 * 100) + '%';
    b.appendChild(fill);
    // Drag to set velocity
    const setVel = (startY, startVel) => {
      const move = e2 => {
        const dy = startY - (e2.clientY || e2.touches[0].clientY);
        const nv = Math.max(0, Math.min(127, startVel + dy));
        S.seqVel[i] = Math.round(nv);
        fill.style.height = (nv / 127 * 100) + '%';
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        window.removeEventListener('touchmove', move);
        window.removeEventListener('touchend', up);
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('touchend', up);
    };
    b.addEventListener('mousedown', e => { e.preventDefault(); setVel(e.clientY, S.seqVel[i]); });
    b.addEventListener('touchstart', e => { e.preventDefault(); setVel(e.touches[0].clientY, S.seqVel[i]); }, { passive: false });
    vg.appendChild(b);
  }
}

function updVelGrid() {
  document.getElementById('vg').querySelectorAll('.velbar').forEach((b, i) => {
    b.className = 'velbar' + (i >= S.seqLen ? ' dimmed' : '');
    const fill = b.querySelector('.vfill');
    if (fill) fill.style.height = (S.seqVel[i] / 127 * 100) + '%';
  });
}

function buildNoteGrid() {
  const ns = document.getElementById('ns');
  for (let i = 0; i < MAX_SEQ_STEPS; i++) {
    const b = document.createElement('div');
    b.className = 'nb2' + (i >= S.seqLen ? ' dimmed' : '');
    b.textContent = nn(S.seqNotes[i]);
    b.addEventListener('click', () => { if (i < S.seqLen) { S.selStep = i; updNS(); } });
    ns.appendChild(b);
  }
}

function buildVowelGrid() {
  const vs = document.getElementById('vs');
  for (let i = 0; i < MAX_SEQ_STEPS; i++) {
    const b = document.createElement('div');
    b.className = 'vb2' + (i >= S.seqLen ? ' dimmed' : '');
    b.addEventListener('click', () => {
      if (i >= S.seqLen) return;
      S.selVStep = S.selVStep === i ? -1 : i;
      hlStep(S.seqStep);
    });
    vs.appendChild(b);
  }
}

function updNS() {
  document.getElementById('ns').querySelectorAll('.nb2').forEach((b, i) => {
    if (i >= S.seqLen) { b.className = 'nb2 dimmed'; return; }
    b.textContent = nn(S.seqNotes[i]);
    const on = i === S.selStep;
    b.style.color = on ? '#ffcc00' : '#252525';
    b.style.borderColor = on ? '#ffcc0044' : '#111';
    b.style.background = on ? '#ffcc0010' : '#070707';
    b.className = 'nb2';
  });
}

// Build initial grids
buildStepGrid();
buildVelGrid();
buildNoteGrid();
buildVowelGrid();
hlStep(-1);

// Vowel buttons
['A', 'E', 'I', 'O', 'U'].forEach(v => {
  const b = document.createElement('button'); b.className = 'vbt';
  b.textContent = v; b.style.color = VC[v]; b.style.borderColor = VC[v] + '44';
  b.addEventListener('click', () => {
    if (S.selVStep >= 0) S.seqVowels[S.selVStep] = v;
    else S.seqVowels.fill(v);
    hlStep(S.seqStep);
    if (S.vowelOn && ctx) applyVowel(v);
  });
  document.getElementById('vbr').appendChild(b);
});

// Seq controls
document.getElementById('sq-run').addEventListener('click', () => {
  if (!S.playing) return;
  S.seqRunning = !S.seqRunning;
  if (S.seqRunning) runSeq(); else stopSeq();
});
document.getElementById('sq-clr').addEventListener('click', () => {
  pushUndo();
  for (let i = 0; i < S.seqLen; i++) S.seqPat[i] = false;
  hlStep(S.seqStep);
});
document.getElementById('sq-fill').addEventListener('click', () => {
  pushUndo();
  for (let i = 0; i < S.seqLen; i++) S.seqPat[i] = true;
  hlStep(S.seqStep);
});
document.getElementById('sq-alt').addEventListener('click', () => {
  pushUndo();
  for (let i = 0; i < S.seqLen; i++) S.seqPat[i] = i % 2 === 0;
  hlStep(S.seqStep);
});
document.getElementById('sq-wum').addEventListener('click', () => {
  pushUndo();
  for (let i = 0; i < S.seqLen; i++) S.seqPat[i] = i % 4 === 0;
  hlStep(S.seqStep);
});

// Lock mode toggle
document.getElementById('sq-lock').addEventListener('click', () => {
  S.lockMode = !S.lockMode;
  st(document.getElementById('sq-lock'), S.lockMode, '#ff4444');
});

// Seq length controls
function updSeqLenDisp() { document.getElementById('sl-disp').textContent = S.seqLen; }
document.getElementById('sl-inc').addEventListener('click', () => {
  if (S.seqLen < 64) { S.seqLen = Math.min(64, S.seqLen + 4); updSeqLenDisp(); hlStep(S.seqStep); updNS(); updVelGrid(); }
});
document.getElementById('sl-dec').addEventListener('click', () => {
  if (S.seqLen > 4) { S.seqLen = Math.max(4, S.seqLen - 4); updSeqLenDisp(); hlStep(S.seqStep); updNS(); updVelGrid(); }
});

// Pattern bank
for (let i = 0; i < 8; i++) {
  document.getElementById('pat-' + i).addEventListener('click', () => loadPattern(i));
}
updPatternBtns();

// ── ROOT NOTES ───────────────────────────────────────────────────────────────
[
  { n: 24, l: 'C1' }, { n: 28, l: 'E1' }, { n: 31, l: 'G1' }, { n: 33, l: 'A1' },
  { n: 36, l: 'C2' }, { n: 38, l: 'D2' }, { n: 40, l: 'E2' }, { n: 43, l: 'G2' },
  { n: 45, l: 'A2' }, { n: 48, l: 'C3' }, { n: 52, l: 'E3' }, { n: 55, l: 'G3' },
  { n: 57, l: 'A3' }
].forEach(({ n, l }) => {
  const b = document.createElement('button'); b.className = 'nb'; b.textContent = l; b.dataset.note = n;
  b.addEventListener('click', () => {
    S.activeNote = n;
    if (S.selStep >= 0) { S.seqNotes[S.selStep] = n; updNS(); }
    else { S.seqNotes.fill(n); updNS(); }
    updNB();
  });
  document.getElementById('notes').appendChild(b);
});

function updNB() {
  document.getElementById('notes').querySelectorAll('.nb').forEach(b => {
    const on = parseInt(b.dataset.note) === S.activeNote;
    b.style.background = on ? '#00ccff12' : '#060606';
    b.style.color = on ? '#00ccff' : '#222';
    b.style.borderColor = on ? '#00ccff' : '#131313';
    b.style.boxShadow = on ? '0 0 8px rgba(0,204,255,.28)' : 'none';
  });
}
updNB();

// ── ENGAGE ───────────────────────────────────────────────────────────────────
const eb = document.getElementById('eng');
let _engaging = false; // guard against double-click
eb.addEventListener('click', async () => {
  if (_engaging) return;
  if (S.playing) {
    stop(); S.playing = false;
    eb.className = ''; eb.textContent = '\u25B6\u00A0 ENGAGE WUB';
    led('l-tx', false);
  } else {
    _engaging = true;
    eb.textContent = '\u23F3\u00A0 LOADING...';
    await start(); S.playing = true;
    eb.className = 'on'; eb.textContent = '\u25A0\u00A0 KILL THE WUB';
    led('l-tx', true, 'g');
    S.seqRunning = true; runSeq();
    _engaging = false;
  }
});

// ── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Don't capture when typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // Ctrl+Z = undo, Ctrl+Shift+Z = redo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); doUndo(); rebuildSeqGrid(); hlStep(S.seqStep); updNS(); updNB(); rdraw();
    return;
  }
  if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
    e.preventDefault(); doRedo(); rebuildSeqGrid(); hlStep(S.seqStep); updNS(); updNB(); rdraw();
    return;
  }

  switch (e.key) {
    case ' ': // Space = engage/kill
      e.preventDefault(); eb.click(); break;
    case 'Enter': // Enter = start/stop seq
      e.preventDefault();
      if (S.playing) document.getElementById('sq-run').click();
      break;
    case '[': S.bpm = Math.max(60, S.bpm - 1); KS.bpm && KS.bpm.draw(); P('bpm', S.bpm); break;
    case ']': S.bpm = Math.min(200, S.bpm + 1); KS.bpm && KS.bpm.draw(); P('bpm', S.bpm); break;
    case '{': S.bpm = Math.max(60, S.bpm - 10); KS.bpm && KS.bpm.draw(); P('bpm', S.bpm); break;
    case '}': S.bpm = Math.min(200, S.bpm + 10); KS.bpm && KS.bpm.draw(); P('bpm', S.bpm); break;
    case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8':
      loadPattern(parseInt(e.key) - 1); break;
    case 'Escape':
      S.lockMode = false;
      st(document.getElementById('sq-lock'), false, '#ff4444');
      break;
  }
});

// ── INIT ─────────────────────────────────────────────────────────────────────
updSync();
st(document.getElementById('ft-lpf'), true, '#ff8800');
['pitch', 'fm', 'cutoff2'].forEach(t =>
  st(document.getElementById('t-' + t.replace('cutoff2', 'cut2')), t === S.lfo2Target, '#00ccff'));
['1/4', '1/8', '1/16'].forEach(x =>
  st(document.getElementById('ss-' + x), x === S.stepSize, '#ffcc00'));
