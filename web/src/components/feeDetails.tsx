type Props = {
  label: string;
  value: string;
};

export const FeeDetails = ({ label, value }: Props) => (
  <div className="text-xsm flex cursor-default items-center justify-between border-t border-gray-200 px-2 py-3">
    <span className="text-gray-500">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);
