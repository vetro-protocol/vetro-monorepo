import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
};

export const StatCard = ({ icon, label, value }: Props) => (
  <div className="flex flex-col gap-3 border-t border-blue-500 px-3 py-6">
    <div className="flex items-center justify-between">
      <span className="text-xsm font-medium text-gray-900">{label}</span>
      <div className="size-4 text-blue-500">{icon}</div>
    </div>
    <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
  </div>
);
