import type { Address } from "viem";

import { useToken } from "../../hooks/targetYieldPool/useToken";
import { PoolContract } from "../poolInfoBar/poolContract";
import { PoolToken } from "../poolInfoBar/poolToken";

import { PoolDeposits } from "./poolDeposits";
import { PoolStakedAmount } from "./poolStakedAmount";
import { PoolTargetApy } from "./poolTargetApy";
import { PoolTermState } from "./poolTermState";

type Props = {
  vaultAddress: Address;
};

export function PoolInfoBar({ vaultAddress }: Props) {
  const { data: peggedToken } = useToken();

  return (
    <div className="flex flex-col gap-6 border-b border-gray-200 bg-white p-4 sm:gap-4 md:flex-row md:items-center md:px-16 md:py-6">
      <div className="grid min-w-0 grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-center-safe sm:gap-6 sm:overflow-x-auto md:justify-start md:gap-8">
        <PoolToken peggedToken={peggedToken} />
        <PoolContract address={vaultAddress} />
        <PoolDeposits />
        <PoolTargetApy />
        <PoolTermState />
        <PoolStakedAmount />
      </div>
    </div>
  );
}
