---
name: monetization-strategy
description: >
  Estrategia de monetización para Quest. Donaciones, premium, ads.
  Trigger: Al implementar pagos, suscripciones, ads, o modelos de monetización.
license: MIT
metadata:
  author: quest
  version: "1.0"
  scope: [root]
  auto_invoke:
    - "Implementing payments"
    - "Monetization features"
    - "Premium tiers"
---

# Monetización — Quest

## Modelo Freemium

### Free (Base)
- ✅ Lectura diaria + oración
- ✅ Rachas básicas
- ✅ Feed de comunidad
- ✅ 1 reto personal activo
- ✅ Badges básicos

### Premium ($0.99/mes)
- ✅ Todo lo Free +
- ✅ Retos ilimitados
- ✅ Estadísticas avanzadas
- ✅ Temas personalizados
- ✅ Sin anuncios
- ✅ Badges exclusivos
- ✅ Recuperación de racha gratis (1/mes)
- ✅ Exportar historial

---

## Canales de Ingreso

| Canal | Implementación | Platform Fee |
|-------|---------------|-------------|
| Suscripción Premium | RevenueCat (iOS IAP + Google IAP) | 15-30% |
| Donaciones | RevenueCat Tip Jar | 15-30% |
| Ads (Free tier) | AdMob (banner + interstitial) | — |

> [!WARNING]
> **Apple NO permite Stripe para pagos in-app.** Debe usar IAP.
> Stripe solo para web (fuera de la app nativa).

---

## RevenueCat Setup

```typescript
import Purchases from 'react-native-purchases';

// Inicializar
Purchases.configure({
  apiKey: Platform.OS === 'ios' 
    ? REVENUECAT_IOS_KEY 
    : REVENUECAT_ANDROID_KEY,
  appUserID: supabaseUserId,
});

// Verificar suscripción
const { customerInfo } = await Purchases.getCustomerInfo();
const isPremium = customerInfo.entitlements.active['premium'];
```

---

## AdMob

| Tipo | Ubicación | Frecuencia |
|------|----------|-----------|
| Banner | Bottom de Feed | Siempre visible (Free) |
| Interstitial | Entre secciones | Max 1 cada 5 min |
| Rewarded | "Ver video → +50 XP" | Voluntario, ilimitado |

---

## Donaciones (Web — Stripe)

- Solo en la versión web (PWA)
- Botón "Apoyar Quest" en Perfil
- Montos sugeridos: $5, $10, $25
- Stripe Checkout (USD)
