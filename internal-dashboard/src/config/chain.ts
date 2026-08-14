import { type Address, getAddress } from "viem";

import { type Dex } from "./dexes";

// Curve hosts a logo per token, keyed by its lowercased address.
const curveTokenIconUrl = (address: Address) =>
  `https://cdn.jsdelivr.net/gh/curvefi/curve-assets/images/assets/${address.toLowerCase()}.png`;

// Sushi's token-list logos are keyed by checksummed address.
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
const iconUrlByDex: Record<Dex, (address: Address) => string | undefined> = {
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
