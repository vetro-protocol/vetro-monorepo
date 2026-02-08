import { SegmentedControl } from "components/base/segmentedControl";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";

import { StakeDepositForm } from "./stakeDepositForm";
import { stakeReducer } from "./stakeReducer";
import { StakeWithdrawForm } from "./stakeWithdrawForm";
import type { StakeFormState, StakeMode } from "./types";

type Props = {
  initialMode: StakeMode;
  onClose: VoidFunction;
  onModeChange: (mode: StakeMode) => void;
};

export function StakeDrawerContent({
  initialMode,
  onClose,
  onModeChange,
}: Props) {
  const { t } = useTranslation();

  const initialState: StakeFormState = {
    inputValue: "0",
    mode: initialMode,
  };

  const [state, dispatch] = useReducer(stakeReducer, initialState);

  function handleModeChange(mode: StakeMode) {
    dispatch({ payload: mode, type: "SET_MODE" });
    onModeChange(mode);
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="px-6 pt-8 text-2xl font-semibold text-gray-900">
        {t("pages.earn.stake.managePosition")}
      </h3>

      <div className="mt-8">
        <SegmentedControl
          onChange={handleModeChange}
          options={[
            { label: t("pages.earn.stake.deposit"), value: "deposit" },
            { label: t("pages.earn.stake.withdraw"), value: "withdraw" },
          ]}
          value={state.mode}
        />
      </div>

      {state.mode === "deposit" ? (
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
