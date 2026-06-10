import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskReport } from './RiskReport';
import type { RiskAssessment } from '../../types';

describe('RiskReport', () => {
  const mockAssessment: RiskAssessment = {
    postcode: 'SW1A1AA',
    floodRisk: {
      level: 'low',
      score: 2,
    },
    fireRisk: {
      level: 'medium',
      score: 5,
    },
    subsidenceRisk: {
      level: 'high',
      score: 8,
    },
    overallScore: 5,
    summary: 'This area has moderate risk.',
    keyFactors: ['Factor one', 'Factor two', 'Factor three'],
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

  it('renders the overall score', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders the summary paragraph', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('This area has moderate risk.')).toBeInTheDocument();
  });

  it('renders all three key factors', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Factor one')).toBeInTheDocument();
    expect(screen.getByText('Factor two')).toBeInTheDocument();
    expect(screen.getByText('Factor three')).toBeInTheDocument();
  });

  it('renders the disclaimer text', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(
      screen.getByText(/This assessment is AI-generated for demonstration purposes only/)
    ).toBeInTheDocument();
  });

  it('renders three RiskCard components', () => {
    render(
      <RiskReport
        assessment={mockAssessment}
        postcode="SW1A1AA"
        region="Greater London"
      />
    );
    expect(screen.getByText('Flood risk')).toBeInTheDocument();
    expect(screen.getByText('Fire risk')).toBeInTheDocument();
    expect(screen.getByText('Subsidence risk')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});
