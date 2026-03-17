import { useBorrowAction } from "hooks/borrow/useBorrowAction";
import { Trans } from "react-i18next";
import { formatLiquidationPenalty } from "utils/borrowReview";
import { formatPercentage } from "utils/format";
import { type Hash } from "viem";

type Props = {
  healthFactor: number;
  lltv: bigint;
  marketId: Hash;
};

export function LiquidationWarning({ healthFactor, lltv, marketId }: Props) {
  const [, setBorrowAction] = useBorrowAction();
  const penalty = formatLiquidationPenalty(lltv);

  return (
    <div className="w-[calc(100%-2rem)] md:w-[calc(100%-6rem)] xl:w-[calc(var(--container-5xl)-2px)]">
      <div className="flex w-1/2 grow-0 items-start gap-2 rounded-b-lg bg-rose-100 px-4 py-3 max-md:ml-16 md:mx-auto">
        <svg
          className="mt-0.5 size-4 shrink-0"
          fill="none"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            d="M6.7007 2.25C7.2777 1.25 8.7207 1.25 9.2987 2.25L14.4947 11.25C14.6263 11.478 14.6957 11.7367 14.6957 12C14.6957 12.2633 14.6264 12.522 14.4947 12.75C14.3631 12.978 14.1737 13.1674 13.9457 13.299C13.7177 13.4307 13.459 13.5 13.1957 13.5H2.8037C2.54031 13.5002 2.28152 13.431 2.05336 13.2994C1.8252 13.1678 1.6357 12.9785 1.50394 12.7504C1.37217 12.5224 1.30278 12.2636 1.30273 12.0002C1.30269 11.7369 1.372 11.4781 1.5037 11.25L6.7007 2.25ZM7.9997 4C8.19861 4 8.38937 4.07902 8.53003 4.21967C8.67068 4.36032 8.7497 4.55109 8.7497 4.75V7.75C8.7497 7.94891 8.67068 8.13968 8.53003 8.28033C8.38937 8.42098 8.19861 8.5 7.9997 8.5C7.80078 8.5 7.61002 8.42098 7.46937 8.28033C7.32871 8.13968 7.2497 7.94891 7.2497 7.75V4.75C7.2497 4.55109 7.32871 4.36032 7.46937 4.21967C7.61002 4.07902 7.80078 4 7.9997 4ZM7.9997 12C8.26491 12 8.51927 11.8946 8.7068 11.7071C8.89434 11.5196 8.9997 11.2652 8.9997 11C8.9997 10.7348 8.89434 10.4804 8.7068 10.2929C8.51927 10.1054 8.26491 10 7.9997 10C7.73448 10 7.48013 10.1054 7.29259 10.2929C7.10505 10.4804 6.9997 10.7348 6.9997 11C6.9997 11.2652 7.10505 11.5196 7.29259 11.7071C7.48013 11.8946 7.73448 12 7.9997 12Z"
            fill="#FF2056"
            fillRule="evenodd"
          />
        </svg>
        <p className="text-sm whitespace-normal text-rose-500">
          <Trans
            components={{
              addCollateral: (
                <button
                  className="cursor-pointer underline hover:text-rose-900"
                  onClick={() =>
                    setBorrowAction({
                      borrowAction: "supply-collateral",
                      marketId,
                    })
                  }
                  type="button"
                />
              ),
              repay: (
                <button
                  className="cursor-pointer underline hover:text-rose-900"
                  onClick={() =>
                    setBorrowAction({
                      borrowAction: "repay-loan",
                      marketId,
                    })
                  }
                  type="button"
                />
              ),
            }}
            i18nKey="pages.borrow.liquidation-warning"
            values={{
              healthFactor: healthFactor.toFixed(2),
              penalty: formatPercentage(penalty),
            }}
          />
        </p>
      </div>
    </div>
  );
}
