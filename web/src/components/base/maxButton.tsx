type Props = {
  disabled?: boolean;
  onClick: VoidFunction;
};

export const MaxButton = ({ disabled = false, onClick }: Props) => (
  <button
    className={`text-xsm font-semibold text-blue-500 ${
      disabled
        ? "cursor-not-allowed opacity-50"
        : "cursor-pointer hover:text-blue-600"
    }`}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    MAX
  </button>
);
