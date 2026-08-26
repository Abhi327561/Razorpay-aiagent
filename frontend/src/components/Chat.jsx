import React, { useState, useRef, useEffect } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatRupees(paise) {
  return `₹${((paise || 0) / 100).toFixed(2)}`;
}

function timestamp() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// Simple Web Audio API sound generator for futuristic micro-interactions
function playAudioTone(type = "send") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "send") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "pay") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio context not allowed without user interaction or not supported
  }
}

function ReceiptLineItem({ product, onQuickAction }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      borderBottom: "1px dashed var(--line)",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      <img
        src={product.imageUrl}
        alt={product.name}
        style={{
          width: 52,
          height: 52,
          objectFit: "cover",
          borderRadius: 8,
          border: "1px solid var(--line-bright)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--phosphor-dim)",
            textTransform: "uppercase",
          }}>
            {product.category || "PRODUCT"}
          </span>
        </div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--paper)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {product.name}
        </div>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          color: "var(--paper-dim)",
          margin: "2px 0 0 0",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {product.description}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--phosphor)",
          flexShrink: 0,
        }}>
          {formatRupees(product.price)}
        </span>

        {/* Quick action buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onQuickAction("buy", product)}
            style={{
              background: "var(--phosphor)",
              border: "none",
              borderRadius: 4,
              color: "#04140a",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            BUY NOW
          </button>
          <button
            onClick={() => onQuickAction("discount", product)}
            style={{
              background: "var(--amber-dim)",
              border: "1px solid rgba(255,180,84,0.3)",
              borderRadius: 4,
              color: "var(--amber)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 600,
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            COUPON
          </button>
        </div>
      </div>
    </div>
  );
}

function ComparisonMatrix({ comparison, onSelectProduct }) {
  if (!comparison || !comparison.productA || !comparison.productB) return null;
  const { productA, productB } = comparison;

  return (
    <div style={{
      marginTop: 12,
      background: "var(--panel-solid)",
      border: "1px solid var(--phosphor-dim)",
      borderRadius: 12,
      padding: 16,
      animation: "fadeSlideUp 0.35s ease",
    }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        color: "var(--phosphor)",
        letterSpacing: "0.08em",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}>
        <span>⚖️ PRODUCT COMPARISON MATRIX</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[productA, productB].map((item, idx) => (
          <div
            key={item._id || idx}
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6 }}
            />
            <div style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--paper)",
            }}>
              {item.name}
            </div>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--phosphor)",
            }}>
              {formatRupees(item.price)}
            </div>
            <p style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              color: "var(--paper-dim)",
              lineHeight: 1.4,
              margin: 0,
            }}>
              {item.description}
            </p>
            <button
              onClick={() => onSelectProduct("buy", item)}
              style={{
                marginTop: "auto",
                background: "var(--phosphor-glow)",
                border: "1px solid var(--phosphor-dim)",
                color: "var(--phosphor)",
                borderRadius: 4,
                padding: "6px 0",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              SELECT THIS →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiscountTicket({ discount, onApply }) {
  if (!discount) return null;
  return (
    <div style={{
      marginTop: 10,
      background: "rgba(255,180,84,0.06)",
      border: "1px dashed var(--amber)",
      borderRadius: 8,
      padding: "10px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      animation: "fadeSlideUp 0.3s ease",
    }}>
      <div>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          color: "var(--amber)",
          letterSpacing: "0.06em",
        }}>
          🎟️ {discount.percent}% DISCOUNT APPLIED ({discount.code})
        </span>
        <p style={{
          fontFamily: "var(--font-sans)",
          fontSize: 11,
          color: "var(--paper-mid)",
          margin: "2px 0 0 0",
        }}>
          Price reduced from <del>{formatRupees(discount.originalPrice)}</del> to <strong>{formatRupees(discount.discountedPrice)}</strong>
        </p>
      </div>

      <button
        onClick={() => onApply(discount)}
        style={{
          background: "var(--amber)",
          color: "#04140a",
          border: "none",
          borderRadius: 4,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          fontWeight: 700,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        BUY WITH DEAL →
      </button>
    </div>
  );
}

function PaymentTicket({ paymentLink, onSimulatePaid }) {
  const [paid, setPaid] = useState(false);

  const handleSimulate = () => {
    setPaid(true);
    playAudioTone("pay");
    if (onSimulatePaid) onSimulatePaid(paymentLink);
  };

  return (
    <div style={{
      marginTop: 12,
      border: `1px solid ${paid ? "var(--phosphor)" : "var(--phosphor-dim)"}`,
      background: paid ? "rgba(93,255,170,0.12)" : "rgba(93,255,170,0.05)",
      borderRadius: 10,
      padding: "16px 18px",
      position: "relative",
      overflow: "hidden",
      animation: "fadeSlideUp 0.3s ease",
      transition: "all 0.3s ease",
    }}>
      {/* Glow strip */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, rgba(93,255,170,0.08) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      <span style={{
        position: "absolute", top: 10, right: -22,
        transform: "rotate(35deg)",
        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
        letterSpacing: "0.14em",
        color: paid ? "#04140a" : "var(--amber)",
        background: paid ? "var(--phosphor)" : "transparent",
        border: paid ? "none" : "1px solid var(--amber)",
        padding: "2px 28px",
      }}>
        {paid ? "PAID ✓" : "READY"}
      </span>

      <p style={{
        fontFamily: "var(--font-mono)", fontSize: 10,
        letterSpacing: "0.08em", color: "var(--paper-dim)", marginBottom: 6,
      }}>
        RAZORPAY PAYMENT LINK · {paymentLink.product}
      </p>

      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginBottom: 12,
      }}>
        <span style={{
          fontFamily: "var(--font-mono)",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--phosphor)",
        }}>
          {formatRupees(paymentLink.amount)}
        </span>
        {paymentLink.originalAmount && paymentLink.originalAmount > paymentLink.amount && (
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--paper-dim)",
            textDecoration: "line-through",
          }}>
            {formatRupees(paymentLink.originalAmount)}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <a
          href={paymentLink.url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
            color: "#04140a", background: "var(--phosphor)",
            padding: "9px 18px", textDecoration: "none",
            borderRadius: 6, letterSpacing: "0.04em",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          {paid ? "VIEW RECEIPT ↗" : "OPEN RAZORPAY LINK →"}
        </a>

        {!paid && (
          <button
            onClick={handleSimulate}
            style={{
              background: "var(--panel-solid)",
              border: "1px solid var(--phosphor-dim)",
              color: "var(--phosphor)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              padding: "9px 14px",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--phosphor-glow)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "var(--panel-solid)";
            }}
          >
            ⚡ SIMULATE PAYMENT PAID
          </button>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, onQuickAction, onSimulatePaid }) {
  const isUser = message.role === "user";
  return (
    <div style={{
      display: "flex",
      flexDirection: isUser ? "row-reverse" : "row",
      gap: 10,
      marginBottom: 20,
      animation: "fadeSlideUp 0.25s ease",
    }}>
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "var(--line-bright)" : "var(--phosphor-glow)",
        border: `1px solid ${isUser ? "var(--line-bright)" : "var(--phosphor-dim)"}`,
        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
        color: isUser ? "var(--paper-mid)" : "var(--phosphor)",
        marginTop: 2,
      }}>
        {isUser ? "U" : "AI"}
      </div>

      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Role + time */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          flexDirection: isUser ? "row-reverse" : "row",
        }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
            letterSpacing: "0.07em",
            color: isUser ? "var(--paper-dim)" : "var(--phosphor)",
          }}>
            {isUser ? "YOU" : "AGENT"}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--paper-dim)",
          }}>
            {message.time}
          </span>
        </div>

        {/* Bubble */}
        <div style={{
          background: isUser ? "var(--panel-hover)" : "rgba(93,255,170,0.04)",
          border: `1px solid ${isUser ? "var(--line)" : "var(--line-bright)"}`,
          borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
          padding: "12px 16px",
        }}>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.6,
            color: "var(--paper)", margin: 0,
          }}>
            {message.text}
          </p>

          {message.image && (
            <img
              src={`data:image/jpeg;base64,${message.image}`}
              alt="uploaded"
              style={{
                marginTop: 10, width: 120, borderRadius: 8,
                border: "1px solid var(--line-bright)",
              }}
            />
          )}
        </div>

        {/* Comparison card if present */}
        {message.comparison && (
          <ComparisonMatrix
            comparison={message.comparison}
            onSelectProduct={onQuickAction}
          />
        )}

        {/* Discount card if present */}
        {message.discount && (
          <DiscountTicket
            discount={message.discount}
            onApply={(disc) => onQuickAction("buy_discounted", disc)}
          />
        )}

        {/* Product items */}
        {message.products?.length > 0 && (
          <div style={{
            background: "var(--panel-solid)",
            border: "1px solid var(--line)",
            borderRadius: 10, padding: "8px 14px",
          }}>
            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.07em",
              color: "var(--paper-dim)", marginBottom: 4,
            }}>
              MATCHING CATALOG RESULTS ({message.products.length})
            </p>
            {message.products.map((p) => (
              <ReceiptLineItem key={p._id} product={p} onQuickAction={onQuickAction} />
            ))}
          </div>
        )}

        {/* Payment ticket */}
        {message.paymentLink && (
          <PaymentTicket paymentLink={message.paymentLink} onSimulatePaid={onSimulatePaid} />
        )}
      </div>
    </div>
  );
}

