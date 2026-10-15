import os
import hashlib
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

def check_readability(path, image_files):
    """Check if all images are readable."""
    readable = []
    unreadable = []
    for f in image_files:
        try:
            img_path = os.path.join(path, f)
            with Image.open(img_path) as img:
                img.verify()
            readable.append(f)
        except Exception as e:
            unreadable.append((f, str(e)))
    return readable, unreadable

def main():
    print("=" * 60)
    print("MIO PREPROCESSING VERIFICATION")
    print("=" * 60)

    target_base = "data/intraoral/processed/MIO_classification"
    
    # Step 1: Count images in each split and class
    print("\nStep 1: Counting images in processed dataset...")
    class_counts = {}
    total_count = 0
    
    for split in ["train", "val", "test"]:
        print(f"\n{split.upper()}:")
        class_counts[split] = {}
        for class_name in ["healthy", "gingivitis", "periodontitis"]:
            dir_path = os.path.join(target_base, split, class_name)
            if os.path.exists(dir_path):
                files = get_image_files(dir_path)
                class_counts[split][class_name] = len(files)
                total_count += len(files)
                print(f"  {class_name}: {len(files)}")
            else:
                print(f"  {class_name}: DIRECTORY NOT FOUND")
                class_counts[split][class_name] = 0
    
    print(f"\nTotal images: {total_count}")

    # Step 2: Check readability
    print("\nStep 2: Checking readability...")
    all_readable = True
    total_checked = 0
    total_unreadable = 0
    
    for split in ["train", "val", "test"]:
        for class_name in ["healthy", "gingivitis", "periodontitis"]:
            dir_path = os.path.join(target_base, split, class_name)
            if os.path.exists(dir_path):
                files = get_image_files(dir_path)
                readable, unreadable = check_readability(dir_path, files)
                total_checked += len(files)
                total_unreadable += len(unreadable)
                if unreadable:
                    all_readable = False
                    print(f"  {split}/{class_name}: {len(unreadable)} unreadable")
                    for f, err in unreadable:
                        print(f"    - {f}: {err}")
    
    print(f"\nTotal checked: {total_checked}")
    print(f"Readable: {total_checked - total_unreadable}")
    print(f"Unreadable: {total_unreadable}")
    print(f"All readable: {all_readable}")

    # Step 3: Check for duplicates across splits
    print("\nStep 3: Checking for duplicates across splits...")
    all_hashes = defaultdict(list)
    
    for split in ["train", "val", "test"]:
        for class_name in ["healthy", "gingivitis", "periodontitis"]:
            dir_path = os.path.join(target_base, split, class_name)
            if os.path.exists(dir_path):
                files = get_image_files(dir_path)
                hashes = compute_sha256(dir_path, files)
                for f, h in hashes.items():
                    if not h.startswith("ERROR"):
                        all_hashes[h].append((split, class_name, f))
    
    # Find duplicates
    duplicates = {h: items for h, items in all_hashes.items() if len(items) > 1}
    
    if duplicates:
        print(f"Found {len(duplicates)} duplicate groups:")
        for h, items in list(duplicates.items())[:10]:  # Show first 10
            print(f"  Hash {h[:16]}...:")
            for split, class_name, f in items:
                print(f"    {split}/{class_name}/{f}")
    else:
        print("No duplicates found across splits")

    # Step 4: Check for cross-class duplicates
    print("\nStep 4: Checking for cross-class duplicates...")
    cross_class_duplicates = {}
    for h, items in all_hashes.items():
        classes_involved = set(class_name for split, class_name, f in items)
        if len(classes_involved) > 1:
            cross_class_duplicates[h] = items
    
    if cross_class_duplicates:
        print(f"Found {len(cross_class_duplicates)} cross-class duplicate groups:")
        for h, items in list(cross_class_duplicates.items())[:10]:
            print(f"  Hash {h[:16]}...:")
            for split, class_name, f in items:
                print(f"    {split}/{class_name}/{f}")
    else:
        print("No cross-class duplicates found")

    # Step 5: Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Final image count: {total_count}")
    print(f"Expected: 605")
    print(f"Match: {total_count == 605}")
    print(f"\nAll images readable: {all_readable}")
    print(f"Duplicates across splits: {len(duplicates)}")
    print(f"Cross-class duplicates: {len(cross_class_duplicates)}")
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
