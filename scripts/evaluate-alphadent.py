#!/usr/bin/env python3
"""
AlphaDent Segmentation Evaluation Script
Evaluates the trained AlphaDent segmentation model on the validation set.

Model: runs/segment/train-alphadent/weights/best.pt
Dataset: data/intraoral/processed/alphadent/data.yaml
Split: Validation only (test set is unlabeled)
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO

# Configuration
MODEL_PATH = "runs/segment/runs/segment/train-alphadent/weights/best.pt"
DATASET_YAML = "data/intraoral/processed/alphadent/data.yaml"
OUTPUT_DIR = "runs/segment/eval-alphadent"
DEVICE = "cuda:0"  # Use GPU, change to "cpu" if needed

def evaluate():
    """Evaluate AlphaDent segmentation model on validation set."""
    
    print("=" * 80)
    print("ALPHADENT SEGMENTATION EVALUATION")
    print("=" * 80)
    print()
    print("Configuration:")
    print(f"  Model: {MODEL_PATH}")
    print(f"  Dataset: {DATASET_YAML}")
    print(f"  Split: Validation only")
    print(f"  Device: {DEVICE}")
    print(f"  Output: {OUTPUT_DIR}")
    print()
    
    # Check if model exists
    model_path = Path(MODEL_PATH)
    if not model_path.exists():
        print(f"ERROR: Model not found at {MODEL_PATH}")
        print("Please train the model first: python scripts/train-alphadent.py")
        sys.exit(1)
    
    # Check if dataset exists
    dataset_path = Path(DATASET_YAML)
    if not dataset_path.exists():
        print(f"ERROR: Dataset YAML not found at {DATASET_YAML}")
        print("Please run preprocessing first: python scripts/preprocess-alphadent.py")
        sys.exit(1)
    
    # Load model
    print("Loading model...")
    model = YOLO(MODEL_PATH)
    print(f"Model loaded: {MODEL_PATH}")
    print()
    
    # Evaluate on validation set
    print("Starting evaluation...")
    print("Note: Evaluation on validation set only (test set is unlabeled)")
    print()
    
    try:
        results = model.val(
            data=DATASET_YAML,
            split="val",  # Evaluate on validation set only
            device=DEVICE,
            project="runs/segment",
            name="eval-alphadent",
            exist_ok=True,
            batch=16,  # Larger batch for evaluation
            imgsz=640,
            conf=0.25,  # Confidence threshold
            iou=0.6,  # IoU threshold
            max_det=300,
            plots=True,  # Generate plots
            rect=False,  # Use rectangular inference
        )
        
        print()
        print("=" * 80)
        print("EVALUATION COMPLETE")
        print("=" * 80)
        print()
        print(f"Results saved to: {OUTPUT_DIR}")
        print()
        
        # Print key metrics
        print("BOX METRICS:")
        print(f"  Precision: {results.box.mp:.4f}")
        print(f"  Recall: {results.box.mr:.4f}")
        print(f"  mAP50: {results.box.map50:.4f}")
        print(f"  mAP50-95: {results.box.map:.4f}")
        print()
        
        print("MASK METRICS:")
        print(f"  Precision: {results.seg.mp:.4f}")
        print(f"  Recall: {results.seg.mr:.4f}")
        print(f"  mAP50: {results.seg.map50:.4f}")
        print(f"  mAP50-95: {results.seg.map:.4f}")
        print()
        
        # Print per-class metrics if available
        if hasattr(results, 'results_dict') and 'classes' in results.results_dict:
            print("PER-CLASS METRICS:")
            print(f"  Class Names: {results.names}")
            print(f"  Class mAP50-95: {results.box.maps}")
            print()
        
        print("Next steps:")
        print("1. Review plots in runs/segment/eval-alphadent/")
        print("2. Check confusion matrix and PR curves")
        print("3. Test inference: python scripts/infer-alphadent.py")
        print("4. Integrate into web application")
        
    except Exception as e:
        print()
        print("=" * 80)
        print("EVALUATION ERROR")
        print("=" * 80)
        print()
        print(f"Error: {str(e)}")
        print()
        sys.exit(1)

if __name__ == "__main__":
    evaluate()
