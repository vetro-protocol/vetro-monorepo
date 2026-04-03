import { Children, type ReactElement, type ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

import { ChevronIcon } from "./base/chevronIcon";
import type { FeeDetailsProps } from "./feeDetails";
import feesSvg from "./icons/fees.svg";
import gasSvg from "./icons/gas.svg";

type FeeChild = ReactElement<FeeDetailsProps> | false | null | undefined;

type Props = {
  children: FeeChild | FeeChild[];
  isError?: boolean;
  isIdle?: boolean;
  label?: ReactNode;
  sectionClassName?: string;
  totalFees?: ReactNode;
};

export function FeesContainer({
  children,
  isError,
  isIdle,
  label,
  sectionClassName = "",
  totalFees,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // the network fee is unavoidable. So if it's the only one, we can use the "gas" icon
  const icon = Children.toArray(children).length === 1 ? gasSvg : feesSvg;

  const renderedTotalFees =
    totalFees !== undefined ? (
      totalFees
    ) : isError || isIdle ? (
      "-"
    ) : (
      <Skeleton width={50} />
    );

  return (
    <>
      <div
        aria-controls="fees-list"
        aria-expanded={isOpen}
        className={`text-xsm flex h-11 w-full cursor-pointer items-center justify-between ${sectionClassName}`}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
      >
        {label && <span className="font-semibold text-gray-900">{label}</span>}
        <div className="ml-auto flex items-center gap-2">
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
          <button
            className="button--base button-icon button-tertiary translate-x-1"
            type="button"
          >
            <ChevronIcon direction={isOpen ? "up" : "down"} />
          </button>
        </div>
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        id="fees-list"
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </>
  );
}

export const DrawerFeesContainer = ({ children }: { children: ReactNode }) => (
  <div className="w-full border-b border-gray-200 px-6">{children}</div>
);

export const FormSection = ({ children }: { children: ReactNode }) => (
  <div className="w-full md:max-w-md">{children}</div>
);

export const FormSectionItem = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full not-last:border-b not-last:border-gray-200 max-md:px-4 md:max-w-md *:md:px-2">
    {children}
  </div>
);
