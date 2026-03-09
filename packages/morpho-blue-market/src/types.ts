import type { Address, Hash, TransactionReceipt } from "viem";

export type MarketParams = {
  collateralToken: Address;
  irm: Address;
  lltv: bigint;
  loanToken: Address;
  oracle: Address;
};

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

export type BorrowAssetsEvents = CommonEvents & {
  "borrow-assets-failed": [Error];
  "borrow-assets-failed-validation": [string];
  "borrow-assets-settled": [];
  "borrow-assets-transaction-reverted": [TransactionReceipt];
  "borrow-assets-transaction-succeeded": [TransactionReceipt];
  "pre-borrow-assets": [];
  "user-signed-borrow-assets": [Hash];
  "user-signing-borrow-assets-error": [Error];
};

export type RepayAssetsEvents = ApprovalEvents &
  CommonEvents & {
    "pre-repay-assets": [];
    "repay-assets-failed": [Error];
    "repay-assets-failed-validation": [string];
    "repay-assets-settled": [];
    "repay-assets-transaction-reverted": [TransactionReceipt];
    "repay-assets-transaction-succeeded": [TransactionReceipt];
    "user-signed-repay-assets": [Hash];
    "user-signing-repay-assets-error": [Error];
  };

export type SupplyCollateralEvents = ApprovalEvents &
  CommonEvents & {
    "pre-supply-collateral": [];
    "supply-collateral-failed": [Error];
    "supply-collateral-failed-validation": [string];
    "supply-collateral-settled": [];
    "supply-collateral-transaction-reverted": [TransactionReceipt];
    "supply-collateral-transaction-succeeded": [TransactionReceipt];
    "user-signed-supply-collateral": [Hash];
    "user-signing-supply-collateral-error": [Error];
  };

export type SupplyCollateralAndBorrowEvents = Omit<
  BorrowAssetsEvents,
  "borrow-assets-settled"
> &
  Omit<SupplyCollateralEvents, "supply-collateral-settled"> & {
    "supply-collateral-and-borrow-settled": [];
  };

export type WithdrawCollateralEvents = CommonEvents & {
  "pre-withdraw-collateral": [];
  "user-signed-withdraw-collateral": [Hash];
  "user-signing-withdraw-collateral-error": [Error];
  "withdraw-collateral-failed": [Error];
  "withdraw-collateral-failed-validation": [string];
  "withdraw-collateral-settled": [];
  "withdraw-collateral-transaction-reverted": [TransactionReceipt];
  "withdraw-collateral-transaction-succeeded": [TransactionReceipt];
};
