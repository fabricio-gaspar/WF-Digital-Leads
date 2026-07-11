// Interfaces de providers plugáveis — WF Digital CRM
// O front conversa SEMPRE com estas interfaces. Trocar demo por Supabase/Z-API/Apify/Vibe
// se resume a implementar cada interface e registrar em `providers/index.ts`.
import type { Lead, Message, ProspectingResult, User } from "@/domain/types";

export interface AuthProvider {
  readonly id: string;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  currentUser(): User | null;
}

export interface DataProvider {
  readonly id: string;
  listLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  updateLead(id: string, patch: Partial<Lead>): Promise<void>;
}

export interface MessagingProvider {
  readonly id: string;
  readonly channel: "whatsapp" | "email" | "telefone";
  send(conversationId: string, content: string, meta?: Record<string, unknown>): Promise<Message>;
  isConnected(): boolean;
}

export interface ProspectingProvider {
  readonly id: string;
  readonly label: string;
  search(params: Record<string, unknown>): Promise<ProspectingResult[]>;
  isAvailable(): boolean;
}

export interface AIProvider {
  readonly id: string;
  suggestReply(context: { conversationId: string; lastMessages: string[] }): Promise<string>;
  scoreLeadNarrative(context: { leadId: string; signals: string[] }): Promise<{ score: number; reasoning: string }>;
  isAvailable(): boolean;
}

export interface ProviderRegistry {
  auth: AuthProvider;
  data: DataProvider;
  messaging: Record<string, MessagingProvider>;
  prospecting: Record<string, ProspectingProvider>;
  ai: AIProvider | null;
}
