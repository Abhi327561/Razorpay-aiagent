// Deterministic product art: every catalog imageUrl points at loremflickr,
// which is dead, so cards need pictures that actually match the product.
// This module renders a flat garment illustration as an SVG data URI —
/// garment type comes from the product name/category, color from the
// description. Fully offline, zero broken images, always on-brief.

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

function shade(hex, amt) {
  const n = hex.replace("#", "");
  const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
  const r = clamp((num >> 16) + amt);
  const g = clamp(((num >> 8) & 0xff) + amt);
  const b = clamp((num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const COLOR_WORDS = [
  ["mid-wash blue", "#4a6fa5"],
  ["light blue", "#9fc3e0"],
  ["chambray", "#9fc3e0"],
  ["navy", "#2b3f6b"],
  ["indigo", "#31456b"],
  ["dark wash", "#31456b"],
  ["denim", "#4a6fa5"],
  ["blue", "#4a6fa5"],
  ["olive", "#6f7440"],
  ["beige", "#d8c49c"],
  ["khaki", "#b3a06b"],
  ["tan", "#b98d5e"],
  ["suede", "#b98d5e"],
  ["brown", "#7c4b2a"],
  ["mustard", "#d9a821"],
  ["gold", "#c9a227"],
  ["yellow", "#d9a821"],
  ["black", "#33373d"],
  ["white", "#dfe3e0"],
  ["grey", "#8b9297"],
  ["gray", "#8b9297"],
  ["heather", "#8b9297"],
  ["marl", "#8b9297"],
  ["red", "#b8443a"],
  ["green", "#4f8a5f"],
  ["silver", "#b9c0c7"],
];

export function colorFor(product) {
  const text = `${product?.name || ""} ${product?.description || ""}`.toLowerCase();
  for (const [word, hex] of COLOR_WORDS) {
    if (text.includes(word)) return hex;
  }
  return "#4a6fa5";
}

export function typeFor(product) {
  const text = `${product?.name || ""} ${product?.category || ""}`.toLowerCase();
  const has = (...words) => words.some((w) => text.includes(w));
  if (has("hoodie")) return "hoodie";
  if (has("turtleneck")) return "turtleneck";
  if (has("sweatshirt", "crewneck")) return "sweatshirt";
  if (has("polo")) return "polo";
  if (has("t-shirt", "tshirt", "tee")) return "tee";
  if (has("sh shirt", "oxford", "chambray", "topwear") && has("shirt")) return "shirt";
  if (has("shirt")) return "shirt";
  if (has("bomber")) return "bomber";
  if (has("trench", "coat")) return "trench";
  if (has("biker", "leather jacket")) return "biker";
  if (has("jacket", "outerwear")) return "jacket";
  if (has("jogger")) return "joggers";
  if (has("cargo")) return "cargo";
  if (has("chino", "trouser", "jean", "pant", "bottomwear")) return "pants";
  if (has("high-top", "high top", "retro basketball")) return "hightop";
  if (has("chelsea", "desert", "boot")) return "boot";
  if (has("loafer")) return "loafer";
  if (has("sneaker", "running", "footwear")) return "sneaker";
  if (has("belt")) return "belt";
  if (has("backpack")) return "backpack";
  if (has("beanie")) return "beanie";
  if (has("sunglass", "aviator")) return "sunglasses";
  if (has("tie")) return "tie";
  if (has("wallet")) return "wallet";
  return "tee";
}

// Each renderer draws its garment in a 400x400 viewBox using:
//   c    main fabric color, d = darker edge, l = lighter highlight
const R = {
  jacket: (c, d, l) => `
    <path d="M140 90 L110 110 L95 250 L125 255 L135 170 L135 320 L265 320 L265 170 L275 255 L305 250 L290 110 L260 90 L230 105 L230 130 L170 130 L170 105 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M170 105 L170 320 M230 105 L230 320" stroke="${d}" stroke-width="4"/>
    <path d="M150 110 L150 300 M250 110 L250 300" stroke="${l}" stroke-width="3" opacity="0.5"/>
    <circle cx="185" cy="180" r="4" fill="${d}"/><circle cx="215" cy="180" r="4" fill="${d}"/>
    <circle cx="185" cy="230" r="4" fill="${d}"/><circle cx="215" cy="230" r="4" fill="${d}"/>`,
  bomber: (c, d, l) => `
    <path d="M140 95 L105 120 L95 240 L125 245 L135 175 L135 300 L265 300 L265 175 L275 245 L305 240 L295 120 L260 95 L235 110 L235 135 L165 135 L165 110 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M135 300 L265 300 L265 315 L135 315 Z" fill="${d}" opacity="0.7"/>
    <path d="M200 135 L200 300" stroke="${d}" stroke-width="5"/>
    <path d="M155 120 L155 280" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  trench: (c, d, l) => `
    <path d="M150 70 L120 95 L110 330 L290 330 L280 95 L250 70 L225 85 L225 110 L175 110 L175 85 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M200 110 L200 330" stroke="${d}" stroke-width="4"/>
    <path d="M140 220 L260 220 L260 238 L140 238 Z" fill="${d}" opacity="0.65"/>
    <rect x="188" y="216" width="24" height="26" rx="3" fill="none" stroke="${l}" stroke-width="4"/>
    <path d="M160 90 L160 320" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  biker: (c, d, l) => `
    <path d="M140 90 L110 110 L95 250 L125 255 L135 170 L135 320 L265 320 L265 170 L275 255 L305 250 L290 110 L260 90 L232 108 L225 140 L175 140 L168 108 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M175 140 L225 220 L215 320" stroke="${l}" stroke-width="5" fill="none"/>
    <circle cx="240" cy="170" r="4" fill="${l}"/><circle cx="240" cy="200" r="4" fill="${l}"/>
    <path d="M110 200 L130 205 M270 200 L290 195" stroke="${l}" stroke-width="4"/>`,
  hoodie: (c, d, l) => `
    <path d="M155 70 C155 45 245 45 245 70 L260 95 L265 120 L240 130 L235 175 L235 320 L165 320 L165 175 L160 130 L135 120 L140 95 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <ellipse cx="200" cy="95" rx="32" ry="24" fill="${d}" opacity="0.55"/>
    <path d="M170 240 L230 240 L222 300 L178 300 Z" fill="none" stroke="${d}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M185 130 L180 170 M215 130 L220 170" stroke="${l}" stroke-width="4" stroke-linecap="round"/>
    <path d="M160 120 L160 300" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  sweatshirt: (c, d, l) => `
    <path d="M145 95 L112 115 L100 245 L130 250 L140 175 L140 310 L260 310 L260 175 L270 250 L300 245 L288 115 L255 95 L228 108 L228 130 L172 130 L172 108 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M140 310 L260 310 L260 322 L140 322 Z M100 235 L130 240 L128 252 L98 247 Z M270 240 L300 235 L302 247 L272 252 Z" fill="${d}" opacity="0.7"/>
    <path d="M172 108 L228 108" stroke="${d}" stroke-width="5"/>
    <path d="M155 125 L155 295" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  turtleneck: (c, d, l) => `
    <path d="M175 55 L225 55 L228 95 L255 110 L270 250 L240 255 L232 180 L232 320 L168 320 L168 180 L160 255 L130 250 L145 110 L172 95 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M175 55 L225 55 L225 95 L175 95 Z" fill="${d}" opacity="0.5"/>
    <path d="M175 75 L225 75 M168 200 L232 200 M168 230 L232 230 M168 260 L232 260" stroke="${d}" stroke-width="3" opacity="0.6"/>`,
  shirt: (c, d, l) => `
    <path d="M150 85 L115 105 L100 240 L130 245 L140 170 L140 320 L260 320 L260 170 L270 245 L300 240 L285 105 L250 85 L228 100 L228 125 L172 125 L172 100 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M172 100 L200 125 L228 100" fill="none" stroke="${d}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M200 125 L200 320" stroke="${d}" stroke-width="4"/>
    <circle cx="200" cy="160" r="4" fill="${d}"/><circle cx="200" cy="200" r="4" fill="${d}"/><circle cx="200" cy="240" r="4" fill="${d}"/><circle cx="200" cy="280" r="4" fill="${d}"/>
    <path d="M155 110 L155 300" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  polo: (c, d, l) => `
    <path d="M150 90 L115 110 L105 235 L133 240 L142 175 L142 315 L258 315 L258 175 L267 240 L295 235 L285 110 L250 90 L228 102 L228 130 L172 130 L172 102 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M172 102 L200 128 L228 102" fill="none" stroke="${d}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M192 120 L192 160 M208 120 L208 160" stroke="${d}" stroke-width="4"/>
    <circle cx="200" cy="145" r="3.5" fill="${d}"/>
    <path d="M105 225 L133 230 M267 230 L295 225" stroke="${d}" stroke-width="4" opacity="0.7"/>`,
  tee: (c, d, l) => `
    <path d="M150 90 L105 115 L125 165 L145 155 L145 315 L255 315 L255 155 L275 165 L295 115 L250 90 L228 102 L228 120 L172 120 L172 102 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M172 102 C180 118 220 118 228 102" fill="none" stroke="${d}" stroke-width="5"/>
    <rect x="175" y="180" width="50" height="40" rx="4" fill="${d}" opacity="0.45"/>
    <path d="M160 130 L160 300" stroke="${l}" stroke-width="3" opacity="0.5"/>`,
  pants: (c, d, l) => `
    <path d="M150 80 L250 80 L258 150 L245 330 L205 330 L200 180 L195 330 L155 330 L142 150 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M150 80 L250 80 L250 100 L150 100 Z" fill="${d}" opacity="0.55"/>
    <path d="M200 100 L200 180" stroke="${d}" stroke-width="4"/>
    <path d="M160 110 L158 300" stroke="${l}" stroke-width="3" opacity="0.5"/>
    <circle cx="200" cy="90" r="4" fill="${d}"/>`,
  cargo: (c, d, l) => `
    <path d="M150 80 L250 80 L258 150 L245 330 L205 330 L200 180 L195 330 L155 330 L142 150 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M150 80 L250 80 L250 100 L150 100 Z" fill="${d}" opacity="0.55"/>
    <rect x="148" y="190" width="34" height="44" rx="4" fill="none" stroke="${d}" stroke-width="4"/>
    <rect x="218" y="190" width="34" height="44" rx="4" fill="none" stroke="${d}" stroke-width="4"/>
    <path d="M200 100 L200 180" stroke="${d}" stroke-width="4"/>`,
  joggers: (c, d, l) => `
    <path d="M150 80 L250 80 L256 160 L240 300 L242 320 L208 320 L206 300 L200 190 L194 300 L192 320 L158 320 L160 300 L144 160 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M150 80 L250 80 L250 98 L150 98 Z" fill="${d}" opacity="0.55"/>
    <path d="M158 305 L192 305 L192 320 L158 320 Z M208 305 L242 305 L242 320 L208 320 Z" fill="${d}" opacity="0.7"/>
    <path d="M200 98 L200 190" stroke="${d}" stroke-width="4"/>`,
  sneaker: (c, d, l) => `
    <path d="M90 250 C90 200 120 190 150 195 L190 150 C200 140 215 145 220 160 L245 230 L300 240 C315 243 315 265 300 268 L110 275 C95 275 90 265 90 250 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M90 250 L300 250 L298 268 L110 275 Z" fill="#e8e8e8" opacity="0.9"/>
    <path d="M90 250 L300 250" stroke="${d}" stroke-width="4"/>
    <path d="M190 165 L215 195 M180 180 L205 210" stroke="${d}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="255" cy="215" r="5" fill="${l}"/>`,
  hightop: (c, d, l) => `
    <path d="M120 120 L185 120 L195 160 L230 225 L300 238 C315 241 315 265 300 268 L130 275 C110 275 105 260 110 245 L120 120 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M110 245 L300 250 L298 268 L130 275 Z" fill="#e8e8e8" opacity="0.9"/>
    <path d="M150 135 L175 200 M165 135 L190 200 M180 135 L205 200" stroke="${d}" stroke-width="4" stroke-linecap="round"/>
    <path d="M120 120 L185 120" stroke="${d}" stroke-width="5"/>`,
  boot: (c, d, l) => `
    <path d="M140 90 L210 90 L215 200 L280 225 C295 232 293 255 278 258 L150 265 C132 265 128 250 132 235 L140 90 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M132 235 L280 240 L278 258 L150 265 Z" fill="${d}" opacity="0.6"/>
    <path d="M155 100 L155 220" stroke="${l}" stroke-width="4" opacity="0.6"/>
    <path d="M140 90 L210 90" stroke="${d}" stroke-width="5"/>`,
  loafer: (c, d, l) => `
    <path d="M95 240 C110 210 150 200 190 205 L250 215 C290 220 310 235 305 255 C300 270 280 272 250 270 L120 268 C100 267 90 255 95 240 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M170 205 C180 225 230 228 245 214" fill="none" stroke="${d}" stroke-width="5"/>
    <rect x="188" y="212" width="26" height="12" rx="6" fill="${l}" opacity="0.8"/>`,
  belt: (c, d, l) => `
    <path d="M60 190 L280 190 L280 220 L60 220 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="270" y="178" width="60" height="54" rx="8" fill="none" stroke="${l}" stroke-width="7"/>
    <path d="M300 190 L300 220" stroke="${l}" stroke-width="5"/>
    <circle cx="120" cy="205" r="4" fill="${d}"/><circle cx="160" cy="205" r="4" fill="${d}"/><circle cx="200" cy="205" r="4" fill="${d}"/><circle cx="240" cy="205" r="4" fill="${d}"/>`,
  backpack: (c, d, l) => `
    <rect x="130" y="110" width="140" height="200" rx="60" fill="${c}" stroke="${d}" stroke-width="6"/>
    <path d="M175 110 C175 85 225 85 225 110" fill="none" stroke="${d}" stroke-width="8" stroke-linecap="round"/>
    <rect x="160" y="210" width="80" height="70" rx="14" fill="none" stroke="${d}" stroke-width="5"/>
    <path d="M130 160 L110 250 M270 160 L290 250" stroke="${d}" stroke-width="10" stroke-linecap="round"/>
    <path d="M160 130 L160 280" stroke="${l}" stroke-width="4" opacity="0.5"/>`,
  beanie: (c, d, l) => `
    <path d="M120 220 C120 140 280 140 280 220 L280 230 L120 230 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="110" y="220" width="180" height="55" rx="14" fill="${d}" opacity="0.75"/>
    <path d="M150 220 L150 275 M185 220 L185 275 M220 220 L220 275 M255 220 L255 275" stroke="${l}" stroke-width="3" opacity="0.6"/>
    <circle cx="200" cy="130" r="22" fill="${c}" stroke="${d}" stroke-width="6"/>
    <path d="M150 170 C160 155 180 150 200 150" stroke="${l}" stroke-width="4" fill="none" opacity="0.7"/>`,
  sunglasses: (c, d, l) => `
    <path d="M110 170 L175 170 L165 250 C160 275 120 275 115 250 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M225 170 L290 170 L285 250 C280 275 240 275 235 250 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M175 185 L225 185" stroke="${d}" stroke-width="8" stroke-linecap="round"/>
    <path d="M110 170 L90 160 M290 170 L310 160" stroke="${d}" stroke-width="8" stroke-linecap="round"/>
    <path d="M125 185 L150 185 L145 230 L122 230 Z M250 185 L275 185 L278 230 L255 230 Z" fill="#ffffff" opacity="0.25"/>`,
  tie: (c, d, l) => `
    <path d="M180 70 L220 70 L228 110 L200 130 L172 110 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M172 110 L200 130 L228 110 L240 260 L200 330 L160 260 Z" fill="${c}" stroke="${d}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M186 140 L214 140 L222 250 L200 290 L178 250 Z" fill="${l}" opacity="0.35"/>`,
  wallet: (c, d, l) => `
    <rect x="95" y="140" width="210" height="130" rx="16" fill="${c}" stroke="${d}" stroke-width="6"/>
    <path d="M95 180 L305 180" stroke="${d}" stroke-width="4" opacity="0.7"/>
    <rect x="230" y="205" width="55" height="40" rx="8" fill="none" stroke="${d}" stroke-width="4"/>
    <circle cx="272" cy="225" r="4" fill="${l}"/>
    <path d="M110 155 L200 155" stroke="${l}" stroke-width="4" opacity="0.6" stroke-linecap="round"/>`,
};

export function artFor(product) {
  const color = colorFor(product);
  const type = typeFor(product);
  const d = shade(color, -55);
  const l = shade(color, 45);
  const draw = (R[type] || R.tee)(color, d, l);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">` +
    `<defs><radialGradient id="bg" cx="50%" cy="38%" r="75%">` +
    `<stop offset="0%" stop-color="${shade(color, -85)}"/>` +
    `<stop offset="100%" stop-color="#0b0f0d"/></radialGradient></defs>` +
    `<rect width="400" height="400" fill="url(#bg)"/>` +
    `<circle cx="200" cy="180" r="120" fill="${color}" opacity="0.14"/>` +
    `<ellipse cx="200" cy="335" rx="95" ry="14" fill="#000" opacity="0.45"/>` +
    draw +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
