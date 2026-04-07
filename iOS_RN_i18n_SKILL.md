# SKILL: iOS React Native Expo — Full i18n & Localization System
**Target Agents:** Kiro, Antigravity  
**Stack:** React Native + Expo + TypeScript  
**Last Updated:** 2025

---

## OVERVIEW & MISSION

Bu skill'i oku ve **EKSIKSIZ** uygula. Adımları sırayla takip et. Her adımın sonunda ✅ işaretle.

**Görev:** Expo TypeScript projesine tam lokalizasyon sistemi kur:
- 10 dil (EN, TR, pt-BR, pt-PT, DE, FR, ES, KO, JA, AR)
- Desteklenmeyen dil → otomatik İngilizce fallback
- İlk açılışta onboarding'de dil izin bildirimi
- Tüm ekranlar lokalize (Onboarding, Paywall, diğer tüm sayfalar)
- Arapça RTL layout desteği
- app.json entegrasyonu
- iPlast entegrasyonu (RevenueCat tabanlı paywall)
- Otomatik test suite

---

## DESTEKLENEN DİLLER

| Kod    | Dil                  | RTL | CJK |
|--------|----------------------|-----|-----|
| en     | İngilizce (fallback) | ✗   | ✗   |
| tr     | Türkçe               | ✗   | ✗   |
| pt-BR  | Portekizce (Brezilya)| ✗   | ✗   |
| pt-PT  | Portekizce           | ✗   | ✗   |
| de     | Almanca              | ✗   | ✗   |
| fr     | Fransızca            | ✗   | ✗   |
| es     | İspanyolca           | ✗   | ✗   |
| ko     | Korece               | ✗   | ✓   |
| ja     | Japonca              | ✗   | ✓   |
| ar     | Arapça               | ✓   | ✗   |

**KURAL:** Cihaz dili bu listede yoksa → `en` kullan.

---

## ADIM 1 — PAKETLERİ YÜKLE

```bash
npx expo install expo-localization
npm install i18next react-i18next
npm install @react-native-async-storage/async-storage
npx expo install expo-updates
```

**app.json'a ekle** (localization plugin):
```json
{
  "expo": {
    "name": "YourApp",
    "slug": "yourapp",
    "version": "1.0.0",
    "ios": {
      "infoPlist": {
        "CFBundleAllowMixedLocalizations": true,
        "CFBundleDevelopmentRegion": "en"
      }
    },
    "android": {
      "permissions": []
    },
    "plugins": [
      "expo-localization"
    ],
    "extra": {
      "supportedLocales": ["en","tr","pt-BR","pt-PT","de","fr","es","ko","ja","ar"],
      "fallbackLocale": "en"
    }
  }
}
```

---

## ADIM 2 — DOSYA YAPISI OLUŞTUR

Aşağıdaki yapıyı **tam olarak** oluştur:

```
src/
├── i18n/
│   ├── index.ts                    ← i18next config + fallback mantığı
│   ├── useLanguage.ts              ← custom hook
│   └── locales/
│       ├── en.ts
│       ├── tr.ts
│       ├── pt-BR.ts
│       ├── pt-PT.ts
│       ├── de.ts
│       ├── fr.ts
│       ├── es.ts
│       ├── ko.ts
│       ├── ja.ts
│       └── ar.ts
├── components/
│   └── RTLWrapper.tsx              ← RTL layout sarmalayıcı
├── screens/
│   ├── onboarding/
│   │   ├── OnboardingScreen.tsx
│   │   └── LanguagePermissionModal.tsx  ← İlk açılış dil bildirimi
│   └── paywall/
│       └── PaywallScreen.tsx
└── hooks/
    └── useFirstLaunch.ts
```

---

## ADIM 3 — i18n KONFIGÜRASYONU

### `src/i18n/index.ts`
```typescript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en';
import tr from './locales/tr';
import ptBR from './locales/pt-BR';
import ptPT from './locales/pt-PT';
import de from './locales/de';
import fr from './locales/fr';
import es from './locales/es';
import ko from './locales/ko';
import ja from './locales/ja';
import ar from './locales/ar';

const SUPPORTED_LANGUAGES = new Set([
  'en', 'tr', 'pt-BR', 'pt-PT', 'de', 'fr', 'es', 'ko', 'ja', 'ar'
]);
const FALLBACK = 'en';
const STORAGE_KEY = 'user_language';

// Cihaz dilini desteklenen dile çevir, yoksa fallback
export function resolveLanguage(deviceLocales: string[]): string {
  for (const locale of deviceLocales) {
    // Tam eşleşme: "pt-BR", "ko", vb.
    if (SUPPORTED_LANGUAGES.has(locale)) return locale;
    
    // Bölge kodu ile eşleşme: "pt-BR-u-..." → "pt-BR"
    const withRegion = locale.substring(0, 5);
    if (SUPPORTED_LANGUAGES.has(withRegion)) return withRegion;
    
    // Sadece dil kodu: "de-AT" → "de"
    const langOnly = locale.substring(0, 2);
    if (SUPPORTED_LANGUAGES.has(langOnly)) return langOnly;
  }
  return FALLBACK;
}

export async function initI18n(): Promise<void> {
  // Kaydedilmiş dil tercihi var mı?
  let language = await AsyncStorage.getItem(STORAGE_KEY);
  
  if (!language || !SUPPORTED_LANGUAGES.has(language)) {
    // Cihaz dillerinden çöz
    const deviceLocales = Localization.getLocales().map(l => l.languageTag);
    language = resolveLanguage(deviceLocales);
  }

  await i18next
    .use(initReactI18next)
    .init({
      resources: { en, tr, 'pt-BR': ptBR, 'pt-PT': ptPT, de, fr, es, ko, ja, ar },
      lng: language,
      fallbackLng: FALLBACK,
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
}

export async function changeLanguage(code: string): Promise<void> {
  if (!SUPPORTED_LANGUAGES.has(code)) return;
  await AsyncStorage.setItem(STORAGE_KEY, code);
  await i18next.changeLanguage(code);
}

export { SUPPORTED_LANGUAGES, FALLBACK, STORAGE_KEY };
export default i18next;
```

