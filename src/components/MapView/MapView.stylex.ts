import * as stylex from '@stylexjs/stylex';
import { colours, fontSize, lineHeight, sizing, spacing } from '../../styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    width: sizing.full,
    height: sizing.full,
    minHeight: sizing.mapMobileHeight,
  },
  mapContainer: {
    width: sizing.full,
    height: sizing.full,
  },
  unavailableMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizing.full,
    height: sizing.full,
    minHeight: sizing.mapMobileHeight,
    padding: spacing.large,
    backgroundColor: colours.backgroundSecondary,
    color: colours.textSecondary,
    fontSize: fontSize.small,
    lineHeight: lineHeight.normal,
    textAlign: 'center',
  },
  loadingFallback: {
    width: sizing.full,
    height: sizing.full,
    minHeight: sizing.mapMobileHeight,
    backgroundColor: colours.backgroundSecondary,
  },
});
