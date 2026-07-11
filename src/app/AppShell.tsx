import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useDemoSync } from "@/repositories/hooks";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ title, subtitle, actions, children }: Props) {
  useDemoSync();
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden h-[52px] shrink-0" aria-hidden />
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-soft/60 border border-primary/20 px-3 py-1 text-[11px] font-medium text-primary-strong">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Ambiente de demonstração — dados fictícios
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
