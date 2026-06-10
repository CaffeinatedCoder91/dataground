import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius, borderWidth, outline } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.small,
    marginBottom: spacing.large,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colours.textPrimary,
  },
  inputWrapper: {
    display: 'flex',
    gap: spacing.small,
  },
  input: {
    flex: 1,
    padding: spacing.medium,
    fontSize: fontSize.base,
    borderWidth: borderWidth.thin,
    borderStyle: 'solid',
    borderColor: colours.borderDefault,
    borderRadius: borderRadius.base,
    fontFamily: 'inherit',
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.spinner,
      outlineOffset: outline.offset,
    },
    ':disabled': {
      backgroundColor: colours.backgroundSecondary,
      color: colours.textMuted,
      cursor: 'not-allowed',
    },
  },
  button: {
    padding: spacing.medium,
    backgroundColor: colours.spinner,
    color: colours.white,
    borderWidth: borderWidth.none,
    borderStyle: 'none',
    borderRadius: borderRadius.base,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
    cursor: 'pointer',
    ':hover:not(:disabled)': {
      opacity: '0.9',
    },
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.spinner,
      outlineOffset: outline.offset,
    },
    ':disabled': {
      opacity: '0.5',
      cursor: 'not-allowed',
    },
  },
  errorMessage: {
    fontSize: fontSize.small,
    color: colours.errorText,
    marginTop: spacing.extraSmall,
  },
});
