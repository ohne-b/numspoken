import type { LocaleCode } from './languages';

type Cardinal = (value: number) => string;

// Compatibility fixes for n2words 6.3.0, limited to the app's whole-number range.
// Sources and independent examples live in tests/fixtures/cardinal-corrections.json.
// Recheck these against upstream when changing the n2words version.
export function correctCardinal(locale: LocaleCode, raw: Cardinal): Cardinal {
  const convert: Cardinal = (n) => {
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) return raw(n);
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
      const words = raw(n).replace(/tré(?=.)/g, 'tre');
      return n > 3 ? words.replace(/tre$/, 'tré') : words;
    }
    if (locale === 'sr-Cyrl-RS')
      return raw(n)
        .replaceAll('девестo', 'деветсто')
        .replaceAll('шесто', 'шестсто');
    if (locale === 'sr-Latn-RS') return raw(n).replaceAll('šesto', 'šeststo');
    if (locale === 'hu-HU')
      return raw(n)
        .replace(/kettő(?=ezer)/g, 'két')
        .replace(/két$/, 'kettő');
    if (locale === 'pt-PT' && n >= 1000 && n % 1000 > 0 && n % 100 === 0)
      return raw(n - (n % 1000)) + ' e ' + raw(n % 1000);
    if (locale === 'ur-PK') return raw(n).replaceAll('چھالیس', 'چھیالیس');
    if (locale === 'ta-IN')
      return raw(n)
        .replaceAll('பதிமூன்று', 'பதின்மூன்று')
        .replaceAll('ஐநூ', 'ஐந்நூ')
        .replaceAll('எண்நூ', 'எண்ணூ')
        .replaceAll('முன்னூ', 'முந்நூ');
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
      if (n === 1_000_000) return 'miljoona';
      const scale = n < 1000 ? 100 : 1000;
      const count = Math.floor(n / scale);
      const word = scale === 100 ? ['sata', 'sataa'] : ['tuhat', 'tuhatta'];
      return (
        (count === 1 ? word[0] : convert(count) + word[1]) +
        (n % scale ? convert(n % scale) : '')
      );
    }
    if (locale === 'sv-SE') {
      if (n < 100) return raw(n).replaceAll('-', '');
      if (n === 1_000_000) return raw(n);
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
      if (n === 1_000_000) return 'en million';
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
      const gap = danish && scale === 100 && count > 1 ? '' : ' ';
      return (
        prefix +
        gap +
        word +
        (rest ? (rest < 100 ? ' og ' : ' ') + convert(rest) : '')
      );
    }
    if (locale === 'ka-GE' && n >= 1000 && n < 1_000_000) {
      const count = Math.floor(n / 1000);
      const rest = n % 1000;
      return (
        (count === 1 ? '' : raw(count) + ' ') +
        (rest ? 'ათას ' + raw(rest) : 'ათასი')
      );
    }
    if (locale === 'el-GR') {
      if (n < 1000)
        return n > 100 && n < 200
          ? raw(n).replace(/^εκατό /, 'εκατόν ')
          : raw(n);
      if (n === 1_000_000) return 'ένα εκατομμύριο';
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
      if (n === 1_000_000) return 'miliyan ɗaya';
      const scale = n < 1000 ? 100 : 1000;
      const count = Math.floor(n / scale);
      return (
        (scale === 100 ? 'ɗari' : 'dubu') +
        (count === 1 ? '' : ' ' + convert(count)) +
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
      const scale = n < 1000 ? 100 : n < 1_000_000 ? 1000 : 1_000_000;
      const prefix = convert(Math.floor(n / scale));
      const linked = /[aeiou]$/.test(prefix)
        ? prefix + 'ng'
        : prefix.endsWith('n')
          ? prefix + 'g'
          : prefix + ' na';
      const word = scale === 100 ? 'daan' : scale === 1000 ? 'libo' : 'milyon';
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
      const scale = n < 100_000 ? 1000 : 100_000;
      return (
        convert(Math.floor(n / scale)) +
        (scale === 1000 ? ' हजार' : ' लाख') +
        (n % scale ? ' ' + convert(n % scale) : '')
      );
    }
    if (locale === 'te-IN' && n >= 1000) {
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
      if (n === 1_000_000) return raw(n);
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
