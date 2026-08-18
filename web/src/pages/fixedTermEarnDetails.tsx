import { Breadcrumb } from "components/base/breadcrumb";
import { BreadcrumbSelector } from "components/base/breadcrumb/breadcrumbSelector";
import { ButtonLink } from "components/base/button";
import { VaultHeader } from "components/earn/vaultHeader";
import { EarnIcon } from "components/navbar/earnIcon";
import { TokenLogo } from "components/tokenLogo";
import { useShareToken } from "hooks/useShareToken";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { targetYieldVaultAddresses } from "pages/earn/targetYieldVaults";
import { useTranslation } from "react-i18next";
import Skeleton from "react-loading-skeleton";
import { Navigate, useParams } from "react-router";
import { type Address, isAddress, isAddressEqual } from "viem";

const VaultDropdownItem = function ({
  stakingVaultAddress,
}: {
  stakingVaultAddress: Address;
}) {
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);
  const { data: shareToken } = useShareToken(stakingVaultAddress);

  if (!peggedToken || !shareToken) {
    return <Skeleton height={20} width={80} />;
  }

  return (
    <div className="flex items-center gap-2">
      <TokenLogo {...peggedToken} size="small" />
      <span>{shareToken.symbol}</span>
    </div>
  );
};

const FixedTermEarnDetailsContent = function ({
  stakingVaultAddress,
}: {
  stakingVaultAddress: Address;
}) {
  const { t } = useTranslation();
  const { data: peggedToken } = useVaultPeggedToken(stakingVaultAddress);
  const { data: shareToken } = useShareToken(stakingVaultAddress);

  if (!peggedToken || !shareToken) {
    return (
      <div className="p-8">
        <Skeleton count={3} height={40} />
      </div>
    );
  }

  const otherVaultAddresses = targetYieldVaultAddresses.filter(
    (address) => !isAddressEqual(address, stakingVaultAddress),
  );

  return (
    <div className="flex flex-col">
      <Breadcrumb
        items={[
          {
            menu: (
              <ButtonLink href="/earn" size="xSmall" variant="tertiary">
                <EarnIcon className="size-4 text-gray-400" />
                {t("nav.earn")}
              </ButtonLink>
            ),
          },
          {
            menu: (
              <BreadcrumbSelector
                getItemKey={(item) => item}
                getItemUrl={(item) => `/earn/fixed-term/${item}`}
                items={otherVaultAddresses}
                renderItem={(item) => (
                  <VaultDropdownItem stakingVaultAddress={item} />
                )}
                trigger={
                  <>
                    <TokenLogo {...peggedToken} size="small" />
                    {shareToken.symbol}
                  </>
                }
                triggerId="breadcrumb-vault-selector"
              />
            ),
          },
        ]}
      />
      <VaultHeader
        peggedToken={peggedToken}
        shareTokenSymbol={shareToken.symbol}
        title={t("pages.earn.fixed-term.header-title")}
      />
    </div>
  );
};

export const FixedTermEarnDetails = function () {
  const { address, lang } = useParams<{ address: string; lang: string }>();

  const stakingVaultAddress =
    address && isAddress(address, { strict: false })
      ? targetYieldVaultAddresses.find((vault) =>
          isAddressEqual(vault, address),
        )
      : undefined;

  if (!stakingVaultAddress) {
    return <Navigate replace to={`/${lang}/not-found`} />;
  }

  return (
    <FixedTermEarnDetailsContent stakingVaultAddress={stakingVaultAddress} />
  );
};
