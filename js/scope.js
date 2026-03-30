// ============================================================================
// WUBSTATION 9000 v6 — OSCILLOSCOPE & VISUALIZATIONS
// ============================================================================
'use strict';

let raf;
let scopeMode = 'wave'; // 'wave' or 'spectrum'

const cv = document.getElementById('scope'), cx = cv.getContext('2d');

function rsz() {
  cv.width = cv.offsetWidth * devicePixelRatio;
  cv.height = cv.offsetHeight * devicePixelRatio;
  cx.scale(devicePixelRatio, devicePixelRatio);
}
rsz();
window.addEventListener('resize', rsz);

// Click scope to toggle between waveform and spectrum
cv.addEventListener('click', () => {
  scopeMode = scopeMode === 'wave' ? 'spectrum' : 'wave';
});

function drawIdle() {
  const W = cv.offsetWidth, H = cv.offsetHeight;
  cx.fillStyle = '#010701'; cx.fillRect(0, 0, W, H);
  cx.strokeStyle = 'rgba(0,255,136,.05)'; cx.lineWidth = 1;
  for (let x = 0; x <= W; x += W / 8) {
    cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke();
  }
  cx.strokeStyle = 'rgba(0,255,136,.1)';
  cx.beginPath(); cx.moveTo(0, H / 2); cx.lineTo(W, H / 2); cx.stroke();
}
drawIdle();

function startScope() {
  const timeBuf = new Uint8Array(an.fftSize);
  const freqBuf = new Uint8Array(an.frequencyBinCount);
  let h = 120;
  const t = () => {
    raf = requestAnimationFrame(t);
    if (!an) return;
    const W = cv.offsetWidth, Ha = cv.offsetHeight;

    if (scopeMode === 'spectrum') {
      // Spectrum analyzer
      an.getByteFrequencyData(freqBuf);
      cx.fillStyle = 'rgba(1,7,1,.5)'; cx.fillRect(0, 0, W, Ha);
      // Grid
      cx.strokeStyle = 'rgba(0,255,136,.03)'; cx.lineWidth = 1;
      for (let x = 0; x <= W; x += W / 8) {
        cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, Ha); cx.stroke();
      }
      // Bars
      const barCount = 64;
      const barW = W / barCount;
      const binStep = Math.floor(freqBuf.length / barCount);
      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        for (let j = 0; j < binStep; j++) sum += freqBuf[i * binStep + j];
        const avg = sum / binStep;
        const barH = (avg / 255) * Ha;
        const hue = 120 - (avg / 255) * 120;
        cx.fillStyle = `hsla(${hue},100%,50%,.7)`;
        cx.fillRect(i * barW + 1, Ha - barH, barW - 2, barH);
      }
    } else {
      // Waveform (original oscilloscope)
      an.getByteTimeDomainData(timeBuf);
      let ma = 0;
      for (let i = 0; i < timeBuf.length; i++) ma = Math.max(ma, Math.abs(timeBuf[i] - 128));
      h = Math.max(0, 120 - (ma / 128) * 140);
      cx.fillStyle = 'rgba(1,7,1,.38)'; cx.fillRect(0, 0, W, Ha);
      cx.strokeStyle = 'rgba(0,255,136,.04)'; cx.lineWidth = 1;
      for (let x = 0; x <= W; x += W / 8) {
        cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, Ha); cx.stroke();
      }
      cx.lineWidth = 2;
      cx.strokeStyle = `hsl(${h},100%,55%)`;
      cx.shadowBlur = 10; cx.shadowColor = `hsl(${h},100%,65%)`;
      cx.beginPath();
      const sl = W / timeBuf.length;
      for (let i = 0; i < timeBuf.length; i++) {
        const x = i * sl, y = (timeBuf[i] / 128) * (Ha / 2);
        i === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y);
      }
      cx.stroke(); cx.shadowBlur = 0;
    }
  };
  t();
}

function updFViz() {
  const fc = Math.pow(Math.max(S.cutoff - 80, 20) / 8000, .38) * 200, r = S.reso;
  let p;
  if (S.filterType === 'bandpass')
    p = `M 0 46 L ${Math.max(0, fc - 25)} 46 Q ${fc} ${46 - r * 1.6} ${Math.min(fc + 35, 248)} 46 L 250 46`;
  else if (S.filterType === 'highpass')
    p = `M 0 46 L ${fc} 46 Q ${fc + r} ${46 - r * 1.4} ${fc + 14} 8 L 250 8`;
  else if (S.filterType === 'notch')
    p = `M 0 8 L ${fc - 18} 8 Q ${fc} 46 ${fc + 18} 8 L 250 8`;
  else
    p = `M 0 8 L ${fc} 8 Q ${fc + r} ${8 + r * 1.4} ${fc + 14} 46 L 250 46`;
  document.getElementById('fl').setAttribute('d', p);
  document.getElementById('ff').setAttribute('d', p + ' L 250 0 L 0 0 Z');
}
updFViz();

function updAdsr() {
  const A = S.attack, D = S.decay, SU = S.sustain, R = S.release;
  const W = 220, H = 40, pad = 4, tot = A + D + .15 + R;
  const sc = v => (v / tot) * (W - pad * 2) + pad;
  const sh = v => H - v * (H - 6) - 3;
  document.getElementById('ap').setAttribute('d',
    `M ${pad} ${sh(0)} L ${sc(A)} ${sh(1)} L ${sc(A + D)} ${sh(SU)} L ${sc(A + D + .15)} ${sh(SU)} L ${W - pad} ${sh(0)} Z`);
}
updAdsr();
