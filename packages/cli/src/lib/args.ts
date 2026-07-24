import { gatewayAddresses } from "@vetro-protocol/gateway";
import { InvalidArgumentError } from "commander";
import { getAddress, isAddressEqual } from "viem";

export function parseAddress(value: string) {
  try {
    return getAddress(value);
  } catch {
    throw new InvalidArgumentError(`Invalid address: "${value}"`);
  }
}

export function parseGateway(value: string) {
  const address = parseAddress(value);
  if (!gatewayAddresses.some((gateway) => isAddressEqual(gateway, address))) {
    throw new InvalidArgumentError(`Not an enabled gateway: "${value}"`);
  }
  return address;
}
