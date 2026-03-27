import { Trophy } from 'lucide-react';
import { Game, Team } from '../services/mlbApi';

export function GameCard({ game }: { game: Game }) {
  const isLive = game.status.abstractGameState === 'Live';
  const isFinal = game.status.abstractGameState === 'Final';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isLive ? 'bg-red-100 text-red-700' : isFinal ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
          {isLive ? 'Live' : isFinal ? 'Final' : game.status.detailedState}
        </span>
        {isLive && game.linescore && (
          <span className="text-sm font-medium text-gray-600">
            {game.linescore.inningHalf} {game.linescore.currentInningOrdinal}
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <TeamRow team={game.teams.away} isWinner={isFinal && game.teams.away.isWinner} />
        <TeamRow team={game.teams.home} isWinner={isFinal && game.teams.home.isWinner} />
      </div>
    </div>
  );
}

function TeamRow({ team, isWinner }: { team: Team, isWinner?: boolean }) {
  const logoUrl = `https://www.mlbstatic.com/team-logos/${team.team.id}.svg`;
  
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full border border-gray-100 p-1">
          <img 
            src={logoUrl} 
            alt={`${team.team.name} logo`} 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className={`font-semibold ${isWinner ? 'text-gray-900' : 'text-gray-700'}`}>
          {team.team.name}
        </span>
        {isWinner && <Trophy className="w-4 h-4 text-yellow-500" />}
      </div>
      <span className={`font-bold text-lg ${isWinner ? 'text-gray-900' : 'text-gray-700'}`}>
        {team.score ?? '-'}
      </span>
    </div>
  );
}
