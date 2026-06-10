import * as stylex from '@stylexjs/stylex';
import { breakpoints, colours, layout, sizing, spacing } from './styles/tokens.stylex';

export const styles = stylex.create({
  container: {
    minHeight: layout.fullHeight,
    backgroundColor: colours.backgroundPrimary,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: `${layout.leftPanelWidth} 1fr`,
    gap: spacing.none,
    maxWidth: sizing.full,
    height: layout.fullHeight,
    [`@media (max-width: ${breakpoints.tablet})`]: {
      gridTemplateColumns: '1fr',
      height: 'auto',
    },
  },
  leftPanel: {
    padding: spacing.extraLarge,
    overflowY: 'auto',
    backgroundColor: colours.backgroundPrimary,
    height: layout.fullHeight,
  },
  rightPanel: {
    backgroundColor: colours.backgroundSecondary,
    paddingRight: spacing.extraLarge,
    overflow: 'hidden',
    height: layout.fullHeight,
    [`@media (max-width: ${breakpoints.tablet})`]: {
      height: 'auto',
      minHeight: sizing.mapMobileHeight,
      paddingRight: spacing.none,
    },
  },
});
