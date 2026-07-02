/**
 * Minimal, permissive email check: verifies there is some text, an "@", and
 * more text after it. This is a basic sanity check only — it intentionally does
 * not attempt strict RFC 5322 validation. Whether an address actually exists
 * and can receive mail can only be confirmed by sending an email to it.
 */
export const isValidEmail = (value: string) => /.+@.+/.test(value);
