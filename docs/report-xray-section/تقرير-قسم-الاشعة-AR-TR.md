# تقرير قسم الأشعة البانورامية
# Panoramik Röntgen Bölümü Raporu

**المشروع / Proje:** DentaAI  
**التاريخ / Tarih:** 21 تشرين الأول / Ekim 2026  
**الحالة / Durum:** فئتان من القاعدة الثانية منتهيتان + الانطمار من القاعدة الأولى مفعّل

---

# الجزء العربي

## 1. الفكرة التي اعتُمدت

قسم الأشعة في DentaAI ليس نموذجًا واحدًا لكل الأمراض. كل مهمة سريرية لها **متخصص** (ملف أوزان مستقل)، ولا يظهر التشخيص في الواجهة إلا إذا قاس تدريبنا نحن على مجموعة التحقق:

**mAP50 ≥ 90٪**

ما تحت هذا الرقم يُحجب، حتى لو كانت القاعدة غنية بالصور. لهذا رُفض خلط كل الفئات في نموذج واحد، ورُفض إسقاط تسميات قاعدة على فئات قاعدة أخرى.

---

## 2. ماذا اعتُمد من أول قاعدة؟

**اسم القاعدة:** vzrad2 / ToothTruth (بانوراما)

**ما اعتُمد فقط:**  
السن المنطمر / الضرس المطمور (`impaction`)

| البند | القيمة |
|---|---|
| الفئة الظاهرة | Impacted tooth |
| القياس المعتمد | mAP50 ≈ **96٪** (في النظام مسجّل 95.5٪) |
| الوزن | `models/xray/specialists/impaction.pt` |
| الحالة في الموقع | **مفعّل** |
| عتبة الثقة | 0.40 |

**ما لم يُعتمد من القاعدة الأولى ( basılı/قديم، تحت 90 أو غير موثوق):**

| الفئة | آخر قياس قديم | القرار |
|---|---|---|
| الأسنان المفقودة | mAP50 ≈ 67٪ | محجوبة إلى أن تُدرَّب على OralXrays |
| الترميمات (حشوة/تاج/جسر/قناة) | mAP50 ≈ 55٪ | أُعيد تدريبها على القاعدة الثانية |
| الآفة الذروية | mAP50 ≈ 8٪ | محجوبة |
| فقدان العظم | mAP50 ≈ 21٪ | محجوبة |
| التشريح (قناة فكية، أسنان كاملة…) | — | لا تُعرض كتشخيص أبدًا |

**الخلاصة:** من أول قاعدة دخل المنتج **فئة واحدة فقط**: الانطمار.

---

## 3. ماذا اعتُمد من ثاني قاعدة؟

**اسم القاعدة:** OralXrays-9  
**الأسلوب:** تقسيم YOLO إلى متخصصين؛ الصورة تدخل المتخصص فقط إذا فيها تسمية تلك الفئة.

**طابور التدريب (90+ المنشور):**  
`implant` → `restorations` → `missing` → `impaction`

**مُستثنى حتى قياسنا نحن ≥ 90:**  
Decay (تسوس) و Apical Periodontitis (آفة ذروية)

### 3.1 الفئة الأولى المنتهية — الزرعة (Implant)

| البند | القيمة |
|---|---|
| الأصناف | 1: `implant` |
| صور التدريب | 1087 |
| صور التحقق | 970 |
| النموذج | YOLO11n ، صورة 640 ، حتى 80 عصرًا |
| ماذا حدث | إيقاف مبكر عند العصر **76** |
| الوزن | `models/xray/specialists/implant.pt` |
| الحالة | **مفعّل** في الموقع |
| عتبة الثقة | 0.50 |

**نتائج التحقق (آخر عصر مكتمل 76 / أفضل mAP50–95 عند 61):**

| المقياس | آخر عصر (76) | أفضل قيمة |
|---|---|---|
| Precision | 98.6٪ | 99.1٪ |
| Recall | 99.0٪ | 99.5٪ |
| **mAP50** | **99.0٪** | **99.2٪** |
| **mAP50–95** | **82.6٪** | **82.8٪** |

التجربة على الموقع: بانوراما تحقق فيها زرعات → الواجهة أظهرت صناديق **Implant فقط**، أعلى ثقة 87٪.

