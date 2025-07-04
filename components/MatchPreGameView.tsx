
import React from 'react';
import { MatchData, Teams, Formations as FormationsType, PlayerCategory } from '../types';

interface MatchPreGameViewProps {
  match: MatchData;
  userTeamKey: string;
  onGoToTeamSelection: () => void;
  teamsData: Teams;
  formationsData: FormationsType;
}

const MatchPreGameView: React.FC<MatchPreGameViewProps> = ({ 
  match, 
  userTeamKey, 
  onGoToTeamSelection,
  teamsData,
  formationsData
}) => {
  const team1Name = teamsData[match.team1]?.name.toUpperCase() || match.team1.toUpperCase();
  const team2Name = teamsData[match.team2]?.name.toUpperCase() || match.team2.toUpperCase();
  const isUserTeam1 = match.team1 === userTeamKey;
  const opponentKey = isUserTeam1 ? match.team2 : match.team1;
  const opponentSquad = teamsData[opponentKey]?.squad || [];

  let opponentTendency = "Balanced";
  let suggestedFormations: string[] = ["4-4-2"];

  if (opponentSquad.length > 0) {
    const counts: Record<PlayerCategory, number> = { GK: 0, DF: 0, MF: 0, FW: 0, Unknown: 0 };
    opponentSquad.forEach(player => {
      counts[player.category] = (counts[player.category] || 0) + 1;
    });

    const totalPlayers = opponentSquad.length - counts.GK;
    const fwPercentage = totalPlayers > 0 ? (counts.FW / totalPlayers) * 100 : 0;
    const dfPercentage = totalPlayers > 0 ? (counts.DF / totalPlayers) * 100 : 0;

    if (counts.FW >= 3 && fwPercentage > 30) {
        opponentTendency = "Attacking";
        suggestedFormations = ["5-3-2", "4-5-1"];
    } else if (counts.DF >=5 || (counts.DF >=4 && dfPercentage > 40)) {
        opponentTendency = "Defensive";
        suggestedFormations = ["4-3-3", "3-5-2"];
    } else {
        opponentTendency = "Balanced";
        suggestedFormations = ["4-4-2", "4-3-3"];
    }
    if (suggestedFormations.length > 1 && Math.random() < 0.5) {
        suggestedFormations = [suggestedFormations[0]];
    } else if (suggestedFormations.length > 2) {
        suggestedFormations = suggestedFormations.slice(0,2);
    }
  }


  return (
    <div className="panel-cm text-center">
      <h2 className="text-2xl mb-3 border-b-2 border-cm-gray-light pb-1">MATCH PREVIEW</h2>
      
      <div className="my-4">
        <p className={`text-3xl font-bold ${isUserTeam1 ? 'text-cm-yellow' : 'text-cm-cream'}`}>{team1Name}</p>
        <p className="text-2xl font-bold text-cm-cyan my-1">VS</p>
        <p className={`text-3xl font-bold ${!isUserTeam1 ? 'text-cm-yellow' : 'text-cm-cream'}`}>{team2Name}</p>
      </div>

      <div className="text-lg text-cm-cream mb-4">
        <p><strong>DATE:</strong> {match.date.toUpperCase()}</p>
        <p><strong>VENUE:</strong> {match.venue.toUpperCase()}</p>
        <p><strong>ROUND:</strong> {match.round.toUpperCase()}</p>
      </div>

      <div className="my-4 p-3 border-2 border-dashed border-cm-gray-light/50 bg-black/20 text-left">
        <h3 className="text-xl mb-2">TACTICAL BRIEFING:</h3>
        <p className="text-lg text-cm-cream mb-1">
          Your opponent, <span className="font-semibold">{teamsData[opponentKey]?.name.toUpperCase()}</span>, appears to favor a
          <span className="font-semibold text-cm-yellow"> {opponentTendency.toUpperCase()}</span> approach.
        </p>
        <p className="text-lg text-cm-cream">
          Consider using formations like: <span className="font-semibold text-cm-yellow">{suggestedFormations.join(" or ")}</span> to counter their style.
        </p>
      </div>

      <button type="button" onClick={onGoToTeamSelection} className="btn-pm w-full text-xl">
        <i className="fas fa-users-cog"></i>GO TO TEAM SELECTION
      </button>
    </div>
  );
};

export default MatchPreGameView;