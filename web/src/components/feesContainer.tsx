import { type ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ButtonIcon } from "./base/button";
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

  const renderedTotalFees =
    totalFees !== undefined ? (
      totalFees
    ) : isError ? (
      "-"
    ) : (
      <Skeleton width={50} />
    );

  return (
    <div className={`w-full border-b border-gray-200`}>
      <div
        aria-controls="fees-list"
        aria-expanded={isOpen}
        className="text-xsm flex h-11 w-full cursor-pointer items-center justify-between px-2 py-3"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        <span className="font-semibold text-gray-900">{label}</span>
        <div className="flex items-center gap-2">
          {!isOpen && (
            <>
              <img alt="Fees icon" height="16" src={feesSvg} width="16" />
              <span className="font-semibold text-gray-500">
                {renderedTotalFees}
              </span>
            </>
          )}
          <ButtonIcon variant="tertiary">
            <ChevronIcon direction={isOpen ? "up" : "down"} />
          </ButtonIcon>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        id="fees-list"
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
