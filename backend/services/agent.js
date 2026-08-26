import { embedText, searchCatalog } from "./embeddings.js";
import { createPaymentLink } from "./payment.js";
import { callGroq } from "./llmClient.js";
import Product from "../models/Product.js";

// The agent has tools it can call mid-conversation. This is what makes it
// "agentic" rather than a plain RAG chatbot: it decides which tool to use and when,
// including when to compare products, offer discounts, or push for the close.
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
      name: "apply_discount",
      description:
        "Apply a promotional discount code (e.g. WELCOME10 for 10% off, FESTIVE15 for 15% off, AGENT20 for 20% off) to a product to incentive the buyer.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          code: { type: "string" },
        },
        required: ["productId"],
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
          discountPercent: { type: "number" },
          discountCode: { type: "string" },
        },
        required: ["productId"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are an expert AI sales agent for a D2C store. Your goal is to:
1. Understand customer intent (text or photo upload).
2. Recommend items from the catalog using search_catalog (never hallucinate products).
3. Help customers evaluate options using compare_products if they are undecided between items.
4. Offer discounts using apply_discount if the user hesitates, asks for a deal/coupon, or price is an issue (e.g. WELCOME10 for 10% off, FESTIVE15 for 15% off).
5. Once the customer clearly confirms they want to purchase, close the sale by calling create_payment_link (passing any applicable discount).

Be concise, warm, helpful, and closing-oriented. Keep text responses to 2-3 short sentences max.`;

// Maps the frontend's simple message history into OpenAI-style messages.
// Keeps only the most recent 6 messages to stay safely below Groq token-per-minute (TPM) limits.
function toGroqHistory(conversationHistory) {
  return (conversationHistory || [])
    .slice(-6)
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
          [a.name]: { id: a._id.toString(), price: a.price, category: a.category, description: a.description },
          [b.name]: { id: b._id.toString(), price: b.price, category: b.category, description: b.description },
        },
        comparison: {
          productA: a.toObject(),
          productB: b.toObject(),
        },
      };
    }

    case "apply_discount": {
      const product = await Product.findById(args.productId);
      if (!product) return { forModel: { error: "Product not found" } };
      
      const code = (args.code || "WELCOME10").toUpperCase();
      let percent = 10;
      if (code.includes("15")) percent = 15;
      if (code.includes("20")) percent = 20;

      const discountedPrice = Math.max(100, Math.round(product.price * (1 - percent / 100)));

      return {
        forModel: {
          product: product.name,
          code,
          discountPercent: percent,
          originalPrice: product.price,
          discountedPrice,
          message: `Applied ${percent}% discount with code ${code}. New price: ₹${(discountedPrice/100).toFixed(2)}`
        },
        discount: {
          productId: product._id.toString(),
          productName: product.name,
          code,
          percent,
          originalPrice: product.price,
          discountedPrice,
        }
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
  let comparisonData = null;
  let discountData = null;
  let paymentLink = null;
  let finalText = "";

  if (imageBase64) {
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

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await callGroq({ messages, tools: TOOLS });
    const choice = response.choices[0];
    const msg = choice.message;

    if (msg.content) finalText = msg.content;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      break;
    }

    messages.push(msg);

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments || "{}");
      const { forModel, products, comparison, discount, paymentLink: link } = await executeTool(call.function.name, args);
      if (products) collectedProducts = products;
      if (comparison) comparisonData = comparison;
      if (discount) discountData = discount;
      if (link) paymentLink = link;

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(forModel),
      });
    }
  }

  return {
    reply: finalText || "Here are the details from our store catalog.",
    products: collectedProducts,
    comparison: comparisonData,
    discount: discountData,
    paymentLink,
  };
}

export { TOOLS };
