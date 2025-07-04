
import React from 'react';
import { Player } from '../types';

interface ConfirmTeamSquadViewProps {
  teamKey: string;
  teamName: string;
  squad: Player[];
  onConfirmTeam: () => void;
  onGoBack: () => void;
}

const ConfirmTeamSquadView: React.FC<ConfirmTeamSquadViewProps> = ({
  teamKey,
  teamName,
  squad,
  onConfirmTeam,
  onGoBack,
}) => {
  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-3 text-center border-b-2 border-cm-gray-light pb-1">
        CONFIRM YOUR TEAM: {teamName.toUpperCase()}
      </h2>

      <div className="mb-4 p-2 border border-cm-gray-light bg-black/20">
        <h3 className="text-xl mb-2">FULL SQUAD LIST:</h3>
        <div className="max-h-80 overflow-y-auto custom-scrollbar p-1 bg-cm-gray-dark/50 border border-cm-gray-light">
          {squad.length > 0 ? (
            <ul className="text-base text-cm-cream space-y-0.5">
              {squad.map(player => (
                <li key={`${teamKey}-${player.number}`} className="p-1 border-b border-cm-gray-light/50 last:border-b-0">
                  <span className="font-semibold">{player.number}. {player.name.toUpperCase()}</span>
                  <span className="text-cm-cyan/80 ml-2">
                    ({player.posStr} - {player.category})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base italic">NO SQUAD DATA AVAILABLE.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <button
          type="button"
          onClick={onGoBack}
          className="btn-pm w-full sm:w-auto"
        >
          <i className="fas fa-arrow-left"></i> GO BACK
        </button>
        <button
          type="button"
          onClick={onConfirmTeam}
          className="btn-pm w-full sm:w-auto bg-cm-confirm-green hover:bg-green-600 text-white"
        >
          CONFIRM TEAM & PROCEED <i className="fas fa-check-circle"></i>
        </button>
      </div>
    </div>
  );
};

export default ConfirmTeamSquadView;