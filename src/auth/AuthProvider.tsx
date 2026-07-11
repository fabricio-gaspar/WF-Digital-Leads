// AuthProvider demonstrativo. Não conecta backend. Pronto para trocar a
// implementação por Supabase/JWT preservando a interface.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { stores } from "@/repositories/demo";
import { PERMISSIONS } from "@/domain/constants";
import type { User, UserRole } from "@/domain/types";

interface Session {
  user: User;
  issuedAt: number;
  expiresAt: number; // 8h
}

interface AuthState {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasPermission: (perm: string) => boolean;
  // Somente para demo: switch rápido de perfil
  demoSwitchTo: (userId: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY = "wf-crm-demo-session";
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

// Senha demo (todos os usuários): "demo123". Sem enumeração, sem revelação.
const DEMO_PASSWORD = "demo123";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (s.expiresAt < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

function saveSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else sessionStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(loadSession());
    setLoading(false);
  }, []);

  // Timeout de inatividade / expiração de sessão
  useEffect(() => {
    if (!session) return;
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) {
      setSession(null);
      saveSession(null);
      return;
    }
    const t = setTimeout(() => {
      setSession(null);
      saveSession(null);
    }, remaining);
    return () => clearTimeout(t);
  }, [session]);

  const signIn = useCallback<AuthState["signIn"]>(async (email, password) => {
    await new Promise((r) => setTimeout(r, 400));
    const user = stores.users.list().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    // Mensagem genérica — sem enumeração de e-mail
    if (!user || !user.active || password !== DEMO_PASSWORD) {
      return { ok: false, error: "Credenciais inválidas. Verifique e tente novamente." };
    }
    const now = Date.now();
    const s: Session = { user, issuedAt: now, expiresAt: now + EIGHT_HOURS };
    setSession(s);
    saveSession(s);
    return { ok: true };
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    saveSession(null);
  }, []);

  const demoSwitchTo = useCallback((userId: string) => {
    const u = stores.users.get(userId);
    if (!u) return;
    const now = Date.now();
    const s: Session = { user: u, issuedAt: now, expiresAt: now + EIGHT_HOURS };
    setSession(s);
    saveSession(s);
  }, []);

  const state = useMemo<AuthState>(() => {
    const role = session?.user.role;
    const perms = role ? PERMISSIONS[role] : new Set<string>();
    return {
      session,
      loading,
      signIn,
      signOut,
      demoSwitchTo,
      hasRole: (r) => role === r,
      hasAnyRole: (rs) => (role ? rs.includes(role) : false),
      hasPermission: (p) => perms.has(p),
    };
  }, [session, loading, signIn, signOut, demoSwitchTo]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
