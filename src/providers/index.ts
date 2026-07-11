// Registro de providers ativos.
// Hoje: apenas provider "demo" para todos. Trocar aqui quando Supabase/Z-API/Apify/Vibe entrarem.
import { stores } from "@/repositories/demo";
import type { AIProvider, AuthProvider, DataProvider, MessagingProvider, ProspectingProvider, ProviderRegistry } from "./interfaces";

const demoAuth: AuthProvider = {
  id: "demo",
  async signIn() { throw new Error("Use AuthProvider React para o modo demo."); },
  async signOut() {},
  currentUser: () => null,
};

const demoData: DataProvider = {
  id: "demo",
  async listLeads() { return stores.leads.list(); },
  async getLead(id) { return stores.leads.get(id); },
  async updateLead(id, patch) {
    const l = stores.leads.get(id);
    if (!l) return;
    stores.leads.upsert({ ...l, ...patch, updatedAt: new Date().toISOString() });
  },
};

const demoWhatsapp: MessagingProvider = {
  id: "demo-whatsapp",
  channel: "whatsapp",
  async send(conversationId, content) {
    return { id: `m-${Date.now()}`, conversationId, direction: "out", content, status: "sent", createdAt: new Date().toISOString() };
  },
  isConnected: () => true,
};

const demoProspectingApify: ProspectingProvider = {
  id: "apify-demo", label: "Apify (demo)",
  async search() { return stores.prospectingResults.list(); },
  isAvailable: () => true,
};

const demoProspectingVibe: ProspectingProvider = {
  id: "vibe-demo", label: "Vibe (demo)",
  async search() { return stores.prospectingResults.list().slice(0, 5); },
  isAvailable: () => false, // aguardando integração backend
};

const demoAI: AIProvider = {
  id: "demo-ai",
  async suggestReply() { return "Olá! Consigo enviar hoje um material sobre nosso serviço e agendar uma call de 20 minutos. Funciona para você?"; },
  async scoreLeadNarrative() { return { score: 72, reasoning: "Fit ICP alto, decisor identificado, prazo aberto." }; },
  isAvailable: () => true,
};

export const providers: ProviderRegistry = {
  auth: demoAuth,
  data: demoData,
  messaging: { whatsapp: demoWhatsapp },
  prospecting: { apify: demoProspectingApify, vibe: demoProspectingVibe },
  ai: demoAI,
};

export function providerStatus() {
  return [
    { key: "auth", label: "Autenticação", provider: providers.auth.id, ready: true },
    { key: "data", label: "Dados (Leads/Empresas)", provider: providers.data.id, ready: true },
    { key: "whatsapp", label: "WhatsApp (Z-API)", provider: providers.messaging.whatsapp.id, ready: providers.messaging.whatsapp.isConnected() },
    { key: "apify", label: "Prospecção Apify", provider: providers.prospecting.apify.id, ready: providers.prospecting.apify.isAvailable() },
    { key: "vibe", label: "Prospecção Vibe", provider: providers.prospecting.vibe.id, ready: providers.prospecting.vibe.isAvailable() },
    { key: "ai", label: "Assistente IA", provider: providers.ai?.id ?? "—", ready: providers.ai?.isAvailable() ?? false },
  ];
}
