class SampleSourceWorker extends AudioWorkletProcessor {
  _callCount = 0;
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    if (inputs.length === 0) {
      throw new Error("No inputs.");
    }
    if (inputs[0].length > 0) {
      ++this._callCount;
      this.port.postMessage({
        newSamples: inputs[0][0]
      });
    }
    return true;
  }
}
registerProcessor('sample-source', SampleSourceWorker);
