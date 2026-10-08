import { isAddressEqual } from "viem";
import { mainnet } from "viem/chains";

import { isShareToken } from "./isShareToken";
import { tokenAddresses } from "./tokenAddresses";
import {
  type PoolCoin,
  type TrackedToken,
  type WhitelistedToken,
} from "./types";

type Coin = Pick<PoolCoin, "address" | "symbol">;

const findTrackedToken = ({
  coin,
  trackedTokens,
}: {
  coin: Coin;
  trackedTokens: TrackedToken[];
}) =>
  trackedTokens.find((token) =>
    tokenAddresses(token).some((address) =>
      isAddressEqual(address, coin.address),
    ),
  );

// On mainnet the whitelist addresses are authoritative, so only the address
// matches there. The whitelist is read on mainnet only, and knownTokens has no
// other-chain addresses for whitelisted tokens, so other chains also match them
// by symbol.
const isWhitelistedFor = ({
  chainId,
  coin,
  peggedToken,
  whitelistedTokens,
}: {
  chainId: number;
  coin: Coin;
  peggedToken: TrackedToken;
  whitelistedTokens: WhitelistedToken[];
}) =>
  whitelistedTokens.some(
    (entry) =>
      isAddressEqual(entry.peggedTokenAddress, peggedToken.address) &&
      (isAddressEqual(entry.address, coin.address) ||
        (chainId !== mainnet.id &&
          entry.symbol.toLowerCase() === coin.symbol.toLowerCase())),
  );

const isSharePegPair = ({
  peggedToken,
  shareToken,
}: {
  peggedToken: TrackedToken | undefined;
  shareToken: TrackedToken | undefined;
}) =>
  !!shareToken &&
  !!peggedToken &&
  isShareToken(shareToken) &&
  !isShareToken(peggedToken) &&
  isAddressEqual(shareToken.assetAddress, peggedToken.address);

const sharePegRate = function ({
  base,
  baseToken,
  quote,
  quoteToken,
  shareRates,
}: {
  base: Coin;
  baseToken: TrackedToken | undefined;
  quote: Coin;
  quoteToken: TrackedToken | undefined;
  shareRates: Partial<Record<string, number>>;
}) {
  const legs = [
    {
      coin: base,
      isBase: true,
      peggedToken: quoteToken,
      shareToken: baseToken,
    },
    {
      coin: quote,
      isBase: false,
      peggedToken: baseToken,
      shareToken: quoteToken,
    },
  ];
  const shareLeg = legs.find(isSharePegPair);
  if (!shareLeg) {
    return undefined;
  }
  // Keyed by the coin's own address so bridged deployments read their rate.
  const shareRate = shareRates[shareLeg.coin.address.toLowerCase()];
  if (!shareRate) {
    return undefined;
  }
  return shareLeg.isBase ? shareRate : 1 / shareRate;
};

const isWhitelistPair = function ({
  base,
  baseToken,
  chainId,
  quote,
  quoteToken,
  whitelistedTokens,
}: {
  base: Coin;
  baseToken: TrackedToken | undefined;
  chainId: number;
  quote: Coin;
  quoteToken: TrackedToken | undefined;
  whitelistedTokens: WhitelistedToken[];
}) {
  const pairs = [
    { coin: base, peggedToken: quoteToken },
    { coin: quote, peggedToken: baseToken },
  ];
  return pairs.some(
    ({ coin, peggedToken }) =>
      !!peggedToken &&
      !isShareToken(peggedToken) &&
      isWhitelistedFor({ chainId, coin, peggedToken, whitelistedTokens }),
  );
};

const expectedPegRate = function ({
  base,
  chainId,
  quote,
  shareRates,
  trackedTokens,
  whitelistedTokens,
}: {
  base: Coin;
  chainId: number;
  quote: Coin;
  shareRates: Partial<Record<string, number>>;
  trackedTokens: TrackedToken[];
  whitelistedTokens: WhitelistedToken[];
}) {
  const baseToken = findTrackedToken({ coin: base, trackedTokens });
  const quoteToken = findTrackedToken({ coin: quote, trackedTokens });
  const tokens = { base, baseToken, quote, quoteToken };

  const shareRate = sharePegRate({ ...tokens, shareRates });
  if (shareRate !== undefined) {
    return { expectedRate: shareRate, hasShareLeg: true };
  }
  if (isWhitelistPair({ ...tokens, chainId, whitelistedTokens })) {
    return { expectedRate: 1, hasShareLeg: false };
  }
  return undefined;
};

// Only explicit peg pairs get a deviation: a pegged token against its gateway's
// whitelisted tokens, and a share token against its vault's pegged token. Any
// other pair is not pegged, however close its rate is to 1.
export const pegDeviation = function ({
  base,
  chainId,
  quote,
  rate,
  shareRates,
  trackedTokens,
  whitelistedTokens,
}: {
  base: Coin;
  chainId: number;
  quote: Coin;
  rate: number;
  shareRates: Partial<Record<string, number>>;
  trackedTokens: TrackedToken[];
  whitelistedTokens: WhitelistedToken[];
}) {
  const peg = expectedPegRate({
    base,
    chainId,
    quote,
    shareRates,
    trackedTokens,
    whitelistedTokens,
  });
  if (!peg) {
    return undefined;
  }
  const { expectedRate, hasShareLeg } = peg;
  return {
    deviation: (rate / expectedRate - 1) * 100,
    expectedRate,
    hasShareLeg,
  };
};
