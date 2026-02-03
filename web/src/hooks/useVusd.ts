import { queryOptions, useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchVusd } from "fetchers/fetchVusd";
import type { Token } from "types";
import type { Chain, Client } from "viem";
import { mainnet } from "viem/chains";

import { useEthereumClient } from "./useEthereumClient";

const vusdQueryKey = (chainId: Chain["id"] | undefined) => ["vusd", chainId];

// TODO these are hardcoded for testing, but will be updated
// later with final addresses. There isn't a vusd for testing either
const initialVusd: Token = {
  // mainnet VUSD address in ethereum
  address: "0x677ddbd918637E5F2c79e164D402454dE7dA8619",
  chainId: mainnet.id,
  decimals: 18,
  logoURI: "https://hemilabs.github.io/token-list/l1Logos/vusd.svg",
  name: "VUSD",
  symbol: "VUSD",
};

export const vusdOptions = ({ client }: { client: Client | undefined }) =>
  queryOptions({
    enabled: !!client,
    initialData: initialVusd,
    queryFn: () =>
      fetchVusd({
        client: client!,
        gatewayAddress: getGatewayAddress(client!.chain!.id),
      }),
    queryKey: vusdQueryKey(client?.chain?.id),
  });

export const useVusd = function () {
  const client = useEthereumClient();
  return useQuery(vusdOptions({ client }));
};
