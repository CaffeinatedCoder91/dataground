import * as stylex from '@stylexjs/stylex';
import { memo } from 'react';
import type { RiskAssessment } from '../../types';
import { styles } from './RiskReport.stylex';

interface RiskReportProps {
  assessment: RiskAssessment;
  postcode: string;
  region: string;
}

const ratingColors = {
  Incomplete: { bg: '#f3f4f6', text: '#374151', border: '#9ca3af' },
  Low: { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
  Medium: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  High: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  Critical: { bg: '#7f1d1d', text: '#fecaca', border: '#dc2626' },
};

const RiskReportComponent = ({ assessment, postcode, region }: RiskReportProps) => {
  const colors = ratingColors[assessment.overallRating];

  return (
    <div {...stylex.props(styles.container)}>
      <h2 {...stylex.props(styles.heading)}>{postcode}</h2>
      <div {...stylex.props(styles.region)}>{region}</div>

      <div
        style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: colors.bg,
          borderLeft: `4px solid ${colors.border}`,
          marginBottom: '24px',
        }}
      >
        <div style={{ fontSize: '14px', color: colors.text, fontWeight: '600' }}>
          Overall Risk Rating
        </div>
        <div style={{ fontSize: '28px', color: colors.text, fontWeight: 'bold', marginTop: '8px' }}>
          {assessment.overallRating}
        </div>
      </div>

      <p {...stylex.props(styles.summary)}>{assessment.summary}</p>

      <div {...stylex.props(styles.keyFactorsSection)}>
        <div {...stylex.props(styles.keyFactorsTitle)}>Risk Breakdown by Category</div>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '14px' }}>
              Flood Risk
            </h4>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
              {assessment.riskBreakdown.flood}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8b96a3' }}>
              Source: Environment Agency
            </p>
          </div>

          <div>
            <h4 style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '14px' }}>
              Subsidence Risk
            </h4>
            <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
              {assessment.riskBreakdown.subsidence}
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8b96a3' }}>
              Source: British Geological Survey (BGS)
            </p>
          </div>
        </div>
      </div>

      <div {...stylex.props(styles.disclaimer)}>
        Risk assessment synthesised by Claude from Environment Agency and BGS data.
        This is for informational purposes only and does not constitute professional advice.
      </div>
    </div>
  );
};

// Memoized because completed reports are read-only until a new assessment arrives.
export const RiskReport = memo(RiskReportComponent);
