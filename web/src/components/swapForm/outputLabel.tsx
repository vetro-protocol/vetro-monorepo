import type { Token } from "types";

export const OutputLabel = function ({
  fromInputValue,
  fromToken,
  outputValue,
  toToken,
}: {
  fromInputValue: string;
  fromToken: Token;
  outputValue: string;
  toToken: Token;
}) {
  if (fromInputValue === "0") {
    return null;
  }
  return (
    <>
      {`${fromInputValue} ${fromToken.symbol} = ${outputValue} ${toToken.symbol}`}
    </>
  );
};
