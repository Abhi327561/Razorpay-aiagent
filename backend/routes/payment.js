import { Router } from "express";
import { createPaymentLink } from "../services/payment.js";

const router = Router();

// POST /api/payment/link — mainly for direct testing; the agent also calls
// createPaymentLink internally as a tool during a chat conversation.
// body: { productId, customerName? }
router.post("/link", async (req, res) => {
  try {
    const result = await createPaymentLink(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
