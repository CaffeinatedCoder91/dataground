import * as stylex from '@stylexjs/stylex';
import { styles } from './ErrorBanner.stylex';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorBanner = ({ message, onDismiss }: ErrorBannerProps) => {
  return (
    <div {...stylex.props(styles.container)} aria-live="assertive">
      <div {...stylex.props(styles.message)}>{message}</div>
      <button
        {...stylex.props(styles.dismissButton)}
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ×
      </button>
    </div>
  );
};
