import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delayInMilliseconds: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayInMilliseconds);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delayInMilliseconds]);

  return debouncedValue;
};
