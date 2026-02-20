import { Modal } from "components/base/modal";
import { StripedDivider } from "components/stripedDivider";
import { useVusd } from "hooks/useVusd";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useWithdrawalDelay } from "hooks/useWithdrawalDelay";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { secondsToBlocks } from "utils/blocks";
import { getTokenListParams } from "utils/tokenList";

type Props = {
  onClose: VoidFunction;
};

type StepSectionProps = {
  badge: string;
  children: ReactNode;
  image: ReactNode;
};

const StepBadge = ({ children }: { children: string }) => (
  <span className="w-fit rounded-full border border-blue-500 px-2 text-[13px] leading-5 font-semibold text-blue-500">
    {children}
  </span>
);

const StepSection = ({ badge, children, image }: StepSectionProps) => (
  <div className="px-12">
    <div className="relative overflow-hidden border-x border-gray-200 pt-10">
      <div className="flex min-w-7/12 flex-col gap-2 pr-[42%] pb-10 pl-10">
        <StepBadge>{badge}</StepBadge>
        {children}
      </div>
      <div className="absolute top-10 right-0 w-[41%] *:shrink">{image}</div>
    </div>
  </div>
);

export function RedeemTutorialModal({ onClose }: Props) {
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  const { data: blocks } = useWithdrawalDelay({ select: secondsToBlocks });
  const { data: whitelistedTokens } = useWhitelistedTokens();

  return (
    <Modal onClose={onClose}>
      <div className="flex max-h-[85vh] max-w-3xl flex-col overflow-y-auto rounded-lg bg-white shadow-xl">
        {/* Breadcrumb */}
        <div className="px-12">
          <p className="text-b-medium border-x border-gray-200 px-12 py-3.5 text-center text-blue-500">
            {t("pages.swap.tutorial.breadcrumb")}
          </p>
        </div>

        {/* Title */}
        <div className="border-y border-dashed border-gray-200 px-12">
          <div className="flex items-center justify-center border-x border-gray-200 bg-gray-50 px-40 py-10">
            <h2 className="text-center">{t("pages.swap.tutorial.title")}</h2>
          </div>
        </div>

        {/* Step 1 */}
        <StepSection
          badge={t("pages.swap.tutorial.step-1-badge")}
          image={<img className="shadow-lg" src="/gatewayRedeem/step1.png" />}
        >
          <p className="text-base font-semibold text-gray-500">
            <Trans
              components={{ strong: <span className="text-gray-900" /> }}
              i18nKey="pages.swap.tutorial.step-1-paragraph-1"
              values={{ symbol: vusd.symbol }}
            />
          </p>
          <p className="text-base font-semibold text-gray-500">
            {t("pages.swap.tutorial.step-1-paragraph-2", {
              blocks,
              symbol: vusd.symbol,
            })}
          </p>
        </StepSection>

        {/* Striped divider */}
        <div className="px-12">
          <div className="w-full border-x border-t border-gray-200 bg-gray-50 p-2">
            <StripedDivider />
          </div>
        </div>

        {/* Step 2 */}
        <StepSection
          badge={t("pages.swap.tutorial.step-2-badge")}
          image={<img src="/gatewayRedeem/step2.png" />}
        >
          <p className="text-base font-semibold text-gray-500">
            <Trans
              components={{ strong: <span className="text-gray-900" /> }}
              i18nKey="pages.swap.tutorial.step-2-paragraph-1"
            />
          </p>
          <p className="text-base font-semibold text-gray-500">
            {t(
              "pages.swap.tutorial.step-2-paragraph-2",
              getTokenListParams(whitelistedTokens),
            )}
          </p>
        </StepSection>
        <div className="shrink-0 px-12">
          <div className="h-12 w-full border-x border-t border-gray-200" />
        </div>
      </div>
    </Modal>
  );
}
