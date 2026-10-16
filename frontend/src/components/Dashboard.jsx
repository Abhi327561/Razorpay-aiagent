import React, { useEffect, useState } from "react";
import { formatINR } from "./Shop";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

function StatCard({ label, value, sub, highlight }) {
  return (
    <div style={{ flex: 1, minWidth: 200, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 22, boxShadow: "var(--shadow)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ink3)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 6, color: highlight ? "var(--brand)" : "var(--ink)" }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "var(--ink2)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [seeding, setSeeding] = useState(false);

  function load() {
    fetch(`${API_URL}/api/analytics`)
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Failed to load analytics");
        setData(body);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function reseed() {
    setSeeding(true);
    try {
      const res = await fetch(`${API_URL}/api/products/seed`, { method: "POST" });
      const body = await res.json();
      alert(body.message || "Catalog re-indexed");
    } catch (err) {
      alert("Seeding error: " + err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px clamp(16px, 4vw, 48px) 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Growth report</h1>
          <p style={{ margin: "4px 0 0", color: "var(--ink2)", fontSize: 14 }}>How the AI agent is converting chats into sales.</p>
        </div>
        <button onClick={reseed} disabled={seeding} style={{ border: "1px solid var(--line-dark)", background: "#fff", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, opacity: seeding ? 0.6 : 1 }}>
          {seeding ? "Re-indexing…" : "↻ Re-index catalog"}
        </button>
      </div>

      {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", padding: 14, borderRadius: 10 }}>[error] {error}</div>}
      {!data && !error && <div style={{ color: "var(--ink2)" }}>Loading report…</div>}

      {data && (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
            <StatCard label="Conversations" value={data.totalConversations} sub="chats handled by the agent" />
            <StatCard label="Sales closed" value={data.totalClosed} sub="payment links created" highlight />
            <StatCard label="Conversion" value={`${(data.conversionRate * 100).toFixed(1)}%`} sub="chats → sales" highlight />
            <StatCard label="Revenue" value={formatINR(data.totalRevenue)} sub="closed volume" highlight />
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 320, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 22, boxShadow: "var(--shadow)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Top searched categories</h3>
              {data.topCategories.length === 0 && <p style={{ color: "var(--ink2)", fontSize: 14 }}>No data yet — try a few chats first.</p>}
              {data.topCategories.map((c) => {
                const max = Math.max(1, ...data.topCategories.map((x) => x.count));
                return (
                  <div key={c.category} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6, textTransform: "capitalize" }}>
                      <span>{c.category}</span>
                      <span style={{ color: "var(--brand)" }}>{c.count} searches</span>
                    </div>
                    <div style={{ height: 8, background: "var(--surface2)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(c.count / max) * 100}%`, background: "linear-gradient(90deg, #1d4ed8, #3b82f6)", borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1, minWidth: 320, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 22, boxShadow: "var(--shadow)" }}>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>Recent activity</h3>
              {data.recent.length === 0 && <p style={{ color: "var(--ink2)", fontSize: 14 }}>Nothing logged yet.</p>}
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {data.recent.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line)", fontSize: 13 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>{r.query}</span>
                    {r.paymentLinkCreated ? (
                      <span style={{ background: "var(--green-soft)", color: "var(--green)", fontWeight: 700, fontSize: 12, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>SOLD · {r.productName}</span>
                    ) : (
                      <span style={{ background: "var(--surface2)", color: "var(--ink2)", fontWeight: 600, fontSize: 12, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>browsed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
