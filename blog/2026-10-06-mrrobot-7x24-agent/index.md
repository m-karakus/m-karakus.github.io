---
title: MrRobot — 7x24 Çalışan ve Her Görevle Kendini Geliştiren Bir AI Agent
description: "Data Analytics departmanı için kurduğumuz otonom agent'ın mimarisi: katmanlı hafıza, kendini geliştirme döngüsü, ölçülebilir eval'ler ve kod seviyesinde güvenlik kapıları."
slug: mrrobot-7x24-otonom-agent
authors: [metin]
tags: [ai, agent, hermes, data-engineering]
---

# MrRobot — 7x24 Çalışan ve Her Görevle Kendini Geliştiren Bir AI Agent

Saat 03:07. Ekip uyuyor. Gece veri pipeline'ı durdu. Bugün bu hata sabah 09:00'da fark edilir, öğlene kadar teşhis edilir, düzeltme akşama sarkar. Bizim kurduğumuz sistem ise hatayı kendi yakalıyor, kök nedenini buluyor, düzeltmeyi yazıyor, testleri geçiriyor ve sabah ekip uyandığında tek bir mesajla karşılaşıyor: *"Düzeltme hazır, tüm kontroller yeşil. Onaylarsan deploy edeyim."*

Bu yazıda, Data Analytics departmanının işlerini (analiz, rapor keşfi, DWH/dbt/ETL geliştirme, hata teşhisi, deploy) uçtan uca yapmaya çalışan bu sistemin — **MrRobot**'un — mantığını, mimarisini ve bize ne kazandırdığını anlatacağım.

<!-- truncate -->

## Problem: Her Sohbet Sıfırdan Başlıyor

Bugün AI'a her görevi anlatırken aynı şeyleri tekrar ediyoruz:

- AI kodumuzu, görevlerimizi ve veritabanlarımızı görebiliyor; birçok işlemi bizden hızlı yapıyor.
- Ama her sohbet sıfırdan başlıyor; sohbet kapanınca **deneyim kayboluyor**.
- Sistem yalnızca birinin çağırdığında çalışıyor; olayları kendi yakalamıyor.
- "Bu rapor şu üç tablonun join'iyle çıkar", "bu hatayı geçen ay şöyle çözmüştük" gibi bilgiler birilerinin kafasında ya da kayıp bir chat geçmişinde yaşıyor.

Cevabımız: akıllı ama hafızasız bir asistan değil, **her görevden öğrenen ve kendisi kalıcı hale getiren bir dijital ekip üyesi**. Yeni işe giren bir çalışanın zamanla kıdem kazanması gibi, bu sistem de her görevle kıdemi kazanıyor.

## Temel Fikir: Akıl Modelde, Bilgelik Bizde

