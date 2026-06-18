import * as stylex from '@stylexjs/stylex';
import { colours, spacing, sizing, fontSize, borderWidth, borderRadius } from '../../styles/tokens.stylex';

const spinKeyframes = stylex.keyframes({
  from: {
    transform: 'rotate(0deg)',
  },
  to: {
    transform: 'rotate(360deg)',
  },
});

export const styles = stylex.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.medium,
    padding: spacing.large,
  },
  spinner: {
    width: sizing.extraSmall,
    height: sizing.extraSmall,
    borderRadius: borderRadius.round,
    borderStyle: 'solid',
    borderWidth: borderWidth.thick,
    borderColor: colours.borderDefault,
    borderTopColor: colours.spinner,
    animationName: spinKeyframes,
    animationDuration: '1s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  message: {
    fontSize: fontSize.base,
    color: colours.textPrimary,
  },
});
