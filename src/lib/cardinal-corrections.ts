import type { LocaleCode } from './languages';
import { MAX_NUMBER } from './random-number';

type Cardinal = (value: number) => string;

// Compatibility fixes for n2words 6.3.0, limited to the app's whole-number range.
// Sources and independent examples live in tests/fixtures/cardinal-corrections.json.
// Recheck these against upstream when changing the n2words version.
export function correctCardinal(locale: LocaleCode, raw: Cardinal): Cardinal {
  const convert: Cardinal = (n) => {
    if (!Number.isSafeInteger(n) || n < 0 || n > MAX_NUMBER) return raw(n);
    if (locale.startsWith('es-'))
      return raw(n).replace(/\bdieciseis\b/g, 'dieciséis');
    if (locale === 'uk-UA') return raw(n).replaceAll('i', 'і');
    if (locale.startsWith('zh-'))
      return raw(n)
        .replace(/^一十/, '十')
        .replace(
          /([万萬])零(?=[一二三四五六七八九壹贰貳叁參肆伍陆陸柒捌玖][千仟])/g,
          '$1',
        );
    if (locale === 'it-IT') {
      if (n >= 1_000_000) {
        const scale = n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
        const count = Math.floor(n / scale);
        const word =
          scale === 1_000_000
            ? ['milione', 'milioni']
            : ['miliardo', 'miliardi'];
        return (
          (count === 1 ? 'un ' + word[0] : convert(count) + ' ' + word[1]) +
          (n % scale ? ' ' + convert(n % scale) : '')
        );
      }
      return raw(n)
        .split(' ')
        .map((word) =>
          word.replace(/tré(?=.)/g, 'tre').replace(/(?<=\p{L})tre$/u, 'tré'),
        )
        .join(' ');
    }
    if (locale === 'sr-Cyrl-RS')
      return raw(n)
        .replaceAll('девестo', 'деветсто')
        .replaceAll('шесто', 'шестсто');
    if (locale === 'sr-Latn-RS') return raw(n).replaceAll('šesto', 'šeststo');
    if (locale === 'hu-HU')
      return raw(n)
        .replace(/kettő(?=ezer|millió|milliárd)/g, 'két')
        .replace(/két$/, 'kettő');
    if (locale === 'pt-PT') {
      const words =
        n >= 1000 && n % 1000 > 0 && n % 100 === 0
          ? raw(n - (n % 1000)) + ' e ' + raw(n % 1000)
          : raw(n);
      return words.replace(/^um mil milhões/, 'mil milhões');
    }
    if (locale === 'ur-PK') return raw(n).replaceAll('چھالیس', 'چھیالیس');
    if (locale === 'ta-IN') {
      const spelling = (words: string) =>
        words
          .replaceAll('பதிமூன்று', 'பதின்மூன்று')
          .replace(/த்தி(?=மூன்று|நான்கு)/g, 'த்து')
          .replaceAll('ஐநூ', 'ஐந்நூ')
          .replaceAll('எண்நூ', 'எண்ணூ')
          .replaceAll('முன்னூ', 'முந்நூ');
      if (n < 1_000_000) return spelling(raw(n));
      const compound = (value: number): string => {
        if (value < 1000) return spelling(raw(value));
        const scale =
          value < 100_000 ? 1000 : value < 10_000_000 ? 100_000 : 10_000_000;
        const count = Math.floor(value / scale);
        const rest = value % scale;
        if (scale === 10_000_000)
          return (
            spelling(raw(value - rest)) + (rest ? ' ' + compound(rest) : '')
          );
        if (scale === 100_000)
          return (
            (count === 1 ? 'ஒரு' : spelling(raw(count))) +
            (rest ? ' இலட்சத்து ' + compound(rest) : ' லட்சம்')
          );
        const thousands =
          count === 1 ? 'ஆயிரம்' : spelling(raw(count)).replace(/ு$/, 'ாயிரம்');
        return rest
          ? thousands.replace(/ம்$/, 'த்து') + ' ' + compound(rest)
          : thousands;
      };
      return compound(n);
    }
    if (locale === 'fa-IR')
      return raw(n)
        .replaceAll('ي', 'ی')
        .replace(/هزار (?!و )/g, 'هزار و ');
    if (locale === 'yo-NG')
      return raw(n)
        .replace(/(^| )ogóta(?= |$)/g, '$1ọgọ́ta')
        .replace(/(^| )ogórin(?= |$)/g, '$1ọgọ́rin');

    if (locale === 'fi-FI') {
      if (n < 100) return raw(n);
      const scale =
        n < 1000
          ? 100
          : n < 1_000_000
            ? 1000
            : n < 1_000_000_000
              ? 1_000_000
              : 1_000_000_000;
      const count = Math.floor(n / scale);
      const word =
        scale === 100
          ? ['sata', 'sataa']
          : scale === 1000
            ? ['tuhat', 'tuhatta']
            : scale === 1_000_000
              ? ['miljoona', 'miljoonaa']
              : ['miljardi', 'miljardia'];
      return (
        (count === 1 ? word[0] : convert(count) + word[1]) +
        (n % scale ? convert(n % scale) : '')
      );
    }
    if (locale === 'sv-SE') {
      if (n < 100) return raw(n).replaceAll('-', '');
      if (n >= 1_000_000) {
        const scale = n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
        const count = Math.floor(n / scale);
        const word = scale === 1_000_000 ? 'miljon' : 'miljard';
        return (
          (count === 1
            ? 'en ' + word
            : convert(count).replace(/ett$/, 'en') + ' ' + word + 'er') +
          (n % scale ? ' ' + convert(n % scale) : '')
        );
      }
      const scale = n < 1000 ? 100 : 1000;
      const count = Math.floor(n / scale);
      return (
        (count === 1 ? '' : convert(count)) +
        (scale === 100 ? 'hundra' : 'tusen') +
        (n % scale ? convert(n % scale) : '')
      ).replace(/ttt/g, 'tt');
    }
    if (locale === 'nb-NO' || locale === 'da-DK') {
      if (n < 100) {
        const words = raw(n).replaceAll('-', '');
        return locale === 'da-DK' && n >= 60 && n < 70
          ? words.replace(/treds$/, 'tres')
          : words;
      }
      if (n >= 1_000_000) {
        const scale = n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
        const count = Math.floor(n / scale);
        const rest = n % scale;
        const word = scale === 1_000_000 ? 'million' : 'milliard';
        const singular =
          count === 1 || (locale === 'da-DK' && count % 100 === 1);
        const prefix =
          locale === 'da-DK'
            ? convert(count).replace(/\bet$/, 'en')
            : convert(count);
        return (
          prefix +
          ' ' +
          word +
          (singular ? '' : 'er') +
          (rest ? (rest < 100 ? ' og ' : ' ') + convert(rest) : '')
        );
      }
      const danish = locale === 'da-DK';
      const scale = n < 1000 ? 100 : 1000;
      const count = Math.floor(n / scale);
      const rest = n % scale;
      const word =
        scale === 100
          ? danish
            ? 'hundrede'
            : 'hundre'
          : danish
            ? 'tusind'
            : 'tusen';
      const prefix = count === 1 ? (danish ? 'et' : 'ett') : convert(count);
      return (
        prefix +
        ' ' +
        word +
        (rest ? (rest < 100 ? ' og ' : ' ') + convert(rest) : '')
      );
    }
    if (locale === 'ka-GE' && n >= 1000) {
      const scale =
        n < 1_000_000 ? 1000 : n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
      const count = Math.floor(n / scale);
      const rest = n % scale;
      const word =
        scale === 1000 ? 'ათასი' : scale === 1_000_000 ? 'მილიონი' : 'მილიარდი';
      return (
        (count === 1 && scale === 1000 ? '' : convert(count) + ' ') +
        (rest ? word.slice(0, -1) + ' ' + convert(rest) : word)
      );
    }
    if (locale === 'el-GR') {
      if (n < 1000)
        return n > 100 && n < 200
          ? raw(n).replace(/^εκατό /, 'εκατόν ')
          : raw(n);
      if (n >= 1_000_000) {
        const scale = n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
        const count = Math.floor(n / scale);
        const word =
          scale === 1_000_000
            ? ['εκατομμύριο', 'εκατομμύρια']
            : ['δισεκατομμύριο', 'δισεκατομμύρια'];
        return (
          convert(count) +
          ' ' +
          word[count === 1 ? 0 : 1] +
          (n % scale ? ' ' + convert(n % scale) : '')
        );
      }
      const count = Math.floor(n / 1000);
      const feminine = convert(count)
        .replace(/κόσια/g, 'κόσιες')
        .replace(/δεκατρία/g, 'δεκατρείς')
        .replace(/τρία/g, 'τρεις')
        .replace(/τέσσερα/g, 'τέσσερις')
        .replace(/ένα$/g, 'μία');
      return (
        (count === 1 ? 'χίλια' : feminine + ' χιλιάδες') +
        (n % 1000 ? ' ' + convert(n % 1000) : '')
      );
    }
    if (locale === 'ha-NG') {
      if (n < 100) return raw(n);
      const scale =
        n < 1000
          ? 100
          : n < 1_000_000
            ? 1000
            : n < 1_000_000_000
              ? 1_000_000
              : 1_000_000_000;
      const count = Math.floor(n / scale);
      return (
        (scale === 100
          ? 'ɗari'
          : scale === 1000
            ? 'dubu'
            : scale === 1_000_000
              ? 'miliyan'
              : 'biliyan') +
        (count === 1 && scale < 1_000_000 ? '' : ' ' + convert(count)) +
        (n % scale ? ' da ' + convert(n % scale) : '')
      );
    }
    if (locale === 'fil-PH') {
      if (n === 11) return 'labing-isa';
      if (n === 14) return 'labing-apat';
      if (n === 16) return 'labing-anim';
      if (n === 18) return 'labing-walo';
      if (n < 20) return raw(n);
      if (n < 100)
        return raw(n - (n % 10)) + (n % 10 ? "'t " + raw(n % 10) : '');
      const scale =
        n < 1000
          ? 100
          : n < 1_000_000
            ? 1000
            : n < 1_000_000_000
              ? 1_000_000
              : 1_000_000_000;
      const prefix = convert(Math.floor(n / scale));
      const linked = /[aeiou]$/.test(prefix)
        ? prefix + 'ng'
        : prefix.endsWith('n')
          ? prefix + 'g'
          : prefix + ' na';
      const word =
        scale === 100
          ? 'daan'
          : scale === 1000
            ? 'libo'
            : scale === 1_000_000
              ? 'milyon'
              : 'bilyon';
      const rest = n % scale;
      return (
        linked +
        ' ' +
        word +
        (rest ? (scale === 100 ? 'g ' : ' at ') + convert(rest) : '')
      );
    }
    if (locale === 'mr-IN') {
      if (n < 100) return raw(n);
      if (n < 1000) {
        const count = Math.floor(n / 100);
        const word =
          count === 1 ? (n === 100 ? 'शंभर' : 'एकशे') : raw(count) + 'शे';
        return word + (n % 100 ? ' ' + raw(n % 100) : '');
      }
      const scale =
        n < 100_000
          ? 1000
          : n < 10_000_000
            ? 100_000
            : n < 1_000_000_000
              ? 10_000_000
              : n < 100_000_000_000
                ? 1_000_000_000
                : 100_000_000_000;
      const word =
        scale === 1000
          ? 'हजार'
          : scale === 100_000
            ? 'लाख'
            : scale === 10_000_000
              ? 'कोटी'
              : scale === 1_000_000_000
                ? 'अब्ज'
                : 'खर्व';
      return (
        convert(Math.floor(n / scale)) +
        ' ' +
        word +
        (n % scale ? ' ' + convert(n % scale) : '')
      );
    }
    if (locale === 'te-IN' && n >= 1000) {
      if (n >= 10_000_000) {
        const scale =
          n < 1_000_000_000
            ? 10_000_000
            : n < 100_000_000_000
              ? 1_000_000_000
              : 100_000_000_000;
        const count = Math.floor(n / scale);
        const rest = n % scale;
        const prefix =
          scale === 10_000_000
            ? count === 1
              ? 'కోటి'
              : raw(count) + ' కోట్లు'
            : raw(n - rest);
        return prefix + (rest ? ' ' + convert(rest) : '');
      }
      const scale = n < 100_000 ? 1000 : 100_000;
      const count = Math.floor(n / scale);
      const word =
        scale === 1000
          ? count === 1
            ? 'వెయ్యి'
            : 'వేలు'
          : count === 1
            ? 'లక్ష'
            : 'లక్షలు';
      return (
        (count === 1 ? '' : raw(count) + ' ') +
        word +
        (n % scale ? ' ' + convert(n % scale) : '')
      );
    }
    if (locale === 'he-IL' || locale === 'hbo-IL') {
      const biblical = locale === 'hbo-IL';
      // Hundreds agree with feminine מאה even when the final units are masculine.
      const hundreds = [
        '',
        'מאה',
        'מאתיים',
        biblical ? 'שלש מאות' : 'שלוש מאות',
        'ארבע מאות',
        'חמש מאות',
        'שש מאות',
        'שבע מאות',
        'שמונה מאות',
        'תשע מאות',
      ];
      if (n < 1000) {
        if (!biblical || n < 100) return raw(n);
        return raw(n).replace(/^[^ ]+ מאות/, hundreds[Math.floor(n / 100)]);
      }
      const count = Math.floor(n / 1000);
      const construct = [
        '',
        'אלף',
        'אלפיים',
        biblical ? 'שלשת אלפים' : 'שלושת אלפים',
        'ארבעת אלפים',
        'חמשת אלפים',
        'ששת אלפים',
        'שבעת אלפים',
        'שמונת אלפים',
        'תשעת אלפים',
        'עשרת אלפים',
      ];
      const masculine = (value: number): string => {
        if (biblical) return convert(value);
        const units = [
          '',
          'אחד',
          'שניים',
          'שלושה',
          'ארבעה',
          'חמישה',
          'שישה',
          'שבעה',
          'שמונה',
          'תשעה',
        ];
        if (value < 10) return units[value];
        if (value === 10) return 'עשרה';
        if (value < 20)
          return (value === 12 ? 'שנים' : units[value - 10]) + ' עשר';
        if (value < 100)
          return (
            raw(value - (value % 10)) +
            (value % 10 ? ' ו' + units[value % 10] : '')
          );
        return (
          hundreds[Math.floor(value / 100)] +
          (value % 100 ? ' ו' + masculine(value % 100) : '')
        );
      };
      if (n >= 1_000_000) {
        const scale = n < 1_000_000_000 ? 1_000_000 : 1_000_000_000;
        const count = Math.floor(n / scale);
        const rest = n % scale;
        const word = scale === 1_000_000 ? 'מיליון' : 'מיליארד';
        return (
          (count === 1 ? '' : (count === 2 ? 'שני' : masculine(count)) + ' ') +
          word +
          (rest ? (rest < 100 ? ' ו' : ' ') + convert(rest) : '')
        );
      }
      const rest = n % 1000;
      return (
        (count <= 10 ? construct[count] : masculine(count) + ' אלף') +
        (rest ? (rest < 100 ? ' ו' : ' ') + convert(rest) : '')
      );
    }
    return raw(n);
  };
  return convert;
}
