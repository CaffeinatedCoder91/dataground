import { describe, it, expect } from 'vitest';
import { trimPostcode, uppercasePostcode, removeInternalSpaces } from './formatters';

describe('formatters', () => {
  it('trims leading and trailing spaces from a postcode', () => {
    expect(trimPostcode('  SW1A 1AA  ')).toBe('SW1A 1AA');
  });

  it('uppercases a lowercase postcode', () => {
    expect(uppercasePostcode('sw1a 1aa')).toBe('SW1A 1AA');
  });

  it('removes internal spaces from a postcode (e.g. "sw1a 1bb" → "SW1A1BB")', () => {
    expect(removeInternalSpaces('SW1A 1BB')).toBe('SW1A1BB');
  });
});
