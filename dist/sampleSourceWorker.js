class Oscillator {
  constructor(w) {
    const a = 0.099 / (Math.log(27.5 / 4186));
    const b = 0.1 - a * Math.log(27.5);

    this.w = w;
    this.m = 0.01 * Math.pow(27.5 / w, 2);
    this.k = this.m * w * w * Math.PI * 2 * Math.PI * 2;
    this.x = 0;
    this.v = 0;
    this.e = 0;
    this.meanRate = 0.999;
    this.dampRate = Math.pow(0.5, 1 / (3 * (48000 / w)));
  }

  addSamples(samples, dt) {
    for (const s of samples) {
      const f = -this.k * this.x + s;
      const a = f / this.m;
      this.v += a * dt;
      this.x += this.v * dt;
      this.e = this.mix(this.e, Math.abs(this.x), this.meanRate);
      this.x *= this.dampRate;
    }
  }

  mix(a, b, p) {
    return p * a + (1 - p) * b;
  }
}

class SampleSourceWorker extends AudioWorkletProcessor {
  _callCount = 0;
  _oscillators = [];
  constructor() {
    super();
    for (let w = 27.5;
      this._oscillators.length < 88;
      w *= Math.pow(2, 1 / 12)) {
      this._oscillators.push(new Oscillator(w));
    }

    this.freq = 440;
    this.t = 0;
    this.a = Math.PI * 2 * this.freq;
  }

  static get parameterDescriptors() {
    return [{
      name: 'SampleRate',
      defaultValue: 48000,
      minValue: 1,
      maxValue: 96000,
      automationRate: 'k-rate',
    }]
  }

  getRaw(raw) {
    return raw;
  }

  getFreq(raw, sampleRate) {
    const dt = 1 / sampleRate;
    const result = new Float32Array(this._oscillators.length);
    for (let i = 0; i < this._oscillators.length; ++i) {
      const o = this._oscillators[i];
      o.addSamples(raw, dt);
      // o.addSamples(rand, dt);
      result[i] = o.e * 100;
    }
    return result;
  }

  process(inputs, outputs, parameters) {
    if (inputs.length === 0) {
      throw new Error("No inputs.");
    }
    if (inputs[0].length > 0) {
      ++this._callCount;
      let peak = 0;
      for (const f of inputs[0][0]) {
        if (peak < f) peak = f;
      }
      this.port.postMessage({
        newSamples: this.getFreq(inputs[0][0], parameters['SampleRate'][0]),
        peak: peak
      });
    }
    return true;
  }
}
registerProcessor('sample-source', SampleSourceWorker);
