import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import type { Token } from "@vetro-protocol/core";
import { DisplayAmount } from "components/base/displayAmount";
import { InfoCard } from "components/base/infoCard";
import { BoltIcon } from "components/icons/boltIcon";
import { TrendingUpIcon } from "components/icons/trendingUpIcon";
import { TokenLogo } from "components/tokenLogo";
import { useEarnedAmountUsd } from "hooks/useEarnedAmountUsd";
import { useMainnet } from "hooks/useMainnet";
import { useStakedUsd } from "hooks/useStakedUsd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatUsd } from "utils/currency";
import type { Address } from "viem";

const SymbolContainer = ({ children }: { children?: ReactNode }) => (
  <span className="text-gray-500">{children}</span>
);

const ShareBalance = function ({ shareToken }: { shareToken: Token }) {
  const chain = useMainnet();
  const { data: shareBalance } = useTokenBalance({
    address: shareToken.address,
    chainId: chain.id,
  });

  if (shareBalance === undefined) {
    return null;
  }

  return (
    <span className="text-caption flex items-center gap-x-1 text-gray-900">
      <TokenLogo {...shareToken} size="xSmall" />
      <DisplayAmount
        amount={shareBalance}
        symbolContainer={SymbolContainer}
        token={shareToken}
      />
    </span>
  );
};

type Props = {
  shareToken: Token;
  stakingVaultAddress: Address;
};

const PositionCard = function ({ shareToken, stakingVaultAddress }: Props) {
  const { t } = useTranslation();
  const { data: stakedUsd, isLoading } = useStakedUsd(stakingVaultAddress);

  return (
    <InfoCard
      data={stakedUsd}
      icon={<BoltIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.earn.variable-yield.your-position")}
      render={(value) => (
        <span className="flex items-center gap-x-3">
          {formatUsd(value)}
          <ShareBalance shareToken={shareToken} />
        </span>
      )}
    />
  );
};

const EarnedAmountCard = function ({
  stakingVaultAddress,
}: {
  stakingVaultAddress: Address;
}) {
  const { t } = useTranslation();
  const { data: earnedUsd, isLoading } =
    useEarnedAmountUsd(stakingVaultAddress);

  return (
    <InfoCard
      data={earnedUsd}
      icon={<TrendingUpIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.earn.stats.earned-amount")}
      render={formatUsd}
    />
  );
};

export const VariableYieldPositionCards = ({
  shareToken,
  stakingVaultAddress,
}: Props) => (
  <div className="grid border-b border-gray-200 xl:grid-cols-[1fr_3.5rem_1fr]">
    <div className="xl:pl-14 xl:*:border-0">
      <PositionCard
        shareToken={shareToken}
        stakingVaultAddress={stakingVaultAddress}
      />
    </div>
    <div className="hidden xl:block" />
    <div className="xl:pr-14 xl:*:border-0">
      <EarnedAmountCard stakingVaultAddress={stakingVaultAddress} />
    </div>
  </div>
);
