import { formatUsd } from "utils/currency";

import type { AllocationItem } from "../../types";

type Props = {
  hoveredLabel: string | null;
  items: AllocationItem[];
  onHover: (label: string | null) => void;
};

export const AllocationLegend = ({ hoveredLabel, items, onHover }: Props) => (
  <div className="flex flex-col border-b border-gray-200 px-6 md:px-14">
    {items.map(({ amount, color, label }) => (
      <div
        className={`flex cursor-pointer items-center justify-between border-b border-gray-200 py-3 transition-opacity last:border-b-0 ${hoveredLabel && hoveredLabel !== label ? "opacity-20" : ""}`}
        key={label}
        onMouseEnter={() => onHover(label)}
        onMouseLeave={() => onHover(null)}
      >
        <div className="flex items-center gap-3">
          <div className={`size-1.5 shrink-0 rounded-xs ${color}`} />
          <span className="text-b-medium text-gray-900">{label}:</span>
        </div>
        <span className="text-b-medium text-right text-gray-900">
          {formatUsd(amount)}
        </span>
      </div>
    ))}
  </div>
);
