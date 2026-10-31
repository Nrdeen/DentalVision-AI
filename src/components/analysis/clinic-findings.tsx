import { Check, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { suggestedApproach } from "@/lib/dentaai/clinical";
import { findingDesc, findingLabel, t } from "@/lib/dentaai/i18n";
import { downloadReportPdf } from "@/lib/dentaai/pdf";
import { fuseFindings } from "@/lib/dentaai/fusion";
import { toothDisplay } from "@/lib/dentaai/tooth-numbering";
import type { Finding, FindingKey, Lang, Modality } from "@/lib/dentaai/types";
import { useApp } from "@/lib/dentaai/store";
import { cn } from "@/lib/utils";

type FilterId = "all" | "dis" | "ted" | "per" | "kem" | "yuz";
type Review = "pending" | "approved" | "rejected";

const FILTERS: { id: FilterId; key: "clinic.filterAll" | "clinic.filterTooth" | "clinic.filterTx" | "clinic.filterPerio" | "clinic.filterBone" | "clinic.filterSurf" }[] = [
  { id: "all", key: "clinic.filterAll" },
  { id: "dis", key: "clinic.filterTooth" },
  { id: "ted", key: "clinic.filterTx" },
  { id: "per", key: "clinic.filterPerio" },
  { id: "kem", key: "clinic.filterBone" },
  { id: "yuz", key: "clinic.filterSurf" },
];

const GROUP: Record<FindingKey, FilterId> = {
  caries: "dis",
  deepCaries: "dis",
  xrayKuretaj: "dis",
  periapical: "dis",
  impacted: "dis",
  missingTooth: "dis",
  retainedRoot: "dis",
  fracture: "dis",
  implant: "ted",
  filling: "ted",
  crown: "ted",
  bridge: "ted",
  rootCanal: "ted",
  boneLoss: "per",
  gingivitis: "per",
  periodontitis: "per",
  plaque: "per",
  earlyCaries: "yuz",
  permanentCaries: "yuz",
  primaryCaries: "yuz",
  ulcer: "yuz",
  abrasion: "yuz",
  healthy: "yuz",
  caries1: "yuz",
  caries2: "yuz",
  caries3: "yuz",
  caries4: "yuz",
  caries5: "yuz",
  caries6: "yuz",
};

const URGENCY: Partial<Record<FindingKey, "now" | "soon" | "follow" | "routine">> = {
  periapical: "now",
  fracture: "now",
  retainedRoot: "now",
  deepCaries: "now",
  caries: "soon",
  earlyCaries: "soon",
  permanentCaries: "soon",
  primaryCaries: "soon",
  boneLoss: "soon",
  gingivitis: "soon",
  periodontitis: "soon",
  plaque: "soon",
  impacted: "follow",
  rootCanal: "follow",
  filling: "routine",
  implant: "routine",
  crown: "routine",
  bridge: "routine",
  missingTooth: "routine",
};

const TOOTH_NAME: Record<number, { en: string; tr: string }> = {
  1: { en: "central incisor", tr: "santral kesici" },
  2: { en: "lateral incisor", tr: "lateral kesici" },
  3: { en: "canine", tr: "kanin" },
  4: { en: "first premolar", tr: "1. premolar" },
  5: { en: "second premolar", tr: "2. premolar" },
  6: { en: "first molar", tr: "1. molar" },
  7: { en: "second molar", tr: "2. molar" },
  8: { en: "third molar", tr: "3. molar (yirmilik)" },
};

function fdiOf(finding: Finding) {
  const raw = toothDisplay(finding);
  const digits = raw?.match(/\d{2}/)?.[0];
  const n = digits ? Number(digits) : NaN;
  return Number.isFinite(n) ? n : null;
}

function quadrantKey(n: number | null): "clinic.q1" | "clinic.q2" | "clinic.q3" | "clinic.q4" | null {
  if (!n) return null;
  const q = Math.floor(n / 10);
  if (q === 1) return "clinic.q1";
  if (q === 2) return "clinic.q2";
  if (q === 3) return "clinic.q3";
  if (q === 4) return "clinic.q4";
  return null;
}

function cropStyle(bbox: Finding["bbox"]) {
  const [x1, y1, x2, y2] = bbox;
  const w = Math.max(0.05, x2 - x1);
  const h = Math.max(0.08, y2 - y1);
  const padX = Math.min(0.08, w * 0.8);
  const padY = Math.min(0.12, h * 0.8);
  const cw = Math.min(1, w + padX * 2);
  const ch = Math.min(1, h + padY * 2);
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const left = Math.max(0, Math.min(1 - cw, cx - cw / 2));
  const top = Math.max(0, Math.min(1 - ch, cy - ch / 2));
  return { left, top, cw, ch };
}

function FilmCrop({
  src,
  bbox,
  color,
  mask = false,
  contrast = 125,
  maskOpacity = 100,
  className,
}: {
  src: string | null;
  bbox: Finding["bbox"];
  color?: string;
  mask?: boolean;
  contrast?: number;
  maskOpacity?: number;
  className?: string;
}) {
  const { left, top, cw, ch } = cropStyle(bbox);
  return (
    <div className={cn("xv-fth", className)}>
      {src ? (
        <img
          src={src}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            width: `${100 / cw}%`,
            height: `${100 / ch}%`,
            left: `${(-left / cw) * 100}%`,
            top: `${(-top / ch) * 100}%`,
            maxWidth: "none",
            objectFit: "fill",
            filter: `contrast(${contrast}%) brightness(105%)`,
          }}
        />
      ) : (
        <span className="block size-full bg-film" />
      )}
      {mask ? (
        <span
          className="pointer-events-none absolute rounded-sm"
          style={{
            left: `${((bbox[0] - left) / cw) * 100}%`,
            top: `${((bbox[1] - top) / ch) * 100}%`,
            width: `${((bbox[2] - bbox[0]) / cw) * 100}%`,
            height: `${((bbox[3] - bbox[1]) / ch) * 100}%`,
            opacity: maskOpacity / 100,
            border: `2px solid ${color ?? "var(--ac)"}`,
            background: `${color ?? "var(--ac)"}33`,
          }}
        />
      ) : null}
    </div>
  );
}

