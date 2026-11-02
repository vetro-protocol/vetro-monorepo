import { CollapsibleSection } from "components/collapsibleSection";
import { useAnimatedVisibility } from "hooks/useAnimatedVisibility";
import { useTranslation } from "react-i18next";

import { Button } from "../button";

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
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
        <Button onClick={onRetry} size="small" variant="primary">
          {t("common.retry")}
        </Button>
      </div>
    </CollapsibleSection>
  );
}
