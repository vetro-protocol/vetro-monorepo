import { PageTitle } from "components/base/pageTitle";
import { MarketsTable } from "components/borrow/marketsTable";
import { PositionsTable } from "components/borrow/positionsTable";
import { StripedDivider } from "components/stripedDivider";
import { marketIds } from "constants/borrow";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useTranslation } from "react-i18next";

export const Borrow = function () {
  const { t } = useTranslation();
  const { data: peggedToken } = usePeggedToken();
  return (
    <>
      <PageTitle
        value={t("pages.borrow.title", { symbol: peggedToken.symbol })}
      />
      <MarketsTable marketIds={marketIds} />
      <div className="w-full border-b border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <PositionsTable marketIds={marketIds} />
    </>
  );
};
