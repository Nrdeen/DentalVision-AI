import os
import hashlib
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

def main():
    print("=" * 60)
    print("MIO PREPROCESSING PLAN CALCULATION")
    print("=" * 60)

    datasets = {
        "GINGIVITIS": "data/intraoral/GINGIVITIS",
        "PERIODONTITIS": "data/intraoral/PERIODONTITIS",
        "SANO": "data/intraoral/SANO"
    }

    # Get all files and hashes
    all_files = {}
    all_hashes = {}
    for name, path in datasets.items():
        if os.path.exists(path):
            files = get_image_files(path)
            all_files[name] = files
            hashes = compute_sha256(path, files)
            all_hashes[name] = hashes
            print(f"\n{name}: {len(files)} files")

    # Find within-class duplicates
    print("\n" + "=" * 60)
    print("WITHIN-CLASS DUPLICATES")
    print("=" * 60)
    
    within_duplicates = {}
    for name, hashes in all_hashes.items():
        hash_to_files = defaultdict(list)
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                hash_to_files[h].append(f)
        duplicates = {h: files for h, files in hash_to_files.items() if len(files) > 1}
        within_duplicates[name] = duplicates
        print(f"\n{name}: {len(duplicates)} duplicate groups")
        for h, files in duplicates.items():
            print(f"  Hash {h[:16]}...: {files}")

    # Find cross-class duplicates
    print("\n" + "=" * 60)
    print("CROSS-CLASS DUPLICATES")
    print("=" * 60)
    
    cross_hashes = defaultdict(list)
    for name, hashes in all_hashes.items():
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                cross_hashes[h].append((name, f))

    cross_class_duplicates = {}
    for h, items in cross_hashes.items():
        classes_involved = set(name for name, f in items)
        if len(classes_involved) > 1:
            cross_class_duplicates[h] = items

    print(f"\nFound {len(cross_class_duplicates)} cross-class duplicate groups")
    for h, items in sorted(cross_class_duplicates.items()):
        print(f"  Hash {h[:16]}...:")
        for name, f in items:
            print(f"    {name}/{f}")

    # Plan: Handle cross-class duplicates
    print("\n" + "=" * 60)
    print("DUPLICATE HANDLING PLAN")
    print("=" * 60)
    
    # Strategy: For cross-class duplicates, keep in the class that appears first in priority
    # Priority: SANO (healthy) > GINGIVITIS > PERIODONTITIS
    # Reason: Healthy is baseline, gingivitis is mild, periodontitis is severe
    
    priority = {"SANO": 0, "GINGIVITIS": 1, "PERIODONTITIS": 2}
    
    cross_duplicates_to_remove = []
    cross_duplicates_to_keep = []
    
    for h, items in cross_class_duplicates.items():
        # Sort by priority
        sorted_items = sorted(items, key=lambda x: priority[x[0]])
        # Keep the first (highest priority), remove the rest
        keep_item = sorted_items[0]
        remove_items = sorted_items[1:]
        cross_duplicates_to_keep.append((h, keep_item))
        cross_duplicates_to_remove.extend([(h, item) for item in remove_items])
    
    print("\nCross-class duplicates to KEEP:")
    for h, (name, f) in cross_duplicates_to_keep:
        print(f"  {name}/{f} (hash {h[:16]}...)")
    
    print("\nCross-class duplicates to REMOVE:")
    for h, (name, f) in cross_duplicates_to_remove:
        print(f"  {name}/{f} (hash {h[:16]}...)")

    # Plan: Handle within-class duplicates
    print("\n" + "=" * 60)
    print("WITHIN-CLASS DUPLICATE HANDLING PLAN")
    print("=" * 60)
    
    within_duplicates_to_remove = []
    for name, duplicates in within_duplicates.items():
        print(f"\n{name}:")
        for h, files in duplicates.items():
            # Keep the first file, remove the rest
            keep_file = files[0]
            remove_files = files[1:]
            print(f"  Keep: {keep_file}")
            for f in remove_files:
                print(f"  Remove: {f}")
                within_duplicates_to_remove.append((name, f))

    # Calculate unique counts after duplicate removal
    print("\n" + "=" * 60)
    print("UNIQUE IMAGE COUNTS AFTER DUPLICATE REMOVAL")
    print("=" * 60)
    
    unique_counts = {}
    for name, files in all_files.items():
        # Start with original count
        count = len(files)
        # Subtract within-class duplicates removed
        within_removed = sum(1 for n, f in within_duplicates_to_remove if n == name)
        # Subtract cross-class duplicates removed
        cross_removed = sum(1 for h, (n, f) in cross_duplicates_to_remove if n == name)
        unique_count = count - within_removed - cross_removed
        unique_counts[name] = unique_count
        print(f"{name}: {count} - {within_removed} (within) - {cross_removed} (cross) = {unique_count}")

    total_unique = sum(unique_counts.values())
    print(f"\nTotal unique images: {total_unique}")

    # Calculate stratified split
    print("\n" + "=" * 60)
    print("PROPOSED STRATIFIED 70/15/15 SPLIT")
    print("=" * 60)
    
    splits = {}
    for name, count in unique_counts.items():
        train = int(count * 0.70)
        val = int(count * 0.15)
        test = count - train - val  # Ensure total matches
        splits[name] = {"train": train, "val": val, "test": test}
        print(f"\n{name}:")
        print(f"  Train: {train} ({train/count*100:.1f}%)")
        print(f"  Val: {val} ({val/count*100:.1f}%)")
        print(f"  Test: {test} ({test/count*100:.1f}%)")

    total_train = sum(splits[name]["train"] for name in splits.keys())
    total_val = sum(splits[name]["val"] for name in splits.keys())
    total_test = sum(splits[name]["test"] for name in splits.keys())
    
    print(f"\nTOTAL:")
    print(f"  Train: {total_train} ({total_train/total_unique*100:.1f}%)")
    print(f"  Val: {total_val} ({total_val/total_unique*100:.1f}%)")
    print(f"  Test: {total_test} ({total_test/total_unique*100:.1f}%)")

    print("\n" + "=" * 60)
    print("PLAN COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
