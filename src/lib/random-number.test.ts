import { expect, it } from 'vitest';
import { MAX_NUMBER, createNumberSequence } from './random-number';

it('uses every number once per cycle without repeating across cycle boundaries', () => {
  for (const random of [() => 0, () => 0.999999999999, () => 0.5]) {
    for (const [min, max] of [
      [0, 1],
      [10, 14],
      [MAX_NUMBER - 4, MAX_NUMBER],
    ]) {
      const sequence = createNumberSequence(min, max, random);
      const count = max - min + 1;
      let current = sequence.first;
      let previous: number | undefined;
      for (let cycle = 0; cycle < 4; cycle++) {
        const seen = new Set<number>();
        for (let i = 0; i < count; i++) {
          expect(current).toBeGreaterThanOrEqual(min);
          expect(current).toBeLessThanOrEqual(max);
          expect(current).not.toBe(previous);
          expect(seen.has(current)).toBe(false);
          seen.add(current);
          previous = current;
          current = sequence.next();
        }
        expect(seen.size).toBe(count);
      }
    }
  }
});

it('can produce every permutation through equally likely draw buckets', () => {
  const permutations = new Set<string>();
  for (let first = 0; first < 4; first++) {
    for (let second = 0; second < 3; second++) {
      for (let third = 0; third < 2; third++) {
        const draws = [
          (first + 0.5) / 4,
          (second + 0.5) / 3,
          (third + 0.5) / 2,
          0,
        ];
        const sequence = createNumberSequence(0, 3, () => draws.shift()!);
        const values = [
          sequence.first,
          sequence.next(),
          sequence.next(),
          sequence.next(),
        ];
        expect([...values].sort()).toEqual([0, 1, 2, 3]);
        permutations.add(values.join(','));
      }
    }
  }
  expect(permutations.size).toBe(24);
});

it('handles singleton and twelve-digit ranges without allocating the whole range', () => {
  const singleton = createNumberSequence(MAX_NUMBER, MAX_NUMBER);
  expect(singleton.first).toBe(MAX_NUMBER);
  expect(singleton.next()).toBe(MAX_NUMBER);
  expect(singleton.next()).toBe(MAX_NUMBER);
  const large = createNumberSequence(0, MAX_NUMBER, () => 0);
  const values = [large.first, ...Array.from({ length: 1000 }, large.next)];
  expect(values[0]).toBe(0);
  expect(values[1]).toBe(MAX_NUMBER);
  expect(new Set(values).size).toBe(values.length);
  expect(createNumberSequence(0, MAX_NUMBER, () => 0.999999999999).first).toBe(
    MAX_NUMBER,
  );
});

it('keeps exclusions within each sequence', () => {
  const firstVisit = createNumberSequence(0, 100, () => 0);
  const secondVisit = createNumberSequence(0, 100, () => 0);
  expect(firstVisit.first).toBe(secondVisit.first);
  firstVisit.next();
  firstVisit.next();
  expect(secondVisit.next()).toBe(100);
});

it('rejects invalid ranges', () => {
  for (const [min, max] of [
    [1, 0],
    [-1, 10],
    [0, MAX_NUMBER + 1],
    [0.5, 10],
    [0, 1.5],
    [NaN, 10],
    [0, Infinity],
  ])
    expect(() => createNumberSequence(min, max)).toThrow(RangeError);
});
