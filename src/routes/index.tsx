import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Camera, FileText, Images, Sparkles } from "lucide-react";
import { FindingCards } from "@/components/analysis/finding-cards";
import { Button } from "@/components/ui/button";
import { fuseFindings } from "@/lib/dentaai/fusion";
import { t } from "@/lib/dentaai/i18n";
import { useApp } from "@/lib/dentaai/store";
import { filterByQuery } from "@/components/layout/app-shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const lang = useApp((s) => s.language);
  const query = useApp((s) => s.query);
  const xrayImage = useApp((s) => s.xrayImage);
  const intraoralImage = useApp((s) => s.intraoralImage);
  const xrayFindings = filterByQuery(useApp((s) => s.xrayFindings), query, lang);
  const intraoralFindings = filterByQuery(useApp((s) => s.intraoralFindings), query, lang);
  const fusion = fuseFindings(xrayFindings, intraoralFindings);
  const loadDemo = useApp((s) => s.loadDemo);

  const overall =
    fusion.overallKey === "moderate"
      ? t(lang, "report.moderate")
      : fusion.overallKey === "mild"
        ? t(lang, "report.mild")
        : t(lang, "report.lowRisk");

  return (
    <div className="space-y-5">
      <section className="card-surface overflow-hidden rounded-2xl p-5 md:p-7">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t(lang, "home.kicker")}</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t(lang, "home.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t(lang, "home.lead")}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/xray">
              {t(lang, "home.openXray")}
              <ArrowRight />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/intraoral">{t(lang, "home.openIntra")}</Link>
          </Button>
          <Button variant="ghost" onClick={loadDemo}>
            {t(lang, "common.loadDemo")}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t(lang, "home.statsX")} value={fusion.xrayCount} tone="primary" />
        <Stat label={t(lang, "home.statsI")} value={fusion.intraCount} tone="low" />
        <Stat label={t(lang, "home.statsS")} value={fusion.sharedCount} tone="finding-gingivitis" />
        <Stat label={t(lang, "home.statsO")} value={overall} tone="medium" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PreviewCard
          title={t(lang, "report.xrayTitle")}
          image={xrayImage}
          to="/xray"
          cta={t(lang, "home.openXray")}
          icon={<Images className="size-4" />}
          diseases={t(lang, "home.xrayDiseases")}
        />
        <PreviewCard
          title={t(lang, "report.intraTitle")}
          image={intraoralImage}
          to="/intraoral"
          cta={t(lang, "home.openIntra")}
          icon={<Camera className="size-4" />}
          diseases={t(lang, "home.intraDiseases")}
        />
      </section>

      {xrayFindings.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">{t(lang, "report.xrayTitle")}</h2>
          <FindingCards findings={xrayFindings.slice(0, 4)} />
        </section>
      ) : null}

      <section className="card-surface rounded-2xl p-5">
        <h2 className="mb-4 text-sm font-semibold">{t(lang, "home.pipeline")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Step icon={<Images className="size-4" />} title={t(lang, "home.s1")} body={t(lang, "home.s1d")} />
          <Step icon={<Camera className="size-4" />} title={t(lang, "home.s2")} body={t(lang, "home.s2d")} />
          <Step icon={<Brain className="size-4" />} title={t(lang, "home.s3")} body={t(lang, "home.s3d")} />
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link to="/report">
              <FileText />
              {t(lang, "home.openReport")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: `var(--color-${tone})` }}>
        {value}
      </p>
    </div>
  );
}

function PreviewCard({
  title,
  image,
  to,
  cta,
  icon,
  diseases,
}: {
  title: string;
  image: string | null;
  to: "/xray" | "/intraoral";
  cta: string;
  icon: ReactNode;
  diseases: string;
}) {
  return (
    <Link to={to} className="card-surface group overflow-hidden rounded-2xl">
      <div className="relative aspect-16/8 bg-foreground">
        {image ? (
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Sparkles className="size-6" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="text-primary">{icon}</span>
            {title}
          </div>
          <span className="text-xs font-medium text-primary group-hover:underline">{cta}</span>
        </div>
        <div className="mt-3 rounded-lg bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">{t(useApp.getState().language, "home.detectedDiseases")}</p>
          <p className="mt-1 text-xs leading-relaxed text-foreground">{diseases}</p>
        </div>
      </div>
    </Link>
  );
}

function Step({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-muted p-4">
      <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-accent text-primary">{icon}</div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
