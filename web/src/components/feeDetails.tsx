import Skeleton from "react-loading-skeleton";

type Props = {
  isError?: boolean;
  label: string;
  value?: string;
};

export function FeeDetails({ isError, label, value }: Props) {
  function renderValue() {
    if (value !== undefined) {
      return value;
    }

    if (isError) {
      return "-";
    }

    return <Skeleton width={50} />;
  }

  return (
    <div className="text-xsm flex cursor-default items-center justify-between border-t border-gray-200 px-2 py-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{renderValue()}</span>
    </div>
  );
}
