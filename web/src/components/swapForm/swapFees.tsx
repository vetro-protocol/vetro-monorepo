import type { QueryStatus } from "@tanstack/react-query";
import { RenderFiatValue } from "components/base/fiatValue";
import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import { useMainnet } from "hooks/useMainnet";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { Token } from "types";
import { formatFiatNumber } from "utils/format";

const DollarSign = () => <span className="mr-1">$</span>;

type FeeData = {
  data: bigint | undefined;
  status: QueryStatus;
};

type TotalFeesData = {
  data: number | undefined;
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

  const networkFeeValue = (
    <Container>
      <DollarSign />
      <RenderFiatValue
        queryStatus={networkFee.status}
        token={ethToken}
        value={networkFee.data}
      />
    </Container>
  );

  const protocolFeeValue = protocolFee ? (
    <Container>
      <DollarSign />
      <RenderFiatValue
        queryStatus={protocolFee.status}
        token={fromToken}
        value={protocolFee.data}
      />
    </Container>
  ) : null;

  const totalFeesValue = totalFees ? (
    totalFees.data !== undefined ? (
      <Container>
        <DollarSign />
        {formatFiatNumber(totalFees.data.toFixed(2))}
      </Container>
    ) : totalFees.status === "error" ? (
      <>-</>
    ) : (
      <Skeleton className="h-full" containerClassName="w-8" />
    )
  ) : null;

  return (
    <div className="w-full border-b border-gray-200">
      <div className="mx-auto w-full max-w-md">
        <FeesContainer label={outputLabel} totalFees={totalFeesValue}>
          <FeeDetails
            label={t("pages.swap.fees.network-fee")}
            value={networkFeeValue}
          />
          {protocolFeeValue ? (
            <FeeDetails
              label={t("pages.swap.fees.fixed-protocol-fee")}
              value={protocolFeeValue}
            />
          ) : null}
        </FeesContainer>
      </div>
    </div>
  );
};
