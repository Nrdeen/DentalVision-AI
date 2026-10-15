# DentaAI

Multimodal AI dental diagnosis workspace: panoramic X-ray analysis, intraoral photography, late fusion, and an explainable report.

This build is the interactive product for the DentalVision-AI thesis prototype. Detector calls are placeholders with calibrated demo findings and relative bounding boxes. Swap them for trained weights after DENTEX and the merged intraoral datasets are ready.

## Architecture

1. **Radiograph ensemble** — YOLOv11 + Faster R-CNN + RetinaNet + Mask R-CNN + DINO (soft voting) on DENTEX classes: Caries, Deep Caries, Periapical Lesion, Impacted Tooth.
2. **Intraoral detector** — YOLOv8/YOLOv11 on merged caries, gingivitis and surface-defect datasets.
3. **Late fusion** — shared labels become strong evidence; X-ray-only findings are treated as deep; photo-only findings as surface.

## Plug in real models later

Replace the functions in `src/lib/dentaai/detectors.ts` with inference against:

- `models/xray/best.pt` (or an ensemble of five checkpoints)
- `models/intraoral/best.pt`

Keep the `Finding` shape (`label` key, confidence, tooth, bbox in 0–1 coordinates, severity). Fusion and the PDF generator will pick up the new outputs automatically.
