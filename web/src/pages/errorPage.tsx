import { Button } from "components/base/button";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import { StripedDivider } from "components/stripedDivider";
import { useTranslation } from "react-i18next";

const defaultTexts = {
  description: "Try refreshing the page or come back in a few.",
  refresh: "Refresh page",
  title: "Something went wrong",
};

export const ErrorPage = function () {
  const { t } = useTranslation();

  return (
    <div className="my-auto flex size-full flex-col justify-center">
      <div className="flex flex-col items-center border-t border-gray-200 bg-gray-100">
        <div className="flex flex-col items-center py-17">
          <WarningCircleIcon />
          <h5 className="mt-3 font-semibold">
            {t("pages.server-error.title", defaultTexts.title)}
          </h5>
          <p className="text-b-regular mb-3 text-gray-500">
            {t("pages.server-error.description", defaultTexts.description)}
          </p>
          <Button onClick={() => window.location.reload()} size="xSmall">
            {t("pages.server-error.refresh", defaultTexts.refresh)}
          </Button>
        </div>
        <div className="w-full border-y border-gray-200 px-1">
          <StripedDivider variant="small" />
        </div>
        <div className="flex items-center justify-center overflow-hidden py-6 max-md:px-4 md:py-2">
          <img alt="" src="/vetroLogoOutline.svg" />
        </div>
        <div className="w-full border-t border-gray-200 px-1">
          <StripedDivider variant="small" />
        </div>
      </div>
    </div>
  );
};
