const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateBudgetPlan = async ({
  destination,
  travelers,
  days,
  budget,
}) => {
  const model =
    process.env.GEMINI_MODEL || "gemini-3.8-flash";

  const prompt = `
You are an AI travel budget planner.

Create a realistic budget breakdown for a trip.

Trip details:
Destination: ${destination}
Travelers: ${travelers}
Days: ${days}
Total Budget: ₹${budget}

Divide the TOTAL budget into exactly these four categories:

1. Stay
2. Food
3. Transport
4. Buffer

Rules:
- The sum of Stay + Food + Transport + Buffer must equal exactly ${budget}.
- Stay should normally be around 30-45%.
- Food should normally be around 20-30%.
- Transport should normally be around 15-25%.
- Buffer should normally be around 5-15%.
- Consider number of travelers and number of days.
- Do not exceed the total budget.
- Return only numbers.
`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,

    config: {
      responseMimeType: "application/json",

      responseSchema: {
        type: "object",
        properties: {
          Stay: {
            type: "number",
          },
          Food: {
            type: "number",
          },
          Transport: {
            type: "number",
          },
          Buffer: {
            type: "number",
          },
          Total: {
            type: "number",
          },
        },
        required: [
          "Stay",
          "Food",
          "Transport",
          "Buffer",
          "Total",
        ],
      },
    },
  });

  const plan = JSON.parse(response.text);

  return plan;
};

module.exports = {
  generateBudgetPlan,
};