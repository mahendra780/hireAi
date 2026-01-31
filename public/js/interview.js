let currentQuestion = "";

// ✅ SAFE DATA READ
const dataDiv = document.getElementById("interview-data");
const role = dataDiv.dataset.role;
const level = dataDiv.dataset.level;

// console.log("FRONTEND role, level:", role, level);

async function loadQuestion() {
  const res = await fetch("/interview/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, level })
  });

  const data = await res.json();
  currentQuestion = data.question;
  document.getElementById("question").innerText = data.question;
}

async function submitAnswer() {
  const answer = document.getElementById("answer").value;

  const res = await fetch("/interview/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role,
      level,
      question: currentQuestion,
      answer
    })
  });

  const data = await res.json();
  window.location.href = data.redirectUrl;
}

document.getElementById("submitBtn").addEventListener("click", submitAnswer);

window.onload = loadQuestion;
