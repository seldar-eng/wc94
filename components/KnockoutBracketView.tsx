
import React from 'react';
import { FullKnockoutBracket, BracketMatchup, Teams } from '../types';

interface KnockoutBracketViewProps {
  bracketData: FullKnockoutBracket;
  userTeamKey: string | null;
  onContinue: () => void;
  teamsData: Teams;
}

const KnockoutBracketView: React.FC<KnockoutBracketViewProps> = ({ bracketData, userTeamKey, onContinue, teamsData }) => {
  
  const getTeamDisplayName = (teamKey?: string | null, slotKey?: string) => {
    if (teamKey && teamsData[teamKey]) {
      return teamsData[teamKey].name.toUpperCase();
    }
    return slotKey || "TBD";
  };

  const getMatchClasses = (match: BracketMatchup) => {
    let classes = "p-1.5 border border-cm-gray-light text-base mb-2 bg-black/20 ";
    if (match.isUserTeam1 || match.isUserTeam2) {
      classes += "bg-cm-yellow/20 border-cm-yellow/50 ";
      if ((match.isUserTeam1 && match.winnerKey === match.team1Key) || (match.isUserTeam2 && match.winnerKey === match.team2Key)) {
        classes += "ring-2 ring-green-400 "; // User won
      }
    }
    return classes;
  };

  if (!bracketData || bracketData.rounds.length === 0) {
    return (
      <div className="panel-cm text-center">
        <h2 className="text-2xl mb-3">KNOCKOUT BRACKET</h2>
        <p className="my-4 text-lg">Knockout bracket data is not yet available.</p>
        <button onClick={onContinue} className="btn-pm">CONTINUE</button>
      </div>
    );
  }
  
  const colWidth = Math.floor(100 / bracketData.rounds.length);


  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-4 text-center border-b-2 border-cm-gray-light pb-1">
        KNOCKOUT BRACKET
      </h2>

      <div className="flex flex-row justify-around overflow-x-auto custom-scrollbar pb-3">
        {bracketData.rounds.map((round, roundIndex) => (
          <div key={round.roundName} className="flex flex-col items-center mx-1 min-w-[170px] sm:min-w-[200px]" style={{flexBasis: `${colWidth}%`}}>
            <h3 className="text-lg mb-2 whitespace-nowrap">{round.roundName}</h3>
            <div className="w-full">
              {round.matches.map((match) => {
                const team1Name = getTeamDisplayName(match.team1Key, match.team1SlotKey);
                const team2Name = getTeamDisplayName(match.team2Key, match.team2SlotKey);
                const isTeam1Winner = match.winnerKey && match.team1Key === match.winnerKey;
                const isTeam2Winner = match.winnerKey && match.team2Key === match.winnerKey;

                return (
                  <div key={match.matchId + (match.team1SlotKey || '')} className={getMatchClasses(match)}>
                    <div className={`flex justify-between items-center ${isTeam1Winner ? 'font-bold text-green-400' : (match.winnerKey && !isTeam1Winner && match.team1Key ? 'text-cm-cream/50 line-through' : 'text-cm-cream')}`}>
                      <span>{team1Name}</span>
                      {match.score && match.team1Key && <span>{match.score.split('-')[0]}</span>}
                    </div>
                    <div className="text-center text-cm-cyan my-0.5">vs</div>
                    <div className={`flex justify-between items-center ${isTeam2Winner ? 'font-bold text-green-400' : (match.winnerKey && !isTeam2Winner && match.team2Key ? 'text-cm-cream/50 line-through' : 'text-cm-cream')}`}>
                      <span>{team2Name}</span>
                      {match.score && match.team2Key && <span>{match.score.split('-')[1]}</span>}
                    </div>
                    {match.penalties && <div className="text-center text-sm text-red-400">({match.penalties})</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-4 text-lg">
        CONTINUE <i className="fas fa-angle-double-right ml-1"></i>
      </button>
    </div>
  );
};

export default KnockoutBracketView;