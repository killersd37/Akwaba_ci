from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

app = FastAPI(title="MOYÉ AI Service")

class TranslateInput(BaseModel):
    text: str
    source_lang: str = "fr"
    target_lang: str = "nzi"

@app.get('/health')
def health():
    return {"status": "ok", "service": "ai"}

@app.post('/recognize-image')
async def recognize_image(file: UploadFile = File(...)):
    label = "tenue-traditionnelle" if file.filename.lower().endswith((".png", ".jpg", ".jpeg")) else "objet-culturel"
    return {"prediction": label, "confidence": 0.87, "filename": file.filename}

@app.post('/translate')
def translate(data: TranslateInput):
    return {
        "source_text": data.text,
        "translated_text": f"[{data.target_lang}] {data.text}",
        "simulated": True
    }

@app.post('/translate-inline')
def translate_inline(data: dict):
    text = data.get("text", "")
    return {"translated_text": f"[inline] {text}", "simulated": True}
