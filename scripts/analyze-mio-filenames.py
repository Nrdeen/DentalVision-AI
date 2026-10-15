import os
import re

def get_image_files(path):
    """Get all image files (JPG, JPEG, PNG) from a directory."""
    image_files = []
    for f in os.listdir(path):
        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
            image_files.append(f)
    return sorted(image_files)

def extract_numbers(filename):
    """Extract all numbers from filename."""
    return re.findall(r'\d+', filename)

def analyze_naming_pattern(files):
    """Analyze naming patterns in filenames."""
    patterns = {}
    for f in files:
        # Extract base pattern (replace numbers with X)
        pattern = re.sub(r'\d+', 'X', f)
        if pattern not in patterns:
            patterns[pattern] = []
        patterns[pattern].append(f)
    return patterns

def find_gaps(files):
    """Find gaps in numbered sequences."""
    # Extract all numbers from all files
    all_numbers = []
    for f in files:
        nums = extract_numbers(f)
        all_numbers.extend([int(n) for n in nums])
    
    if not all_numbers:
        return []
    
    # Find gaps
    unique_nums = sorted(set(all_numbers))
    gaps = []
    for i in range(len(unique_nums) - 1):
        if unique_nums[i+1] - unique_nums[i] > 1:
            gaps.append((unique_nums[i], unique_nums[i+1], unique_nums[i+1] - unique_nums[i] - 1))
    
    return gaps

def main():
    print("=" * 60)
    print("MIO FILENAME ANALYSIS")
    print("=" * 60)

    datasets = {
        "GINGIVITIS": "data/intraoral/GINGIVITIS",
        "PERIODONTITIS": "data/intraoral/PERIODONTITIS",
        "SANO": "data/intraoral/SANO"
    }

    all_files = {}
    for name, path in datasets.items():
        if os.path.exists(path):
            files = get_image_files(path)
            all_files[name] = files
            print(f"\n{name}: {len(files)} files")
            print("-" * 60)
            for f in files:
                print(f"  {f}")
        else:
            print(f"\n{name}: PATH NOT FOUND")
            all_files[name] = []

    # Analyze patterns
    print("\n" + "=" * 60)
    print("NAMING PATTERN ANALYSIS")
    print("=" * 60)
    
    for name, files in all_files.items():
        print(f"\n{name}:")
        patterns = analyze_naming_pattern(files)
        for pattern, file_list in patterns.items():
            print(f"  Pattern: {pattern} ({len(file_list)} files)")
            if len(file_list) <= 5:
                for f in file_list:
                    print(f"    - {f}")
            else:
                print(f"    - {file_list[0]}")
                print(f"    - {file_list[-1]}")
                print(f"    ... ({len(file_list)-2} more)")

    # Find gaps
    print("\n" + "=" * 60)
    print("NUMBER SEQUENCE GAPS")
    print("=" * 60)
    
    for name, files in all_files.items():
        print(f"\n{name}:")
        gaps = find_gaps(files)
        if gaps:
            for start, end, count in gaps:
                print(f"  Gap: {start} to {end} ({count} missing numbers)")
        else:
            print("  No obvious gaps detected")

    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
