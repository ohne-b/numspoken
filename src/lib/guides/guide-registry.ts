import { languageFor, type Language, type LocaleCode } from '../languages';

export interface Guide {
  slug: string;
  locale: LocaleCode;
  sections?: Record<string, LocaleCode[]>;
}

export const guides: readonly Guide[] = [
  {
    slug: 'amharic',
    locale: 'am-ET',
    sections: { 'latin-script': ['am-Latn-ET'] },
  },
  { slug: 'arabic', locale: 'ar-SA' },
  { slug: 'azerbaijani', locale: 'az-AZ' },
  { slug: 'bangla', locale: 'bn-BD' },
  { slug: 'biblical-hebrew', locale: 'hbo-IL' },
  {
    slug: 'chinese',
    locale: 'zh-Hans-CN',
    sections: { scripts: ['zh-Hans-CN', 'zh-Hant-TW'] },
  },
  { slug: 'croatian', locale: 'hr-HR' },
  { slug: 'czech', locale: 'cs-CZ' },
  { slug: 'danish', locale: 'da-DK' },
  { slug: 'dutch', locale: 'nl-NL' },
  {
    slug: 'english',
    locale: 'en-US',
    sections: { 'british-english': ['en-GB'], 'indian-grouping': ['en-IN'] },
  },
  { slug: 'filipino', locale: 'fil-PH' },
  { slug: 'finnish', locale: 'fi-FI' },
  {
    slug: 'french',
    locale: 'fr-FR',
    sections: { 'belgian-french': ['fr-BE'] },
  },
  { slug: 'georgian', locale: 'ka-GE' },
  { slug: 'german', locale: 'de-DE' },
  { slug: 'greek', locale: 'el-GR' },
  { slug: 'gujarati', locale: 'gu-IN' },
  { slug: 'hausa', locale: 'ha-NG' },
  { slug: 'hebrew', locale: 'he-IL' },
  { slug: 'hindi', locale: 'hi-IN' },
  { slug: 'hungarian', locale: 'hu-HU' },
  { slug: 'indonesian', locale: 'id-ID' },
  { slug: 'italian', locale: 'it-IT' },
  { slug: 'japanese', locale: 'ja-JP' },
  { slug: 'kannada', locale: 'kn-IN' },
  { slug: 'korean', locale: 'ko-KR' },
  { slug: 'latvian', locale: 'lv-LV' },
  { slug: 'lithuanian', locale: 'lt-LT' },
  { slug: 'malay', locale: 'ms-MY' },
  { slug: 'marathi', locale: 'mr-IN' },
  { slug: 'norwegian-bokmal', locale: 'nb-NO' },
  { slug: 'persian', locale: 'fa-IR' },
  { slug: 'polish', locale: 'pl-PL' },
  {
    slug: 'portuguese',
    locale: 'pt-BR',
    sections: { 'european-portuguese': ['pt-PT'] },
  },
  { slug: 'punjabi', locale: 'pa-IN' },
  { slug: 'romanian', locale: 'ro-RO' },
  { slug: 'russian', locale: 'ru-RU' },
  {
    slug: 'serbian',
    locale: 'sr-Cyrl-RS',
    sections: { scripts: ['sr-Cyrl-RS', 'sr-Latn-RS'] },
  },
  { slug: 'spanish', locale: 'es-ES' },
  { slug: 'swahili', locale: 'sw-KE' },
  { slug: 'swedish', locale: 'sv-SE' },
  { slug: 'tamil', locale: 'ta-IN' },
  { slug: 'telugu', locale: 'te-IN' },
  { slug: 'thai', locale: 'th-TH' },
  { slug: 'turkish', locale: 'tr-TR' },
  { slug: 'ukrainian', locale: 'uk-UA' },
  { slug: 'urdu', locale: 'ur-PK' },
  { slug: 'vietnamese', locale: 'vi-VN' },
  { slug: 'yoruba', locale: 'yo-NG' },
];

export function guideForLanguage(language: Language): Guide {
  return guides.find(
    (guide) => languageFor(guide.locale).group === language.group,
  )!;
}

export function guideForSlug(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
