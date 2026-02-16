import { useTranslation } from "react-i18next";

import { ClockIcon } from "../../icons/clockIcon";
import { DownloadIcon } from "../../icons/downloadIcon";
import { PaymentIcon } from "../../icons/paymentIcon";

export function EmptyState() {
  const { t } = useTranslation();

  const steps = [
    {
      description: t("pages.earn.exit-tickets.empty-step-1-description"),
      icon: <DownloadIcon />,
      title: t("pages.earn.exit-tickets.empty-step-1-title"),
    },
    {
      description: t("pages.earn.exit-tickets.empty-step-2-description"),
      icon: <ClockIcon />,
      title: t("pages.earn.exit-tickets.empty-step-2-title"),
    },
    {
      description: t("pages.earn.exit-tickets.empty-step-3-description"),
      icon: <PaymentIcon />,
      title: t("pages.earn.exit-tickets.empty-step-3-title"),
    },
  ];

  return (
    <div className="flex flex-col gap-10 border-b border-gray-200 bg-white px-8 py-12 md:flex-row md:items-start md:justify-center">
      {steps.map((step) => (
        <div
          className="flex flex-col gap-3 md:w-60 md:items-center"
          key={step.title}
        >
          {step.icon}
          <div className="text-xsm flex flex-col gap-0.5 leading-5 md:text-center md:leading-normal">
            <span className="font-semibold text-gray-900">{step.title}</span>
            <span className="font-normal text-gray-500">
              {step.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
