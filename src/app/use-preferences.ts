import { useState } from 'react';
import {
  parsePreferences,
  readPreferences,
  STORAGE_KEY,
  type Preferences,
} from './preferences';

export function usePreferences() {
  const [state, setState] = useState(readPreferences);
  function update(changes: Partial<Preferences>) {
    const preferences = parsePreferences({ ...state.preferences, ...changes });
    let storageAvailable = true;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      storageAvailable = false;
    }
    setState({ preferences, storageAvailable });
  }
  return { ...state, update };
}
