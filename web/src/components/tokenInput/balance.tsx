import type { ReactNode } from "react";
import { useAccount } from "wagmi";
type Props = {
  label: string;
  value: ReactNode;
};

export const Balance = function ({ label, value }: Props) {
  const { address } = useAccount();
  return (
    <>
      <span className="text-gray-500">{label}:</span>
      <span className="mr-1 text-gray-900">{address ? value : "-"}</span>
    </>
  );
};
