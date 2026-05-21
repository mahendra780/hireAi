let currentQuestion = "";
let questionStartTime;
let timerInterval;
let warningCount = 0;
let interviewEnded = false;
let lastWarningTime = 0;

// DOM
const questionEl = document.getElementById("question");
const answerEl = document.getElementById("answer");
const submitBtn = document.getElementById("submitBtn");
const progressEl = document.getElementById("progress");
const timerEl = document.getElementById("timer");
const videoEl = document.getElementById("webcam");
const warningBox = document.getElementById("warningBox");
const micBtn = document.getElementById("micBtn");

// DATA
const interviewData = document.getElementById("interview-data");
const role = interviewData.dataset.role;
const level = interviewData.dataset.level;

// =======================
// 🚨 WARNING SYSTEM
// =======================
function giveWarning(msg) {
  if (interviewEnded) return;

  const now = Date.now();

  // prevent spam (3 sec cooldown)
  if (now - lastWarningTime < 3000) return;
  lastWarningTime = now;

  warningCount++;

  warningBox.innerText = `⚠ Warning ${warningCount}/3: ${msg}`;

  if (warningCount >= 3) {
    interviewEnded = true;

    warningBox.innerText = "❌ Interview terminated due to violations.";

    // Disable UI
    submitBtn.disabled = true;
    answerEl.disabled = true;
    micBtn.disabled = true;

    // Stop webcam
    if (videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach(track => track.stop());
    }

    // Stop timer
    clearInterval(timerInterval);

    // Stop voice
    if (recognition) {
      try { recognition.stop(); } catch {}
    }

    // Stop monitoring
    window.onblur = null;
    document.onvisibilitychange = null;

    // Auto submit
    submitAnswer(true);
  }
}

// =======================
// ⏱ TIMER
// =======================
function startTimer() {
  clearInterval(timerInterval);

  questionStartTime = Date.now();

  timerInterval = setInterval(() => {
    if (interviewEnded) return;

    const sec = Math.floor((Date.now() - questionStartTime) / 1000);
    timerEl.innerText = `Time: ${sec}s`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  return Math.floor((Date.now() - questionStartTime) / 1000);
}

// =======================
// 🎥 WEBCAM
// =======================
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
  } catch {
    giveWarning("Camera not allowed!");
  }
}

// =======================
// 🧠 MONITORING
// =======================
function smartMonitoring() {

  document.addEventListener("visibilitychange", () => {
    if (!interviewEnded && document.hidden) {
      giveWarning("Tab switched!");
    }
  });

  window.onblur = () => {
    if (!interviewEnded) {
      giveWarning("Window switched!");
    }
  };

  setInterval(() => {
    if (!interviewEnded && !videoEl.srcObject) {
      giveWarning("Camera turned off!");
    }
  }, 5000);
}

// =======================
// 🔊 NOISE DETECTION
// =======================
function detectNoise() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    const audioCtx = new AudioContext();
    const mic = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();

    mic.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);

    setInterval(() => {
      if (interviewEnded) return;

      analyser.getByteFrequencyData(data);
      const volume = data.reduce((a, b) => a + b) / data.length;

      if (volume > 70) {
        giveWarning("Multiple voices / noise detected!");
      }
    }, 5000);
  });
}

// =======================
// 🎤 VOICE (FIXED)
// =======================
let recognition;

function setupVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SR) {
    warningBox.innerText = "❌ Voice not supported";
    return;
  }

  recognition = new SR();
  recognition.lang = "en-US";

  recognition.onstart = () => {
    micBtn.innerText = "🎙 Listening...";
    micBtn.style.backgroundColor = "red";

    warningBox.innerText = "🎤 Speak now...";
  };

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    answerEl.value += " " + text;
  };

  recognition.onend = () => {
    micBtn.innerText = "🎤 Speak";
    micBtn.style.backgroundColor = "";

    warningBox.innerText = "✅ Voice added";
  };

  recognition.onerror = () => {
    micBtn.innerText = "🎤 Speak";
    micBtn.style.backgroundColor = "";

    warningBox.innerText = "❌ Mic error";
  };
}

// 👉 MIC BUTTON CLICK
function startVoice() {
  if (interviewEnded) return;

  if (!recognition) {
    warningBox.innerText = "❌ Voice not supported";
    return;
  }

  try {
    recognition.start();
  } catch (err) {
    console.log(err);
  }
}

// =======================
// 📥 LOAD QUESTION
// =======================
async function loadQuestion() {
  try {
    const res = await fetch("/interview/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role, level })
    });

    const data = await res.json();

    if (!data || !data.question) {
      questionEl.innerText = "❌ Unable to generate question";
      return;
    }

    currentQuestion = data.question;

    questionEl.innerText = data.question;
    progressEl.innerText = `Question 1 of ${data.total}`;

    startTimer();

  } catch (err) {
    console.error(err);
    questionEl.innerText = "❌ Failed to load question";
  }
}

// =======================
// 📤 SUBMIT
// =======================
async function submitAnswer(forceSubmit = false) {
  try {
    if (interviewEnded && !forceSubmit) return;

    const answer = answerEl.value.trim();
    const timeTaken = stopTimer();

    submitBtn.disabled = true;
    submitBtn.innerText = "Evaluating...";

    const res = await fetch("/interview/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: currentQuestion,
        answer,
        timeTaken,
        warnings: warningCount,
        forceSubmit
      })
    });

    const data = await res.json();

    if (data.next && !interviewEnded) {
      currentQuestion = data.question;
      questionEl.innerText = data.question;
      progressEl.innerText = `Question ${data.index} of ${data.total}`;
      answerEl.value = "";

      startTimer();

      submitBtn.disabled = false;
      submitBtn.innerText = "Submit Answer";
    }
    else if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }

  } catch (err) {
    alert("Error occurred!");
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Answer";
  }
}

// =======================
// INIT
// =======================
window.onload = () => {
  loadQuestion();
  startWebcam();
  setupVoice();
  smartMonitoring();
  detectNoise();

  submitBtn.addEventListener("click", submitAnswer);
  micBtn.addEventListener("click", startVoice);
};