import swapToggle from "components/icons/swapToggle.svg";

type Props = {
  onClick?: VoidFunction;
};

export const SwapToggleButton = ({ onClick }: Props) => (
  <button
    aria-label="Toggle swap direction"
    className="flex size-12 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-gray-50 hover:bg-gray-100"
    onClick={onClick}
    type="button"
  >
    <img alt="Swap toggle" height={16} src={swapToggle} width={16} />
  </button>
);
