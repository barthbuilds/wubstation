// ============================================================================
// WUBSTATION 9000 — AudioWorklet Noise Generator
// ============================================================================
// White, pink, and brown noise without needing a buffer.

class NoiseProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'type', defaultValue: 0, minValue: 0, maxValue: 2 },
      // 0 = white, 1 = pink, 2 = brown
    ];
  }

  constructor() {
    super();
    // Pink noise state (Paul Kellet's algorithm)
    this._b0 = 0; this._b1 = 0; this._b2 = 0;
    this._b3 = 0; this._b4 = 0; this._b5 = 0; this._b6 = 0;
    // Brown noise state
    this._lastBrown = 0;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output || !output.length) return true;

    const typeArr = parameters.type;
    const typeConst = typeArr.length === 1 ? typeArr[0] : -1;

    for (let ch = 0; ch < output.length; ch++) {
      const out = output[ch];
      for (let i = 0; i < out.length; i++) {
        const t = typeConst >= 0 ? typeConst : typeArr[i];
        const white = Math.random() * 2 - 1;

        if (t < 0.5) {
          // White
          out[i] = white;
        } else if (t < 1.5) {
          // Pink (Paul Kellet)
          this._b0 = 0.99886 * this._b0 + white * 0.0555179;
          this._b1 = 0.99332 * this._b1 + white * 0.0750759;
          this._b2 = 0.96900 * this._b2 + white * 0.1538520;
          this._b3 = 0.86650 * this._b3 + white * 0.3104856;
          this._b4 = 0.55000 * this._b4 + white * 0.5329522;
          this._b5 = -0.7616 * this._b5 - white * 0.0168980;
          out[i] = (this._b0 + this._b1 + this._b2 + this._b3 +
                    this._b4 + this._b5 + this._b6 + white * 0.5362) * 0.11;
          this._b6 = white * 0.115926;
        } else {
          // Brown
          this._lastBrown = (this._lastBrown + (0.02 * white)) / 1.02;
          out[i] = this._lastBrown * 3.5;
        }
      }
    }
    return true;
  }
}

registerProcessor('noise-processor', NoiseProcessor);