### 3.2 الفئة الثانية المنتهية — الترميمات (Restorations)

| البند | القيمة |
|---|---|
| الأصناف | 4: جسر `bridge`، تاج `crown`، حشوة `filling`، حشوة قناة `rootCanal` |
| صور التدريب | 6322 |
| صور التحقق | 1887 |
| النموذج | YOLO11n ، صورة 640 ، 80 عصرًا مخططًا |
| ماذا حدث | أُوقف بعد العصر **61** بعد ثبات الدقة |
| أفضل وزن | العصر **57** (`best.pt`) |
| الوزن المنسوخ | `models/xray/specialists/restorations.pt` |
| الحالة | **مفعّل** في الموقع |
| عتبة الثقة | 0.50 |

**نتائج أفضل وزن (العصر 57):**

| المقياس | القيمة |
|---|---|
| Precision | **90.9٪** |
| Recall | **92.2٪** |
| **mAP50** | **94.4٪** |
| **mAP50–95** | **75.6٪** |

مسار التحسن: العصر 1 = 88.0٪ mAP50 → العصر 4 تجاوز 90 → العصر 57 ثبت عند 94.4٪. آخر 6 عصور لم تتحرك تقريبًا؛ لذلك الإيقاف كان صحيحًا.

الترميمات أصعب من الزرعة (4 أصناف متشابهة)، و94.4٪ فوق شرط 90 وتُعد نجاحًا.

### 3.3 ما لم يُعتمد بعد من القاعدة الثانية

| المتخصص | السبب | القرار الآن |
|---|---|---|
| الأسنان المفقودة | لم يُدرَّب بعد | التالي في الطابور |
| انطمار OralXrays | لم يُدرَّب بعد | لاحقًا؛ الانطمار الحالي من القاعدة الأولى |
| التسوس البانورامي | قياس منشور ضعيف | محجوب |
| الآفة الذروية | قياس منشور ضعيف | محجوب |

---

## 4. ماذا يظهر في قسم الأشعة اليوم؟

| # | التشخيص | القاعدة | mAP50 | الحالة |
|---|---|---|---|---|
| 1 | سن منطمر | الأولى (ToothTruth / vzrad2) | 96٪ | ظاهر |
| 2 | زرعة | الثانية (OralXrays) | 99٪ | ظاهر |
| 3 | حشوة / تاج / جسر / قناة | الثانية (OralXrays) | 94٪ | ظاهر |
| — | سن مفقود | الثانية (قيد الانتظار) | — | مخفي |
| — | تسوس على البانوراما | — | — | مخفي |
| — | آفة ذروية / فقدان عظم | — | ضعيف | مخفي |

شرط العمر في الواجهة: التحليل البانورامي للبالغين **16 سنة فأكثر**.

---

## 5. صور دقة فئة الزرعة

**شكل 1 — ملخص أفضل مقاييس الزرعة**

![implant metrics](implant-00-best-metrics.png)

**شكل 2 — كل منحنيات التدريب والتحقق (خسارة، Precision، Recall، mAP50، mAP50–95)**

![implant curves](implant-01-training-curves.png)

**شكل 3 — منحنى Precision–Recall (mAP@0.5 ≈ 0.991)**

![implant PR](implant-02-pr-curve.png)

**شكل 4 — مصفوفة الالتباس المعيارية**

![implant confusion](implant-03-confusion.png)

**شكل 5 — تنبؤات دفعة تحقق**

![implant pred](implant-04-val-pred.jpg)

**شكل 6 — التسميات المرجعية لنفس الدفعة**

![implant labels](implant-05-val-labels.jpg)

**شكل 7 — لقطة من موقع DentaAI بعد تحليل زرعات حقيقية (21 كشف Implant)**

![implant ui](implant-06-ui-live.png)

---

## 6. صور دقة فئة الترميمات

**شكل 8 — ملخص أفضل وزن (العصر 57)**

![rest metrics](restorations-best-metrics.png)

**شكل 9 — منحنيات 61 عصرًا (مستخرجة من results.csv لأن التدريب أُوقف قبل رسوم النهاية التلقائية)**

