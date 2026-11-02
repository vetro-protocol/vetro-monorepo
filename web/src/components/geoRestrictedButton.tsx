import { Button } from "components/base/button";
import { Tooltip } from "components/tooltip";
import { type ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { isGeoRestricted } from "utils/geoRestriction";

export const GeoRestrictedButton = function ({
  disabled,
  ...props
}: ComponentProps<typeof Button>) {
  const { t } = useTranslation();
  const geoRestricted = isGeoRestricted();

  const button = <Button {...props} disabled={disabled || geoRestricted} />;

  return geoRestricted ? (
    <Tooltip content={t("common.geo-restriction-title")}>{button}</Tooltip>
  ) : (
    button
  );
};
