---
title: Dev Containers ile Tekrarlanabilir Geliştirme Ortamı Nasıl Kurulur?
description: VS Code ve Dev Containers kullanarak her makinede aynı çalışan, izole ve paylaşılabilir bir geliştirme ortamı oluşturun.
slug: development-containers
authors: [metin]
tags: [devtools, containers]
---

# Dev Containers ile Tekrarlanabilir Geliştirme Ortamı Nasıl Kurulur?

"Bende çalışıyor" problemi yazılım geliştirmenin en klasik sorunlarından biri. Dev Containers bu sorunu ortadan kaldırır: geliştirme ortamının kendisi de kod gibi versiyon kontrolüne girer ve her makinede birebir aynı şekilde ayağa kalkar.

<!-- truncate -->

## Dev Container Nedir?

Dev Container, geliştirme ortamını bir Docker container'ı içinde tanımlayan bir standarttır. Projenin kaynak kodunda `.devcontainer/` klasörü altında bir `devcontainer.json` dosyası bulunur. VS Code veya GitHub Codespaces bu dosyayı okuyarak container'ı otomatik olarak oluşturur ve geliştirme oturumunu doğrudan bu container'ın içinde açar.

Sonuç: Python versiyonu, uzantılar, environment variable'lar, port yönlendirmeleri — hepsi kod olarak tanımlı, hepsi takım genelinde aynı.

---

## Neden Dev Container Kullanmalısınız?

| Sorun | Dev Container Çözümü |
| ----- | -------------------- |
| "Bende çalışıyor ama CI'da çalışmıyor" | Container her yerde aynı |
| Yeni geliştirici onboarding'i saatler alıyor | `git clone` + container aç = hazır |
| Farklı projeler çakışan Python/Node versiyonları kullanıyor | Her proje izole container'da |
| "Hangi uzantıyı kurman gerekiyor?" sorusu | Uzantılar `devcontainer.json`'da tanımlı |

---

## Kurulum

### Gereksinimler

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) veya Docker Engine (Linux)
- [VS Code](https://code.visualstudio.com/)
- VS Code **Dev Containers** uzantısı (`ms-vscode-remote.remote-containers`)

---

## Temel Kullanım

### `.devcontainer/devcontainer.json` Oluşturun

Projenizin kök dizinine `.devcontainer/devcontainer.json` ekleyin:

```json
{
  "name": "Python Data Project",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.black-formatter",
        "ms-toolsai.jupyter",
        "innoverio.vscode-dbt-power-user"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "editor.formatOnSave": true
      }
    }
  },
  "forwardPorts": [8888, 8080],
  "postCreateCommand": "pip install -r requirements.txt",
  "remoteEnv": {
    "SNOWFLAKE_ACCOUNT": "${localEnv:SNOWFLAKE_ACCOUNT}",
    "SNOWFLAKE_USER": "${localEnv:SNOWFLAKE_USER}"
  }
}
```

### Container'ı Açın

1. VS Code'da projeyi açın
2. Sol alt köşedeki `><` ikonuna tıklayın → **Reopen in Container**
3. VS Code container'ı build eder ve içinde açar

İlk açılış biraz sürebilir çünkü Docker image'ı indirilir. Sonraki açılışlar cache'den gelir ve çok hızlıdır.

---

## Daha Gelişmiş Kullanım: Dockerfile ile

Özel kurulum gerektiren projeler için Docker image yerine kendi `Dockerfile`'ınızı kullanabilirsiniz:

```
.devcontainer/
├── devcontainer.json
└── Dockerfile
```

```dockerfile
# .devcontainer/Dockerfile
FROM mcr.microsoft.com/devcontainers/python:3.11

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt
```

```json
{
  "name": "Custom Python Project",
  "build": {
    "dockerfile": "Dockerfile"
  },
  "customizations": {
    "vscode": {
      "extensions": ["ms-python.python"]
    }
  }
}
```

---

## Docker Compose ile Çoklu Servis

dbt + ClickHouse gibi birden fazla servise ihtiyaç duyulan projelerde `docker-compose.yml` ile entegrasyon kurabilirsiniz:

```yaml
# .devcontainer/docker-compose.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports:
      - "8123:8123"
      - "9000:9000"
```

```json
{
  "name": "dbt + ClickHouse",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "innoverio.vscode-dbt-power-user"
      ]
    }
  }
}
```

VS Code `app` servisinin içinde açılır, ClickHouse ise `localhost:8123`'ten erişilebilir olur.

---

## Environment Variable'ları Güvenli Yönetmek

Hassas bilgileri (API key, şifre) `devcontainer.json`'a yazmayın. Bunun yerine host makinedeki environment variable'lardan okuyun:

```json
"remoteEnv": {
  "SNOWFLAKE_PASSWORD": "${localEnv:SNOWFLAKE_PASSWORD}",
  "DBT_PROFILES_DIR": "/workspace"
}
```

Host makinede `.bashrc` veya `.zshrc`'ye export edin:

```bash
export SNOWFLAKE_PASSWORD="your_password_here"
```

---

## GitHub Codespaces ile Kullanım

Aynı `devcontainer.json` dosyası GitHub Codespaces'te de çalışır. Repo'yu GitHub'da açın → **Code** → **Codespaces** → **Create codespace**. Sıfırdan tarayıcıda tam geliştirme ortamı, herhangi bir kurulum olmadan.

---

## Özet

Dev Containers ile:

- Geliştirme ortamı kod gibi versiyonlanır
- Yeni takım üyesi dakikalar içinde çalışmaya başlar
- "Bende çalışıyor" problemi ortadan kalkar
- CI/CD ortamıyla geliştirme ortamı aynı base image'ı paylaşabilir

Özellikle veri projeleri için — farklı Python versiyonları, ağır bağımlılıklar, yerel veritabanı servisleri — Dev Containers olmazsa olmaz bir araç haline gelmiştir.