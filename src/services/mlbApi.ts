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
  teams: {
    away: Team;
    home: Team;
  };
  linescore?: {
    currentInning?: number;
    currentInningOrdinal?: string;
    inningHalf?: string;
  };
}

export async function fetchTodayGames(): Promise<Game[]> {
  const response = await fetch('https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore');
  if (!response.ok) {
    throw new Error('Failed to fetch MLB schedule');
  }
  const data = await response.json();
  if (data.dates && data.dates.length > 0) {
    return data.dates[0].games;
  }
  return [];
}
