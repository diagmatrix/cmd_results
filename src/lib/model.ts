export interface PlayerData {
  player: string;
  commander: string;
}

export interface CommanderName {
  name: string;
  has_been_played: boolean;
}

export interface AvailableCommander {
  name: string;
  color_identity: string;
  image_uri: string | null;
}

export interface Game {
  id: string;
  game_date: string;
  player_data: PlayerData[];
  winner: string;
  starting_player: string;
}

export interface GameFormData {
  playerData: PlayerData[];
  winner: string;
  startingPlayer: string;
  gameDate: string;
}

interface GameDates {
  date: string;
  games: number;
  wins: number;
};

const COLOR_NAMES: Record<string, string> = {
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

export class CommanderData {
  commander: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;
  players: string[];
  gameDates: GameDates[];
  colorIdentity?: string;
  imageUris?: string[];

  constructor(commander: string, games_played: number, games_won: number, games_started: number, games_won_and_started: number, players: string[], game_dates: GameDates[], color_identity?: string, image_uris?: string[]) {
    this.commander = commander;
    this.games = games_played;
    this.wins = games_won;
    this.started = games_started;
    this.startedWon = games_won_and_started;
    this.players = players;
    this.gameDates = game_dates;
    this.colorIdentity = color_identity;
    this.imageUris = image_uris;
  }

  winrate(): string {
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }

  colorIdentityName(): string {
    const colors = this.colorIdentity || 'C';
    const [name] = getColorName(colors);
    return name;
  }

  colorIdentitySymbolUrls(): string[] {
    const colors = this.colorIdentity || 'C';
    const [, sortedSymbols] = getColorName(colors);
    return sortedSymbols
      .split('')
      .map(c => MANA_SYMBOLS[c])
      .filter((url): url is string => !!url);
  }
}

export class GameStats {
  player?: string;
  commander?: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;
  uniqueCommanders?: number;
  colorIdentity?: string;
  imageUri?: string;
  _winrate?: number;

  constructor(player?: string, commander?: string, games: number = 0, wins: number = 0, started: number = 0, startedWon: number = 0, uniqueCommanders?: number, color_identity?: string, winrate?: number, imageUri?: string) {
    this.player = player;
    this.commander = commander;
    this.games = games;
    this.wins = wins;
    this.started = started;
    this.startedWon = startedWon;
    this.uniqueCommanders = uniqueCommanders;
    this.colorIdentity = color_identity;
    this._winrate = winrate;
    this.imageUri = imageUri;
  }

  winrate(): string {
    if (this._winrate !== undefined) {
      return this._winrate.toFixed(0);
    }
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }

  getType(): 'player' | 'commander' {
    if (this.player) return 'player';
    return 'commander';
  }

  colorIdentitySymbolUrls(): string[] {
    if (this.getType() === 'player') {
      return [];
    }

    const colors = this.colorIdentity || 'C';
    const [, sortedSymbols] = getColorName(colors);
    return sortedSymbols
      .split('')
      .map(c => MANA_SYMBOLS[c])
      .filter((url): url is string => !!url);
  }
}

export class Stats {
  games: number;
  players: number;
  commanders: number;

  constructor(games: number, players: number, commanders: number) {
    this.games = games;
    this.players = players;
    this.commanders = commanders;
  }
}
