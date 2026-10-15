from ultralytics import YOLO
import torch
import os

if __name__ == "__main__":
    print("=" * 60)
    print("BASELINE TRAINING - Intraoral Caries Dataset")
    print("=" * 60)

    # Check GPU
    print("\n1. GPU Check:")
    print(f"   CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
        print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    else:
        print("   WARNING: No GPU detected, using CPU")

    # Verify data.yaml
    print("\n2. Data.yaml check:")
    data_yaml = "data/intraoral/processed/annotated_caries/data.yaml"
    if os.path.exists(data_yaml):
        print(f"   data.yaml exists: YES")
    else:
        print(f"   ERROR: data.yaml not found at {data_yaml}")
        exit(1)

    # Training settings
    print("\n3. Training settings:")
    print("   Model: yolo11n.pt")
    print("   Data: data/intraoral/processed/annotated_caries/data.yaml")
    print("   Epochs: 50")
    print("   Image size: 640")
    print("   Batch: 2")
    print("   Device: 0 (GPU)")
    print("   Workers: 0")
    print("   Patience: 15")
    print("   Project: runs/intraoral")
    print("   Name: baseline-yolo11n")

    # Start training
    print("\n4. Starting training...")
    try:
        model = YOLO("yolo11n.pt")
        results = model.train(
            data=data_yaml,
            epochs=50,
            imgsz=640,
            batch=2,
            device=0,
            workers=0,
            patience=15,
            project="runs/intraoral",
            name="baseline-yolo11n",
            exist_ok=False
        )
        print("\n" + "=" * 60)
        print("TRAINING COMPLETED SUCCESSFULLY")
        print("=" * 60)
    except Exception as e:
        print(f"\nERROR: {e}")
        exit(1)
