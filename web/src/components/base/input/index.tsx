import { type ComponentProps, useId } from "react";

import "./input.css";

type Props = Omit<ComponentProps<"input">, "className"> & {
  error?: boolean;
  errorMessage?: string;
  label?: string;
};

export const Input = function ({
  error,
  errorMessage,
  id,
  label,
  ...props
}: Props) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const errorId = `${inputId}-error`;
  const invalid = error || Boolean(errorMessage);

  return (
    <div className="group/input flex flex-col gap-2">
      {label ? (
        <label className="text-b-medium text-gray-900" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        {...props}
        aria-describedby={
          [props["aria-describedby"], errorMessage ? errorId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={invalid || undefined}
        className="input--base"
        id={inputId}
      />
      {errorMessage ? (
        <p
          className="text-b-regular text-rose-600 transition-colors group-focus-within/input:text-gray-500"
          id={errorId}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};
