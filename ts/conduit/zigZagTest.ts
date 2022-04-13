import { ZigZag } from "./zigZag";

const zz = new ZigZag(null, null, null);

for (const currentBeatOffset of [15.8, 0.1, 0.6, 1.1]) {
  for (const x of [-0.5, 0, 0.5]) {
    const offsetForX = zz.getBeatOffsetForX(currentBeatOffset, x);
    console.log(`offset: ${currentBeatOffset} ` +
      `x: ${x} beatOffsetForX: ${offsetForX}`);
  }
}