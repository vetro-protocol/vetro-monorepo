import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

export type FeeDetailsProps = {
  className?: string;
  isError?: boolean;
  isIdle?: boolean;
  label: string;
  value?: ReactNode;
};

export function FeeDetails({
  className = "",
  isError,
  isIdle,
  label,
  value,
}: FeeDetailsProps) {
  const renderedValue =
    value !== undefined ? (
      value
    ) : isError || isIdle ? (
      "-"
    ) : (
      <Skeleton width={50} />
    );

  return (
    <div
      className={`text-xsm flex cursor-default items-center justify-between border-t border-gray-200 py-3 ${className}`}
    >
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{renderedValue}</span>
    </div>
  );
}
