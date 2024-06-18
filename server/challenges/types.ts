export type ChallengeType = 'dynamic' | 'ranked'

export interface Points {
  min: number;
  max: number;
}

export interface File {
  name: string;
  url: string;
}

export interface CleanedChallenge {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  files: File[];
  points: Points;
  sortWeight?: number;
  type: ChallengeType;
  rankedMetadata?: RankedMetadata;
}

export interface RankedMetadata {
  maxScore: number; /* The best user score */
  minScore: number; /* The minimum user score */
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  files: File[];
  points: Points;
  flag: string;
  tiebreakEligible: boolean;
  sortWeight?: number;
  type: ChallengeType;
  rankedMetadata?: RankedMetadata;
}