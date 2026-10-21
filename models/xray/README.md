# X-ray models

`best.pt` and `specialists/impaction.pt` are the ToothTruth / vzrad2 run (train-4).
The panoramic screen shows only Impacted tooth (mAP50 96) until OralXrays specialists
are trained and each class's own val mAP50 is 90 or higher.

OralXrays-9 (Chen et al., CVPR 2025) — cite `chen2025OralXrays`.
Password-protected zips live in `data/oralxrays9-raw`.
Prepare (no training): `python scripts/prepare-oralxrays9.py`
Train only after an explicit request: `python scripts/train-oralxrays-specialists.py`

Default train queue: implant, restorations (filling/crown/bridge/RCT), missing, impaction.
Decay and apical periodontitis are converted but not trained (published mAP50 85 and 75).
