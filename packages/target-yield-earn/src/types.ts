import type { Hash, TransactionReceipt } from "viem";

type CommonEvents = {
  "unexpected-error": [Error];
};

export type CancelDepositRequestEvents = CommonEvents & {
  "cancel-deposit-request-failed": [Error];
  "cancel-deposit-request-failed-validation": [string];
  "cancel-deposit-request-settled": [];
  "cancel-deposit-request-transaction-reverted": [TransactionReceipt];
  "cancel-deposit-request-transaction-succeeded": [TransactionReceipt];
  "pre-cancel-deposit-request": [];
  "user-signed-cancel-deposit-request": [Hash];
  "user-signing-cancel-deposit-request-error": [Error];
};

export type CancelRedeemRequestEvents = CommonEvents & {
  "cancel-redeem-request-failed": [Error];
  "cancel-redeem-request-failed-validation": [string];
  "cancel-redeem-request-settled": [];
  "cancel-redeem-request-transaction-reverted": [TransactionReceipt];
  "cancel-redeem-request-transaction-succeeded": [TransactionReceipt];
  "pre-cancel-redeem-request": [];
  "user-signed-cancel-redeem-request": [Hash];
  "user-signing-cancel-redeem-request-error": [Error];
};
