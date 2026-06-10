import * as stylex from '@stylexjs/stylex';
import type { RiskAssessment } from '../../types';
import { RiskCard } from '../RiskCard';
import { styles } from './RiskReport.stylex';

interface RiskReportProps {
  assessment: RiskAssessment;
  postcode: string;
  region: string;
}

export const RiskReport = ({ assessment, postcode, region }: RiskReportProps) => {
  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.heading)}>{postcode}</h2>
      <div {...stylex.props(styles.region)}>{region}</div>

      <div {...stylex.props(styles.scoreSection)}>
        <div {...stylex.props(styles.scoreLabel)}>Overall risk score</div>
        <div>
          <span {...stylex.props(styles.scoreValue)}>
            {assessment.overallScore}
          </span>
          <span {...stylex.props(styles.scoreMax)}> / 10</span>
        </div>
      </div>

      <div {...stylex.props(styles.cardsContainer)}>
        <RiskCard label="Flood risk" level={assessment.floodRisk.level} />
        <RiskCard label="Fire risk" level={assessment.fireRisk.level} />
        <RiskCard label="Subsidence risk" level={assessment.subsidenceRisk.level} />
      </div>

      <p {...stylex.props(styles.summary)}>{assessment.summary}</p>

      <div {...stylex.props(styles.keyFactorsSection)}>
        <div {...stylex.props(styles.keyFactorsTitle)}>Key factors</div>
        <ul {...stylex.props(styles.keyFactorsList)}>
          {assessment.keyFactors.map((factor) => (
            <li key={factor} {...stylex.props(styles.keyFactor)}>
              {factor}
            </li>
          ))}
        </ul>
      </div>

      <div {...stylex.props(styles.disclaimer)}>
        This assessment is AI-generated for demonstration purposes only. It does
        not constitute professional advice.
      </div>
    </div>
  );
};
