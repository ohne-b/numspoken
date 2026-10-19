export function createNumberSequence(
  min: number,
  max: number,
  random = Math.random,
) {
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
  let remaining = count;
  let previous = -1;
  // Store only moved entries of a virtual shuffled range, even for twelve-digit ranges.
  const swaps = new Map<number, number>();
  const next = () => {
    if (remaining === 0) {
      remaining = count;
      swaps.clear();
    }
    const omitPrevious = remaining === count && count > 1 && previous >= 0;
    let index = Math.floor(random() * (remaining - Number(omitPrevious)));
    if (omitPrevious && index >= previous) index++;
    const value = swaps.get(index) ?? index;
    const last = remaining - 1;
    if (index !== last) swaps.set(index, swaps.get(last) ?? last);
    swaps.delete(last);
    remaining--;
    previous = value;
    return min + value;
  };
  return { first: next(), next };
}
export const MAX_NUMBER = 999_999_999_999;
