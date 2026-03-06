export type ActivityAction =
  | "borrowMore"
  | "deposit"
  | "openLoan"
  | "redeem"
  | "repayPosition"
  | "supplyPosition"
  | "withdraw";

export type ActivityPage = "borrow" | "earn" | "swap";

export type ActivityStatus = "concluded" | "failed" | "pending";

export type Activity = {
  action?: ActivityAction;
  collateral?: string;
  date: number;
  label: string;
  page: ActivityPage;
  status: ActivityStatus;
  symbol?: string;
};
