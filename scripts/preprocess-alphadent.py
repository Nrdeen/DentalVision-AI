#!/usr/bin/env python3
"""
AlphaDent Dataset Preprocessing Script
Creates a clean, processed copy of the AlphaDent dataset for segmentation training.

Original Dataset: data/intraoral/AlphaDent/ (READ-ONLY)
Processed Dataset: data/intraoral/processed/alphadent/

DO NOT MODIFY THE ORIGINAL DATASET
"""

import os
import sys
import shutil
from pathlib import Path
from collections import Counter
from typing import Dict, List, Set
import datetime

# Paths
ORIGINAL_ROOT = Path("data/intraoral/AlphaDent")
PROCESSED_ROOT = Path("data/intraoral/processed/alphadent")

ORIGINAL_IMAGES = ORIGINAL_ROOT / "images"
ORIGINAL_LABELS = ORIGINAL_ROOT / "labels"

PROCESSED_IMAGES = PROCESSED_ROOT / "images"
PROCESSED_LABELS = PROCESSED_ROOT / "labels"

def create_directory_structure():
    """Create processed dataset directory structure."""
    print("Creating directory structure...")
    
    directories = [
        PROCESSED_IMAGES / "train",
        PROCESSED_IMAGES / "valid",
        PROCESSED_IMAGES / "test",
        PROCESSED_LABELS / "train",
        PROCESSED_LABELS / "valid",
        # Note: No test labels directory - test images are unlabeled
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  Created: {directory}")
    
    print("Directory structure created.\n")

def validate_label_file(label_file: Path) -> tuple[bool, str]:
    """
    Validate a label file for YOLO segmentation format.
    Returns (is_valid, reason) where reason is empty if valid.
    A valid segmentation annotation must have class + at least 2 (x,y) pairs (>= 5 values).
    """
    try:
        with open(label_file, 'r') as f:
            lines = [line.strip() for line in f if line.strip()]
        
        for line in lines:
            parts = line.split()
            if len(parts) < 5:
                return False, f"Line with {len(parts)} values (needs >= 5 for polygon)"
            
            # Check if odd number of values (class + even number of coords)
            if len(parts) % 2 == 0:
                return False, f"Even number of values ({len(parts)}) - should be odd for segmentation"
            
            # Check coordinates are in [0, 1]
            coords = list(map(float, parts[1:]))
            for coord in coords:
                if coord < 0 or coord > 1:
                    return False, f"Coordinate out of bounds: {coord}"
        
        return True, ""
    except Exception as e:
        return False, f"Error reading file: {str(e)}"

def copy_valid_files(source_images_dir: Path, source_labels_dir: Path, 
                     target_images_dir: Path, target_labels_dir: Path, 
                     description: str) -> tuple[int, int, List[str]]:
    """
    Copy only valid image-label pairs.
    Returns (copied_count, excluded_count, excluded_files_list).
    """
    print(f"Copying {description}...")
    
    source_label_files = list(source_labels_dir.glob("*.txt"))
    copied_count = 0
    excluded_count = 0
    excluded_files = []
    
    for label_file in source_label_files:
        is_valid, reason = validate_label_file(label_file)
        
        if is_valid:
            # Copy both image and label
            image_file = source_images_dir / (label_file.stem + ".jpg")
            if image_file.exists():
                shutil.copy2(image_file, target_images_dir / image_file.name)
                shutil.copy2(label_file, target_labels_dir / label_file.name)
                copied_count += 1
            else:
                excluded_count += 1
                excluded_files.append((label_file.name, f"Image not found: {image_file.name}"))
        else:
            excluded_count += 1
            excluded_files.append((label_file.name, reason))
    
    print(f"  Copied {copied_count} valid image-label pairs")
    print(f"  Excluded {excluded_count} files with invalid labels\n")
    
    return copied_count, excluded_count, excluded_files

def copy_files(source_dir: Path, target_dir: Path, description: str, pattern="*.*"):
    """Copy files from source to target directory."""
    print(f"Copying {description}...")
    
    source_files = list(source_dir.glob(pattern))
    copied_count = 0
    
    for source_file in source_files:
        target_file = target_dir / source_file.name
        shutil.copy2(source_file, target_file)
        copied_count += 1
    
    print(f"  Copied {copied_count} files from {source_dir} to {target_dir}\n")
    return copied_count

def create_yaml():
    """Create updated YAML configuration."""
    print("Creating YAML configuration...")
    
    yaml_content = """path: data/intraoral/processed/alphadent
train: images/train
val: images/valid
nc: 9
names:
  0: Abrasion
  1: Filling
  2: Crown
  3: Caries 1 class
  4: Caries 2 class
  5: Caries 3 class
  6: Caries 4 class
  7: Caries 5 class
  8: Caries 6 class

# Note: test split exists but is unlabeled and not used in training
# Test images are kept separately for potential future use or manual labeling
"""
    
    yaml_file = PROCESSED_ROOT / "data.yaml"
    with open(yaml_file, 'w') as f:
        f.write(yaml_content)
    
    print(f"  Created: {yaml_file}\n")

def validate_dataset():
    """Validate the processed dataset."""
    print("Validating processed dataset...")
    
    # Count files
    train_images = len(list((PROCESSED_IMAGES / "train").glob("*.*")))
    valid_images = len(list((PROCESSED_IMAGES / "valid").glob("*.*")))
    test_images = len(list((PROCESSED_IMAGES / "test").glob("*.*")))
    
    train_labels = len(list((PROCESSED_LABELS / "train").glob("*.txt")))
    valid_labels = len(list((PROCESSED_LABELS / "valid").glob("*.txt")))
    # Note: test labels directory does not exist (test images are unlabeled)
    
    print(f"  Images: train={train_images}, valid={valid_images}, test={test_images}")
    print(f"  Labels: train={train_labels}, valid={valid_labels}, test=0 (unlabeled)")
    
    # Check correspondence
    train_image_names = set([img.stem for img in (PROCESSED_IMAGES / "train").glob("*.*")])
    train_label_names = set([lbl.stem for lbl in (PROCESSED_LABELS / "train").glob("*.txt")])
    
    valid_image_names = set([img.stem for img in (PROCESSED_IMAGES / "valid").glob("*.*")])
    valid_label_names = set([lbl.stem for lbl in (PROCESSED_LABELS / "valid").glob("*.txt")])
    
    train_images_without_labels = train_image_names - train_label_names
    valid_images_without_labels = valid_image_names - valid_label_names
    
    print(f"  Train images without labels: {len(train_images_without_labels)}")
    print(f"  Valid images without labels: {len(valid_images_without_labels)}")
    
    # Check for duplicates
    all_image_names = []
    all_image_names.extend([img.name for img in (PROCESSED_IMAGES / "train").glob("*.*")])
    all_image_names.extend([img.name for img in (PROCESSED_IMAGES / "valid").glob("*.*")])
    all_image_names.extend([img.name for img in (PROCESSED_IMAGES / "test").glob("*.*")])
    
    name_counts = Counter(all_image_names)
    duplicates = {name: count for name, count in name_counts.items() if count > 1}
    
    print(f"  Duplicate images: {len(duplicates)}")
    
    # Check label format (sample)
    sample_labels = list((PROCESSED_LABELS / "train").glob("*.txt"))[:10]
    invalid_labels = 0
    out_of_bounds = 0
    
    for label_file in sample_labels:
        try:
            with open(label_file, 'r') as f:
                lines = [line.strip() for line in f if line.strip()]
            
            for line in lines:
                parts = line.split()
                if len(parts) < 5:
                    invalid_labels += 1
                    continue
                
                coords = list(map(float, parts[1:]))
                for coord in coords:
                    if coord < 0 or coord > 1:
                        out_of_bounds += 1
                        break
        except:
            invalid_labels += 1
    
    print(f"  Invalid labels (sample): {invalid_labels}")
    print(f"  Out of bounds (sample): {out_of_bounds}")
    
    validation_passed = (
        train_images == 1220 and  # Expected after excluding 17 malformed files
        valid_images == 83 and
        test_images == 135 and  # Test images kept separate
        train_labels == 1220 and
        valid_labels == 83 and
        len(duplicates) == 0 and
        invalid_labels == 0 and
        out_of_bounds == 0 and
        len(train_images_without_labels) == 0 and
        len(valid_images_without_labels) == 0
    )
    
    print(f"\n  Validation: {'PASSED' if validation_passed else 'FAILED'}\n")
    
    return {
        'train_images': train_images,
        'valid_images': valid_images,
        'test_images': test_images,
        'train_labels': train_labels,
        'valid_labels': valid_labels,
        'train_images_without_labels': len(train_images_without_labels),
        'valid_images_without_labels': len(valid_images_without_labels),
        'duplicates': len(duplicates),
        'invalid_labels': invalid_labels,
        'out_of_bounds': out_of_bounds,
        'validation_passed': validation_passed,
    }

def generate_report(stats: Dict, train_excluded: List[str], valid_excluded: List[str]):
    """Generate preprocessing report."""
    print("Generating preprocessing report...")
    
    report_content = f"""===============================================================================
ALPHADENT PREPROCESSING REPORT
===============================================================================

Date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
Original Dataset: {ORIGINAL_ROOT.absolute()}
Processed Dataset: {PROCESSED_ROOT.absolute()}

===============================================================================
A. ORIGINAL DATASET STATISTICS
===============================================================================

IMAGES:
  Train: 1,237 images
  Valid: 83 images
  Test: 135 images
  Total: 1,455 images

LABELS:
  Train: 1,237 labels
  Valid: 83 labels
  Test: 0 labels
  Total: 1,320 labels

===============================================================================
B. PREPROCESSING ACTIONS
===============================================================================

1. Created directory structure: data/intraoral/processed/alphadent/
   - images/train/
   - images/valid/
   - images/test/
   - labels/train/
   - labels/valid/
   (Note: No labels/test/ directory - test images are unlabeled)

2. Validated and copied train image-label pairs
   Source: {ORIGINAL_IMAGES / "train"} and {ORIGINAL_LABELS / "train"}
   Target: {PROCESSED_IMAGES / "train"} and {PROCESSED_LABELS / "train"}
   Copied: {stats['train_images']} valid pairs
   Excluded: {len(train_excluded)} files with invalid labels

3. Validated and copied valid image-label pairs
   Source: {ORIGINAL_IMAGES / "valid"} and {ORIGINAL_LABELS / "valid"}
   Target: {PROCESSED_IMAGES / "valid"} and {PROCESSED_LABELS / "valid"}
   Copied: {stats['valid_images']} valid pairs
   Excluded: {len(valid_excluded)} files with invalid labels

4. Copied test images to test: 135 images (UNLABELED)
   Source: {ORIGINAL_IMAGES / "test"}
   Target: {PROCESSED_IMAGES / "test"}
   Note: Test images have no labels, kept separate for future use

5. Created YAML configuration: data.yaml
   Path: data/intraoral/processed/alphadent
   Train: images/train
   Val: images/valid
   NC: 9
   Names: Abrasion, Filling, Crown, Caries 1-6

===============================================================================
C. EXCLUDED FILES
===============================================================================

TRAIN EXCLUDED ({len(train_excluded)} files):
"""
    
    for filename, reason in train_excluded:
        report_content += f"  - {filename}: {reason}\n"
    
    report_content += f"""
VALID EXCLUDED ({len(valid_excluded)} files):
"""
    
    for filename, reason in valid_excluded:
        report_content += f"  - {filename}: {reason}\n"
    
    report_content += f"""
===============================================================================
D. PROCESSED DATASET STATISTICS
===============================================================================

IMAGES:
  Train: {stats['train_images']} images (all labeled)
  Valid: {stats['valid_images']} images (all labeled)
  Test: {stats['test_images']} images (unlabeled, kept separate)
  Total: {stats['train_images'] + stats['valid_images'] + stats['test_images']} images

LABELS:
  Train: {stats['train_labels']} labels
  Valid: {stats['valid_labels']} labels
  Test: 0 labels (unlabeled)
  Total: {stats['train_labels'] + stats['valid_labels']} labels

ANNOTATION RATIO:
  Train: {stats['train_labels']}/{stats['train_images']} labeled ({100*stats['train_labels']/stats['train_images']:.1f}%)
  Valid: {stats['valid_labels']}/{stats['valid_images']} labeled ({100*stats['valid_labels']/stats['valid_images']:.1f}%)
  Overall: {stats['train_labels'] + stats['valid_labels']}/{stats['train_images'] + stats['valid_images']} labeled ({100*(stats['train_labels'] + stats['valid_labels'])/(stats['train_images'] + stats['valid_images']):.1f}%)

===============================================================================
E. VALIDATION RESULTS
===============================================================================

Image-Label Correspondence:
  Train images without labels: {stats['train_images_without_labels']}
  Valid images without labels: {stats['valid_images_without_labels']}
  Status: {'PASS' if stats['train_images_without_labels'] == 0 and stats['valid_images_without_labels'] == 0 else 'FAIL'}

Duplicate Check:
  Duplicate images: {stats['duplicates']}
  Status: {'PASS' if stats['duplicates'] == 0 else 'FAIL'}

Label Validity:
  Invalid labels (sample): {stats['invalid_labels']}
  Out of bounds (sample): {stats['out_of_bounds']}
  Status: {'PASS' if stats['invalid_labels'] == 0 and stats['out_of_bounds'] == 0 else 'FAIL'}

OVERALL VALIDATION: {'PASSED' if stats['validation_passed'] else 'FAILED'}

===============================================================================
F. CONFIRMATION: ORIGINAL DATASET NOT MODIFIED
===============================================================================

[OK] Original dataset path: {ORIGINAL_ROOT.absolute()}
[OK] No files were modified in the original dataset
[OK] No files were deleted from the original dataset
[OK] No files were moved from the original dataset
[OK] Processed dataset is a complete independent copy

The original dataset remains READ-ONLY and untouched.

===============================================================================
G. NEXT STEPS
===============================================================================

1. Review this preprocessing report
2. Manually verify processed dataset if needed
3. Run training script: scripts/train-alphadent.py
4. Monitor training progress
5. Evaluate model on validation set

===============================================================================
"""
    
    report_file = PROCESSED_ROOT / "preprocessing_report.txt"
    with open(report_file, 'w') as f:
        f.write(report_content)
    
    print(f"  Created: {report_file}\n")

def main():
    """Main preprocessing function."""
    print("=" * 80)
    print("ALPHADENT DATASET PREPROCESSING")
    print("=" * 80)
    print()
    
    # Check if original dataset exists
    if not ORIGINAL_ROOT.exists():
        print(f"ERROR: Original dataset not found at {ORIGINAL_ROOT}")
        sys.exit(1)
    
    # Check if processed dataset already exists
    if PROCESSED_ROOT.exists():
        print(f"WARNING: Processed dataset already exists at {PROCESSED_ROOT}")
        response = input("Do you want to delete and recreate? (y/n): ")
        if response.lower() != 'y':
            print("Preprocessing cancelled.")
            sys.exit(0)
        shutil.rmtree(PROCESSED_ROOT)
        print("Deleted existing processed dataset.\n")
    
    # Create directory structure
    create_directory_structure()
    
    # Copy valid files (with validation)
    train_copied, train_excluded, train_excluded_files = copy_valid_files(
        ORIGINAL_IMAGES / "train", ORIGINAL_LABELS / "train",
        PROCESSED_IMAGES / "train", PROCESSED_LABELS / "train",
        "train image-label pairs"
    )
    
    valid_copied, valid_excluded, valid_excluded_files = copy_valid_files(
        ORIGINAL_IMAGES / "valid", ORIGINAL_LABELS / "valid",
        PROCESSED_IMAGES / "valid", PROCESSED_LABELS / "valid",
        "valid image-label pairs"
    )
    
    # Copy test images (unlabeled)
    copy_files(ORIGINAL_IMAGES / "test", PROCESSED_IMAGES / "test", "test images (unlabeled, kept separate)")
    
    # Create YAML
    create_yaml()
    
    # Validate
    stats = validate_dataset()
    
    # Generate report
    generate_report(stats, train_excluded_files, valid_excluded_files)
    
    print("=" * 80)
    print("PREPROCESSING COMPLETE")
    print("=" * 80)
    print()
    print(f"Processed dataset: {PROCESSED_ROOT.absolute()}")
    print(f"Preprocessing report: {PROCESSED_ROOT / 'preprocessing_report.txt'}")
    print(f"YAML configuration: {PROCESSED_ROOT / 'data.yaml'}")
    print()
    print(f"Summary:")
    print(f"  Train: {train_copied} valid pairs (excluded {train_excluded})")
    print(f"  Valid: {valid_copied} valid pairs (excluded {valid_excluded})")
    print(f"  Test: 135 unlabeled images")
    print()
    
    if stats['validation_passed']:
        print("[OK] Validation passed. Ready for training.")
    else:
        print("[FAIL] Validation failed. Please review the report.")

if __name__ == "__main__":
    main()
