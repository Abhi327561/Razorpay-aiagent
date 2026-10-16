import fetch from "node-fetch";

// Free tier, no card required: console.groq.com. qwen/qwen3.8-27b supports both
// vision and tool-calling — lets the model see uploaded photos directly instead
// of routing images around it.
const MODEL = "qwen/qwen3.8-27b";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Calls Groq's OpenAI-compatible chat completions endpoint with tool-calling
// enabled. Returns the raw response so the caller can inspect
// choices[0].message for content vs tool_calls.
export async function callGroq({ messages, tools }) {
  if (!process.env.LLM_API_KEY) {
    throw new Error(
      "LLM_API_KEY missing in .env — get a free key at console.groq.com (no card required)."
    );
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error ${res.status}: ${text}`);
  }

  return res.json();
}
