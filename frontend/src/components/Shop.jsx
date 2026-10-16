import React, { useEffect, useMemo, useState } from "react";
import ProductImage from "./ProductImage";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

export function formatINR(paise) {
  return `₹${((paise || 0) / 100).toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export function BuyModal({ product, onClose }) {
  const [name, setName] = useState("");
  const [state, setState] = useState({ loading: false, error: null, link: null });

  async function createLink() {
    setState({ loading: true, error: null, link: null });
    try {
      const res = await fetch(`${API_URL}/api/payment/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id, customerName: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setState({ loading: false, error: null, link: data });
    } catch (err) {
      setState({ loading: false, error: err.message, link: null });
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(16,24,40,0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 20,
        animation: "fadeUp 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: 440, background: "var(--surface)", borderRadius: 16, boxShadow: "0 24px 64px rgba(16,24,40,0.25)", overflow: "hidden", animation: "fadeUp 0.25s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14 }}>
          <ProductImage product={product} width={56} height={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
            <div style={{ color: "var(--brand)", fontWeight: 700, marginTop: 2 }}>{formatINR(product.price)}</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "var(--surface2)", width: 32, height: 32, borderRadius: "50%", fontSize: 16, color: "var(--ink2)" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          {!state.link ? (
            <>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink2)" }}>
                Your name (for the payment receipt)
                <input
                  value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma"
                  style={{ display: "block", width: "100%", marginTop: 6, padding: "10px 12px", border: "1px solid var(--line-dark)", borderRadius: 8, fontSize: 14 }}
                />
              </label>
              {state.error && (
                <div style={{ background: "var(--danger-soft)", color: "var(--danger)", fontSize: 13, padding: "10px 12px", borderRadius: 8 }}>{state.error}</div>
              )}
              <button
                onClick={createLink} disabled={state.loading}
                style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 700, opacity: state.loading ? 0.7 : 1 }}
              >
                {state.loading ? "Creating secure link…" : `Pay ${formatINR(product.price)}`}
              </button>
              <div style={{ fontSize: 12, color: "var(--ink3)", textAlign: "center" }}>Secured by Razorpay · test mode</div>
            </>
          ) : (
            <div style={{ background: "var(--green-soft)", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontWeight: 700, color: "var(--green)" }}>Payment link ready</div>
              <div style={{ fontSize: 13, color: "var(--ink2)", margin: "6px 0 12px" }}>{state.link.product} · {formatINR(state.link.amount)}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={state.link.url} target="_blank" rel="noreferrer" style={{ flex: 1, background: "var(--green)", color: "#fff", borderRadius: 8, padding: "10px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Pay now →</a>
                <button onClick={() => navigator.clipboard?.writeText(state.link.url)} style={{ border: "1px solid var(--line-dark)", background: "#fff", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>Copy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop({ onAskAI }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body.error || "Failed to load products");
        setProducts(Array.isArray(body) ? body : body.value || []);
        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      const okCat = category === "All" || p.category === category;
      const okQ = !q || `${p.name} ${p.description}`.toLowerCase().includes(q);
      return okCat && okQ;
    });
    const sorted = [...filtered];
    if (sort === "low") sorted.sort((a, b) => a.price - b.price);
    if (sort === "high") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, query, category, sort]);

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px clamp(16px, 4vw, 48px) 40px" }}>
      {buying && <BuyModal product={buying} onClose={() => setBuying(null)} />}

      {/* Hero */}
      <div style={{ background: "linear-gradient(120deg, #0f2a5c, #1d4ed8 60%, #3b82f6)", borderRadius: 20, padding: "clamp(24px, 4vw, 44px)", color: "#fff", display: "flex", gap: 24, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.8 }}>AI-POWERED APPAREL STORE</div>
          <h1 style={{ margin: "8px 0", fontSize: "clamp(24px, 3.4vw, 38px)", fontWeight: 800, lineHeight: 1.15 }}>Describe it. Snap it.<br />Our AI finds your fit.</h1>
          <p style={{ margin: "0 0 18px", opacity: 0.85, fontSize: 15 }}>Chat with the sales agent, compare picks, and check out with a secure Razorpay link.</p>
          <button onClick={() => onAskAI(null)} style={{ background: "#fff", color: "var(--brand-dark)", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: 14, fontWeight: 700 }}>Chat with the AI →</button>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {[["30+", "products"], ["AI", "search"], ["⚡", "checkout"]].map(([v, l]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.14)", borderRadius: 12, padding: "14px 20px", textAlign: "center", minWidth: 92 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <input
          value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search jackets, sneakers, belts…"
          style={{ flex: 1, minWidth: 220, padding: "11px 14px", border: "1px solid var(--line-dark)", borderRadius: 10, fontSize: 14, background: "#fff" }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: "11px 12px", border: "1px solid var(--line-dark)", borderRadius: 10, fontSize: 14, background: "#fff" }}>
          <option value="featured">Sort: Featured</option>
          <option value="low">Price: Low → High</option>
          <option value="high">Price: High → Low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {categories.map((c) => (
          <button
            key={c} onClick={() => setCategory(c)}
            style={{
              border: `1px solid ${category === c ? "var(--brand)" : "var(--line-dark)"}`,
              background: category === c ? "var(--brand-soft)" : "#fff",
              color: category === c ? "var(--brand-dark)" : "var(--ink2)",
              borderRadius: 20, padding: "7px 16px", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: "var(--ink2)", padding: 20 }}>Loading products…</div>}
      {error && <div style={{ background: "var(--danger-soft)", color: "var(--danger)", padding: 14, borderRadius: 10 }}>[error] {error}</div>}
      {!loading && !error && visible.length === 0 && (
        <div style={{ color: "var(--ink2)", padding: 20 }}>No products match your filters.</div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
        {visible.map((p) => (
          <div key={p._id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", animation: "fadeUp 0.3s ease" }}>
            <ProductImage product={p} width="100%" height={210} style={{ border: "none", borderRadius: 0 }} />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brand)", background: "var(--brand-soft)", padding: "3px 10px", borderRadius: 20 }}>{p.category}</span>
                <span style={{ fontSize: 12, color: p.stock > 0 ? "var(--green)" : "var(--danger)", fontWeight: 600 }}>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink2)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{formatINR(p.price)}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => onAskAI(p)} style={{ flex: 1, border: "1px solid var(--line-dark)", background: "#fff", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Ask AI</button>
                <button onClick={() => setBuying(p)} style={{ flex: 1, border: "none", background: "var(--brand)", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#fff" }}>Buy now</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
