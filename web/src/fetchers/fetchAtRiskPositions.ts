import type { QueryClient } from "@tanstack/react-query";
import { marketIds } from "constants/borrow";
import { marketDataOptions } from "hooks/borrow/useMarketData";
import { positionInfoOptions } from "hooks/borrow/usePositionInfo";
import { hasActivePosition, isPositionAtRisk } from "utils/borrowPosition";
import type { Address, Chain, Client, Hash } from "viem";

type AtRiskPosition = {
  collateralSymbol: string;
  loanSymbol: string;
  marketId: Hash;
};

export const fetchAtRiskPositions = async function ({
  account,
  chainId,
  client,
  queryClient,
}: {
  account: Address;
  chainId: Chain["id"];
  client: Client;
  queryClient: QueryClient;
}) {
  const results = await Promise.all(
    marketIds.map(async function (marketId) {
      const position = await queryClient.ensureQueryData(
        positionInfoOptions({ account, chainId, client, marketId }),
      );

      if (
        !hasActivePosition(position) ||
        !isPositionAtRisk(position.healthFactor)
      ) {
        return null;
      }

      const market = await queryClient.ensureQueryData(
        marketDataOptions({ chainId, client, marketId, queryClient }),
      );

      return {
        collateralSymbol: market.collateralToken.symbol,
        loanSymbol: market.loanToken.symbol,
        marketId,
      };
    }),
  );

  return results.filter((r): r is AtRiskPosition => r !== null);
};
