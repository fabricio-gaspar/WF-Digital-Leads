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
          <div className="mx-auto max-w-[1500px] px-4 md:px-[26px] py-[22px] pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
