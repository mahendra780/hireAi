let currentQuestion = "";

// DOM refs
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submitBtn");
const progressEl = document.getElementById("progress");

// Interview data
const interviewData = document.getElementById("interview-data");
const role = interviewData.dataset.role;
const level = interviewData.dataset.level;

// Load first question
async function loadQuestion() {
  const res = await fetch("/interview/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, level })
  });

  const data = await res.json();
  currentQuestion = data.question;

  questionEl.innerText = data.question;
  progressEl.innerText = `Question 1 of ${data.total}`;
}

// Submit answer
async function submitAnswer() {
  const answer = answerEl.value.trim();

  submitBtn.disabled = true;
  submitBtn.innerText = "Evaluating...";

  const res = await fetch("/interview/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: currentQuestion,
      answer
    })
  });

  const data = await res.json();

  // If more questions remain
  if (data.next) {
    currentQuestion = data.question;
    questionEl.innerText = data.question;
    progressEl.innerText = `Question ${data.index} of ${data.total}`;
    answerEl.value = "";

    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Answer";
  } 
  // Interview finished
  else if (data.redirectUrl) {
    window.location.href = data.redirectUrl;
  }
}

// Events
submitBtn.addEventListener("click", submitAnswer);
window.onload = loadQuestion;
