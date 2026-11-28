import { Button } from "components/base/button";
import { Tooltip } from "components/tooltip";
import { type ComponentProps, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { isGeoRestricted } from "utils/geoRestriction";

type Props = ComponentProps<typeof Button> & {
  tooltip?: ReactNode;
};

export const GeoRestrictedButton = function ({
  disabled,
  onClick,
  tooltip,
  ...props
}: Props) {
  const { t } = useTranslation();
  const geoRestricted = isGeoRestricted();
  const tooltipContent = geoRestricted
    ? t("common.geo-restriction-title")
    : tooltip;

  const button = (
    <Button
      {...props}
      disabled={disabled || geoRestricted}
      onClick={function (event) {
        if (!isGeoRestricted()) {
          onClick?.(event);
        }
      }}
    />
  );

  return tooltipContent ? (
    <Tooltip content={tooltipContent}>{button}</Tooltip>
  ) : (
    button
  );
};
