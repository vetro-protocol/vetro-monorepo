import { useQuery } from "@tanstack/react-query";
import type { Address, Client } from "viem";
import { readContract } from "viem/actions";
import { useAccount } from "wagmi";

import { useEthereumClient } from "./useEthereumClient";

// The sanctions oracle is a contract deployed on Ethereum mainnet
const sanctionsOracleAddress =
  "0x40C57923924B5c5c5455c48D93317139ADDaC8fb" as const;

const sanctionsOracleAbi = [
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "isSanctioned",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const fetchIsSanctioned = ({
  address,
  client,
}: {
  address: Address;
  client: Client;
}) =>
  readContract(client, {
    abi: sanctionsOracleAbi,
    address: sanctionsOracleAddress,
    args: [address],
    functionName: "isSanctioned",
  });

export const useIsSanctioned = function () {
  const { address, isConnected } = useAccount();
  const client = useEthereumClient();

  // Fail-open: RPC errors resolve as unrestricted so the app remains usable. It
  // seems likely that RPC errors will also prevent any use of the app so this
  // is a reasonable tradeoff.
  const { data: isSanctioned = false } = useQuery({
    enabled: isConnected && !!address && !!client,
    queryFn: () => fetchIsSanctioned({ address: address!, client: client! }),
    // The oracle lives on mainnet and the result is chain-agnostic, so
    // address alone is a sufficient cache key.
    queryKey: ["is-sanctioned", address],
    retry: false,
    // Sanction status changes very infrequently; avoid unnecessary mainnet RPC
    // calls on remounts and window refocus.
    staleTime: 1000 * 60 * 60,
  });

  return isConnected && isSanctioned;
};
