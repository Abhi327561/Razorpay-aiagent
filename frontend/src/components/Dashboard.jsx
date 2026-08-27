import React, { useEffect, useState } from "react";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

function formatRupees(paise) {
  return `Rs.${((paise || 0) / 100).toFixed(2)}`;
}

function StatBlock({ label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 130, padding: "14px 16px", border: "1px solid var(--line)" }}>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--paper-dim)",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontFamily: "var(--font-mono)",
          fontSize: 24,
          fontWeight: 700,
          color: accent ? "var(--phosphor)" : "var(--paper)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/analytics`)
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Failed to load analytics");
        setData(body);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div
        style={{
          padding: 20,
          background: "var(--panel-solid)",
          border: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--danger)",
        }}
      >
        [error] {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          padding: 20,
          background: "var(--panel-solid)",
          border: "1px solid var(--line)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--paper-dim)",
        }}
      >
        loading report…
      </div>
    );
  }

  const maxCategoryCount = Math.max(1, ...data.topCategories.map((c) => c.count));

  return (
    <div style={{ padding: "20px 16px", background: "var(--panel-solid)", border: "1px solid var(--line)" }}>
      {/* Top stats row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <StatBlock label="CONVERSATIONS" value={data.totalConversations} />
        <StatBlock label="SALES CLOSED" value={data.totalClosed} accent />
        <StatBlock label="CONVERSION" value={`${(data.conversionRate * 100).toFixed(0)}%`} accent />
        <StatBlock label="REVENUE" value={formatRupees(data.totalRevenue)} accent />
      </div>

      {/* Top categories — bar-style ledger */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--paper-dim)",
          marginBottom: 8,
        }}
      >
        TOP SEARCHED CATEGORIES
      </p>
      {data.topCategories.length === 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--paper-dim)" }}>
          no data yet — try a few chats first
        </p>
      )}
      {data.topCategories.map((c) => (
        <div key={c.category} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--font-mono)" }}>
            <span>{c.category}</span>
            <span style={{ color: "var(--phosphor)" }}>{c.count}</span>
          </div>
          <div style={{ height: 4, background: "var(--line)", marginTop: 3 }}>
            <div
              style={{
                height: "100%",
                width: `${(c.count / maxCategoryCount) * 100}%`,
                background: "var(--phosphor)",
              }}
            />
          </div>
        </div>
      ))}

      {/* Recent activity log */}
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--paper-dim)",
          marginTop: 20,
          marginBottom: 8,
        }}
      >
        RECENT ACTIVITY
      </p>
      {data.recent.map((r, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            padding: "6px 0",
            borderBottom: "1px dashed var(--line)",
            color: r.paymentLinkCreated ? "var(--phosphor)" : "var(--paper-dim)",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.query}
          </span>
          <span style={{ flexShrink: 0 }}>
            {r.paymentLinkCreated ? `SOLD · ${r.productName}` : "browsed"}
          </span>
        </div>
      ))}
    </div>
  );
}
