export class AudioHelper {
  static async getMicrophoneSource(audioCtx: AudioContext): Promise<AudioNode> {
    return new Promise<AudioNode>(async (resolve, reject) => {
      if (!navigator.mediaDevices.getUserMedia) {
        reject("No navigator.mediaDevices.getUserMedia");
      };
      var constraints = {
        audio: true,
        video: false,
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppersion: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      resolve(audioCtx.createMediaStreamSource(stream));
    });
  }
}