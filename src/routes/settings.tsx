import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const lang = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const threshold = useApp((s) => s.threshold);
  const setThreshold = useApp((s) => s.setThreshold);
  const overlayDefault = useApp((s) => s.overlayDefault);
  const setOverlayDefault = useApp((s) => s.setOverlayDefault);
  const loadDemo = useApp((s) => s.loadDemo);
  const clearCase = useApp((s) => s.clearCase);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t(lang, "settings.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "settings.lead")}</p>
      </div>

      <section className="card-surface rounded-2xl p-5">
        <h2 className="text-sm font-semibold">{t(lang, "settings.language")}</h2>
        <div className="mt-3 flex gap-2">
          {(["en", "tr"] as const).map((code) => (
            <button
              type="button"
              key={code}
              onClick={() => setLanguage(code)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium",
                lang === code ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {code === "en" ? t(lang, "common.english") : t(lang, "common.turkish")}
            </button>
          ))}
        </div>
      </section>

      <section className="card-surface space-y-5 rounded-2xl p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{t(lang, "settings.threshold")}</h2>
            <span className="text-sm tabular-nums text-muted-foreground">{Math.round(threshold * 100)}%</span>
          </div>
          <Slider
            className="mt-4"
            min={0.05}
            max={0.95}
            step={0.01}
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v ?? 0.25)}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t(lang, "settings.overlay")}</h2>
          </div>
          <Switch checked={overlayDefault} onCheckedChange={setOverlayDefault} />
        </div>
      </section>

      <section className="card-surface rounded-2xl p-5">
        <h2 className="text-sm font-semibold">{t(lang, "settings.models")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(lang, "settings.modelsLead")}</p>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="rounded-xl bg-muted p-3">
            <p className="font-medium">{t(lang, "settings.xrayModels")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              models/xray/ — YOLOv11 · Faster R-CNN · RetinaNet · Mask R-CNN · DINO · Soft Voting
            </p>
          </li>
          <li className="rounded-xl bg-muted p-3">
            <p className="font-medium">{t(lang, "settings.intraModels")}</p>
            <p className="mt-1 text-xs text-muted-foreground">models/intraoral/ — YOLOv8s / YOLOv11s</p>
          </li>
          <li className="rounded-xl bg-muted p-3">
            <p className="font-medium">{t(lang, "settings.fusion")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Late fusion on normalized labels, with Grad-CAM heatmaps on the AI view.
            </p>
          </li>
        </ul>
      </section>

      <section className="card-surface rounded-2xl p-5">
        <h2 className="text-sm font-semibold">{t(lang, "settings.about")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(lang, "settings.aboutBody")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => {
              loadDemo();
              toast.success(t(lang, "common.loadDemo"));
            }}
          >
            {t(lang, "settings.reload")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearCase();
              toast.message(t(lang, "settings.clear"));
            }}
          >
            {t(lang, "settings.clear")}
          </Button>
        </div>
      </section>
    </div>
  );
}
