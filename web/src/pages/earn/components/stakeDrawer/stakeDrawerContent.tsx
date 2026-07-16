import { DrawerTitle } from "components/base/drawer/drawerTitle";
import { SegmentedControl } from "components/base/segmentedControl";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { type TokenWithGateway } from "types";
import type { Address } from "viem";

import { StakeDepositForm } from "./stakeDepositForm";
import {
  type DepositStep,
  type WithdrawStep,
  initialStakeDrawerState,
  stakeDrawerReducer,
} from "./stakeDrawerReducer";
import { StakeWithdrawForm } from "./stakeWithdrawForm";
import type { StakeMode } from "./types";

type ToastData = {
  description: string;
  title: string;
};

type Props = {
  mode: StakeMode;
  onModeChange: (mode: StakeMode) => void;
  onSuccess: (toast: ToastData) => void;
  peggedToken: TokenWithGateway;
  stakingVaultAddress: Address;
};

export function StakeDrawerContent({
  mode,
  onModeChange,
  onSuccess,
  peggedToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    stakeDrawerReducer,
    initialStakeDrawerState,
  );

  function handleInputChange(value: string) {
    dispatch({ payload: value, type: "SET_INPUT_VALUE" });
  }

  function handleSuccess(toast: ToastData) {
    handleInputChange("0");
    onSuccess(toast);
  }

  function handleDepositStepChange(step: DepositStep) {
    dispatch({ payload: step, type: "SET_DEPOSIT_STEP" });
  }

  function handleToggleApprove10x() {
    dispatch({ type: "TOGGLE_APPROVE_10X" });
  }

  function handleWithdrawStepChange(step: WithdrawStep) {
    dispatch({ payload: step, type: "SET_WITHDRAW_STEP" });
  }

  return (
    <div className="flex h-full flex-col">
      <DrawerTitle>{t("pages.earn.stake.manage-position")}</DrawerTitle>
      <div className="border-y border-gray-200 bg-gray-50 px-6 py-3">
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
          approvalCompleted={state.approvalCompleted}
          approve10x={state.approve10x}
          depositStep={state.depositStep}
          inputValue={state.inputValue}
          onApprove10xToggle={handleToggleApprove10x}
          onDepositStepChange={handleDepositStepChange}
          onInputChange={handleInputChange}
          onSuccess={handleSuccess}
          peggedToken={peggedToken}
          stakingVaultAddress={stakingVaultAddress}
        />
      ) : (
        <StakeWithdrawForm
          inputValue={state.inputValue}
          onInputChange={handleInputChange}
          onSuccess={handleSuccess}
          onWithdrawStepChange={handleWithdrawStepChange}
          peggedToken={peggedToken}
          stakingVaultAddress={stakingVaultAddress}
          withdrawStep={state.withdrawStep}
        />
      )}
    </div>
  );
}
