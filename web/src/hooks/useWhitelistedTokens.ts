import { useQuery } from "@tanstack/react-query";
import { knownTokens } from "utils/tokenList";

const whitelistedSymbols = ["USDC", "USDT"];
const whitelistedTokens = knownTokens.filter((t) =>
  whitelistedSymbols.includes(t.symbol),
);

export const useWhitelistedTokens = () =>
  useQuery({
    initialData: whitelistedTokens,
    // TODO validate token list from treasury - see https://github.com/vetro-protocol/vetro-monorepo/issues/34
    queryFn: () => whitelistedTokens,
    queryKey: ["whitelisted-tokens"],
    staleTime: Infinity,
  });
