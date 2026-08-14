import { type Dex, dexLabels } from "../../config/dexes";

// Per-venue pill so pools are scannable by DEX in the list and on the details page.
const styles: Record<Dex, string> = {
  curve: "bg-blue-50 text-blue-700 ring-blue-600/20",
  sushi: "bg-pink-50 text-pink-700 ring-pink-600/20",
  uniswap: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20",
};

export const VenueBadge = ({ dex }: { dex: Dex }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[dex]}`}
  >
    {dexLabels[dex]}
  </span>
);
