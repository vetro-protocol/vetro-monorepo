import { SegmentedControl } from "components/base/segmentedControl";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

import { StakeDepositForm } from "./stakeDepositForm";
import { stakeReducer } from "./stakeReducer";
import { StakeWithdrawForm } from "./stakeWithdrawForm";
import type { StakeFormState, StakeMode } from "./types";

type Props = {
  mode: StakeMode;
  onClose: VoidFunction;
  onModeChange: (mode: StakeMode) => void;
};

export function StakeDrawerContent({ mode, onClose, onModeChange }: Props) {
  const { t } = useTranslation();

  const initialState: StakeFormState = {
    inputValue: "0",
  };

  const [state, dispatch] = useReducer(stakeReducer, initialState);

  return (
    <div className="flex h-full flex-col">
      <h3 className="px-6 pt-8 text-2xl font-semibold text-gray-900">
        {t("pages.earn.stake.manage-position")}
      </h3>

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
          dispatch={dispatch}
          inputValue={state.inputValue}
          onClose={onClose}
        />
      ) : (
        <StakeWithdrawForm
          dispatch={dispatch}
          inputValue={state.inputValue}
          onClose={onClose}
        />
      )}
    </div>
  );
}
