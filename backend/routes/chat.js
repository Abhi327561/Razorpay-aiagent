import { Router } from "express";
import { runAgentTurn } from "../services/agent.js";
import Interaction from "../models/Interaction.js";

const router = Router();

// POST /api/chat
// body: { message: string, imageBase64?: string, conversationHistory: [...] }
router.post("/", async (req, res) => {
  try {
    const { message, imageBase64, conversationHistory = [] } = req.body;
    const result = await runAgentTurn({ message, imageBase64, conversationHistory });

    // Log for the growth dashboard — best-effort, never blocks the chat response.
    Interaction.create({
      query: message || "[image query]",
      categories: [...new Set((result.products || []).map((p) => p.category).filter(Boolean))],
      paymentLinkCreated: Boolean(result.paymentLink),
      productName: result.paymentLink?.product,
      amount: result.paymentLink?.amount,
    }).catch((err) => console.error("Interaction logging failed (non-fatal):", err.message));

    res.json(result);
  } catch (err) {
    console.error("POST /api/chat failed:", err); // full stack, visible in the terminal
    res.status(500).json({ error: err.message });
  }
});

export default router;
