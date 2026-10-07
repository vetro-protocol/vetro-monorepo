import { type ShareToken, type TrackedToken } from "./types";

export const isShareToken = (token: TrackedToken): token is ShareToken =>
  token.extensions?.isVaultShare === true;
