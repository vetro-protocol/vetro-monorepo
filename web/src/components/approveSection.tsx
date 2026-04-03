import { useTranslation } from "react-i18next";

import { ToggleButton } from "./base/toggleButton";
import { InfoIcon } from "./icons/infoIcon";
import { Tooltip } from "./tooltip";

type Props = {
  active: boolean;
  onToggle?: VoidFunction;
};

export const ApproveSection = function ({ active, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <div className="text-xsm flex max-w-md cursor-default items-center gap-x-1 py-3">
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
  );
};
