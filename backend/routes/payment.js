import { Router } from "express";
import Product from "../models/Product.js";
import Interaction from "../models/Interaction.js";
import { createPaymentLink } from "../services/payment.js";

const router = Router();

// POST /api/payment/link — mainly for direct testing; the agent also calls
// createPaymentLink internally as a tool during a chat conversation.
// body: { productId, customerName? }
router.post("/link", async (req, res) => {
  try {
    const result = await createPaymentLink(req.body);
    // Log for the growth dashboard (shop checkouts count as closed sales),
    // best-effort — never blocks the payment response.
    Product.findById(req.body.productId)
      .then((p) =>
        Interaction.create({
          query: `[shop checkout] ${result.product}`,
          categories: p?.category ? [p.category] : [],
          paymentLinkCreated: true,
          productName: result.product,
          amount: result.amount,
        })
      )
      .catch((err) => console.error("Interaction logging failed (non-fatal):", err.message));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
