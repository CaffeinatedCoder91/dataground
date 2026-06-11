import React from 'react';
import * as stylex from '@stylexjs/stylex';
import { styles } from './ErrorBoundary.stylex';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
    }
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div {...stylex.props(styles.container)}>
          <div {...stylex.props(styles.content)}>
            <h1 {...stylex.props(styles.heading)}>Something went wrong</h1>
            <p {...stylex.props(styles.message)}>
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button
              {...stylex.props(styles.button, styles.buttonHover)}
              onClick={this.handleRefresh}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
