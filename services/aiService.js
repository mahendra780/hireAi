const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/* ============================
   GENERATE INTERVIEW QUESTION
============================ */
async function generateQuestion(role, level) {
  try {
    const prompt = `
You are conducting a real job interview.

Generate EXACTLY ONE interview question.

Role: ${role}
Experience level: ${level}

STRICT RULES:
- Return ONLY the question sentence.
- Do NOT add any introduction text.
- Do NOT say "Here is your question".
- Do NOT wrap the question in quotes.
- Do NOT add explanations.
- Do NOT add formatting.
- The response must start directly with the question.

The output must be plain text containing only the question.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.95,
      top_p: 0.9
    });

    let question = completion.choices[0].message.content.trim();

    /* ============================
       CLEAN FORMATTING (IMPORTANT)
    ============================ */

    // Remove intro phrases
    question = question.replace(/Here.*?:/i, "").trim();

    // Remove surrounding quotes
    question = question.replace(/^["']|["']$/g, "").trim();

    // Remove unwanted prefixes like "Question:"
    question = question.replace(/^Question:\s*/i, "").trim();

    // If multiple lines returned, keep only first non-empty line
    question = question.split("\n").find(line => line.trim() !== "")?.trim();

    return question;

  } catch (error) {
    console.error("Error generating question:", error);
    return "Unable to generate question at the moment.";
  }
}

/* ============================
   EVALUATE ANSWER (STRICT)
============================ */

async function evaluateAnswer(question, answer) {
  try {
    const prompt = `
You are a STRICT professional interviewer.

Question:
${question}

Candidate Answer:
${answer}

Scoring Rules (follow strictly):
- If the answer is empty, meaningless, random, or unrelated → Score: 0
- If the answer is very weak or mostly incorrect → Score: 1 to 3
- If partially correct → Score: 4 to 6
- If mostly correct with minor gaps → Score: 7 to 8
- If clear, accurate, well-explained, and relevant → Score: 9 to 10

Additional Rules:
- Do NOT be generous.
- Penalize vague or generic responses.
- Base the score ONLY on answer quality and relevance.
- Keep feedback professional and constructive.

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
      temperature: 0.2  // Low for consistent scoring
    });

    return completion.choices[0].message.content.trim();

  } catch (error) {
    console.error("Error evaluating answer:", error);
    return `Feedback:
There was an issue evaluating the answer. Please try again.

Score: 0`;
  }
}

module.exports = {
  generateQuestion,
  evaluateAnswer
};