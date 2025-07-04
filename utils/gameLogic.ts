

import { GroupStandings, MatchData, Teams, GroupStanding, MatchLineup, GameRound, FullKnockoutBracket, BracketMatchup, KnockoutRoundBracket, GoalScorer } from '../types';
import { GROUP_DEFINITIONS, TEAMS_DATA, ALL_MATCHES_SORTED, GAME_ROUNDS } from '../constants';

export function initializeGroupStandings(): GroupStandings {
  const standings: GroupStandings = {};
  for (const groupKey in GROUP_DEFINITIONS) {
    standings[groupKey] = {};
    GROUP_DEFINITIONS[groupKey].forEach(teamKey => {
      if (TEAMS_DATA[teamKey]) {
        standings[groupKey][teamKey] = {
          teamKey: teamKey,
          name: TEAMS_DATA[teamKey].name,
          pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
        };
      }
    });
  }
  return standings;
}

export function updateSingleGroupStanding(currentStandings: GroupStandings, match: MatchData): GroupStandings {
  if (match.round !== "Group Stage" || !match.group || !currentStandings[match.group]) {
    return currentStandings;
  }

  const [goals1Str, goals2Str] = match.score.split('-');
  const goals1 = parseInt(goals1Str, 10);
  const goals2 = parseInt(goals2Str, 10);
  
  // If match went to penalties, the group stage result is based on the score before penalties (could be 90 min or 120 min if ET played in a hypothetical group stage with pens)
  // For WC94, group stages don't have ET or penalties. The raw match.score is definitive.
  
  const group = currentStandings[match.group];
  const team1Stats = group[match.team1];
  const team2Stats = group[match.team2];

  if (team1Stats) {
    team1Stats.pld++;
    team1Stats.gf += goals1;
    team1Stats.ga += goals2;
    team1Stats.gd = team1Stats.gf - team1Stats.ga;
    if (goals1 > goals2) { team1Stats.w++; team1Stats.pts += 3; }
    else if (goals1 === goals2) { team1Stats.d++; team1Stats.pts += 1; }
    else { team1Stats.l++; }
  }

  if (team2Stats) {
    team2Stats.pld++;
    team2Stats.gf += goals2;
    team2Stats.ga += goals1;
    team2Stats.gd = team2Stats.gf - team2Stats.ga;
    if (goals2 > goals1) { team2Stats.w++; team2Stats.pts += 3; }
    else if (goals1 === goals2) { team2Stats.d++; team2Stats.pts += 1; }
    else { team2Stats.l++; }
  }
  return currentStandings;
}

export function getMatchWinner(match: MatchData): string | null {
  if (!match || !match.score) return null;

  if (match.penalties) {
    const penaltyParts = match.penalties.split(' '); 
    const team1NameOrKeyInPens = penaltyParts[0];
    const team2NameOrKeyInPens = penaltyParts[2]; 

    const scores = penaltyParts[1].split('-');
    const score1Pens = parseInt(scores[0], 10);
    const score2Pens = parseInt(scores[1], 10);
    
    let winnerKeyInPens = null;
    // Determine winner based on who is listed first in penalty string
    if (score1Pens > score2Pens) {
        // Find teamKey for team1NameOrKeyInPens
        if (TEAMS_DATA[match.team1]?.name === team1NameOrKeyInPens || match.team1 === team1NameOrKeyInPens) winnerKeyInPens = match.team1;
        else if (TEAMS_DATA[match.team2]?.name === team1NameOrKeyInPens || match.team2 === team1NameOrKeyInPens) winnerKeyInPens = match.team2;
        else winnerKeyInPens = match.team1; // Fallback, assuming order implies match.team1
    } else if (score2Pens > score1Pens) {
       // Find teamKey for team2NameOrKeyInPens
       if (TEAMS_DATA[match.team1]?.name === team2NameOrKeyInPens || match.team1 === team2NameOrKeyInPens) winnerKeyInPens = match.team1;
       else if (TEAMS_DATA[match.team2]?.name === team2NameOrKeyInPens || match.team2 === team2NameOrKeyInPens) winnerKeyInPens = match.team2;
       else winnerKeyInPens = match.team2; // Fallback
    }
    return winnerKeyInPens;
  }

  // If no penalties, winner is determined by final score (which could be after extra time)
  // The match.score should reflect the final score (e.g., "2-1" after ET, or "1-0" after 90min)
  const scoreToUse = match.extraTimeScore || match.score;
  const [score1Str, score2Str] = scoreToUse.split('-');
  const score1 = parseInt(score1Str, 10);
  const score2 = parseInt(score2Str, 10);

  if (score1 > score2) return match.team1;
  if (score2 > score1) return match.team2;
  return null; // Draw (relevant for group stage, or if somehow called on a drawn knockout before pens string is added)
}


