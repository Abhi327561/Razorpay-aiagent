import React, { useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatRupees(paise) {
  return `₹${((paise || 0) / 100).toFixed(2)}`;
}

function StatCard({ label, value, accent, icon, sub }) {
  return (
    <div style={{
      flex: "1 1 180px",
      minWidth: 160,
      padding: "20px 22px",
      background: "var(--panel-solid)",
      border: `1px solid ${accent ? "var(--line-bright)" : "var(--line)"}`,
      borderRadius: 12,
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.18s ease, box-shadow 0.18s ease",
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = accent
          ? "0 8px 32px rgba(93,255,170,0.1)"
          : "0 8px 24px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(93,255,170,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.09em",
            color: "var(--paper-dim)", marginBottom: 10,
          }}>
            {label}
          </p>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700,
            color: accent ? "var(--phosphor)" : "var(--paper)",
            lineHeight: 1,
          }}>
            {value}
          </p>
          {sub && (
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--paper-dim)", marginTop: 6,
            }}>
              {sub}
            </p>
          )}
        </div>
        <span style={{ fontSize: 22, opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}

function CategoryBar({ label, count, max }) {
  const pct = Math.round((count / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 5,
      }}>
        <span style={{ color: "var(--paper-mid)" }}>{label}</span>
        <span style={{ color: "var(--phosphor)", fontWeight: 700 }}>{count} ({pct}%)</span>
      </div>
      <div style={{
        height: 8, background: "var(--line)", borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, var(--phosphor-dim), var(--phosphor))",
          borderRadius: 4,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

function FunnelVisualizer({ funnel }) {
  if (!funnel) return null;

  const stages = [
    { label: "Conversations Started", value: funnel.conversations || 0, icon: "💬" },
    { label: "Products Matched", value: funnel.productsSurfaced || 0, icon: "🔍" },
    { label: "Payment Links Generated", value: funnel.linksCreated || 0, icon: "🎟️" },
  ];

  const maxVal = Math.max(1, funnel.conversations || 1);

  return (
    <div style={{
      background: "var(--panel-solid)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: "22px 24px",
      marginBottom: 24,
    }}>
      <p style={{
        fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em",
        color: "var(--paper-dim)", marginBottom: 18,
      }}>
        AGENT SALES CONVERSION FUNNEL
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stages.map((st, idx) => {
          const widthPct = Math.max(15, Math.round((st.value / maxVal) * 100));
          return (
            <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{st.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "var(--font-mono)", fontSize: 11, marginBottom: 4,
                }}>
                  <span style={{ color: "var(--paper-mid)" }}>{st.label}</span>
                  <span style={{ color: "var(--phosphor)", fontWeight: 700 }}>{st.value}</span>
                </div>
                <div style={{
                  height: 10, background: "var(--line)", borderRadius: 6, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${widthPct}%`,
                    background: `linear-gradient(90deg, var(--phosphor-dim) 0%, var(--phosphor) 100%)`,
                    borderRadius: 6,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = () => {
    setRefreshing(true);
    fetch(`${API_URL}/api/analytics`)
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Failed to load analytics");
        setData(body);
        setRefreshing(false);
      })
      .catch((err) => {
        setError(err.message);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg2)",
      }}>
        <div style={{
          padding: "24px 32px", background: "var(--panel-solid)",
          border: "1px solid var(--danger)", borderRadius: 12,
          fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--danger)",
          maxWidth: 480,
        }}>
          ⚠ {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg2)",
      }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--paper-dim)",
          letterSpacing: "0.06em",
        }}>
          loading report<span style={{ animation: "blink 1s step-start infinite" }}>…</span>
        </div>
      </div>
    );
  }

  const maxCategoryCount = Math.max(1, ...data.topCategories.map((c) => c.count));

  return (
    <div style={{
      flex: 1,
      display: "flex",
      overflow: "hidden",
      background: "var(--bg2)",
    }}>
      {/* ── Main dashboard content ── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 40px",
      }}>
        {/* Page header */}
        <div style={{
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700,
              color: "var(--paper)", letterSpacing: "0.06em",
            }}>
              MERCHANT GROWTH REPORT
            </h1>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--paper-dim)", marginTop: 4, letterSpacing: "0.04em",
            }}>
              Real-time sales performance & conversion telemetry from your AI agent
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={refreshing}
            style={{
              background: "var(--panel-solid)",
              border: "1px solid var(--line-bright)",
              color: "var(--paper-mid)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🔄 {refreshing ? "REFRESHING..." : "REFRESH METRICS"}
          </button>
        </div>

        {/* Stat cards row */}
        <div style={{
          display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24,
        }}>
          <StatCard
            label="TOTAL CONVERSATIONS"
            value={data.totalConversations}
            icon="💬"
            sub="all time queries"
          />
          <StatCard
            label="SALES CLOSED"
            value={data.totalClosed}
            accent
            icon="✅"
            sub="payment links created"
          />
          <StatCard
            label="CONVERSION RATE"
            value={`${(data.conversionRate * 100).toFixed(1)}%`}
            accent
            icon="📈"
            sub="closed / total"
          />
          <StatCard
            label="AVG ORDER VALUE"
            value={formatRupees(data.avgOrderValue)}
            icon="🏷️"
            sub="revenue / closed"
          />
          <StatCard
            label="TOTAL REVENUE"
            value={formatRupees(data.totalRevenue)}
            accent
            icon="💰"
            sub="via payment links"
          />
        </div>

        {/* Funnel Visualizer */}
        <FunnelVisualizer funnel={data.funnel} />

        {/* Two-column below */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Top categories */}
          <div style={{
            flex: "1 1 340px",
            background: "var(--panel-solid)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "22px 24px",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em",
              color: "var(--paper-dim)", marginBottom: 18,
            }}>
              TOP SEARCHED CATEGORIES
            </p>
            {data.topCategories.length === 0 ? (
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--paper-dim)",
              }}>
                no data yet — try a few chats first
              </p>
            ) : (
              data.topCategories.map((c) => (
                <CategoryBar
                  key={c.category}
                  label={c.category}
                  count={c.count}
                  max={maxCategoryCount}
                />
              ))
            )}
          </div>

          {/* Recent activity */}
          <div style={{
            flex: "1 1 340px",
            background: "var(--panel-solid)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em",
              color: "var(--paper-dim)", marginBottom: 18,
            }}>
              RECENT AGENT LOGS
            </p>
            <div style={{ flex: 1, overflowY: "auto", maxHeight: 320 }}>
              {data.recent.length === 0 ? (
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--paper-dim)",
                }}>
                  no recent activity logs
                </p>
              ) : (
                data.recent.map((r, i) => (
                  <div
                    key={r.id || i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--line)",
                      animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {r.paymentLinkCreated ? "🛍️" : "👁️"}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--font-sans)", fontSize: 12,
                          color: "var(--paper-mid)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {r.query}
                        </div>
                        {r.productName && (
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: 10,
                            color: "var(--phosphor-dim)",
                          }}>
                            {r.productName}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, flexShrink: 0,
                      padding: "3px 10px", borderRadius: 20,
                      background: r.paymentLinkCreated ? "rgba(93,255,170,0.1)" : "var(--line)",
                      color: r.paymentLinkCreated ? "var(--phosphor)" : "var(--paper-dim)",
                      border: `1px solid ${r.paymentLinkCreated ? "var(--phosphor-dim)" : "transparent"}`,
                      letterSpacing: "0.04em",
                    }}>
                      {r.paymentLinkCreated ? `LINK GENERATED` : "browsed"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar: quick info ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: "var(--panel-solid)",
        borderLeft: "1px solid var(--line)",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        overflowY: "auto",
      }}>
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 12,
          }}>
            SYSTEM STATUS
          </p>
          {[
            { label: "Embedding Service", ok: true },
            { label: "LLM (Groq)", ok: true },
            { label: "Payment API", ok: true },
            { label: "Database", ok: true },
          ].map(s => (
            <div key={s.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 0",
              borderBottom: "1px solid var(--line)",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: s.ok ? "var(--phosphor)" : "var(--danger)",
                boxShadow: s.ok ? "0 0 6px var(--phosphor)" : "0 0 6px var(--danger)",
              }} />
              <span style={{
                fontFamily: "var(--font-sans)", fontSize: 11,
                color: "var(--paper-dim)",
              }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 12,
          }}>
            ABOUT ARCHITECTURE
          </p>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 11,
            color: "var(--paper-dim)", lineHeight: 1.6,
          }}>
            Razorpay AI Builder<br />
            Track 1 — Agentic Commerce<br />
            <br />
            • Fast CLIP Embeddings<br />
            • Groq Tool-Use Loop<br />
            • Razorpay Payment Links
          </p>
        </div>
      </aside>
    </div>
  );
}
