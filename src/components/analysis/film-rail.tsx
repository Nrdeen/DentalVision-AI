import { findingLabel, t } from "@/lib/dentaai/i18n";
import type { Finding, ImageAdjust, Lang } from "@/lib/dentaai/types";
import { cn } from "@/lib/utils";

export function FilmRail({
  lang,
  findings,
  adjust,
  filter,
  panMode,
  tone,
  onTone,
  onFilter,
  onAdjust,
  onReset,
  onPanMode,
  onCompare,
}: {
  lang: Lang;
  findings: Finding[];
  adjust: ImageAdjust;
  filter: string | null;
  panMode: boolean;
  tone: "c" | "b" | null;
  onTone: (next: "c" | "b" | null) => void;
  onFilter: (key: string | null) => void;
  onAdjust: (patch: Partial<ImageAdjust>) => void;
  onReset: () => void;
  onPanMode: (on: boolean) => void;
  onCompare: (down: boolean) => void;
}) {
  const counts = new Map<string, { n: number; colorVar: string }>();
  for (const f of findings) {
    const prev = counts.get(f.key);
    counts.set(f.key, { n: (prev?.n ?? 0) + 1, colorVar: f.colorVar });
  }

  return (
    <>
      <div className="rail">
        <button type="button" onClick={() => onAdjust({ zoom: Math.min(3, adjust.zoom + 0.25) })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
          {t(lang, "clinic.zoomIn")}
        </button>
        <button type="button" onClick={() => onAdjust({ zoom: Math.max(1, adjust.zoom - 0.25), ...(adjust.zoom - 0.25 <= 1 ? { panX: 0, panY: 0 } : {}) })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3M8 11h6" />
          </svg>
          {t(lang, "clinic.zoomOut")}
        </button>
        <button type="button" className={cn(panMode && "on")} onClick={() => onPanMode(!panMode)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M8 13V5.5a1.5 1.5 0 013 0V11m0-5.5a1.5 1.5 0 013 0V11m0-4a1.5 1.5 0 013 0v7a7 7 0 01-7 7h-1a7 7 0 01-5.6-2.8L4 15.5a1.7 1.7 0 012.6-2.2L8 15" />
          </svg>
          {t(lang, "clinic.pan")}
        </button>
        <button type="button" className={cn(tone === "c" && "on")} onClick={() => onTone(tone === "c" ? null : "c")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v18a9 9 0 000-18z" fill="currentColor" />
          </svg>
          {t(lang, "common.contrast")}
        </button>
        <button type="button" className={cn(tone === "b" && "on")} onClick={() => onTone(tone === "b" ? null : "b")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
          {t(lang, "common.brightness")}
        </button>
        <button
          type="button"
          onPointerDown={() => onCompare(true)}
          onPointerUp={() => onCompare(false)}
          onPointerLeave={() => onCompare(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M12 4v16" />
          </svg>
          {t(lang, "clinic.compare")}
        </button>
        <button type="button" className={cn(adjust.showOverlay && "on")} onClick={() => onAdjust({ showOverlay: !adjust.showOverlay })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />
          </svg>
          {t(lang, "clinic.aiLayer")}
        </button>
        <button type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="2" y="8" width="20" height="8" rx="1.5" />
            <path d="M6 8v4M10 8v3M14 8v4M18 8v3" />
          </svg>
          {t(lang, "clinic.measure")}
        </button>
        <button type="button" onClick={onReset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5" />
          </svg>
          {t(lang, "common.reset")}
        </button>
      </div>

      <div className={cn("pop", tone)}>
        <label className="pc1">
          {t(lang, "common.contrast")}
          <input
            type="range"
            min={80}
            max={200}
            value={Math.round(adjust.contrast * 100)}
            onChange={(event) => onAdjust({ contrast: Number(event.target.value) / 100 })}
          />
        </label>
        <label className="pb1">
          {t(lang, "common.brightness")}
          <input
            type="range"
            min={60}
            max={160}
            value={100 + adjust.brightness}
            onChange={(event) => onAdjust({ brightness: Number(event.target.value) - 100 })}
          />
        </label>
        <button type="button" className={cn(adjust.invert && "on")} onClick={() => onAdjust({ invert: !adjust.invert })}>
          {t(lang, "common.invert")}
        </button>
      </div>

      <div className="vlg">
        <span>{t(lang, "clinic.showFindings")}</span>
        <button type="button" className={cn(!filter && "on")} onClick={() => onFilter(null)}>
          {t(lang, "clinic.filterAll")} ({findings.length})
        </button>
        {[...counts.entries()].map(([key, item]) => (
          <button key={key} type="button" className={cn(filter === key && "on")} onClick={() => onFilter(filter === key ? null : key)}>
            <i className="d" style={{ background: `var(${item.colorVar})` }} />
            {findingLabel(lang, key)} ({item.n})
          </button>
        ))}
      </div>
    </>
  );
}
