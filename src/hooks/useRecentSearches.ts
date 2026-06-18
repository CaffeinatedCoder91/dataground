import { useState } from 'react';
import { MAX_RECENT_SEARCHES, RECENT_SEARCHES_STORAGE_KEY } from '../constants';

interface UseRecentSearchesReturn {
  recentSearches: string[];
  addRecentSearch: (postcode: string) => void;
  clearRecentSearches: () => void;
}

export const useRecentSearches = (): UseRecentSearchesReturn => {
  const normalisePostcode = (postcode: string) => postcode.trim().replace(/\s/g, '').toUpperCase();

  const readInitialSearches = (): string[] => {
    const storedSearches = sessionStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (storedSearches) {
      try {
        const parsedSearches: unknown = JSON.parse(storedSearches);
        if (
          Array.isArray(parsedSearches) &&
          parsedSearches.every((search) => typeof search === 'string')
        ) {
          return parsedSearches;
        }
      } catch (caughtError) {
        if (import.meta.env.DEV) {
          console.error('Failed to read recent searches:', caughtError);
        }
      }
    }

    return [];
  };

  const [recentSearches, setRecentSearches] = useState<string[]>(readInitialSearches);

  const addRecentSearch = (postcode: string) => {
    setRecentSearches((previousSearches) => {
      const formattedPostcode = postcode.trim().toUpperCase();
      const normalisedPostcode = normalisePostcode(formattedPostcode);

      const filteredSearches = previousSearches.filter(
        (search) => normalisePostcode(search) !== normalisedPostcode
      );

      const updatedSearches = [formattedPostcode, ...filteredSearches];

      const trimmedSearches = updatedSearches.slice(0, MAX_RECENT_SEARCHES);

      sessionStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(trimmedSearches));

      return trimmedSearches;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    sessionStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
};
