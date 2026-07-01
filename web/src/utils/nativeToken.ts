import bnbLogo from "components/icons/bnb.svg";
import type { NativeToken } from "types";
import type { Chain } from "viem";
import { arbitrum, base, bsc, hemi, mainnet, optimism } from "viem/chains";

const ether: NativeToken = {
  chainId: mainnet.id,
  decimals: 18,
  logoURI: "https://hemilabs.github.io/token-list/l1Logos/eth.svg",
  name: "Ether",
  symbol: "ETH",
};

// Kept out of tokenList.ts on purpose: this module imports an SVG asset, so it
// can only be loaded through the Vite/Vitest pipeline. tokenList.ts stays free
// of asset imports because it's also consumed by plain-node scripts.
const nativeTokens: NativeToken[] = [
  ether,
  // These chains use Ether as their native currency
  { ...ether, chainId: hemi.id },
  { ...ether, chainId: arbitrum.id },
  { ...ether, chainId: base.id },
  { ...ether, chainId: optimism.id },
  {
    chainId: bsc.id,
    decimals: 18,
    logoURI: bnbLogo,
    name: "BNB",
    symbol: "BNB",
  },
];

export function getNativeToken(chain: Chain) {
  const nativeToken = nativeTokens.find(
    (token) =>
      token.chainId === chain.id &&
      token.symbol === chain.nativeCurrency.symbol,
  );
  if (!nativeToken) {
    throw new Error(`Native token not found for chain ${chain.id}`);
  }
  return nativeToken;
}
