import { knownTokens } from "@vetro-protocol/core";
import { type Address, parseUnits, zeroAddress } from "viem";
import { hemi, hemiSepolia, mainnet } from "viem/chains";

const vToken = knownTokens.find(
  (token) => token.chainId === mainnet.id && token.symbol === "V",
)!;

export const minClaimAmount = parseUnits("10", vToken.decimals);

export const veHemiAddress: Address =
  "0x371d3718D5b7F75EAb050FAe6Da7DF3092031c89";

export const veHemiSnapshotBlock = 5_592_174n;

type VeVetroContracts = {
  distributor: Address;
  lens: Address;
  snapshotBlock: bigint | undefined;
  veHemi: Address;
  veVetro: Address;
};

export const veVetroContractsByChain: Record<
  typeof hemi.id | typeof hemiSepolia.id,
  VeVetroContracts
> = {
  // TODO add real veVetro addresses
  [hemi.id]: {
    distributor: zeroAddress,
    lens: zeroAddress,
    snapshotBlock: veHemiSnapshotBlock,
    veHemi: veHemiAddress,
    veVetro: zeroAddress,
  },
  [hemiSepolia.id]: {
    distributor: "0xAEed58d42D0c1D1FE250D51ea1f1278bF77bD01D",
    lens: "0xDcd5D80DA098B3593A379CC09a773c8B936ce635",
    // The testnet veHEMI has positions created after the snapshot with a past
    // start, so the ownership at the snapshot block does not include them.
    snapshotBlock: undefined,
    veHemi: "0x0b995225984023106368F9c607B2D521a9b20e07",
    veVetro: "0x9dB844120404510d6E2b777CC72c19aC4ED12C07",
  },
};
