import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { useSwapMode } from "hooks/useSwapMode";
import { useVusd } from "hooks/useVusd";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useReducer } from "react";
import { parseTokenUnits } from "utils/token";

import { Deposit } from "./deposit";
import { Redeem } from "./redeem";
import { swapFormReducer } from "./swapFormReducer";
import type { SwapFormState } from "./types";

export function SwapForm() {
  const [mode, setMode] = useSwapMode();
  const { data: vusd } = useVusd();
  const { data: whitelistedTokens = [] } = useWhitelistedTokens();

  const firstStablecoin = whitelistedTokens[0];

  const initialState: SwapFormState = {
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

  const childProps = {
    amountBigInt,
    dispatch,
    onInputChange,
    onMaxClick,
    onToggle,
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
