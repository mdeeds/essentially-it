type SampleCallback = (samples: Float32Array, peak: number) => void;

export class SampleSource {
  private listener: SampleCallback = null;
  constructor(private audioCtx: AudioContext,
    private source: AudioNode) {
    this.setUp();
  }

  public setListener(callback: SampleCallback) {
    this.listener = callback;
  }

  private async setUp() {
    await this.audioCtx.audioWorklet.addModule(
      `sampleSourceWorker.js?buster=${Math.random().toFixed(6)}`);
    const worklet = new AudioWorkletNode(this.audioCtx, 'sample-source');
    worklet.parameters.get('SampleRate').setValueAtTime(
      this.audioCtx.sampleRate, this.audioCtx.currentTime);

    let workerStartTime = this.audioCtx.currentTime;
    let workerElapsedFrames = 0;

    worklet.port.onmessage = (event) => {
      setTimeout(() => {
        workerElapsedFrames += event.data.newSamples.length;
        const chunkEndTime = workerStartTime +
          workerElapsedFrames / this.audioCtx.sampleRate;
        if (this.listener) {
          this.listener(event.data.newSamples, event.data.peak);
        }

      }, 0);
    }

    this.source.connect(worklet);
  }
}