export type ActivityPage = "borrow" | "earn" | "swap";

export type ActivityStatus = "completed" | "failed" | "pending";

export type Activity = {
  date: number;
  page: ActivityPage;
  status: ActivityStatus;
  text: string;
  title: string;
  txHash: string;
};
