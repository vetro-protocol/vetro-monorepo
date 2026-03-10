import { type QueryStatus } from "@tanstack/react-query";
import { RenderCryptoValue } from "components/base/cryptoValue";
import { RenderFiatValue } from "components/base/fiatValue";
import type { Token } from "types";

type Props = {
  align?: "left" | "right";
  status?: QueryStatus;
  token: Token;
  value: bigint | undefined;
};

export const TokenValueCell = ({
  align = "right",
  status = "success",
  token,
  value,
}: Props) => (
  <div
    className={`flex flex-col gap-y-0.5 ${align === "left" ? "items-start" : "items-end"}`}
  >
    <span
      className={`text-b-medium ${align === "left" ? "text-left" : "text-right"} text-gray-900`}
    >
      <span className="mr-1">$</span>
      <RenderFiatValue queryStatus={status} token={token} value={value} />
    </span>
    <span className="text-caption text-gray-500 *:w-full">
      <RenderCryptoValue
        amountContainer={({ children }) => (
          <span
            className={`block w-full ${align === "left" ? "text-left" : "text-right"}`}
          >
            {children}
          </span>
        )}
        container={({ children }) => (
          <span className="flex w-full gap-x-0.5">{children}</span>
        )}
        showSymbol
        status={status}
        token={token}
        value={value}
      />
    </span>
  </div>
);
