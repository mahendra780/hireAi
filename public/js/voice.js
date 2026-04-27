/**
 * HireAI — Voice Interview Module
 * File: public/js/voice.js
 */
(function () {
  "use strict";

  let isVoiceMode = false;
  let isRecording = false;
  let recognition = null;
  const synth = window.speechSynthesis;

  const supportsTTS = "speechSynthesis" in window;
  const supportsSTT = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  function $(id) { return document.getElementById(id); }
  function show(id) { const el = $(id); if (el) el.style.display = ""; }
  function hide(id) { const el = $(id); if (el) el.style.display = "none"; }

  // Stop TTS immediately — called on submit and on mode switch
  function stopSpeaking() {
    if (supportsTTS && synth.speaking) synth.cancel();
  }

  // Stop STT
  function stopRecording() {
    isRecording = false;
    if (recognition) { recognition.stop(); recognition = null; }
    setMicUI(false);
    setStatus("Ready", "#F59E0B", "#FEF3C7", "#92400E");
  }

  // ─── Mode Toggle ───────────────────────────────────────────────────────────
  window.toggleMode = function () {
    isVoiceMode = !isVoiceMode;
    const toggle   = $("modeToggle");
    const label    = $("modeLabel");
    const textarea = $("answer");

    if (isVoiceMode) {
      if (toggle) toggle.classList.add("active");
      if (label)  { label.textContent = "Voice Mode"; label.style.color = "#6366F1"; }
      show("speakBtn");
      show("voiceStatus");
      show("voiceHint");
      show("voiceControls");
      if (textarea) textarea.placeholder = "Your spoken answer will appear here… (you can also type or edit)";

      if (!supportsSTT || !supportsTTS) {
        const warn = $("browserWarning");
        if (warn) { warn.textContent = "⚠️ Your browser has limited Web Speech API support. For the best experience, use Chrome or Edge."; warn.style.display = "block"; }
      }

      setTimeout(window.speakQuestion, 500);
    } else {
      if (toggle) toggle.classList.remove("active");
      if (label)  { label.textContent = "Text Mode"; label.style.color = "#6B7280"; }
      hide("speakBtn");
      hide("voiceStatus");
      hide("voiceHint");
      hide("voiceControls");
      hide("browserWarning");
      if (textarea) textarea.placeholder = "Write your answer here...";
      stopSpeaking();
      stopRecording();
    }
  };

  // ─── Text-to-Speech ────────────────────────────────────────────────────────
  window.speakQuestion = function () {
    if (!supportsTTS) return;
    const qEl = $("question");
    const text = qEl ? qEl.innerText.trim() : "";
    if (!text || text === "Loading question...") return;

    // Always cancel any ongoing speech before starting new one
    stopSpeaking();

    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.93;
    utterance.pitch  = 1;
    utterance.volume = 1;

    const voices = synth.getVoices();
    const voice  =
      voices.find(v => v.lang.startsWith("en") && /natural|neural/i.test(v.name)) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setStatus("🔊 Speaking…", "#6366F1", "#EEF2FF", "#4338CA");
    utterance.onend   = () => setStatus("Ready", "#F59E0B", "#FEF3C7", "#92400E");
    utterance.onerror = () => setStatus("Ready", "#F59E0B", "#FEF3C7", "#92400E");

    synth.speak(utterance);
  };

  // ─── Speech-to-Text ────────────────────────────────────────────────────────
  window.toggleMic = function () {
    isRecording ? stopRecording() : startRecording();
  };

  function startRecording() {
    if (!supportsSTT) {
      setStatus("Not supported — use Chrome/Edge", "#EF4444", "#FEE2E2", "#991B1B");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous     = true;
    recognition.interimResults = true;
    recognition.lang           = "en-US";

    const textarea = $("answer");
    let finalTranscript = textarea ? textarea.value.trim() : "";

    recognition.onstart = () => {
      isRecording = true;
      stopSpeaking();
      setMicUI(true);
      setStatus("🔴 Recording…", "#EF4444", "#FEE2E2", "#991B1B");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + chunk.trim();
        } else {
          interim += chunk;
        }
      }
      if (textarea) textarea.value = finalTranscript + (interim ? " " + interim : "");
    };

    recognition.onerror = (event) => {
      const msgs = {
        "no-speech":     "No speech detected — please try again.",
        "audio-capture": "Microphone not found.",
        "not-allowed":   "Microphone access denied. Allow it in browser settings.",
        "network":       "Network error.",
      };
      setStatus(msgs[event.error] || `Error: ${event.error}`, "#EF4444", "#FEE2E2", "#991B1B");
      isRecording = false;
      setMicUI(false);
    };

    recognition.onend = () => {
      if (isRecording) { try { recognition.start(); } catch (_) {} }
    };

    recognition.start();
  }

  window.clearVoiceAnswer = function () {
    const textarea = $("answer");
    if (textarea) textarea.value = "";
    if (isRecording) stopRecording();
  };

  // ─── UI helpers ────────────────────────────────────────────────────────────
  function setMicUI(recording) {
    const btn  = $("micBtn");
    const icon = $("micIcon");
    const lbl  = $("micLabel");
    if (!btn) return;
    if (recording) {
      if (icon) icon.textContent = "⏹️";
      if (lbl)  lbl.textContent  = "Stop Recording";
      btn.style.borderColor = "#EF4444";
      btn.style.color       = "#EF4444";
    } else {
      if (icon) icon.textContent = "🎙️";
      if (lbl)  lbl.textContent  = "Start Recording";
      btn.style.borderColor = "#6366F1";
      btn.style.color       = "#6366F1";
    }
  }

  function setStatus(text, dotColor, bgColor, textColor) {
    const badge = $("voiceStatusBadge");
    const dot   = $("statusDot");
    const lbl   = $("statusText");
    if (!badge) return;
    if (lbl)  lbl.textContent        = text;
    if (dot)  dot.style.background   = dotColor;
    badge.style.background = bgColor;
    badge.style.color      = textColor;
  }

  // ─── Watch question element for changes → auto-read new question ────────────
  const voiceQuestionEl = $("question");
  if (voiceQuestionEl) {
    new MutationObserver(() => {
      if (!isVoiceMode) return;
      setTimeout(window.speakQuestion, 400);
    }).observe(voiceQuestionEl, { childList: true, subtree: true, characterData: true });
  }

  // ─── Submit button: stop TTS + STT immediately on click ────────────────────
  // This runs BEFORE interview.js's fetch, so speech stops the moment user clicks.
  const voiceSubmitBtn = $("submitBtn");
  if (voiceSubmitBtn) {
    voiceSubmitBtn.addEventListener("click", () => {
      stopSpeaking();   // stop TTS immediately
      stopRecording();  // stop STT and finalize transcript
    }, true); // useCapture=true so this fires BEFORE interview.js's listener
  }

})();