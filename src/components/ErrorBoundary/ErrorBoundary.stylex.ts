import * as stylex from '@stylexjs/stylex';
import {
  borderRadius,
  borderWidth,
  colours,
  fontSize,
  fontWeight,
  layout,
  lineHeight,
  shadows,
  sizing,
  spacing,
  typography,
} from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: layout.fullHeight,
    backgroundColor: colours.backgroundPrimary,
    padding: spacing.extraLarge,
  },
  content: {
    textAlign: 'center',
    maxWidth: sizing.errorBoundaryContentMaxWidth,
  },
  heading: {
    fontSize: fontSize.tripleExtraLarge,
    fontWeight: fontWeight.bold,
    color: colours.textPrimary,
    marginBottom: spacing.medium,
    fontFamily: typography.fontFamily,
  },
  message: {
    fontSize: fontSize.base,
    color: colours.textSecondary,
    marginBottom: spacing.extraLarge,
    lineHeight: lineHeight.relaxed,
    fontFamily: typography.fontFamily,
  },
  button: {
    backgroundColor: colours.spinner,
    color: colours.white,
    borderWidth: borderWidth.none,
    padding: `${spacing.medium} ${spacing.extraLarge}`,
    borderRadius: borderRadius.base,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    cursor: 'pointer',
    boxShadow: shadows.base,
    fontFamily: typography.fontFamily,
    transition: 'background-color 0.2s ease-in-out',
  },
  buttonHover: {
    ':hover': {
      backgroundColor: colours.spinner,
    },
  },
});
