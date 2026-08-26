import mongoose from "mongoose";

// One row per chat turn. Deliberately lightweight — this exists to power the
// merchant growth dashboard (conversations, conversion rate, trending
// categories), not as a full analytics/event system.
const interactionSchema = new mongoose.Schema(
  {
    query: { type: String, required: true },
    categories: { type: [String], default: [] }, // categories of products the agent surfaced
    paymentLinkCreated: { type: Boolean, default: false },
    productName: { type: String },
    amount: { type: Number }, // paise, set only when paymentLinkCreated
  },
  { timestamps: true }
);

export default mongoose.model("Interaction", interactionSchema);
