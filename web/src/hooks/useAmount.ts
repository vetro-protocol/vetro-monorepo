import { useState } from "react";
import { sanitizeAmount } from "utils/sanitizeAmount";

export const useAmount = function (initialValue: string = "0") {
  const [amount, setAmount] = useState(initialValue);

  function onChange(input: string) {
    const result = sanitizeAmount(input);
    if ("value" in result) {
      setAmount(result.value);
    }
  }

  return [amount, onChange] as const;
};
