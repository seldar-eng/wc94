
import React from 'react';
import { Player } from '../types';

interface PlayerSpotlightModalProps {
  isOpen: boolean;
  player: Player | null;
  teamName: string | null;
  goals: number;
  onClose: () => void;
}

const PlayerSpotlightModal: React.FC<PlayerSpotlightModalProps> = ({
  isOpen,
  player,
  teamName,
  goals,
  onClose,
}) => {
  if (!isOpen || !player) return null;

  return (
    <div className="modal-overlay-retro" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="player-spotlight-title">
      <div className="modal-content-retro" onClick={(e) => e.stopPropagation()} style={{maxWidth: '400px'}}>
        <h3 id="player-spotlight-title" className="text-2xl mb-2 border-b-2 border-cm-gray-light pb-1">
          PLAYER SPOTLIGHT
        </h3>
        
        <div className="text-left text-lg text-cm-cream">
          <p className="mb-1">
            <span className="font-semibold text-cm-cyan">NAME:</span> {player.name.toUpperCase()} (#{player.number})
          </p>
          <p className="mb-1">
            <span className="font-semibold text-cm-cyan">TEAM:</span> {teamName?.toUpperCase() || 'N/A'}
          </p>
          <p className="mb-1">
            <span className="font-semibold text-cm-cyan">POSITION:</span> {player.posStr} ({player.category})
          </p>
          <p className="mb-1">
            <span className="font-semibold text-cm-cyan">TOURNAMENT GOALS:</span> <span className="text-cm-yellow">{goals}</span>
          </p>
          {player.flavorText && (
            <div className="mt-2 pt-2 border-t border-cm-gray-light/50">
              <p className="italic text-base text-cm-cream/80">{player.flavorText}</p>
            </div>
          )}
        </div>

        <button 
            onClick={onClose} 
            className="btn-pm w-full mt-4"
            aria-label="Close player spotlight"
            type="button"
        >
          <i className="fas fa-times-circle mr-1"></i>CLOSE
        </button>
      </div>
    </div>
  );
};

export default PlayerSpotlightModal;