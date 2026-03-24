import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

export type FeeDetailsProps = {
  isError?: boolean;
  label: string;
  value?: ReactNode;
};

export function FeeDetails({ isError, label, value }: FeeDetailsProps) {
  const renderedValue =
    value !== undefined ? value : isError ? "-" : <Skeleton width={50} />;

  return (
    <div className="text-xsm flex cursor-default items-center justify-between border-t border-gray-200 px-2 py-3 max-md:px-6">
      <span className="text-gray-500">{label}</span>
      <span className="pr-3 font-semibold text-gray-900">{renderedValue}</span>
    </div>
  );
}
