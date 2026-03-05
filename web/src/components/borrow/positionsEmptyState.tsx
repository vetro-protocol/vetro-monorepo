import { useVusd } from "hooks/useVusd";
import { useTranslation } from "react-i18next";

const WalletIcon = () => (
  <svg fill="none" height="28" width="28" xmlns="http://www.w3.org/2000/svg">
    <rect fill="#EAF4FF" height="24" rx="12" width="24" x="2" y="2" />
    <rect
      height="24"
      rx="12"
      stroke="#416BFF"
      strokeOpacity="0.2"
      width="24"
      x="2"
      y="2"
    />
    <path
      d="M9.5 11.5h9a1.5 1.5 0 0 1 1.5 1.5v4.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 17.5V13a1.5 1.5 0 0 1 1.5-1.5Z"
      stroke="#416BFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <path
      d="M9.5 11.5V10a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v1.5"
      stroke="#416BFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.2"
    />
    <circle cx="17" cy="15" fill="#416BFF" r="1" />
  </svg>
);

export function PositionsEmptyState() {
  const { t } = useTranslation();
  const { data: vusd } = useVusd();

  return (
    <div className="flex items-center justify-center border-b border-gray-200 bg-white px-8 py-12">
      <div className="flex w-60 flex-col items-center gap-3">
        <WalletIcon />
        <div className="text-xsm flex flex-col gap-0.5 text-center">
          <span className="font-semibold text-gray-900">
            {t("pages.borrow.no-positions-title")}
          </span>
          <span className="font-normal text-gray-500">
            {t("pages.borrow.no-positions-description", {
              symbol: vusd.symbol,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
