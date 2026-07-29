import { gatewayAddresses } from "@vetro-protocol/gateway";
import { InvalidArgumentError } from "commander";
import { getAddress, isAddressEqual } from "viem";

import { MAX_SLIPPAGE } from "./slippage.js";

export function parseAddress(value: string) {
  try {
    return getAddress(value);
  } catch {
    throw new InvalidArgumentError(`Invalid address: "${value}"`);
  }
}

export function parseAmount(value: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new InvalidArgumentError(`Invalid amount: "${value}"`);
  }
  if (/^0*(\.0*)?$/.test(value)) {
    throw new InvalidArgumentError(`Amount must be greater than 0: "${value}"`);
  }
  return value;
}

export function parseGateway(value: string) {
  const address = parseAddress(value);
  if (!gatewayAddresses.some((gateway) => isAddressEqual(gateway, address))) {
    throw new InvalidArgumentError(`Not an enabled gateway: "${value}"`);
  }
  return address;
}

export function parseSlippage(value: string) {
  const normalized = value.replace(",", ".");
  if (normalized !== "" && !/^\d+(\.\d?)?$/.test(normalized)) {
    throw new InvalidArgumentError(`Invalid slippage: "${value}"`);
  }
  const slippage = Number(normalized);
  if (slippage > MAX_SLIPPAGE) {
    throw new InvalidArgumentError(
      `Slippage cannot exceed ${MAX_SLIPPAGE}%: "${value}"`,
    );
  }
  return slippage;
}
