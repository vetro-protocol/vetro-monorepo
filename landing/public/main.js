const API_URL = "https://api.vetro.org/api/submit";

const buttonText = document.getElementById("button-text");
const checkmarkIcon = document.getElementById("checkmark-icon");
const emailInput = document.getElementById("email-input");
const form = document.getElementById("waitlist-form");
const formMessage = document.getElementById("form-message");
const submitButton = document.getElementById("submit-button");

function showMessage(text, isError) {
  formMessage.textContent = text;
  formMessage.classList.remove("invisible", "text-[#F43F5E]", "text-green-600");
  formMessage.classList.add(isError ? "text-[#F43F5E]" : "text-green-600");
}

function hideMessage() {
  formMessage.classList.add("invisible");
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function showSuccess() {
  checkmarkIcon.classList.remove("hidden");
  buttonText.textContent = "You're in!";
  submitButton.disabled = true;
  setTimeout(function () {
    checkmarkIcon.classList.add("hidden");
    buttonText.textContent = "Join waitlist";
    submitButton.disabled = false;
    emailInput.value = "";
  }, 5000);
}

function resetButton() {
  checkmarkIcon.classList.add("hidden");
  buttonText.textContent = "Join waitlist";
  submitButton.disabled = false;
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  hideMessage();

  const email = emailInput.value.trim();

  if (!email) {
    showMessage("Please enter your email", true);
    return;
  }

  if (!isValidEmail(email)) {
    showMessage("Please enter a valid email address", true);
    return;
  }

  submitButton.disabled = true;
  buttonText.textContent = "Joining...";

  try {
    const response = await fetch(API_URL, {
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    showSuccess();
  } catch {
    showMessage("Something went wrong, please try again", true);
    resetButton();
  }
});
