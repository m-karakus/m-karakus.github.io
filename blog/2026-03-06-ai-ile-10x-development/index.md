---
title: AI ile 10x Development — Pratik Rehber
description: GitHub Copilot'tan terminal ajanlarına, prompt mühendisliğinden AI destekli code review'a — AI araçlarını günlük geliştirme iş akışına nasıl entegre edersiniz?
slug: ai-ile-10x-development
authors: [metin]
tags: [ai, devtools, vibe-coding]
---

# AI ile 10x Development — Pratik Rehber

"10x developer" kavramı yıllardır var. Ama şimdiye kadar bu genellikle doğal yetenek veya yılların deneyimiyle açıklanıyordu. AI araçları bu denklemi değiştirdi: **araç seçimi ve kullanım kalitesi, deneyim kadar belirleyici hale geldi.**

Bu yazı "AI iyi bir şey" düzeyinde genel bir övgü değil. Somut araçlar, somut kullanım senaryoları ve gerçekten fark yaratan pratikler.

<!-- truncate -->

## Önce Dürüst Bir Değerlendirme

AI coding araçları her zaman doğru kod yazmaz. Halüsinasyon yapar, eski API kullanır, bağlamı kaçırır. Bunları görmezden gelen rehberler sizi hayal kırıklığına uğratır.

Gerçekçi beklenti şu:

- **Boilerplate ve tekrar gerektiren kod:** %80-90 verim artışı
- **Yeni domain / framework keşfi:** %50-70 verim artışı
- **Karmaşık business logic:** %20-40 verim artışı
- **Kritik güvenlik / performans kodu:** Dikkatli review şart, kör güven tehlikeli

AI bir çarpan. Temel olmadan çarpmak işe yaramaz — ama temel varsa etkisi büyük.

---

## Araç Haritası

### Katman 1: IDE Entegrasyonu (Her Zaman Açık)

Bunlar background'da çalışan, her tuş vuruşunda devreye giren araçlar:

| Araç | Güçlü Yön | Fiyat |
| ---- | --------- | ----- |
| **GitHub Copilot** | En geniş dil/framework desteği, VS Code entegrasyonu | $10/ay |
| **Cursor** | Tam proje bağlamı, multi-file edit, chat | $20/ay |
| **Windsurf** | Cascade agenti, codebase-aware | $15/ay |
| **Codeium** | Ücretsiz tier güçlü, enterprise seçenek | Ücretsiz |

Bunlardan **birini** seçin ve derinlemesine öğrenin. Hepsini yüzeysel kullanmak hiçbirinden verim almamak demektir.

---

### Katman 2: Sohbet / Reasoning (Zorlu Problemler İçin)

IDE autocompletion'ın ötesine geçmeniz gerektiğinde:

| Araç | Ne Zaman |
| ---- | -------- |
| **Claude Sonnet/Opus** | Uzun kod analizi, mimari tartışma, dokümantasyon |
| **ChatGPT o1/o3** | Matematiksel/algoritmik problem çözme |
| **Gemini 1.5 Pro** | Çok büyük codebase'leri tek seferde analiz (1M token context) |

---

### Katman 3: Terminal Ajanları (Otomasyon)

Dosya oluşturma, değiştirme, komut çalıştırma gibi multi-step görevler için:

- **OpenCode** — terminal TUI, model agnostik, açık kaynak
- **Claude Code** — güçlü ajan yetenekleri, Anthropic ekosistemi
- **Aider** — git-native, commit mesajlarını da AI yazar

---

## Pratik 1: Completion'ı Düzgün Kullanmak

Çoğu geliştirici Copilot'u açıp önerilen kodu Tab ile kabul ediyor. Bu, aracın %20'sini kullanmak demektir.

### Bağlamı Şekillendirin

AI, **dosyanın geri kalanına bakarak** tamamlama üretir. Bunu bilinçli kullanın:

```python
# KÖTÜ: Bağlam yok, genel bir şey üretir
def process():

# İYİ: Yorum ile bağlamı açıklayın
# Snowflake'ten müşteri verilerini çekip yaş gruplarına göre segmente et
# Sonucu {segment: [customer_id, ...]} formatında döndür
def process_customer_segments():
```

İkinci örnekte Copilot çok daha isabetli bir tamamlama üretir.

---

### Çoklu Öneri Görüntüleme

Copilot'ta `Alt+]` / `Alt+[` ile alternatif önerilere bakın. İlk öneri her zaman en iyisi değildir.

---

### Yorum → Kod Pattern'i

Karmaşık bir işlevi yazmadan önce önce yorumları yazın, sonra Copilot'un doldurmasına izin verin:

```python
def calculate_customer_ltv(customer_id: str, lookback_days: int = 365) -> float:
    # 1. Son lookback_days içindeki tüm siparişleri çek
    # 2. İade edilen siparişleri filtrele
    # 3. Ağırlıklı ortalama ile LTV hesapla (son 90 gün 2x ağırlık)
    # 4. Float olarak döndür, müşteri yoksa 0.0
```

---

## Pratik 2: Chat'i Doğru Kullanmak

### Kötü Prompt vs İyi Prompt

```
# KÖTÜ
"Bu kodu düzelt"

# İYİ
"Aşağıdaki dbt incremental modeli Snowflake'te çalışıyor ama
merge strategy'de duplicate row oluşturuyor.
unique_key 'order_line_sk', incremental_strategy 'merge'.
Sorunun neden kaynaklandığını açıkla ve düzelt:

[kod]"
```

Fark: bağlam (Snowflake, dbt, merge), belirti (duplicate), beklenti (açıkla + düzelt).

---

### Rol Atayın

