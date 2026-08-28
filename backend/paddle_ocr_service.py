import os
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np

app = Flask(__name__)
CORS(app)

print("[PaddleOCR Service] Initializing PaddleOCR Engine...")
try:
    from paddleocr import PaddleOCR
    ocr_engine = PaddleOCR(lang='en')
    print("[PaddleOCR Service] PaddleOCR Engine Loaded Successfully.")
except Exception as e:
    print(f"[PaddleOCR Service] Init Error: {e}")
    ocr_engine = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "engine": "PaddleOCR", "ready": ocr_engine is not None})

@app.route('/ocr', methods=['POST'])
def run_ocr():
    if ocr_engine is None:
        return jsonify({"success": False, "error": "PaddleOCR not initialized"}), 500

    try:
        data = request.get_json(force=True)
        base64_str = data.get('image', '')
        if not base64_str:
            return jsonify({"success": False, "error": "Missing image data"}), 400

        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        image_bytes = base64.b64decode(base64_str)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_np = np.array(pil_image)

        results = ocr_engine.ocr(img_np)

        extracted_lines = []
        blocks = []

        if results and len(results) > 0 and results[0] is not None:
            for line in results[0]:
                box, (text, confidence) = line
                extracted_lines.append(text)
                blocks.append({
                    "text": text,
                    "confidence": float(confidence),
                    "boundingBox": {
                        "x": int(box[0][0]),
                        "y": int(box[0][1]),
                        "width": int(box[1][0] - box[0][0]),
                        "height": int(box[2][1] - box[0][1])
                    }
                })

        full_text = " ".join(extracted_lines).strip()

        return jsonify({
            "success": True,
            "text": full_text,
            "lines": extracted_lines,
            "blocks": blocks,
            "engine": "PaddleOCR"
        })
    except Exception as err:
        print(f"[PaddleOCR] Error during recognition: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"[PaddleOCR Service] Starting server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
