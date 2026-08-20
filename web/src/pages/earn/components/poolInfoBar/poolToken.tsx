import type { Token } from "@vetro-protocol/core";
import { TokenLogo } from "components/tokenLogo";
import Skeleton from "react-loading-skeleton";

import { PoolInfoItem } from "./poolInfoItem";

type Props = {
  peggedToken: Token | undefined;
};

export const PoolToken = ({ peggedToken }: Props) => (
  <>
    {peggedToken ? (
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          peggedToken.symbol === "vetBTC"
            ? "bg-vetbtc-logo/10"
            : "bg-blue-800/10"
        }`}
      >
        <TokenLogo {...peggedToken} />
      </div>
    ) : (
      <Skeleton
        borderRadius={8}
        containerClassName="shrink-0"
        height={40}
        width={40}
      />
    )}
    <div className="contents md:*:w-16">
      <PoolInfoItem data={peggedToken?.symbol} label="Token" />
    </div>
  </>
);
