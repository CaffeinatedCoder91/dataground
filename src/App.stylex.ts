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
    [`@media (max-width: ${breakpoints.tablet})`]: {
      gridTemplateColumns: '1fr',
    },
  },
  leftPanel: {
    padding: spacing.large,
    overflowY: 'auto',
    backgroundColor: colours.backgroundPrimary,
  },
  rightPanel: {
    backgroundColor: colours.backgroundSecondary,
    [`@media (max-width: ${breakpoints.tablet})`]: {
      minHeight: sizing.mapMobileHeight,
    },
  },
});
