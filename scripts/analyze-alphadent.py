#!/usr/bin/env python3
"""
AlphaDent Dataset Analysis Script
Analyzes the AlphaDent dataset for structure, labels, duplicates, and issues.
"""

import os
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Set
import json

# Dataset paths
DATASET_ROOT = Path("data/intraoral/AlphaDent")
IMAGES_DIR = DATASET_ROOT / "images"
LABELS_DIR = DATASET_ROOT / "labels"
YAML_FILE = DATASET_ROOT / "yolo_seg_train.yaml"

def analyze_structure():
    """Analyze basic dataset structure."""
    print("=" * 80)
    print("ALPHADENT DATASET STRUCTURE ANALYSIS")
    print("=" * 80)
    
    # Image counts
    train_images = list((IMAGES_DIR / "train").glob("*.*")) if (IMAGES_DIR / "train").exists() else []
    valid_images = list((IMAGES_DIR / "valid").glob("*.*")) if (IMAGES_DIR / "valid").exists() else []
    test_images = list((IMAGES_DIR / "test").glob("*.*")) if (IMAGES_DIR / "test").exists() else []
    
    print(f"\nIMAGES:")
    print(f"  Train: {len(train_images)} images")
    print(f"  Valid: {len(valid_images)} images")
    print(f"  Test: {len(test_images)} images")
    print(f"  Total: {len(train_images) + len(valid_images) + len(test_images)} images")
    
    # Label counts
    train_labels = list((LABELS_DIR / "train").glob("*.txt")) if (LABELS_DIR / "train").exists() else []
    valid_labels = list((LABELS_DIR / "valid").glob("*.txt")) if (LABELS_DIR / "valid").exists() else []
    test_labels = list((LABELS_DIR / "test").glob("*.txt")) if (LABELS_DIR / "test").exists() else []
    
    print(f"\nLABELS:")
    print(f"  Train: {len(train_labels)} labels")
    print(f"  Valid: {len(valid_labels)} labels")
    print(f"  Test: {len(test_labels)} labels")
    print(f"  Total: {len(train_labels) + len(valid_labels) + len(test_labels)} labels")
    
    # Image extensions
    train_exts = Counter([img.suffix for img in train_images])
    valid_exts = Counter([img.suffix for img in valid_images])
    test_exts = Counter([img.suffix for img in test_images])
    
    print(f"\nIMAGE EXTENSIONS:")
    print(f"  Train: {dict(train_exts)}")
    print(f"  Valid: {dict(valid_exts)}")
    print(f"  Test: {dict(test_exts)}")
    
    return {
        'train_images': train_images,
        'valid_images': valid_images,
        'test_images': test_images,
        'train_labels': train_labels,
        'valid_labels': valid_labels,
        'test_labels': test_labels,
    }

