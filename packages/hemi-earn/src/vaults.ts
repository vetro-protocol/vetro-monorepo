import { vetroLinks } from "@vetro-protocol/core";
import { sVetBtcAddress, sVusdAddress } from "@vetro-protocol/earn/addresses";
import type { Address } from "viem";

export type HemiEarnVault = {
  /** Ethereum staking vault. */
  address: Address;
  /** Whether the APY served by the Vetro API is net of fees. */
  apyIncludesFees: boolean;
  /** Brand names of the curators that run the vault's live strategies; only set if different from the operator. */
  curators?: string[];
  /** Whether the vault is retired. A retired vault is never removed from the list, so frontends keep its metadata while holders withdraw from it. */
  deprecated: boolean;
  /** Full legal name of the vault operator. */
  operator: string;
  /** How long a cross-chain transfer usually takes, in either direction, in seconds. */
  typicalTransferTime: number;
};

// Frontends offer the vaults that are not deprecated, in this order.
export const hemiEarnVaults: HemiEarnVault[] = [
  {
    address: sVusdAddress,
    apyIncludesFees: true,
    curators: ["Armitage by Wintermute", "Sky Money", "Stake DAO"],
    deprecated: false,
    operator: "Vetro Service & Support Corp.",
    typicalTransferTime: 5 * 60,
  },
  {
    address: sVetBtcAddress,
    apyIncludesFees: true,
    curators: ["Stake DAO"],
    deprecated: false,
    operator: "Vetro Service & Support Corp.",
    typicalTransferTime: 5 * 60,
  },
];

// Annotated so the published types do not import the private core package.
export const hemiEarnLinks: {
  privacyPolicyUrl: string;
  supportUrl: string;
  termsOfUseUrl: string;
} = vetroLinks;
