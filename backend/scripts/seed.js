/**
 * Seeds the catalog: reads backend/data/products.json, calls the embedding
 * service for each product's text embedding, and inserts into MongoDB.
 *
 * Requires the embedding service running (uvicorn main:app --port 8000) AND
 * MONGODB_URI set in .env, since it uses the same embedProduct() the live app uses.
 *
 * Run from backend/:  node scripts/seed.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import Product from "../models/Product.js";
import { embedProduct } from "../services/embeddings.js";

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");

  const raw = await readFile(new URL("../data/products.json", import.meta.url), "utf-8");
  const products = JSON.parse(raw);

  await Product.deleteMany({});
  console.log(`Cleared existing catalog. Seeding ${products.length} products...`);

  let done = 0;
  let failed = 0;
  for (const p of products) {
    try {
      const embedding = await embedProduct(p);
      // embedProduct returns [] when the service is down — still insert so
      // keyword fallback in searchCatalog keeps working.
      await Product.create({ ...p, embedding });
      done++;
      process.stdout.write(`\r  ${done}/${products.length} embedded`);
    } catch (err) {
      failed++;
      console.error(`\nSkipping "${p.name}": ${err.message}`);
    }
  }

  console.log(`\nDone. ${done} products seeded with embeddings.${failed ? ` ${failed} skipped.` : ""}`);
  if (failed > 0) {
    console.error("Some products were skipped. Is the embedding service running? (uvicorn main:app --port 8000)");
  }
  if (done === 0) {
    console.error("Nothing seeded — aborting with error.");
    await mongoose.disconnect();
    process.exit(1);
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
