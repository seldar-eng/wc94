
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MatchData, GoalScorer, PenaltyKickEventToShow, SimulatedPenaltyKick } from '../types';
import { TEAMS_DATA } from '../constants';
import { calculateScoreFromMatchEvents } from '../utils/gameLogic';


interface MatchInProgressViewProps {
  matchData: MatchData;
  onMatchEnd: () => void;
}

const SIMULATION_BASE_DURATION_MS = 15000;
const UPDATES_PER_SECOND = 10; 

type GamePhase = 'REGULATION' | 'EXTRA_TIME' | 'PENALTIES' | 'ENDED';

const MatchInProgressView: React.FC<MatchInProgressViewProps> = ({ matchData, onMatchEnd }) => {
  const [elapsedGameTime, setElapsedGameTime] = useState(0); 
  const [visibleGoals, setVisibleGoals] = useState<GoalScorer[]>([]);
  const [currentGoalMessage, setCurrentGoalMessage] = useState<string | null>(null);
  
  const [gamePhase, setGamePhase] = useState<GamePhase>('REGULATION');
  const [currentMaxMinutes, setCurrentMaxMinutes] = useState(90);
  
  const [penaltyKickEventsToDisplay, setPenaltyKickEventsToDisplay] = useState<PenaltyKickEventToShow[]>([]);
  const [currentPenaltyKickIndexToDisplay, setCurrentPenaltyKickIndexToDisplay] = useState(0);
  const precomputedPenaltySequence = useRef<SimulatedPenaltyKick[]>([]);
  const penaltyShootoutRunningScore = useRef<{ team1: number, team2: number }>({ team1: 0, team2: 0 });

  const goalDisplayTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  const team1Name = TEAMS_DATA[matchData.team1]?.name.toUpperCase() || matchData.team1.toUpperCase();
  const team2Name = TEAMS_DATA[matchData.team2]?.name.toUpperCase() || matchData.team2.toUpperCase();
  
  const gameMinutesPerUpdate = useMemo(() => {
    const totalUpdatesForPhase = (SIMULATION_BASE_DURATION_MS / 1000) * UPDATES_PER_SECOND * (currentMaxMinutes / 90);
    return currentMaxMinutes / totalUpdatesForPhase;
  }, [currentMaxMinutes]);


  // Effect for game timer progression
  useEffect(() => {
    if (gamePhase === 'PENALTIES' || gamePhase === 'ENDED') return;

    lastUpdateTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      if (timestamp - lastUpdateTimeRef.current >= (1000 / UPDATES_PER_SECOND)) {
        lastUpdateTimeRef.current = timestamp;
        updateCountRef.current++;
        
        const newElapsedGameTime = Math.min(currentMaxMinutes, updateCountRef.current * gameMinutesPerUpdate);
        setElapsedGameTime(newElapsedGameTime);

        if (newElapsedGameTime >= currentMaxMinutes) {
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
          return; 
        }
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (goalDisplayTimeoutRef.current) clearTimeout(goalDisplayTimeoutRef.current);
    };
  }, [matchData.id, gamePhase, currentMaxMinutes, gameMinutesPerUpdate]);


  // Effect for phase transitions and match end
  useEffect(() => {
    if (gamePhase === 'ENDED') return;

    const handlePhaseEnd = () => {
        if (goalDisplayTimeoutRef.current) clearTimeout(goalDisplayTimeoutRef.current);
        setCurrentGoalMessage(null);

        if (gamePhase === 'REGULATION' && elapsedGameTime >= 90) {
            const scoreAt90 = calculateScoreFromMatchEvents(matchData.team1, matchData.team2, matchData.goalScorers, 90);
            const isKnockout = matchData.round !== "Group Stage";
            const isDrawAt90 = scoreAt90.score1 === scoreAt90.score2;
            const canGoToExtraTime = isKnockout && (matchData.extraTimeScore || matchData.penalties);

            if (isDrawAt90 && canGoToExtraTime) {
                setGamePhase('EXTRA_TIME');
                setCurrentMaxMinutes(120);
                setElapsedGameTime(90);
                updateCountRef.current = Math.floor(90 / gameMinutesPerUpdate);
                setVisibleGoals(matchData.goalScorers.filter(g => parseInt(g.minute.replace(/[^0-9]/g, '')) <= 90));
            } else if (isDrawAt90 && matchData.penalties) {
                setGamePhase('PENALTIES');
            } else {
                setGamePhase('ENDED');
                setTimeout(onMatchEnd, 500);
            }
        } else if (gamePhase === 'EXTRA_TIME' && elapsedGameTime >= 120) {
            const scoreAt120 = calculateScoreFromMatchEvents(matchData.team1, matchData.team2, matchData.goalScorers, 120);
            const isDrawAt120 = scoreAt120.score1 === scoreAt120.score2;

            if (isDrawAt120 && matchData.penalties) {
                setGamePhase('PENALTIES');
            } else {
                setGamePhase('ENDED');
                setTimeout(onMatchEnd, 500);
            }
        }
    };
    
    if ((gamePhase === 'REGULATION' && elapsedGameTime >= 90) || (gamePhase === 'EXTRA_TIME' && elapsedGameTime >= 120)) {
        handlePhaseEnd();
    }

  }, [elapsedGameTime, gamePhase, matchData, onMatchEnd, gameMinutesPerUpdate]);


  // Effect for goal detection
  useEffect(() => {
    if (gamePhase === 'PENALTIES' || gamePhase === 'ENDED') return;

    if (elapsedGameTime === 0 && gamePhase === 'REGULATION' && visibleGoals.length > 0) {
        setVisibleGoals([]);
    }
    
    if (gamePhase === 'EXTRA_TIME' && elapsedGameTime === 90 && visibleGoals.filter(g => parseInt(g.minute.replace(/[^0-9]/g, '')) <= 90).length !== matchData.goalScorers.filter(g => parseInt(g.minute.replace(/[^0-9]/g, '')) <= 90).length) {
       setVisibleGoals(matchData.goalScorers.filter(g => parseInt(g.minute.replace(/[^0-9]/g, '')) <= 90));
    }


    matchData.goalScorers.forEach(goal => {
      const goalMinute = parseInt(goal.minute.replace(/[^0-9]/g, ''), 10);
      const justCrossedGoalMinute = goalMinute > 0 && goalMinute <= elapsedGameTime && goalMinute > (elapsedGameTime - gameMinutesPerUpdate);

      if (justCrossedGoalMinute && !visibleGoals.some(vg => vg.player === goal.player && vg.minute === goal.minute && vg.team === goal.team)) {
        setVisibleGoals(prev => [...prev, goal].sort((a, b) => parseInt(a.minute.replace(/[^0-9]/g, '')) - parseInt(b.minute.replace(/[^0-9]/g, ''))));
        const goalTeamName = TEAMS_DATA[goal.team]?.name.toUpperCase() || goal.team.toUpperCase();
        let message = `GOAL! ${goal.player.toUpperCase()} (${goalTeamName}) SCORES IN THE ${goal.minute} MINUTE!`;
        if (goal.type) message += ` (${goal.type.toUpperCase()})`;
        
        setCurrentGoalMessage(message);
        if(goalDisplayTimeoutRef.current) clearTimeout(goalDisplayTimeoutRef.current);
        goalDisplayTimeoutRef.current = window.setTimeout(() => setCurrentGoalMessage(null), 3000);
      }
    });
  }, [elapsedGameTime, matchData.goalScorers, visibleGoals, gamePhase, gameMinutesPerUpdate]);

  // Effect to initiate penalty shootout sequence generation
   useEffect(() => {
    if (gamePhase === 'PENALTIES' && matchData.penalties) {
        penaltyShootoutRunningScore.current = { team1: 0, team2: 0 };
        setPenaltyKickEventsToDisplay([]);
        setCurrentPenaltyKickIndexToDisplay(0);
        precomputedPenaltySequence.current = [];

        const parts = matchData.penalties.split(' ');
        const penTeam1Identity = parts[0];
        const penTeam2Identity = parts[2];
        const penScores = parts[1].split('-');
        const targetPenScoreForIdentity1 = parseInt(penScores[0], 10);
        const targetPenScoreForIdentity2 = parseInt(penScores[1], 10);

        let scoreToReachForTeam1Display: number;
        let scoreToReachForTeam2Display: number;

        const team1IsPenIdentity1 = TEAMS_DATA[matchData.team1]?.name === penTeam1Identity || matchData.team1 === penTeam1Identity;

        if (team1IsPenIdentity1) {
            scoreToReachForTeam1Display = targetPenScoreForIdentity1;
            scoreToReachForTeam2Display = targetPenScoreForIdentity2;
        } else {
            scoreToReachForTeam1Display = targetPenScoreForIdentity2;
            scoreToReachForTeam2Display = targetPenScoreForIdentity1;
        }
        
        const penTeam1DisplayData = { key: matchData.team1, name: TEAMS_DATA[matchData.team1]?.name || matchData.team1 };
        const penTeam2DisplayData = { key: matchData.team2, name: TEAMS_DATA[matchData.team2]?.name || matchData.team2 };
        
        let liveScore1 = 0;
        let liveScore2 = 0;
        let kicks1 = 0;
        let kicks2 = 0;
        const sequence: SimulatedPenaltyKick[] = [];

        for (let i = 0; i < 5; i++) {
            kicks1++;
            if (liveScore1 < scoreToReachForTeam1Display) {
                sequence.push({ teamKey: penTeam1DisplayData.key, teamName: penTeam1DisplayData.name, outcome: 'SCORED' });
                liveScore1++;
            } else {
                sequence.push({ teamKey: penTeam1DisplayData.key, teamName: penTeam1DisplayData.name, outcome: 'MISSED' });
            }

            if (liveScore1 > liveScore2 + (5 - kicks2) || liveScore2 > liveScore1 + (5 - kicks1)) {
                 break;
            }

            kicks2++;
            if (liveScore2 < scoreToReachForTeam2Display) {
                sequence.push({ teamKey: penTeam2DisplayData.key, teamName: penTeam2DisplayData.name, outcome: 'SCORED' });
                liveScore2++;
            } else {
                sequence.push({ teamKey: penTeam2DisplayData.key, teamName: penTeam2DisplayData.name, outcome: 'MISSED' });
            }
            
            if (liveScore1 > liveScore2 + (5 - kicks2) || liveScore2 > liveScore1 + (5 - kicks1)) {
                 break;
            }
        }
        while((liveScore1 < scoreToReachForTeam1Display || liveScore2 < scoreToReachForTeam2Display) && liveScore1 === liveScore2 && sequence.length < 20) {
            kicks1++;
            if (liveScore1 < scoreToReachForTeam1Display) {
                sequence.push({ teamKey: penTeam1DisplayData.key, teamName: penTeam1DisplayData.name, outcome: 'SCORED' });
                liveScore1++;
            } else {
                sequence.push({ teamKey: penTeam1DisplayData.key, teamName: penTeam1DisplayData.name, outcome: 'MISSED' });
            }
            
            kicks2++;
            if (liveScore2 < scoreToReachForTeam2Display) {
                sequence.push({ teamKey: penTeam2DisplayData.key, teamName: penTeam2DisplayData.name, outcome: 'SCORED' });
                liveScore2++;
            } else {
                sequence.push({ teamKey: penTeam2DisplayData.key, teamName: penTeam2DisplayData.name, outcome: 'MISSED' });
            }
            if (liveScore1 !== liveScore2) break;
        }

        precomputedPenaltySequence.current = sequence;
    }
  }, [gamePhase, matchData]);


  // Effect for displaying penalty kicks one by one
  useEffect(() => {
    if (gamePhase === 'PENALTIES' && currentPenaltyKickIndexToDisplay < precomputedPenaltySequence.current.length) {
      const PENALTY_KICK_DISPLAY_DURATION_MS = 1800;
      const timer = setTimeout(() => {
        const kick = precomputedPenaltySequence.current[currentPenaltyKickIndexToDisplay];
        if (kick.outcome === 'SCORED') {
          if (kick.teamKey === matchData.team1) penaltyShootoutRunningScore.current.team1++;
          else penaltyShootoutRunningScore.current.team2++;
        }
        
        const displayEvent: PenaltyKickEventToShow = {
          teamName: kick.teamName.toUpperCase(),
          outcome: kick.outcome,
          currentScoreDisplay: `${penaltyShootoutRunningScore.current.team1}-${penaltyShootoutRunningScore.current.team2}`,
          kickNumber: Math.floor(currentPenaltyKickIndexToDisplay / 2) + 1
        };
        setPenaltyKickEventsToDisplay(prev => [...prev, displayEvent]);
        setCurrentPenaltyKickIndexToDisplay(prev => prev + 1);
      }, PENALTY_KICK_DISPLAY_DURATION_MS);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'PENALTIES' && currentPenaltyKickIndexToDisplay >= precomputedPenaltySequence.current.length && precomputedPenaltySequence.current.length > 0) {
      setGamePhase('ENDED');
      setTimeout(onMatchEnd, 900); 
    }
  }, [gamePhase, currentPenaltyKickIndexToDisplay, onMatchEnd, matchData.team1, matchData.team2]);


  const displayTime = gamePhase === 'PENALTIES' ? "PENALTIES" : 
                      gamePhase === 'ENDED' && elapsedGameTime >= currentMaxMinutes ? (currentMaxMinutes === 120 ? "120:00 FT" : "90:00 FT") :
                      `${String(Math.floor(elapsedGameTime)).padStart(2, '0')}:00`;
  
  const liveScore = calculateScoreFromMatchEvents(matchData.team1, matchData.team2, visibleGoals, elapsedGameTime);

  const simulationMessage = gamePhase === 'REGULATION' ? "SIMULATING MATCH..." :
                         gamePhase === 'EXTRA_TIME' ? "SIMULATING EXTRA TIME..." :
                         gamePhase === 'PENALTIES' ? "PENALTY SHOOTOUT IN PROGRESS..." :
                         "MATCH CONCLUDED";

  return (
    <div className="panel-cm text-center">
      <h2 className="text-2xl mb-3 border-b-2 border-cm-gray-light pb-1">MATCH IN PROGRESS</h2>
      
      <div className="my-4 text-4xl font-bold text-cm-cream">
        <span>{team1Name}</span>
        <span className="mx-4 text-cm-yellow">{liveScore.score1} - {liveScore.score2}</span>
        <span>{team2Name}</span>
      </div>

      {(gamePhase === 'REGULATION' || gamePhase === 'EXTRA_TIME') && visibleGoals.length > 0 && (
        <div className="my-2 text-base border border-cm-gray-light bg-black/20 p-1.5 max-h-24 overflow-y-auto custom-scrollbar">
          <ul className="space-y-0.5">
            {visibleGoals.map((goal, index) => (
              <li key={index} className="text-cm-cream">
                {goal.player.toUpperCase()} ({TEAMS_DATA[goal.team]?.name.toUpperCase() || goal.team.toUpperCase()}) - {goal.minute}'
                {goal.type && <span className="italic text-cm-cyan/80"> ({goal.type})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {gamePhase === 'PENALTIES' && (
        <div className="my-2 text-base border-2 border-cm-yellow bg-cm-yellow/10 p-1.5 max-h-36 overflow-y-auto custom-scrollbar">
          <h4 className="font-bold text-lg text-cm-yellow mb-1">PENALTY SHOOTOUT:</h4>
          {penaltyKickEventsToDisplay.length === 0 && <p className="italic text-cm-cream">Preparing for shootout...</p>}
          <ul className="space-y-0.5">
            {penaltyKickEventsToDisplay.map((event, index) => (
              <li key={index} className={event.outcome === 'SCORED' ? 'text-green-400' : 'text-red-400'}>
                {event.teamName}: {event.outcome}! ({event.currentScoreDisplay})
              </li>
            ))}
          </ul>
        </div>
      )}


      <div className="my-6 text-6xl text-white bg-black inline-block p-2 border-2 border-cm-gray-light">
        {displayTime}
      </div>

      {currentGoalMessage && (gamePhase === 'REGULATION' || gamePhase === 'EXTRA_TIME') && (
        <div className="my-3 p-2 text-lg font-bold text-black bg-cm-yellow border-2 border-yellow-300 animate-pulse">
          {currentGoalMessage}
        </div>
      )}
       {(!currentGoalMessage || gamePhase === 'PENALTIES') && (
         <div className="my-3 p-2 text-lg h-12"> </div>
       )}

      {(gamePhase === 'REGULATION' || gamePhase === 'EXTRA_TIME') && (
        <>
          <div className="w-full h-4 bg-cm-gray-dark border border-cm-gray-light mt-4">
            <div 
              className="h-full bg-cm-cyan" 
              style={{ width: `${(elapsedGameTime / currentMaxMinutes) * 100}%`, transition: 'width 0.05s linear' }}
            ></div>
          </div>
        </>
      )}
      <p className="text-base text-cm-cream mt-1">{simulationMessage}</p>
    </div>
  );
};

export default MatchInProgressView;