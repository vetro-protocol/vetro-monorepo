import { getTreasury } from "@vetro-protocol/gateway/actions";
import { getTokenConfig } from "@vetro-protocol/treasury/actions";
import { type Address, type Client } from "viem";

export const readTokenConfig = ({
  client,
  token,
  treasury,
}: {
  client: Client;
  token: Address;
  treasury: Address;
}) => getTokenConfig(client, { address: treasury, token });

export async function readGatewayTokenConfig({
  client,
  gatewayAddress,
  token,
}: {
  client: Client;
  gatewayAddress: Address;
  token: Address;
}) {
  const treasury = await getTreasury(client, { address: gatewayAddress });
  return readTokenConfig({ client, token, treasury });
}
