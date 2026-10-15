import os
import shutil
import hashlib
import random
from PIL import Image
from collections import defaultdict

def get_image_files(path):
    """Get all image files (JPG, JPEG, PNG) from a directory."""
    image_files = []
    for f in os.listdir(path):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            image_files.append(f)
    return sorted(image_files)

def compute_sha256(path, image_files):
    """Compute SHA-256 hash for each image."""
    hashes = {}
    for f in image_files:
        try:
            img_path = os.path.join(path, f)
            with open(img_path, 'rb') as file:
                file_hash = hashlib.sha256(file.read()).hexdigest()
            hashes[f] = file_hash
        except Exception as e:
            hashes[f] = f"ERROR: {e}"
    return hashes

def convert_png_to_jpg(src_path, dst_path):
    """Convert PNG to JPG."""
    try:
        with Image.open(src_path) as img:
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            else:
                img = img.convert('RGB')
            img.save(dst_path, 'JPEG', quality=95)
        return True
    except Exception as e:
        print(f"Error converting {src_path}: {e}")
        return False

def main():
    print("=" * 60)
    print("MIO CLASSIFICATION PREPROCESSING V3")
    print("=" * 60)

    # Configuration
    source_dirs = {
        "GINGIVITIS": "data/intraoral/GINGIVITIS",
        "PERIODONTITIS": "data/intraoral/PERIODONTITIS",
        "SANO": "data/intraoral/SANO"
    }
    
    target_base = "data/intraoral/processed/MIO_classification"
    
    # Step 1: Compute hashes for all images
    print("\nStep 1: Computing hashes...")
    all_hashes = {}
    all_files = {}
    for name, path in source_dirs.items():
        if os.path.exists(path):
            files = get_image_files(path)
            all_files[name] = files
            hashes = compute_sha256(path, files)
            all_hashes[name] = hashes
            print(f"  {name}: {len(files)} files")

    # Step 2: Find cross-class duplicates (hash appears in multiple classes)
    print("\nStep 2: Finding cross-class duplicates...")
    hash_to_classes = defaultdict(list)
    for name, hashes in all_hashes.items():
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                hash_to_classes[h].append((name, f))
    
    cross_class_hashes = {h for h, items in hash_to_classes.items() if len(set(n for n, f in items)) > 1}
    cross_class_files = set()
    for h in cross_class_hashes:
        for name, f in hash_to_classes[h]:
            cross_class_files.add((name, f))
    
    print(f"  Found {len(cross_class_hashes)} cross-class duplicate groups")
    print(f"  Total files to exclude: {len(cross_class_files)}")

    # Step 3: Find within-class duplicates and build keep list
    print("\nStep 3: Building keep list...")
    files_to_keep = {}
    for name, hashes in all_hashes.items():
        # Group by hash within this class
        hash_to_files = defaultdict(list)
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                hash_to_files[h].append(f)
        
        # For each hash, keep first file, exclude rest
        keep_list = []
        for h, files in hash_to_files.items():
            # Check if this hash is a cross-class duplicate
            if h in cross_class_hashes:
                # Exclude ALL files with this hash
                continue
            # Keep first, skip rest
            keep_list.append(files[0])
        
        files_to_keep[name] = keep_list
        print(f"  {name}: {len(keep_list)} files to keep (original: {len(all_files[name])})")

    # Step 4: Shuffle each class
    print("\nStep 4: Shuffling each class...")
    random.seed(42)
    for name in files_to_keep:
        random.shuffle(files_to_keep[name])
        print(f"  {name}: shuffled")

    # Step 5: Stratified split
    print("\nStep 5: Creating stratified split...")
    splits = {}
    for name, files in files_to_keep.items():
        count = len(files)
        train = int(count * 0.70)
        val = int(count * 0.15)
        test = count - train - val
        splits[name] = {
            "train": files[:train],
            "val": files[train:train+val],
            "test": files[train+val:]
        }
        print(f"  {name}: train={len(splits[name]['train'])}, val={len(splits[name]['val'])}, test={len(splits[name]['test'])}")

    # Step 6: Create target directories
    print("\nStep 6: Creating target directories...")
    class_map = {
        "SANO": "healthy",
        "GINGIVITIS": "gingivitis",
        "PERIODONTITIS": "periodontitis"
    }
    
    for split in ["train", "val", "test"]:
        for class_name in ["healthy", "gingivitis", "periodontitis"]:
            dir_path = os.path.join(target_base, split, class_name)
            os.makedirs(dir_path, exist_ok=True)

    # Step 7: Copy files
    print("\nStep 7: Copying files...")
    png_converted = []
    
    for name, split_files in splits.items():
        target_class = class_map[name]
        for split, files in split_files.items():
            for f in files:
                src_path = os.path.join(source_dirs[name], f)
                
                if name == "SANO" and f.lower().endswith('.png'):
                    new_name = f.replace('.png', '.jpg').replace('.PNG', '.JPG')
                    dst_path = os.path.join(target_base, split, target_class, new_name)
                    if convert_png_to_jpg(src_path, dst_path):
                        png_converted.append(f)
                    else:
                        print(f"  ERROR: Failed to convert {f}")
                else:
                    dst_path = os.path.join(target_base, split, target_class, f)
                    shutil.copy2(src_path, dst_path)
    
    print(f"  Converted {len(png_converted)} PNG files to JPG")

    # Step 8: Create data.yaml
    print("\nStep 8: Creating data.yaml...")
    yaml_content = f"""path: {target_base.replace(os.sep, '/')}
train: train
val: val
test: test

nc: 3
names:
  0: healthy
  1: gingivitis
  2: periodontitis
"""
    
    yaml_path = os.path.join(target_base, "data.yaml")
    with open(yaml_path, 'w') as f:
        f.write(yaml_content)
    print(f"  Created: {yaml_path}")

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
