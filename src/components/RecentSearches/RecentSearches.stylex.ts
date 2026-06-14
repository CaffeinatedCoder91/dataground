import * as stylex from '@stylexjs/stylex';
import {
  borderWidth,
  colours,
  fontSize,
  fontWeight,
  outline,
  spacing,
} from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.small,
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTopWidth: borderWidth.thin,
    borderTopStyle: 'solid',
    borderTopColor: colours.borderDefault,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colours.textSecondary,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.small,
    marginTop: spacing.extraSmall,
    marginBottom: spacing.extraSmall,
  },
  chip: {
    backgroundColor: colours.transparent,
    borderWidth: borderWidth.none,
    borderStyle: 'none',
    color: colours.textPrimary,
    cursor: 'pointer',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    marginTop: spacing.extraSmall,
    marginRight: spacing.extraSmall,
    marginBottom: spacing.extraSmall,
    padding: spacing.none,
    textDecoration: 'underline',
    ':hover': {
      color: colours.spinner,
    },
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.spinner,
      outlineOffset: outline.offset,
    },
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: colours.transparent,
    borderWidth: borderWidth.none,
    borderStyle: 'none',
    color: colours.errorText,
    cursor: 'pointer',
    fontSize: fontSize.extraSmall,
    marginBottom: spacing.medium,
    padding: spacing.none,
    ':hover': {
      color: colours.errorText,
    },
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.spinner,
      outlineOffset: outline.offset,
    },
  },
});
