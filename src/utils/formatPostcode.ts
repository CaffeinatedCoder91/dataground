export function formatPostcode(rawPostcode: string): string {
  if (!rawPostcode) {
    return '';
  }

  const alphanumeric = rawPostcode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (alphanumeric.length <= 3) {
    return alphanumeric;
  }

  const outwardCode = alphanumeric.slice(0, -3);
  const inwardCode = alphanumeric.slice(-3);

  return `${outwardCode} ${inwardCode}`;
}
