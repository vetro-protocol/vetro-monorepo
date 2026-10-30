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
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        show ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 *:w-full">
          <Button onClick={onRetry} size="small" variant="primary">
            {t("common.retry")}
          </Button>
        </div>
      </div>
    </div>
  );
}
