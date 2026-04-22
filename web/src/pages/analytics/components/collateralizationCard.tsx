import { useCollateralizationRatio } from "hooks/useCollateralizationRatio";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { formatPercentage } from "utils/format";

import { ShieldIcon } from "../icons/shieldIcon";
import { assignColor, toCollateralizationItems } from "../utils";

import { AllocationCard } from "./allocationCard";

type Props = {
  peggedToken: TokenWithGateway | undefined;
  peggedTokenError: boolean;
};

export const CollateralizationCard = function ({
  peggedToken,
  peggedTokenError,
}: Props) {
  const { t } = useTranslation();
  const {
    data: collateralization,
    isError: isCollateralizationError,
    isLoading: isCollateralizationLoading,
  } = useCollateralizationRatio();

  const isError = peggedTokenError || isCollateralizationError;
  const isLoading = !isError && (!peggedToken || isCollateralizationLoading);

  const value =
    collateralization && collateralization.vusdSupply > 0
      ? formatPercentage(
          (collateralization.total / collateralization.vusdSupply) * 100,
        )
      : "";

  const items = toCollateralizationItems(collateralization, {
    liquidReserves: t("pages.analytics.liquid-reserves-label"),
    strategicReserves: t("pages.analytics.strategic-reserves-label"),
    surplus: t("pages.analytics.surplus-label"),
  })?.map((item, index) => ({ ...item, color: assignColor(index) }));

  return (
    <AllocationCard
      formatAmount={formatPercentage}
      icon={<ShieldIcon />}
      isError={isError}
      isLoading={isLoading}
      items={items}
      label={t("pages.analytics.collateralization-ratio-label")}
      value={value}
    />
  );
};