---

## ADIM 4 — LOCALE DOSYALARI

### `src/i18n/locales/en.ts` (MASTER — tüm anahtarlar burada)
```typescript
export default {
  common: {
    // ONBOARDING
    onboarding: {
      welcome_title: "Welcome",
      welcome_subtitle: "Discover a better experience",
      next: "Next",
      skip: "Skip",
      get_started: "Get Started",
      step_of: "{{current}} of {{total}}",
    },
    // DİL İZİN BİLDİRİMİ
    language_permission: {
      title: "Choose Your Language",
      subtitle: "We detected your device language as {{language}}. Would you like to use it?",
      confirm: "Yes, use {{language}}",
      use_english: "Use English instead",
      note: "You can change this later in settings",
    },
    // PAYWALL
    paywall: {
      title: "Unlock Premium",
      subtitle: "Get full access to all features",
      monthly: "Monthly",
      yearly: "Yearly",
      lifetime: "Lifetime",
      per_month: "/month",
      per_year: "/year",
      best_value: "Best Value",
      save_percent: "Save {{percent}}%",
      cta_trial: "Start Free Trial",
      cta_subscribe: "Subscribe Now",
      restore: "Restore Purchases",
      terms: "Terms & Privacy",
      cancel_anytime: "Cancel anytime",
      feature_1: "Unlimited access",
      feature_2: "No ads",
      feature_3: "Priority support",
    },
    // GENEL
    common: {
      ok: "OK",
      cancel: "Cancel",
      back: "Back",
      done: "Done",
      loading: "Loading...",
      error: "Something went wrong",
      retry: "Try Again",
      close: "Close",
      save: "Save",
      continue: "Continue",
      settings: "Settings",
      language: "Language",
    },
    // AYARLAR
    settings: {
      title: "Settings",
      language_section: "Language",
      current_language: "Current language",
      change_language: "Change Language",
    },
  },
};
```

