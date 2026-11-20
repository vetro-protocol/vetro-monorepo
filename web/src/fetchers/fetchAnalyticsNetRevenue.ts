import fetch from "fetch-plus-plus";
import type { Address } from "viem";

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

type NetRevenueResponse = {
  backendApy: number | null;
  backendBalance: string;
  backendYield: string | null;
  netRevenue: string | null;
  staked: string;
  stakerApy: number | null;
  stakerPayouts: string | null;
  stakingVaultAddress: Address;
};

const toBigIntOrNull = (value: string | null) =>
  value === null ? null : BigInt(value);

export const fetchAnalyticsNetRevenue = async function (
  gatewayAddress: Address,
) {
  const data = (await fetch(
    `${apiUrl}/analytics/net-revenue/${gatewayAddress}`,
  )) as NetRevenueResponse;
  return {
    backendApy: data.backendApy,
    backendBalance: BigInt(data.backendBalance),
    backendYield: toBigIntOrNull(data.backendYield),
    netRevenue: toBigIntOrNull(data.netRevenue),
    staked: BigInt(data.staked),
    stakerApy: data.stakerApy,
    stakerPayouts: toBigIntOrNull(data.stakerPayouts),
    stakingVaultAddress: data.stakingVaultAddress,
  };
};
