import {
  Contrast,
  Download,
  Expand,
  FlipHorizontal,
  Hand,
  Images,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  SunMedium,
  Upload,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ClinicFdiChart } from "@/components/analysis/clinic-fdi-chart";
import { FilmCrops } from "@/components/analysis/film-crops";
import { FilmRail } from "@/components/analysis/film-rail";
import { FindingOverlay } from "@/components/analysis/finding-overlay";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/dentaai/i18n";
import { objectContainRect, type ContainRect } from "@/lib/dentaai/image-contain";
import type { Finding, ImageAdjust, Modality, ViewId } from "@/lib/dentaai/types";
import { fdiOf } from "@/lib/dentaai/tooth-numbering";
import { useApp } from "@/lib/dentaai/store";
import { fileToDataUrl, cn } from "@/lib/utils";

const ARCH_UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const ARCH_LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function archLeft(index: number) {
  return 30 + index * (44 / 15);
}

function toothBand(tooth: number | null) {
  if (tooth == null) return null;
  let index = ARCH_UPPER.indexOf(tooth);
  let upper = true;
  if (index < 0) {
    index = ARCH_LOWER.indexOf(tooth);
    upper = false;
  }
  if (index < 0) return null;
  return <span className="dx-band" style={{ left: `${archLeft(index)}%`, top: upper ? "16%" : "50%" }} />;
}

function filmFilter(adjust: ImageAdjust, view: ViewId) {
  const user = `brightness(${100 + adjust.brightness}%) contrast(${Math.round(adjust.contrast * 100)}%)${adjust.invert ? " invert(1)" : ""}`;
  const preset =
    view === "health"
      ? "brightness(1.15) contrast(1.45) grayscale(1)"
      : view === "ai"
        ? "grayscale(1) contrast(1.5) sepia(1) hue-rotate(215deg) saturate(3.2)"
        : view === "bone"
          ? "invert(1) contrast(1.3)"
          : "";
  if (!adjust.showOverlay) return preset || "none";
  return `${user} ${preset}`.trim();
}

const XRAY_VIEWS: { id: ViewId; title: string; hint: string }[] = [
  { id: "overview", title: "views.overview", hint: "views.overviewHint" },
  { id: "health", title: "views.health", hint: "views.healthHint" },
  { id: "ai", title: "views.ai", hint: "views.aiHint" },
  { id: "bone", title: "views.bone", hint: "views.boneHint" },
];

const INTRA_VIEWS: { id: ViewId; title: string; hint: string }[] = [
  { id: "overview", title: "views.intraOverview", hint: "views.intraOverviewHint" },
  { id: "health", title: "views.surface", hint: "views.surfaceHint" },
  { id: "ai", title: "views.gums", hint: "views.gumsHint" },
  { id: "bone", title: "views.intraAi", hint: "views.intraAiHint" },
];

function filterCss(adjust: ImageAdjust, view: ViewId) {
  const brightness = 1 + adjust.brightness / 100;
  const contrast = adjust.contrast;
  const invert = adjust.invert || view === "bone" ? 1 : 0;
  const extra = view === "health" ? " saturate(1.15)" : view === "ai" ? " contrast(1.12)" : "";
  return `brightness(${brightness}) contrast(${contrast}) invert(${invert})${extra}`;
}

function Heatmap({ findings }: { findings: Finding[] }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {findings.map((f) => {
        const [x1, y1, x2, y2] = f.bbox;
        const cx = ((x1 + x2) / 2) * 100;
        const cy = ((y1 + y2) / 2) * 100;
        return (
          <div
            key={`h-${f.id}`}
            className="absolute size-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-2xl"
            style={{
              left: `${cx}%`,
              top: `${cy}%`,
              background: `radial-gradient(circle, var(${f.colorVar}) 0%, transparent 70%)`,
            }}
          />
        );
      })}
    </div>
  );
}

