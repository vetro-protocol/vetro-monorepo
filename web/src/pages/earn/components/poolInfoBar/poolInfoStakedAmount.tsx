import { RenderFiatValue } from "components/base/fiatValue";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { usePoolStakedAmount } from "../../hooks/usePoolStakedAmount";

import { PoolInfoItem } from "./poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolInfoStakedAmount({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const {
    data: stakedAmount,
    isError,
    isPending,
  } = usePoolStakedAmount(stakingVaultAddress);

  return (
    <PoolInfoItem
      data={stakedAmount}
      isError={isError}
      isPending={!!account && isPending}
      label={t("pages.earn.pool-info.staked-amount")}
      render={({ peggedToken, stakedBalance }) => (
        <span className="text-xsm flex items-center gap-x-1 font-semibold text-gray-900">
          $
          <RenderFiatValue token={peggedToken} value={stakedBalance} />
        </span>
      )}
    />
  );
}
