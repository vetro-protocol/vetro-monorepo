import { formatUsd } from "utils/currency";

type Props = {
  maxDepositsUsd: number;
  totalDepositsUsd: number;
};

export const DepositsOverCapacity = ({
  maxDepositsUsd,
  totalDepositsUsd,
}: Props) => (
  <span className="flex items-center gap-1">
    <span className="text-gray-900">{formatUsd(totalDepositsUsd)}</span>
    <span className="text-gray-500">/ {formatUsd(maxDepositsUsd)}</span>
  </span>
);