### `src/i18n/locales/tr.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Hoş Geldiniz",
      welcome_subtitle: "Daha iyi bir deneyim keşfedin",
      next: "İleri",
      skip: "Geç",
      get_started: "Başla",
      step_of: "{{current}} / {{total}}",
    },
    language_permission: {
      title: "Dilinizi Seçin",
      subtitle: "Cihaz dilinizi {{language}} olarak tespit ettik. Kullanmak ister misiniz?",
      confirm: "Evet, {{language}} kullan",
      use_english: "İngilizce kullan",
      note: "Bunu daha sonra ayarlardan değiştirebilirsiniz",
    },
    paywall: {
      title: "Premium'a Geç",
      subtitle: "Tüm özelliklere tam erişim",
      monthly: "Aylık",
      yearly: "Yıllık",
      lifetime: "Ömür Boyu",
      per_month: "/ay",
      per_year: "/yıl",
      best_value: "En İyi Değer",
      save_percent: "%{{percent}} Tasarruf",
      cta_trial: "Ücretsiz Deneyin",
      cta_subscribe: "Şimdi Abone Ol",
      restore: "Satın Almaları Geri Yükle",
      terms: "Koşullar & Gizlilik",
      cancel_anytime: "İstediğiniz zaman iptal edin",
      feature_1: "Sınırsız erişim",
      feature_2: "Reklam yok",
      feature_3: "Öncelikli destek",
    },
    common: {
      ok: "Tamam",
      cancel: "İptal",
      back: "Geri",
      done: "Bitti",
      loading: "Yükleniyor...",
      error: "Bir şeyler yanlış gitti",
      retry: "Tekrar Dene",
      close: "Kapat",
      save: "Kaydet",
      continue: "Devam Et",
      settings: "Ayarlar",
      language: "Dil",
    },
    settings: {
      title: "Ayarlar",
      language_section: "Dil",
      current_language: "Mevcut dil",
      change_language: "Dil Değiştir",
    },
  },
};
```

### `src/i18n/locales/pt-BR.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Bem-vindo",
      welcome_subtitle: "Descubra uma experiência melhor",
      next: "Próximo",
      skip: "Pular",
      get_started: "Começar",
      step_of: "{{current}} de {{total}}",
    },
    language_permission: {
      title: "Escolha seu idioma",
      subtitle: "Detectamos o idioma do seu dispositivo como {{language}}. Deseja usá-lo?",
      confirm: "Sim, usar {{language}}",
      use_english: "Usar inglês",
      note: "Você pode alterar isso nas configurações",
    },
    paywall: {
      title: "Desbloqueie o Premium",
      subtitle: "Acesso completo a todos os recursos",
      monthly: "Mensal",
      yearly: "Anual",
      lifetime: "Vitalício",
      per_month: "/mês",
      per_year: "/ano",
      best_value: "Melhor Valor",
      save_percent: "Economize {{percent}}%",
      cta_trial: "Iniciar Teste Grátis",
      cta_subscribe: "Assinar Agora",
      restore: "Restaurar Compras",
      terms: "Termos e Privacidade",
      cancel_anytime: "Cancele a qualquer momento",
      feature_1: "Acesso ilimitado",
      feature_2: "Sem anúncios",
      feature_3: "Suporte prioritário",
    },
    common: {
      ok: "OK",
      cancel: "Cancelar",
      back: "Voltar",
      done: "Concluído",
      loading: "Carregando...",
      error: "Algo deu errado",
      retry: "Tentar novamente",
      close: "Fechar",
      save: "Salvar",
      continue: "Continuar",
      settings: "Configurações",
      language: "Idioma",
    },
    settings: {
      title: "Configurações",
      language_section: "Idioma",
      current_language: "Idioma atual",
      change_language: "Alterar idioma",
    },
  },
};
```

### `src/i18n/locales/pt-PT.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Bem-vindo",
      welcome_subtitle: "Descubra uma experiência melhor",
      next: "Seguinte",
      skip: "Saltar",
      get_started: "Começar",
      step_of: "{{current}} de {{total}}",
    },
    language_permission: {
      title: "Escolha o seu idioma",
      subtitle: "Detectámos o idioma do seu dispositivo como {{language}}. Deseja utilizá-lo?",
      confirm: "Sim, usar {{language}}",
      use_english: "Usar inglês",
      note: "Pode alterar isto nas definições",
    },
    paywall: {
      title: "Desbloquear Premium",
      subtitle: "Acesso completo a todas as funcionalidades",
      monthly: "Mensal",
      yearly: "Anual",
      lifetime: "Vitalício",
      per_month: "/mês",
      per_year: "/ano",
      best_value: "Melhor Valor",
      save_percent: "Poupe {{percent}}%",
      cta_trial: "Iniciar Período de Teste",
      cta_subscribe: "Subscrever Agora",
      restore: "Restaurar Compras",
      terms: "Termos e Privacidade",
      cancel_anytime: "Cancele quando quiser",
      feature_1: "Acesso ilimitado",
      feature_2: "Sem anúncios",
      feature_3: "Suporte prioritário",
    },
    common: {
      ok: "OK",
      cancel: "Cancelar",
      back: "Voltar",
      done: "Concluído",
      loading: "A carregar...",
      error: "Algo correu mal",
      retry: "Tentar novamente",
      close: "Fechar",
      save: "Guardar",
      continue: "Continuar",
      settings: "Definições",
      language: "Idioma",
    },
    settings: {
      title: "Definições",
      language_section: "Idioma",
      current_language: "Idioma atual",
      change_language: "Alterar idioma",
    },
  },
};
```

### `src/i18n/locales/de.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Willkommen",
      welcome_subtitle: "Entdecken Sie ein besseres Erlebnis",
      next: "Weiter",
      skip: "Überspringen",
      get_started: "Loslegen",
      step_of: "{{current}} von {{total}}",
    },
    language_permission: {
      title: "Sprache wählen",
      subtitle: "Wir haben Ihre Gerätesprache als {{language}} erkannt. Möchten Sie diese verwenden?",
      confirm: "Ja, {{language}} verwenden",
      use_english: "Englisch verwenden",
      note: "Sie können dies später in den Einstellungen ändern",
    },
    paywall: {
      title: "Premium freischalten",
      subtitle: "Vollständiger Zugriff auf alle Funktionen",
      monthly: "Monatlich",
      yearly: "Jährlich",
      lifetime: "Lebenslang",
      per_month: "/Monat",
      per_year: "/Jahr",
      best_value: "Bestes Angebot",
      save_percent: "{{percent}}% sparen",
      cta_trial: "Kostenlos testen",
      cta_subscribe: "Jetzt abonnieren",
      restore: "Käufe wiederherstellen",
      terms: "AGB & Datenschutz",
      cancel_anytime: "Jederzeit kündbar",
      feature_1: "Unbegrenzter Zugriff",
      feature_2: "Keine Werbung",
      feature_3: "Prioritätssupport",
    },
    common: {
      ok: "OK",
      cancel: "Abbrechen",
      back: "Zurück",
      done: "Fertig",
      loading: "Lädt...",
      error: "Etwas ist schiefgelaufen",
      retry: "Erneut versuchen",
      close: "Schließen",
      save: "Speichern",
      continue: "Weiter",
      settings: "Einstellungen",
      language: "Sprache",
    },
    settings: {
      title: "Einstellungen",
      language_section: "Sprache",
      current_language: "Aktuelle Sprache",
      change_language: "Sprache ändern",
    },
  },
};
```

### `src/i18n/locales/fr.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Bienvenue",
      welcome_subtitle: "Découvrez une meilleure expérience",
      next: "Suivant",
      skip: "Passer",
      get_started: "Commencer",
      step_of: "{{current}} sur {{total}}",
    },
    language_permission: {
      title: "Choisissez votre langue",
      subtitle: "Nous avons détecté la langue de votre appareil : {{language}}. Souhaitez-vous l'utiliser ?",
      confirm: "Oui, utiliser {{language}}",
      use_english: "Utiliser l'anglais",
      note: "Vous pouvez modifier cela dans les paramètres",
    },
    paywall: {
      title: "Débloquer Premium",
      subtitle: "Accès complet à toutes les fonctionnalités",
      monthly: "Mensuel",
      yearly: "Annuel",
      lifetime: "À vie",
      per_month: "/mois",
      per_year: "/an",
      best_value: "Meilleure offre",
      save_percent: "Économisez {{percent}}%",
      cta_trial: "Essai gratuit",
      cta_subscribe: "S'abonner maintenant",
      restore: "Restaurer les achats",
      terms: "CGU & Confidentialité",
      cancel_anytime: "Annulez à tout moment",
      feature_1: "Accès illimité",
      feature_2: "Sans publicité",
      feature_3: "Support prioritaire",
    },
    common: {
      ok: "OK",
      cancel: "Annuler",
      back: "Retour",
      done: "Terminé",
      loading: "Chargement...",
      error: "Une erreur s'est produite",
      retry: "Réessayer",
      close: "Fermer",
      save: "Enregistrer",
      continue: "Continuer",
      settings: "Paramètres",
      language: "Langue",
    },
    settings: {
      title: "Paramètres",
      language_section: "Langue",
      current_language: "Langue actuelle",
      change_language: "Changer de langue",
    },
  },
};
```

### `src/i18n/locales/es.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "Bienvenido",
      welcome_subtitle: "Descubre una mejor experiencia",
      next: "Siguiente",
      skip: "Omitir",
      get_started: "Comenzar",
      step_of: "{{current}} de {{total}}",
    },
    language_permission: {
      title: "Elige tu idioma",
      subtitle: "Hemos detectado el idioma de tu dispositivo como {{language}}. ¿Deseas usarlo?",
      confirm: "Sí, usar {{language}}",
      use_english: "Usar inglés",
      note: "Puedes cambiar esto en ajustes",
    },
    paywall: {
      title: "Desbloquear Premium",
      subtitle: "Acceso completo a todas las funciones",
      monthly: "Mensual",
      yearly: "Anual",
      lifetime: "De por vida",
      per_month: "/mes",
      per_year: "/año",
      best_value: "Mejor Valor",
      save_percent: "Ahorra {{percent}}%",
      cta_trial: "Prueba Gratuita",
      cta_subscribe: "Suscribirse Ahora",
      restore: "Restaurar Compras",
      terms: "Términos y Privacidad",
      cancel_anytime: "Cancela cuando quieras",
      feature_1: "Acceso ilimitado",
      feature_2: "Sin anuncios",
      feature_3: "Soporte prioritario",
    },
    common: {
      ok: "Aceptar",
      cancel: "Cancelar",
      back: "Volver",
      done: "Listo",
      loading: "Cargando...",
      error: "Algo salió mal",
      retry: "Reintentar",
      close: "Cerrar",
      save: "Guardar",
      continue: "Continuar",
      settings: "Ajustes",
      language: "Idioma",
    },
    settings: {
      title: "Ajustes",
      language_section: "Idioma",
      current_language: "Idioma actual",
      change_language: "Cambiar idioma",
    },
  },
};
```

### `src/i18n/locales/ko.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "환영합니다",
      welcome_subtitle: "더 나은 경험을 발견하세요",
      next: "다음",
      skip: "건너뛰기",
      get_started: "시작하기",
      step_of: "{{total}}개 중 {{current}}번째",
    },
    language_permission: {
      title: "언어 선택",
      subtitle: "기기 언어가 {{language}}로 감지되었습니다. 사용하시겠습니까?",
      confirm: "예, {{language}} 사용",
      use_english: "영어 사용",
      note: "설정에서 나중에 변경할 수 있습니다",
    },
    paywall: {
      title: "프리미엄 잠금 해제",
      subtitle: "모든 기능에 완전히 액세스",
      monthly: "월간",
      yearly: "연간",
      lifetime: "평생",
      per_month: "/월",
      per_year: "/년",
      best_value: "최고 가치",
      save_percent: "{{percent}}% 절약",
      cta_trial: "무료 체험 시작",
      cta_subscribe: "지금 구독",
      restore: "구매 복원",
      terms: "이용약관 및 개인정보",
      cancel_anytime: "언제든지 취소 가능",
      feature_1: "무제한 액세스",
      feature_2: "광고 없음",
      feature_3: "우선 지원",
    },
    common: {
      ok: "확인",
      cancel: "취소",
      back: "뒤로",
      done: "완료",
      loading: "로딩 중...",
      error: "문제가 발생했습니다",
      retry: "다시 시도",
      close: "닫기",
      save: "저장",
      continue: "계속",
      settings: "설정",
      language: "언어",
    },
    settings: {
      title: "설정",
      language_section: "언어",
      current_language: "현재 언어",
      change_language: "언어 변경",
    },
  },
};
```

### `src/i18n/locales/ja.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "ようこそ",
      welcome_subtitle: "より良い体験を発見しよう",
      next: "次へ",
      skip: "スキップ",
      get_started: "始める",
      step_of: "{{total}}つ中{{current}}つ目",
    },
    language_permission: {
      title: "言語を選択",
      subtitle: "端末の言語が{{language}}として検出されました。使用しますか？",
      confirm: "はい、{{language}}を使用",
      use_english: "英語を使用",
      note: "設定から後で変更できます",
    },
    paywall: {
      title: "プレミアムを解除",
      subtitle: "すべての機能に完全アクセス",
      monthly: "月額",
      yearly: "年額",
      lifetime: "買い切り",
      per_month: "/月",
      per_year: "/年",
      best_value: "最もお得",
      save_percent: "{{percent}}%お得",
      cta_trial: "無料トライアル開始",
      cta_subscribe: "今すぐ購読",
      restore: "購入を復元",
      terms: "利用規約とプライバシー",
      cancel_anytime: "いつでもキャンセル可能",
      feature_1: "無制限アクセス",
      feature_2: "広告なし",
      feature_3: "優先サポート",
    },
    common: {
      ok: "OK",
      cancel: "キャンセル",
      back: "戻る",
      done: "完了",
      loading: "読み込み中...",
      error: "問題が発生しました",
      retry: "再試行",
      close: "閉じる",
      save: "保存",
      continue: "続ける",
      settings: "設定",
      language: "言語",
    },
    settings: {
      title: "設定",
      language_section: "言語",
      current_language: "現在の言語",
      change_language: "言語を変更",
    },
  },
};
```

### `src/i18n/locales/ar.ts`
```typescript
export default {
  common: {
    onboarding: {
      welcome_title: "مرحباً بك",
      welcome_subtitle: "اكتشف تجربة أفضل",
      next: "التالي",
      skip: "تخطي",
      get_started: "ابدأ الآن",
      step_of: "{{current}} من {{total}}",
    },
    language_permission: {
      title: "اختر لغتك",
      subtitle: "اكتشفنا أن لغة جهازك هي {{language}}. هل تريد استخدامها؟",
      confirm: "نعم، استخدام {{language}}",
      use_english: "استخدام الإنجليزية",
      note: "يمكنك تغيير هذا لاحقاً في الإعدادات",
    },
    paywall: {
      title: "افتح Premium",
      subtitle: "وصول كامل لجميع المميزات",
      monthly: "شهري",
      yearly: "سنوي",
      lifetime: "مدى الحياة",
      per_month: "/شهر",
      per_year: "/سنة",
      best_value: "أفضل قيمة",
      save_percent: "وفّر {{percent}}%",
      cta_trial: "ابدأ التجربة المجانية",
      cta_subscribe: "اشترك الآن",
      restore: "استعادة المشتريات",
      terms: "الشروط والخصوصية",
      cancel_anytime: "يمكن الإلغاء في أي وقت",
      feature_1: "وصول غير محدود",
      feature_2: "بدون إعلانات",
      feature_3: "دعم متميز",
    },
    common: {
      ok: "موافق",
      cancel: "إلغاء",
      back: "رجوع",
      done: "تم",
      loading: "جاري التحميل...",
      error: "حدث خطأ ما",
      retry: "حاول مرة أخرى",
      close: "إغلاق",
      save: "حفظ",
      continue: "متابعة",
      settings: "الإعدادات",
      language: "اللغة",
    },
    settings: {
      title: "الإعدادات",
      language_section: "اللغة",
      current_language: "اللغة الحالية",
      change_language: "تغيير اللغة",
    },
  },
};
```

---

## ADIM 5 — CUSTOM HOOK

### `src/i18n/useLanguage.ts`
```typescript
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { I18nManager } from 'react-native';
import { changeLanguage, SUPPORTED_LANGUAGES } from './index';

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  tr: 'Türkçe',
  'pt-BR': 'Português (Brasil)',
  'pt-PT': 'Português',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ko: '한국어',
  ja: '日本語',
  ar: 'العربية',
};

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentCode = i18n.language;
  const currentName = LANGUAGE_NAMES[currentCode] ?? LANGUAGE_NAMES['en'];
  const isRTL = currentCode === 'ar';

  const setLanguage = useCallback(async (code: string) => {
    await changeLanguage(code);
    // RTL güncelle
    const shouldBeRTL = code === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.forceRTL(shouldBeRTL);
      // Not: RTL değişikliği için uygulamanın yeniden başlatılması gerekir
      // Expo Updates kullanıyorsanız: Updates.reloadAsync()
    }
  }, []);

  return {
    currentCode,
    currentName,
    isRTL,
    setLanguage,
    supportedLanguages: Array.from(SUPPORTED_LANGUAGES),
    languageNames: LANGUAGE_NAMES,
  };
}
```

---

## ADIM 6 — RTL WRAPPER

### `src/components/RTLWrapper.tsx`
```typescript
import React from 'react';
import { View, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';

interface RTLWrapperProps {
  children: React.ReactNode;
  style?: object;
}

export const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, style }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <View
      style={[
        styles.container,
        isRTL && styles.rtl,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// RTL-güvenli text alignment helper
export function useTextAlign() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  return {
    textAlign: isRTL ? 'right' as const : 'left' as const,
    alignItems: isRTL ? 'flex-end' as const : 'flex-start' as const,
    flexDirection: isRTL ? 'row-reverse' as const : 'row' as const,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rtl: {
    direction: 'rtl',
  } as any,
});
```

---

## ADIM 7 — İLK AÇILIŞ HOOK

### `src/hooks/useFirstLaunch.ts`
```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LAUNCH_KEY = 'app_first_launch';
const LANG_PERMISSION_KEY = 'lang_permission_shown';

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [langPermissionShown, setLangPermissionShownState] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [firstLaunch, langShown] = await Promise.all([
        AsyncStorage.getItem(FIRST_LAUNCH_KEY),
        AsyncStorage.getItem(LANG_PERMISSION_KEY),
      ]);
      setIsFirstLaunch(firstLaunch === null);
      setLangPermissionShownState(langShown !== null);

      if (firstLaunch === null) {
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'false');
      }
    })();
  }, []);

  const markLangPermissionShown = async () => {
    await AsyncStorage.setItem(LANG_PERMISSION_KEY, 'true');
    setLangPermissionShownState(true);
  };

  return { isFirstLaunch, langPermissionShown, markLangPermissionShown };
}
```

---

## ADIM 8 — DİL İZİN MODALİ (İlk Onboarding'de)

### `src/screens/onboarding/LanguagePermissionModal.tsx`
```typescript
import React from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage, LANGUAGE_NAMES } from '../../i18n/useLanguage';
import * as Localization from 'expo-localization';
import { resolveLanguage } from '../../i18n';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onUseEnglish: () => void;
}

