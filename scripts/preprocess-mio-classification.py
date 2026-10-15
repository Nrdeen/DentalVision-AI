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
                # Convert to RGB if necessary
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
    print("MIO CLASSIFICATION PREPROCESSING")
    print("=" * 60)

    # Configuration
    source_dirs = {
        "GINGIVITIS": "data/intraoral/GINGIVITIS",
        "PERIODONTITIS": "data/intraoral/PERIODONTITIS",
        "SANO": "data/intraoral/SANO"
    }
    
    target_base = "data/intraoral/processed/MIO_classification"
    
    # Cross-class duplicates to exclude (all files in these groups)
    cross_class_exclude = {
        "28985c408a4a1ecd": ["GINGIVITIS/553.jpg", "PERIODONTITIS/617.jpg"],
        "59059b03df14edfe": ["GINGIVITIS/547.jpg", "SANO/503.jpg", "SANO/518.jpg"],
        "a74edfac4ccbb3dc": ["GINGIVITIS/549.jpg", "PERIODONTITIS/600.jpg"],
        "c36e373855f8956f": ["GINGIVITIS/556.jpg", "PERIODONTITIS/641.jpg"],
        "f70b06a8eaaf10fc": ["GINGIVITIS/562.jpg", "PERIODONTITIS/677.jpg"]
    }
    
    # Within-class duplicates to remove (keep first, remove rest)
    # Note: 503.jpg and 518.jpg are in cross-class exclude, so NOT in this list
    # Original SANO had 23 files to remove, but 2 are cross-class, so 21 here
    within_class_remove = {
        "GINGIVITIS": ["564.jpg", "824.jpg", "825.jpg"],
        "PERIODONTITIS": ["827.JPG", "829.jpg", "830.jpg", "768.jpg", "828.jpg"],
        "SANO": ["812.JPG", "813.JPG", "814.JPG", "815.JPG", "816.JPG", "818.JPG", 
                "817.JPG", "530.jpg", "535.jpg", "819.jpg", "531.jpg",
                "532.jpg", "533.jpg", "534.jpg", "536.jpg", "820.jpg", "537.jpg",
                "821.jpg", "822.jpg", "538.jpg", "823.jpg", "539.jpg"]
    }
    
    # Fix: SANO should have 21 files to remove (23 total - 2 cross-class = 21)
    # Need to include 818.JPG which is duplicate of 429 - SI.JPG
    within_class_remove["SANO"] = ["812.JPG", "813.JPG", "814.JPG", "815.JPG", "816.JPG", 
                "817.JPG", "818.JPG", "530.jpg", "535.jpg", "819.jpg", "531.jpg",
                "532.jpg", "533.jpg", "534.jpg", "536.jpg", "820.jpg", "537.jpg",
                "821.jpg", "822.jpg", "538.jpg", "823.jpg", "539.jpg"]
    
    # Debug: Print counts
    print("\nDEBUG: Duplicate removal counts:")
    for name, files in within_class_remove.items():
        print(f"  {name}: {len(files)} within-class to remove")
    
    cross_excluded_count = sum(len(files) for files in cross_class_exclude.values())
    print(f"  Cross-class excluded: {cross_excluded_count}")

    # Step 1: Compute hashes and get files
    print("\nStep 1: Computing hashes and getting files...")
    all_hashes = {}
    all_files = {}
    for name, path in source_dirs.items():
        if os.path.exists(path):
            files = get_image_files(path)
            all_files[name] = files
            hashes = compute_sha256(path, files)
            all_hashes[name] = hashes
            print(f"  {name}: {len(files)} files")

    # Step 2: Build list of files to keep
    print("\nStep 2: Building list of files to keep...")
    files_to_keep = {}
    for name, files in all_files.items():
        keep_list = []
        for f in files:
            # Check if in cross-class exclude list
            file_key = f"{name}/{f}"
            excluded = False
            for h, excluded_files in cross_class_exclude.items():
                if file_key in excluded_files:
                    excluded = True
                    break
            
            # Check if in within-class remove list
            if not excluded and f in within_class_remove[name]:
                excluded = True
            
            if not excluded:
                keep_list.append(f)
        
        files_to_keep[name] = keep_list
        print(f"  {name}: {len(keep_list)} files to keep")

    # Step 3: Shuffle each class
    print("\nStep 3: Shuffling each class...")
    random.seed(42)  # For reproducibility
    for name in files_to_keep:
        random.shuffle(files_to_keep[name])
        print(f"  {name}: shuffled")

    # Step 4: Stratified split
    print("\nStep 4: Creating stratified split...")
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

    # Step 5: Create target directories
    print("\nStep 5: Creating target directories...")
    class_map = {
        "SANO": "healthy",
        "GINGIVITIS": "gingivitis",
        "PERIODONTITIS": "periodontitis"
    }
    
    for split in ["train", "val", "test"]:
        for class_name in ["healthy", "gingivitis", "periodontitis"]:
            dir_path = os.path.join(target_base, split, class_name)
            os.makedirs(dir_path, exist_ok=True)
            print(f"  Created: {dir_path}")

    # Step 6: Copy files (with PNG conversion for SANO)
    print("\nStep 6: Copying files...")
    png_converted = []
    
    for name, split_files in splits.items():
        target_class = class_map[name]
        for split, files in split_files.items():
            for f in files:
                src_path = os.path.join(source_dirs[name], f)
                
                # Handle PNG conversion for SANO
                if name == "SANO" and f.lower().endswith('.png'):
                    new_name = f.replace('.png', '.jpg').replace('.PNG', '.JPG')
                    dst_path = os.path.join(target_base, split, target_class, new_name)
                    if convert_png_to_jpg(src_path, dst_path):
                        png_converted.append(f)
                        print(f"  Converted: {f} -> {new_name}")
                    else:
                        print(f"  ERROR: Failed to convert {f}")
                else:
                    dst_path = os.path.join(target_base, split, target_class, f)
                    shutil.copy2(src_path, dst_path)
    
    print(f"  Converted {len(png_converted)} PNG files to JPG")

    # Step 7: Create data.yaml
    print("\nStep 7: Creating data.yaml...")
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