```
"Sen senior bir veri mühendisisin. Bu dbt modelini
production'a almadan önce code review yapıyorsun.
Performans, güvenlik ve maintainability açısından
potansiyel sorunları listele:"
```

Rol atamak, modelin yanıt kalitesini ve odağını belirgin şekilde iyileştirir.

---

### Adım Adım Düşündürün

Karmaşık problemlerde doğrudan cevap istemek yerine:

```
"Önce bu problemi çözmek için hangi yaklaşımları
kullanabileceğimizi listele. Sonra her birinin
avantaj ve dezavantajlarını karşılaştır.
Karar vermeden önce benim onayımı bekle."
```

---

## Pratik 3: AI Destekli Code Review

### Commit Öncesi Otomatik Review

```bash
# Son değişiklikleri AI'a review ettir
git diff HEAD | opencode "Bu diff'i security, performance
ve code style açısından review et. Kritik sorunları önce listele."
```

---

### Spesifik Review Türleri

Genel "bu kodu gözden geçir" yerine odaklı sorular:

```
"Bu SQL sorgusunda N+1 problemi var mı?"
"Bu fonksiyonda race condition oluşabilecek bir senaryo var mı?"
"Bu Pydantic model, eksik field geldiğinde nasıl davranır?"
"Bu dbt modeli full refresh yapılırsa ne olur?"
```

---

## Pratik 4: Dokümantasyon ve Test

### Dokümantasyonu AI'a Bırakın

Geliştirme bittikten sonra:

```
"Bu modülün docstring'lerini yaz. Google style.
Her fonksiyon için Args, Returns, Raises ve
bir kullanım örneği ekle."
```

---

### Test Senaryosu Üretimi

```
"Bu fonksiyon için pytest test senaryoları yaz.
Happy path, edge case'ler (boş liste, None, negatif sayı)
ve bir exception test'i dahil et. Fixture kullan."
```

AI'ın ürettiği testleri körü körüne kullanmayın — edge case'leri gözden geçirin, iş mantığına uygun olduğunu doğrulayın.

---

## Pratik 5: Veri Mühendisleri İçin Özel Senaryolar

### dbt Modeli Hızlandırma

```
"Bu staging modelini analiz et:
1. Eksik testleri _schema.yml formatında yaz
2. Incremental filter'ı 2-day buffer pattern'ine uygun hale getir
3. LowCardinality kullanılabilecek kolonları işaretle
[model SQL'i]"
```

---

### SQL Optimizasyonu

```
"Bu Snowflake sorgusu 45 saniye çalışıyor.
Execution plan'a bakarak nerede takıldığını tahmin et
ve optimize edilmiş versiyonu yaz:
[sorgu]"
```

---

### Pipeline Hata Ayıklama

Airflow veya benzeri bir orkestratörde hata aldığınızda:

```
"Bu Airflow DAG hata log'u:
[log]

DAG kodu:
[kod]

Hatanın kök nedeni ne? Hangi task'ta, neden oluşuyor?
Düzeltilmiş versiyonu yaz."
```

---

## Dikkat: AI'ın Kör Noktaları

Bunlar için körü körüne güvenmeyin:

**Güvenlik:** SQL injection, secret exposure, authentication logic — her zaman kendiniz review edin.

**Eski API'lar:** Eğitim tarihinden sonra değişmiş kütüphaneler için hallüsinasyon yapabilir. Özellikle hızlı gelişen ekosistemler (LangChain, dbt yeni versiyonları) için dokümantasyonu kendiniz kontrol edin.

**Business logic:** Domain bilgisi gerektiren kural hesaplamalar. "Müşteri LTV" şirket bazlı farklı tanımlar içerir, AI genel formül üretir.

**Performance tuning:** Genel öneriler verir ama gerçek execution planı ve data distribution'ı bilemez.

---

## İş Akışı Önerisi

Günlük geliştirme için önerilen düzen:

```
Sabah planlaması  →  AI ile task breakdown ("Bu feature'ı subtask'lara böl")
         ↓
Kod yazma         →  IDE completion (Copilot/Cursor) sürekli açık
         ↓
Takıldığında      →  Chat (Claude/ChatGPT) ile derinlemesine analiz
         ↓
Bitince           →  AI review ("Bu kodu security açısından gözden geçir")
         ↓
Test/Docs         →  AI ile test senaryoları ve docstring üret
         ↓
Commit            →  AI ile commit mesajı özeti
```

---

## Gerçek 10x Nerede?

Araçlardan çok **hangi işleri AI'a devredip hangilerini kendiniz yaptığınıza** bağlı.

AI'a devredin:
- Boilerplate, tekrar eden kod
- Bilinen pattern'lerin uygulaması
- Dokümantasyon ve test senaryoları
- Hata mesajı analizi
- Format dönüşümleri (JSON → Pydantic model gibi)

Kendiniz yapın:
- Sistem tasarımı ve mimari kararlar
- Business logic'in doğrulanması
- Güvenlik-kritik kod review'u
- Performance darboğazlarının gerçek analizi

Bu ayrımı doğru yapmak, AI kullanan bir geliştiriciyi sadece AI tab'ı açık tutan birinden ayırır.

---

## Özet

10x development için AI kullanmak üç katmanlı bir pratik:

1. **IDE completion** — her zaman açık, bağlamı şekillendirerek kullanın
2. **Chat** — odaklı, rol atanmış, adım adım promptlar
3. **Terminal ajanlar** — multi-file, multi-step görevler için otomasyon

Araçlar hızla değişiyor. Ama temel prensipler değişmiyor: **ne istediğinizi net ifade etmek, üretileni eleştirel gözle değerlendirmek ve AI'ı asistan olarak değil ortak olarak kullanmak.**
