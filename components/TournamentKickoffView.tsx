
import React from 'react';
import { Teams } from '../types';

interface TournamentKickoffViewProps {
  teamName: string;
  userTeamKey: string | null;
  groupDefinitions: { [key: string]: string[] };
  teamsData: Teams;
  onStartTournament: () => void;
}

const TournamentKickoffView: React.FC<TournamentKickoffViewProps> = ({ 
  teamName, 
  userTeamKey,
  groupDefinitions,
  teamsData,
  onStartTournament 
}) => {
  let userGroupTeams: string[] = [];
  let userGroupName: string | null = null;

  if (userTeamKey) {
    for (const groupKey in groupDefinitions) {
      if (groupDefinitions[groupKey].includes(userTeamKey)) {
        userGroupName = groupKey;
        userGroupTeams = groupDefinitions[groupKey].map(
          teamKey => teamsData[teamKey]?.name.toUpperCase() || teamKey.toUpperCase()
        );
        break;
      }
    }
  }

  return (
    <div className="panel-cm text-center">
      <h2 className="text-2xl mb-3 border-b-2 border-cm-gray-light pb-1">TOURNAMENT KICK-OFF!</h2>
      <p className="text-lg text-cm-cream mb-2">
        WELCOME, MANAGER! YOU HAVE TAKEN CHARGE OF <span className="font-bold text-cm-yellow">{teamName.toUpperCase()}</span> FOR THE
        1994 FIFA WORLD CUP IN THE USA!
      </p>
      <p className="text-lg text-cm-cream mb-4">
        THE EYES OF THE WORLD ARE UPON YOU. CAN YOU LEAD YOUR NATION TO GLORY?
      </p>
      
      {userGroupName && userGroupTeams.length > 0 && (
        <div className="my-4 p-3 border-2 border-dashed border-cm-gray-light/50 bg-black/20 text-left">
          <h3 className="text-xl text-cm-cyan mb-2">YOUR STARTING GROUP (GROUP {userGroupName}):</h3>
          <ul className="list-disc list-inside ml-2 text-lg text-cm-cream">
            {userGroupTeams.map(name => (
              <li key={name} className={name === teamName.toUpperCase() ? 'font-extrabold text-cm-yellow' : ''}>
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="my-4 p-2 border-2 border-dashed border-cm-gray-light/50 bg-black/20 text-base">
        <p className="text-cm-cream/80">The 1994 FIFA World Cup was the 15th FIFA World Cup. It was hosted by the United States and took place from June 17 to July 17, 1994, at nine venues across the country. The format of the competition stayed the same as in the 1990 World Cup: 24 teams qualified, divided into six groups of four. Sixteen teams would qualify for the knockout phase: the six group winners, the six group runners-up, and the four third-placed teams with the best records.</p>
      </div>

      <button 
        type="button"
        onClick={onStartTournament} 
        className="btn-pm w-full text-xl"
      >
        <i className="fas fa-futbol"></i>START THE TOURNAMENT!
      </button>
    </div>
  );
};

export default TournamentKickoffView;