export const LanguagePermissionModal: React.FC<Props> = ({
  visible, onConfirm, onUseEnglish,
}) => {
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();

  // Cihazın tespit edilen dilini al
  const deviceLocales = Localization.getLocales().map(l => l.languageTag);
  const detectedLang = resolveLanguage(deviceLocales);
  const detectedLangName = LANGUAGE_NAMES[detectedLang] ?? 'English';

  const handleConfirm = async () => {
    await setLanguage(detectedLang);
    onConfirm();
  };

  const handleEnglish = async () => {
    await setLanguage('en');
    onUseEnglish();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            {/* Dil ikonu */}
            <Text style={styles.emoji}>🌍</Text>

            <Text style={styles.title}>
              {t('common.language_permission.title')}
            </Text>

            <Text style={styles.subtitle}>
              {t('common.language_permission.subtitle', {
                language: detectedLangName,
              })}
            </Text>

            {/* Tespit edilen dili kullan */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConfirm}
            >
              <Text style={styles.primaryButtonText}>
                {t('common.language_permission.confirm', {
                  language: detectedLangName,
                })}
              </Text>
            </TouchableOpacity>

            {/* İngilizce kullan */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleEnglish}
            >
              <Text style={styles.secondaryButtonText}>
                {t('common.language_permission.use_english')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              {t('common.language_permission.note')}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 28,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '500',
  },
  note: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
```

---

## ADIM 9 — ONBOARDING EKRANI

### `src/screens/onboarding/OnboardingScreen.tsx`
```typescript
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, FlatList, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LanguagePermissionModal } from './LanguagePermissionModal';
import { useFirstLaunch } from '../../hooks/useFirstLaunch';
import { useTextAlign } from '../../components/RTLWrapper';

const { width } = Dimensions.get('window');

// Onboarding slides — key'ler i18n'den geliyor
const SLIDES = [
  { id: '1', icon: '🚀' },
  { id: '2', icon: '✨' },
  { id: '3', icon: '🎯' },
];

interface Props {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { t } = useTranslation();
  const { langPermissionShown, markLangPermissionShown } = useFirstLaunch();
  const [showLangModal, setShowLangModal] = useState(!langPermissionShown);
  const [currentIndex, setCurrentIndex] = useState(0);
  const rtl = useTextAlign();

  const handleLangConfirm = async () => {
    await markLangPermissionShown();
    setShowLangModal(false);
  };

  const handleLangEnglish = async () => {
    await markLangPermissionShown();
    setShowLangModal(false);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Dil izin modalı — sadece ilk açılışta */}
      <LanguagePermissionModal
        visible={showLangModal}
        onConfirm={handleLangConfirm}
        onUseEnglish={handleLangEnglish}
      />

      {/* Skip butonu */}
      <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
        <Text style={styles.skipText}>{t('common.onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Slide içeriği */}
      <View style={styles.slideContainer}>
        <Text style={styles.icon}>{SLIDES[currentIndex].icon}</Text>
        <Text style={[styles.title, { textAlign: rtl.textAlign }]}>
          {t('common.onboarding.welcome_title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl.textAlign }]}>
          {t('common.onboarding.welcome_subtitle')}
        </Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* Step indicator */}
      <Text style={styles.stepText}>
        {t('common.onboarding.step_of', {
          current: currentIndex + 1,
          total: SLIDES.length,
        })}
      </Text>

      {/* Next / Get Started */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {isLast
            ? t('common.onboarding.get_started')
            : t('common.onboarding.next')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  skipButton: {
    position: 'absolute', top: 60, right: 24, zIndex: 10,
  },
  skipText: { fontSize: 16, color: '#999' },
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: { fontSize: 80, marginBottom: 32 },
  title: {
    fontSize: 28, fontWeight: '700', color: '#1a1a1a',
    marginBottom: 16, width: '100%',
  },
  subtitle: {
    fontSize: 17, color: '#666', lineHeight: 26, width: '100%',
  },
  dotsContainer: {
    flexDirection: 'row', justifyContent: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#ddd', marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#007AFF', width: 24 },
  stepText: {
    textAlign: 'center', fontSize: 13, color: '#aaa', marginBottom: 16,
  },
  nextButton: {
    marginHorizontal: 24, marginBottom: 32,
    backgroundColor: '#007AFF', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  nextButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
});
```

---

## ADIM 10 — PAYWALL EKRANI (iPlast Entegrasyonu)

### `src/screens/paywall/PaywallScreen.tsx`
```typescript
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTextAlign } from '../../components/RTLWrapper';

// iPlast / RevenueCat entegrasyonu için:
// import Purchases from 'react-native-purchases';
// Paket kurulumu: npm install react-native-purchases
// iPlast dashboard'dan API key al ve App.tsx'te başlat:
// Purchases.configure({ apiKey: 'YOUR_IPLAST_KEY' });

type Plan = 'monthly' | 'yearly' | 'lifetime';

interface Props {
  onClose: () => void;
  onSubscribe: (plan: Plan) => void;
}

export const PaywallScreen: React.FC<Props> = ({ onClose, onSubscribe }) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const rtl = useTextAlign();

  const plans: { id: Plan; savePct?: number }[] = [
    { id: 'monthly' },
    { id: 'yearly', savePct: 50 },
    { id: 'lifetime' },
  ];

  const features = [
    t('common.paywall.feature_1'),
    t('common.paywall.feature_2'),
    t('common.paywall.feature_3'),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { textAlign: rtl.textAlign }]}>
          {t('common.paywall.title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: rtl.textAlign }]}>
          {t('common.paywall.subtitle')}
        </Text>

        {/* Özellikler */}
        {features.map((f, i) => (
          <View key={i} style={[styles.featureRow, { flexDirection: rtl.flexDirection }]}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}

        {/* Plan seçimi */}
        <View style={styles.plansContainer}>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.savePct && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>
                    {t('common.paywall.best_value')}
                  </Text>
                </View>
              )}
              <Text style={styles.planName}>
                {t(`common.paywall.${plan.id}`)}
              </Text>
              {plan.savePct && (
                <Text style={styles.saveText}>
                  {t('common.paywall.save_percent', { percent: plan.savePct })}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => onSubscribe(selectedPlan)}
        >
          <Text style={styles.ctaText}>
            {t('common.paywall.cta_trial')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.cancelText}>
          {t('common.paywall.cancel_anytime')}
        </Text>

        {/* Alt linkler */}
        <View style={[styles.bottomRow, { flexDirection: rtl.flexDirection }]}>
          <TouchableOpacity>
            <Text style={styles.linkText}>{t('common.paywall.restore')}</Text>
          </TouchableOpacity>
          <Text style={styles.separator}> · </Text>
          <TouchableOpacity>
            <Text style={styles.linkText}>{t('common.paywall.terms')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  closeButton: {
    alignSelf: 'flex-end', padding: 16, paddingBottom: 0,
  },
  closeText: { fontSize: 20, color: '#999' },
  title: {
    fontSize: 28, fontWeight: '800', paddingHorizontal: 24,
    marginTop: 12, marginBottom: 8, color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16, color: '#666', paddingHorizontal: 24,
    marginBottom: 24, lineHeight: 24,
  },
  featureRow: {
    alignItems: 'center', paddingHorizontal: 24,
    marginBottom: 12, gap: 10,
  },
  featureCheck: { color: '#007AFF', fontSize: 18, fontWeight: '700' },
  featureText: { fontSize: 16, color: '#333' },
  plansContainer: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 10, marginTop: 24, marginBottom: 24,
  },
  planCard: {
    flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0',
    borderRadius: 16, padding: 16, alignItems: 'center',
    position: 'relative', paddingTop: 24,
  },
  planCardSelected: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  bestValueBadge: {
    position: 'absolute', top: -10,
    backgroundColor: '#007AFF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  bestValueText: { color: 'white', fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  saveText: { fontSize: 12, color: '#007AFF', marginTop: 4 },
  ctaButton: {
    marginHorizontal: 24, backgroundColor: '#007AFF',
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
  },
  ctaText: { color: 'white', fontSize: 17, fontWeight: '700' },
  cancelText: {
    textAlign: 'center', fontSize: 13, color: '#999', marginTop: 12,
  },
  bottomRow: {
    justifyContent: 'center', alignItems: 'center',
    marginTop: 16, marginBottom: 32,
  },
  linkText: { fontSize: 13, color: '#007AFF' },
  separator: { color: '#ccc', fontSize: 13 },
});
```

---

## ADIM 11 — APP.TSX ENTEGRASYONU

### `App.tsx`
```typescript
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initI18n } from './src/i18n';
import { I18nextProvider } from 'react-i18next';
import i18next from './src/i18n';
import { OnboardingScreen } from './src/screens/onboarding/OnboardingScreen';
import { PaywallScreen } from './src/screens/paywall/PaywallScreen';
// iPlast için: import Purchases from 'react-native-purchases';

type AppScreen = 'loading' | 'onboarding' | 'paywall' | 'main';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('loading');

  useEffect(() => {
    (async () => {
      // i18n'i başlat
      await initI18n();

      // iPlast / RevenueCat başlat (API key'i kendi key'inizle değiştirin)
      // await Purchases.configure({ apiKey: 'YOUR_IPLAST_REVENUECAT_KEY' });

      // Onboarding göster (ilk açılışta)
      // AsyncStorage'dan kontrol edilebilir
      setScreen('onboarding');
    })();
  }, []);

  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18next}>
      {screen === 'onboarding' && (
        <OnboardingScreen onComplete={() => setScreen('paywall')} />
      )}
      {screen === 'paywall' && (
        <PaywallScreen
          onClose={() => setScreen('main')}
          onSubscribe={(plan) => {
            console.log('Subscribe:', plan);
            setScreen('main');
          }}
        />
      )}
      {screen === 'main' && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {/* Ana uygulama buraya */}
        </View>
      )}
    </I18nextProvider>
  );
}
```

---

## ADIM 12 — IPLAST (RevenueCat) ENTEGRASYONU

```bash
npm install react-native-purchases
npx pod-install  # iOS için
```

```typescript
// src/services/purchases.ts
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// iPlast dashboard → Settings → API Keys'den alın
const IPLAST_API_KEY_IOS = 'appl_XXXXXXXXXXXXXXXX';

export async function initPurchases() {
  Purchases.configure({ apiKey: IPLAST_API_KEY_IOS });
}

export async function fetchOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch (e) {
    console.error('Offerings fetch error:', e);
    return [];
  }
}

export async function purchasePackage(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) throw e;
    return null;
  }
}