def analyze_label_format(label_files: List[Path], split_name: str):
    """Analyze YOLO label format to determine Detection vs Segmentation."""
    print(f"\n{'=' * 80}")
    print(f"LABEL FORMAT ANALYSIS - {split_name}")
    print("=" * 80)
    
    if not label_files:
        print(f"  No labels found in {split_name}")
        return {'task_type': 'unknown', 'classes': set(), 'class_distribution': Counter()}
    
    task_type = None
    classes = set()
    class_distribution = Counter()
    invalid_labels = []
    out_of_bounds = []
    
    for label_file in label_files[:50]:  # Sample first 50 for format detection
        try:
            with open(label_file, 'r') as f:
                lines = [line.strip() for line in f if line.strip()]
            
            if not lines:
                invalid_labels.append((label_file.name, "empty file"))
                continue
            
            for line in lines:
                parts = line.split()
                if len(parts) < 5:
                    invalid_labels.append((label_file.name, f"too few values: {len(parts)}"))
                    continue
                
                class_id = int(parts[0])
                classes.add(class_id)
                class_distribution[class_id] += 1
                
                # Determine task type
                if len(parts) == 5:
                    # Detection: class x_center y_center width height
                    task_type = "detection"
                elif len(parts) > 5 and len(parts) % 2 == 1:
                    # Segmentation: class x1 y1 x2 y2 x3 y3 ...
                    task_type = "segmentation"
                else:
                    invalid_labels.append((label_file.name, f"invalid format: {len(parts)} values"))
                
                # Check for out of bounds (for both formats)
                coords = list(map(float, parts[1:]))
                for coord in coords:
                    if coord < 0 or coord > 1:
                        out_of_bounds.append((label_file.name, class_id, coord))
                        break
                        
        except Exception as e:
            invalid_labels.append((label_file.name, str(e)))
    
    print(f"  Task Type: {task_type}")
    print(f"  Classes Found: {sorted(classes)}")
    print(f"  Class Distribution: {dict(class_distribution)}")
    print(f"  Invalid Labels: {len(invalid_labels)}")
    print(f"  Out of Bounds: {len(out_of_bounds)}")
    
    if invalid_labels:
        print(f"  Sample Invalid Labels:")
        for name, reason in invalid_labels[:5]:
            print(f"    - {name}: {reason}")
    
    return {
        'task_type': task_type,
        'classes': classes,
        'class_distribution': class_distribution,
        'invalid_labels': invalid_labels,
        'out_of_bounds': out_of_bounds,
    }

def analyze_yaml():
    """Analyze YAML configuration."""
    print(f"\n{'=' * 80}")
    print("YAML CONFIGURATION ANALYSIS")
    print("=" * 80)
    
    if not YAML_FILE.exists():
        print(f"  YAML file not found: {YAML_FILE}")
        return None
    
    with open(YAML_FILE, 'r') as f:
        yaml_content = f.read()
    
    print(f"  Content:")
    print(f"    {yaml_content}")
    
    # Parse YAML manually (simple parsing)
    lines = yaml_content.strip().split('\n')
    config = {}
    names = {}
    
    for line in lines:
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            if key == 'names':
                # Parse names section
                continue
            elif value and value[0].isdigit():
                # Class name mapping
                class_id = int(value.split()[0])
                class_name = ' '.join(value.split()[1:])
                names[class_id] = class_name
            else:
                config[key] = value
    
    print(f"\n  Parsed Config:")
    print(f"    Path: {config.get('path', 'N/A')}")
    print(f"    Train: {config.get('train', 'N/A')}")
    print(f"    Val: {config.get('val', 'N/A')}")
    print(f"    Test: {config.get('test', 'N/A')}")
    print(f"    NC: {len(names)}")
    print(f"    Names: {names}")
    
    return {'config': config, 'names': names}

def check_correspondence(images: List[Path], labels: List[Path], split_name: str):
    """Check image-label correspondence."""
    print(f"\n{'=' * 80}")
    print(f"IMAGE-LABEL CORRESPONDENCE - {split_name}")
    print("=" * 80)
    
    image_names = set([img.stem for img in images])
    label_names = set([lbl.stem for lbl in labels])
    
    images_without_labels = image_names - label_names
    labels_without_images = label_names - image_names
    
    print(f"  Images without labels: {len(images_without_labels)}")
    print(f"  Labels without images: {len(labels_without_images)}")
    
    if images_without_labels:
        print(f"  Sample images without labels:")
        for name in sorted(list(images_without_labels))[:10]:
            print(f"    - {name}")
    
    if labels_without_images:
        print(f"  Sample labels without images:")
        for name in sorted(list(labels_without_images))[:10]:
            print(f"    - {name}")
    
    return {
        'images_without_labels': images_without_labels,
        'labels_without_images': labels_without_images,
    }

def check_duplicates(images: List[Path], split_name: str):
    """Check for duplicate images."""
    print(f"\n{'=' * 80}")
    print(f"DUPLICATE CHECK - {split_name}")
    print("=" * 80)
    
    name_counts = Counter([img.name for img in images])
    duplicates = {name: count for name, count in name_counts.items() if count > 1}
    
    print(f"  Duplicate images: {len(duplicates)}")
    
    if duplicates:
        print(f"  Duplicates:")
        for name, count in duplicates.items():
            print(f"    - {name}: {count} copies")
    
    return duplicates

