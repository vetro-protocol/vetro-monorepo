import { vetroLinks } from "@vetro-protocol/core";
import {
  ExternalLink,
  inlineLinkClassName,
} from "components/base/externalLink";
import { StatusMessage } from "components/base/statusMessage";
import { WarningCircleIcon } from "components/icons/warningCircleIcon";
import { Trans, useTranslation } from "react-i18next";

export function ClaimUnavailable() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center border-y border-gray-200 bg-white px-8 py-20">
      <StatusMessage
        description={
          <Trans
            components={{
              terms: (
                <ExternalLink
                  className={inlineLinkClassName}
                  href={vetroLinks.termsOfUseUrl}
                />
              ),
            }}
            i18nKey="pages.ve-vetro.claim.unavailable-description"
          />
        }
        icon={<WarningCircleIcon />}
        title={t("pages.ve-vetro.claim.unavailable-title")}
      />
    </div>
  );
}
