import {
  getBalanceOf,
  getTokenOfOwnerByIndex,
} from "@vetro-protocol/ve-vetro/actions";
import { veVetroContracts } from "utils/veVetro";
import type { Address, Client } from "viem";

// The list includes the positions that expired before the snapshot.
export const fetchVeHemiSnapshotTokenIds = async function ({
  account,
  client,
}: {
  account: Address;
  client: Client;
}) {
  const { snapshotBlock: blockNumber, veHemi: address } = veVetroContracts;
  const balance = await getBalanceOf(client, {
    address,
    blockNumber,
    owner: account,
  });
  return Promise.all(
    Array.from({ length: Number(balance) }, (_, index) =>
      getTokenOfOwnerByIndex(client, {
        address,
        blockNumber,
        index: BigInt(index),
        owner: account,
      }),
    ),
  );
};
