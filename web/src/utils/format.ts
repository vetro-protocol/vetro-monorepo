import { shorten } from "crypto-shortener";
import { smartRound } from "smart-round";
import type { Address, Hash } from "viem";

export const formatEvmAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ["0x"] });

export const formatEvmHash = (txHash: Hash) =>
  shorten(txHash, { length: 4, prefixes: ["0x"] });

const cryptoRounder = smartRound(6, 0, 6);
const fiatRounder = smartRound(6, 2, 2);

export const formatFiatNumber = (value: number | string) =>
  fiatRounder(value, { shouldFormat: true });

export const formatNumber = (value: number | string) =>
  cryptoRounder(value, { roundingMode: "round-down", shouldFormat: true });
