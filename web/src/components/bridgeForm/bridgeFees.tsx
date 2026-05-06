import { FeeDetails } from "components/feeDetails";
import { FeesContainer } from "components/feesContainer";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatFiatNumber } from "utils/format";

const DollarSign = () => <span className="mr-1">$</span>;

const Container = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-x-1">{children}</div>
);

type FeeData = {
  data: number | undefined;
  isError: boolean;
};

type Props = {
  layerZeroFee: FeeData;
  networkFee: FeeData;
  sectionClassName?: string;
  total: FeeData;
};

export function BridgeFees({
  layerZeroFee,
  networkFee,
  sectionClassName,
  total,
}: Props) {
  const { t } = useTranslation();

  const renderFiat = (value: number | undefined) =>
    value !== undefined ? (
      <Container>
        <DollarSign />
        {formatFiatNumber(value)}
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
        value={renderFiat(networkFee.data)}
      />
      <FeeDetails
        className={sectionClassName}
        isError={layerZeroFee.isError}
        label={t("pages.bridge.fees.layerzero-fee")}
        value={renderFiat(layerZeroFee.data)}
      />
    </FeesContainer>
  );
}
