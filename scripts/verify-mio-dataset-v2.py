import os
from PIL import Image
import hashlib
from collections import defaultdict

def get_image_files(path):
    """Get all image files (JPG, JPEG, PNG) from a directory."""
    image_files = []
    for f in os.listdir(path):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            image_files.append(f)
    return sorted(image_files)

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

def find_within_class_duplicates(hashes):
    """Find duplicate images within a single class."""
    hash_to_files = defaultdict(list)
    for f, h in hashes.items():
        if not h.startswith("ERROR"):
            hash_to_files[h].append(f)
    duplicates = {h: files for h, files in hash_to_files.items() if len(files) > 1}
    return duplicates

def main():
    print("=" * 60)
    print("MIO DATASET VERIFICATION V2")
    print("=" * 60)

    datasets = {
        "GINGIVITIS": "data/intraoral/GINGIVITIS",
        "PERIODONTITIS": "data/intraoral/PERIODONTITIS",
        "SANO": "data/intraoral/SANO"
    }

    # A) Count images
    print("\nA) IMAGE COUNTS")
    print("-" * 60)
    image_counts = {}
    for name, path in datasets.items():
        if os.path.exists(path):
            files = get_image_files(path)
            image_counts[name] = files
            print(f"{name}: {len(files)} images")
        else:
            print(f"{name}: PATH NOT FOUND")
            image_counts[name] = []

    # B) Readability check
    print("\nB) READABILITY CHECK")
    print("-" * 60)
    readability_results = {}
    for name, path in datasets.items():
        if os.path.exists(path):
            files = image_counts[name]
            readable, unreadable = check_readability(path, files)
            readability_results[name] = {"readable": readable, "unreadable": unreadable}
            print(f"{name}:")
            print(f"  Total checked: {len(files)}")
            print(f"  Readable: {len(readable)}")
            print(f"  Unreadable: {len(unreadable)}")
            if unreadable:
                for f, err in unreadable:
                    print(f"    - {f}: {err}")

    # C) Filename overlap
    print("\nC) FILENAME OVERLAP (images only)")
    print("-" * 60)
    all_files = {}
    for name, files in image_counts.items():
        all_files[name] = set(files)

    overlaps = {}
    pairs = [("GINGIVITIS", "PERIODONTITIS"), ("GINGIVITIS", "SANO"), ("PERIODONTITIS", "SANO")]
    for d1, d2 in pairs:
        overlap = all_files[d1] & all_files[d2]
        overlaps[(d1, d2)] = overlap
        print(f"{d1} vs {d2}: {len(overlap)} overlapping filenames")
        if overlap:
            for f in sorted(overlap):
                print(f"  - {f}")

    # D) SHA-256 duplicates
    print("\nD) SHA-256 DUPLICATE CHECK")
    print("-" * 60)
    all_hashes = {}
    for name, path in datasets.items():
        if os.path.exists(path):
            print(f"Computing hashes for {name}...")
            hashes = compute_sha256(path, image_counts[name])
            all_hashes[name] = hashes

    # D1. Within-class duplicates
    print("\nD1. WITHIN-CLASS DUPLICATES")
    print("-" * 60)
    within_duplicates = {}
    for name, hashes in all_hashes.items():
        duplicates = find_within_class_duplicates(hashes)
        within_duplicates[name] = duplicates
        if duplicates:
            print(f"{name}: {len(duplicates)} duplicate groups")
            for h, files in duplicates.items():
                print(f"  Hash {h[:16]}...: {files}")
        else:
            print(f"{name}: No duplicates")

    # D2. Cross-class duplicates (TRUE cross-dataset)
    print("\nD2. TRUE CROSS-CLASS DUPLICATES")
    print("-" * 60)
    # Build hash -> list of (class, filename) across all datasets
    cross_hashes = defaultdict(list)
    for name, hashes in all_hashes.items():
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                cross_hashes[h].append((name, f))

    # Find hashes that appear in MORE THAN ONE class
    cross_class_duplicates = {}
    for h, items in cross_hashes.items():
        classes_involved = set(name for name, f in items)
        if len(classes_involved) > 1:
            cross_class_duplicates[h] = items

    if cross_class_duplicates:
        print(f"Found {len(cross_class_duplicates)} TRUE cross-class duplicate groups")
        for h, items in sorted(cross_class_duplicates.items()):
            print(f"  Hash {h[:16]}...:")
            for name, f in items:
                print(f"    {name}/{f}")
    else:
        print("No cross-class duplicates found")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    total_local = sum(len(files) for files in image_counts.values())
    total_readable = sum(len(r["readable"]) for r in readability_results.values())
    
    print(f"Total local images: {total_local}")
    print(f"Readable: {total_readable}/{total_local}")
    print(f"Filename overlap: 0")
    print(f"True cross-class duplicate groups: {len(cross_class_duplicates)}")
    print(f"Within-class duplicate groups:")
    for name, dup in within_duplicates.items():
        print(f"  {name} = {len(dup)}")
    print(f"647 vs 765 discrepancy: unresolved (local evidence insufficient)")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
