import { DataTable, Column } from "@/components/spreadsheet/DataTable";

const columns: Column[] = [
  { key: "inspecao", label: "Inspeção", width: "100px" },
  { key: "produto", label: "Produto" },
  { key: "lote", label: "Lote" },
  { key: "inspetor", label: "Inspetor" },
  { key: "data", label: "Data" },
  { key: "conformidade", label: "Conformidade", type: "number", width: "100px" },
  { key: "status", label: "Resultado", type: "status", options: ["Aprovado", "Reprovado", "Pendente"] },
];

const statusColors: Record<string, string> = { Aprovado: "bg-success/15 text-success", Reprovado: "bg-destructive/15 text-destructive", Pendente: "bg-warning/15 text-warning" };

const data = [
  { id: "1", inspecao: "QC-041", produto: "Peça A", lote: "L-2026-04-A", inspetor: "Dr. Silva", data: "2026-04-15", conformidade: 98.5, status: "Aprovado" },
  { id: "2", inspecao: "QC-042", produto: "Componente B", lote: "L-2026-04-B", inspetor: "Dra. Costa", data: "2026-04-15", conformidade: 87.2, status: "Reprovado" },
  { id: "3", inspecao: "QC-043", produto: "Montagem C", lote: "L-2026-04-C", inspetor: "Dr. Santos", data: "2026-04-16", conformidade: 0, status: "Pendente" },
];

const Quality = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Controle de Qualidade</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Registre inspeções e acompanhe conformidade</p>
    </div>
    <DataTable columns={columns} data={data} title="Inspeções de Qualidade" subtitle="Taxa de conformidade em %" />
  </div>
);

export default Quality;
