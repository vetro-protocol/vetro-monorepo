type ConvertedT<T> = T extends bigint
  ? string
  : T extends (infer E)[]
    ? ConvertedT<E>[]
    : T extends object
      ? { [K in keyof T]: ConvertedT<T[K]> }
      : T;

/**
 * Recursively convert all BigInt values in an object to strings.
 *
 * @param obj - The object to convert.
 * @returns A new object with all BigInt values converted to strings.
 */
export function convertBigIntsToString<T>(obj: T): ConvertedT<T> {
  if (typeof obj === "bigint") {
    return obj.toString() as ConvertedT<T>;
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToString) as ConvertedT<T>;
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[key] = convertBigIntsToString(value);
    }
    return newObj as ConvertedT<T>;
  }
  return obj as ConvertedT<T>;
}
