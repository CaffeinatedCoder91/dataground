import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderWidth, margin } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.extraLarge,
    borderBottomWidth: borderWidth.thin,
    borderBottomStyle: 'solid',
    borderBottomColor: colours.borderDefault,
    marginBottom: spacing.extraLarge,
  },
  title: {
    fontSize: fontSize.quadrupleExtraLarge,
    fontWeight: fontWeight.bold,
    color: colours.textPrimary,
    marginBottom: spacing.medium,
    margin: margin.none,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colours.textSecondary,
    margin: margin.none,
  },
});