![rest curves](restorations-training-curves.png)

**شكل 10 — توزيع تسميات الترميمات في مجموعة التدريب**

![rest labels](restorations-03-labels.jpg)

**شكل 11 — عيّنة دفعة تدريب**

![rest batch](restorations-04-train-batch.jpg)

---

## 7. مقارنة الفئتين المنتهيتين

| | الزرعة | الترميمات |
|---|---|---|
| عدد الأصناف | 1 | 4 |
| حجم التدريب | 1087 | 6322 |
| العصور | 76 (إيقاف مبكر) | 61 (إيقاف بعد الثبات) |
| mAP50 | 99.0٪ | 94.4٪ |
| mAP50–95 | 82.6–82.8٪ | 75.6٪ |
| هل تجاوزت 90؟ | نعم | نعم |
| في الموقع؟ | نعم | نعم |

---

## 8. الخلاصة

1. **أول قاعدة** أعطت المنتج الانطمار فقط.  
2. **ثاني قاعدة** أعطت المنتج الزرعة ثم الترميمات، بعد قياس تحقق حقيقي فوق 90.  
3. لم تُخلط القاعدتان في رأس شبكة واحد.  
4. التسوس والآفة الذروية ما زالا خارج الواجهة.  
5. الخطوة التالية: تدريب الأسنان المفقودة على OralXrays، ثم قياس mAP50 قبل التفعيل.

---

# Türkçe bölüm

## 1. Benimsenen yöntem

DentaAI’nin panoramik bölümü tek bir “her şeyi gören” model değildir. Her klinik görev için ayrı bir **uzman ağırlık** dosyası vardır. Bir tanı arayüzde ancak bizim doğrulama ölçümümüz şu eşiği geçerse gösterilir:

**mAP50 ≥ %90**

Bu eşiğin altı gizlenir. Bu yüzden tüm sınıflar tek modele sıkıştırılmadı; bir veri kümesinin etiketleri başka bir kümenin sınıflarına indirgenmedi.

---

## 2. Birinci veri kümesinden ne alındı?

**Kaynak:** vzrad2 / ToothTruth (panoramik)

**Alınan tek sınıf:** gömülü diş (`impaction`)

| Madde | Değer |
|---|---|
| Gösterilen sınıf | Impacted tooth |
| Ölçüm | mAP50 ≈ **%96** (sistemde 95,5) |
| Ağırlık | `models/xray/specialists/impaction.pt` |
| Durum | **Açık** |
| Güven tabanı | 0,40 |

**Birinci kümeden alınmayanlar:**

| Sınıf | Eski ölçüm | Karar |
|---|---|---|
| Eksik diş | mAP50 ≈ %67 | OralXrays eğitimi bekleniyor |
| Restorasyon | mAP50 ≈ %55 | İkinci kümede yeniden eğitildi |
| Periapikal lezyon | mAP50 ≈ %8 | Gizli |
| Kemik kaybı | mAP50 ≈ %21 | Gizli |
| Anatomi (mandibular kanal vb.) | — | Asla tanı olarak gösterilmez |

**Özet:** Birinci kümeden ürüne giren tek sınıf **gömülü diştir**.

---

## 3. İkinci veri kümesinden ne alındı?

**Kaynak:** OralXrays-9  
**Yöntem:** YOLO uzman alt kümeleri; görüntü, o sınıfın etiketi yoksa o uzmana verilmez.

**Eğitim kuyruğu (yayımlanmış 90+):**  
`implant` → `restorations` → `missing` → `impaction`

**Şimdilik dışarıda:** Decay ve Apical Periodontitis

### 3.1 Bitirilen birinci sınıf — İmplant

| Madde | Değer |
|---|---|
| Sınıf sayısı | 1: `implant` |
| Eğitim / doğrulama | 1087 / 970 görüntü |
| Model | YOLO11n, 640, en fazla 80 epoch |
| Sonuç | Erken durdurma, epoch **76** |
| Ağırlık | `models/xray/specialists/implant.pt` |
| Durum | **Açık** |
| Güven tabanı | 0,50 |

