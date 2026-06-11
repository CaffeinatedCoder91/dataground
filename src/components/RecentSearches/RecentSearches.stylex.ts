import * as stylex from '@stylexjs/stylex';
import {
  colours,
  spacing,
  fontSize,
  borderRadius,
  fontWeight,
  borderWidth,
} from '../../styles/tokens.stylex';
import { TRANSITION_DURATION_FAST } from '../../constants';

export const styles = stylex.create({
  container: {
    marginTop: spacing.medium,
    paddingTop: spacing.medium,
    borderTop: `${borderWidth.thin} solid ${colours.borderDefault}`,
  },
  label: {
    display: 'block',
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colours.textSecondary,
    marginBottom: spacing.small,
  },
  chipContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  chip: {
    paddingTop: spacing.extraSmall,
    paddingRight: spacing.small,
    paddingBottom: spacing.extraSmall,
    paddingLeft: spacing.small,
    backgroundColor: colours.backgroundSecondary,
    border: `${borderWidth.thin} solid ${colours.borderDefault}`,
    borderRadius: borderRadius.base,
    cursor: 'pointer',
    fontSize: fontSize.small,
    color: colours.textPrimary,
    transition: `background-color ${TRANSITION_DURATION_FAST}, border-color ${TRANSITION_DURATION_FAST}`,
    ':hover': {
      backgroundColor: colours.borderDefault,
    },
    ':active': {
      backgroundColor: colours.borderDefault,
    },
  },
  clearButton: {
    fontSize: fontSize.extraSmall,
    color: colours.textSecondary,
    backgroundColor: colours.transparent,
    border: borderWidth.none,
    cursor: 'pointer',
    padding: spacing.none,
    textDecoration: 'underline',
    ':hover': {
      color: colours.textPrimary,
    },
  },
});
