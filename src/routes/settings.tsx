import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SPECIALISTS } from "@/lib/dentaai/ensemble";
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t(lang, "settings.title")}</h1>
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
                lang === code ? "bg-foreground text-card" : "bg-card text-muted-foreground",
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
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(lang, "settings.thresholdHint")}</p>
          <Slider
            className="mt-4"
            min={0.25}
            max={0.9}
            step={0.01}
            value={[threshold]}
            onValueChange={([v]) => setThreshold(v ?? 0.4)}
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
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>{t(lang, "settings.specCaries")}</li>
              <li>{t(lang, "settings.specPeriapical")}</li>
              <li>{t(lang, "settings.specBone")}</li>
              <li>{t(lang, "settings.specImpaction")}</li>
              <li>{t(lang, "settings.specImplant")}</li>
              <li>{t(lang, "settings.specRestorations")}</li>
              <li>{t(lang, "settings.specMissing")}</li>
            </ul>
          </li>
          <li className="rounded-xl bg-muted p-3">
            <p className="font-medium">{t(lang, "settings.intraModels")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(lang, "settings.specYuzeysel")}</p>
          </li>
          <li className="rounded-xl bg-muted p-3">
            <p className="font-medium">{t(lang, "settings.fusion")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {Object.values(SPECIALISTS)
                .filter((s) => s.section === "xray")
                .map((s) => `${s.id}${s.enabled ? "" : " (off)"}`)
                .join(" · ")}
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
