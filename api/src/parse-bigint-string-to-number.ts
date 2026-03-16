/**
 * Parse a string representing a big integer into a number, assuming a certain
 * amount of decimals.
 *
 * @param string - The string representing the big integer.
 * @param decimals - The number of decimal places.
 * @returns The parsed number.
 */
export default function parseBigIntStringToNumber(
  string: string,
  decimals: number = 0,
): number {
  if (decimals === 0) {
    return Number.parseInt(string);
  }
  const padded = string.padStart(decimals + 1, "0");
  const integerPart = padded.slice(0, -decimals);
  const fractionalPart = padded.slice(-decimals);
  return Number.parseFloat(`${integerPart}.${fractionalPart}`);
}
