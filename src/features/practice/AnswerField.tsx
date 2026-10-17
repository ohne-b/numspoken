import { useLayoutEffect, useRef, type RefObject } from 'react';
import type { Language } from '../../lib/languages';
import { fontFamilies } from '../../lib/fonts';
import type { Feedback } from '../../lib/validateAnswer';

interface Props {
  value: string;
  language: Language;
  feedback: Feedback;
  revealed: boolean;
  composing: boolean;
  loading: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  onComposition: (value: boolean) => void;
  onFocusChange: (value: boolean) => void;
  onAdvance: () => void;
}

export function AnswerField({
  value,
  language,
  feedback,
  revealed,
  composing,
  loading,
  inputRef,
  onChange,
  onComposition,
  onFocusChange,
  onAdvance,
}: Props) {
  const mirrorRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const inner = innerRef.current;
    if (!input || !inner) return;
    const resize = () => {
      input.style.height = `${Math.max(64, inner.getBoundingClientRect().height)}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [inputRef]);
  const color = !revealed && !composing && !loading;
  const correctEnd = color ? feedback.correctEnd : 0;
  const errorStart = color ? feedback.errorStart : null;
  const errorEnd = color ? feedback.errorEnd : null;
  return (
    <div
      className={`answer-field ${composing ? 'is-composing' : ''} ${revealed ? 'is-revealed' : ''}`}
      style={{ fontFamily: `"${fontFamilies[language.font]}", sans-serif` }}
    >
      <div className="answer-mirror" aria-hidden="true" ref={mirrorRef}>
        <div
          className="answer-text"
          ref={innerRef}
          dir={language.direction}
          lang={language.code}
        >
          <span className="correct-text">{value.slice(0, correctEnd)}</span>
          {errorStart !== null && errorEnd !== null ? (
            <>
              {value.slice(correctEnd, errorStart)}
              <span className="incorrect-text">
                {value.slice(errorStart, errorEnd)}
              </span>
              {value.slice(errorEnd)}
            </>
          ) : (
            value.slice(correctEnd)
          )}
          {value.endsWith('\n') || !value ? '\u200b' : null}
        </div>
      </div>
      <textarea
        ref={inputRef}
        id="answer"
        className="answer-text answer-input"
        aria-label="Write the number in words"
        aria-describedby="practice-instructions practice-status"
        dir={language.direction}
        lang={language.code}
        rows={1}
        value={value}
        readOnly={revealed || loading}
        aria-busy={loading}
        maxLength={2048}
        placeholder={
          loading ? 'Getting your number ready…' : 'Write the number in words'
        }
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => onComposition(true)}
        onCompositionEnd={(event) => {
          onChange(event.currentTarget.value);
          onComposition(false);
        }}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onScroll={(event) => {
          if (mirrorRef.current)
            mirrorRef.current.scrollTop = event.currentTarget.scrollTop;
        }}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.nativeEvent.isComposing &&
            !composing &&
            event.keyCode !== 229
          ) {
            event.preventDefault();
            if (feedback.complete || revealed) onAdvance();
          }
        }}
      />
    </div>
  );
}
