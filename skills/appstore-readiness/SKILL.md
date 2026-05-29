---
name: appstore-readiness
description: >
  Preparación para App Store y Play Store. Screenshots, metadata, review guidelines.
  Trigger: Al preparar la app para publicación en tiendas.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "App Store submission"
    - "Play Store submission"
    - "Store optimization"
---

# App Store Readiness

## Apple App Store

### Requisitos
- [ ] Apple Developer Account ($99/año)
- [ ] Provisioning Profile (Distribution)
- [ ] App Icon 1024×1024 (sin transparencia ni bordes)
- [ ] Screenshots: iPhone 6.7", 6.5", 5.5" — iPad Pro 12.9"
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] App Review Information (login de prueba)

### Metadata
```
App Name: Quest - Crecimiento Espiritual
Subtitle: Crece en fe, juntos
Category: Lifestyle (Primary) / Education (Secondary)
Keywords: biblia, oración, comunidad, cristiano, devocional, racha, reto
```

### Review Guidelines (Common Rejections)
1. **4.2 Minimum Functionality** — No puede ser "solo un wrapper web"
2. **5.1.1 Data Collection** — Declarar todos los datos recolectados
3. **3.1.1 In-App Purchase** — Donaciones deben usar IAP (no Stripe directo)
4. **2.1 App Completeness** — No placeholder content

---

## Google Play Store

### Requisitos
- [ ] Google Developer Account ($25 único)
- [ ] Keystore firmado (release)
- [ ] App Icon 512×512
- [ ] Feature Graphic 1024×500
- [ ] Screenshots: Teléfono + Tablet (7")
- [ ] Privacy Policy URL

### Metadata
```
Title: Quest - Crecimiento Espiritual
Short Description: Crece en fe con retos, rachas y comunidad.
Full Description: (max 4000 chars)
Category: Lifestyle
Content Rating: Everyone
```

---

## ASO (App Store Optimization)

| Factor | Recomendación |
|--------|--------------|
| Nombre | Incluir keyword principal |
| Screenshots | Mostrar features clave con texto overlay |
| Reviews | Prompt in-app después de logro (badge, racha 7) |
| Updates | Mínimo 1 update/mes |
| Ratings | Solicitar rating en momentos positivos |
