
import React, { useMemo } from 'react';
import { MatchData, PlayerScore, Teams, Player } from '../types';

interface TopScorersViewProps {
  processedMatches: MatchData[];
  teamsData: Teams;
  onContinue: () => void;
  showPlayerSpotlightModal: (player: Player, teamName: string, goals: number) => void;
}

const TopScorersView: React.FC<TopScorersViewProps> = ({ 
  processedMatches, 
  teamsData, 
  onContinue,
  showPlayerSpotlightModal
}) => {
  const topScorersData = useMemo(() => {
    const scorersMap: { [playerKey: string]: PlayerScore } = {};

    processedMatches.forEach(match => {
      match.goalScorers.forEach(goal => {
        if (goal.type && goal.type.toLowerCase().includes("own goal")) {
          return;
        }
        const playerKey = `${goal.player}_${goal.team}`;
        if (!scorersMap[playerKey]) {
          scorersMap[playerKey] = {
            name: goal.player,
            teamKey: goal.team,
            teamName: teamsData[goal.team]?.name || goal.team,
            goals: 0,
          };
        }
        scorersMap[playerKey].goals++;
      });
    });

    return Object.values(scorersMap)
      .filter(scorer => scorer.goals > 0)
      .sort((a, b) => {
        if (b.goals !== a.goals) {
          return b.goals - a.goals;
        }
        return a.name.localeCompare(b.name);
      });
  }, [processedMatches, teamsData]);

  const handlePlayerClick = (scorer: PlayerScore) => {
    const team = teamsData[scorer.teamKey];
    if (team) {
      const playerObj = team.squad.find(p => p.name === scorer.name);
      if (playerObj) {
        showPlayerSpotlightModal(playerObj, scorer.teamName, scorer.goals);
      }
    }
  };

  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">
        TOP GOAL SCORERS
      </h2>

      {topScorersData.length > 0 ? (
        <div className="max-h-[25rem] overflow-y-auto custom-scrollbar p-1 border border-cm-gray-light bg-black/20">
          <table className="w-full text-base">
            <thead>
              <tr>
                <th className="text-center">RANK</th>
                <th className="text-left">PLAYER</th>
                <th className="text-left">TEAM</th>
                <th className="text-center">GOALS</th>
              </tr>
            </thead>
            <tbody>
              {topScorersData.map((scorer, index) => (
                <tr key={`${scorer.name}-${scorer.teamKey}`}>
                  <td className="text-center">{index + 1}</td>
                  <td className="text-left">
                    <button 
                      type="button"
                      className="text-left hover:text-cm-yellow focus:text-cm-yellow font-semibold"
                      onClick={() => handlePlayerClick(scorer)}
                      aria-label={`View details for player ${scorer.name}`}
                    >
                      {scorer.name.toUpperCase()}
                    </button>
                  </td>
                  <td className="text-left">{scorer.teamName.toUpperCase()}</td>
                  <td className="text-center font-bold text-cm-yellow">{scorer.goals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-lg italic text-center my-6">NO GOALS SCORED YET IN THE TOURNAMENT.</p>
      )}
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-4 text-lg">
        CONTINUE <i className="fas fa-angle-double-right ml-1"></i>
      </button>
    </div>
  );
};

export default TopScorersView;