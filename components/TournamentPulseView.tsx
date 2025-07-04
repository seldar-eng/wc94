
import React, { useMemo } from 'react';
import { MatchData, Teams } from '../types';

interface TournamentPulseViewProps {
  processedMatches: MatchData[];
  teamsData: Teams;
  onContinue: () => void;
}

const TournamentPulseView: React.FC<TournamentPulseViewProps> = ({ processedMatches, teamsData, onContinue }) => {
  const stats = useMemo(() => {
    let totalGoals = 0;
    let totalMatches = processedMatches.length;
    let totalRedCards = 0;
    let highestScoringMatch: MatchData | null = null;
    let maxGoalsInMatch = -1;
    let quickestGoal = { minute: Infinity, player: '', team: '' };
    
    const teamGoalsScored: { [key: string]: number } = {};
    const teamGoalsConceded: { [key: string]: number } = {};

    processedMatches.forEach(match => {
      const [score1Str, score2Str] = match.score.split('-');
      const goals1 = parseInt(score1Str, 10);
      const goals2 = parseInt(score2Str, 10);
      const currentMatchTotalGoals = goals1 + goals2;

      totalGoals += currentMatchTotalGoals;

      teamGoalsScored[match.team1] = (teamGoalsScored[match.team1] || 0) + goals1;
      teamGoalsConceded[match.team1] = (teamGoalsConceded[match.team1] || 0) + goals2;
      teamGoalsScored[match.team2] = (teamGoalsScored[match.team2] || 0) + goals2;
      teamGoalsConceded[match.team2] = (teamGoalsConceded[match.team2] || 0) + goals1;

      if (currentMatchTotalGoals > maxGoalsInMatch) {
        maxGoalsInMatch = currentMatchTotalGoals;
        highestScoringMatch = match;
      }

      match.goalScorers.forEach(goal => {
        const minute = parseInt(goal.minute.replace('+', '').split("'")[0]);
        if (minute < quickestGoal.minute && !(goal.type && goal.type.toLowerCase().includes("own goal"))) {
          quickestGoal = { minute, player: goal.player, team: teamsData[goal.team]?.name || goal.team };
        }
      });

      if (match.events) {
        match.events.forEach(event => {
          if (event.type === "Card" && event.card === "Red") {
            totalRedCards++;
          }
        });
      }
    });

    const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2) : "0.00";

    let bestOffense = { name: 'N/A', goals: -1 };
    for (const teamKey in teamGoalsScored) {
      if (teamGoalsScored[teamKey] > bestOffense.goals) {
        bestOffense = { name: teamsData[teamKey]?.name || teamKey, goals: teamGoalsScored[teamKey] };
      }
    }

    let bestDefense = { name: 'N/A', goals: Infinity };
     for (const teamKey in teamGoalsConceded) {
      if (processedMatches.some(m => m.team1 === teamKey || m.team2 === teamKey)) {
        if (teamGoalsConceded[teamKey] < bestDefense.goals) {
            bestDefense = { name: teamsData[teamKey]?.name || teamKey, goals: teamGoalsConceded[teamKey] };
        }
      }
    }
    if (bestDefense.goals === Infinity) bestDefense = {name: 'N/A', goals: 0};


    return {
      totalGoals,
      avgGoalsPerMatch,
      totalRedCards,
      highestScoringMatch,
      quickestGoal: quickestGoal.minute !== Infinity ? quickestGoal : null,
      bestOffense: bestOffense.goals !== -1 ? bestOffense : null,
      bestDefense: bestDefense.name !== 'N/A' ? bestDefense : null,
      totalMatchesPlayed: totalMatches
    };
  }, [processedMatches, teamsData]);

  if (stats.totalMatchesPlayed === 0) {
    return (
        <div className="panel-cm text-center">
            <h2 className="text-2xl mb-3 border-b-2 border-cm-gray-light pb-1">TOURNAMENT PULSE</h2>
            <p className="text-lg italic my-6">NO MATCHES PROCESSED YET. STATISTICS WILL APPEAR HERE SOON.</p>
            <button type="button" onClick={onContinue} className="btn-pm w-full mt-4 text-lg">
                CONTINUE <i className="fas fa-angle-double-right ml-1"></i>
            </button>
        </div>
    );
  }

  return (
    <div className="panel-cm">
      <h2 className="text-2xl mb-4 text-center border-b-2 border-cm-gray-light pb-1">
        TOURNAMENT PULSE
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-lg text-cm-cream">
        <div className="p-2 border border-cm-gray-light bg-black/20">
          <p><span className="font-semibold text-cm-cyan">TOTAL GOALS SCORED:</span> {stats.totalGoals}</p>
        </div>
        <div className="p-2 border border-cm-gray-light bg-black/20">
          <p><span className="font-semibold text-cm-cyan">AVG. GOALS/MATCH:</span> {stats.avgGoalsPerMatch}</p>
        </div>
        <div className="p-2 border border-cm-gray-light bg-black/20">
          <p><span className="font-semibold text-cm-cyan">TOTAL RED CARDS:</span> <span className="text-red-400">{stats.totalRedCards}</span></p>
        </div>
        {stats.quickestGoal && (
          <div className="p-2 border border-cm-gray-light bg-black/20">
            <p><span className="font-semibold text-cm-cyan">QUICKEST GOAL:</span> {stats.quickestGoal.player.toUpperCase()} ({stats.quickestGoal.team.toUpperCase()}) - {stats.quickestGoal.minute}'</p>
          </div>
        )}
        {stats.highestScoringMatch && (
          <div className="p-2 border border-cm-gray-light bg-black/20 md:col-span-2">
            <p><span className="font-semibold text-cm-cyan">HIGHEST SCORING MATCH:</span> 
              {` ${teamsData[stats.highestScoringMatch.team1]?.name.toUpperCase()} ${stats.highestScoringMatch.score} ${teamsData[stats.highestScoringMatch.team2]?.name.toUpperCase()}`}
            </p>
          </div>
        )}
        {stats.bestOffense && (
          <div className="p-2 border border-cm-gray-light bg-black/20">
            <p><span className="font-semibold text-cm-cyan">BEST OFFENSE:</span> {stats.bestOffense.name.toUpperCase()} ({stats.bestOffense.goals} goals)</p>
          </div>
        )}
        {stats.bestDefense && (
          <div className="p-2 border border-cm-gray-light bg-black/20">
            <p><span className="font-semibold text-cm-cyan">BEST DEFENSE:</span> {stats.bestDefense.name.toUpperCase()} ({stats.bestDefense.goals} conceded)</p>
          </div>
        )}
      </div>
      
      <button type="button" onClick={onContinue} className="btn-pm w-full mt-5 text-lg">
        CONTINUE <i className="fas fa-angle-double-right ml-1"></i>
      </button>
    </div>
  );
};

export default TournamentPulseView;