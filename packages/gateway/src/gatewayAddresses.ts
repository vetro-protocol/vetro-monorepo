import {
  gatewayAddresses as coreGatewayAddresses,
  gateways as coreGateways,
} from "@vetro-protocol/core";
import type { Address } from "viem";

export type Gateway = {
  address: Address;
  // Portal-API symbol used to convert this gateway's peg unit into USD.
  // "USD" is treated as identity (no conversion needed).
  pegBaseSymbol: string;
};

export const gateways: Gateway[] = coreGateways;

export const gatewayAddresses: Address[] = coreGatewayAddresses;
