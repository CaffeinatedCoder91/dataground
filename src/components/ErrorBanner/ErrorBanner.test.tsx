import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from './ErrorBanner';

describe('ErrorBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the error message', () => {
    render(
      <ErrorBanner
        message="This is an error"
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  it('renders the dismiss button', () => {
    render(
      <ErrorBanner
        message="Error"
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Dismiss error' })).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnDismiss = vi.fn();

    render(
      <ErrorBanner
        message="Error"
        onDismiss={mockOnDismiss}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss error' }));

    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('has aria-live="assertive"', () => {
    const { container } = render(
      <ErrorBanner
        message="Error"
        onDismiss={vi.fn()}
      />
    );

    expect(container.firstChild).toHaveAttribute('aria-live', 'assertive');
  });
});
