export const CooldownStatusBadge = ({ isBehind }: { isBehind: boolean }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
      isBehind
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
    }`}
  >
    {isBehind ? "Keeper behind" : "Clear"}
  </span>
);
