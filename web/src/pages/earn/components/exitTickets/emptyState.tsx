import { useCooldownDuration } from "pages/earn/hooks/useCooldownDuration";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";

import { ClockIcon } from "../../icons/clockIcon";
import { DownloadIcon } from "../../icons/downloadIcon";
import { PaymentIcon } from "../../icons/paymentIcon";

export function EmptyState() {
  const { data: cooldownDuration } = useCooldownDuration();
  const cooldownDays =
    cooldownDuration !== undefined
      ? Math.round(Number(cooldownDuration) / 86400)
      : undefined;
  const { t } = useTranslation();

  const steps = [
    {
      description: t("pages.earn.exit-tickets.empty-step-1-description"),
      icon: <DownloadIcon />,
      title: t("pages.earn.exit-tickets.empty-step-1-title"),
    },
    {
      description:
        cooldownDays !== undefined ? (
          t("pages.earn.exit-tickets.empty-step-2-description", {
            count: cooldownDays,
          })
        ) : (
          <Skeleton width={200} />
        ),
      icon: <ClockIcon />,
      title:
        cooldownDays !== undefined ? (
          t("pages.earn.exit-tickets.empty-step-2-title", {
            count: cooldownDays,
          })
        ) : (
          <Skeleton width={140} />
        ),
    },
    {
      description: t("pages.earn.exit-tickets.empty-step-3-description"),
      icon: <PaymentIcon />,
      title: t("pages.earn.exit-tickets.empty-step-3-title"),
    },
  ];

  return (
    <div className="flex flex-col gap-10 border-b border-gray-200 bg-white px-8 py-12 md:flex-row md:items-start md:justify-center">
      {steps.map((step, index) => (
        <div
          className="flex flex-col gap-3 md:w-60 md:items-center"
          key={index}
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
