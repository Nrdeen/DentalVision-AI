import argparse
import json
import os
import tempfile
import uuid
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from threading import Thread
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
from ultralytics import YOLO
import traceback

# Configuration
CARIES_MODEL_PATH = "runs/detect/runs/intraoral/baseline-yolo11n-3/weights/best.pt"
MIO_MODEL_PATH = "models/intraoral/mio_classification_best.pt"
ALPHADENT_MODEL_PATH = "runs/segment/runs/segment/train-alphadent/weights/best.pt"
IMAGE_SIZE = 224
# Must match torchvision ImageFolder order used in train-mio-classification.py (alphabetical).
MIO_CLASSES = ["gingivitis", "healthy", "periodontitis"]
CARIES_CLASSES = ["permanent_caries", "primary_caries"]
ALPHADENT_CLASSES = [
    "Abrasion",
    "Filling",
    "Crown",
    "Caries 1 class",
    "Caries 2 class",
    "Caries 3 class",
    "Caries 4 class",
    "Caries 5 class",
    "Caries 6 class",
]

# Global model instances
caries_model = None
mio_model = None
alphadent_model = None
mio_transform = None

def load_models():
    """Load all three models on startup."""
    global caries_model, mio_model, alphadent_model, mio_transform
    
    print("[intraoral-infer] Loading models...")
    
    # Load YOLO caries detection model
    print(f"[intraoral-infer] Loading caries model from {CARIES_MODEL_PATH}")
    caries_model = YOLO(CARIES_MODEL_PATH)
    
    # Load MIO classification model
    print(f"[intraoral-infer] Loading MIO model from {MIO_MODEL_PATH}")
    mio_model = models.mobilenet_v3_small(pretrained=False)
    mio_model.classifier[3] = nn.Linear(mio_model.classifier[3].in_features, 3)
    mio_model.load_state_dict(torch.load(MIO_MODEL_PATH, map_location="cpu"))
    mio_model.eval()
    
    # Load AlphaDent segmentation model
    print(f"[intraoral-infer] Loading AlphaDent model from {ALPHADENT_MODEL_PATH}")
    alphadent_model = YOLO(ALPHADENT_MODEL_PATH)
    
    # MIO transform
    mio_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    print("[intraoral-infer] Models loaded successfully")

def run_caries_detection(image_path):
    """Run YOLO caries detection."""
    results = caries_model(image_path, conf=0.25)
    detections = []
    
    for result in results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxyn = box.xyxyn[0].tolist()  # Normalized coordinates
            
            detections.append({
                "cls": cls_id,
                "name": CARIES_CLASSES[cls_id] if cls_id < len(CARIES_CLASSES) else "unknown",
                "conf": conf,
                "xyxyn": xyxyn
            })
    
    return detections

def run_mio_classification(image_path):
    """Run MIO classification."""
    image = Image.open(image_path).convert("RGB")
    input_tensor = mio_transform(image).unsqueeze(0)
    
    with torch.no_grad():
        outputs = mio_model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted = probabilities.max(0)
    
    # Simplify output to avoid JSON serialization issues
    return {
        "class_name": MIO_CLASSES[predicted.item()],
        "confidence": float(confidence.item()),
        "probabilities": {name: float(probabilities[i].item()) for i, name in enumerate(MIO_CLASSES)}
    }

def run_alphadent_segmentation(image_path):
    """Run AlphaDent segmentation."""
    results = alphadent_model(
        image_path,
        conf=0.25,
        imgsz=640,
        iou=0.7,
        device=None,
        rect=True,  # Changed to True to preserve aspect ratio and avoid losing detections
        augment=False,
        agnostic_nms=False,
        max_det=300,
        classes=None,
        retina_masks=True  # Changed to True to get high-resolution masks
    )
    detections = []
    
    for result in results:
        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxyn = box.xyxyn[0].tolist()  # Normalized coordinates
            
            # Extract mask if available
            mask_coords = None
            if hasattr(result, 'masks') and result.masks is not None and len(result.masks) > 0:
                mask = result.masks[i]
                # Convert mask to normalized coordinates
                if hasattr(mask, 'xy') and mask.xy is not None:
                    mask_coords = mask.xy[0].tolist()  # Polygon coordinates
                    # Normalize to [0, 1]
                    if len(mask_coords) > 0:
                        h, w = result.orig_shape
                        mask_coords = [[x / w, y / h] for x, y in mask_coords]
            
            detections.append({
                "cls": cls_id,
                "name": ALPHADENT_CLASSES[cls_id] if cls_id < len(ALPHADENT_CLASSES) else "unknown",
                "conf": conf,
                "xyxyn": xyxyn,
                "mask": mask_coords
            })
    
    return detections

