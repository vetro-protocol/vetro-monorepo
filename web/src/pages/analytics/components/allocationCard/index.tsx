import type { ReactNode } from "react";

import type { AllocationItem } from "../../types";

import { AllocationChart } from "./allocationChart";
import { AllocationLegend } from "./allocationLegend";

type Props = {
  icon: ReactNode;
  items: AllocationItem[];
  label: string;
  value: string;
};

export const AllocationCard = ({ icon, items, label, value }: Props) => (
  <div className="flex flex-1 flex-col">
    <div className="px-6 md:px-14">
      <div className="flex flex-col gap-3 border-t border-blue-500 py-6">
        <div className="flex items-center justify-between">
          <span className="text-b-medium text-gray-900">{label}</span>
          <div className="size-4">{icon}</div>
        </div>
        <h3 className="text-h3 font-semibold text-gray-900">{value}</h3>
      </div>
    </div>
    <AllocationChart items={items} />
    <AllocationLegend items={items} />
  </div>
);