Kullandığımız runtime [Hermes Agent](https://hermes-agent.nousresearch.com) — bir AI harness. **Harness = LLM'i saran iskelet**: system prompt, hafıza enjeksiyonu, skill'ler, tool'lar, görev delegasyonu, cron ve geri besleme döngüsü.

```
        ┌──────────────── HARNESS (Hermes) ────────────────┐
        │  SOUL · AGENTS.md · MEMORY.md · skills · tools    │
        │                 ┌───────┐                          │
  girdi │ ──────────────► │  LLM  │ ──────────────►          │ çıktı
        │                 └───────┘  delegate · cron · FTS   │
        └──────────────────────────────────────────────────┘
```

Buradaki kritik ayrım şu:

- **Akıl = LLM.** Değiştirilebilir. Model güncellendiğinde veya sağlayıcı değiştiğinde sistem etkilenmez.
- **Bilgelik = harness + beyin.** "Bu raporu şu join'le çıkar", "bu Sentry trace'inde önce worker log'una bak" gibi yaşanmış bilgi **hiçbir modelde yoktur** — departmanın kendi deneyimidir. Bizim sistemde git-versioned bir repo'da yaşıyor.

Model-agnostiklik bedava bir avantaj: yarın daha güçlü bir model çıkar, aynı beyinle daha iyi iş çıkarır; bugüne kadar öğrenilen hiçbir şey kaybolmaz.

## Beyin: Katmanlı Hafıza

Tek dev bir hafıza dosyası işe yaramıyor — şişince okunmuyor, okunmayan dosya da yok hükmünde. O yüzden beyni dört katmana ayırdık:

| Katman | Ne zaman yüklenir | İçerik |
|--------|-------------------|--------|
| Kimlik + Kurallar | Her oturumda | Karakter, öncelikler, güvenlik kuralları |
| Özet kart (MEMORY.md) | Her oturumda, **≤ 2.200 karakter** | Bilinenlerin index'i + dosya işaretçileri |
| Bilgi dosyaları (knowledge/) | Gerekince | Rapor tarifleri, tablo ilişkileri, KPI sözlüğü, proje notları |
| Yöntemler (skills/) | Gerekince | Çözülmüş işlerin yöntemleri, runbook'lar — **agent kendisi yazar** |

Ayrıca journal dosyası **yok**: geçmiş oturumlar Hermes tarafından otomatik saklanıyor ve full-text aranabiliyor. El yazımı günlüklerin mezarlığa dönüşmesini böyle önledik.

Disiplin basit: "her oturumda lazım" bilgi özet karta girer, gerisi knowledge/skill'e gider ve karta tek satırlık bir işaret bırakılır. Hiçbir katmana secret yazılmaz.

## Kendini Geliştirme Döngüsü

Sistemin kalbi bu döngü:

1. **Görev gelir** — Teams mesajı, Sentry webhook'u veya zamanlanmış cron işi.
2. **Hafızasına bakar** — önce kendi birikimi; eksikse canlı kaynağa sorar (OpenMetadata, Jira, DWH, Sentry). Hafızada kopya tutmaz, referans tutar — bayat veri sorunu yaşamamak için şema ve lineage her seferinde canlı sorgulanır.
3. **İşi yapar** — analiz, kod, doğrulama kapısı.
4. **Öğrendiğini kaydeder** — çalışan yöntem otomatik olarak `skills/` altına yazılır; yeni bilgi `knowledge/` altına. Her öğrenme git'te bir commit.
5. **Ölçülür** — haftalık eval koşusu; skor düşerse son skill diff'leri şüphelidir → `git revert`.

Bu döngünün compounding etkisi en önemli iddiamız: aynı türden 100. işte çözüm süresi ilk işteki saatlerden dakikalara iner. Hafızasız bir araç her işte aynı sürede çalışır; bizim sistem her işin ardından hızlanır. Ve bu birikim modele değil, repomuza ait.

## "Kendini Geliştirdi" Nasıl Kanıtlanır? Ölçüm

Otomatik öğrenmenin ciddi bir riski var: **yanlış öğrenme**. Ölçüm olmadan gelişme iddiası sadece marketing. Bu yüzden:

- **Golden eval seti:** sabit görevler (rapor join'ini bul, Sentry hatasını teşhis et, dbt testini yorumla…). Her görevin girdisi, beklenen çıktısı ve grader'ı var.
- **Grader tipleri:** kod tabanlı (deterministik — beklenen tablo adları çıktıda var mı, SQL parse ediliyor mu), model tabanlı (rubrik) ve insan (Teams'te 👍/👎).
- **Metrikler:** `pass@1`, `pass@3` ve regresyon için `pass^3` (üç ardışık başarı).
- Haftalık cron eval koşar, skoru hafızaya ve Teams'e yazar. **Skor düşerse son öğrenilenler geri alınır.** Yeni bir skill eklenince ona bir capability eval, mevcut set ise regression eval olarak korunur.

## Güvenlik: Prompt'a Değil, Koda Güven

Otonom bir sistemde "ama sistemde zarar vermesin" diye dua etmek yetmez. Üç katman:

1. **Doğrulama kapısı (verify):** Kod değişikliği lint → tip → test → secret taramasından geçmeden onay mesajı ekrana bile düşmez. Bir faz kırmızıysa önce düzeltilir ya da "çözemedim" diye raporlanır — çözülmemiş iş asla onaya sunulmaz.
2. **Deterministik guardrail:** Prompt kuralı unutulabilir; hook/wrapper unutmaz. `rm -rf /`, WHERE'siz `DELETE`, `DROP TABLE`, `terraform destroy`, main'e force push gibi pattern'ler **kod seviyesinde** engellenir. Prod'a dokunan işlemler onaya düşer.
3. **Approval gate:** Prod deploy ve AWS erişimi yalnızca insan onayıyla çalışır. Her şey loglanır, her şey geri alınabilir.

## Altyapı: Zero-Trust ve 7x24

Sistem merkezi bir EC2 üzerinde systemd servisi olarak 7x24 çalışıyor:

```
Teams / Sentry Webhook / Bitbucket-Jira
                 │
                 ▼
┌────────────────────────────────────────────────┐
│ CENTRAL EC2 — hermes-gateway (systemd)          │
│  beyin + skill'ler + cron + delegasyon          │
└───────┬────────────────────────────────────────┘
        │ sts:AssumeRole → SSM (SSH yok, statik key yok)
        ▼
  AWS Hesap 1..4 — EC2/Docker · S3 Data Lake · Glue
```

Kritik prensipler:

- **Statik AWS key diskte yok.** Erişim STS AssumeRole ile 15-60 dakikalık geçici kimlik + SSM Session Manager tüneli. Hedef makinelerde port 22 dahil hiçbir inbound port açık değil.
- **Sentry ayrı bir VPS'te** ve token read-only — olay kaynağı ile teşhis eden sistem aynı makinede durmaz.
- Merkezi makine inbound bağlantı kabul etmez (egress-only). Sunucu kaybolsa bile beyin git'te olduğu için bilgi kaybolmaz.
- Büyük işler `delegate_task` ile iş başına doğan subagent'lara bölünür; kalıcı olan subagent değil, skill'dir.

## Somut Senaryolar

Tek bir pattern var: **rutin gider, karar kalır.**

- 🌙 **Operasyon (gece hatası):** Bugün yarım gün; hedefte sistem yakalar, teşhis eder, düzeltmeyi test ortamında doğrular, insan tek kelime onaylar. Hata müdahalesi saatlerden dakikalara.
- 📊 **Rapor talebi:** Bugün doğru tabloları ve tanımları bulmak 1-2 gün; hedefte sistem katalog ve geçmiş çözümlerden derler. İkinci benzer talepte araştırma süresi sıfır.
- ⚙️ **Geliştirme:** Ekip standartları (kod, test, dokümantasyon) otomatik uygulanır; insana kalan review.
- 🧠 **Kurumsal hafıza:** "Bu tablo neden böyle hesaplanıyor?" sorusunun cevabı bir kişinin kafasından repoya taşınır. Yeni işe giren ve sistem aynı kaynaktan öğrenir.

## Neden Bu Yaklaşım?

Piyasada yüzlerce "AI agent" ürünü var. Farkımız üç şey:

1. **Hafıza bizim.** Satın alınan akıl ortaktır; departmanın yaşanmış bilgisi ise sadece bizde var. Sistem bunu yapılandırılmış, aranabilir, git-versioned hale getiriyor.
2. **Öğrenme ölçülüyor.** Otomatik skill yazımı + haftalık eval + git revert = öğrenmenin bir denetim izi var, kötü öğrenme geri alınabiliyor.
3. **İnsan karar noktasında.** Sistem otonom çalışır ama kritik adımda (prod deploy, AWS erişimi) onay kapısından geçer. Otonomluk ile kontrol arasında kurgulanmış bir denge var.

## Kapanış

Tekerleği yeniden icat etmiyoruz: agent harness'ın ~%80'i hazır (Hermes). Bizim katkımız beynin kendisi — hafıza disiplini, alan bilgisi, güvenlik kapıları ve ölçüm. En zor kısım teknoloji değil, disiplin: hafızayı şişirmeden tutmak, öğrenmeyi ölçmek, güvenliği prompt'a değil koda gömmek.

Sistem henüz yolun başında. Ama hedef net: rutin işleri bütünüyle devralan, her görevde biraz daha kıdem kazanan, geceleri de nöbette olan bir ekip üyesi. Süreç adım adım ilerliyor; her fazın ölçülebilir bir çıktısı var.

Bu yazıdaki sistemin detaylı mimarisi ve karar günlüğü projenin `PLAN.md` dosyasında. Yönetim özetini de ekledik: [One-Pager (TR)](/blog/mrrobot-onepager-tr) · [One-Pager (EN)](/blog/mrrobot-onepager-en) · [English version of this post](/blog/mrrobot-24-7-autonomous-agent). Sorunuz olursa yorumlarda veya [LinkedIn](https://linkedin.com/in/metin-karakus-b586b6132) üzerinden ulaşabilirsiniz.
