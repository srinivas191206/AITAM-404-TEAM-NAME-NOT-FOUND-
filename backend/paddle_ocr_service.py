import os
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import onnxruntime as ort

app = Flask(__name__)
CORS(app)

print("[Vision Service] Initializing PaddleOCR Engine...")
try:
    from paddleocr import PaddleOCR
    ocr_engine = PaddleOCR(lang='en')
    print("[Vision Service] PaddleOCR Engine Loaded.")
except Exception as e:
    print(f"[Vision Service] PaddleOCR Init Error: {e}")
    ocr_engine = None

print("[Vision Service] Initializing Rathnavelu Indian Currency CNN-YOLO Model...")
cnn_session = None
yolo_session = None

try:
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    cnn_path = os.path.join(models_dir, 'mobilenetv3_currency.onnx')
    yolo_path = os.path.join(models_dir, 'yolov8n_currency_best.onnx')

    if os.path.exists(cnn_path):
        cnn_session = ort.InferenceSession(cnn_path)
        print("[Vision Service] Rathnavelu MobileNetV3-Small Currency CNN Loaded Successfully.")
    if os.path.exists(yolo_path):
        yolo_session = ort.InferenceSession(yolo_path)
        print("[Vision Service] Rathnavelu YOLOv8n Currency Detector Loaded Successfully.")
except Exception as e:
    print(f"[Vision Service] Currency Model Init Error: {e}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "paddle_ocr": ocr_engine is not None,
        "currency_model": cnn_session is not None,
        "model_name": "Rathnavelu/indian-currency-cnn-yolo"
    })

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

@app.route('/currency', methods=['POST'])
def detect_currency():
    if cnn_session is None:
        return jsonify({"success": False, "error": "Currency model not initialized"}), 500

    try:
        data = request.get_json(force=True)
        base64_str = data.get('image', '')
        if not base64_str:
            return jsonify({"success": False, "error": "Missing image data"}), 400

        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        image_bytes = base64.b64decode(base64_str)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # 1. Image preprocessing for MobileNetV3-Small CNN
        img_resized = pil_image.resize((224, 224))
        img_array = np.array(img_resized).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_array = (img_array - mean) / std
        input_data = img_array.transpose(2, 0, 1)[np.newaxis, ...].astype(np.float32)

        # 2. Run Rathnavelu Indian Currency CNN Model
        outputs = cnn_session.run(None, {cnn_session.get_inputs()[0].name: input_data})
        logits = outputs[0][0]
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)

        class_names = ["10", "100", "20", "200", "2000", "50", "500"]
        idx = int(np.argmax(probs))
        confidence = float(probs[idx])
        pred_label = class_names[idx]
        denom_val = int(pred_label)

        # Check threshold
        if confidence < 0.25:
            return jsonify({
                "success": false,
                "detected": False,
                "confidence": confidence,
                "message": "No Indian currency note clearly detected in view. Please point camera directly at the note."
            })

        message = f"Indian currency note detected: ₹{denom_val} ({denom_val} rupees)."

        return jsonify({
            "success": True,
            "detected": True,
            "denomination": f"₹{denom_val}",
            "value": denom_val,
            "confidence": confidence,
            "model": "Rathnavelu/indian-currency-cnn-yolo",
            "message": message
        })
    except Exception as err:
        print(f"[Currency Service] Error: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"[Vision Service] Starting server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
