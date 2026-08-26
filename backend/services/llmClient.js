import fetch from "node-fetch";

// Primary model for vision + tool calling: qwen/qwen3.6-27b
// Fallback text models with higher TPM limits: llama-3.3-70b-versatile, llama-3.1-8b-instant
const PRIMARY_MODEL = "qwen/qwen3.6-27b";
const FALLBACK_MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callGroq({ messages, tools, modelOverride, retries = 2 }) {
  if (!process.env.LLM_API_KEY) {
    throw new Error(
      "LLM_API_KEY missing in .env — get a free key at console.groq.com (no card required)."
    );
  }

  const hasImage = messages.some((m) =>
    Array.isArray(m.content) && m.content.some((c) => c.type === "image_url")
  );

  let targetModel = modelOverride || PRIMARY_MODEL;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages,
          tools,
        }),
      });

      if (res.status === 429) {
        const text = await res.text();
        console.warn(`Groq 429 Rate Limit on model ${targetModel} (attempt ${attempt + 1}/${retries + 1}): ${text}`);
        
        if (attempt < retries) {
          // If text-only query and primary model rate limited, switch to fallback model with higher TPM
          if (!hasImage && targetModel === PRIMARY_MODEL) {
            targetModel = FALLBACK_MODEL;
            console.log(`Switching text request to fallback model: ${targetModel}`);
          }
          const waitMs = (attempt + 1) * 3000;
          console.log(`Waiting ${waitMs}ms before retrying Groq request...`);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`Rate limit reached (429). Please wait a few seconds and try again.`);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq API error ${res.status}: ${text}`);
      }

      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2000);
    }
  }
}
