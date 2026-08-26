# Deployment Guide: AI Sales Agent for D2C Commerce

This guide covers deploying the three microservices for production:
1. **Embedding Microservice (Python FastAPI + CLIP)**
2. **Backend API (Node.js Express + Groq + MongoDB)**
3. **Frontend UI (React Chat & Growth Dashboard)**

---

## Architecture Overview

```
[ Frontend (Render / Vercel) ]
        │
        ▼
[ Backend API (Render) ] ──► [ MongoDB Atlas Database ]
        │
        ├──► [ Groq LLM API ]
        │
        └──► [ CLIP Embedding Service (Hugging Face / Render) ]
```

---

## Step 1: MongoDB Atlas Setup

If you haven't set up a cloud database yet:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Database Access**, create a database user and password.
3. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere for cloud deployment).
4. Copy your connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/razorpay-agent?retryWrites=true&w=majority`

---

## Step 2: Deploy Python CLIP Embedding Service

You can deploy the embedding microservice to **Hugging Face Spaces** (Free Docker host with CPU) or **Render**.

### Option A: Hugging Face Spaces (Recommended for zero-cost CPU)
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space (e.g. `clip-embedding-service`) and select **Docker** as the SDK.
3. From `embedding-service/`:
   ```bash
   cp HF_SPACE_README.md README.md
   git init
   git remote add space https://huggingface.co/spaces/<your-username>/clip-embedding-service
   git add .
   git commit -m "Deploy CLIP embedding microservice"
   git push space main
   ```
4. Once built, your live embedding endpoint will be:
   `https://<your-username>-clip-embedding-service.hf.space`
5. Test it: `curl https://<your-url>/health` (should return `{"status":"ok",...}`).

### Option B: Render Web Service
1. On [Render](https://dashboard.render.com), click **New +** → **Web Service**.
2. Set Root Directory to `embedding-service`.
3. Set Environment to `Python 3`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Step 3: Deploy Backend Node API (Render)

1. On [Render](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect your GitHub repository and set Root Directory to `backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add the following **Environment Variables** in Render Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `LLM_API_KEY`: Your Groq API key (`gsk_...`)
   - `EMBEDDING_SERVICE_URL`: The URL from Step 2
6. Click **Deploy**. Your backend live URL will be:
   `https://razorpay-agent-backend.onrender.com`

---

## Step 4: Deploy Frontend React UI (Render / Vercel)

### Option A: Render Static Site
1. On Render, click **New +** → **Static Site**.
2. Set Root Directory to `frontend`.
3. Build Command: `npm install && npm run build`
4. Publish Directory: `build`
5. Add Environment Variable:
   - `REACT_APP_API_URL`: `https://razorpay-agent-backend.onrender.com` (Your backend URL from Step 3)

### Option B: Vercel
1. Go to [Vercel](https://vercel.com) → **New Project**.
2. Import your GitHub repository and set Root Directory to `frontend`.
3. Under Environment Variables, add `REACT_APP_API_URL` pointing to your Render backend URL.
4. Click **Deploy**.

---

## Step 5: Seed the Production Catalog

Once all services are live:
1. Run the seed script locally or on production pointing to your live production URLs:
   ```bash
   cd backend
   # Set MONGODB_URI and EMBEDDING_SERVICE_URL to production endpoints in .env
   npm run seed
   ```
2. Or open your live frontend site, click **`📦 Catalog Browser`**, and click **`🌱 Seed / Re-index Catalog`**.

---

## Step 6: Final Verification Checklist

- [x] Text search query returns matching product cards.
- [x] Image query handles base64 photos and surfaces visually similar items.
- [x] Agent generates a valid test Razorpay Payment Link when confirmation is given.
- [x] Growth Dashboard updates conversation counts, conversion rates, and revenue telemetry in real-time.
