import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

type Props = {
  icon: ReactNode;
  isLoading?: boolean;
  label: string;
  value: string;
};

export function StatCard({ icon, isLoading, label, value }: Props) {
  const renderValue = function () {
    if (value) {
      return value;
    }
    if (isLoading) {
      return <Skeleton height={24} width={100} />;
    }
    return "-";
  };

  return (
    <div className="flex flex-col gap-3 border-t border-blue-500 px-3 py-6">
      <div className="flex items-center justify-between">
        <span className="text-b-medium text-gray-900">{label}</span>
        <div className="size-4">{icon}</div>
      </div>
      <h3 className="text-2xl font-semibold text-gray-900">{renderValue()}</h3>
    </div>
  );
}
