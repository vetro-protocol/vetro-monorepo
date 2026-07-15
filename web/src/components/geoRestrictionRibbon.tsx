import { useTranslation } from "react-i18next";

import { CircleWarningIcon } from "./icons/circleWarningIcon";

export function GeoRestrictionRibbon() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 bg-gray-900 px-4 py-3">
      <CircleWarningIcon />
      <p className="text-b-medium text-white">
        <span>{t("common.geo-restriction-title")}.</span>
        <span className="text-white/64 max-md:hidden">
          {" "}
          {t("common.restriction-description")}
        </span>
      </p>
    </div>
  );
}
