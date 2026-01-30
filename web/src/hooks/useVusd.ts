import { queryOptions, useQuery } from "@tanstack/react-query";
import { getGatewayAddress } from "@vetro/gateway";
import { fetchVusd } from "fetchers/fetchVusd";
import type { Token } from "types";
import type { Chain, Client } from "viem";
import { hemi } from "viem/chains";

import { useHemiClient } from "./useHemiClient";

const vusdQueryKey = (chainId: Chain["id"] | undefined) => ["vusd", chainId];

// TODO these are hardcoded for testing, but will be updated
// later with final addresses. There isn't a vusd for testing either
const initialVusd: Token = {
  // mainnet VUSD address in hemi
  address: "0x7A06C4AeF988e7925575C50261297a946aD204A8",
  chainId: hemi.id,
  decimals: 18,
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
  const client = useHemiClient();
  return useQuery(vusdOptions({ client }));
};
