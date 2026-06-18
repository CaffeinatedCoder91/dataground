import * as stylex from '@stylexjs/stylex';
import { memo } from 'react';
import type { FloodRiskData, GeologyData, AmenitiesData } from '../../types';
import { styles } from './RiskPanel.stylex';

interface RiskPanelProps {
  floodData: FloodRiskData;
  geologyData?: GeologyData;
  amenitiesData?: AmenitiesData;
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

const SubsidenceBadge = ({ risk }: { risk: string }) => {
  const getBadgeColor = (riskLevel: string) => {
    if (riskLevel === 'High') return styles.subsidenceHigh;
    if (riskLevel === 'Medium') return styles.subsidenceMedium;
    if (riskLevel === 'Low') return styles.subsidenceLow;
    return styles.subsidenceLow;
  };

  return (
    <div {...stylex.props(styles.badge, getBadgeColor(risk))}>
      {risk} Subsidence Risk
    </div>
  );
};

const RiskPanelComponent = ({ floodData, geologyData, amenitiesData }: RiskPanelProps) => {
  const hasFloodData = floodData.zone || floodData.warnings.length > 0 || floodData.error;
  const hasGeologyData = geologyData !== undefined;
  const hasAmenitiesData = amenitiesData !== undefined;

  if (!hasFloodData && !hasGeologyData && !hasAmenitiesData) {
    return null;
  }

  return (
    <div {...stylex.props(styles.container)}>
      {hasFloodData && (
        <>
          <div {...stylex.props(styles.label)}>Environment Agency Flood Risk</div>

          {floodData.error ? (
            <div {...stylex.props(styles.errorMessage)}>
              {floodData.error}
            </div>
          ) : (
            <>
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
            </>
          )}
        </>
      )}

      {hasGeologyData && (
        <div {...stylex.props(styles.section)}>
          <div {...stylex.props(styles.label)}>BGS Superficial Geology</div>
          {geologyData!.error ? (
            <div {...stylex.props(styles.emptyMessage)}>
              {geologyData!.error}
            </div>
          ) : (
            <>
              {geologyData!.formation && (
                <div {...stylex.props(styles.zoneValue)}>{geologyData!.formation}</div>
              )}
              <SubsidenceBadge risk={geologyData!.subsidenceRisk} />
              <div {...stylex.props(styles.disclaimer)}>
                {geologyData!.disclaimer}
              </div>
            </>
          )}
        </div>
      )}

      {hasAmenitiesData && (
        <div {...stylex.props(styles.section)}>
          <div {...stylex.props(styles.label)}>Nearby Amenities (500m)</div>
          {amenitiesData!.error ? (
            <div {...stylex.props(styles.emptyMessage)}>
              {amenitiesData!.error}
            </div>
          ) : amenitiesData!.amenities.length > 0 ? (
            <div {...stylex.props(styles.amenitiesList)}>
              {amenitiesData!.amenities.map((amenity, idx) => (
                <div key={idx} {...stylex.props(styles.amenityItem)}>
                  <div {...stylex.props(styles.amenityName)}>{amenity.name}</div>
                  <div {...stylex.props(styles.amenityDistance)}>
                    {amenity.type} • {amenity.distance}m away
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div {...stylex.props(styles.emptyMessage)}>
              No amenities found in this area
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RiskPanel = memo(RiskPanelComponent);
