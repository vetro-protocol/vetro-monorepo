import RcTooltip from "rc-tooltip";
import type { ReactNode } from "react";

import "./tooltip.css";

type Props = {
  children: ReactNode;
  content: ReactNode;
};

export const Tooltip = ({ children, content }: Props) => (
  <RcTooltip
    overlay={
      <div className="text-b-medium rounded-md bg-gray-900 px-1.5 py-1 text-white">
        {content}
      </div>
    }
    placement="top"
    showArrow={false}
    trigger={["hover"]}
  >
    <div className="w-fit cursor-pointer">{children}</div>
  </RcTooltip>
);
