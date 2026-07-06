import { Button } from "components/base/button";
import { Dropdown } from "components/base/dropdown";
import { Input } from "components/base/input";
import { TextArea } from "components/base/textarea";
import { Toast } from "components/base/toast";
import { ChevronUpDownIcon } from "components/icons/chevronUpDownIcon";
import { useSubmitContactForm } from "hooks/useSubmitContactForm";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidEmail } from "utils/email";

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

  function resetForm() {
    email.reset();
    message.reset();
    setTopic(undefined);
    setTopicTouched(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (status === "pending") {
      return;
    }
    if (!topic || !email.valid || !message.valid) {
      // The button stays active; on an invalid submit reveal every field's
      // error (as if each had been touched) instead of failing silently.
      email.markTouched();
      message.markTouched();
      setTopicTouched(true);
      return;
    }
    // Reset on success so the filled-in form can't be resubmitted as a duplicate.
    mutate(
      { category: topic.key, email: email.value, message: message.value },
      { onSuccess: resetForm },
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