def map_caries_detection(detection):
    """Map YOLO detection to Finding format."""
    cls_name = detection["name"]
    
    # Map to FindingKey
    if "permanent" in cls_name.lower():
        key = "permanentCaries"
        descriptionKey = "permanentCariesDesc"
        colorVar = "--color-finding-caries"
    elif "primary" in cls_name.lower():
        key = "primaryCaries"
        descriptionKey = "primaryCariesDesc"
        colorVar = "--color-finding-caries"
    else:
        key = "unknownCariesClass"
        descriptionKey = "cariesDesc"
        colorVar = "--color-finding-caries"
    
    # Determine severity from confidence
    conf = detection["conf"]
    if conf >= 0.75:
        severity = "high"
    elif conf >= 0.5:
        severity = "medium"
    else:
        severity = "low"
    
    # Determine position from bbox (use region positions since YOLO doesn't provide tooth numbers)
    bbox = detection["xyxyn"]
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    upper = cy < 0.48
    right = cx < 0.5
    if upper and right:
        positionKey = "upperRightRegion"
    elif upper and not right:
        positionKey = "upperLeftRegion"
    elif not upper and right:
        positionKey = "lowerRightRegion"
    else:
        positionKey = "lowerLeftRegion"
    
    return {
        "id": f"caries-{detection['cls']}-{int(bbox[0]*1000)}-{int(bbox[1]*1000)}",
        "key": key,
        "confidence": conf,
        "tooth": "-",  # YOLO doesn't provide tooth numbers
        "positionKey": positionKey,
        "severity": severity,
        "descriptionKey": descriptionKey,
        "bbox": bbox,
        "colorVar": colorVar,
        "source": "intraoral"  # Track source modality
        ,"modelName": "annotated-intraoral-caries",
        "modelClassId": detection["cls"],
        "modelClassName": cls_name,
    }

def map_mio_classification(classification):
    """Map MIO classification to Finding format."""
    class_name = classification["class_name"]
    conf = classification["confidence"]
    
    # Map to FindingKey
    if class_name == "healthy":
        key = "healthy"
        descriptionKey = "healthyDesc"
        colorVar = "--color-finding-healthy"
        severity = "low"
    elif class_name == "gingivitis":
        key = "gingivitis"
        descriptionKey = "gingivitisDesc"
        colorVar = "--color-finding-gingivitis"
        severity = "medium" if conf >= 0.7 else "low"
    elif class_name == "periodontitis":
        key = "periodontitis"
        descriptionKey = "periodontitisDesc"
        colorVar = "--color-finding-periodontitis"
        severity = "high" if conf >= 0.7 else "medium"
    else:
        key = "healthy"
        descriptionKey = "healthyDesc"
        colorVar = "--color-finding-healthy"
        severity = "low"
    
    # For classification, use full-image bbox
    bbox = [0, 0, 1, 1]
    
    return {
        "id": f"mio-{class_name}",
        "key": key,
        "confidence": conf,
        "tooth": "-",
        "positionKey": "overall",
        "severity": severity,
        "descriptionKey": descriptionKey,
        "bbox": bbox,
        "colorVar": colorVar,
        "source": "intraoral"  # Track source modality
    }

def map_alphadent_segmentation(detection):
    """Map AlphaDent segmentation to Finding format."""
    cls_name = detection["name"]
    conf = detection["conf"]
    mask = detection["mask"]
    
    # Map to FindingKey using the actual AlphaDent output labels.
    class_mapping = {
        "Abrasion": ("abrasion", "abrasionDesc", "--color-finding-abrasion"),
        "Filling": ("filling", "fillingDesc", "--color-finding-filling"),
        "Crown": ("crown", "crownDesc", "--color-finding-crown"),
        "Caries 1 class": ("caries1", "cariesDesc", "--color-finding-caries"),
        "Caries 2 class": ("caries2", "cariesDesc", "--color-finding-caries"),
        "Caries 3 class": ("caries3", "cariesDesc", "--color-finding-caries"),
        "Caries 4 class": ("caries4", "cariesDesc", "--color-finding-caries"),
        "Caries 5 class": ("caries5", "cariesDesc", "--color-finding-caries"),
        "Caries 6 class": ("caries6", "cariesDesc", "--color-finding-caries"),
    }

    key, descriptionKey, colorVar = class_mapping.get(cls_name, ("unknown", "unknownDesc", "--color-finding-unknown"))
    
    # Determine severity from confidence
    if conf >= 0.75:
        severity = "high"
    elif conf >= 0.5:
        severity = "medium"
    else:
        severity = "low"
    
    # Determine position from bbox (use region positions since AlphaDent doesn't provide tooth numbers)
    bbox = detection["xyxyn"]
    cx = (bbox[0] + bbox[2]) / 2
    cy = (bbox[1] + bbox[3]) / 2
    upper = cy < 0.48
    right = cx < 0.5
    if upper and right:
        positionKey = "upperRightRegion"
    elif upper and not right:
        positionKey = "upperLeftRegion"
    elif not upper and right:
        positionKey = "lowerRightRegion"
    else:
        positionKey = "lowerLeftRegion"
    
    return {
        "id": f"alphadent-{detection['cls']}-{int(bbox[0]*1000)}-{int(bbox[1]*1000)}",
        "key": key,
        "confidence": conf,
        "tooth": "-",  # YOLO doesn't provide tooth numbers
        "positionKey": positionKey,
        "severity": severity,
        "descriptionKey": descriptionKey,
        "bbox": bbox,
        "colorVar": colorVar,
        "mask": mask,  # Include segmentation mask
        "source": "intraoral"  # Track source modality
    }

class InferenceHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass
    
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_GET(self):
        """Health check endpoint."""
        if self.path == "/health":
            self.send_json({"ok": True})
        else:
            self.send_json({"ok": False, "error": "Not found"}, 404)
    
    def do_POST(self):
        """Inference endpoint."""
        if self.path != "/predict":
            self.send_json({"ok": False, "error": "Not found"}, 404)
            return
        
        try:
            content_length = int(self.headers["Content-Length"])
            body = json.loads(self.rfile.read(content_length).decode())
            
            image = body.get("image")
            if not image:
                self.send_json({"ok": False, "error": "Missing image"}, 400)
                return
            
            # Save image to the system temp dir (not the project root) with a unique
            # name so Vite's dev watcher never sees it and concurrent requests never collide.
            temp_path = os.path.join(tempfile.gettempdir(), f"dentaai_intraoral_{uuid.uuid4().hex}.jpg")
            import base64
            # Remove data URL prefix and decode base64
            if image.startswith("data:image/jpeg;base64,"):
                image_data = image.replace("data:image/jpeg;base64,", "")
            elif image.startswith("data:image/png;base64,"):
                image_data = image.replace("data:image/png;base64,", "")
            else:
                image_data = image
            with open(temp_path, "wb") as f:
                f.write(base64.b64decode(image_data))
            
            
            try:
                # Run all three models
                caries_detections = run_caries_detection(temp_path)
                mio_classification = run_mio_classification(temp_path)
                alphadent_detections = run_alphadent_segmentation(temp_path)
            finally:
                # Close any open file handles before deletion
                import gc
                gc.collect()
                # Try to remove the temp file with retries
                for attempt in range(3):
                    try:
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
                        break
                    except PermissionError:
                        if attempt < 2:
                            import time
                            time.sleep(0.1)
                        else:
                            # If still can't delete, log but don't crash
                            print(f"[intraoral-infer] Warning: Could not delete temp file {temp_path}")
            
            # Map to findings - ONLY include actual detections with real bboxes
            # MIO classification is NOT a detection and should NOT be added as a finding
            findings = []
            
            # Add caries detections (actual detections with real bboxes)
            for detection in caries_detections:
                findings.append(map_caries_detection(detection))
            
            # Add AlphaDent segmentations (actual detections with real bboxes)
            for detection in alphadent_detections:
                findings.append(map_alphadent_segmentation(detection))
            
            # MIO classification is NOT added as a finding because:
            # 1. It has no real bbox (uses [0,0,1,1] full image)
            # 2. It's a classification, not a detection
            # 3. It would not match any box on the image
            # 4. It violates the rule: "Yapay Zeka Analizi must be derived from detections"
            
            # Prepare response
            response_data = {
                "ok": True,
                "findings": findings,
                "count": len(findings)
            }
            
            # Only add MIO classification if it's not None
            if mio_classification is not None:
                response_data["mio_classification"] = mio_classification
            
            self.send_json(response_data)
            
        except Exception as e:
            print(f"[intraoral-infer] Error: {traceback.format_exc()}")
            self.send_json({"ok": False, "error": str(e)}, 500)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true", help="Run as server")
    parser.add_argument("--host", default="127.0.0.1", help="Server host")
    parser.add_argument("--port", type=int, default=8766, help="Server port")
    args = parser.parse_args()
    
    if not args.serve:
        print("Use --serve to run as server")
        return
    
    # Load models
    load_models()
    
    # Start server
    server = HTTPServer((args.host, args.port), InferenceHandler)
    print(f"[intraoral-infer] Server running on http://{args.host}:{args.port}")
    print(f"[intraoral-infer] Health check: http://{args.host}:{args.port}/health")
    print(f"[intraoral-infer] Predict endpoint: http://{args.host}:{args.port}/predict")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[intraoral-infer] Server stopped")

if __name__ == "__main__":
    main()
