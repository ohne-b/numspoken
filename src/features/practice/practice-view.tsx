import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { IconButtonElement } from 'material/elements';
import { Icon } from '@mdi/react';
import { mdiCheck, mdiEyeOutline, mdiRefresh, mdiSkipNext } from '@mdi/js';
import type { Preferences } from '../../app/preferences';
import { formatNumber, languageFor } from '../../lib/languages';
import { loadConverter, type Answer } from '../../lib/number-words';
import { loadFont } from '../../lib/fonts';
import { createNumberSequence } from '../../lib/random-number';
import { validateAnswer } from '../../lib/validate-answer';
import { IconButton } from '../../ui/icon-button';
import { AnswerField } from './answer-field';
import { createSession, sessionReducer } from './session';

export function PracticeView({
  preferences,
  active,
}: {
  preferences: Preferences;
  active: boolean;
}) {
  const [sequence] = useState(() =>
    createNumberSequence(preferences.min, preferences.max),
  );
  const [session, dispatch] = useReducer(
    sessionReducer,
    sequence.first,
    createSession,
  );
  const [resource, setResource] = useState<{
    key: string;
    answer?: Answer;
    error?: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [composing, setComposing] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(
    () => !document.hidden && document.hasFocus(),
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restartRef = useRef<IconButtonElement>(null);
  const previousPreferences = useRef(preferences);
  const language = languageFor(preferences.locale);
  const resourceKey = `${language.code}:${session.number}:${session.questionId}:${retry}`;
  const answer = resource?.key === resourceKey ? resource.answer : undefined;
  const failed = resource?.key === resourceKey && resource.error;
  const feedback = validateAnswer(
    session.value,
    answer?.candidates ?? [],
    language,
    preferences.forgiving,
  );
  const correct =
    !!answer && feedback.complete && !session.revealed && !composing;

  useLayoutEffect(() => {
    if (previousPreferences.current === preferences) return;
    previousPreferences.current = preferences;
    setRetry(0);
    setComposing(false);
    dispatch({ type: 'restart', number: sequence.next() });
  }, [preferences, sequence]);

  useEffect(() => {
    let current = true;
    void (async () => {
      try {
        const convert = await loadConverter(language.code);
        const result = convert(session.number);
        await loadFont(language.font, result.canonical);
        if (current) setResource({ key: resourceKey, answer: result });
      } catch {
        if (current) setResource({ key: resourceKey, error: true });
      }
    })();
    return () => {
      current = false;
    };
  }, [language.code, language.font, resourceKey, session.number]);

  useEffect(() => {
    const update = () => setVisible(!document.hidden && document.hasFocus());
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    window.addEventListener('blur', update);
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
      window.removeEventListener('blur', update);
    };
  }, []);

  useEffect(() => {
    if (!active || !answer) return;
    if (session.complete) restartRef.current?.focus();
    else if (window.matchMedia('(pointer: fine)').matches)
      inputRef.current?.focus({ preventScroll: true });
  }, [active, answer, session.complete]);

  const next = useCallback(() => {
    if (session.complete) return;
    setComposing(false);
    inputRef.current?.focus({ preventScroll: true });
    const limit = preferences.mode === 'round' ? preferences.roundLength : null;
    const complete = limit !== null && session.departed + 1 >= limit;
    dispatch({
      type: 'next',
      number: complete ? session.number : sequence.next(),
      limit,
    });
  }, [
    preferences.mode,
    preferences.roundLength,
    sequence,
    session.complete,
    session.departed,
    session.number,
  ]);

  useEffect(() => {
    if (!active || !visible || !focused || !correct || session.complete) return;
    const timer = window.setTimeout(next, 800);
    return () => window.clearTimeout(timer);
  }, [
    active,
    visible,
    focused,
    correct,
    session.complete,
    session.questionId,
    session.value,
    next,
  ]);

  return (
    <section
      className="practice-view"
      hidden={!active}
      aria-label="Number practice"
    >
      {session.complete ? (
        <div className="round-complete">
          <Icon
            path={mdiCheck}
            size={1.3}
            className="success-icon"
            aria-hidden="true"
          />
          <h1>Round complete</h1>
          <p>A little practice goes a long way.</p>
          <IconButton
            ref={restartRef}
            label="Start another round"
            path={mdiRefresh}
            onClick={() =>
              dispatch({
                type: 'restart',
                number: sequence.next(),
              })
            }
          />
        </div>
      ) : (
        <div className="practice-content">
          <h1
            className={`number${session.number >= 1_000_000 ? ' number-long' : ''}`}
            aria-label={`Write ${formatNumber(session.number, language)} in words`}
          >
            <span dir="ltr">{formatNumber(session.number, language)}</span>
          </h1>
          <p id="practice-instructions" className="sr-only">
            Write this number in {language.label}. Matching characters turn
            green. Reveal shows the answer; skip moves to the next number.
          </p>
          {!failed ? (
            <AnswerField
              value={session.value}
              language={language}
              feedback={feedback}
              revealed={session.revealed}
              composing={composing}
              loading={!answer}
              inputRef={inputRef}
              onChange={(value) => dispatch({ type: 'edit', value })}
              onComposition={setComposing}
              onFocusChange={setFocused}
              onAdvance={next}
            />
          ) : (
            <div className="load-state" role="status">
              {failed ? (
                <>
                  <p>
                    {retry > 0
                      ? 'Still couldn’t load this language. Try reloading the page.'
                      : 'Couldn’t load this language.'}
                  </p>
                  <IconButton
                    label={
                      retry > 0 ? 'Reload numspoken' : 'Retry loading language'
                    }
                    path={mdiRefresh}
                    onClick={() =>
                      retry > 0
                        ? location.reload()
                        : setRetry((value) => value + 1)
                    }
                  />
                </>
              ) : (
                'Getting your number ready…'
              )}
            </div>
          )}
          <div
            className="feedback-line"
            id="practice-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {correct ? (
              <>
                <Icon path={mdiCheck} size={0.65} aria-hidden="true" />
                <span className="sr-only">
                  Correct. The next number will appear shortly.
                </span>
              </>
            ) : session.revealed ? (
              'Answer revealed'
            ) : (
              <span className="sr-only">
                {feedback.errorStart !== null && !composing
                  ? 'Check the underlined character.'
                  : ''}
              </span>
            )}
          </div>
          <div className="practice-actions">
            <IconButton
              label="Reveal answer"
              path={mdiEyeOutline}
              disabled={!answer || session.revealed || composing}
              onClick={() => {
                if (answer)
                  dispatch({ type: 'reveal', answer: answer.canonical });
              }}
            />
            <IconButton
              label={session.revealed ? 'Next number' : 'Skip number'}
              path={mdiSkipNext}
              disabled={!answer || composing}
              onClick={next}
            />
          </div>
        </div>
      )}
    </section>
  );
}
