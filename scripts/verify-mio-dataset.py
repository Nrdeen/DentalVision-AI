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

def find_duplicates(hashes):
    """Find duplicate images by SHA-256 hash."""
    hash_to_files = defaultdict(list)
    for f, h in hashes.items():
        if not h.startswith("ERROR"):
            hash_to_files[h].append(f)
    duplicates = {h: files for h, files in hash_to_files.items() if len(files) > 1}
    return duplicates

def main():
    print("=" * 60)
    print("MIO DATASET VERIFICATION")
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

    # Duplicates within each dataset
    print("\nDuplicates within datasets:")
    for name, hashes in all_hashes.items():
        duplicates = find_duplicates(hashes)
        if duplicates:
            print(f"{name}: {len(duplicates)} duplicate groups")
            for h, files in duplicates.items():
                print(f"  Hash {h[:16]}...: {files}")
        else:
            print(f"{name}: No duplicates")

    # Duplicates between datasets
    print("\nDuplicates between datasets:")
    cross_hashes = defaultdict(list)
    for name, hashes in all_hashes.items():
        for f, h in hashes.items():
            if not h.startswith("ERROR"):
                cross_hashes[h].append((name, f))

    cross_duplicates = {h: items for h, items in cross_hashes.items() if len(items) > 1}
    if cross_duplicates:
        print(f"Found {len(cross_duplicates)} cross-dataset duplicate groups")
        for h, items in list(cross_duplicates.items())[:10]:  # Show first 10
            print(f"  Hash {h[:16]}...:")
            for name, f in items:
                print(f"    {name}/{f}")
    else:
        print("No cross-dataset duplicates")

    # E) Check for metadata files
    print("\nE) LOCAL METADATA FILES")
    print("-" * 60)
    parent_dir = "data/intraoral"
    metadata_files = []
    for f in os.listdir(parent_dir):
        if f.lower().endswith(('.zip', '.rar', '.7z', '.txt', '.md', '.pdf', '.json', '.csv')):
            metadata_files.append(f)
            print(f"Found: {f}")

    if not metadata_files:
        print("No metadata files found in data/intraoral/")

    # Check inside each dataset
    for name, path in datasets.items():
        if os.path.exists(path):
            for f in os.listdir(path):
                if f.lower().endswith(('.zip', '.rar', '.7z', '.txt', '.md', '.pdf', '.json', '.csv')):
                    print(f"Found in {name}: {f}")

    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
