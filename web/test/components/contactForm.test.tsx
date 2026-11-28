import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type Ref, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";

import { ContactForm } from "../../src/components/contactForm";

const resetCaptcha = vi.fn();

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile({
    onExpire,
    onSuccess,
    ref,
  }: {
    onExpire: VoidFunction;
    onSuccess: (token: string) => void;
    ref: Ref<{ reset: VoidFunction }>;
  }) {
    useImperativeHandle(ref, () => ({ reset: resetCaptcha }));
    return (
      <>
        <button onClick={() => onSuccess("captcha-token")} type="button">
          Solve captcha
        </button>
        <button onClick={onExpire} type="button">
          Expire captcha
        </button>
      </>
    );
  },
}));

const fetchMock = vi.fn<typeof fetch>();

async function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ContactForm />
    </QueryClientProvider>,
  );
  return {
    captcha: screen.getByRole("button", { name: "Solve captcha" }),
    email: screen.getByRole("textbox", { name: "Your email address" }),
    message: screen.getByRole("textbox", { name: "What happened?" }),
    screen,
    submit: screen.getByRole("button", { name: "Get help" }),
    topic: screen.getByRole("button", { name: "What's this about?" }),
  };
}

type Form = Awaited<ReturnType<typeof renderForm>>;

async function selectEarnTopic(topic: Form["topic"]) {
  await topic.click();
  await expect.element(topic).toHaveAttribute("aria-expanded", "true");
  // Without Tailwind the menu is not fixed, so the topic error that appears on
  // the trigger's blur moves the menu between mousedown and mouseup
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
  await expect.element(topic).toHaveTextContent("Earn");
}

async function fillForm({ captcha, email, message, topic }: Form) {
  await email.fill("john@email.com");
  await selectEarnTopic(topic);
  await message.fill("My deposit failed");
  await captcha.click();
}

describe("ContactForm", function () {
  beforeEach(function () {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(function () {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows no errors while the first field has focus", async function () {
    const { email, screen } = await renderForm();

    await email.click();

    await expect.element(email).toHaveFocus();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the email error after blur and hides it when the email is valid", async function () {
    const { email, message, screen } = await renderForm();

    await email.fill("john");
    await message.click();

    await expect
      .element(screen.getByText("Please enter a valid email address."))
      .toBeInTheDocument();

    await email.fill("john@email.com");

    await expect
      .element(screen.getByText("Please enter a valid email address."))
      .not.toBeInTheDocument();
  });

  it("shows the topic error after blur and hides it when a topic is selected", async function () {
    const { email, screen, topic } = await renderForm();

    await email.click();
    await userEvent.tab();
    await expect.element(topic).toHaveFocus();
    await userEvent.tab();

    const topicError = screen.getByText("Please select a topic.").element();

    await expect.element(topicError).toHaveAttribute("role", "alert");
    await expect
      .element(topic)
      .toHaveAttribute("aria-describedby", topicError.id);

    await selectEarnTopic(topic);

    await expect.element(topicError).not.toBeInTheDocument();
    await expect.element(topic).not.toHaveAttribute("aria-describedby");
  });

  it("rejects a message with only whitespace", async function () {
    const form = await renderForm();
    await fillForm(form);

    await form.message.fill("   ");
    await form.submit.click();

    await expect
      .element(form.screen.getByText("Please describe what happened."))
      .toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows every error and sends nothing on an empty submit", async function () {
    const { screen, submit } = await renderForm();

    await submit.click();

    await expect
      .element(screen.getByText("Please enter a valid email address."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Please select a topic."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Please describe what happened."))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Please complete the captcha."))
      .toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("asks for the captcha again after it expires", async function () {
    const form = await renderForm();
    await fillForm(form);

    await form.screen.getByRole("button", { name: "Expire captcha" }).click();
    await form.submit.click();

    await expect
      .element(form.screen.getByText("Please complete the captcha."))
      .toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the form fields and resets the form on success", async function () {
    let respond: (response: Response) => void = () => undefined;
    fetchMock.mockReturnValue(
      new Promise(function (resolve) {
        respond = resolve;
      }),
    );
    const form = await renderForm();
    await fillForm(form);

    await form.submit.click();

    await expect
      .element(form.screen.getByRole("button", { name: "Getting help..." }))
      .toBeDisabled();

    respond(new Response(null, { status: 204 }));

    await expect.element(form.submit).toBeEnabled();
    await expect
      .element(form.screen.getByText("Help is on the way"))
      .toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${import.meta.env.VITE_VETRO_API_URL}/contact`);
    expect(init?.method).toBe("POST");
    const body = init?.body as FormData;
    expect({
      category: body.get("category"),
      email: body.get("email"),
      message: body.get("message"),
      token: body.get("token"),
    }).toEqual({
      category: "earn",
      email: "john@email.com",
      message: "My deposit failed",
      token: "captcha-token",
    });
    await expect.element(form.email).toHaveValue("");
    await expect.element(form.message).toHaveValue("");
    await expect.element(form.topic).toHaveTextContent("Select a topic");
    expect(resetCaptcha).toHaveBeenCalledOnce();
    await expect
      .element(form.screen.getByRole("alert"))
      .not.toBeInTheDocument();
  });

  it("keeps the fields and asks for a new captcha on error, then sends again", async function () {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const form = await renderForm();
    await fillForm(form);

    await form.submit.click();

    await expect
      .element(form.screen.getByText("Something went wrong"))
      .toBeInTheDocument();
    await expect.element(form.email).toHaveValue("john@email.com");
    await expect.element(form.message).toHaveValue("My deposit failed");
    await expect.element(form.topic).toHaveTextContent("Earn");
    expect(resetCaptcha).toHaveBeenCalledOnce();

    await form.submit.click();

    await expect
      .element(form.screen.getByText("Please complete the captcha."))
      .toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledOnce();

    await form.captcha.click();
    await form.submit.click();

    await expect
      .element(form.screen.getByText("Help is on the way"))
      .toBeInTheDocument();
    await expect
      .element(form.screen.getByText("Something went wrong"))
      .not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const body = fetchMock.mock.calls[1][1]?.body as FormData;
    expect(body.get("email")).toBe("john@email.com");
    expect(body.get("message")).toBe("My deposit failed");
    await expect.element(form.email).toHaveValue("");
    await expect.element(form.message).toHaveValue("");
    await expect.element(form.topic).toHaveTextContent("Select a topic");
    expect(resetCaptcha).toHaveBeenCalledTimes(2);
  });
});
