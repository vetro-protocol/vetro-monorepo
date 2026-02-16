import { shorten } from "crypto-shortener";
import type { Address, Hash } from "viem";

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ["0x"] });

export const formatEvmHash = (txHash: Hash) =>
  shorten(txHash, { length: 4, prefixes: ["0x"] });
