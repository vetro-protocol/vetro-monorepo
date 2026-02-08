import { VerticalStepper } from "components/base/verticalStepper";
import { useTranslation } from "react-i18next";

export function HowWithdrawalsWork() {
  const { t } = useTranslation();

  const steps = [
    {
      description: t("pages.earn.stake.withdrawStep1Description"),
      title: t("pages.earn.stake.withdrawStep1Title"),
    },
    {
      description: t("pages.earn.stake.withdrawStep2Description"),
      title: t("pages.earn.stake.withdrawStep2Title"),
    },
    {
      description: t("pages.earn.stake.withdrawStep3Description"),
      title: t("pages.earn.stake.withdrawStep3Title"),
    },
  ];

  return (
    <div className="flex flex-col gap-2 px-6">
      <p className="text-xs font-medium tracking-wide text-gray-500">
        {t("pages.earn.stake.howWithdrawalsWork")}
      </p>
      <div className="border-t border-gray-200">
        <VerticalStepper steps={steps} />
      </div>
    </div>
  );
}
