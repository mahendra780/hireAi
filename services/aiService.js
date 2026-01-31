const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

module.exports.generateQuestion = async (role, level) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Generate one ${level} level interview question for a ${role} developer. Only return the question.`
      }
    ]
  });

  return completion.choices[0].message.content;
};

module.exports.evaluateAnswer = async (question, answer) => {
  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `
Question: ${question}
Answer: ${answer}

Evaluate the answer and STRICTLY end with:
Score: X
Where X is a number between 0 and 10.
        `
      }
    ]
  });

  return completion.choices[0].message.content;
};
