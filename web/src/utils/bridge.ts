import type { BridgeableToken } from "types";

const isValidCounterpart = ({
  candidate,
  token,
}: {
  candidate: BridgeableToken;
  token: BridgeableToken;
}) => candidate.symbol === token.symbol && candidate.chainId !== token.chainId;

export const pickCounterpartToken = ({
  current,
  token,
  tokens,
}: {
  current?: BridgeableToken;
  token: BridgeableToken;
  tokens: BridgeableToken[];
}) =>
  current && isValidCounterpart({ candidate: current, token })
    ? current
    : tokens.find((candidate) => isValidCounterpart({ candidate, token }))!;
