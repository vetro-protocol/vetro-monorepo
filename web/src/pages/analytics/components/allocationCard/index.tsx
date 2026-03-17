import { type ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

import type { AllocationItem } from "../../types";

import { AllocationChart } from "./allocationChart";
import { AllocationLegend } from "./allocationLegend";

type Props = {
  icon: ReactNode;
  isError: boolean;
  isLoading: boolean;
  items: AllocationItem[];
  label: string;
  value: string;
};

export const AllocationCard = function ({
  icon,
  isError,
  isLoading,
  items,
  label,
  value,
}: Props) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const renderValue = function () {
    if (value) return value;
    if (isError) return "-";
    return <Skeleton height={28} width={120} />;
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-6 md:px-14">
        <div className="flex flex-col gap-3 border-t border-blue-500 py-6">
          <div className="flex items-center justify-between">
            <span className="text-b-medium text-gray-900">{label}</span>
            <div className="size-4">{icon}</div>
          </div>
          <h3 className="text-h3 text-gray-900">{renderValue()}</h3>
        </div>
      </div>
      <AllocationChart
        hoveredLabel={hoveredLabel}
        isError={isError}
        isLoading={isLoading}
        items={items}
        onHover={setHoveredLabel}
      />
      <AllocationLegend
        hoveredLabel={hoveredLabel}
        isError={isError}
        isLoading={isLoading}
        items={items}
        onHover={setHoveredLabel}
      />
    </div>
  );
};
