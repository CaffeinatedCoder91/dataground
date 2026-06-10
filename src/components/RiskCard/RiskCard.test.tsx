import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as stylex from '@stylexjs/stylex';
import { RiskCard } from './RiskCard';
import { styles } from './RiskCard.stylex';

describe('RiskCard', () => {
  it('renders the label', () => {
    render(<RiskCard label="Flood risk" level="low" />);
    expect(screen.getByText('Flood risk')).toBeInTheDocument();
  });

  it('renders "Low" when level is low', () => {
    render(<RiskCard label="Test" level="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders "Medium" when level is medium', () => {
    render(<RiskCard label="Test" level="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders "High" when level is high', () => {
    render(<RiskCard label="Test" level="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('applies low risk colour token when level is low', () => {
    const { container } = render(<RiskCard label="Flood risk" level="low" />);
    const expectedClassName = stylex.props(styles.containerLow).className;
    expect(expectedClassName).toBeDefined();
    if (expectedClassName) {
      expect(container.firstElementChild).toHaveClass(expectedClassName);
    }
  });

  it('applies medium risk colour token when level is medium', () => {
    const { container } = render(<RiskCard label="Flood risk" level="medium" />);
    const expectedClassName = stylex.props(styles.containerMedium).className;
    expect(expectedClassName).toBeDefined();
    if (expectedClassName) {
      expect(container.firstElementChild).toHaveClass(expectedClassName);
    }
  });

  it('applies high risk colour token when level is high', () => {
    const { container } = render(<RiskCard label="Flood risk" level="high" />);
    const expectedClassName = stylex.props(styles.containerHigh).className;
    expect(expectedClassName).toBeDefined();
    if (expectedClassName) {
      expect(container.firstElementChild).toHaveClass(expectedClassName);
    }
  });
});
