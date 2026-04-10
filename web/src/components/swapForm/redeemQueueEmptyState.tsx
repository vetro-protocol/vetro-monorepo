import { useVusd } from "hooks/useVusd";
import { useWithdrawalDelay } from "hooks/useWithdrawalDelay";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { getTokenListParams } from "utils/tokenList";

const StartWithVusdIcon = () => (
  <svg fill="none" height="28" width="28" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 2.25a11.75 11.75 0 1 1 0 23.5 11.75 11.75 0 0 1 0-23.5Zm0 4.25a1.812 1.812 0 0 0-1.813 1.813v7l-1.28-1.282-.008-.006-.005-.005-.134-.114a1.813 1.813 0 0 0-2.428 2.675l.006.006.006.007 4.375 4.375a1.814 1.814 0 0 0 2.429.12l.133-.12 4.374-4.376a1.812 1.812 0 0 0 .565-1.281 1.814 1.814 0 0 0-2.55-1.688 1.814 1.814 0 0 0-.576.407l-1.282 1.281v-7A1.812 1.812 0 0 0 14 6.5Z"
      fill="#D9EBFF"
      stroke="#416BFF"
    />
    <g clipPath="url(#rv1)">
      <rect fill="#416BFF" height={10} rx={5} width={10} x={18} y={18} />
      <path
        d="M22.813 26v-3.896h-1.216v-.792h.488c.68 0 .944-.24.944-.992h.824V26h-1.04Z"
        fill="#EAF4FF"
      />
    </g>
    <defs>
      <clipPath id="rv1">
        <rect fill="#fff" height={10} rx={5} width={10} x={18} y={18} />
      </clipPath>
    </defs>
  </svg>
);

const CooldownIcon = () => (
  <svg fill="none" height="28" width="28" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14 2.25a11.75 11.75 0 1 1 0 23.5 11.75 11.75 0 0 1 0-23.5Zm0 2.5a1.812 1.812 0 0 0-1.813 1.813V14c0 1 .812 1.813 1.813 1.813h5.688a1.812 1.812 0 0 0 0-3.626h-3.875V6.564A1.812 1.812 0 0 0 14 4.75Z"
      fill="#D9EBFF"
      stroke="#416BFF"
    />
    <g clipPath="url(#rv2)">
      <rect fill="#416BFF" height={10} rx={5} width={10} x={18} y={18} />
      <path
        d="M20.906 26c0-1.376.512-2.168 2.072-2.984.776-.408 1.056-.632 1.056-1.112 0-.472-.312-.808-.92-.808-.648 0-1.032.376-1.12 1.064l-1.072-.064c.112-1.184.896-1.904 2.192-1.904 1.256 0 1.992.688 1.992 1.696 0 .872-.408 1.28-1.52 1.872-.944.504-1.4.984-1.432 1.336h2.952V26h-4.2Z"
        fill="#EAF4FF"
      />
    </g>
    <defs>
      <clipPath id="rv2">
        <rect fill="#fff" height={10} rx={5} width={10} x={18} y={18} />
      </clipPath>
    </defs>
  </svg>
);

const RedeemIcon = () => (
  <svg fill="none" height="28" width="28" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m20.991 5.75.322.018A3 3 0 0 1 24 8.75v10.5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8.75a3 3 0 0 1 2.687-2.982l.322-.018H20.99ZM7 11.75c-.76 0-1.375.616-1.375 1.375V14.5h2.943l.183.007a2.472 2.472 0 0 1 2.076 1.462c1.222 2.748 5.124 2.748 6.346 0a2.472 2.472 0 0 1 2.076-1.462l.183-.007h2.943v-1.375c0-.76-.616-1.375-1.375-1.375H7Zm0-4.375c-.76 0-1.375.616-1.375 1.375v1.633l.625-.161c.144-.037.29-.064.436-.08l.323-.017H20.99l.323.018c.146.015.291.041.436.079l.625.16V8.75c0-.76-.616-1.375-1.375-1.375H7Z"
      fill="#D9EBFF"
      stroke="#416BFF"
    />
    <g clipPath="url(#rv3)">
      <rect fill="#416BFF" height={10} rx={5} width={10} x={18} y={18} />
      <path
        d="M22.981 26.128c-1.36 0-2.112-.68-2.16-1.728l1.064-.048c.056.608.472.872 1.096.872.624 0 1.128-.264 1.128-.872s-.456-.912-1.144-.912h-.496v-.824h.496c.544 0 .96-.208.96-.752 0-.48-.304-.768-.936-.768-.64 0-.944.28-1 .696l-1.064-.056c.112-.928.84-1.544 2.064-1.544 1.28 0 2.008.608 2.008 1.576 0 .592-.352 1.008-.992 1.208.744.2 1.176.712 1.176 1.432 0 1.08-.872 1.72-2.2 1.72Z"
        fill="#EAF4FF"
      />
    </g>
    <defs>
      <clipPath id="rv3">
        <rect fill="#fff" height={10} rx={5} width={10} x={18} y={18} />
      </clipPath>
    </defs>
  </svg>
);

type Props = {
  whitelistedTokens: Token[];
};

export function RedeemQueueEmptyState({ whitelistedTokens }: Props) {
  const { t } = useTranslation();
  const { data: vusd } = useVusd();
  const { symbol } = vusd;
  const { data: seconds } = useWithdrawalDelay({
    select: (data) => Number(data),
  });

  const steps = [
    {
      description: t("pages.swap.redeem-queue.empty-step-1-description", {
        symbol,
      }),
      icon: <StartWithVusdIcon />,
      title: t("pages.swap.redeem-queue.empty-step-1-title", { symbol }),
    },
    {
      description: t("pages.swap.redeem-queue.empty-step-2-description", {
        count: seconds,
        seconds,
        symbol,
      }),
      icon: <CooldownIcon />,
      title: t("pages.swap.redeem-queue.empty-step-2-title", { symbol }),
    },
    {
      description: t(
        "pages.swap.redeem-queue.empty-step-3-description",
        getTokenListParams(whitelistedTokens),
      ),
      icon: <RedeemIcon />,
      title: t("pages.swap.redeem-queue.empty-step-3-title"),
    },
  ];

  return (
    <div className="flex w-full flex-col gap-8 border-b border-gray-200 bg-white px-4 py-10 md:flex-row md:items-start md:justify-center md:gap-10 md:px-8 md:py-12">
      {steps.map((step) => (
        <div
          className="flex flex-col gap-3 md:w-60 lg:items-center"
          key={step.title}
        >
          {step.icon}
          <div className="text-b-regular flex flex-col gap-0.5 lg:text-center">
            <span className="font-semibold text-gray-900">{step.title}</span>
            <span className="text-b-regular text-gray-500">
              {step.description}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
