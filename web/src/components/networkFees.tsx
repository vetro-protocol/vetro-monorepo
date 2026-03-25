import type { QueryStatus } from "@tanstack/react-query";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { formatFiatNumber } from "utils/format";

type Props = {
  label?: ReactNode;
  networkFee: {
    data: number | undefined;
    status: QueryStatus;
  };
};

export const NetworkFees = function ({ label, networkFee }: Props) {
  const { t } = useTranslation();

  const formattedFee =
    networkFee.data !== undefined
      ? `$${formatFiatNumber(networkFee.data.toFixed(2))}`
      : undefined;

  const isError = networkFee.status === "error";

  const totalFees =
    formattedFee !== undefined ? (
      formattedFee
    ) : isError ? undefined : (
      <Skeleton width={50} />
    );

  return (
    <FeesContainer isError={isError} label={label} totalFees={totalFees}>
      <FeeDetails
        isError={isError}
        label={t("common.network-fee")}
        value={formattedFee}
      />
    </FeesContainer>
  );
};
