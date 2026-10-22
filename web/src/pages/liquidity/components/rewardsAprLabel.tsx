import { InfoIcon } from "components/icons/infoIcon";
import { Tooltip } from "components/tooltip";
import { useTranslation } from "react-i18next";

export function RewardsAprLabel() {
  const { t } = useTranslation();

  const sources = [
    {
      description: t("pages.liquidity.rewards-apr-info.curve-gauge"),
      name: "Curve Gauge",
    },
    {
      description: t("pages.liquidity.rewards-apr-info.stake-dao"),
      name: "Stake DAO",
    },
  ];

  const steps = [
    t("pages.liquidity.rewards-apr-info.step-add-liquidity"),
    t("pages.liquidity.rewards-apr-info.step-stake"),
  ];

  return (
    <span className="flex items-center gap-1">
      {t("pages.liquidity.rewards-apr")}
      <Tooltip
        content={
          <div className="flex flex-col gap-1.5 py-0.5">
            <p>{t("pages.liquidity.rewards-apr-info.title")}</p>
            {steps.map((step, index) => (
              <p key={index}>
                <span className="font-semibold">{index + 1}.</span> {step}
              </p>
            ))}
            {sources.map(({ description, name }) => (
              <p key={name}>
                <span className="font-semibold">{name}:</span> {description}
              </p>
            ))}
            <p>{t("pages.liquidity.rewards-apr-info.footer")}</p>
            <p>
              <span className="font-semibold">Merkl:</span>{" "}
              {t("pages.liquidity.rewards-apr-info.merkl")}
            </p>
          </div>
        }
      >
        <div className="*:size-3">
          <InfoIcon />
        </div>
      </Tooltip>
    </span>
  );
}
