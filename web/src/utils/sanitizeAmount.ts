const positiveFixedPointNumberRx = /^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))$/;

const validateNumber = function (value: string) {
  // Coerce from string
  let _value: string | number = value.trim();
  if (!_value.match(positiveFixedPointNumberRx)) {
    return { error: "Must be a positive number", value };
  }
  _value = Number.parseFloat(_value);
  // Validate
  if (_value === Infinity || isNaN(_value)) {
    return { error: "Must be a finite number", value };
  }
  // Validated!
  return { value: _value };
};

export const sanitizeAmount = function (
  input: string,
): { error: string } | { value: string } {
  // If the user cleared the input, just set it to "0".
  if (!input) {
    return { value: "0" };
  }
  // Verify the input can be parsed as a valid number.
  const { error, value } = validateNumber(input);
  if (error) {
    return { error };
  }

  const _value = input
    // Remove any leading zeroes to address cases like "01", that must be
    // converted to "1".
    .replace(/^0+/, "")
    // Remove any empty spaces at the beginning or end of the input
    .trim();
  // if input ends with a dot, add a zero so it is a valid number.
  if (_value.startsWith(".")) {
    return { value: `0${_value}` };
  }
  // Input may be "0", "00", "000..." or any combination, but all are equal to 0.
  // So just return "0" in that case
  if (value === 0) {
    return { value: "0" };
  }
  return { value: _value };
};
