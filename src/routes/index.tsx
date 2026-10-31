import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
    <div className="space-y-4">
      <section className="card-surface rounded-2xl p-5">
        <h1 className="text-xl font-semibold leading-tight">{t(lang, "home.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "home.lead")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/xray">{t(lang, "home.openXray")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/intraoral">{t(lang, "home.openIntra")}</Link>
          </Button>
          <button type="button" className="ib" onClick={loadDemo}>
            {t(lang, "common.loadDemo")}
          </button>
        </div>
      </section>

      <section className="kp">
        <div>
          <b>{fusion.xrayCount}</b>
          <span>{t(lang, "nav.xray")}</span>
        </div>
        <div>
          <b>{fusion.intraCount}</b>
          <span>{t(lang, "nav.intraoral")}</span>
        </div>
        <div>
          <b>{fusion.sharedCount}</b>
          <span>{t(lang, "home.statsS")}</span>
        </div>
        <div>
          <b>{fusion.xrayCount + fusion.intraCount}</b>
          <span>{t(lang, "common.detected")}</span>
        </div>
      </section>

      <section className="pan">
        <ModalityTile
          to="/xray"
          title={t(lang, "nav.xray")}
          body={t(lang, "home.xrayDiseases")}
          image={xrayImage}
          count={fusion.xrayCount}
        />
        <ModalityTile
          to="/intraoral"
          title={t(lang, "nav.intraoral")}
          body={t(lang, "home.intraDiseases")}
          image={intraoralImage}
          count={fusion.intraCount}
        />
        <Link to="/report">
          <b>{t(lang, "home.openReport")}</b>
          <span>{t(lang, "home.lead")}</span>
        </Link>
      </section>
    </div>
  );
}

function ModalityTile({
  to,
  title,
  body,
  image,
  count,
}: {
  to: "/xray" | "/intraoral";
  title: string;
  body: string;
  image: string | null;
  count: number;
  icon?: ReactNode;
}) {
  return (
    <Link to={to}>
      {image ? (
        <span className="mb-2 block overflow-hidden rounded-[8px] bg-film">
          <img src={image} alt="" className="aspect-[16/7] w-full object-cover" />
        </span>
      ) : null}
      <b>
        {title} · {count}
      </b>
      <span>{body}</span>
    </Link>
  );
}
