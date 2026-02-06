import { useTranslation } from "react-i18next";

import { ToggleButton } from "./base/toggleButton";
import infoIcon from "./icons/info.svg";

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
        <img
          alt={t("pages.swap.form.approve-10x")}
          className="mr-auto"
          height={16}
          src={infoIcon}
          width={16}
        />
        <ToggleButton active={active} onClick={onToggle} />
      </div>
    </div>
  );
};
