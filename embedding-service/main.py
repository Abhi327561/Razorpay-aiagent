"""
CLIP embedding microservice.

Exposes two endpoints that the Node backend calls (see backend/services/embeddings.js):
  POST /embed/text   { "text": "..." }              -> { "embedding": [...] }
  POST /embed/image  { "image": "<base64>" }         -> { "embedding": [...] }

Both return CLIP embeddings in the SAME vector space, so a text query embedding
and an image embedding can be compared directly with cosine similarity — that's
what makes "search by photo" and "search by description" hit the same catalog.

Model: openai/clip-vit-base-patch32.
Optimized for low-memory container environments (e.g. Render Free Tier 512MB RAM).

Run:
    pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import base64
import gc
import io

import torch
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPModel, CLIPProcessor

# Restrict PyTorch internal threads to prevent high stack allocation on 1-CPU shared containers
torch.set_num_threads(1)

app = FastAPI(title="CLIP Embedding Service")

MODEL_NAME = "openai/clip-vit-base-patch32"

_model = None
_processor = None


def get_model_and_processor():
    """Lazy load model & processor on first request to ensure fast startup & prevent boot OOM."""
    global _model, _processor
    if _model is None or _processor is None:
        print(f"Loading {MODEL_NAME} into memory...")
        _model = CLIPModel.from_pretrained(MODEL_NAME)
        _processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        _model.eval()
        gc.collect()
        print("Model loaded successfully.")
    return _model, _processor


class TextRequest(BaseModel):
    text: str


class ImageRequest(BaseModel):
    image: str  # base64-encoded image, no data: prefix


def _extract_features(output):
    """
    get_text_features / get_image_features should return a plain tensor, but
    depending on the exact transformers version installed, some releases return
    a ModelOutput wrapper instead. Handle both so this doesn't break on whatever
    version pip resolves.
    """
    if torch.is_tensor(output):
        return output
    if hasattr(output, "text_embeds"):
        return output.text_embeds
    if hasattr(output, "image_embeds"):
        return output.image_embeds
    if hasattr(output, "pooler_output"):
        return output.pooler_output
    raise TypeError(f"Unexpected output type from CLIP model: {type(output)}")


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME, "loaded": _model is not None}


@app.post("/embed/text")
def embed_text(req: TextRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(400, "text must not be empty")

    model, processor = get_model_and_processor()
    inputs = processor(text=[req.text], return_tensors="pt", padding=True, truncation=True)
    with torch.inference_mode():
        raw = model.get_text_features(**inputs)
    features = _extract_features(raw)
    # Normalize so cosine similarity in the backend is a straight dot product
    features = features / features.norm(dim=-1, keepdim=True)
    return {"embedding": features[0].tolist()}


@app.post("/embed/image")
def embed_image(req: ImageRequest):
    try:
        image_bytes = base64.b64decode(req.image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"could not decode image: {e}")

    model, processor = get_model_and_processor()
    inputs = processor(images=[image], return_tensors="pt")
    with torch.inference_mode():
        raw = model.get_image_features(**inputs)
    features = _extract_features(raw)
    features = features / features.norm(dim=-1, keepdim=True)
    return {"embedding": features[0].tolist()}

