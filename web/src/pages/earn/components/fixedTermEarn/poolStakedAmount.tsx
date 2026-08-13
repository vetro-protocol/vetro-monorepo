import { RenderFiatValue } from "components/base/fiatValue";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

import { useStakedAmount } from "../../hooks/targetYieldPool/useStakedAmount";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

export function PoolStakedAmount() {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const { data: stakedAmount, isError, isPending } = useStakedAmount();

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
