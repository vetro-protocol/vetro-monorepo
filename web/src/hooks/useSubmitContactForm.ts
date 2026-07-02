import { useMutation } from "@tanstack/react-query";
import fetch from "fetch-plus-plus";

type ContactFormValues = {
  category: string;
  email: string;
  message: string;
};

const apiUrl = import.meta.env.VITE_VETRO_API_URL;

export const useSubmitContactForm = () =>
  useMutation<void, Error, ContactFormValues>({
    // The endpoint responds with `204 No Content` (fetch-plus-plus resolves to
    // `undefined`) on success, and throws on any non-2xx so the form surfaces
    // its error toast.
    mutationFn: (values) =>
      fetch(`${apiUrl}/contact`, {
        body: JSON.stringify(values),
        headers: { "content-type": "application/json" },
        method: "POST",
      }) as Promise<void>,
  });
