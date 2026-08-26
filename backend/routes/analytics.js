import { Router } from "express";
import Interaction from "../models/Interaction.js";

const router = Router();

// GET /api/analytics — aggregate growth metrics for the dashboard.
// Demo-scale data, so a simple in-memory reduce is fine — no need for a
// Mongo aggregation pipeline at this volume.
router.get("/", async (_req, res) => {
  try {
    const interactions = await Interaction.find().sort({ createdAt: -1 });

    const totalConversations = interactions.length;
    const closed = interactions.filter((i) => i.paymentLinkCreated);
    const totalClosed = closed.length;
    const conversionRate = totalConversations ? totalClosed / totalConversations : 0;
    const totalRevenue = closed.reduce((sum, i) => sum + (i.amount || 0), 0);

    const categoryCounts = {};
    for (const i of interactions) {
      for (const c of i.categories) {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      }
    }
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    const recent = interactions.slice(0, 10).map((i) => ({
      query: i.query,
      paymentLinkCreated: i.paymentLinkCreated,
      productName: i.productName,
      createdAt: i.createdAt,
    }));

    res.json({ totalConversations, totalClosed, conversionRate, totalRevenue, topCategories, recent });
  } catch (err) {
    console.error("GET /api/analytics failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
