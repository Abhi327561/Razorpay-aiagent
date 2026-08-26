# CLIP Embedding Service

Small FastAPI microservice that turns text or images into CLIP embeddings, used by
the Node backend for catalog search (see `backend/services/embeddings.js`).

## Setup

```bash
cd embedding-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

First run downloads the CLIP model weights (~600MB) from Hugging Face — needs
internet access once, then it's cached locally (`~/.cache/huggingface`).

Check it's up: `curl http://localhost:8000/health`

## Why a separate service instead of doing this in Node

Node has no first-class CLIP/PyTorch bindings. Rather than fight that, this keeps
the embedding step in Python (where the bootcamp's CLIP/BLIP-2 pipeline already
lived) and the rest of the stack in the MERN backend, talking over a plain REST
call. Run both `uvicorn` (port 8000) and `npm run dev` (port 5000) side by side.

## Note on scope

Product catalog embeddings are generated from **text** (name + description) at
seed time — not from the product images. This still supports "search by photo":
CLIP's text and image encoders share one embedding space by design, so an
uploaded photo's embedding lands close to the text embeddings of visually similar
products. Embedding the product images too (in addition to text) would sharpen
matches further — noted as a next step, not required for the demo to work.
