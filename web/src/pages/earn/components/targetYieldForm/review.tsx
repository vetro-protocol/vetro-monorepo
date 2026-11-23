import { QuestionMarkCircleIcon } from "components/icons/questionMarkCircleIcon";
import { Tooltip } from "components/tooltip";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type ReviewRowProps = {
  info: string;
  label: string;
  value: ReactNode;
};

export const ReviewRow = function ({ info, label, value }: ReviewRowProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 border-b border-gray-200 py-3.5 last:border-b-0">
      <div className="text-b-medium flex items-center gap-1 text-gray-900">
        <Tooltip
          content={info}
          label={t("common.more-info-about", { topic: label })}
        >
          <QuestionMarkCircleIcon className="size-4 text-gray-400 hover:text-gray-900" />
        </Tooltip>
        {label}
      </div>
      <span className="text-h4 text-right text-gray-900">{value}</span>
    </div>
  );
};

type ReviewProps = {
  children: ReactNode;
  title: string;
};

export const Review = ({ children, title }: ReviewProps) => (
  <div className="flex flex-col px-4 py-1">
    <div className="text-b-medium border-b border-gray-200 py-3.5 text-gray-500">
      {title}
    </div>
    {children}
  </div>
);
