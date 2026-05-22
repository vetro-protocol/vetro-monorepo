import { SearchCircleIcon } from "components/icons/searchCircleIcon";
import { useTranslation } from "react-i18next";

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center py-12">
      <div className="flex w-60 flex-col items-center gap-3">
        <SearchCircleIcon />
        <div className="text-xsm flex flex-col gap-0.5 text-center">
          <span className="font-semibold text-gray-900">
            {t("common.no-results-found")}
          </span>
          <span className="font-normal text-gray-500">
            {t("common.try-different-search")}
          </span>
        </div>
      </div>
    </div>
  );
}
