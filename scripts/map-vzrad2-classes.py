"""Map vzrad2 93 classes to 4 main classes for dental X-ray detection.

This script processes the vzrad2 dataset and maps the 93 original classes
to the 4 main classes we need:
- 0: Caries
- 1: Deep Caries
- 2: Periapical Lesion
- 3: Impacted Tooth

Usage:
    python scripts/map-vzrad2-classes.py --input data/vzrad2 --output data/vzrad2-mapped
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


# Class mapping from vzrad2 (14 classes) to 4 main classes
# Original 14 classes: Caries, Crown, Filling, Implant, Malaligned, 
# Mandibular Canal, Missing teeth, Periapical lesion, Retained root,
# Root Canal Treatment, Root Piece, croen, impacted tooth, maxillary sinus

CLASS_MAPPING = {
    # Caries -> Class 0
    "Caries": 0,
    
    # Deep Caries -> Class 1 (we'll map Root Canal Treatment to this)
    "Root Canal Treatment": 1,
    "Root Piece": 1,
    
    # Periapical Lesion -> Class 2
    "Periapical lesion": 2,
    
    # Impacted Tooth -> Class 3
    "impacted tooth": 3,
    
    # Other classes we'll ignore (not in our 4 main classes)
    "Crown": None,
    "Filling": None,
    "Implant": None,
    "Malaligned": None,
    "Mandibular Canal": None,
    "Missing teeth": None,
    "Retained root": None,
    "croen": None,  # typo for Crown
    "maxillary sinus": None,
}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--input",
        default="data/vzrad2",
        help="Path to downloaded vzrad2 dataset",
    )
    ap.add_argument(
        "--output",
        default="data/vzrad2-mapped",
        help="Path to output mapped dataset",
    )
    args = ap.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    if not input_dir.exists():
        print(f"[FATAL] Input directory not found: {input_dir}")
        return 2

    print(f"[INFO] Input directory: {input_dir}")
    print(f"[INFO] Output directory: {output_dir}")

    # Create output directory structure
    for split in ["train", "valid", "test"]:
        (output_dir / split / "images").mkdir(parents=True, exist_ok=True)
        (output_dir / split / "labels").mkdir(parents=True, exist_ok=True)

    # Read the original data.yaml to get class names
    data_yaml = input_dir / "data.yaml"
    class_names = []
    if data_yaml.exists():
        print(f"[INFO] Reading original data.yaml: {data_yaml}")
        with open(data_yaml, "r", encoding="utf-8") as f:
            import yaml
            original_yaml = yaml.safe_load(f)
            class_names = original_yaml.get("names", [])
        print(f"[INFO] Original classes ({len(class_names)}): {class_names}")
    else:
        print("[WARN] data.yaml not found, will create one")

    # Process each split
    for split in ["train", "valid", "test"]:
        print(f"\n[INFO] Processing {split} split...")
        
        labels_dir = input_dir / split / "labels"
        images_dir = input_dir / split / "images"
        
        if not labels_dir.exists():
            print(f"[WARN] Labels directory not found: {labels_dir}")
            continue
        
        if not images_dir.exists():
            print(f"[WARN] Images directory not found: {images_dir}")
            continue
        
        label_files = list(labels_dir.glob("*.txt"))
        print(f"[INFO] Found {len(label_files)} label files")
        
        mapped_count = 0
        skipped_count = 0
        
        for label_file in label_files:
            # Copy image
            image_file = images_dir / label_file.stem
            # Try common image extensions
            for ext in [".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"]:
                if (images_dir / (label_file.stem + ext)).exists():
                    image_file = images_dir / (label_file.stem + ext)
                    break
            
            if not image_file.exists():
                print(f"[WARN] Image not found for: {label_file.name}")
                skipped_count += 1
                continue
            
            # Read and map labels
            with open(label_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            mapped_lines = []
            for line in lines:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue
                
                class_id = int(parts[0])
                
                # Get class name from original data.yaml
                if class_id < len(class_names):
                    class_name = class_names[class_id]
                else:
                    class_name = None
                
                # Map to new class_id
                if class_name in CLASS_MAPPING:
                    new_class_id = CLASS_MAPPING[class_name]
                    if new_class_id is not None:
                        # Keep the line but update class_id
                        parts[0] = str(new_class_id)
                        mapped_lines.append(" ".join(parts) + "\n")
                    else:
                        # Skip this class (not in our 4 main classes)
                        continue
                else:
                    # Unknown class, skip
                    continue
            
            if mapped_lines:
                # Copy image
                shutil.copy2(image_file, output_dir / split / "images" / image_file.name)
                
                # Write mapped labels
                with open(output_dir / split / "labels" / label_file.name, "w") as f:
                    f.writelines(mapped_lines)
                
                mapped_count += 1
            else:
                skipped_count += 1
        
        print(f"[INFO] Mapped {mapped_count} files, skipped {skipped_count}")

    # Create new data.yaml
    new_data_yaml = output_dir / "data.yaml"
    with open(new_data_yaml, "w") as f:
        f.write(f"""# vzrad2 dataset mapped to 4 main classes
# Original dataset: {input_dir}

path: {output_dir}

train: train/images
val: valid/images
test: test/images

nc: 4

names:
  0: Caries
  1: Deep Caries
  2: Periapical Lesion
  3: Impacted Tooth
""")

    print(f"\n[OK] Dataset mapped successfully")
    print(f"[INFO] Output directory: {output_dir}")
    print(f"[INFO] New data.yaml: {new_data_yaml}")
    print(f"\n[INFO] Next steps:")
    print(f"       1. Review the mapped dataset")
    print(f"       2. Run training with: python scripts/train-yolo.py --data {new_data_yaml}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
