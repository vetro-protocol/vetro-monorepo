import { allowanceQueryOptions } from "@hemilabs/react-hooks/useAllowance";
import type { QueryClient } from "@tanstack/react-query";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import { type Address, type Client, encodeFunctionData, erc20Abi } from "viem";
import { estimateGasQueryOptions } from "wagmi/query";

export const estimateApprovalGasUnits = async function ({
  amount,
  approveAmount,
  client,
  owner,
  queryClient,
  spender,
  token,
}: {
  amount: bigint;
  approveAmount: bigint | undefined;
  client: Client;
  owner: Address;
  queryClient: QueryClient;
  spender: Address;
  token: Token;
}) {
  const currentAllowance = await queryClient.ensureQueryData(
    allowanceQueryOptions({ client, owner, spender, token }),
  );

  const needsApproval = currentAllowance < amount;

  if (!needsApproval) {
    return 0n;
  }

  return queryClient.ensureQueryData(
    estimateGasQueryOptions(config, {
      account: owner,
      data: encodeFunctionData({
        abi: erc20Abi,
        args: [spender, approveAmount ?? amount],
        functionName: "approve",
      }),
      to: token.address,
    }),
  );
};
