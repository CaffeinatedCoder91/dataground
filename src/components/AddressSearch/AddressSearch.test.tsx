import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressSearch } from './AddressSearch';

describe('AddressSearch', () => {
  let handleSearch: (postcode: string) => void;

  beforeEach(() => {
    handleSearch = vi.fn((postcode: string) => postcode);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the input with correct label', () => {
    render(<AddressSearch onSearch={handleSearch} isLoading={false} />);
    expect(screen.getByLabelText('Enter a UK postcode')).toBeInTheDocument();
  });

  it('renders the submit button with label "Check risk"', () => {
    render(<AddressSearch onSearch={handleSearch} isLoading={false} />);
    expect(screen.getByRole('button', { name: 'Check risk' })).toBeInTheDocument();
  });

  it('calls onSearch with the trimmed and uppercased postcode on form submit', async () => {
    const user = userEvent.setup();
    render(<AddressSearch onSearch={handleSearch} isLoading={false} />);

    const input = screen.getByLabelText('Enter a UK postcode') as HTMLInputElement;
    await user.type(input, ' sw1a 1aa ');
    await user.click(screen.getByRole('button', { name: 'Check risk' }));

    expect(handleSearch).toHaveBeenCalledWith('SW1A 1AA');
  });

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup();
    render(<AddressSearch onSearch={handleSearch} isLoading={false} />);

    const input = screen.getByLabelText('Enter a UK postcode') as HTMLInputElement;
    await user.type(input, 'sw1a 1aa{Enter}');

    expect(handleSearch).toHaveBeenCalledWith('SW1A 1AA');
  });

  it('does not call onSearch when input is empty and shows inline validation message', async () => {
    const user = userEvent.setup();
    render(<AddressSearch onSearch={handleSearch} isLoading={false} />);

    await user.click(screen.getByRole('button', { name: 'Check risk' }));

    expect(handleSearch).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter a postcode.')).toBeInTheDocument();
  });

  it('input is disabled when isLoading is true', () => {
    render(<AddressSearch onSearch={handleSearch} isLoading={true} />);
    expect(screen.getByLabelText('Enter a UK postcode')).toBeDisabled();
  });

  it('button is disabled when isLoading is true', () => {
    render(<AddressSearch onSearch={handleSearch} isLoading={true} />);
    expect(screen.getByRole('button', { name: 'Check risk' })).toBeDisabled();
  });
});
