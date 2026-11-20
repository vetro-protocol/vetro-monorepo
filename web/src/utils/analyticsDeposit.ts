import type { fetchAnalyticsNetRevenue } from "fetchers/fetchAnalyticsNetRevenue";
import type { fetchAnalyticsYield } from "fetchers/fetchAnalyticsYield";
import { type Address, isAddressEqual } from "viem";

export type AnalyticsNetRevenue = Awaited<
  ReturnType<typeof fetchAnalyticsNetRevenue>
>;
export type AnalyticsYield = Awaited<ReturnType<typeof fetchAnalyticsYield>>;

const toApy = ({
  balance,
  projectedYield,
}: {
  balance: bigint;
  projectedYield: bigint | null;
}) =>
  projectedYield === null || balance === 0n
    ? null
    : (Number(projectedYield) / Number(balance)) * 100;

export const addDepositToYield = function ({
  amount,
  data,
  token,
}: {
  amount: bigint;
  data: AnalyticsYield;
  token: Address;
}) {
  const balance = data.total.balance + amount;
  return {
    items: data.items.map((item) =>
      item.type === "reserve" && isAddressEqual(item.token, token)
        ? { ...item, balance: item.balance + amount }
        : item,
    ),
    total: {
      ...data.total,
      apy: toApy({ balance, projectedYield: data.total.projectedYield }),
      balance,
    },
  };
};

export const addDepositToNetRevenue = function ({
  amount,
  data,
}: {
  amount: bigint;
  data: AnalyticsNetRevenue;
}) {
  const backendBalance = data.backendBalance + amount;
  return {
    ...data,
    backendApy: toApy({
      balance: backendBalance,
      projectedYield: data.backendYield,
    }),
    backendBalance,
  };
};
