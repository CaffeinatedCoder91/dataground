import { useState, useEffect } from 'react';
import { MAX_RECENT_SEARCHES, RECENT_SEARCHES_STORAGE_KEY } from '../constants';

interface UseRecentSearchesReturn {
  recentSearches: string[];
  addRecentSearch: (postcode: string) => void;
  clearRecentSearches: () => void;
}

export const useRecentSearches = (): UseRecentSearchesReturn => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const normalisePostcode = (postcode: string) => postcode.trim().replace(/\s/g, '').toUpperCase();

  useEffect(() => {
    const storedSearches = sessionStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    if (storedSearches) {
      try {
        const parsedSearches: unknown = JSON.parse(storedSearches);
        if (
          Array.isArray(parsedSearches) &&
          parsedSearches.every((search) => typeof search === 'string')
        ) {
          setRecentSearches(parsedSearches);
        }
      } catch (caughtError) {
        if (import.meta.env.DEV) {
          console.error('Failed to read recent searches:', caughtError);
        }
      }
    }
  }, []);

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
