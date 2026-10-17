export function randomNumber(
  min: number,
  max: number,
  previous?: number,
  random = Math.random,
): number {
  if (
    !Number.isInteger(min) ||
    !Number.isInteger(max) ||
    min < 0 ||
    max > 999_999 ||
    min > max
  ) {
    throw new RangeError('Use a whole-number range between 0 and 999,999.');
  }
  const count = max - min + 1;
  if (count === 1) return min;
  const omit = previous !== undefined && previous >= min && previous <= max;
  const pick = min + Math.floor(random() * (count - Number(omit)));
  return omit && pick >= previous ? pick + 1 : pick;
}
