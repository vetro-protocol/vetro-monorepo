export type ActivityPage = "borrow" | "bridge" | "earn" | "swap";

type ActivityStatus = "completed" | "failed" | "pending";

export type Activity = {
  date: number;
  page: ActivityPage;
  status: ActivityStatus;
  text: string;
  title: string;
  txHash: string;
};
