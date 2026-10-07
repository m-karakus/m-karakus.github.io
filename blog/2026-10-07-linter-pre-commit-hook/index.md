---
title: Linter Nedir, Neden Otomatik Çalıştırmalısın ve Pre-commit Hook'u Bunun İçin Ne Yapar?
description: "Linter'ın kodda ne aradığını, manuel lint'in neden kaçınılmaz olarak unutulduğunu ve lint'i pre-commit hook ile otomatikleştirmenin mantığını anlatan kısa rehber."
slug: linter-nedir-pre-commit-hook
authors: [metin]
tags: [devtools, vibe-coding]
---

# Linter Nedir, Neden Otomatik Çalıştırmalısın ve Pre-commit Hook'u Bunun İçin Ne Yapar?

Herkes lint'in faydalı olduğunu bilir. Ama çoğu ekipte lint ya hiç çalışmıyor ya da yalnızca birinin "acaba lint atsam mı?" dediği anda çalışıyor. Bu yazıda üç şeyi netleştireceğim: linter ne yapar, neden manuel lint bir disiplin sorunu olarak kalamaz, ve bu disiplin sorununu makineye devretmenin standart yolu olan **pre-commit hook** nasıl çalışır.

<!-- truncate -->

## Linter Nedir?

Linter, kodunuzu **çalıştırmadan** okuyup sorunları işaret eden statik analiz aracıdır. Adı, C'nin ilk yıllarındaki `lint` aracından gelir — bugün dil başına fiilen standartlaşmış araçlar var:

- **Python:** `ruff` (bugün fiilen standart; eski `flake8` + `isort` + daha fazlasının yerini aldı), `mypy`/`pyright` (tip kontrolü)
- **JavaScript/TypeScript:** `eslint` + `prettier` (biçimlendirme)
- **Go:** `golangci-lint`
- **Shell:** `shellcheck`
- **YAML/CI:** `yamllint`, `actionlint`

Bir linter iki tür şey bulur:

1. **Gerçek hata adayları:** tanımsız değişken, kullanılmayan import, ulaşılamaz kod, f-string yerine `%` formatlama gibi klasik pitfall'lar.
2. **Tutarlılık ihlalleri:** satır uzunluğu, tırnak stili, import sırası, isimlendirme. Bunlar hata değil ama her PR'da "bu satırın sonunda boşluk var" tipinde review yorumu demektir.

Önemli ayrım: linter derleyicinin yaptığını tekrarlamaz. Derleyici "bu kod derleniyor mu?" diye sorar; linter "bu kod doğru *ve* okunaklı *ve* ekip kurallarına uyuyor mu?" diye sorar.

## Neden Kullanılır?

Kısa cevap: review'da insan zamanını gereksiz şeylere harcamayı önlediği için.

- **Erken hata yakalama:** `except: pass` ile yutulan exception, yanlış yazılmış değişken adı, yan etkisi olan default argüman — bunların hepsi lint kurallarıyla dakikalar içinde yakalanır; test yazmadan önce bile.
- **Review'da tartışma azalır:** Biçim tartışması makineye ait. Kod review'u "buraya boşluk koy"dan "bu mantık yanlış mı?"ye kayar. Bu tek başına en büyük kazançtır.
- **Ekip tutarlılığı:** Farklı editorlerde, farklı kişilerin yazdığı kod tek stil çıkarır. Geçmişte ekibe yeni katılan biri, kod tabanının kime ait olduğunu görerek kendini uyarlamak zorunda kalmaz.
- **Refactor güvenliği:** Kullanılmayan kod, ölü branch'ler, unreachable satırlar silinmeden refactor yapamazsın. Lint bunları sürekli görünür tutar.

## Neden Otomatik? Manuel Lint'in Kaçınılmaz Kaderi

Manuel lint'in üç eksiği var ve üçü de aynı kökten çıkıyor: **insan unutur**.

1. **Unutulur.** "Commit'ten önce lint çalıştır" bir *kural* değil, bir *uyarılmadır*. Uyarılan herkes ilk hafta uyar, üçüncü hafta unutur. Stresli gün, acele eden PR — kurallar tam o zaman düşer.
2. **Tutarsız çalışır.** A kişi lint'li, B kişi lint'siz commit atınca CI'da lint patlayan hep B olur ve süreç ekip içinde "Bişey'in önüne geçen engel" olarak algılanır. Oysa hata B'nin değil, sürecin.
3. **CI'da yakalanırsa geç yakalanır.** Lint'i CI'da çalıştırmak iyidir ama commit push edildikten sonra. Yanlış kod push edilmiş, CI kırmızı, birinin düzeltme PR'ı açması gerekmiş. Doğru yer commit'in *öncesi*dir.

