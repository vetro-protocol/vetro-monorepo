import { Button } from "components/base/button";
import { Checkbox } from "components/base/checkbox";
import { Modal } from "components/base/modal";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { HIGH_SLIPPAGE_THRESHOLD } from "utils/slippage";

type Props = {
  onClose: VoidFunction;
  onConfirm: VoidFunction;
};

export function HighSlippageModal({ onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [accepted, setAccepted] = useState(false);

  return (
    <Modal ariaLabel={t("pages.swap.slippage.warning-title")} onClose={onClose}>
      {({ close }) => (
        <div className="flex w-full flex-col md:w-112">
          <div className="flex flex-col gap-2 p-6 pb-3">
            <h4 className="text-gray-900">
              {t("pages.swap.slippage.warning-title")}
            </h4>
            <p className="text-b-regular text-gray-500">
              <Trans
                components={{ highlight: <span className="text-rose-600" /> }}
                i18nKey="pages.swap.slippage.warning-description"
                values={{ threshold: HIGH_SLIPPAGE_THRESHOLD }}
              />
            </p>
          </div>
          <label className="text-b-regular flex cursor-pointer items-center gap-2 bg-gray-50 py-3 pl-8.5 text-gray-900">
            <Checkbox
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t("pages.swap.slippage.accept-risk")}</span>
          </label>
          <div className="flex gap-3 p-6 *:flex-1">
            <Button onClick={close} size="xSmall" variant="secondary">
              {t("pages.swap.slippage.cancel")}
            </Button>
            <Button
              disabled={!accepted}
              onClick={onConfirm}
              size="xSmall"
              variant="danger"
            >
              {t("pages.swap.slippage.continue-anyway")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
