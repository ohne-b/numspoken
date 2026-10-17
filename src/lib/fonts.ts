const fontLoaders = {
  default: () => import('@fontsource/noto-sans/400.css'),
  arabic: () => import('@fontsource/noto-sans-arabic/400.css'),
  bengali: () => import('@fontsource/noto-sans-bengali/400.css'),
  devanagari: () => import('@fontsource/noto-sans-devanagari/400.css'),
  ethiopic: () => import('@fontsource/noto-sans-ethiopic/400.css'),
  georgian: () => import('@fontsource/noto-sans-georgian/400.css'),
  gujarati: () => import('@fontsource/noto-sans-gujarati/400.css'),
  gurmukhi: () => import('@fontsource/noto-sans-gurmukhi/400.css'),
  hebrew: () => import('@fontsource/noto-sans-hebrew/400.css'),
  kannada: () => import('@fontsource/noto-sans-kannada/400.css'),
  tamil: () => import('@fontsource/noto-sans-tamil/400.css'),
  telugu: () => import('@fontsource/noto-sans-telugu/400.css'),
  thai: () => import('@fontsource/noto-sans-thai/400.css'),
  jp: () => import('@fontsource/noto-sans-jp/400.css'),
  kr: () => import('@fontsource/noto-sans-kr/400.css'),
  sc: () => import('@fontsource/noto-sans-sc/400.css'),
  tc: () => import('@fontsource/noto-sans-tc/400.css'),
};

export type FontKey = keyof typeof fontLoaders;
export const fontFamilies: Record<FontKey, string> = {
  default: 'Noto Sans',
  arabic: 'Noto Sans Arabic',
  bengali: 'Noto Sans Bengali',
  devanagari: 'Noto Sans Devanagari',
  ethiopic: 'Noto Sans Ethiopic',
  georgian: 'Noto Sans Georgian',
  gujarati: 'Noto Sans Gujarati',
  gurmukhi: 'Noto Sans Gurmukhi',
  hebrew: 'Noto Sans Hebrew',
  kannada: 'Noto Sans Kannada',
  tamil: 'Noto Sans Tamil',
  telugu: 'Noto Sans Telugu',
  thai: 'Noto Sans Thai',
  jp: 'Noto Sans JP',
  kr: 'Noto Sans KR',
  sc: 'Noto Sans SC',
  tc: 'Noto Sans TC',
};

export async function loadFont(key: FontKey, sample: string): Promise<void> {
  await fontLoaders[key]();
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.load(`400 24px "${fontFamilies[key]}"`, sample);
  }
}
