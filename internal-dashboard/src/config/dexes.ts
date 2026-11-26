import { type Address, getAddress } from "viem";

export type Dex = "brownfi" | "curve" | "sushi" | "uniswap";

export const dexLabels: Record<Dex, string> = {
  brownfi: "BrownFi",
  curve: "Curve",
  sushi: "Sushi",
  uniswap: "Uniswap",
};

const curveTokenIconUrl = (address: Address) =>
  `https://cdn.jsdelivr.net/gh/curvefi/curve-assets/images/assets/${address.toLowerCase()}.png`;

const sushiTokenIconUrl = function (address: Address) {
  try {
    return `https://cdn.jsdelivr.net/gh/sushiswap/list@master/logos/token-logos/network/ethereum/${getAddress(address)}.jpg`;
  } catch {
    return undefined;
  }
};

const uniswapTokenIconUrl = (address: Address) =>
  `https://cdn.jsdelivr.net/gh/Uniswap/assets@master/blockchains/ethereum/assets/${getAddress(address)}/logo.png`;

// The venue's own asset CDN, used as a fallback when a token isn't in the Hemilabs
// token list. Returns a 404 (handled by the icon component) for unknown tokens.
// BrownFi has no icons - we use ours.
const iconUrlByDex: Record<Dex, (address: Address) => string | undefined> = {
  brownfi: () => undefined,
  curve: curveTokenIconUrl,
  sushi: sushiTokenIconUrl,
  uniswap: uniswapTokenIconUrl,
};

export const dexTokenIconUrl = ({
  address,
  dex,
}: {
  address: Address;
  dex: Dex;
}) => iconUrlByDex[dex](address);

const poolUrlByDex: Record<Dex, (address: Address) => string> = {
  brownfi: (address) =>
    `https://app.brownfi.io/clamm/analytics/pools/${address.toLowerCase()}`,
  curve: (address) => `https://www.curve.finance/dex/ethereum/pools/${address}`,
  sushi: (address) => `https://www.sushi.com/ethereum/pool/v3/${address}`,
  uniswap: (address) =>
    `https://app.uniswap.org/explore/pools/ethereum/${address}`,
};

export const poolUrl = ({ address, dex }: { address: Address; dex: Dex }) =>
  poolUrlByDex[dex](address);
