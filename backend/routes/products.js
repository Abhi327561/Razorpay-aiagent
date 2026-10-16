import { Router } from "express";
import { readFile } from "fs/promises";
import Product from "../models/Product.js";
import { embedProduct } from "../services/embeddings.js";

const router = Router();

// GET /api/products — list catalog (for admin/debug view)
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().select("-embedding");
    res.json(products);
  } catch (err) {
    console.error("GET /api/products failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products/seed — re-seed catalog from data/products.json.
// Same source as scripts/seed.js; products whose embedding fails are still
// inserted (keyword fallback keeps them searchable).
router.post("/seed", async (_req, res) => {
  try {
    const raw = await readFile(new URL("../data/products.json", import.meta.url), "utf-8");
    const products = JSON.parse(raw);
    await Product.deleteMany({});
    let done = 0;
    let failed = 0;
    for (const p of products) {
      try {
        const embedding = await embedProduct(p);
        await Product.create({ ...p, embedding });
        done++;
      } catch {
        failed++;
        await Product.create({ ...p, embedding: [] });
      }
    }
    res.json({
      message: `Seeded ${done}/${products.length} products${failed ? ` (${failed} without embeddings)` : ""}.`,
      count: done,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
