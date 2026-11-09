import { Breadcrumb } from "components/base/breadcrumb";
import { ButtonLink } from "components/base/button";
import { PageTitle } from "components/base/pageTitle";
import { VeVetroIcon } from "components/navbar/veVetroIcon";
import { StripedDivider } from "components/stripedDivider";
import { ClaimInfoCards } from "components/veVetro/claimInfoCards";
import { SnapshotPositionsTable } from "components/veVetro/snapshotPositionsTable";
import { useTranslation } from "react-i18next";
import { vToken } from "utils/veVetro";

export const VeVetroClaim = function () {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <Breadcrumb
        items={[
          {
            menu: (
              <ButtonLink href="/vevetro" size="xSmall" variant="tertiary">
                <VeVetroIcon className="size-4 text-gray-400" />
                {t("pages.ve-vetro.breadcrumb")}
              </ButtonLink>
            ),
          },
          { text: t("pages.ve-vetro.claim.breadcrumb") },
        ]}
      />
      <PageTitle
        description={t("pages.ve-vetro.claim.description", {
          symbol: vToken.symbol,
        })}
        value={t("pages.ve-vetro.claim.title", { symbol: vToken.symbol })}
      />
      <div className="bg-gray-100">
        <ClaimInfoCards />
        <StripedDivider variant="small" />
        <SnapshotPositionsTable />
      </div>
    </div>
  );
};
