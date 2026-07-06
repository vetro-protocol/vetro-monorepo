import { type ComponentProps, useId } from "react";

import "./textarea.css";

type TextAreaProps = Omit<ComponentProps<"textarea">, "className"> & {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
};

type MessageProps = {
  errorId: string;
  errorMessage?: string;
  helperId: string;
  helperText?: string;
};

// The error message takes precedence over the helper text.
const Message = function ({
  errorId,
  errorMessage,
  helperId,
  helperText,
}: MessageProps) {
  if (errorMessage) {
    return (
      <p
        className="text-b-regular text-rose-600 transition-colors group-focus-within/textarea:text-gray-500"
        id={errorId}
        role="alert"
      >
        {errorMessage}
      </p>
    );
  }
  if (helperText) {
    return (
      <p className="text-caption text-gray-500" id={helperId}>
        {helperText}
      </p>
    );
  }
  return null;
};

export const TextArea = function ({
  error,
  errorMessage,
  helperText,
  id,
  label,
  ...props
}: TextAreaProps) {
  const fallbackId = useId();
  const textareaId = id ?? fallbackId;
  const errorId = `${textareaId}-error`;
  const helperId = `${textareaId}-helper`;
  const invalid = error || Boolean(errorMessage);
  const showHelper = !errorMessage && Boolean(helperText);

  return (
    <div className="group/textarea flex flex-col gap-2">
      {label ? (
        <label className="text-b-medium text-gray-900" htmlFor={textareaId}>
          {label}
        </label>
      ) : null}
      <textarea
        {...props}
        aria-describedby={
          [
            props["aria-describedby"],
            errorMessage ? errorId : null,
            showHelper ? helperId : null,
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        aria-invalid={invalid || undefined}
        className="textarea--base"
        id={textareaId}
      />
      <Message
        errorId={errorId}
        errorMessage={errorMessage}
        helperId={helperId}
        helperText={helperText}
      />
    </div>
  );
};
