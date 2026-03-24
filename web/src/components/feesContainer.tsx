import { Children, type ReactElement, type ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ButtonIcon } from "./base/button";
import { ChevronIcon } from "./base/chevronIcon";
import type { FeeDetailsProps } from "./feeDetails";
import feesSvg from "./icons/fees.svg";
import gasSvg from "./icons/gas.svg";

type FeeChild = ReactElement<FeeDetailsProps> | false | null | undefined;

type Props = {
  children: FeeChild | FeeChild[];
  isError?: boolean;
  label?: ReactNode;
  totalFees?: ReactNode;
};

export function FeesContainer({ children, isError, label, totalFees }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // the network fee is unavoidable. So if it's the only one, we can use the "gas" icon
  const icon = Children.toArray(children).length === 1 ? gasSvg : feesSvg;

  const renderedTotalFees =
    totalFees !== undefined ? (
      totalFees
    ) : isError ? (
      "-"
    ) : (
      <Skeleton width={50} />
    );

  return (
    <div className="w-full">
      <div
        aria-controls="fees-list"
        aria-expanded={isOpen}
        className="text-xsm flex h-11 w-full cursor-pointer items-center justify-between px-2 py-3"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        {label && <span className="font-semibold text-gray-900">{label}</span>}
        <div className="ml-auto flex items-center gap-2 max-md:px-4">
          {!isOpen && (
            <>
              <img
                alt="Fees icon"
                height="16"
                src={icon}
                width={icon === feesSvg ? 28 : 16}
              />
              <span className="font-semibold text-gray-500">
                {renderedTotalFees}
              </span>
            </>
          )}
          <ButtonIcon type="button" variant="tertiary">
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
