// ============================================================
// LEXORA — ErrorBoundary
// Ловит ошибки рендера, чтобы окно не превращалось в пустой белый экран.
//
// ИСКЛЮЧЕНИЕ из AGENTS.md §4.2 (class-компоненты запрещены): в React 18
// error boundary можно реализовать только через class —
// getDerivedStateFromError / componentDidCatch не имеют hook-аналога.
// Это единственный class-компонент в проекте; согласовано с владельцем.
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import './ErrorBoundary.css';

type ErrorBoundaryProps = {
  children: ReactNode;
  /** Когда значение меняется, показанная ошибка сбрасывается (например, при смене маршрута). */
  resetKey?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Privacy by design: никакой телеметрии. Подробности — только в dev-консоли.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  private readonly handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary-card">
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-text">
            This screen hit an unexpected error. Your words and progress are safe.
          </p>
          <div className="error-boundary-actions">
            <Button variant="primary" onClick={this.handleRetry}>
              Try again
            </Button>
            <Button onClick={this.handleReload}>Reload window</Button>
          </div>
        </div>
      </div>
    );
  }
}
