import type { Hash, TransactionReceipt } from "viem";

export type CommonEvents = {
  "unexpected-error": [Error];
};

export type ApprovalEvents = {
  "approve-transaction-reverted": [TransactionReceipt];
  "approve-transaction-succeeded": [TransactionReceipt];
  "pre-approve": [];
  "user-signed-approval": [Hash];
  "user-signing-approval-error": [Error];
};

export type DepositEvents = ApprovalEvents &
  CommonEvents & {
    "deposit-failed": [Error];
    "deposit-failed-validation": [string];
    "deposit-settled": [];
    "deposit-transaction-reverted": [TransactionReceipt];
    "deposit-transaction-succeeded": [TransactionReceipt];
    "pre-deposit": [];
    "user-signed-deposit": [Hash];
    "user-signing-deposit-error": [Error];
  };

export type MintEvents = ApprovalEvents &
  CommonEvents & {
    "mint-failed": [Error];
    "mint-failed-validation": [string];
    "mint-settled": [];
    "mint-transaction-reverted": [TransactionReceipt];
    "mint-transaction-succeeded": [TransactionReceipt];
    "pre-mint": [];
    "user-signed-mint": [Hash];
    "user-signing-mint-error": [Error];
  };

export type RedeemEvents = ApprovalEvents &
  CommonEvents & {
    "pre-redeem": [];
    "redeem-failed": [Error];
    "redeem-failed-validation": [string];
    "redeem-settled": [];
    "redeem-transaction-reverted": [TransactionReceipt];
    "redeem-transaction-succeeded": [TransactionReceipt];
    "user-signed-redeem": [Hash];
    "user-signing-redeem-error": [Error];
  };

export type WithdrawEvents = ApprovalEvents &
  CommonEvents & {
    "pre-withdraw": [];
    "user-signed-withdraw": [Hash];
    "user-signing-withdraw-error": [Error];
    "withdraw-failed": [Error];
    "withdraw-failed-validation": [string];
    "withdraw-settled": [];
    "withdraw-transaction-reverted": [TransactionReceipt];
    "withdraw-transaction-succeeded": [TransactionReceipt];
  };
