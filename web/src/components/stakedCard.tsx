import { InfoCard } from "components/base/infoCard";
import { StakedIcon } from "components/icons/stakedIcon";
import { useAnalyticsStaked } from "hooks/useAnalyticsStaked";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { usePrices } from "hooks/usePrices";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { TokenWithGateway } from "types";
import { formatTokenAmountUsd } from "utils/currency";

type Props = {
  peggedToken: TokenWithGateway | undefined;
};

export function StakedCard({ peggedToken }: Props) {
  const { t } = useTranslation();
  const { isError: isPeggedTokensError } = usePeggedTokensByGateway();
  const {
    data: staked,
    isError: isStakedError,
    isLoading: isStakedLoading,
  } = useAnalyticsStaked(peggedToken?.gatewayAddress);
  const { data: prices, isError: isPricesError } = usePrices();

  const isError = isPeggedTokensError || isStakedError || isPricesError;

  function formatStakedAmount() {
    if (isError || !peggedToken || !staked || !prices) {
      return undefined;
    }
    return formatTokenAmountUsd({
      amount: staked.staked,
      prices,
      token: peggedToken,
    });
  }

  function renderLabel() {
    if (!peggedToken) {
      return <Skeleton width={160} />;
    }
    return t("pages.earn.staked-label", { symbol: peggedToken.symbol });
  }

  return (
    <InfoCard
      data={formatStakedAmount()}
      icon={<StakedIcon className="text-blue-500" />}
      isLoading={!isError && (!peggedToken || isStakedLoading || !prices)}
      label={renderLabel()}
      render={(value) => value}
    />
  );
}
