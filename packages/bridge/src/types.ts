import type { Address, Chain, Hash, TransactionReceipt } from "viem";

type CommonEvents = {
  "unexpected-error": [Error];
};

type ApprovalEvents = {
  "approve-transaction-reverted": [TransactionReceipt];
  "approve-transaction-succeeded": [TransactionReceipt];
  "pre-approve": [];
  "user-signed-approval": [Hash];
  "user-signing-approval-error": [Error];
};

export type SendEvents = ApprovalEvents &
  CommonEvents & {
    "pre-send": [];
    "send-failed": [Error];
    "send-failed-validation": [string];
    "send-settled": [];
    "send-transaction-reverted": [TransactionReceipt];
    "send-transaction-succeeded": [TransactionReceipt];
    "user-signed-send": [Hash];
    "user-signing-send-error": [Error];
  };

export type MessagingFee = {
  lzTokenFee: bigint;
  nativeFee: bigint;
};

export type SendParams = {
  amount: bigint;
  approveAmount?: bigint;
  destinationChainId: Chain["id"];
  minAmount?: bigint;
  oftAddress: Address;
  recipient: Address;
};

export type QuoteSendParams = {
  amount: bigint;
  destinationChainId: Chain["id"];
  minAmount?: bigint;
  oftAddress: Address;
  recipient: Address;
};
