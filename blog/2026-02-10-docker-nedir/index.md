---
title: Docker Nedir? Konteyner Teknolojisine Giriş
description: Docker'ın ne olduğunu, neden bu kadar yaygınlaştığını ve temel kavramlarını pratik örneklerle öğrenin.
slug: docker-nedir
authors: [metin]
tags: [docker, containers, devtools]
---

# Docker Nedir? Konteyner Teknolojisine Giriş

Bir uygulamayı geliştirdiniz, kendi makinenizde mükemmel çalışıyor. Sunucuya aldınız — çalışmıyor. Python versiyonu farklı, bir kütüphane eksik, işletim sistemi farklı davranıyor. Docker tam olarak bu problemi çözmek için var.

<!-- truncate -->

## Temel Sorun: "Bende Çalışıyor"

Geleneksel yazılım dağıtımında uygulama ve çalışma ortamı birbirinden ayrıdır:

```
Geliştirici makinesi:  Python 3.11, pandas 2.0, libpq-dev kurulu
Üretim sunucusu:       Python 3.9,  pandas 1.5, libpq-dev yok
```

Sonuç: Uygulama geliştirici makinesinde çalışır, sunucuda çalışmaz.

Docker bu sorunu şu şekilde çözer: **uygulamayı ve çalışması için gereken her şeyi birlikte paketler**.

---

## Docker Nedir?

Docker, uygulamaları **container** adı verilen izole paketler içinde çalıştırmaya yarayan bir platformdur.

Container; uygulamanın kaynak kodunu, bağımlılıklarını, sistem kütüphanelerini ve çalışma zamanını tek bir birim olarak içerir. Bu container her makinede — geliştirici laptopunda, CI sunucusunda, bulut ortamında — birebir aynı şekilde çalışır.

---

## Container vs Sanal Makine (VM)

Container'lar sık sık sanal makinelerle karıştırılır. İkisi de izolasyon sağlar ama çok farklı şekillerde:

| | Sanal Makine (VM) | Container |
|-|-------------------|-----------|
| **İzolasyon** | Tam işletim sistemi | Süreç seviyesi |
| **Boyut** | Gigabyte'lar | Megabyte'lar |
| **Başlama süresi** | Dakikalar | Saniyeler (hatta milisaniyeler) |
| **Kaynak kullanımı** | Yüksek | Düşük |
| **Taşınabilirlik** | Zor | Kolay |

VM, gerçek bir bilgisayarın tamamını simüle eder. Container ise host işletim sisteminin çekirdeğini paylaşır ve sadece uygulamanın ihtiyaç duyduğu katmanları izole eder.

---

## Temel Kavramlar

### Image

Image, container'ın şablonudur. İçinde uygulamanın çalışması için gereken her şey bulunur: işletim sistemi katmanı, bağımlılıklar, uygulama kodu, başlatma komutu.

Image'lar `Dockerfile` ile tanımlanır ve değişmezdir (immutable).

```dockerfile
# Bu bir Dockerfile — image'ın tarifi
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
```

---

### Container

Container, çalışan bir image örneğidir. Aynı image'dan istediğiniz kadar container başlatabilirsiniz.

Image → Container ilişkisi, sınıf → nesne (class → instance) ilişkisine benzer.

---

### Registry

Image'ların depolandığı ve paylaşıldığı yer. En yaygın registry [Docker Hub](https://hub.docker.com/)'dır. Binlerce hazır image barındırır: `python`, `postgres`, `nginx`, `clickhouse` gibi.

```bash
# Docker Hub'dan resmi Python image'ını indir
docker pull python:3.11-slim
```

---

## İlk Docker Komutları

### Image Build Etmek

```bash
# Bulunduğunuz dizindeki Dockerfile'dan image oluştur
docker build -t benim-uygulama:1.0 .
```

### Container Başlatmak

```bash
# Image'dan container başlat
docker run benim-uygulama:1.0

# Arka planda (detached) başlat
docker run -d benim-uygulama:1.0

# Port yönlendirme ile başlat
# Host'un 8080 portu → Container'ın 80 portuna
docker run -d -p 8080:80 nginx
```

### Çalışan Container'ları Görmek

```bash
docker ps
```

### Container'a Bağlanmak

```bash
docker exec -it <container_id> bash
```

### Container'ı Durdurmak ve Silmek

```bash
docker stop <container_id>
docker rm <container_id>
```

---

## Dockerfile Yazımı

Katmanlı yapı Docker'ın en önemli özelliklerinden biridir. Her `RUN`, `COPY`, `ADD` komutu yeni bir katman oluşturur. Docker bu katmanları cache'ler — değişmeyen katmanlar her build'de yeniden oluşturulmaz.

```dockerfile
FROM python:3.11-slim

# Sistem bağımlılıkları — nadiren değişir, önce koy
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# requirements.txt — uygulama kodundan önce kopyala
# Böylece sadece bağımlılıklar değiştiğinde pip install çalışır
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodu — en sık değişen katman, en sona koy
COPY . .

CMD ["python", "main.py"]
```

**Kötü örnek** — her build'de tüm pip install yeniden çalışır:

```dockerfile
# KÖTÜ: Her şeyi kopyala, sonra install et
COPY . .
RUN pip install -r requirements.txt
```

---

## Docker Compose: Çoklu Servis

Gerçek projeler genellikle birden fazla servise ihtiyaç duyar: uygulama + veritabanı + cache gibi. `docker-compose.yml` bu servisleri birlikte tanımlar ve yönetir.

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Tüm stack'i başlatmak için:

```bash
docker compose up -d
```

Durdurmak için:

```bash
docker compose down
```

---

## Volume: Veriyi Kalıcı Hale Getirmek

Container'lar stateless'tır — container silindiğinde içindeki veri de gider. Veriyi kalıcı tutmak için **volume** kullanılır.

```bash
# Host dizinini container'a bağla
docker run -v /host/data:/container/data postgres:15

# Docker tarafından yönetilen named volume
docker run -v postgres_data:/var/lib/postgresql/data postgres:15
```

---

## Veri Mühendisliğinde Docker

Veri projelerinde Docker özellikle şu durumlarda kritik hale gelir:

- **Yerel ClickHouse / PostgreSQL**: Gerçek veritabanını local olarak dakikalar içinde ayağa kaldırın
- **dbt geliştirme**: Tüm dbt bağımlılıklarını izole tutun
- **Airflow**: Docker Compose ile tam Airflow stack'i local'de çalıştırın
- **Spark**: PySpark ortamını versiyonlayın, Java/Scala çakışmalarından kaçının

```bash
# ClickHouse'u local'de başlat
docker run -d \
  --name clickhouse-local \
  -p 8123:8123 \
  -p 9000:9000 \
  clickhouse/clickhouse-server:latest
```

---

## Özet

| Kavram | Açıklama |
|--------|----------|
| **Image** | Uygulamanın çalışma ortamını tanımlayan şablon |
| **Container** | Çalışan image örneği |
| **Dockerfile** | Image'ı oluşturan tarif dosyası |
| **Registry** | Image'ların depolandığı merkez (Docker Hub) |
| **Volume** | Container dışında tutulan kalıcı veri |
| **Docker Compose** | Çoklu container'ı birlikte yöneten araç |

Docker öğrenmek, modern yazılım geliştirmede artık temel bir beceri haline geldi. Geliştirme ortamı kurulumundan CI/CD pipeline'larına, yerel testlerden üretim dağıtımına kadar her aşamada karşınıza çıkacak.

Bir sonraki adım: [Dev Containers ile geliştirme ortamınızı Docker üzerine kurun](/blog/development-containers).
