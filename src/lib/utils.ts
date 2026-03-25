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

const COLOR_NAMES: Record<string, string> = {
  'W': 'White',
  'U': 'Blue',
  'B': 'Black',
  'R': 'Red',
  'G': 'Green',
  'WU': 'Azorius',
  'UB': 'Dimir',
  'BR': 'Rakdos',
  'RG': 'Gruul',
  'GW': 'Selesnya',
  'WB': 'Orzhov',
  'UR': 'Izzet',
  'BG': 'Golgari',
  'RW': 'Boros',
  'GU': 'Simic',
  'WUB': 'Esper',
  'UBR': 'Grixis',
  'BRG': 'Jund',
  'RGW': 'Naya',
  'GWU': 'Bant',
  'WBG': 'Abzan',
  'URW': 'Jeskai',
  'BGU': 'Sultai',
  'RWB': 'Mardu',
  'GUR': 'Temur',
  'WUBR': 'Yore-Tiller',
  'UBRG': 'Glint-Eye',
  'WRBG': 'Dune-Brood',
  'WURG': 'Ink-Treader',
  'WUBRG': 'Five Color',
  'C': 'Colorless',
};

const MANA_SYMBOLS: Record<string, string> = {
  'W': 'https://svgs.scryfall.io/card-symbols/W.svg',
  'U': 'https://svgs.scryfall.io/card-symbols/U.svg',
  'B': 'https://svgs.scryfall.io/card-symbols/B.svg',
  'R': 'https://svgs.scryfall.io/card-symbols/R.svg',
  'G': 'https://svgs.scryfall.io/card-symbols/G.svg',
  'C': 'https://svgs.scryfall.io/card-symbols/C.svg',
};

function getColorName(color: string): [string, string] {
  const sorted = color.split('').sort().join('');

  for (const colorIdentity in COLOR_NAMES) {
    const colorSorted = colorIdentity.split('').sort().join('');
    if (sorted === colorSorted) {
      return [COLOR_NAMES[colorIdentity], colorIdentity];
    }
  } 

  return [color, color];
}

export function formatColorIdentity(colors: string | null): { name: string; symbols: string } {
  if (!colors || colors === '') {
    colors = 'C';
  }
  
  const [name, sortedSymbols] = getColorName(colors);
  const symbols = sortedSymbols.split('').map(c => `<img src="${MANA_SYMBOLS[c] || ''}" class="inline w-5 h-5" />`).join('');
  
  return { name, symbols };
}