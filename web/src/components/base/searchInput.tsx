import { CloseIcon } from "components/icons/closeIcon";
import { type KeyboardEvent, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    viewBox="0 0 16 16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      clipRule="evenodd"
      d="M9.96559 11.0256C8.95031 11.7735 7.68993 12.1102 6.43692 11.9682C5.18392 11.8262 4.03085 11.216 3.20872 10.2598C2.38659 9.3036 1.95611 8.07209 2.00354 6.81196C2.05097 5.55182 2.57279 4.35615 3.46447 3.46447C4.35615 2.57279 5.55182 2.05097 6.81195 2.00354C8.07209 1.95611 9.3036 2.38659 10.2598 3.20872C11.216 4.03085 11.8262 5.18392 11.9682 6.43692C12.1102 7.68993 11.7735 8.95031 11.0256 9.96559L13.7806 12.7196C13.8543 12.7882 13.9134 12.871 13.9544 12.963C13.9954 13.055 14.0174 13.1544 14.0192 13.2551C14.021 13.3558 14.0024 13.4558 13.9647 13.5492C13.927 13.6426 13.8708 13.7274 13.7996 13.7986C13.7284 13.8698 13.6436 13.926 13.5502 13.9637C13.4568 14.0014 13.3568 14.02 13.2561 14.0182C13.1554 14.0164 13.056 13.9944 12.964 13.9534C12.872 13.9124 12.7892 13.8533 12.7206 13.7796L9.96559 11.0256ZM10.5006 6.99959C10.5006 7.92784 10.1318 8.81808 9.47546 9.47446C8.81908 10.1308 7.92884 10.4996 7.00059 10.4996C6.07233 10.4996 5.18209 10.1308 4.52571 9.47446C3.86934 8.81808 3.50059 7.92784 3.50059 6.99959C3.50059 6.07133 3.86934 5.18109 4.52571 4.52471C5.18209 3.86834 6.07233 3.49959 7.00059 3.49959C7.92884 3.49959 8.81908 3.86834 9.47546 4.52471C10.1318 5.18109 10.5006 6.07133 10.5006 6.99959Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

type Props = {
  ariaLabel?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  value: string;
};

export const SearchInput = function ({
  ariaLabel,
  autoFocus,
  onChange,
  onKeyDown,
  placeholder,
  value,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="text-b-medium group flex h-8 w-full items-center gap-2 rounded-full bg-white px-3 py-1.5 text-gray-900 shadow-sm outline outline-transparent transition-colors focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 focus-within:outline-blue-500 hover:bg-gray-50">
      <SearchIcon className="shrink-0 text-gray-400" />
      <input
        aria-label={ariaLabel ?? t("common.search")}
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-500 group-hover:placeholder:text-gray-600"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        type="text"
        value={value}
      />
      {value ? (
        <button
          aria-label={t("common.clear-search")}
          className="shrink-0 cursor-pointer text-gray-500 transition-colors hover:text-gray-700"
          onClick={() => onChange("")}
          type="button"
        >
          <CloseIcon size="small" />
        </button>
      ) : null}
    </div>
  );
};
