import type { FindingKey, Lang, Severity } from "./types";

type Text = { en: string; tr: string };

const APPROACH: Partial<Record<FindingKey, Text>> = {
  caries: {
    en: "Confirm with a clinical exam and bitewing radiograph; plan restoration if cavitated.",
    tr: "Klinik muayene ve bitewing radyografi ile doğrulayın; kavite varsa restorasyon planlayın.",
  },
  earlyCaries: {
    en: "Consider remineralization and a close follow-up before invasive treatment.",
    tr: "İnvaziv tedaviden önce remineralizasyon ve yakın takip düşünülebilir.",
  },
  permanentCaries: {
    en: "Confirm the finding clinically and assess the permanent tooth for restorative treatment.",
    tr: "Bulguyu klinik olarak doğrulayın ve daimi dişi restoratif tedavi açısından değerlendirin.",
  },
  primaryCaries: {
    en: "Confirm the finding clinically and assess the primary tooth for appropriate restorative treatment.",
    tr: "Bulguyu klinik olarak doğrulayın ve süt dişini uygun restoratif tedavi açısından değerlendirin.",
  },
  deepCaries: {
    en: "Check pulp vitality; pulp therapy may be needed.",
    tr: "Pulpa canlılığını kontrol edin; pulpa tedavisi gerekebilir.",
  },
  impacted: {
    en: "Assess position and proximity to adjacent teeth and nerve with CBCT if extraction or surgery is considered.",
    tr: "Çekim veya cerrahi düşünülüyorsa komşu dişlere ve sinire yakınlığı KBBT ile değerlendirin.",
  },
  periapical: {
    en: "Vitality testing and periapical radiograph; consider endodontic evaluation.",
    tr: "Vitalite testi ve periapikal radyografi; endodontik değerlendirme düşünün.",
  },
  rootCanal: {
    en: "Check the quality of the root filling and signs of periapical healing.",
    tr: "Kanal dolgusunun kalitesini ve periapikal iyileşme bulgularını kontrol edin.",
  },
  fracture: {
    en: "Confirm clinically (transillumination, bite test) and plan restoration or extraction accordingly.",
    tr: "Klinik olarak doğrulayın (transilluminasyon, ısırma testi) ve restorasyon veya çekim planlayın.",
  },
  abrasion: {
    en: "Assess brushing technique and occlusion; monitor wear progression.",
    tr: "Fırçalama tekniğini ve oklüzyonu değerlendirin; aşınmanın ilerlemesini izleyin.",
  },
  crown: {
    en: "Check marginal fit and secondary caries at the crown margin.",
    tr: "Kuron kenar uyumunu ve kenarda sekonder çürük olup olmadığını kontrol edin.",
  },
  filling: {
    en: "Inspect margins for leakage or secondary caries.",
    tr: "Kenar sızıntısı veya sekonder çürük açısından dolgu kenarlarını inceleyin.",
  },
  implant: {
    en: "Check osseointegration, peri-implant bone and prosthetic fit on the radiograph.",
    tr: "Radyografta osseointegrasyonu, implant çevresi kemiği ve protez uyumunu kontrol edin.",
  },
  bridge: {
    en: "Check abutment teeth, pontic hygiene space and marginal fit.",
    tr: "Dayanak dişleri, gövde hijyen aralığını ve kenar uyumunu kontrol edin.",
  },
  missingTooth: {
    en: "Assess the edentulous span for replacement (implant, bridge or removable).",
    tr: "Dişsiz aralığı implanta, köprüye veya hareketli proteze uygunluk açısından değerlendirin.",
  },
  plaque: {
    en: "Oral hygiene instruction and professional scaling.",
    tr: "Ağız hijyeni eğitimi ve profesyonel detartraj.",
  },
  ulcer: {
    en: "Review for 10–14 days; biopsy if the lesion persists.",
    tr: "10–14 gün sonra yeniden değerlendirin; devam ederse biyopsi düşünün.",
  },
  gingivitis: {
    en: "Oral hygiene instruction and scaling; re-evaluate in 2–4 weeks.",
    tr: "Ağız hijyeni eğitimi ve detartraj; 2–4 hafta sonra yeniden değerlendirin.",
  },
  periodontitis: {
    en: "Periodontal probing and radiographic bone-level assessment are advised.",
    tr: "Periodontal sondalama ve radyografik kemik seviyesi değerlendirmesi önerilir.",
  },
};

const CARIES_CLASS: Text = {
  en: "Confirm clinically; choose restoration according to the caries class and extent.",
  tr: "Klinik olarak doğrulayın; çürük sınıfına ve yaygınlığına göre restorasyon seçin.",
};

const DEFAULT_APPROACH: Text = {
  en: "Correlate with clinical findings before deciding on treatment.",
  tr: "Tedaviye karar vermeden önce klinik bulgularla ilişkilendirin.",
};

export function suggestedApproach(key: FindingKey, lang: Lang): string {
  if (/^caries\d$/.test(key)) return CARIES_CLASS[lang];
  return (APPROACH[key] ?? DEFAULT_APPROACH)[lang];
}

export function reliabilityLabel(value: number, lang: Lang): string {
  if (value >= 0.8) return lang === "tr" ? "Yüksek güvenilirlik" : "High reliability";
  if (value >= 0.5) return lang === "tr" ? "Orta güvenilirlik" : "Moderate reliability";
  return lang === "tr" ? "Düşük güvenilirlik – doğrulayın" : "Low reliability – verify";
}

export const SEVERITY_ORDER: Severity[] = ["high", "medium", "low"];
