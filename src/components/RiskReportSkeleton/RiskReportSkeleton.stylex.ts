import * as stylex from '@stylexjs/stylex';
import {
  borderRadius,
  borderWidth,
  breakpoints,
  colours,
  opacity,
  sizing,
  spacing,
} from '../../styles/tokens.stylex';

const pulseKeyframes = stylex.keyframes({
  '0%, 100%': {
    opacity: opacity.skeletonPulseHigh,
  },
  '50%': {
    opacity: opacity.skeletonPulseLow,
  },
});

const skeletonStyle = stylex.create({
  pulse: {
    animation: `${pulseKeyframes} 2s ease-in-out infinite`,
  },
});

export const styles = stylex.create({
  container: {
    padding: spacing.extraLarge,
    backgroundColor: colours.backgroundSecondary,
    borderRadius: borderRadius.base,
  },
  heading: {
    width: sizing.skeletonHeadingWidth,
    height: sizing.skeletonHeadingHeight,
    marginBottom: spacing.small,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  region: {
    width: sizing.skeletonRegionWidth,
    height: sizing.skeletonRegionHeight,
    marginBottom: spacing.extraLarge,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  scoreSection: {
    marginBottom: spacing.extraLarge,
    textAlign: 'center',
  },
  scoreLabel: {
    width: sizing.skeletonScoreLabelWidth,
    height: sizing.skeletonScoreLabelHeight,
    marginBottom: spacing.medium,
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  scoreValue: {
    display: 'block',
    width: sizing.skeletonScoreValueWidth,
    height: sizing.skeletonScoreValueHeight,
    marginBottom: spacing.medium,
    marginLeft: 'auto',
    marginRight: 'auto',
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
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
  card: {
    height: sizing.skeletonCardHeight,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  summary: {
    marginBottom: spacing.extraLarge,
    paddingBottom: spacing.extraLarge,
    borderBottomWidth: borderWidth.thin,
    borderBottomStyle: 'solid',
    borderBottomColor: colours.borderDefault,
  },
  summaryLine: {
    width: sizing.full,
    height: sizing.skeletonLineHeight,
    marginBottom: spacing.medium,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  summaryLineShort: {
    width: sizing.skeletonShortLineWidth,
    height: sizing.skeletonLineHeight,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  keyFactorsSection: {
    marginBottom: spacing.extraLarge,
  },
  keyFactorsTitle: {
    width: sizing.skeletonKeyFactorsTitleWidth,
    height: sizing.skeletonKeyFactorsTitleHeight,
    marginBottom: spacing.medium,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  keyFactorsList: {
    paddingLeft: spacing.extraLarge,
  },
  keyFactor: {
    width: sizing.full,
    height: sizing.skeletonKeyFactorHeight,
    marginBottom: spacing.medium,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
  disclaimer: {
    width: sizing.full,
    height: sizing.skeletonLineHeight,
    backgroundColor: colours.borderDefault,
    borderRadius: borderRadius.small,
    ...skeletonStyle.pulse,
  },
});
