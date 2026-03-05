---
title: Vibe Coding Nedir? OpenCode ile Terminal'den AI Destekli Geliştirme
description: Andrej Karpathy'nin popülerleştirdiği "vibe coding" kavramı nedir, OpenCode ile terminal üzerinde nasıl AI destekli kod yazılır?
slug: vibe-coding-nedir-opencode
authors: [metin]
tags: [ai, devtools, vibe-coding]
---

# Vibe Coding Nedir? OpenCode ile Terminal'den AI Destekli Geliştirme

2025 yılının başında Andrej Karpathy bir tweet attı: *"There's a new kind of coding I call 'vibe coding'."* Bu kısa cümle, yazılım geliştirme dünyasında ciddi bir tartışma başlattı. Peki vibe coding gerçekten ne anlama geliyor ve terminal severlerin yeni favorisi OpenCode bu tablonun neresinde?

<!-- truncate -->

## Vibe Coding Nedir?

Karpathy'nin tanımıyla vibe coding: **kodu anlamadan, sadece ne istediğini AI'ya anlatarak yazılım üretmek**. Detayları takip etmiyorsunuz, hata mesajlarını okumuyorsunuz — AI'a yapıştırıyorsunuz, o düzeltiyor, devam ediyorsunuz.

> *"I just see stuff, say stuff, run stuff, and copy-paste stuff, and it mostly works."* — Andrej Karpathy

Bu tanım başlangıçta bir şaka gibi geldi. Ama arkasında gerçek bir gözlem var: **AI araçları artık o kadar iyi ki, bir şeyin nasıl çalıştığını tam anlamadan da çalışan kod üretmek mümkün.**

---

## Vibe Coding: Tehlike mi, Fırsat mı?

İki keskin yorum var:

**Eleştirenler:** "Anlamadığın kodu production'a sokarsın, güvenlik açıkları yaratırsın, debug edemezsin."

**Savunanlar:** "Prototype hızı inanılmaz artıyor. Bir fikri saatler içinde ayağa kaldırabiliyorsun. Temel mantığı anlayıp detayları AI'a bırakmak yeni bir beceri."

Gerçek ikisinin arasında bir yerde. Vibe coding **keşif, prototipleme ve tekrarlayan görevler** için güçlü bir yaklaşım. Kritik production sistemlerinde körü körüne uygulamak ise hâlâ riskli.

Önemli olan şu: AI araçlarını pasif kullanmak ile aktif kullanmak arasındaki fark. En iyi geliştiriciler AI'ı bir oracle gibi değil, **hızlı bir çalışma arkadaşı** gibi kullanıyor.

---

## Araç Ekosistemi

2025-2026 itibarıyla AI coding araçları iki ana kategoriye ayrıldı:

| Kategori | Araçlar |
| -------- | ------- |
| **IDE entegrasyonu** | GitHub Copilot, Cursor, Windsurf, Codeium |
| **Terminal / agentic** | Claude Code, OpenCode, Aider, Goose |

IDE araçları zaten yaygın. Terminal tabanlı araçlar ise özellikle backend ve veri mühendisleri arasında hızla popülerleşiyor — çünkü IDE açmadan, doğrudan terminalden çalışıyorlar.

---

## OpenCode Nedir?

