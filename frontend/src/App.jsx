import React, { useState } from "react";
import Chat from "./components/Chat";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [tab, setTab] = useState("chat");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 620 }}>
        {/* Terminal title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            background: "var(--panel-solid)",
            border: "1px solid var(--line)",
            borderBottom: "none",
            borderRadius: "10px 10px 0 0",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.05em",
            color: "var(--paper-dim)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--phosphor)",
              boxShadow: "0 0 8px var(--phosphor)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          POS://sales-agent — TERMINAL ONLINE
          <span style={{ marginLeft: "auto", color: "var(--paper-dim)" }}>
            v0.1 · TEST MODE
          </span>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "var(--panel-solid)",
            border: "1px solid var(--line)",
            borderBottom: "none",
          }}
        >
          {[
            { id: "chat", label: "CUSTOMER CHAT" },
            { id: "dashboard", label: "GROWTH REPORT" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid var(--phosphor)" : "2px solid transparent",
                color: tab === t.id ? "var(--phosphor)" : "var(--paper-dim)",
                fontSize: 11,
                letterSpacing: "0.06em",
                padding: "10px 0",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "chat" ? <Chat /> : <Dashboard />}

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--paper-dim)",
            textAlign: "center",
            marginTop: 12,
            letterSpacing: "0.04em",
          }}
        >
          RAZORPAY AI BUILDER · TRACK 1 — AGENTIC COMMERCE DEMO
        </p>
      </div>
    </div>
  );
}
