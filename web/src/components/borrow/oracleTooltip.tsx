import { ExternalLink } from "components/base/externalLink";
import { InfoIcon } from "components/icons/infoIcon";
import { Tooltip } from "components/tooltip";
import { useMainnet } from "hooks/useMainnet";
import { formatEvmAddress } from "utils/format";
import type { Address } from "viem";

const ChainlinkLogo = () => (
  <svg
    aria-hidden="true"
    fill="#2a5ada"
    height="20"
    viewBox="0 0 37.8 43.6"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.9,0l-4,2.3L4,8.6,0,10.9V32.7L4,35l11,6.3,4,2.3,4-2.3L33.8,35l4-2.3V10.9l-4-2.3L22.9,2.3ZM8,28.1V15.5L18.9,9.2l10.9,6.3V28.1L18.9,34.4Z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height={8}
    width={8}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M.22 7.78a.75.75 0 0 1 0-1.06L5.44 1.5H1.75a.75.75 0 1 1 0-1.5h5.5A.75.75 0 0 1 8 .75v5.5a.75.75 0 0 1-1.5 0V2.56L1.28 7.78a.75.75 0 0 1-1.06 0Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

type Props = {
  oracle: Address;
};

export function OracleTooltip({ oracle }: Props) {
  const chain = useMainnet();
  const explorerBaseUrl = chain.blockExplorers!.default.url;

  return (
    <Tooltip
      content={
        <ExternalLink
          className="group flex items-center gap-2 text-white"
          href={`${explorerBaseUrl}/address/${oracle}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ChainlinkLogo />
          <span className="font-semibold">Chainlink</span>
          <span className="text-gray-400 transition-colors group-hover:text-gray-500">
            {formatEvmAddress(oracle)}
          </span>
          <ExternalLinkIcon />
        </ExternalLink>
      }
    >
      <InfoIcon />
    </Tooltip>
  );
}
