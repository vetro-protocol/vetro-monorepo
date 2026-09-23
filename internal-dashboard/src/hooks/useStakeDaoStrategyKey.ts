import { queryOptions, useQuery } from "@tanstack/react-query";
import { type Address } from "viem";

import { fetchStakeDaoStrategyKey } from "../lib/stakeDaoApi";

const stakeDaoStrategyKeyOptions = ({
  chainId,
  gauge,
}: {
  chainId: number;
  gauge: Address;
}) =>
  queryOptions({
    queryFn: () => fetchStakeDaoStrategyKey({ chainId, gauge }),
    queryKey: ["stake-dao-strategy-key", chainId, gauge],
  });

export const useStakeDaoStrategyKey = ({
  chainId,
  gauge,
}: {
  chainId: number;
  gauge: Address;
}) => useQuery(stakeDaoStrategyKeyOptions({ chainId, gauge }));
