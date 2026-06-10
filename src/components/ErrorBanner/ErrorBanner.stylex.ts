import * as stylex from '@stylexjs/stylex';
import { colours, spacing, sizing, fontSize, borderWidth, borderRadius, lineHeight, outline } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.medium,
    padding: spacing.medium,
    backgroundColor: colours.errorBackground,
    borderWidth: borderWidth.thin,
    borderStyle: 'solid',
    borderColor: colours.errorBorder,
    borderRadius: borderRadius.base,
    marginBottom: spacing.large,
  },
  message: {
    flex: 1,
    fontSize: fontSize.small,
    color: colours.errorText,
    lineHeight: lineHeight.normal,
  },
  dismissButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizing.extraSmall,
    height: sizing.extraSmall,
    padding: spacing.none,
    backgroundColor: colours.transparent,
    borderStyle: 'none',
    color: colours.errorText,
    cursor: 'pointer',
    fontSize: fontSize.extraLarge,
    lineHeight: lineHeight.tight,
    ':hover': {
      opacity: '0.7',
    },
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.errorText,
      outlineOffset: outline.offset,
    },
  },
});
