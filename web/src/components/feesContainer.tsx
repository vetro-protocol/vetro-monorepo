import { type ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ChevronIcon } from "./base/chevronIcon";
import feesSvg from "./icons/fees.svg";

type Props = {
  children: ReactNode;
  isError?: boolean;
  label: string;
  totalFees?: string;
};

export function FeesContainer({ children, isError, label, totalFees }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  function renderTotalFees() {
    if (totalFees !== undefined) {
      return totalFees;
    }

    if (isError) {
      return "-";
    }

    return <Skeleton width={50} />;
  }

  return (
    <div className={`w-full border-b border-gray-200`}>
      <button
        aria-controls="fees-list"
        aria-expanded={isOpen}
        className="text-xsm flex h-11 w-full cursor-pointer items-center justify-between px-2 py-3"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="font-semibold text-gray-900">{label}</span>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <>
              <img alt="Fees icon" height="16" src={feesSvg} width="16" />
              <span className="font-semibold text-gray-500">
                {renderTotalFees()}
              </span>
            </>
          )}
          <ChevronIcon direction={isOpen ? "up" : "down"} />
        </div>
      </button>

      {isOpen && (
        <div aria-hidden={!isOpen} id="fees-list">
          {children}
        </div>
      )}
    </div>
  );
}
