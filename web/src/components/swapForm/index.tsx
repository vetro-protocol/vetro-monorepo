import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { useSwapMode } from "hooks/useSwapMode";
import { useVusd } from "hooks/useVusd";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useReducer } from "react";
import type { Token } from "types";
import { parseTokenUnits } from "utils/token";

import { Deposit } from "./deposit";
import { Redeem } from "./redeem";
import { swapFormReducer } from "./swapFormReducer";
import { SwapFormSkeleton } from "./swapFormSkeleton";
import type { SwapFormState } from "./types";

type SwapFormContentProps = {
  mode: "deposit" | "redeem";
  setMode: (mode: "deposit" | "redeem") => void;
  vusd: Token;
  whitelistedTokens: Token[];
};

function SwapFormContent({
  mode,
  setMode,
  vusd,
  whitelistedTokens,
}: SwapFormContentProps) {
  const firstStablecoin = whitelistedTokens[0];

  const initialState: SwapFormState = {
    approve10x: false,
    fromInputValue: "0",
    fromToken: mode === "deposit" ? firstStablecoin : vusd,
    toToken: mode === "deposit" ? vusd : firstStablecoin,
  };
  const [state, dispatch] = useReducer(swapFormReducer, initialState);

  const debouncedInputValue = useDebounce(state.fromInputValue);
  const amountBigInt = parseTokenUnits(debouncedInputValue, state.fromToken);

  function onToggle() {
    setMode(mode === "deposit" ? "redeem" : "deposit");
    dispatch({ type: "TOGGLE_TOKENS" });
  }

  function onMaxClick(maxValue: string) {
    dispatch({
      payload: maxValue,
      type: "SET_FROM_INPUT_VALUE",
    });
  }

  function onInputChange(value: string) {
    dispatch({ payload: value, type: "SET_FROM_INPUT_VALUE" });
  }

  function onToggleApprove10x() {
    dispatch({ type: "TOGGLE_APPROVE_10X" });
  }

  const approveAmount = state.approve10x ? amountBigInt * 10n : undefined;

  const childProps = {
    amountBigInt,
    approveAmount,
    dispatch,
    onInputChange,
    onMaxClick,
    onToggle,
    onToggleApprove10x,
    whitelistedTokens,
  };

  return mode === "deposit" ? (
    <Deposit
      {...childProps}
      {...state}
      onTokenChange={(token) =>
        dispatch({ payload: token, type: "SET_FROM_TOKEN" })
      }
    />
  ) : (
    <Redeem
      {...childProps}
      {...state}
      onTokenChange={(token) =>
        dispatch({ payload: token, type: "SET_TO_TOKEN" })
      }
    />
  );
}

export function SwapForm() {
  const [mode, setMode] = useSwapMode();
  const { data: vusd } = useVusd();
  const { data: whitelistedTokens } = useWhitelistedTokens();

  if (vusd === undefined || whitelistedTokens === undefined) {
    return <SwapFormSkeleton />;
  }

  return (
    <SwapFormContent
      mode={mode}
      setMode={setMode}
      vusd={vusd}
      whitelistedTokens={whitelistedTokens}
    />
  );
}
