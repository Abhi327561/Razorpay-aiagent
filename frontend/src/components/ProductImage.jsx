import React, { useState } from "react";
import { artFor } from "./productArt";

// Catalog image URLs (loremflickr) are unreliable — often 404 or block
// hotlinking. Chain: catalog URL first (so real merchant photos win), then
// a locally-rendered garment illustration matching the product's type and
// color (always matches the description), then a letter placeholder.
export default function ProductImage({ product, width, height, style }) {
  const [stage, setStage] = useState(0);

  const label = product?.name || "Product";
  const initial = (label.trim()[0] || "?").toUpperCase();

  if (stage >= 2) {
    return (
      <div
        title={label}
        style={{
          width,
          height,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-sans)",
          fontSize: typeof width === "number" ? Math.min(width, height) * 0.4 : 24,
          fontWeight: 700,
          color: "var(--brand)",
          background: "var(--brand-soft)",
          border: "1px solid var(--line)",
          borderRadius: 8,
          ...style,
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={stage === 0 ? product?.imageUrl : artFor(product)}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
      style={{
        width,
        height,
        objectFit: "cover",
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--surface2)",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
