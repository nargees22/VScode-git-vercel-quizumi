export enum QuestionType {
  MCQ = 'MCQ',
  SURVEY = 'SURVEY',
  MATCH = 'MATCH',
  WORD_CLOUD = 'WORD_CLOUD',
}

export enum Clan {
  TITANS = 'Titans',
  DEFENDERS = 'Defenders',
}

export interface MatchPair {
  prompt: string;
  correctMatch: string;
}

export interface Question {
  id: string;
  // Fix: Add db_pk_id to Question interface to store the database primary key for update/delete operations
  db_pk_id?: number;
  text: string;
  options: string[];
  correctAnswerIndex?: number; // For MCQ
  matchPairs?: MatchPair[]; // For MATCH
  correctAnswers?: string[]; // For WORD_CLOUD
  timeLimit: number; // in seconds
  technology: string;
  skill: string;
  type: QuestionType;
  organizerName?: string;
  creationTime?: any; // To store Firestore server timestamp
}

export interface PlayerAnswer {
  questionId: string;
  // MCQ/Survey: number, MATCH: number[], WORD_CLOUD(old): string[], WORD_CLOUD(new): string
  answer: number | number[] | string[] | string; 
  timeTaken: number; // in seconds
  score: number;
  lifelineUsed?: 'fiftyFifty' | 'pointDoubler';
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  score: number;
  answers: PlayerAnswer[];
  clan?: Clan;
  lifelines: {
    pointDoubler: number;
  };
  correctStreak: number;
  fiftyFiftyUses?: number;
}

export enum GameState {
  LOBBY = 'LOBBY',
  CLAN_BATTLE_INTRO = 'CLAN_BATTLE_INTRO',
  CLAN_BATTLE_VS = 'CLAN_BATTLE_VS',
  QUESTION_INTRO = 'QUESTION_INTRO',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  QUESTION_RESULT = 'QUESTION_RESULT',
  LEADERBOARD = 'LEADERBOARD',
  FINISHED = 'FINISHED',
}

export interface QuizConfig {
    showLiveResponseCount: boolean;
    showQuestionToPlayers: boolean;
    clanBased: boolean;
    clanNames?: { [key in Clan]?: string };
    clanAssignment?: 'playerChoice' | 'autoBalance';
}

export interface Quiz {
  id:string;
  title: string;
  questions: Question[];
  currentQuestionIndex: number;
  gameState: GameState;
  questionStartTime: number | null;
  hostId: string;
  organizerName: string;
  startTime: any;
  endTime: any | null;
  config: QuizConfig;
  agendaId?: string;
  agendaName?: string;
  eventId?: string;
  isArchived?: boolean;
  participantCount?: number;
  isDraft?: boolean;
}