import { shorten } from "crypto-shortener";
import { type Address, getAddress, zeroAddress } from "viem";

const usdFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

export const formatUsd = (value: number) => usdFormatter.format(value);

export const formatPercent = (value: number) => `${value.toFixed(2)}%`;

export const formatTokenAmount = (value: number) =>
  value.toLocaleString("en-US", {
    maximumFractionDigits: value !== 0 && Math.abs(value) < 1 ? 6 : 2,
  });

export const formatPrice = (value: number) =>
  value.toLocaleString("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
    style: "currency",
  });

export const formatRate = (value: number) =>
  value.toLocaleString("en-US", { maximumSignificantDigits: 6 });

export const shortenAddress = (address: Address) =>
  shorten(address, { length: 4, prefixes: ["0x"] });

// Checksum a possibly-missing address into a viem Address, treating the zero
// address as absent. Normalizes raw (string) addresses from external APIs.
export const normalizeAddress = (address: string | undefined) =>
  address && address.toLowerCase() !== zeroAddress
    ? getAddress(address)
    : undefined;
