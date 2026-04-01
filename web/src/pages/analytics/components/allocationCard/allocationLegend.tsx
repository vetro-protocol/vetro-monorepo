import Skeleton from "react-loading-skeleton";

import type { AllocationItem } from "../../types";

const skeletonRows = 4;

type Props = {
  formatAmount: (value: number) => string;
  hoveredLabel: string | null;
  isError: boolean;
  isLoading: boolean;
  items: AllocationItem[];
  onHover: (label: string | null) => void;
};

export const AllocationLegend = ({
  formatAmount,
  hoveredLabel,
  isError,
  isLoading,
  items,
  onHover,
}: Props) => (
  <div className="flex flex-1 flex-col px-7 md:px-15">
    {!isLoading &&
      !isError &&
      items.map(({ amount, color, label }) => (
        <div
          className={`flex cursor-pointer items-center justify-between border-b border-gray-200 py-3 transition-opacity last:border-b-0 ${hoveredLabel && hoveredLabel !== label ? "opacity-20" : ""}`}
          key={label}
          onMouseEnter={() => onHover(label)}
          onMouseLeave={() => onHover(null)}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-px size-1.5 shrink-0 ${color}`} />
            <span className="text-b-medium text-gray-900">{label}</span>
          </div>
          <span className="text-b-medium text-right text-gray-900">
            {formatAmount(amount)}
          </span>
        </div>
      ))}
    {isError &&
      Array.from({ length: skeletonRows }).map((_, i) => (
        <div
          className="flex items-center justify-between border-b border-gray-200 py-3 last:border-b-0"
          key={i}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-px size-1.5 shrink-0 bg-gray-200" />
            <span className="text-b-medium text-gray-400">-</span>
          </div>
          <span className="text-b-medium text-right text-gray-400">-</span>
        </div>
      ))}
    {isLoading &&
      Array.from({ length: skeletonRows }).map((_, i) => (
        <div
          className="flex items-center justify-between border-b border-gray-200 py-3 last:border-b-0"
          key={i}
        >
          <Skeleton width={80} />
          <Skeleton width={48} />
        </div>
      ))}
  </div>
);
