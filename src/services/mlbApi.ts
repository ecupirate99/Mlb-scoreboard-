export interface Team {
  team: {
    id: number;
    name: string;
  };
  score?: number;
  isWinner?: boolean;
}

export interface Game {
  gamePk: number;
  gameDate: string;
  status: {
    abstractGameState: string; // 'Preview', 'Live', 'Final'
    detailedState: string;
    statusCode: string;
  };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningHalf?: string;
  };
  decisions?: {
    winner?: { id: number; fullName: string };
    loser?: { id: number; fullName: string };
    save?: { id: number; fullName: string };
  };
  teams: {
    away: Team & { team: { boxscore?: any } };
    home: Team & { team: { boxscore?: any } };
  };
  boxscore?: {
    teams: {
      away: { players: Record<string, any> };
      home: { players: Record<string, any> };
    };
  };
}

export async function fetchTodayGames(): Promise<Game[]> {
  try {
    // Using comprehensive hydration to ensure all player data is present
    // Adding 'boxscore' at the top level and keeping 'team(boxscore)' for redundancy
    const url = 'https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore,decisions,boxscore,team(boxscore),probablePitcher';
    console.log('Fetching MLB data from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`MLB API Error: ${response.status}`);
    }
    const data = await response.json();
    if (data.dates && data.dates.length > 0) {
      console.log(`Found ${data.dates[0].games.length} games`);
      return data.dates[0].games;
    }
    return [];
  } catch (error) {
    console.error('Error in fetchTodayGames:', error);
    throw error;
  }
}
