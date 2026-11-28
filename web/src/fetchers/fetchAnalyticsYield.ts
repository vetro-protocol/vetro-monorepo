import type { StrategySource } from "@vetro-protocol/core";
import fetch from "fetch-plus-plus";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type YieldResponse = {
  items: (
    | {
        address: Address;
        apy?: number;
        balance: string;
        name: string;
        projectedYield?: string;
        source?: StrategySource;
        token: Address;
        type: "strategy";
      }
    | {
        apy: number;
        balance: string;
        projectedYield: string;
        token: Address;
        type: "reserve";
      }
  )[];
  total: {
    apy: number | null;
    balance: string;
    projectedYield: string | null;
  };
};

export const fetchAnalyticsYield = async function (gatewayAddress: Address) {
  const { items, total } = (await fetch(
    `${apiUrl}/analytics/yield/${gatewayAddress}`,
  )) as YieldResponse;
  return {
    items: items.map((item) => ({
      ...item,
      balance: BigInt(item.balance),
      projectedYield:
        item.projectedYield === undefined
          ? undefined
          : BigInt(item.projectedYield),
    })),
    total: {
      apy: total.apy,
      balance: BigInt(total.balance),
      projectedYield:
        total.projectedYield === null ? null : BigInt(total.projectedYield),
    },
  };
};
