type Props = {
  active: boolean;
  onClick?: VoidFunction;
};

export const ToggleButton = ({ active, onClick }: Props) => (
  <button
    aria-checked={active}
    className={`h-5 w-10 cursor-pointer rounded-full p-1 transition-colors ${
      active ? "bg-blue-500 hover:bg-blue-600" : "hover:shadow-bs bg-gray-100"
    }`}
    onClick={onClick}
    role="switch"
    type="button"
  >
    <span
      className={`block h-3 w-5 rounded-full bg-white shadow-sm transition-transform ${
        active ? "translate-x-3" : "translate-x-0"
      }`}
    />
  </button>
);
