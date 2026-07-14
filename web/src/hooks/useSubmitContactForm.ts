import { useMutation } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";
import { isValidUrl } from "utils/url";

type ContactFormValues = {
  // Optional screenshots; sent as multipart file parts.
  attachments?: File[];
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
    mutationFn({ attachments = [], category, email, message, token }) {
      if (apiUrl === undefined || !isValidUrl(apiUrl)) {
        throw new Error("VITE_VETRO_API_URL is not configured");
      }
      const body = new FormData();
      body.append("category", category);
      body.append("email", email);
      body.append("message", message);
      if (token !== undefined) {
        body.append("token", token);
      }
      attachments.forEach((file) => body.append("files", file));
      // No content-type header: the browser sets multipart/form-data with the
      // boundary itself.
      return fetch(`${apiUrl}/contact`, {
        body,
        method: "POST",
      }) as Promise<void>;
    },
  });
