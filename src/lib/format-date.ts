// Single shared date-display format for the whole app: DD-MM-YYYY.
// Deliberately plain zero-padded digits rather than toLocaleDateString's
// "11 Sept 2026" style — consistent everywhere, and unambiguous
// regardless of the viewer's locale.
export function formatDate(d: Date | string): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
