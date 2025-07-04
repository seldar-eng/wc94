
import React from 'react';
import { MatchData } from '../types';
import { TEAMS_DATA } from '../constants';

interface RoundResultsViewProps {
  roundName: string;
  matches: MatchData[];
  onContinue: () => void;
}

const RoundResultsView: React.FC<RoundResultsViewProps> = ({ roundName, matches, onContinue }) => {
  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">{roundName} - RESULTS</h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar p-1 border border-cm-gray-light bg-black/20">
        {matches.map(match => (
          <div key={match.id} className="p-2 border-b border-cm-gray-light/50 last:border-b-0 text-base">
            <p className="font-bold text-cm-cream">
              {TEAMS_DATA[match.team1]?.name.toUpperCase() || match.team1.toUpperCase()} {match.score} {TEAMS_DATA[match.team2]?.name.toUpperCase() || match.team2.toUpperCase()}
            </p>
            <p className="text-cm-cream/80">
              <span className="italic">({match.venue})</span>
              {match.penalties && <span className="font-bold text-red-400"> (PENS: {match.penalties.toUpperCase()})</span>}
            </p>
            {match.goalScorers.length > 0 && (
              <ul className="list-disc list-inside ml-3 text-cm-cyan/80 text-sm">
                {match.goalScorers.map((gs, idx) => (
                  <li key={idx}>{gs.player.toUpperCase()} ({TEAMS_DATA[gs.team]?.name.toUpperCase()}) {gs.minute}'</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-3 text-lg">
        <i className="fas fa-arrow-right"></i>CONTINUE
      </button>
    </div>
  );
};

export default RoundResultsView;