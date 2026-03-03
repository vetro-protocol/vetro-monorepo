import { PageTitle } from "components/base/pageTitle";
import { MarketsTable } from "components/borrow/marketsTable";
import { StripedDivider } from "components/stripedDivider";
import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";
import type { Hash } from "viem";

const marketIds: Hash[] = [
  // hemiBTC / TestVUSD, used for testing purposes
  "0xcbd8d55bce36e05c4bbdf93ad867329dd541a594243f9510b5379d04bd9c4c6f",
  // WBTC / USDC, used for testing purposes
  "0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49",
];

export const Borrow = function () {
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  return (
    <>
      <PageTitle value={t("pages.borrow.title", { symbol: vusd.symbol })} />
      <MarketsTable marketIds={marketIds} />
      <div className="w-full border-b border-gray-200 bg-gray-100 p-2">
        <StripedDivider />
      </div>
    </>
  );
};
