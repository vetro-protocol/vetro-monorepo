import { gatewayAddresses } from "@vetro-protocol/gateway";
import { PageTitle } from "components/base/pageTitle";
import { MarketsTable } from "components/borrow/marketsTable";
import { PositionsTable } from "components/borrow/positionsTable";
import { StripedDivider } from "components/stripedDivider";
import { marketIds } from "constants/borrow";
import { usePeggedToken } from "hooks/usePeggedToken";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";

export const Borrow = function () {
  const { t } = useTranslation();
  // The only markets so far for Borrow are VUSD ones, so this is safe
  const { data: peggedToken } = usePeggedToken(gatewayAddresses[0]);
  return (
    <>
      {peggedToken ? (
        <PageTitle
          value={t("pages.borrow.title", { symbol: peggedToken.symbol })}
        />
      ) : (
        <div className="flex h-50 w-full items-center justify-center">
          <Skeleton
            className="h-8 md:h-10"
            containerClassName="w-3/5 md:w-2/5"
            count={2}
          />
        </div>
      )}
      <MarketsTable marketIds={marketIds} />
      <div className="w-full border-b border-gray-200 bg-gray-100">
        <StripedDivider />
      </div>
      <PositionsTable marketIds={marketIds} />
    </>
  );
};