export default function Chat({ externalPrompt, clearExternalPrompt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const logEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (externalPrompt) {
      setInput(externalPrompt);
      if (clearExternalPrompt) clearExternalPrompt();
    }
  }, [externalPrompt, clearExternalPrompt]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  async function sendMessage(overrideText, overrideImage) {
    const textToSend = overrideText !== undefined ? overrideText : input;
    const imageToSend = overrideImage !== undefined ? overrideImage : image;

    if (!textToSend.trim() && !imageToSend) return;

    const userMsg = { role: "user", text: textToSend || "[image uploaded]", image: imageToSend, time: timestamp() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImage(null);
    setLoading(true);

    if (soundEnabled) playAudioTone("send");

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
        {
          role: "agent",
          text: data.reply,
          products: data.products,
          comparison: data.comparison,
          discount: data.discount,
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
      inputRef.current?.focus();
    }
  }

  const handleQuickAction = (action, product) => {
    if (action === "buy") {
      sendMessage(`I want to buy the "${product.name}". Please generate a payment link.`);
    } else if (action === "discount") {
      sendMessage(`Is there a coupon code or discount available for "${product.name}"?`);
    } else if (action === "buy_discounted") {
      sendMessage(`Generate the payment link for "${product.productName}" using code ${product.code}.`);
    }
  };

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  }

  const suggestions = [
    "Show wireless earbuds under ₹2000",
    "Compare top 2 running shoes",
    "Can I get a discount on wireless earbuds?",
    "I need a gift for my dad",
  ];

  return (
    <div style={{
      flex: 1,
      display: "flex",
      overflow: "hidden",
      height: "100%",
    }}>
      {/* ── Left sidebar: session info ── */}
      <aside style={{
        width: 250,
        flexShrink: 0,
        background: "var(--panel-solid)",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
        gap: 24,
        overflowY: "auto",
      }}>
        {/* Session status */}
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 10,
          }}>SESSION STATUS</p>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(93,255,170,0.06)", border: "1px solid var(--line-bright)",
            borderRadius: 8, padding: "10px 12px",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "var(--phosphor)",
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--phosphor)", fontWeight: 600,
            }}>AGENT ONLINE</span>
          </div>
        </div>

        {/* Audio Toggle */}
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 8,
          }}>AUDIO FEEDBACK</p>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              width: "100%",
              background: soundEnabled ? "var(--phosphor-glow)" : "transparent",
              border: `1px solid ${soundEnabled ? "var(--phosphor-dim)" : "var(--line)"}`,
              color: soundEnabled ? "var(--phosphor)" : "var(--paper-dim)",
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              padding: "7px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <span>🔊 Sound Effects</span>
            <span>{soundEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>

        {/* Stats */}
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 10,
          }}>THIS SESSION</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Messages", value: messages.length },
              { label: "Products surfaced", value: messages.reduce((a, m) => a + (m.products?.length || 0), 0) },
              { label: "Links generated", value: messages.filter(m => m.paymentLink).length },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "var(--font-mono)", fontSize: 11,
                padding: "6px 0", borderBottom: "1px solid var(--line)",
              }}>
                <span style={{ color: "var(--paper-dim)" }}>{s.label}</span>
                <span style={{ color: "var(--phosphor)", fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick prompts */}
        <div>
          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--paper-dim)", marginBottom: 10,
          }}>QUICK PROMPTS</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  color: "var(--paper-mid)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 11,
                  padding: "7px 10px",
                  textAlign: "left",
                  lineHeight: 1.4,
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "var(--phosphor-dim)";
                  e.currentTarget.style.color = "var(--phosphor)";
                  e.currentTarget.style.background = "var(--phosphor-glow)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.color = "var(--paper-mid)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Clear chat */}
        <div style={{ marginTop: "auto" }}>
          <button
            onClick={() => setMessages([])}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 6,
              color: "var(--paper-dim)",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.06em",
              padding: "8px 0",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--danger)";
              e.currentTarget.style.color = "var(--danger)";
              e.currentTarget.style.background = "var(--danger-dim)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--line)";
              e.currentTarget.style.color = "var(--paper-dim)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            CLEAR SESSION
          </button>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--bg2)",
      }}>
        {/* Message log */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px",
        }}>
          {messages.length === 0 && (
            <div style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              opacity: 0.8,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--phosphor-glow)",
                border: "1px solid var(--phosphor-dim)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28,
              }}>
                🛍️
              </div>
              <p style={{
                fontFamily: "var(--font-mono)", fontSize: 13,
                color: "var(--paper-dim)", letterSpacing: "0.06em", textAlign: "center",
              }}>
                AWAITING CUSTOMER INPUT<span style={{ animation: "blink 1s step-start infinite" }}>▍</span>
                <br />
                <span style={{ fontSize: 11, opacity: 0.7 }}>
                  Describe products in text, upload a image photo, or ask for comparisons & discounts.
                </span>
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <MessageBubble
              key={i}
              message={m}
              onQuickAction={handleQuickAction}
            />
          ))}

          {loading && (
            <div style={{
              display: "flex", gap: 10, alignItems: "center",
              animation: "fadeSlideUp 0.25s ease",
              marginBottom: 20,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--phosphor-glow)", border: "1px solid var(--phosphor-dim)",
                fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                color: "var(--phosphor)",
              }}>AI</div>
              <div style={{
                background: "rgba(93,255,170,0.04)",
                border: "1px solid var(--line-bright)",
                borderRadius: "4px 12px 12px 12px",
                padding: "12px 16px",
              }}>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 12,
                  color: "var(--phosphor-dim)",
                }}>
                  reasoning over catalog & tools<span style={{ animation: "blink 0.8s step-start infinite" }}>...</span>
                </span>
              </div>
            </div>
          )}

          <div ref={logEndRef} />
        </div>

        {/* ── Input bar ── */}
        <div style={{
          borderTop: "1px solid var(--line)",
          padding: "14px 24px",
          background: "var(--panel-solid)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          {/* Image preview */}
          {image && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 10px",
              background: "var(--phosphor-glow)",
              border: "1px solid var(--phosphor-dim)",
              borderRadius: 6,
              animation: "fadeSlideUp 0.2s ease",
            }}>
              <img
                src={`data:image/jpeg;base64,${image}`}
                alt="preview"
                style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
              />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--phosphor)", flex: 1,
              }}>Image attached for visual similarity search</span>
              <button
                onClick={() => setImage(null)}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--paper-dim)", fontSize: 16, lineHeight: 1,
                  padding: "0 4px", cursor: "pointer",
                }}
              >×</button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "var(--font-mono)", color: "var(--phosphor)",
              fontSize: 16, userSelect: "none",
            }}>›</span>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isListening ? "Listening..." : "Describe what you're looking for, or ask for a discount..."}
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "var(--paper)",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                padding: "6px 0",
              }}
            />

            {/* Voice Input Button */}
            <button
              onClick={toggleVoiceInput}
              title="Toggle Voice Input"
              style={{
                background: isListening ? "var(--danger-dim)" : "transparent",
                border: `1px solid ${isListening ? "var(--danger)" : "var(--line)"}`,
                color: isListening ? "var(--danger)" : "var(--paper-dim)",
                borderRadius: 6,
                padding: "7px 10px",
                fontSize: 12,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              🎤 {isListening ? "LISTENING" : "VOICE"}
            </button>

            {/* Image upload */}
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: image ? "var(--phosphor)" : "var(--paper-dim)",
              border: `1px solid ${image ? "var(--phosphor-dim)" : "var(--line)"}`,
              background: image ? "var(--phosphor-glow)" : "transparent",
              padding: "7px 12px",
              borderRadius: 6,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}>
              📎 {image ? "IMG ✓" : "IMG"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
            </label>

            {/* Send */}
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              style={{
                background: loading ? "var(--phosphor-dim)" : "var(--phosphor)",
                color: "#04140a",
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "9px 20px",
                borderRadius: 6,
                transition: "all 0.15s",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "…" : "SEND →"}
            </button>
          </div>

          <p style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--paper-dim)", textAlign: "center",
            letterSpacing: "0.04em",
          }}>
            RAZORPAY AI BUILDER · TRACK 1 — AGENTIC COMMERCE DEMO &nbsp;·&nbsp; Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
