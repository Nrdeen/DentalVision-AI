import {
  Contrast,
  Crop,
  Download,
  Expand,
  FlipHorizontal,
  Images,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  ScanSearch,
  SunMedium,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { FindingOverlay } from "@/components/analysis/finding-overlay";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/dentaai/i18n";
import type { Finding, ImageAdjust, Modality, ViewId } from "@/lib/dentaai/types";
import { useApp } from "@/lib/dentaai/store";
import { fileToDataUrl, cn } from "@/lib/utils";

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
}) {
  const lang = useApp((s) => s.language);
  const selectedFindingId = useApp((s) => s.selectedFindingId);
  const setSelectedFindingId = useApp((s) => s.setSelectedFindingId);
  const hiddenFindingIds = useApp((s) => s.hiddenFindingIds);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState(false);
  const [natural, setNatural] = useState({ w: 16, h: 9 });
  const views = modality === "xray" ? XRAY_VIEWS : INTRA_VIEWS;

  const onFile = async (file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    onUpload(url);
  };

  const cycleView = (dir: 1 | -1) => {
    const i = views.findIndex((v) => v.id === adjust.view);
    const next = views[(i + dir + views.length) % views.length];
    onAdjust({ view: next.id });
  };

  return (
    <div className="card-surface overflow-hidden rounded-2xl p-3">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ToolChip
          icon={<ScanSearch />}
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
        ) : (
          <ToolChip icon={<Crop />} label={t(lang, "common.crop")} active={crop} onClick={() => setCrop((v) => !v)} />
        )}
        <ToolChip icon={<RotateCcw />} label={t(lang, "common.reset")} onClick={onReset} />
        <div className="ml-auto flex rounded-xl bg-secondary p-1">
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold",
              adjust.showOverlay ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
            onClick={() => onAdjust({ showOverlay: true })}
          >
            {t(lang, "common.2d")}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold",
              !adjust.showOverlay ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
            onClick={() => onAdjust({ showOverlay: false })}
          >
            {t(lang, "common.original")}
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-xl bg-foreground"
        onWheel={(e) => {
          e.preventDefault();
          const next = Math.min(3, Math.max(1, adjust.zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
          onAdjust({ zoom: next });
        }}
      >
        {image ? (
          <div
            className="relative mx-auto w-full max-h-[70vh]"
            style={{
              aspectRatio: `${Math.max(1, natural.w)} / ${Math.max(1, natural.h)}`,
              transform: `translate(${adjust.panX}px, ${adjust.panY}px) scale(${adjust.zoom})`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={image}
              alt={modality === "xray" ? "Panoramic radiograph" : "Intraoral photograph"}
              className="absolute inset-0 size-full object-contain"
              style={{ filter: filterCss(adjust, adjust.view) }}
              draggable={false}
              crossOrigin="anonymous"
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth && el.naturalHeight) {
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                }
              }}
            />
            {adjust.showOverlay ? (
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
                />
              </>
            ) : null}
            {crop ? <div className="absolute inset-8 rounded-lg border-2 border-dashed border-primary-foreground/80" /> : null}
          </div>
        ) : (
          <button
            type="button"
            className="flex aspect-16/9 w-full flex-col items-center justify-center gap-3 bg-secondary text-muted-foreground"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-foreground/55 text-primary-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm font-medium">{t(lang, "common.analyzing")}</p>
          </div>
        ) : null}

        <button
          type="button"
          className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground"
          onClick={() => cycleView(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground"
          onClick={() => cycleView(1)}
        >
          ›
        </button>

        <div className="absolute bottom-3 left-3 rounded-lg bg-foreground/70 px-2 py-1 text-xs text-primary-foreground">
          {views.findIndex((v) => v.id === adjust.view) + 1}/{views.length}
        </div>
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

      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {views.map((v) => (
          <button
            type="button"
            key={v.id}
            onClick={() => onAdjust({ view: v.id, showOverlay: true })}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition-colors",
              adjust.view === v.id ? "border-primary" : "border-border",
            )}
          >
            <div className="relative aspect-16/7 bg-foreground">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="size-full object-cover"
                  style={{ filter: filterCss(adjust, v.id) }}
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <Images className="size-5" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 px-2.5 py-2">
              <Expand className="size-3.5 text-primary" />
              <div>
                <p className="text-xs font-semibold">{t(lang, v.title)}</p>
                <p className="text-[11px] text-muted-foreground">{t(lang, v.hint)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
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
        "toolbar-chip inline-flex h-9 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-medium text-foreground",
        active && "ring-2 ring-primary/25",
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
      className="flex size-8 items-center justify-center rounded-lg bg-foreground/70 text-primary-foreground [&_svg]:size-3.5"
    >
      {children}
    </button>
  );
}
