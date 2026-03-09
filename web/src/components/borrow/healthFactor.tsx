type Props = {
  value: number | null;
};

// TODO add health bar https://github.com/vetro-protocol/vetro-monorepo/issues/143
const getHealthFactorColor = function (value: number) {
  if (value >= 2) return "text-green-600";
  if (value >= 1.2) return "text-yellow-600";
  return "text-red-600";
};

export function HealthFactor({ value }: Props) {
  if (value === null) {
    return "-";
  }
  return (
    <span className={getHealthFactorColor(value)}>{value.toFixed(2)}</span>
  );
}