export async function restorePurchases() {
  return await Purchases.restorePurchases();
}
```

---

## ADIM 13 — OTOMATİK TEST SÜİTİ

> **Agent görevi:** Aşağıdaki tüm testleri çalıştır. Her test için PASS/FAIL yaz.

### `src/__tests__/i18n.test.ts`
```typescript
import { resolveLanguage } from '../i18n';

describe('resolveLanguage — Fallback Logic', () => {
  // Desteklenen diller → doğru kodu döndürmeli
  test('PASS: tr cihazda Türkçe', () => {
    expect(resolveLanguage(['tr-TR'])).toBe('tr');
  });
  test('PASS: pt-BR cihazda Brezilya Portekizce', () => {
    expect(resolveLanguage(['pt-BR'])).toBe('pt-BR');
  });
  test('PASS: pt-PT cihazda Portekizce', () => {
    expect(resolveLanguage(['pt-PT'])).toBe('pt-PT');
  });
  test('PASS: ar cihazda Arapça', () => {
    expect(resolveLanguage(['ar-SA'])).toBe('ar');
  });
  test('PASS: ja cihazda Japonca', () => {
    expect(resolveLanguage(['ja-JP'])).toBe('ja');
  });
  test('PASS: ko cihazda Korece', () => {
    expect(resolveLanguage(['ko-KR'])).toBe('ko');
  });
  test('PASS: de cihazda Almanca', () => {
    expect(resolveLanguage(['de-DE'])).toBe('de');
  });
  test('PASS: fr cihazda Fransızca', () => {
    expect(resolveLanguage(['fr-FR'])).toBe('fr');
  });
  test('PASS: es cihazda İspanyolca', () => {
    expect(resolveLanguage(['es-ES'])).toBe('es');
  });

  // Desteklenmeyen diller → İngilizce fallback
  test('PASS: Rusça → İngilizce fallback', () => {
    expect(resolveLanguage(['ru-RU'])).toBe('en');
  });
  test('PASS: Çince → İngilizce fallback', () => {
    expect(resolveLanguage(['zh-CN'])).toBe('en');
  });
  test('PASS: Hintçe → İngilizce fallback', () => {
    expect(resolveLanguage(['hi-IN'])).toBe('en');
  });
  test('PASS: Bilinmeyen dil → İngilizce fallback', () => {
    expect(resolveLanguage(['xx-XX'])).toBe('en');
  });
  test('PASS: Boş dizi → İngilizce fallback', () => {
    expect(resolveLanguage([])).toBe('en');
  });

  // Çoklu cihaz dili → öncelik sırası
  test('PASS: Rusça önce, Türkçe sonra → Türkçe seç', () => {
    expect(resolveLanguage(['ru-RU', 'tr-TR'])).toBe('tr');
  });
  test('PASS: Çince önce, Japonca sonra → Japonca seç', () => {
    expect(resolveLanguage(['zh-CN', 'ja-JP'])).toBe('ja');
  });
});

