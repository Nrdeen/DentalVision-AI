# X-ray models

`best.pt` and `specialists/impaction.pt` are the ToothTruth / vzrad2 run (train-4).
OralXrays specialists now on: implant (mAP50 99), restorations (mAP50 94),
missing teeth (mAP50 97). Impaction stays on the ToothTruth weight until its
OralXrays run is trained.

OralXrays-9 (Chen et al., CVPR 2025) — cite `chen2025OralXrays`.

Tooth numbering is not in OralXrays-9. A 32-class FDI detector is a separate
anatomy model (not a diagnosis). It is not trained yet.

Numbering data, if training is requested later:
- DENTEX 2023 subset (b): 634 panoramics with quadrant + tooth enumeration
  (FDI 32 classes). Disease labels in subset (c) stay unused.
- DENTEX subset (a): 693 panoramics, quadrant only — too coarse for tooth-level
  fusion.
- Alternative: any panoramic tooth-instance set that already carries FDI numbers.

Findings attach to the tooth with the highest IoD
(intersection / tooth-box area, Luo et al. DVCTNet, MICCAI 2025). Until the
detector exists, panoramic numbers stay geometric estimates marked ≈ and never
count as “aligned” in the fusion table.
Password-protected zips live in `data/oralxrays9-raw`.
Prepare (no training): `python scripts/prepare-oralxrays9.py`
Train only after an explicit request.

Caries localization stack (do not enable until OUR tile val mAP50 ≥ 90).
mAP50-95 ≥ 70 is a target on our val, not a guarantee.
- Source: OralXrays-9 Decay, 5181/953 films at 1991×1127, median lesion ~78 px
- Prepare tiles: `python scripts/prepare-caries-hires.py`
  writes 768 lesion-preserving crops (lesion ~10% of the tile) + clinic CLAHE.
  Clipped boxes (IoA < 0.75) are dropped so they do not train sloppy corners.
- Train: `python scripts/train-caries-hires.py`
  Auto profile: YOLO11l-P2 only if CUDA has ≥ 8 GB. CPU / MX330 uses
  YOLO11n 640×80 epochs (implant-class runtime). Stop any in-flight
  YOLO11l-P2 CPU run first (Ctrl+C) — that was ~9 h/epoch.
- Original `caries/` 1991×1127 films stay for a stricter full-film val.

Next train queue (not started): caries-hires, then periapical.
- Apical periodontitis: 2990 train / 683 val (still the 640/nano launcher)
Do not enable either in the product until OUR val mAP50 ≥ 90.
Bone loss is not in OralXrays-9; ToothTruth mixed mAP50 was ≈21.

Already trained and on: implant, restorations, missing. Impaction stays ToothTruth.
