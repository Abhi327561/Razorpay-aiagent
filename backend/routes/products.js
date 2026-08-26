import { Router } from "express";
import Product from "../models/Product.js";
import { embedProduct } from "../services/embeddings.js";

const router = Router();

// GET /api/products — list catalog (for admin/debug view)
router.get("/", async (_req, res) => {
  const products = await Product.find().select("-embedding");
  res.json(products);
});

// POST /api/products — add a product; auto-generates its embedding
// body: { name, description, price, imageUrl, category, stock }
router.post("/", async (req, res) => {
  try {
    const embedding = await embedProduct(req.body);
    const product = await Product.create({ ...req.body, embedding });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
