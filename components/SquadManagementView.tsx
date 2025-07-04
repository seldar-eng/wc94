
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, FormationRequirements, MatchData, PlayerCategory, Teams, Formations } from '../types';
import { TEAMS_DATA, FORMATIONS, MAX_STARTERS, MAX_SUBS, getPlayerCategory } from '../constants';
import PlayerItem from './PlayerItem';

interface SquadManagementViewProps {
  userTeamKey: string;
  currentMatch: MatchData;
  onSquadConfirm: (starters: Player[], subs: Player[], formation: string) => void;
  showModal: (title: string, message: string) => void;
  showPlayerSpotlightModal: (player: Player, teamName: string, goals: number) => void;
  processedMatches: MatchData[];
  teamsData: Teams;
}

const SquadManagementView: React.FC<SquadManagementViewProps> = ({
  userTeamKey,
  currentMatch,
  onSquadConfirm,
  showModal,
  showPlayerSpotlightModal,
  processedMatches,
  teamsData,
}) => {
  const [selectedStarters, setSelectedStarters] = useState<number[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<number[]>([]);
  const [currentFormation, setCurrentFormation] = useState<string | null>(null);
  const [squadFeedback, setSquadFeedback] = useState<string>('');
  const [formationFeedback, setFormationFeedback] = useState<string>('');
  const [isCurrentlyValid, setIsCurrentlyValid] = useState<boolean>(false);

  const teamSquad = useMemo(() => teamsData[userTeamKey]?.squad || [], [userTeamKey, teamsData]);
  const userTeamName = useMemo(() => teamsData[userTeamKey]?.name || userTeamKey, [userTeamKey, teamsData]);

  const validateSquadAndFormation = useCallback(() => {
    let isValid = true;
    let newFormationMsg = "";
    let newSquadMsg = "";

    if (!currentFormation) {
      newFormationMsg = "PLEASE SELECT A FORMATION.";
      isValid = false;
    }
    if (selectedStarters.length !== MAX_STARTERS) {
      newSquadMsg += `SELECT EXACTLY ${MAX_STARTERS} STARTERS.\n`;
      isValid = false;
    }
    if (selectedSubs.length > MAX_SUBS) {
      newSquadMsg += `MAX ${MAX_SUBS} SUBSTITUTES.\n`;
      isValid = false;
    }

    if (currentFormation && selectedStarters.length === MAX_STARTERS) {
      const formationRules = FORMATIONS[currentFormation];
      const counts: Record<PlayerCategory | 'Unknown', number> = { GK: 0, DF: 0, MF: 0, FW: 0, Unknown: 0 };
      
      selectedStarters.forEach(pNum => {
        const player = teamSquad.find(p => p.number === pNum);
        if (player) {
            counts[player.category] = (counts[player.category] || 0) + 1;
        } else {
            counts.Unknown++;
        }
      });

      if (counts.GK !== formationRules.GK) { newFormationMsg += `GK: NEED ${formationRules.GK}, GOT ${counts.GK}.\n`; isValid = false; }
      if (counts.DF !== formationRules.DF) { newFormationMsg += `DF: NEED ${formationRules.DF}, GOT ${counts.DF}.\n`; isValid = false; }
      if (counts.MF !== formationRules.MF) { newFormationMsg += `MF: NEED ${formationRules.MF}, GOT ${counts.MF}.\n`; isValid = false; }
      if (counts.FW !== formationRules.FW) { newFormationMsg += `FW: NEED ${formationRules.FW}, GOT ${counts.FW}.\n`; isValid = false; }
      if (counts.Unknown > 0) { newFormationMsg += `UNKNOWN PLAYER CATEGORIES SELECTED.\n`; isValid = false; }
    }
    
    setFormationFeedback(newFormationMsg.trim());
    setSquadFeedback(newSquadMsg.trim());
    return isValid;
  }, [currentFormation, selectedStarters, selectedSubs, teamSquad]);

  useEffect(() => {
    const isValidResult = validateSquadAndFormation();
    setIsCurrentlyValid(isValidResult);
  }, [selectedStarters, selectedSubs, currentFormation, validateSquadAndFormation]);
  
  const opponentKey = currentMatch.team1 === userTeamKey ? currentMatch.team2 : currentMatch.team1;

  const handleSelectFormation = (formKey: string) => {
    setCurrentFormation(formKey);
  };

  const addPlayerToList = useCallback((playerNumber: number, listType: 'starters' | 'subs') => {
    if (selectedStarters.includes(playerNumber) || selectedSubs.includes(playerNumber)) {
      showModal("SELECTION ERROR", "PLAYER ALREADY SELECTED.");
      return;
    }
    if (listType === 'starters' && selectedStarters.length < MAX_STARTERS) {
      setSelectedStarters(prev => [...prev, playerNumber]);
    } else if (listType === 'starters') {
      showModal("SELECTION ERROR", `CANNOT ADD MORE THAN ${MAX_STARTERS} STARTERS.`);
    }
    if (listType === 'subs' && selectedSubs.length < MAX_SUBS) {
      setSelectedSubs(prev => [...prev, playerNumber]);
    } else if (listType === 'subs') {
      showModal("SELECTION ERROR", `CANNOT ADD MORE THAN ${MAX_SUBS} SUBSTITUTES.`);
    }
  }, [showModal, selectedStarters, selectedSubs]);

  const removePlayerFromList = useCallback((playerNumber: number, listType: 'starters' | 'subs') => {
    if (listType === 'starters') {
      setSelectedStarters(prev => prev.filter(pNum => pNum !== playerNumber));
    }
    if (listType === 'subs') {
      setSelectedSubs(prev => prev.filter(pNum => pNum !== playerNumber));
    }
  }, []); 

  const handleAutoFillHistorical = useCallback(() => {
    const historicalLineup = currentMatch.lineups?.[userTeamKey];
    if (historicalLineup) {
      setSelectedStarters([...historicalLineup.starters]);
      const availableForSubs = teamSquad
        .map(p => p.number)
        .filter(pNum => !historicalLineup.starters.includes(pNum));
      setSelectedSubs(availableForSubs.slice(0, MAX_SUBS));
      setCurrentFormation(historicalLineup.formation || Object.keys(FORMATIONS)[0]);
      showModal("SQUAD AUTO-FILLED", "HISTORICAL LINEUP SELECTED.");
    } else {
      showModal("AUTO-FILL FAILED", "NO HISTORICAL LINEUP FOR THIS MATCH/TEAM.");
    }
  }, [currentMatch, userTeamKey, teamSquad, showModal]); 

  const handleAutoFillByFormation = useCallback(() => {
    if (!currentFormation) {
      showModal("NO FORMATION", "SELECT A FORMATION TO AUTO-FILL.");
      return;
    }
    const formationRules = FORMATIONS[currentFormation];
    let tempStarters: number[] = [];
    const availablePlayersForSelection = teamSquad.filter(p => !selectedSubs.includes(p.number));

    const fillCategory = (category: PlayerCategory, count: number) => {
      const playersInCategory = availablePlayersForSelection.filter(
        p => p.category === category && !tempStarters.includes(p.number)
      );
      for (let i = 0; i < Math.min(count, playersInCategory.length); i++) {
        tempStarters.push(playersInCategory[i].number);
      }
    };

    fillCategory("GK", formationRules.GK);
    fillCategory("DF", formationRules.DF);
    fillCategory("MF", formationRules.MF);
    fillCategory("FW", formationRules.FW);
    
    let currentStartersCount = tempStarters.length;
    if (currentStartersCount < MAX_STARTERS) {
        const generalPool = availablePlayersForSelection.filter(p => !tempStarters.includes(p.number));
        for(let i = 0; i < Math.min(MAX_STARTERS - currentStartersCount, generalPool.length); i++){
            tempStarters.push(generalPool[i].number);
        }
    }
    
    if (tempStarters.length === MAX_STARTERS) {
        setSelectedStarters([...tempStarters]);
        const subsPool = teamSquad.filter(p => !tempStarters.includes(p.number));
        setSelectedSubs(subsPool.slice(0, MAX_SUBS).map(p => p.number));
        showModal("AUTO-FILLED", `SQUAD FILLED FOR ${currentFormation}.`);
    } else {
        showModal("AUTO-FILL FAILED", `NOT ENOUGH PLAYERS FOR ${currentFormation}.`);
    }
  }, [currentFormation, showModal, teamSquad, selectedSubs]);

  const handleConfirmSquad = useCallback(() => {
    if (isCurrentlyValid && currentFormation) {
      const starterObjects = selectedStarters.map(num => teamSquad.find(p => p.number === num)).filter(Boolean) as Player[];
      const subObjects = selectedSubs.map(num => teamSquad.find(p => p.number === num)).filter(Boolean) as Player[];
      onSquadConfirm(starterObjects, subObjects, currentFormation);
    } else {
      showModal("INVALID SQUAD", "CORRECT SQUAD/FORMATION PER FEEDBACK.");
    }
  }, [isCurrentlyValid, currentFormation, selectedStarters, selectedSubs, teamSquad, onSquadConfirm, showModal]);

  const handlePlayerNameClick = useCallback((player: Player) => {
    let totalGoals = 0;
    processedMatches.forEach(pm => {
      pm.goalScorers.forEach(g => {
        if (g.player === player.name && g.team === userTeamKey && !(g.type && g.type.toLowerCase().includes("own goal"))) {
          totalGoals++;
        }
      });
    });
    showPlayerSpotlightModal(player, userTeamName, totalGoals);
  }, [processedMatches, userTeamKey, userTeamName, showPlayerSpotlightModal]);

  const playerPool = teamSquad.filter(p => !selectedStarters.includes(p.number) && !selectedSubs.includes(p.number));
  const starterPlayerObjects = selectedStarters.map(pNum => teamSquad.find(p => p.number === pNum)).filter(Boolean) as Player[];
  const subPlayerObjects = selectedSubs.map(pNum => teamSquad.find(p => p.number === pNum)).filter(Boolean) as Player[];
  
  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-2 text-center border-b-2 border-cm-gray-light pb-1">Team Selection</h2>
      <p className="mb-1 text-sm">MATCH: <span className="font-bold text-cm-cream">{teamsData[currentMatch.team1]?.name.toUpperCase()} VS {teamsData[currentMatch.team2]?.name.toUpperCase()}</span></p>
      <p className="mb-3 text-sm">VENUE: <span className="font-bold text-cm-cream">{currentMatch.venue.toUpperCase()}</span></p>

      <div className="mb-4">
        <h3 className="text-xl mb-1">Formation:</h3>
        <div className="flex flex-wrap gap-1">
          {Object.keys(FORMATIONS).map(formKey => (
            <button
              type="button"
              key={formKey}
              title={FORMATIONS[formKey].description}
              className={`btn-pm text-lg ${currentFormation === formKey ? 'bg-cm-yellow text-black' : ''}`}
              onClick={() => handleSelectFormation(formKey)}
            >
              {formKey}
            </button>
          ))}
        </div>
        {formationFeedback && <p className="text-base mt-1 text-red-400 font-bold whitespace-pre-line">{formationFeedback}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-base">
        <div>
          <h3 className="text-xl mb-1">Pool ({playerPool.length})</h3>
          <div className="h-64 overflow-y-auto border-2 border-cm-gray-light p-1 bg-black/20 custom-scrollbar">
            {playerPool.map(p => <PlayerItem key={p.number} player={p} type="pool" onAddToStarters={(num) => addPlayerToList(num, 'starters')} onAddToSubs={(num) => addPlayerToList(num, 'subs')} onPlayerNameClick={handlePlayerNameClick} />)}
          </div>
        </div>
        <div>
          <h3 className="text-xl mb-1">Starters ({selectedStarters.length}/{MAX_STARTERS})</h3>
          <div className="h-64 overflow-y-auto border-2 border-cm-gray-light p-1 bg-black/20 custom-scrollbar">
            {starterPlayerObjects.map(p => <PlayerItem key={p.number} player={p} type="starter" onRemove={(num, _itemType) => removePlayerFromList(num, 'starters')} isSelectedStarter={true} onPlayerNameClick={handlePlayerNameClick}/>)}
          </div>
        </div>
        <div>
          <h3 className="text-xl mb-1">Subs ({selectedSubs.length}/{MAX_SUBS})</h3>
          <div className="h-64 overflow-y-auto border-2 border-cm-gray-light p-1 bg-black/20 custom-scrollbar">
            {subPlayerObjects.map(p => <PlayerItem key={p.number} player={p} type="sub" onRemove={(num, _itemType) => removePlayerFromList(num, 'subs')} isSelectedSub={true} onPlayerNameClick={handlePlayerNameClick} />)}
          </div>
        </div>
      </div>
      {squadFeedback && <p className="text-base mt-2 text-red-400 font-bold whitespace-pre-line">{squadFeedback}</p>}

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button type="button" onClick={handleConfirmSquad} className={`btn-pm text-lg col-span-1 sm:col-span-3 bg-cm-confirm-green text-white hover:bg-green-600 ${isCurrentlyValid ? '' : 'btn-disabled'}`} disabled={!isCurrentlyValid}>
            <i className="fas fa-play"></i>PLAY MATCH
        </button>
        <button type="button" onClick={handleAutoFillByFormation} className="btn-pm text-lg" disabled={!currentFormation}>
            <i className="fas fa-magic"></i>FILL FORMATION
        </button>
        <button type="button" onClick={handleAutoFillHistorical} className="btn-pm text-lg">
            <i className="fas fa-history"></i>HISTORICAL
        </button>
      </div>
    </div>
  );
};

export default SquadManagementView;