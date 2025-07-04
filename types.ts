

export interface Player {
  number: number;
  name: string;
  posStr: string;
  category: PlayerCategory; // Derived from posStr
  rating?: number; // Optional: for future simulation enhancements
  flavorText?: string; // Added for Player Spotlight
}

export type PlayerCategory = "GK" | "DF" | "MF" | "FW" | "Unknown";

export interface TeamData {
  name: string;
  squad: Player[];
}

export interface Teams {
  [key: string]: TeamData;
}

export interface FormationRequirements {
  GK: number;
  DF: number;
  MF: number;
  FW: number;
  description: string;
}

export interface Formations {
  [key: string]: FormationRequirements; // Corrected: Was Formations
}

export interface GoalScorer {
  team: string;
  player: string;
  minute: string;
  type?: string; // e.g., "Penalty", "Own Goal"
}

export interface MatchEvent {
  type: "Card" | "Info" | "Substitution"; // Substitution added for potential enhancement
  team?: string;
  player?: string;
  card?: "Yellow" | "Red";
  minute?: string;
  text?: string; // For "Info" type or general event description
  // For substitutions
  playerOut?: string;
  playerIn?: string;
}

export interface MatchLineup {
  starters: number[];
  subs?: number[]; // Optional, as not all historical data has this
  formation: string; // e.g., "4-4-2"
}

export interface MatchData {
  id: string;
  group?: string; // Group A, B, C, etc.
  round: string; // Original round name: Group Stage, Round of 16, etc.
  date: string;
  venue: string;
  team1: string; // Team key
  team2: string; // Team key
  score: string; // e.g., "1-0"
  halfTimeScore: string;
  goalScorers: GoalScorer[];
  lineups?: { // Optional, as not all historical matches have detailed lineups
    [teamKey: string]: MatchLineup;
  };
  events?: MatchEvent[];
  penalties?: string; // e.g., "BRA 3-2 ITA"
  extraTimeScore?: string; // e.g., "1-1"
}

export interface GroupStanding {
  teamKey: string;
  name: string;
  pld: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface GroupStandings {
  [groupKey: string]: {
    [teamKey: string]: GroupStanding;
  };
}

export enum View {
  StartScreen = 'startScreen',
  ConfirmTeamSquad = 'confirmTeamSquad', 
  TournamentKickoff = 'tournamentKickoff',
  GameRoundFixtures = 'gameRoundFixtures',
  MatchPreGame = 'matchPreGame',
  SquadManagement = 'squadManagement',
  MatchInProgress = 'matchInProgress',
  MatchAftermath = 'matchAftermath',
  RoundResults = 'roundResults',
  TeletextNews = 'teletextNews', 
  Standings = 'standings',
  TopScorers = 'topScorers',
  TournamentPulse = 'tournamentPulse', // New view for tournament stats
  KnockoutBracket = 'knockoutBracket', // New view for knockout bracket
  GameOver = 'gameOver',
}

export interface PlayerPositionDetail {
  main: string; // e.g., GK, CB, CM, CF
  category: PlayerCategory;
}

export interface PlayerPositionsMap {
  [key: string]: PlayerPositionDetail;
}

export type GameRoundType = 
  | "Group Stage - Round 1"
  | "Group Stage - Round 2"
  | "Group Stage - Round 3"
  | "Round of 16"
  | "Quarter-finals"
  | "Semi-finals"
  | "Finals"; 

export interface GameRound {
  name: GameRoundType;
  matchIDs: string[]; 
  isGroupStage: boolean;
}

export interface PlayerScore {
  name: string;
  teamKey: string;
  teamName: string;
  goals: number;
}

// Types for Knockout Bracket View
export interface BracketMatchup {
  matchId: string; // Historical match ID (e.g., "M37")
  roundTitle: string; // "Round of 16", "Quarter-Final", etc.
  
  team1SlotKey: string; // e.g., "Winner Group C", "Winner M37"
  team2SlotKey: string; // e.g., "Best 3rd (BEL History)", "Winner M38"
  
  team1?: TeamData | null; // Actual simulated team object
  team2?: TeamData | null; // Actual simulated team object

  team1Key?: string; // Actual simulated team key
  team2Key?: string; // Actual simulated team key
  
  score?: string; // If match played "2-1"
  penalties?: string; // If applicable "BRA 3-2 ITA"
  winnerKey?: string | null; // Key of the winning team if match played

  isUserTeam1?: boolean;
  isUserTeam2?: boolean;
}

export interface KnockoutRoundBracket {
  roundName: string; // "Round of 16", "Quarter-Finals", etc.
  matches: BracketMatchup[];
}

export interface FullKnockoutBracket {
  rounds: KnockoutRoundBracket[];
}

export interface PenaltyKickEventToShow {
  teamName: string;
  outcome: 'SCORED' | 'MISSED';
  currentScoreDisplay: string; // e.g., "1-0", "1-1"
  kickNumber?: number; // Optional: 1st, 2nd kick etc.
}

export interface SimulatedPenaltyKick {
    teamKey: string;
    teamName: string;
    outcome: 'SCORED' | 'MISSED';
}
