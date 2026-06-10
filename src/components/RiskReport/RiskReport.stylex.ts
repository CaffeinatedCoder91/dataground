import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius, lineHeight, borderWidth, breakpoints } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.extraLarge,
    backgroundColor: colours.backgroundSecondary,
    borderRadius: borderRadius.base,
  },
  heading: {
    fontSize: fontSize.doubleExtraLarge,
    fontWeight: fontWeight.semibold,
    color: colours.textPrimary,
    marginBottom: spacing.small,
  },
  region: {
    fontSize: fontSize.small,
    color: colours.textSecondary,
    marginBottom: spacing.extraLarge,
  },
  scoreSection: {
    marginBottom: spacing.extraLarge,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: fontSize.small,
    color: colours.textSecondary,
    marginBottom: spacing.medium,
  },
  scoreValue: {
    fontSize: fontSize.quadrupleExtraLarge,
    fontWeight: fontWeight.bold,
    color: colours.textPrimary,
    lineHeight: lineHeight.tight,
  },
  scoreMax: {
    fontSize: fontSize.base,
    color: colours.textSecondary,
    display: 'inline',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing.medium,
    marginBottom: spacing.extraLarge,
    [`@media (max-width: ${breakpoints.mobile})`]: {
      gridTemplateColumns: '1fr',
    },
  },
  summary: {
    fontSize: fontSize.small,
    lineHeight: lineHeight.relaxed,
    color: colours.textPrimary,
    marginBottom: spacing.extraLarge,
    paddingBottom: spacing.extraLarge,
    borderBottomWidth: borderWidth.thin,
    borderBottomStyle: 'solid',
    borderBottomColor: colours.borderDefault,
  },
  keyFactorsSection: {
    marginBottom: spacing.extraLarge,
  },
  keyFactorsTitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colours.textPrimary,
    marginBottom: spacing.medium,
  },
  keyFactorsList: {
    paddingLeft: spacing.extraLarge,
  },
  keyFactor: {
    fontSize: fontSize.small,
    color: colours.textPrimary,
    marginBottom: spacing.medium,
    lineHeight: lineHeight.relaxed,
  },
  disclaimer: {
    fontSize: fontSize.extraSmall,
    color: colours.textMuted,
    fontStyle: 'italic',
    lineHeight: lineHeight.normal,
  },
});