[OpenCode](https://github.com/sst/opencode), SST ekibi tarafından geliştirilen **terminal tabanlı, açık kaynaklı bir AI coding ajanıdır**. Go ile yazılmıştır, hızlıdır ve terminal içinde tam bir TUI (Text User Interface) sunar.

Neden öne çıkıyor:

- **Model agnostik**: Claude, GPT-4o, Gemini, yerel modeller (Ollama) destekler
- **Bağlam farkındalığı**: Proje dosyalarını, git history'yi okur
- **Terminal native**: IDE gerektirmez, SSH üzerinden uzak sunucularda da çalışır
- **Açık kaynak**: MIT lisansı, kendi modelinizi bağlayabilirsiniz

---

## OpenCode Kurulumu

### macOS / Linux

```bash
curl -fsSL https://opencode.ai/install | bash
```

### npm ile

```bash
npm install -g opencode-ai
```

### Doğrulama

```bash
opencode --version
```

---

## Temel Kullanım

### Başlatmak

```bash
# Proje dizininde başlat
cd my-project
opencode
```

TUI açılır. Sol panel dosya ağacı, sağ panel konuşma arayüzü.

---

### Model Seçimi

İlk kurulumda veya sonradan model seçebilirsiniz:

```bash
opencode --model claude-opus-4-5
opencode --model gpt-4o
opencode --model ollama/llama3.2  # yerel model
```

`~/.config/opencode/config.json` ile varsayılan model kalıcı olarak ayarlanır:

```json
{
  "model": "claude-sonnet-4-5",
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-..."
    }
  }
}
```

---

### Pratik Kullanım Senaryoları

**Yeni bir özellik yazmak:**

```
> Bu projedeki fct_orders modelini incele ve customer_lifetime_value 
  hesaplayan yeni bir mart modeli yaz. dbt standartlarına uy.
```

OpenCode projeyi tarar, mevcut modelleri okur, bağlama uygun kod yazar.

---

**Hata ayıklamak:**

```
> Bu hata mesajını al ve neden oluştuğunu açıkla, düzelt:
  KeyError: 'customer_sk' - line 47 in fct_orders.sql
```

---

**Refactor:**

```
> stg_crm__orders.sql dosyasındaki tekrar eden CTE'leri bir makroya çıkar
```

---

**Test yazmak:**

```
> dim_customer modeli için dbt test tanımlarını _schema.yml'e ekle.
  surrogate key, natural key ve email sütunları için.
```

---

## Slash Komutları

OpenCode içinde `/` ile başlayan komutlar:

| Komut | Ne Yapar |
| ----- | -------- |
| `/add <dosya>` | Belirli dosyayı bağlama ekle |
| `/clear` | Konuşma geçmişini temizle |
| `/model` | Model değiştir |
| `/diff` | Son yapılan değişiklikleri göster |
| `/undo` | Son değişikliği geri al |
| `/compact` | Uzun konuşmayı özetle (token tasarrufu) |

---

## OpenCode vs Cursor vs Claude Code

| | OpenCode | Cursor | Claude Code |
|-|----------|--------|-------------|
| **Arayüz** | Terminal TUI | IDE (VS Code fork) | Terminal |
| **Model seçimi** | Çoklu (agnostik) | Sınırlı | Claude only |
| **Açık kaynak** | Evet | Hayır | Hayır |
| **Fiyat** | Ücretsiz (kendi API key) | $20/ay | Kullanım başına |
| **SSH / uzak** | Evet | Sınırlı | Evet |
| **IDE bağımlılığı** | Yok | Var | Yok |

---

## Veri Mühendisleri İçin Vibe Coding

Veri projelerinde vibe coding en çok şu alanlarda verim sağlıyor:

**dbt modelleri:** "Bu staging modelini inceleyip fact tablosuna dönüştür" — OpenCode mevcut stili okur, tutarlı kod üretir.

**SQL optimizasyonu:** Yavaş bir sorguyu yapıştırıp "Bu sorguyu ClickHouse için optimize et, PREWHERE kullan" demek yeterli.

**YAML sıkıcılığı:** dbt `_schema.yml` dosyaları yazmak zaman alıcı. "Bu SQL modelindeki tüm kolonlar için schema YAML üret" ile saniyeler içinde biter.

**Boilerplate:** Pipeline kodu, Airflow DAG iskeletleri, test dosyaları — bunları AI'a bırakmak mantıklı.

---

## Özet

Vibe coding, "AI'a bırak, sen sadece ne istediğini bil" yaklaşımı. Tehlikeli mi? Yanlış ellerde evet. Güçlü mü? Doğru kullanıldığında kesinlikle.

OpenCode bu yaklaşımın terminal-native, model-agnostik ve açık kaynak versiyonu. IDE açmadan, SSH üzerinden, istediğiniz modelle çalışıyor.

**Önerilen başlangıç noktası:** Gerçek bir proje değil, bir side project veya yerel deney ortamında başlayın. Neyi yaptığını anlayın, sonra asıl işinize entegre edin.
