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
    print("MIO PREPROCESSING PLAN V2 (Exclude Cross-Class Duplicates)")
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
    print("CROSS-CLASS DUPLICATES (TO BE EXCLUDED)")
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
    print("These will be EXCLUDED from the processed dataset:")
    for h, items in sorted(cross_class_duplicates.items()):
        print(f"  Hash {h[:16]}...:")
        for name, f in items:
            print(f"    {name}/{f}")

    # Plan: Handle within-class duplicates (keep first, remove rest)
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
    
    # For cross-class duplicates, ALL files in those groups are excluded
    cross_class_files_to_exclude = set()
    for h, items in cross_class_duplicates.items():
        for name, f in items:
            cross_class_files_to_exclude.add((name, f))
    
    unique_counts = {}
    for name, files in all_files.items():
        # Start with original count
        count = len(files)
        # Subtract within-class duplicates removed
        within_removed = sum(1 for n, f in within_duplicates_to_remove if n == name)
        # Subtract cross-class duplicates excluded (ALL of them)
        cross_excluded = sum(1 for (n, f) in cross_class_files_to_exclude if n == name)
        unique_count = count - within_removed - cross_excluded
        unique_counts[name] = unique_count
        print(f"{name}: {count} - {within_removed} (within) - {cross_excluded} (cross excluded) = {unique_count}")

    total_unique = sum(unique_counts.values())
    print(f"\nTotal unique images (excluding cross-class duplicates): {total_unique}")

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
    print("EXCLUSION SUMMARY")
    print("=" * 60)
    print(f"\nCross-class duplicate groups excluded: {len(cross_class_duplicates)}")
    print(f"Total files excluded due to cross-class conflicts: {len(cross_class_files_to_exclude)}")
    print(f"Within-class duplicates removed: {len(within_duplicates_to_remove)}")
    print(f"Total unique images retained: {total_unique}")

    print("\n" + "=" * 60)
    print("PLAN COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
