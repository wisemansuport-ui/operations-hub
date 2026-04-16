import { DataTable, Column } from "@/components/spreadsheet/DataTable";

const columns: Column[] = [
  { key: "titulo", label: "Tarefa" },
  { key: "prioridade", label: "Prioridade", type: "select", options: ["Alta", "Média", "Baixa"] },
  { key: "atribuido", label: "Atribuído a" },
  { key: "prazo", label: "Prazo" },
  { key: "status", label: "Status", type: "status", options: ["Pendente", "Em andamento", "Concluído"] },
];

const data = [
  { id: "1", titulo: "Calibrar máquina CNC #3", prioridade: "Alta", atribuido: "Carlos Silva", prazo: "2026-04-17", status: "Em andamento" },
  { id: "2", titulo: "Revisar relatório de qualidade", prioridade: "Média", atribuido: "Ana Costa", prazo: "2026-04-18", status: "Pendente" },
  { id: "3", titulo: "Atualizar inventário setor B", prioridade: "Baixa", atribuido: "Pedro Santos", prazo: "2026-04-20", status: "Pendente" },
  { id: "4", titulo: "Treinamento novos operadores", prioridade: "Alta", atribuido: "Maria Oliveira", prazo: "2026-04-16", status: "Concluído" },
  { id: "5", titulo: "Inspeção de segurança mensal", prioridade: "Alta", atribuido: "João Lima", prazo: "2026-04-19", status: "Em andamento" },
];

const Tasks = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Gestão de Tarefas</h1>
      <p className="text-sm text-muted-foreground mt-0.5">Acompanhe e gerencie tarefas da equipe</p>
    </div>
    <DataTable columns={columns} data={data} title="Tarefas" subtitle="Arraste colunas para reorganizar" />
  </div>
);

export default Tasks;
