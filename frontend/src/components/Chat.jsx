import React, { useState, useRef, useEffect } from "react";

let rawApiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
if (rawApiUrl && !rawApiUrl.startsWith("http://") && !rawApiUrl.startsWith("https://")) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;

function formatRupees(paise) {
  return `Rs.${(paise / 100).toFixed(2)}`;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// A single catalog match rendered like a line item on a receipt — name on the
// left, a dotted leader filling the middle, price on the right. This is the
// signature visual idea: commerce results should look like the thing they are.
function ReceiptLineItem({ product }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "10px 0",
        borderBottom: "1px dashed var(--line)",
      }}
    >
      <img
        src={product.imageUrl}
        alt={product.name}
        style={{
          width: 40,
          height: 40,
          objectFit: "cover",
          border: "1px solid var(--line)",
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, whiteSpace: "nowrap" }}>
        {product.name}
      </span>
      <span
        style={{
          flex: 1,
          borderBottom: "1px dotted var(--paper-dim)",
          marginBottom: 5,
          minWidth: 16,
        }}
      />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--phosphor)" }}>
        {formatRupees(product.price)}
      </span>
    </div>
  );
}

// The moment the agent closes: a stamped payment ticket rather than a plain link.
function PaymentTicket({ paymentLink }) {
  return (
    <div
      style={{
        marginTop: 10,
        border: "1px solid var(--phosphor-dim)",
        background: "rgba(107,255,160,0.05)",
        padding: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 8,
          right: -28,
          transform: "rotate(35deg)",
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          color: "var(--amber)",
          border: "1px solid var(--amber)",
          padding: "2px 30px",
        }}
      >
        READY
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--paper-dim)",
        }}
      >
        PAYMENT LINK · {paymentLink.product}
      </p>
      <a
        href={paymentLink.url}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          fontWeight: 600,
          color: "#04140a",
          background: "var(--phosphor)",
          padding: "8px 16px",
          textDecoration: "none",
          letterSpacing: "0.04em",
        }}
      >
        PAY NOW →
      </a>
    </div>
  );
}

function LogLine({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: isUser ? "var(--paper-dim)" : "var(--phosphor)",
            flexShrink: 0,
          }}
        >
          {isUser ? "YOU  >" : "AGENT>"}
        </span>
        <span style={{ fontSize: 14, lineHeight: 1.5 }}>{message.text}</span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--paper-dim)",
            flexShrink: 0,
          }}
        >
          {message.time}
        </span>
      </div>

      {message.image && (
        <img
          src={`data:image/jpeg;base64,${message.image}`}
          alt="uploaded"
          style={{ marginTop: 8, marginLeft: 56, width: 72, border: "1px solid var(--line)" }}
        />
      )}

      {message.products?.length > 0 && (
        <div style={{ marginLeft: 56, marginTop: 6 }}>
          {message.products.map((p) => (
            <ReceiptLineItem key={p._id} product={p} />
          ))}
        </div>
      )}

      {message.paymentLink && (
        <div style={{ marginLeft: 56 }}>
          <PaymentTicket paymentLink={message.paymentLink} />
        </div>
      )}
    </div>
  );
}

export default function Chat({ initialProduct }) {
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

      if (!res.ok) {
        // Server returns { error: "..." } on failure — surface it instead of
        // silently rendering a blank reply (data.reply won't exist here).
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: data.reply,
          products: data.products,
          paymentLink: data.paymentLink,
          time: timestamp(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "agent", text: `[error] ${err.message}`, time: timestamp() },
      ]);
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

  return (
    <div
      style={{
        background: "var(--panel-solid)",
        border: "1px solid var(--line)",
      }}
    >
      {/* Log */}
      <div
        style={{
          height: 420,
          overflowY: "auto",
          padding: "20px 16px",
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--paper-dim)",
            }}
          >
            &gt; awaiting input — describe what you're looking for, or attach a photo
            <span style={{ animation: "blink 1s step-start infinite" }}>▍</span>
          </p>
        )}
        {messages.map((m, i) => (
          <LogLine key={i} message={m} />
        ))}
        {loading && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--phosphor-dim)" }}>
            AGENT&gt; thinking<span style={{ animation: "blink 1s step-start infinite" }}>...</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderTop: "1px solid var(--line)",
          padding: "10px 12px",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--phosphor)", fontSize: 14 }}>
          &gt;
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={image ? "image attached — add a note or send" : "type a request…"}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "var(--paper)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            padding: "6px 0",
          }}
        />
        <label
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: image ? "var(--phosphor)" : "var(--paper-dim)",
            border: "1px solid var(--line)",
            padding: "6px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {image ? "✓ IMG" : "+ IMG"}
          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
        </label>
        <button
          onClick={sendMessage}
          style={{
            background: "var(--phosphor)",
            color: "#04140a",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            padding: "8px 14px",
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
