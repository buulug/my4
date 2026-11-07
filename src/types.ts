export type PersonaMode = 'omni' | 'philosophical' | 'code_architect' | 'life_coach' | 'explain_like_5';

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: GroundingSource[];
  timestamp: number;
  mode?: PersonaMode;
  isStreaming?: boolean;
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  mode: PersonaMode;
}

export interface PersonaConfig {
  id: PersonaMode;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  pillColor: string;
}
