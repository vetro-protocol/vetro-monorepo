import type { FetchStatus, QueryStatus } from "@tanstack/react-query";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatFiatNumber } from "utils/format";

type Props = {
  label?: ReactNode;
  networkFee: {
    data: number | undefined;
    fetchStatus: FetchStatus;
    status: QueryStatus;
  };
  sectionClassName?: string;
};

export const NetworkFees = function ({
  label,
  networkFee,
  sectionClassName,
}: Props) {
  const { t } = useTranslation();

  const formattedFee =
    networkFee.data !== undefined
      ? `$${formatFiatNumber(networkFee.data.toFixed(2))}`
      : undefined;

  const isError = networkFee.status === "error";
  const isIdle = networkFee.fetchStatus === "idle";

  return (
    <FeesContainer
      isError={isError}
      isIdle={isIdle}
      label={label}
      sectionClassName={sectionClassName}
      totalFees={formattedFee}
    >
      <FeeDetails
        className={sectionClassName}
        isError={isError}
        isIdle={isIdle}
        label={t("common.network-fee")}
        value={formattedFee}
      />
    </FeesContainer>
  );
};
