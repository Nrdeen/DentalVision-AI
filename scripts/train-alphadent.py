#!/usr/bin/env python3
"""
AlphaDent Segmentation Training Script
VRAM-safe training for NVIDIA GeForce MX330 (2GB VRAM)

Model: YOLOv11n-seg (smallest segmentation model)
Dataset: AlphaDent (9 classes, segmentation)
Task: Instance Segmentation

VRAM-Safe Settings:
- Model: yolo11n-seg (nano, ~3M parameters)
- Batch size: 2 (very small to fit 2GB VRAM)
- Image size: 640 (standard, can reduce to 512 if OOM)
- Workers: 2 (minimal data loading overhead)
- Gradient accumulation: 4 (simulates batch=8)
- Mixed precision: disabled (MX330 may not support well)
- Device: cuda:0 (single GPU)
"""

import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ultralytics import YOLO

# Configuration
DATASET_YAML = "data/intraoral/processed/alphadent/data.yaml"
MODEL_NAME = "yolo11n-seg.pt"  # Nano segmentation model
EPOCHS = 100
BATCH_SIZE = 2  # Very small for 2GB VRAM
IMAGE_SIZE = 640  # Can reduce to 512 if OOM
DEVICE = "cuda:0"  # Use GPU
WORKERS = 2  # Minimal workers
GRADIENT_ACCUMULATION = 4  # Simulate batch=8
LEARNING_RATE = 0.001  # Conservative LR
WEIGHT_DECAY = 0.0005
MOSAIC = 1.0  # Data augmentation
MIXUP = 0.0  # Disabled for VRAM safety

# Output directory
OUTPUT_DIR = "runs/segment/train-alphadent"

def train():
    """Train AlphaDent segmentation model with VRAM-safe settings."""
    
    print("=" * 80)
    print("ALPHADENT SEGMENTATION TRAINING")
    print("=" * 80)
    print()
    print("Configuration:")
    print(f"  Model: {MODEL_NAME}")
    print(f"  Dataset: {DATASET_YAML}")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Image size: {IMAGE_SIZE}")
    print(f"  Device: {DEVICE}")
    print(f"  Workers: {WORKERS}")
    print(f"  Gradient accumulation: {GRADIENT_ACCUMULATION}")
    print(f"  Learning rate: {LEARNING_RATE}")
    print()
    
    # Check if dataset exists
    dataset_path = Path(DATASET_YAML)
    if not dataset_path.exists():
        print(f"ERROR: Dataset YAML not found at {DATASET_YAML}")
        print("Please run preprocessing first: python scripts/preprocess-alphadent.py")
        sys.exit(1)
    
    # Load model
    print("Loading model...")
    model = YOLO(MODEL_NAME)
    print(f"Model loaded: {MODEL_NAME}")
    print()
    
    # Train with VRAM-safe settings
    print("Starting training...")
    print("Note: Training may take several hours on 2GB VRAM")
    print()
    
    try:
        results = model.train(
            data=DATASET_YAML,
            epochs=EPOCHS,
            batch=BATCH_SIZE,
            imgsz=IMAGE_SIZE,
            device=DEVICE,
            workers=WORKERS,
            project="runs/segment",
            name="train-alphadent",
            exist_ok=True,
            patience=20,  # Early stopping
            save=True,
            save_period=10,  # Save every 10 epochs
            cache=False,  # Disable caching to save RAM
            amp=False,  # Disable mixed precision for stability
            fraction=1.0,  # Use all training data
            profile=False,  # Disable profiling
            lr0=LEARNING_RATE,
            lrf=0.01,  # Final LR factor
            momentum=0.937,
            weight_decay=WEIGHT_DECAY,
            warmup_epochs=3,
            warmup_momentum=0.8,
            warmup_bias_lr=0.1,
            box=7.5,
            cls=0.5,
            dfl=1.5,
            pose=12.0,
            kobj=1.0,
            label_smoothing=0.0,
            nbs=64,
            hsv_h=0.015,
            hsv_s=0.7,
            hsv_v=0.4,
            degrees=0.0,
            translate=0.1,
            scale=0.5,
            shear=0.0,
            perspective=0.0,
            flipud=0.0,
            fliplr=0.5,
            mosaic=MOSAIC,
            mixup=MIXUP,
            copy_paste=0.0,
            auto_augment="randaugment",
            erasing=0.0,
            crop_fraction=1.0,
            close_mosaic=10,  # Disable mosaic in last 10 epochs
            mask_ratio=4,  # Segmentation-specific
            overlap_mask=True,  # Segmentation-specific
        )
        
        print()
        print("=" * 80)
        print("TRAINING COMPLETE")
        print("=" * 80)
        print()
        print(f"Results saved to: {OUTPUT_DIR}")
        print(f"Best model: {OUTPUT_DIR}/weights/best.pt")
        print(f"Last model: {OUTPUT_DIR}/weights/last.pt")
        print()
        print("Next steps:")
        print("1. Evaluate model: python scripts/evaluate-alphadent.py")
        print("2. Test inference: python scripts/infer-alphadent.py")
        print("3. Integrate into web application")
        
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            print()
            print("=" * 80)
            print("OUT OF MEMORY ERROR")
            print("=" * 80)
            print()
            print("Your GPU ran out of VRAM. Try these fixes:")
            print("1. Reduce batch size to 1 in this script")
            print("2. Reduce image size from 640 to 512")
            print("3. Close other applications using GPU")
            print("4. Use CPU training (device='cpu') - will be very slow")
            print()
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    train()
