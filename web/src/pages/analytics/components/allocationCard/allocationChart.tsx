import { TokenLogo } from "components/tokenLogo";
import { Tooltip } from "components/tooltip";

import type { AllocationItem } from "../../types";

const skeletonBars = 4;

type Props = {
  hoveredLabel: string | null;
  isError: boolean;
  isLoading: boolean;
  items: AllocationItem[];
  onHover: (label: string | null) => void;
};

export const AllocationChart = ({
  hoveredLabel,
  isError,
  isLoading,
  items,
  onHover,
}: Props) => (
  <div className="h-16 overflow-clip border-y border-gray-200 bg-gray-200/24">
    <div className="mx-6 flex h-full gap-1 border-x border-gray-200 bg-white p-1 md:mx-14">
      {!isLoading &&
        !isError &&
        items.map(function ({ amount, color, label, logoURI, tooltip }) {
          const barClass = `h-full cursor-pointer rounded-sm transition-opacity ${color} ${hoveredLabel && hoveredLabel !== label ? "opacity-20" : ""}`;
          const bar = (
            <div
              className={barClass}
              onMouseEnter={() => onHover(label)}
              onMouseLeave={() => onHover(null)}
            />
          );
          return (
            <div key={label} className="h-full" style={{ flex: amount }}>
              {tooltip ? (
                <Tooltip
                  content={
                    <div className="flex items-center gap-1.5">
                      <TokenLogo logoURI={logoURI ?? ""} symbol={label} />
                      {tooltip}
                    </div>
                  }
                  stretch
                >
                  {bar}
                </Tooltip>
              ) : (
                bar
              )}
            </div>
          );
        })}
      {isError && <div className="h-full flex-1 rounded-sm bg-gray-200" />}
      {isLoading &&
        Array.from({ length: skeletonBars }).map((_, i) => (
          <div
            className="h-full flex-1 animate-pulse rounded-sm bg-gray-200"
            key={i}
          />
        ))}
    </div>
  </div>
);
