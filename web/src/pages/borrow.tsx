import { PageTitle } from "components/base/pageTitle";
import { MarketsTable } from "components/borrow/marketsTable";
import { PositionsTable } from "components/borrow/positionsTable";
import { StripedDivider } from "components/stripedDivider";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import type { Hash } from "viem";

const marketIds: Hash[] = [
  // hemiBTC / VUSD
  "0x55609be688a4d96e715bfe39969133bd4e7f83db4f77bb06216109189a11f2e5",
  // WETH / VUSD,
  "0x7d1306d23f9f1e419697b8275001db9ea74b3c75190a7db8f5d81fed2fb94561",
];

export const Borrow = function () {
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  return (
    <>
      <PageTitle value={t("pages.borrow.title", { symbol: vusd.symbol })} />
      <MarketsTable marketIds={marketIds} />
      <div className="w-full border-b border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <PositionsTable marketIds={marketIds} />
    </>
  );
};
