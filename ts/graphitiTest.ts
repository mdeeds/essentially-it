import { Graphiti, Stroke } from "./graphiti";

const g = new Graphiti();

function testStroke(stroke: Stroke, expected: string) {
  const actual = g.recognize(stroke);
  if (expected != actual) {
    console.error(`Expected: ${expected}, got ${actual}`);
  }
}

// testStroke(Stroke.fromClock("15"), "a");
// testStroke(Stroke.fromClock("604848"), "b");
// testStroke(Stroke.fromClock("a8642"), "c");
// testStroke(Stroke.fromClock("9966644222"), "c");
// testStroke(Stroke.fromClock("36"), "t");

testStroke(Stroke.fromClock("0000001122335888"), "p");
// testStroke(Stroke.fromClock("0000000123457889"), "p");
// testStroke(Stroke.fromClock("0000012345567788"), "d");

// testStroke(Stroke.fromHours(
//   [9.8, 9.0, 8.7, 8.3, 8.0, 7.7, 7.4, 7.2, 7.0, 6.9, 6.7, 6.5,
//     6.3, 6.1, 6.0, 5.6, 5.1, 4.6, 4.0, 3.5, 3.1, 2.9, 2.6, 2.4, 2.1, 1.8,
//     1.2, 11.8, 10.5, 10.1, 10.0, 9.9, 9.8, 2.8, 3.1, 3.1, 3.1]), "g");