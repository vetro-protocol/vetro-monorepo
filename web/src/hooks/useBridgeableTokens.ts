import { useMemo } from "react";
import type { BridgeableToken } from "types";
import { bridgeableTokens } from "utils/bridgeableTokens";
import { knownTokens } from "utils/tokenList";

export const useBridgeableTokens = () =>
  useMemo<BridgeableToken[]>(
    () =>
      bridgeableTokens.flatMap(function ({
        address,
        chainId,
        oftAdapterAddress,
      }) {
        const token = knownTokens.find(
          (t) => t.address === address && t.chainId === chainId,
        );
        return token ? [{ ...token, oftAdapterAddress }] : [];
      }),
    [],
  );
