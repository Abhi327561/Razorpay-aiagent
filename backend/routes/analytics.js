import { Router } from "express";
import Interaction from "../models/Interaction.js";

const router = Router();

// GET /api/analytics — aggregate growth metrics for the dashboard.
router.get("/", async (_req, res) => {
  try {
    const interactions = await Interaction.find().sort({ createdAt: -1 });

    const totalConversations = interactions.length;
    const closed = interactions.filter((i) => i.paymentLinkCreated);
    const totalClosed = closed.length;
    const conversionRate = totalConversations ? totalClosed / totalConversations : 0;
    const totalRevenue = closed.reduce((sum, i) => sum + (i.amount || 0), 0);
    const avgOrderValue = totalClosed ? Math.round(totalRevenue / totalClosed) : 0;

    const categoryCounts = {};
    for (const i of interactions) {
      for (const c of i.categories) {
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      }
    }
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({ category, count }));

    const funnel = {
      conversations: totalConversations,
      productsSurfaced: interactions.filter(i => i.categories && i.categories.length > 0).length,
      linksCreated: totalClosed,
      paidRatio: conversionRate,
    };

    const recent = interactions.slice(0, 15).map((i) => ({
      id: i._id.toString(),
      query: i.query,
      paymentLinkCreated: i.paymentLinkCreated,
      productName: i.productName,
      amount: i.amount,
      createdAt: i.createdAt,
    }));

    res.json({ 
      totalConversations, 
      totalClosed, 
      conversionRate, 
      totalRevenue, 
      avgOrderValue,
      topCategories, 
      funnel,
      recent 
    });
  } catch (err) {
    console.error("GET /api/analytics failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
