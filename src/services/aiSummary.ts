import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { Game } from './mlbApi';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GameSummary {
  gamePk: number;
  summary: string;
}

export interface AllSummaries {
  gameSummaries: GameSummary[];
}

export async function generateAllSummaries(games: Game[]): Promise<AllSummaries> {
  const activeGames = games.filter(g => g.status.abstractGameState === 'Live' || g.status.abstractGameState === 'Final');
  
  if (activeGames.length === 0) {
    return {
      gameSummaries: []
    };
  }

  const promptData = activeGames.map(g => {
    const getImpactHitters = () => {
      const hitters: any[] = [];
      const processTeam = (side: 'away' | 'home') => {
        const teamObj = g.teams[side];
        const boxscore = teamObj.team?.boxscore || g.boxscore?.teams?.[side];
        if (!boxscore?.players) return;
        Object.values(boxscore.players).forEach((p: any) => {
          const stats = p.stats?.batting;
          if (stats && (stats.hits > 0 || stats.rbi > 0)) {
            hitters.push({ name: p.person?.fullName, stats, team: teamObj.team.name });
          }
        });
      };
      processTeam('away');
      processTeam('home');
      return hitters.sort((a, b) => (b.stats.homeRuns * 4 + b.stats.rbi * 2 + b.stats.hits) - (a.stats.homeRuns * 4 + a.stats.rbi * 2 + a.stats.hits)).slice(0, 5);
    };

    const getPitchers = () => {
      const pitchers: any[] = [];
      const processTeam = (side: 'away' | 'home') => {
        const teamObj = g.teams[side];
        const boxscore = teamObj.team?.boxscore || g.boxscore?.teams?.[side];
        if (!boxscore?.players) return;
        Object.values(boxscore.players).forEach((p: any) => {
          const stats = p.stats?.pitching;
          if (stats && stats.inningsPitched) {
            pitchers.push({ 
              name: p.person?.fullName, 
              stats, 
              seasonStats: p.seasonStats?.pitching,
              team: teamObj.team.name 
            });
          }
        });
      };
      processTeam('away');
      processTeam('home');
      return pitchers.sort((a, b) => parseFloat(b.stats.inningsPitched) - parseFloat(a.stats.inningsPitched)).slice(0, 5);
    };

    const getDecisionStats = () => {
      if (!g.decisions) return null;
      const findStats = (id?: number) => {
        if (!id) return null;
        const player = [...Object.values(g.teams.away.team?.boxscore?.players || {}), 
                        ...Object.values(g.teams.home.team?.boxscore?.players || {}),
                        ...Object.values(g.boxscore?.teams?.away?.players || {}),
                        ...Object.values(g.boxscore?.teams?.home?.players || {})]
                        .find((p: any) => p.person?.id === id);
        return player?.seasonStats?.pitching;
      };

      return {
        winner: g.decisions.winner ? { ...g.decisions.winner, stats: findStats(g.decisions.winner.id) } : null,
        loser: g.decisions.loser ? { ...g.decisions.loser, stats: findStats(g.decisions.loser.id) } : null,
        save: g.decisions.save ? { ...g.decisions.save, stats: findStats(g.decisions.save.id) } : null,
      };
    };

    return {
      id: g.gamePk,
      status: g.status.detailedState,
      abstractStatus: g.status.abstractGameState,
      away: { name: g.teams.away.team.name, score: g.teams.away.score ?? 0 },
      home: { name: g.teams.home.team.name, score: g.teams.home.score ?? 0 },
      inning: g.linescore?.currentInningOrdinal ? `${g.linescore.inningHalf} ${g.linescore.currentInningOrdinal}` : '',
      venue: (g as any).venue?.name || 'the stadium',
      decisionDetails: getDecisionStats(),
      topHitters: getImpactHitters(),
      topPitchers: getPitchers()
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `You are Peter Gammons. Analyze today's MLB action: ${JSON.stringify(promptData)}.
      
      For each game, provide a summary based on its status:
      
      1. If the game is "Live" (abstractStatus: "Live"):
         Provide just a few sentences on the current game stats and key performances so far.
         
      2. If the game is "Final" (abstractStatus: "Final"):
         Provide a full game summary and list the impact players.
         
      Use ONLY the current game stats provided in the data.
      
      Format for each game summary:
      (vs. [Opponent Name])

      🔥 Key Highlights
      Dominant pitching:
      - [Pitcher Name]: [IP] IP, [K] K
      
      Big bats wake up:
      - [Hitter Name]: [Stats: H-AB, HR, RBI]
      
      [If game is Final, add Decisions section]
      Decisions:
      - W: [Winner Name] ([Wins]-[Losses])
      - L: [Loser Name] ([Wins]-[Losses])
      - SV: [Save Name] ([Saves])

      📊 What it means: [Context/Stat]

      Provide your analysis in JSON format with the following structure:
      {
        "gameSummaries": [
          { "gamePk": 12345, "summary": "Full formatted summary string here" }
        ]
      }
      
      Maintain your signature Gammons style: analytical, reverent, and precise.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gameSummaries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  gamePk: { type: Type.NUMBER },
                  summary: { type: Type.STRING }
                },
                required: ["gamePk", "summary"]
              }
            }
          },
          required: ["gameSummaries"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');

    return {
      gameSummaries: result.gameSummaries || []
    };
  } catch (e) {
    console.error("Gemini error:", e);
    return {
      gameSummaries: []
    };
  }
}

