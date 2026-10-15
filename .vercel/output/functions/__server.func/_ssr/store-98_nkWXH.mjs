import { i as __toESM } from "../_runtime.mjs";
import { o as require_jsx_runtime, r as Slot, s as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-98_nkWXH.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors duration-150 ease-[var(--ease-smooth-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-primary/90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
			outline: "border border-border bg-card text-foreground hover:bg-muted",
			ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
			destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
		},
		size: {
			default: "h-10 px-4",
			sm: "h-8 rounded-lg px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var dict = {
	en: {
		"brand.name": "DentaAI",
		"brand.subtitle": "AI-Powered Dental Analysis",
		"brand.tagline": "Better diagnosis, healthier smiles.",
		"brand.powered": "Powered by AI",
		"nav.home": "Home",
		"nav.xray": "X-Ray Analysis",
		"nav.intraoral": "Intraoral Analysis",
		"nav.report": "Combined Report",
		"nav.settings": "Settings",
		"search.placeholder": "Search for patient, scan or analysis...",
		"user.name": "Nrdeen Anber",
		"user.role": "Student / Researcher",
		"notify.title": "Notifications",
		"notify.empty": "No new alerts",
		"notify.1": "X-ray analysis complete — 4 findings.",
		"notify.2": "Intraoral scan ready for fusion.",
		"notify.3": "Combined report can be exported.",
		"common.confidence": "Confidence",
		"common.high": "High",
		"common.medium": "Medium",
		"common.low": "Low",
		"common.toExamine": "To be Examined",
		"common.downloadPdf": "Download Report (PDF)",
		"common.zoom": "Zoom",
		"common.invert": "Invert",
		"common.contrast": "Contrast",
		"common.brightness": "Brightness",
		"common.sharpness": "Sharpness",
		"common.crop": "Crop",
		"common.reset": "Reset",
		"common.2d": "2D",
		"common.original": "Original",
		"common.aiAnalysis": "AI Analysis",
		"common.report": "Report",
		"common.detected": "Detected Findings",
		"common.detectedHintXray": "AI detected the following issues in your X-ray.",
		"common.detectedHintIntra": "AI detected the following issues in your intraoral image.",
		"common.upload": "Upload image",
		"common.replace": "Replace image",
		"common.loadDemo": "Load demo case",
		"common.analyzing": "Running ensemble inference…",
		"common.drop": "Drop a panoramic X-ray here or browse",
		"common.dropIntra": "Drop an intraoral photo here or browse",
		"common.toothNo": "Tooth No",
		"common.summary": "Summary",
		"common.recommendations": "Recommendations",
		"common.language": "Language",
		"common.english": "English",
		"common.turkish": "Türkçe",
		"findings.caries": "Caries",
		"findings.deepCaries": "Deep Caries",
		"findings.periapical": "Periapical Lesion",
		"findings.impacted": "Impacted Tooth",
		"findings.earlyCaries": "Early Caries",
		"findings.gingivitis": "Gingivitis",
		"findings.plaque": "Plaque / Stains",
		"findings.ulcer": "Ulcer",
		"findings.fracture": "Visible Fracture",
		"findings.rootCanal": "Root Canal Treatment",
		"findings.periodontitis": "Periodontitis",
		"findings.healthy": "Healthy",
		"findings.abrasion": "Abrasion",
		"findings.filling": "Filling",
		"findings.crown": "Crown",
		"findings.caries1": "Caries Class 1",
		"findings.caries2": "Caries Class 2",
		"findings.caries3": "Caries Class 3",
		"findings.caries4": "Caries Class 4",
		"findings.caries5": "Caries Class 5",
		"findings.caries6": "Caries Class 6",
		"findings.cariesFamily": "Caries",
		"desc.cariesDesc": "Possible caries detected in the crown region.",
		"desc.deepCariesDesc": "Deep caries detected, likely reaching dentin.",
		"desc.impactedDesc": "Impacted wisdom tooth detected.",
		"desc.periapicalDesc": "Periapical radiolucency detected around the tooth root.",
		"desc.earlyCariesDesc": "Possible early caries detected.",
		"desc.plaqueDesc": "Plaque or stains detected on the teeth.",
		"desc.gingivitisDesc": "Signs of gingivitis detected in the gum region.",
		"desc.gingivitisLowerDesc": "Signs of gingivitis detected in the gum region.",
		"desc.fractureDesc": "Possible fracture detected.",
		"desc.ulcerDesc": "Possible ulceration detected on the gum.",
		"desc.rootCanalDesc": "Radiographic signs of previous root canal treatment.",
		"desc.periodontitisDesc": "Signs of periodontitis detected in the gum and bone tissue.",
		"desc.healthyDesc": "No significant oral health issues detected. Healthy gums and teeth.",
		"desc.abrasionDesc": "Tooth abrasion detected on the tooth surface.",
		"desc.fillingDesc": "Dental filling detected on the tooth.",
		"desc.crownDesc": "Dental crown detected on the tooth.",
		"desc.caries1Desc": "Caries class 1 detected (early stage).",
		"desc.caries2Desc": "Caries class 2 detected (moderate stage).",
		"desc.caries3Desc": "Caries class 3 detected (advanced stage).",
		"desc.caries4Desc": "Caries class 4 detected (severe stage).",
		"desc.caries5Desc": "Caries class 5 detected (very severe stage).",
		"desc.caries6Desc": "Caries class 6 detected (extreme stage).",
		"pos.upperRight": "Upper Right",
		"pos.upperLeft": "Upper Left",
		"pos.lowerLeft": "Lower Left",
		"pos.lowerRight": "Lower Right",
		"pos.upperRightRegion": "Upper Right Region",
		"pos.upperLeftRegion": "Upper Left Region",
		"pos.lowerLeftRegion": "Lower Left Region",
		"pos.lowerRightRegion": "Lower Right Region",
		"pos.upperRightMolar": "Upper Right • Molar",
		"pos.upperFront": "Upper • Front",
		"pos.lowerFront": "Lower • Front",
		"pos.upperGumRight": "Upper gum • Right",
		"pos.lowerLeftMolar": "Lower Left • Molar",
		"pos.gumRight": "Gum (Right)",
		"pos.overall": "Overall",
		"views.overview": "Panoramic View",
		"views.overviewHint": "Full jaw view",
		"views.health": "Teeth Health",
		"views.healthHint": "Detected teeth & issues",
		"views.ai": "AI Analysis",
		"views.aiHint": "Detection results",
		"views.bone": "Bone & Gum",
		"views.boneHint": "Bone loss / periodontal",
		"views.intraOverview": "Overview",
		"views.intraOverviewHint": "Full mouth view",
		"views.surface": "Surface Issues",
		"views.surfaceHint": "Detected surface problems",
		"views.gums": "Gums",
		"views.gumsHint": "Gum analysis",
		"views.intraAi": "AI Analysis",
		"views.intraAiHint": "All detections",
		"home.kicker": "Multimodal workspace",
		"home.title": "Comprehensive oral diagnosis from X-ray and intraoral photography",
		"home.lead": "Section 1 analyses panoramic radiographs for deep pathology. Section 2 reads clinical photos for surface disease. Section 3 fuses both into one explainable report.",
		"home.currentCase": "Current case",
		"home.openXray": "Open X-ray workspace",
		"home.openIntra": "Open intraoral workspace",
		"home.openReport": "Open combined report",
		"home.pipeline": "System architecture",
		"home.s1": "Radiographic ensemble",
		"home.s1d": "YOLOv11 + Faster R-CNN + RetinaNet + Mask R-CNN + DINO with soft voting on DENTEX classes.",
		"home.s2": "Intraoral detector",
		"home.s2d": "YOLOv8/YOLOv11 on merged caries, gingivitis and surface-defect datasets.",
		"home.s3": "Late fusion",
		"home.s3d": "Shared labels become strong evidence. X-ray-only findings are deep; photo-only findings are surface.",
		"home.statsX": "X-ray findings",
		"home.statsI": "Intraoral findings",
		"home.statsS": "Shared / matched",
		"home.statsO": "Overall status",
		"report.title": "Combined Report",
		"report.subtitle": "Integrated diagnosis from panoramic X-ray and intraoral photography",
		"report.xrayCard": "X-ray Findings",
		"report.intraCard": "Intraoral Findings",
		"report.sharedCard": "Shared / Matched",
		"report.overallCard": "Overall Status",
		"report.issues": "detected issues",
		"report.sharedHint": "issues seen in both analyses",
		"report.fusion": "AI Fusion",
		"report.fusionLogic": "Fusion logic",
		"report.fusionLead": "Radiographic and intraoral results are combined for a more confident assessment.",
		"report.logicShared": "Caries on X-ray + surface caries on the photo",
		"report.logicSharedHint": "True caries probability is higher.",
		"report.logicDeep": "Finding visible only on the radiograph",
		"report.logicDeepHint": "Likely a deep problem not visible in the mouth.",
		"report.logicSurface": "Finding visible only on the intraoral photo",
		"report.logicSurfaceHint": "Likely a surface problem not seen on the X-ray.",
		"report.summaryTitle": "Report summary",
		"report.summaryBody": "When X-ray and intraoral analysis results are evaluated together, {n} different problems have been detected in the patient.",
		"report.rec1": "Treatment and repair of caries areas",
		"report.rec2": "Professional cleaning for gum health",
		"report.rec3": "Evaluation of impacted tooth",
		"report.rec4": "Maintain oral hygiene and use fluoride toothpaste",
		"report.table": "Integration table",
		"report.tableHint": "Comparison summary of radiographic and intraoral findings.",
		"report.colProblem": "Problem",
		"report.colXray": "X-ray",
		"report.colIntra": "Intraoral",
		"report.colResult": "Result",
		"report.present": "Present",
		"report.absent": "Absent",
		"report.strong": "Strong evidence",
		"report.deep": "Deep problem",
		"report.surface": "Surface problem",
		"report.moderate": "Moderate",
		"report.mild": "Mild / Moderate",
		"report.lowRisk": "Normal / Low risk",
		"report.review": "Review required",
		"report.follow": "Follow-up recommended",
		"report.routine": "Routine check",
		"report.compare": "Compare",
		"report.matched": "Matched findings",
		"report.all": "All findings",
		"report.xrayTitle": "X-Ray Analysis",
		"report.intraTitle": "Intraoral Analysis",
		"intra.tips": "Tips for Better Results",
		"intra.tip1": "Use good lighting (avoid shadows)",
		"intra.tip2": "Keep your mouth slightly open and show teeth and gums",
		"intra.tip3": "Avoid motion blur (stay still)",
		"intra.tip4": "Clean the lens (if using a phone)",
		"intra.quality": "Image Quality Warning",
		"intra.qualityBody": "If the image is blurry or too dark, the results may be less accurate. Please retake the photo with better lighting.",
		"xray.summaryBody": "{n} findings were detected in your X-ray.",
		"intra.summaryBody": "{n} surface issues were detected in your intraoral image.",
		"settings.title": "Settings",
		"settings.lead": "Interface, demo case and model placeholders for the thesis pipeline.",
		"settings.language": "Interface language",
		"settings.threshold": "Minimum confidence to display",
		"settings.overlay": "Show detection overlays by default",
		"settings.models": "Model weights (next step)",
		"common.noFindings": "No findings for this image yet. Upload an X-ray to run the trained model.",
		"settings.modelsLead": "X-ray analysis calls the trained YOLO weights (best.pt) for each new upload. Intraoral detection is still a placeholder until those weights are wired.",
		"settings.xrayModels": "Section 1 — Radiograph ensemble",
		"settings.intraModels": "Section 2 — Intraoral detector",
		"settings.fusion": "Section 3 — Late fusion + Grad-CAM",
		"settings.reload": "Reload demo case",
		"settings.clear": "Clear current images",
		"settings.about": "About this build",
		"settings.aboutBody": "DentaAI (DentalVision-AI) is a multimodal dental diagnosis prototype: deep radiographic analysis, intraoral photography, late fusion and an explainable report.",
		"pdf.title": "DentaAI Diagnostic Report",
		"pdf.patient": "Case / operator",
		"pdf.generated": "Generated"
	},
	tr: {
		"brand.name": "DentaAI",
		"brand.subtitle": "Akıllı Çoklu Ortamlı Diş Teşhis Sistemi",
		"brand.tagline": "Daha doğru tanı, daha sağlıklı gülüşler.",
		"brand.powered": "Yapay Zekâ",
		"nav.home": "Ana Sayfa",
		"nav.xray": "X-Ray Analizi",
		"nav.intraoral": "Intraoral Analiz",
		"nav.report": "Birleşik Rapor",
		"nav.settings": "Ayarlar",
		"search.placeholder": "Hasta, tarama veya analiz ara...",
		"user.name": "Nrdeen Anber",
		"user.role": "Öğrenci / Araştırmacı",
		"notify.title": "Bildirimler",
		"notify.empty": "Yeni uyarı yok",
		"notify.1": "X-ray analizi tamamlandı — 4 bulgu.",
		"notify.2": "Intraoral tarama füzyon için hazır.",
		"notify.3": "Birleşik rapor dışa aktarılabilir.",
		"common.confidence": "Güven",
		"common.high": "Yüksek",
		"common.medium": "Orta",
		"common.low": "Düşük",
		"common.toExamine": "İncelenecek",
		"common.downloadPdf": "Raporu PDF Olarak İndir",
		"common.zoom": "Yakınlaştır",
		"common.invert": "Ters Çevir",
		"common.contrast": "Kontrast",
		"common.brightness": "Parlaklık",
		"common.sharpness": "Keskinlik",
		"common.crop": "Kırp",
		"common.reset": "Sıfırla",
		"common.2d": "2D",
		"common.original": "Orijinal",
		"common.aiAnalysis": "Yapay Zekâ Analizi",
		"common.report": "Rapor",
		"common.detected": "Tespit Edilen Bulgular",
		"common.detectedHintXray": "Yapay zekâ röntgen görüntünüzde şu sorunları tespit etti.",
		"common.detectedHintIntra": "Yapay zekâ intraoral görüntüde şu sorunları tespit etti.",
		"common.upload": "Görüntü yükle",
		"common.replace": "Görüntüyü değiştir",
		"common.loadDemo": "Demo vakayı yükle",
		"common.analyzing": "Topluluk çıkarımı çalışıyor…",
		"common.drop": "Panoramik röntgeni bırakın veya seçin",
		"common.dropIntra": "Ağız içi fotoğrafı bırakın veya seçin",
		"common.toothNo": "Diş No",
		"common.summary": "Özet",
		"common.recommendations": "Öneriler",
		"common.language": "Dil",
		"common.english": "English",
		"common.turkish": "Türkçe",
		"findings.caries": "Çürük",
		"findings.deepCaries": "Derin Çürük",
		"findings.periapical": "Periapikal Lezyon",
		"findings.impacted": "Gömülü Diş",
		"findings.earlyCaries": "Erken Çürük",
		"findings.gingivitis": "Diş Eti İltihabı",
		"findings.plaque": "Plak / Leke",
		"findings.ulcer": "Ülser",
		"findings.fracture": "Görünür Kırık",
		"findings.rootCanal": "Kanal Tedavisi",
		"findings.periodontitis": "Periodontitis",
		"findings.healthy": "Sağlıklı",
		"findings.abrasion": "Abruzyon",
		"findings.filling": "Dolgu",
		"findings.crown": "Kuron",
		"findings.caries1": "Çürük Sınıf 1",
		"findings.caries2": "Çürük Sınıf 2",
		"findings.caries3": "Çürük Sınıf 3",
		"findings.caries4": "Çürük Sınıf 4",
		"findings.caries5": "Çürük Sınıf 5",
		"findings.caries6": "Çürük Sınıf 6",
		"findings.cariesFamily": "Çürük",
		"desc.cariesDesc": "Kuron bölgesinde olası çürük tespit edildi.",
		"desc.deepCariesDesc": "Dentine ulaşması muhtemel derin çürük tespit edildi.",
		"desc.impactedDesc": "Gömülü yirmi yaş dişi tespit edildi.",
		"desc.periapicalDesc": "Diş kökü çevresinde periapikal radyolüsensi tespit edildi.",
		"desc.earlyCariesDesc": "Olası erken çürük tespit edildi.",
		"desc.plaqueDesc": "Dişlerde plak veya leke tespit edildi.",
		"desc.gingivitisDesc": "Diş eti bölgesinde gingivitis belirtileri tespit edildi.",
		"desc.gingivitisLowerDesc": "Diş eti bölgesinde gingivitis belirtileri tespit edildi.",
		"desc.fractureDesc": "Olası kırık tespit edildi.",
		"desc.ulcerDesc": "Diş etinde olası ülserasyon tespit edildi.",
		"desc.rootCanalDesc": "Görüntüde kanal tedavisi bulguları tespit edildi.",
		"desc.periodontitisDesc": "Diş eti ve kemik dokusunda periodontitis belirtileri tespit edildi.",
		"desc.healthyDesc": "Anlamlı ağız sağlığı sorunu tespit edilmedi. Sağlıklı diş etleri ve dişler.",
		"desc.abrasionDesc": "Diş yüzeyinde abruzyon tespit edildi.",
		"desc.fillingDesc": "Dişte dolgu tespit edildi.",
		"desc.crownDesc": "Dişte kuron tespit edildi.",
		"desc.caries1Desc": "Çürük sınıf 1 tespit edildi (erken aşama).",
		"desc.caries2Desc": "Çürük sınıf 2 tespit edildi (orta aşama).",
		"desc.caries3Desc": "Çürük sınıf 3 tespit edildi (ileri aşama).",
		"desc.caries4Desc": "Çürük sınıf 4 tespit edildi (ciddi aşama).",
		"desc.caries5Desc": "Çürük sınıf 5 tespit edildi (çok ciddi aşama).",
		"desc.caries6Desc": "Çürük sınıf 6 tespit edildi (aşırı aşama).",
		"pos.upperRight": "Üst Sağ",
		"pos.upperLeft": "Üst Sol",
		"pos.lowerLeft": "Alt Sol",
		"pos.lowerRight": "Alt Sağ",
		"pos.upperRightRegion": "Üst Sağ Bölge",
		"pos.upperLeftRegion": "Üst Sol Bölge",
		"pos.lowerLeftRegion": "Alt Sol Bölge",
		"pos.lowerRightRegion": "Alt Sağ Bölge",
		"pos.upperRightMolar": "Üst Sağ • Azı",
		"pos.upperFront": "Üst • Ön",
		"pos.lowerFront": "Alt • Ön",
		"pos.upperGumRight": "Üst diş eti • Sağ",
		"pos.lowerLeftMolar": "Alt Sol • Azı",
		"pos.gumRight": "Diş eti (Sağ)",
		"pos.overall": "Genel",
		"views.overview": "Panoramik Görünüm",
		"views.overviewHint": "Tam çene görünümü",
		"views.health": "Diş Sağlığı",
		"views.healthHint": "Tespit edilen dişler ve sorunlar",
		"views.ai": "YZ Analizi",
		"views.aiHint": "Tespit sonuçları",
		"views.bone": "Kemik ve Diş Eti",
		"views.boneHint": "Kemik kaybı / periodontal",
		"views.intraOverview": "Genel Bakış",
		"views.intraOverviewHint": "Tüm ağız görünümü",
		"views.surface": "Yüzeysel Sorunlar",
		"views.surfaceHint": "Tespit edilen yüzey sorunları",
		"views.gums": "Diş Eti Analizi",
		"views.gumsHint": "Tespit edilen diş eti bulguları",
		"views.intraAi": "YZ Analizi",
		"views.intraAiHint": "Tüm tespitler",
		"home.kicker": "Çoklu ortam çalışma alanı",
		"home.title": "Röntgen ve ağız içi görüntülerinden kapsamlı ağız teşhisi",
		"home.lead": "Bölüm 1 panoramik röntgenlerde derin patoloji arar. Bölüm 2 klinik fotoğraflarda yüzeysel hastalıkları okur. Bölüm 3 ikisini açıklanabilir tek raporda birleştirir.",
		"home.currentCase": "Güncel vaka",
		"home.openXray": "X-ray çalışma alanını aç",
		"home.openIntra": "Intraoral çalışma alanını aç",
		"home.openReport": "Birleşik raporu aç",
		"home.pipeline": "Sistem mimarisi",
		"home.s1": "Radyografik topluluk",
		"home.s1d": "DENTEX sınıflarında YOLOv11 + Faster R-CNN + RetinaNet + Mask R-CNN + DINO, soft voting.",
		"home.s2": "Intraoral dedektör",
		"home.s2d": "Birleştirilmiş çürük, gingivitis ve yüzey kusuru veri kümelerinde YOLOv8/YOLOv11.",
		"home.s3": "Geç füzyon",
		"home.s3d": "Ortak etiketler güçlü kanıt olur. Yalnız röntgen bulguları derindir; yalnız fotoğraf bulguları yüzeyseldir.",
		"home.statsX": "Röntgen bulguları",
		"home.statsI": "Intraoral bulgular",
		"home.statsS": "Ortak / eşleşen",
		"home.statsO": "Genel durum",
		"report.title": "Birleşik Rapor",
		"report.subtitle": "Röntgen ve ağız içi görüntülerinin entegre analizi ile kapsamlı teşhis",
		"report.xrayCard": "Röntgen Bulguları",
		"report.intraCard": "Intraoral Bulgular",
		"report.sharedCard": "Ortak / Eşleşen",
		"report.overallCard": "Genel Durum",
		"report.issues": "tespit edilen sorun",
		"report.sharedHint": "her iki analizde de görülen sorun",
		"report.fusion": "YZ Füzyon",
		"report.fusionLogic": "Entegrasyon mantığı",
		"report.fusionLead": "Röntgen ve ağız içi analiz sonuçları birleştirilerek daha kesin değerlendirme yapılır.",
		"report.logicShared": "Röntgende görülen çürük + ağız içi görüntüdeki yüzeysel çürük",
		"report.logicSharedHint": "Gerçek çürük olma olasılığı yüksektir.",
		"report.logicDeep": "Sadece röntgende görülen bulgu",
		"report.logicDeepHint": "Ağız içinde görünmeyen derin bir problemdir.",
		"report.logicSurface": "Sadece ağız içi görüntüde görülen bulgu",
		"report.logicSurfaceHint": "Röntgende görünmeyen yüzeysel bir problemdir.",
		"report.summaryTitle": "Rapor özeti",
		"report.summaryBody": "Röntgen ve ağız içi analiz sonuçları birlikte değerlendirildiğinde, hastada {n} farklı problem tespit edilmiştir.",
		"report.rec1": "Çürük bölgelerin tedavisi ve tamiri",
		"report.rec2": "Diş eti sağlığı için profesyonel temizlik",
		"report.rec3": "Gömülü dişin değerlendirilmesi",
		"report.rec4": "Ağız hijyenini koruyun ve florürlü diş macunu kullanın",
		"report.table": "Entegrasyon Tablosu",
		"report.tableHint": "Röntgen ve intraoral bulgularının karşılaştırmalı özeti.",
		"report.colProblem": "Problem",
		"report.colXray": "Röntgen",
		"report.colIntra": "Intraoral",
		"report.colResult": "Sonuç",
		"report.present": "Var",
		"report.absent": "Yok",
		"report.strong": "Güçlü bulgu",
		"report.deep": "Derin",
		"report.surface": "Yüzeysel",
		"report.moderate": "Orta Seviye",
		"report.mild": "Hafif / Orta",
		"report.lowRisk": "Normal / Düşük risk",
		"report.review": "İnceleme Gerekli",
		"report.follow": "Takip Önerilir",
		"report.routine": "Rutin Kontrol",
		"report.compare": "Karşılaştırma",
		"report.matched": "Eşleşen Bulgular",
		"report.all": "Tüm Bulgular",
		"report.xrayTitle": "X-Ray Analizi",
		"report.intraTitle": "Intraoral Analiz",
		"intra.tips": "Daha İyi Sonuçlar İçin İpuçları",
		"intra.tip1": "İyi ışık kullanın (gölgeden kaçının)",
		"intra.tip2": "Ağzınızı hafif açık tutun, diş ve diş etlerini gösterin",
		"intra.tip3": "Hareket bulanıklığından kaçının (hareketsiz durun)",
		"intra.tip4": "Lensi temizleyin (telefon kullanıyorsanız)",
		"intra.quality": "Görüntü Kalitesi Uyarısı",
		"intra.qualityBody": "Görüntü bulanıksa veya çok karanlıksa sonuçlar daha az doğru olabilir. Lütfen daha iyi ışıkla fotoğrafı yeniden çekin.",
		"xray.summaryBody": "Röntgen görüntünüzde {n} bulgu tespit edildi.",
		"intra.summaryBody": "Intraoral görüntünüzde {n} yüzey sorunu tespit edildi.",
		"settings.title": "Ayarlar",
		"settings.lead": "Arayüz, demo vaka ve tez hattı için model yer tutucuları.",
		"settings.language": "Arayüz dili",
		"settings.threshold": "Gösterilecek minimum güven",
		"settings.overlay": "Tespit kutularını varsayılan olarak göster",
		"settings.models": "Model ağırlıkları (sonraki adım)",
		"common.noFindings": "Bu görüntü için henüz bulgu yok. Eğitilmiş modeli çalıştırmak için bir röntgen yükleyin.",
		"settings.modelsLead": "Röntgen analizi her yeni yüklemede eğitilmiş YOLO ağırlıklarını (best.pt) çağırır. Intraoral tespit, o ağırlıklar bağlanana kadar yer tutucudur.",
		"settings.xrayModels": "Bölüm 1 — Radyograf topluluğu",
		"settings.intraModels": "Bölüm 2 — Intraoral dedektör",
		"settings.fusion": "Bölüm 3 — Geç füzyon + Grad-CAM",
		"settings.reload": "Demo vakayı yeniden yükle",
		"settings.clear": "Görüntüleri temizle",
		"settings.about": "Bu sürüm hakkında",
		"settings.aboutBody": "DentaAI (DentalVision-AI) çoklu ortamlı bir diş teşhis prototipidir: derin radyografik analiz, ağız içi fotoğraf, geç füzyon ve açıklanabilir rapor.",
		"pdf.title": "DentaAI Teşhis Raporu",
		"pdf.patient": "Vaka / operatör",
		"pdf.generated": "Oluşturulma"
	}
};
function t(lang, key, vars) {
	const table = dict[lang];
	const fallback = dict.en;
	let out = table[key] ?? fallback[key] ?? key;
	if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
	return out;
}
function findingLabel(lang, key) {
	return t(lang, `findings.${key}`);
}
function findingDesc(lang, key) {
	return t(lang, `desc.${key}`);
}
function positionLabel(lang, key) {
	return t(lang, `pos.${key}`);
}
function severityLabel(lang, severity) {
	return t(lang, `common.${severity}`);
}
var MIDLINE_X = .5;
var OCCLUSAL_Y = .48;
var HALF_ARCH_SPAN = .31;
var MAX_TEETH = 3;
var UPPER_MM = [
	8.5,
	6.5,
	7.5,
	7,
	6.5,
	10,
	9,
	8.5
];
var LOWER_MM = [
	5,
	5.5,
	7,
	7,
	7,
	11,
	10.5,
	10
];
function archIntervals(widthsMm) {
	const scale = HALF_ARCH_SPAN / widthsMm.reduce((a, b) => a + b, 0);
	let start = 0;
	return widthsMm.map((w) => {
		const interval = [start, start + w * scale];
		start = interval[1];
		return interval;
	});
}
var UPPER_ARCH = archIntervals(UPPER_MM);
var LOWER_ARCH = archIntervals(LOWER_MM);
function quadrantOfBox(bbox) {
	const cx = (bbox[0] + bbox[2]) / 2;
	const upper = (bbox[1] + bbox[3]) / 2 < OCCLUSAL_Y;
	const patientRight = cx < MIDLINE_X;
	if (upper) return patientRight ? 1 : 2;
	return patientRight ? 4 : 3;
}
function estimateFdiTeeth(bbox) {
	const quadrant = quadrantOfBox(bbox);
	const arch = quadrant <= 2 ? UPPER_ARCH : LOWER_ARCH;
	const [x1, , x2] = bbox;
	const left = x1 - MIDLINE_X;
	const right = x2 - MIDLINE_X;
	const dMin = left < 0 && right > 0 ? 0 : Math.min(Math.abs(left), Math.abs(right));
	const dMax = Math.max(Math.abs(left), Math.abs(right));
	let picked = arch.map(([a, b], i) => ({
		tooth: i + 1,
		overlap: Math.min(dMax, b) - Math.max(dMin, a),
		width: b - a
	})).filter((t) => t.overlap > 0).filter((t) => t.overlap >= t.width * .5);
	if (picked.length === 0) {
		const center = (dMin + dMax) / 2;
		picked = [{
			tooth: arch.findIndex(([a, b]) => center >= a && center < b) + 1 || (center < 0 ? 1 : arch.length),
			overlap: 0,
			width: 0
		}];
	}
	return picked.sort((a, b) => b.overlap - a.overlap).slice(0, MAX_TEETH).map((t) => t.tooth).sort((a, b) => a - b).map((t) => String(quadrant * 10 + t));
}
function withEstimatedTeeth(findings) {
	return findings.map((f) => f.tooth !== "-" || f.toothEst?.length ? f : {
		...f,
		toothEst: estimateFdiTeeth(f.bbox)
	});
}
function toothDisplay(f) {
	if (f.tooth !== "-") return f.tooth;
	return f.toothEst?.length ? `≈${f.toothEst.join(", ")}` : null;
}
function isToothEstimated(f) {
	return f.tooth === "-" && Boolean(f.toothEst?.length);
}
var DEFAULT_ADJUST = {
	brightness: 0,
	contrast: 1,
	invert: false,
	zoom: 1,
	panX: 0,
	panY: 0,
	showOverlay: true,
	view: "overview"
};
var SAMPLE_XRAY = "/samples/xray.jpg";
var SAMPLE_INTRAORAL = "/samples/intraoral.jpg";
/**
* Calculate IoU (Intersection over Union) between two bounding boxes.
* Bounding boxes are normalized [x1, y1, x2, y2] in [0, 1] range.
*/
function calculateIoU(bbox1, bbox2) {
	const [x1_1, y1_1, x2_1, y2_1] = bbox1;
	const [x1_2, y1_2, x2_2, y2_2] = bbox2;
	const x1_i = Math.max(x1_1, x1_2);
	const y1_i = Math.max(y1_1, y1_2);
	const x2_i = Math.min(x2_1, x2_2);
	const y2_i = Math.min(y2_1, y2_2);
	const intersection_area = Math.max(0, x2_i - x1_i) * Math.max(0, y2_i - y1_i);
	const union_area = (x2_1 - x1_1) * (y2_1 - y1_1) + (x2_2 - x1_2) * (y2_2 - y1_2) - intersection_area;
	if (union_area === 0) return 0;
	return intersection_area / union_area;
}
/**
* Deduplicate findings using IoU-based approach.
* Removes detections that overlap significantly (IoU > 0.5) with a higher-confidence detection.
*/
function deduplicateFindings(findings, iouThreshold = .5) {
	console.log(`[DEDUP] Input: ${findings.length} findings, IoU threshold: ${iouThreshold}`);
	console.log(`[DEDUP] Input findings:`);
	findings.forEach((f, i) => {
		console.log(`  ${i + 1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map((b) => b.toFixed(4)).join(", ")}]`);
	});
	const alphadentCount = findings.filter((f) => f.id.startsWith("alphadent-")).length;
	const cariesCount = findings.filter((f) => f.id.startsWith("caries-")).length;
	const mioCount = findings.filter((f) => f.id.startsWith("mio-")).length;
	console.log(`[DEDUP] Before dedup - AlphaDent: ${alphadentCount}, Caries: ${cariesCount}, MIO: ${mioCount}`);
	const sorted = [...findings].sort((a, b) => b.confidence - a.confidence);
	const deduplicated = [];
	for (const finding of sorted) {
		let isDuplicate = false;
		for (const existing of deduplicated) {
			if (existing.key !== finding.key) continue;
			const iou = calculateIoU(existing.bbox, finding.bbox);
			if (iou > iouThreshold) {
				isDuplicate = true;
				console.log(`[DEDUP] Removed duplicate: ${finding.id} (IoU: ${iou.toFixed(4)}, class: ${finding.key}, conf: ${finding.confidence.toFixed(4)})`);
				console.log(`  Kept: ${existing.id} (conf: ${existing.confidence.toFixed(4)})`);
				break;
			}
		}
		if (!isDuplicate) deduplicated.push(finding);
	}
	const alphadentAfter = deduplicated.filter((f) => f.id.startsWith("alphadent-")).length;
	const cariesAfter = deduplicated.filter((f) => f.id.startsWith("caries-")).length;
	const mioAfter = deduplicated.filter((f) => f.id.startsWith("mio-")).length;
	console.log(`[DEDUP] After dedup - AlphaDent: ${alphadentAfter}, Caries: ${cariesAfter}, MIO: ${mioAfter}, Total: ${deduplicated.length}`);
	console.log(`[DEDUP] Output findings:`);
	deduplicated.forEach((f, i) => {
		console.log(`  ${i + 1}. ${f.id} | ${f.key} | ${f.confidence.toFixed(4)} | bbox: [${f.bbox.map((b) => b.toFixed(4)).join(", ")}]`);
	});
	return deduplicated;
}
async function requestXrayInference(image) {
	const res = await fetch("/api/xray-infer", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ image })
	});
	const payload = await res.json();
	if (!res.ok || !payload.ok) throw new Error(payload.error || `Inference failed (${res.status})`);
	return payload.findings ?? [];
}
async function requestIntraoralInference(image) {
	if (!image.startsWith("data:")) {
		const blob = await (await fetch(image)).blob();
		image = await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result));
			reader.onerror = () => reject(reader.error);
			reader.readAsDataURL(blob);
		});
	}
	const res = await fetch("/api/intraoral-infer", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ image })
	});
	const payload = await res.json();
	if (!res.ok || !payload.ok) throw new Error(payload.error || `Inference failed (${res.status})`);
	return {
		findings: payload.findings ?? [],
		mioClassification: payload.mio_classification ?? null
	};
}
var xrayJob = 0;
var intraJob = 0;
var useApp = create()((set, get) => ({
	language: "tr",
	threshold: .25,
	overlayDefault: true,
	xrayImage: SAMPLE_XRAY,
	intraoralImage: SAMPLE_INTRAORAL,
	xrayFindings: [],
	intraoralFindings: [],
	mioClassification: null,
	xrayAdjust: { ...DEFAULT_ADJUST },
	intraoralAdjust: { ...DEFAULT_ADJUST },
	analyzing: null,
	query: "",
	selectedFindingId: null,
	hiddenFindingIds: [],
	setLanguage: (language) => set({ language }),
	setThreshold: (threshold) => set({ threshold }),
	setOverlayDefault: (overlayDefault) => set((s) => ({
		overlayDefault,
		xrayAdjust: {
			...s.xrayAdjust,
			showOverlay: overlayDefault
		},
		intraoralAdjust: {
			...s.intraoralAdjust,
			showOverlay: overlayDefault
		}
	})),
	setQuery: (query) => set({ query }),
	setSelectedFindingId: (selectedFindingId) => set({ selectedFindingId }),
	toggleFindingHidden: (id) => set((s) => ({ hiddenFindingIds: s.hiddenFindingIds.includes(id) ? s.hiddenFindingIds.filter((x) => x !== id) : [...s.hiddenFindingIds, id] })),
	setHiddenFindingIds: (hiddenFindingIds) => set({ hiddenFindingIds }),
	setXrayAdjust: (patch) => set((s) => ({ xrayAdjust: {
		...s.xrayAdjust,
		...patch
	} })),
	setIntraoralAdjust: (patch) => set((s) => ({ intraoralAdjust: {
		...s.intraoralAdjust,
		...patch
	} })),
	resetXrayAdjust: () => set({ xrayAdjust: { ...DEFAULT_ADJUST } }),
	resetIntraoralAdjust: () => set({ intraoralAdjust: { ...DEFAULT_ADJUST } }),
	loadDemo: () => {
		set({ intraoralAdjust: { ...DEFAULT_ADJUST } });
		get().runXray(SAMPLE_XRAY);
		get().runIntraoral(SAMPLE_INTRAORAL);
	},
	clearCase: () => set({
		xrayImage: null,
		intraoralImage: null,
		xrayFindings: [],
		intraoralFindings: [],
		selectedFindingId: null,
		hiddenFindingIds: []
	}),
	runXray: async (image) => {
		const job = ++xrayJob;
		set({
			analyzing: "xray",
			xrayImage: image,
			xrayFindings: [],
			selectedFindingId: null,
			hiddenFindingIds: [],
			xrayAdjust: { ...DEFAULT_ADJUST }
		});
		try {
			const findings = await requestXrayInference(image);
			if (job !== xrayJob) return;
			const deduplicated = withEstimatedTeeth(deduplicateFindings(findings));
			set({
				analyzing: null,
				xrayFindings: deduplicated
			});
			if (deduplicated.length === 0) toast.message("No detections above the model threshold for this image.");
		} catch (err) {
			if (job !== xrayJob) return;
			const message = err instanceof Error ? err.message : String(err);
			set({
				analyzing: null,
				xrayFindings: []
			});
			toast.error(message);
		}
	},
	runIntraoral: async (image) => {
		const job = ++intraJob;
		set({
			analyzing: "intraoral",
			intraoralImage: image,
			intraoralFindings: [],
			mioClassification: null,
			selectedFindingId: null,
			hiddenFindingIds: []
		});
		try {
			const { findings, mioClassification } = await requestIntraoralInference(image);
			if (job !== intraJob) return;
			console.log(`[STORE] API returned ${findings.length} findings`);
			const deduplicated = deduplicateFindings(findings);
			console.log(`[STORE] Setting state with ${deduplicated.length} findings`);
			set({
				analyzing: null,
				intraoralFindings: deduplicated,
				mioClassification
			});
			if (deduplicated.length === 0) toast.message("No detections above the model threshold for this image.");
		} catch (err) {
			if (job !== intraJob) return;
			const message = err instanceof Error ? err.message : String(err);
			set({
				analyzing: null,
				intraoralFindings: [],
				mioClassification: null
			});
			toast.error(message);
		}
	}
}));
//#endregion
export { findingLabel as a, severityLabel as c, useApp as d, findingDesc as i, t as l, cn as n, isToothEstimated as o, fileToDataUrl as r, positionLabel as s, Button as t, toothDisplay as u };
