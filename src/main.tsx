import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { mdiRefresh } from '@mdi/js';
import { App } from './app/app';
import { IconButton } from './ui/icon-button';
import '@fontsource-variable/manrope';
import './styles.css';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="fatal-error">
        <h1>Something didn’t load.</h1>
        <p>Please reload to try again. Your saved preferences are kept.</p>
        <IconButton
          label="Reload numspoken"
          path={mdiRefresh}
          onClick={() => location.reload()}
        />
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
