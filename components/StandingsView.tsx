
import React from 'react';
import { GroupStandings, GroupStanding as GroupStandingType, MatchData } from '../types';
import { TEAMS_DATA, GROUP_DEFINITIONS } from '../constants';
import { sortGroup } from '../utils/gameLogic';

interface StandingsViewProps {
  groupStandings: GroupStandings;
  userTeamName: string | null;
  allProcessedMatches: MatchData[];
  onContinue: () => void;
}

const StandingsView: React.FC<StandingsViewProps> = ({ groupStandings, userTeamName, allProcessedMatches, onContinue }) => {
  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">GROUP STANDINGS</h2>
      
      <div className="space-y-4 max-h-[32rem] overflow-y-auto custom-scrollbar p-1">
        {Object.keys(GROUP_DEFINITIONS).map(groupKey => {
          const group = groupStandings[groupKey];
          if (!group || Object.keys(group).length === 0 || !Object.values(group).some(t => t.pld > 0)) {
            return null; 
          }
          const sortedTeams = sortGroup(group, allProcessedMatches);
          
          return (
            <div key={groupKey} className="mb-4">
              <h3 className="text-xl mb-1.5">GROUP {groupKey}</h3>
              <table className="w-full text-base">
                <thead>
                  <tr>
                    {["POS", "TEAM", "PLD", "W", "D", "L", "GF", "GA", "GD", "PTS"].map((header, idx) => (
                      <th 
                        key={header} 
                        className={`${idx === 1 ? 'text-left' : 'text-center'}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((teamStats, index) => (
                    <tr key={teamStats.teamKey}>
                      <td className="text-center">{index + 1}</td>
                      <td 
                        className={`text-left ${teamStats.name === userTeamName ? 'font-extrabold text-cm-yellow bg-cm-yellow/10' : ''}`}
                      >
                        {teamStats.name.toUpperCase()}
                      </td>
                      {['pld', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'pts'].map(key => (
                        <td key={key} className="text-center">{teamStats[key as keyof GroupStandingType]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-4 text-lg">
        CONTINUE <i className="fas fa-angle-double-right"></i>
      </button>
    </div>
  );
};

export default StandingsView;