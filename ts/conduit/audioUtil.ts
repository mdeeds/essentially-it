export class AudioUtil {
  public static midiToHz(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public static voltsToHz(v: number) {
    return Math.pow(2, v) * AudioUtil.midiToHz(60);
  }

  public static midiToVolts(midi: number) {
    return (midi - 60) / 12;
  }

  // This node helps remove digital distortion.  It is very linear around
  // zero giving about an 8x gain.  The intention is that the input is
  // scaled down by a factor of 8 so that outputs between ~-0.5 to 0.5 are
  // roughly unmodified.  Saturation is a decrease in response for high
  // volume signals.
  public static makeSaturation(audioCtx: AudioContext): WaveShaperNode {
    const saturation = audioCtx.createWaveShaper();
    const numSamples = 1001;
    const curve = new Float32Array(numSamples);
    let x = -8;
    let dx = 16 / (numSamples - 1);

    // We have solved for alpha and k such that:
    // y(x) = k * atan(alpha * x)
    // y'(0) = 8
    // y(0) = 1
    // https://www.wolframalpha.com/input?i=a%2F8+%3D+atan%28a%29
    const alpha = 11.8954;
    const k = 8 / alpha;

    for (let i = 0; i < numSamples; ++i) {
      curve[i] = k * Math.atan(alpha * x);
      x += dx;
    }
    saturation.curve = curve;
    return saturation;
  }

}