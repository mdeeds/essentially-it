type SampleSourceResolution = (self: SampleSource) => void;
type SampleCallback = (samples: Float32Array, peak: number) => void;

export class SampleSource {
  private mediaSource: MediaStreamAudioSourceNode;
  private listener: SampleCallback = null;
  readonly audioCtx: AudioContext;

  private constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
  }

  public static make(audioCtx: AudioContext): Promise<SampleSource> {
    const self = new SampleSource(audioCtx);
    console.assert(!!navigator.mediaDevices.getUserMedia);
    var constraints = {
      audio: true,
      video: false,
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppersion: false,
    };
    return new Promise(async (resolve, reject) => {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      self.handleStream(stream, resolve);
    });
  }

  public setListener(callback: SampleCallback) {
    this.listener = callback;
  }

  private async handleStream(stream: MediaStream, resolve: SampleSourceResolution) {
    this.mediaSource = this.audioCtx.createMediaStreamSource(stream);

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

    this.mediaSource.connect(worklet);
    resolve(this);
  }
}