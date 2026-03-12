import { createContext, useContext } from "react";

type WalletDrawerContextValue = {
  close: VoidFunction;
};

export const WalletDrawerContext =
  createContext<WalletDrawerContextValue | null>(null);

export function useWalletDrawer() {
  const context = useContext(WalletDrawerContext);
  if (!context) {
    throw new Error("useWalletDrawer must be used within a WalletDrawer");
  }
  return context;
}
