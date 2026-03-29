import { useState, useEffect } from 'react';
import { RefreshCw, Activity, Sparkles } from 'lucide-react';
import { fetchTodayGames, Game } from './services/mlbApi';
import { generateAllSummaries } from './services/aiSummary';
import { GameCard } from './components/GameCard';

export default function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [gameSummaries, setGameSummaries] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setGameSummaries({});
    try {
      const gamesData = await fetchTodayGames();
      
      // Filter to only show Live and Final games as requested
      const activeGames = gamesData.filter(g => 
        g.status.abstractGameState === 'Live' || g.status.abstractGameState === 'Final'
      );
      
      setGames(activeGames);

      if (activeGames.length > 0) {
        try {
          const { gameSummaries: summaries } = await generateAllSummaries(activeGames);
          const summaryMap = summaries.reduce((acc, s) => ({ ...acc, [s.gamePk]: s.summary }), {});
          setGameSummaries(summaryMap);
        } catch (aiErr) {
          console.error('AI Summary failed:', aiErr);
        }
      }
    } catch (err) {
      console.error('App loadData error:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Quintin's AI MLB Scoreboard</h1>
          </div>
          <button 
            onClick={loadData} 
            disabled={loading}
            className="p-2 rounded-full hover:bg-blue-800 transition-colors disabled:opacity-50"
            aria-label="Refresh games"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Games List */}
        <section>
          <h2 className="font-bold text-lg mb-4 text-gray-800">Today's Games</h2>
          
          {loading && games.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-32 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : games.length === 0 && !loading ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">No active or completed games to show.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {games.map(game => (
                <GameCard 
                  key={game.gamePk} 
                  game={game} 
                  loading={loading}
                  summary={gameSummaries[game.gamePk]}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
