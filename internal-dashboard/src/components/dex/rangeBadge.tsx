// Small neutral chip marking which view of a pool a row is — e.g. "Full range" or
// a concentrated price band like "$0.96–$1.04".
export const RangeBadge = ({ label }: { label: string }) => (
  <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-neutral-300/60 ring-inset">
    {label}
  </span>
);
