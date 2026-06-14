import * as stylex from '@stylexjs/stylex';
import {
  borderRadius,
  borderWidth,
  colours,
  fontSize,
  fontWeight,
  outline,
  spacing,
} from '../../styles/tokens.stylex';

export const styles = stylex.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colours.spinner,
    borderWidth: borderWidth.none,
    borderStyle: 'none',
    borderRadius: borderRadius.base,
    color: colours.white,
    cursor: 'pointer',
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.medium,
    marginBottom: spacing.medium,
    paddingTop: spacing.medium,
    paddingRight: spacing.medium,
    paddingBottom: spacing.medium,
    paddingLeft: spacing.medium,
    ':hover': {
      opacity: '0.9',
    },
    ':focus': {
      outlineWidth: borderWidth.base,
      outlineStyle: 'solid',
      outlineColor: colours.spinner,
      outlineOffset: outline.offset,
    },
  },
  buttonCopied: {
    color: colours.riskLow,
  },
});