Mantık şu: **kural insanın hafızasında durmuyorsa, makinenin workflow'una gömülür.** "Lint çalıştırmayı hatırla" görevini insanın unutmama yeteneğine değil, commit işleminin kendisine devredersin. Commit, `git commit` komutu çalıştığında otomatik olarak lint'i çalıştırır; lint geçmezse commit oluşmaz. Kimse bir şeyi hatırlamak zorunda değildir — sistem hatırlar.

Bunun AI çağında ikinci bir anlamı daha var: vibe coding. LLM'e kod yazdırdığında en sık çıkan şey %90 doğru, biçimsel olarak dağınık koddur. Bu kodu lint'li bir hook'tan geçirmeden kabul etmiyorsan, biçim ve basit hata katmanı makineye, sen de mantığa odaklanırsın. Hook, insan ve AI'dan gelen kodu aynı kapıdan geçirir — kim yazdıysa aynı standart.

## Pre-commit Hook Nedir?

Git, commit işleminin belirli aşamalarında **hook** denen script'ler çalıştırır. `.git/hooks/` altında yaşarlar. En sık kullanılanı **pre-commit**: `git commit` komutu verdiğin anda, commit nesnesi oluşmadan *önce* çalışır.

- Hook **başarılıysa** (exit 0) → commit devam eder.
- Hook **başarısızsa** (exit ≠ 0) → commit **reddedilir**, dosyalar staged kalır, sen düzeltip tekrar dener.

Yani "lint çalıştırmayı hatırlamak" sorunu şu dört satırla biter:

```bash
# .git/hooks/pre-commit  (chmod +x)
#!/bin/sh
ruff check .
if [ $? -ne 0 ]; then
  echo "Lint hataları: commit reddedildi."
  exit 1
fi
```

Ama her repo için bunu elle yazmak 2015'ten kalma bir çözüm. Bugünün standart aracı **[pre-commit](https://pre-commit.com)** (Python ile yazılmış bir hook yöneticisi). Fikri: hook'ları repo kökünde versiyonlanmış bir YAML ile tanımlamak ve tek komutla kurmak:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.12.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
```

```bash
pip install pre-commit
pre-commit install   # .git/hooks/pre-commit'i yazar — her clone'dan sonra bir kez
```

Buradan sonra her `git commit` otomatik olarak: değişen dosyaları alır, hook'ları çalıştırır, `--fix` sayesinde düzeltebildiklerini düzeltir ve **dosyayı düzeltilmiş haliyle yeniden stage eder**. Düzeltemediklerini listeler ve commit'i reddeder. Sen ya düzeltir ya `git commit --no-verify` ile (bilerek, nadiren) atlarsın.

Birkaç pratik not:

- Hook'lar yalnızca **staged** dosyalarda çalışır — yeni yazdığın ama add etmediğin dosyayı denetlemez. Bu bir kusur değil, tasarım: commit'in parçası olacak neyse o denetlenir.
- Hook'lara ayrıca büyük dosya kontrolü, gizli bilgi (secret) taraması (`detect-secrets`), notebook çıktı temizleme gibi işler eklenir — lint'ten öte bir "commit kalite kapısı"na dönüşür.
- Ekipte hook uygunsuz gelirse: repo seviyesinde hook'u zorlamak için `pre-commit install`'u CI'a bir de kontrol adımı olarak eklersin (`pre-commit run --all-files`). Hook'u atlayan PR CI'da düşer. İki katman: önleme (hook) + yedek (CI).
- Aşırıya kaçma: kural sayısı insanı `--no-verify`'e ittiği anda süreci kaybettin. Kuralları ekip gerçekten tartışmaya değer bulduğu seviyede tut.

## Özet

- Linter: kodu çalıştırmadan okuyan statik analiz. Hata adayları + tutarlılık ihlalleri.
- Neden: review zamanını gerçek mantığa ayırır, hataları commit'ten önce yakalar.
- Neden otomatik: insan hafızasına yaslanan kural, üçüncü hafta ölü kuraldır. Disiplini kişiye değil sürece devret.
- Pre-commit hook: `git commit`'in içinde çalışan kapı. Lint geçmezse commit olmaz. `pre-commit` aracı bunu bir YAML ile versiyonlanır ve ekipte tek komutla kurulur yapar.

:::info 📌 Bu blog'daki ilgili yazılar:
- **[MrRobot — 7x24 Çalışan ve Kendini Geliştiren Bir AI Agent](/blog/mrrobot-7x24-otonom-agent)** — AI destekli geliştirme akışında otomatik kalite kapılarının büyük hali.
:::