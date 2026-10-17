import { expect, it } from 'vitest';
import { randomNumber } from './randomNumber';

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
  expect(randomNumber(999999, 999999, 999999)).toBe(999999);
  expect(randomNumber(0, 999999, undefined, () => 0.999999)).toBe(999999);
  expect(() => randomNumber(1, 0)).toThrow(RangeError);
  expect(() => randomNumber(-1, 10)).toThrow(RangeError);
  expect(() => randomNumber(0, 1000000)).toThrow(RangeError);
  expect(() => randomNumber(0.5, 10)).toThrow(RangeError);
});
