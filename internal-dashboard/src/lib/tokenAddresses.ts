import { knownTokens } from "@vetro-protocol/core";

import { type TrackedToken } from "./types";

// A tracked token is read on mainnet, but OFT deployments of the same token
// (e.g. on Hemi) share its symbol in knownTokens and its value.
export const tokenAddresses = (token: TrackedToken) => [
  token.address,
  ...knownTokens
    .filter((known) => known.symbol === token.symbol)
    .map((known) => known.address),
];
