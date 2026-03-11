type BarProps = {
  lltv: number;
  ltv: number | null;
};

type Props = {
  lltv: number;
  ltv: number | null;
  value: number | null;
};

const BAR_WIDTH = 96;

export const getHealthColor = function (ltv: number, lltv: number) {
  if (ltv >= lltv) return "text-rose-500";
  if (ltv >= lltv - 10) return "text-orange-500";
  if (ltv > lltv - 20) return "text-amber-500";
  return "text-emerald-500";
};

// Maps LTV to a pixel offset on the gradient bar (rose→orange→amber→emerald, left to right).
// The bar has 3 zones of equal width (BAR_WIDTH/3 each) between 4 color stops.
// We compute a forward position (emerald=0, rose=BAR_WIDTH) then invert it,
// because the bar is visually mirrored: rose is on the left, emerald on the right.
//   LTV in [0, lltv-20]       → emerald→amber zone
//   LTV in [lltv-20, lltv-10] → amber→orange zone
//   LTV in [lltv-10, lltv]    → orange→rose zone
//   LTV >= lltv                → pinned at rose (left edge)
export const getIndicatorPosition = function (ltv: number, lltv: number) {
  const third = BAR_WIDTH / 3;
  const greenEnd = Math.max(0, lltv - 20);
  const yellowEnd = Math.max(0, lltv - 10);

  let forward;
  if (ltv <= 0) {
    forward = 0;
  } else if (ltv <= greenEnd) {
    forward = (ltv / greenEnd) * third;
  } else if (ltv <= yellowEnd) {
    forward = third + ((ltv - greenEnd) / 10) * third;
  } else if (ltv < lltv) {
    forward = 2 * third + ((ltv - yellowEnd) / 10) * third;
  } else {
    forward = BAR_WIDTH;
  }
  return BAR_WIDTH - forward;
};

export function HealthFactorBar({ lltv, ltv }: BarProps) {
  if (ltv === null) {
    return null;
  }
  return (
    <div className="grid items-center">
      <div
        className="col-start-1 row-start-1 h-1 rounded-full"
        style={{
          background:
            "linear-gradient(to right, var(--color-rose-500), var(--color-orange-500) 33%, var(--color-amber-500) 66%, var(--color-emerald-500))",
          width: BAR_WIDTH,
        }}
      />
      <div
        className="col-start-1 row-start-1 h-3 w-1.5 rounded-full border-2 border-white bg-gray-900"
        style={{ marginLeft: getIndicatorPosition(ltv, lltv) }}
      />
    </div>
  );
}

export function HealthFactor({ lltv, ltv, value }: Props) {
  if (value === null || ltv === null) {
    return "-";
  }
  return (
    <span className={`${getHealthColor(ltv, lltv)}`}>{value.toFixed(2)}</span>
  );
}
