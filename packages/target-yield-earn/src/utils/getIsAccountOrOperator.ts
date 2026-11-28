import { type Address, type Client, isAddressEqual } from "viem";

import { getIsOperator } from "../actions/public/getIsOperator.ts";

export async function getIsAccountOrOperator({
  account,
  address,
  client,
  owner,
}: {
  account: Address;
  address: Address;
  client: Client;
  owner: Address;
}) {
  if (isAddressEqual(account, owner)) {
    return true;
  }
  return getIsOperator(client, {
    address,
    controller: owner,
    operator: account,
  });
}
