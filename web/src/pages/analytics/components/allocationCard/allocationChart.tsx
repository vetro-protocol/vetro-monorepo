import type { AllocationItem } from "../../types";

type Props = {
  hoveredLabel: string | null;
  items: AllocationItem[];
  onHover: (label: string | null) => void;
};

export const AllocationChart = ({ hoveredLabel, items, onHover }: Props) => (
  <div className="h-16 overflow-clip border-y border-gray-200 bg-gray-200/24">
    <div className="mx-6 flex h-full gap-1 border-x border-gray-200 bg-white p-1 md:mx-14">
      {items.map(({ amount, color, label }) => (
        <div
          className={`h-full cursor-pointer rounded-sm transition-opacity ${color} ${hoveredLabel && hoveredLabel !== label ? "opacity-20" : ""}`}
          key={label}
          onMouseEnter={() => onHover(label)}
          onMouseLeave={() => onHover(null)}
          style={{ flex: amount }}
        />
      ))}
    </div>
  </div>
);
