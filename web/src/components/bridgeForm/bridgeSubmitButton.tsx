import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "components/base/button";
import { Spinner } from "components/base/spinner";
import { ExclamationTriangleIcon } from "components/icons/exclamationTriangleIcon";
import type { InputError } from "components/tokenInput/utils";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { isGeoRestricted } from "utils/geoRestriction";
import { useAccount } from "wagmi";

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 flex w-full flex-col border-t border-gray-200 px-2 py-3">
    {children}
  </div>
);

type Props = {
  inputError: InputError | undefined;
  isLoadingData?: boolean;
  isPending?: boolean;
  isPreviewError?: boolean;
};

export function BridgeSubmitButton({
  inputError,
  isLoadingData,
  isPending,
  isPreviewError,
}: Props) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { t } = useTranslation();

  if (isGeoRestricted()) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
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

  if (inputError) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          {t(`common.${inputError}`)}
        </Button>
      </Container>
    );
  }

  if (isPreviewError) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          {t("pages.bridge.form.preview-error")}
        </Button>
      </Container>
    );
  }

  if (isLoadingData || isPending) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          <Spinner />
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <Button size="xLarge" type="submit">
        {t("pages.bridge.form.action")}
      </Button>
    </Container>
  );
}
