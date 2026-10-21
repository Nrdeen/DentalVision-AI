import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, FileText, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gateFindings } from "@/lib/dentaai/ensemble";
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
  const threshold = useApp((s) => s.threshold);
  const xrayFindings = gateFindings(filterByQuery(useApp((s) => s.xrayFindings), query, lang), threshold).visible;
  const intraoralFindings = gateFindings(
    filterByQuery(useApp((s) => s.intraoralFindings), query, lang),
    threshold,
  ).visible;
  const fusion = fuseFindings(xrayFindings, intraoralFindings);
  const loadDemo = useApp((s) => s.loadDemo);

  return (
    <div className="space-y-8">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2.15rem]">
          {t(lang, "home.title")}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{t(lang, "home.lead")}</p>
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

      <section className="grid gap-4 md:grid-cols-2">
        <ModalityTile
          to="/xray"
          title={t(lang, "nav.xray")}
          body={t(lang, "home.xrayDiseases")}
          image={xrayImage}
          count={fusion.xrayCount}
          icon={<Images className="size-4" />}
        />
        <ModalityTile
          to="/intraoral"
          title={t(lang, "nav.intraoral")}
          body={t(lang, "home.intraDiseases")}
          image={intraoralImage}
          count={fusion.intraCount}
          icon={<Camera className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {t(lang, "home.statsS")} {fusion.sharedCount}
        </p>
        <Button variant="outline" asChild>
          <Link to="/report">
            <FileText />
            {t(lang, "home.openReport")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ModalityTile({
  to,
  title,
  body,
  image,
  count,
  icon,
}: {
  to: "/xray" | "/intraoral";
  title: string;
  body: string;
  image: string | null;
  count: number;
  icon: ReactNode;
}) {
  return (
    <Link to={to} className="card-surface group overflow-hidden rounded-xl">
      <div className="relative aspect-[16/8] bg-film">
        {image ? <img src={image} alt="" className="size-full object-cover" /> : null}
      </div>
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="text-primary">{icon}</span>
            {title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <span className="text-lg font-semibold tabular-nums">{count}</span>
      </div>
    </Link>
  );
}
