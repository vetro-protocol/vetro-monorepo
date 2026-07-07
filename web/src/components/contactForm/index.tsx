import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Button } from "components/base/button";
import { Dropdown } from "components/base/dropdown";
import { Input } from "components/base/input";
import { TextArea } from "components/base/textarea";
import { Toast } from "components/base/toast";
import { ChevronUpDownIcon } from "components/icons/chevronUpDownIcon";
import { useSubmitContactForm } from "hooks/useSubmitContactForm";
import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidEmail } from "utils/email";

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
// When no site key is configured the widget can't render, so mirror the API's
// "skip when unconfigured" behavior instead of leaving the form unsubmittable.
const captchaEnabled = Boolean(turnstileSiteKey);

const topics = [
  { key: "swap", labelKey: "pages.contact.form.topic-swap" },
  { key: "bridge", labelKey: "pages.contact.form.topic-bridge" },
  { key: "earn", labelKey: "pages.contact.form.topic-earn" },
  { key: "other", labelKey: "pages.contact.form.topic-other" },
] as const;

type Topic = (typeof topics)[number];

const topicTriggerId = "contact-topic";
const topicErrorId = `${topicTriggerId}-error`;
const maxMessageLength = 5000;

type UseValidatedFieldParams = {
  errorMessage: string;
  isValid: (value: string) => boolean;
};

// Tracks a text field's value plus its touched state, surfacing the error once
// the field has been touched and is invalid. While the field is focused the
// base Input/TextArea greys the error via `group-focus-within`. `markTouched`
// and `reset` let the form reveal or clear the field on submit and success.
function useValidatedField({ errorMessage, isValid }: UseValidatedFieldParams) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = isValid(value);
  return {
    errorMessage: touched && !valid ? errorMessage : undefined,
    markTouched() {
      setTouched(true);
    },
    props: {
      onBlur() {
        setTouched(true);
      },
      onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setValue(event.target.value);
      },
    },
    reset() {
      setTouched(false);
      setValue("");
    },
    valid,
    value,
  };
}

// Manages the Turnstile token + touched state, mirroring useValidatedField.
// `valid` is true when the captcha is disabled (nothing to solve) or a token has
// been obtained; `reset` refreshes the single-use widget for the next attempt.
function useTurnstile() {
  const ref = useRef<TurnstileInstance>(undefined);
  const [token, setToken] = useState<string>();
  const [touched, setTouched] = useState(false);
  return {
    markTouched() {
      setTouched(true);
    },
    props: {
      onError() {
        setToken(undefined);
      },
      onExpire() {
        setToken(undefined);
      },
      onSuccess: setToken,
    },
    ref,
    reset() {
      ref.current?.reset();
      setToken(undefined);
      setTouched(false);
    },
    showError: captchaEnabled && touched && !token,
    token,
    valid: !captchaEnabled || Boolean(token),
  };
}

type CaptchaFieldProps = {
  field: ReturnType<typeof useTurnstile>;
};

// Renders the Turnstile widget and its error, or nothing when the captcha is
// disabled (no site key configured).
function CaptchaField({ field }: CaptchaFieldProps) {
  const { t } = useTranslation();
  if (!captchaEnabled) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <Turnstile
        {...field.props}
        // Forcing light theme because there's no dark theme in Vetro... yet!
        options={{ size: "flexible", theme: "light" }}
        ref={field.ref}
        siteKey={turnstileSiteKey}
      />
      {field.showError ? (
        <p className="text-b-regular text-rose-600" role="alert">
          {t("pages.contact.form.captcha-error")}
        </p>
      ) : null}
    </div>
  );
}