| Metrik | Son epoch (76) | En iyi |
|---|---|---|
| Precision | %98,6 | %99,1 |
| Recall | %99,0 | %99,5 |
| **mAP50** | **%99,0** | **%99,2** |
| **mAP50–95** | **%82,6** | **%82,8** |

Arayüz deneyi: çok implanlı doğrulama panoramiğinde yalnızca **Implant** kutuları; en yüksek güven %87.

### 3.2 Bitirilen ikinci sınıf — Restorasyonlar

| Madde | Değer |
|---|---|
| Sınıflar | 4: `bridge`, `crown`, `filling`, `rootCanal` |
| Eğitim / doğrulama | 6322 / 1887 görüntü |
| Model | YOLO11n, 640 |
| Sonuç | Epoch **61** sonrası durduruldu (doygunluk) |
| En iyi ağırlık | Epoch **57** |
| Kopya | `models/xray/specialists/restorations.pt` |
| Durum | **Açık** |
| Güven tabanı | 0,50 |

**En iyi ağırlık (epoch 57):**

| Metrik | Değer |
|---|---|
| Precision | **%90,9** |
| Recall | **%92,2** |
| **mAP50** | **%94,4** |
| **mAP50–95** | **%75,6** |

Epoch 1’de mAP50 %88 idi; epoch 4’te %90’ı geçti; epoch 57’de %94,4’te durdu. İmplanttan düşük olması beklenir (4 benzer sınıf); yine de eşik aşılmıştır.

### 3.3 İkinci kümeden henüz alınmayanlar

| Uzman | Neden | Şimdi |
|---|---|---|
| Eksik diş | Henüz eğitilmedi | Sıradaki iş |
| OralXrays gömülü | Henüz eğitilmedi | Mevcut gömülü hâlâ birinci kümeden |
| Çürük | Zayıf yayımlanmış skor | Gizli |
| Periapikal | Zayıf yayımlanmış skor | Gizli |

---

## 4. Panoramik bölümde bugün ne görünür?

| # | Tanı | Kaynak | mAP50 | Durum |
|---|---|---|---|---|
| 1 | Gömülü diş | 1. küme | %96 | Açık |
| 2 | İmplant | 2. küme | %99 | Açık |
| 3 | Dolgu / kuron / köprü / kanal | 2. küme | %94 | Açık |
| — | Eksik diş | 2. küme, bekliyor | — | Kapalı |
| — | Panoramik çürük | — | — | Kapalı |
| — | Periapikal / kemik kaybı | — | zayıf | Kapalı |

Yaş kuralı: panoramik analiz **16 yaş ve üzeri**.

---

## 5–6. Şekiller

Yukarıdaki Arapça bölümdeki şekil 1–11 aynı dosyalardır (implant-*.png / restorations-*.png). Rapora eklerken bu klasördeki görselleri kullanın:

`docs/report-xray-section/`

---

## 7. Bitmiş iki sınıfın karşılaştırması

| | İmplant | Restorasyon |
|---|---|---|
| Sınıf sayısı | 1 | 4 |
| Eğitim boyutu | 1087 | 6322 |
| Epoch | 76 | 61 |
| mAP50 | %99,0 | %94,4 |
| mAP50–95 | %82,6–82,8 | %75,6 |
| Eşik (≥90) | Geçti | Geçti |
| Arayüz | Açık | Açık |

---

## 8. Sonuç

1. **Birinci veri kümesi** ürüne yalnızca gömülü dişi verdi.  
2. **İkinci veri kümesi** ürüne implantı ve restorasyonları verdi; her biri kendi doğrulamasında %90’ı aştı.  
3. İki küme tek kafa içinde karıştırılmadı.  
4. Çürük ve periapikal hâlâ gizli.  
5. Sonraki adım: OralXrays ile eksik diş eğitimi, sonra mAP50 ölçümü.

---

## Dosya yolları / Dosya yolları

```
models/xray/specialists/impaction.pt      ← 1. küme
models/xray/specialists/implant.pt        ← 2. küme, sınıf 1
models/xray/specialists/restorations.pt   ← 2. küme, sınıf 2
runs/xray-oralxrays/oralxrays-implant/results.csv
runs/xray-oralxrays/oralxrays-restorations/results.csv
docs/report-xray-section/                 ← tüm şekiller + bu rapor
```
