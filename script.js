/* EverydayVoice frontend.
   Paste your deployed Google Apps Script Web App URL below before publishing. */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxFZiexN1ylPa_Vu_oNqGC3vQh8VwwsHh4E7U_M7WTWqAjuiLdecnNTIdojFjKN54bjQg/exec"; // Example: https://script.google.com/macros/s/DEPLOYMENT_ID/exec

const QUESTIONS = [
  "What is the most frustrating thing you face every day?",
  "Which task takes more time than it should?",
  "What problem do you repeatedly face every week?",
  "How are you currently solving this problem?",
  "Do you spend money, time, or extra effort to deal with this problem? Please explain.",
  "If you could change one thing in your daily life, what would it be?"
];

const answers = Array(QUESTIONS.length).fill("");
let currentQuestion = 0;
let isSubmitting = false;
let submissionToken = null;

const homeScreen = document.getElementById("home-screen");
const surveyScreen = document.getElementById("survey-screen");
const successScreen = document.getElementById("success-screen");
const answerInput = document.getElementById("answer-input");
const questionTitle = document.getElementById("question-title");
const questionNumber = document.getElementById("question-number");
const progressLabel = document.getElementById("progress-label");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const charCount = document.getElementById("char-count");
const validationMessage = document.getElementById("validation-message");
const previousButton = document.getElementById("previous-button");
const nextButton = document.getElementById("next-button");
const submitButton = document.getElementById("submit-button");
const surveyForm = document.getElementById("survey-form");

function showScreen(screen) {
  [homeScreen, surveyScreen, successScreen].forEach(item => item.classList.add("hidden"));
  screen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  const total = QUESTIONS.length;
  const number = currentQuestion + 1;
  questionNumber.textContent = `QUESTION ${String(number).padStart(2, "0")}`;
  questionTitle.textContent = QUESTIONS[currentQuestion];
  progressLabel.textContent = `Question ${number} of ${total}`;
  const percent = Math.round((number / total) * 100);
  progressPercent.textContent = `${percent}%`;
  progressFill.style.width = `${(number / total) * 100}%`;
  answerInput.value = answers[currentQuestion];
  charCount.textContent = `${answerInput.value.length} / 3000`;
  previousButton.disabled = currentQuestion === 0 || isSubmitting;
  nextButton.classList.toggle("hidden", currentQuestion === total - 1);
  submitButton.classList.toggle("hidden", currentQuestion !== total - 1);
  nextButton.disabled = isSubmitting;
  submitButton.disabled = isSubmitting;
  validationMessage.textContent = "";
}

function saveCurrentAnswer() {
  answers[currentQuestion] = answerInput.value.trim();
}

function validateCurrentAnswer() {
  saveCurrentAnswer();
  if (!answers[currentQuestion]) {
    validationMessage.textContent = "Please enter an answer before continuing.";
    answerInput.focus();
    return false;
  }
  validationMessage.textContent = "";
  return true;
}

document.getElementById("start-button").addEventListener("click", () => {
  currentQuestion = 0;
  renderQuestion();
  showScreen(surveyScreen);
  answerInput.focus({ preventScroll: true });
});
document.getElementById("brand-home").addEventListener("click", event => {
  event.preventDefault();
  if (!isSubmitting) showScreen(homeScreen);
});
document.getElementById("home-button").addEventListener("click", () => {
  answers.fill("");
  currentQuestion = 0;
  submissionToken = null;
  renderQuestion();
  showScreen(homeScreen);
});
answerInput.addEventListener("input", () => {
  answers[currentQuestion] = answerInput.value;
  charCount.textContent = `${answerInput.value.length} / 3000`;
  if (answerInput.value.trim()) validationMessage.textContent = "";
});
nextButton.addEventListener("click", () => {
  if (!validateCurrentAnswer()) return;
  currentQuestion += 1;
  renderQuestion();
  answerInput.focus({ preventScroll: true });
});
previousButton.addEventListener("click", () => {
  saveCurrentAnswer();
  if (currentQuestion > 0) currentQuestion -= 1;
  renderQuestion();
  answerInput.focus({ preventScroll: true });
});

function setSubmitting(value) {
  isSubmitting = value;
  submitButton.disabled = value;
  previousButton.disabled = value || currentQuestion === 0;
  nextButton.disabled = value;
  submitButton.innerHTML = value
    ? '<span class="spinner" aria-hidden="true"></span> Sending...'
    : 'Submit answers <span aria-hidden="true">→</span>';
}

function submitUsingAppsScript(payload) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_SCRIPT_URL || !/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(GOOGLE_SCRIPT_URL)) {
      reject(new Error("The survey owner has not configured the Google Sheets connection yet."));
      return;
    }

    const frameName = `everydayvoice-frame-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.title = "Survey submission";
    iframe.style.display = "none";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = GOOGLE_SCRIPT_URL;
    form.target = frameName;
    form.style.display = "none";

    const field = document.createElement("input");
    field.type = "hidden";
    field.name = "payload";
    field.value = JSON.stringify(payload);
    form.appendChild(field);
    document.body.append(iframe, form);

    let finished = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      form.remove();
      iframe.remove();
    };
    const finish = (fn, value) => {
      if (finished) return;
      finished = true;
      cleanup();
      fn(value);
    };
    const onMessage = event => {
      if (event.source !== iframe.contentWindow || !event.data || event.data.type !== "EVERYDAYVOICE_RESULT") return;
      if (event.data.ok) finish(resolve, event.data);
      else finish(reject, new Error(event.data.message || "The response could not be saved. Please try again."));
    };
    window.addEventListener("message", onMessage);
    form.submit();

    // If the Apps Script response never reaches the page, show an error rather than a false success.
    window.setTimeout(() => finish(reject, new Error("The server did not confirm the submission. Please check your connection and try again.")), 30000);
  });
}

surveyForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (isSubmitting) return;
  if (!validateCurrentAnswer()) return;
  // Also verify every answer, including answers on earlier steps.
  const missing = answers.findIndex(answer => !String(answer || "").trim());
  if (missing !== -1) {
    currentQuestion = missing;
    renderQuestion();
    validationMessage.textContent = "Please answer this question before submitting.";
    answerInput.focus();
    return;
  }

  if (!submissionToken) {
    submissionToken = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const payload = {
    submissionId: submissionToken,
    answers: answers.map(answer => String(answer).trim())
  };

  setSubmitting(true);
  try {
    await submitUsingAppsScript(payload);
    showScreen(successScreen);
    submissionToken = null;
  } catch (error) {
    validationMessage.textContent = error.message || "Something went wrong. Please try again.";
    validationMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } finally {
    setSubmitting(false);
  }
});

renderQuestion();
