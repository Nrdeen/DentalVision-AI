import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import os
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np
from datetime import datetime

def main():
    print("=" * 60)
    print("MIO CLASSIFICATION EVALUATION")
    print("=" * 60)
    
    # Configuration
    model_path = "models/intraoral/mio_classification_best.pt"
    data_dir = "data/intraoral/processed/MIO_classification"
    batch_size = 8
    image_size = 224
    num_classes = 3
    num_workers = 0  # Windows compatibility
    
    # Device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\nDevice: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # Data transforms (same as validation)
    test_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load test dataset
    print("\nLoading test dataset...")
    test_dataset = datasets.ImageFolder(
        os.path.join(data_dir, "test"),
        transform=test_transform
    )
    
    print(f"Test samples: {len(test_dataset)}")
    print(f"Classes: {test_dataset.classes}")
    print(f"Class to index mapping: {test_dataset.class_to_idx}")
    
    # Data loader
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers
    )
    
    # Load model
    print(f"\nLoading model from: {model_path}")
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        print("Please train the model first using: python scripts/train-mio-classification.py")
        return
    
    model = models.mobilenet_v3_small(pretrained=False)
    model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model = model.to(device)
    model.eval()
    
    # Evaluation
    print("\nRunning evaluation...")
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    
    # Calculate accuracy
    accuracy = (all_preds == all_labels).sum() / len(all_labels) * 100
    print(f"\nOverall Test Accuracy: {accuracy:.2f}%")
    
    # Classification report (precision, recall, F1)
    print("\nPer-Class Metrics:")
    class_names = test_dataset.classes
    report = classification_report(
        all_labels, all_preds,
        target_names=class_names,
        output_dict=True
    )
    
    for class_name in class_names:
        metrics = report[class_name]
        print(f"\n{class_name.upper()}:")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1-score']:.4f}")
        print(f"  Support: {metrics['support']}")
    
    # Confusion matrix
    cm = confusion_matrix(all_labels, all_preds)
    print("\nConfusion Matrix:")
    print("Predicted ->")
    print("Actual     ", end="")
    for class_name in class_names:
        print(f"{class_name[:8]:>8}", end="")
    print()
    for i, class_name in enumerate(class_names):
        print(f"{class_name[:8]:>8} ", end="")
        for j in range(len(class_names)):
            print(f"{cm[i][j]:>8}", end="")
        print()
    
    # Generate report
    report_path = "models/intraoral/mio_classification_evaluation_report.txt"
    print(f"\nSaving report to: {report_path}")
    
    with open(report_path, 'w') as f:
        f.write("=" * 60 + "\n")
        f.write("MIO CLASSIFICATION EVALUATION REPORT\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Model: {model_path}\n")
        f.write(f"Test Dataset: {os.path.join(data_dir, 'test')}\n")
        f.write(f"Device: {device}\n\n")
        
        f.write("=" * 60 + "\n")
        f.write("OVERALL RESULTS\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Test Samples: {len(test_dataset)}\n")
        f.write(f"Overall Accuracy: {accuracy:.2f}%\n\n")
        
        f.write("=" * 60 + "\n")
        f.write("PER-CLASS METRICS\n")
        f.write("=" * 60 + "\n\n")
        for class_name in class_names:
            metrics = report[class_name]
            f.write(f"{class_name.upper()}:\n")
            f.write(f"  Precision: {metrics['precision']:.4f}\n")
            f.write(f"  Recall: {metrics['recall']:.4f}\n")
            f.write(f"  F1-Score: {metrics['f1-score']:.4f}\n")
            f.write(f"  Support: {metrics['support']}\n\n")
        
        f.write("=" * 60 + "\n")
        f.write("CONFUSION MATRIX\n")
        f.write("=" * 60 + "\n\n")
        f.write("Predicted ->\n")
        f.write("Actual     ")
        for class_name in class_names:
            f.write(f"{class_name[:8]:>8}")
        f.write("\n")
        for i, class_name in enumerate(class_names):
            f.write(f"{class_name[:8]:>8} ")
            for j in range(len(class_names)):
                f.write(f"{cm[i][j]:>8}")
            f.write("\n")
        
        f.write("\n" + "=" * 60 + "\n")
        f.write("CLASSIFICATION REPORT (DETAILED)\n")
        f.write("=" * 60 + "\n\n")
        f.write(classification_report(all_labels, all_preds, target_names=class_names))
    
    print("\n" + "=" * 60)
    print("EVALUATION COMPLETE")
    print(f"Report saved to: {report_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