export function sortGroup(groupData: { [teamKey: string]: GroupStanding }, allProcessedMatches: MatchData[]): GroupStanding[] {
  return Object.values(groupData).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    
    const headToHeadMatch = allProcessedMatches.find(m => 
        m.group === Object.keys(GROUP_DEFINITIONS).find(key => GROUP_DEFINITIONS[key].includes(a.teamKey)) &&
        ((m.team1 === a.teamKey && m.team2 === b.teamKey) || (m.team1 === b.teamKey && m.team2 === a.teamKey))
    );

    if(headToHeadMatch){
        // For head-to-head, use the simple match.score (as group stage matches don't have ET/pens)
        const [h2hScore1Str, h2hScore2Str] = headToHeadMatch.score.split('-');
        const h2hScore1 = parseInt(h2hScore1Str, 10);
        const h2hScore2 = parseInt(h2hScore2Str, 10);
        let winnerH2H = null;
        if (h2hScore1 > h2hScore2) winnerH2H = headToHeadMatch.team1;
        else if (h2hScore2 > h2hScore1) winnerH2H = headToHeadMatch.team2;

        if(winnerH2H === a.teamKey) return -1;
        if(winnerH2H === b.teamKey) return 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export function getHistoricalLineup(match: MatchData, teamKey: string): MatchLineup | undefined {
    return match.lineups?.[teamKey];
}

export function getMatchesForGameRound(roundIndex: number): MatchData[] {
    if (roundIndex < 0 || roundIndex >= GAME_ROUNDS.length) {
        return [];
    }
    const gameRound = GAME_ROUNDS[roundIndex];
    return gameRound.matchIDs.map(id => ALL_MATCHES_SORTED.find(m => m.id === id)).filter(Boolean) as MatchData[];
}

export function getUserMatchForGameRound(roundIndex: number, userTeamKey: string): MatchData | undefined {
    const roundMatches = getMatchesForGameRound(roundIndex);
    return roundMatches.find(m => m.team1 === userTeamKey || m.team2 === userTeamKey);
}

export function getBestThirdPlacedTeams(
  groupStandings: GroupStandings,
  allProcessedMatches: MatchData[]
): GroupStanding[] {
  const thirdPlacedTeams: GroupStanding[] = [];
  for (const groupKey in groupStandings) {
    const sortedGroup = sortGroup(groupStandings[groupKey], allProcessedMatches);
    if (sortedGroup.length > 2) {
      thirdPlacedTeams.push(sortedGroup[2]);
    }
  }
  return thirdPlacedTeams.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    // Add drawing of lots or fair play as final tie-breaker if needed, for now name sort
    return Math.random() - 0.5; // Simulate drawing of lots for identical records
    // return a.name.localeCompare(b.name); // Previous: alphabetical sort
  }).slice(0, 4); 
}


