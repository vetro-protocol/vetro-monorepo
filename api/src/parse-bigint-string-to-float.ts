/**
 * Parse a string representing a big integer into a float, assuming a certain number of decimals.
 *
 * @param string - The string representing the big integer.
 * @param decimals - The number of decimal places.
 * @returns The parsed float.
 */
export default function parseBigIntStringToFloat(
  string: string,
  decimals: number = 0,
): number {
  const padded = string.padStart(decimals + 1, "0");
  const integerPart = padded.slice(0, -decimals);
  const fractionalPart = padded.slice(-decimals);
  return Number.parseFloat(`${integerPart}.${fractionalPart}`);
}
