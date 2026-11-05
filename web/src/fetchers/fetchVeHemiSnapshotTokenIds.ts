import {
  getBalanceOf,
  getIdsOfRecord,
  getTokenOfOwnerByIndex,
} from "@vetro-protocol/ve-vetro/actions";
import { veVetroContracts } from "utils/veVetro";
import { type Address, type Client, maxUint256 } from "viem";

async function fetchIdsOfRecord({
  account,
  client,
}: {
  account: Address;
  client: Client;
}) {
  const tokenIds: bigint[] = [];
  let fromId = 0n;
  while (fromId < maxUint256) {
    const { ids, nextId } = await getIdsOfRecord(client, {
      address: veVetroContracts.lens,
      fromId,
      holder: account,
      toIdExclusive: maxUint256,
    });
    tokenIds.push(...ids);
    fromId = nextId;
  }
  return tokenIds;
}

// The list includes the positions that expired before the snapshot.
export const fetchVeHemiSnapshotTokenIds = async function ({
  account,
  client,
}: {
  account: Address;
  client: Client;
}) {
  const { snapshotBlock: blockNumber, veHemi: address } = veVetroContracts;
  if (blockNumber === undefined) {
    return fetchIdsOfRecord({ account, client });
  }
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
