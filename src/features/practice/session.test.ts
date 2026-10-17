import { expect, it } from 'vitest';
import { createSession, sessionReducer } from './session';

it('reveal is read-only and counts only when departing', () => {
  const revealed = sessionReducer(createSession(42), {
    type: 'reveal',
    answer: 'forty-two',
  });
  expect(revealed.departed).toBe(0);
  expect(sessionReducer(revealed, { type: 'edit', value: 'cheat' }).value).toBe(
    'forty-two',
  );
  const next = sessionReducer(revealed, { type: 'next', number: 43, limit: 1 });
  expect(next.complete).toBe(true);
  expect(next.departed).toBe(1);
  expect(sessionReducer(next, { type: 'next', number: 44, limit: 1 })).toBe(
    next,
  );
  expect(sessionReducer(next, { type: 'restart', number: 1 })).toMatchObject({
    departed: 0,
    complete: false,
    revealed: false,
    value: '',
  });
});
it('continuous practice never ends and every transition clears the answer', () => {
  let state = createSession(5);
  for (let i = 0; i < 100; i++) {
    state = sessionReducer(state, { type: 'edit', value: 'five' });
    state = sessionReducer(state, { type: 'next', number: 5, limit: null });
  }
  expect(state).toMatchObject({
    departed: 100,
    complete: false,
    value: '',
    questionId: 100,
  });
});
