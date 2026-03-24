export interface PlayerData {
  player: string;
  commander: string;
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
  created_at: string;
}

export class GameStats {
  player?: string;
  commander?: string;
  games: number;
  wins: number;
  started: number;
  startedWon: number;
  uniqueCommanders?: number;

  constructor(player?: string, commander?: string, games: number = 0, wins: number = 0, started: number = 0, startedWon: number = 0, uniqueCommanders?: number) {
    this.player = player;
    this.commander = commander;
    this.games = games;
    this.wins = wins;
    this.started = started;
    this.startedWon = startedWon;
    this.uniqueCommanders = uniqueCommanders;
  }

  winrate(): string {
    return this.games > 0 ? ((this.wins / this.games) * 100).toFixed(0) : '0';
  }

  getType(): 'player' | 'commander' | 'combo' {
    if (this.player && this.commander) return 'combo';
    if (this.player) return 'player';
    return 'commander';
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
