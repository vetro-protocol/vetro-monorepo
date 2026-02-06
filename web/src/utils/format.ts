import { shorten } from "crypto-shortener";
import type { Address } from "viem";

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ["0x"] });
