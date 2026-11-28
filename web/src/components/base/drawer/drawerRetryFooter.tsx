import { CollapsibleSection } from "components/collapsibleSection";
import { GeoRestrictedButton } from "components/geoRestrictedButton";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useTranslation } from "react-i18next";

type Props = {
  onRetry?: VoidFunction;
};

export function DrawerRetryFooter({ onRetry }: Props) {
  const { t } = useTranslation();
  const { render, show } = useAnimatedVisibility(!!onRetry);

  if (!render) {
    return null;
  }

  return (
    <CollapsibleSection show={show}>
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full [&_button]:w-full">
        <GeoRestrictedButton onClick={onRetry} size="small" variant="primary">
          {t("common.retry")}
        </GeoRestrictedButton>
      </div>
    </CollapsibleSection>
  );
}
