import { gatewayAddresses } from "@vetro-protocol/gateway";
import { PageTitle } from "components/base/pageTitle";
import { StripedDivider } from "components/stripedDivider";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import type { Address } from "viem";

import { CollateralizationCard } from "./components/collateralizationCard";
import { ExitQueueCard } from "./components/exitQueueCard";
import { StakedCard } from "./components/stakedCard";
import { TokenFilter } from "./components/tokenFilter";
import { TvlCard } from "./components/tvlCard";
import { YieldCard } from "./components/yieldCard";

const AllocationRow = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <>
    <div
      className={`flex flex-col border-y border-gray-200 bg-gray-100 md:flex-row ${className}`}
    >
      {children}
    </div>
    <div className="bg-gray-100">
      <StripedDivider />
    </div>
  </>
);

const TokenFilterSkeleton = () => (
  <div className="flex gap-2">
    {gatewayAddresses.map((gatewayAddress) => (
      <Skeleton
        borderRadius={9999}
        height={32}
        key={gatewayAddress}
        width={88}
      />
    ))}
  </div>
);

export const Analytics = function () {
  const { t } = useTranslation();
  const { data: peggedTokensByGateway, isError: isPeggedTokensError } =
    usePeggedTokensByGateway();
  const [selectedGatewayAddress, setSelectedGatewayAddress] = useState<Address>(
    gatewayAddresses[0],
  );

  const tokens = peggedTokensByGateway
    ? gatewayAddresses
        .map((gatewayAddress) => peggedTokensByGateway[gatewayAddress])
        .filter(Boolean)
    : undefined;

  const selectedToken = tokens?.find(
    (token) => token.gatewayAddress === selectedGatewayAddress,
  );

  return (
    <div className="flex flex-col">
      <PageTitle value={t("pages.analytics.title")} />
      {/* only show the filter if there are 2 or more tokens to filter from */}
      {gatewayAddresses.length > 1 && !isPeggedTokensError && (
        <div className="px-3 py-4 md:px-6">
          <div className="mx-auto w-fit">
            {tokens && selectedToken ? (
              <TokenFilter
                onChange={(token) =>
                  setSelectedGatewayAddress(token.gatewayAddress)
                }
                tokens={tokens}
                value={selectedToken}
              />
            ) : (
              <TokenFilterSkeleton />
            )}
          </div>
        </div>
      )}
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <TvlCard
          peggedToken={selectedToken}
          peggedTokenError={isPeggedTokensError}
        />
        <YieldCard
          peggedToken={selectedToken}
          peggedTokenError={isPeggedTokensError}
        />
      </AllocationRow>
      <AllocationRow className="md:divide-x md:divide-gray-200">
        <StakedCard
          peggedToken={selectedToken}
          peggedTokenError={isPeggedTokensError}
        />
        <ExitQueueCard
          peggedToken={selectedToken}
          peggedTokenError={isPeggedTokensError}
        />
      </AllocationRow>
      <AllocationRow className="md:justify-center">
        <div className="md:w-1/2">
          <CollateralizationCard
            peggedToken={selectedToken}
            peggedTokenError={isPeggedTokensError}
          />
        </div>
      </AllocationRow>
    </div>
  );
};
