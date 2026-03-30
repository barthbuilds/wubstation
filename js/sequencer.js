// ============================================================================
// WUBSTATION 9000 v6 — STEP SEQUENCER
// ============================================================================
'use strict';

let stt, scs = 0;
let _lockedParams = null; // currently applied param lock

function runSeq() {
  if (stt) return;
  scs = 0;
  const tick = () => {
    if (!S.seqRunning) return;
    const step = scs % S.seqLen;
    S.seqStep = step;
    hlStep(step);

    // Revert previous param lock
    if (_lockedParams && ctx) {
      Object.entries(_lockedParams).forEach(([k, v]) => { S[k] = v; P(k, v); });
      _lockedParams = null;
    }

    if (S.seqPat[step]) {
      // Probability check
      const prob = S.seqProb[step];
      if (prob < 100 && Math.random() * 100 > prob) {
        // Skip this step
      } else {
        // Apply param locks for this step
        const lock = S.seqLocks[step];
        if (lock) {
          _lockedParams = {};
          Object.entries(lock).forEach(([k, v]) => {
            _lockedParams[k] = S[k]; // save current value
            S[k] = v; P(k, v);       // apply locked value
          });
        }

        // Velocity scaling (0-127 → 0-1)
        const vel = S.seqVel[step] / 127;
        trig(S.seqNotes[step], step, vel);
      }
    }
    scs++;

    // Swing: shift even steps forward
    let dur = sdur() * 1000;
    if (S.swing > 0 && step % 2 === 0) {
      dur *= (1 + S.swing / 100);
    } else if (S.swing > 0 && step % 2 === 1) {
      dur *= (1 - S.swing / 100);
    }
    stt = setTimeout(tick, dur);
  };
  tick();
  updSeqBtn();
}

function stopSeq() {
  if (stt) { clearTimeout(stt); stt = null; }
  S.seqRunning = false;
  S.seqStep = -1;
  hlStep(-1);
  updSeqBtn();
  led('l-seq', false);
  // Revert any active param lock
  if (_lockedParams && ctx) {
    Object.entries(_lockedParams).forEach(([k, v]) => { S[k] = v; P(k, v); });
    _lockedParams = null;
  }
}

function updSeqBtn() {
  const b = document.getElementById('sq-run');
  b.textContent = S.seqRunning ? '\u25A0 STOP SEQ' : '\u25B6 RUN SEQ';
  st(b, S.seqRunning, '#ffcc00');
  led('l-seq', S.seqRunning, 'y');
}

function hlStep(step) {
  document.querySelectorAll('.sb').forEach((b, i) => {
    if (i >= S.seqLen) {
      b.className = 'sb dimmed';
      return;
    }
    b.className = 'sb' + (S.seqPat[i] ? ' on' : '') + (i === step ? ' pl' : '');
    // Probability indicator
    if (S.seqProb[i] < 100 && S.seqPat[i]) {
      b.style.opacity = (S.seqProb[i] / 100 * 0.7 + 0.3).toFixed(2);
    } else {
      b.style.opacity = '';
    }
    // Param lock indicator — red border on locked steps
    if (S.seqLocks[i] && Object.keys(S.seqLocks[i]).length > 0) {
      b.style.boxShadow = i === step ? '' : '0 0 4px rgba(255,68,68,.5)';
      if (i !== step) b.style.borderColor = '#ff4444';
    } else if (i !== step) {
      b.style.boxShadow = '';
    }
  });
  document.querySelectorAll('.vb2').forEach((b, i) => {
    if (i >= S.seqLen) {
      b.className = 'vb2 dimmed';
      b.textContent = '';
      return;
    }
    const v = S.seqVowels[i];
    b.textContent = v;
    b.style.color = VC[v] || '#aaa';
    b.style.borderColor = i === S.selVStep ? (VC[v] + '66') : '#121212';
    b.style.background = i === S.selVStep ? (VC[v] + '22') : '#070707';
    b.className = 'vb2' + (i === step && S.vowelOn ? ' pl' : '');
  });
}

// Pattern bank operations
function saveCurrentPattern() {
  const p = PATTERNS[S.curPattern];
  p.pat = S.seqPat.slice();
  p.notes = S.seqNotes.slice();
  p.vel = S.seqVel.slice();
  p.prob = S.seqProb.slice();
  p.vowels = S.seqVowels.slice();
  p.locks = JSON.parse(JSON.stringify(S.seqLocks));
  p.len = S.seqLen;
}

function loadPattern(idx) {
  saveCurrentPattern();
  S.curPattern = idx;
  const p = PATTERNS[idx];
  S.seqPat = p.pat;
  S.seqNotes = p.notes;
  S.seqVel = p.vel;
  S.seqProb = p.prob;
  S.seqVowels = p.vowels;
  S.seqLocks = JSON.parse(JSON.stringify(p.locks));
  S.seqLen = p.len;
  rebuildSeqGrid();
  hlStep(S.seqStep);
  updNS();
  updPatternBtns();
  if (typeof updSeqLenDisp === 'function') updSeqLenDisp();
}

function updPatternBtns() {
  document.querySelectorAll('.pat-btn').forEach((b, i) => {
    st(b, i === S.curPattern, '#ffcc00');
  });
}
