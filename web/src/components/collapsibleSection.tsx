import type { ReactNode } from "react";

export const CollapsibleSection = ({
  children,
  className = "",
  show,
}: {
  children: ReactNode;
  className?: string;
  show: boolean;
}) => (
  <div
    className={`grid transition-[grid-template-rows] duration-200 ease-out ${show ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} ${className}`}
  >
    <div aria-hidden={!show} className="overflow-hidden" inert={!show}>
      {children}
    </div>
  </div>
);
