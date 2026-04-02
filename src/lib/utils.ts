export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatPartners(commander: string): string {
  if (!commander || commander.length === 0) {
    return '';
  }
  return commander.replace(' | ', '\n');
}

// Helper function to parse YYYY-MM-DD as local date to avoid timezone issues
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}