export function ImageWorkspace({
  modality,
  image,
  findings,
  adjust,
  onAdjust,
  onReset,
  onUpload,
  analyzing,
  dropLabel,
  leading,
  trailing,
  overlay,
  variant = "default",
  qualityBadge,
  filmIndex,
  filmCount,
  onPrev,
  onNext,
}: {
  modality: Modality;
  image: string | null;
  findings: Finding[];
  adjust: ImageAdjust;
  onAdjust: (patch: Partial<ImageAdjust>) => void;
  onReset: () => void;
  onUpload: (dataUrl: string) => void;
  analyzing: boolean;
  dropLabel: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  overlay?: ReactNode;
  variant?: "default" | "workstation";
  qualityBadge?: ReactNode;
  filmIndex?: number;
  filmCount?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const lang = useApp((s) => s.language);
  const selectedFindingId = useApp((s) => s.selectedFindingId);
  const setSelectedFindingId = useApp((s) => s.setSelectedFindingId);
  const hiddenFindingIds = useApp((s) => s.hiddenFindingIds);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [frame, setFrame] = useState<ContainRect | null>(null);
  const [tooth, setTooth] = useState<number | null>(null);
  const [panMode, setPanMode] = useState(false);
  const [tone, setTone] = useState<"c" | "b" | null>(null);
  const [filterKey, setFilterKey] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const views = modality === "xray" ? XRAY_VIEWS : INTRA_VIEWS;
  const workstation = variant === "workstation";
  const canPan = panMode && adjust.zoom > 1;
  const visibleFindings = filterKey ? findings.filter((f) => f.key === filterKey) : findings;
  const overlayOn = adjust.showOverlay && !comparing;

  const measureFrame = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img?.naturalWidth) {
      setFrame(null);
      return;
    }
    setFrame(
      objectContainRect(
        stage.clientWidth,
        stage.clientHeight,
        img.naturalWidth,
        img.naturalHeight,
      ),
    );
  }, []);

  useLayoutEffect(() => {
    setFrame(null);
    measureFrame();
    const stage = stageRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(measureFrame);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [measureFrame, image]);

  const onFile = async (file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    onUpload(url);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canPan) return;
    if ((event.target as HTMLElement).closest("[data-finding]")) return;
    dragRef.current = { x: event.clientX, y: event.clientY, panX: adjust.panX, panY: adjust.panY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    onAdjust({
      panX: drag.panX + (event.clientX - drag.x),
      panY: drag.panY + (event.clientY - drag.y),
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const selectedFinding = findings.find((f) => f.id === selectedFindingId) ?? null;
  const selectedTooth = selectedFinding ? fdiOf(selectedFinding) : tooth;

  const clearFocus = () => {
    setTooth(null);
    setSelectedFindingId(null);
    onAdjust({ zoom: 1, panX: 0, panY: 0 });
  };

  const openFinding = (hit: Finding) => {
    const n = fdiOf(hit);
    if (n) setTooth(n);
    setSelectedFindingId(hit.id);
    const stage = stageRef.current;
    if (!stage) return;
    const [x1, y1, x2, y2] = hit.bbox;
    const z = Math.max(2.1, adjust.zoom === 1 ? 2.1 : adjust.zoom);
    onAdjust({
      zoom: z,
      panX: -((x1 + x2) / 2 - 0.5) * stage.clientWidth * z,
      panY: -((y1 + y2) / 2 - 0.5) * stage.clientHeight * z,
      showOverlay: true,
    });
  };

  const focusTooth = (n: number) => {
    const hit = findings.find((f) => fdiOf(f) === n) ?? null;
    if (selectedTooth === n) {
      clearFocus();
      return;
    }
    if (hit) openFinding(hit);
    else setTooth(n);
  };

  if (workstation && modality === "xray") {
    return (
      <>
        <div className="dx-stage">
          <div className="vh">
            <div>
              <h2>{t(lang, "clinic.filmLabel")}</h2>
              <p>{t(lang, "clinic.uploadHint")}</p>
            </div>
            <button type="button" className="up" onClick={() => inputRef.current?.click()}>
              <Upload />
              {image ? t(lang, "common.replace") : t(lang, "common.upload")}
            </button>
          </div>
          <FilmRail
            lang={lang}
            findings={findings}
            adjust={adjust}
            filter={filterKey}
            panMode={panMode}
            tone={tone}
            onTone={setTone}
            onFilter={(key) => {
              setFilterKey(key);
              setSelectedFindingId(null);
            }}
            onAdjust={onAdjust}
            onReset={() => {
              setTooth(null);
              setFilterKey(null);
              setPanMode(false);
              setTone(null);
              clearFocus();
              onReset();
            }}
            onPanMode={setPanMode}
            onCompare={setComparing}
          />
          <div
            ref={stageRef}
            className={cn("dx-viewer", canPan && "cursor-grab active:cursor-grabbing", panMode && "pn")}
            onWheel={(e) => {
              e.preventDefault();
              const next = Math.min(3, Math.max(1, adjust.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
              onAdjust({ zoom: next, ...(next === 1 ? { panX: 0, panY: 0 } : {}) });
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void onFile(event.dataTransfer.files[0]);
            }}
          >
            {image ? (
              <div
                className="absolute inset-0"
                style={{
                  transform: `translate(${adjust.panX}px, ${adjust.panY}px) scale(${adjust.zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1)",
                }}
              >
                <img
                  ref={imgRef}
                  src={image}
                  alt={t(lang, "views.overview")}
                  className="size-full"
                  style={{ objectFit: "fill", filter: filmFilter(adjust, adjust.view) }}
                  draggable={false}
                  crossOrigin="anonymous"
                  onLoad={measureFrame}
                />
                {toothBand(tooth)}
                {overlayOn ? (
                  <FindingOverlay
                    findings={visibleFindings}
                    hiddenIds={hiddenFindingIds}
                    lang={lang}
                    selectedId={selectedFindingId}
                    onSelect={(id) => {
                      const hit = visibleFindings.find((f) => f.id === id);
                      if (hit) openFinding(hit);
                    }}
                    filmImage={imgRef.current}
                  />
                ) : null}
              </div>
            ) : (
              <button type="button" className="flex size-full flex-col items-center justify-center gap-3 text-film-foreground/70" onClick={() => inputRef.current?.click()}>
                <Upload className="size-8" />
                <span className="text-sm">{dropLabel}</span>
              </button>
            )}
            {analyzing ? <span className="dx-scan" /> : null}
            {image ? (
              <>
                {selectedFinding ? (
                  <>
                    <div className="hud">
                      {t(lang, "clinic.focus", {
                        n: fdiOf(selectedFinding) ?? "—",
                        name: t(lang, `findings.${selectedFinding.key}`),
                      })}
                    </div>
                    <button type="button" className="fb" onClick={clearFocus}>
                      {t(lang, "clinic.showAll")}
                    </button>
                  </>
                ) : null}
                <div className="vfl">ⓘ {t(lang, "clinic.hudReview")}</div>
                <div className="vfr">
                  <span className="rl">
                    <b>R</b>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
                    </svg>
                    <b>L</b>
                  </span>
                  <span>
                    {t(lang, "clinic.filmLabel")}
                    {"  |  "}
                    {new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date())}
                  </span>
                </div>
              </>
            ) : null}
            {qualityBadge}
            {overlay}
          </div>
          <FilmCrops
            image={image}
            findings={visibleFindings}
            lang={lang}
            selectedTooth={selectedTooth}
            onPick={focusTooth}
          />
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void onFile(file); }} />
        </div>
        <ClinicFdiChart
          findings={findings}
          lang={lang}
          selectedTooth={selectedTooth}
          onPick={focusTooth}
        />
        <div className="dx-thumbs">
          {views.map((v, index) => (
            <button key={v.id} type="button" className={cn("dx-th", adjust.view === v.id && "on")} aria-pressed={adjust.view === v.id} onClick={() => onAdjust({ view: v.id, showOverlay: true })}>
              <div className="im">
                {image ? <img src={image} alt="" style={{ filter: filmFilter({ ...adjust, showOverlay: true, invert: false, brightness: 0, contrast: 1 }, v.id) }} /> : <Images className="m-auto size-5 text-white/70" />}
                <div className="num">0{index + 1}</div>
              </div>
              <div className="tl">{t(lang, v.title)}</div>
              <div className="ts">{t(lang, v.hint)}</div>
            </button>
          ))}
        </div>
      </>
    );
  }

  const tools = (
    <>
      <ToolChip
        icon={<Plus />}
        label={`${t(lang, "common.zoom")} ${Math.round(adjust.zoom * 100)}%`}
        active={adjust.zoom > 1}
        onClick={() => onAdjust({ zoom: adjust.zoom > 1 ? 1 : 1.6, panX: 0, panY: 0 })}
      />
      {canPan ? <ToolChip icon={<Hand />} label={t(lang, "xray.ws.pan")} active /> : null}
      {modality === "xray" ? (
        <ToolChip
          icon={<FlipHorizontal />}
          label={t(lang, "common.invert")}
          active={adjust.invert}
          onClick={() => onAdjust({ invert: !adjust.invert })}
        />
      ) : (
        <ToolChip
          icon={<SunMedium />}
          label={t(lang, "common.brightness")}
          active={adjust.brightness !== 0}
          onClick={() => onAdjust({ brightness: adjust.brightness === 0 ? 18 : 0 })}
        />
      )}
      <ToolChip
        icon={<Contrast />}
        label={t(lang, "common.contrast")}
        active={adjust.contrast !== 1}
        onClick={() => onAdjust({ contrast: adjust.contrast === 1 ? 1.35 : 1 })}
      />
      {modality === "xray" ? (
        <ToolChip
          icon={<SunMedium />}
          label={t(lang, "common.brightness")}
          active={adjust.brightness !== 0}
          onClick={() => onAdjust({ brightness: adjust.brightness === 0 ? 16 : 0 })}
        />
      ) : null}
      <ToolChip icon={<RotateCcw />} label={t(lang, "common.reset")} onClick={onReset} />

      {modality === "xray" ? null : (
        <div className="tab-track">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              data-active={adjust.view === v.id}
              className="tab-btn"
              onClick={() => onAdjust({ view: v.id, showOverlay: true })}
            >
              {t(lang, v.title)}
            </button>
          ))}
        </div>
      )}

      <div className="tab-track">
        <button
          type="button"
          data-active={adjust.showOverlay}
          className="tab-btn"
          onClick={() => onAdjust({ showOverlay: true })}
        >
          {t(lang, "common.2d")}
        </button>
        <button
          type="button"
          data-active={!adjust.showOverlay}
          className="tab-btn"
          onClick={() => onAdjust({ showOverlay: false })}
        >
          {t(lang, "common.original")}
        </button>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col",
        "dx-stage overflow-hidden",
      )}
    >
      <div
        className={cn(
          "rail mb-2 flex flex-wrap items-center gap-2",
        )}
      >
        {leading}
        {trailing}
        {tools}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void onFile(file);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload />
            {image ? t(lang, "common.replace") : t(lang, "common.upload")}
          </Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden",
          "dx-viewer grow min-h-64 flex-1",
          canPan && "cursor-grab active:cursor-grabbing",
        )}
        onWheel={(e) => {
          e.preventDefault();
          const next = Math.min(3, Math.max(1, adjust.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
          onAdjust({ zoom: next, ...(next === 1 ? { panX: 0, panY: 0 } : {}) });
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {image ? (
          <div
            className={frame ? "absolute" : "absolute inset-0"}
            style={{
              ...(frame
                ? { left: frame.x, top: frame.y, width: frame.w, height: frame.h }
                : null),
              transform: `translate(${adjust.panX}px, ${adjust.panY}px) scale(${adjust.zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img
              ref={imgRef}
              src={image}
              alt={modality === "xray" ? "Panoramic radiograph" : "Intraoral photograph"}
              className={frame ? "size-full max-w-none" : "size-full object-contain"}
              style={{ filter: filterCss(adjust, adjust.view) }}
              draggable={false}
              crossOrigin="anonymous"
              onLoad={measureFrame}
            />
            {frame && adjust.showOverlay ? (
              <>
                {adjust.view === "ai" || adjust.view === "bone" ? (
                  <Heatmap findings={findings.filter((f) => !hiddenFindingIds.includes(f.id))} />
                ) : null}
                <FindingOverlay
                  findings={findings}
                  hiddenIds={hiddenFindingIds}
                  lang={lang}
                  selectedId={selectedFindingId}
                  onSelect={setSelectedFindingId}
                  filmImage={imgRef.current}
                />
              </>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="flex size-full flex-col items-center justify-center gap-3 text-film-foreground/70"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void onFile(e.dataTransfer.files[0]);
            }}
          >
            <Upload className="size-8" />
            <span className="text-sm">{dropLabel}</span>
          </button>
        )}

        {analyzing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-film/70 text-film-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm font-medium">{t(lang, "common.analyzing")}</p>
          </div>
        ) : null}

        {overlay}

        {qualityBadge}

        <div className="absolute right-3 bottom-3 flex gap-1.5">
          <IconBtn onClick={() => onAdjust({ zoom: Math.min(3, adjust.zoom + 0.25) })}>
            <Plus />
          </IconBtn>
          <IconBtn onClick={() => onAdjust({ zoom: Math.max(1, adjust.zoom - 0.25) })}>
            <Minus />
          </IconBtn>
          <IconBtn
            onClick={() => {
              const el = stageRef.current;
              if (!el) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void el.requestFullscreen();
            }}
          >
            <Maximize2 />
          </IconBtn>
          <IconBtn
            onClick={() => {
              if (!image) return;
              const a = document.createElement("a");
              a.href = image;
              a.download = `${modality}.jpg`;
              a.click();
            }}
          >
            <Download />
          </IconBtn>
        </div>
      </div>

      {modality === "xray" ? (
        <div className="grid shrink-0 grid-cols-2 gap-2 bg-card px-3 py-3 md:grid-cols-4">
          {views.map((v) => {
            const active = adjust.view === v.id;
            return (
              <button
                type="button"
                key={v.id}
                onClick={() => onAdjust({ view: v.id, showOverlay: true })}
                className={cn(
                  "overflow-hidden rounded-xl border bg-card text-left transition-colors",
                  active ? "border-primary" : "border-border",
                )}
              >
                <div className="relative h-20 overflow-hidden bg-film">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="size-full object-cover"
                      style={{ filter: filterCss(adjust, v.id) }}
                      draggable={false}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Images className="size-5" />
                    </div>
                  )}
                  <Expand className="absolute bottom-1.5 left-1.5 size-3.5 text-film-foreground" />
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold leading-tight">{t(lang, v.title)}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t(lang, v.hint)}</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {workstation && (onPrev || onNext) ? (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2 text-xs">
          <button
            type="button"
            className="rounded-md px-2 py-1 font-medium text-foreground disabled:opacity-40"
            disabled={!onPrev}
            onClick={onPrev}
          >
            {t(lang, "xray.ws.prev")}
          </button>
          <span className="tabular-nums text-muted-foreground">
            {t(lang, "xray.ws.filmOf", { i: (filmIndex ?? 0) + 1, n: filmCount ?? 1 })}
          </span>
          <button
            type="button"
            className="rounded-md px-2 py-1 font-medium text-foreground disabled:opacity-40"
            disabled={!onNext}
            onClick={onNext}
          >
            {t(lang, "xray.ws.next")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ToolChip({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "dx-btn",
        active && "on",
      )}
    >
      <span className="text-muted-foreground [&_svg]:size-3.5">{icon}</span>
      {label}
    </button>
  );
}

function IconBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md bg-film-foreground/12 text-film-foreground [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
