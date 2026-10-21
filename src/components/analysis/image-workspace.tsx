import {
  Contrast,
  Download,
  FlipHorizontal,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  SunMedium,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { FindingOverlay } from "@/components/analysis/finding-overlay";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/dentaai/i18n";
import { objectContainRect, type ContainRect } from "@/lib/dentaai/image-contain";
import type { Finding, ImageAdjust, Modality, ViewId } from "@/lib/dentaai/types";
import { useApp } from "@/lib/dentaai/store";
import { fileToDataUrl, cn } from "@/lib/utils";

const XRAY_VIEWS: { id: ViewId; title: string }[] = [
  { id: "overview", title: "views.overview" },
  { id: "health", title: "views.health" },
  { id: "ai", title: "views.ai" },
  { id: "bone", title: "views.bone" },
];

const INTRA_VIEWS: { id: ViewId; title: string }[] = [
  { id: "overview", title: "views.intraOverview" },
  { id: "health", title: "views.surface" },
  { id: "ai", title: "views.gums" },
  { id: "bone", title: "views.intraAi" },
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
}) {
  const lang = useApp((s) => s.language);
  const selectedFindingId = useApp((s) => s.selectedFindingId);
  const setSelectedFindingId = useApp((s) => s.setSelectedFindingId);
  const hiddenFindingIds = useApp((s) => s.hiddenFindingIds);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [frame, setFrame] = useState<ContainRect | null>(null);
  const views = modality === "xray" ? XRAY_VIEWS : INTRA_VIEWS;

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

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-3 py-2">
        {leading}
        {trailing}
        <ToolChip
          icon={<Plus />}
          label={t(lang, "common.zoom")}
          active={adjust.zoom > 1}
          onClick={() => onAdjust({ zoom: adjust.zoom > 1 ? 1 : 1.6, panX: 0, panY: 0 })}
        />
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
        className="relative min-h-0 flex-1 overflow-hidden bg-film"
        onWheel={(e) => {
          e.preventDefault();
          const next = Math.min(3, Math.max(1, adjust.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
          onAdjust({ zoom: next });
        }}
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
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "toolbar-chip inline-flex h-9 items-center gap-1.5 rounded-md bg-card px-2.5 text-xs font-medium text-foreground",
        active && "ring-1 ring-primary/40",
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
