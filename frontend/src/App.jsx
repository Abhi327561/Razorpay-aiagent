import React, { useState } from "react";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";
import CatalogModal from "./components/CatalogModal";

export default function App() {
  const [tab, setTab] = useState("chat");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [prefillPrompt, setPrefillPrompt] = useState("");

  const handleSelectCatalogProduct = (product) => {
    setPrefillPrompt(`Tell me more about "${product.name}" and offer a deal if possible.`);
    setTab("chat");
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* ── Top Navigation Bar ── */}
      <header style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        padding: "0 24px",
        height: 56,
        background: "var(--panel-solid)",
        borderBottom: "1px solid var(--line)",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 32 }}>
          <span style={{
            width: 9, height: 9, borderRadius: "50%",
            background: "var(--phosphor)",
            animation: "pulse-dot 2s ease-in-out infinite",
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            color: "var(--phosphor)",
          }}>
            POS://SALES-AGENT
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--paper-dim)",
            background: "var(--line)",
            padding: "2px 8px",
            borderRadius: 4,
          }}>
            TERMINAL ONLINE
          </span>
        </div>

        {/* Tab Switcher */}
        <nav style={{ display: "flex", gap: 4 }}>
          {[
            { id: "chat",      label: "💬  Customer Chat" },
            { id: "dashboard", label: "📊  Growth Report"  },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? "var(--phosphor-glow)" : "transparent",
                border: "none",
                borderBottom: tab === t.id
                  ? "2px solid var(--phosphor)"
                  : "2px solid transparent",
                color: tab === t.id ? "var(--phosphor)" : "var(--paper-dim)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.02em",
                padding: "0 18px",
                height: 56,
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setIsCatalogOpen(true)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "2px solid transparent",
              color: "var(--paper-mid)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.02em",
              padding: "0 18px",
              height: 56,
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--phosphor)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--paper-mid)")}
          >
            📦 Catalog Browser
          </button>
        </nav>

        {/* Right metadata */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--paper-dim)",
          }}>
            v0.2 · RAZORPAY AI BUILDER
          </span>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.06em",
            color: "var(--amber)",
            background: "var(--amber-dim)",
            border: "1px solid rgba(255,180,84,0.25)",
            padding: "3px 10px",
            borderRadius: 4,
          }}>
            TEST MODE
          </span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        overflow: "hidden",
        display: "flex",
      }}>
        {tab === "chat" ? <Chat externalPrompt={prefillPrompt} clearExternalPrompt={() => setPrefillPrompt("")} /> : <Dashboard />}
      </main>

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectProduct={handleSelectCatalogProduct}
      />
    </div>
  );
}
