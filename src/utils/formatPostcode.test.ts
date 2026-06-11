import { describe, it, expect } from 'vitest';
import { formatPostcode } from './formatPostcode';

describe('formatPostcode', () => {
  it('formats SW1A1AA to SW1A 1AA', () => {
    expect(formatPostcode('SW1A1AA')).toBe('SW1A 1AA');
  });

  it('formats e151st to E15 1ST', () => {
    expect(formatPostcode('e151st')).toBe('E15 1ST');
  });

  it('handles already formatted postcode', () => {
    expect(formatPostcode('SW1A 1AA')).toBe('SW1A 1AA');
  });

  it('handles empty string', () => {
    expect(formatPostcode('')).toBe('');
  });

  it('strips invalid characters', () => {
    expect(formatPostcode('SW1A-1@A!A')).toBe('SW1A 1AA');
  });

  it('handles postcode with spaces and special characters', () => {
    expect(formatPostcode('E1 5 1 - S T')).toBe('E15 1ST');
  });

  it('returns only alphanumeric characters when less than 3 characters', () => {
    expect(formatPostcode('SW')).toBe('SW');
  });

  it('returns only alphanumeric characters when exactly 3 characters', () => {
    expect(formatPostcode('SW1')).toBe('SW1');
  });

  it('handles lowercase input', () => {
    expect(formatPostcode('ec1a1bb')).toBe('EC1A 1BB');
  });

  it('handles mixed case input', () => {
    expect(formatPostcode('Sw1a1aA')).toBe('SW1A 1AA');
  });

  it('strips spaces and special characters from longer postcode', () => {
    expect(formatPostcode('M1 1A-E')).toBe('M1 1AE');
  });
});
