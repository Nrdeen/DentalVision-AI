from ultralytics import YOLO
import torch
import os

if __name__ == "__main__":
    print("=" * 60)
    print("TEST EVALUATION - Intraoral Baseline Model")
    print("=" * 60)

    # Check GPU
    print("\n1. GPU Check:")
    print(f"   CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    else:
        print("   WARNING: No GPU detected, using CPU")

    # Model path
    model_path = "runs/detect/runs/intraoral/baseline-yolo11n-3/weights/best.pt"
    data_yaml = "data/intraoral/processed/annotated_caries/data.yaml"

    print("\n2. Configuration:")
    print(f"   Model: {model_path}")
    print(f"   Data: {data_yaml}")
    print(f"   Split: test")
    print(f"   Image size: 640")
    print(f"   Device: 0 (GPU)")

    # Verify files exist
    print("\n3. File verification:")
    if os.path.exists(model_path):
        print(f"   Model exists: YES")
    else:
        print(f"   ERROR: Model not found at {model_path}")
        exit(1)

    if os.path.exists(data_yaml):
        print(f"   data.yaml exists: YES")
    else:
        print(f"   ERROR: data.yaml not found at {data_yaml}")
        exit(1)

    # Load model
    print("\n4. Loading model...")
    try:
        model = YOLO(model_path)
        print("   Model loaded successfully")
    except Exception as e:
        print(f"   ERROR loading model: {e}")
        exit(1)

    # Run evaluation on test split
    print("\n5. Running test evaluation...")
    try:
        results = model.val(
            data=data_yaml,
            split="test",
            imgsz=640,
            device=0,
            project="runs/detect/runs/intraoral/baseline-yolo11n-3",
            name="test_evaluation",
            exist_ok=False
        )
        print("\n" + "=" * 60)
        print("TEST EVALUATION COMPLETED")
        print("=" * 60)
    except Exception as e:
        print(f"\nERROR during evaluation: {e}")
        exit(1)
