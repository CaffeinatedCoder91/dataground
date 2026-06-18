import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('shows "Finding location..." when status is geocoding', () => {
    render(<LoadingState status="geocoding" />);
    expect(screen.getByText('Finding location...')).toBeInTheDocument();
  });

  it('shows the data gathering message when status is analysing', () => {
    render(<LoadingState status="analysing" />);
    expect(screen.getByText('Gathering Environment Agency and BGS data...')).toBeInTheDocument();
  });
});
