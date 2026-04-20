// Get the full name of the nth month, note that the months are 0-indexed because javascript...
export function getLongMonthName(n: number, lang?: string) {
  return new Date(0, n).toLocaleString(lang, { month: "long" });
}

// Get the shortened name of the nth month, note that the months are 0-indexed
export function getShortMonthName(n: number, lang?: string) {
  return new Date(0, n).toLocaleString(lang, { month: "short" });
}

// Format date (e.g.: 03 nov 2026)
export function formatDateDDMonYYYY(date: Date, lang?: string): string | undefined {
  if (isNaN(date.getTime())) return;

  const day = String(date.getDate()).padStart(2, "0");
  const month = getShortMonthName(date.getMonth(), lang);
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
