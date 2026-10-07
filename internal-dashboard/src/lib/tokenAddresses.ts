import { knownTokens } from "@vetro-protocol/core";

import { type TrackedToken } from "./types";

export const tokenAddresses = (token: TrackedToken) => [
  token.address,
  ...knownTokens
    .filter((known) => known.symbol === token.symbol)
    .map((known) => known.address),
];
