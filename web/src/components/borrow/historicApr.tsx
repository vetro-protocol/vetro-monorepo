import { useTranslation } from "react-i18next";

// TODO this will be implemented in the incoming PRs
export const HistoricApr = () => (
  <div className="h-72">
    <h3 className="text-b-medium mb-2 text-gray-500">
      {useTranslation().t("pages.borrow.historic-apr")}
    </h3>
  </div>
);
