# Class Mapping Analysis

## Current AlphaDent Classes in Code

```python
ALPHADENT_CLASSES = ["Abrasion", "Filling", "Crown", "Caries 1 class", "Caries 2 class", "Caries 3 class", "Caries 4 class", "Caries 5 class", "Caries 6 class"]
```

## Actual AlphaDent Classes from Model Output

From raw model inference:
- Abrasion
- Caries
- Crown
- Filling
- Fracture
- Gingivitis
- Plaque
- Periodontitis
- Ulcer

## Current Mapping in map_alphadent_segmentation

```python
class_mapping = {
    "Abrasion": ("abrasion", "abrasionDesc", "--color-finding-caries"),
    "Filling": ("filling", "fillingDesc", "--color-finding-caries"),
    "Crown": ("crown", "crownDesc", "--color-finding-caries"),
    "Caries 1 class": ("caries1", "caries1Desc", "--color-finding-caries"),
    "Caries 2 class": ("caries2", "caries2Desc", "--color-finding-caries"),
    "Caries 3 class": ("caries3", "caries3Desc", "--color-finding-caries"),
    "Caries 4 class": ("caries4", "caries4Desc", "--color-finding-caries"),
    "Caries 5 class": ("caries5", "caries5Desc", "--color-finding-caries"),
    "Caries 6 class": ("caries6", "caries6Desc", "--color-finding-caries"),
}

key, descriptionKey, colorVar = class_mapping.get(cls_name, ("abrasion", "abrasionDesc", "--color-finding-caries"))
```

## Problem

The `ALPHADENT_CLASSES` list in the code does NOT match the actual model output classes.

**Missing classes in code:**
- Fracture
- Gingivitis
- Plaque
- Periodontitis
- Ulcer

**Extra classes in code (not in model output):**
- Caries 1 class
- Caries 2 class
- Caries 3 class
- Caries 4 class
- Caries 5 class
- Caries 6 class

**Current behavior:**
- Any class not in `class_mapping` defaults to `("abrasion", "abrasionDesc", "--color-finding-caries")`
- This means: Fracture, Gingivitis, Plaque, Periodontitis, Ulcer → abrasion

## Proposed Fix

1. Update `ALPHADENT_CLASSES` to match actual model output
2. Update `class_mapping` to include all actual classes with their correct keys
3. Remove default fallback or change it to a generic "unknown" class

## Proposed Mapping After Fix

```python
ALPHADENT_CLASSES = ["Abrasion", "Caries", "Crown", "Filling", "Fracture", "Gingivitis", "Plaque", "Periodontitis", "Ulcer"]

class_mapping = {
    "Abrasion": ("abrasion", "abrasionDesc", "--color-finding-abrasion"),
    "Caries": ("caries", "cariesDesc", "--color-finding-caries"),
    "Crown": ("crown", "crownDesc", "--color-finding-crown"),
    "Filling": ("filling", "fillingDesc", "--color-finding-filling"),
    "Fracture": ("fracture", "fractureDesc", "--color-finding-fracture"),
    "Gingivitis": ("gingivitis", "gingivitisDesc", "--color-finding-gingivitis"),
    "Plaque": ("plaque", "plaqueDesc", "--color-finding-plaque"),
    "Periodontitis": ("periodontitis", "periodontitisDesc", "--color-finding-periodontitis"),
    "Ulcer": ("ulcer", "ulcerDesc", "--color-finding-ulcer"),
}
```

## Comparison Table

| Model Class | Current API Key | Proposed API Key | Status |
|-------------|----------------|------------------|---------|
| Abrasion | abrasion | abrasion | ✅ OK |
| Caries | abrasion (default) | caries | ❌ FIX |
| Crown | crown | crown | ✅ OK |
| Filling | filling | filling | ✅ OK |
| Fracture | abrasion (default) | fracture | ❌ FIX |
| Gingivitis | abrasion (default) | gingivitis | ❌ FIX |
| Plaque | abrasion (default) | plaque | ❌ FIX |
| Periodontitis | abrasion (default) | periodontitis | ❌ FIX |
| Ulcer | abrasion (default) | ulcer | ❌ FIX |
| Caries 1 class | caries1 | N/A (not in model) | ❌ REMOVE |
| Caries 2 class | caries2 | N/A (not in model) | ❌ REMOVE |
| Caries 3 class | caries3 | N/A (not in model) | ❌ REMOVE |
| Caries 4 class | caries4 | N/A (not in model) | ❌ REMOVE |
| Caries 5 class | caries5 | N/A (not in model) | ❌ REMOVE |
| Caries 6 class | caries6 | N/A (not in model) | ❌ REMOVE |
