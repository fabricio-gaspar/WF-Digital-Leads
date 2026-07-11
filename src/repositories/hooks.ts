// Hooks TanStack Query sobre os stores in-memory.
// Componentes SEMPRE consomem via hooks — nunca importam seed direto.
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { stores, generateId, nowIso, pushActivity, updateLeadStage } from "./demo";
import type {
  Activity, Company, Contact, Conversation, Lead, LeadStageId, Message,
  Notification, ProspectingResult, Queue, Service, Task, Team, User,
  MessageTemplate, ChannelAccount,
} from "@/domain/types";

// Assina mudanças de todos os stores e invalida cache
export function useDemoSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubs = Object.entries(stores).map(([key, s]) =>
      s.subscribe(() => qc.invalidateQueries({ queryKey: [key] })),
    );
    return () => unsubs.forEach((u) => u());
  }, [qc]);
}

const q = <T,>(key: string, fn: () => T) => useQuery({ queryKey: [key], queryFn: async () => fn() });

export const useUsers = () => q<User[]>("users", () => stores.users.list());
export const useTeams = () => q<Team[]>("teams", () => stores.teams.list());
export const useQueues = () => q<Queue[]>("queues", () => stores.queues.list());
export const useLeads = () => q<Lead[]>("leads", () => stores.leads.list());
export const useLead = (id?: string) => useQuery({ queryKey: ["leads", id], queryFn: async () => stores.leads.get(id!) , enabled: !!id });
export const useCompanies = () => q<Company[]>("companies", () => stores.companies.list());
export const useCompany = (id?: string) => useQuery({ queryKey: ["companies", id], queryFn: async () => stores.companies.get(id!), enabled: !!id });
export const useContacts = () => q<Contact[]>("contacts", () => stores.contacts.list());
export const useContact = (id?: string) => useQuery({ queryKey: ["contacts", id], queryFn: async () => stores.contacts.get(id!), enabled: !!id });
export const useTasks = () => q<Task[]>("tasks", () => stores.tasks.list());
export const useActivities = () => q<Activity[]>("activities", () => stores.activities.list());
export const useConversations = () => q<Conversation[]>("conversations", () => stores.conversations.list());
export const useConversation = (id?: string) => useQuery({ queryKey: ["conversations", id], queryFn: async () => stores.conversations.get(id!), enabled: !!id });
export const useMessages = (conversationId?: string) =>
  useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => stores.messages.list().filter((m) => m.conversationId === conversationId),
    enabled: !!conversationId,
  });
export const useServices = () => q<Service[]>("services", () => stores.services.list());
export const useChannels = () => q<ChannelAccount[]>("channels", () => stores.channels.list());
export const useProspectingResults = () => q<ProspectingResult[]>("prospectingResults", () => stores.prospectingResults.list());
export const useNotifications = () => q<Notification[]>("notifications", () => stores.notifications.list());
export const useTemplates = () => q<MessageTemplate[]>("templates", () => stores.templates.list());

// Mutations principais
export function useMoveLeadStage() {
  return useMutation({
    mutationFn: async (vars: { leadId: string; stage: LeadStageId; actorId: string; closedValue?: number; lossReason?: string }) => {
      updateLeadStage(vars.leadId, vars.stage, vars.actorId, vars);
    },
  });
}

export function useAddNote() {
  return useMutation({
    mutationFn: async (vars: { leadId: string; authorId: string; content: string }) => {
      pushActivity({ leadId: vars.leadId, authorId: vars.authorId, type: "nota", content: vars.content });
    },
  });
}

export function useToggleTask() {
  return useMutation({
    mutationFn: async (id: string) => {
      const t = stores.tasks.get(id);
      if (!t) return;
      stores.tasks.upsert({
        ...t,
        status: t.status === "aberta" ? "concluida" : "aberta",
        completedAt: t.status === "aberta" ? nowIso() : undefined,
      });
    },
  });
}

export function useAssignConversation() {
  return useMutation({
    mutationFn: async (vars: { conversationId: string; userId: string; actorId: string; reason?: string }) => {
      const c = stores.conversations.get(vars.conversationId);
      if (!c) throw new Error("Conversa não encontrada");
      if (c.currentOwnerId === vars.userId) return;
      const now = nowIso();
      const assignments = [...c.assignments];
      // Encerra atribuição anterior
      const last = assignments[assignments.length - 1];
      if (last && !last.releasedAt) last.releasedAt = now;
      assignments.push({ id: generateId("asg"), userId: vars.userId, at: now, by: vars.actorId, reason: vars.reason });
      stores.conversations.upsert({ ...c, currentOwnerId: vars.userId, assignments });
      pushActivity({
        conversationId: c.id,
        leadId: c.primaryLeadId,
        authorId: vars.actorId,
        type: "atribuicao",
        content: `Conversa atribuída para ${vars.userId}${vars.reason ? ` — ${vars.reason}` : ""}`,
      });
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (vars: { conversationId: string; authorId: string; content: string; internal?: boolean }) => {
      const c = stores.conversations.get(vars.conversationId);
      if (!c) throw new Error("Conversa não encontrada");
      const msg: Message = {
        id: generateId("m"),
        conversationId: c.id,
        direction: vars.internal ? "system" : "out",
        authorId: vars.authorId,
        content: vars.content,
        internal: vars.internal,
        status: vars.internal ? undefined : "sent",
        createdAt: nowIso(),
      };
      stores.messages.upsert(msg);
      stores.conversations.upsert({ ...c, lastMessageAt: msg.createdAt, unreadCount: 0 });
      if (!vars.internal) {
        pushActivity({
          conversationId: c.id,
          leadId: c.primaryLeadId,
          authorId: vars.authorId,
          type: "mensagem_enviada",
          content: vars.content.slice(0, 120),
        });
      }
    },
  });
}
