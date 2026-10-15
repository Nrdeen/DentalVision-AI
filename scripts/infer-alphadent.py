#!/usr/bin/env python3
"""
AlphaDent Segmentation Inference Script
Tests the trained AlphaDent segmentation model on a single image.

Model: runs/segment/runs/segment/train-alphadent/weights/best.pt
Dataset: AlphaDent (9 classes, segmentation)
Task: Instance Segmentation
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO

# Configuration
MODEL_PATH = "runs/segment/runs/segment/train-alphadent/weights/best.pt"
IMAGE_PATH = "data/intraoral/processed/alphadent/images/valid/p261_F_31_001.jpg"  # Default test image
OUTPUT_DIR = "runs/segment/infer-alphadent-test"
DEVICE = "cuda:0"  # Use GPU, change to "cpu" if needed
CONF_THRESHOLD = 0.25  # Confidence threshold
IOU_THRESHOLD = 0.6  # IoU threshold

def infer(image_path: str = None):
    """Run inference on a single image."""
    
    # Use provided image path or default
    if image_path:
        test_image = image_path
    else:
        test_image = IMAGE_PATH
    
    print("=" * 80)
    print("ALPHADENT SEGMENTATION INFERENCE TEST")
    print("=" * 80)
    print()
    print("Configuration:")
    print(f"  Model: {MODEL_PATH}")
    print(f"  Image: {test_image}")
    print(f"  Device: {DEVICE}")
    print(f"  Confidence threshold: {CONF_THRESHOLD}")
    print(f"  IoU threshold: {IOU_THRESHOLD}")
    print(f"  Output: {OUTPUT_DIR}")
    print()
    
    # Check if model exists
    model_path = Path(MODEL_PATH)
    if not model_path.exists():
        print(f"ERROR: Model not found at {MODEL_PATH}")
        print("Please train the model first: python scripts/train-alphadent.py")
        sys.exit(1)
    
    # Check if image exists
    image_file = Path(test_image)
    if not image_file.exists():
        print(f"ERROR: Image not found at {test_image}")
        print("Please provide a valid image path")
        sys.exit(1)
    
    # Load model
    print("Loading model...")
    model = YOLO(MODEL_PATH)
    print(f"Model loaded: {MODEL_PATH}")
    print(f"Model info: {model.info()}")
    print()
    
    # Run inference
    print(f"Running inference on {test_image}...")
    print()
    
    try:
        results = model(
            source=test_image,
            device=DEVICE,
            conf=CONF_THRESHOLD,
            iou=IOU_THRESHOLD,
            imgsz=640,
            max_det=300,
            save=True,
            show=False,
            project="runs/segment",
            name="infer-alphadent-test",
            exist_ok=True,
            classes=None,  # All classes
            agnostic_nms=False,
            augment=False,
            visualize=False,
            line_width=2,
        )
        
        print()
        print("=" * 80)
        print("INFERENCE COMPLETE")
        print("=" * 80)
        print()
        print(f"Results saved to: {OUTPUT_DIR}")
        print()
        
        # Process and print results
        for i, result in enumerate(results):
            print(f"RESULT {i+1}:")
            print(f"  Image: {result.path}")
            print(f"  Original size: {result.orig_shape}")
            print(f"  Number of detections: {len(result.boxes)}")
            print()
            
            if len(result.boxes) > 0:
                print("  DETECTIONS:")
                for j in range(len(result.boxes)):
                    box = result.boxes[j]
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = model.names[cls_id]
                    
                    print(f"    Detection {j+1}:")
                    print(f"      Class: {cls_name} (ID: {cls_id})")
                    print(f"      Confidence: {conf:.4f}")
                    print(f"      Bounding box: {box.xyxy[0].tolist()}")
                    
                    # Check if masks are available
                    if hasattr(result, 'masks') and result.masks is not None and len(result.masks) > 0:
                        mask = result.masks[j]
                        print(f"      Mask: Available (shape: {mask.data.shape if hasattr(mask.data, 'shape') else 'N/A'})")
                    else:
                        print(f"      Mask: Not available")
                    print()
            else:
                print("  No detections found.")
                print()
        
        print("=" * 80)
        print("INFERENCE TEST SUMMARY")
        print("=" * 80)
        print(f"  Model: {MODEL_PATH}")
        print(f"  Test image: {test_image}")
        print(f"  Total detections: {len(results[0].boxes)}")
        print(f"  Masks generated: {results[0].masks is not None and len(results[0].masks) > 0}")
        print(f"  Output saved: {OUTPUT_DIR}")
        print()
        print("SUCCESS: Inference test completed successfully.")
        
    except Exception as e:
        print()
        print("=" * 80)
        print("INFERENCE ERROR")
        print("=" * 80)
        print()
        print(f"Error: {str(e)}")
        print()
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Allow passing image path as command line argument
    if len(sys.argv) > 1:
        infer(sys.argv[1])
    else:
        infer()
