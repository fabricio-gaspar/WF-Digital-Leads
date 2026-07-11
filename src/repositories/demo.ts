// Repositories in-memory (DemoDataProvider). Contratos permitem trocar por
// implementação real no futuro sem alterar telas.
import type {
  Activity,
  ChannelAccount,
  Company,
  Contact,
  Conversation,
  Lead,
  LeadStageId,
  Message,
  MessageTemplate,
  Notification,
  ProspectingResult,
  Queue,
  Service,
  Task,
  Team,
  User,
} from "@/domain/types";
import * as seed from "@/domain/seed";

type Listener = () => void;

class Store<T extends { id: string }> {
  data: T[];
  private listeners = new Set<Listener>();
  constructor(initial: T[]) {
    this.data = [...initial];
  }
  list(): T[] {
    return [...this.data];
  }
  get(id: string): T | undefined {
    return this.data.find((r) => r.id === id);
  }
  upsert(row: T) {
    const i = this.data.findIndex((r) => r.id === row.id);
    if (i >= 0) this.data[i] = row;
    else this.data.unshift(row);
    this.emit();
  }
  remove(id: string) {
    this.data = this.data.filter((r) => r.id !== id);
    this.emit();
  }
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  private emit() {
    this.listeners.forEach((l) => l());
  }
}

// Stores globais para o modo demo
export const stores = {
  users: new Store<User>(seed.users),
  teams: new Store<Team>(seed.teams),
  queues: new Store<Queue>(seed.queues),
  companies: new Store<Company>(seed.companies),
  contacts: new Store<Contact>(seed.contacts),
  leads: new Store<Lead>(seed.leads),
  tasks: new Store<Task>(seed.tasks),
  activities: new Store<Activity>(seed.activities),
  conversations: new Store<Conversation>(seed.conversations),
  messages: new Store<Message>(seed.messages),
  services: new Store<Service>(seed.services),
  channels: new Store<ChannelAccount>(seed.channelAccounts),
  prospectingResults: new Store<ProspectingResult>(seed.prospectingResults),
  notifications: new Store<Notification>(seed.notifications),
  templates: new Store<MessageTemplate>(seed.templates),
};

export function nowIso() {
  return new Date().toISOString();
}

export function generateId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Utilitário: recalcula updatedAt + registra atividade
export function pushActivity(a: Omit<Activity, "id" | "createdAt"> & { createdAt?: string }) {
  stores.activities.upsert({
    id: generateId("a"),
    createdAt: nowIso(),
    ...a,
  } as Activity);
}

export function updateLeadStage(
  leadId: string,
  newStage: LeadStageId,
  actorId: string,
  extras?: { closedValue?: number; lossReason?: string },
) {
  const l = stores.leads.get(leadId);
  if (!l) throw new Error("Lead não encontrado");
  const prev = l.stage;
  const updated: Lead = {
    ...l,
    stage: newStage,
    updatedAt: nowIso(),
    closedValue: newStage === "fechado" ? extras?.closedValue ?? l.closedValue : l.closedValue,
    closedAt: newStage === "fechado" ? nowIso() : l.closedAt,
    lossReason: newStage === "perdido" ? extras?.lossReason ?? l.lossReason : l.lossReason,
  };
  stores.leads.upsert(updated);
  pushActivity({
    leadId,
    authorId: actorId,
    type: newStage === "fechado" ? "fechamento" : "etapa_alterada",
    content: `${prev} → ${newStage}`,
  });
}
