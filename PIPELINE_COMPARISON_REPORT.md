# Pipeline Comparison Report: Raw Models vs API vs Frontend

## Executive Summary

This report compares the raw model outputs with API responses and Frontend displays for the three test images uploaded by the user. The goal is to identify where the discrepancy occurs in the pipeline.

---

## IMAGE 1: الصورة الاولى.png

### Raw Model Output
- **Caries detections:** 2
  - permanent_caries: 0.7352 (bbox: [0.0970, 0.4609, 0.2713, 0.6962])
  - permanent_caries: 0.6531 (bbox: [0.7609, 0.4005, 0.9239, 0.5837])

- **AlphaDent detections:** 17
  - Abrasion: 7 detections (confidences: 0.8909, 0.8611, 0.8316, 0.7558, 0.7126, 0.4186, 0.2886)
  - Periodontitis: 7 detections (confidences: 0.7919, 0.4851, 0.3692, 0.3535, 0.2871, 0.2710, 0.2561)
  - Crown: 1 detection (confidence: 0.4717)
  - Gingivitis: 1 detection (confidence: 0.3989)
  - Fracture: 1 detection (confidence: 0.2632)

- **TOTAL RAW DETECTIONS:** 19

### API Response
- **Total findings:** 19
- **Class breakdown:**
  - abrasion: 7
  - caries2: 1
  - caries3: 1
  - caries5: 7
  - crown: 1
  - earlyCaries: 2

### Frontend Display (User Report)
- **Total findings:** 21
- **Class breakdown:**
  - Abruzyon: 5
  - Erken Çürük: 5
  - Çürük Sınıf 5: 6
  - Çürük Sınıf 1: 3
  - Çürük Sınıf 2: 1
  - Çürük Sınıf 3: 1

### Comparison
| Stage | Total | Abrasion | Caries | Crown | Periodontitis | Gingivitis | Fracture |
|-------|-------|----------|--------|-------|---------------|------------|----------|
| Raw Models | 19 | 7 | 2 | 1 | 7 | 1 | 1 |
| API | 19 | 7 | 10 (mapped) | 1 | 0 (mapped to caries5) | 0 (mapped to caries3) | 0 (mapped to caries2) |
| Frontend | 21 | 5 | 16 | 0 | 0 | 0 | 0 |

**Discrepancy Analysis:**
- Raw Models → API: 1:1 mapping confirmed (19 detections)
- API → Frontend: +2 findings appear (19 → 21)
- Class mapping issue: AlphaDent classes (Periodontitis, Gingivitis, Fracture) are mapped to caries classes (caries5, caries3, caries2) in the API
- Frontend shows different class names (Turkish) and different counts

---

## IMAGE 2: الصورة الثانية .png

### Raw Model Output
- **Caries detections:** 2
  - permanent_caries: 0.7352 (bbox: [0.0970, 0.4609, 0.2713, 0.6962])
  - permanent_caries: 0.6531 (bbox: [0.7609, 0.4005, 0.9239, 0.5837])

- **AlphaDent detections:** 17
  - Abrasion: 7 detections (confidences: 0.8909, 0.8611, 0.8316, 0.7558, 0.7126, 0.4186, 0.2886)
  - Periodontitis: 7 detections (confidences: 0.7919, 0.4851, 0.3692, 0.3535, 0.2871, 0.2710, 0.2561)
  - Crown: 1 detection (confidence: 0.4717)
  - Gingivitis: 1 detection (confidence: 0.3989)
  - Fracture: 1 detection (confidence: 0.2632)

- **TOTAL RAW DETECTIONS:** 19

### API Response
- **Total findings:** 19
- **Class breakdown:**
  - abrasion: 7
  - caries2: 1
  - caries3: 1
  - caries5: 7
  - crown: 1
  - earlyCaries: 2

### Frontend Display (User Report)
- **Total findings:** 21
- **Class breakdown:**
  - Abruzyon: 8
  - Çürük Sınıf 5: 8
  - Erken Çürük: 2
  - Kuron: 1
  - Çürük Sınıf 3: 1
  - Çürük Sınıf 2: 1

### Comparison
| Stage | Total | Abrasion | Caries | Crown | Periodontitis | Gingivitis | Fracture |
|-------|-------|----------|--------|-------|---------------|------------|----------|
| Raw Models | 19 | 7 | 2 | 1 | 7 | 1 | 1 |
| API | 19 | 7 | 10 (mapped) | 1 | 0 (mapped to caries5) | 0 (mapped to caries3) | 0 (mapped to caries2) |
| Frontend | 21 | 8 | 12 | 1 | 0 | 0 | 0 |

**Discrepancy Analysis:**
- Raw Models → API: 1:1 mapping confirmed (19 detections)
- API → Frontend: +2 findings appear (19 → 21)
- Same class mapping issue as Image 1
- Frontend shows different class counts

