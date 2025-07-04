
import React from 'react';
import { MatchData } from '../types';
import { TEAMS_DATA } from '../constants';

interface GameRoundFixturesViewProps {
  roundName: string;
  matches: MatchData[];
  userTeamKey: string | null;
  userMatch: MatchData | null; 
  onContinueToUserMatch: () => void; 
  onSimulateRound: () => void; 
  allHistoricalMatches: MatchData[];
}

const GameRoundFixturesView: React.FC<GameRoundFixturesViewProps> = ({ 
    roundName, 
    matches, 
    userTeamKey,
    userMatch,
    onContinueToUserMatch,
    onSimulateRound,
    allHistoricalMatches
}) => {
  
  const userMatchDisplay = userMatch ? 
    `${TEAMS_DATA[userMatch.team1]?.name.toUpperCase()} VS ${TEAMS_DATA[userMatch.team2]?.name.toUpperCase()}` : 
    "NO MATCH FOR YOUR TEAM THIS ROUND.";

  const isKnockoutStage = roundName.toLowerCase().includes("round of 16") ||
                          roundName.toLowerCase().includes("quarter-finals") ||
                          roundName.toLowerCase().includes("semi-finals") ||
                          roundName.toLowerCase().includes("finals");
  
  let knockoutFlavorText = "";
  if (isKnockoutStage) {
    if (roundName.toLowerCase().includes("finals")) {
        knockoutFlavorText = "THE FINAL STAGE! LEGENDS ARE MADE HERE!";
    } else if (roundName.toLowerCase().includes("semi-finals")) {
        knockoutFlavorText = "THE SEMI-FINALS! ONE STEP FROM THE ULTIMATE SHOWDOWN!";
    } else if (roundName.toLowerCase().includes("quarter-finals")) {
        knockoutFlavorText = "THE QUARTER-FINALS! THE PRESSURE IS IMMENSE!";
    } else if (roundName.toLowerCase().includes("round of 16")) {
        knockoutFlavorText = "WELCOME TO THE ROUND OF 16! EVERY MATCH IS A KNOCKOUT BATTLE!";
    }
  }


  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">{roundName} - FIXTURES</h2>
      
      {isKnockoutStage && knockoutFlavorText && (
        <p className="text-lg text-cm-yellow italic text-center mb-3 p-2 bg-black/20 border border-cm-yellow/50">
          {knockoutFlavorText}
        </p>
      )}

      <div className="mb-3 p-2 border border-cm-gray-light bg-black/20">
        <h3 className="text-xl mb-1">UPCOMING MATCHES:</h3>
        {matches.length > 0 ? (
          <ul className="text-base text-cm-cream space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar p-1 bg-cm-gray-dark/50 border border-cm-gray-light">
            {matches.map(match => (
              <li key={match.id} className={`p-1 ${ (userTeamKey && (match.team1 === userTeamKey || match.team2 === userTeamKey)) ? 'font-bold bg-cm-yellow/20' : ''}`}>
                {TEAMS_DATA[match.team1]?.name.toUpperCase()} vs {TEAMS_DATA[match.team2]?.name.toUpperCase()}
                <span className="text-cm-cyan/80 text-sm"> ({match.venue})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-base italic">NO FIXTURES FOR THIS ROUND.</p>
        )}
      </div>

      {userMatch && (
        <div className="mb-3 p-3 border-2 border-cm-yellow bg-cm-yellow/10 text-center">
            <p className="text-lg font-bold text-cm-yellow">YOUR NEXT MATCH:</p>
            <p className="text-lg text-cm-cream">{userMatchDisplay}</p>
        </div>
      )}
      
      {userMatch ? (
        <button type="button" onClick={onContinueToUserMatch} className="btn-pm w-full text-lg">
          <i className="fas fa-arrow-right"></i>GO TO YOUR MATCH
        </button>
      ) : (
        <button type="button" onClick={onSimulateRound} className="btn-pm w-full text-lg">
            <i className="fas fa-forward"></i>SIMULATE ROUND & VIEW RESULTS
        </button>
      )}
    </div>
  );
};

export default GameRoundFixturesView;