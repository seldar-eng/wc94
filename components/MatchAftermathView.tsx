
import React from 'react';
import { MatchData, GoalScorer, MatchEvent, Player, Teams } from '../types';
import { TEAMS_DATA } from '../constants';
import { calculateScoreFromMatchEvents } from '../utils/gameLogic';

interface MatchAftermathViewProps {
  match: MatchData;
  onContinue: () => void;
  userTeamKey: string | null; 
  showPlayerSpotlightModal: (player: Player, teamName: string, goals: number) => void; 
  teamsData: Teams; 
  processedMatches: MatchData[]; 
}

const getPressConferenceSnippet = (match: MatchData, userTeamKey: string | null, teamsDataArg: Teams): string => {
  if (!userTeamKey || (match.team1 !== userTeamKey && match.team2 !== userTeamKey)) {
    return ""; 
  }

  const scoreAt120 = match.extraTimeScore ? calculateScoreFromMatchEvents(match.team1, match.team2, match.goalScorers, 120) : calculateScoreFromMatchEvents(match.team1, match.team2, match.goalScorers, 90);

  let userGoals, opponentGoals;
  const userIsTeam1 = match.team1 === userTeamKey;

  if (match.penalties) {
    let userWonShootout = false;
    const penParts = match.penalties.split(' ');
    const penTeam1Identity = penParts[0];
    const penScores = penParts[1].split('-');
    const penScore1Num = parseInt(penScores[0], 10);
    const penScore2Num = parseInt(penScores[1], 10);

    const userTeamDetails = teamsDataArg[userTeamKey];
    if (userTeamDetails && (userTeamDetails.name === penTeam1Identity || userTeamKey === penTeam1Identity)) {
        userWonShootout = penScore1Num > penScore2Num;
    } else {
        userWonShootout = penScore2Num > penScore1Num;
    }

    userGoals = userWonShootout ? 1 : 0;
    opponentGoals = userWonShootout ? 0 : 1;
  } else {
    userGoals = userIsTeam1 ? scoreAt120.score1 : scoreAt120.score2;
    opponentGoals = userIsTeam1 ? scoreAt120.score2 : scoreAt120.score1;
  }
  
  const userTeamName = teamsDataArg[userTeamKey]?.name || "Your Team";

  if (userGoals > opponentGoals) {
    if (match.penalties) return `"${userTeamName.toUpperCase()} CLINCH IT ON PENALTIES! NERVES OF STEEL!"`;
    if (userGoals - opponentGoals >= 2) {
      return `"${userTeamName.toUpperCase()} put on a commanding display today. The manager hailed a 'perfect tactical execution'."`;
    }
    return `"${userTeamName.toUpperCase()} dug deep for a hard-fought victory! The fans are ecstatic!"`;
  } else if (userGoals < opponentGoals) {
     if (match.penalties) return `"${userTeamName.toUpperCase()} SUFFERS PENALTY HEARTBREAK. SO CLOSE, YET SO FAR."`;
    if (opponentGoals - userGoals >= 2) {
      return `"${userTeamName.toUpperCase()} were outclassed today. The opposition was simply too strong."`;
    }
    return `"Heartbreak for ${userTeamName.toUpperCase()}. It's back to the drawing board after that narrow defeat."`;
  } else { 
    return `"A tense battle ends all square. Both managers will be mulling over what might have been. Points shared."`;
  }
};

