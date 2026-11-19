import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

export const resources = {
  en: { translation: en },
  tr: { translation: tr },
  fr: { translation: fr },
  de: { translation: de },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  ko: { translation: ko },
} as const;

export type SupportedLanguage = keyof typeof resources;

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'tr', label: 'Turkish', nativeName: 'Türkçe' },
  { code: 'es', label: 'Spanish', nativeName: 'Español' },
  { code: 'fr', label: 'French', nativeName: 'Français' },
  { code: 'de', label: 'German', nativeName: 'Deutsch' },
  { code: 'it', label: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語' },
  { code: 'ko', label: 'Korean', nativeName: '한국어' },
];

export const LANGUAGE_KEY = 'user-language';

// 1. Synchronously resolve the device language to prevent empty or flickering translations on first frame
const deviceLocales = Localization.getLocales();
const rawLocale = (deviceLocales && deviceLocales.length > 0 && deviceLocales[0].languageCode)
  ? deviceLocales[0].languageCode.toLowerCase()
  : 'en';

const initialLang: SupportedLanguage = Object.prototype.hasOwnProperty.call(resources, rawLocale)
  ? (rawLocale as SupportedLanguage)
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// 2. Asynchronously load the persisted language or persist the detected device language
export const initAppLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && Object.prototype.hasOwnProperty.call(resources, saved)) {
      if (i18n.language !== saved) {
        await i18n.changeLanguage(saved);
      }
      return saved as SupportedLanguage;
    } else {
      // First time launch: save detected device language so next opens always keep it
      await AsyncStorage.setItem(LANGUAGE_KEY, initialLang);
      return initialLang;
    }
  } catch (err) {
    console.warn('[i18n] Failed to load or persist language:', err);
    return initialLang;
  }
};

// 3. User-selectable language change helper
export const setAppLanguage = async (langCode: SupportedLanguage): Promise<void> => {
  try {
    if (Object.prototype.hasOwnProperty.call(resources, langCode)) {
      await AsyncStorage.setItem(LANGUAGE_KEY, langCode);
      await i18n.changeLanguage(langCode);
    }
  } catch (err) {
    console.warn('[i18n] Failed to set app language:', err);
  }
};

// Automatically run persistence init
initAppLanguage();

export default i18n;
