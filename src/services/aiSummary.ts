import { GoogleGenAI } from '@google/genai';
import { Game } from './mlbApi';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateGameSummary(games: Game[]): Promise<string> {
  const activeGames = games.filter(g => g.status.abstractGameState === 'Live' || g.status.abstractGameState === 'Final');
  
  if (activeGames.length === 0) {
    return "There are no completed or in-progress games to summarize right now.";
  }

  const promptData = activeGames.map(g => ({
    status: g.status.detailedState,
    away: `${g.teams.away.team.name} (${g.teams.away.score ?? 0})`,
    home: `${g.teams.home.team.name} (${g.teams.home.score ?? 0})`,
    inning: g.linescore?.currentInningOrdinal ? `${g.linescore.inningHalf} ${g.linescore.currentInningOrdinal}` : ''
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `You are a sports broadcaster. Here is the current MLB scoreboard data for today: ${JSON.stringify(promptData)}. 
      Write a quick, engaging 2-3 sentence summary of the action. Focus on completed and in-progress games. 
      Mention any blowouts, close games, or interesting situations. Keep it concise and mobile-friendly.`,
    });
    return response.text || "Summary unavailable.";
  } catch (e) {
    console.error("Gemini error:", e);
    return "Could not generate AI summary at this time.";
  }
}
