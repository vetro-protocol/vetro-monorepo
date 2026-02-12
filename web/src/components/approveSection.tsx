import { useTranslation } from "react-i18next";

import { ToggleButton } from "./base/toggleButton";
import infoIcon from "./icons/info.svg";
import { Tooltip } from "./tooltip";

type Props = {
  active: boolean;
  onToggle: VoidFunction;
};

export const ApproveSection = function ({ active, onToggle }: Props) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md">
      <div className="text-xsm flex cursor-default items-center gap-x-1 px-2 py-3">
        <span className="font-semibold text-gray-900">
          {t("pages.swap.form.approve-10x")}
        </span>
        <Tooltip
          content={
            <span className="block max-w-64">
              {t("pages.swap.form.approve-10x-tooltip")}
            </span>
          }
        >
          <img
            alt={t("pages.swap.form.approve-10x")}
            height={16}
            src={infoIcon}
            width={16}
          />
        </Tooltip>
        <div className="ml-auto">
          <ToggleButton active={active} onClick={onToggle} />
        </div>
      </div>
    </div>
  );
};
