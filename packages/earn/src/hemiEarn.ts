import type { Address } from "viem";

import { sVetBtcAddress, sVusdAddress } from "./stakingVaultAddresses.ts";

export type HemiEarnVault = {
  /** Ethereum staking vault. */
  address: Address;
  /** Whether the APY served by the Vetro API is net of fees. */
  apyIncludesFees: boolean;
  /** Brand names of the curators that run the vault's live strategies; only set if different from the operator. */
  curators?: string[];
  /** Full legal name of the vault operator. */
  operator: string;
  /** How long a cross-chain transfer usually takes, in either direction, in seconds. */
  typicalTransferTime: number;
};

// Frontends show only these vaults, in this order.
export const hemiEarnVaults: HemiEarnVault[] = [
  {
    address: sVusdAddress,
    apyIncludesFees: true,
    curators: ["Armitage by Wintermute", "Sky Money", "Stake DAO"],
    operator: "Vetro Service & Support Corp.",
    typicalTransferTime: 5 * 60,
  },
  {
    address: sVetBtcAddress,
    apyIncludesFees: true,
    curators: ["Stake DAO"],
    operator: "Vetro Service & Support Corp.",
    typicalTransferTime: 5 * 60,
  },
];

export const hemiEarnLinks: {
  privacyPolicyUrl: string;
  supportUrl: string;
  termsOfUseUrl: string;
} = {
  privacyPolicyUrl: "https://vetro.org/privacy-policy",
  supportUrl: "https://app.vetro.org/contact",
  termsOfUseUrl: "https://vetro.org/terms-of-use",
};
