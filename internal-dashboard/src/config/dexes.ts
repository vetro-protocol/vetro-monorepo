// Supported DEX venues. To start tracking another, add its id to `Dex` and a
// pool source under fetchers/ that the aggregator merges in. Pools carry their
// `dex` so the UI can label and group by venue without hard-coding Curve; the
// id doubles as the display label (capitalized via CSS).
export type Dex = "curve" | "sushi";
