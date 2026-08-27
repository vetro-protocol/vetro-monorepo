import type { Token } from "@vetro-protocol/core";
import { SegmentedControl } from "components/base/segmentedControl";
import { Toast } from "components/base/toast";
import { useCallback, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TokenWithGateway } from "types";
import type { Address } from "viem";

import {
  type DepositStep,
  type WithdrawStep,
  initialStakeDrawerState,
  stakeDrawerReducer,
} from "../stakeDrawer/stakeDrawerReducer";
import type { StakeMode } from "../stakeDrawer/types";

import { StakeDepositForm } from "./stakeDepositForm";
import { StakeWithdrawForm } from "./stakeWithdrawForm";

type ToastData = {
  description: string;
  title: string;
};

type Props = {
  peggedToken: TokenWithGateway;
  shareToken: Token;
  stakingVaultAddress: Address;
};

export function StakeForm({
  peggedToken,
  shareToken,
  stakingVaultAddress,
}: Props) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    stakeDrawerReducer,
    initialStakeDrawerState,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<StakeMode>("deposit");
  const [toast, setToast] = useState<ToastData | null>(null);

  const handleInputChange = useCallback(function handleInputChange(
    value: string,
  ) {
    dispatch({ payload: value, type: "SET_INPUT_VALUE" });
  }, []);

  const handleSuccess = useCallback(
    function handleSuccess(toastData: ToastData) {
      handleInputChange("0");
      setToast(toastData);
    },
    [handleInputChange],
  );

  const handleResetSteps = useCallback(function handleResetSteps() {
    dispatch({ type: "RESET_STEPS" });
  }, []);

  function handleDepositStepChange(step: DepositStep) {
    dispatch({ payload: step, type: "SET_DEPOSIT_STEP" });
  }

  function handleToggleApprove10x() {
    dispatch({ type: "TOGGLE_APPROVE_10X" });
  }

  function handleWithdrawStepChange(step: WithdrawStep) {
    dispatch({ payload: step, type: "SET_WITHDRAW_STEP" });
  }

  function handleToastClose() {
    setToast(null);
  }

  const sharedProps = {
    inputValue: state.inputValue,
    isDrawerOpen,
    onDrawerOpenChange: setIsDrawerOpen,
    onInputChange: handleInputChange,
    onResetSteps: handleResetSteps,
    onSuccess: handleSuccess,
    peggedToken,
    shareToken,
    stakingVaultAddress,
  };

  return (
    <>
      <div className="bg-gray-100 p-3">
        <SegmentedControl
          disabled={isDrawerOpen}
          onChange={setMode}
          options={[
            { label: t("pages.earn.stake.deposit"), value: "deposit" },
            { label: t("pages.earn.stake.withdraw"), value: "withdraw" },
          ]}
          size="xs"
          value={mode}
        />
      </div>
      {mode === "deposit" ? (
        <StakeDepositForm
          {...sharedProps}
          approvalCompleted={state.approvalCompleted}
          approve10x={state.approve10x}
          depositStep={state.depositStep}
          onApprove10xToggle={handleToggleApprove10x}
          onDepositStepChange={handleDepositStepChange}
        />
      ) : (
        <StakeWithdrawForm
          {...sharedProps}
          onWithdrawStepChange={handleWithdrawStepChange}
          withdrawStep={state.withdrawStep}
        />
      )}
      {toast && (
        <Toast
          autoCloseMs={5000}
          closable={true}
          description={toast.description}
          onClose={handleToastClose}
          title={toast.title}
        />
      )}
    </>
  );
}
