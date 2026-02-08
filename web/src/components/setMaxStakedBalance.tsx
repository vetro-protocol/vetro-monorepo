import { useStakedBalance } from "hooks/useStakedBalance";
import { formatUnits } from "viem";

import { MaxButton } from "./base/maxButton";

type Props = {
  decimals: number;
  disabled?: boolean;
  onClick: (maxValue: string) => void;
};

export function SetMaxStakedBalance({
  decimals,
  disabled = false,
  onClick,
}: Props) {
  const { data: stakedBalance } = useStakedBalance();

  const isDisabled =
    disabled || stakedBalance === undefined || stakedBalance === 0n;

  function handleClick() {
    if (!isDisabled) {
      onClick(formatUnits(stakedBalance, decimals));
    }
  }

  return <MaxButton disabled={isDisabled} onClick={handleClick} />;
}
