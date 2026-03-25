import { useTranslation } from "react-i18next";

import { ToggleButton } from "./base/toggleButton";
import { InfoIcon } from "./icons/infoIcon";
import { Tooltip } from "./tooltip";

const contentPaddingClasses = {
  compact: "max-md:px-6 px-2",
  wide: "px-8",
} as const;

type Props = {
  active: boolean;
  contentPadding?: keyof typeof contentPaddingClasses;
  onToggle?: VoidFunction;
};

export const ApproveSection = function ({
  active,
  contentPadding = "compact",
  onToggle,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md border-b border-gray-200">
      <div
        className={`text-xsm flex cursor-default items-center gap-x-1 py-3 ${contentPaddingClasses[contentPadding]}`}
      >
        <span className="font-semibold text-gray-900">
          {t("common.approve-10x")}
        </span>
        <Tooltip
          content={
            <span className="block max-w-64">
              {t("common.approve-10x-tooltip")}
            </span>
          }
        >
          <InfoIcon />
        </Tooltip>
        <div className="ml-auto">
          <ToggleButton active={active} onClick={onToggle} />
        </div>
      </div>
    </div>
  );
};
