import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "types";
import { formatUnits } from "viem";

import { MaxButton } from "./base/maxButton";

type Props = {
  disabled?: boolean;
  onClick: (maxValue: string) => void;
  token: Token;
};

export function SetMaxErc20Balance({
  disabled = false,
  onClick,
  token,
}: Props) {
  const { data: balance } = useTokenBalance({
    address: token.address,
    chainId: token.chainId,
  });

  const isDisabled = disabled || balance === undefined || balance === 0n;

  function handleClick() {
    if (!isDisabled) {
      onClick(formatUnits(balance, token.decimals));
    }
  }

  return <MaxButton disabled={isDisabled} onClick={handleClick} />;
}
