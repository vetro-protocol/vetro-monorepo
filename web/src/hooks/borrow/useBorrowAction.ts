import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

const borrowActions = [
  "borrow-more",
  "repay-loan",
  "supply-collateral",
  "withdraw-collateral",
] as const;

export type BorrowAction = (typeof borrowActions)[number];

export const useBorrowAction = () =>
  useQueryStates({
    borrowAction: parseAsStringLiteral(borrowActions),
    marketId: parseAsString,
  });
