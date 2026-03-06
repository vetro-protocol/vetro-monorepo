import { type MarketId } from "@morpho-org/blue-sdk";
import { Market } from "@morpho-org/blue-sdk-viem/lib/augment/Market";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { unixNowTimestamp } from "utils/date";
import type { Chain, Client, Hash } from "viem";

import { useEthereumClient } from "../useEthereumClient";
import { useMainnet } from "../useMainnet";

export const morphoMarketOptions = ({
  chainId,
  client,
  marketId,
}: {
  chainId: Chain["id"];
  client: Client | undefined;
  marketId: Hash;
}) =>
  queryOptions({
    enabled: !!client,
    queryFn: () =>
      Market.fetch(marketId as MarketId, client!).then((market) =>
        market.accrueInterest(BigInt(unixNowTimestamp())),
      ),
    queryKey: ["morpho-market", chainId, marketId],
  });

export const useMorphoMarket = function (marketId: Hash) {
  const ethereumChain = useMainnet();
  const client = useEthereumClient();

  return useQuery(
    morphoMarketOptions({
      chainId: ethereumChain.id,
      client: client!,
      marketId,
    }),
  );
};
