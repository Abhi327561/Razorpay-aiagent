# AI Sales Agent for D2C Commerce

**Track 1: AI Growth & Agentic Commerce — Razorpay AI Builder Internship Buildathon**

## Objective

Small D2C sellers can't afford a sales team. Most chatbots today only answer FAQs —
they don't actually sell. This project is a conversational AI agent that understands
what a customer wants (in text or from a photo), searches the merchant's catalog using
multimodal similarity search, recommends and compares products, and — when the
customer is ready — generates a real Razorpay Payment Link to close the sale, with no
human in the loop.

## What it solves

Merchants lose sales to slow or generic chat support. This agent acts as an always-on
sales rep: it understands intent (not just keywords), reasons about which product fits,
and drives the conversation to a completed transaction instead of stopping at "here are
some results."

## Architecture

```
frontend/  React chat UI — text input, image upload, renders product cards + payment link
backend/
  models/     MongoDB schemas (Product)
  routes/     Express routes: /api/products, /api/chat, /api/payment
  services/
    embeddings.js   CLIP-based image+text embedding & similarity search
    agent.js         LLM agent loop with tool-use (search, compare, create_payment_link)
```

**Flow:** customer message → agent.js decides intent → calls embeddings.js to retrieve
matching products (tool: `search_catalog`) → LLM reasons over results → if ready to buy,
calls `create_payment_link` tool → routes/payment.js hits the Razorpay Payment Links API
→ link returned inline in chat.

## Setup

Run in this order — the backend depends on the embedding service being up before
you seed the catalog.

```bash
# 1. embedding service (Python)
cd embedding-service
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. backend (new terminal)
cd backend
cp .env.example .env   # fill in MONGODB_URI, RAZORPAY_KEY_ID/SECRET, LLM_API_KEY
npm install
npm run seed            # embeds + inserts the 30-product catalog — run once
npm run dev

# 3. frontend (new terminal)
cd frontend
npm install
npm start
```

## Status

- [x] MERN scaffold, Razorpay Payment Links integration, dark cyber-terminal UI
- [x] CLIP embedding microservice (`openai/clip-vit-base-patch32` text + image, shared vector space)
- [x] 30-product seed catalog with embeddings
- [x] Real agent tool-use loop on **Groq** (`qwen/qwen3.6-27b` — vision + tool calling in one model). Model sees uploaded photos directly and calls `search_catalog`, `compare_products`, `apply_discount`, and `create_payment_link`
- [x] Text search confirmed working end to end (real catalog matches render as receipt cards with quick action buttons)
- [x] Image search confirmed working end to end (vision + base64 CLIP matching)
- [x] Payment close confirmed working — agent calls `create_payment_link` on confirmation with custom discounts, stamped ticket UI renders real Razorpay link + test payment simulator
- [x] Merchant growth dashboard — conversations, conversion rate, revenue, average order value, conversion funnel visualizer, top categories, and live logs (`GET /api/analytics`)
- [x] `compare_products` tool confirmed working — returns structured side-by-side product matrix cards in chat UI
- [x] `apply_discount` tool confirmed working — offers coupon codes (`WELCOME10`, `FESTIVE15`, `AGENT20`) during negotiations
- [x] Web Speech API voice input + Web Audio micro-feedback sound effects
- [x] Store Catalog & Embeddings visual browser modal
