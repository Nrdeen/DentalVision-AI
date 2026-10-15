import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import argparse
import sys
import os

def main():
    parser = argparse.ArgumentParser(description="MIO Classification Inference")
    parser.add_argument("image_path", type=str, help="Path to the image to classify")
    parser.add_argument("--model", type=str, default="models/intraoral/mio_classification_best.pt",
                       help="Path to the trained model")
    args = parser.parse_args()
    
    # Check if image exists
    if not os.path.exists(args.image_path):
        print(f"ERROR: Image not found at {args.image_path}")
        sys.exit(1)
    
    # Check if model exists
    if not os.path.exists(args.model):
        print(f"ERROR: Model not found at {args.model}")
        sys.exit(1)
    
    # Configuration
    image_size = 224
    num_classes = 3
    class_names = ["gingivitis", "healthy", "periodontitis"]
    
    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Data transforms (same as validation)
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load model
    model = models.mobilenet_v3_small(pretrained=False)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    model.load_state_dict(torch.load(args.model, map_location=device))
    model = model.to(device)
    model.eval()
    
    # Load and preprocess image
    image = Image.open(args.image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0).to(device)
    
    # Inference
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, predicted = probabilities.max(0)
    
    # Output results
    predicted_class = class_names[predicted.item()]
    confidence_score = confidence.item() * 100
    
    print("=" * 60)
    print("MIO CLASSIFICATION INFERENCE")
    print("=" * 60)
    print(f"\nImage: {args.image_path}")
    print(f"Predicted Class: {predicted_class}")
    print(f"Confidence: {confidence_score:.2f}%")
    print("\nClass Probabilities:")
    for i, class_name in enumerate(class_names):
        prob = probabilities[i].item() * 100
        print(f"  {class_name}: {prob:.2f}%")
    print("=" * 60)

if __name__ == "__main__":
    main()
