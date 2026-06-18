import * as stylex from '@stylexjs/stylex';
import { memo } from 'react';
import type { FloodRiskData } from '../../types';
import { styles } from './RiskPanel.stylex';

interface RiskPanelProps {
  floodData: FloodRiskData;
}

const SeverityBadge = ({ severity }: { severity: number }) => {
  const getBadgeColor = (sev: number) => {
    if (sev >= 3) return styles.severityHigh;
    if (sev === 2) return styles.severityMedium;
    return styles.severityLow;
  };

  const getSeverityLabel = (sev: number) => {
    if (sev >= 3) return 'High Risk';
    if (sev === 2) return 'Medium Risk';
    return 'Low Risk';
  };

  return (
    <div {...stylex.props(styles.badge, getBadgeColor(severity))}>
      {getSeverityLabel(severity)}
    </div>
  );
};

const RiskPanelComponent = ({ floodData }: RiskPanelProps) => {
  if (floodData.error) {
    return (
      <div {...stylex.props(styles.container, styles.errorState)}>
        <div {...stylex.props(styles.label)}>Environment Agency Flood Risk</div>
        <div {...stylex.props(styles.errorMessage)}>
          {floodData.error}
        </div>
      </div>
    );
  }

  if (!floodData.zone && floodData.warnings.length === 0) {
    return (
      <div {...stylex.props(styles.container, styles.emptyState)}>
        <div {...stylex.props(styles.label)}>Environment Agency Flood Risk</div>
        <div {...stylex.props(styles.emptyMessage)}>
          No flood risk recorded for this area
        </div>
      </div>
    );
  }

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.label)}>Environment Agency Flood Risk</div>

      {floodData.zone && (
        <div {...stylex.props(styles.section)}>
          <div {...stylex.props(styles.zoneLabel)}>Flood Zone</div>
          <div {...stylex.props(styles.zoneValue)}>{floodData.zone}</div>
          {floodData.severity !== null && (
            <SeverityBadge severity={floodData.severity} />
          )}
        </div>
      )}

      {floodData.warnings.length > 0 && (
        <div {...stylex.props(styles.section)}>
          <div {...stylex.props(styles.warningsLabel)}>Active Warnings</div>
          <div {...stylex.props(styles.warningsList)}>
            {floodData.warnings.map((warning) => (
              <div key={`${warning.areaName}-${warning.description}`} {...stylex.props(styles.warningItem)}>
                <div {...stylex.props(styles.warningArea)}>
                  {warning.areaName}
                </div>
                <div {...stylex.props(styles.warningDescription)}>
                  {warning.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div {...stylex.props(styles.disclaimer)}>
        Data from the Environment Agency. Check their official channels for the latest
        updates.
      </div>
    </div>
  );
};

export const RiskPanel = memo(RiskPanelComponent);
