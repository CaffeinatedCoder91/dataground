import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.medium,
    borderRadius: borderRadius.base,
    textAlign: 'center',
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
    marginBottom: spacing.small,
  },
  level: {
    fontSize: fontSize.large,
    fontWeight: fontWeight.semibold,
    color: colours.white,
  },
});
