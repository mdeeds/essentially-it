export class AudioUtil {
  public static MidiToHz(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  public static VoltsToHz(v: number) {
    return Math.pow(2, v) * AudioUtil.MidiToHz(60);
  }

  public static MidiToVolts(midi: number) {
    return (midi - 60) / 12;
  }

}