import { Breadcrumb } from "components/base/breadcrumb";
import { PageTitle } from "components/base/pageTitle";
import { StripedDivider } from "components/stripedDivider";
import { ClaimInfoCards } from "components/veVetro/claimInfoCards";
import { useTranslation } from "react-i18next";
import { vToken } from "utils/veVetro";

export const VeVetro = function () {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col">
      <Breadcrumb
        items={[
          { text: t("pages.ve-vetro.breadcrumb") },
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
      </div>
    </div>
  );
};
