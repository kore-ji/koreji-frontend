/**
 * Formats a Date object to YYYY-MM-DD string format
 * @param date - Date object or null
 * @returns Formatted date string or empty string if date is null
 */
export const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};