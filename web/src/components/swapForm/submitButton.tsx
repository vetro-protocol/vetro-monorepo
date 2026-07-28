import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { Spinner } from "components/base/spinner";
import { ExclamationTriangleIcon } from "components/icons/exclamationTriangleIcon";
import type { InputError } from "components/tokenInput/utils";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import { isGeoRestricted } from "utils/geoRestriction";
import { useAccount } from "wagmi";

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 flex w-full flex-col border-t border-gray-200 px-2 py-3">
    {children}
  </div>
);

type Props = {
  actionText: string;
  inputError: InputError | undefined;
  isActive: boolean | undefined;
  isActiveError?: boolean;
  isPreviewError: boolean;
  previewValue: bigint | undefined;
  token: TokenWithGateway;
};

export function SubmitButton({
  actionText,
  inputError,
  isActive,
  isActiveError = false,
  isPreviewError,
  previewValue,
  token,
}: Props) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const { data: allowance, isError: isAllowanceError } = useAllowance({
    owner: address,
    spender: token.gatewayAddress,
    token,
  });

  const { t } = useTranslation();

  const buttonProps = {
    disabled: true,
    size: "xLarge",
    type: "submit",
  } as const;

  if (isGeoRestricted()) {
    return (
      <Container>
        <Button {...buttonProps}>
          <ExclamationTriangleIcon />
          {t("common.geo-restriction-title")}
        </Button>
      </Container>
    );
  }

  if (!address) {
    return (
      <Container>
        <Button
          onClick={() => openConnectModal?.()}
          size="xLarge"
          type="button"
        >
          {t("common.connect-wallet")}
        </Button>
      </Container>
    );
  }

  if (isActive === false) {
    return (
      <Container>
        <Button {...buttonProps}>{t("pages.swap.form.swaps-paused")}</Button>
      </Container>
    );
  }

  if (inputError) {
    return (
      <Container>
        <Button {...buttonProps}>{t(`common.${inputError}`)}</Button>
      </Container>
    );
  }

  if (isActiveError) {
    return (
      <Container>
        <Button {...buttonProps}>
          {t("pages.swap.form.token-status-error")}
        </Button>
      </Container>
    );
  }

  // show error if it failed to load allowance
  if (isAllowanceError) {
    return (
      <Container>
        <Button {...buttonProps}>{t("pages.swap.form.allowance-error")}</Button>
      </Container>
    );
  }

  if (isPreviewError) {
    return (
      <Container>
        <Button {...buttonProps}>{t("pages.swap.form.preview-error")}</Button>
      </Container>
    );
  }

  const shouldShowSpinner = () =>
    isActive === undefined ||
    previewValue === undefined ||
    (allowance === undefined && !isAllowanceError);

  if (shouldShowSpinner()) {
    return (
      <Container>
        <Button {...buttonProps}>
          <Spinner />
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Button {...buttonProps} disabled={false}>
        {actionText}
      </Button>
    </Container>
  );
}
