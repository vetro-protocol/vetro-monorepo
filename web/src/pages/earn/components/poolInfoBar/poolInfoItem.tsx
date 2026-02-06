import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

type Props = {
  children?: ReactNode;
  isLoading?: boolean;
  label: string;
  value?: string;
};

export function PoolInfoItem({ children, isLoading, label, value }: Props) {
  function renderValue() {
    if (children) {
      return children;
    }
    if (isLoading) {
      return <Skeleton height={20} width={80} />;
    }
    if (value) {
      return (
        <span className="text-xsm font-semibold text-gray-900">{value}</span>
      );
    }
    return <span className="text-xsm font-semibold text-gray-900">-</span>;
  }

  return (
    <div className="relative flex flex-col">
      <span className="text-xsm font-normal text-gray-500">{label}</span>
      {renderValue()}
    </div>
  );
}
