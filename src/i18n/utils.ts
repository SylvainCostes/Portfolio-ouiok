import en, { type TranslationKey } from './locales/en'
import fr from './locales/fr'

export type Lang = 'en' | 'fr'

export const defaultLang: Lang = 'en'

const translations: Record<Lang, Record<TranslationKey, string>> = { en, fr }

/**
 * Returns a typed translation function for the given language.
 *
 * Usage in .astro files:
 *
 *   import { useTranslations } from '@/i18n/utils'
 *   const t = useTranslations(lang)   // lang = 'en' | 'fr'
 *   t('hero.title')
 */
export function useTranslations(lang: Lang = defaultLang) {
  return function t(key: TranslationKey): string {
    return translations[lang][key] ?? translations[defaultLang][key]
  }
}

/**
 * Given a URL pathname, returns the current language.
 * "/fr/about"  → 'fr'
 * "/about"     → 'en'
 */
export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/')
  if (first === 'fr') return 'fr'
  return defaultLang
}
