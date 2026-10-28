import { ExternalLink } from "components/base/externalLink";
import { ExternalLinkIcon } from "components/icons/externalLinkIcon";
import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

import type { AllocationItem } from "./types";

const skeletonRows = 4;

type Props = {
  amountLabel?: string;
  formatAmount: (value: number) => string;
  header?: ReactNode;
  hoveredLabel: string | null;
  isError: boolean;
  isLoading: boolean;
  items: AllocationItem[];
  onHover: (label: string | null) => void;
};

export const AllocationLegend = ({
  amountLabel,
  formatAmount,
  header,
  hoveredLabel,
  isError,
  isLoading,
  items,
  onHover,
}: Props) => (
  <div className="@container flex flex-1 flex-col px-7 md:px-15">
    {!isLoading && !isError && (
      <>
        {header}
        {items.map(({ amount, color, details, href, label }) => (
          <div
            className={`flex cursor-pointer flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-200 py-3 transition-opacity last:border-b-0 ${hoveredLabel && hoveredLabel !== label ? "opacity-20" : ""}`}
            key={label}
            onMouseEnter={() => onHover(label)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className={`rounded-px size-1.5 shrink-0 ${color}`} />
              {href ? (
                <ExternalLink
                  className="text-b-medium group flex items-center gap-1 text-gray-900 transition-colors hover:text-blue-500 hover:underline focus-visible:text-blue-500 focus-visible:underline"
                  href={href}
                >
                  {label}
                  <ExternalLinkIcon className="shrink-0 text-gray-400 transition-colors group-hover:text-blue-500 group-focus-visible:text-blue-500" />
                </ExternalLink>
              ) : (
                <span className="text-b-medium text-gray-900">{label}</span>
              )}
            </div>
            <span
              className={`text-b-medium text-right text-gray-900 ${details ? "@md:w-24" : ""}`}
            >
              {amountLabel && <span className="sr-only">{amountLabel} </span>}
              {formatAmount(amount)}
            </span>
            {details}
          </div>
        ))}
      </>
    )}
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
