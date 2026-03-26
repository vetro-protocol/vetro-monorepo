import type { FetchStatus, QueryStatus } from "@tanstack/react-query";
import { RenderFiatValue } from "components/base/fiatValue";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { useMainnet } from "hooks/useMainnet";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatFiatNumber } from "utils/format";

const DollarSign = () => <span className="mr-1">$</span>;

type FeeData = {
  data: bigint | undefined;
  fetchStatus: FetchStatus;
  status: QueryStatus;
};

type TotalFeesData = {
  data: number | undefined;
  fetchStatus: FetchStatus;
  status: QueryStatus;
};

type Props = {
  fromToken: Token;
  networkFee: FeeData;
  outputLabel?: ReactNode;
  protocolFee?: FeeData;
  totalFees?: TotalFeesData;
};

const Container = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-x-1">{children}</div>
);

export const SwapFees = function ({
  fromToken,
  networkFee,
  outputLabel,
  protocolFee,
  totalFees,
}: Props) {
  const { t } = useTranslation();
  const { nativeCurrency } = useMainnet();

  const ethToken = {
    decimals: nativeCurrency.decimals,
    symbol: nativeCurrency.symbol,
  } as Token;

  const isNetworkFeeIdle = networkFee.fetchStatus === "idle";
  const isNetworkFeeError = networkFee.status === "error";

  const networkFeeValue =
    networkFee.data !== undefined ? (
      <Container>
        <DollarSign />
        <RenderFiatValue token={ethToken} value={networkFee.data} />
      </Container>
    ) : undefined;

  const protocolFeeValue =
    protocolFee && protocolFee.data !== undefined ? (
      <Container>
        <DollarSign />
        <RenderFiatValue token={fromToken} value={protocolFee.data} />
      </Container>
    ) : undefined;

  const isTotalFeesIdle = totalFees?.fetchStatus === "idle";
  const isTotalFeesError = totalFees?.status === "error";

  const totalFeesValue =
    totalFees?.data !== undefined ? (
      <Container>
        <DollarSign />
        {formatFiatNumber(totalFees.data.toFixed(2))}
      </Container>
    ) : undefined;

  return (
    <div className="w-full border-b border-gray-200">
      <div className="mx-auto w-full max-w-md">
        <FeesContainer
          isError={isTotalFeesError}
          isIdle={isTotalFeesIdle}
          label={outputLabel}
          totalFees={totalFeesValue}
        >
          <FeeDetails
            isError={isNetworkFeeError}
            isIdle={isNetworkFeeIdle}
            label={t("common.network-fee")}
            value={networkFeeValue}
          />
          {protocolFee ? (
            <FeeDetails
              isError={protocolFee.status === "error"}
              isIdle={protocolFee.fetchStatus === "idle"}
              label={t("pages.swap.fees.fixed-protocol-fee")}
              value={protocolFeeValue}
            />
          ) : null}
        </FeesContainer>
      </div>
    </div>
  );
};
