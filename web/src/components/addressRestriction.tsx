import { useTranslation } from "react-i18next";
import { useDisconnect } from "wagmi";

import { useIsSanctioned } from "../hooks/useIsSanctioned";

import { Button } from "./base/button";
import { StatusMessage } from "./base/statusMessage";
import { GlobeIllustration } from "./globeIllustration";
import vetroLogo from "./icons/vetroLogo.svg";
import { WarningCircleIcon } from "./icons/warningCircleIcon";

export function AddressRestriction() {
  const isSanctioned = useIsSanctioned();
  const { disconnect } = useDisconnect();
  const { t } = useTranslation();

  if (!isSanctioned) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="font-geist fixed inset-0 z-9999 overflow-hidden bg-gray-50"
      role="alertdialog"
    >
      <div className="relative mx-4 h-full border-x border-gray-200 lg:mx-auto lg:max-w-5xl">
        <div className="relative flex h-40 items-center justify-center overflow-hidden lg:h-[152px]">
          <img
            alt=""
            className="pointer-events-none absolute top-1/2 left-1/2 hidden h-60 w-[1365px] -translate-x-1/2 translate-y-[-20%] opacity-3 lg:block"
            src={vetroLogo}
          />
          <img alt="Vetro" className="relative z-10 h-10" src={vetroLogo} />
        </div>
        <div className="flex flex-col items-center justify-center border-y border-gray-200 bg-white py-20">
          <StatusMessage
            action={
              <Button onClick={() => disconnect()} size="xSmall">
                {t("pages.wallet.disconnect-wallet")}
              </Button>
            }
            description={t("common.restriction-description")}
            icon={<WarningCircleIcon />}
            title={t("common.address-restriction-title")}
          />
        </div>
      </div>
      <div className="pointer-events-none fixed bottom-0 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 lg:max-w-5xl">
        <GlobeIllustration />
      </div>
    </div>
  );
}
