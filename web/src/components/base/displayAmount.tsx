import { type Token } from "@vetro-protocol/core";
import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";
import { type ComponentType, type ReactNode } from "react";
import {
  formatNumber,
  formatNumberWithOptions,
  smallestFormattedNumber,
} from "utils/format";
import { formatUnits, parseUnits } from "viem/utils";

type CustomContainer = ComponentType<{
  children?: ReactNode;
}>;

const DefaultTextContainer: CustomContainer = ({ children }) => (
  <span>{children}</span>
);

type Props = {
  amount: bigint;
  amountContainer?: CustomContainer;
  container?: CustomContainer;
  symbolContainer?: CustomContainer;
  showSymbol?: boolean;
  showTokenLogo?: boolean;
  token: Token;
};

export const DisplayAmount = function ({
  amount,
  amountContainer: AmountContainer = DefaultTextContainer,
  container: Container = DefaultTextContainer,
  showSymbol = true,
  showTokenLogo = true,
  symbolContainer: SymbolContainer = DefaultTextContainer,
  token,
}: Props) {
  const stringAmount = formatUnits(amount, token.decimals);
  const formattedAmount = formatNumber(stringAmount);

  const one = parseUnits("1", token.decimals);

  const notZero = amount !== 0n;
  const belowPrecision =
    amount > 0n && amount < parseUnits(smallestFormattedNumber, token.decimals);
  // Only show dots for small numbers (x < 1), if the amount is not zero and we're truncating decimals
  const showDots =
    !belowPrecision &&
    amount < one &&
    notZero &&
    formattedAmount !== stringAmount;
  return (
    <Tooltip
      content={
        notZero ? (
          <span className="flex items-center gap-x-1">
            {showTokenLogo && <TokenLogo {...token} />}
            <span>{`${formatNumberWithOptions({
              options: {
                maximumFractionDigits: token.decimals,
                useGrouping: true,
              },
              value: stringAmount,
            })} ${token.symbol}`}</span>
          </span>
        ) : null
      }
      visible={notZero ? undefined : false}
    >
      <Container>
        <AmountContainer>{`${formattedAmount}${
          showDots ? "..." : ""
        }`}</AmountContainer>
        {showSymbol ? (
          <SymbolContainer>{` ${token.symbol}`}</SymbolContainer>
        ) : null}
      </Container>
    </Tooltip>
  );
};
