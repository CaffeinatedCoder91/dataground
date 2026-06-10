import * as stylex from '@stylexjs/stylex';
import { colours, spacing, fontSize, fontWeight, borderRadius, lineHeight } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.large,
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
    marginBottom: spacing.large,
  },
  scoreSection: {
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: fontSize.small,
    color: colours.textSecondary,
    marginBottom: spacing.small,
  },
  scoreValue: {
    fontSize: fontSize.quadrupleExtraLarge,
    fontWeight: fontWeight.bold,
    color: colours.textPrimary,
    lineHeight: lineHeight.tight,
  },
  scoreMax: {
    fontSize: fontSize.large,
    color: colours.textSecondary,
    display: 'inline',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing.medium,
    marginBottom: spacing.large,
  },
  summary: {
    fontSize: fontSize.small,
    lineHeight: lineHeight.relaxed,
    color: colours.textPrimary,
    marginBottom: spacing.large,
  },
  keyFactorsSection: {
    marginBottom: spacing.large,
  },
  keyFactorsTitle: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
    color: colours.textPrimary,
    marginBottom: spacing.small,
  },
  keyFactorsList: {
    paddingLeft: spacing.large,
  },
  keyFactor: {
    fontSize: fontSize.small,
    color: colours.textPrimary,
    marginBottom: spacing.small,
    lineHeight: lineHeight.relaxed,
  },
  disclaimer: {
    fontSize: fontSize.extraSmall,
    color: colours.textMuted,
    fontStyle: 'italic',
    lineHeight: lineHeight.normal,
  },
});
