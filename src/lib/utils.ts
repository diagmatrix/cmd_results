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

// Mana symbol URLs from Scryfall
export const MANA_SYMBOLS: Record<string, string> = {
  'W': 'https://svgs.scryfall.io/card-symbols/W.svg',
  'U': 'https://svgs.scryfall.io/card-symbols/U.svg',
  'B': 'https://svgs.scryfall.io/card-symbols/B.svg',
  'R': 'https://svgs.scryfall.io/card-symbols/R.svg',
  'G': 'https://svgs.scryfall.io/card-symbols/G.svg',
  'C': 'https://svgs.scryfall.io/card-symbols/C.svg',
};

export function getManaSymbolUrl(color: string): string | undefined {
  return MANA_SYMBOLS[color];
}

// MTG color identity to CSS color mapping
// Dark mode uses muted tones, light mode uses softer pastels
const COLOR_MAP_DARK: Record<string, string> = {
  W: '#4a4840',  // Warm dark cream/ivory
  U: '#2d3a4d',  // Dark blue
  B: '#3a3638',  // Dark gray-purple
  R: '#4d3232',  // Dark red
  G: '#2d4038',  // Dark green
  C: '#3f3f46',  // Neutral dark gray for colorless
};

const COLOR_MAP_LIGHT: Record<string, string> = {
  W: '#fef9c3',  // Warm yellow-cream
  U: '#bfdbfe',  // Light blue
  B: '#d6d3d1',  // Light gray
  R: '#fecaca',  // Light red/pink
  G: '#bbf7d0',  // Light green
  C: '#e7e5e4',  // Neutral light gray
};

// Standard MTG color ordering: WUBRG
const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];

function sortColorIdentity(colorIdentity: string): string[] {
  const colors = colorIdentity.toUpperCase().split('');
  return COLOR_ORDER.filter(c => colors.includes(c));
}

export function getColorIdentityGradient(colorIdentity: string | undefined, isDark: boolean): string {
  const colorMap = isDark ? COLOR_MAP_DARK : COLOR_MAP_LIGHT;
  
  if (!colorIdentity || colorIdentity === 'C' || colorIdentity.length === 0) {
    // Colorless - return solid color
    return colorMap.C;
  }

  const sortedColors = sortColorIdentity(colorIdentity);
  
  if (sortedColors.length === 0) {
    return colorMap.C;
  }
  
  if (sortedColors.length === 1) {
    // Single color - solid background
    return colorMap[sortedColors[0]] || colorMap.C;
  }

  // Multi-color - create gradient with distinct color bands
  // Each color gets a solid section with short transitions between them
  const gradientColors = sortedColors.map(c => colorMap[c] || colorMap.C);
  const numColors = gradientColors.length;
  const transitionSize = 10; // percentage for each transition zone
  const totalTransitions = numColors - 1;
  const availableSpace = 100 - (transitionSize * totalTransitions);
  const bandSize = availableSpace / numColors;
  
  const stops: string[] = [];
  let position = 0;
  
  gradientColors.forEach((color, index) => {
    // Solid band start
    stops.push(`${color} ${position}%`);
    position += bandSize;
    // Solid band end
    stops.push(`${color} ${position}%`);
    
    // Add transition space (except after last color)
    if (index < numColors - 1) {
      position += transitionSize;
    }
  });

  return `linear-gradient(60deg, ${stops.join(', ')})`;
}

export function getEDHRecUrl(commanderName: string): string {
  const withoutPartners = commanderName.replace(' | ', ' ');
  const withoutWhitespace = withoutPartners.replace(/\s+/g, '-');
  const withoutNonAlpha = withoutWhitespace.replace(/[^a-zA-Z0-9-]/g, '');
  const lowercased = withoutNonAlpha.toLowerCase();
  return `https://edhrec.com/commanders/${lowercased}`;
}
