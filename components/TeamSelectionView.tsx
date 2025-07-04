
import React, { useState } from 'react';
import { Teams } from '../types';
import { TEAMS_DATA } from '../constants';

interface TeamSelectionViewProps {
  onTeamSelect: (teamKey: string) => void;
  showModal: (title: string, message: string) => void;
}

const TeamSelectionView: React.FC<TeamSelectionViewProps> = ({ onTeamSelect, showModal }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleConfirm = () => {
    if (selectedTeam) {
      onTeamSelect(selectedTeam);
    } else {
      showModal("NO TEAM SELECTED", "PLEASE CHOOSE A TEAM FROM THE DROPDOWN LIST.");
    }
  };

  const sortedTeamKeys = Object.keys(TEAMS_DATA).sort((a, b) =>
    TEAMS_DATA[a].name.localeCompare(TEAMS_DATA[b].name)
  );

  return (
    <div className="panel-cm text-center">
      <h2 className="text-2xl mb-4">FIFA World Cup 1994</h2>
      
      <div className="my-4 p-3 border-2 border-dashed border-cm-gray-light/50 bg-black/20 text-left">
        <p className="text-lg text-cm-cream font-semibold">Host Country: <span className="font-normal text-cm-cyan">USA</span></p>
        <p className="text-lg text-cm-cream font-semibold">Current Champions: <span className="font-normal text-cm-cyan">Germany (Italy '90)</span></p>
      </div>

      <div className="mb-4">
        <label htmlFor="team-select-dropdown" className="block text-lg font-bold text-cm-cyan mb-2">
          CHOOSE A NATION:
        </label>
        <select
          id="team-select-dropdown"
          className="block w-full p-2 mb-4 text-lg"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          aria-label="Select a team to manage"
        >
          <option value="">-- SELECT A TEAM --</option>
          {sortedTeamKeys.map(teamKey => (
            <option key={teamKey} value={teamKey}>
              {TEAMS_DATA[teamKey].name.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleConfirm}
          className={`btn-pm w-full text-xl ${!selectedTeam ? 'btn-disabled' : ''}`}
          disabled={!selectedTeam}
        >
          <i className="fas fa-flag-checkered"></i>CONFIRM & PROCEED
        </button>
      </div>
    </div>
  );
};

export default TeamSelectionView;