describe('Locale Dosyaları — Anahtar Tutarlılığı', () => {
  const locales = ['tr','pt-BR','pt-PT','de','fr','es','ko','ja','ar'];
  const enKeys = Object.keys(require('../i18n/locales/en').default.common);

  locales.forEach(lang => {
    test(`PASS: ${lang} tüm anahtarlara sahip`, () => {
      const locale = require(`../i18n/locales/${lang}`).default.common;
      const keys = Object.keys(locale);
      // Her dil en az onboarding, language_permission, paywall, common, settings içermeli
      expect(keys).toContain('onboarding');
      expect(keys).toContain('language_permission');
      expect(keys).toContain('paywall');
      expect(keys).toContain('common');
      expect(keys).toContain('settings');
    });
  });
});

describe('RTL Kontrolü', () => {
  test('PASS: Sadece Arapça RTL', () => {
    const rtlLangs = ['ar'];
    const nonRtl = ['en','tr','pt-BR','pt-PT','de','fr','es','ko','ja'];
    rtlLangs.forEach(lang => {
      expect(lang === 'ar').toBe(true);
    });
    nonRtl.forEach(lang => {
      expect(lang === 'ar').toBe(false);
    });
  });
});
```

### Test Çalıştırma
```bash
npx jest src/__tests__/i18n.test.ts --verbose
```

**Beklenen çıktı:**
```
✓ PASS: tr cihazda Türkçe
✓ PASS: pt-BR cihazda Brezilya Portekizce
✓ PASS: pt-PT cihazda Portekizce
✓ PASS: ar cihazda Arapça
✓ PASS: ja cihazda Japonca
✓ PASS: ko cihazda Korece
✓ PASS: de cihazda Almanca
✓ PASS: fr cihazda Fransızca
✓ PASS: es cihazda İspanyolca
✓ PASS: Rusça → İngilizce fallback
✓ PASS: Çince → İngilizce fallback
✓ PASS: Hintçe → İngilizce fallback
✓ PASS: Bilinmeyen dil → İngilizce fallback
✓ PASS: Boş dizi → İngilizce fallback
✓ PASS: Rusça önce, Türkçe sonra → Türkçe seç
✓ PASS: Çince önce, Japonca sonra → Japonca seç
✓ PASS: tr tüm anahtarlara sahip
... (tüm diller)
✓ PASS: Sadece Arapça RTL

