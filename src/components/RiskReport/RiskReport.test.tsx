import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskReport } from './RiskReport';
import type { RiskAssessment } from '../../types';

describe('RiskReport', () => {
  const mockAssessment: RiskAssessment = {
    postcode: 'SW1A1AA',
    overallRating: 'Medium',
    summary: 'This area has moderate flood and subsidence risk based on real UK government data.',
    riskBreakdown: {
      flood: 'Located in flood zone 2 with severity level 2. Environment Agency data shows no active warnings.',
      subsidence: 'Geological formation shows medium subsidence risk from clay-rich alluvium deposits.',
    },
  };

  it('renders the postcode heading', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('SW1A1AA');
  });

  it('renders the region label', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Greater London')).toBeInTheDocument();
  });

  it('renders the overall rating badge', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders the summary paragraph', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText(/This area has moderate flood and subsidence risk/)).toBeInTheDocument();
  });

  it('renders risk breakdown categories', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Flood Risk')).toBeInTheDocument();
    expect(screen.getByText('Subsidence Risk')).toBeInTheDocument();
  });

  it('renders source attribution', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Source: Environment Agency')).toBeInTheDocument();
    expect(screen.getByText('Source: British Geological Survey (BGS)')).toBeInTheDocument();
  });

  it('renders the updated disclaimer with attribution', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(
      screen.getByText(/Risk assessment synthesised by Claude from Environment Agency and BGS data/)
    ).toBeInTheDocument();
  });
});
