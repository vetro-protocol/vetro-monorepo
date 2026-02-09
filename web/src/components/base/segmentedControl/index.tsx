type SegmentOption<T extends string> = {
  label: string;
  value: T;
};

type Props<T extends string> = {
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  value: T;
};

export const SegmentedControl = <T extends string>({
  onChange,
  options,
  value,
}: Props<T>) => (
  <div className="flex w-full gap-2 border-y border-gray-200 bg-gray-50 px-6 py-3">
    {options.map((option) => (
      <button
        className={`h-8 flex-1 cursor-pointer rounded-full px-3 text-sm font-semibold transition-all ${
          value === option.value
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
        key={option.value}
        onClick={() => onChange(option.value)}
        type="button"
      >
        {option.label}
      </button>
    ))}
  </div>
);
