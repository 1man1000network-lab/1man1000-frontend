/**
 * Check if a campaign has expired.
 * The end date is an absolute deadline — campaigns close at the exact
 * configured time, not at end of day.
 * @param endDate - The campaign end date (ISO string or Date object)
 * @returns boolean - true if campaign has expired, false otherwise
 */
export function isCampaignExpired(endDate: string | Date | null | undefined): boolean {
  if (!endDate) return false;

  return new Date() > new Date(endDate);
}

/**
 * Format a datetime for an `<input type="datetime-local">` value.
 * Produces `YYYY-MM-DDTHH:mm` in the browser's local timezone.
 */
export function toDateTimeInputValue(
  value: string | Date | null | undefined,
): string | undefined {
  if (!value) return undefined;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