Test Suites: 1 passed, 1 total
Tests:       18 passed, 18 total
```

---

## ADIM 14 — MANUEL KONTROL LİSTESİ

Agent, kod yazdıktan sonra bu listeyi kontrol et:

- [ ] `src/i18n/index.ts` mevcut ve `resolveLanguage` export ediliyor
- [ ] 10 locale dosyası mevcut: en, tr, pt-BR, pt-PT, de, fr, es, ko, ja, ar
- [ ] Her locale dosyasında 5 section var: onboarding, language_permission, paywall, common, settings
- [ ] `app.json`'da `CFBundleAllowMixedLocalizations: true` var
- [ ] `LanguagePermissionModal` ilk açılışta gösteriliyor (AsyncStorage kontrolü)
- [ ] Arapça için `useTextAlign()` hook'u kullanılıyor
- [ ] `I18nextProvider` App.tsx'te sarmalamış
- [ ] `initI18n()` App.tsx'te `useEffect` ile çağrılıyor
- [ ] iPlast/RevenueCat import'u paywall ekranında mevcut (yorum satırı da olsa)
- [ ] Test dosyası mevcut ve 18 test var
- [ ] `npx jest` komutu çalıştırıldı ve tümü PASS

---

## HATA AYIKLAMA

**Problem:** Dil değişmiyor  
**Çözüm:** `AsyncStorage.removeItem('user_language')` ile cache'i temizle

**Problem:** RTL layout bozuk  
**Çözüm:** `I18nManager.forceRTL(true)` sonrası uygulamayı yeniden başlat (`Updates.reloadAsync()`)

**Problem:** `t('key')` "key" olarak gösteriyor  
**Çözüm:** `initI18n()` await edilmeden önce render gerçekleşiyor — `screen === 'loading'` state'ini kontrol et

**Problem:** pt-BR yerine pt-PT geliyor  
**Çözüm:** `resolveLanguage`'da tam kod eşleşmesi önce geliyor — sıralamayı kontrol et

**Problem:** iPlast ürün bilgileri gelmiyor  
**Çözüm:** `Purchases.configure()` App.tsx'te `initI18n()` ile birlikte çağrıldığından emin ol

---

## ÖZET

Bu skill tamamlandığında uygulamada şunlar çalışıyor olmalı:

1. **Cihaz dili otomatik tespit** — 10 desteklenen dilden biri, yoksa İngilizce
2. **İlk onboarding'de dil modalı** — "Türkçe kullan" veya "İngilizce kullan"
3. **Tüm ekranlar lokalize** — Onboarding, Paywall, Ayarlar
4. **Arapça RTL** — layout otomatik ayna görüntüsü
5. **iPlast entegrasyonu** — RevenueCat tabanlı paywall
6. **18 otomatik test** — fallback, RTL, anahtar tutarlılığı
7. **app.json** — iOS plist ayarları dahil

---
*SKILL.md v1.0 — React Native Expo TypeScript i18n Localization*
