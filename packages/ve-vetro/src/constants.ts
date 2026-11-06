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
  },
  [hemiSepolia.id]: {
    distributor: "0xF55B1C52D4B2a942E531C4f4d960F946d4C307dc",
    lens: "0x710F58A3A1D1852884E35ecD3FAA17630e16624A",
    // The testnet veHEMI has positions created after the snapshot with a past
    // start, so the ownership at the snapshot block does not include them.
    snapshotBlock: undefined,
    veHemi: "0x42ef3B1CC45b94De46eC84a89802DcbCE73e71b4",
  },
};
