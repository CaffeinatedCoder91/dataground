import * as stylex from '@stylexjs/stylex';
import { styles } from './LoadingState.stylex';

interface LoadingStateProps {
  status: 'geocoding' | 'analysing';
}

export const LoadingState = ({ status }: LoadingStateProps) => {
  const message = status === 'geocoding'
    ? 'Finding location...'
    : 'Gathering Environment Agency and BGS data...';

  return (
    <div {...stylex.props(styles.container)} aria-live="polite">
      <div {...stylex.props(styles.spinner)} />
      <div {...stylex.props(styles.message)}>{message}</div>
    </div>
  );
};
