import React, { useState, useEffect } from "react";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

function formatRupees(paise) {
  return `₹${((paise || 0) / 100).toFixed(2)}`;
}

export default function CatalogModal({ isOpen, onClose, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`${API_URL}/api/products`)
        .then((res) => res.json())
        .then((data) => {
          setProducts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load catalog:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ["ALL", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(4, 10, 7, 0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeSlideUp 0.25s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          maxHeight: "85vh",
          background: "var(--panel-solid)",
          border: "1px solid var(--line-bright)",
          borderRadius: 16,
          boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 32px rgba(93,255,170,0.08)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(16, 22, 18, 0.9)",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 16,
                fontWeight: 700,
                color: "var(--phosphor)",
                letterSpacing: "0.06em",
              }}
            >
              📦 STORE CATALOG & EMBEDDINGS
            </h2>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--paper-dim)",
                marginTop: 2,
              }}
            >
              {products.length} products stored with 512-dim CLIP vectors
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => {
                setLoading(true);
                fetch(`${API_URL}/api/products/seed`, { method: "POST" })
                  .then((res) => res.json())
                  .then((d) => {
                    alert(d.message || "Seeding complete!");
                    return fetch(`${API_URL}/api/products`);
                  })
                  .then((res) => res.json())
                  .then((data) => {
                    setProducts(Array.isArray(data) ? data : []);
                    setLoading(false);
                  })
                  .catch((err) => {
                    alert("Seeding error: " + err.message);
                    setLoading(false);
                  });
              }}
              style={{
                background: "var(--phosphor-glow)",
                border: "1px solid var(--phosphor-dim)",
                color: "var(--phosphor)",
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              🌱 Seed / Re-index Catalog
            </button>

            <button
              onClick={onClose}
              style={{
                background: "var(--line)",
                border: "none",
                color: "var(--paper-mid)",
                fontSize: 18,
                width: 32,
                height: 32,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            padding: "14px 24px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            background: "var(--bg2)",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by name or details..."
            style={{
              flex: 1,
              minWidth: 200,
              background: "var(--panel-solid)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "8px 14px",
              color: "var(--paper)",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
            }}
          />

          {/* Category Chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? "var(--phosphor-glow)" : "transparent",
                  border: `1px solid ${selectedCategory === cat ? "var(--phosphor)" : "var(--line)"}`,
                  color: selectedCategory === cat ? "var(--phosphor)" : "var(--paper-dim)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  padding: "5px 12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog grid */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {loading ? (
            <p style={{ color: "var(--paper-dim)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              loading catalog items...
            </p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--paper-dim)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
              No products found matching your search filters.
            </p>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--phosphor-dim)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: 140,
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                  }}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--phosphor-dim)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {item.category}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--phosphor)",
                      }}
                    >
                      {formatRupees(item.price)}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--paper)",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.name}
                  </h3>

                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      color: "var(--paper-dim)",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectProduct(item);
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    background: "var(--phosphor-glow)",
                    border: "1px solid var(--phosphor-dim)",
                    color: "var(--phosphor)",
                    borderRadius: 6,
                    padding: "7px 0",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--phosphor)";
                    e.currentTarget.style.color = "#04140a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--phosphor-glow)";
                    e.currentTarget.style.color = "var(--phosphor)";
                  }}
                >
                  💬 Ask Agent About This
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
