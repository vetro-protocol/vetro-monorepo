import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { Button } from "components/base/button";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { MaxButton } from "components/base/maxButton";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { TokenInput } from "components/tokenInput";
import { Balance } from "components/tokenInput/balance";
import { TokenSelectorReadOnly } from "components/tokenSelectorReadOnly";
import type { MarketData } from "hooks/borrow/useMarketData";
import { useMorphoMarket } from "hooks/borrow/useMorphoMarket";
import { useTranslation } from "react-i18next";
import { formatUnits, type Hash } from "viem";

import { BorrowingReview } from "./borrowingReview";

type Props = {
  borrowInput: string;
  collateralInput: string;
  market: MarketData;
  marketId: Hash;
  onBorrowChange: (value: string) => void;
  onCollateralChange: (value: string) => void;
};

export function BorrowForm({
  borrowInput,
  collateralInput,
  market,
  marketId,
  onBorrowChange,
  onCollateralChange,
}: Props) {
  const { t } = useTranslation();

  const { collateralToken, loanToken } = market;

  const { data: collateralBalance, status: balanceStatus } = useTokenBalance({
    address: collateralToken.address,
    chainId: collateralToken.chainId,
  });

  const { data: morphoMarket, status: morphoMarketStatus } =
    useMorphoMarket(marketId);

  const maxBorrowable =
    morphoMarket && collateralBalance !== undefined
      ? morphoMarket.getMaxBorrowAssets(collateralBalance)
      : undefined;

  return (
    <div className="flex flex-col bg-white">
      <div className="flex flex-col gap-1 p-2 md:px-1.5 xl:px-2">
        <TokenInput
          balance={
            <Balance
              label={t("pages.swap.form.balance")}
              value={
                <RenderCryptoValue
                  status={balanceStatus}
                  token={collateralToken}
                  value={collateralBalance}
                />
              }
            />
          }
          label={t("pages.borrow.you-are-depositing")}
          maxButton={
            <SetMaxErc20Balance
              onClick={onCollateralChange}
              token={collateralToken}
            />
          }
          onChange={onCollateralChange}
          tokenSelector={<TokenSelectorReadOnly {...collateralToken} />}
          value={collateralInput}
        />
        <TokenInput
          balance={
            <Balance
              label={t("pages.borrow.max-available")}
              value={
                <RenderCryptoValue
                  status={morphoMarketStatus}
                  token={loanToken}
                  value={maxBorrowable}
                />
              }
            />
          }
          label={t("pages.borrow.you-are-borrowing")}
          maxButton={
            <MaxButton
              disabled={maxBorrowable === undefined}
              onClick={() =>
                onBorrowChange(formatUnits(maxBorrowable!, loanToken.decimals))
              }
            />
          }
          onChange={onBorrowChange}
          tokenSelector={<TokenSelectorReadOnly {...loanToken} />}
          value={borrowInput}
        />
      </div>
      <div className="flex items-center justify-center border-y border-gray-200 p-3 *:w-full">
        <Button size="small" type="button" variant="primary">
          {t("pages.borrow.enter-amount")}
        </Button>
      </div>
      <div className="px-4 py-1">
        <BorrowingReview
          borrowApy={market.borrowApy}
          borrowInput={borrowInput}
          collateralInput={collateralInput}
          collateralToken={collateralToken}
          loanToken={loanToken}
          morphoMarket={morphoMarket}
        />
      </div>
    </div>
  );
}
