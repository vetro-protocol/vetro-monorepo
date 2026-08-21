import { stakingVaultAddresses } from "@vetro-protocol/earn";
import { Breadcrumb } from "components/base/breadcrumb";
import { BreadcrumbSelector } from "components/base/breadcrumb/breadcrumbSelector";
import { ButtonLink } from "components/base/button";
import { VaultHeader } from "components/earn/vaultHeader";
import { EarnIcon } from "components/navbar/earnIcon";
import { TokenLogo } from "components/tokenLogo";
import { useVaultPeggedToken } from "hooks/useVaultPeggedToken";
import { ErrorPage } from "pages/errorPage";
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

  if (!peggedToken) {
    return <Skeleton height={20} width={80} />;
  }

  return (
    <div className="flex items-center gap-2">
      <TokenLogo {...peggedToken} size="small" />
      <span>{peggedToken.symbol}</span>
    </div>
  );
};

const VariableYieldEarnDetailsContent = function ({
  stakingVaultAddress,
}: {
  stakingVaultAddress: Address;
}) {
  const { t } = useTranslation();
  const { data: peggedToken, isError } =
    useVaultPeggedToken(stakingVaultAddress);

  if (isError) {
    return <ErrorPage />;
  }

  if (!peggedToken) {
    return (
      <div className="p-8">
        <Skeleton count={3} height={40} />
      </div>
    );
  }

  const otherVaultAddresses = stakingVaultAddresses.filter(
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
                getItemUrl={(item) => `/earn/variable-yield/${item}`}
                items={otherVaultAddresses}
                renderItem={(item) => (
                  <VaultDropdownItem stakingVaultAddress={item} />
                )}
                trigger={
                  <>
                    <TokenLogo {...peggedToken} size="small" />
                    {peggedToken.symbol}
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
        symbol={peggedToken.symbol}
        title={t("pages.earn.variable-yield.header-title")}
      />
    </div>
  );
};

export const VariableYieldEarnDetails = function () {
  const { address, lang } = useParams<{ address: string; lang: string }>();

  const stakingVaultAddress =
    address && isAddress(address, { strict: false })
      ? stakingVaultAddresses.find((vault) => isAddressEqual(vault, address))
      : undefined;

  if (!stakingVaultAddress) {
    return <Navigate replace to={`/${lang}/not-found`} />;
  }

  return (
    <VariableYieldEarnDetailsContent
      stakingVaultAddress={stakingVaultAddress}
    />
  );
};
