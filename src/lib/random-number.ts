export function randomNumber(
  min: number,
  max: number,
  previous?: number,
  random = Math.random,
): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min < 0 ||
    max > MAX_NUMBER ||
    min > max
  ) {
    throw new RangeError(
      `Use a whole-number range between 0 and ${MAX_NUMBER}.`,
    );
  }
  const count = max - min + 1;
  if (count === 1) return min;
  const omit = previous !== undefined && previous >= min && previous <= max;
  const pick = min + Math.floor(random() * (count - Number(omit)));
  return omit && pick >= previous ? pick + 1 : pick;
}
export const MAX_NUMBER = 999_999_999_999;
