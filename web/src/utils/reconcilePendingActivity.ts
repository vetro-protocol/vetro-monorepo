import type { Hash, TransactionReceipt } from "viem";

import type { Activity } from "../components/base/activityList/types";

type ReceiptReader = (
  hash: Hash,
) => Promise<Pick<TransactionReceipt, "status">>;

export async function getPendingActivityStatus({
  activity,
  getReceipt,
}: {
  activity: Activity;
  getReceipt: ReceiptReader;
}): Promise<"completed" | "failed" | undefined> {
  if (activity.status !== "pending" || activity.page === "bridge") {
    return undefined;
  }

  try {
    const receipt = await getReceipt(activity.txHash as Hash);
    return receipt.status === "success" ? "completed" : "failed";
  } catch {
    // A missing receipt means the transaction is still pending, or the RPC is
    // temporarily unavailable. Keep the activity pending in both cases.
    return undefined;
  }
}
