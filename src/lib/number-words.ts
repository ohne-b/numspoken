import { localeLoaders, type LocaleCode } from './languages';

export interface Answer {
  canonical: string;
  candidates: string[];
}
export type Converter = (value: number) => Answer;
const cache = new Map<LocaleCode, Promise<Converter>>();

export function loadConverter(locale: LocaleCode): Promise<Converter> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const promise = localeLoaders[locale]()
    .then((module) => {
      return (value: number): Answer => {
        let canonical = locale.startsWith('zh-')
          ? (module as typeof import('n2words/zh-Hans-CN')).toCardinal(value, {
              formal: false,
            })
          : module.toCardinal(value);
        // n2words 6.3.0 omits this accent: https://dle.rae.es/diecis%C3%A9is
        // Remove this compatibility correction when the upstream spelling is fixed.
        if (locale.startsWith('es-'))
          canonical = canonical.replace(/\bdieciseis\b/g, 'dieciséis');
        // n2words documents optional American English “and”; keep whole alternatives.
        const candidates =
          locale === 'en-US'
            ? [
                canonical,
                (module as typeof import('n2words/en-US')).toCardinal(value, {
                  and: true,
                }),
              ]
            : locale.startsWith('zh-')
              ? [canonical, module.toCardinal(value)]
              : [canonical];
        if (!canonical || candidates.some((answer) => answer.length > 2048)) {
          throw new Error('The language returned an unsupported answer.');
        }
        return { canonical, candidates: [...new Set(candidates)] };
      };
    })
    .catch((error: unknown) => {
      cache.delete(locale);
      throw error;
    });
  cache.set(locale, promise);
  return promise;
}
