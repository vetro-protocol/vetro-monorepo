import type { Token } from "@vetro-protocol/core";
import type { Address } from "viem";

export type NativeToken = Omit<Token, "address">;

export type TokenWithGateway = Token & { gatewayAddress: Address };

export type BridgeableToken = Token & {
  oftAdapterAddress?: Address;
  sharedDecimals: number;
};
