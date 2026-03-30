import { ButtonLink } from "components/base/button";
import { SearchCircleIcon } from "components/icons/searchCircleIcon";
import { StripedDivider } from "components/stripedDivider";
import { useTranslation } from "react-i18next";

export const NotFound = function () {
  const { t } = useTranslation();

  return (
    <div className="my-auto flex size-full flex-col justify-center">
      <div className="flex flex-col items-center border-t border-gray-200 bg-gray-100">
        <div className="flex flex-col items-center py-17">
          <SearchCircleIcon />
          <h5 className="mt-3 font-semibold">{t("pages.not-found.title")}</h5>
          <p className="text-b-regular mb-3 text-gray-500">
            {t("pages.not-found.description")}
          </p>
          <ButtonLink href="/swap" variant="primary">
            {t("pages.not-found.back-to-swap")}
          </ButtonLink>
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