const getSlotKeyForHistoricalTeam = (teamKey: string, group: string, rank: number, bestThirds: GroupStanding[]): string => {
    if (rank === 1) return `Winner Group ${group}`;
    if (rank === 2) return `Runner-up Group ${group}`;
    if (rank === 3 && bestThirds.some(bt => bt.teamKey === teamKey)) {
        // Find the original group of this best third team for more descriptive slot key
        const originalGroup = Object.keys(GROUP_DEFINITIONS).find(gKey => GROUP_DEFINITIONS[gKey].includes(teamKey));
        return `Best 3rd (Grp ${originalGroup || '?'})`;
    }
    return `Unknown Qualifier (${teamKey})`;
};

export function generateKnockoutBracketStructure(
  processedMatches: MatchData[],
  groupStandings: GroupStandings,
  allHistoricalMatches: MatchData[],
  teamsData: Teams,
  userTeamKey: string
): FullKnockoutBracket {
  const fullBracket: FullKnockoutBracket = { rounds: [] };

  // --- Helper to get simulated team based on historical slot criteria ---
  const getSimulatedTeamForHistoricalSlot = (histTeamKey: string, allSortedGroups: {[key: string]: GroupStanding[]}, simulatedBestThirdsKeys: string[]): string | undefined => {
      let targetGroupKey: string | undefined;
      let historicalRankInGroup = 0; // 1st, 2nd, 3rd in its original group

      for (const gk in GROUP_DEFINITIONS) {
          if (GROUP_DEFINITIONS[gk].includes(histTeamKey)) {
              targetGroupKey = gk;
              // Determine historical rank (simplified based on known 1994 Ro16 pairings)
              // This is a bit of a heuristic. The key is what *kind* of qualifier that historical team was for its Ro16 slot.
              if (["GER", "ROU", "NED", "BRA", "NGA", "MEX"].includes(histTeamKey)) historicalRankInGroup = 1; // These were group winners in 1994 who got corresponding Ro16 slots
              else if (["ESP", "SWE", "KSA", "SUI", "BUL", "IRL"].includes(histTeamKey)) historicalRankInGroup = 2; // These were group runners-up
              else if (["USA", "ITA", "BEL", "ARG"].includes(histTeamKey)) historicalRankInGroup = 3; // These were third-placed teams
              break;
          }
      }

      if (!targetGroupKey || historicalRankInGroup === 0) {
          console.warn(`Could not determine historical group/rank for ${histTeamKey}`);
          return undefined;
      }

      const simulatedSortedGroup = allSortedGroups[targetGroupKey];
      if (!simulatedSortedGroup) return undefined;

      if (historicalRankInGroup === 1) return simulatedSortedGroup[0]?.teamKey;
      if (historicalRankInGroup === 2) return simulatedSortedGroup[1]?.teamKey;
      if (historicalRankInGroup === 3) {
          const thirdPlaceSimulatedTeam = simulatedSortedGroup[2];
          if (thirdPlaceSimulatedTeam && simulatedBestThirdsKeys.includes(thirdPlaceSimulatedTeam.teamKey)) {
              return thirdPlaceSimulatedTeam.teamKey;
          }
      }
      return undefined;
  };
  // --- End Helper ---

  const allSortedSimulatedGroups: { [key: string]: GroupStanding[] } = {};
   for (const groupKey of Object.keys(GROUP_DEFINITIONS)) {
    allSortedSimulatedGroups[groupKey] = sortGroup(groupStandings[groupKey], processedMatches);
  }
  const simulatedBestThirdsKeys = getBestThirdPlacedTeams(groupStandings, processedMatches).map(t => t.teamKey);


  // Define historical pairings for Ro16 to determine slot types.
  // (e.g. M37 was Winner C vs 3rd A/B/F. GER was Winner C. BEL was 3rd F.)
  const historicalRo16SlotDefinitions: { [matchId: string]: { team1HistKey: string, team2HistKey: string, team1SlotDesc: string, team2SlotDesc: string } } = {
    "M37": { team1HistKey: "GER", team1SlotDesc: "Winner C", team2HistKey: "BEL", team2SlotDesc: "3rd Place F" },
    "M38": { team1HistKey: "ESP", team1SlotDesc: "Runner-up C", team2HistKey: "SUI", team2SlotDesc: "Runner-up A" },
    "M39": { team1HistKey: "KSA", team1SlotDesc: "Winner F", team2HistKey: "SWE", team2SlotDesc: "Runner-up B" }, // KSA won Grp F, SWE 2nd Grp B.
    "M40": { team1HistKey: "ROU", team1SlotDesc: "Winner A", team2HistKey: "ARG", team2SlotDesc: "3rd Place D" }, // ROU won Grp A, ARG 3rd Grp D.
    "M41": { team1HistKey: "NED", team1SlotDesc: "Winner E*", team2HistKey: "IRL", team2SlotDesc: "Runner-up E" }, // NED vs IRL (In 1994, NED won F, IRL 2nd E. Here using E pairings as in data)
                                                                                                      // My match data seems to pair NED(1E) vs IRL(2E), but IRL was 2E, NED was actually 1F.
                                                                                                      // Actual M41 was NED (1F) vs IRL (2E). This is consistent if we assume NED won F (which they did).
                                                                                                      // My data M32: NED 2-1 KSA. M33: BEL 1-0 NED. M35: MAR 1-2 NED. NED = 6pts.
                                                                                                      // M36: BEL 0-1 KSA. KSA = 6pts. So NED, KSA, BEL all 6 pts. My data: KSA won group F historically.
                                                                                                      // Let's re-verify historical group F: NED (1st), KSA (2nd), BEL (3rd).
                                                                                                      // So M39: KSA (2F) vs SWE (2B). M41: NED (1F) vs IRL (2E). This seems to be the real mapping.
                                                                                                      // The team1HistKey and team2HistKey should be the ACTUAL historical teams.
                                                                                                      // The slotDesc can be the generic term (Winner X, Runner-up Y)
    "M42": { team1HistKey: "BRA", team1SlotDesc: "Winner B", team2HistKey: "USA", team2SlotDesc: "3rd Place A" },
    "M43": { team1HistKey: "NGA", team1SlotDesc: "Winner D", team2HistKey: "ITA", team2SlotDesc: "3rd Place E" },
    "M44": { team1HistKey: "MEX", team1SlotDesc: "Winner E", team2HistKey: "BUL", team2SlotDesc: "Runner-up D" },
  };
   // Correcting historicalRo16SlotDefinitions based on actual 1994 final standings and pairings:
   // Group A: ROU (1st), SUI (2nd), USA (3rd*)
   // Group B: BRA (1st), SWE (2nd)
   // Group C: GER (1st), ESP (2nd)
   // Group D: NGA (1st), BUL (2nd), ARG (3rd*)
   // Group E: MEX (1st), IRL (2nd), ITA (3rd*)
   // Group F: NED (1st), KSA (2nd), BEL (3rd*)
   // Ro16 Pairings:
   // M37: GER (1C) vs BEL (3F) -> Correct
   // M38: ESP (2C) vs SUI (2A) -> Correct
   // M39: SWE (2B) vs KSA (2F) -> KSA was historically 2F. SWE was 2B. This looks ok.
   historicalRo16SlotDefinitions["M39"] = { team1HistKey: "SWE", team1SlotDesc: "Runner-up B", team2HistKey: "KSA", team2SlotDesc: "Runner-up F" };
   // M40: ROU (1A) vs ARG (3D) -> Correct
   // M41: NED (1F) vs IRL (2E) -> Correct
   historicalRo16SlotDefinitions["M41"] = { team1HistKey: "NED", team1SlotDesc: "Winner F", team2HistKey: "IRL", team2SlotDesc: "Runner-up E" };
   // M42: BRA (1B) vs USA (3A) -> Correct
   // M43: NGA (1D) vs ITA (3E) -> Correct
   // M44: MEX (1E) vs BUL (2D) -> Correct


  const processedWinners: { [matchId: string]: string } = {}; 
  processedMatches.forEach(pm => {
    if (!GAME_ROUNDS.find(gr => gr.matchIDs.includes(pm.id))?.isGroupStage) {
        const winner = getMatchWinner(pm); // getMatchWinner uses final score (ET or Pens)
        if (winner) processedWinners[pm.id] = winner;
    }
  });
  
  const knockoutRounds = GAME_ROUNDS.filter(gr => !gr.isGroupStage);

  knockoutRounds.forEach(gameRound => {
    const roundBracket: KnockoutRoundBracket = { roundName: gameRound.name, matches: [] };
    
    gameRound.matchIDs.forEach(histMatchId => {
      const historicalMatch = allHistoricalMatches.find(m => m.id === histMatchId)!;
      const bracketMatch: BracketMatchup = {
        matchId: histMatchId,
        roundTitle: gameRound.name,
        team1SlotKey: "",
        team2SlotKey: "",
      };

      if (gameRound.name === "Round of 16") {
        const slotDef = historicalRo16SlotDefinitions[histMatchId];
        if (slotDef) {
            bracketMatch.team1Key = getSimulatedTeamForHistoricalSlot(slotDef.team1HistKey, allSortedSimulatedGroups, simulatedBestThirdsKeys);
            bracketMatch.team2Key = getSimulatedTeamForHistoricalSlot(slotDef.team2HistKey, allSortedSimulatedGroups, simulatedBestThirdsKeys);
            bracketMatch.team1SlotKey = slotDef.team1SlotDesc; 
            bracketMatch.team2SlotKey = slotDef.team2SlotDesc; 
        } else { 
            // Fallback, should not happen if definitions are complete
            bracketMatch.team1SlotKey = teamsData[historicalMatch.team1]?.name || historicalMatch.team1;
            bracketMatch.team2SlotKey = teamsData[historicalMatch.team2]?.name || historicalMatch.team2;
        }
      } else { // QF, SF, Finals
        const semiFinal1_Hist_ID = "M49"; // BUL vs ITA
        const semiFinal2_Hist_ID = "M50"; // SWE vs BRA

        if (histMatchId === "M51") { // Third Place: Historically SWE vs BUL (Loser M50 vs Loser M49)
            bracketMatch.team1SlotKey = `Loser ${semiFinal2_Hist_ID}`; 
            bracketMatch.team2SlotKey = `Loser ${semiFinal1_Hist_ID}`;

            const processedSF2 = processedMatches.find(pm => pm.id === semiFinal2_Hist_ID);
            const winnerSF2 = processedSF2 ? getMatchWinner(processedSF2) : null;
            if (processedSF2 && winnerSF2) {
                bracketMatch.team1Key = winnerSF2 === processedSF2.team1 ? processedSF2.team2 : processedSF2.team1;
            }
            const processedSF1 = processedMatches.find(pm => pm.id === semiFinal1_Hist_ID);
            const winnerSF1 = processedSF1 ? getMatchWinner(processedSF1) : null;
            if (processedSF1 && winnerSF1) {
                bracketMatch.team2Key = winnerSF1 === processedSF1.team1 ? processedSF1.team2 : processedSF1.team1;
            }
        } else if (histMatchId === "M52") { // Final: Historically BRA vs ITA (Winner M50 vs Winner M49)
            bracketMatch.team1SlotKey = `Winner ${semiFinal2_Hist_ID}`;
            bracketMatch.team2SlotKey = `Winner ${semiFinal1_Hist_ID}`;
            if (processedWinners[semiFinal2_Hist_ID]) bracketMatch.team1Key = processedWinners[semiFinal2_Hist_ID];
            if (processedWinners[semiFinal1_Hist_ID]) bracketMatch.team2Key = processedWinners[semiFinal1_Hist_ID];
        } else { // For QF and SF matches
            const findOriginMatchId = (teamKeyFromHistMatch: string, currentRoundName: string): string | undefined => {
              const currentRoundDefIndex = GAME_ROUNDS.findIndex(gr => gr.name === currentRoundName);
              for (let i = currentRoundDefIndex - 1; i >=0; i--) {
                  const prevRound = GAME_ROUNDS[i];
                  if (prevRound.isGroupStage) continue; 
                  for (const prevMatchId of prevRound.matchIDs) {
                      const prevHistMatchData = allHistoricalMatches.find(m => m.id === prevMatchId)!;
                      if (getMatchWinner(prevHistMatchData) === teamKeyFromHistMatch) return prevMatchId;
                  }
              }
              return undefined;
            };
            
            const origin1 = findOriginMatchId(historicalMatch.team1, gameRound.name);
            const origin2 = findOriginMatchId(historicalMatch.team2, gameRound.name);

            bracketMatch.team1SlotKey = origin1 ? `Winner ${origin1}` : (teamsData[historicalMatch.team1]?.name || historicalMatch.team1);
            bracketMatch.team2SlotKey = origin2 ? `Winner ${origin2}` : (teamsData[historicalMatch.team2]?.name || historicalMatch.team2);

            if (origin1 && processedWinners[origin1]) bracketMatch.team1Key = processedWinners[origin1];
            if (origin2 && processedWinners[origin2]) bracketMatch.team2Key = processedWinners[origin2];
        }
      }
      
      if (bracketMatch.team1Key) bracketMatch.team1 = teamsData[bracketMatch.team1Key];
      if (bracketMatch.team2Key) bracketMatch.team2 = teamsData[bracketMatch.team2Key];

      const processedVersionOfThisMatch = processedMatches.find(pm => pm.id === histMatchId);
      if (processedVersionOfThisMatch) {
        bracketMatch.score = processedVersionOfThisMatch.extraTimeScore || processedVersionOfThisMatch.score; // Display final score before pens
        bracketMatch.penalties = processedVersionOfThisMatch.penalties;
        bracketMatch.winnerKey = getMatchWinner(processedVersionOfThisMatch);
      }
      
      bracketMatch.isUserTeam1 = bracketMatch.team1Key === userTeamKey;
      bracketMatch.isUserTeam2 = bracketMatch.team2Key === userTeamKey;

      roundBracket.matches.push(bracketMatch);
    });
    fullBracket.rounds.push(roundBracket);
  });

  return fullBracket;
}

// Helper to calculate score from goalScorers up to a certain minute
export function calculateScoreFromMatchEvents(
  team1Key: string,
  team2Key: string,
  goalScorers: GoalScorer[],
  upToMinute: number = Infinity
): { score1: number; score2: number; scoreStr: string } {
  let s1 = 0;
  let s2 = 0;
  goalScorers.forEach(goal => {
    // Robust minute parsing: "45", "45+2", "90+1" -> 45, 45, 90
    const minuteStr = goal.minute.split('+')[0];
    const minute = parseInt(minuteStr.replace(/[^0-9]/g, ''), 10);

    if (!isNaN(minute) && minute <= upToMinute) {
      const isOwnGoalForTeam1 = goal.type && goal.type.toLowerCase().includes("own goal") && goal.team === team2Key;
      const isOwnGoalForTeam2 = goal.type && goal.type.toLowerCase().includes("own goal") && goal.team === team1Key;

      if (isOwnGoalForTeam1) s1++;
      else if (isOwnGoalForTeam2) s2++;
      else if (goal.team === team1Key) s1++;
      else if (goal.team === team2Key) s2++;
    }
  });
  return { score1: s1, score2: s2, scoreStr: `${s1}-${s2}` };
}