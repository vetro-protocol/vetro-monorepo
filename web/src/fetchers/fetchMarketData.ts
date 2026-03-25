import type { QueryClient } from "@tanstack/react-query";
import { morphoMarketOptions } from "hooks/borrow/useMorphoMarket";
import { tokenInfoOptions } from "hooks/useTokenInfo";
import type { Chain, Client, Hash } from "viem";

export const fetchMarketData = async function ({
  chainId,
  client,
  marketId,
  queryClient,
}: {
  chainId: Chain["id"];
  client: Client;
  marketId: Hash;
  queryClient: QueryClient;
}) {
  const market = await queryClient.ensureQueryData(
    morphoMarketOptions({ chainId, client, marketId }),
  );

  const [collateralToken, loanToken] = await Promise.all([
    queryClient.ensureQueryData(
      tokenInfoOptions({
        address: market.params.collateralToken,
        chainId,
        client,
      }),
    ),
    queryClient.ensureQueryData(
      tokenInfoOptions({
        address: market.params.loanToken,
        chainId,
        client,
      }),
    ),
  ]);

  return {
    borrowApy: market.borrowApy,
    collateralToken,
    liquidity: market.liquidity,
    lltv: market.params.lltv,
    loanToken,
    marketId,
    oracle: market.params.oracle,
    totalBorrowAssets: market.totalBorrowAssets,
    totalSupplyAssets: market.totalSupplyAssets,
  };
};
