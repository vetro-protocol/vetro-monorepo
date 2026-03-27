import RcTooltip from "rc-tooltip";
import type { ReactNode } from "react";

import "./tooltip.css";

type Props = {
  children: ReactNode;
  content: ReactNode;
  stretch?: boolean;
  useParentContainer?: boolean;
};

const getTooltipContainer = (node: HTMLElement) => node.parentElement!;

export const Tooltip = ({
  children,
  content,
  stretch = false,
  useParentContainer = false,
}: Props) => (
  <RcTooltip
    getTooltipContainer={useParentContainer ? getTooltipContainer : undefined}
    overlay={
      <div className="text-b-medium max-w-xs rounded-md bg-gray-900 px-1.5 py-1 text-white">
        {content}
      </div>
    }
    placement="top"
    showArrow={false}
    trigger={["hover"]}
  >
    <div className={`cursor-pointer ${stretch ? "size-full" : "w-fit"}`}>
      {children}
    </div>
  </RcTooltip>
);
