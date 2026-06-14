export function buildShareUrl(postcode: string): string {
  const baseUrl = window.location.origin + window.location.pathname;
  const cleanedPostcode = postcode.replace(/\s/g, '');
  const url = new URL(baseUrl);
  url.searchParams.set('postcode', cleanedPostcode);
  return url.toString();
}
