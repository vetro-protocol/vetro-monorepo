import { vetroLinks } from "@vetro-protocol/core";
import { Checkbox } from "components/base/checkbox";
import { ExternalLink } from "components/base/externalLink";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";

const linkClassName =
  "font-medium text-blue-500 transition-colors hover:text-blue-600";

type AgreementCheckboxProps = {
  checked: boolean;
  children: ReactNode;
  disabled: boolean;
  onChange: (checked: boolean) => void;
};

const AgreementCheckbox = ({
  checked,
  children,
  disabled,
  onChange,
}: AgreementCheckboxProps) => (
  <label className="text-xsm flex cursor-pointer items-start gap-3 text-gray-900 has-disabled:cursor-not-allowed">
    <span className="flex h-5 items-center">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </span>
    <span>{children}</span>
  </label>
);

type Props = {
  disabled: boolean;
  onRestrictionChange: (checked: boolean) => void;
  onTermsChange: (checked: boolean) => void;
  restrictionAccepted: boolean;
  termsAccepted: boolean;
};

export function ClaimAgreement({
  disabled,
  onRestrictionChange,
  onTermsChange,
  restrictionAccepted,
  termsAccepted,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 px-6 pt-6">
      <div className="flex flex-col gap-2">
        <h5 className="text-gray-900">
          {t("pages.ve-vetro.claim.drawer.agreement-title")}
        </h5>
        <p className="text-xsm text-gray-500">
          {t("pages.ve-vetro.claim.drawer.agreement-description")}
        </p>
      </div>
      <AgreementCheckbox
        checked={termsAccepted}
        disabled={disabled}
        onChange={onTermsChange}
      >
        <Trans
          components={{
            privacy: (
              <ExternalLink
                className={linkClassName}
                href={vetroLinks.privacyPolicyUrl}
              />
            ),
            terms: (
              <ExternalLink
                className={linkClassName}
                href={vetroLinks.termsOfUseUrl}
              />
            ),
          }}
          i18nKey="pages.ve-vetro.claim.drawer.agreement-terms"
        />
      </AgreementCheckbox>
      <AgreementCheckbox
        checked={restrictionAccepted}
        disabled={disabled}
        onChange={onRestrictionChange}
      >
        {t("pages.ve-vetro.claim.drawer.agreement-restriction")}
      </AgreementCheckbox>
    </div>
  );
}
