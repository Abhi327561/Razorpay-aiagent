// Must be the first import: ES module imports are hoisted and evaluated in order
// before any other code runs, so dotenv has to load .env before any module below
// (like payment.js, which reads RAZORPAY_KEY_ID at load time) gets evaluated.
import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import productsRouter from "./routes/products.js";
import chatRouter from "./routes/chat.js";
import paymentRouter from "./routes/payment.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // generous limit for base64 image uploads

// Basic request logging — visible in this terminal for every call, success or fail.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use("/api/products", productsRouter);
app.use("/api/chat", chatRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
