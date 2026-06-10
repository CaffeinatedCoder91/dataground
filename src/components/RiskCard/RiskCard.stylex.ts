import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius, shadows } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.large,
    borderRadius: borderRadius.large,
    textAlign: 'center',
    boxShadow: shadows.base,
  },
  containerLow: {
    backgroundColor: colours.riskLow,
  },
  containerMedium: {
    backgroundColor: colours.riskMedium,
  },
  containerHigh: {
    backgroundColor: colours.riskHigh,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colours.white,
    marginBottom: spacing.medium,
  },
  level: {
    fontSize: fontSize.large,
    fontWeight: fontWeight.semibold,
    color: colours.white,
  },
});
