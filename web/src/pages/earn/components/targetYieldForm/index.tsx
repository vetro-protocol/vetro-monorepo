import type { Token } from "@vetro-protocol/core";
import { SegmentedControl } from "components/base/segmentedControl";
import { Toast } from "components/base/toast";
import {
  type DepositStep,
  initialStakeFormState,
  stakeFormReducer,
} from "pages/earn/components/earnForm/stakeFormReducer";
import { useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

import { DepositForm } from "./depositForm";
import { ExitForm } from "./exitForm";
import type { TargetYieldMode } from "./types";

type ToastData = {
  description: string;
  title: string;
};

type Props = {
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function TargetYieldForm({
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(stakeFormReducer, initialStakeFormState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<TargetYieldMode>("deposit");
  const [toast, setToast] = useState<ToastData | null>(null);

  function handleInputChange(value: string) {
    dispatch({ payload: value, type: "SET_INPUT_VALUE" });
  }

  function handleModeChange(newMode: TargetYieldMode) {
    if (newMode === mode) {
      return;
    }
    handleInputChange("0");
    setMode(newMode);
  }

  function handleSuccess(toastData: ToastData) {
    handleInputChange("0");
    setToast(toastData);
  }

  function handleResetSteps() {
    dispatch({ type: "RESET_STEPS" });
  }

  function handleDepositStepChange(step: DepositStep) {
    dispatch({ payload: step, type: "SET_DEPOSIT_STEP" });
  }

  function handleToggleApprove10x() {
    dispatch({ type: "TOGGLE_APPROVE_10X" });
  }

  function handleToastClose() {
    setToast(null);
  }

  const sharedProps = {
    inputValue: state.inputValue,
    onInputChange: handleInputChange,
    peggedToken,
    shareToken,
    stakingVaultAddress,
  };

  return (
    <>
      <div className="bg-gray-100 p-3">
        <SegmentedControl
          disabled={isDrawerOpen}
          onChange={handleModeChange}
          options={[
            { label: t("pages.earn.stake.deposit"), value: "deposit" },
            { label: t("pages.earn.fixed-term.exit"), value: "exit" },
          ]}
          size="xs"
          value={mode}
        />
      </div>
      {mode === "deposit" ? (
        <DepositForm
          {...sharedProps}
          approvalCompleted={state.approvalCompleted}
          approve10x={state.approve10x}
          depositStep={state.depositStep}
          isDrawerOpen={isDrawerOpen}
          onApprove10xToggle={handleToggleApprove10x}
          onDepositStepChange={handleDepositStepChange}
          onDrawerOpenChange={setIsDrawerOpen}
          onResetSteps={handleResetSteps}
          onSuccess={handleSuccess}
        />
      ) : (
        <ExitForm
          {...sharedProps}
          isDrawerOpen={isDrawerOpen}
          onDrawerOpenChange={setIsDrawerOpen}
          onSuccess={handleSuccess}
        />
      )}
      {toast && (
        <Toast
          autoClose
          description={toast.description}
          onClose={handleToastClose}
          title={toast.title}
        />
      )}
    </>
  );
}
