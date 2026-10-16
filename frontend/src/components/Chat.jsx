import React, { useState, useRef, useEffect } from "react";
import ProductImage from "./ProductImage";
import { formatINR } from "./Shop";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

function timestamp() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function ProductCard({ product, onBuy }) {
  return (
    <div style={{ display: "flex", gap: 12, background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 8, alignItems: "center" }}>
      <ProductImage product={product} width={64} height={64} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{product.name}</div>
        <div style={{ fontSize: 12, color: "var(--ink2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.description}</div>
        <div style={{ fontWeight: 800, fontSize: 15, marginTop: 2 }}>{formatINR(product.price)}</div>
      </div>
      {onBuy && (
        <button onClick={() => onBuy(product)} style={{ border: "none", background: "var(--brand)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>Buy</button>
      )}
    </div>
  );
}

function Message({ message, onBuy }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 14, animation: "fadeUp 0.25s ease" }}>
      <div style={{ maxWidth: "78%", minWidth: 0 }}>
        <div
          style={{
            background: isUser ? "var(--brand)" : "#fff",
            color: isUser ? "#fff" : "var(--ink)",
            border: isUser ? "none" : "1px solid var(--line)",
            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            padding: "11px 15px", fontSize: 14, lineHeight: 1.55,
            boxShadow: isUser ? "none" : "var(--shadow)",
            whiteSpace: "pre-wrap",
          }}
        >
          {message.text}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4, textAlign: isUser ? "right" : "left" }}>
          {isUser ? "You" : "AI Assistant"} · {message.time}
        </div>
        {message.image && (
          <img src={`data:image/jpeg;base64,${message.image}`} alt="uploaded" style={{ marginTop: 8, width: 180, maxWidth: "100%", borderRadius: 12, border: "1px solid var(--line)" }} />
        )}
        {message.products?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {message.products.map((p) => (
              <ProductCard key={p._id} product={p} onBuy={onBuy} />
            ))}
          </div>
        )}
        {message.paymentLink && (
          <div style={{ marginTop: 10, background: "var(--green-soft)", border: "1px solid #a9dfc2", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", letterSpacing: "0.04em" }}>READY TO CHECK OUT · {message.paymentLink.product}</div>
            <div style={{ fontWeight: 800, fontSize: 17, margin: "4px 0 10px" }}>{formatINR(message.paymentLink.amount)}</div>
            <a href={message.paymentLink.url} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "var(--green)", color: "#fff", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Pay now →</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat({ initialProduct, onBuy }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (initialProduct) {
      setInput(`Can you tell me more about ${initialProduct.name}?`);
    }
  }, [initialProduct]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() && !image) return;
    const userMsg = { role: "user", text: input || "[image]", image, time: timestamp() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          imageBase64: userMsg.image,
          conversationHistory: messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);

      setMessages((prev) => [
        ...prev,
        { role: "agent", text: data.reply, products: data.products, paymentLink: data.paymentLink, time: timestamp() },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "agent", text: `Sorry, something went wrong: ${err.message}`, time: timestamp() }]);
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  const suggestions = ["Show me denim jackets", "Running shoes under ₹3500", "Gift ideas under ₹1000"];

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--line)", borderTop: "none" }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px clamp(16px, 6vw, 80px)", background: "#fbfcfe" }}>
        {messages.length === 0 && (
          <div style={{ maxWidth: 640, margin: "8vh auto 0", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--brand-soft)", color: "var(--brand)", fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>AI</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>Hi, I'm your shopping assistant</h2>
            <p style={{ color: "var(--ink2)", fontSize: 14, margin: "0 0 18px" }}>Describe what you need — or attach a photo — and I'll find it in our catalog.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  style={{ border: "1px solid var(--line-dark)", background: "#fff", borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ maxWidth: 860, margin: "0 auto" }}>
            <Message message={m} onBuy={onBuy} />
          </div>
        ))}
        {loading && (
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 6, padding: "8px 2px" }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brand)", animation: "dots 1.2s infinite", animationDelay: `${d * 0.2}s` }} />
            ))}
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      <div style={{ borderTop: "1px solid var(--line)", padding: "12px clamp(16px, 6vw, 80px)", background: "#fff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {image && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--brand-soft)", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "var(--brand-dark)", marginBottom: 8 }}>
              ✓ Photo attached
              <button onClick={() => setImage(null)} style={{ border: "none", background: "transparent", color: "inherit", fontSize: 14 }}>×</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ border: "1px solid var(--line-dark)", borderRadius: 10, padding: "11px 14px", fontSize: 14, cursor: "pointer", color: "var(--ink2)", fontWeight: 600, whiteSpace: "nowrap" }}>
              + Photo
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
            </label>
            <input
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask for anything… e.g. blue denim jacket"
              style={{ flex: 1, border: "1px solid var(--line-dark)", borderRadius: 10, padding: "12px 14px", fontSize: 14 }}
            />
            <button onClick={sendMessage} disabled={loading} style={{ background: "var(--brand)", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, opacity: loading ? 0.7 : 1 }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
