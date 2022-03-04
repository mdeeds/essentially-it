import { Graphiti, Stroke } from "./graphiti";

const g = new Graphiti();

function testStroke(stroke: Stroke, expected: string) {
  const actual = g.recognize(stroke);
  if (expected != actual) {
    console.error(`Expected: ${expected}, got ${actual}`);
  }
}

testStroke(Stroke.fromClock("15"), "a");
testStroke(Stroke.fromClock("604848"), "b");
testStroke(Stroke.fromClock("65432101234567876545678889"), "b");
testStroke(Stroke.fromClock("a8642"), "c");
testStroke(Stroke.fromClock("9966644222"), "c");
testStroke(Stroke.fromClock("36"), "t");

testStroke(Stroke.fromHours(
  [0.2, 0.2, 0.2, 0.4, 0.5, 0.5, 0.6, 0.6, 0.6, 0.6, 0.6, 0.7, 0.7, 0.7,
    0.7, 0.7, 0.7, 0.7, 0.7, 0.8, 0.8, 1.1, 2.1, 3.7, 4.8, 5.2, 5.4, 5.5,
    5.6, 5.6, 5.6, 5.6, 5.6, 5.6, 5.6, 5.5, 5.5, 5.5, 5.5]), "a");