const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ============================
   GENERATE INTERVIEW QUESTION
============================ */

async function generateQuestion(role, level) {
  const prompt = `
You are a professional technical interviewer.

Generate ONE clear and concise interview question for:
Role: ${role}
Experience level: ${level}

Rules:
- Ask only one question
- Keep it simple and interview-relevant
- No explanations, no options

Return only the question text.
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  return completion.choices[0].message.content.trim();
}

/* ============================
   EVALUATE ANSWER (STRICT)
============================ */

async function evaluateAnswer(question, answer) {
  const prompt = `
You are a STRICT technical interviewer.

Question:
${question}

Candidate Answer:
${answer}

Scoring Rules (follow strictly):
- If the answer is empty, meaningless, random, or unrelated → Score: 0
- If the answer is very weak or mostly incorrect → Score: 1 to 3
- If the answer is partially correct → Score: 4 to 6
- If the answer is mostly correct with minor gaps → Score: 7 to 8
- If the answer is clear, correct, and well explained → Score: 9 to 10

Additional Rules:
- Do NOT be generous
- Penalize vague or generic answers
- Base score ONLY on answer quality and relevance

Response format (MUST follow exactly):

Feedback:
<2–4 lines of constructive feedback>

Score: <number out of 10>
`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  return completion.choices[0].message.content.trim();
}

module.exports = {
  generateQuestion,
  evaluateAnswer
};
