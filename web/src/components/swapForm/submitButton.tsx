import { useAllowance } from "@hemilabs/react-hooks/useAllowance";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { getGatewayAddress } from "@vetro/gateway";
import { Button } from "components/base/button";
import { Spinner } from "components/base/spinner";
import { useMainnet } from "hooks/useMainnet";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Token } from "types";
import { useAccount } from "wagmi";

import type { InputError } from "./types";

const Container = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 flex w-full flex-col border-t border-gray-200 px-2 py-3">
    {children}
  </div>
);

type Props = {
  actionText: string;
  inputError: InputError;
  isPreviewError: boolean;
  previewValue: bigint | undefined;
  token: Token;
};

export function SubmitButton({
  actionText,
  inputError,
  isPreviewError,
  previewValue,
  token,
}: Props) {
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const ethereumChain = useMainnet();

  const { data: allowance, isError: isAllowanceError } = useAllowance({
    owner: address,
    spender: getGatewayAddress(ethereumChain.id),
    token,
  });

  const { t } = useTranslation();

  if (!address) {
    return (
      <Container>
        <Button
          onClick={() => openConnectModal?.()}
          size="xLarge"
          type="button"
        >
          {t("pages.swap.form.connect-wallet")}
        </Button>
      </Container>
    );
  }

  if (inputError) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          {t(`pages.swap.form.${inputError}`)}
        </Button>
      </Container>
    );
  }

  // show error if it failed to load allowance
  if (isAllowanceError) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          {t("pages.swap.form.allowance-error")}
        </Button>
      </Container>
    );
  }

  if (isPreviewError) {
    return (
      <Container>
        <Button disabled size="xLarge" type="button">
          {t("pages.swap.form.preview-error")}
        </Button>
      </Container>
    );
  }

  const showSpinner = () =>
    // show spinner for loading allowance, or calculating output values
    previewValue === undefined ||
    (allowance === undefined && !isAllowanceError);

  if (showSpinner()) {
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
        {actionText}
      </Button>
    </Container>
  );
}
