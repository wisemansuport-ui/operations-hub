import { DataTable, Column } from "@/components/spreadsheet/DataTable";

const columns: Column[] = [
  { key: "ordem", label: "Ordem", width: "100px" },
  { key: "produto", label: "Produto" },
  { key: "quantidade", label: "Qtd", type: "number", width: "80px" },
  { key: "responsavel", label: "Responsável" },
  { key: "inicio", label: "Início" },
  { key: "prazo", label: "Prazo" },
  { key: "status", label: "Status", type: "status", options: ["Pendente", "Em andamento", "Concluído", "Atrasado"] },
];

const data = [
  { id: "1", ordem: "OP-001", produto: "Peça A - Usinagem", quantidade: 500, responsavel: "Carlos Silva", inicio: "2026-04-10", prazo: "2026-04-20", status: "Em andamento" },
  { id: "2", ordem: "OP-002", produto: "Componente B", quantidade: 1200, responsavel: "Ana Costa", inicio: "2026-04-12", prazo: "2026-04-18", status: "Concluído" },
  { id: "3", ordem: "OP-003", produto: "Montagem C", quantidade: 300, responsavel: "Pedro Santos", inicio: "2026-04-15", prazo: "2026-04-25", status: "Pendente" },
  { id: "4", ordem: "OP-004", produto: "Peça D - Corte", quantidade: 800, responsavel: "Maria Oliveira", inicio: "2026-04-08", prazo: "2026-04-14", status: "Atrasado" },
  { id: "5", ordem: "OP-005", produto: "Embalagem E", quantidade: 2000, responsavel: "João Lima", inicio: "2026-04-16", prazo: "2026-04-22", status: "Pendente" },
];

const Production = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Cronograma de Produção</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Gerencie ordens de produção e acompanhe prazos</p>
    </div>
    <DataTable columns={columns} data={data} title="Ordens de Produção" subtitle="Clique nas células para editar inline" />
  </div>
);

export default Production;
