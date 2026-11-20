import { describe, expect, it } from "vitest";

import type { Activity } from "../../src/components/base/activityList/types";
import { upsertActivity } from "../../src/stores/activityStore";

const createActivity = (overrides: Partial<Activity>): Activity => ({
  date: 1_700_000_000,
  page: "earn",
  status: "pending",
  text: "Deposit 100 VUSD",
  title: "Earn · Deposit",
  txHash: "0x01",
  ...overrides,
});

describe("upsertActivity", function () {
  it("prepends an activity with a new txHash", function () {
    const existing = createActivity({ txHash: "0x01" });
    const added = createActivity({ date: 1_700_000_100, txHash: "0x02" });

    expect(upsertActivity({ activities: [existing], activity: added })).toEqual(
      [added, existing],
    );
  });

  it("updates only the status of an activity with a known txHash", function () {
    const other = createActivity({ txHash: "0x02" });
    const failed = createActivity({ status: "failed", txHash: "0x01" });

    const result = upsertActivity({
      activities: [other, failed],
      activity: createActivity({
        date: 1_700_000_500,
        status: "pending",
        text: "Another text",
        txHash: "0x01",
      }),
    });

    expect(result).toEqual([other, { ...failed, status: "pending" }]);
  });
});
