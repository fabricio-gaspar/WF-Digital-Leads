import { createFileRoute } from "@tanstack/react-router";
import { CompanySettingsPanel } from "@/components/CompanySettingsPanel";

export const Route = createFileRoute("/_authenticated/empresa")({
  component: Empresa,
});

function Empresa() {
  return <CompanySettingsPanel />;
}
