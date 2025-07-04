
import React, { useState, useEffect, useCallback } from 'react';
import { View, MatchData, GroupStandings, Player, GameRound as GameRoundType, Teams, Formations as FormationsType, FullKnockoutBracket, KnockoutRoundBracket, BracketMatchup, PlayerScore } from './types';
import { TEAMS_DATA, ALL_MATCHES_SORTED, FORMATIONS, GROUP_DEFINITIONS, GAME_ROUNDS } from './constants';
import { initializeGroupStandings, updateSingleGroupStanding, getMatchWinner, sortGroup, getMatchesForGameRound, getUserMatchForGameRound, generateKnockoutBracketStructure } from './utils/gameLogic';
import { getRandomHeadlines } from './headlines';

import Header from './components/Header';
import Modal from './components/Modal';
import LoadingSpinner from './components/LoadingSpinner';
import PlayerSpotlightModalComponent from './components/PlayerSpotlightModal';

import TeamSelectionView from './components/TeamSelectionView';
import ConfirmTeamSquadView from './components/ConfirmTeamSquadView';
import TournamentKickoffView from './components/TournamentKickoffView';
import GameRoundFixturesView from './components/GameRoundFixturesView';
import MatchPreGameView from './components/MatchPreGameView';
import SquadManagementView from './components/SquadManagementView';
import MatchInProgressView from './components/MatchInProgressView';
import MatchAftermathView from './components/MatchAftermathView';
import RoundResultsView from './components/RoundResultsView';
import TeletextNewsView from './components/TeletextNewsView';
import StandingsView from './components/StandingsView';
import TopScorersView from './components/TopScorersView';
import TournamentPulseView from './components/TournamentPulseView';
import KnockoutBracketView from './components/KnockoutBracketView';
import GameOverView from './components/GameOverView';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.StartScreen);
  const [userTeamKey, setUserTeamKey] = useState<string | null>(null);
  const [userTeamName, setUserTeamName] = useState<string | null>(null);
  
  const [currentGameRoundIndex, setCurrentGameRoundIndex] = useState<number>(0);
  const [matchesForCurrentRound, setMatchesForCurrentRound] = useState<MatchData[]>([]);
  const [userMatchForCurrentRound, setUserMatchForCurrentRound] = useState<MatchData | null>(null);
  
  const [currentMatchForUser, setCurrentMatchForUser] = useState<MatchData | null>(null);
  const [userSelectedSquad, setUserSelectedSquad] = useState<{starters: Player[], subs: Player[], formation: string} | null>(null);
  
  const [groupStandings, setGroupStandings] = useState<GroupStandings>(initializeGroupStandings());
  const [processedMatches, setProcessedMatches] = useState<MatchData[]>([]); 

  const [modalState, setModalState] = useState<{ isOpen: boolean, title: string, message: string }>({ isOpen: false, title: '', message: '' });
  const [isLoadingView, setIsLoadingView] = useState<boolean>(false);
  const [teletextHeadlines, setTeletextHeadlines] = useState<string[]>([]);

  // State for Player Spotlight Modal
  const [playerSpotlightModalState, setPlayerSpotlightModalState] = useState<{
    isOpen: boolean;
    player: Player | null;
    teamName: string | null;
    goals: number;
  }>({ isOpen: false, player: null, teamName: null, goals: 0 });

  // State for Knockout Bracket Data
  const [knockoutBracketData, setKnockoutBracketData] = useState<FullKnockoutBracket | null>(null);


  const showModal = useCallback((title: string, message: string) => setModalState({ isOpen: true, title, message }), []);
  const closeModal = useCallback(() => setModalState({ isOpen: false, title: '', message: '' }), []);

  // Player Spotlight Modal Handlers
  const showPlayerSpotlightModal = useCallback((player: Player, teamName: string, goals: number) => {
    setPlayerSpotlightModalState({ isOpen: true, player, teamName, goals });
  }, []);
  const closePlayerSpotlightModal = useCallback(() => {
    setPlayerSpotlightModalState({ isOpen: false, player: null, teamName: null, goals: 0 });
  }, []);

  const handleTeamSelection = useCallback((teamKey: string, _performReset: boolean = true) => {
    setUserTeamKey(teamKey);
    const teamData = TEAMS_DATA[teamKey];
    setUserTeamName(teamData ? teamData.name : teamKey);
    setCurrentView(View.ConfirmTeamSquad);
  }, []);

  const resetGame = useCallback((goToMainMenu: boolean = true) => {
    setIsLoadingView(true);
    const previousTeam = userTeamKey;
    
    setUserTeamKey(null);
    setUserTeamName(null);
    setCurrentGameRoundIndex(0);
    setMatchesForCurrentRound([]);
    setUserMatchForCurrentRound(null);
    setCurrentMatchForUser(null);
    setUserSelectedSquad(null);
    setGroupStandings(initializeGroupStandings());
    setProcessedMatches([]);
    setTeletextHeadlines([]);
    setKnockoutBracketData(null);
    
    if (goToMainMenu) {
        setCurrentView(View.StartScreen);
    } else if (previousTeam) {
        handleTeamSelection(previousTeam, false); 
    } else {
        setCurrentView(View.StartScreen); 
    }
    setIsLoadingView(false);
  }, [userTeamKey, handleTeamSelection]); 

  const loadRoundData = useCallback((roundIdx: number) => {
    const matches = getMatchesForGameRound(roundIdx);
    setMatchesForCurrentRound(matches);
    if (userTeamKey) {
        const userMatch = getUserMatchForGameRound(roundIdx, userTeamKey);
        setUserMatchForCurrentRound(userMatch || null);
    }
  }, [userTeamKey]);

  const handleProceedToTournamentKickoff = useCallback(() => {
    setCurrentView(View.TournamentKickoff);
  }, []);

  const handleReturnToTeamSelection = useCallback(() => {
    setUserTeamKey(null);
    setUserTeamName(null);
    setCurrentView(View.StartScreen);
  }, []);

  const handleStartTournament = useCallback(() => {
    setIsLoadingView(true);
    setCurrentGameRoundIndex(0);
    loadRoundData(0);
    setCurrentView(View.GameRoundFixtures);
    setIsLoadingView(false);
  }, [loadRoundData]);
  
  const handleGoToMatch = useCallback(() => { 
    if (userMatchForCurrentRound) {
      setCurrentMatchForUser(userMatchForCurrentRound); 
      setCurrentView(View.MatchPreGame);
    } else {
      showModal("ERROR", "No match for your team in this round.");
    }
  }, [userMatchForCurrentRound, showModal]);
  
  const handleAdvanceAfterUserActionsOrSimulateRound = useCallback(() => {
    setIsLoadingView(true);
    const currentRound = GAME_ROUNDS[currentGameRoundIndex];
    const matchesInThisRound = getMatchesForGameRound(currentGameRoundIndex);

    const newlyProcessed = matchesInThisRound.filter(m => !processedMatches.find(pm => pm.id === m.id));
    const updatedProcessedMatches = [...processedMatches, ...newlyProcessed];
    setProcessedMatches(updatedProcessedMatches);

    if (currentRound.isGroupStage) {
        let tempStandings = {...groupStandings}; 
        newlyProcessed.forEach(match => {
             tempStandings = updateSingleGroupStanding(JSON.parse(JSON.stringify(tempStandings)), match); 
        });
        setGroupStandings(tempStandings);
    }
    
    setCurrentMatchForUser(null);
    setUserSelectedSquad(null);

    setCurrentView(View.RoundResults);
    setIsLoadingView(false);
  }, [currentGameRoundIndex, processedMatches, groupStandings]);

  const handleGoToTeamSelection = useCallback(() => { 
    setCurrentView(View.SquadManagement);
  }, []);

  const handleSquadConfirmAndPlayMatch = useCallback((starters: Player[], subs: Player[], formation: string) => {
    setUserSelectedSquad({ starters, subs, formation });
    setCurrentView(View.MatchInProgress);
  }, []);

  const handleMatchSimulationEnd = useCallback(() => { 
    setCurrentView(View.MatchAftermath);
  }, []);

  const handleContinueToResults = useCallback(() => { 
    handleAdvanceAfterUserActionsOrSimulateRound(); 
  }, [handleAdvanceAfterUserActionsOrSimulateRound]);

  const advanceToNextRoundScreen = useCallback(() => {
    setIsLoadingView(true);
    const nextRoundIndex = currentGameRoundIndex + 1;

    if (nextRoundIndex >= GAME_ROUNDS.length) {
      // Prepare for game over, but could show final bracket first
      const bracket = generateKnockoutBracketStructure(processedMatches, groupStandings, ALL_MATCHES_SORTED, TEAMS_DATA, userTeamKey || "");
      setKnockoutBracketData(bracket);
      setCurrentView(View.KnockoutBracket); // Show final bracket then game over
      // Game over will be triggered from KnockoutBracket's continue if it's the actual end
      setIsLoadingView(false);
      return;
    }
    
    let userIsEliminated = false;
    if (userTeamKey) {
        const nextGameRound = GAME_ROUNDS[nextRoundIndex];
        if (!nextGameRound.isGroupStage) { // Check elimination only for knockout stages
            const userNextRoundMatches = getMatchesForGameRound(nextRoundIndex);
            let userParticipatesInNextRound = userNextRoundMatches.some(m => m.team1 === userTeamKey || m.team2 === userTeamKey);

            // If user team isn't directly in next round's historical matches, check bracket logic
            if (!userParticipatesInNextRound) {
                 const bracket = generateKnockoutBracketStructure(processedMatches, groupStandings, ALL_MATCHES_SORTED, TEAMS_DATA, userTeamKey);
                 const nextRoundBracketData = bracket.rounds.find(r => r.roundName === nextGameRound.name);
                 if (nextRoundBracketData) {
                    userParticipatesInNextRound = nextRoundBracketData.matches.some(bm => bm.team1Key === userTeamKey || bm.team2Key === userTeamKey);
                 }
            }
            if (!userParticipatesInNextRound) {
                 userIsEliminated = true;
            }
        }
    }
    
    if (userIsEliminated) {
        const bracket = generateKnockoutBracketStructure(processedMatches, groupStandings, ALL_MATCHES_SORTED, TEAMS_DATA, userTeamKey || "");
        setKnockoutBracketData(bracket);
        setCurrentView(View.KnockoutBracket); // Show bracket then game over
    } else {
        setCurrentGameRoundIndex(nextRoundIndex);
        loadRoundData(nextRoundIndex);
        setCurrentView(View.GameRoundFixtures);
    }
    setIsLoadingView(false);
  }, [currentGameRoundIndex, userTeamKey, loadRoundData, processedMatches, groupStandings]);


  const handleContinueFromRoundResults = useCallback(() => {
    const currentRoundInfo = GAME_ROUNDS[currentGameRoundIndex];
    if (currentRoundInfo.isGroupStage) {
        setCurrentView(View.Standings);
    } else {
        setCurrentView(View.TopScorers); 
    }
  }, [currentGameRoundIndex]);
  
  const handleContinueFromStandings = useCallback(() => { 
    setCurrentView(View.TopScorers);
  }, []);

  const handleContinueFromTopScorers = useCallback(() => {
    setTeletextHeadlines(getRandomHeadlines(4 + Math.floor(Math.random() * 2)));
    setCurrentView(View.TeletextNews);
  }, []);

  const handleContinueFromNews = useCallback(() => {
    setCurrentView(View.TournamentPulse);
  }, []);

  const handleContinueFromTournamentPulse = useCallback(() => {
    const nextRoundIndex = currentGameRoundIndex + 1;
    const currentRoundIsGroupStage = GAME_ROUNDS[currentGameRoundIndex].isGroupStage;
    const nextRoundIsKnockout = nextRoundIndex < GAME_ROUNDS.length && !GAME_ROUNDS[nextRoundIndex].isGroupStage;

    if ((currentRoundIsGroupStage && nextRoundIsKnockout) || (!currentRoundIsGroupStage && nextRoundIndex < GAME_ROUNDS.length)) {
      // Transitioning to knockout or already in knockout, show bracket
      const bracket = generateKnockoutBracketStructure(processedMatches, groupStandings, ALL_MATCHES_SORTED, TEAMS_DATA, userTeamKey || "");
      setKnockoutBracketData(bracket);
      setCurrentView(View.KnockoutBracket);
    } else {
      advanceToNextRoundScreen(); // If it's group stage to group stage, or end of tournament
    }
  }, [currentGameRoundIndex, processedMatches, groupStandings, userTeamKey, advanceToNextRoundScreen]);

  const handleContinueFromKnockoutBracket = useCallback(() => {
    const nextRoundIndex = currentGameRoundIndex + 1;
    if (nextRoundIndex >= GAME_ROUNDS.length && knockoutBracketData?.rounds.some(r => r.roundName === "Finals" && r.matches.every(m => m.winnerKey))) {
        setCurrentView(View.GameOver); // Actual end of tournament
    } else {
        // Check if user was eliminated based on last bracket shown
        let userStillIn = true;
        if (userTeamKey && knockoutBracketData) {
            userStillIn = knockoutBracketData.rounds.some(round =>
                round.matches.some(match =>
                    (match.team1Key === userTeamKey || match.team2Key === userTeamKey) && !match.winnerKey // In a future match
                    || match.winnerKey === userTeamKey // Won the last match shown
                )
            );
            
            let lastPlayedRoundIdx = -1;
            // Iterate backwards to find the last round where any match has a winner
            for (let i = knockoutBracketData.rounds.length - 1; i >= 0; i--) {
                if (knockoutBracketData.rounds[i].matches.some(m => m.winnerKey)) {
                    lastPlayedRoundIdx = i;
                    break;
                }
            }

             if (lastPlayedRoundIdx > -1 && lastPlayedRoundIdx < knockoutBracketData.rounds.length -1) { // If user played in a round but not the final one
                const nextBracketRound = knockoutBracketData.rounds[lastPlayedRoundIdx + 1];
                // Check if user is in any match of the *next* bracket round
                userStillIn = nextBracketRound.matches.some(m => m.team1Key === userTeamKey || m.team2Key === userTeamKey);
             } else if (lastPlayedRoundIdx === -1 && knockoutBracketData.rounds.length > 0) { // No knockout match played yet by anyone
                // Check if user is in the first knockout round
                userStillIn = knockoutBracketData.rounds[0].matches.some(m => m.team1Key === userTeamKey || m.team2Key === userTeamKey);
             } else if (lastPlayedRoundIdx === knockoutBracketData.rounds.length -1 && knockoutBracketData.rounds[lastPlayedRoundIdx].matches.every(m=>m.winnerKey)){
                // All matches in the final round (e.g., Final + 3rd place) are played.
                // Check if user won the actual final (M52)
                const finalMatch = knockoutBracketData.rounds[lastPlayedRoundIdx].matches.find(m=>m.matchId === "M52");
                userStillIn = finalMatch?.winnerKey === userTeamKey;
             } // If userStillIn is true here, it means they are either winners or in the next round.
               // If it remains false, they were eliminated.
        }
         if (!userStillIn) {
            setCurrentView(View.GameOver);
        } else {
            advanceToNextRoundScreen();
        }
    }
  }, [currentGameRoundIndex, knockoutBracketData, userTeamKey, advanceToNextRoundScreen]);
  
  const getGameOverDetails = useCallback(() => {
    const finalMatch = processedMatches.find(m => m.id === "M52");
    const winnerKey = finalMatch ? getMatchWinner(finalMatch) : null;
    const winnerName = winnerKey && TEAMS_DATA[winnerKey] ? TEAMS_DATA[winnerKey].name.toUpperCase() : "THE WINNER";

    if (!userTeamKey || !userTeamName) {
        return { title: "TOURNAMENT OVER", message: `${winnerName} ARE THE 1994 WORLD CUP CHAMPIONS!` };
    }

    if (winnerKey === userTeamKey) {
      return { 
        title: "CHAMPIONS!", 
        message: `CONGRATULATIONS! ${userTeamName.toUpperCase()} HAS WON THE 1994 WORLD CUP!`
      };
    }
    
    let message = `YOUR JOURNEY WITH ${userTeamName.toUpperCase()} HAS ENDED.`;
    const lastUserMatchPlayed = [...processedMatches].filter(m => m.team1 === userTeamKey || m.team2 === userTeamKey).pop();

    if (lastUserMatchPlayed) {
        const roundName = GAME_ROUNDS.find(gr => gr.matchIDs.includes(lastUserMatchPlayed.id))?.name || lastUserMatchPlayed.round.toUpperCase();
        const userLost = getMatchWinner(lastUserMatchPlayed) !== userTeamKey;

        if (userLost) {
            message = `YOUR JOURNEY WITH ${userTeamName.toUpperCase()} ENDED IN THE ${roundName}.`;
        } else { // User won their last match, but something else happened (e.g. error, or this logic is hit pre-emptively)
             message = `YOUR TEAM ${userTeamName.toUpperCase()} WAS LAST SEEN IN THE ${roundName}.`;
        }

        if(lastUserMatchPlayed.id === "M52" && winnerKey !== userTeamKey){ 
             message = `${userTeamName.toUpperCase()} FINISHED AS RUNNER-UP.\n${winnerName} ARE THE CHAMPIONS.`;
        } else if (winnerName) {
             message += `\n${winnerName} WENT ON TO WIN THE TOURNAMENT.`;
        }
    } else { // User team didn't play any match, or no processed matches for user.
        const currentRoundDef = GAME_ROUNDS[currentGameRoundIndex];
        if (currentRoundDef && currentRoundDef.isGroupStage) { // Eliminated in group stage (likely before playing all games or no games)
             message = `YOUR TEAM, ${userTeamName.toUpperCase()}, DID NOT ADVANCE FROM THE GROUP STAGES.`;
        } else if (currentRoundDef && !currentRoundDef.isGroupStage && knockoutBracketData) { // Eliminated in knockout without playing a match in that specific round
            // This case implies elimination determined by bracket before a match in this exact round was played by user.
            let userLastRoundNameFound: string | undefined = "an early knockout stage"; // Default message part
            // Try to find the last round the user was slated to participate in from the bracket
            for (let i = knockoutBracketData.rounds.length - 1; i >= 0; i--) {
                const round = knockoutBracketData.rounds[i];
                if (round.matches.some(m => m.team1Key === userTeamKey || m.team2Key === userTeamKey)) {
                    userLastRoundNameFound = round.roundName;
                    // Check if they lost in this found round
                    const userMatchInThisRound = round.matches.find(m => m.team1Key === userTeamKey || m.team2Key === userTeamKey);
                    if(userMatchInThisRound && userMatchInThisRound.winnerKey && userMatchInThisRound.winnerKey !== userTeamKey){
                         message = `YOUR JOURNEY WITH ${userTeamName.toUpperCase()} ENDED IN THE ${userLastRoundNameFound}.`;
                    } else if (userMatchInThisRound && !userMatchInThisRound.winnerKey) {
                        // Means they were in this round, but match not processed/won by opponent, should be caught by lastUserMatchPlayed.
                        // For safety, assume elimination before this round if this branch is hit.
                         message = `YOUR TEAM ${userTeamName.toUpperCase()} WAS ELIMINATED BEFORE THE ${userLastRoundNameFound}.`;
                    }
                    break; 
                }
            }
             if (!message.includes("ENDED IN THE")) { // If message wasn't set above
                 message = `YOUR JOURNEY WITH ${userTeamName.toUpperCase()} ENDED BEFORE THE ${userLastRoundNameFound || "next knockout round"}.`;
             }
        }
        if (winnerName && !message.includes("ARE THE CHAMPIONS")) { // Avoid duplicating "ARE THE CHAMPIONS"
             message += `\n${winnerName} ARE THE CHAMPIONS.`;
        } else if (!winnerName && !message.includes("CHAMPIONS")) {
            message += "\nTHE TOURNAMENT CONCLUDED.";
        }
    }
    return { title: "GAME OVER", message };
  }, [userTeamKey, userTeamName, processedMatches, currentGameRoundIndex, knockoutBracketData]);


  const renderCurrentView = () => {
    if (isLoadingView) {
        return <div className="panel-cm flex justify-center items-center h-64"><LoadingSpinner text="PLEASE WAIT..."/></div>;
    }

    switch (currentView) {
      case View.StartScreen:
        return <TeamSelectionView onTeamSelect={handleTeamSelection} showModal={showModal} />;
      case View.ConfirmTeamSquad:
        if (!userTeamKey || !TEAMS_DATA[userTeamKey]) {
            resetGame(); return <LoadingSpinner text="Error... Resetting"/>;
        }
        return <ConfirmTeamSquadView 
                  teamKey={userTeamKey} teamName={TEAMS_DATA[userTeamKey].name}
                  squad={TEAMS_DATA[userTeamKey].squad}
                  onConfirmTeam={handleProceedToTournamentKickoff} onGoBack={handleReturnToTeamSelection}
                />;
      case View.TournamentKickoff:
        return <TournamentKickoffView 
                  teamName={userTeamName || "YOUR TEAM"} userTeamKey={userTeamKey}
                  groupDefinitions={GROUP_DEFINITIONS} teamsData={TEAMS_DATA}
                  onStartTournament={handleStartTournament} 
                />;
      case View.GameRoundFixtures:
        return <GameRoundFixturesView 
                  roundName={GAME_ROUNDS[currentGameRoundIndex]?.name || "FIXTURES"}
                  matches={matchesForCurrentRound} userTeamKey={userTeamKey} userMatch={userMatchForCurrentRound}
                  onContinueToUserMatch={handleGoToMatch} onSimulateRound={handleAdvanceAfterUserActionsOrSimulateRound}
                  allHistoricalMatches={ALL_MATCHES_SORTED} 
                />;
      case View.MatchPreGame:
        if (!currentMatchForUser || !userTeamKey) {
            resetGame(); return <LoadingSpinner text="Error... Resetting"/>;
        }
        return <MatchPreGameView 
                  match={currentMatchForUser} userTeamKey={userTeamKey} 
                  onGoToTeamSelection={handleGoToTeamSelection}
                  teamsData={TEAMS_DATA} formationsData={FORMATIONS}
                />;
      case View.SquadManagement:
        if (!currentMatchForUser || !userTeamKey) {
             resetGame(); return <LoadingSpinner text="Error... Resetting"/>;
        }
        return <SquadManagementView 
                  userTeamKey={userTeamKey} currentMatch={currentMatchForUser} 
                  onSquadConfirm={handleSquadConfirmAndPlayMatch} showModal={showModal}
                  showPlayerSpotlightModal={showPlayerSpotlightModal}
                  processedMatches={processedMatches}
                  teamsData={TEAMS_DATA}
                />;
      case View.MatchInProgress:
         if (!currentMatchForUser || !userSelectedSquad) {
             resetGame(); return <LoadingSpinner text="Error... Resetting"/>;
         }
        return <MatchInProgressView matchData={currentMatchForUser} onMatchEnd={handleMatchSimulationEnd} />;
      case View.MatchAftermath:
        if (!currentMatchForUser) {
            resetGame(); return <LoadingSpinner text="Error... Resetting"/>;
        }
        return <MatchAftermathView 
                  match={currentMatchForUser} onContinue={handleContinueToResults} 
                  userTeamKey={userTeamKey} showPlayerSpotlightModal={showPlayerSpotlightModal}
                  teamsData={TEAMS_DATA} processedMatches={processedMatches}
                />;
      case View.RoundResults:
        return <RoundResultsView 
                  roundName={GAME_ROUNDS[currentGameRoundIndex]?.name || "RESULTS"}
                  matches={matchesForCurrentRound} onContinue={handleContinueFromRoundResults}
                />;
      case View.TeletextNews: 
        return <TeletextNewsView headlines={teletextHeadlines} onContinue={handleContinueFromNews} />;
      case View.Standings:
        return <StandingsView 
                  groupStandings={groupStandings} userTeamName={userTeamName}
                  allProcessedMatches={processedMatches} onContinue={handleContinueFromStandings} 
                />;
      case View.TopScorers: 
        return <TopScorersView 
                  processedMatches={processedMatches} teamsData={TEAMS_DATA}
                  onContinue={handleContinueFromTopScorers} showPlayerSpotlightModal={showPlayerSpotlightModal}
                />;
      case View.TournamentPulse:
        return <TournamentPulseView 
                  processedMatches={processedMatches} teamsData={TEAMS_DATA}
                  onContinue={handleContinueFromTournamentPulse}
                />;
      case View.KnockoutBracket:
        if (!knockoutBracketData) {
             // Should ideally not happen if logic is correct, but as a fallback:
            const bracket = generateKnockoutBracketStructure(processedMatches, groupStandings, ALL_MATCHES_SORTED, TEAMS_DATA, userTeamKey || "");
            setKnockoutBracketData(bracket); // Set the bracket data
            if (!bracket || bracket.rounds.length === 0) { // If bracket still can't be generated, advance or show error
                advanceToNextRoundScreen(); // This might lead to game over or next fixtures
                return <LoadingSpinner text="Generating bracket or advancing..."/>;
            }
             // If bracket is generated, fall through to render it.
        }
        return <KnockoutBracketView 
                  bracketData={knockoutBracketData!} // Assert not null due to check or generation above
                  userTeamKey={userTeamKey}
                  onContinue={handleContinueFromKnockoutBracket} 
                  teamsData={TEAMS_DATA}
                />;
      case View.GameOver:
        const { title, message } = getGameOverDetails();
        return <GameOverView 
                  title={title} message={message} 
                  onPlayAgain={() => resetGame(false)} onMainMenu={() => resetGame(true)}
                />;
      default:
        resetGame(); 
        return <TeamSelectionView onTeamSelect={handleTeamSelection} showModal={showModal} />;
    }
  };
  
  return (
    <> 
      <Header />
      {renderCurrentView()}
      <Modal isOpen={modalState.isOpen} title={modalState.title} message={modalState.message} onClose={closeModal} />
      <PlayerSpotlightModalComponent 
        isOpen={playerSpotlightModalState.isOpen}
        player={playerSpotlightModalState.player}
        teamName={playerSpotlightModalState.teamName}
        goals={playerSpotlightModalState.goals}
        onClose={closePlayerSpotlightModal}
      />
    </>
  );
};

export default App;