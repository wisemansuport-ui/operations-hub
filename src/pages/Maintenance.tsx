import { DataTable, Column } from "@/components/spreadsheet/DataTable";

const columns: Column[] = [
  { key: "ordem", label: "OS", width: "90px" },
  { key: "equipamento", label: "Equipamento" },
  { key: "tipo", label: "Tipo", type: "select", options: ["Preventiva", "Corretiva", "Preditiva"] },
  { key: "responsavel", label: "Responsável" },
  { key: "dataAgendada", label: "Agendada" },
  { key: "status", label: "Status", type: "status", options: ["Pendente", "Em andamento", "Concluído"] },
];

const data = [
  { id: "1", ordem: "OS-101", equipamento: "CNC Haas VF-2", tipo: "Preventiva", responsavel: "Carlos Silva", dataAgendada: "2026-04-18", status: "Pendente" },
  { id: "2", ordem: "OS-102", equipamento: "Torno Romi", tipo: "Corretiva", responsavel: "Pedro Santos", dataAgendada: "2026-04-16", status: "Em andamento" },
  { id: "3", ordem: "OS-103", equipamento: "Compressor Atlas", tipo: "Preditiva", responsavel: "João Lima", dataAgendada: "2026-04-20", status: "Pendente" },
];

const Maintenance = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Gerencie ordens de serviço e manutenção preventiva</p>
    </div>
    <DataTable columns={columns} data={data} title="Ordens de Serviço" subtitle="Manutenção preventiva e corretiva" />
  </div>
);

export default Maintenance;