def check_data_leakage(train_images: List[Path], valid_images: List[Path], test_images: List[Path]):
    """Check for data leakage between splits."""
    print(f"\n{'=' * 80}")
    print("DATA LEAKAGE CHECK")
    print("=" * 80)
    
    train_names = set([img.name for img in train_images])
    valid_names = set([img.name for img in valid_images])
    test_names = set([img.name for img in test_images])
    
    train_valid_leakage = train_names & valid_names
    train_test_leakage = train_names & test_names
    valid_test_leakage = valid_names & test_names
    
    print(f"  Train-Valid leakage: {len(train_valid_leakage)}")
    print(f"  Train-Test leakage: {len(train_test_leakage)}")
    print(f"  Valid-Test leakage: {len(valid_test_leakage)}")
    
    leakage = {
        'train_valid': train_valid_leakage,
        'train_test': train_test_leakage,
        'valid_test': valid_test_leakage,
    }
    
    if train_valid_leakage:
        print(f"  Train-Valid leaked images:")
        for name in sorted(list(train_valid_leakage))[:10]:
            print(f"    - {name}")
    
    if train_test_leakage:
        print(f"  Train-Test leaked images:")
        for name in sorted(list(train_test_leakage))[:10]:
            print(f"    - {name}")
    
    if valid_test_leakage:
        print(f"  Valid-Test leaked images:")
        for name in sorted(list(valid_test_leakage))[:10]:
            print(f"    - {name}")
    
    return leakage

def main():
    """Main analysis function."""
    # Analyze structure
    structure = analyze_structure()
    
    # Analyze YAML
    yaml_info = analyze_yaml()
    
    # Analyze label formats
    train_label_info = analyze_label_format(structure['train_labels'], 'train')
    valid_label_info = analyze_label_format(structure['valid_labels'], 'valid')
    test_label_info = analyze_label_format(structure['test_labels'], 'test')
    
    # Check correspondence
    train_corr = check_correspondence(structure['train_images'], structure['train_labels'], 'train')
    valid_corr = check_correspondence(structure['valid_images'], structure['valid_labels'], 'valid')
    test_corr = check_correspondence(structure['test_images'], structure['test_labels'], 'test')
    
    # Check duplicates
    train_dups = check_duplicates(structure['train_images'], 'train')
    valid_dups = check_duplicates(structure['valid_images'], 'valid')
    test_dups = check_duplicates(structure['test_images'], 'test')
    
    # Check data leakage
    leakage = check_data_leakage(structure['train_images'], structure['valid_images'], structure['test_images'])
    
    # Summary determination
    print(f"\n{'=' * 80}")
    print("SUMMARY")
    print("=" * 80)
    
    task_type = train_label_info['task_type'] or valid_label_info['task_type']
    print(f"  Task Type: {task_type}")
    print(f"  Total Images: {len(structure['train_images']) + len(structure['valid_images']) + len(structure['test_images'])}")
    print(f"  Total Labels: {len(structure['train_labels']) + len(structure['valid_labels']) + len(structure['test_labels'])}")
    
    all_classes = train_label_info['classes'] | valid_label_info['classes'] | test_label_info['classes']
    print(f"  Classes: {sorted(all_classes)}")
    
    has_leakage = any([leakage['train_valid'], leakage['train_test'], leakage['valid_test']])
    print(f"  Data Leakage: {'YES' if has_leakage else 'NO'}")
    
    has_missing_labels = any([train_corr['images_without_labels'], valid_corr['images_without_labels'], test_corr['images_without_labels']])
    print(f"  Missing Labels: {'YES' if has_missing_labels else 'NO'}")
    
    print(f"\n{'=' * 80}")
    print("ANALYSIS COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
