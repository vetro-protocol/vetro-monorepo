import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { SegmentedControl } from "components/base/segmentedControl";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeAmount } from "utils/sanitizeAmount";

import { StakeDepositForm } from "./stakeDepositForm";
import { StakeWithdrawForm } from "./stakeWithdrawForm";
import type { StakeMode } from "./types";

type Props = {
  mode: StakeMode;
  onClose: VoidFunction;
  onModeChange: (mode: StakeMode) => void;
};

export function StakeDrawerContent({ mode, onClose, onModeChange }: Props) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("0");

  function handleInputChange(value: string) {
    const result = sanitizeAmount(value);
    if (!("error" in result)) {
      setInputValue(result.value);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.earn.stake.manage-position")}</DrawerTitle>
      <div className="mt-8">
        <SegmentedControl
          onChange={onModeChange}
          options={[
            { label: t("pages.earn.stake.deposit"), value: "deposit" },
            { label: t("pages.earn.stake.withdraw"), value: "withdraw" },
          ]}
          value={mode}
        />
      </div>

      {mode === "deposit" ? (
        <StakeDepositForm
          inputValue={inputValue}
          onClose={onClose}
          onInputChange={handleInputChange}
        />
      ) : (
        <StakeWithdrawForm
          inputValue={inputValue}
          onClose={onClose}
          onInputChange={handleInputChange}
        />
      )}
    </div>
  );
}
