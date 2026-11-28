import type { QueryClient } from "@tanstack/react-query";
import { encodeClaim } from "@vetro-protocol/ve-vetro/actions";
import { fetchTotalNetworkFees } from "fetchers/fetchTotalNetworkFees";
import { veVetroConfigOptions } from "hooks/useVeVetroConfig";
import { veVetroChain } from "networks";
import { veVetroContracts } from "utils/veVetro";
import type { Address, Client, Hex } from "viem";
import { estimateGas } from "viem/actions";

// The user signs the terms after the fee shows, so the estimate uses a
// placeholder signature that this ERC-1271 code override accepts.
const echoSelectorCode: Hex = "0x60003560e01c60e01b60005260206000f3";
const placeholderSignature: Hex = `0x${"00".repeat(65)}`;

export const fetchClaimVeVetroFees = async function ({
  account,
  client,
  queryClient,
  tokenIds,
}: {
  account: Address;
  client: Client;
  queryClient: QueryClient;
  tokenIds: readonly bigint[];
}) {
  const { requireTermsSignature } = await queryClient.ensureQueryData(
    veVetroConfigOptions(client),
  );

  const gasUnits = await estimateGas(client, {
    account,
    data: encodeClaim({
      address: veVetroContracts.distributor,
      recipient: account,
      signature: requireTermsSignature ? placeholderSignature : undefined,
      tokenIds,
    }),
    stateOverride: requireTermsSignature
      ? [{ address: account, code: echoSelectorCode }]
      : undefined,
    to: veVetroContracts.distributor,
  });

  return fetchTotalNetworkFees({
    chain: veVetroChain,
    gasUnits,
    queryClient,
  });
};
