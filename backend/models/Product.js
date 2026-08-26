import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // in paise, matches Razorpay convention
    imageUrl: { type: String, required: true },
    category: { type: String, index: true },
    stock: { type: Number, default: 10 },
    // CLIP embedding of (description + image), used for similarity search.
    // Stored as a plain array here since catalog size is small (30-50 items) —
    // in-memory cosine similarity is enough; swap for a vector DB if scaling up.
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
