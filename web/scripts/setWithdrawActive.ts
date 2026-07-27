import { fileURLToPath } from "node:url";

import {
  runTokenActiveCli,
  type SetTokenActiveParams,
  setTokenActive,
} from "./tokenActive.ts";

// Pause (active: false) or resume (active: true) paying `token` out on redeem
// from the gateway's treasury. This covers the one-step instant redeem and the
// second step of the two-step redeem — sending to the queue is unaffected.
export const setWithdrawActive = (params: SetTokenActiveParams) =>
  setTokenActive({ ...params, flag: "withdraw" });

// Allow running as a standalone script:
//   node web/scripts/setWithdrawActive.ts --token 0x… --pause|--unpause
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runTokenActiveCli("withdraw");
}
