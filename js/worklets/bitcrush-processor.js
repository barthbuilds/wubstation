// ============================================================================
// WUBSTATION 9000 — AudioWorklet Bitcrusher
// ============================================================================
// True sample-rate reduction + bit-depth reduction.
// The v5 WaveShaper approach only does bit-depth; this also holds samples
// for N frames to simulate lower sample rates.

class BitcrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'bits', defaultValue: 16, minValue: 1, maxValue: 16 },
      { name: 'rateReduction', defaultValue: 1, minValue: 1, maxValue: 40 },
    ];
  }

  constructor() {
    super();
    this._held = 0;
    this._counter = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    for (let ch = 0; ch < input.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      const bits = parameters.bits.length > 1 ? parameters.bits : null;
      const rate = parameters.rateReduction.length > 1 ? parameters.rateReduction : null;
      const bitsVal = bits ? 0 : parameters.bits[0];
      const rateVal = rate ? 0 : parameters.rateReduction[0];

      for (let i = 0; i < inp.length; i++) {
        const b = bits ? bits[i] : bitsVal;
        const r = rate ? rate[i] : rateVal;
        const step = Math.pow(2, Math.max(1, Math.round(b)) - 1);

        // Sample-rate reduction: hold every Nth sample
        this._counter++;
        if (this._counter >= r) {
          this._counter = 0;
          this._held = Math.round(inp[i] * step) / step;
        }
        out[i] = this._held;
      }
    }
    return true;
  }
}

registerProcessor('bitcrush-processor', BitcrushProcessor);
