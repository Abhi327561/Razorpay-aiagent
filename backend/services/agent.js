import { embedText, searchCatalog } from "./embeddings.js";
import { createPaymentLink } from "./payment.js";
import { callGroq } from "./llmClient.js";
import Product from "../models/Product.js";

// The agent has three tools it can call mid-conversation. This is what makes it
// "agentic" rather than a plain RAG chatbot: it decides which tool to use and when,
// including when to stop answering questions and push for the close.
// Groq uses OpenAI-style tool definitions: { type: "function", function: {...} }.
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_catalog",
      description:
        "Search the product catalog by a text description to find matching items. Use this whenever the customer describes what they want in their own words.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_products",
      description: "Compare two products by their catalog IDs on price and attributes.",
      parameters: {
        type: "object",
        properties: {
          productIdA: { type: "string" },
          productIdB: { type: "string" },
        },
        required: ["productIdA", "productIdB"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_payment_link",
      description:
        "Generate a real Razorpay payment link for a specific product. Only call this once the customer has clearly confirmed which exact product they want to buy.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          customerName: { type: "string" },
        },
        required: ["productId"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are a sales agent for a D2C apparel store. Your job is to
understand what the customer wants, recommend well-matched products from the catalog
using search_catalog, answer questions honestly, and — once the customer signals
they're ready to buy a specific item — close the sale by calling create_payment_link.

Be concise and conversational, not pushy. Always search the catalog before recommending
anything; never invent products. If the customer sends a photo, describe what you see
in it, then call search_catalog with a text query capturing the key visual traits
(color, garment type, style) to find similar items. Only call create_payment_link when
the customer has clearly confirmed the specific product they want. Keep replies to 2-3
sentences.`;

// Maps the frontend's simple message history into OpenAI-style messages.
// Product cards and payment links from earlier turns aren't replayed — only the
// text — since the model doesn't need its own past tool outputs to keep chatting.
function toGroqHistory(conversationHistory) {
  return conversationHistory
    .filter((m) => m.text)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    }));
}

async function executeTool(name, args) {
  switch (name) {
    case "search_catalog": {
      const embedding = await embedText(args.query);
      const matches = await searchCatalog(embedding, 5);
      return {
        forModel: matches.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
        })),
        products: matches, // full objects, kept for the frontend's receipt cards
      };
    }

    case "compare_products": {
      const [a, b] = await Promise.all([
        Product.findById(args.productIdA),
        Product.findById(args.productIdB),
      ]);
      if (!a || !b) return { forModel: { error: "One or both products not found" } };
      return {
        forModel: {
          [a.name]: { price: a.price, category: a.category, description: a.description },
          [b.name]: { price: b.price, category: b.category, description: b.description },
        },
      };
    }

    case "create_payment_link": {
      const link = await createPaymentLink(args);
      return { forModel: link, paymentLink: link };
    }

    default:
      return { forModel: { error: `Unknown tool: ${name}` } };
  }
}

const MAX_TOOL_TURNS = 5; // safety bound against runaway tool-call loops

export async function runAgentTurn({ message, imageBase64, conversationHistory }) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...toGroqHistory(conversationHistory)];

  let collectedProducts = [];

  if (imageBase64) {
    // qwen3.6-27b sees the image directly and is expected (per system prompt) to
    // describe it and call search_catalog itself with a matching text query.
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message || "What is this? Find me something similar." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  let paymentLink = null;
  let finalText = "";

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await callGroq({ messages, tools: TOOLS });
    const choice = response.choices[0];
    const msg = choice.message;

    if (msg.content) finalText = msg.content;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      break; // model has given its final answer, no more tools requested
    }

    // Echo the assistant's tool-call message back before sending results —
    // OpenAI-compatible APIs require the full turn history, not just the outcome.
    messages.push(msg);

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments || "{}");
      const { forModel, products, paymentLink: link } = await executeTool(call.function.name, args);
      if (products) collectedProducts = products;
      if (link) paymentLink = link;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(forModel),
      });
    }
  }

  return {
    reply: finalText || "Sorry, I couldn't come up with a response — try rephrasing?",
    products: collectedProducts,
    paymentLink,
  };
}

export { TOOLS };
