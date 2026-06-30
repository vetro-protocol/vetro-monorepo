import { type ReactNode } from "react";

type Props = {
  hint?: ReactNode;
  label: string;
  value: ReactNode;
};

export const StatCard = ({ hint, label, value }: Props) => (
  <div className="rounded-lg border border-neutral-200 bg-white p-4">
    <p className="text-xs font-medium text-neutral-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-neutral-950">{value}</p>
    {hint ? <div className="mt-1 text-xs text-neutral-500">{hint}</div> : null}
  </div>
);
