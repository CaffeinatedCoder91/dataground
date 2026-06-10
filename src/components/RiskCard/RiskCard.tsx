import * as stylex from '@stylexjs/stylex';
import type { RiskLevel } from '../../types';
import { styles } from './RiskCard.stylex';

interface RiskCardProps {
  label: string;
  level: RiskLevel;
}

export const RiskCard = ({ label, level }: RiskCardProps) => {
  const levelText = level.charAt(0).toUpperCase() + level.slice(1);

  const containerStyle = level === 'low'
    ? styles.containerLow
    : level === 'medium'
      ? styles.containerMedium
      : styles.containerHigh;

  return (
    <div {...stylex.props(styles.container, containerStyle)}>
      <div {...stylex.props(styles.label)}>{label}</div>
      <div {...stylex.props(styles.level)}>{levelText}</div>
    </div>
  );
};
