import * as stylex from '@stylexjs/stylex';
import { styles } from './RiskReportSkeleton.stylex';

export const RiskReportSkeleton = () => {
  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.heading)} />
      <div {...stylex.props(styles.region)} />

      <div {...stylex.props(styles.scoreSection)}>
        <div {...stylex.props(styles.scoreLabel)} />
        <div {...stylex.props(styles.scoreValue)} />
      </div>

      <div {...stylex.props(styles.cardsContainer)}>
        <div {...stylex.props(styles.card)} />
        <div {...stylex.props(styles.card)} />
        <div {...stylex.props(styles.card)} />
      </div>

      <div {...stylex.props(styles.summary)}>
        <div {...stylex.props(styles.summaryLine)} />
        <div {...stylex.props(styles.summaryLine)} />
        <div {...stylex.props(styles.summaryLineShort)} />
      </div>

      <div {...stylex.props(styles.keyFactorsSection)}>
        <div {...stylex.props(styles.keyFactorsTitle)} />
        <ul {...stylex.props(styles.keyFactorsList)}>
          <li>
            <div {...stylex.props(styles.keyFactor)} />
          </li>
          <li>
            <div {...stylex.props(styles.keyFactor)} />
          </li>
          <li>
            <div {...stylex.props(styles.keyFactor)} />
          </li>
        </ul>
      </div>

      <div {...stylex.props(styles.disclaimer)} />
    </div>
  );
};
