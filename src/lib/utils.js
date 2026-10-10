import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names safely with tailwind-merge.
 * @param  {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
