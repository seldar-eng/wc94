
import React from 'react';
import { Player } from '../types';

interface PlayerItemProps {
  player: Player;
  type: 'pool' | 'starter' | 'sub';
  onAddToStarters?: (playerNumber: number) => void;
  onAddToSubs?: (playerNumber: number) => void;
  onRemove?: (playerNumber: number, type: 'starter' | 'sub') => void;
  isSelectedStarter?: boolean;
  isSelectedSub?: boolean;
  onPlayerNameClick?: (player: Player) => void;
}

const PlayerItem: React.FC<PlayerItemProps> = ({
  player,
  type,
  onAddToStarters,
  onAddToSubs,
  onRemove,
  isSelectedStarter,
  isSelectedSub,
  onPlayerNameClick,
}) => {
  let itemClasses = "p-1.5 mb-1 flex justify-between items-center text-sm";
  if (isSelectedStarter) {
    itemClasses += " bg-green-800/50";
  } else if (isSelectedSub) {
     itemClasses += " bg-yellow-800/40";
  } else {
     itemClasses += " bg-black/20";
  }


  return (
    <div className={itemClasses} data-player-number={player.number}>
      <span className="flex-grow text-cm-cream">
        {onPlayerNameClick ? (
          <button
            type="button"
            className="text-left hover:text-cm-yellow focus:text-cm-yellow font-semibold appearance-none bg-transparent border-none p-0 m-0 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onPlayerNameClick(player);}}
            aria-label={`View details for player ${player.name}`}
          >
            {player.number}. {player.name.toUpperCase()}
          </button>
        ) : (
          `${player.number}. ${player.name.toUpperCase()}`
        )}
        <span className="text-cm-cyan/80 ml-1">({player.posStr} - {player.category})</span>
      </span>
      <div className="player-item-actions flex gap-1 ml-1">
        {type === 'pool' && onAddToStarters && onAddToSubs && (
          <>
            <button
              type="button"
              title="Add to Starters"
              className="text-xs text-white px-1.5 py-0.5 border border-green-500 bg-green-700 hover:bg-green-600"
              onClick={(e) => { e.stopPropagation(); onAddToStarters(player.number); }}
            >
              S
            </button>
            <button
              type="button"
              title="Add to Bench"
              className="text-xs text-black px-1.5 py-0.5 border border-yellow-500 bg-yellow-600 hover:bg-yellow-500"
              onClick={(e) => { e.stopPropagation(); onAddToSubs(player.number); }}
            >
              B
            </button>
          </>
        )}
        {(type === 'starter' || type === 'sub') && onRemove && (
          <button
            type="button"
            title="Remove"
            className="text-xs text-white px-1.5 py-0.5 border border-red-500 bg-red-700 hover:bg-red-600"
            onClick={(e) => { e.stopPropagation(); onRemove(player.number, type); }}
          >
            X
          </button>
        )}
      </div>
    </div>
  );
};

export default PlayerItem;