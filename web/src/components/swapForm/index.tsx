import { useDebounce } from "@hemilabs/react-hooks/useDebounce";
import { usePeggedTokensByGateway } from "hooks/usePeggedTokensByGateway";
import { useSwapMode } from "hooks/useSwapMode";
import { useWhitelistedTokens } from "hooks/useWhitelistedTokens";
import { useReducer } from "react";
import type { TokenWithGateway } from "types";
import { parseTokenUnits } from "utils/token";
import type { Address } from "viem";

import { Deposit } from "./deposit";
import { Redeem } from "./redeem";
import { swapFormReducer } from "./swapFormReducer";
import { SwapFormSkeleton } from "./swapFormSkeleton";
import type { SwapFormState } from "./types";

type SwapFormContentProps = {
  mode: "deposit" | "redeem";
  peggedTokensByGateway: Record<Address, TokenWithGateway>;
  setMode: (mode: "deposit" | "redeem") => void;
  whitelistedTokens: TokenWithGateway[];
};

function getInitialState({
  mode,
  peggedTokensByGateway,
  whitelistedTokens,
}: {
  mode: "deposit" | "redeem";
  peggedTokensByGateway: Record<Address, TokenWithGateway>;
  whitelistedTokens: TokenWithGateway[];
}): SwapFormState {
  const firstStablecoin = whitelistedTokens[0];
  const firstPeggedToken =
    peggedTokensByGateway[firstStablecoin.gatewayAddress];
  return {
    approve10x: false,
    fromInputValue: "0",
    fromToken: mode === "deposit" ? firstStablecoin : firstPeggedToken,
    toToken: mode === "deposit" ? firstPeggedToken : firstStablecoin,
  };
}

function SwapFormContent({
  mode,
  peggedTokensByGateway,
  setMode,
  whitelistedTokens,
}: SwapFormContentProps) {
  const peggedTokens = Object.values(peggedTokensByGateway);

  const [state, dispatch] = useReducer(
    swapFormReducer,
    { mode, peggedTokensByGateway, whitelistedTokens },
    getInitialState,
  );

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
    peggedTokens,
    whitelistedTokens,
  };

  return mode === "deposit" ? (
    <Deposit
      {...childProps}
      {...state}
      onTokenChange={function (token) {
        dispatch({ payload: token, type: "SET_FROM_TOKEN" });
        dispatch({
          payload: peggedTokensByGateway[token.gatewayAddress],
          type: "SET_TO_TOKEN",
        });
      }}
    />
  ) : (
    <Redeem
      {...childProps}
      {...state}
      onFromTokenChange={function (peggedToken) {
        dispatch({ payload: peggedToken, type: "SET_FROM_TOKEN" });
        const firstWhitelistedForGateway = whitelistedTokens.find(
          (t) => t.gatewayAddress === peggedToken.gatewayAddress,
        )!;
        dispatch({
          payload: firstWhitelistedForGateway,
          type: "SET_TO_TOKEN",
        });
      }}
      onTokenChange={(token) =>
        dispatch({ payload: token, type: "SET_TO_TOKEN" })
      }
    />
  );
}

export function SwapForm() {
  const [mode, setMode] = useSwapMode();
  const { data: whitelistedTokens } = useWhitelistedTokens();
  const { data: peggedTokensByGateway } = usePeggedTokensByGateway();

  if (whitelistedTokens === undefined || peggedTokensByGateway === undefined) {
    return <SwapFormSkeleton />;
  }

  return (
    <SwapFormContent
      mode={mode}
      peggedTokensByGateway={peggedTokensByGateway}
      setMode={setMode}
      whitelistedTokens={whitelistedTokens}
    />
  );
}
