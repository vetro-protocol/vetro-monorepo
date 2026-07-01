import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { formatFiatNumber } from "utils/format";

const DollarSign = () => <span>$</span>;

const Container = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-x-1">{children}</div>
);

type FeeData = {
  data: number | undefined;
  isError: boolean;
};

type Props = {
  layerZeroFee: FeeData;
  nativeToken: Pick<Token, "logoURI" | "symbol">;
  networkFee: FeeData;
  sectionClassName?: string;
  total: FeeData;
};

export function BridgeFees({
  layerZeroFee,
  nativeToken,
  networkFee,
  sectionClassName,
  total,
}: Props) {
  const { t } = useTranslation();

  const renderFiat = (value: number | undefined) =>
    value !== undefined ? (
      <Container>
        <DollarSign />
        <span>{formatFiatNumber(value)}</span>
      </Container>
    ) : undefined;

  return (
    <FeesContainer
      isError={total.isError}
      sectionClassName={sectionClassName}
      totalFees={renderFiat(total.data)}
    >
      <FeeDetails
        className={sectionClassName}
        isError={networkFee.isError}
        label={t("common.network-fee")}
        token={nativeToken}
        value={renderFiat(networkFee.data)}
      />
      <FeeDetails
        className={sectionClassName}
        isError={layerZeroFee.isError}
        label={t("pages.bridge.fees.layerzero-fee")}
        token={nativeToken}
        value={renderFiat(layerZeroFee.data)}
      />
    </FeesContainer>
  );
}
