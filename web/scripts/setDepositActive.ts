import { fileURLToPath } from "node:url";

import {
  runTokenActiveCli,
  type SetTokenActiveParams,
  setTokenActive,
} from "./tokenActive.ts";

// Pause (active: false) or resume (active: true) minting from `token` on the
// gateway's treasury. While paused the Swap CTA reads "Swaps are paused".
export const setDepositActive = (params: SetTokenActiveParams) =>
  setTokenActive({ ...params, flag: "deposit" });

// Allow running as a standalone script:
//   node web/scripts/setDepositActive.ts --token 0x… --pause|--unpause
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runTokenActiveCli("deposit");
}
