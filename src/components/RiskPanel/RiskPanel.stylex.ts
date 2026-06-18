import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: '#f5f5f5',
    borderLeft: '4px solid #2563eb',
  },
  emptyState: {
    borderLeft: '4px solid #d1d5db',
  },
  errorState: {
    borderLeft: '4px solid #dc2626',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  },
  emptyMessage: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  errorMessage: {
    fontSize: '0.875rem',
    color: '#991b1b',
    fontWeight: 600,
  },
  section: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
  zoneLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  zoneValue: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  severityHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  severityMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  severityLow: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  warningsLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.5rem',
  },
  warningsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  warningItem: {
    padding: '0.75rem',
    backgroundColor: '#fef2f2',
    borderRadius: '0.375rem',
    borderLeft: '3px solid #dc2626',
  },
  warningArea: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#7f1d1d',
    marginBottom: '0.25rem',
  },
  warningDescription: {
    fontSize: '0.875rem',
    color: '#991b1b',
    lineHeight: 1.4,
  },
  disclaimer: {
    marginTop: '1rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  subsidenceHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  subsidenceMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  subsidenceLow: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  amenitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  amenityCategory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  amenityCategoryLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  amenityItem: {
    padding: '0.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.375rem',
    borderLeft: '3px solid #3b82f6',
    fontSize: '0.875rem',
    color: '#1f2937',
  },
  amenityName: {
    fontWeight: 600,
    marginBottom: '0.25rem',
  },
  amenityDistance: {
    fontSize: '0.75rem',
    color: '#6b7280',
  },
});
