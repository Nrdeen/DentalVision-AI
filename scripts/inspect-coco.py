"""Inspect COCO JSON to see categories."""

import json
from pathlib import Path

coco_file = Path(r"d:\proje\data\toothtruth\Final_processed_dataset\train\_annotations.coco.json")

with open(coco_file, "r") as f:
    data = json.load(f)

print(f"Total images: {len(data['images'])}")
print(f"Total annotations: {len(data['annotations'])}")
print(f"\nCategories ({len(data['categories'])}):")
for cat in data['categories']:
    print(f"  ID {cat['id']}: {cat['name']}")
