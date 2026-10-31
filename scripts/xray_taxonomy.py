"""Panoramic class routing shared with the Node ensemble.

Anatomy and rare / low-mAP labels are never returned as diagnoses.
Specialist weight files are optional; a single best.pt still uses this routing.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Route:
    key: str
    specialist: str
    policy: str  # show | withhold | anatomy


ALIASES: list[tuple[str, Route]] = [
    ("permanent teeth", Route("anatomy", "xray-caries", "anatomy")),
    ("primary teeth", Route("anatomy", "xray-caries", "anatomy")),
    ("mandibular canal", Route("anatomy", "xray-caries", "anatomy")),
    ("maxillary sinus", Route("anatomy", "xray-caries", "anatomy")),
    ("impacted canine", Route("impacted", "xray-impaction", "show")),
    ("impacted tooth", Route("impacted", "xray-impaction", "show")),
    ("wisdom tooth", Route("impacted", "xray-impaction", "show")),
    ("wisdom", Route("impacted", "xray-impaction", "show")),
    ("mesioangular third molar impaction", Route("impacted", "xray-impaction", "show")),
    ("gömülü", Route("impacted", "xray-impaction", "show")),
    ("gomulu", Route("impacted", "xray-impaction", "show")),
    ("impact", Route("impacted", "xray-impaction", "show")),
    ("missing teeth", Route("missingTooth", "xray-missing", "show")),
    ("missing tooth", Route("missingTooth", "xray-missing", "show")),
    ("root canal obturation", Route("rootCanal", "xray-restorations", "show")),
    ("root canal filling", Route("rootCanal", "xray-restorations", "show")),
    ("root canal treatment", Route("rootCanal", "xray-restorations", "show")),
    ("root canal", Route("rootCanal", "xray-restorations", "show")),
    ("rct", Route("rootCanal", "xray-restorations", "show")),
    ("kanal", Route("rootCanal", "xray-restorations", "show")),
    ("post - core", Route("rootCanal", "xray-restorations", "show")),
    ("ceramic bridge", Route("bridge", "xray-restorations", "show")),
    ("bridge", Route("bridge", "xray-restorations", "show")),
    ("porcelain crown", Route("crown", "xray-restorations", "show")),
    ("crown", Route("crown", "xray-restorations", "show")),
    ("implant", Route("implant", "xray-implant", "show")),
    ("amalgam filling", Route("filling", "xray-restorations", "show")),
    ("dental filling", Route("filling", "xray-restorations", "show")),
    ("filling", Route("filling", "xray-restorations", "show")),
    ("retained root", Route("retainedRoot", "xray-restorations", "show")),
    ("root piece", Route("retainedRoot", "xray-restorations", "show")),
    ("apical periodontitis", Route("periapical", "xray-periapical", "show")),
    ("apical", Route("periapical", "xray-periapical", "show")),
    ("periapical lesion", Route("periapical", "xray-periapical", "show")),
    ("periapical", Route("periapical", "xray-periapical", "show")),
    ("periapikal", Route("periapical", "xray-periapical", "show")),
    ("bone loss", Route("boneLoss", "xray-bone", "show")),
    ("deep decay", Route("deepCaries", "xray-caries", "show")),
    ("cavity", Route("caries", "xray-caries", "show")),
    ("decay", Route("caries", "xray-caries", "show")),
    ("caries", Route("caries", "xray-caries", "show")),
    ("küretaj", Route("xrayKuretaj", "xray-caries", "show")),
    ("kretaj", Route("xrayKuretaj", "xray-caries", "show")),
    ("tad", Route("other", "xray-caries", "withhold")),
    ("wire", Route("other", "xray-caries", "withhold")),
    ("braces", Route("other", "xray-caries", "withhold")),
    ("orthodontic brackets", Route("other", "xray-caries", "withhold")),
    ("interdental wire", Route("other", "xray-caries", "withhold")),
    ("gingival former", Route("other", "xray-caries", "withhold")),
    ("spacing", Route("other", "xray-caries", "withhold")),
    ("attrition", Route("other", "xray-caries", "withhold")),
    ("supra eruption", Route("other", "xray-caries", "withhold")),
]

DENTEX = {
    0: Route("caries", "xray-caries", "show"),
    1: Route("xrayKuretaj", "xray-caries", "show"),
    2: Route("rootCanal", "xray-restorations", "show"),
    3: Route("impacted", "xray-impaction", "show"),
    4: Route("periapical", "xray-periapical", "show"),
}

# Must stay in lockstep with src/lib/dentaai/ensemble.ts SPECIALISTS.minConfidence
FLOORS = {
    "xray-impaction": 0.40,
    "xray-implant": 0.50,
    "xray-restorations": 0.50,
    "xray-missing": 0.50,
    "xray-caries": 0.55,
    "xray-periapical": 0.55,
    "xray-bone": 0.55,
}

ENABLED = {
    "xray-impaction": True,
    "xray-implant": True,
    "xray-restorations": True,
    "xray-missing": True,
    "xray-caries": False,
    "xray-periapical": False,
    "xray-bone": False,
}

SPECIALIST_WEIGHTS = {
    "xray-impaction": ROOT / "models" / "xray" / "specialists" / "impaction.pt",
    "xray-implant": ROOT / "models" / "xray" / "specialists" / "implant.pt",
    "xray-restorations": ROOT / "models" / "xray" / "specialists" / "restorations.pt",
    "xray-missing": ROOT / "models" / "xray" / "specialists" / "missing.pt",
    "xray-caries": ROOT / "models" / "xray" / "specialists" / "caries.pt",
    "xray-periapical": ROOT / "models" / "xray" / "specialists" / "periapical.pt",
    "xray-bone": ROOT / "models" / "xray" / "specialists" / "bone.pt",
}


def _norm(name: str) -> str:
    spaced = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)
    return " ".join(spaced.lower().replace("_", " ").split())


def _matches(haystack: str, alias: str) -> bool:
    if haystack == alias:
        return True
    if len(alias) <= 4:
        return re.search(rf"(?:^|\s){re.escape(alias)}(?:$|\s)", haystack) is not None
    return alias in haystack


def route_class(cls_id: int, name: str) -> Route:
    n = _norm(name)
    for alias, mapped in ALIASES:
        if _matches(n, alias):
            return mapped
    if cls_id in DENTEX:
        return DENTEX[cls_id]
    return Route("other", "xray-caries", "withhold")


def should_emit(route: Route, conf: float, user_floor: float, extra: float = 0.0) -> bool:
    if route.policy != "show":
        return False
    if not ENABLED.get(route.specialist, False):
        return False
    floor = max(user_floor, FLOORS.get(route.specialist, user_floor) + extra)
    return conf >= floor
