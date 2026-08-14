// Supported DEX venues. To start tracking another, add its id to `Dex`, its
// display label to `dexLabels`, and a pool source under fetchers/ that the
// aggregator merges in. Pools carry their `dex` so the UI can label and group by
// venue without hard-coding Curve.
export type Dex = "curve" | "sushi" | "uniswap";

export const dexLabels: Record<Dex, string> = {
  curve: "Curve",
  sushi: "Sushi",
  uniswap: "Uniswap",
};
