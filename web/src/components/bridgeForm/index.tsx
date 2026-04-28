import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { useNativeBalance } from "@hemilabs/react-hooks/useNativeBalance";
import { useTokenBalance } from "@hemilabs/react-hooks/useTokenBalance";
import { ApproveSection } from "components/approveSection";
import { RenderFiatValue } from "components/base/fiatValue";
import { FormSection, FormSectionItem } from "components/feesContainer";
import { SetMaxErc20Balance } from "components/setMaxErc20Balance";
import { ToTokenBalance } from "components/swapForm/toTokenBalance";
import { getSwapErrors } from "components/swapForm/validation";
import { TokenInput } from "components/tokenInput";
import { useBridgeableTokens } from "hooks/useBridgeableTokens";
import { type FormEvent, useReducer } from "react";
import { useTranslation } from "react-i18next";
import type { BridgeableToken } from "types";
import { pickToToken } from "utils/bridge";
import { parseTokenUnits } from "utils/token";

import { BridgeSubmitButton } from "./bridgeSubmitButton";
import { BridgeTokenDropdown } from "./bridgeTokenDropdown";
import { Form } from "./form";
import { bridgeFormReducer, type BridgeFormState } from "./reducer";

function getInitialState(tokens: BridgeableToken[]): BridgeFormState {
  const fromToken = tokens[0];
  return {
    approve10x: false,
    fromInputValue: "0",
    fromToken,
    toToken: pickToToken({ fromToken, tokens }),
  };
}

type ContentProps = {
  tokens: BridgeableToken[];
};

function BridgeFormContent({ tokens }: ContentProps) {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(
    bridgeFormReducer,
    tokens,
    getInitialState,
  );
  const { approve10x, fromInputValue, fromToken, toToken } = state;

  const debouncedInputValue = useDebounce(fromInputValue);
  const amountBigInt = parseTokenUnits(debouncedInputValue, fromToken);

  const { data: fromTokenBalance } = useTokenBalance({
    address: fromToken.address,
    chainId: fromToken.chainId,
  });
  const { data: nativeBalanceData } = useNativeBalance(fromToken.chainId);
  const nativeBalance = nativeBalanceData?.value;

  const balancesLoaded =
    nativeBalance !== undefined && fromTokenBalance !== undefined;

  const inputError = getSwapErrors({
    amount: amountBigInt,
    nativeBalance,
    tokenBalance: fromTokenBalance,
  });

  const fromTokens = tokens.filter(
    (token) =>
      token.chainId !== fromToken.chainId && token.chainId !== toToken.chainId,
  );

  const toTokens = tokens.filter(
    (token) =>
      token.symbol === fromToken.symbol &&
      token.chainId !== fromToken.chainId &&
      token.chainId !== toToken.chainId,
  );

  function handleFromTokenChange(token: BridgeableToken) {
    dispatch({ payload: token, type: "SET_FROM_TOKEN" });
    if (token.chainId === toToken.chainId) {
      const nextTo = pickToToken({ fromToken: token, tokens });
      dispatch({ payload: nextTo, type: "SET_TO_TOKEN" });
    }
  }

  function handleToTokenChange(token: BridgeableToken) {
    dispatch({ payload: token, type: "SET_TO_TOKEN" });
  }

  function handleInputChange(value: string) {
    dispatch({ payload: value, type: "SET_FROM_INPUT_VALUE" });
  }

  function handleMaxClick(maxValue: string) {
    dispatch({ payload: maxValue, type: "SET_FROM_INPUT_VALUE" });
  }

  function handleToggle() {
    dispatch({ type: "TOGGLE_TOKENS" });
  }

  function handleToggleApprove10x() {
    dispatch({ type: "TOGGLE_APPROVE_10X" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <>
      <Form
        amountBigInt={amountBigInt}
        errorKey={balancesLoaded ? inputError : undefined}
        fromInputValue={fromInputValue}
        fromToken={fromToken}
        fromTokenSelector={
          <BridgeTokenDropdown
            onChange={handleFromTokenChange}
            tokens={fromTokens}
            triggerLabel={t("pages.bridge.select-from-chain")}
            value={fromToken}
          />
        }
        maxButton={
          <SetMaxErc20Balance onClick={handleMaxClick} token={fromToken} />
        }
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onToggle={handleToggle}
        toSection={
          <TokenInput
            balance={<ToTokenBalance token={toToken} />}
            disabled
            fiatValue={<RenderFiatValue token={toToken} value={amountBigInt} />}
            label={t("pages.bridge.form.you-will-receive")}
            tokenSelector={
              <BridgeTokenDropdown
                onChange={handleToTokenChange}
                tokens={toTokens}
                triggerLabel={t("pages.bridge.select-to-chain")}
                value={toToken}
              />
            }
            value={fromInputValue}
          />
        }
      >
        <BridgeSubmitButton inputError={inputError} />
      </Form>
      <FormSection show={amountBigInt !== 0n}>
        <FormSectionItem>
          <ApproveSection
            active={approve10x}
            onToggle={handleToggleApprove10x}
          />
        </FormSectionItem>
      </FormSection>
    </>
  );
}

export function BridgeForm() {
  const tokens = useBridgeableTokens();
  return <BridgeFormContent tokens={tokens} />;
}
