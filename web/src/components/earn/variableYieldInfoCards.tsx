import { InfoCard } from "components/base/infoCard";
import { ExitCooldownCard } from "components/exitCooldownCard";
import { SparklesIcon } from "components/icons/sparklesIcon";
import { StakedCard } from "components/stakedCard";
import { useApy } from "hooks/useApy";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

const ApyCard = function ({
  stakingVaultAddress,
}: {
  stakingVaultAddress: Address;
}) {
  const { t } = useTranslation();
  const { data: apy, isLoading } = useApy(stakingVaultAddress);

  return (
    <InfoCard
      data={apy}
      icon={<SparklesIcon className="text-blue-500" />}
      isLoading={isLoading}
      label={t("pages.earn.variable-yield.apy")}
      render={(value) => `${value.toFixed(2)}%`}
    />
  );
};

type Props = {
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

export const VariableYieldInfoCards = ({
  peggedToken,
  stakingVaultAddress,
}: Props) => (
  <div className="grid border-b border-gray-200 xl:grid-cols-[1fr_3.5rem_1fr]">
    <div className="xl:pl-14">
      <ApyCard stakingVaultAddress={stakingVaultAddress} />
    </div>
    <div className="hidden size-full border-b border-gray-200 xl:block" />
    <div className="xl:pr-14">
      <StakedCard peggedToken={peggedToken} />
    </div>
    <div className="xl:pl-14 xl:*:border-0">
      <ExitCooldownCard peggedToken={peggedToken} />
    </div>
  </div>
);