---

## IMAGE 3: الصورة الثالثة .png

### Raw Model Output
- **Caries detections:** 0

- **AlphaDent detections:** 10
  - Abrasion: 6 detections (confidences: 0.7985, 0.7181, 0.5682, 0.4559, 0.3777, 0.3450)
  - Periodontitis: 4 detections (confidences: 0.3186, 0.2723, 0.2693, 0.2666)

- **TOTAL RAW DETECTIONS:** 10

### API Response
- **Total findings:** 10
- **Class breakdown:**
  - abrasion: 6
  - caries5: 4

### Frontend Display (User Report)
- **Total findings:** 12
- **Class breakdown:**
  - Abruzyon: 6
  - Çürük Sınıf 5: 6

### Comparison
| Stage | Total | Abrasion | Caries | Periodontitis |
|-------|-------|----------|--------|---------------|
| Raw Models | 10 | 6 | 0 | 4 |
| API | 10 | 6 | 4 (mapped) | 0 (mapped to caries5) |
| Frontend | 12 | 6 | 6 | 0 |

**Discrepancy Analysis:**
- Raw Models → API: 1:1 mapping confirmed (10 detections)
- API → Frontend: +2 findings appear (10 → 12)
- Periodontitis mapped to caries5 in API
- Frontend shows 6 caries5 instead of 4

---

## Key Findings

### 1. Raw Models → API: 1:1 Mapping Confirmed ✅
- The API correctly returns all raw detections from the models
- No detections are lost between raw inference and API response
- Confidence values are preserved exactly
- Bbox coordinates are preserved exactly

### 2. Class Mapping Issue in API ⚠️
- AlphaDent classes are being mapped incorrectly:
  - `Periodontitis` → `caries5`
  - `Gingivitis` → `caries3`
  - `Fracture` → `caries2`
- This is incorrect because:
  - Periodontitis, Gingivitis, and Fracture are NOT caries
  - They should be displayed with their original class names
  - This mapping appears to be in the API's `map_alphadent_segmentation` function

### 3. Frontend Discrepancy ❌
- Frontend shows MORE findings than API returns:
  - Image 1: API 19 → Frontend 21 (+2)
  - Image 2: API 19 → Frontend 21 (+2)
  - Image 3: API 10 → Frontend 12 (+2)
- This indicates the Frontend is generating or duplicating findings
- Possible causes:
  - Deduplication logic may be creating duplicates
  - State management issue in Zustand store
  - React component rendering duplicate entries

### 4. Class Name Localization
- Frontend uses Turkish class names (Abruzyon, Erken Çürük, Çürük Sınıf X)
- API uses English class names (abrasion, earlyCaries, cariesX)
- This is expected behavior for localization

---

## Recommendations

### Immediate Actions Required

1. **Fix Class Mapping in API** (`scripts/infer-intraoral.py`)
   - Remove incorrect mapping of Periodontitis/Gingivitis/Fracture to caries classes
   - These classes should be returned with their original names
   - Only map classes that are truly equivalent (if any)

2. **Investigate Frontend Duplication**
   - Check `src/lib/dentaai/store.ts` for state duplication
   - Verify `deduplicateFindings` function logic
   - Check React component rendering for duplicate keys
   - Verify that findings are not being added multiple times to state

3. **Verify Deduplication Logic**
   - The current deduplication uses IoU (Intersection over Union)
   - Ensure it's not creating duplicates instead of removing them
   - Check if the deduplication threshold is too low

### Code Locations to Investigate

1. **Class Mapping:** `scripts/infer-intraoral.py` - `map_alphadent_segmentation` function
2. **Deduplication:** `src/lib/dentaai/store.ts` - `deduplicateFindings` function
3. **State Management:** `src/lib/dentaai/store.ts` - `runIntraoral` function
4. **Frontend Rendering:** `src/routes/intraoral.tsx` - FindingCards component

---

## Summary Table

| Image | Raw Count | API Count | Frontend Count | Raw→API Match | API→Frontend Match |
|-------|-----------|-----------|----------------|---------------|-------------------|
| الصورة الاولى.png | 19 | 19 | 21 | ✅ 1:1 | ❌ +2 |
| الصورة الثانية .png | 19 | 19 | 21 | ✅ 1:1 | ❌ +2 |
| الصورة الثالثة .png | 10 | 10 | 12 | ✅ 1:1 | ❌ +2 |

**Conclusion:**
- Raw models are working correctly
- API is preserving raw detections (1:1 match)
- **Critical Issue:** API incorrectly maps AlphaDent classes to caries classes
- **Critical Issue:** Frontend shows 2 more findings than API returns (duplication bug)
