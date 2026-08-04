// frontend/src/components/ErrorBoundary.tsx
// Top-level safety net. Without this, any uncaught render error silently unmounts
// the whole React tree to a blank white screen with no clue what happened. This
// catches that, logs it, and shows a recoverable message instead.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LogoMark } from '@/components/Brand';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
          <LogoMark />
          <div>
            <p className="text-base font-medium text-text-primary">Something went wrong</p>
            <p className="mt-1 max-w-md text-sm text-text-secondary">
              {this.state.error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <Button onClick={() => window.location.assign('/')}>Reload</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
