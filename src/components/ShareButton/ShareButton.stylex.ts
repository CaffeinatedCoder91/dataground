import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  button: {
    backgroundColor: colours.backgroundSecondary,
    border: `${borderWidth.thin} solid ${colours.borderDefault}`,
    borderRadius: borderRadius.base,
    padding: `${spacing.small} ${spacing.medium}`,
    marginTop: spacing.medium,
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colours.textPrimary,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    ':hover': {
      backgroundColor: colours.backgroundPrimary,
    },
    ':active': {
      opacity: 0.8,
    },
  },
});
