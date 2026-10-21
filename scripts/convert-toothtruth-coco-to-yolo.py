"""Convert ToothTruth COCO dataset to YOLO format.

This script converts the ToothTruth dataset from COCO format to YOLO format,
preserving all 60 original classes without mapping.
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT_DIR = ROOT / "data" / "toothtruth" / "Final_processed_dataset"
OUTPUT_DIR = ROOT / "data" / "toothtruth-yolo"


def coco_bbox_to_yolo(bbox: list, img_width: int, img_height: int) -> list:
    """Convert COCO bbox [x, y, w, h] to YOLO format [x_center, y_center, w, h] (normalized)."""
    x, y, w, h = bbox
    
    # Convert to center coordinates
    x_center = x + w / 2
    y_center = y + h / 2
    
    # Normalize
    x_center /= img_width
    y_center /= img_height
    w /= img_width
    h /= img_height
    
    return [x_center, y_center, w, h]


def process_split(split: str, categories: dict) -> int:
    """Process a single split (train, valid, test)."""
    print(f"\n[INFO] Processing {split}...")
    
    split_dir = INPUT_DIR / split
    output_split_dir = OUTPUT_DIR / split
    
    # Create output directories
    (output_split_dir / "images").mkdir(parents=True, exist_ok=True)
    (output_split_dir / "labels").mkdir(parents=True, exist_ok=True)
    
    # Load COCO annotations
    coco_file = split_dir / "_annotations.coco.json"
    if not coco_file.exists():
        print(f"[WARN] No COCO file found for {split}")
        return 0
    
    with open(coco_file, "r") as f:
        coco_data = json.load(f)
    
    # Build image_id -> image mapping
    images = {img["id"]: img for img in coco_data["images"]}
    
    # Group annotations by image_id
    annotations_by_image = {}
    for ann in coco_data["annotations"]:
        img_id = ann["image_id"]
        if img_id not in annotations_by_image:
            annotations_by_image[img_id] = []
        annotations_by_image[img_id].append(ann)
    
    # Process each image
    processed_count = 0
    for img_id, img in images.items():
        image_file = split_dir / img["file_name"]
        
        if not image_file.exists():
            continue
        
        # Get annotations for this image
        annotations = annotations_by_image.get(img_id, [])
        
        # Convert annotations to YOLO format (preserve original class IDs)
        yolo_labels = []
        for ann in annotations:
            cat_id = ann["category_id"]
            
            # Convert bbox to YOLO format
            yolo_bbox = coco_bbox_to_yolo(
                ann["bbox"],
                img["width"],
                img["height"]
            )
            
            # Create YOLO label line with original class ID
            label_line = f"{cat_id} {yolo_bbox[0]:.6f} {yolo_bbox[1]:.6f} {yolo_bbox[2]:.6f} {yolo_bbox[3]:.6f}\n"
            yolo_labels.append(label_line)
        
        # Copy image and write labels
        if yolo_labels:
            shutil.copy2(image_file, output_split_dir / "images" / image_file.name)
            
            label_file = output_split_dir / "labels" / (image_file.stem + ".txt")
            with open(label_file, "w") as f:
                f.writelines(yolo_labels)
            
            processed_count += 1
    
    print(f"[INFO] {split}: {processed_count} images processed")
    return processed_count


def main():
    print("=" * 60)
    print("ToothTruth COCO to YOLO Conversion (All 60 Classes)")
    print("=" * 60)
    print(f"[INFO] Input directory: {INPUT_DIR}")
    print(f"[INFO] Output directory: {OUTPUT_DIR}")
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load categories from train split to get all class names
    train_coco = INPUT_DIR / "train" / "_annotations.coco.json"
    with open(train_coco, "r") as f:
        train_data = json.load(f)
    
    # Build category_id -> category name mapping
    categories = {cat["id"]: cat["name"] for cat in train_data["categories"]}
    num_classes = len(categories)
    
    print(f"[INFO] Total classes: {num_classes}")
    
    # Process each split
    total_processed = 0
    for split in ["train", "valid", "test"]:
        count = process_split(split, categories)
        total_processed += count
    
    print(f"\n[OK] Total images processed: {total_processed}")
    
    # Create data.yaml with all 60 classes
    data_yaml_content = f"""# ToothTruth dataset - All 60 classes
# Original dataset: data/toothtruth/Final_processed_dataset

path: data/toothtruth-yolo

train: train/images
val: valid/images
test: test/images

nc: {num_classes}

names:
"""
    # Add all class names in order by ID
    for cat_id in sorted(categories.keys()):
        data_yaml_content += f"  {cat_id}: {categories[cat_id]}\n"
    
    data_yaml_path = OUTPUT_DIR / "data.yaml"
    with open(data_yaml_path, "w", encoding="utf-8") as f:
        f.write(data_yaml_content)
    
    print(f"[OK] Created data.yaml: {data_yaml_path}")
    print(f"\n[INFO] Next steps:")
    print(f"       Run training with: python scripts/train-yolo.py --data data/toothtruth-yolo/data.yaml")


if __name__ == "__main__":
    main()
