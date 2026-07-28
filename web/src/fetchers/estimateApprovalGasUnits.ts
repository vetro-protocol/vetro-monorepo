import { allowanceQueryOptions } from "@hemilabs/react-hooks/useAllowance";
import type { QueryClient } from "@tanstack/react-query";
import { config } from "providers/web3Provider";
import type { Token } from "types";
import type { Address, Client } from "viem";
import { encodeApproveData } from "viem-erc20/actions";
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
      data: encodeApproveData({ amount: approveAmount ?? amount, spender }),
      to: token.address,
    }),
  );
};
