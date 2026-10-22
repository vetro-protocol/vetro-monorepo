import fetch from "fetch-plus-plus";

// Thin wrappers over the public Curve API, for what the VETRO API doesn't
// return: the gauge emissions and the per-pool 24h fees.
const CURVE_API_BASE = "https://api.curve.finance/api";
// Curve's analytics API (same one curvemonitor uses); exposes per-pool 24h fees.
const PRICES_API_BASE = "https://prices.curve.finance/v1";
const NETWORK = "ethereum";

// Already converted out of the API's snake_case gauge fields.
type CurveGaugeInfo = {
  gauge: string;
  inflationRate: string;
  pool: string;
  relativeWeight: string;
};

// Mirrors the raw gauge entry from the Curve API (hence the snake_case fields).
type RawGauge = {
  gauge: string;
  gauge_controller?: {
    gauge_relative_weight: string;
    inflation_rate: string;
  };
  swap: string;
};

export const fetchGauges = (): Promise<CurveGaugeInfo[]> =>
  fetch(`${CURVE_API_BASE}/getAllGauges`).then((body) =>
    Object.values(body.data as Record<string, RawGauge>).map((gauge) => ({
      gauge: gauge.gauge,
      inflationRate: gauge.gauge_controller?.inflation_rate ?? "0",
      pool: gauge.swap,
      relativeWeight: gauge.gauge_controller?.gauge_relative_weight ?? "0",
    })),
  );

type CurvePoolStats = {
  liquidityFee24h: number | null;
  tradingFee24h: number | null;
  tradingVolume24h: number | null;
  tvlUsd: number | null;
};

// Rolling-24h fees and volume for a single pool, as shown on curvemonitor.
export const fetchPoolStats = (address: string): Promise<CurvePoolStats> =>
  fetch(`${PRICES_API_BASE}/pools/${NETWORK}/${address}`).then((body) => ({
    liquidityFee24h: body.liquidity_fee_24h,
    tradingFee24h: body.trading_fee_24h,
    tradingVolume24h: body.trading_volume_24h,
    tvlUsd: body.tvl_usd,
  }));
