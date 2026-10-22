# X-ray models

`best.pt` and `specialists/impaction.pt` are the ToothTruth / vzrad2 run (train-4).
OralXrays specialists now on: implant (mAP50 99), restorations (mAP50 94),
missing teeth (mAP50 97). Impaction stays on the ToothTruth weight until its
OralXrays run is trained.

OralXrays-9 (Chen et al., CVPR 2025) — cite `chen2025OralXrays`.
Password-protected zips live in `data/oralxrays9-raw`.
Prepare (no training): `python scripts/prepare-oralxrays9.py`
Train only after an explicit request: `python scripts/train-oralxrays-specialists.py`

Default train queue: implant, restorations (filling/crown/bridge/RCT), missing, impaction.
Decay and apical periodontitis are converted but not trained (published mAP50 85 and 75).
