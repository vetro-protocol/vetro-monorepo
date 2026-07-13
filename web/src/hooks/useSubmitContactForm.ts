import { useMutation } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

type ContactFormValues = {
  category: string;
  email: string;
  message: string;
  // Omitted when the widget is disabled (no VITE_TURNSTILE_SITE_KEY)
  token?: string;
};

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const useSubmitContactForm = () =>
  useMutation<void, Error, ContactFormValues>({
    // The endpoint responds with `204 No Content` (fetch-plus-plus resolves to
    // `undefined`) on success, and throws on any non-2xx so the form surfaces
    // its error toast.
    mutationFn(values) {
      if (apiUrl === undefined || !isValidUrl(apiUrl)) {
        throw new Error("VITE_VETRO_API_URL is not configured");
      }
      return fetch(`${apiUrl}/contact`, {
        body: JSON.stringify(values),
        headers: { "content-type": "application/json" },
        method: "POST",
      }) as Promise<void>;
    },
  });
