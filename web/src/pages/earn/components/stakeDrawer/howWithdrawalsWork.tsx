import { VerticalStepper } from "components/base/verticalStepper";
import { useTranslation } from "react-i18next";

export function HowWithdrawalsWork() {
  const { t } = useTranslation();

  const steps = [
    {
      description: t("pages.earn.stake.withdraw-step-1-description"),
      title: t("pages.earn.stake.withdraw-step-1-title"),
    },
    {
      description: t("pages.earn.stake.withdraw-step-2-description"),
      title: t("pages.earn.stake.withdraw-step-2-title"),
    },
    {
      description: t("pages.earn.stake.withdraw-step-3-description"),
      title: t("pages.earn.stake.withdraw-step-3-title"),
    },
  ];

  return (
    <div className="flex flex-col gap-2 px-6">
      <p className="text-xs font-medium tracking-wide text-gray-500">
        {t("pages.earn.stake.how-withdrawals-work")}
      </p>
      <div className="border-t border-gray-200">
        <VerticalStepper mode="list" steps={steps} />
      </div>
    </div>
  );
}
