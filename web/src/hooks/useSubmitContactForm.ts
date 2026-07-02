import { useMutation } from "@tanstack/react-query";

type ContactFormValues = {
  category: string;
  email: string;
  message: string;
};

export const useSubmitContactForm = () =>
  useMutation<void, Error, ContactFormValues>({
    // The contact API is not wired up to the client yet, so this stubs a
    // successful submission by waiting 5s before resolving. Replace with the
    // real `POST /contact` call once the API is implemented. The endpoint
    // responds with `204 No Content`, so there is no response body to return.
    // See https://github.com/vetro-protocol/vetro-monorepo/issues/550
    mutationFn: () =>
      new Promise((resolve) => setTimeout(() => resolve(), 5000)),
  });
