export type ActivityPage = "borrow" | "earn" | "swap";

export type ActivityStatus = "concluded" | "failed" | "pending";

export type Activity = {
  date: number;
  page: ActivityPage;
  status: ActivityStatus;
  text: string;
  title: string;
};
