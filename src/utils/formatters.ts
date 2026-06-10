export const trimPostcode = (postcode: string): string => {
  return postcode.trim();
};

export const uppercasePostcode = (postcode: string): string => {
  return postcode.toUpperCase();
};

export const removeInternalSpaces = (postcode: string): string => {
  return postcode.replace(/\s+/g, '');
};

export const formatPostcode = (postcode: string): string => {
  return removeInternalSpaces(uppercasePostcode(trimPostcode(postcode)));
};
