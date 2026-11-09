import type { Hash, TransactionReceipt } from "viem";

type CommonEvents = {
  "unexpected-error": [Error];
};

export type ClaimEvents = CommonEvents & {
  "claim-failed": [Error];
  "claim-failed-validation": [string];
  "claim-settled": [];
  "claim-transaction-reverted": [TransactionReceipt];
  "claim-transaction-succeeded": [TransactionReceipt];
  "pre-claim": [];
  "user-signed-claim": [Hash];
  "user-signing-claim-error": [Error];
};