export function ContactForm() {
  const { t } = useTranslation();
  const { mutate, reset, status } = useSubmitContactForm();

  const email = useValidatedField({
    errorMessage: t("pages.contact.form.email-error"),
    isValid: isValidEmail,
  });
  const message = useValidatedField({
    errorMessage: t("pages.contact.form.message-error"),
    isValid: (value) => value.trim().length > 0,
  });

  const [topic, setTopic] = useState<Topic>();
  const [topicTouched, setTopicTouched] = useState(false);
  const showTopicError = topicTouched && !topic;

  const turnstile = useTurnstile();

  function resetForm() {
    email.reset();
    message.reset();
    setTopic(undefined);
    setTopicTouched(false);
    turnstile.reset();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "pending") {
      return;
    }
    if (!topic || !email.valid || !message.valid || !turnstile.valid) {
      // The button stays active; on an invalid submit reveal every field's
      // error (as if each had been touched) instead of failing silently.
      email.markTouched();
      message.markTouched();
      setTopicTouched(true);
      turnstile.markTouched();
      return;
    }
    // Reset on success so the filled-in form can't be resubmitted as a duplicate.
    mutate(
      {
        category: topic.key,
        email: email.value,
        message: message.value,
        token: turnstile.token,
      },
      {
        // The token was consumed by the failed attempt; get a fresh one.
        onError: turnstile.reset,
        onSuccess: resetForm,
      },
    );
  }

  return (
    <div className="flex w-full justify-center border-y border-gray-200 bg-gray-100">
      <form
        className="flex w-full max-w-md flex-col gap-y-6 border-x border-gray-200 bg-white pt-6 *:px-6"
        noValidate
        onSubmit={handleSubmit}
      >
        <Input
          {...email.props}
          errorMessage={email.errorMessage}
          label={t("pages.contact.form.email-label")}
          placeholder="john@email.com"
          required
          type="email"
          value={email.value}
        />

        <div className="group/topic flex flex-col gap-2">
          <label
            className="text-b-medium text-gray-900"
            htmlFor={topicTriggerId}
          >
            {t("pages.contact.form.category-label")}
          </label>
          <Dropdown
            getItemKey={(item) => item.key}
            items={topics}
            matchTriggerWidth
            onChange={setTopic}
            renderItem={(item) => t(item.labelKey)}
            renderTrigger={(_isOpen, triggerProps) => (
              <button
                {...triggerProps}
                aria-describedby={showTopicError ? topicErrorId : undefined}
                aria-invalid={showTopicError || undefined}
                className="input--base flex items-center justify-between gap-2"
                onBlur={() => setTopicTouched(true)}
                type="button"
              >
                <span className={topic ? "text-gray-900" : "text-gray-500"}>
                  {topic
                    ? t(topic.labelKey)
                    : t("pages.contact.form.topic-placeholder")}
                </span>
                <ChevronUpDownIcon className="size-4 shrink-0 text-gray-500" />
              </button>
            )}
            triggerId={topicTriggerId}
            value={topic}
          />
          {showTopicError ? (
            <p
              className="text-b-regular text-rose-600 transition-colors group-focus-within/topic:text-gray-500"
              id={topicErrorId}
              role="alert"
            >
              {t("pages.contact.form.category-error")}
            </p>
          ) : null}
        </div>

        <TextArea
          {...message.props}
          errorMessage={message.errorMessage}
          helperText={t("pages.contact.form.message-helper")}
          label={t("pages.contact.form.message-label")}
          maxLength={maxMessageLength}
          placeholder={t("pages.contact.form.message-placeholder")}
          required
          value={message.value}
        />
        <CaptchaField field={turnstile} />

        <div className="border-t border-gray-200 py-4 *:w-full">
          <Button disabled={status === "pending"} size="xSmall" type="submit">
            {status === "pending"
              ? t("pages.contact.form.submitting")
              : t("pages.contact.form.submit")}
          </Button>
        </div>

        {status === "success" && (
          <Toast
            autoCloseMs={5000}
            closable
            description={t("pages.contact.toast.success-description")}
            onClose={reset}
            title={t("pages.contact.toast.success-title")}
          />
        )}
        {status === "error" && (
          <Toast
            autoCloseMs={5000}
            closable
            description={t("pages.contact.toast.error-description")}
            onClose={reset}
            title={t("pages.contact.toast.error-title")}
            variant="error"
          />
        )}
      </form>
    </div>
  );
}
