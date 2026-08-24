import { InfoCard } from "components/base/infoCard";
import { ExitCooldownIcon } from "components/icons/exitCooldownIcon";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { usePrices } from "hooks/usePrices";
import { useVariableStakeExitQueue } from "hooks/useVariableStakeExitQueue";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatTokenAmountUsd } from "utils/currency";

type Props = {
  peggedToken: TokenWithGateway | undefined;
};

export function ExitCooldownCard({ peggedToken }: Props) {
  const { t } = useTranslation();
  const { isError: isPeggedTokensError } = usePeggedTokensByGateway();
  const {
    data: exitQueue,
    isError: isExitQueueError,
    isLoading: isExitQueueLoading,
  } = useVariableStakeExitQueue(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = isPeggedTokensError || isExitQueueError || isPricesError;

  function formatCooldownAmount() {
    if (isError || !peggedToken || !exitQueue || !prices) {
      return undefined;
    }
    return formatTokenAmountUsd({
      amount: exitQueue.assetsInCooldown,
      prices,
      token: peggedToken,
    });
  }

  function renderLabel() {
    if (!peggedToken) {
      return <Skeleton width={240} />;
    }
    return t("pages.earn.exit-cooldown-label", { symbol: peggedToken.symbol });
  }

  return (
    <InfoCard
      data={formatCooldownAmount()}
      icon={<ExitCooldownIcon className="text-blue-500" />}
      isLoading={!isError && (!peggedToken || isExitQueueLoading || !prices)}
      label={renderLabel()}
      render={(value) => value}
    />
  );
}
