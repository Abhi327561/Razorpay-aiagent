"""
CLIP embedding microservice (ONNX edition).

Exposes two endpoints that the Node backend calls (see backend/services/embeddings.js):
  POST /embed/text   { "text": "..." }              -> { "embedding": [...] }
  POST /embed/image  { "image": "<base64>" }         -> { "embedding": [...] }

Both return CLIP embeddings in the SAME vector space, so a text query embedding
and an image embedding can be compared directly with cosine similarity — that's
what makes "search by photo" and "search by description" hit the same catalog.

Model: Xenova/clip-vit-base-patch32 (same weights as openai/clip-vit-base-patch32)
via quantized ONNX (uint8 text + int8 vision, ~150MB). Runs on onnxruntime with
NO torch dependency, so peak RAM stays ~400MB — fits Render Free Tier 512MB,
where the torch build OOM-crash-looped.

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import base64
import io
import threading

import numpy as np
import onnxruntime as ort
from fastapi import FastAPI, HTTPException
from huggingface_hub import snapshot_download
from PIL import Image
from pydantic import BaseModel
from transformers import CLIPImageProcessor, CLIPTokenizerFast

app = FastAPI(title="CLIP Embedding Service")

MODEL_REPO = "Xenova/clip-vit-base-patch32"

_text_sess = None
_vision_sess = None
_tokenizer = None
_img_processor = None
_lock = threading.Lock()


def _load():
    """Lazy-load ONNX sessions + processor on first request (fast boot, green healthcheck)."""
    global _text_sess, _vision_sess, _tokenizer, _img_processor
    if _text_sess is not None:
        return
    with _lock:
        if _text_sess is not None:
            return
        print(f"Downloading {MODEL_REPO} ONNX weights (first boot only)...")
        snap = snapshot_download(
            MODEL_REPO,
            allow_patterns=[
                "onnx/text_model_uint8.onnx",
                "onnx/vision_model_int8.onnx",
                "tokenizer.json",
                "tokenizer_config.json",
                "preprocessor_config.json",
                "config.json",
            ],
        )
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 1
        opts.inter_op_num_threads = 1
        import os

        _text_sess = ort.InferenceSession(os.path.join(snap, "onnx", "text_model_uint8.onnx"), sess_options=opts)
        _vision_sess = ort.InferenceSession(os.path.join(snap, "onnx", "vision_model_int8.onnx"), sess_options=opts)
        _tokenizer = CLIPTokenizerFast.from_pretrained(snap)
        _img_processor = CLIPImageProcessor.from_pretrained(snap)
        print("ONNX CLIP model loaded.")


def _get():
    _load()
    return _text_sess, _vision_sess, _tokenizer, _img_processor


def _norm(vec):
    vec = np.asarray(vec, dtype=np.float32).reshape(-1)
    n = np.linalg.norm(vec)
    if n == 0:
        return vec
    return vec / n


class TextRequest(BaseModel):
    text: str


class ImageRequest(BaseModel):
    image: str  # base64-encoded image, no data: prefix


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_REPO, "engine": "onnx", "loaded": _text_sess is not None}


@app.post("/embed/text")
def embed_text(req: TextRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(400, "text must not be empty")

    text_sess, _, tokenizer, _ = _get()
    enc = tokenizer([req.text], padding=True, truncation=True, return_tensors="np")
    vec = text_sess.run(None, {"input_ids": enc["input_ids"].astype(np.int64)})[0][0]
    # Normalize so cosine similarity in the backend is a straight dot product
    return {"embedding": _norm(vec).tolist()}


@app.post("/embed/image")
def embed_image(req: ImageRequest):
    try:
        image_bytes = base64.b64decode(req.image)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"could not decode image: {e}")

    _, vision_sess, _, img_processor = _get()
    px = img_processor(images=[image], return_tensors="np")["pixel_values"].astype(np.float32)
    vec = vision_sess.run(None, {"pixel_values": px})[0][0]
    return {"embedding": _norm(vec).tolist()}


# --- Hugging Face Spaces (free Gradio SDK) hosting ---------------------------
# Docker SDK spaces are paid, so the free path is a Gradio SDK space: this
# mounts a tiny demo UI onto the same FastAPI app, so /health, /embed/text
# and /embed/image keep working exactly as the Node backend expects.
# Spaces runs `python main.py`, which serves everything on port 7860.
# Local `uvicorn main:app` usage is unchanged (gradio import is optional).
try:
    import gradio as gr

    def _demo_embed(text, image_path):
        if image_path:
            with open(image_path, "rb") as f:
                image_b64 = base64.b64encode(f.read()).decode("utf-8")
            vec = embed_image(ImageRequest(image=image_b64))["embedding"]
            return {"mode": "image", "dim": len(vec), "preview": vec[:8]}
        vec = embed_text(TextRequest(text=text or "warmup"))["embedding"]
        return {"mode": "text", "dim": len(vec), "preview": vec[:8]}

    _demo = gr.Interface(
        fn=_demo_embed,
        inputs=[gr.Textbox(label="Text query"), gr.Image(type="filepath", label="Or upload a photo")],
        outputs=gr.JSON(label="Embedding preview"),
        title="CLIP Embedding Service",
        description="Demo page. The Node backend uses POST /embed/text and POST /embed/image on this same Space.",
    )
    app = gr.mount_gradio_app(app, _demo, path="/")
except ImportError:
    pass  # gradio not installed — API routes work standalone

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=7860)
