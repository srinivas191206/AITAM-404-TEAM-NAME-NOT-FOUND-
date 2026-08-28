import os
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import onnxruntime as ort
from ultralytics import YOLO

app = Flask(__name__)
CORS(app)

print("[Vision Service] Initializing PaddleOCR Engine with enable_mkldnn=False...")
try:
    from paddleocr import PaddleOCR
    ocr_engine = PaddleOCR(lang='en', enable_mkldnn=False)
    print("[Vision Service] PaddleOCR Engine Loaded Successfully.")
except Exception as e:
    print(f"[Vision Service] PaddleOCR Init Error: {e}")
    ocr_engine = None

print("[Vision Service] Initializing Rathnavelu Indian Currency Model...")
cnn_session = None
try:
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    cnn_path = os.path.join(models_dir, 'mobilenetv3_currency.onnx')
    if os.path.exists(cnn_path):
        cnn_session = ort.InferenceSession(cnn_path)
        print("[Vision Service] Rathnavelu Currency CNN Loaded.")
except Exception as e:
    print(f"[Vision Service] Currency Model Error: {e}")

print("[Vision Service] Initializing Ultralytics YOLOv8 Object Detection...")
try:
    yolo_detector = YOLO('yolov8n.pt')
    print("[Vision Service] YOLOv8 Object Detector Loaded.")
except Exception as e:
    print(f"[Vision Service] YOLO Init Error: {e}")
    yolo_detector = None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "paddle_ocr": ocr_engine is not None,
        "currency_model": cnn_session is not None,
        "yolo_detector": yolo_detector is not None
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

        results = list(ocr_engine.predict(img_np))

        extracted_lines = []
        blocks = []

        if results and len(results) > 0:
            res_dict = results[0]
            rec_texts = res_dict.get('rec_texts', [])
            rec_scores = res_dict.get('rec_scores', [])
            rec_boxes = res_dict.get('rec_boxes', [])

            for i, text in enumerate(rec_texts):
                score = float(rec_scores[i]) if i < len(rec_scores) else 0.95
                extracted_lines.append(text)
                
                box_dict = {"x": 0, "y": 0, "width": 100, "height": 30}
                if i < len(rec_boxes):
                    box = rec_boxes[i]
                    if len(box) >= 4:
                        box_dict = {
                            "x": int(box[0]),
                            "y": int(box[1]),
                            "width": int(box[2] - box[0]),
                            "height": int(box[3] - box[1])
                        }

                blocks.append({
                    "text": text,
                    "confidence": score,
                    "boundingBox": box_dict
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
        print(f"[PaddleOCR] Error: {err}")
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

        img_resized = pil_image.resize((224, 224))
        img_array = np.array(img_resized).astype(np.float32) / 255.0
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_array = (img_array - mean) / std
        input_data = img_array.transpose(2, 0, 1)[np.newaxis, ...].astype(np.float32)

        outputs = cnn_session.run(None, {cnn_session.get_inputs()[0].name: input_data})
        logits = outputs[0][0]
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)

        class_names = ["10", "100", "20", "200", "2000", "50", "500"]
        idx = int(np.argmax(probs))
        confidence = float(probs[idx])
        pred_label = class_names[idx]
        denom_val = int(pred_label)

        if confidence < 0.25:
            return jsonify({
                "success": False,
                "detected": False,
                "confidence": confidence,
                "message": "No Indian currency note clearly detected in view."
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
        print(f"[Currency] Error: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

@app.route('/detect', methods=['POST'])
def detect_objects():
    if yolo_detector is None:
        return jsonify({"success": False, "error": "YOLO detector not initialized"}), 500

    try:
        data = request.get_json(force=True)
        base64_str = data.get('image', '')
        if not base64_str:
            return jsonify({"success": False, "error": "Missing image data"}), 400

        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]

        image_bytes = base64.b64decode(base64_str)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        w, h = pil_image.size

        results = yolo_detector(pil_image, conf=0.30, verbose=False)
        detections = []

        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = results[0].names[cls_id]
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()

                x1, y1, x2, y2 = xyxy
                box_w = x2 - x1
                box_h = y2 - y1
                center_x = x1 + (box_w / 2.0)
                center_y = y1 + (box_h / 2.0)

                norm_x = center_x / float(w)
                if norm_x < 0.35:
                    position = 'LEFT'
                elif norm_x > 0.65:
                    position = 'RIGHT'
                else:
                    position = 'CENTER'

                detections.append({
                    "id": f"yolo_{len(detections)}",
                    "label": cls_name,
                    "confidence": conf,
                    "position": position,
                    "centerX": int(center_x),
                    "centerY": int(center_y),
                    "boundingBox": {
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(box_w),
                        "height": int(box_h)
                    }
                })

        if len(detections) == 0:
            spoken_response = "The path ahead appears clear. Nothing detected in front of you."
        else:
            labels_by_pos = {}
            for d in detections[:4]:
                pos = d["position"]
                labels_by_pos.setdefault(pos, []).append(d["label"])
            
            parts = []
            if 'CENTER' in labels_by_pos:
                parts.append(f"{', '.join(labels_by_pos['CENTER'])} directly ahead")
            if 'LEFT' in labels_by_pos:
                parts.append(f"{', '.join(labels_by_pos['LEFT'])} on your left")
            if 'RIGHT' in labels_by_pos:
                parts.append(f"{', '.join(labels_by_pos['RIGHT'])} on your right")
            
            spoken_response = f"I see {', and '.join(parts)}."

        return jsonify({
            "success": True,
            "detections": detections,
            "spokenResponse": spoken_response,
            "model": "YOLOv8n"
        })
    except Exception as err:
        print(f"[Detect] Error: {err}")
        return jsonify({"success": False, "error": str(err)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"[Vision Service] Starting server on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
