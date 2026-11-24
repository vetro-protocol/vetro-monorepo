// EIP-1193 "Disconnected": the provider is not connected to any chain.
const disconnectedErrorCode = 4900;

const extensionContextInvalidated = "Extension context invalidated";
const walletMustHaveAtLeastOneAccount = "wallet must has at least one account";

// Wallet extensions reject promises with plain objects or strings we can't act
// on. Generic RPC codes like -32603 are not matched because real errors use
// them.
export function isWalletExtensionError(exception: unknown) {
  if (typeof exception === "string") {
    return exception.includes(extensionContextInvalidated);
  }
  if (typeof exception !== "object" || exception === null) {
    return false;
  }
  const { code, message } = exception as { code?: unknown; message?: unknown };
  return (
    code === disconnectedErrorCode ||
    (typeof message === "string" &&
      (message.includes(extensionContextInvalidated) ||
        message.includes(walletMustHaveAtLeastOneAccount)))
  );
}
