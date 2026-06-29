import { RenderFiatValue } from "components/base/fiatValue";
import { useStakedBalance } from "hooks/useStakedBalance";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { useTranslation } from "react-i18next";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { PoolInfoItem } from "./poolInfoItem";

type Props = {
  stakingVaultAddress: Address;
};

export function PoolInfoStakedAmount({ stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);
  const { data: stakedBalance, status: stakedStatus } =
    useStakedBalance(stakingVaultAddress);

  return (
    <PoolInfoItem label={t("pages.earn.pool-info.staked-amount")}>
      <span className="text-xsm flex items-center gap-x-1 font-semibold text-gray-900">
        {account ? (
          <>
            $
            <RenderFiatValue
              queryStatus={stakedStatus}
              token={peggedToken}
              value={stakedBalance}
            />
          </>
        ) : (
          "-"
        )}
      </span>
    </PoolInfoItem>
  );
}
