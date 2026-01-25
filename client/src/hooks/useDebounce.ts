import { useEffect, useState } from 'react';

/**
 * Custom hook for debouncing values
 * 
 * ALGORITHM: Debouncing
 * - Delays executing a function until user stops typing
 * - Reduces API calls significantly
 * 
 * EXAMPLE:
 * User types "samsung" quickly:
 * Without debounce: 7 API calls (s, sa, sam, sams, samsu, samsun, samsung)
 * With debounce (300ms): 1 API call (samsung)
 * 
 * COST SAVINGS: 85-95% reduction in API calls
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