function statusOf(finding: Finding, review: Review, lang: Lang) {
  if (review === "approved") return { id: "a" as const, label: t(lang, "clinic.approved") };
  if (review === "rejected") return { id: "r" as const, label: t(lang, "clinic.rejected") };
  if (finding.confidence >= 0.9) return { id: "b" as const, label: t(lang, "clinic.pending") };
  return { id: "e" as const, label: t(lang, "clinic.reviewing") };
}

export function ClinicFindings({
  modality,
  findings,
  withheldCount = 0,
}: {
  modality: Modality;
  findings: Finding[];
  withheldCount?: number;
}) {
  const lang = useApp((s) => s.language);
  const image = useApp((s) => (modality === "xray" ? s.xrayImage : s.intraoralImage));
  const selected = useApp((s) => s.selectedFindingId);
  const setSelected = useApp((s) => s.setSelectedFindingId);
  const [filter, setFilter] = useState<FilterId>("all");
  const [q, setQ] = useState("");
  const [onlyDetected, setOnlyDetected] = useState(false);
  const [reviews, setReviews] = useState<Record<string, Review>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [plans, setPlans] = useState<Record<string, boolean>>({});
  const [maskOpacity, setMaskOpacity] = useState(100);
  const [cropContrast, setCropContrast] = useState(130);

  const reviewOf = (id: string): Review => reviews[id] ?? "pending";

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return findings
      .filter((f) => (filter === "all" ? true : GROUP[f.key] === filter))
      .filter((f) => (onlyDetected ? reviewOf(f.id) !== "rejected" : true))
      .filter((f) => {
        if (!query) return true;
        const tooth = toothDisplay(f) ?? "";
        return (
          findingLabel(lang, f.key).toLowerCase().includes(query) ||
          tooth.includes(query) ||
          findingDesc(lang, f.descriptionKey).toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [findings, filter, onlyDetected, q, lang, reviews]);

  const teeth = new Set(findings.map((f) => toothDisplay(f)).filter(Boolean)).size;
  const avg = findings.length ? Math.round((findings.reduce((s, f) => s + f.confidence, 0) / findings.length) * 100) : 0;
  const open = findings.find((f) => f.id === selected) ?? null;

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        setSelected(null);
        return;
      }
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      event.preventDefault();
      const order = visible;
      const i = order.findIndex((f) => f.id === selected);
      if (i < 0) return;
      const next = order[(i + (event.key === "ArrowRight" ? 1 : -1) + order.length) % order.length];
      setSelected(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, visible, setSelected]);

  const setReview = (id: string, next: Review) => {
    setReviews((prev) => ({ ...prev, [id]: prev[id] === next ? "pending" : next }));
  };

  if (open) {
    return (
      <ClinicDetail
        finding={open}
        all={findings}
        visible={visible}
        lang={lang}
        image={image}
        review={reviewOf(open.id)}
        note={notes[open.id] ?? ""}
        plans={plans}
        maskOpacity={maskOpacity}
        cropContrast={cropContrast}
        onMask={setMaskOpacity}
        onContrast={setCropContrast}
        onNote={(value) => setNotes((prev) => ({ ...prev, [open.id]: value }))}
        onPlan={(key, on) => setPlans((prev) => ({ ...prev, [key]: on }))}
        onReview={setReview}
        onOpen={setSelected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <aside className="clinic-side">
      <div className="sh">
        <div className="r">
          <h2>{t(lang, "clinic.findings")}</h2>
          <span className="badge">{t(lang, "clinic.badge", { n: findings.length })}</span>
        </div>
        <div className="sum">
          <div>
            <b>{findings.length}</b>
            <span>{t(lang, "clinic.total")}</span>
          </div>
          <div>
            <b>{teeth}</b>
            <span>{t(lang, "clinic.teeth")}</span>
          </div>
          <div>
            <b>%{avg}</b>
            <span>{t(lang, "clinic.avg")}</span>
          </div>
        </div>
        <input className="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, "clinic.search")} aria-label={t(lang, "clinic.search")} />
        <div className="fl">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? "on" : undefined} onClick={() => setFilter(item.id)}>
              {t(lang, item.key)}
            </button>
          ))}
        </div>
        <label className="sw">
          <input type="checkbox" checked={onlyDetected} onChange={(e) => setOnlyDetected(e.target.checked)} />
          {t(lang, "clinic.onlyDetected")}
        </label>
      </div>

      <div className="list">
        {visible.length === 0 ? (
          <p className="meta" style={{ padding: 16 }}>
            {t(lang, "clinic.empty")}
            {withheldCount > 0 ? ` ${t(lang, "ensemble.withheld", { n: withheldCount })}` : ""}
          </p>
        ) : (
          visible.map((f) => {
            const tooth = toothDisplay(f);
            const review = reviewOf(f.id);
            const st = statusOf(f, review, lang);
            return (
              <div
                key={f.id}
                className="xv-fc"
                style={{ "--k": `var(${f.colorVar})` } as CSSProperties}
                onClick={() => setSelected(f.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(f.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <FilmCrop src={image} bbox={f.bbox} color={`var(${f.colorVar})`} mask />
                <div className="xv-fb">
                  <div className="xv-fr">
                    <b>{findingLabel(lang, f.key)}</b>
                    <span className="xv-cp">
                      <i style={{ background: `var(${f.colorVar})` }} />%{Math.round(f.confidence * 100)}
                    </span>
                  </div>
                  <div className="xv-fr2">
                    {tooth ? <span className="xv-chip">{t(lang, "clinic.tooth", { n: tooth })}</span> : null}
                    <span className={cn("xv-sp", `s${st.id}`)}>{st.label}</span>
                  </div>
                  <p className="xv-d">{findingDesc(lang, f.descriptionKey)}</p>
                  <div className="xv-fa">
                    <button
                      type="button"
                      className={cn("ok", review === "approved" && "on")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setReview(f.id, "approved");
                      }}
                    >
                      <Check className="size-3.5" />
                      {review === "approved" ? t(lang, "clinic.approved") : t(lang, "clinic.approve")}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(f.id);
                      }}
                    >
                      <Pencil className="size-3.5" />
                      {t(lang, "clinic.edit")}
                    </button>
                    <button
                      type="button"
                      className="no"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReview(f.id, "rejected");
                      }}
                    >
                      <X className="size-3.5" />
                      {review === "rejected" ? t(lang, "clinic.undo") : t(lang, "clinic.reject")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="dl"
        onClick={() =>
          void downloadReportPdf({
            lang,
            xray: modality === "xray" ? findings : [],
            intraoral: modality === "intraoral" ? findings : [],
            fusion: fuseFindings(modality === "xray" ? findings : [], modality === "intraoral" ? findings : []),
            reportType: modality,
          })
        }
      >
        {t(lang, "common.downloadPdf")}
      </button>
    </aside>
  );
}

function ClinicDetail({
  finding,
  all,
  visible,
  lang,
  image,
  review,
  note,
  plans,
  maskOpacity,
  cropContrast,
  onMask,
  onContrast,
  onNote,
  onPlan,
  onReview,
  onOpen,
  onBack,
}: {
  finding: Finding;
  all: Finding[];
  visible: Finding[];
  lang: Lang;
  image: string | null;
  review: Review;
  note: string;
  plans: Record<string, boolean>;
  maskOpacity: number;
  cropContrast: number;
  onMask: (n: number) => void;
  onContrast: (n: number) => void;
  onNote: (value: string) => void;
  onPlan: (key: string, on: boolean) => void;
  onReview: (id: string, next: Review) => void;
  onOpen: (id: string | null) => void;
  onBack: () => void;
}) {
  const n = fdiOf(finding);
  const qKey = quadrantKey(n);
  const name = n ? TOOTH_NAME[n % 10] : null;
  const sameTooth = all.filter((f) => toothDisplay(f) && toothDisplay(f) === toothDisplay(finding));
  const idx = Math.max(0, visible.findIndex((f) => f.id === finding.id));
  const recs = [suggestedApproach(finding.key, lang)];
  const urg = URGENCY[finding.key] ?? "follow";
  const urgLabel =
    urg === "now" ? t(lang, "clinic.urgencyNow") : urg === "soon" ? t(lang, "clinic.urgencySoon") : urg === "routine" ? t(lang, "clinic.urgencyRoutine") : t(lang, "clinic.urgencyFollow");
  const urgClass = urg === "now" ? "high" : urg === "soon" ? "mid" : urg === "routine" ? "low" : "nt";
  const st = statusOf(finding, review, lang);
  const pct = Math.round(finding.confidence * 100);
  const go = (dir: number) => {
    if (!visible.length) return;
    onOpen(visible[(idx + dir + visible.length) % visible.length].id);
  };
  const approveNext = () => {
    if (review === "approved") {
      onReview(finding.id, "approved");
      return;
    }
    onReview(finding.id, "approved");
    const next = visible[(idx + 1) % visible.length];
    if (next && next.id !== finding.id) onOpen(next.id);
    else onBack();
  };

  return (
    <aside className="clinic-side dv">
      <div id="dv" className="clinic-dv">
        <div className="dn">
          <button type="button" className="bk" onClick={onBack}>
            ‹ {t(lang, "clinic.back")}
          </button>
          <span className="nv">
            <button type="button" aria-label="prev" onClick={() => go(-1)}>
              ‹
            </button>
            <b>
              {idx + 1} / {visible.length || 1}
            </b>
            <button type="button" aria-label="next" onClick={() => go(1)}>
              ›
            </button>
          </span>
        </div>

        <div className="th">
          <div className="tb" style={{ "--k": `var(${finding.colorVar})` } as CSSProperties}>
            <b>{n ?? "—"}</b>
            <span>{qKey ? t(lang, qKey) : ""}</span>
          </div>
          <div>
            <h3>
              {qKey ? t(lang, qKey) : ""} {name ? name[lang] : ""}
            </h3>
            <p>
              FDI {n ?? "—"} · {finding.source === "xray" ? t(lang, "clinic.srcXray") : t(lang, "clinic.srcPhoto")}
            </p>
          </div>
        </div>

        {sameTooth.length > 1 ? (
          <div className="ft">
            {sameTooth.map((f) => (
              <button
                key={f.id}
                type="button"
                className={f.id === finding.id ? "on" : undefined}
                style={{ "--k": `var(${f.colorVar})` } as CSSProperties}
                onClick={() => onOpen(f.id)}
              >
                <i className="d" style={{ background: `var(${f.colorVar})` }} />
                {findingLabel(lang, f.key)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="stl">
          <span className={cn("lv", urgClass)}>{urgLabel}</span>
          <span className="tag">{finding.source === "xray" ? t(lang, "clinic.srcXray") : t(lang, "clinic.srcPhoto")}</span>
          <span className={cn("tag", review === "approved" && "ok", review === "rejected" && "no")}>{st.label}</span>
          <div className="cfb">
            <b>%{pct}</b>
            <span>{t(lang, "common.confidence")}</span>
            <div className="bar">
              <i style={{ width: `${pct}%`, background: `var(${finding.colorVar})` }} />
            </div>
          </div>
        </div>

        <div className="ds">
          <h4>{lang === "tr" ? "Görüntü" : "Image"}</h4>
          <div className="cr2">
            <figure>
              <FilmCrop src={image} bbox={finding.bbox} contrast={cropContrast} className="wide" />
              <figcaption>{t(lang, "clinic.originalCrop")}</figcaption>
            </figure>
            <figure>
              <FilmCrop
                src={image}
                bbox={finding.bbox}
                color={`var(${finding.colorVar})`}
                mask
                contrast={cropContrast}
                className="wide"
                maskOpacity={maskOpacity}
              />
              <figcaption>{t(lang, "clinic.aiMask")}</figcaption>
            </figure>
          </div>
        </div>

        <div className="vt">
          <label>
            {t(lang, "clinic.mask")}
            <input type="range" min={0} max={100} value={maskOpacity} onChange={(e) => onMask(Number(e.target.value))} />
          </label>
          <label>
            {t(lang, "common.contrast")}
            <input type="range" min={100} max={220} value={cropContrast} onChange={(e) => onContrast(Number(e.target.value))} />
          </label>
        </div>

        <div className="ds">
          <h4>{t(lang, "clinic.why")}</h4>
          <p>{findingDesc(lang, finding.descriptionKey) || t(lang, "clinic.whyBody", { name: findingLabel(lang, finding.key) })}</p>
        </div>

        <div className="ds">
          <h4>{t(lang, "clinic.recs")}</h4>
          {recs.map((rec, i) => {
            const pk = `${finding.id}:${i}`;
            return (
              <label key={pk} className="pl">
                <input type="checkbox" checked={Boolean(plans[pk])} onChange={(e) => onPlan(pk, e.target.checked)} />
                <span>{rec}</span>
              </label>
            );
          })}
        </div>

        <div className="ds">
          <h4>{t(lang, "clinic.note")}</h4>
          <textarea id="cn" rows={3} value={note} placeholder={t(lang, "clinic.notePh")} onChange={(e) => onNote(e.target.value)} />
        </div>

        <div className="cf2 sk">
          <button type="button" className="ok" onClick={approveNext}>
            {review === "approved" ? t(lang, "clinic.approved") : t(lang, "clinic.approveNext")}
          </button>
          <button type="button" onClick={() => onReview(finding.id, "rejected")}>
            {review === "rejected" ? t(lang, "clinic.undo") : t(lang, "clinic.reject")}
          </button>
        </div>
      </div>
    </aside>
  );
}
