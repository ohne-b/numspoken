import { expect, it } from 'vitest';
import { MAX_NUMBER, randomNumber } from './random-number';

it('samples every allowed value once across evenly spaced probability buckets', () => {
  for (const previous of [undefined, 0, 1, 2, 3]) {
    const expected = [0, 1, 2, 3].filter((n) => n !== previous);
    const actual = expected.map((_, i) =>
      randomNumber(0, 3, previous, () => (i + 0.5) / expected.length),
    );
    expect(actual).toEqual(expected);
  }
});
it('handles singleton and extreme ranges without loops', () => {
  expect(randomNumber(MAX_NUMBER, MAX_NUMBER, MAX_NUMBER)).toBe(MAX_NUMBER);
  expect(randomNumber(0, MAX_NUMBER, undefined, () => 0.999999999999)).toBe(
    MAX_NUMBER,
  );
  expect(randomNumber(0, MAX_NUMBER, undefined, () => 0)).toBe(0);
  expect(randomNumber(MAX_NUMBER - 1, MAX_NUMBER, MAX_NUMBER)).toBe(
    MAX_NUMBER - 1,
  );
  expect(randomNumber(MAX_NUMBER - 1, MAX_NUMBER, MAX_NUMBER - 1)).toBe(
    MAX_NUMBER,
  );
  expect(() => randomNumber(1, 0)).toThrow(RangeError);
  expect(() => randomNumber(-1, 10)).toThrow(RangeError);
  expect(() => randomNumber(0, MAX_NUMBER + 1)).toThrow(RangeError);
  expect(() => randomNumber(0.5, 10)).toThrow(RangeError);
});
