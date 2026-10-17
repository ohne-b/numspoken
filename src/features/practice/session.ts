export interface Session {
  number: number;
  value: string;
  revealed: boolean;
  departed: number;
  complete: boolean;
  questionId: number;
}
export type SessionAction =
  | { type: 'edit'; value: string }
  | { type: 'reveal'; answer: string }
  | { type: 'next'; number: number; limit: number | null }
  | { type: 'restart'; number: number };

export function createSession(number: number): Session {
  return {
    number,
    value: '',
    revealed: false,
    departed: 0,
    complete: false,
    questionId: 0,
  };
}
export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'edit':
      return state.revealed || state.complete
        ? state
        : { ...state, value: action.value };
    case 'reveal':
      return state.complete
        ? state
        : { ...state, value: action.answer, revealed: true };
    case 'next': {
      if (state.complete) return state;
      const departed = state.departed + 1;
      return {
        ...createSession(action.number),
        departed,
        questionId: state.questionId + 1,
        complete: action.limit !== null && departed >= action.limit,
      };
    }
    case 'restart':
      return {
        ...createSession(action.number),
        questionId: state.questionId + 1,
      };
  }
}
