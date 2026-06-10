import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderWidth, margin } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.large,
    borderBottomWidth: borderWidth.thin,
    borderBottomStyle: 'solid',
    borderBottomColor: colours.borderDefault,
    marginBottom: spacing.large,
  },
  title: {
    fontSize: fontSize.tripleExtraLarge,
    fontWeight: fontWeight.bold,
    color: colours.textPrimary,
    marginBottom: spacing.small,
    margin: margin.none,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colours.textSecondary,
    margin: margin.none,
  },
});
