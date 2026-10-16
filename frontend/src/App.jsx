import React, { useState } from "react";
import Shop, { BuyModal } from "./components/Shop";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";

const TABS = [
  { id: "shop", label: "Shop" },
  { id: "chat", label: "AI Assistant" },
  { id: "growth", label: "Growth" },
];

export default function App() {
  const [view, setView] = useState("shop");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [buying, setBuying] = useState(null);

  function askAI(product) {
    setSelectedProduct(product || null);
    setView("chat");
  }

  return (
    <div style={{ minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column" }}>
      {buying && <BuyModal product={buying} onClose={() => setBuying(null)} />}

      {/* Header */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)", padding: "0 clamp(16px, 4vw, 48px)", display: "flex", alignItems: "center", gap: 20, height: 64, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0f2a5c, #3b82f6)", color: "#fff", fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>T</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.1 }}>ThreadKart</div>
            <div style={{ fontSize: 11, color: "var(--ink3)", fontWeight: 600 }}>AI-POWERED APPAREL STORE</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 4, marginLeft: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                border: "none", background: view === t.id ? "var(--brand-soft)" : "transparent",
                color: view === t.id ? "var(--brand-dark)" : "var(--ink2)",
                fontWeight: 700, fontSize: 14, padding: "9px 18px", borderRadius: 10,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)", background: "var(--amber-soft)", padding: "5px 12px", borderRadius: 20 }}>TEST MODE</span>
          <span style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 600 }}>Secured by Razorpay</span>
        </div>
      </header>

      {/* Views */}
      <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {view === "shop" && <Shop onAskAI={askAI} />}
        {view === "chat" && <Chat initialProduct={selectedProduct} onBuy={setBuying} />}
        {view === "growth" && <Dashboard />}
      </main>
    </div>
  );
}
