import type { Client, Hash } from "viem";
import { waitForTransactionReceipt } from "viem/actions";

export async function confirmTransaction({
  client,
  hash,
}: {
  client: Client;
  hash: Hash;
}) {
  const receipt = await waitForTransactionReceipt(client, { hash });

  if (receipt.status !== "success") {
    throw new Error(`Transaction ${hash} reverted`);
  }

  return receipt;
}