const MatchAftermathView: React.FC<MatchAftermathViewProps> = ({ 
  match, 
  onContinue, 
  userTeamKey,
  showPlayerSpotlightModal,
  teamsData, 
  processedMatches 
}) => {
  const team1Name = teamsData[match.team1]?.name.toUpperCase() || match.team1.toUpperCase();
  const team2Name = teamsData[match.team2]?.name.toUpperCase() || match.team2.toUpperCase();
  const pressSnippet = getPressConferenceSnippet(match, userTeamKey, teamsData);

  const scoreAt90 = calculateScoreFromMatchEvents(match.team1, match.team2, match.goalScorers, 90);
  const scoreAt120 = (match.extraTimeScore || match.penalties) ? calculateScoreFromMatchEvents(match.team1, match.team2, match.goalScorers, 120) : scoreAt90;
  
  const finalScoreToDisplay = match.penalties ? scoreAt120.scoreStr : scoreAt120.scoreStr;
  const playedExtraTime = !!match.extraTimeScore || (match.penalties && scoreAt90.scoreStr !== scoreAt120.scoreStr);


  const handlePlayerClick = (goal: GoalScorer) => {
    const team = teamsData[goal.team]; 
    if (team) {
      const playerObj = team.squad.find(p => p.name === goal.player);
      if (playerObj) {
        let totalGoals = 0;
        const allMatchesForSpotlight = [...processedMatches];
        if (!allMatchesForSpotlight.find(pm => pm.id === match.id)) {
            allMatchesForSpotlight.push(match);
        }

        allMatchesForSpotlight.forEach(pm => {
          pm.goalScorers.forEach(g => {
            if (g.player === playerObj.name && g.team === goal.team && !(g.type && g.type.toLowerCase().includes("own goal"))) {
              totalGoals++;
            }
          });
        });
        showPlayerSpotlightModal(playerObj, team.name, totalGoals);
      }
    }
  };
  
  let penaltyDisplayDetails: { team1Name: string, team1Score: string, team2Name: string, team2Score: string, winnerName: string } | null = null;
  if (match.penalties) {
    const parts = match.penalties.split(' ');
    if (parts.length === 3) {
        const penTeam1Identity = parts[0];
        const penTeam2Identity = parts[2];
        const penScores = parts[1].split('-');
        const penScore1Num = parseInt(penScores[0], 10);
        const penScore2Num = parseInt(penScores[1], 10);
        
        const pTeam1Name = (Object.values(teamsData).find(td => td.name === penTeam1Identity)?.name || TEAMS_DATA[penTeam1Identity]?.name || penTeam1Identity).toUpperCase();
        const pTeam2Name = (Object.values(teamsData).find(td => td.name === penTeam2Identity)?.name || TEAMS_DATA[penTeam2Identity]?.name || penTeam2Identity).toUpperCase();
        
        penaltyDisplayDetails = {
            team1Name: pTeam1Name,
            team1Score: penScores[0],
            team2Name: pTeam2Name,
            team2Score: penScores[1],
            winnerName: penScore1Num > penScore2Num ? pTeam1Name : pTeam2Name
        };
    }
  }


  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">MATCH RESULT</h2>
      
      <div className="my-3 text-center">
        <p className="text-3xl font-bold text-cm-cream">{team1Name} <span className="text-cm-yellow">{finalScoreToDisplay}</span> {team2Name}</p>
        
        {match.halfTimeScore && <p className="text-base text-cm-cream/80">(HALF-TIME: {match.halfTimeScore})</p>}

        {playedExtraTime && scoreAt90.scoreStr !== scoreAt120.scoreStr && (
             <p className="text-base text-cm-cream/80">(90 MINS: {scoreAt90.scoreStr})</p>
        )}
        {playedExtraTime && !match.penalties && (
           <p className="text-base font-bold text-orange-400 mt-1">(AFTER EXTRA TIME)</p>
        )}
         {playedExtraTime && match.penalties && (
           <p className="text-base font-bold text-orange-400 mt-1">(AFTER EXTRA TIME, SCORE WAS {scoreAt120.scoreStr})</p>
        )}

        {penaltyDisplayDetails && (
           <p className="text-base font-bold text-red-400 mt-1">
             {penaltyDisplayDetails.winnerName} WON {penaltyDisplayDetails.team1Score}-{penaltyDisplayDetails.team2Score} ON PENALTIES
           </p>
        )}
      </div>

      <div className="mb-3 p-2 border border-cm-gray-light bg-black/20 text-base">
        <h3 className="text-lg mb-1">GOAL SCORERS (INCL. EXTRA TIME):</h3>
        {match.goalScorers && match.goalScorers.length > 0 ? (
          <ul className="list-disc list-inside ml-2 text-cm-cream space-y-0.5">
            {match.goalScorers.map((goal, index) => (
              <li key={index}>
                <button 
                  type="button"
                  className="text-left hover:text-cm-yellow focus:text-cm-yellow font-semibold"
                  onClick={() => handlePlayerClick(goal)}
                  aria-label={`View details for player ${goal.player}`}
                >
                  {goal.player.toUpperCase()}
                </button>
                {' '}({teamsData[goal.team]?.name.toUpperCase() || goal.team.toUpperCase()}) {goal.minute}'
                {goal.type && <span className="text-cm-cyan/80"> ({goal.type.toUpperCase()})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="italic">NO GOALS SCORED.</p>
        )}
      </div>

      {penaltyDisplayDetails && (
         <div className="mb-3 p-2 border-2 border-cm-yellow/50 bg-cm-yellow/10 text-base">
            <h3 className="text-lg mb-1">PENALTY SHOOTOUT DETAILS:</h3>
            <p className="text-cm-cream">
                {penaltyDisplayDetails.team1Name}: <span className="font-bold">{penaltyDisplayDetails.team1Score}</span>
            </p>
            <p className="text-cm-cream">
                {penaltyDisplayDetails.team2Name}: <span className="font-bold">{penaltyDisplayDetails.team2Score}</span>
            </p>
         </div>
      )}

      {match.events && match.events.filter(e => e.type === "Card").length > 0 && (
        <div className="mb-3 p-2 border border-cm-gray-light bg-black/20 text-base">
          <h3 className="text-lg mb-1">KEY EVENTS (CARDS):</h3>
          <ul className="list-disc list-inside ml-2 text-cm-cream space-y-0.5">
            {match.events.filter(e => e.type === "Card").map((event, index) => (
              <li key={index} className={event.card === 'Red' ? 'text-red-400 font-bold' : ''}>
                {event.card?.toUpperCase()} CARD: {event.player?.toUpperCase()} ({teamsData[event.team!]?.name.toUpperCase() || event.team!.toUpperCase()}) {event.minute || ''}'
              </li>
            ))}
          </ul>
        </div>
      )}

      {pressSnippet && (
        <div className="my-3 p-3 border-2 border-dashed border-cm-yellow/50 bg-cm-yellow/10 text-left">
            <h4 className="text-lg mb-1">PRESS BOX:</h4>
            <p className="text-base text-cm-cream italic">{pressSnippet}</p>
        </div>
      )}
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-2 text-lg">
        <i className="fas fa-arrow-right"></i>CONTINUE
      </button>
    </div>
  );
};

export default MatchAftermathView;