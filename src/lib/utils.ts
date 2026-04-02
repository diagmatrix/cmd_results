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