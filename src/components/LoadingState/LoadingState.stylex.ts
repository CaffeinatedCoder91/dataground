import * as stylex from '@stylexjs/stylex';
import { colours, spacing, sizing, fontSize, borderWidth, borderRadius } from '../../styles/tokens.stylex';

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
    animation: 'spin 1s linear infinite',
  },
  message: {
    fontSize: fontSize.base,
    color: colours.textPrimary,
  },
});
