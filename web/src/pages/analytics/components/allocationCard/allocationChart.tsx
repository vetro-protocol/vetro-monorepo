import type { AllocationItem } from "../../types";

type Props = { items: AllocationItem[] };

export const AllocationChart = ({ items }: Props) => (
  <div className="h-16 overflow-clip border-y border-gray-200 bg-gray-200/24">
    <div className="mx-6 flex h-full gap-1 border-x border-gray-200 bg-white p-1 md:mx-14">
      {items.map(({ amount, color, label }) => (
        <div
          className={`h-full rounded-sm ${color}`}
          key={label}
          style={{ flex: amount }}
        />
      ))}
    </div>
  </div>
);
